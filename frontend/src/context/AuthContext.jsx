import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useTenant } from './TenantContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resetTenant } = useTenant();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, password, tenantId, plantId) => {
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
    localStorage.setItem('tenantId', userData.tenantId);

    if (tenant) localStorage.setItem('tenant', JSON.stringify(tenant));
    if (plant) localStorage.setItem('plant', JSON.stringify(plant));

    setUser(userData);
    return { user: userData, tenant, plant };
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    localStorage.clear();
    setUser(null);
    resetTenant();
  }, [resetTenant]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
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
