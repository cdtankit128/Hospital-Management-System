import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import axios from 'axios'
import { BACKEND_URL, IS_NGROK } from '../api/config'

interface PatientLoginData {
  patientLoginId: string
  patientPassword: string
}

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

// Create a separate axios instance without the redirect interceptor for patient login
const patientApi = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  withCredentials: !BACKEND_URL,
  ...(IS_NGROK && {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  }),
})

const PatientLoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState<PatientLoginData>({
    patientLoginId: '',
    patientPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientLoginId.trim()) {
      showSnackbar('Mobile Number is required', 'warning')
      return
    }

    if (!formData.patientPassword.trim()) {
      showSnackbar('Password is required', 'warning')
      return
    }

    try {
      setLoading(true)

      console.log('Patient login attempt:', {
        patientLoginId: formData.patientLoginId,
        patientPassword: '[REDACTED]',
      })

      const response = await patientApi.post('/auth/patient/login', {
        patientLoginId: formData.patientLoginId.trim().replace(/\D/g, ''),
        patientPassword: formData.patientPassword.trim(),
      })

      console.log('Patient login response:', response.data)

      // Login through AuthContext with patient role
      login({
        token: 'patient-' + response.data.patientLoginId,  // Create a token-like value
        role: response.data.role || 'PATIENT',
        username: response.data.patientLoginId,
      })

      // Store additional patient data
      localStorage.setItem('patientData', JSON.stringify(response.data))
      localStorage.setItem('patientId', response.data.patientLoginId || '')

      showSnackbar('Login successful! Redirecting...', 'success')

      // Redirect to patient dashboard
      setTimeout(() => {
        navigate('/patient/dashboard')
      }, 500)
    } catch (err: any) {
      console.error('Patient login error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      })

      const errorData = err.response?.data
      const errorMessage = errorData?.message || errorData?.error || err.message

      if (err.response?.status === 401) {
        showSnackbar('Invalid Mobile Number or Password', 'error')
      } else if (err.response?.status === 404) {
        showSnackbar('Patient account not found', 'error')
      } else {
        showSnackbar(errorMessage || 'Login failed. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f2b4a 60%, #0a1628 100%)',
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
      {/* Decorative glow effects */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '200px',
          background: 'radial-gradient(ellipse, rgba(0, 230, 200, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 200, 180, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Login Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '380px',
          mx: 2,
          position: 'relative',
        }}
      >
        {/* Outer glow border */}
        <Box
          sx={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.3), rgba(0, 180, 160, 0.1), rgba(0, 200, 150, 0.3))',
            zIndex: 0,
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            borderRadius: '16px',
            background: 'linear-gradient(160deg, rgba(15, 50, 45, 0.92) 0%, rgba(10, 40, 38, 0.95) 50%, rgba(12, 45, 40, 0.92) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 200, 150, 0.2)',
            p: 4,
            pt: 5,
          }}
        >
          {/* User Icon */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{ width: 50, height: 50, fill: '#2ecc71' }}
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </Box>
            </Box>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#2ecc71',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              mb: 4,
            }}
          >
            Patient Login
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Patient ID Field */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 2.5,
                backgroundColor: 'rgba(0, 200, 150, 0.08)',
                border: '1px solid rgba(0, 200, 150, 0.2)',
                borderRadius: '8px',
                px: 2,
                py: 0.5,
              }}
            >
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{ width: 20, height: 20, fill: '#2ecc71', flexShrink: 0 }}
              >
                <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
              </Box>
              <TextField
                fullWidth
                placeholder="Mobile Number"
                name="patientLoginId"
                value={formData.patientLoginId}
                onChange={handleChange}
                disabled={loading}
                required
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'rgba(200, 230, 210, 0.9)',
                    fontSize: '0.95rem',
                    py: 1,
                    '&::placeholder': {
                      color: 'rgba(150, 200, 170, 0.5)',
                      opacity: 1,
                    },
                  },
                }}
                inputProps={{ maxLength: 100 }}
                autoComplete="off"
              />
            </Box>

            {/* Password Field */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 4,
                backgroundColor: 'rgba(0, 200, 150, 0.08)',
                border: '1px solid rgba(0, 200, 150, 0.2)',
                borderRadius: '8px',
                px: 2,
                py: 0.5,
              }}
            >
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{ width: 20, height: 20, fill: '#2ecc71', flexShrink: 0 }}
              >
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </Box>
              <TextField
                fullWidth
                type="password"
                placeholder="Password"
                name="patientPassword"
                value={formData.patientPassword}
                onChange={handleChange}
                disabled={loading}
                required
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'rgba(200, 230, 210, 0.9)',
                    fontSize: '0.95rem',
                    py: 1,
                    '&::placeholder': {
                      color: 'rgba(150, 200, 170, 0.5)',
                      opacity: 1,
                    },
                  },
                }}
                inputProps={{ maxLength: 100 }}
                autoComplete="current-password"
              />
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #27ae60 100%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(46, 204, 113, 0.3)',
                transition: 'all 0.3s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #219a52 0%, #27ae60 50%, #219a52 100%)',
                  boxShadow: '0 6px 25px rgba(46, 204, 113, 0.45)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'rgba(100, 100, 100, 0.4)',
                  color: 'rgba(200, 200, 200, 0.5)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: '#fff' }} />
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Back to Login link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              to="/login"
              style={{
                color: 'rgba(46, 204, 113, 0.7)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
              }}
            >
              ← Back to Login
            </Link>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 3000 : 5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', fontSize: '0.95rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default PatientLoginPage
