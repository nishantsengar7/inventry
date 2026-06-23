import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

export default function Header({ title, lowStockCount = 0 }) {
  const { user } = useAuth();
  const today    = formatDate(new Date().toISOString());

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative p-2 rounded-xl text-gray-500 hover:text-gray-800
                     hover:bg-gray-100 transition-colors"
          title={lowStockCount > 0 ? `${lowStockCount} low-stock alert(s)` : 'No alerts'}
        >
          <Bell size={19} />
          {lowStockCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full
                             border-2 border-white animate-pulse" />
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold uppercase">
              {user?.name?.[0] ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
