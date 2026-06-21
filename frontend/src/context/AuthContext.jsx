import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

// ── Auth Context ──────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Try to restore user from localStorage on first load
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ims_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // ── Login ────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    // FastAPI OAuth2 expects form data (application/x-www-form-urlencoded)
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)

    const { data } = await api.post('/auth/token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    // Store JWT token and user info
    const userData = { username, token: data.access_token }
    localStorage.setItem('ims_user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    setUser(userData)
    return userData
  }, [])

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('ims_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook
export const useAuth = () => useContext(AuthContext)
