import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PlaceIcon from '@mui/icons-material/Place'
import HospitalMap from '../components/HospitalMap'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import { useAuth } from '../auth/AuthContext'
import { authAPI } from '../services/authAPI'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import { keyframes } from '@mui/system'
import VerifiedIcon from '@mui/icons-material/Verified'
import axios from 'axios'
import { BACKEND_URL, IS_NGROK } from '../api/config'

/* ══════════ PAGE LOAD ANIMATIONS ══════════ */

/* Heartbeat pulse for deactivated dialog icon */
const deactivatedHeartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.18); }
  28% { transform: scale(1); }
  42% { transform: scale(1.12); }
  56% { transform: scale(1); }
  100% { transform: scale(1); }
`

/* Deactivated dialog — icon drop-in with bounce */
const deactIconDrop = keyframes`
  0% { opacity: 0; transform: scale(0.3) translateY(-40px); }
  50% { opacity: 1; transform: scale(1.1) translateY(4px); }
  70% { transform: scale(0.95) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`

/* Deactivated dialog — text fade-slide up */
const deactTextSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
`

/* Deactivated dialog — glowing ring around icon */
const deactRingGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(21,101,192,0.25), 0 4px 20px rgba(21,101,192,0.18); }
  50% { box-shadow: 0 0 0 10px rgba(21,101,192,0), 0 4px 24px rgba(21,101,192,0.28); }
`

/* Deactivated dialog — shimmer sweep on divider */
const deactShimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

/* Deactivated dialog — button glow pulse */
const deactBtnGlow = keyframes`
  0%, 100% { box-shadow: 0 3px 12px rgba(21,101,192,0.3); }
  50% { box-shadow: 0 4px 24px rgba(21,101,192,0.55); }
`


/* Background slow zoom */
const bgSlowZoom = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
`

/* Futuristic emblem entrance */
const emblemReveal = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.4) rotate(-40deg);
    filter: blur(14px);
  }
  55% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    filter: blur(0);
  }
`

/* Ring rotation */
const ringRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

/* Slow outer ring glow pulse for emblem */
const emblemRingGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 6px rgba(100,200,255,0.15), inset 0 0 6px rgba(100,200,255,0.05);
  }
  50% {
    box-shadow: 0 0 16px rgba(100,200,255,0.35), inset 0 0 10px rgba(100,200,255,0.12);
  }
`

/* Verified text fade in */
const verifiedFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`

/* Button ripple burst */
const rippleBurst = keyframes`
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
`

/* Input focus glow — role-adaptive */
const inputFocusGlowRed = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(220,80,80,0.25); }
  50% { box-shadow: 0 0 16px rgba(220,80,80,0.4); }
`
const inputFocusGlowTeal = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(80,220,210,0.25); }
  50% { box-shadow: 0 0 16px rgba(80,220,210,0.4); }
`
const inputFocusGlowBlue = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(100,200,255,0.25); }
  50% { box-shadow: 0 0 16px rgba(100,200,255,0.4); }
`
const inputFocusGlowGreen = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(76,175,80,0.25); }
  50% { box-shadow: 0 0 16px rgba(76,175,80,0.4); }
`

/* Radar scan sweep */
const scanSweep = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

/* Login card: blur → sharp + slide up */
const cardEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.96);
    filter: blur(12px);
  }
  60% {
    opacity: 1;
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`

/* ══════════ ROLE SWITCH ANIMATIONS ══════════ */

/* Inputs fade/slide on role change */
const inputSlideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`

/* ══════════ LOGIN CLICK ANIMATIONS ══════════ */

/* Button morphs into circle loader */
const buttonMorph = keyframes`
  0% {
    width: 100%;
    border-radius: 8px;
    padding: 10.4px 0;
  }
  100% {
    width: 52px;
    border-radius: 50%;
    padding: 10.4px 0;
  }
`

/* Spinner rotation */
const spinRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

/* Medical scan line sweeps across the card */
const scanLine = keyframes`
  0% {
    top: -2px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: calc(100% + 2px);
    opacity: 0;
  }
`

/* Lock unlock: shackle lifts */
const lockUnlock = keyframes`
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  30% {
    transform: scale(1.2) translateY(0);
  }
  60% {
    transform: scale(1.2) translateY(-6px);
  }
  100% {
    transform: scale(1.3) translateY(-8px);
    opacity: 0;
  }
`

/* Lock open icon appears */
const lockOpenReveal = keyframes`
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`

/* Card shrinks into center + fades */
const cardShrinkCenter = keyframes`
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
    filter: blur(0);
  }
  60% {
    transform: scale(0.6) translateY(0);
    opacity: 0.7;
    filter: blur(2px);
  }
  100% {
    transform: scale(0.3) translateY(0);
    opacity: 0;
    filter: blur(8px);
  }
`

/* Full page fade to dark */
const pageFadeOut = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

/* Avatar flies to center and scales up */
const avatarToCenter = keyframes`
  0% {
    transform: scale(0.3);
    opacity: 0;
    filter: blur(6px);
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
    filter: blur(0);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    filter: blur(0);
  }
`

/* Glow ring pulses around avatar */
const avatarGlowRing = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(79, 195, 247, 0.6);
  }
  50% {
    box-shadow: 0 0 30px 12px rgba(79, 195, 247, 0.3);
  }
  100% {
    box-shadow: 0 0 50px 20px rgba(79, 195, 247, 0);
  }
`

/* Welcome text fades up */
const welcomeFadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

/* ══════════ IDLE ANIMATIONS ══════════ */

/* Card gently floats up/down */
const cardFloat = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
`

/* Shadow breathes slightly */
const shadowBreathe = keyframes`
  0%, 100% {
    box-shadow: 0 12px 48px rgba(0,0,0,0.45);
  }
  50% {
    box-shadow: 0 18px 60px rgba(0,0,0,0.55), 0 0 30px rgba(100,180,255,0.08);
  }
`

/* ── Card: slide in from right + blur fade ── */
const cardSlideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(60px);
    filter: blur(8px);
  }
  70% {
    opacity: 1;
    transform: translateX(-4px);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
`

/* ── Avatar scan ring: rotates once ── */
const scanRing = keyframes`
  0% {
    transform: rotate(0deg);
    border-color: rgba(100,200,255,0.7) transparent rgba(100,200,255,0.7) transparent;
  }
  100% {
    transform: rotate(360deg);
    border-color: rgba(100,200,255,0) transparent rgba(100,200,255,0) transparent;
  }
`

/* ── Avatar fade-in after scan ── */
const avatarReveal = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

/* ── Name text: fade-in + slight upward motion ── */
const nameFadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

