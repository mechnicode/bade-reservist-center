import axios from 'axios'
import { useUserStore } from '@/stores/user'

// Create a new Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000', // Use VITE_API_URL from .env or default
  timeout: 10000, // Request timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Optional: Add request interceptor
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Optional: Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle global errors here
    // For example, redirect to login on 401
    // if (error.response && error.response.status === 401) {
    //   // Redirect to login page
    // }
    return Promise.reject(error)
  }
)

export default api
