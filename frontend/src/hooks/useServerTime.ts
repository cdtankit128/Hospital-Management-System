import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { apiUrl } from '../api/config'

const SERVER_TIME_URL = apiUrl('/api/notifications/server-time')

/**
 * Hook that syncs with server time.
 * Fetches server time once on mount, calculates the offset between client and server,
 * then ticks every second using that offset so all displayed dates/times are consistent.
 */
export function useServerTime() {
  const [serverNow, setServerNow] = useState<Date>(new Date())
  const offsetRef = useRef<number>(0) // server - client in ms
  const [synced, setSynced] = useState(false)

  const syncTime = useCallback(async () => {
    try {
      const clientBefore = Date.now()
      const res = await axios.get(SERVER_TIME_URL)
      const clientAfter = Date.now()
      const roundTrip = clientAfter - clientBefore
      const serverTimestamp: number = res.data.timestamp
      // Estimate server time at midpoint of the request
      const estimatedServerNow = serverTimestamp + roundTrip / 2
      offsetRef.current = estimatedServerNow - clientAfter
      setSynced(true)
    } catch (err) {
      console.warn('Failed to sync server time, using local time:', err)
      offsetRef.current = 0
      setSynced(true)
    }
  }, [])

  useEffect(() => {
    syncTime()
    // Re-sync every 5 minutes
    const resyncInterval = setInterval(syncTime, 5 * 60 * 1000)
    return () => clearInterval(resyncInterval)
  }, [syncTime])

  // Tick every second
  useEffect(() => {
    const ticker = setInterval(() => {
      setServerNow(new Date(Date.now() + offsetRef.current))
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  /** Format as "Feb 20, 2026" */
  const formatDate = useCallback((date?: Date | string) => {
    const d = date ? new Date(date) : serverNow
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [serverNow])

  /** Format as "02:30 PM" */
  const formatTime = useCallback((date?: Date | string) => {
    const d = date ? new Date(date) : serverNow
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }, [serverNow])

  /** Format as "Feb 20, 2026 02:30 PM" */
  const formatDateTime = useCallback((date?: Date | string) => {
    const d = date ? new Date(date) : serverNow
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }, [serverNow])

  /** Get today's date string in YYYY-MM-DD format (server time) */
  const todayStr = useCallback(() => {
    const d = new Date(Date.now() + offsetRef.current)
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  }, [])

  return {
    serverNow,
    synced,
    formatDate,
    formatTime,
    formatDateTime,
    todayStr,
    offset: offsetRef.current,
  }
}
