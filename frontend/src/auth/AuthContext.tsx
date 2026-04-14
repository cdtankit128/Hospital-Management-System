import { createContext, useContext, useState, ReactNode } from 'react'
import { LoginResponse } from '../types'

interface AuthContextType {
  token: string | null
  role: string | null
  username: string | null
  fullName: string | null
  specialization: string | null
  designation: string | null
  isAuthenticated: boolean
  login: (response: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<{
    token: string | null
    role: string | null
    username: string | null
    fullName: string | null
    specialization: string | null
    designation: string | null
  }>({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username'),
    fullName: localStorage.getItem('fullName'),
    specialization: localStorage.getItem('specialization'),
    designation: localStorage.getItem('designation'),
  })

  const login = (response: LoginResponse) => {
    localStorage.setItem('token', response.token)
    localStorage.setItem('role', response.role)
    localStorage.setItem('username', response.username)
    if (response.fullName) localStorage.setItem('fullName', response.fullName)
    if (response.specialization) localStorage.setItem('specialization', response.specialization)
    if (response.designation) localStorage.setItem('designation', response.designation)
    setAuth({
      token: response.token,
      role: response.role,
      username: response.username,
      fullName: response.fullName || null,
      specialization: response.specialization || null,
      designation: response.designation || null,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('fullName')
    localStorage.removeItem('specialization')
    localStorage.removeItem('designation')
    setAuth({
      token: null,
      role: null,
      username: null,
      fullName: null,
      specialization: null,
      designation: null,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        role: auth.role,
        username: auth.username,
        fullName: auth.fullName,
        specialization: auth.specialization,
        designation: auth.designation,
        isAuthenticated: !!auth.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