/* ── Verified badge pop ── */
const badgePop = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  60% {
    opacity: 1;
    transform: scale(1.15);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

/* ── Idle: slow floating ── */
const floatIdle = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
`

/* ── Map pin bounce animation ── */
const mapPinBounce = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  20% { transform: translateY(-10px) scale(1.05); }
  40% { transform: translateY(0) scale(1); }
  60% { transform: translateY(-5px) scale(1.02); }
  80% { transform: translateY(0) scale(1); }
`

const mapPinPulse = keyframes`
  0%, 100% { box-shadow: 0 4px 15px rgba(229,57,53,0.3), 0 0 0 0 rgba(229,57,53,0.4); }
  50% { box-shadow: 0 4px 20px rgba(229,57,53,0.5), 0 0 0 10px rgba(229,57,53,0); }
`

const mapPinSlideIn = keyframes`
  0% { opacity: 0; transform: translateY(60px) scale(0.5); }
  60% { opacity: 1; transform: translateY(-8px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

/* ── Idle: heartbeat pulse on avatar border ── */
const heartbeatPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(100,200,255,0);
    border-color: rgba(255,255,255,0.5);
  }
  15% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 14px 4px rgba(100,200,255,0.35);
    border-color: rgba(100,200,255,0.7);
  }
  30% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(100,200,255,0);
    border-color: rgba(255,255,255,0.5);
  }
  45% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 10px 3px rgba(100,200,255,0.25);
    border-color: rgba(100,200,255,0.5);
  }
  60% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(100,200,255,0);
    border-color: rgba(255,255,255,0.5);
  }
`

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

const patientApi = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  withCredentials: !BACKEND_URL,
  ...(IS_NGROK && {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  }),
})

