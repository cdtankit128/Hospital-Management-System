import api from '../api/api'
import axios from 'axios'
import { BACKEND_URL } from '../api/config'

const BASE_URL = `${BACKEND_URL}/api/payments`

export interface PaymentRecord {
  id: number
  receiptNumber: string
  patientName: string
  patientPhone: string
  doctorName: string
  specialization: string
  amount: number
  paymentMethod: 'CASH' | 'QR' | 'ONLINE'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED'
  transactionId: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  razorpaySignature: string | null
  receptionistUsername: string
  notes: string | null
  refundReason: string | null
  refundedAt: string | null
  refundTransactionId: string | null
  payerType: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  patientName: string
  patientPhone: string
  doctorName: string
  specialization: string
  amount: number
  paymentMethod?: 'CASH' | 'QR' | 'ONLINE'
  notes?: string
  appointmentId?: number
  receptionistUsername?: string
  payerType?: string
}

export interface RecordPaymentRequest {
  patientName: string
  patientPhone: string
  doctorName: string
  specialization: string
  amount: number
  paymentMethod: 'CASH' | 'QR' | 'ONLINE'
  transactionId?: string | null
  notes?: string
  appointmentId?: number | null
}

export interface RazorpayOrderResponse {
  payment: PaymentRecord
  razorpayOrderId: string
  razorpayKeyId: string
  amount: number // in paise
  currency: string
}

export interface RazorpayVerifyRequest {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface RazorpayVerifyResponse {
  verified: boolean
  payment?: PaymentRecord
  message?: string
  error?: string
}

// Razorpay Checkout types
declare global {
  interface Window {
    Razorpay: any
  }
}

// ==================== Razorpay Payment API ====================

export const razorpayAPI = {
  /**
   * Get the Razorpay key ID for frontend checkout
   */
  getKeyId: async (): Promise<string> => {
    const response = await axios.get(`${BASE_URL}/razorpay/key`)
    return response.data.keyId
  },

  /**
   * Create a Razorpay order (returns order details for Checkout)
   */
  createOrder: async (data: CreateOrderRequest): Promise<RazorpayOrderResponse> => {
    const response = await axios.post(`${BASE_URL}/razorpay/create-order`, data)
    return response.data
  },

  /**
   * Verify Razorpay payment after checkout
   */
  verifyPayment: async (data: RazorpayVerifyRequest): Promise<RazorpayVerifyResponse> => {
    const response = await axios.post(`${BASE_URL}/razorpay/verify`, data)
    return response.data
  },

  /**
   * Open Razorpay Checkout window
   */
  openCheckout: (options: {
    razorpayKeyId: string
    razorpayOrderId: string
    amount: number // in paise
    currency: string
    name: string
    description: string
    prefill?: { name?: string; contact?: string; email?: string }
    onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void
    onFailure: (error: any) => void
    onDismiss?: () => void
  }) => {
    const rzp = new window.Razorpay({
      key: options.razorpayKeyId,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.razorpayOrderId,
      prefill: options.prefill || {},
      theme: { color: '#6C63FF' },
      handler: (response: any) => {
        options.onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
      modal: {
        ondismiss: () => {
          if (options.onDismiss) options.onDismiss()
        },
      },
    })
    rzp.on('payment.failed', (response: any) => {
      options.onFailure(response.error)
    })
    rzp.open()
  },
}

// ==================== Public Payment API (Patient) ====================

export const paymentPublicAPI = {
  /**
   * Create a payment order (PENDING) — patient-initiated
   */
  createOrder: async (data: CreateOrderRequest): Promise<PaymentRecord> => {
    const response = await axios.post(`${BASE_URL}/create-order`, data)
    return response.data
  },

  /**
   * Confirm a pending payment (mark as COMPLETED)
   */
  confirmPayment: async (paymentId: number, transactionId?: string): Promise<PaymentRecord> => {
    const response = await axios.put(`${BASE_URL}/${paymentId}/confirm`, {
      transactionId: transactionId || `TXN-${Date.now()}`,
    })
    return response.data
  },

  /**
   * Request refund for a payment
   */
  refundPayment: async (paymentId: number, reason?: string): Promise<PaymentRecord> => {
    const response = await axios.put(`${BASE_URL}/${paymentId}/refund`, {
      reason: reason || 'Patient requested refund',
    })
    return response.data
  },

  /**
   * Get payment for a specific appointment
   */
  getPaymentByAppointment: async (appointmentId: number): Promise<PaymentRecord | null> => {
    const response = await axios.get(`${BASE_URL}/by-appointment/${appointmentId}`)
    return response.data?.id ? response.data : null
  },

  /**
   * Get all payments for a patient by phone
   */
  getPaymentsByPhone: async (phone: string): Promise<PaymentRecord[]> => {
    const response = await axios.get(`${BASE_URL}/by-phone/${phone}`)
    return response.data
  },

  /**
   * Get all payments for a patient by name
   */
  getPaymentsByName: async (name: string): Promise<PaymentRecord[]> => {
    const response = await axios.get(`${BASE_URL}/by-name/${encodeURIComponent(name)}`)
    return response.data
  },

  /**
   * Get payment by receipt number
   */
  getPaymentByReceipt: async (receiptNumber: string): Promise<PaymentRecord> => {
    const response = await axios.get(`${BASE_URL}/receipt/${receiptNumber}`)
    return response.data
  },
}

// ==================== Authenticated Payment API (Receptionist) ====================

export const paymentReceptionistAPI = {
  /**
   * Record a direct payment (receptionist — immediately COMPLETED)
   */
  recordPayment: async (data: RecordPaymentRequest): Promise<PaymentRecord> => {
    const response = await api.post('/payments/record', data)
    return response.data
  },

  /**
   * Get all payments
   */
  getAllPayments: async (): Promise<PaymentRecord[]> => {
    const response = await api.get('/payments/all')
    return response.data
  },

  /**
   * Get today's payments
   */
  getTodayPayments: async (): Promise<PaymentRecord[]> => {
    const response = await api.get('/payments/today')
    return response.data
  },

  /**
   * Refund a payment (receptionist can also refund)
   */
  refundPayment: async (paymentId: number, reason?: string): Promise<PaymentRecord> => {
    const response = await api.put(`/payments/${paymentId}/refund`, {
      reason: reason || 'Refunded by receptionist',
    })
    return response.data
  },
}
