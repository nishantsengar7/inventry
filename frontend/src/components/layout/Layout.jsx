import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingSpinner from '../ui/LoadingSpinner';
import ChatAssistant from '../ai/ChatAssistant';

export default function Layout({ children, title = 'Dashboard', lowStockCount = 0 }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: '260px' }}>
        <Header title={title} lowStockCount={lowStockCount} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ChatAssistant />
    </div>
  );
}
