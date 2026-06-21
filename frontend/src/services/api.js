import axios from 'axios'

/**
 * Centralised Axios instance.
 * baseURL points to /api which Vite proxies to http://backend:8000
 * All requests automatically carry the stored JWT when set by AuthContext.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach token from storage if present ──
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('ims_user')
      if (stored) {
        const { token } = JSON.parse(stored)
        if (token) config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch { /* ignore */ }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: redirect to /login on 401 ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ims_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
