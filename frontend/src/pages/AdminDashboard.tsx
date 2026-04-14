import { useState, ReactNode, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import MedicationIcon from '@mui/icons-material/Medication'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LockResetIcon from '@mui/icons-material/LockReset'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import api from '../api/api'

// ─── Tab Panel ────────────────────────────────────────────
interface TabPanelProps {
  children?: ReactNode
  index: number
  value: number
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// ─── Colors ───────────────────────────────────────────────
const premiumBlue = '#1565C0'
const lightBlue = '#E3F2FD'
const darkBlue = '#0D47A1'
const adminCyan = '#00C8FF'
const purpleGrad = 'linear-gradient(135deg, #7B1FA2 0%, #4A148C 100%)'
const cyanGrad = `linear-gradient(135deg, ${adminCyan} 0%, #0097A7 100%)`
const blueGrad = `linear-gradient(135deg, ${premiumBlue} 0%, ${darkBlue} 100%)`

// ─── Clipboard helper ─────────────────────────────────────
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0)
  const navigate = useNavigate()
  const { logout, username } = useAuth()

  // ─── Data ─────────────────────────────────────────────
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [receptionists, setReceptionists] = useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingReceptionists, setLoadingReceptionists] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Search ───────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [recSearch, setRecSearch] = useState('')

  // ─── Patient dialogs ─────────────────────────────────
  const [viewPatientOpen, setViewPatientOpen] = useState(false)
  const [viewPatient, setViewPatient] = useState<any>(null)
  const [patientCredentials, setPatientCredentials] = useState<any>(null)
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [editPatientOpen, setEditPatientOpen] = useState(false)
  const [editPatientForm, setEditPatientForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', bloodGroup: '', address: '' })
  const [editPatientLoading, setEditPatientLoading] = useState(false)
  const [editPatientMsg, setEditPatientMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resetPatientMsg, setResetPatientMsg] = useState<string | null>(null)

  // ─── Doctor dialogs ──────────────────────────────────
  const [viewDoctorOpen, setViewDoctorOpen] = useState(false)
  const [viewDoctor, setViewDoctor] = useState<any>(null)
  const [editDoctorOpen, setEditDoctorOpen] = useState(false)
  const [editDoctorForm, setEditDoctorForm] = useState({ name: '', specialization: '', designation: '', email: '', phone: '', gender: '', status: '' })
  const [editDoctorLoading, setEditDoctorLoading] = useState(false)
  const [editDoctorMsg, setEditDoctorMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resetDoctorPwOpen, setResetDoctorPwOpen] = useState(false)
  const [resetDoctorPwTarget, setResetDoctorPwTarget] = useState<any>(null)
  const [resetDoctorPwValue, setResetDoctorPwValue] = useState('')
  const [resetDoctorPwMsg, setResetDoctorPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resetDoctorPwLoading, setResetDoctorPwLoading] = useState(false)

  // ─── Receptionist dialogs ────────────────────────────
  const [recFormOpen, setRecFormOpen] = useState(false)
  const [recForm, setRecForm] = useState({ fullName: '', phone: '', username: '', password: '' })
  const [recFormLoading, setRecFormLoading] = useState(false)
  const [recFormMsg, setRecFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [viewRecOpen, setViewRecOpen] = useState(false)
  const [viewRec, setViewRec] = useState<any>(null)
  const [editRecOpen, setEditRecOpen] = useState(false)
  const [editRecForm, setEditRecForm] = useState({ fullName: '', phone: '', username: '', email: '', status: '' })
  const [editRecLoading, setEditRecLoading] = useState(false)
  const [editRecMsg, setEditRecMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resetRecPwOpen, setResetRecPwOpen] = useState(false)
  const [resetRecPwTarget, setResetRecPwTarget] = useState<any>(null)
  const [resetRecPwValue, setResetRecPwValue] = useState('')
  const [resetRecPwMsg, setResetRecPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resetRecPwLoading, setResetRecPwLoading] = useState(false)

  // ─── Delete ──────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'doctor' | 'patient' | 'receptionist'; id: number; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ─── Global msg ──────────────────────────────────────
  const [globalMsg, setGlobalMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // ═══════════════════════════════════════════════════════
  // FETCH
  // ═══════════════════════════════════════════════════════
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true)
      setError(null)
      const res = await api.get('/patients')
      setPatients(res.data || [])
    } catch (err: any) {
      console.error('Error fetching patients:', err)
      setError('Failed to load patients')
    } finally {
      setLoadingPatients(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true)
      setError(null)
      const res = await api.get('/auth/admin/doctors')
      setDoctors(res.data || [])
    } catch (err: any) {
      console.error('Error fetching doctors:', err)
      setError('Failed to load doctors')
    } finally {
      setLoadingDoctors(false)
    }
  }

  const fetchReceptionists = async () => {
    try {
      setLoadingReceptionists(true)
      const res = await api.get('/auth/admin/receptionists')
      setReceptionists(res.data || [])
    } catch (err: any) {
      console.error('Error fetching receptionists:', err)
    } finally {
      setLoadingReceptionists(false)
    }
  }

  useEffect(() => {
    fetchPatients()
    fetchDoctors()
    fetchReceptionists()
  }, [])

  const handleTabChange = (_event: any, newValue: number) => {
    setTabValue(newValue)
    if (newValue === 1) fetchPatients()
    else if (newValue === 2) fetchDoctors()
    else if (newValue === 3) fetchReceptionists()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  // ═══════════════════════════════════════════════════════
  // PATIENT HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleViewPatient = async (patient: any) => {
    setViewPatient(patient)
    setViewPatientOpen(true)
    setPatientCredentials(null)
    setResetPatientMsg(null)
    setLoadingCredentials(true)
    try {
      const res = await api.get(`/patients/${patient.id}/credentials`)
      setPatientCredentials(res.data)
    } catch {
      setPatientCredentials({ error: true })
    } finally {
      setLoadingCredentials(false)
    }
  }

  const handleEditPatient = (patient: any) => {
    setEditPatientForm({
      name: patient.name || '',
      age: patient.age?.toString() || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || '',
    })
    setViewPatient(patient)
    setEditPatientMsg(null)
    setEditPatientOpen(true)
  }

  const handleSavePatient = async () => {
    try {
      setEditPatientLoading(true)
      setEditPatientMsg(null)
      await api.put(`/patients/${viewPatient.id}`, {
        ...editPatientForm,
        age: parseInt(editPatientForm.age) || 0,
      })
      setEditPatientMsg({ text: 'Patient updated successfully!', type: 'success' })
      fetchPatients()
      setTimeout(() => setEditPatientOpen(false), 1000)
    } catch (err: any) {
      setEditPatientMsg({ text: err.response?.data?.message || 'Failed to update patient', type: 'error' })
    } finally {
      setEditPatientLoading(false)
    }
  }

  const handleResetPatientPassword = async () => {
    try {
      setLoadingCredentials(true)
      const res = await api.post(`/patients/${viewPatient.id}/reset-password`)
      if (res.data.success) {
        setPatientCredentials(res.data)
        setResetPatientMsg('Password reset successfully! New password is shown below.')
      } else {
        setResetPatientMsg('Failed to reset password')
      }
    } catch {
      setResetPatientMsg('Error resetting password')
    } finally {
      setLoadingCredentials(false)
    }
  }

  // ═══════════════════════════════════════════════════════
  // DOCTOR HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleViewDoctor = (doctor: any) => {
    setViewDoctor(doctor)
    setViewDoctorOpen(true)
  }

  const handleEditDoctor = (doctor: any) => {
    setEditDoctorForm({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      designation: doctor.designation || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      gender: doctor.gender || '',
      status: doctor.status || 'Active',
    })
    setViewDoctor(doctor)
    setEditDoctorMsg(null)
    setEditDoctorOpen(true)
  }

  const handleSaveDoctor = async () => {
    try {
      setEditDoctorLoading(true)
      setEditDoctorMsg(null)
      await api.put(`/auth/admin/doctors/${viewDoctor.id}`, editDoctorForm)
      setEditDoctorMsg({ text: 'Doctor updated successfully!', type: 'success' })
      fetchDoctors()
      setTimeout(() => setEditDoctorOpen(false), 1000)
    } catch (err: any) {
      setEditDoctorMsg({ text: err.response?.data?.message || 'Failed to update doctor', type: 'error' })
    } finally {
      setEditDoctorLoading(false)
    }
  }

  const handleResetDoctorPw = (doctor: any) => {
    setResetDoctorPwTarget(doctor)
    setResetDoctorPwValue('')
    setResetDoctorPwMsg(null)
    setResetDoctorPwOpen(true)
  }

  const handleSubmitResetDoctorPw = async () => {
    if (resetDoctorPwValue.length < 6) {
      setResetDoctorPwMsg({ text: 'Password must be at least 6 characters', type: 'error' })
      return
    }
    try {
      setResetDoctorPwLoading(true)
      setResetDoctorPwMsg(null)
      await api.post(`/auth/admin/reset-password/${resetDoctorPwTarget.id}`, { newPassword: resetDoctorPwValue })
      setResetDoctorPwMsg({ text: 'Password reset successfully!', type: 'success' })
      setTimeout(() => setResetDoctorPwOpen(false), 1200)
    } catch (err: any) {
      setResetDoctorPwMsg({ text: err.response?.data?.message || 'Failed to reset password', type: 'error' })
    } finally {
      setResetDoctorPwLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════
  // RECEPTIONIST HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleCreateReceptionist = async () => {
    const { fullName, phone, username: uname, password } = recForm
    if (!fullName.trim() || !phone.trim() || !uname.trim() || !password.trim()) {
      setRecFormMsg({ text: 'All fields are required', type: 'error' }); return
    }
    if (uname.length < 6) { setRecFormMsg({ text: 'Username must be at least 6 characters', type: 'error' }); return }
    if (password.length < 6) { setRecFormMsg({ text: 'Password must be at least 6 characters', type: 'error' }); return }
    setRecFormLoading(true); setRecFormMsg(null)
    try {
      await api.post('/auth/admin/receptionist', { fullName: fullName.trim(), phone: phone.trim(), username: uname.trim(), password })
      setRecFormMsg({ text: 'Receptionist created successfully!', type: 'success' })
      setRecForm({ fullName: '', phone: '', username: '', password: '' })
      fetchReceptionists()
      setTimeout(() => { setRecFormOpen(false); setRecFormMsg(null) }, 1200)
    } catch (err: any) {
      setRecFormMsg({ text: err.response?.data?.message || 'Failed to create receptionist', type: 'error' })
    } finally { setRecFormLoading(false) }
  }

  const handleViewRec = (rec: any) => {
    setViewRec(rec)
    setViewRecOpen(true)
  }

  const handleEditRec = (rec: any) => {
    setEditRecForm({
      fullName: rec.fullName || '',
      phone: rec.phone || '',
      username: rec.username || '',
      email: rec.email || '',
      status: rec.status || 'Active',
    })
    setViewRec(rec)
    setEditRecMsg(null)
    setEditRecOpen(true)
  }

  const handleSaveRec = async () => {
    try {
      setEditRecLoading(true); setEditRecMsg(null)
      await api.put(`/auth/admin/receptionist/${viewRec.id}`, editRecForm)
      setEditRecMsg({ text: 'Receptionist updated!', type: 'success' })
      fetchReceptionists()
      setTimeout(() => setEditRecOpen(false), 1000)
    } catch (err: any) {
      setEditRecMsg({ text: err.response?.data?.message || 'Failed to update', type: 'error' })
    } finally { setEditRecLoading(false) }
  }

  const handleResetRecPw = (rec: any) => {
    setResetRecPwTarget(rec)
    setResetRecPwValue('')
    setResetRecPwMsg(null)
    setResetRecPwOpen(true)
  }

  const handleSubmitResetRecPw = async () => {
    if (resetRecPwValue.length < 6) {
      setResetRecPwMsg({ text: 'Password must be at least 6 characters', type: 'error' }); return
    }
    try {
      setResetRecPwLoading(true); setResetRecPwMsg(null)
      await api.post(`/auth/admin/reset-password/${resetRecPwTarget.id}`, { newPassword: resetRecPwValue })
      setResetRecPwMsg({ text: 'Password reset successfully!', type: 'success' })
      setTimeout(() => setResetRecPwOpen(false), 1200)
    } catch (err: any) {
      setResetRecPwMsg({ text: err.response?.data?.message || 'Failed to reset password', type: 'error' })
    } finally { setResetRecPwLoading(false) }
  }

  // ═══════════════════════════════════════════════════════
  // DELETE HANDLER
  // ═══════════════════════════════════════════════════════
  const handleDeleteConfirm = (type: 'doctor' | 'patient' | 'receptionist', id: number, name: string) => {
    setDeleteTarget({ type, id, name })
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      if (deleteTarget.type === 'doctor') {
        await api.delete(`/auth/admin/doctors/${deleteTarget.id}`)
        fetchDoctors()
      } else if (deleteTarget.type === 'receptionist') {
        await api.delete(`/auth/admin/receptionist/${deleteTarget.id}`)
        fetchReceptionists()
      } else {
        await api.delete(`/patients/${deleteTarget.id}`)
        fetchPatients()
      }
      setDeleteConfirmOpen(false); setDeleteTarget(null)
      setGlobalMsg({ text: `${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted successfully`, type: 'success' })
      setTimeout(() => setGlobalMsg(null), 3000)
    } catch (err: any) {
      console.error(`Error deleting ${deleteTarget.type}:`, err)
      setGlobalMsg({ text: `Failed to delete ${deleteTarget.type}`, type: 'error' })
      setTimeout(() => setGlobalMsg(null), 3000)
    } finally { setDeleteLoading(false) }
  }

  // ═══════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════
  const filteredPatients = patients.filter(p => {
    const s = patientSearch.toLowerCase()
    return !s || (p.name || '').toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s) || (p.phone || '').includes(s) || (p.bloodGroup || '').toLowerCase().includes(s)
  })
  const filteredDoctors = doctors.filter(d => {
    const s = doctorSearch.toLowerCase()
    return !s || (d.name || '').toLowerCase().includes(s) || (d.username || '').toLowerCase().includes(s) || (d.specialization || '').toLowerCase().includes(s) || (d.email || '').toLowerCase().includes(s)
  })
  const filteredRecs = receptionists.filter(r => {
    const s = recSearch.toLowerCase()
    return !s || (r.fullName || '').toLowerCase().includes(s) || (r.username || '').toLowerCase().includes(s) || (r.phone || '').includes(s)
  })

  // Stats
  const totalPatients = patients.length
  const totalDoctors = doctors.length
  const activeDoctors = doctors.filter(d => d.status === 'Active').length
  const totalRecs = receptionists.length

  // ─── Reusable detail row ─────────────────────────────
  const DetailRow = ({ label, value, copyable }: { label: string; value: string | undefined | null; copyable?: boolean }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.2, px: 2, '&:nth-of-type(odd)': { background: '#fafafa' } }}>
      <Typography sx={{ fontWeight: 600, color: '#555', minWidth: 160, fontSize: '14px' }}>{label}:</Typography>
      <Typography sx={{ flex: 1, fontWeight: 500, color: '#222', fontSize: '14px', wordBreak: 'break-all' }}>{value || '—'}</Typography>
      {copyable && value && (
        <Tooltip title="Copied!" enterDelay={0} leaveDelay={1500}>
          <IconButton size="small" onClick={() => copyToClipboard(value)}>
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )

  // ─── Action buttons builder ──────────────────────────
  const ActionBtn = ({ icon, label, color, onClick }: { icon: ReactNode; label: string; color: string; onClick: () => void }) => (
    <Tooltip title={label}>
      <IconButton size="small" onClick={onClick} sx={{ color, '&:hover': { backgroundColor: `${color}15` } }}>
        {icon}
      </IconButton>
    </Tooltip>
  )

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <Box sx={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)', py: 3, px: { xs: 1, sm: 2, md: 3 }, position: 'relative', overflow: 'hidden' }}>
      {/* BG */}
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url('/get.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1, zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>

        {/* Global message */}
        {globalMsg && (
          <Alert severity={globalMsg.type} sx={{ mb: 2 }} onClose={() => setGlobalMsg(null)}>{globalMsg.text}</Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '800', color: darkBlue, mb: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.125rem' } }}>
              Hi, Admin {username}!
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>System Management & Oversight</Typography>
          </Box>
          <Button variant="contained" onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ background: cyanGrad, color: 'white', fontWeight: '700', boxShadow: '0 4px 15px rgba(0,200,255,0.3)', '&:hover': { boxShadow: '0 6px 20px rgba(0,200,255,0.4)' } }}>
            Logout
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            { label: 'Total Patients', count: totalPatients, icon: <PeopleIcon sx={{ fontSize: 28, mb: 0.5 }} />, grad: cyanGrad, tab: 1, fetch: fetchPatients },
            { label: 'Active Doctors', count: activeDoctors, icon: <PersonIcon sx={{ fontSize: 28, mb: 0.5 }} />, grad: blueGrad, tab: 2, fetch: fetchDoctors },
            { label: 'Total Doctors', count: totalDoctors, icon: <VerifiedUserIcon sx={{ fontSize: 28, mb: 0.5 }} />, grad: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', tab: 2, fetch: fetchDoctors },
            { label: 'Receptionists', count: totalRecs, icon: <SupportAgentIcon sx={{ fontSize: 28, mb: 0.5 }} />, grad: purpleGrad, tab: 3, fetch: fetchReceptionists },
          ].map((c, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Card onClick={() => { setTabValue(c.tab); c.fetch() }} sx={{ background: c.grad, color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' } }}>
                <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {c.icon}
                  <Typography variant="h4" sx={{ fontWeight: '700', lineHeight: 1.2 }}>{c.count}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>{c.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Content */}
        <Card sx={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: `2px solid ${lightBlue}` }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { fontWeight: '600', fontSize: { xs: '12px', sm: '14px' }, textTransform: 'uppercase', color: '#666', minWidth: { xs: 'auto', sm: 120 }, '&.Mui-selected': { color: premiumBlue } }, '& .MuiTabs-indicator': { backgroundColor: premiumBlue, height: '3px' } }}>
                <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
                <Tab label="Patients" icon={<PeopleIcon />} iconPosition="start" />
                <Tab label="Doctors" icon={<MedicationIcon />} iconPosition="start" />
                <Tab label="Receptionists" icon={<SupportAgentIcon />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* ════════════════════════════════════════════ */}
            {/* DASHBOARD TAB */}
            {/* ════════════════════════════════════════════ */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: '700', mb: 3, color: darkBlue }}>System Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: lightBlue, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '700', mb: 2, color: darkBlue }}>
                        <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Patients
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Registered:</Typography>
                        <Chip label={totalPatients} color="primary" size="small" />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: '#E8F5E9', borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '700', mb: 2, color: '#2E7D32' }}>
                        <MedicationIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Doctors
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Active:</Typography>
                        <Chip label={activeDoctors} sx={{ background: '#4CAF50', color: 'white' }} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Total:</Typography>
                        <Chip label={totalDoctors} color="primary" size="small" />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: '#F3E5F5', borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '700', mb: 2, color: '#7B1FA2' }}>
                        <SupportAgentIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Receptionists
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Total:</Typography>
                        <Chip label={totalRecs} sx={{ background: '#7B1FA2', color: 'white' }} size="small" />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Quick Actions */}
                <Typography variant="h6" sx={{ fontWeight: '700', mt: 4, mb: 2, color: darkBlue }}>Quick Actions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button fullWidth variant="contained" startIcon={<PeopleIcon />} onClick={() => { setTabValue(1); fetchPatients() }} sx={{ py: 1.5, background: cyanGrad, fontWeight: 600 }}>
                      Manage Patients
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button fullWidth variant="contained" startIcon={<MedicationIcon />} onClick={() => { setTabValue(2); fetchDoctors() }} sx={{ py: 1.5, background: blueGrad, fontWeight: 600 }}>
                      Manage Doctors
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button fullWidth variant="contained" startIcon={<SupportAgentIcon />} onClick={() => { setTabValue(3); fetchReceptionists() }} sx={{ py: 1.5, background: purpleGrad, fontWeight: 600 }}>
                      Manage Receptionists
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* ════════════════════════════════════════════ */}
            {/* PATIENTS TAB */}
            {/* ════════════════════════════════════════════ */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: '700', color: darkBlue }}>Patient Management</Typography>
                  <TextField size="small" placeholder="Search patients..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
                    sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loadingPatients ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                ) : filteredPatients.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', background: '#F5F5F5', borderRadius: 2 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: '#999', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>{patientSearch ? 'No matching patients' : 'No patients found'}</Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: `linear-gradient(90deg, ${premiumBlue} 0%, ${darkBlue} 100%)` }}>
                          {['ID', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Blood Group', 'Login ID', 'Actions'].map(h => (
                            <TableCell key={h} sx={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPatients.map((p, i) => (
                          <TableRow key={p.id || i} sx={{ '&:hover': { backgroundColor: lightBlue }, '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                            <TableCell sx={{ fontWeight: '600', color: darkBlue }}>#{p.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                            <TableCell>{p.age}</TableCell>
                            <TableCell>{p.gender || '—'}</TableCell>
                            <TableCell>{p.phone || '—'}</TableCell>
                            <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email || '—'}</TableCell>
                            <TableCell>
                              {p.bloodGroup ? <Chip label={p.bloodGroup} size="small" sx={{ backgroundColor: lightBlue, color: darkBlue, fontWeight: 600 }} /> : '—'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.patientLoginId || '—'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <ActionBtn icon={<VisibilityIcon fontSize="small" />} label="View Details & Credentials" color={premiumBlue} onClick={() => handleViewPatient(p)} />
                                <ActionBtn icon={<EditIcon fontSize="small" />} label="Edit Patient" color="#FF9800" onClick={() => handleEditPatient(p)} />
                                <ActionBtn icon={<DeleteIcon fontSize="small" />} label="Delete Patient" color="#d32f2f" onClick={() => handleDeleteConfirm('patient', p.id, p.name)} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </TabPanel>

            {/* ════════════════════════════════════════════ */}
            {/* DOCTORS TAB */}
            {/* ════════════════════════════════════════════ */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: '700', color: darkBlue }}>Doctor Management</Typography>
                  <TextField size="small" placeholder="Search doctors..." value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
                    sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                {loadingDoctors ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                ) : filteredDoctors.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', background: '#F5F5F5', borderRadius: 2 }}>
                    <PersonIcon sx={{ fontSize: 48, color: '#999', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>{doctorSearch ? 'No matching doctors' : 'No doctors found'}</Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: `linear-gradient(90deg, ${adminCyan} 0%, #0097A7 100%)` }}>
                          {['ID', 'Name', 'Username', 'Specialization', 'Email', 'Phone', 'Status', 'Actions'].map(h => (
                            <TableCell key={h} sx={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDoctors.map((d, i) => (
                          <TableRow key={d.id || i} sx={{ '&:hover': { backgroundColor: lightBlue }, '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                            <TableCell sx={{ fontWeight: '600', color: darkBlue }}>DR{d.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{d.username}</TableCell>
                            <TableCell>
                              <Chip label={d.specialization} size="small" sx={{ backgroundColor: '#E0F2F1', color: '#00695C', fontWeight: 600 }} />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.email}</TableCell>
                            <TableCell>{d.phone || '—'}</TableCell>
                            <TableCell>
                              <Chip label={d.status} size="small" sx={{ backgroundColor: d.status === 'Active' ? '#C8E6C9' : '#FFCCBC', color: d.status === 'Active' ? '#2E7D32' : '#D84315', fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <ActionBtn icon={<VisibilityIcon fontSize="small" />} label="View Doctor" color={premiumBlue} onClick={() => handleViewDoctor(d)} />
                                <ActionBtn icon={<EditIcon fontSize="small" />} label="Edit Doctor" color="#FF9800" onClick={() => handleEditDoctor(d)} />
                                <ActionBtn icon={<LockResetIcon fontSize="small" />} label="Reset Password" color="#7B1FA2" onClick={() => handleResetDoctorPw(d)} />
                                <ActionBtn icon={<DeleteIcon fontSize="small" />} label="Delete Doctor" color="#d32f2f" onClick={() => handleDeleteConfirm('doctor', d.id, d.name)} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </TabPanel>

            {/* ════════════════════════════════════════════ */}
            {/* RECEPTIONISTS TAB */}
            {/* ════════════════════════════════════════════ */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: '700', color: darkBlue }}>Receptionist Management</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                    <TextField size="small" placeholder="Search..." value={recSearch} onChange={e => setRecSearch(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
                      sx={{ width: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button variant="contained" onClick={() => { setRecFormOpen(true); setRecFormMsg(null); setRecForm({ fullName: '', phone: '', username: '', password: '' }) }} startIcon={<AddIcon />}
                      sx={{ background: purpleGrad, fontWeight: 700, whiteSpace: 'nowrap', '&:hover': { boxShadow: '0 4px 15px rgba(123,31,162,0.3)' } }}>
                      Create
                    </Button>
                  </Box>
                </Box>

                {loadingReceptionists ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                ) : filteredRecs.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', background: '#F5F5F5', borderRadius: 2 }}>
                    <SupportAgentIcon sx={{ fontSize: 48, color: '#999', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>{recSearch ? 'No matching receptionists' : 'No receptionists found'}</Typography>
                    <Typography variant="body2" sx={{ color: '#999' }}>Click "Create" to add one</Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(90deg, #7B1FA2 0%, #4A148C 100%)' }}>
                          {['ID', 'Full Name', 'Username', 'Phone', 'Email', 'Status', 'Actions'].map(h => (
                            <TableCell key={h} sx={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRecs.map((r, i) => (
                          <TableRow key={r.id || i} sx={{ '&:hover': { backgroundColor: '#F3E5F5' }, '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                            <TableCell sx={{ fontWeight: '600', color: darkBlue }}>#{r.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{r.fullName}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{r.username}</TableCell>
                            <TableCell>{r.phone || '—'}</TableCell>
                            <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email || '—'}</TableCell>
                            <TableCell>
                              <Chip label={r.status || 'Active'} size="small" sx={{ backgroundColor: r.status === 'Active' ? '#C8E6C9' : '#FFCCBC', color: r.status === 'Active' ? '#2E7D32' : '#D84315', fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <ActionBtn icon={<VisibilityIcon fontSize="small" />} label="View Details" color="#7B1FA2" onClick={() => handleViewRec(r)} />
                                <ActionBtn icon={<EditIcon fontSize="small" />} label="Edit" color="#FF9800" onClick={() => handleEditRec(r)} />
                                <ActionBtn icon={<LockResetIcon fontSize="small" />} label="Reset Password" color={premiumBlue} onClick={() => handleResetRecPw(r)} />
                                <ActionBtn icon={<DeleteIcon fontSize="small" />} label="Delete" color="#d32f2f" onClick={() => handleDeleteConfirm('receptionist', r.id, r.fullName)} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </TabPanel>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════ */}
        {/*  D I A L O G S                                  */}
        {/* ════════════════════════════════════════════════ */}

        {/* ─── View Patient Dialog ────────────────────── */}
        <Dialog open={viewPatientOpen} onClose={() => setViewPatientOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: cyanGrad, color: 'white', fontWeight: 'bold' }}>
            Patient Details — #{viewPatient?.id}
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#555', mb: 1, px: 2 }}>Personal Information</Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                <DetailRow label="Name" value={viewPatient?.name} />
                <DetailRow label="Age" value={viewPatient?.age?.toString()} />
                <DetailRow label="Gender" value={viewPatient?.gender} />
                <DetailRow label="Phone" value={viewPatient?.phone} copyable />
                <DetailRow label="Email" value={viewPatient?.email} copyable />
                <DetailRow label="Blood Group" value={viewPatient?.bloodGroup} />
                <DetailRow label="Date of Birth" value={viewPatient?.dateOfBirth} />
                <DetailRow label="Address" value={viewPatient?.address} />
              </Paper>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#555', mb: 1, px: 2 }}>Login Credentials</Typography>
              {loadingCredentials ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
              ) : patientCredentials && !patientCredentials.error ? (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', background: '#FFFDE7' }}>
                  {resetPatientMsg && <Alert severity={resetPatientMsg.includes('success') ? 'success' : 'error'} sx={{ m: 1 }}>{resetPatientMsg}</Alert>}
                  <DetailRow label="Login ID" value={patientCredentials.patientLoginId} copyable />
                  <DetailRow label="Password" value={patientCredentials.patientPassword || patientCredentials.newPassword} copyable />
                  {patientCredentials.newPassword && (
                    <DetailRow label="New Password" value={patientCredentials.newPassword} copyable />
                  )}
                </Paper>
              ) : (
                <Alert severity="error" sx={{ m: 1 }}>Failed to load credentials</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setViewPatientOpen(false)}>Close</Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleResetPatientPassword} disabled={loadingCredentials} startIcon={<LockResetIcon />} sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)', color: 'white' }}>
                Reset Password
              </Button>
              <Button variant="contained" onClick={() => { setViewPatientOpen(false); handleEditPatient(viewPatient) }} startIcon={<EditIcon />} sx={{ background: blueGrad, color: 'white' }}>
                Edit
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* ─── Edit Patient Dialog ────────────────────── */}
        <Dialog open={editPatientOpen} onClose={() => setEditPatientOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)', color: 'white', fontWeight: 'bold' }}>
            Edit Patient — {viewPatient?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {editPatientMsg && <Alert severity={editPatientMsg.type} sx={{ mb: 2, mt: 1 }}>{editPatientMsg.text}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={8}><TextField fullWidth label="Full Name" value={editPatientForm.name} onChange={e => setEditPatientForm({ ...editPatientForm, name: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Age" type="number" value={editPatientForm.age} onChange={e => setEditPatientForm({ ...editPatientForm, age: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Gender" value={editPatientForm.gender} onChange={e => setEditPatientForm({ ...editPatientForm, gender: e.target.value })} select SelectProps={{ native: true }}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={editPatientForm.phone} onChange={e => setEditPatientForm({ ...editPatientForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={editPatientForm.email} onChange={e => setEditPatientForm({ ...editPatientForm, email: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Blood Group" value={editPatientForm.bloodGroup} onChange={e => setEditPatientForm({ ...editPatientForm, bloodGroup: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Address" value={editPatientForm.address} onChange={e => setEditPatientForm({ ...editPatientForm, address: e.target.value })} multiline rows={2} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditPatientOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSavePatient} disabled={editPatientLoading} sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)', color: 'white' }}>
              {editPatientLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── View Doctor Dialog ─────────────────────── */}
        <Dialog open={viewDoctorOpen} onClose={() => setViewDoctorOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: blueGrad, color: 'white', fontWeight: 'bold' }}>
            Doctor Details — DR{viewDoctor?.id}
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 2 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <DetailRow label="Doctor ID" value={`DR${viewDoctor?.id}`} />
                <DetailRow label="Full Name" value={viewDoctor?.name} />
                <DetailRow label="Username" value={viewDoctor?.username} copyable />
                <DetailRow label="Specialization" value={viewDoctor?.specialization} />
                <DetailRow label="Designation" value={viewDoctor?.designation} />
                <DetailRow label="Email" value={viewDoctor?.email} copyable />
                <DetailRow label="Phone" value={viewDoctor?.phone} copyable />
                <DetailRow label="Gender" value={viewDoctor?.gender} />
                <DetailRow label="Status" value={viewDoctor?.status} />
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setViewDoctorOpen(false)}>Close</Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<LockResetIcon />} onClick={() => { setViewDoctorOpen(false); handleResetDoctorPw(viewDoctor) }} sx={{ background: purpleGrad, color: 'white' }}>
                Reset Password
              </Button>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => { setViewDoctorOpen(false); handleEditDoctor(viewDoctor) }} sx={{ background: blueGrad, color: 'white' }}>
                Edit
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* ─── Edit Doctor Dialog ─────────────────────── */}
        <Dialog open={editDoctorOpen} onClose={() => setEditDoctorOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: blueGrad, color: 'white', fontWeight: 'bold' }}>
            Edit Doctor — {viewDoctor?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {editDoctorMsg && <Alert severity={editDoctorMsg.type} sx={{ mb: 2, mt: 1 }}>{editDoctorMsg.text}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><TextField fullWidth label="Full Name" value={editDoctorForm.name} onChange={e => setEditDoctorForm({ ...editDoctorForm, name: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Specialization" value={editDoctorForm.specialization} onChange={e => setEditDoctorForm({ ...editDoctorForm, specialization: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Designation" value={editDoctorForm.designation} onChange={e => setEditDoctorForm({ ...editDoctorForm, designation: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={editDoctorForm.email} onChange={e => setEditDoctorForm({ ...editDoctorForm, email: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={editDoctorForm.phone} onChange={e => setEditDoctorForm({ ...editDoctorForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Gender" value={editDoctorForm.gender} onChange={e => setEditDoctorForm({ ...editDoctorForm, gender: e.target.value })} select SelectProps={{ native: true }}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Status" value={editDoctorForm.status} onChange={e => setEditDoctorForm({ ...editDoctorForm, status: e.target.value })} select SelectProps={{ native: true }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => handleDeleteConfirm('doctor', viewDoctor?.id, viewDoctor?.name)} variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { backgroundColor: '#ffebee' } }}>
              Delete Doctor
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setEditDoctorOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveDoctor} disabled={editDoctorLoading} sx={{ background: blueGrad, color: 'white' }}>
                {editDoctorLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* ─── Reset Doctor Password Dialog ───────────── */}
        <Dialog open={resetDoctorPwOpen} onClose={() => setResetDoctorPwOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ background: purpleGrad, color: 'white', fontWeight: 'bold' }}>
            Reset Password — {resetDoctorPwTarget?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {resetDoctorPwMsg && <Alert severity={resetDoctorPwMsg.type} sx={{ mb: 2, mt: 1 }}>{resetDoctorPwMsg.text}</Alert>}
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              Enter new password for <strong>{resetDoctorPwTarget?.username}</strong>
            </Typography>
            <TextField fullWidth label="New Password" type="password" value={resetDoctorPwValue} onChange={e => setResetDoctorPwValue(e.target.value)} placeholder="Min 6 characters"
              helperText={resetDoctorPwValue.length > 0 && resetDoctorPwValue.length < 6 ? 'Must be at least 6 characters' : ''} error={resetDoctorPwValue.length > 0 && resetDoctorPwValue.length < 6}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetDoctorPwOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitResetDoctorPw} disabled={resetDoctorPwLoading} sx={{ background: purpleGrad, color: 'white' }}>
              {resetDoctorPwLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Create Receptionist Dialog ─────────────── */}
        <Dialog open={recFormOpen} onClose={() => setRecFormOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: purpleGrad, color: 'white', fontWeight: 'bold' }}>Create New Receptionist</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {recFormMsg && <Alert severity={recFormMsg.type} sx={{ mb: 2, mt: 1 }}>{recFormMsg.text}</Alert>}
            <TextField fullWidth label="Full Name" variant="outlined" margin="normal" value={recForm.fullName} onChange={e => setRecForm({ ...recForm, fullName: e.target.value })} placeholder="e.g. John Doe" required />
            <TextField fullWidth label="Mobile Number" variant="outlined" margin="normal" value={recForm.phone} onChange={e => setRecForm({ ...recForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="e.g. 9876543210" required inputProps={{ maxLength: 10 }} />
            <TextField fullWidth label="Username" variant="outlined" margin="normal" value={recForm.username} onChange={e => setRecForm({ ...recForm, username: e.target.value })} placeholder="Min 6 characters" required
              helperText={recForm.username.length > 0 && recForm.username.length < 6 ? 'Minimum 6 characters' : ''} error={recForm.username.length > 0 && recForm.username.length < 6} />
            <TextField fullWidth label="Password" variant="outlined" margin="normal" type="password" value={recForm.password} onChange={e => setRecForm({ ...recForm, password: e.target.value })} placeholder="Min 6 characters" required
              helperText={recForm.password.length > 0 && recForm.password.length < 6 ? 'Minimum 6 characters' : ''} error={recForm.password.length > 0 && recForm.password.length < 6} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRecFormOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReceptionist} variant="contained" disabled={recFormLoading} sx={{ background: purpleGrad, color: 'white' }}>
              {recFormLoading ? 'Creating...' : 'Create Receptionist'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── View Receptionist Dialog ───────────────── */}
        <Dialog open={viewRecOpen} onClose={() => setViewRecOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: purpleGrad, color: 'white', fontWeight: 'bold' }}>
            Receptionist Details — #{viewRec?.id}
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 2 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <DetailRow label="ID" value={`#${viewRec?.id}`} />
                <DetailRow label="Full Name" value={viewRec?.fullName} />
                <DetailRow label="Username" value={viewRec?.username} copyable />
                <DetailRow label="Phone" value={viewRec?.phone} copyable />
                <DetailRow label="Email" value={viewRec?.email} copyable />
                <DetailRow label="Status" value={viewRec?.status} />
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setViewRecOpen(false)}>Close</Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<LockResetIcon />} onClick={() => { setViewRecOpen(false); handleResetRecPw(viewRec) }} sx={{ background: blueGrad, color: 'white' }}>
                Reset Password
              </Button>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => { setViewRecOpen(false); handleEditRec(viewRec) }} sx={{ background: purpleGrad, color: 'white' }}>
                Edit
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* ─── Edit Receptionist Dialog ───────────────── */}
        <Dialog open={editRecOpen} onClose={() => setEditRecOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: purpleGrad, color: 'white', fontWeight: 'bold' }}>
            Edit Receptionist — {viewRec?.fullName}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {editRecMsg && <Alert severity={editRecMsg.type} sx={{ mb: 2, mt: 1 }}>{editRecMsg.text}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><TextField fullWidth label="Full Name" value={editRecForm.fullName} onChange={e => setEditRecForm({ ...editRecForm, fullName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Username" value={editRecForm.username} onChange={e => setEditRecForm({ ...editRecForm, username: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={editRecForm.phone} onChange={e => setEditRecForm({ ...editRecForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={editRecForm.email} onChange={e => setEditRecForm({ ...editRecForm, email: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Status" value={editRecForm.status} onChange={e => setEditRecForm({ ...editRecForm, status: e.target.value })} select SelectProps={{ native: true }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => handleDeleteConfirm('receptionist', viewRec?.id, viewRec?.fullName)} variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { backgroundColor: '#ffebee' } }}>
              Delete
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setEditRecOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveRec} disabled={editRecLoading} sx={{ background: purpleGrad, color: 'white' }}>
                {editRecLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* ─── Reset Receptionist Password Dialog ─────── */}
        <Dialog open={resetRecPwOpen} onClose={() => setResetRecPwOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ background: blueGrad, color: 'white', fontWeight: 'bold' }}>
            Reset Password — {resetRecPwTarget?.fullName}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {resetRecPwMsg && <Alert severity={resetRecPwMsg.type} sx={{ mb: 2, mt: 1 }}>{resetRecPwMsg.text}</Alert>}
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              Enter new password for <strong>{resetRecPwTarget?.username}</strong>
            </Typography>
            <TextField fullWidth label="New Password" type="password" value={resetRecPwValue} onChange={e => setResetRecPwValue(e.target.value)} placeholder="Min 6 characters"
              helperText={resetRecPwValue.length > 0 && resetRecPwValue.length < 6 ? 'Must be at least 6 characters' : ''} error={resetRecPwValue.length > 0 && resetRecPwValue.length < 6}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetRecPwOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitResetRecPw} disabled={resetRecPwLoading} sx={{ background: blueGrad, color: 'white' }}>
              {resetRecPwLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Delete Confirmation Dialog ─────────────── */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} variant="contained" disabled={deleteLoading} sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  )
}

export default AdminDashboard
