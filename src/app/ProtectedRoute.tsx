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
  const {
    user,
    role,
    authStatus,
    isConfigured,
    mentorOnboardingState,
    mentorOnboardingLoading,
  } = useAuth();
  const location = useLocation();

  if (authStatus === 'loading' || mentorOnboardingLoading) {
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

  if (authStatus === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authStatus === 'missing_profile') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-4 text-white">
          <h1 className="text-2xl font-medium">Account setup is incomplete</h1>
          <p className="text-sm text-[#9a9a9a]">
            Your account does not have a usable role yet. Please contact support to finish setup.
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-4 text-white">
          <h1 className="text-2xl font-medium">Unable to load your account</h1>
          <p className="text-sm text-[#9a9a9a]">
            We could not resolve your account role. Please sign in again or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    const isAdminRoute = location.pathname.startsWith('/admin');
    if (!isAdminRoute) {
      return <Navigate to="/admin" replace />;
    }
  }

  if (role === 'mentor') {
    const isOnboardingRoute = location.pathname === '/mentor/onboarding';
    const isOnboardingComplete = mentorOnboardingState?.isComplete === true;

    if (!isOnboardingRoute && !isOnboardingComplete) {
      return <Navigate to="/mentor/onboarding" replace />;
    }

    if (isOnboardingRoute && isOnboardingComplete) {
      return <Navigate to="/mentor" replace />;
    }
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'mentor') return <Navigate to={mentorOnboardingState?.isComplete ? '/mentor' : '/mentor/onboarding'} replace />;
    return <Navigate to="/seeker" replace />;
  }

  return <>{children}</>;
};
