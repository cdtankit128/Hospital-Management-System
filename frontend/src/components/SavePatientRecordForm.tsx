import { useState } from 'react'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ClearIcon from '@mui/icons-material/Clear'
import { doctorAPI, PatientRecord } from '../services/doctorAPI'

const SavePatientRecordForm = () => {
  const [formData, setFormData] = useState<PatientRecord>({
    patientName: '',
    diagnosis: '',
    prescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess(false)
      setLoading(true)

      // Validate form
      if (!formData.patientName.trim()) {
        setError('Patient name is required')
        setLoading(false)
        return
      }
      if (!formData.diagnosis.trim()) {
        setError('Diagnosis is required')
        setLoading(false)
        return
      }
      if (!formData.prescription.trim()) {
        setError('Prescription is required')
        setLoading(false)
        return
      }

      // Save to backend
      const response = await doctorAPI.savePatientRecord(formData)

      setSuccess(true)
      // Reset form
      setFormData({
        patientName: '',
        diagnosis: '',
        prescription: '',
      })

      console.log('Patient record saved:', response)
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save patient record'
      setError(errorMsg)
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFormData({
      patientName: '',
      diagnosis: '',
      prescription: '',
    })
    setError('')
    setSuccess(false)
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            📋 Save Patient Record
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Patient record saved successfully!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Patient Name"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              margin="normal"
              placeholder="Enter patient's full name"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="Enter medical diagnosis..."
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="Enter prescription details..."
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Record'}
              </Button>

              <Button
                type="button"
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default SavePatientRecordForm
