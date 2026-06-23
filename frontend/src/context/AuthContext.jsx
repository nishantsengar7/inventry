import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate                  = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('ims_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    authAPI
      .getMe()
      .then((userData) => {
        setUser(userData);
        setToken(storedToken);
      })
      .catch(() => {

        authAPI.logout();
        setUser(null);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authAPI.login(email, password);
      const userData = await authAPI.getMe();
      setToken(data.access_token);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}! 👋`);
      navigate('/dashboard');
    },
    [navigate],
  );

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
    navigate('/login');
  }, [navigate]);

  const isAdmin = () => user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, login, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
