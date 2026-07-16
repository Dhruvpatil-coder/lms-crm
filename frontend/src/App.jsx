import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import HRLayout from './pages/hr/HRLayout';
import TrainerLayout from './pages/trainer/TrainerLayout';
import AdminLayout from './pages/admin/AdminLayout';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'hr' || user.role === 'manager') return <Navigate to="/hr" replace />;
  if (user.role === 'trainer') return <Navigate to="/trainer" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/hr/*" element={
            <ProtectedRoute roles={['hr', 'manager', 'admin']}>
              <HRLayout />
            </ProtectedRoute>
          } />
          <Route path="/trainer/*" element={
            <ProtectedRoute roles={['trainer', 'admin']}>
              <TrainerLayout />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
