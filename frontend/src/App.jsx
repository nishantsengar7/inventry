import { lazy, Suspense, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLoader from './components/ui/AppLoader';
import LoadingSpinner from './components/ui/LoadingSpinner';

const Login        = lazy(() => import('./pages/Login'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Products     = lazy(() => import('./pages/Products'));
const Categories   = lazy(() => import('./pages/Categories'));
const Suppliers    = lazy(() => import('./pages/Suppliers'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AIInsights   = lazy(() => import('./pages/AIInsights'));
const NotFound     = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setAppReady(true);
  }, []);

  return (
    <ErrorBoundary>
      {!appReady && <AppLoader onComplete={handleLoaderComplete} />}

      <AuthProvider>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -5px rgba(0,0,0,0.05)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
              style: { background: '#f0fdf4', color: '#065f46', border: '1px solid #a7f3d0' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
              style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
            },
            loading: {
              style: { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' },
            },
          }}
        />

        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login"        element={<Login />} />

            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/categories"   element={<Categories />} />
            <Route path="/suppliers"    element={<Suppliers />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/ai-insights"  element={<AIInsights />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}
