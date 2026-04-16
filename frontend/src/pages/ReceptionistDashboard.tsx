import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Select, FormControl, InputLabel,
  Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Snackbar, Alert, CircularProgress, Divider, InputAdornment,
  ToggleButton, ToggleButtonGroup, Tooltip, Badge, Fade,
  FormLabel, Stepper, Step, StepLabel, Menu, Popover,
} from '@mui/material'
import {
  EventNote as EventNoteIcon,
  Payment as PaymentIcon,
  Today as TodayIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  QrCode2 as QrCodeIcon,
  AttachMoney as CashIcon,
  CheckCircle as CheckCircleIcon,
  LocalHospital as HospitalIcon,
  AccessTime as ClockIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  CheckCircleOutline as ApproveIcon,
  CancelOutlined as RejectIcon,
  HourglassEmpty as HoldIcon,
  Notifications as NotificationsIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Undo as UndoIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import axios from 'axios'
import { apiUrl } from '../api/config'
import { useNotifications } from '../hooks/useNotifications'
import { useServerTime } from '../hooks/useServerTime'
import { paymentReceptionistAPI, razorpayAPI } from '../services/paymentAPI'

// ─── Types ───
interface Doctor {
  id: number
  username: string
  fullName: string
  name: string
  specialization: string
  email: string
}

interface Appointment {
  id: number
  patientName: string
  patientPhone: string
  doctorUsername: string
  doctorName: string
  specialization: string
  appointmentDate: string
  appointmentTime: string
  timeSlot: string
  preferredTime: string
  reason: string
  doctorMessage: string
  status: string
  appointmentNumber: number | null
  queueNumber: number | null
  createdAt: string
}

interface PaymentRecord {
  id: number
  receiptNumber: string
  patientName: string
  patientPhone: string
  doctorName: string
  specialization: string
  amount: number
  paymentMethod: 'CASH' | 'QR' | 'ONLINE'
  paymentStatus: string
  transactionId: string
  receptionistUsername: string
  notes: string
  createdAt: string
}

// ─── Component ───
const ReceptionistDashboard = () => {
  const navigate = useNavigate()
  const receptionistUsername = localStorage.getItem('username') || 'receptionist'
  const fullName = localStorage.getItem('fullName') || 'Front Desk'

  // Tab state
  const [activeTab, setActiveTab] = useState(0)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' })
  const showSnack = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => setSnackbar({ open: true, message, severity })

  // Notification popover anchor
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null)

  // Real-time server time
  const { formatDateTime, todayStr: serverTodayStr } = useServerTime()

  // Real-time notifications
  const {
    notifications: notifItems,
    unreadCount,
    newPopupNotifs,
    showPopup: showNotifPopup,
    dismissPopup,
    markAllRead,
    markOneRead,
  } = useNotifications({ username: receptionistUsername, role: 'RECEPTIONIST' })

  // ─── BOOKING STATE ───
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  const [bookingStep, setBookingStep] = useState(0)
  const [selectedSpec, setSelectedSpec] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [visitReason, setVisitReason] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null)

  // ─── PAYMENT STATE ───
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'ONLINE' | ''>('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentRecord | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // ─── REFUND STATE ───
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundTargetId, setRefundTargetId] = useState<number | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  // ─── TODAY STATE ───
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [todayPayments, setTodayPayments] = useState<PaymentRecord[]>([])
  const [loadingToday, setLoadingToday] = useState(false)

  // ─── PENDING APPOINTMENT REQUESTS STATE ───
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')

  // Hold menu state
  const [holdMenuAnchor, setHoldMenuAnchor] = useState<HTMLElement | null>(null)
  const [holdMenuId, setHoldMenuId] = useState<number | null>(null)

  // ─── Fetch doctors ───
  useEffect(() => {
    axios.get(apiUrl('/api/auth/doctors-list'))
      .then(res => {
        const docs: Doctor[] = res.data
        setDoctors(docs)
        const specs = [...new Set(docs.map(d => d.specialization).filter(Boolean))]
        setSpecializations(specs)
      })
      .catch(() => showSnack('Failed to load doctors', 'error'))
      .finally(() => setLoadingDoctors(false))
  }, [])

  // ─── Fetch available slots when doctor + date chosen ───
  const fetchSlots = useCallback(async () => {
    if (!selectedDoctor || !appointmentDate) return
    setLoadingSlots(true)
    try {
      const res = await api.get('/receptionist/available-slots', {
        params: { doctorUsername: selectedDoctor.username, date: appointmentDate }
      })
      setAvailableSlots(res.data)
      setSelectedSlot('')
    } catch {
      showSnack('Failed to fetch slots', 'error')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedDoctor, appointmentDate])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  // ─── Fetch today's data ───
  const fetchTodayData = useCallback(async () => {
    setLoadingToday(true)
    try {
      const [aptRes, payList] = await Promise.all([
        api.get('/receptionist/today-appointments'),
        paymentReceptionistAPI.getTodayPayments(),
      ])
      setTodayAppointments(aptRes.data)
      setTodayPayments(payList as any)
    } catch {
      showSnack('Failed to fetch today\'s data', 'error')
    } finally {
      setLoadingToday(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 2) fetchTodayData()
    if (activeTab === 3) fetchPendingRequests()
  }, [activeTab, fetchTodayData])

  // Auto-refresh pending requests when a new APPOINTMENT_BOOKED notification arrives
  useEffect(() => {
    if (newPopupNotifs.some(n => n.type === 'APPOINTMENT_BOOKED')) {
      fetchPendingRequests()
    }
  }, [newPopupNotifs])

  // ─── Fetch pending appointment requests ───
  const fetchPendingRequests = useCallback(async () => {
    setLoadingPending(true)
    try {
      const res = await api.get('/receptionist/pending-appointments')
      setPendingRequests(res.data)
    } catch {
      showSnack('Failed to fetch pending requests', 'error')
    } finally {
      setLoadingPending(false)
    }
  }, [])

  const handleApproveRequest = async (id: number) => {
    try {
      await api.put(`/receptionist/appointments/${id}/approve`, {})
      showSnack('Appointment approved! Queue number assigned.', 'success')
      fetchPendingRequests()
    } catch {
      showSnack('Failed to approve appointment', 'error')
    }
  }

  const handleRejectRequest = async () => {
    if (!rejectDialogId) return
    try {
      await api.put(`/receptionist/appointments/${rejectDialogId}/reject`, { message: rejectMessage })
      showSnack('Appointment rejected.', 'info')
      setRejectDialogOpen(false)
      setRejectMessage('')
      setRejectDialogId(null)
      fetchPendingRequests()
    } catch {
      showSnack('Failed to reject appointment', 'error')
    }
  }

  const handleHoldRequest = async (id: number, holdMsg: string) => {
    try {
      await api.put(`/receptionist/appointments/${id}/hold`, { message: holdMsg })
      showSnack(`Appointment put on hold — ${holdMsg}`, 'warning')
      setHoldMenuAnchor(null)
      setHoldMenuId(null)
      fetchPendingRequests()
    } catch {
      showSnack('Failed to put appointment on hold', 'error')
    }
  }

  // ─── Book appointment ───
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !selectedSlot || !patientName.trim() || !patientPhone.trim()) {
      showSnack('Please fill all required fields', 'warning')
      return
    }
    setBookingLoading(true)
    try {
      const res = await api.post('/receptionist/book-appointment', {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorUsername: selectedDoctor.username,
        doctorName: selectedDoctor.fullName || selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        appointmentDate,
        preferredTime: selectedSlot,
        reason: visitReason.trim() || 'Walk-in visit',
      })
      setBookedAppointment(res.data)
      showSnack('Appointment booked successfully!', 'success')
      setBookingStep(3) // Go to success/payment step
    } catch (err: any) {
      showSnack(err.response?.data?.error || 'Failed to book appointment', 'error')
    } finally {
      setBookingLoading(false)
    }
  }

  // ─── Record payment ───
  const handleRecordPayment = async () => {
    if (!paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showSnack('Please select method and enter valid amount', 'warning')
      return
    }

    // For ONLINE method, use Razorpay checkout
    if (paymentMethod === 'ONLINE') {
      handleRazorpayPayment()
      return
    }

    setPaymentLoading(true)
    try {
      const result = await paymentReceptionistAPI.recordPayment({
        patientName: bookedAppointment?.patientName || patientName,
        patientPhone: bookedAppointment?.patientPhone || patientPhone,
        doctorName: bookedAppointment?.doctorName || selectedDoctor?.fullName || selectedDoctor?.name || '',
        specialization: bookedAppointment?.specialization || selectedDoctor?.specialization || '',
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod as 'CASH' | 'QR',
        transactionId: paymentMethod === 'QR' ? `QR-${Date.now()}` : undefined,
        notes: paymentNotes || undefined,
        appointmentId: bookedAppointment?.id || undefined,
      })
      setPaymentSuccess(result as any)
      setShowPaymentDialog(true)
      showSnack('Payment recorded successfully!', 'success')
    } catch (err: any) {
      showSnack(err.response?.data?.error || 'Failed to record payment', 'error')
    } finally {
      setPaymentLoading(false)
    }
  }

  // ─── Razorpay Checkout (auto-verified) ───
  const handleRazorpayPayment = async () => {
    setPaymentLoading(true)
    try {
      const pName = bookedAppointment?.patientName || patientName
      const pPhone = bookedAppointment?.patientPhone || patientPhone
      const dName = bookedAppointment?.doctorName || selectedDoctor?.fullName || selectedDoctor?.name || ''
      const spec = bookedAppointment?.specialization || selectedDoctor?.specialization || ''

      const orderResponse = await razorpayAPI.createOrder({
        patientName: pName,
        patientPhone: pPhone,
        doctorName: dName,
        specialization: spec,
        amount: parseFloat(paymentAmount),
        paymentMethod: 'ONLINE',
        notes: paymentNotes || `Recorded by ${receptionistUsername}`,
        appointmentId: bookedAppointment?.id || undefined,
        receptionistUsername,
        payerType: 'RECEPTIONIST',
      })

      razorpayAPI.openCheckout({
        razorpayKeyId: orderResponse.razorpayKeyId,
        razorpayOrderId: orderResponse.razorpayOrderId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'CU Hospital Management System',
        description: `Consultation Fee - ${dName}`,
        prefill: { name: pName, contact: pPhone },
        onSuccess: async (response) => {
          try {
            const verifyResult = await razorpayAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (verifyResult.verified && verifyResult.payment) {
              setPaymentSuccess(verifyResult.payment as any)
              setShowPaymentDialog(true)
              showSnack('Razorpay payment verified & recorded!', 'success')
            } else {
              showSnack(verifyResult.error || 'Payment verification failed', 'error')
            }
          } catch (verifyErr: any) {
            showSnack(verifyErr.response?.data?.error || 'Verification failed', 'error')
          }
          setPaymentLoading(false)
        },
        onFailure: (error) => {
          showSnack(`Payment failed: ${error.description || error.reason || 'Unknown error'}`, 'error')
          setPaymentLoading(false)
        },
        onDismiss: () => {
          showSnack('Payment cancelled', 'warning')
          setPaymentLoading(false)
        },
      })
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to create Razorpay order'
      console.error('Razorpay order creation error:', err.response?.data || err.message || err)
      showSnack(msg, 'error')
      setPaymentLoading(false)
    }
  }

  // ─── Refund payment ───
  const handleRefundPayment = async () => {
    if (!refundTargetId) return
    setRefundLoading(true)
    try {
      await paymentReceptionistAPI.refundPayment(refundTargetId, refundReason || 'Refunded by receptionist')
      showSnack('Payment refunded successfully!', 'success')
      setRefundDialogOpen(false)
      setRefundTargetId(null)
      setRefundReason('')
      fetchTodayData() // Refresh data
    } catch (err: any) {
      showSnack(err.response?.data?.error || 'Failed to refund payment', 'error')
    } finally {
      setRefundLoading(false)
    }
  }

  // ─── Reset booking ───
  const resetBooking = () => {
    setBookingStep(0)
    setSelectedSpec('')
    setSelectedDoctor(null)
    setAppointmentDate('')
    setAvailableSlots([])
    setSelectedSlot('')
    setPatientName('')
    setPatientPhone('')
    setVisitReason('')
    setBookedAppointment(null)
    setPaymentMethod('')
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentSuccess(null)
  }

  // ─── Logout ───
  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  // ─── Helpers ───
  const todayStr = () => serverTodayStr()
  const maxDateStr = () => {
    const d = new Date(serverTodayStr()); d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  }
  const filteredDoctors = selectedSpec ? doctors.filter(d => d.specialization === selectedSpec) : doctors
  const todayRevenue = todayPayments.filter(p => p.paymentStatus !== 'REFUNDED').reduce((s, p) => s + (p.amount || 0), 0)

  // ────────────────────── RENDER ──────────────────────
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #e0f2f1 100%)' }}>
      {/* ──── Header ──── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)',
        color: '#fff', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 },
        display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <HospitalIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Reception Desk
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              CU Hospital Management System
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<PersonIcon sx={{ color: '#fff !important' }} />}
            label={fullName}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', fontWeight: 600, fontSize: '0.9rem' }}
          />
          {/* Notification Bell */}
          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18 } }}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ──── Tab Navigation ──── */}
      <Paper sx={{ mx: { xs: 1, sm: 3 }, mt: 2, borderRadius: 2, overflow: 'hidden' }} elevation={2}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': { fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.95rem' }, py: 1.5, minWidth: { xs: 'auto', sm: 120 } },
            '& .Mui-selected': { color: '#2e7d32 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#2e7d32', height: 3 },
          }}
        >
          <Tab icon={<PersonAddIcon />} iconPosition="start" label="Book Appointment" />
          <Tab icon={<PaymentIcon />} iconPosition="start" label="Record Payment" />
          <Tab icon={<Badge badgeContent={todayAppointments.length} color="success"><TodayIcon /></Badge>} iconPosition="start" label="Today's Overview" />
          <Tab icon={<Badge badgeContent={pendingRequests.length} color="error"><AssignmentIcon /></Badge>} iconPosition="start" label="Appointment Requests" />
        </Tabs>
      </Paper>

      {/* ──── Content ──── */}
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

        {/* ═══════════ TAB 0: BOOK APPOINTMENT ═══════════ */}
        {activeTab === 0 && (
          <Fade in>
            <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 900, mx: 'auto' }} elevation={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventNoteIcon /> Walk-in Appointment Booking
                </Typography>
                {bookingStep > 0 && bookingStep < 3 && (
                  <Button startIcon={<ArrowBackIcon />} onClick={() => setBookingStep(prev => prev - 1)} size="small">
                    Back
                  </Button>
                )}
                {bookingStep === 3 && (
                  <Button variant="outlined" color="success" onClick={resetBooking} startIcon={<RefreshIcon />}>
                    New Booking
                  </Button>
                )}
              </Box>

              <Stepper activeStep={bookingStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { fontSize: { xs: '0.7rem', sm: '0.875rem' } } }}>
                {['Select Doctor', 'Choose Slot', 'Patient Details', 'Confirmation'].map(label => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              {/* Step 0: Select Doctor */}
              {bookingStep === 0 && (
                <Box>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Filter by Specialization</InputLabel>
                    <Select
                      value={selectedSpec}
                      onChange={e => { setSelectedSpec(e.target.value); setSelectedDoctor(null) }}
                      label="Filter by Specialization"
                    >
                      <MenuItem value="">All Specializations</MenuItem>
                      {specializations.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {loadingDoctors ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress color="success" /></Box>
                  ) : (
                    <Grid container spacing={2}>
                      {filteredDoctors.map(doc => (
                        <Grid item xs={12} sm={6} md={4} key={doc.id}>
                          <Card
                            onClick={() => { setSelectedDoctor(doc); setBookingStep(1) }}
                            sx={{
                              cursor: 'pointer', borderRadius: 2,
                              border: selectedDoctor?.id === doc.id ? '2px solid #2e7d32' : '1px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderColor: '#4caf50' },
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                  width: 48, height: 48, borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <MedicalIcon sx={{ color: '#fff' }} />
                                </Box>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {doc.fullName || doc.name || doc.username}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#666' }}>
                                    {doc.specialization}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {filteredDoctors.length === 0 && (
                        <Grid item xs={12}>
                          <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>No doctors found</Typography>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>
              )}

              {/* Step 1: Choose Date & Slot */}
              {bookingStep === 1 && selectedDoctor && (
                <Box>
                  <Card sx={{ mb: 3, p: 2, bgcolor: '#f1f8e9', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Dr. {selectedDoctor.fullName || selectedDoctor.name} — {selectedDoctor.specialization}
                    </Typography>
                  </Card>

                  <TextField
                    fullWidth
                    label="Appointment Date"
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: todayStr(), max: maxDateStr() }}
                    sx={{ mb: 3 }}
                  />

                  {loadingSlots ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="success" size={30} /></Box>
                  ) : availableSlots.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#333' }}>
                        Available Time Slots
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {availableSlots.map(slot => (
                          <Chip
                            key={slot}
                            icon={<ClockIcon />}
                            label={slot}
                            onClick={() => { setSelectedSlot(slot); setBookingStep(2) }}
                            color={selectedSlot === slot ? 'success' : 'default'}
                            variant={selectedSlot === slot ? 'filled' : 'outlined'}
                            sx={{
                              fontSize: '0.95rem', py: 2.5, px: 1, cursor: 'pointer',
                              fontWeight: selectedSlot === slot ? 700 : 500,
                              '&:hover': { bgcolor: '#e8f5e9' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : appointmentDate ? (
                    <Typography sx={{ color: '#d32f2f', textAlign: 'center', py: 2 }}>
                      No slots available for this date
                    </Typography>
                  ) : null}
                </Box>
              )}

              {/* Step 2: Patient Details */}
              {bookingStep === 2 && (
                <Box>
                  <Card sx={{ mb: 3, p: 2, bgcolor: '#f1f8e9', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      <strong>Doctor:</strong> Dr. {selectedDoctor?.fullName || selectedDoctor?.name} ({selectedDoctor?.specialization})
                      &nbsp;&bull;&nbsp;
                      <strong>Date:</strong> {appointmentDate}
                      &nbsp;&bull;&nbsp;
                      <strong>Time:</strong> {selectedSlot}
                    </Typography>
                  </Card>

                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                    sx={{ mb: 2.5 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Patient Phone"
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                    sx={{ mb: 2.5 }}
                    required
                    placeholder="10-digit mobile number"
                  />
                  <TextField
                    fullWidth
                    label="Reason for Visit (optional)"
                    value={visitReason}
                    onChange={e => setVisitReason(e.target.value)}
                    multiline rows={2}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    fullWidth variant="contained" size="large"
                    onClick={handleBookAppointment}
                    disabled={bookingLoading || !patientName.trim() || !patientPhone.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                      fontWeight: 700, fontSize: '1.05rem', py: 1.5, borderRadius: 2,
                      '&:hover': { background: 'linear-gradient(135deg, #145218, #256d28)' },
                    }}
                  >
                    {bookingLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Book Appointment'}
                  </Button>
                </Box>
              )}

              {/* Step 3: Booking Success + Payment */}
              {bookingStep === 3 && bookedAppointment && (
                <Box>
                  <Card sx={{ p: 3, mb: 3, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 56, color: '#2e7d32', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20', mb: 1 }}>
                      Appointment Booked Successfully!
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Patient</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.patientName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.patientPhone}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Doctor</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.doctorName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Specialization</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.specialization}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.appointmentDate}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Time</Typography>
                        <Typography fontWeight={600}>{bookedAppointment.timeSlot || bookedAppointment.preferredTime}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Chip label="APPROVED — Walk-in" color="success" sx={{ fontWeight: 700 }} />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Payment Section */}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon /> Collect Payment
                  </Typography>

                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Payment Method</FormLabel>
                    <ToggleButtonGroup
                      value={paymentMethod}
                      exclusive
                      onChange={(_, v) => v && setPaymentMethod(v)}
                      sx={{ gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}
                    >
                      <ToggleButton value="CASH" sx={{
                        px: { xs: 2, sm: 4 }, py: { xs: 1.5, sm: 2 }, borderRadius: '12px !important',
                        border: '2px solid #e0e0e0 !important',
                        '&.Mui-selected': { bgcolor: '#e8f5e9', borderColor: '#2e7d32 !important', color: '#1b5e20' },
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CashIcon sx={{ fontSize: { xs: 24, sm: 36 }, mb: 0.5 }} />
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Cash</Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="QR" sx={{
                        px: { xs: 2, sm: 4 }, py: { xs: 1.5, sm: 2 }, borderRadius: '12px !important',
                        border: '2px solid #e0e0e0 !important',
                        '&.Mui-selected': { bgcolor: '#e3f2fd', borderColor: '#1565c0 !important', color: '#0d47a1' },
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <QrCodeIcon sx={{ fontSize: { xs: 24, sm: 36 }, mb: 0.5 }} />
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>QR Code</Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="ONLINE" sx={{
                        px: { xs: 2, sm: 4 }, py: { xs: 1.5, sm: 2 }, borderRadius: '12px !important',
                        border: '2px solid #e0e0e0 !important',
                        '&.Mui-selected': { bgcolor: '#ede7f6', borderColor: '#5e35b1 !important', color: '#4527a0' },
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <PaymentIcon sx={{ fontSize: { xs: 24, sm: 36 }, mb: 0.5 }} />
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Razorpay</Typography>
                        </Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>

                  {paymentMethod && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Amount (₹)"
                        type="number"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        sx={{ mb: 2 }}
                        required
                      />

                      {paymentMethod === 'ONLINE' && paymentAmount && parseFloat(paymentAmount) > 0 && (
                        <Card sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: '#f5f0ff', borderRadius: 2, border: '1px solid #d1c4e9' }}>
                          <PaymentIcon sx={{ fontSize: 40, color: '#5e35b1', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4527a0', mb: 0.5 }}>
                            Pay ₹{paymentAmount} via Razorpay
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                            Razorpay checkout will open. Supports UPI, Cards, Net Banking & Wallets.
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                            Payment is auto-verified — no manual confirmation needed.
                          </Typography>
                        </Card>
                      )}

                      {paymentMethod === 'QR' && paymentAmount && parseFloat(paymentAmount) > 0 && (
                        <Card sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                            Scan QR Code to Pay ₹{paymentAmount}
                          </Typography>
                          {/* QR Code — using actual UPI ID */}
                          <Box sx={{ display: 'inline-block', p: 2, bgcolor: '#fff', borderRadius: 2, border: '2px solid #e0e0e0' }}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                `upi://pay?pa=leoankitmessi0@okhdfcbank&pn=Ankit Kumar&am=${paymentAmount}&cu=INR&tn=Consultation Fee - ${bookedAppointment.patientName}`
                              )}`}
                              alt="Payment QR Code"
                              style={{ width: 200, height: 200 }}
                            />
                          </Box>
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: '#888' }}>
                            UPI Payment • Ankit Kumar
                          </Typography>
                        </Card>
                      )}

                      <TextField
                        fullWidth
                        label="Notes (optional)"
                        value={paymentNotes}
                        onChange={e => setPaymentNotes(e.target.value)}
                        multiline rows={2}
                        sx={{ mb: 2 }}
                      />

                      <Button
                        fullWidth variant="contained" size="large"
                        onClick={handleRecordPayment}
                        disabled={paymentLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                        sx={{
                          background: paymentMethod === 'ONLINE'
                            ? 'linear-gradient(135deg, #4527a0, #5e35b1)'
                            : paymentMethod === 'QR'
                              ? 'linear-gradient(135deg, #0d47a1, #1565c0)'
                              : 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                          fontWeight: 700, py: 1.5, borderRadius: 2,
                          '&:hover': {
                            background: paymentMethod === 'ONLINE'
                              ? 'linear-gradient(135deg, #311b92, #4527a0)'
                              : paymentMethod === 'QR'
                                ? 'linear-gradient(135deg, #0a3d8e, #0d47a1)'
                                : 'linear-gradient(135deg, #145218, #1b5e20)',
                          },
                        }}
                      >
                        {paymentLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : paymentMethod === 'ONLINE' ? `Pay ₹${paymentAmount || '0'} with Razorpay` : `Record ${paymentMethod} Payment`}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Fade>
        )}

        {/* ═══════════ TAB 1: STANDALONE PAYMENT ═══════════ */}
        {activeTab === 1 && (
          <Fade in>
            <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 700, mx: 'auto' }} elevation={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon /> Record Payment
              </Typography>

              <TextField
                fullWidth label="Patient Name" value={patientName}
                onChange={e => setPatientName(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                sx={{ mb: 2 }} required
              />
              <TextField
                fullWidth label="Patient Phone" value={patientPhone}
                onChange={e => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                sx={{ mb: 2 }} required
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={selectedDoctor?.username || ''}
                  onChange={e => {
                    const doc = doctors.find(d => d.username === e.target.value)
                    setSelectedDoctor(doc || null)
                  }}
                  label="Doctor"
                >
                  {doctors.map(d => (
                    <MenuItem key={d.id} value={d.username}>
                      {d.fullName || d.name} — {d.specialization}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 3 }} />

              <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <FormLabel sx={{ fontWeight: 600, mb: 1.5 }}>Payment Method</FormLabel>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(_, v) => v && setPaymentMethod(v)}
                  fullWidth
                  sx={{ gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}
                >
                  <ToggleButton value="CASH" sx={{
                    py: { xs: 2, sm: 3 }, borderRadius: '12px !important', border: '2px solid #e0e0e0 !important',
                    '&.Mui-selected': { bgcolor: '#e8f5e9', borderColor: '#2e7d32 !important' },
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CashIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#2e7d32' }} />
                      <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '1rem' } }}>Cash Payment</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="QR" sx={{
                    py: { xs: 2, sm: 3 }, borderRadius: '12px !important', border: '2px solid #e0e0e0 !important',
                    '&.Mui-selected': { bgcolor: '#e3f2fd', borderColor: '#1565c0 !important' },
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <QrCodeIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#1565c0' }} />
                      <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '1rem' } }}>QR Code Payment</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="ONLINE" sx={{
                    py: { xs: 2, sm: 3 }, borderRadius: '12px !important', border: '2px solid #e0e0e0 !important',
                    '&.Mui-selected': { bgcolor: '#ede7f6', borderColor: '#5e35b1 !important' },
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PaymentIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#5e35b1' }} />
                      <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '1rem' } }}>Razorpay (Online)</Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>

              {paymentMethod && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth label="Amount (₹)" type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    sx={{ mb: 2 }} required
                  />

                  {paymentMethod === 'ONLINE' && paymentAmount && parseFloat(paymentAmount) > 0 && (
                    <Card sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: '#f5f0ff', borderRadius: 2, border: '1px solid #d1c4e9' }}>
                      <PaymentIcon sx={{ fontSize: 40, color: '#5e35b1', mb: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4527a0', mb: 0.5 }}>
                        Pay ₹{paymentAmount} via Razorpay
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                        Razorpay checkout will open. Supports UPI, Cards, Net Banking & Wallets.
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                        Payment is auto-verified — no manual confirmation needed.
                      </Typography>
                    </Card>
                  )}

                  {paymentMethod === 'QR' && paymentAmount && parseFloat(paymentAmount) > 0 && (
                    <Card sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        Scan QR Code to Pay ₹{paymentAmount}
                      </Typography>
                      <Box sx={{ display: 'inline-block', p: 2, bgcolor: '#fff', borderRadius: 2, border: '2px solid #e0e0e0' }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            `upi://pay?pa=leoankitmessi0@okhdfcbank&pn=Ankit Kumar&am=${paymentAmount}&cu=INR&tn=Consultation - ${patientName}`
                          )}`}
                          alt="Payment QR"
                          style={{ width: 200, height: 200 }}
                        />
                      </Box>
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: '#888' }}>
                        UPI Payment • Ankit Kumar
                      </Typography>
                    </Card>
                  )}

                  <TextField
                    fullWidth label="Notes (optional)"
                    value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                    multiline rows={2} sx={{ mb: 2 }}
                  />

                  <Button
                    fullWidth variant="contained" size="large"
                    onClick={handleRecordPayment}
                    disabled={paymentLoading || !patientName.trim() || !paymentAmount || parseFloat(paymentAmount) <= 0}
                    sx={{
                      background: paymentMethod === 'ONLINE'
                        ? 'linear-gradient(135deg, #4527a0, #5e35b1)'
                        : paymentMethod === 'QR'
                          ? 'linear-gradient(135deg, #0d47a1, #1565c0)' : 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                      fontWeight: 700, py: 1.5, borderRadius: 2,
                    }}
                  >
                    {paymentLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : paymentMethod === 'ONLINE' ? `Pay ₹${paymentAmount || '0'} with Razorpay` : `Record ${paymentMethod} Payment — ₹${paymentAmount || '0'}`}
                  </Button>
                </Box>
              )}
            </Paper>
          </Fade>
        )}

        {/* ═══════════ TAB 2: TODAY'S OVERVIEW ═══════════ */}
        {activeTab === 2 && (
          <Fade in>
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #1b5e20, #4caf50)', color: '#fff', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>Today's Appointments</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800 }}>{todayAppointments.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #0d47a1, #42a5f5)', color: '#fff', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>Payments Collected</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800 }}>{todayPayments.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #e65100, #ff9800)', color: '#fff', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>Total Revenue</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800 }}>₹{todayRevenue.toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<RefreshIcon />} onClick={fetchTodayData} disabled={loadingToday} variant="outlined" color="success">
                  Refresh
                </Button>
              </Box>

              {loadingToday ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress color="success" /></Box>
              ) : (
                <>
                  {/* Today's Appointments Table */}
                  <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }} elevation={2}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f1f8e9' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventNoteIcon fontSize="small" /> Appointments Today
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {todayAppointments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                                No appointments today
                              </TableCell>
                            </TableRow>
                          ) : todayAppointments.map((apt, i) => (
                            <TableRow key={apt.id} hover>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{apt.patientName}</TableCell>
                              <TableCell>{apt.patientPhone}</TableCell>
                              <TableCell>{apt.doctorName}</TableCell>
                              <TableCell>{apt.timeSlot || apt.preferredTime || apt.appointmentTime}</TableCell>
                              <TableCell>
                                <Chip
                                  label={apt.status}
                                  size="small"
                                  color={
                                    apt.status === 'APPROVED' ? 'success'
                                    : apt.status === 'COMPLETED' ? 'info'
                                    : apt.status === 'CANCELLED' ? 'error'
                                    : 'warning'
                                  }
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Today's Payments Table */}
                  <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={2}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#e3f2fd' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon fontSize="small" /> Payments Today
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Receipt</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {todayPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                                No payments today
                              </TableCell>
                            </TableRow>
                          ) : todayPayments.map((pay, i) => (
                            <TableRow key={pay.id} hover>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.receiptNumber}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{pay.patientName}</TableCell>
                              <TableCell>{pay.doctorName}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#1b5e20' }}>₹{pay.amount?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={pay.paymentMethod === 'CASH' ? <CashIcon /> : pay.paymentMethod === 'ONLINE' ? <PaymentIcon /> : <QrCodeIcon />}
                                  label={pay.paymentMethod === 'ONLINE' ? 'RAZORPAY' : pay.paymentMethod}
                                  size="small"
                                  color={pay.paymentMethod === 'CASH' ? 'success' : pay.paymentMethod === 'ONLINE' ? 'secondary' : 'primary'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip label={pay.paymentStatus} size="small" color={pay.paymentStatus === 'REFUNDED' ? 'info' : 'success'} sx={{ fontSize: '0.75rem' }} />
                              </TableCell>
                              <TableCell>
                                {pay.paymentStatus === 'COMPLETED' && (
                                  <Tooltip title="Refund this payment">
                                    <IconButton
                                      size="small"
                                      sx={{ color: '#c62828', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                                      onClick={() => { setRefundTargetId(pay.id); setRefundReason(''); setRefundDialogOpen(true) }}
                                    >
                                      <UndoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {pay.paymentStatus === 'REFUNDED' && (
                                  <Typography sx={{ fontSize: '0.7rem', color: '#1565c0', fontStyle: 'italic' }}>Refunded</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </>
              )}
            </Box>
          </Fade>
        )}

        {/* ═══════════ TAB 3: APPOINTMENT REQUESTS ═══════════ */}
        {activeTab === 3 && (
          <Fade in>
            <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 1100, mx: 'auto' }} elevation={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon /> Patient Appointment Requests
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={fetchPendingRequests} size="small" variant="outlined" color="success">
                  Refresh
                </Button>
              </Box>

              {loadingPending ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#2e7d32' }} />
                </Box>
              ) : pendingRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                  <AssignmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography variant="h6" color="text.secondary">No pending appointment requests</Typography>
                  <Typography variant="body2" color="text.secondary">Patient-booked appointments will appear here for your review</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Appt #</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Specialization</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Time Pref.</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingRequests.map((apt) => {
                        const isOnHold = apt.status === 'ON_HOLD'
                        return (
                        <TableRow
                          key={apt.id}
                          hover
                          sx={{
                            bgcolor: isOnHold ? '#FFF8E1' : 'inherit',
                            borderLeft: isOnHold ? '4px solid #E65100' : 'none',
                            '&:hover': { bgcolor: isOnHold ? '#FFF3E0' : '#f1f8e9' },
                          }}
                        >
                          <TableCell>
                            <Chip label={`#${apt.appointmentNumber ?? apt.id}`} size="small" sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{apt.patientName}</TableCell>
                          <TableCell>{apt.patientPhone}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{apt.doctorName || apt.doctorUsername}</TableCell>
                          <TableCell>
                            <Chip label={apt.specialization} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell>{apt.appointmentDate}</TableCell>
                          <TableCell>{apt.preferredTime || '—'}</TableCell>
                          <TableCell>
                            {isOnHold ? (
                              <Tooltip title={apt.doctorMessage || 'On hold — click to update'}>
                                <Chip
                                  icon={<HoldIcon sx={{ fontSize: 16 }} />}
                                  label="ON HOLD"
                                  size="small"
                                  clickable
                                  onClick={(e) => { setHoldMenuAnchor(e.currentTarget as HTMLElement); setHoldMenuId(apt.id) }}
                                  sx={{ fontWeight: 700, bgcolor: '#FFF3E0', color: '#E65100', border: '1px solid #E65100', cursor: 'pointer', '&:hover': { bgcolor: '#FFE0B2' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label="PENDING"
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', border: '1px solid #1565c0' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title={isOnHold ? 'Approve (doctor is now available)' : 'Approve & assign queue'}>
                                <IconButton
                                  size="small"
                                  sx={{ color: '#2e7d32', bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' } }}
                                  onClick={() => handleApproveRequest(apt.id)}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isOnHold ? 'Update hold reason' : 'Put on hold'}>
                                <IconButton
                                  size="small"
                                  sx={{ color: '#E65100', bgcolor: '#FFF3E0', '&:hover': { bgcolor: '#FFE0B2' } }}
                                  onClick={(e) => { setHoldMenuAnchor(e.currentTarget); setHoldMenuId(apt.id) }}
                                >
                                  <HoldIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  sx={{ color: '#c62828', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                                  onClick={() => { setRejectDialogId(apt.id); setRejectMessage(''); setRejectDialogOpen(true) }}
                                >
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Fade>
        )}
      </Box>

      {/* ──── Reject Reason Dialog ──── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ffebee', fontWeight: 700, color: '#c62828' }}>
          Reject Appointment
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Optionally provide a reason for rejection:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Reason for rejection (optional)"
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleRejectRequest} variant="contained" color="error" sx={{ fontWeight: 600 }}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──── Hold Options Menu ──── */}
      <Menu
        anchorEl={holdMenuAnchor}
        open={Boolean(holdMenuAnchor)}
        onClose={() => { setHoldMenuAnchor(null); setHoldMenuId(null) }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(230,81,0,0.15)',
            minWidth: 220,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
          <Typography sx={{ fontWeight: 700, color: '#E65100', fontSize: '0.85rem' }}>
            <HoldIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Put On Hold
          </Typography>
        </Box>
        {[
          { label: 'Wait 30 minutes', msg: 'Please wait 30 minutes' },
          { label: 'Wait 1 hour', msg: 'Please wait 1 hour' },
          { label: 'Wait 2 hours', msg: 'Please wait 2 hours' },
          { label: 'Doctor is unavailable', msg: 'Doctor is currently unavailable' },
        ].map((opt) => (
          <MenuItem
            key={opt.label}
            onClick={() => holdMenuId && handleHoldRequest(holdMenuId, opt.msg)}
            sx={{ fontSize: '0.88rem', fontWeight: 600, py: 1.2, '&:hover': { bgcolor: '#FFF3E0' } }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>

      {/* ──── Refund Payment Dialog ──── */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ffebee', fontWeight: 700, color: '#c62828', display: 'flex', alignItems: 'center', gap: 1 }}>
          <UndoIcon /> Refund Payment
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            This will refund the payment. Please provide a reason:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Reason for refund (e.g., appointment cancelled, duplicate payment)"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefundDialogOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button
            onClick={handleRefundPayment}
            variant="contained"
            color="error"
            disabled={refundLoading}
            sx={{ fontWeight: 600 }}
          >
            {refundLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──── Payment Success Dialog ──── */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#2e7d32' }} />
          Payment Recorded Successfully
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {paymentSuccess && (
            <Box>
              <Card sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', color: '#1b5e20', mb: 2 }}>
                  Receipt
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Receipt No.</Typography>
                    <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>{paymentSuccess.receiptNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Amount</Typography>
                    <Typography fontWeight={700} sx={{ color: '#1b5e20', fontSize: '1.2rem' }}>₹{paymentSuccess.amount?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Patient</Typography>
                    <Typography fontWeight={600}>{paymentSuccess.patientName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Method</Typography>
                    <Chip
                      icon={paymentSuccess.paymentMethod === 'CASH' ? <CashIcon /> : paymentSuccess.paymentMethod === 'ONLINE' ? <PaymentIcon /> : <QrCodeIcon />}
                      label={paymentSuccess.paymentMethod === 'ONLINE' ? 'RAZORPAY' : paymentSuccess.paymentMethod}
                      size="small"
                      color={paymentSuccess.paymentMethod === 'CASH' ? 'success' : paymentSuccess.paymentMethod === 'ONLINE' ? 'secondary' : 'primary'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Doctor</Typography>
                    <Typography>{paymentSuccess.doctorName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={paymentSuccess.paymentStatus} color="success" size="small" />
                  </Grid>
                </Grid>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setShowPaymentDialog(false); resetBooking() }} variant="contained" color="success" sx={{ fontWeight: 600 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──── Snackbar ──── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Real-time notification popup ── */}
      <Snackbar
        open={showNotifPopup}
        autoHideDuration={6000}
        onClose={dismissPopup}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={dismissPopup} severity="info" variant="filled" sx={{ width: '100%' }}>
          {newPopupNotifs.length === 1
            ? newPopupNotifs[0].message
            : `You have ${newPopupNotifs.length} new notifications`}
        </Alert>
      </Snackbar>

      {/* ── Notification Popover ── */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 370, maxHeight: 440, borderRadius: 3, boxShadow: 8 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => { markAllRead(); setNotifAnchor(null) }}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {notifItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifItems.map(n => (
              <Box
                key={n.id}
                onClick={() => { markOneRead(n.id); }}
                sx={{
                  px: 2, py: 1.5, cursor: 'pointer',
                  bgcolor: n.read ? 'transparent' : 'rgba(25,118,210,0.06)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'flex-start', gap: 1.2,
                }}
              >
                {!n.read && <FiberManualRecordIcon sx={{ fontSize: 10, color: 'primary.main', mt: 0.8 }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={n.read ? 400 : 600}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                  <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.3 }}>
                    {formatDateTime(n.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Popover>

    </Box>
  )
}

export default ReceptionistDashboard
