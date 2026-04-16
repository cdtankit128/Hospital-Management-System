import axios, { AxiosResponse, AxiosError } from 'axios'
import { BACKEND_URL, IS_NGROK } from './config'

const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  withCredentials: !BACKEND_URL, // disable credentials for cross-origin requests
  ...(IS_NGROK && {
    headers: {
      'ngrok-skip-browser-warning': 'true', // bypass Ngrok's browser warning page
    },
  }),
})

// JWT Interceptor - attach token to every request
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('X-Auth-Token', token)
    } else {
      config.headers['X-Auth-Token'] = token
    }
  }
  return config
})

// Response Interceptor - handle 401 errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized:', error.response?.data)
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('username')
      window.location.href = '/login'
    } else {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }
    return Promise.reject(error)
  }
)

export default api
