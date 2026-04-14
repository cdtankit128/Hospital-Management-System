import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import IconButton from '@mui/material/IconButton'
import { authAPI } from '../services/authAPI'

const designations = [
  { value: 'MBBS', label: 'MBBS – Bachelor of Medicine, Bachelor of Surgery' },
  { value: 'BDS', label: 'BDS – Bachelor of Dental Surgery' },
  { value: 'MD', label: 'MD – Doctor of Medicine' },
  { value: 'MS', label: 'MS – Master of Surgery' },
  { value: 'DNB', label: 'DNB – Diplomate of National Board' },
  { value: 'DM', label: 'DM – Doctorate of Medicine (Super-Specialty)' },
  { value: 'MCh', label: 'MCh – Master of Chirurgiae (Super-Specialty Surgery)' },
  { value: 'DCH', label: 'DCH – Diploma in Child Health (Pediatrics)' },
  { value: 'DGO', label: 'DGO – Diploma in Gynecology & Obstetrics' },
  { value: 'DA', label: 'DA – Diploma in Anaesthesiology' },
  { value: 'PhD', label: 'PhD – Doctor of Philosophy (Medical Research)' },
  { value: 'Fellowship', label: 'Fellowship – Advanced Specialty Fellowship Training' },
]

const specializations = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Psychiatrist',
  'Orthopedic Surgeon',
  'Gynecologist',
  'Pediatrician',
  'ENT Specialist',
  'Ophthalmologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Nephrologist',
  'Urologist',
  'Endocrinologist',
  'Oncologist',
  'Radiologist',
  'Pathologist',
  'Dentist',
  'General Surgeon',
]

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

const DoctorRegisterPage = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [gender, setGender] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('')
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
    if (!designation.trim()) {
      showSnackbar('Designation is required', 'warning')
      return
    }
    if (!specialization) {
      showSnackbar('Please select a specialization', 'warning')
      return
    }
    if (!gender) {
      showSnackbar('Please select gender', 'warning')
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      showSnackbar('Username must be at least 3 characters', 'warning')
      return
    }
    if (!password || password.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'warning')
      return
    }
    if (!phone.trim() || phone.trim().length !== 10) {
      showSnackbar('Phone number must be exactly 10 digits', 'warning')
      return
    }

    setLoading(true)
    try {
      await authAPI.register({
        username: username.trim(),
        email: `${username.trim().toLowerCase().replace(/\s+/g, '.')}@hospital.com`,
        password,
        role: 'DOCTOR',
        fullName: fullName.trim(),
        specialization,
        designation,
        gender,
        phone: phone.trim(),
        experience: experience ? parseInt(experience) : 0,
      })

      showSnackbar('Doctor registered successfully! You can now login with your credentials.', 'success')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
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
            maxWidth: 440,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)',
            p: { xs: 2.5, sm: 3 },
            my: 'auto',
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
          }}
        >
          {/* Title */}
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#fff',
              mb: 0.3,
              textAlign: 'center',
            }}
          >
            Register as Doctor
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.85rem',
              mb: 2,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Fill in the details to register your doctor login dashboard.
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
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.2,
                fontSize: '0.93rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Designation Dropdown */}
          <FormControl
            fullWidth
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)', legend: { display: 'none' } },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
            }}
          >
            <Select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <WorkOutlineIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              }
              renderValue={(selected) =>
                selected ? (
                  <span style={{ color: '#fff' }}>{selected}</span>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>Designation</span>
                )
              }
              sx={{
                '& .MuiSelect-select': {
                  py: 1.2,
                  fontSize: '0.93rem',
                },
                '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 0.5,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxHeight: 280,
                    '& .MuiMenuItem-root': {
                      py: 1.2,
                      px: 2,
                      fontSize: '0.88rem',
                      '&:hover': {
                        backgroundColor: '#f3e8ff',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#ede5ff',
                        '&:hover': { backgroundColor: '#e0d4f5' },
                      },
                    },
                  },
                },
              }}
            >
              {designations.map((deg) => (
                <MenuItem key={deg.value} value={deg.value}>
                  {deg.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Specialization Dropdown */}
          <FormControl
            fullWidth
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)', legend: { display: 'none' } },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
            }}
          >
            <Select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <LocalHospitalIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              }
              renderValue={(selected) =>
                selected ? (
                  <span style={{ color: '#fff' }}>{selected}</span>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>Specialization</span>
                )
              }
              sx={{
                '& .MuiSelect-select': {
                  py: 1.2,
                  fontSize: '0.93rem',
                },
                '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 0.5,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxHeight: 280,
                    '& .MuiMenuItem-root': {
                      py: 1.2,
                      px: 2,
                      fontSize: '0.93rem',
                      '&:hover': {
                        backgroundColor: '#f3e8ff',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#ede5ff',
                        '&:hover': { backgroundColor: '#e0d4f5' },
                      },
                    },
                  },
                },
              }}
            >
              {specializations.map((spec) => (
                <MenuItem key={spec} value={spec}>
                  {spec}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Username */}
          <TextField
            fullWidth
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircleOutlinedIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.2,
                fontSize: '0.93rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Create Password */}
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
                    size="small"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showPassword ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.2,
                fontSize: '0.93rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Phone Number */}
          <TextField
            fullWidth
            placeholder="Phone Number (10 digits)"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 10) setPhone(val)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalHospitalIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.2,
                fontSize: '0.93rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Experience */}
          <TextField
            fullWidth
            placeholder="Years of Experience"
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WorkOutlineIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
                </InputAdornment>
              ),
              inputProps: { min: 0, max: 60 },
            }}
            sx={{
              mb: 1.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
              },
              '& .MuiInputBase-input': {
                py: 1.2,
                fontSize: '0.93rem',
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.45)', opacity: 1 },
            }}
          />

          {/* Gender Radio Buttons */}
          <Box sx={{ mb: 1.5 }}>
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

          {/* Register Button */}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #122c52 0%, #091e3a 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.05rem',
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(18,44,82,0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #091e3a 0%, #061529 100%)',
                boxShadow: '0 6px 20px rgba(18,44,82,0.5)',
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
              fontSize: '0.85rem',
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
        autoHideDuration={4000}
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

export default DoctorRegisterPage
