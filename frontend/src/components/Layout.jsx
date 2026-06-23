import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Truck,
  ArrowLeftRight, LogOut, Menu, X, Bell,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/products',     label: 'Products',     Icon: Package          },
  { to: '/categories',   label: 'Categories',   Icon: Tag              },
  { to: '/suppliers',    label: 'Suppliers',    Icon: Truck            },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight   },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      <aside
        className={`
          flex flex-col flex-shrink-0 bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-slate-100 text-sm leading-tight">
              Inventory<br/>
              <span className="text-primary-400 font-semibold">Manager</span>
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && (
                <ChevronRight size={14} className="ml-auto opacity-40" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-danger-400 hover:text-danger-300 hover:bg-danger-900/20"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        <header className="flex items-center h-16 px-4 border-b border-slate-800 bg-slate-900 gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1" />

          <button className="btn-ghost p-2 rounded-lg relative" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.username?.[0] ?? 'U'}
            </div>
            <span className="text-sm text-slate-300 font-medium hidden sm:block">
              {user?.username ?? 'User'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
