import { useState, useEffect } from 'react'
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
  Card,
  CardContent,
  Chip,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import PaymentIcon from '@mui/icons-material/Payment'
import ReceiptIcon from '@mui/icons-material/Receipt'
import axios from 'axios'
import { apiUrl } from '../api/config'
import {
  appointmentPublicAPI,
  BookAppointmentRequest,
  AppointmentResponse,
} from '../services/appointmentAPI'
import { PaymentRecord, razorpayAPI, RazorpayOrderResponse } from '../services/paymentAPI'

interface Doctor {
  fullName: string
  username: string
  specialization: string
}

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

const steps = ['Select Doctor', 'Booking Details', 'Payment', 'Confirmation']

const CONSULTATION_FEE = 500 // Default consultation fee in ₹

const BookAppointment = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  // Doctor selection
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [specializations, setSpecializations] = useState<string[]>([])
  const [selectedSpec, setSelectedSpec] = useState<string>('')
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Booking details
  const [selectedDate, setSelectedDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [reason, setReason] = useState('')

  // Booking result
  const [bookingResult, setBookingResult] = useState<AppointmentResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  // Payment state
  const [paymentOrder, setPaymentOrder] = useState<PaymentRecord | null>(null)
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResponse | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [skipPayment, setSkipPayment] = useState(false)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })

  // Pre-fill from localStorage if patient is logged in
  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role === 'PATIENT') {
      try {
        const data = localStorage.getItem('patientData')
        if (data) {
          const parsed = JSON.parse(data)
          const name = parsed.name || parsed.patientName || localStorage.getItem('fullName') || localStorage.getItem('username') || ''
          setPatientName(name)
          // Use actual phone, fall back to patientLoginId
          const ph = parsed.phone || parsed.patientLoginId || localStorage.getItem('patientId') || ''
          if (ph) setPatientPhone(ph)
        } else {
          const name = localStorage.getItem('fullName') || localStorage.getItem('username') || ''
          setPatientName(name)
          const ph = localStorage.getItem('patientId') || ''
          if (ph) setPatientPhone(ph)
        }
      } catch {
        const name = localStorage.getItem('fullName') || localStorage.getItem('username') || ''
        setPatientName(name)
      }
    }
  }, [])

  // Fetch real registered doctors list
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(apiUrl('/api/auth/doctors-list'))
        const doctorsList: Doctor[] = response.data
        setDoctors(doctorsList)
        const specs = [...new Set(doctorsList.map((d: Doctor) => d.specialization).filter(Boolean))]
        setSpecializations(specs)
      } catch {
        showSnackbar('Failed to load doctors', 'error')
      } finally {
        setLoadingDoctors(false)
      }
    }
    fetchDoctors()
  }, [])

  const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const max = new Date()
    max.setDate(max.getDate() + 60)
    return max.toISOString().split('T')[0]
  }

  const filteredDoctors = selectedSpec
    ? doctors.filter((d) => d.specialization === selectedSpec)
    : doctors

  const canProceedStep = () => {
    switch (activeStep) {
      case 0:
        return selectedDoctor !== null
      case 1:
        return (
          selectedDate !== '' &&
          preferredTime.trim() !== '' &&
          patientName.trim() !== '' &&
          patientPhone.trim().length >= 10
        )
      default:
        return true
    }
  }

  const handleNext = () => {
    if (activeStep === 1) {
      setConfirmDialog(true)
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate) return
    setConfirmDialog(false)
    setLoading(true)

    try {
      const request: BookAppointmentRequest = {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorUsername: selectedDoctor.username,
        doctorName: selectedDoctor.fullName,
        specialization: selectedDoctor.specialization,
        appointmentDate: selectedDate,
        preferredTime: preferredTime.trim(),
        reason: reason.trim() || 'General Consultation',
      }

      const result = await appointmentPublicAPI.bookAppointment(request)
      setBookingResult(result)
      setActiveStep(2) // Go to Payment step
      showSnackbar('Appointment booked! Please complete payment.', 'success')
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to book appointment. Please try again.'
      showSnackbar(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaymentOrder = async () => {
    if (!bookingResult || !selectedDoctor) return
    setPaymentLoading(true)
    try {
      const orderResponse = await razorpayAPI.createOrder({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorName: selectedDoctor.fullName,
        specialization: selectedDoctor.specialization,
        amount: CONSULTATION_FEE,
        paymentMethod: 'ONLINE',
        notes: `Consultation fee for appointment #${bookingResult.id}`,
        appointmentId: bookingResult.id,
        payerType: 'PATIENT',
      })
      setRazorpayOrder(orderResponse)
      setPaymentOrder(orderResponse.payment)

      // Open Razorpay Checkout immediately
      razorpayAPI.openCheckout({
        razorpayKeyId: orderResponse.razorpayKeyId,
        razorpayOrderId: orderResponse.razorpayOrderId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'City Hospital & Diagnostic Centre',
        description: `Consultation Fee - Dr. ${selectedDoctor.fullName}`,
        prefill: {
          name: patientName.trim(),
          contact: patientPhone.trim(),
        },
        onSuccess: async (response) => {
          try {
            const verifyResult = await razorpayAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (verifyResult.verified) {
              setPaymentConfirmed(true)
              if (verifyResult.payment) setPaymentOrder(verifyResult.payment)
              showSnackbar('Payment successful! Verified by Razorpay.', 'success')
              setActiveStep(3) // Go to Confirmation
            } else {
              showSnackbar(verifyResult.error || 'Payment verification failed', 'error')
            }
          } catch (verifyError: any) {
            showSnackbar(verifyError.response?.data?.error || 'Payment verification failed', 'error')
          }
          setPaymentLoading(false)
        },
        onFailure: (error) => {
          showSnackbar(`Payment failed: ${error.description || error.reason || 'Unknown error'}`, 'error')
          setPaymentLoading(false)
        },
        onDismiss: () => {
          showSnackbar('Payment cancelled. You can try again or skip.', 'warning')
          setPaymentLoading(false)
        },
      })
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Failed to create payment order', 'error')
      setPaymentLoading(false)
    }
  }

  const handleSkipPayment = () => {
    setSkipPayment(true)
    setActiveStep(3) // Go to Confirmation
  }

  // ==================== RENDER STEPS ====================

  const renderDoctorSelection = () => (
    <Box>
      {/* Phase 1: Pick Specialization */}
      {!selectedSpec ? (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
            Select Specialization
          </Typography>
          <Typography sx={{ color: '#666', mb: 3, fontSize: '0.9rem' }}>
            Choose the department you want to visit
          </Typography>

          {loadingDoctors ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#6C63FF' }} />
            </Box>
          ) : specializations.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No specializations available. Please register doctors first.
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {specializations.map((spec) => {
                const count = doctors.filter((d) => d.specialization === spec).length
                return (
                  <Card
                    key={spec}
                    onClick={() => { setSelectedSpec(spec); setSelectedDoctor(null) }}
                    sx={{
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(108,99,255,0.18)',
                        transform: 'translateY(-2px)',
                        borderColor: '#6C63FF',
                      },
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #f5f4ff 0%, #eee8ff 100%)',
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: '#6C63FF',
                          color: '#fff',
                          width: 56,
                          height: 56,
                          fontSize: 20,
                          fontWeight: 700,
                        }}
                      >
                        {spec.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>
                          {spec}
                        </Typography>
                        <Typography sx={{ color: '#6C63FF', fontSize: '0.85rem', fontWeight: 600 }}>
                          {count} Doctor{count !== 1 ? 's' : ''} available
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: '#6C63FF', fontSize: 24 }} />
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          )}
        </>
      ) : (
        /* Phase 2: Pick Doctor within selected specialization */
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => { setSelectedSpec(''); setSelectedDoctor(null) }}
              sx={{ color: '#6C63FF', textTransform: 'none', fontWeight: 600, minWidth: 'auto' }}
            >
              Back
            </Button>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a2e' }}>
            Choose a Doctor
          </Typography>
          <Typography sx={{ color: '#666', mb: 3, fontSize: '0.9rem' }}>
            Showing doctors in <Chip label={selectedSpec} size="small" sx={{ bgcolor: '#6C63FF', color: '#fff', fontWeight: 700, ml: 0.5 }} />
          </Typography>

          {filteredDoctors.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No doctors found under this specialization.
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {filteredDoctors.map((doctor) => (
                <Card
                  key={doctor.username}
                  onClick={() => setSelectedDoctor(doctor)}
                  sx={{
                    cursor: 'pointer',
                    border:
                      selectedDoctor?.username === doctor.username
                        ? '2px solid #6C63FF'
                        : '2px solid transparent',
                    bgcolor: selectedDoctor?.username === doctor.username ? '#f0eeff' : '#fff',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(108,99,255,0.15)',
                      transform: 'translateY(-2px)',
                    },
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          selectedDoctor?.username === doctor.username ? '#6C63FF' : '#e8e6ff',
                        color:
                          selectedDoctor?.username === doctor.username ? '#fff' : '#6C63FF',
                        width: 56,
                        height: 56,
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    >
                      {doctor.fullName?.charAt(0) || 'D'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>
                        Dr. {doctor.fullName}
                      </Typography>
                      <Typography sx={{ color: '#6C63FF', fontSize: '0.85rem', fontWeight: 600 }}>
                        {doctor.specialization}
                      </Typography>
                    </Box>
                    {selectedDoctor?.username === doctor.username && (
                      <CheckCircleIcon sx={{ color: '#6C63FF', fontSize: 28 }} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  )

  const renderBookingDetails = () => (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
        Booking Details
      </Typography>
      <Typography sx={{ color: '#666', mb: 3, fontSize: '0.9rem' }}>
        Booking for <strong>Dr. {selectedDoctor?.fullName}</strong> ({selectedDoctor?.specialization})
      </Typography>

      {/* Patient Name */}
      <TextField
        label="Full Name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        fullWidth
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineIcon sx={{ color: '#6C63FF' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
        }}
      />

      {/* Phone Number */}
      <TextField
        label="Phone Number"
        value={patientPhone}
        onChange={(e) => setPatientPhone(e.target.value.replace(/[^0-9]/g, ''))}
        fullWidth
        required
        inputProps={{ maxLength: 10 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneAndroidOutlinedIcon sx={{ color: '#6C63FF' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
        }}
      />

      {/* Date Picker */}
      <TextField
        type="date"
        label="Preferred Date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        fullWidth
        required
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: getMinDate(), max: getMaxDate() }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthIcon sx={{ color: '#6C63FF' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
        }}
      />

      {/* Preferred Time — free text */}
      <TextField
        label="Preferred Time"
        value={preferredTime}
        onChange={(e) => setPreferredTime(e.target.value)}
        fullWidth
        required
        placeholder="e.g. Morning, 10:00 AM, Afternoon, Evening, Anytime"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccessTimeIcon sx={{ color: '#6C63FF' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
        }}
      />

      {/* Reason */}
      <TextField
        label="Reason for Visit (Optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        fullWidth
        multiline
        rows={3}
        placeholder="Describe your symptoms or reason for appointment"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
              <NoteAltOutlinedIcon sx={{ color: '#6C63FF' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
        }}
      />
    </Box>
  )

  const renderPaymentStep = () => (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
        <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#6C63FF' }} />
        Payment
      </Typography>
      <Typography sx={{ color: '#666', mb: 3, fontSize: '0.9rem' }}>
        Pay consultation fee to confirm your appointment with <strong>Dr. {selectedDoctor?.fullName}</strong>
      </Typography>

      {/* Appointment Summary */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e5f5' }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <Box>
              <Typography sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Doctor</Typography>
              <Typography sx={{ fontWeight: 600 }}>Dr. {selectedDoctor?.fullName}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{selectedDate}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Time</Typography>
              <Typography sx={{ fontWeight: 600 }}>{preferredTime}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Amount</Typography>
              <Typography sx={{ fontWeight: 800, color: '#6C63FF', fontSize: '1.3rem' }}>₹{CONSULTATION_FEE}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!paymentOrder ? (
        /* Pay via Razorpay */
        <Box sx={{ textAlign: 'center' }}>
          <Card sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: '#f5f4ff', borderRadius: 2, border: '1px solid #d0ccff' }}>
            <Box sx={{ mb: 2 }}>
              <img
                src="https://razorpay.com/assets/razorpay-glyph.svg"
                alt="Razorpay"
                style={{ width: 48, height: 48, marginBottom: 8 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
              Pay ₹{CONSULTATION_FEE} via Razorpay
            </Typography>
            <Typography sx={{ color: '#666', fontSize: '0.85rem', mb: 1 }}>
              Secure payment powered by Razorpay. Supports UPI, Cards, Net Banking, and Wallets.
            </Typography>
          </Card>

          <Button
            variant="contained"
            size="large"
            onClick={handleCreatePaymentOrder}
            disabled={paymentLoading}
            startIcon={paymentLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PaymentIcon />}
            sx={{
              bgcolor: '#6C63FF',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
              mb: 2,
              '&:hover': { bgcolor: '#5a52e0' },
            }}
          >
            {paymentLoading ? 'Opening Razorpay...' : 'Pay Now with Razorpay'}
          </Button>

          <Box>
            <Button
              onClick={handleSkipPayment}
              sx={{ color: '#999', textTransform: 'none', fontSize: '0.85rem' }}
            >
              Skip payment — Pay at reception later
            </Button>
          </Box>
        </Box>
      ) : !paymentConfirmed ? (
        /* Order created — waiting for confirmation or retry */
        <Box sx={{ textAlign: 'center' }}>
          <Card sx={{ p: 3, mb: 2, bgcolor: '#FFF8E1', borderRadius: 2, border: '1px solid #FFE082' }}>
            <ReceiptIcon sx={{ fontSize: 40, color: '#F57F17', mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: '#F57F17', mb: 1 }}>Payment Order Created</Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#555' }}>
              Receipt: <strong>{paymentOrder.receiptNumber}</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#555' }}>
              Amount: <strong>₹{paymentOrder.amount}</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#888', mt: 1 }}>
              Status: <Chip label="PENDING" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700 }} />
            </Typography>
          </Card>

          <Button
            variant="contained"
            size="large"
            onClick={() => {
              if (razorpayOrder && selectedDoctor) {
                setPaymentLoading(true)
                razorpayAPI.openCheckout({
                  razorpayKeyId: razorpayOrder.razorpayKeyId,
                  razorpayOrderId: razorpayOrder.razorpayOrderId,
                  amount: razorpayOrder.amount,
                  currency: razorpayOrder.currency,
                  name: 'City Hospital & Diagnostic Centre',
                  description: `Consultation Fee - Dr. ${selectedDoctor.fullName}`,
                  prefill: {
                    name: patientName.trim(),
                    contact: patientPhone.trim(),
                  },
                  onSuccess: async (response) => {
                    try {
                      const verifyResult = await razorpayAPI.verifyPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                      })
                      if (verifyResult.verified) {
                        setPaymentConfirmed(true)
                        if (verifyResult.payment) setPaymentOrder(verifyResult.payment)
                        showSnackbar('Payment successful! Verified by Razorpay.', 'success')
                        setActiveStep(3)
                      } else {
                        showSnackbar(verifyResult.error || 'Payment verification failed', 'error')
                      }
                    } catch (verifyError: any) {
                      showSnackbar(verifyError.response?.data?.error || 'Payment verification failed', 'error')
                    }
                    setPaymentLoading(false)
                  },
                  onFailure: (error) => {
                    showSnackbar(`Payment failed: ${error.description || 'Unknown error'}`, 'error')
                    setPaymentLoading(false)
                  },
                  onDismiss: () => {
                    showSnackbar('Payment cancelled', 'warning')
                    setPaymentLoading(false)
                  },
                })
              }
            }}
            disabled={paymentLoading}
            startIcon={paymentLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PaymentIcon />}
            sx={{
              bgcolor: '#6C63FF',
              borderRadius: 2,
              px: 4,
              py: 1.2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              mb: 1,
              '&:hover': { bgcolor: '#5a52e0' },
            }}
          >
            {paymentLoading ? 'Processing...' : 'Retry Payment with Razorpay'}
          </Button>

          <Box>
            <Button
              onClick={handleSkipPayment}
              sx={{ color: '#999', textTransform: 'none', fontSize: '0.85rem' }}
            >
              Skip — Pay at reception later
            </Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  )

  const renderConfirmation = () => (
    <Box sx={{ textAlign: 'center' }}>
      {/* Success icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 50, color: '#4caf50' }} />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>
        Appointment Requested!
      </Typography>
      <Typography sx={{ color: '#666', mb: 4, maxWidth: 420, mx: 'auto' }}>
        Your appointment request has been sent to the receptionist for review. Once approved, you will see the confirmed timing on your dashboard.
        {paymentConfirmed && (
          <Typography component="span" sx={{ display: 'block', mt: 1, color: '#4caf50', fontWeight: 600 }}>
            ✓ Payment of ₹{CONSULTATION_FEE} has been confirmed.
          </Typography>
        )}
        {skipPayment && (
          <Typography component="span" sx={{ display: 'block', mt: 1, color: '#F57F17', fontWeight: 600 }}>
            ⚠ Payment pending — please pay at the reception desk.
          </Typography>
        )}
      </Typography>

      {bookingResult && (
        <Card sx={{ textAlign: 'left', borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Appointment ID
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#6C63FF' }}>
                  #{bookingResult.id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Status
                </Typography>
                <Chip
                  label="PENDING"
                  size="small"
                  sx={{ bgcolor: '#fff3e0', color: '#f57c00', fontWeight: 700 }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Doctor
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  Dr. {bookingResult.doctorName}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#6C63FF' }}>
                  {bookingResult.specialization}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Preferred Date & Time
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {new Date(bookingResult.appointmentDate + 'T00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#6C63FF' }}>
                  {bookingResult.preferredTime}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/patient/dashboard')}
          sx={{
            borderColor: '#6C63FF',
            color: '#6C63FF',
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setActiveStep(0)
            setSelectedDoctor(null)
            setSelectedDate('')
            setPreferredTime('')
            setReason('')
            setBookingResult(null)
            setPaymentOrder(null)
            setRazorpayOrder(null)
            setPaymentConfirmed(false)
            setSkipPayment(false)
          }}
          sx={{
            bgcolor: '#6C63FF',
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#5a52e0' },
          }}
        >
          Book Another
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
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
          opacity: 0.15,
          zIndex: 0,
        }}
      />
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            mb: 1,
          }}
        >
          <EventAvailableIcon sx={{ color: '#fff', fontSize: { xs: 28, sm: 36 } }} />
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: 1, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.125rem' } }}>
            Book Appointment
          </Typography>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
          City Hospital & Diagnostic Centre
        </Typography>
      </Box>

      {/* Main Card */}
      <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto', px: 2, position: 'relative', zIndex: 1 }}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            overflow: 'visible',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: { xs: '0.7rem', sm: '0.85rem' },
                        fontWeight: activeStep === index ? 700 : 400,
                      },
                      '& .MuiStepIcon-root': {
                        color:
                          index < activeStep
                            ? '#4caf50'
                            : index === activeStep
                              ? '#6C63FF'
                              : '#ddd',
                        '&.Mui-active': { color: '#6C63FF' },
                        '&.Mui-completed': { color: '#4caf50' },
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box sx={{ minHeight: 300 }}>
              {activeStep === 0 && renderDoctorSelection()}
              {activeStep === 1 && renderBookingDetails()}
              {activeStep === 2 && renderPaymentStep()}
              {activeStep === 3 && renderConfirmation()}
            </Box>

            {/* Navigation Buttons */}
            {activeStep < 2 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  onClick={() => (activeStep === 0 ? navigate(-1) : handleBack())}
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: '#666', textTransform: 'none', fontWeight: 600 }}
                >
                  {activeStep === 0 ? 'Back' : 'Previous'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!canProceedStep() || loading}
                  endIcon={
                    loading ? (
                      <CircularProgress size={18} sx={{ color: '#fff' }} />
                    ) : (
                      <ArrowForwardIcon />
                    )
                  }
                  sx={{
                    bgcolor: '#6C63FF',
                    borderRadius: 2,
                    px: 4,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#5a52e0' },
                    '&.Mui-disabled': { bgcolor: '#ccc' },
                  }}
                >
                  {activeStep === 1 ? 'Book Appointment' : 'Next'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Back to Login */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            onClick={() => navigate('/login')}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            ← Back to Home
          </Button>
        </Box>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          Confirm Appointment Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 1.5, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MedicalServicesIcon sx={{ color: '#6C63FF' }} />
              <Typography>
                <strong>Doctor:</strong> Dr. {selectedDoctor?.fullName} (
                {selectedDoctor?.specialization})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <CalendarMonthIcon sx={{ color: '#6C63FF' }} />
              <Typography>
                <strong>Date:</strong>{' '}
                {selectedDate &&
                  new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <AccessTimeIcon sx={{ color: '#6C63FF' }} />
              <Typography>
                <strong>Preferred Time:</strong> {preferredTime}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <PersonOutlineIcon sx={{ color: '#6C63FF' }} />
              <Typography>
                <strong>Patient:</strong> {patientName} ({patientPhone})
              </Typography>
            </Box>
            {reason && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <NoteAltOutlinedIcon sx={{ color: '#6C63FF' }} />
                <Typography>
                  <strong>Reason:</strong> {reason}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: '#FFF8E1',
              borderRadius: 2,
              border: '1px solid #FFE082',
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: '#F57F17' }}>
              <strong>Note:</strong> The receptionist will review your request and forward it to the
              doctor. You will receive a notification once approved.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setConfirmDialog(false)}
            sx={{ color: '#666', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBookAppointment}
            disabled={loading}
            sx={{
              bgcolor: '#6C63FF',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#5a52e0' },
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Confirm & Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default BookAppointment
