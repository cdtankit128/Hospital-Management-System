import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import api from '../api/api'
import axios from 'axios'
import { apiUrl, BACKEND_URL } from '../api/config'

// Build WebSocket URL: if VITE_API_BASE_URL is set (Ngrok), derive WS URL from it
const WS_URL = BACKEND_URL
  ? `${BACKEND_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')}/ws`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
const BASE_NOTIF_URL = apiUrl('/api/notifications')

export interface NotificationItem {
  id: number
  recipientUsername: string
  recipientRole: string
  title: string
  message: string
  type: string
  read: boolean
  referenceId: number | null
  createdAt: string
}

interface UseNotificationsOptions {
  /** Username / identifier for the current user */
  username: string
  /** Role: DOCTOR, PATIENT, RECEPTIONIST */
  role: string
  /** For patients who don't have JWT — use name-based endpoints */
  useNameBased?: boolean
}

/**
 * Hook providing real-time notifications via WebSocket + REST fallback.
 * - Connects via STOMP over SockJS.
 * - Uses localStorage to track which notification IDs have been "seen" (popup shown).
 * - Only new unseen notifications trigger the popup.
 */
export function useNotifications({ username, role: _role, useNameBased = false }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [newPopupNotifs, setNewPopupNotifs] = useState<NotificationItem[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const seenIdsRef = useRef<Set<number>>(new Set())

  // Storage key for seen notification IDs (per user)
  const storageKey = `hms_seen_notifs_${username}`

  // Load seen IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        seenIdsRef.current = new Set(JSON.parse(stored))
      }
    } catch {
      seenIdsRef.current = new Set()
    }
  }, [storageKey])

  // Save seen IDs to localStorage
  const persistSeenIds = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...seenIdsRef.current]))
    } catch { /* ignore */ }
  }, [storageKey])

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!username) return
    // Skip authenticated calls if no JWT token available
    if (!useNameBased && !localStorage.getItem('token')) return
    try {
      let res
      if (useNameBased) {
        res = await axios.get(`${BASE_NOTIF_URL}/unread-by-name`, { params: { name: username } })
      } else {
        res = await api.get('/notifications/unread')
      }
      const fetched: NotificationItem[] = res.data || []
      setNotifications(fetched)
      setUnreadCount(fetched.length)

      // Determine which are truly new (never seen a popup for them)
      const brandNew = fetched.filter(n => !seenIdsRef.current.has(n.id))
      if (brandNew.length > 0) {
        setNewPopupNotifs(brandNew)
        setShowPopup(true)
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err)
    }
  }, [username, useNameBased])

  // Mark all current notifications as seen (popup shown) — does NOT mark them as read on server
  const dismissPopup = useCallback(() => {
    setShowPopup(false)
    notifications.forEach(n => seenIdsRef.current.add(n.id))
    persistSeenIds()
    setNewPopupNotifs([])
  }, [notifications, persistSeenIds])

  // Mark all as read on the server + dismiss popup
  const markAllRead = useCallback(async () => {
    try {
      if (useNameBased) {
        await axios.put(`${BASE_NOTIF_URL}/read-all-by-name`, null, { params: { name: username } })
      } else {
        await api.put('/notifications/read-all')
      }
    } catch { /* ignore */ }
    // Mark all as seen locally
    notifications.forEach(n => seenIdsRef.current.add(n.id))
    persistSeenIds()
    setNotifications([])
    setUnreadCount(0)
    setShowPopup(false)
    setNewPopupNotifs([])
  }, [username, useNameBased, notifications, persistSeenIds])

  // Mark a single notification as read
  const markOneRead = useCallback(async (id: number) => {
    try {
      if (useNameBased) {
        await axios.put(`${BASE_NOTIF_URL}/${id}/read`)
      } else {
        await api.put(`/notifications/${id}/read`)
      }
    } catch { /* ignore */ }
    seenIdsRef.current.add(id)
    persistSeenIds()
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [useNameBased, persistSeenIds])

  // Connect WebSocket
  useEffect(() => {
    if (!username) return

    // Initial fetch
    fetchNotifications()

    // Polling fallback every 20s (in case WS disconnects)
    const pollInterval = setInterval(fetchNotifications, 20000)

    // WebSocket connection
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log('[WS] Connected for notifications')
        // Subscribe to personal topic
        client.subscribe(`/topic/notifications/${username}`, (message) => {
          try {
            const notif: NotificationItem = JSON.parse(message.body)
            setNotifications(prev => {
              // Avoid duplicates
              if (prev.some(n => n.id === notif.id)) return prev
              return [notif, ...prev]
            })
            setUnreadCount(prev => prev + 1)

            // Show popup only if this notification ID has never been seen
            if (!seenIdsRef.current.has(notif.id)) {
              setNewPopupNotifs(prev => [...prev, notif])
              setShowPopup(true)
            }
          } catch (err) {
            console.warn('[WS] Failed to parse notification:', err)
          }
        })
      },
      onStompError: (frame) => {
        console.warn('[WS] STOMP error:', frame.headers['message'])
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected')
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      clearInterval(pollInterval)
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
    }
  }, [username, fetchNotifications])

  return {
    /** All unread notifications */
    notifications,
    /** Count of unread notifications */
    unreadCount,
    /** Notifications that should trigger a popup (never seen before) */
    newPopupNotifs,
    /** Whether to show the popup */
    showPopup,
    /** Dismiss the popup (marks as seen locally, but not read on server) */
    dismissPopup,
    /** Mark all as read on server + dismiss */
    markAllRead,
    /** Mark a single message as read */
    markOneRead,
    /** Re-fetch from server */
    refresh: fetchNotifications,
  }
}
