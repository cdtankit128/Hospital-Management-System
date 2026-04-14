export interface Patient {
  id?: number
  name: string
  age: number
  gender: string
  phone: string
  address?: string
}

export interface User {
  id: number
  username: string
  role: string
}

export interface LoginResponse {
  token: string
  role: string
  username: string
  fullName?: string
  specialization?: string
  designation?: string
}
