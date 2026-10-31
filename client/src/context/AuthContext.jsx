import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorageKey, getApiErrorMessage } from '../services/api.js';

const AuthContext = createContext(null);

function storeSession(data) {
  window.localStorage.setItem(authStorageKey, data.accessToken);
  return data.user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.localStorage.getItem(authStorageKey)) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(response => setUser(response.data.data.user))
      .catch(() => {
        window.localStorage.removeItem(authStorageKey);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      try {
        const response = await api.post('/auth/login', credentials);
        setUser(storeSession(response.data.data));
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    async register(details) {
      try {
        const response = await api.post('/auth/register', details);
        setUser(storeSession(response.data.data));
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } finally {
        window.localStorage.removeItem(authStorageKey);
        setUser(null);
      }
    }
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
