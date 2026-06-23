import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck,
  ArrowLeftRight, LogOut, Box, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/products',     label: 'Products',     Icon: Package          },
  { to: '/categories',   label: 'Categories',   Icon: Tag              },
  { to: '/suppliers',    label: 'Suppliers',    Icon: Truck            },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight   },
  { to: '/ai-insights',  label: 'AI Insights',  Icon: Sparkles         },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col"
      style={{ width: '260px', backgroundColor: '#1E1E2E' }}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Box size={18} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">InvenTrack</span>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-150 group
               ${isActive
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                 : 'text-white/60 hover:text-white hover:bg-white/10'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold uppercase">
              {user?.name?.[0] ?? 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/40 text-xs capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-white/60 hover:text-white hover:bg-red-500/20
                     transition-all duration-150 group"
        >
          <LogOut size={18} className="text-white/40 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
