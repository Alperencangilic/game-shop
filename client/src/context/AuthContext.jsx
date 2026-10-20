import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const userRef = useRef(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    const data = await api.get('/auth/me');
    if (userRef.current && !data.user) toast.warning('You were signed out because your account was changed by an administrator.');
    setUser(data.user);
    return data.user;
  }, [toast]);

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this on 401 (e.g. expired session)
  useEffect(() => {
    const onUnauthorized = () => {
      if (!userRef.current) return;
      setUser(null);
      toast.warning('Your session has expired. Please log in again.');
    };
    window.addEventListener('gs:unauthorized', onUnauthorized);
    return () => window.removeEventListener('gs:unauthorized', onUnauthorized);
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (fields) => {
    const data = await api.post('/auth/register', fields);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      setUser,
      can: (permission) => Boolean(user?.permissions.includes(permission)),
      isCustomer: Boolean(user?.permissions.includes('store.purchase')),
      isStaff: Boolean(user?.permissions.includes('backoffice.access')),
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
