import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Plants from './pages/Plants';
import Customers from './pages/Customers';
import Distribution from './pages/Distribution';
import Payments from './pages/Payments';
import Events from './pages/Events';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Subscriptions from './pages/Subscriptions';
import Salaries from './pages/Salaries';
import CustomerDashboard from './pages/CustomerDashboard';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tenants': 'Tenants',
  '/plants': 'Plants',
  '/customers': 'Customers',
  '/distribution': 'Distribution',
  '/payments': 'Payments',
  '/events': 'Events',
  '/employees': 'Employees',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'Users',
  '/subscriptions': 'Subscriptions',
  '/salaries': 'Salaries',
};

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Customer role gets a completely separate layout
  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  return children;
}

function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPath={location.pathname} />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/distribution" element={<Distribution />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/events" element={<Events />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/salaries" element={<Salaries />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
