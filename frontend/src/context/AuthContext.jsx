import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pwa';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.clear();
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && process.env.NODE_ENV === 'production') {
      subscribeToPush().catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (phone, password, tenantId, plantId) => {
    const { data } = await api.post('/auth/login', {
      phone,
      password,
      tenantId,
      plantId,
    });

    if (!data.success) {
      throw new Error(data.error?.message || 'Login failed');
    }

    const { accessToken, refreshToken, user: userData, tenant, plant } = data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.tenantId) localStorage.setItem('tenantId', userData.tenantId);

    if (tenant) localStorage.setItem('tenant', JSON.stringify(tenant));
    if (plant) localStorage.setItem('plant', JSON.stringify(plant));

    setUser(userData);

    // Subscribe to push notifications after login
    if (process.env.NODE_ENV === 'production') {
      subscribeToPush().catch(() => {});
    }

    return { user: userData, tenant, plant };
  }, []);

  const logout = useCallback(async () => {
    try {
      await unsubscribeFromPush();
    } catch {}
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Listen for forced logout from axios interceptor (token refresh failure)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const isAuthenticated = !!user;

  const contextValue = useMemo(() => ({
    user, login, logout, loading, isAuthenticated,
  }), [user, login, logout, loading, isAuthenticated]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
