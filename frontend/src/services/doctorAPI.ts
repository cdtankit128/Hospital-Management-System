import api from '../api/api'

export interface PatientRecord {
  patientName: string
  diagnosis: string
  prescription: string
}

export interface PatientData {
  name: string
  age: number
  gender: string
  phone: string
  bloodGroup: string
  email?: string
  dateOfBirth?: string
}

export interface PatientResponse {
  id?: number
  name?: string
  email?: string
  age?: number
  bloodGroup?: string
  patientLoginId?: string
  patientPassword?: string
  message?: string
  success?: boolean
}

export interface PatientRecordResponse {
  id?: number
  message?: string
  success?: boolean
}

export interface RegisterDoctorRequest {
  name: string
  specialization: string
  phone: string
  experience: number
}

export interface RegisterDoctorResponse {
  id?: number
  name?: string
  specialization?: string
  phone?: string
  experience?: number
}

export const doctorAPI = {
  registerDoctor: async (data: RegisterDoctorRequest): Promise<RegisterDoctorResponse> => {
    const response = await api.post('/doctors', data)
    return response.data
  },

  registerPatient: async (patientData: PatientData): Promise<PatientResponse> => {
    const response = await api.post('/patients', patientData)
    return response.data
  },

  savePatientRecord: async (record: PatientRecord): Promise<PatientRecordResponse> => {
    const response = await api.post('/doctors/patient-record', record)
    return response.data
  },

  getMyPatients: async () => {
    const response = await api.get('/patients')
    return response.data
  },

  getAppointments: async () => {
    const response = await api.get('/doctor/appointments')
    return response.data
  },

  updatePatientRecord: async (id: number, record: Partial<PatientRecord>) => {
    const response = await api.put(`/doctor/patient-record/${id}`, record)
    return response.data
  },

  searchPatientByPhone: async (phone: string) => {
    const response = await api.get(`/patients/search-by-phone?phone=${encodeURIComponent(phone)}`)
    return response.data
  },

  getAllDoctorsAdmin: async () => {
    const response = await api.get('/auth/admin/doctors')
    return response.data
  },

  updateDoctorAdmin: async (id: number, data: { name: string; specialization: string; email: string; status: string }) => {
    const response = await api.put(`/auth/admin/doctors/${id}`, data)
    return response.data
  },

  deleteDoctorAdmin: async (id: number) => {
    const response = await api.delete(`/auth/admin/doctors/${id}`)
    return response.data
  },

  deletePatientAdmin: async (id: number) => {
    const response = await api.delete(`/patients/${id}`)
    return response.data
  },
}
