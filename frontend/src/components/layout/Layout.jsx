import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingSpinner from '../ui/LoadingSpinner';
import ChatAssistant from '../ai/ChatAssistant';

export default function Layout({ children, title = 'Dashboard', lowStockCount = 0 }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in" style={{ backgroundColor: '#F8FAFC' }}>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Header 
          title={title} 
          lowStockCount={lowStockCount} 
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      <ChatAssistant />
    </div>
  );
}
