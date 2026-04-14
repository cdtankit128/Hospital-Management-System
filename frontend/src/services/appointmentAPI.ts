import api from '../api/api'
import axios from 'axios'
import { BACKEND_URL } from '../api/config'

const BASE_URL = `${BACKEND_URL}/api/appointments`

export interface BookAppointmentRequest {
  patientName: string
  patientPhone: string
  doctorUsername: string
  doctorName: string
  specialization: string
  appointmentDate: string // YYYY-MM-DD
  preferredTime: string // free text e.g. "Morning", "2:00 PM", "Anytime"
  reason: string
}

export interface AppointmentResponse {
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
  status: 'PENDING' | 'APPROVED' | 'BOOKED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED' | 'ON_HOLD'
  appointmentNumber: number | null
  queueNumber: number | null
  createdAt: string
  updatedAt: string
}

// Public endpoints (no auth needed)
export const appointmentPublicAPI = {
  bookAppointment: async (data: BookAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await axios.post(`${BASE_URL}/book`, data)
    return response.data
  },

  getAvailableSlots: async (doctorUsername: string, date: string): Promise<string[]> => {
    const response = await axios.get(`${BASE_URL}/available-slots`, {
      params: { doctorUsername, date }
    })
    return response.data
  },

  getAppointmentsByPatientPhone: async (phone: string): Promise<AppointmentResponse[]> => {
    const response = await axios.get(`${BASE_URL}/patient-by-phone/${phone}`)
    return response.data
  },

  getAppointmentsByPatientName: async (name: string): Promise<AppointmentResponse[]> => {
    const response = await axios.get(`${BASE_URL}/patient-by-name/${encodeURIComponent(name)}`)
    return response.data
  },

  cancelAppointment: async (id: number): Promise<AppointmentResponse> => {
    const response = await axios.put(`${BASE_URL}/${id}/cancel`)
    return response.data
  },
}

// Authenticated endpoints (doctor/admin)
export const appointmentDoctorAPI = {
  getMyPatientsByAppointments: async (username: string): Promise<any[]> => {
    const response = await api.get(`/appointments/doctor-patients/${username}`)
    return response.data
  },

  getMyAppointments: async (username: string): Promise<AppointmentResponse[]> => {
    const response = await api.get(`/appointments/doctor-username/${username}`)
    return response.data
  },

  getPendingAppointments: async (username: string): Promise<AppointmentResponse[]> => {
    const response = await api.get(`/appointments/doctor-pending/${username}`)
    return response.data
  },

  approveAppointment: async (id: number, message?: string): Promise<AppointmentResponse> => {
    const response = await api.put(`/appointments/${id}/approve`, { message: message || '' })
    return response.data
  },

  rejectAppointment: async (id: number, message?: string): Promise<AppointmentResponse> => {
    const response = await api.put(`/appointments/${id}/reject`, { message: message || '' })
    return response.data
  },

  completeAppointment: async (id: number): Promise<AppointmentResponse> => {
    const response = await api.put(`/appointments/${id}/complete`)
    return response.data
  },

  getApprovedTodayAppointments: async (username: string): Promise<AppointmentResponse[]> => {
    const response = await api.get(`/appointments/doctor-approved-today/${username}`)
    return response.data
  },

  getAllAppointments: async (): Promise<AppointmentResponse[]> => {
    const response = await api.get('/appointments')
    return response.data
  },
}

// Generate Google Calendar link for an appointment
export const generateGoogleCalendarLink = (appointment: AppointmentResponse): string => {
  const date = appointment.appointmentDate.replace(/-/g, '')
  const timeParts = appointment.timeSlot.split(':')
  const startHour = parseInt(timeParts[0])
  const startMin = parseInt(timeParts[1])
  const endHour = startHour + (startMin + 30 >= 60 ? 1 : 0)
  const endMin = (startMin + 30) % 60

  const startTime = `${date}T${String(startHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`
  const endTime = `${date}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`

  const title = encodeURIComponent(`Doctor Appointment - Dr. ${appointment.doctorName}`)
  const details = encodeURIComponent(
    `Patient: ${appointment.patientName}\nDoctor: Dr. ${appointment.doctorName} (${appointment.specialization})\nReason: ${appointment.reason || 'General Consultation'}\nStatus: ${appointment.status}`
  )
  const location = encodeURIComponent('City Hospital & Diagnostic Centre')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}&sf=true&output=xml`
}

// Generate .ics file content for download
export const generateICSFile = (appointment: AppointmentResponse): string => {
  const date = appointment.appointmentDate.replace(/-/g, '')
  const timeParts = appointment.timeSlot.split(':')
  const startHour = parseInt(timeParts[0])
  const startMin = parseInt(timeParts[1])
  const endHour = startHour + (startMin + 30 >= 60 ? 1 : 0)
  const endMin = (startMin + 30) % 60

  const startTime = `${date}T${String(startHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`
  const endTime = `${date}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HMS//Appointment//EN
BEGIN:VEVENT
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:Doctor Appointment - Dr. ${appointment.doctorName}
DESCRIPTION:Patient: ${appointment.patientName}\\nDoctor: Dr. ${appointment.doctorName} (${appointment.specialization})\\nReason: ${appointment.reason || 'General Consultation'}
LOCATION:City Hospital & Diagnostic Centre
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
}

export const downloadICSFile = (appointment: AppointmentResponse) => {
  const icsContent = generateICSFile(appointment)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `appointment-${appointment.id}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
