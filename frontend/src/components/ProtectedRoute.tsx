import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('SYSTEM_ADMIN' | 'NORMAL_USER' | 'STORE_OWNER')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 font-medium">Loading session...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home or corresponding default dashboard
    if (user.role === 'SYSTEM_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'STORE_OWNER') {
      return <Navigate to="/store-owner" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
