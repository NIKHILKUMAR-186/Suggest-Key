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

  // 1. If AUTH_ENABLED is false, allow access (no auth required)
  if (!config.AUTH_ENABLED) {
    return <>{children}</>;
  }

  // 2. If DEV_AUTH_BYPASS is active, allow access (demo mode - no Supabase session)
  // WARNING: Database queries will fail with 401 in demo mode
  if (config.DEV_AUTH_BYPASS) {
    console.warn('[ProtectedRoute] DEV_AUTH_BYPASS is active - allowing access without Supabase session');
    return <>{children}</>;
  }

  // 3. If AUTH_ROUTE_GUARD is disabled, allow access (for development/testing)
  if (!config.AUTH_ROUTE_GUARD) {
    console.warn('[ProtectedRoute] AUTH_ROUTE_GUARD is disabled - allowing access without authentication');
    return <>{children}</>;
  }

  // 4. Not authenticated -> redirect to login with return target
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 5. Role authorization check (honoring ROLE_GUARD_ENABLED)
  if (config.ROLE_GUARD_ENABLED && allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'mentor') return <Navigate to="/mentor" replace />;
    return <Navigate to="/seeker" replace />;
  }

  return <>{children}</>;
};

