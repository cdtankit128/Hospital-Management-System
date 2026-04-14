import React, { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  IconButton,
  Popover,
  Skeleton,
} from '@mui/material'
import { keyframes } from '@mui/system'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LogoutIcon from '@mui/icons-material/Logout'
import SavePatientRecordForm from '../components/SavePatientRecordForm'
import { doctorAPI } from '../services/doctorAPI'
import { appointmentDoctorAPI, AppointmentResponse } from '../services/appointmentAPI'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderSharedIcon from '@mui/icons-material/FolderShared'
import GroupIcon from '@mui/icons-material/Group'
import EventNoteIcon from '@mui/icons-material/EventNote'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import SaveIcon from '@mui/icons-material/Save'
import EmailIcon from '@mui/icons-material/Email'
import ScienceIcon from '@mui/icons-material/Science'
import MedicationIcon from '@mui/icons-material/Medication'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import SendIcon from '@mui/icons-material/Send'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import NotificationsIcon from '@mui/icons-material/Notifications'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import ScheduleIcon from '@mui/icons-material/Schedule'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { emailAPI } from '../services/emailAPI'
import axios from 'axios'
import { apiUrl, BACKEND_URL } from '../api/config'
import { useNotifications } from '../hooks/useNotifications'
import { useServerTime } from '../hooks/useServerTime'

