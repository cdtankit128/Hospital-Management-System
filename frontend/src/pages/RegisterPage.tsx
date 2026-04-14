import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from '@mui/material'
import { authAPI } from '../services/authAPI'

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

const RegisterPage = () => {
  const [role, setRole] = useState<'doctor' | 'patient'>('patient')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })
  const navigate = useNavigate()

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const validateForm = (): boolean => {
    // Validate username
    if (!username.trim()) {
      showSnackbar('Username is required', 'warning')
      return false
    }
    if (username.length < 3) {
      showSnackbar('Username must be at least 3 characters', 'warning')
      return false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      showSnackbar('Email is required', 'warning')
      return false
    }
    if (!emailRegex.test(email)) {
      showSnackbar('Please enter a valid email address', 'warning')
      return false
    }

    // Validate password
    if (!password) {
      showSnackbar('Password is required', 'warning')
      return false
    }
    if (password.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'warning')
      return false
    }

    // Validate confirm password
    if (!confirmPassword) {
      showSnackbar('Please confirm your password', 'warning')
      return false
    }
    if (password !== confirmPassword) {
      showSnackbar('Passwords do not match', 'warning')
      return false
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      await authAPI.register({
        username: username.trim(),
        email: email.trim(),
        password,
        role: role.toUpperCase(),
      })

      // Success
      showSnackbar('Registration successful! Redirecting to login...', 'success')

      // Clear form
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      // Handle different error scenarios
      const errorData = err.response?.data
      const errorMessage = errorData?.message || errorData?.error || err.message

      // Check for duplicate registration errors
      if (errorMessage?.includes('already exists')) {
        showSnackbar('User already registered. Please login instead.', 'error')
      } else if (errorMessage?.includes('Username')) {
        showSnackbar('This username is already taken. Please choose another.', 'error')
      } else if (errorMessage?.includes('Email')) {
        showSnackbar('This email is already registered. Please login instead.', 'error')
      } else if (err.response?.status === 409) {
        showSnackbar('User already registered. Please login instead.', 'error')
      } else if (err.response?.status === 400) {
        showSnackbar(errorMessage || 'Registration failed. Please check your information.', 'error')
      } else {
        showSnackbar(
          errorMessage || 'Registration failed. Please try again later.',
          'error'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url("/get.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              color: '#1a1a1a',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
            }}
          >
            CHANDIGARH UNIVERSITY
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#1976d2',
              fontWeight: '600',
              letterSpacing: 1,
              fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' },
            }}
          >
            HOSPITAL REGISTRATION
          </Typography>
        </Box>

        {/* Register Card */}
        <Card
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <form onSubmit={handleRegister}>
            {/* Role Selector */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Role</InputLabel>
              <Select
                value={role}
                label="Select Role"
                onChange={(e) => setRole(e.target.value as 'doctor' | 'patient')}
                disabled={loading}
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="patient">Patient</MenuItem>
              </Select>
            </FormControl>

            {/* Username */}
            <TextField
              fullWidth
              label="Username"
              placeholder="Choose a username (min 3 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2.5 }}
              variant="outlined"
            />

            {/* Email */}
            <TextField
              fullWidth
              type="email"
              label="Email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2.5 }}
              variant="outlined"
            />

            {/* Password */}
            <TextField
              fullWidth
              type="password"
              label="Password"
              placeholder="Enter password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2.5 }}
              variant="outlined"
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              type="password"
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 3 }}
              variant="outlined"
            />

            {/* Register Button */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={
                loading || !username || !password || !confirmPassword || !email
              }
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </form>

          {/* Login Link */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#1976d2',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Login here
              </Link>
            </Typography>
          </Box>
        </Card>

        {/* Info Box */}
        <Box sx={{ mt: 4, textAlign: 'center', color: 'white' }}>
          <Typography variant="caption">
            Register as Doctor or Patient only. Admin accounts are created by administrators.
          </Typography>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
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

export default RegisterPage
