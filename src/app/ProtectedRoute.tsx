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
  const { user, role, isLoading, config } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. If AUTH_ENABLED is false or DEV_AUTH_BYPASS is active or AUTH_ROUTE_GUARD is false, allow access
  if (!config.AUTH_ENABLED || config.DEV_AUTH_BYPASS || !config.AUTH_ROUTE_GUARD) {
    return <>{children}</>;
  }

  // 2. Not authenticated -> redirect to login with return target
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role authorization check (honoring ROLE_GUARD_ENABLED)
  if (config.ROLE_GUARD_ENABLED && allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'mentor') return <Navigate to="/mentor" replace />;
    return <Navigate to="/seeker" replace />;
  }

  return <>{children}</>;
};

