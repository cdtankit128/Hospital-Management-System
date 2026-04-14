import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ClearIcon from '@mui/icons-material/Clear'
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined'
import { doctorAPI } from '../services/doctorAPI'

interface PatientFormData {
  name: string
  age: string
  gender: string
  mobileNumber: string
  bloodGroup: string
}

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}

interface CredentialsModalData {
  open: boolean
  patientId: string
  patientPassword: string
  patientName: string
}

const RegisterPatientForm = () => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    age: '',
    gender: '',
    mobileNumber: '',
    bloodGroup: '',
  })
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })
  const [credentialsModal, setCredentialsModal] = useState<CredentialsModalData>({
    open: false,
    patientId: '',
    patientPassword: '',
    patientName: '',
  })

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showSnackbar(`${label} copied to clipboard!`, 'success')
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showSnackbar('Patient name is required', 'warning')
      return false
    }

    if (!formData.age) {
      showSnackbar('Age is required', 'warning')
      return false
    }
    const age = parseInt(formData.age)
    if (isNaN(age) || age < 1 || age > 150) {
      showSnackbar('Please enter a valid age', 'warning')
      return false
    }

    if (!formData.gender) {
      showSnackbar('Gender is required', 'warning')
      return false
    }

    if (!formData.mobileNumber.trim()) {
      showSnackbar('Mobile number is required', 'warning')
      return false
    }
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.mobileNumber.trim())) {
      showSnackbar('Please enter a valid 10-digit mobile number', 'warning')
      return false
    }

    if (!formData.bloodGroup) {
      showSnackbar('Blood group is required', 'warning')
      return false
    }

    return true
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const patientData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.mobileNumber.trim(),
        bloodGroup: formData.bloodGroup,
      }

      const response = await doctorAPI.registerPatient(patientData)

      setCredentialsModal({
        open: true,
        patientId: response.patientLoginId || '',
        patientPassword: response.patientPassword || '',
        patientName: response.name || '',
      })

      setFormData({
        name: '',
        age: '',
        gender: '',
        mobileNumber: '',
        bloodGroup: '',
      })
    } catch (err: any) {
      console.error('Registration error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      })
      
      const errorData = err.response?.data
      const errorMessage = errorData?.message || errorData?.error || err.message

      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error')
      } else if (
        errorMessage?.includes('already exists') ||
        err.response?.status === 409
      ) {
        showSnackbar('Patient already registered.', 'error')
      } else if (errorMessage?.includes('Email')) {
        showSnackbar('This email is already registered.', 'error')
      } else if (err.response?.status === 400) {
        showSnackbar(
          errorMessage || 'Registration failed. Please check your information.',
          'error'
        )
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

  const handleClear = () => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      mobileNumber: '',
      bloodGroup: '',
    })
    setSnackbar({ ...snackbar, open: false })
  }

  const closeCredentialsModal = () => {
    setCredentialsModal({
      open: false,
      patientId: '',
      patientPassword: '',
      patientName: '',
    })
  }

  return (
    <>
      {/* Dark medical-themed background wrapper */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '75vh',
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f2b4a 60%, #0a1628 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          p: 0,
        }}
      >
        {/* Decorative medical background elements */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '20%',
              right: '-5%',
              width: '300px',
              height: '300px',
              border: '1px solid rgba(0, 150, 255, 0.08)',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '10%',
              left: '-5%',
              width: '200px',
              height: '200px',
              border: '1px solid rgba(0, 150, 255, 0.06)',
              borderRadius: '50%',
            },
          }}
        />
        {/* Heartbeat line SVG */}
        <Box
          component="svg"
          viewBox="0 0 600 60"
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '5%',
            width: '300px',
            height: '40px',
            opacity: 0.12,
          }}
        >
          <polyline
            points="0,30 50,30 70,10 90,50 110,20 130,40 150,30 600,30"
            fill="none"
            stroke="#00bcd4"
            strokeWidth="2"
          />
        </Box>
        {/* Decorative grid dots */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '120px',
            height: '120px',
            backgroundImage: 'radial-gradient(circle, rgba(0,150,255,0.08) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
        {/* Medical cross icon top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: '8%',
            right: '25%',
            width: '40px',
            height: '40px',
            opacity: 0.07,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '35%',
              left: '10%',
              width: '80%',
              height: '30%',
              backgroundColor: '#00bcd4',
              borderRadius: '2px',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '10%',
              left: '35%',
              width: '30%',
              height: '80%',
              backgroundColor: '#00bcd4',
              borderRadius: '2px',
            },
          }}
        />

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
          }}
        >
          {/* Top Header Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              borderBottom: '1px solid rgba(0, 150, 255, 0.1)',
              background: 'rgba(10, 25, 50, 0.8)',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              +
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '1.5px',
                  lineHeight: 1.2,
                }}
              >
                CHANDIGARH UNIVERSITY
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(180, 210, 255, 0.7)',
                  letterSpacing: '1px',
                }}
              >
                HOSPITAL
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(180,210,255,0.6)' }}>
                👤 Patient:
              </Typography>
            </Box>
          </Box>

          {/* Form Container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: { xs: 1.5, sm: 4 },
            }}
          >
            <Card
              sx={{
                p: { xs: 2, sm: 4 },
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'rgba(220, 230, 245, 0.95)',
                border: '1px solid rgba(180, 200, 230, 0.3)',
                width: '100%',
                maxWidth: '550px',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  color: '#0d2137',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '1.1rem',
                }}
              >
                Register New Patient
              </Typography>

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  placeholder="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      '& fieldset': { borderColor: '#ccd6e0' },
                    },
                  }}
                  variant="outlined"
                  size="small"
                  inputProps={{ maxLength: 100 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  placeholder="Age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      '& fieldset': { borderColor: '#ccd6e0' },
                    },
                  }}
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 1, max: 150 }}
                />

                {/* Gender Radio Buttons */}
                <FormControl
                  component="fieldset"
                  sx={{
                    mb: 2,
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ccd6e0',
                    px: 2,
                    py: 1,
                  }}
                >
                  <FormLabel
                    component="legend"
                    sx={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}
                  >
                    Gender
                  </FormLabel>
                  <RadioGroup
                    row
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="Male"
                      control={<Radio size="small" sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }} />}
                      label="Male"
                      disabled={loading}
                      sx={{ '& .MuiTypography-root': { fontSize: '0.9rem' } }}
                    />
                    <FormControlLabel
                      value="Female"
                      control={<Radio size="small" sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }} />}
                      label="Female"
                      disabled={loading}
                      sx={{ '& .MuiTypography-root': { fontSize: '0.9rem' } }}
                    />
                    <FormControlLabel
                      value="Other"
                      control={<Radio size="small" sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }} />}
                      label="Other"
                      disabled={loading}
                      sx={{ '& .MuiTypography-root': { fontSize: '0.9rem' } }}
                    />
                  </RadioGroup>
                </FormControl>

                <TextField
                  fullWidth
                  placeholder="Mobile Number"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      '& fieldset': { borderColor: '#ccd6e0' },
                    },
                  }}
                  variant="outlined"
                  size="small"
                  inputProps={{ maxLength: 10 }}
                />

                <FormControl
                  fullWidth
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      '& fieldset': { borderColor: '#ccd6e0' },
                    },
                  }}
                  size="small"
                >
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    label="Blood Group"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {bloodGroups.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{
                      flex: 1,
                      py: 1.3,
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      backgroundColor: '#1976d2',
                      borderRadius: '6px',
                      letterSpacing: '1px',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                      },
                    }}
                  >
                    {loading ? 'Registering...' : 'Register Patient'}
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    disabled={loading}
                    onClick={handleClear}
                    startIcon={<ClearIcon />}
                    sx={{
                      flex: 0.6,
                      py: 1.3,
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      borderColor: '#bbb',
                      color: '#555',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      '&:hover': {
                        borderColor: '#888',
                        backgroundColor: '#f5f5f5',
                      },
                      '&:disabled': {
                        borderColor: '#ccc',
                        color: '#ccc',
                      },
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </form>
            </Card>
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

      <Dialog
        open={credentialsModal.open}
        onClose={closeCredentialsModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}
        >
          ✅ Patient Registered Successfully
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Patient <strong>{credentialsModal.patientName}</strong> has been registered successfully.
          </Typography>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Share these credentials with the patient so they can login:
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              mb: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: '#666', fontWeight: 'bold', display: 'block', mb: 0.5 }}
            >
              Patient Login ID:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                value={credentialsModal.patientId}
                disabled
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => copyToClipboard(credentialsModal.patientId, 'Patient ID')}
                startIcon={<FileCopyOutlinedIcon />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                Copy
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              mb: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: '#666', fontWeight: 'bold', display: 'block', mb: 0.5 }}
            >
              Patient Password:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                value={credentialsModal.patientPassword}
                disabled
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => copyToClipboard(credentialsModal.patientPassword, 'Password')}
                startIcon={<FileCopyOutlinedIcon />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                Copy
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            <strong>Note:</strong> Please share these credentials securely with the patient. They
            will use these to login to their account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeCredentialsModal}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RegisterPatientForm
