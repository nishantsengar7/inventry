import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Products     from './pages/Products'
import Categories   from './pages/Categories'
import Suppliers    from './pages/Suppliers'
import Transactions from './pages/Transactions'
import NotFound     from './pages/NotFound'
import { AuthProvider, useAuth } from './context/AuthContext'

// ── Protected Route Guard ─────────────────────────────────────
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// ── App Component ─────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped in persistent Layout (sidebar + topbar) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index           element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="products"     element={<Products />} />
          <Route path="categories"   element={<Categories />} />
          <Route path="suppliers"    element={<Suppliers />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
