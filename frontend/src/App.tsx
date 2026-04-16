import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './auth/PrivateRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import DoctorRegisterPage from './pages/DoctorRegisterPage'
import PatientRegisterPage from './pages/PatientRegisterPage'
import BookAppointment from './pages/BookAppointment'
import ChatBot from './components/ChatBot'
import { useAuth } from './auth/AuthContext'

function ChatBotWrapper() {
  const location = useLocation()
  const { fullName, role: authRole } = useAuth()
  const isDoctorRoute = location.pathname.startsWith('/doctor')
  const isPatientRoute = location.pathname.startsWith('/patient')
  const useAI = isDoctorRoute || isPatientRoute
  const role = isDoctorRoute ? 'doctor' : 'patient'
  const doctorName = isDoctorRoute && authRole === 'DOCTOR' ? fullName : null
  return <ChatBot mode={useAI ? 'ai' : 'basic'} role={role as 'doctor' | 'patient'} doctorName={doctorName} />
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient-login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/doctor-register" element={<DoctorRegisterPage />} />
        <Route path="/patient-register" element={<PatientRegisterPage />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/patient/book-appointment" element={<BookAppointment />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRole="PATIENT">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Receptionist Routes */}
        <Route
          path="/receptionist/dashboard"
          element={
            <ProtectedRoute requiredRole="RECEPTIONIST">
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/receptionist" element={<Navigate to="/receptionist/dashboard" replace />} />
        <Route path="*" element={<div style={{ padding: '20px' }}>404 - Page Not Found</div>} />
      </Routes>
      <ChatBotWrapper />
    </Router>
  )
}

export default App