// --- Premium Micro-Animations ---
const cardFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
`

const cardEntrance = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const tabFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const popupSlideIn = keyframes`
  0% { opacity: 0; transform: translateY(-40px) scale(0.85); }
  60% { opacity: 1; transform: translateY(8px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

const popupPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,191,166,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(0,191,166,0); }
`

const popupIconBounce = keyframes`
  0% { transform: scale(0) rotate(-30deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
`

const popupQueueGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px rgba(0,191,166,0.3); }
  50% { text-shadow: 0 0 16px rgba(0,191,166,0.6); }
`

const greetingSlideIn = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
  70% { transform: translate(-50%, -50%) scale(0.97); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`

const greetingFadeOut = keyframes`
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
`

const backdropFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`

const backdropFadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`

const wavingHand = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`

const shimmerGlow = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

const floatUpDown = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`

function getTimeGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { greeting: 'Good Morning', emoji: '☀️' }
  if (hour >= 12 && hour < 17) return { greeting: 'Good Afternoon', emoji: '🌤️' }
  if (hour >= 17 && hour < 21) return { greeting: 'Good Evening', emoji: '🌆' }
  return { greeting: 'Good Night', emoji: '🌙' }
}

const TableSkeleton = ({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) => (
  <Box sx={{ p: 2 }}>
    {/* Header shimmer */}
    <Skeleton
      variant="rectangular"
      height={42}
      sx={{
        borderRadius: '8px 8px 0 0',
        mb: 0.5,
        bgcolor: 'rgba(21,101,192,0.1)',
        backgroundImage: 'linear-gradient(90deg, rgba(21,101,192,0.1) 25%, rgba(21,101,192,0.18) 50%, rgba(21,101,192,0.1) 75%)',
        backgroundSize: '200% 100%',
        animation: `${shimmer} 1.8s ease-in-out infinite`,
      }}
    />
    {Array.from({ length: rows }).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', gap: 1, py: 1.2, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton
            key={j}
            variant="text"
            sx={{
              flex: j === 0 ? 0.5 : 1,
              height: 18,
              borderRadius: 1,
              bgcolor: 'rgba(21,101,192,0.05)',
              backgroundImage: 'linear-gradient(90deg, rgba(21,101,192,0.05) 25%, rgba(21,101,192,0.1) 50%, rgba(21,101,192,0.05) 75%)',
              backgroundSize: '200% 100%',
              animation: `${shimmer} 1.8s ease-in-out infinite`,
              animationDelay: `${j * 0.1}s`,
            }}
          />
        ))}
      </Box>
    ))}
  </Box>
)

// Greeting cloud component shown on doctor login
const GreetingCloud = ({ fullName, username, greetingDismissing, onDismiss }: {
  fullName: string | null
  username: string | null
  greetingDismissing: boolean
  onDismiss: () => void
}) => {
  const { greeting, emoji } = getTimeGreeting()
  const doctorDisplayName = fullName || username || 'Doctor'
  return (
    <>
      {/* Backdrop overlay */}
      <Box
        onClick={onDismiss}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0, 20, 60, 0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9999,
          animation: greetingDismissing
            ? `${backdropFadeOut} 0.4s ease-in forwards`
            : `${backdropFadeIn} 0.4s ease-out forwards`,
        }}
      />

      {/* Centered greeting card */}
      <Box
        onClick={onDismiss}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 10000,
          animation: greetingDismissing
            ? `${greetingFadeOut} 0.4s ease-in forwards`
            : `${greetingSlideIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
          cursor: 'pointer',
        }}
      >
        <Paper
          elevation={24}
          sx={{
            px: { xs: 3, sm: 5 },
            py: { xs: 3, sm: 4 },
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 30%, #0277BD 60%, #00838F 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1.5,
            boxShadow: '0 24px 80px rgba(13, 71, 161, 0.5), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 120px rgba(0, 131, 143, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: { xs: 280, sm: 420 },
            maxWidth: { xs: '90vw', sm: 480 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.06) 0%, transparent 60%)',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Sparkle decorations */}
          {[{ top: '12%', left: '8%', delay: '0.3s', size: 8 }, { top: '18%', right: '12%', delay: '0.8s', size: 6 }, { bottom: '15%', left: '15%', delay: '1.2s', size: 5 }, { bottom: '20%', right: '8%', delay: '0.6s', size: 7 }].map((s, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                ...s,
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.6)',
                animation: `${sparkle} 2.5s ease-in-out ${s.delay} infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Waving hand emoji */}
          <Box
            sx={{
              fontSize: { xs: '3rem', sm: '3.5rem' },
              lineHeight: 1,
              animation: `${wavingHand} 1.5s ease-in-out 0.3s 2, ${floatUpDown} 3s ease-in-out 3.5s infinite`,
              display: 'inline-block',
              transformOrigin: '70% 70%',
              mb: 0.5,
            }}
          >
            👋
          </Box>

          {/* Time-based emoji */}
          <Box
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              lineHeight: 1,
              animation: `${floatUpDown} 2.5s ease-in-out 1s infinite`,
            }}
          >
            {emoji}
          </Box>

          {/* Greeting text */}
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.3rem', sm: '1.7rem' },
              lineHeight: 1.3,
              textShadow: '0 2px 8px rgba(0,0,0,0.25)',
              letterSpacing: '0.3px',
              mt: 0.5,
            }}
          >
            {greeting}, Dr. {doctorDisplayName}!
          </Typography>

          {/* Subtitle with shimmer */}
          <Typography
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              fontWeight: 500,
              mt: 0.5,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.7) 100%)',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${shimmerGlow} 3s linear infinite`,
            }}
          >
            Welcome to your AI-powered Medical Dashboard 🩺
          </Typography>

          {/* Dismiss hint */}
          <Typography
            sx={{
              fontSize: '0.7rem',
              opacity: 0.5,
              mt: 1.5,
              letterSpacing: '0.5px',
            }}
          >
            tap anywhere to dismiss
          </Typography>
        </Paper>
      </Box>
    </>
  )
}

interface TabPanelProps {
  children?: ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            pt: 3,
            animation: `${tabFadeIn} 0.35s ease-out`,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  )
}

const DoctorDashboard = () => {
  const [tabValue, setTabValue] = useState(0)
  const [appointmentOpen, setAppointmentOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    appointmentDate: '',
    time: '',
    reason: '',
  })
  const [prescriptionData, setPrescriptionData] = useState({
    patientId: '',
    diagnosis: '',
    medication: '',
    dosage: '',
    duration: '',
    instructions: '',
  })
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<any>(null)
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<any>(null)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [allAppointments, setAllAppointments] = useState<AppointmentResponse[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [myPatients, setMyPatients] = useState<any[]>([])
  const [myPatientsLoading, setMyPatientsLoading] = useState(false)

  // Expanded patient info in appointments tab
  const [expandedApptId, setExpandedApptId] = useState<number | null>(null)

  // Email state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailType, setEmailType] = useState<'lab-report' | 'medicine-reminder' | 'discharge-summary'>('lab-report')
  const [emailTo, setEmailTo] = useState('')
  const [emailPatientName, setEmailPatientName] = useState('')
  const [emailSnackbar, setEmailSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [emailSending, setEmailSending] = useState(false)
  const [labReportData, setLabReportData] = useState({ testCategory: '', remarks: '', followUpRequired: 'No', followUpDate: '', reportPdf: null as File | null })
  const [medicineData, setMedicineData] = useState({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const [dischargeData, setDischargeData] = useState({ diagnosis: '', treatment: '', admissionDate: '', dischargeDate: '', followUpDate: '', instructions: '' })

  // Avatar upload state
  const [avatarKey, setAvatarKey] = useState(() => Date.now())
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Notifications state
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null)

  // Approved queue & popup state
  const [approvedQueue, setApprovedQueue] = useState<AppointmentResponse[]>([])
  const [newApptPopupOpen, setNewApptPopupOpen] = useState(false)
  const [newApptData, setNewApptData] = useState<AppointmentResponse | null>(null)
  const prevApprovedIdsRef = useRef<Set<number>>(new Set())

  // Stat card filter state for Appointments tab
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'thisWeek' | 'todayQueue' | 'completed'>('all')

  // Auto greeting popup state — detect fresh login via URL ?welcome=1 param
  const [searchParams] = useSearchParams()
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingDismissing, setGreetingDismissing] = useState(false)

  const handleTabChange = (_event: any, newValue: number) => {
    setTabValue(newValue)
    // Reset appointment filter when navigating via tabs
    if (newValue === 3) setAppointmentFilter('all')
    // Fetch my patients when viewing the records tab
    if (newValue === 2) {
      fetchMyPatients()
    }
    // Fetch appointments when viewing appointments tab
    if (newValue === 3) {
      fetchAppointments()
    }
    // Fetch my patients when viewing email alerts tab
    if (newValue === 4) {
      fetchMyPatients()
    }
    // Fetch my patients when viewing dashboard tab
    if (newValue === 0) {
      fetchMyPatients()
    }
  }

  // Derived stats for cards
  const thisWeekAppointments = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return allAppointments.filter(a => {
      const d = new Date(a.appointmentDate + 'T00:00')
      return d >= startOfWeek && d < endOfWeek
    })
  }, [allAppointments])

  const completedAppointments = useMemo(() => {
    return allAppointments.filter(a => a.status === 'COMPLETED')
  }, [allAppointments])

  const filteredAppointments = useMemo(() => {
    switch (appointmentFilter) {
      case 'thisWeek': return thisWeekAppointments
      case 'completed': return completedAppointments
      case 'todayQueue': return allAppointments.filter(a => a.status === 'APPROVED')
      default: return allAppointments
    }
  }, [appointmentFilter, allAppointments, thisWeekAppointments, completedAppointments])

  const fetchMyPatients = async () => {
    if (!username) return
    try {
      setMyPatientsLoading(true)
      const data = await appointmentDoctorAPI.getMyPatientsByAppointments(username)
      setMyPatients(data || [])
    } catch (err) {
      console.error('Error fetching my patients:', err)
    } finally {
      setMyPatientsLoading(false)
    }
  }

  const fetchAppointments = async () => {
    if (!username) return
    setAppointmentsLoading(true)
    try {
      const all = await appointmentDoctorAPI.getMyAppointments(username)
      setAllAppointments(all || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await appointmentDoctorAPI.completeAppointment(id)
      fetchAppointments()
    } catch (err) {
      console.error('Error completing appointment:', err)
    }
  }

  const formatTime = (slot: string) => {
    if (!slot) return ''
    const [h, m] = slot.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#C8E6C9', color: '#2E7D32' }
      case 'PENDING': return { bg: '#FFF3E0', color: '#E65100' }
      case 'REJECTED': return { bg: '#FFCDD2', color: '#C62828' }
      case 'CANCELLED': return { bg: '#FFCDD2', color: '#C62828' }
      case 'COMPLETED': return { bg: '#E3F2FD', color: '#1565C0' }
      case 'ON_HOLD': return { bg: '#FFF3E0', color: '#E65100' }
      default: return { bg: '#E0E0E0', color: '#616161' }
    }
  }

  useEffect(() => {
    // myPatients loaded via username useEffect below
  }, [])
  const navigate = useNavigate()
  const { logout, username, fullName, specialization, designation } = useAuth()

  // Show greeting popup only after fresh login via ?welcome=1 query param
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      // Remove ?welcome=1 from URL without triggering re-render
      window.history.replaceState({}, '', '/doctor/dashboard')
      const timer = setTimeout(() => {
        setShowGreeting(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Auto-dismiss greeting after 6 seconds
  useEffect(() => {
    if (showGreeting) {
      const timer = setTimeout(() => {
        setGreetingDismissing(true)
        setTimeout(() => {
          setShowGreeting(false)
          setGreetingDismissing(false)
        }, 500)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [showGreeting])

  useEffect(() => {
    if (username) {
      fetchAppointments()
      fetchMyPatients()
    }
  }, [username])

  // Fetch approved queue for today and detect new approvals
  const fetchApprovedQueue = useCallback(async () => {
    if (!username) return
    try {
      const approved = await appointmentDoctorAPI.getApprovedTodayAppointments(username)
      setApprovedQueue(approved || [])
      const newIds = new Set((approved || []).map((a: AppointmentResponse) => a.id))
      // Detect newly approved appointments (not seen before)
      if (prevApprovedIdsRef.current.size > 0) {
        const brandNew = (approved || []).filter((a: AppointmentResponse) => !prevApprovedIdsRef.current.has(a.id))
        if (brandNew.length > 0) {
          // Show popup for the first new one
          setNewApptData(brandNew[0])
          setNewApptPopupOpen(true)
        }
      }
      prevApprovedIdsRef.current = newIds
    } catch (err) {
      console.error('Error fetching approved queue:', err)
    }
  }, [username])

  useEffect(() => {
    if (username) {
      fetchApprovedQueue()
      // Poll every 15 seconds for newly approved appointments
      const interval = setInterval(fetchApprovedQueue, 15000)
      return () => clearInterval(interval)
    }
  }, [username, fetchApprovedQueue])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Real-time server time
  const { formatDate, formatTime: fmtTime, formatDateTime } = useServerTime()

  // Real-time notifications via WebSocket
  const {
    notifications: realNotifs,
    unreadCount,
    newPopupNotifs,
    showPopup: showNotifPopup,
    dismissPopup,
    markAllRead,
    markOneRead,
  } = useNotifications({ username: username || '', role: 'DOCTOR' })

  // Show popup dialog when new WS notification arrives (for appointments)
  useEffect(() => {
    if (showNotifPopup && newPopupNotifs.length > 0) {
      const apptNotif = newPopupNotifs.find(n => n.type === 'APPOINTMENT_APPROVED' || n.type === 'APPOINTMENT_BOOKED')
      if (apptNotif) {
        // Refresh approved queue to get the latest data for popup
        fetchApprovedQueue()
      }
    }
  }, [showNotifPopup, newPopupNotifs])

  // Build notification items for the popover from real server notifications
  interface NotifDisplayItem {
    id: string
    type: string
    title: string
    message: string
    time: string
    color: string
  }

  const activeNotifications = useMemo<NotifDisplayItem[]>(() => {
    return realNotifs.map(n => {
      let color = '#1565C0'
      if (n.type === 'APPOINTMENT_BOOKED') color = '#00BFA6'
      else if (n.type === 'APPOINTMENT_APPROVED') color = '#00BFA6'
      else if (n.type === 'APPOINTMENT_COMPLETED') color = '#7E57C2'
      else if (n.type === 'APPOINTMENT_CANCELLED') color = '#C62828'
      return {
        id: `notif-${n.id}`,
        type: n.type,
        title: n.title,
        message: n.message,
        time: n.createdAt ? formatDateTime(n.createdAt) : 'Just now',
        color,
      }
    })
  }, [realNotifs, formatDateTime])

  const handleDismissNotif = (id: string) => {
    const numId = parseInt(id.replace('notif-', ''))
    if (!isNaN(numId)) markOneRead(numId)
  }

  const handleDismissAll = () => {
    markAllRead()
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_APPROVED': return <PendingActionsIcon sx={{ fontSize: 20 }} />
      case 'APPOINTMENT_COMPLETED': return <ScienceIcon sx={{ fontSize: 20 }} />
      default: return <NotificationsIcon sx={{ fontSize: 20 }} />
    }
  }

  // Premium Blue Color Palette
  const premiumBlue = '#1565C0'
  const lightBlue = '#E3F2FD'
  const darkBlue = '#0D47A1'
  const accentTeal = '#00BFA6'

  return (
    <>
      {/* Auto Greeting Popup Cloud - outside overflow:hidden container */}
      {showGreeting && (
        <GreetingCloud
          fullName={fullName}
          username={username}
          greetingDismissing={greetingDismissing}
          onDismiss={() => {
            setGreetingDismissing(true)
            setTimeout(() => { setShowGreeting(false); setGreetingDismissing(false) }, 400)
          }}
        />
      )}

    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F3F8FF 0%, #EAF2FF 35%, #F4F8FF 70%, #FFFFFF 100%)',
        py: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/get.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          zIndex: 0,
        }}
      />
      {/* Floating gradient orbs for depth */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 }, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,192,0.08) 0%, transparent 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: { xs: 175, md: 350 }, height: { xs: 175, md: 350 }, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,191,166,0.06) 0%, transparent 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', top: '40%', left: '50%', width: { xs: 150, md: 300 }, height: { xs: 150, md: 300 }, borderRadius: '50%', background: 'radial-gradient(circle, rgba(126,87,194,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Premium Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: { xs: 2, md: 4 },
            gap: { xs: 2, md: 0 },
            background: 'linear-gradient(135deg, rgba(21,101,192,0.95) 0%, rgba(13,71,161,0.97) 60%, rgba(10,61,145,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: 'white',
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: '12px', md: '16px' },
            boxShadow: '0 12px 40px rgba(13, 71, 161, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            borderBottom: `3px solid ${accentTeal}`,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Left: Avatar + Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload-input')?.click()}>
              <Box
                component="img"
                src={`${BACKEND_URL}/api/auth/avatar/${username}?v=${avatarKey}`}
                alt="Dr. Profile"
                onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
                sx={{
                  width: { xs: 52, sm: 72 },
                  height: { xs: 52, sm: 72 },
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.7)',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
              <Box sx={{ width: { xs: 52, sm: 72 }, height: { xs: 52, sm: 72 }, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.7)', display: 'none', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.15)' }}>
                <CameraAltIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Box sx={{ position: 'absolute', bottom: -2, right: -2, bgcolor: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                <CameraAltIcon sx={{ fontSize: 14, color: '#1565C0' }} />
              </Box>
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !username) return
                  setAvatarUploading(true)
                  try {
                    const formData = new FormData()
                    formData.append('avatar', file)
                    await axios.post(apiUrl(`/api/auth/upload-avatar/${username}`), formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    })
                    setAvatarKey(prev => prev + 1)
                  } catch {
                    console.error('Avatar upload failed')
                  } finally {
                    setAvatarUploading(false)
                    e.target.value = ''
                  }
                }}
              />
              {avatarUploading && (
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                </Box>
              )}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8, letterSpacing: '0.3px' }}>
                Welcome back
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: '600' }}>
                Dr. {fullName || username}
              </Typography>
              {(designation || specialization) && (
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
                  {[designation, specialization].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>
          {/* Right: Portal Title + Notifications + Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 3 }, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' },
                }}
              >
                Doctor Portal
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5, letterSpacing: '0.5px' }}>
                Chandigarh University Hospital
              </Typography>
            </Box>
            {/* Notification Bell */}
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{
                color: 'white',
                position: 'relative',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#F57C00',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    minWidth: 18,
                    height: 18,
                    boxShadow: '0 2px 8px rgba(245,124,0,0.4)',
                    animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.15)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 24 }} />
              </Badge>
            </IconButton>
            <Button
              variant="outlined"
              endIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                textTransform: 'none',
                fontWeight: '600',
                borderRadius: '8px',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#ff8a80',
                  backgroundColor: 'rgba(229, 57, 53, 0.15)',
                  color: '#ff8a80',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Premium Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => { setTabValue(2); fetchMyPatients() }}
              sx={{
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(0, 40, 120, 0.1), 0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(200,220,255,0.6)',
                borderLeft: '4px solid #1565C0',
                animation: `${cardEntrance} 0.5s ease-out both, ${cardFloat} 6s ease-in-out 1s infinite`,
                transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease, background 0.3s',
                perspective: '600px',
                '&:hover': {
                  transform: 'translateY(-6px) rotateX(2deg) rotateY(-2deg)',
                  boxShadow: '0 16px 40px rgba(0, 40, 120, 0.16), 0 4px 10px rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.96)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                    <GroupIcon sx={{ color: '#1565C0', fontSize: '20px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                    My Patients
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: '#0F172A',
                    mt: 0.5,
                  }}
                >
                  {myPatients.length}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                  Total registered patients
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => { setAppointmentFilter('thisWeek'); setTabValue(3); fetchAppointments() }}
              sx={{
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(0, 40, 120, 0.1), 0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(200,220,255,0.6)',
                borderLeft: '4px solid #7E57C2',
                animation: `${cardEntrance} 0.5s ease-out 0.1s both, ${cardFloat} 6s ease-in-out 1.2s infinite`,
                transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease, background 0.3s',
                perspective: '600px',
                '&:hover': {
                  transform: 'translateY(-6px) rotateX(2deg) rotateY(-2deg)',
                  boxShadow: '0 16px 40px rgba(0, 40, 120, 0.16), 0 4px 10px rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.96)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EDE7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                    <EventNoteIcon sx={{ color: '#7E57C2', fontSize: '20px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                    Appointments
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: '#0F172A',
                    mt: 0.5,
                  }}
                >
                  {thisWeekAppointments.length}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                  Scheduled this week
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => { setAppointmentFilter('todayQueue'); setTabValue(3); fetchAppointments(); fetchApprovedQueue() }}
              sx={{
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(0, 40, 120, 0.1), 0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(200,220,255,0.6)',
                borderLeft: '4px solid #F57C00',
                animation: `${cardEntrance} 0.5s ease-out 0.2s both, ${cardFloat} 6s ease-in-out 1.4s infinite`,
                transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease, background 0.3s',
                perspective: '600px',
                '&:hover': {
                  transform: 'translateY(-6px) rotateX(2deg) rotateY(-2deg)',
                  boxShadow: '0 16px 40px rgba(0, 40, 120, 0.16), 0 4px 10px rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.96)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                    <PendingActionsIcon sx={{ color: '#F57C00', fontSize: '20px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                    Today's Queue
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: '#0F172A',
                    mt: 0.5,
                  }}
                >
                  {approvedQueue.length}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                  Approved by receptionist
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => { setAppointmentFilter('completed'); setTabValue(3); fetchAppointments() }}
              sx={{
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(0, 40, 120, 0.1), 0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(200,220,255,0.6)',
                borderLeft: '4px solid #2E7D32',
                animation: `${cardEntrance} 0.5s ease-out 0.3s both, ${cardFloat} 6s ease-in-out 1.6s infinite`,
                transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease, background 0.3s',
                perspective: '600px',
                '&:hover': {
                  transform: 'translateY(-6px) rotateX(2deg) rotateY(-2deg)',
                  boxShadow: '0 16px 40px rgba(0, 40, 120, 0.16), 0 4px 10px rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.96)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                    <MedicalServicesIcon sx={{ color: '#2E7D32', fontSize: '20px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                    Completed
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: '#0F172A',
                    mt: 0.5,
                  }}
                >
                  {completedAppointments.length}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                  Appointments completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Premium Quick Actions Card */}
        <Card
          sx={{
            background: 'rgba(240,248,255,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 12px 36px rgba(0, 40, 120, 0.1), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
            borderRadius: '16px',
            border: '1px solid rgba(200,220,255,0.5)',
            mb: 3,
          }}
        >
          <CardContent>
            {/* Quick Actions Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: '6px',
                  height: '28px',
                  background: `linear-gradient(180deg, ${premiumBlue} 0%, ${accentTeal} 100%)`,
                  borderRadius: '3px',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: '700',
                  color: '#0F172A',
                  letterSpacing: '0.3px',
                }}
              >
                Quick Actions
              </Typography>
            </Box>

            {/* Section Divider */}
            <Box sx={{ height: '2px', background: `linear-gradient(to right, ${premiumBlue}, ${accentTeal}, transparent)`, borderRadius: 1, mb: 3 }} />

            {/* Premium Tab Navigation */}
            <Box
              sx={{
                borderBottom: `2px solid #E0E7FF`,
                mb: 3,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: { xs: '12px', sm: '14px' },
                    fontWeight: '600',
                    color: '#64748B',
                    minWidth: { xs: 'auto', sm: '120px', md: '180px' },
                    padding: { xs: '8px 12px', sm: '12px 16px' },
                    borderBottom: '3px solid transparent',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s',
                    '&:hover': {
                      color: premiumBlue,
                      backgroundColor: '#E3F2FD',
                    },
                  },
                  '& .Mui-selected': {
                    color: `${accentTeal} !important`,
                    fontWeight: '700 !important',
                    borderBottom: `3px solid ${accentTeal} !important`,
                    backgroundColor: 'rgba(0,191,166,0.06)',
                    boxShadow: `0 -2px 8px rgba(0, 191, 166, 0.1)`,
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    backgroundColor: accentTeal,
                  },
                }}
              >
                <Tab
                  icon={<DashboardIcon sx={{ mr: 1, fontSize: '18px' }} />}
                  iconPosition="start"
                  label="Dashboard"
                />
                <Tab
                  icon={<FolderSharedIcon sx={{ mr: 1, fontSize: '18px' }} />}
                  iconPosition="start"
                  label="Records"
                />
                <Tab
                  icon={<VisibilityIcon sx={{ mr: 1, fontSize: '18px' }} />}
                  iconPosition="start"
                  label="View Records"
                />
                <Tab
                  icon={<EventNoteIcon sx={{ mr: 1, fontSize: '18px' }} />}
                  iconPosition="start"
                  label={`Appointments${approvedQueue.length > 0 ? ` (${approvedQueue.length})` : ''}`}
                />
                <Tab
                  icon={<EmailIcon sx={{ mr: 1, fontSize: '18px' }} />}
                  iconPosition="start"
                  label="Email Alerts"
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={tabValue} index={0}>
              {/* Dashboard Tab - Premium Action Buttons */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setTabValue(2)
                      fetchMyPatients()
                    }}
                    sx={{
                      background: `linear-gradient(135deg, ${premiumBlue} 0%, ${darkBlue} 100%)`,
                      color: 'white',
                      padding: '16px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(21, 101, 192, 0.25)',
                      transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease',
                      perspective: '500px',
                      '&:hover': {
                        transform: 'translateY(-4px) rotateX(2deg)',
                        boxShadow: '0 12px 28px rgba(21, 101, 192, 0.35)',
                      },
                      '&:active': {
                        transform: 'translateY(0) scale(0.97)',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    <GroupIcon sx={{ fontSize: '32px' }} />
                    View Patients
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setAppointmentOpen(true)}
                    sx={{
                      background: `linear-gradient(135deg, #2196F3 0%, #1565C0 100%)`,
                      color: 'white',
                      padding: '16px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.25)',
                      transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease',
                      perspective: '500px',
                      '&:hover': {
                        transform: 'translateY(-4px) rotateX(2deg)',
                        boxShadow: '0 12px 28px rgba(33, 150, 243, 0.35)',
                      },
                      '&:active': {
                        transform: 'translateY(0) scale(0.97)',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    <EventNoteIcon sx={{ fontSize: '32px' }} />
                    Schedule Appointment
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      if (myPatients.length === 0) fetchMyPatients()
                      setPrescriptionOpen(true)
                    }}
                    sx={{
                      background: `linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)`,
                      color: 'white',
                      padding: '16px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(30, 136, 229, 0.25)',
                      transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease',
                      perspective: '500px',
                      '&:hover': {
                        transform: 'translateY(-4px) rotateX(2deg)',
                        boxShadow: '0 12px 28px rgba(30, 136, 229, 0.35)',
                      },
                      '&:active': {
                        transform: 'translateY(0) scale(0.97)',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    <MedicalServicesIcon sx={{ fontSize: '32px' }} />
                    Write Prescription
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setTabValue(2)
                      fetchMyPatients()
                    }}
                    sx={{
                      background: `linear-gradient(135deg, #1976D2 0%, #1565C0 100%)`,
                      color: 'white',
                      padding: '16px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                      transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s ease',
                      perspective: '500px',
                      '&:hover': {
                        transform: 'translateY(-4px) rotateX(2deg)',
                        boxShadow: '0 12px 28px rgba(25, 118, 210, 0.35)',
                      },
                      '&:active': {
                        transform: 'translateY(0) scale(0.97)',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    <FileDownloadIcon sx={{ fontSize: '32px' }} />
                    View Patient Records
                  </Button>
                </Grid>
              </Grid>

              {/* Premium Dashboard Info Section */}
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: '700',
                    color: '#0F172A',
                    mb: 2,
                  }}
                >
                  Dashboard Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        background: `linear-gradient(135deg, rgba(227,242,253,0.6) 0%, rgba(244,248,255,0.7) 100%)`,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(200,220,255,0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,40,120,0.06)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#64748B', mb: 1 }}
                      >
                        Total Active Patients
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 'bold',
                          color: darkBlue,
                        }}
                      >
                        {myPatients.length} patients
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        background: `linear-gradient(135deg, rgba(227,242,253,0.6) 0%, rgba(244,248,255,0.7) 100%)`,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(200,220,255,0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,40,120,0.06)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#64748B', mb: 1 }}
                      >
                        Next Appointment
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 'bold',
                          color: darkBlue,
                        }}
                      >
                        {(() => {
                          const upcoming = allAppointments.filter(a => a.status === 'APPROVED' && new Date(a.appointmentDate) >= new Date(new Date().toDateString()))
                          if (upcoming.length === 0) return 'No upcoming'
                          const next = upcoming[upcoming.length - 1]
                          return `${new Date(next.appointmentDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${next.preferredTime || 'N/A'}`
                        })()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* My Patients Table */}
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: '700',
                    color: '#0F172A',
                    mb: 2,
                  }}
                >
                  My Patients (from Appointments)
                </Typography>
                {myPatientsLoading ? (
                  <Paper sx={{ p: 2, borderRadius: '10px', border: `1px solid ${premiumBlue}20` }}>
                    <TableSkeleton rows={4} cols={5} />
                  </Paper>
                ) : myPatients.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '10px', border: `1px solid ${premiumBlue}20` }}>
                    <Typography sx={{ color: '#64748B' }}>No patients found. Patients will appear here once they book appointments with you.</Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: '10px', border: `1px solid ${premiumBlue}20`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: `linear-gradient(135deg, ${premiumBlue} 0%, ${darkBlue} 100%)` }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>#</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Patient Name</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Phone</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Last Appointment</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myPatients.map((p, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { backgroundColor: `${lightBlue}` } }}>
                            <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{p.patientName || 'N/A'}</TableCell>
                            <TableCell>{p.patientPhone || 'N/A'}</TableCell>
                            <TableCell>
                              {p.lastAppointmentDate
                                ? new Date(p.lastAppointmentDate + 'T00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={p.lastStatus || 'N/A'}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  backgroundColor: getStatusColor(p.lastStatus || '').bg,
                                  color: getStatusColor(p.lastStatus || '').color,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.reason || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Records Search by Mobile Number */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: darkBlue, mb: 2 }}>
                  Search Patient Records
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Patient Mobile Number"
                    placeholder="Enter 10-digit mobile number"
                    value={searchPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      if (val.length <= 10) setSearchPhone(val)
                    }}
                    sx={{ flex: 1, maxWidth: 400 }}
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 1, color: '#64748B', fontWeight: 600 }}>+91</Typography>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    disabled={searchPhone.length !== 10 || searchLoading}
                    onClick={async () => {
                      setSearchLoading(true)
                      setSearchError(null)
                      setSearchResult(null)
                      try {
                        const result = await doctorAPI.searchPatientByPhone(searchPhone)
                        if (result.success) {
                          setSearchResult(result)
                        } else {
                          setSearchError(result.message || 'Patient not found')
                        }
                      } catch (err: any) {
                        setSearchError(err?.response?.data?.message || 'No patient found with this mobile number')
                      } finally {
                        setSearchLoading(false)
                      }
                    }}
                    sx={{
                      background: `linear-gradient(135deg, ${premiumBlue} 0%, ${darkBlue} 100%)`,
                      height: 56,
                      px: 4,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '14px',
                    }}
                    startIcon={searchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </Box>
              </Box>

              {searchError && (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: '10px' }}>
                  <Typography sx={{ color: '#D32F2F', fontWeight: 600 }}>{searchError}</Typography>
                </Paper>
              )}

              {searchResult && (
                <Box>
                  {/* Patient Info Card */}
                  <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', border: `1px solid ${premiumBlue}30`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: darkBlue, mb: 2 }}>Patient Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Name</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{searchResult.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Age</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{searchResult.age}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Gender</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{searchResult.gender || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Phone</Typography>
                        <Typography sx={{ fontWeight: 600 }}>+91 {searchResult.phone}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Email</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{searchResult.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Blood Group</Typography>
                        <Chip label={searchResult.bloodGroup || 'N/A'} sx={{ backgroundColor: lightBlue, color: darkBlue, fontWeight: 600 }} />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Patient Records */}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: darkBlue, mb: 2 }}>Medical Records</Typography>
                  {searchResult.records && searchResult.records.length > 0 ? (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '10px' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ background: `linear-gradient(90deg, ${premiumBlue} 0%, ${darkBlue} 100%)` }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Diagnosis</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Prescription</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Doctor</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {searchResult.records.map((record: any, idx: number) => (
                            <TableRow key={record.id || idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' }, '&:hover': { backgroundColor: lightBlue } }}>
                              <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{record.diagnosis || 'N/A'}</TableCell>
                              <TableCell>{record.prescription}</TableCell>
                              <TableCell>{record.doctorUsername || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '10px', backgroundColor: '#F9FAFB' }}>
                      <Typography sx={{ color: '#64748B' }}>No medical records found for this patient.</Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {myPatientsLoading ? (
                <Paper sx={{ p: 2, borderRadius: '10px', bgcolor: '#F9FAFB' }}>
                  <TableSkeleton rows={5} cols={6} />
                </Paper>
              ) : myPatients.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '10px', backgroundColor: '#F9FAFB' }}>
                  <Typography sx={{ color: '#64748B' }}>No patients found. Patients will appear here once they book appointments with you.</Typography>
                </Paper>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          background: `linear-gradient(90deg, ${premiumBlue} 0%, ${darkBlue} 100%)`,
                          '& th': {
                            color: 'white',
                            fontWeight: '700',
                          },
                        }}
                      >
                        <TableCell sx={{ color: 'white' }}>#</TableCell>
                        <TableCell sx={{ color: 'white' }}>Name</TableCell>
                        <TableCell sx={{ color: 'white' }}>Phone</TableCell>
                        <TableCell sx={{ color: 'white' }}>Email</TableCell>
                        <TableCell sx={{ color: 'white' }}>Age</TableCell>
                        <TableCell sx={{ color: 'white' }}>Blood Group</TableCell>
                        <TableCell sx={{ color: 'white' }}>Last Appointment</TableCell>
                        <TableCell sx={{ color: 'white' }}>Status</TableCell>
                        <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myPatients.map((patient, index) => (
                        <TableRow
                          key={patient.appointmentId || index}
                          sx={{
                            '&:hover': {
                              backgroundColor: lightBlue,
                            },
                            '&:nth-of-type(odd)': {
                              backgroundColor: '#F9FAFB',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: '600', color: darkBlue }}>
                            {index + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{patient.patientName || 'N/A'}</TableCell>
                          <TableCell>{patient.patientPhone || 'N/A'}</TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>{patient.age || 'N/A'}</TableCell>
                          <TableCell>
                            {patient.bloodGroup ? (
                              <Chip
                                label={patient.bloodGroup}
                                sx={{
                                  backgroundColor: lightBlue,
                                  color: darkBlue,
                                  fontWeight: '600',
                                }}
                              />
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {patient.lastAppointmentDate
                              ? new Date(patient.lastAppointmentDate + 'T00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={patient.lastStatus || 'N/A'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '11px',
                                backgroundColor: getStatusColor(patient.lastStatus || '').bg,
                                color: getStatusColor(patient.lastStatus || '').color,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  setAppointmentData({
                                    patientId: patient.patientId || '',
                                    appointmentDate: '',
                                    time: '',
                                    reason: '',
                                  })
                                  setAppointmentOpen(true)
                                }}
                                sx={{
                                  background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
                                  fontSize: '11px',
                                  py: 0.5,
                                }}
                              >
                                Appointment
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  setPrescriptionData({
                                    patientId: patient.patientId || '',
                                    diagnosis: '',
                                    medication: '',
                                    dosage: '',
                                    duration: '',
                                    instructions: '',
                                  })
                                  setSelectedPatientForPrescription(patient)
                                  setPrescriptionOpen(true)
                                }}
                                sx={{
                                  background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                                  fontSize: '11px',
                                  py: 0.5,
                                }}
                              >
                                Prescription
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* Tab 4: Appointments */}
            <TabPanel value={tabValue} index={3}>
              {/* Today's Approved Queue */}
              {approvedQueue.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#00897B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInIcon /> Today's Queue ({approvedQueue.length})
                  </Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '10px' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(90deg, #00BFA6 0%, #00897B 100%)' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Queue #</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Patient</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Time</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {approvedQueue.map((apt) => (
                          <TableRow key={apt.id} sx={{ '&:hover': { backgroundColor: '#E0F2F1' }, cursor: 'pointer' }} onClick={() => setExpandedApptId(expandedApptId === apt.id ? null : apt.id)}>
                            <TableCell>
                              <Chip
                                label={`#${apt.queueNumber ?? '-'}`}
                                size="small"
                                sx={{ bgcolor: '#E0F2F1', color: '#00695C', fontWeight: 800, fontSize: '0.85rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{apt.patientName}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: premiumBlue }}>{apt.preferredTime || 'N/A'}</TableCell>
                            <TableCell><Chip label="APPROVED" size="small" sx={{ bgcolor: '#C8E6C9', color: '#2E7D32', fontWeight: 700 }} /></TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircleOutlineIcon />}
                                onClick={(e) => { e.stopPropagation(); handleComplete(apt.id) }}
                                sx={{ bgcolor: '#1565C0', fontSize: '11px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0D47A1' } }}
                              >
                                Complete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Filter Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: darkBlue, mr: 1 }}>
                  {appointmentFilter === 'all' ? 'All Appointments' : appointmentFilter === 'thisWeek' ? 'This Week' : appointmentFilter === 'todayQueue' ? "Today's Queue" : 'Completed'} ({filteredAppointments.length})
                </Typography>
                {(['all', 'thisWeek', 'todayQueue', 'completed'] as const).map((filter) => {
                  const labels = { all: 'All', thisWeek: 'This Week', todayQueue: "Today's Queue", completed: 'Completed' }
                  const colors = { all: '#1565C0', thisWeek: '#7E57C2', todayQueue: '#F57C00', completed: '#2E7D32' }
                  return (
                    <Chip
                      key={filter}
                      label={labels[filter]}
                      size="small"
                      onClick={() => setAppointmentFilter(filter)}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        bgcolor: appointmentFilter === filter ? colors[filter] : 'transparent',
                        color: appointmentFilter === filter ? '#fff' : colors[filter],
                        border: `1.5px solid ${colors[filter]}`,
                        '&:hover': { bgcolor: appointmentFilter === filter ? colors[filter] : `${colors[filter]}15` },
                      }}
                    />
                  )
                })}
              </Box>
              {appointmentsLoading ? (
                <Paper sx={{ p: 2, borderRadius: '10px', bgcolor: '#F9FAFB' }}>
                  <TableSkeleton rows={5} cols={5} />
                </Paper>
              ) : filteredAppointments.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '10px', backgroundColor: '#F9FAFB' }}>
                  <EventNoteIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography sx={{ color: '#64748B' }}>No appointments found.</Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '10px' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: `linear-gradient(90deg, ${premiumBlue} 0%, ${darkBlue} 100%)` }}>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Patient</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Time</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAppointments.map((apt) => {
                        const sc = getStatusColor(apt.status)
                        const isExpanded = expandedApptId === apt.id
                        return (
                          <React.Fragment key={apt.id}>
                            <TableRow
                              sx={{
                                cursor: 'pointer',
                                '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' },
                                '&:hover': { backgroundColor: lightBlue },
                                ...(isExpanded && { backgroundColor: `${lightBlue} !important` }),
                              }}
                              onClick={() => setExpandedApptId(isExpanded ? null : apt.id)}
                            >
                              <TableCell sx={{ fontWeight: 600, color: darkBlue }}>
                                {apt.queueNumber ? `Q${apt.queueNumber}` : `#${apt.id}`}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{apt.patientName}</TableCell>
                              <TableCell>{new Date(apt.appointmentDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: premiumBlue }}>{apt.preferredTime || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip label={apt.status === 'ON_HOLD' ? 'ON HOLD' : apt.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700 }} />
                              </TableCell>
                            </TableRow>
                            {/* Expanded patient info row */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                                  <Box
                                    sx={{
                                      p: 2.5,
                                      my: 1,
                                      background: 'linear-gradient(135deg, #F0F7FF 0%, #E8F5E9 100%)',
                                      borderRadius: '12px',
                                      border: '1px solid rgba(21,101,192,0.12)',
                                    }}
                                  >
                                    <Typography sx={{ fontWeight: 700, color: darkBlue, fontSize: '0.85rem', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      Patient Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                      <Grid item xs={6} sm={3}>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Name</Typography>
                                        <Typography sx={{ fontWeight: 700, color: '#263238', fontSize: '0.9rem' }}>{apt.patientName}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Phone</Typography>
                                        <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.9rem' }}>{apt.patientPhone}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Reason</Typography>
                                        <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.9rem' }}>{apt.reason || 'N/A'}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Message</Typography>
                                        <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.88rem', fontStyle: apt.doctorMessage ? 'normal' : 'italic' }}>
                                          {apt.doctorMessage || 'No message'}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                    {apt.status === 'APPROVED' && (
                                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          startIcon={<CheckCircleOutlineIcon />}
                                          onClick={(e) => { e.stopPropagation(); handleComplete(apt.id) }}
                                          sx={{ bgcolor: '#1565C0', fontSize: '12px', textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#0D47A1' } }}
                                        >
                                          Mark as Completed
                                        </Button>
                                      </Box>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* Tab 5: Email Alerts */}
            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: darkBlue, mb: 3 }}>
                Send Email Alerts to Patients
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ScienceIcon />}
                    onClick={() => {
                      setEmailType('lab-report')
                      setLabReportData({ testCategory: '', remarks: '', followUpRequired: 'No', followUpDate: '', reportPdf: null })
                      setEmailDialogOpen(true)
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
                      py: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(21,101,192,0.35)' },
                    }}
                  >
                    Lab Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<MedicationIcon />}
                    onClick={() => {
                      setEmailType('medicine-reminder')
                      setMedicineData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' })
                      setEmailDialogOpen(true)
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
                      py: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(33,150,243,0.25)',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(33,150,243,0.35)' },
                    }}
                  >
                    Medicine Reminder
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LocalHospitalIcon />}
                    onClick={() => {
                      setEmailType('discharge-summary')
                      setDischargeData({ diagnosis: '', treatment: '', admissionDate: '', dischargeDate: '', followUpDate: '', instructions: '' })
                      setEmailDialogOpen(true)
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                      py: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(30,136,229,0.25)',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(30,136,229,0.35)' },
                    }}
                  >
                    Discharge Summary
                  </Button>
                </Grid>
              </Grid>

              {/* Patients list for quick email */}
              {myPatientsLoading ? (
                <Paper sx={{ p: 2, borderRadius: '10px', bgcolor: '#F9FAFB' }}>
                  <TableSkeleton rows={4} cols={5} />
                </Paper>
              ) : myPatients.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '10px', backgroundColor: '#F9FAFB' }}>
                  <Typography sx={{ color: '#64748B' }}>No patients found.</Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '10px' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: `linear-gradient(90deg, ${premiumBlue} 0%, ${darkBlue} 100%)` }}>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Patient Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Phone</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myPatients.map((patient, index) => (
                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: lightBlue }, '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                          <TableCell sx={{ fontWeight: 600, color: darkBlue }}>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{patient.patientName || 'N/A'}</TableCell>
                          <TableCell>{patient.patientPhone || 'N/A'}</TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ScienceIcon sx={{ fontSize: '14px !important' }} />}
                                disabled={!patient.email}
                                onClick={() => {
                                  setEmailType('lab-report')
                                  setEmailTo(patient.email || '')
                                  setEmailPatientName(patient.patientName || '')
                                  setLabReportData({ testCategory: '', remarks: '', followUpRequired: 'No', followUpDate: '', reportPdf: null })
                                  setEmailDialogOpen(true)
                                }}
                                sx={{ fontSize: '10px', textTransform: 'none', fontWeight: 700, borderColor: premiumBlue, color: premiumBlue }}
                              >
                                Lab
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<MedicationIcon sx={{ fontSize: '14px !important' }} />}
                                disabled={!patient.email}
                                onClick={() => {
                                  setEmailType('medicine-reminder')
                                  setEmailTo(patient.email || '')
                                  setEmailPatientName(patient.patientName || '')
                                  setMedicineData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' })
                                  setEmailDialogOpen(true)
                                }}
                                sx={{ fontSize: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#2196F3', color: '#2196F3' }}
                              >
                                Meds
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LocalHospitalIcon sx={{ fontSize: '14px !important' }} />}
                                disabled={!patient.email}
                                onClick={() => {
                                  setEmailType('discharge-summary')
                                  setEmailTo(patient.email || '')
                                  setEmailPatientName(patient.patientName || '')
                                  setDischargeData({ diagnosis: '', treatment: '', admissionDate: '', dischargeDate: '', followUpDate: '', instructions: '' })
                                  setEmailDialogOpen(true)
                                }}
                                sx={{ fontSize: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#1E88E5', color: '#1E88E5' }}
                              >
                                Discharge
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </CardContent>
        </Card>

        {/* Schedule Appointment Modal */}
        <Dialog open={appointmentOpen} onClose={() => setAppointmentOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: `linear-gradient(135deg, #2196F3 0%, #1565C0 100%)`, color: 'white', fontWeight: 'bold' }}>
            Schedule Appointment
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={appointmentData.patientId}
                onChange={(e) => {
                  const patientId = e.target.value
                  setAppointmentData({ ...appointmentData, patientId })
                  const selected = myPatients.find((p) => String(p.patientId) === String(patientId))
                  setSelectedPatientForAppointment(selected)
                }}
                label="Select Patient"
              >
                {myPatients.map((patient, index) => (
                  <MenuItem key={patient.patientId || index} value={patient.patientId || ''}>
                    {patient.patientName} {patient.patientPhone ? `(${patient.patientPhone})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Appointment Date"
              type="date"
              value={appointmentData.appointmentDate}
              onChange={(e) => setAppointmentData({ ...appointmentData, appointmentDate: e.target.value })}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={appointmentData.time}
              onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Reason for Appointment"
              value={appointmentData.reason}
              onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAppointmentOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  if (!appointmentData.patientId) {
                    alert('Please select a patient')
                    return
                  }
                  const patient = myPatients.find((p: any) => String(p.patientId) === String(appointmentData.patientId))
                  const response = await appointmentDoctorAPI.getMyAppointments(username || '')
                  // Use the doctorAPI's authenticated endpoint
                  const bookData = {
                    patientName: patient?.patientName || '',
                    patientPhone: patient?.patientPhone || '',
                    doctorUsername: username || '',
                    doctorName: fullName || username || '',
                    specialization: specialization || '',
                    appointmentDate: appointmentData.appointmentDate,
                    preferredTime: appointmentData.time,
                    reason: appointmentData.reason || 'Scheduled by doctor',
                  }
                  const { appointmentPublicAPI } = await import('../services/appointmentAPI')
                  await appointmentPublicAPI.bookAppointment(bookData)
                  setAppointmentOpen(false)
                  alert('Appointment scheduled successfully!')
                  setAppointmentData({ patientId: '', appointmentDate: '', time: '', reason: '' })
                  fetchAppointments()
                } catch (err: any) {
                  alert('Failed to schedule appointment: ' + (err?.response?.data?.error || err.message))
                }
              }}
              variant="contained"
              sx={{ background: `linear-gradient(135deg, #2196F3 0%, #1565C0 100%)` }}
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>

        {/* Write Prescription Modal */}
        <Dialog open={prescriptionOpen} onClose={() => setPrescriptionOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: `linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)`, color: 'white', fontWeight: 'bold' }}>
            Write Prescription
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={prescriptionData.patientId}
                onChange={(e) => {
                  const patientId = e.target.value
                  setPrescriptionData({ ...prescriptionData, patientId })
                  const selected = myPatients.find((p) => String(p.patientId) === String(patientId))
                  setSelectedPatientForPrescription(selected)
                }}
                label="Select Patient"
              >
                {myPatients.map((patient, index) => (
                  <MenuItem key={patient.patientId || index} value={patient.patientId || ''}>
                    {patient.patientName} {patient.patientPhone ? `(${patient.patientPhone})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Diagnosis"
              value={prescriptionData.diagnosis}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
              margin="normal"
              variant="outlined"
              placeholder="e.g., Viral Fever, Headache"
            />
            <TextField
              fullWidth
              label="Medication"
              value={prescriptionData.medication}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, medication: e.target.value })}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Dosage"
              value={prescriptionData.dosage}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })}
              margin="normal"
              variant="outlined"
              placeholder="e.g., 500mg"
            />
            <TextField
              fullWidth
              label="Duration"
              value={prescriptionData.duration}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, duration: e.target.value })}
              margin="normal"
              variant="outlined"
              placeholder="e.g., 7 days"
            />
            <TextField
              fullWidth
              label="Instructions"
              value={prescriptionData.instructions}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, instructions: e.target.value })}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              placeholder="e.g., Take 1 tablet twice daily after meals"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPrescriptionOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  const patientName = selectedPatientForPrescription?.name || ''
                  if (!patientName) {
                    alert('Please select a patient')
                    return
                  }
                  if (!prescriptionData.diagnosis.trim()) {
                    alert('Please enter a diagnosis')
                    return
                  }
                  const prescriptionText = [
                    prescriptionData.medication && `Medication: ${prescriptionData.medication}`,
                    prescriptionData.dosage && `Dosage: ${prescriptionData.dosage}`,
                    prescriptionData.duration && `Duration: ${prescriptionData.duration}`,
                    prescriptionData.instructions && `Instructions: ${prescriptionData.instructions}`,
                  ].filter(Boolean).join(' | ')

                  if (!prescriptionText) {
                    alert('Please fill in at least one prescription field')
                    return
                  }

                  await doctorAPI.savePatientRecord({
                    patientName,
                    diagnosis: prescriptionData.diagnosis.trim(),
                    prescription: prescriptionText,
                  })
                  setPrescriptionOpen(false)
                  alert('Prescription saved successfully!')
                  setPrescriptionData({ patientId: '', diagnosis: '', medication: '', dosage: '', duration: '', instructions: '' })
                } catch (err: any) {
                  alert('Failed to save prescription: ' + (err?.response?.data?.message || err.message))
                }
              }}
              variant="contained"
              sx={{ background: `linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)` }}
            >
              Create Prescription
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            background: emailType === 'lab-report' ? 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)'
              : emailType === 'medicine-reminder' ? 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)'
              : 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
            color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1,
          }}>
            {emailType === 'lab-report' && <><ScienceIcon /> Send Lab Report</>}
            {emailType === 'medicine-reminder' && <><MedicationIcon /> Send Medicine Reminder</>}
            {emailType === 'discharge-summary' && <><LocalHospitalIcon /> Send Discharge Summary</>}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth label="Patient Email" value={emailTo} margin="normal"
              onChange={(e) => setEmailTo(e.target.value)} placeholder="patient@example.com" required
            />
            <TextField
              fullWidth label="Patient Name" value={emailPatientName} margin="normal"
              onChange={(e) => setEmailPatientName(e.target.value)} required
            />

            {emailType === 'lab-report' && (
              <>
                {/* Doctor Section */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: '#0D47A1', fontWeight: 700, borderBottom: '2px solid #E3F2FD', pb: 0.5 }}>Doctor Information</Typography>
                <TextField fullWidth label="Doctor Name" value={fullName || username || ''} margin="dense" size="small" disabled
                  InputProps={{ sx: { fontWeight: 600 } }} />

                {/* Report Info Section */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: '#0D47A1', fontWeight: 700, borderBottom: '2px solid #E3F2FD', pb: 0.5 }}>Report Information</Typography>
                <FormControl fullWidth margin="dense" size="small" required>
                  <InputLabel>Test Category</InputLabel>
                  <Select
                    value={labReportData.testCategory}
                    label="Test Category"
                    onChange={(e) => setLabReportData({ ...labReportData, testCategory: e.target.value })}
                  >
                    <MenuItem value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</MenuItem>
                    <MenuItem value="Blood Sugar (Glucose)">Blood Sugar (Glucose)</MenuItem>
                    <MenuItem value="Liver Function Test (LFT)">Liver Function Test (LFT)</MenuItem>
                    <MenuItem value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</MenuItem>
                    <MenuItem value="Lipid Profile">Lipid Profile</MenuItem>
                    <MenuItem value="Thyroid Function Test (TFT)">Thyroid Function Test (TFT)</MenuItem>
                    <MenuItem value="Urine Routine">Urine Routine</MenuItem>
                    <MenuItem value="X-Ray">X-Ray</MenuItem>
                    <MenuItem value="MRI Scan">MRI Scan</MenuItem>
                    <MenuItem value="CT Scan">CT Scan</MenuItem>
                    <MenuItem value="Ultrasound">Ultrasound</MenuItem>
                    <MenuItem value="ECG">ECG</MenuItem>
                    <MenuItem value="COVID-19 RT-PCR">COVID-19 RT-PCR</MenuItem>
                    <MenuItem value="Hemoglobin (Hb)">Hemoglobin (Hb)</MenuItem>
                    <MenuItem value="Vitamin D">Vitamin D</MenuItem>
                    <MenuItem value="Vitamin B12">Vitamin B12</MenuItem>
                    <MenuItem value="Iron Studies">Iron Studies</MenuItem>
                    <MenuItem value="HbA1c">HbA1c</MenuItem>
                    <MenuItem value="Allergy Panel">Allergy Panel</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField fullWidth label="Remarks" value={labReportData.remarks} margin="dense" size="small" multiline rows={2}
                  onChange={(e) => setLabReportData({ ...labReportData, remarks: e.target.value })}
                  placeholder="Additional remarks" />

                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Follow-up Required</InputLabel>
                  <Select
                    value={labReportData.followUpRequired}
                    label="Follow-up Required"
                    onChange={(e) => setLabReportData({ ...labReportData, followUpRequired: e.target.value, followUpDate: e.target.value === 'No' ? '' : labReportData.followUpDate })}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>

                {labReportData.followUpRequired === 'Yes' && (
                  <TextField fullWidth label="Follow-up Date" type="date" value={labReportData.followUpDate} margin="dense" size="small"
                    onChange={(e) => setLabReportData({ ...labReportData, followUpDate: e.target.value })}
                    InputLabelProps={{ shrink: true }} required />
                )}

                {/* PDF Upload */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: '#0D47A1', fontWeight: 700, borderBottom: '2px solid #E3F2FD', pb: 0.5 }}>Attach Report (PDF)</Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mt: 1, py: 1.5, textTransform: 'none', borderStyle: 'dashed', color: '#64748B', borderColor: '#94A3B8' }}
                >
                  {labReportData.reportPdf ? `\u2705 ${labReportData.reportPdf.name}` : '\ud83d\udcc2 Click to upload PDF report'}
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setLabReportData({ ...labReportData, reportPdf: file })
                    }}
                  />
                </Button>
                {labReportData.reportPdf && (
                  <Button size="small" onClick={() => setLabReportData({ ...labReportData, reportPdf: null })} sx={{ mt: 0.5, fontSize: '11px', color: '#F44336', textTransform: 'none' }}>
                    Remove PDF
                  </Button>
                )}
              </>
            )}

            {emailType === 'medicine-reminder' && (
              <>
                <TextField fullWidth label="Medication" value={medicineData.medication} margin="normal"
                  onChange={(e) => setMedicineData({ ...medicineData, medication: e.target.value })}
                  placeholder="e.g., Paracetamol 500mg" required />
                <TextField fullWidth label="Dosage" value={medicineData.dosage} margin="normal"
                  onChange={(e) => setMedicineData({ ...medicineData, dosage: e.target.value })}
                  placeholder="e.g., 1 tablet" required />
                <TextField fullWidth label="Frequency" value={medicineData.frequency} margin="normal"
                  onChange={(e) => setMedicineData({ ...medicineData, frequency: e.target.value })}
                  placeholder="e.g., Twice daily after meals" required />
                <TextField fullWidth label="Duration" value={medicineData.duration} margin="normal"
                  onChange={(e) => setMedicineData({ ...medicineData, duration: e.target.value })}
                  placeholder="e.g., 7 days" />
                <TextField fullWidth label="Instructions" value={medicineData.instructions} margin="normal" multiline rows={2}
                  onChange={(e) => setMedicineData({ ...medicineData, instructions: e.target.value })}
                  placeholder="e.g., Take with warm water. Avoid dairy products." />
              </>
            )}

            {emailType === 'discharge-summary' && (
              <>
                <TextField fullWidth label="Diagnosis" value={dischargeData.diagnosis} margin="normal"
                  onChange={(e) => setDischargeData({ ...dischargeData, diagnosis: e.target.value })}
                  placeholder="e.g., Acute Viral Fever" required />
                <TextField fullWidth label="Treatment Given" value={dischargeData.treatment} margin="normal"
                  onChange={(e) => setDischargeData({ ...dischargeData, treatment: e.target.value })}
                  placeholder="e.g., IV fluids, antipyretics" required />
                <TextField fullWidth label="Admission Date" type="date" value={dischargeData.admissionDate} margin="normal"
                  onChange={(e) => setDischargeData({ ...dischargeData, admissionDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} required />
                <TextField fullWidth label="Discharge Date" type="date" value={dischargeData.dischargeDate} margin="normal"
                  onChange={(e) => setDischargeData({ ...dischargeData, dischargeDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} required />
                <TextField fullWidth label="Follow-up Date" type="date" value={dischargeData.followUpDate} margin="normal"
                  onChange={(e) => setDischargeData({ ...dischargeData, followUpDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
                <TextField fullWidth label="Instructions" value={dischargeData.instructions} margin="normal" multiline rows={2}
                  onChange={(e) => setDischargeData({ ...dischargeData, instructions: e.target.value })}
                  placeholder="e.g., Bed rest for 3 days. Follow prescribed diet." />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEmailDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                emailSending || !emailTo.trim() || !emailPatientName.trim() ||
                (emailType === 'lab-report' && (
                  !labReportData.testCategory || !labReportData.remarks.trim() ||
                  (labReportData.followUpRequired === 'Yes' && !labReportData.followUpDate)
                )) ||
                (emailType === 'medicine-reminder' && (
                  !medicineData.medication.trim() || !medicineData.dosage.trim() ||
                  !medicineData.frequency.trim() || !medicineData.duration.trim() ||
                  !medicineData.instructions.trim()
                )) ||
                (emailType === 'discharge-summary' && (
                  !dischargeData.diagnosis.trim() || !dischargeData.treatment.trim() ||
                  !dischargeData.admissionDate || !dischargeData.dischargeDate ||
                  !dischargeData.followUpDate || !dischargeData.instructions.trim()
                ))
              }
              startIcon={emailSending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              onClick={async () => {
                setEmailSending(true)
                try {
                  const doctorFullName = fullName || username || 'Doctor'
                  if (emailType === 'lab-report') {
                    await emailAPI.sendLabReport({
                      to: emailTo, patientName: emailPatientName,
                      doctorName: doctorFullName, testCategory: labReportData.testCategory,
                      remarks: labReportData.remarks,
                      followUpRequired: labReportData.followUpRequired === 'Yes',
                      followUpDate: labReportData.followUpDate,
                      reportPdf: labReportData.reportPdf,
                    })
                  } else if (emailType === 'medicine-reminder') {
                    await emailAPI.sendMedicineReminder({
                      to: emailTo, patientName: emailPatientName, medication: medicineData.medication,
                      dosage: medicineData.dosage, frequency: medicineData.frequency,
                      duration: medicineData.duration, doctorName: doctorFullName, instructions: medicineData.instructions,
                    })
                  } else {
                    await emailAPI.sendDischargeSummary({
                      to: emailTo, patientName: emailPatientName, diagnosis: dischargeData.diagnosis,
                      treatment: dischargeData.treatment, admissionDate: dischargeData.admissionDate,
                      dischargeDate: dischargeData.dischargeDate, doctorName: doctorFullName,
                      followUpDate: dischargeData.followUpDate, instructions: dischargeData.instructions,
                    })
                  }
                  setEmailSnackbar({ open: true, message: 'Email sent successfully!', severity: 'success' })
                  setEmailDialogOpen(false)
                  setEmailTo('')
                  setEmailPatientName('')
                } catch (err: any) {
                  setEmailSnackbar({
                    open: true,
                    message: 'Failed to send email: ' + (err?.response?.data?.message || err.message),
                    severity: 'error',
                  })
                } finally {
                  setEmailSending(false)
                }
              }}
              sx={{
                background: emailType === 'lab-report' ? 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)'
                  : emailType === 'medicine-reminder' ? 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)'
                  : 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                textTransform: 'none', fontWeight: 700, px: 3,
              }}
            >
              {emailSending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Snackbar */}
        <Snackbar open={emailSnackbar.open} autoHideDuration={5000} onClose={() => setEmailSnackbar({ ...emailSnackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setEmailSnackbar({ ...emailSnackbar, open: false })} severity={emailSnackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {emailSnackbar.message}
          </Alert>
        </Snackbar>

        {/* Real-time notification popup snackbar */}
        <Snackbar
          open={showNotifPopup}
          autoHideDuration={8000}
          onClose={dismissPopup}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="info"
            variant="filled"
            sx={{ borderRadius: 2, cursor: 'pointer' }}
            onClick={() => { dismissPopup(); setTabValue(3); fetchAppointments() }}
            onClose={dismissPopup}
            icon={<NotificationsIcon />}
          >
            {newPopupNotifs.length === 1
              ? newPopupNotifs[0].title + ': ' + newPopupNotifs[0].message
              : `You have ${newPopupNotifs.length} new notification${newPopupNotifs.length > 1 ? 's' : ''}!`}
          </Alert>
        </Snackbar>

        {/* Notifications Popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                width: 380,
                maxHeight: 480,
                mt: 1.5,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(230,238,248,0.6)',
                boxShadow: '0 16px 48px rgba(13, 71, 161, 0.18), 0 4px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              },
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              background: 'linear-gradient(135deg, rgba(21,101,192,0.06) 0%, rgba(0,191,166,0.04) 100%)',
              borderBottom: '1px solid rgba(230,238,248,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <NotificationsIcon sx={{ color: '#1565C0', fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                Notifications
              </Typography>
              {activeNotifications.length > 0 && (
                <Chip
                  label={activeNotifications.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: '#F57C00',
                    color: 'white',
                  }}
                />
              )}
            </Box>
            {activeNotifications.length > 0 && (
              <Button
                size="small"
                onClick={handleDismissAll}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: '#1565C0',
                  fontWeight: 600,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: 'rgba(21,101,192,0.08)' },
                }}
              >
                Clear all
              </Button>
            )}
          </Box>

          {/* Notification List */}
          <Box sx={{ overflowY: 'auto', maxHeight: 380 }}>
            {activeNotifications.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#C8E6C9', mb: 1 }} />
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                  All caught up!
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', mt: 0.5 }}>
                  No new notifications
                </Typography>
              </Box>
            ) : (
              activeNotifications.map((notif, idx) => (
                <Box
                  key={notif.id}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    borderBottom: idx < activeNotifications.length - 1 ? '1px solid rgba(230,238,248,0.6)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                      background: 'rgba(21,101,192,0.04)',
                    },
                  }}
                  onClick={() => {
                    handleDismissNotif(notif.id)
                    if (notif.type.startsWith('APPOINTMENT')) {
                      setNotifAnchor(null)
                      setTabValue(3)
                      fetchAppointments()
                    }
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: `${notif.color}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: notif.color,
                      flexShrink: 0,
                      mt: 0.3,
                    }}
                  >
                    {getNotifIcon(notif.type)}
                  </Box>
                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 7, color: notif.color }} />
                      <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.3 }}>
                        {notif.title}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#64748B', fontSize: '0.76rem', lineHeight: 1.4 }}>
                      {notif.message}
                    </Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', mt: 0.5 }}>
                      {notif.time}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Popover>

        {/* ========== NEW APPOINTMENT POPUP ========== */}
        <Dialog
          open={newApptPopupOpen}
          onClose={() => setNewApptPopupOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              overflow: 'visible',
              background: 'linear-gradient(155deg, #ffffff 0%, #F0FBF9 40%, #E8F8F5 100%)',
              boxShadow: '0 24px 60px rgba(0,150,136,0.18), 0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,191,166,0.2)',
              minWidth: { xs: 280, sm: 400 },
              maxWidth: { xs: '95vw', sm: 460 },
              animation: `${popupSlideIn} 0.5s ease-out, ${popupPulse} 2s ease-in-out 0.6s 3`,
              position: 'relative',
            },
          }}
        >
          {/* Teal accent bar */}
          <Box sx={{ height: 5, background: 'linear-gradient(90deg, #00BFA6 0%, #1565C0 100%)', borderRadius: '20px 20px 0 0' }} />

          <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2, px: 4 }}>
            {/* Animated Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00BFA6 0%, #00897B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                animation: `${popupIconBounce} 0.6s ease-out 0.2s both`,
                boxShadow: '0 8px 24px rgba(0,191,166,0.3)',
              }}
            >
              <EventNoteIcon sx={{ fontSize: 36, color: 'white' }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#004D40',
                mb: 1,
                letterSpacing: '-0.3px',
              }}
            >
              Next Appointment Scheduled
            </Typography>

            <Typography sx={{ color: '#546E7A', fontSize: '0.9rem', mb: 3, lineHeight: 1.5 }}>
              The receptionist has approved a new appointment for you
            </Typography>

            {/* Appointment Details Card */}
            {newApptData && (
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '14px',
                  p: 2.5,
                  border: '1px solid rgba(0,191,166,0.15)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, color: '#00897B', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Patient Details
                  </Typography>
                  {newApptData.queueNumber != null && (
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #00BFA6 0%, #00897B 100%)',
                        color: 'white',
                        borderRadius: '10px',
                        px: 2,
                        py: 0.5,
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        animation: `${popupQueueGlow} 2s ease-in-out infinite`,
                        boxShadow: '0 2px 8px rgba(0,191,166,0.3)',
                      }}
                    >
                      Queue #{newApptData.queueNumber}
                    </Box>
                  )}
                </Box>
                <Divider sx={{ mb: 1.5, borderColor: 'rgba(0,191,166,0.15)' }} />
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Name</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#263238', fontSize: '0.9rem' }}>{newApptData.patientName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Phone</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.9rem' }}>{newApptData.patientPhone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Date</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.9rem' }}>
                      {newApptData.appointmentDate ? new Date(newApptData.appointmentDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Time</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.9rem' }}>{newApptData.preferredTime || 'N/A'}</Typography>
                  </Grid>
                  {newApptData.reason && (
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' }}>Reason</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#37474F', fontSize: '0.88rem' }}>{newApptData.reason}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 4 }}>
            <Button
              variant="contained"
              onClick={() => {
                setNewApptPopupOpen(false)
                setTabValue(3)
                fetchAppointments()
              }}
              sx={{
                background: 'linear-gradient(135deg, #00BFA6 0%, #00897B 100%)',
                color: 'white',
                fontWeight: 700,
                borderRadius: '12px',
                px: 4,
                py: 1.2,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(0,191,166,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00D4B4 0%, #00A58C 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,191,166,0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              View Appointments
            </Button>
            <Button
              onClick={() => setNewApptPopupOpen(false)}
              sx={{
                color: '#78909C',
                fontWeight: 600,
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
              }}
            >
              Dismiss
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
    </>
  )
}

export default DoctorDashboard
