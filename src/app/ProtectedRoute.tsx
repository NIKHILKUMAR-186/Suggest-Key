import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../domains/auth/AuthContext';
import { UserRole } from '../lib/supabase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
        Application is not configured. Please contact support.
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'mentor') return <Navigate to="/mentor" replace />;
    return <Navigate to="/seeker" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
        Your account role has not been configured yet. Please contact support.
      </div>
    );
  }

  return <>{children}</>;
};
