import api from '../api/api'

// ==================== INTERFACES ====================

export interface LabReportEmailRequest {
  to: string
  patientName: string
  doctorName: string
  testCategory: string
  remarks?: string
  followUpRequired: boolean
  followUpDate?: string
  reportPdf?: File | null
}

export interface MedicineReminderRequest {
  to: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  doctorName: string
  instructions?: string
}

export interface DischargeSummaryRequest {
  to: string
  patientName: string
  diagnosis: string
  treatment: string
  admissionDate: string
  dischargeDate: string
  doctorName: string
  followUpDate?: string
  instructions?: string
}

export interface CustomEmailRequest {
  to: string
  subject: string
  message: string
  doctorName: string
}

// ==================== API METHODS ====================

export const emailAPI = {
  sendLabReport: (data: LabReportEmailRequest) => {
    const formData = new FormData()
    formData.append('to', data.to)
    formData.append('patientName', data.patientName)
    formData.append('doctorName', data.doctorName)
    formData.append('testCategory', data.testCategory)
    formData.append('remarks', data.remarks || '')
    formData.append('followUpRequired', String(data.followUpRequired))
    if (data.followUpRequired && data.followUpDate) {
      formData.append('followUpDate', data.followUpDate)
    }
    if (data.reportPdf) {
      formData.append('reportPdf', data.reportPdf)
    }
    return api.post('/email/lab-report', formData).then((res) => res.data)
  },

  sendMedicineReminder: (data: MedicineReminderRequest) =>
    api.post('/email/medicine-reminder', data).then((res) => res.data),

  sendDischargeSummary: (data: DischargeSummaryRequest) =>
    api.post('/email/discharge-summary', data).then((res) => res.data),

  sendCustomEmail: (data: CustomEmailRequest) =>
    api.post('/email/send', data).then((res) => res.data),

  sendTestEmail: (to: string) =>
    api.post('/email/test', { to }).then((res) => res.data),
}
