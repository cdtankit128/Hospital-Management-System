import api from '../api/api'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  message: string
  id?: number
  username: string
  email?: string
  role: string
  token: string
  fullName?: string
  specialization?: string
  designation?: string
}

export const authAPI = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials),

  register: (data: any) =>
    api.post<LoginResponse>('/auth/register', data),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
  },
}
