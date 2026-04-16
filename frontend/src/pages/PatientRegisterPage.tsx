import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined'
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import axios from 'axios'
import { apiUrl } from '../api/config'

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

const PatientRegisterPage = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      showSnackbar('Full Name is required', 'warning')
      return
    }
    if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 150) {
      showSnackbar('Please enter a valid age', 'warning')
      return
    }
    if (!phone.trim() || phone.length !== 10) {
      showSnackbar('Please enter a valid 10-digit mobile number', 'warning')
      return
    }
    if (!gender) {
      showSnackbar('Please select gender', 'warning')
      return
    }
    if (!password || password.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'warning')
      return
    }

    setLoading(true)
    try {
      await axios.post(apiUrl('/api/patients'), {
        name: fullName.trim(),
        age: Number(age),
        gender,
        phone: phone.trim(),
        plaintextPassword: password,
      })

      showSnackbar(
        `Registered successfully! Login with your Mobile Number and Password.`,
        'success'
      )
      setTimeout(() => navigate('/patient-login'), 3000)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please try again.'
      showSnackbar(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: '#0a1929',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("/get.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.55,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,25,41,0.3) 0%, rgba(10,25,41,0.15) 40%, rgba(10,25,41,0.25) 70%, rgba(10,25,41,0.45) 100%)',
            zIndex: 1,
          },
        }}
      />

      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
        }}
      >
        <Box
          component="img"
          src="/cu-logo.png"
          alt="CU Logo"
          sx={{
            width: 45,
            height: 45,
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        />
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: { xs: '0.9rem', md: '1.15rem' },
            letterSpacing: 1.5,
            textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          CHANDIGARH UNIVERSITY HOSPITAL
        </Typography>
      </Box>

      {/* Center Card */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          px: 2,
          py: 1,
          overflow: 'auto',
        }}
      >
        <Box
          component="form"
          onSubmit={handleRegister}
          sx={{
            width: '100%',
            maxWidth: 460,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)',
            p: { xs: 2.5, sm: 3.5 },
            my: 'auto',
          }}
        >
          {/* Title */}
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.65rem',
              color: '#fff',
              mb: 0.5,
              textAlign: 'center',
            }}
          >
            Register as Patient
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.88rem',
              mb: 2.5,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Fill in the details to register your patient account.
          </Typography>

          {/* Full Name */}
          <TextField
            fullWidth
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2.2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Age */}
          <TextField
            fullWidth
            placeholder="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CakeOutlinedIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
              inputProps: { min: 1, max: 150 },
            }}
            sx={{
              mb: 2.2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Mobile Number with +91 */}
          <TextField
            fullWidth
            placeholder="Mobile Number"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 10) setPhone(val)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneAndroidOutlinedIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      ml: 0.5,
                      pr: 1,
                      borderRight: '1px solid rgba(255,255,255,0.25)',
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontSize: '1rem', lineHeight: 1 }}
                    >
                      🇮🇳
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 600,
                      }}
                    >
                      +91
                    </Typography>
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Gender Radio Buttons */}
          <Box sx={{ mb: 2.2 }}>
            <RadioGroup
              row
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              sx={{
                justifyContent: 'flex-start',
                gap: 3,
                ml: 0.5,
              }}
            >
              <FormControlLabel
                value="Male"
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      '&.Mui-checked': { color: 'rgba(255,255,255,0.85)' },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Male
                  </Typography>
                }
              />
              <FormControlLabel
                value="Female"
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      '&.Mui-checked': { color: 'rgba(255,255,255,0.85)' },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Female
                  </Typography>
                }
              />
            </RadioGroup>
          </Box>

          {/* Password */}
          <TextField
            fullWidth
            placeholder="Create Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Register Button */}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #1e5c22 0%, #14461a 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.05rem',
              py: 1.3,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(30,92,34,0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #14461a 0%, #0e3313 100%)',
                boxShadow: '0 6px 20px rgba(30,92,34,0.5)',
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.5)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register'}
          </Button>

          {/* Already have an account */}
          <Typography
            sx={{
              textAlign: 'center',
              mt: 1.5,
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem',
            }}
          >
            Already have an account?{' '}
            <Box
              component="span"
              onClick={() => navigate('/login')}
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 700,
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                  color: '#fff',
                },
              }}
            >
              Login here
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(13, 43, 82, 0.85)',
          backdropFilter: 'blur(10px)',
          py: 1.2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>
          &copy; {new Date().getFullYear()} Chandigarh University Hospital Management System. All
          rights reserved.
        </Typography>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default PatientRegisterPage