const LoginPage = () => {
  // Admin state
  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  // Patient state
  const [patientId, setPatientId] = useState('')
  const [patientPassword, setPatientPassword] = useState('')
  // Doctor state
  const [doctorId, setDoctorId] = useState('')
  const [doctorPassword, setDoctorPassword] = useState('')
  // Reception state
  const [receptionId, setReceptionId] = useState('')
  const [receptionPassword, setReceptionPassword] = useState('')
  // Loading states
  const [loadingRole, setLoadingRole] = useState<'admin' | 'patient' | 'doctor' | 'reception' | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'patient' | 'doctor' | 'reception'>('patient')
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetStep, setResetStep] = useState<1 | 2>(1)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Deactivated account dialog state
  const [deactivatedOpen, setDeactivatedOpen] = useState(false)
  const [deactivatedDoctorName, setDeactivatedDoctorName] = useState('')

  // Doctor preview state
  const [doctorPreview, setDoctorPreview] = useState<{ fullName: string; specialization: string; designation: string; hasAvatar: boolean } | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now())
  const [loginShrinking, setLoginShrinking] = useState(false)
  const [pageExiting, setPageExiting] = useState(false)
  const [loginPhase, setLoginPhase] = useState<'idle' | 'morph' | 'scan' | 'unlock' | 'avatar' | 'portal'>('idle')
  const [roleKey, setRoleKey] = useState(0)
  const [isIdle, setIsIdle] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 5000)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
    const handler = () => resetIdleTimer()
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    // Start the initial idle timer
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 5000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdleTimer])

  const navigate = useNavigate()
  const { login } = useAuth()

  const fetchDoctorPreview = async (username: string) => {
    if (!username.trim()) {
      setDoctorPreview(null)
      return
    }
    try {
      const res = await patientApi.get(`/auth/doctor-preview/${username.trim()}`)
      if (res.data?.found) {
        setDoctorPreview({ fullName: res.data.fullName, specialization: res.data.specialization, designation: res.data.designation || '', hasAvatar: res.data.hasAvatar })
        setAvatarTimestamp(Date.now())
      } else {
        setDoctorPreview(null)
      }
    } catch {
      setDoctorPreview(null)
    } finally {
    }
  }

  const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const handleVerifyIdentity = async () => {
    setResetLoading(true)
    try {
      if (selectedRole === 'patient') {
        await patientApi.post('/auth/patient/verify-mobile', { mobile: resetIdentifier.trim() })
      } else {
        await patientApi.post('/auth/verify-username', { username: resetIdentifier.trim() })
      }
      setResetStep(2)
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
        (selectedRole === 'patient'
          ? 'No patient found with this mobile number'
          : 'No account found with this username')
      showSnackbar(msg, 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('Passwords do not match', 'error')
      return
    }
    setResetLoading(true)
    try {
      if (selectedRole === 'patient') {
        await patientApi.post('/auth/patient/reset-password', { mobile: resetIdentifier.trim(), newPassword })
      } else {
        await patientApi.post('/auth/reset-password', { username: resetIdentifier.trim(), newPassword })
      }
      setForgotOpen(false)
      showSnackbar('Password has been reset successfully! You can now log in with your new password.', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password. Please try again.'
      showSnackbar(msg, 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!adminId || !adminPassword) {
      showSnackbar('Please enter both Admin ID and Password', 'warning')
      return
    }
    try {
      setLoginPhase('morph')
      setLoadingRole('admin')
      const response = await authAPI.login({ username: adminId, password: adminPassword })
      const { token, role, username, fullName, specialization, designation } = response.data
      login({ token, role, username, fullName, specialization, designation })
      // Phase: morph(0) -> scan(600) -> unlock(1400) -> avatar(2200) -> portal(3000) -> navigate(3800)
      setTimeout(() => setLoginPhase('scan'), 600)
      setTimeout(() => setLoginPhase('unlock'), 1400)
      setTimeout(() => { setLoginPhase('avatar'); setLoginShrinking(true) }, 2200)
      setTimeout(() => { setLoginPhase('portal'); setPageExiting(true) }, 3000)
      setTimeout(() => navigate('/admin/dashboard'), 3800)
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Login failed. Please try again.', 'error')
      setLoginShrinking(false)
      setLoginPhase('idle')
    } finally {
      setLoadingRole(null)
    }
  }

  const handlePatientLogin = async () => {
    if (!patientId) {
      showSnackbar('Mobile Number is required', 'warning')
      return
    }
    if (!patientPassword) {
      showSnackbar('Password is required', 'warning')
      return
    }
    try {
      setLoginPhase('morph')
      setLoadingRole('patient')
      const response = await patientApi.post('/auth/patient/login', {
        patientLoginId: patientId.trim().replace(/\D/g, ''),
        patientPassword: patientPassword.trim(),
      })
      login({
        token: 'patient-' + response.data.patientLoginId,
        role: response.data.role || 'PATIENT',
        username: response.data.patientLoginId,
      })
      localStorage.setItem('patientData', JSON.stringify(response.data))
      localStorage.setItem('patientId', response.data.patientLoginId || '')
      setTimeout(() => setLoginPhase('scan'), 600)
      setTimeout(() => setLoginPhase('unlock'), 1400)
      setTimeout(() => { setLoginPhase('avatar'); setLoginShrinking(true) }, 2200)
      setTimeout(() => { setLoginPhase('portal'); setPageExiting(true) }, 3000)
      setTimeout(() => navigate('/patient/dashboard'), 3800)
    } catch (err: any) {
      if (err.response?.status === 401) {
        showSnackbar('Invalid Mobile Number or Password', 'error')
      } else if (err.response?.status === 404) {
        showSnackbar('Patient account not found', 'error')
      } else {
        showSnackbar(err.response?.data?.message || 'Login failed.', 'error')
      }
      setLoginShrinking(false)
      setLoginPhase('idle')
    } finally {
      setLoadingRole(null)
    }
  }

  const handleDoctorLogin = async () => {
    if (!doctorId || !doctorPassword) {
      showSnackbar('Please enter both Doctor ID and Password', 'warning')
      return
    }
    try {
      setLoginPhase('morph')
      setLoadingRole('doctor')
      const response = await authAPI.login({ username: doctorId, password: doctorPassword })
      const { token, role, username, fullName, specialization, designation } = response.data
      login({ token, role, username, fullName, specialization, designation })
      setTimeout(() => setLoginPhase('scan'), 600)
      setTimeout(() => setLoginPhase('unlock'), 1400)
      setTimeout(() => { setLoginPhase('avatar'); setLoginShrinking(true) }, 2200)
      setTimeout(() => { setLoginPhase('portal'); setPageExiting(true) }, 3000)
      setTimeout(() => navigate('/doctor/dashboard?welcome=1'), 3800)
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.message === 'ACCOUNT_DEACTIVATED') {
        setDeactivatedDoctorName(err.response?.data?.fullName || 'Doctor')
        setDeactivatedOpen(true)
      } else {
        showSnackbar(err.response?.data?.message || 'Login failed. Please try again.', 'error')
      }
      setLoginShrinking(false)
      setLoginPhase('idle')
    } finally {
      setLoadingRole(null)
    }
  }

  const handleReceptionLogin = async () => {
    if (!receptionId || !receptionPassword) {
      showSnackbar('Please enter both Reception ID and Password', 'warning')
      return
    }
    try {
      setLoginPhase('morph')
      setLoadingRole('reception')
      const response = await authAPI.login({ username: receptionId, password: receptionPassword })
      const { token, role, username, fullName } = response.data
      login({ token, role, username, fullName })
      setTimeout(() => setLoginPhase('scan'), 600)
      setTimeout(() => setLoginPhase('unlock'), 1400)
      setTimeout(() => { setLoginPhase('avatar'); setLoginShrinking(true) }, 2200)
      setTimeout(() => { setLoginPhase('portal'); setPageExiting(true) }, 3000)
      setTimeout(() => navigate('/receptionist/dashboard'), 3800)
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Login failed. Please try again.', 'error')
      setLoginShrinking(false)
      setLoginPhase('idle')
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Avatar center + page transition overlay */}
      {(loginPhase === 'avatar' || pageExiting) && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: pageExiting
              ? 'radial-gradient(circle at center, #0a1929 0%, #000 100%)'
              : 'radial-gradient(circle at center, rgba(10,25,41,0.85) 0%, rgba(0,0,0,0.92) 100%)',
            animation: pageExiting
              ? `${pageFadeOut} 0.6s ease-in both`
              : `${pageFadeOut} 0.3s ease-out both`,
          }}
        >
          {/* Avatar / role icon */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              animation: `${avatarToCenter} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both, ${avatarGlowRing} 1.2s 0.4s ease-out both`,
              border: '3px solid rgba(79, 195, 247, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: selectedRole === 'doctor' && doctorPreview?.hasAvatar
                ? 'transparent'
                : 'rgba(255,255,255,0.1)',
            }}
          >
            {selectedRole === 'doctor' && doctorPreview?.hasAvatar ? (
              <Box
                component="img"
                src={`${BACKEND_URL}/api/auth/avatar/${doctorId.trim()}?t=${avatarTimestamp}`}
                alt="Doctor"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : selectedRole === 'doctor' ? (
              <PersonIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.7)' }} />
            ) : selectedRole === 'admin' ? (
              <SettingsIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.7)' }} />
            ) : (
              <LocalHospitalIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.7)' }} />
            )}
          </Box>
          {/* Welcome text */}
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.1rem',
              mt: 2,
              letterSpacing: 1,
              animation: `${welcomeFadeUp} 0.4s 0.4s ease-out both`,
            }}
          >
            {selectedRole === 'doctor' && doctorPreview?.fullName
              ? `Welcome, Dr. ${doctorPreview.fullName}`
              : selectedRole === 'admin'
                ? 'Welcome, Admin'
                : 'Welcome back'}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.8rem',
              mt: 0.5,
              letterSpacing: 2,
              textTransform: 'uppercase',
              animation: `${welcomeFadeUp} 0.4s 0.6s ease-out both`,
            }}
          >
            Loading dashboard...
          </Typography>
        </Box>
      )}
      {/* Main content area with background */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a1929',
          overflow: 'hidden',
        }}
      >
        {/* Hospital building background image overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/get.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 65%',
            opacity: 0.65,
            zIndex: 0,
            animation: `${bgSlowZoom} 25s ease-in-out infinite alternate`,
            willChange: 'transform',
          }}
        />
        {/* Subtle dark overlay for readability */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,25,41,0.3) 0%, rgba(10,25,41,0.2) 40%, rgba(10,25,41,0.25) 70%, rgba(10,25,41,0.5) 100%)',
            zIndex: 1,
          }}
        />
        {/* Radial spotlight darkening behind card for depth */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 500px 600px at 50% 45%, rgba(0,0,0,0.35) 0%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Role-based ambient color overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            opacity: 0.18,
            transition: 'background 0.8s ease',
            background: selectedRole === 'patient'
              ? 'radial-gradient(ellipse at 50% 80%, rgba(14,160,160,0.7) 0%, transparent 70%)'
              : selectedRole === 'doctor'
                ? 'radial-gradient(ellipse at 50% 80%, rgba(30,80,180,0.7) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at 50% 80%, rgba(160,30,30,0.7) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header / Logo - Top Left */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, zIndex: 3, display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1 }}>
          <Box
            component="img"
            src="/cu-logo.png"
            alt="CU Logo"
            sx={{
              width: 42,
              height: 42,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
            }}
          />
        </Box>

        {/* Single Unified Login Card */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 2, md: 3 },
            px: { xs: 1, sm: 2 },
            mt: { xs: 1, md: 2 },
            mb: 2,
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: { xs: '95%', sm: 420, md: 440 },
              minHeight: { xs: 'auto', sm: 520 },
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.15)',
              animation: loginShrinking
                ? `${cardShrinkCenter} 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                : loginPhase !== 'idle'
                  ? `${cardEntrance} 0.8s cubic-bezier(0.25, 1, 0.5, 1) both`
                  : isIdle
                    ? `${cardEntrance} 0.8s cubic-bezier(0.25, 1, 0.5, 1) both, ${cardFloat} 4s ease-in-out infinite, ${shadowBreathe} 4s ease-in-out infinite`
                    : `${cardEntrance} 0.8s cubic-bezier(0.25, 1, 0.5, 1) both`,
              transition: 'transform 0.3s ease, opacity 0.3s ease',
            }}
          >
            {/* Role Header Bar */}
            <Box
              sx={{
                background: selectedRole === 'admin'
                  ? 'linear-gradient(135deg, #7a1b1b 0%, #5a1414 100%)'
                  : selectedRole === 'patient'
                    ? 'linear-gradient(135deg, #0e7c7b 0%, #095e5e 100%)'
                    : selectedRole === 'reception'
                      ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
                      : 'linear-gradient(135deg, #122c52 0%, #091e3a 100%)',
                py: 1.2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                transition: 'background 0.3s ease',
              }}
            >
              {selectedRole === 'admin' && <SettingsIcon sx={{ color: '#fff', fontSize: 28 }} />}
              {selectedRole === 'patient' && <LocalHospitalIcon sx={{ color: '#fff', fontSize: 28 }} />}
              {selectedRole === 'doctor' && <PersonIcon sx={{ color: '#fff', fontSize: 28 }} />}
              {selectedRole === 'reception' && <SupportAgentIcon sx={{ color: '#fff', fontSize: 28 }} />}
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  fontFamily: '"Georgia", serif',
                }}
              >
                {selectedRole === 'admin' ? 'Admin Login' : selectedRole === 'patient' ? 'Patient Login' : selectedRole === 'reception' ? 'Reception Login' : 'Doctor Login'}
              </Typography>
            </Box>

            {/* Role Selector Tabs — with sliding indicator */}
            <Box sx={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <Box sx={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                {[
                  { key: 'admin' as const, label: 'Admin', icon: <SettingsIcon sx={{ fontSize: 18 }} />, color: '#7a1b1b' },
                  { key: 'patient' as const, label: 'Patient', icon: <LocalHospitalIcon sx={{ fontSize: 18 }} />, color: '#0e7c7b' },
                  { key: 'doctor' as const, label: 'Doctor', icon: <PersonIcon sx={{ fontSize: 18 }} />, color: '#122c52' },
                  { key: 'reception' as const, label: 'Reception', icon: <SupportAgentIcon sx={{ fontSize: 18 }} />, color: '#2e7d32' },
                ].map((tab) => (
                  <Box
                    key={tab.key}
                    onClick={() => { setSelectedRole(tab.key); setDoctorPreview(null); setRoleKey(prev => prev + 1) }}
                    sx={{
                      flex: 1,
                      py: { xs: 1, sm: 1.5 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: { xs: 0.3, sm: 0.8 },
                      cursor: 'pointer',
                      color: selectedRole === tab.key ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontWeight: selectedRole === tab.key ? 700 : 500,
                      fontSize: { xs: '0.72rem', sm: '0.88rem' },
                      transition: 'color 0.35s ease, font-weight 0.35s ease',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        color: selectedRole === tab.key ? '#fff' : 'rgba(255,255,255,0.7)',
                      },
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </Box>
                ))}
              </Box>
              {/* Sliding indicator bar */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: selectedRole === 'admin' ? '0%' : selectedRole === 'patient' ? '25%' : selectedRole === 'doctor' ? '50%' : '75%',
                width: '25%',
                height: '3px',
                borderRadius: '3px 3px 0 0',
                background: selectedRole === 'admin'
                  ? 'linear-gradient(90deg, #a02828, #7a1b1b)'
                  : selectedRole === 'patient'
                    ? 'linear-gradient(90deg, #1ba3a3, #0e7c7b)'
                    : selectedRole === 'reception'
                      ? 'linear-gradient(90deg, #43a047, #2e7d32)'
                      : 'linear-gradient(90deg, #1e4c82, #122c52)',
                boxShadow: selectedRole === 'admin'
                  ? '0 0 8px rgba(160,40,40,0.5)'
                  : selectedRole === 'patient'
                    ? '0 0 8px rgba(27,163,163,0.5)'
                    : selectedRole === 'reception'
                      ? '0 0 8px rgba(67,160,71,0.5)'
                      : '0 0 8px rgba(30,76,130,0.5)',
                transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s ease, box-shadow 0.35s ease',
                zIndex: 2,
              }} />
              {/* Active tab background glow */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: selectedRole === 'admin' ? '0%' : selectedRole === 'patient' ? '25%' : selectedRole === 'doctor' ? '50%' : '75%',
                width: '25%',
                background: selectedRole === 'admin'
                  ? 'rgba(122,27,27,0.3)'
                  : selectedRole === 'patient'
                    ? 'rgba(14,124,123,0.3)'
                    : selectedRole === 'reception'
                      ? 'rgba(46,125,50,0.3)'
                      : 'rgba(18,44,82,0.3)',
                transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s ease',
                zIndex: 0,
              }} />
            </Box>

            {/* Medical scan line */}
            {loginPhase === 'scan' && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  zIndex: 10,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(100,200,255,0.8) 30%, rgba(100,255,180,0.9) 50%, rgba(100,200,255,0.8) 70%, transparent 100%)',
                  boxShadow: '0 0 12px 3px rgba(100,200,255,0.4)',
                  animation: `${scanLine} 0.8s ease-in-out forwards`,
                }}
              />
            )}

            {/* Lock unlock animation overlay */}
            {(loginPhase === 'unlock' || loginPhase === 'portal') && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 'inherit',
                }}
              >
                {loginPhase === 'unlock' && (
                  <>
                    <LockIcon
                      sx={{
                        fontSize: 44,
                        color: 'rgba(255,255,255,0.9)',
                        animation: `${lockUnlock} 0.7s ease-out forwards`,
                      }}
                    />
                    <LockOpenIcon
                      sx={{
                        fontSize: 44,
                        color: '#4fc3f7',
                        position: 'absolute',
                        animation: `${lockOpenReveal} 0.5s 0.5s ease-out both`,
                      }}
                    />
                    <Typography
                      sx={{
                        color: '#4fc3f7',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        mt: 1.5,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        animation: `${lockOpenReveal} 0.4s 0.6s ease-out both`,
                      }}
                    >
                      Access Granted
                    </Typography>
                  </>
                )}
                {loginPhase === 'portal' && (
                  <Typography
                    sx={{
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      opacity: 0.8,
                    }}
                  >
                    Entering Portal...
                  </Typography>
                )}
              </Box>
            )}

            {/* ═══ Emblem badge — in-flow, role-colored ═══ */}
            {(() => {
              // Role-adaptive emblem colors
              const ec = selectedRole === 'admin'
                ? { r: 220, g: 80, b: 80, bg1: 'rgba(100,20,20,0.5)', bg2: 'rgba(60,12,12,0.7)', bg3: 'rgba(35,8,8,0.9)' }
                : selectedRole === 'patient'
                  ? { r: 80, g: 220, b: 210, bg1: 'rgba(14,100,100,0.5)', bg2: 'rgba(8,60,58,0.7)', bg3: 'rgba(4,35,33,0.9)' }
                  : selectedRole === 'reception'
                    ? { r: 76, g: 175, b: 80, bg1: 'rgba(30,80,30,0.5)', bg2: 'rgba(18,50,18,0.7)', bg3: 'rgba(10,30,10,0.9)' }
                    : { r: 100, g: 200, b: 255, bg1: 'rgba(20,60,140,0.5)', bg2: 'rgba(8,25,60,0.7)', bg3: 'rgba(4,12,40,0.9)' };
              const accent = `rgba(${ec.r},${ec.g},${ec.b}`;
              return (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 1,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle horizontal divider */}
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: 24,
                right: 24,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 80%, transparent)',
                zIndex: 0,
              }} />
              {/* Emblem container */}
              <Box sx={{
                position: 'relative',
                width: 80,
                height: 80,
                flexShrink: 0,
                zIndex: 1,
                opacity: 0.13,
                animation: `${emblemReveal} 2s cubic-bezier(0.16, 1, 0.3, 1) both`,
                animationDelay: '0.3s',
              }}>
                {/* Rotating dashed ring */}
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: `1.5px dashed ${accent},0.7)`,
                  animation: `${ringRotate} 40s linear infinite`,
                  transition: 'border-color 0.5s ease',
                }} />
                {/* Main emblem circle */}
                <Box sx={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 40% 40%, ${ec.bg1} 0%, ${ec.bg2} 55%, ${ec.bg3} 100%)`,
                  border: `1.5px solid ${accent},0.4)`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: `inset 0 2px 10px rgba(0,0,0,0.3), inset 0 -2px 6px ${accent},0.08)`,
                  overflow: 'hidden',
                  animation: `${emblemRingGlow} 3s ease-in-out infinite`,
                  transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
                }}>
                  {/* Radar sweep */}
                  <Box sx={{
                    position: 'absolute',
                    width: '50%',
                    height: '1.5px',
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0% 50%',
                    background: `linear-gradient(90deg, ${accent},1), ${accent},0.3), transparent)`,
                    animation: `${scanSweep} 5s linear infinite`,
                    transition: 'background 0.5s ease',
                  }} />
                  {/* SVG overlay */}
                  <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    <defs>
                      <path id="bgTitleCircle" d="M 100,180 A 80,80 0 0,1 100,20 A 80,80 0 0,1 100,180" fill="none" />
                      <path id="bgBottomArc" d="M 10,100 A 90,90 0 0,0 190,100" fill="none" />
                    </defs>
                    {/* Tick marks */}
                    <circle cx="100" cy="100" r="95" fill="none" stroke={`${accent},0.5)`} strokeWidth="5" strokeDasharray="1 14.36" />
                    <circle cx="100" cy="100" r="95" fill="none" stroke={`${accent},0.7)`} strokeWidth="8" strokeDasharray="1.5 48.24" />
                    {/* Crosshairs */}
                    <line x1="100" y1="32" x2="100" y2="50" stroke={`${accent},0.5)`} strokeWidth="1" />
                    <line x1="100" y1="150" x2="100" y2="168" stroke={`${accent},0.5)`} strokeWidth="1" />
                    <line x1="32" y1="100" x2="50" y2="100" stroke={`${accent},0.5)`} strokeWidth="1" />
                    <line x1="150" y1="100" x2="168" y2="100" stroke={`${accent},0.5)`} strokeWidth="1" />
                    {/* Inner ring */}
                    <circle cx="100" cy="100" r="55" fill="none" stroke={`${accent},0.3)`} strokeWidth="0.7" />
                    {/* Curved text */}
                    <text fill={`${accent},0.9)`} fontSize="16" fontWeight="900" letterSpacing="2" fontFamily="Georgia, serif">
                      <textPath href="#bgTitleCircle" startOffset="50%" textAnchor="middle">
                        CHANDIGARH UNIVERSITY HOSPITAL
                      </textPath>
                    </text>
                  </svg>
                  {/* Center icon */}
                  <LocalHospitalIcon sx={{ fontSize: 18, color: `${accent},0.9)`, zIndex: 1  }} />
                </Box>
              </Box>
              {/* "Secure Access" text below emblem */}
              <Typography sx={{
                mt: 0.5,
                fontSize: '0.55rem',
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: '"Georgia", serif',
                animation: `${verifiedFadeIn} 0.8s 1.2s ease-out both`,
              }}>
                {selectedRole === 'admin' ? '⚠ Administrative Access Only' : 'Secure Access Verified'}
              </Typography>
            </Box>
              );
            })()}

            {/* Form Content */}
            <Box sx={{ position: 'relative', px: 3, pb: 1.5, pt: 0 }}>
              {/* Form fields wrapper */}
              <Box key={roleKey} sx={{ position: 'relative', zIndex: 1, animation: `${inputSlideIn} 0.35s ease-out both` }}>
              {/* Username / ID Field */}
              <TextField
                fullWidth
                placeholder={selectedRole === 'admin' ? 'Admin ID' : selectedRole === 'patient' ? 'Mobile Number' : selectedRole === 'reception' ? 'Reception ID' : 'Doctor ID'}
                variant="outlined"
                size="small"
                value={selectedRole === 'admin' ? adminId : selectedRole === 'patient' ? patientId : selectedRole === 'reception' ? receptionId : doctorId}
                onChange={(e) => {
                  if (selectedRole === 'admin') setAdminId(e.target.value)
                  else if (selectedRole === 'patient') setPatientId(e.target.value)
                  else if (selectedRole === 'reception') setReceptionId(e.target.value)
                  else {
                    const val = e.target.value
                    setDoctorId(val)
                    // Auto-fetch doctor preview with debounce
                    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
                    if (val.trim().length >= 3) {
                      previewTimerRef.current = setTimeout(() => fetchDoctorPreview(val), 500)
                    } else {
                      setDoctorPreview(null)
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (selectedRole === 'admin') handleAdminLogin()
                    else if (selectedRole === 'patient') handlePatientLogin()
                    else if (selectedRole === 'reception') handleReceptionLogin()
                    else handleDoctorLogin()
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'rgba(255,255,255,0.6)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    color: '#fff',
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused': {
                      background: selectedRole === 'admin' ? 'rgba(220,80,80,0.04)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.04)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.04)' : 'rgba(100,180,255,0.04)',
                      '& fieldset': {
                        borderColor: selectedRole === 'admin' ? 'rgba(220,80,80,0.7)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.7)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.7)' : 'rgba(100,200,255,0.7)',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': {
                      color: selectedRole === 'admin' ? 'rgba(220,80,80,0.9)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.9)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.9)' : 'rgba(100,200,255,0.9)',
                      filter: selectedRole === 'admin' ? 'drop-shadow(0 0 4px rgba(220,80,80,0.4))' : selectedRole === 'patient' ? 'drop-shadow(0 0 4px rgba(80,220,210,0.4))' : selectedRole === 'reception' ? 'drop-shadow(0 0 4px rgba(76,175,80,0.4))' : 'drop-shadow(0 0 4px rgba(100,200,255,0.4))',
                    },
                  },
                  '& .MuiOutlinedInput-root.Mui-focused': {
                    animation: `${selectedRole === 'admin' ? inputFocusGlowRed : selectedRole === 'patient' ? inputFocusGlowTeal : selectedRole === 'reception' ? inputFocusGlowGreen : inputFocusGlowBlue} 2s ease-in-out infinite`,
                    borderRadius: '8px',
                  },
                  '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                placeholder="Password"
                type="password"
                variant="outlined"
                size="small"
                value={selectedRole === 'admin' ? adminPassword : selectedRole === 'patient' ? patientPassword : selectedRole === 'reception' ? receptionPassword : doctorPassword}
                onChange={(e) => {
                  if (selectedRole === 'admin') setAdminPassword(e.target.value)
                  else if (selectedRole === 'patient') setPatientPassword(e.target.value)
                  else if (selectedRole === 'reception') setReceptionPassword(e.target.value)
                  else setDoctorPassword(e.target.value)
                }}
                onFocus={() => {
                  if (selectedRole === 'doctor' && doctorId.trim().length >= 3 && !doctorPreview) {
                    fetchDoctorPreview(doctorId)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (selectedRole === 'admin') handleAdminLogin()
                    else if (selectedRole === 'patient') handlePatientLogin()
                    else if (selectedRole === 'reception') handleReceptionLogin()
                    else handleDoctorLogin()
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'rgba(255,255,255,0.6)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    color: '#fff',
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused': {
                      background: selectedRole === 'admin' ? 'rgba(220,80,80,0.04)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.04)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.04)' : 'rgba(100,180,255,0.04)',
                      '& fieldset': {
                        borderColor: selectedRole === 'admin' ? 'rgba(220,80,80,0.7)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.7)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.7)' : 'rgba(100,200,255,0.7)',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': {
                      color: selectedRole === 'admin' ? 'rgba(220,80,80,0.9)' : selectedRole === 'patient' ? 'rgba(80,220,210,0.9)' : selectedRole === 'reception' ? 'rgba(76,175,80,0.9)' : 'rgba(100,200,255,0.9)',
                      filter: selectedRole === 'admin' ? 'drop-shadow(0 0 4px rgba(220,80,80,0.4))' : selectedRole === 'patient' ? 'drop-shadow(0 0 4px rgba(80,220,210,0.4))' : selectedRole === 'reception' ? 'drop-shadow(0 0 4px rgba(76,175,80,0.4))' : 'drop-shadow(0 0 4px rgba(100,200,255,0.4))',
                    },
                  },
                  '& .MuiOutlinedInput-root.Mui-focused': {
                    animation: `${selectedRole === 'admin' ? inputFocusGlowRed : selectedRole === 'patient' ? inputFocusGlowTeal : selectedRole === 'reception' ? inputFocusGlowGreen : inputFocusGlowBlue} 2s ease-in-out infinite`,
                    borderRadius: '8px',
                  },
                  '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
                }}
              />

              {/* Login Button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  fullWidth={loginPhase === 'idle'}
                  variant="contained"
                  onClick={() => {
                    if (selectedRole === 'admin') handleAdminLogin()
                    else if (selectedRole === 'patient') handlePatientLogin()
                    else if (selectedRole === 'reception') handleReceptionLogin()
                    else handleDoctorLogin()
                  }}
                  disabled={loadingRole !== null}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: loginPhase !== 'idle' ? 52 : undefined,
                    background: selectedRole === 'admin'
                      ? 'linear-gradient(135deg, #7a1b1b 0%, #5a1414 100%)'
                      : selectedRole === 'patient'
                        ? 'linear-gradient(135deg, #0e7c7b 0%, #095e5e 100%)'
                        : selectedRole === 'reception'
                          ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
                          : 'linear-gradient(135deg, #122c52 0%, #091e3a 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    py: 1.3,
                    borderRadius: loginPhase !== 'idle' ? '50%' : '8px',
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    ...(loginPhase !== 'idle' && {
                      width: 52,
                      minHeight: 52,
                      padding: 0,
                      animation: `${buttonMorph} 0.5s cubic-bezier(0.4, 0, 0.2, 1) both`,
                    }),
                    '&:hover': loginPhase === 'idle' ? {
                      opacity: 0.92,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                      transform: 'translateY(-2px)',
                    } : {},
                    '&:active': loginPhase === 'idle' ? {
                      transform: 'scale(0.93) translateY(2px)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      transition: 'all 0.08s ease',
                    } : {},
                    /* Ripple overlay */
                    '&::after': loginPhase === 'idle' ? {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    } : {},
                    '&:active::after': loginPhase === 'idle' ? {
                      opacity: 1,
                      animation: `${rippleBurst} 0.5s ease-out`,
                    } : {},
                  }}
                >
                  {loginPhase !== 'idle' ? (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: `${spinRotate} 0.8s linear infinite`,
                      }}
                    />
                  ) : 'Login'}
                </Button>
              </Box>

              {/* Bottom Links */}
              <Box sx={{ textAlign: 'center', mt: 1.5, minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {/* Forgot Password - shown for all roles */}
                <Typography
                  onClick={() => { setResetIdentifier(''); setResetStep(1); setNewPassword(''); setConfirmPassword(''); setForgotOpen(true) }}
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    mb: 0.8,
                    position: 'relative',
                    display: 'inline-block',
                    transition: 'color 0.3s ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -1,
                      left: '50%',
                      width: 0,
                      height: '1px',
                      background: 'rgba(255,255,255,0.8)',
                      transition: 'width 0.3s ease, left 0.3s ease',
                    },
                    '&:hover': {
                      color: 'rgba(255,255,255,0.9)',
                      '&::after': { width: '100%', left: 0 },
                    },
                  }}
                >
                  Forgot Password?
                </Typography>

                {/* Registration links */}
                {selectedRole === 'patient' && (
                  <Typography
                    component="a"
                    href="/patient-register"
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      position: 'relative',
                      transition: 'color 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: '50%',
                        width: 0,
                        height: '1.5px',
                        background: '#fff',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '& .link-arrow': {
                        display: 'inline-block',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover': {
                        color: '#fff',
                        '&::after': { width: '100%', left: 0 },
                        '& .link-arrow': { transform: 'translateX(4px)' },
                      },
                    }}
                  >
                    Register as New Patient <span className="link-arrow">&rsaquo;</span>
                  </Typography>
                )}
                {selectedRole === 'doctor' && (
                  <Typography
                    component="a"
                    href="/doctor-register"
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      position: 'relative',
                      transition: 'color 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: '50%',
                        width: 0,
                        height: '1.5px',
                        background: '#fff',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '& .link-arrow': {
                        display: 'inline-block',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover': {
                        color: '#fff',
                        '&::after': { width: '100%', left: 0 },
                        '& .link-arrow': { transform: 'translateX(4px)' },
                      },
                    }}
                  >
                    Register as New Doctor <span className="link-arrow">&rsaquo;</span>
                  </Typography>
                )}
                {selectedRole === 'reception' && (
                  <Typography
                    onClick={() => setSelectedRole('admin')}
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      position: 'relative',
                      transition: 'color 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: '50%',
                        width: 0,
                        height: '1.5px',
                        background: '#fff',
                        transition: 'width 0.3s ease, left 0.3s ease',
                      },
                      '& .link-arrow': {
                        display: 'inline-block',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover': {
                        color: '#fff',
                        '&::after': { width: '100%', left: 0 },
                        '& .link-arrow': { transform: 'translateX(4px)' },
                      },
                    }}
                  >
                    Register as Receptionist (Admin) <span className="link-arrow">&rsaquo;</span>
                  </Typography>
                )}
              </Box>
              </Box>{/* End form fields wrapper */}

              {/* Trust / Security Footer */}
              <Box sx={{
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.6,
              }}>
                <LockIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} />
                <Typography sx={{
                  fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: 0.8,
                  fontWeight: 500,
                }}>
                  Encrypted Hospital Authentication &bull; HIPAA-Compliant Security
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Doctor Avatar Preview Panel */}
          {selectedRole === 'doctor' && doctorPreview && (
            <Box
              key={doctorId.trim()}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                p: { xs: 2, sm: 3 },
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
                minWidth: { xs: 'auto', sm: 180 },
                width: { xs: '95%', sm: 'auto' },
                animation: `${cardSlideIn} 0.6s cubic-bezier(0.25, 1, 0.5, 1) both, ${floatIdle} 3s 2s ease-in-out infinite`,
              }}
            >
              {/* Scan ring wrapper */}
              <Box sx={{ position: 'relative', width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 } }}>
                {/* Rotating scan ring */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: '3px solid transparent',
                    borderTopColor: 'rgba(100,200,255,0.7)',
                    borderBottomColor: 'rgba(100,200,255,0.7)',
                    animation: `${scanRing} 0.8s 0.3s cubic-bezier(0.4, 0, 0.2, 1) both`,
                  }}
                />
                {/* Avatar image or fallback */}
                {doctorPreview?.hasAvatar ? (
                  <Box
                    component="img"
                    src={`${BACKEND_URL}/api/auth/avatar/${doctorId.trim()}?t=${avatarTimestamp}`}
                    alt="Doctor Avatar"
                    sx={{
                      width: { xs: 72, sm: 110 },
                      height: { xs: 72, sm: 110 },
                      borderRadius: '50%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 5,
                      left: 5,
                      border: '3px solid rgba(255,255,255,0.5)',
                      animation: `${avatarReveal} 0.5s 0.6s ease-out both, ${heartbeatPulse} 3s 2s ease-in-out infinite`,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: { xs: 72, sm: 110 },
                      height: { xs: 72, sm: 110 },
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      top: 5,
                      left: 5,
                      border: '3px solid rgba(255,255,255,0.5)',
                      animation: `${avatarReveal} 0.5s 0.6s ease-out both, ${heartbeatPulse} 3s 2s ease-in-out infinite`,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.6)' }} />
                  </Box>
                )}
              </Box>

              {/* Doctor name */}
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  fontFamily: '"Georgia", serif',
                  textAlign: 'center',
                  textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                  animation: `${nameFadeUp} 0.4s 1.0s ease-out both`,
                }}
              >
                {doctorPreview?.fullName}
              </Typography>

              {/* Designation & Specialization */}
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  animation: `${nameFadeUp} 0.4s 1.15s ease-out both`,
                }}
              >
                {[doctorPreview?.designation, doctorPreview?.specialization].filter(Boolean).join(', ')}
              </Typography>

              {/* Verified Specialist badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  animation: `${badgePop} 0.3s 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                }}
              >
                <VerifiedIcon sx={{ fontSize: 16, color: '#4fc3f7' }} />
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: '#4fc3f7',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Verified Specialist
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)',
          py: 2,
          px: 3,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
          &copy; 2026 Chandigarh University Hospital
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>|</Typography>
        <Typography
          onClick={() => setPrivacyOpen(true)}
          sx={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            '&:hover': { color: '#fff' },
          }}
        >
          Privacy Policy
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>|</Typography>
        <Typography
          onClick={() => setContactOpen(true)}
          sx={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            '&:hover': { color: '#fff' },
          }}
        >
          Contact Us
        </Typography>
      </Box>

      {/* Deactivated Account Dialog — Hospital Premium */}
      <Dialog
        open={deactivatedOpen}
        onClose={() => setDeactivatedOpen(false)}
        maxWidth="xs"
        fullWidth
        TransitionProps={{ timeout: 500 }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(13,43,82,0.3)',
            border: '1px solid rgba(21,101,192,0.08)',
          },
        }}
      >
        {/* Header bar */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0d2b52 0%, #1565c0 100%)',
            color: '#fff',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospitalIcon sx={{ fontSize: 22 }} />
            Account Notification
          </Box>
          <IconButton
            onClick={() => setDeactivatedOpen(false)}
            sx={{
              color: 'rgba(255,255,255,0.8)',
              transition: 'all 0.25s ease',
              '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.15)', transform: 'rotate(90deg)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 4, pb: 1, textAlign: 'center' }}>
          {/* Animated medical icon — drop-in + heartbeat + ring glow */}
          <Box
            sx={{
              width: 92,
              height: 92,
              mx: 'auto',
              mb: 2.5,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${deactIconDrop} 0.6s cubic-bezier(0.34,1.56,0.64,1) both, ${deactivatedHeartbeat} 1.8s 1s ease-in-out infinite, ${deactRingGlow} 2.5s 0.8s ease-in-out infinite`,
            }}
          >
            <MedicalInformationIcon sx={{ fontSize: 46, color: '#1565c0' }} />
          </Box>

          {/* Doctor name — slide up #1 */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#0d2b52',
              mb: 0.5,
              lineHeight: 1.3,
              opacity: 0,
              animation: `${deactTextSlideUp} 0.5s 0.35s ease-out forwards`,
            }}
          >
            Hi {deactivatedDoctorName || 'Doctor'}, your account is currently on hold
          </Typography>

          {/* Description — slide up #2 */}
          <Typography
            variant="body2"
            sx={{
              color: '#546e7a',
              mb: 2,
              lineHeight: 1.6,
              maxWidth: 300,
              mx: 'auto',
              opacity: 0,
              animation: `${deactTextSlideUp} 0.5s 0.55s ease-out forwards`,
            }}
          >
            Your credentials have been temporarily deactivated by the hospital administration. Please reach out to the Admin team to restore access.
          </Typography>

          {/* Shimmer divider */}
          <Box
            sx={{
              width: '60%',
              height: 3,
              mx: 'auto',
              borderRadius: 2,
              background: 'linear-gradient(90deg, transparent 0%, #1565c0 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              opacity: 0.35,
              animation: `${deactShimmer} 2.5s 0.8s ease-in-out infinite`,
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1.5,
            justifyContent: 'center',
            opacity: 0,
            animation: `${deactTextSlideUp} 0.5s 0.7s ease-out forwards`,
          }}
        >
          <Button
            onClick={() => setDeactivatedOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #0d2b52, #1565c0)',
              borderRadius: 2.5,
              px: 5,
              py: 1,
              animation: `${deactBtnGlow} 2.5s 1.2s ease-in-out infinite`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                transform: 'translateY(-2px) scale(1.03)',
                boxShadow: '0 6px 24px rgba(21,101,192,0.45)',
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)',
              },
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Reset Password
          <IconButton onClick={() => setForgotOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {resetStep === 1 ? (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: '#555', lineHeight: 1.7 }}>
                {selectedRole === 'patient'
                  ? 'Enter your registered mobile number to verify your identity.'
                  : selectedRole === 'doctor'
                    ? 'Enter your username to verify your identity.'
                    : selectedRole === 'reception'
                      ? 'Enter your Reception ID to verify your identity.'
                      : 'Enter your Admin ID to verify your identity.'}
              </Typography>
              <TextField
                fullWidth
                label={selectedRole === 'patient' ? 'Mobile Number' : selectedRole === 'doctor' ? 'Username' : selectedRole === 'reception' ? 'Reception ID' : 'Admin ID'}
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(selectedRole === 'patient' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                placeholder={selectedRole === 'patient' ? 'e.g. 9876543210' : selectedRole === 'doctor' ? 'e.g. dr_john' : selectedRole === 'reception' ? 'e.g. reception' : 'e.g. admin1'}
                InputProps={selectedRole === 'patient' ? {
                  startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#999' }} /></InputAdornment>,
                } : {
                  startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#999' }} /></InputAdornment>,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && resetIdentifier.trim()) handleVerifyIdentity()
                }}
                sx={{ mb: 1 }}
              />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: '#555', lineHeight: 1.7 }}>
                Identity verified! Set your new password below.
              </Typography>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPassword && confirmPassword) handleResetPassword()
                }}
                sx={{ mb: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ textTransform: 'none', color: '#666' }}>Cancel</Button>
          {resetStep === 1 ? (
            <Button
              variant="contained"
              disabled={!resetIdentifier.trim() || resetLoading}
              onClick={handleVerifyIdentity}
              sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', textTransform: 'none', fontWeight: 600 }}
            >
              {resetLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Verify'}
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={!newPassword || !confirmPassword || resetLoading}
              onClick={handleResetPassword}
              sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', textTransform: 'none', fontWeight: 600 }}
            >
              {resetLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Reset Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Privacy Policy
          <IconButton onClick={() => setPrivacyOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>1. Introduction</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            Chandigarh University Hospital Management System ("HMS") is committed to protecting and respecting your privacy. This policy explains how we collect, use, store, and safeguard your personal and medical information when you use our platform.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>2. Information We Collect</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            We may collect the following types of information:<br />
            &bull; <strong>Personal Information:</strong> Full name, age, gender, date of birth, mobile number, and email address.<br />
            &bull; <strong>Medical Information:</strong> Diagnosis, prescriptions, medical history, blood group, and appointment details.<br />
            &bull; <strong>Authentication Data:</strong> Login credentials (username, encrypted passwords) for secure access.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>3. How We Use Your Information</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            Your information is used to:<br />
            &bull; Provide and manage healthcare services and appointments.<br />
            &bull; Maintain accurate medical records for treatment purposes.<br />
            &bull; Enable secure login and role-based access for patients, doctors, and administrators.<br />
            &bull; Communicate with you regarding your healthcare and appointments.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>4. Data Security</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            We implement industry-standard security measures including:<br />
            &bull; BCrypt password encryption for all user credentials.<br />
            &bull; JWT-based authentication with secure token management.<br />
            &bull; Role-based access control to ensure only authorized personnel can access sensitive data.<br />
            &bull; HTTPS encryption for all data transmitted between your browser and our servers.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>5. Data Sharing</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            We do not sell, trade, or rent your personal information to third parties. Your medical data is shared only with authorized healthcare professionals involved in your treatment within the hospital system.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>6. Your Rights</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.8 }}>
            You have the right to:<br />
            &bull; Access your personal and medical data stored in the system.<br />
            &bull; Request correction of inaccurate information.<br />
            &bull; Request deletion of your account and associated data.<br />
            &bull; Contact us with any privacy-related concerns.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d2b52' }}>7. Contact Us</Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#444', lineHeight: 1.8 }}>
            For any privacy-related inquiries, please contact us at:<br />
            &bull; <strong>Email:</strong> chdhms@gmail.com<br />
            &bull; <strong>Phone:</strong> +91 9939339811
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, color: '#888', fontStyle: 'italic' }}>
            Last updated: February 2026
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPrivacyOpen(false)} variant="contained" sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contact Us Dialog */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Contact Us
          <IconButton onClick={() => setContactOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#444' }}>
            Have questions or need assistance? Reach out to us through any of the following channels:
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: '#f0f4ff', borderRadius: 2, border: '1px solid #d0daf0' }}>
            <PhoneIcon sx={{ color: '#1a3c6e', fontSize: 32 }} />
            <Box>
              <Typography variant="body2" sx={{ color: '#888', fontWeight: 600 }}>Phone</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d2b52' }}>
                <a href="tel:+919939339811" style={{ textDecoration: 'none', color: 'inherit' }}>+91 9939339811</a>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: '#f0f4ff', borderRadius: 2, border: '1px solid #d0daf0' }}>
            <EmailIcon sx={{ color: '#1a3c6e', fontSize: 32 }} />
            <Box>
              <Typography variant="body2" sx={{ color: '#888', fontWeight: 600 }}>Email</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d2b52' }}>
                <a href="mailto:chdhms@gmail.com" style={{ textDecoration: 'none', color: 'inherit' }}>chdhms@gmail.com</a>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, backgroundColor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb' }}>
            <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.8 }}>
              <strong>Chandigarh University Hospital</strong><br />
              NH-05, Ludhiana - Chandigarh State Hwy,<br />
              Punjab, India<br />
              <strong>Working Hours:</strong> Mon - Sat, 9:00 AM - 6:00 PM
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setContactOpen(false)} variant="contained" sx={{ background: 'linear-gradient(135deg, #0d2b52 0%, #1a3c6e 100%)', textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ══════════ FLOATING MAP ICON ══════════ */}
      <Box
        onClick={() => setMapOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1200,
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          animation: `${mapPinSlideIn} 0.8s 1.5s cubic-bezier(0.34,1.56,0.64,1) both, ${mapPinPulse} 2.5s 2.5s ease-in-out infinite`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'scale(1.12)',
            boxShadow: '0 6px 24px rgba(229,57,53,0.5)',
            animation: `${mapPinBounce} 1s ease-in-out infinite`,
          },
        }}
      >
        <PlaceIcon sx={{ color: '#fff', fontSize: 30 }} />
      </Box>

      {/* ══════════ MAP DIALOG ══════════ */}
      <Dialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #f5f5f5 0%, #fff 100%)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
            color: '#fff',
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlaceIcon />
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Find Us — Hospital Location
            </Typography>
          </Box>
          <IconButton onClick={() => setMapOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 450 }}>
          <HospitalMap height="100%" showInfoCard />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LoginPage
