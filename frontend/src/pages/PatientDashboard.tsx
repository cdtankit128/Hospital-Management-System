import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Avatar,
  Badge,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { useAuth } from '../auth/AuthContext'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MedicationIcon from '@mui/icons-material/Medication'
import AddIcon from '@mui/icons-material/Add'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import MessageIcon from '@mui/icons-material/Message'
import PaymentIcon from '@mui/icons-material/Payment'
import ReceiptIcon from '@mui/icons-material/Receipt'
import axios from 'axios'
import {
  appointmentPublicAPI,
  AppointmentResponse,
} from '../services/appointmentAPI'
import { paymentPublicAPI, PaymentRecord } from '../services/paymentAPI'
import { useNotifications } from '../hooks/useNotifications'
import { useServerTime } from '../hooks/useServerTime'


// ─── Glassmorphism card ───
const GlassCard = ({ children, sx = {} }: { children: React.ReactNode; sx?: any }) => (
  <Box
    sx={{
      background: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(16px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      ...sx,
    }}
  >
    {children}
  </Box>
)

// ─── Section header bar ───
const SectionHeader = ({
  icon,
  title,
  gradient,
  onViewAll,
}: {
  icon: React.ReactNode
  title: string
  gradient: string
  onViewAll?: () => void
}) => (
  <Box
    sx={{
      background: gradient,
      px: 2.5,
      py: 1.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box sx={{ color: '#fff', display: 'flex' }}>{icon}</Box>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '15px', letterSpacing: 0.5 }}>
        {title}
      </Typography>
    </Box>
    <Typography
      onClick={onViewAll}
      sx={{
        color: 'rgba(255,255,255,0.85)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        '&:hover': { color: '#fff', textDecoration: 'underline' },
      }}
    >
      View All
    </Typography>
  </Box>
)


// ══════════════════════════════════════════════
// ─── MAIN DASHBOARD ───
// ══════════════════════════════════════════════
const PatientDashboard = () => {
  const navigate = useNavigate()
  const { logout, username } = useAuth()
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [notifDialogOpen, setNotifDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundPaymentId, setRefundPaymentId] = useState<number | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  // Real-time server time
  const { formatDateTime } = useServerTime()

  // Real-time notifications — uses patientName as identifier (name-based for patients)
  const {
    notifications: notifItems,
    unreadCount,
    newPopupNotifs,
    showPopup,
    dismissPopup,
    markAllRead,
    markOneRead,
  } = useNotifications({ username: patientName, role: 'PATIENT', useNameBased: true })

  useEffect(() => {
    // Try getting patient data from localStorage
    let name = ''
    try {
      const data = localStorage.getItem('patientData')
      if (data) {
        const parsed = JSON.parse(data)
        name = parsed.name || parsed.patientName || username || 'Patient'
        setPatientName(name)
        setPatientId(parsed.patientLoginId || localStorage.getItem('patientId') || username || '')
      } else {
        name = username || 'Patient'
        setPatientName(name)
        setPatientId(localStorage.getItem('patientId') || username || '')
      }
    } catch {
      name = username || 'Patient'
      setPatientName(name)
      setPatientId(username || '')
    }

    // Fetch prescriptions/records for this patient
    if (name) {
      axios
        .get(`/api/patients/records-by-name`, {
          params: { name },
        })
        .then((res) => setPrescriptions(res.data || []))
        .catch(() => setPrescriptions([]))
    }

    // Fetch appointments by patient name AND phone (loginId) — merge to catch all bookings
    if (name) {
      const loginId = localStorage.getItem('patientId') || username || ''
      // Also try reading phone from patientData
      let phone = ''
      try {
        const pd = localStorage.getItem('patientData')
        if (pd) {
          const p = JSON.parse(pd)
          phone = p.phone || ''
        }
      } catch {}

      const phoneLookups: Promise<AppointmentResponse[]>[] = []
      // Search by loginId (always)
      if (loginId && loginId !== name) {
        phoneLookups.push(appointmentPublicAPI.getAppointmentsByPatientPhone(loginId).catch(() => []))
      }
      // Search by actual phone if different from loginId and name
      if (phone && phone !== loginId && phone !== name) {
        phoneLookups.push(appointmentPublicAPI.getAppointmentsByPatientPhone(phone).catch(() => []))
      }

      Promise.all([
        appointmentPublicAPI.getAppointmentsByPatientName(name).catch(() => []),
        ...phoneLookups,
      ]).then((results) => {
        const seen = new Set<number>()
        const merged: AppointmentResponse[] = []
        for (const list of results) {
          for (const a of (list || [])) {
            if (!seen.has(a.id)) {
              seen.add(a.id)
              merged.push(a)
            }
          }
        }
        setAppointments(merged)
      })

      // Fetch payments for this patient
      paymentPublicAPI.getPaymentsByName(name)
        .then((payList) => setPayments(payList))
        .catch(() => setPayments([]))
    }
  }, [username])

  const handleLogout = () => {
    localStorage.removeItem('patientData')
    localStorage.removeItem('patientId')
    logout()
    navigate('/login')
  }

  const handleRefundRequest = async () => {
    if (!refundPaymentId) return
    setRefundLoading(true)
    try {
      const refunded = await paymentPublicAPI.refundPayment(refundPaymentId, refundReason || 'Patient requested refund')
      setPayments((prev) => prev.map((p) => (p.id === refundPaymentId ? refunded : p)))
      setRefundDialogOpen(false)
      setRefundPaymentId(null)
      setRefundReason('')
    } catch (error: any) {
      console.error('Refund failed:', error)
    } finally {
      setRefundLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #c9ddf0 0%, #e4ecf5 25%, #d4dfe9 50%, #a8bdd0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hospital background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/get.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          opacity: 0.18,
          zIndex: 0,
        }}
      />

      {/* ══════ TOP NAV BAR ══════ */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 1.2,
          background: 'rgba(13, 43, 82, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/cu-logo.png"
            alt="CU Logo"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 800,
              fontSize: { xs: '14px', md: '18px' },
              letterSpacing: 1.5,
              fontFamily: '"Georgia", serif',
            }}
          >
            CHANDIGARH UNIVERSITY HOSPITAL
          </Typography>
        </Box>

        {/* Nav Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          {['Home', 'Appointments', 'Reports', 'Prescriptions'].map((item) => (
            <Button
              key={item}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                px: 1.5,
                borderRadius: '8px',
                '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' },
              }}
            >
              {item}
            </Button>
          ))}
        </Box>

        {/* Right side: user info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0} sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: 16, height: 16 } }}>
            <IconButton size="small" onClick={() => { if (unreadCount > 0) setNotifDialogOpen(true) }}>
              <NotificationsIcon sx={{ color: unreadCount > 0 ? '#ffeb3b' : 'rgba(255,255,255,0.7)', fontSize: 22 }} />
            </IconButton>
          </Badge>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: '#4fc3f7',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {patientName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'P'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>
              {patientName}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>#{patientId}</Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }} onClick={handleLogout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ══════ WELCOME STRIP ══════ */}
      <Box sx={{ position: 'relative', zIndex: 2, px: { xs: 2, md: 4 }, pt: 2.5, pb: 1 }}>
        <Typography sx={{ fontSize: '14px', color: '#4a5568' }}>
          Welcome back,{' '}
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '18px', color: '#1a2940' }}>
            {patientName}
          </Typography>
        </Typography>
        <Typography sx={{ fontSize: '12px', color: '#7a8a9e' }}>Patient ID: #{patientId}</Typography>
      </Box>

      {/* ══════ 3-COLUMN CONTENT ══════ */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          gap: 2.5,
          px: { xs: 2, md: 4 },
          py: 2,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          alignItems: 'flex-start',
        }}
      >
        {/* ── LEFT: MY APPOINTMENTS ── */}
        <GlassCard sx={{ flex: 1, minWidth: { xs: '100%', md: 300 } }}>
          <SectionHeader
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            title="My Appointments"
            gradient="linear-gradient(135deg, #7b8fd4 0%, #5c6bbf 100%)"
          />
          {/* Book Appointment Button */}
          <Box sx={{ px: 2, pt: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/patient/book-appointment')}
              sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #5a52e0 100%)',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13px',
                py: 1,
                boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
                '&:hover': { boxShadow: '0 6px 16px rgba(108,99,255,0.4)' },
              }}
            >
              Book New Appointment
            </Button>
          </Box>
          <Box sx={{ py: 1.5, maxHeight: 520, overflowY: 'auto' }}>
            {appointments.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, color: '#7a8a9e' }}>
                <EventAvailableIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography sx={{ fontSize: '13px', fontStyle: 'italic' }}>No appointments scheduled yet.</Typography>
              </Box>
            ) : (
              appointments.map((apt) => {
                const statusColors: Record<string, { bg: string; color: string }> = {
                  PENDING: { bg: '#FFF3E0', color: '#E65100' },
                  APPROVED: { bg: '#E8F5E9', color: '#2E7D32' },
                  REJECTED: { bg: '#FFEBEE', color: '#C62828' },
                  CANCELLED: { bg: '#FFEBEE', color: '#C62828' },
                  COMPLETED: { bg: '#E3F2FD', color: '#1565C0' },
                  BOOKED: { bg: '#E8F5E9', color: '#2E7D32' },
                  ON_HOLD: { bg: '#FFF8E1', color: '#F57F17' },
                }
                const sc = statusColors[apt.status] || { bg: '#eee', color: '#666' }
                return (
                  <Box
                    key={apt.id}
                    sx={{
                      mx: 2,
                      mb: 1.5,
                      p: 2,
                      borderRadius: '12px',
                      background: '#f5f7ff',
                      border: '1px solid #e0e5f5',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#5c6bbf' }}>
                        Dr. {apt.doctorName}
                      </Typography>
                      <Chip
                        label={apt.status}
                        size="small"
                        sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '10px', height: 22 }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '11px', color: '#6C63FF', fontWeight: 600, mb: 0.5 }}>
                      {apt.specialization}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#555' }}>
                      {new Date(apt.appointmentDate + 'T00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      — Preferred: {apt.preferredTime || 'N/A'}
                    </Typography>
                    {apt.reason && (
                      <Typography sx={{ fontSize: '11px', color: '#888', mt: 0.5 }}>
                        Reason: {apt.reason}
                      </Typography>
                    )}
                    {/* Doctor's Message */}
                    {apt.doctorMessage && (
                      <Box sx={{ mt: 1, p: 1.2, bgcolor: apt.status === 'APPROVED' ? '#E8F5E9' : apt.status === 'ON_HOLD' ? '#FFF8E1' : '#FFF3E0', borderRadius: '8px', border: `1px solid ${apt.status === 'APPROVED' ? '#A5D6A7' : apt.status === 'ON_HOLD' ? '#FFD54F' : '#FFE0B2'}` }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: apt.status === 'APPROVED' ? '#2E7D32' : apt.status === 'ON_HOLD' ? '#F57F17' : '#E65100', mb: 0.3, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MessageIcon sx={{ fontSize: 13 }} /> {apt.status === 'ON_HOLD' ? 'Appointment On Hold:' : "Doctor's Message:"}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#333', fontStyle: 'italic' }}>
                          "{apt.doctorMessage}"
                        </Typography>
                        {apt.status === 'ON_HOLD' && (
                          <Typography sx={{ fontSize: '11px', color: '#F57F17', mt: 0.5, fontWeight: 600 }}>
                            Your appointment is on hold. The receptionist will approve it when the doctor is available. No need to rebook.
                          </Typography>
                        )}
                      </Box>
                    )}
                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {(apt.status === 'PENDING' || apt.status === 'APPROVED') && (
                        <Button
                          size="small"
                          startIcon={<CancelIcon sx={{ fontSize: 12 }} />}
                          onClick={async () => {
                            try {
                              await appointmentPublicAPI.cancelAppointment(apt.id)
                              setAppointments((prev) => prev.map((a) => (a.id === apt.id ? { ...a, status: 'CANCELLED' } : a)))
                            } catch { }
                          }}
                          sx={{ fontSize: '10px', textTransform: 'none', color: '#F44336', fontWeight: 600, p: 0.5, minWidth: 'auto' }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </GlassCard>

        {/* ── CENTER: MY PAYMENTS ── */}
        <GlassCard sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}>
          <SectionHeader
            icon={<PaymentIcon sx={{ fontSize: 20 }} />}
            title="My Payments"
            gradient="linear-gradient(135deg, #26a69a 0%, #00897b 100%)"
          />
          <Box sx={{ py: 1.5, maxHeight: 520, overflowY: 'auto' }}>
            {payments.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, color: '#7a8a9e' }}>
                <ReceiptIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography sx={{ fontSize: '13px', fontStyle: 'italic' }}>No payment records found.</Typography>
              </Box>
            ) : (
              payments.map((pay) => {
                const statusColors: Record<string, { bg: string; color: string }> = {
                  PENDING: { bg: '#FFF3E0', color: '#E65100' },
                  COMPLETED: { bg: '#E8F5E9', color: '#2E7D32' },
                  REFUNDED: { bg: '#E3F2FD', color: '#1565C0' },
                  FAILED: { bg: '#FFEBEE', color: '#C62828' },
                }
                const sc = statusColors[pay.paymentStatus] || { bg: '#eee', color: '#666' }
                return (
                  <Box
                    key={pay.id}
                    sx={{
                      mx: 2,
                      mb: 1.5,
                      p: 2,
                      borderRadius: '12px',
                      background: '#f0faf5',
                      border: '1px solid #c8e6c9',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#00897b' }}>
                        ₹{pay.amount?.toLocaleString()}
                      </Typography>
                      <Chip
                        label={pay.paymentStatus}
                        size="small"
                        sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '10px', height: 22 }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '11px', color: '#555', mb: 0.3 }}>
                      Dr. {pay.doctorName} • {pay.specialization}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#888' }}>
                      Receipt: {pay.receiptNumber} • {pay.paymentMethod}
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#aaa', mt: 0.3 }}>
                      {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </Typography>
                    {pay.refundReason && (
                      <Typography sx={{ fontSize: '11px', color: '#1565C0', mt: 0.5, fontStyle: 'italic' }}>
                        Refund: {pay.refundReason}
                      </Typography>
                    )}
                    {/* Refund button for COMPLETED payments */}
                    {pay.paymentStatus === 'COMPLETED' && (
                      <Button
                        size="small"
                        onClick={() => {
                          setRefundPaymentId(pay.id)
                          setRefundReason('')
                          setRefundDialogOpen(true)
                        }}
                        sx={{ fontSize: '10px', textTransform: 'none', color: '#F44336', fontWeight: 600, p: 0.5, minWidth: 'auto', mt: 0.5 }}
                      >
                        Request Refund
                      </Button>
                    )}
                  </Box>
                )
              })
            )}
          </Box>
        </GlassCard>

        {/* ── RIGHT: MY PRESCRIPTIONS ── */}
        <GlassCard sx={{ flex: 1, minWidth: { xs: '100%', md: 300 } }}>
          <SectionHeader
            icon={<MedicationIcon sx={{ fontSize: 20 }} />}
            title="My Prescriptions"
            gradient="linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)"
          />
          <Box sx={{ py: 1.5, maxHeight: 520, overflowY: 'auto' }}>
            {prescriptions.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, color: '#7a8a9e' }}>
                <Typography sx={{ fontSize: '13px', fontStyle: 'italic' }}>No prescriptions found.</Typography>
              </Box>
            ) : (
              prescriptions.map((rec, idx) => (
                <Box
                  key={rec.id || idx}
                  sx={{
                    mx: 2,
                    mb: 1.5,
                    p: 2,
                    borderRadius: '12px',
                    background: '#f9f5ff',
                    border: '1px solid #e8daf5',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#7e22ce' }}>
                      Prescription #{idx + 1}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#999' }}>
                      {rec.createdAt
                        ? new Date(rec.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '12px', color: '#555', mb: 0.5 }}>
                    <strong>Diagnosis:</strong> {rec.diagnosis}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#555', mb: 0.5 }}>
                    <strong>Prescription:</strong> {rec.prescription}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#888', mt: 0.5 }}>
                    By Dr. {rec.doctorUsername}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </GlassCard>
      </Box>

      {/* ══════ FOOTER ══════ */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          py: 1.8,
          textAlign: 'center',
          background: 'rgba(13, 43, 82, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
          &copy; 2026 Chandigarh University Hospital &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Contact Us
        </Typography>
      </Box>

      {/* ══════ REFUND DIALOG ══════ */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828', bgcolor: '#ffebee' }}>
          Request Refund
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#555', mb: 2 }}>
            Please provide a reason for the refund request:
          </Typography>
          <Box
            component="textarea"
            value={refundReason}
            onChange={(e: any) => setRefundReason(e.target.value)}
            placeholder="Reason for refund (optional)"
            sx={{
              width: '100%',
              minHeight: 80,
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              '&:focus': { outline: 'none', borderColor: '#6C63FF' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRefundDialogOpen(false)} sx={{ color: '#666', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRefundRequest}
            disabled={refundLoading}
            sx={{
              bgcolor: '#c62828',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { bgcolor: '#b71c1c' },
            }}
          >
            {refundLoading ? 'Processing...' : 'Request Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════ NOTIFICATION SNACKBAR (only for brand-new unseen notifications) ══════ */}
      <Snackbar
        open={showPopup}
        autoHideDuration={8000}
        onClose={dismissPopup}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
          onClick={() => { dismissPopup(); setNotifDialogOpen(true); }}
          onClose={dismissPopup}
          icon={<NotificationsIcon />}
        >
          You have {newPopupNotifs.length} new notification{newPopupNotifs.length > 1 ? 's' : ''}! Click to view.
        </Alert>
      </Snackbar>

      {/* ══════ NOTIFICATION DIALOG ══════ */}
      <Dialog open={notifDialogOpen} onClose={() => setNotifDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a2940', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon sx={{ color: '#6C63FF' }} />
          Appointment Notifications ({notifItems.length})
        </DialogTitle>
        <DialogContent>
          {notifItems.length === 0 ? (
            <Typography sx={{ py: 3, textAlign: 'center', color: '#999' }}>No new notifications</Typography>
          ) : (
            notifItems.map((notif) => {
              const isHold = notif.type === 'APPOINTMENT_ON_HOLD'
              const isApproved = notif.type === 'APPOINTMENT_APPROVED'
              const isRejected = notif.type === 'APPOINTMENT_REJECTED'
              const borderColor = isApproved ? '#A5D6A7' : isHold ? '#FFD54F' : isRejected ? '#EF9A9A' : '#BBDEFB'
              const bgColor = isApproved ? '#E8F5E9' : isHold ? '#FFF8E1' : isRejected ? '#FFEBEE' : '#E3F2FD'
              const iconColor = isApproved ? '#4CAF50' : isHold ? '#F57F17' : isRejected ? '#F44336' : '#1565C0'
              const titleColor = isApproved ? '#2E7D32' : isHold ? '#F57F17' : isRejected ? '#C62828' : '#1565C0'
              return (
              <Box
                key={notif.id}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${borderColor}`,
                  bgcolor: bgColor,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isApproved ? (
                      <CheckCircleIcon sx={{ color: iconColor }} />
                    ) : (
                      <ErrorIcon sx={{ color: iconColor }} />
                    )}
                    <Typography sx={{ fontWeight: 700, color: titleColor }}>
                      {notif.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                    {notif.createdAt ? formatDateTime(notif.createdAt) : ''}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.9rem', color: '#333', mb: 0.5 }}>
                  {notif.message}
                </Typography>
                {isHold && (
                  <Typography sx={{ fontSize: '0.8rem', color: '#F57F17', mt: 0.5, fontWeight: 600 }}>
                    Your appointment is on hold. It will be approved once the doctor is available. No need to rebook.
                  </Typography>
                )}
                <Button
                  size="small"
                  onClick={() => markOneRead(notif.id)}
                  sx={{ mt: 1, fontSize: '0.75rem', textTransform: 'none', color: '#666' }}
                >
                  Dismiss
                </Button>
              </Box>
              )
            })
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          {notifItems.length > 0 && (
            <Button
              onClick={() => { markAllRead(); setNotifDialogOpen(false) }}
              sx={{ textTransform: 'none', color: '#999', fontSize: '0.85rem' }}
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => setNotifDialogOpen(false)}
            sx={{ bgcolor: '#6C63FF', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#5a52e0' } }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PatientDashboard
