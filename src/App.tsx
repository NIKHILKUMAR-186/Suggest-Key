import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './domains/auth/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './app/ProtectedRoute';

// Public Pages
import { LandingPage } from './app/public/LandingPage';
import { ExplorePage } from './app/public/ExplorePage';
import { CategoryExplorePage } from './app/public/CategoryExplorePage';
import { DiscoverPage } from './app/public/DiscoverPage';
import { AdvisorProfilePage } from './app/public/AdvisorProfilePage';
import { GigDetailPage } from './app/public/GigDetailPage';
import { LoginPage } from './app/public/LoginPage';
import { SignupPage } from './app/public/SignupPage';
import { MentorPublicProfilePage } from './app/public/MentorPublicProfilePage';

// Seeker Shell & Pages
import { SeekerShell } from './app/seeker/SeekerShell';
import {
  SeekerWorkspacePage,
  SeekerDiscoverPage,
  SeekerBookingsPage,
  SeekerBookingDetailPage,
  SeekerMessagesPage,
  SeekerProfilePage,
  SeekerGoalsPage,
  SeekerActionItemsPage,
} from './app/seeker/SeekerPages';

// Mentor Shell & Pages
import { MentorShell } from './app/mentor/MentorShell';
import {
  MentorOverviewPage,
  MentorGigsPage,
  MentorGigEditorPage,
  MentorAvailabilityPage,
  MentorBookingsPage,
  MentorBookingDetailPage,
  MentorMessagesPage,
  MentorEarningsPage,
  MentorProfilePage,
} from './app/mentor/MentorPages';

// Admin Shell & Pages
import { AdminShell } from './app/admin/AdminShell';
import {
  AdminOverviewPage,
  AdminSegmentsPage,
  AdminUsersPage,
  AdminMentorsPage,
  AdminMentorDetailPage,
  AdminVerificationPage,
  AdminBookingsPage,
  AdminReportsPage,
  AdminSettingsPage,
} from './app/admin/AdminPages';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="/auth/sign-up" element={<Navigate to="/signup" replace />} />
             <Route path="/explore" element={<ExplorePage />} />
             <Route path="/explore/:category" element={<CategoryExplorePage />} />
             {/* New Seeker Discovery Experience (domain chooser + problem match + direct domain) */}
             <Route path="/discover" element={<DiscoverPage />} />
             <Route path="/discover/:category" element={<DiscoverPage />} />
             {/* Public advisor profile (legacy — redirects to new mentor public profile) */}
             <Route path="/advisors/:advisorId" element={<AdvisorProfilePage />} />
             {/* Role-aware mentor profile routing */}
             <Route path="/mentor/:mentorId" element={<MentorPublicProfilePage />} />
              <Route path="/mentor/:mentorId/offering/:gigId" element={<GigDetailPage />} />
             <Route path="/gigs/:gigId" element={<GigDetailPage />} />

            {/* Architecture /app/* Prefixes Aliases */}
            <Route path="/app/seeker/*" element={<Navigate to="/seeker" replace />} />
            <Route path="/app/mentor/*" element={<Navigate to="/mentor" replace />} />
            <Route path="/app/admin/*" element={<Navigate to="/admin" replace />} />

            {/* Seeker Authenticated Domain */}
            <Route
              path="/seeker"
              element={
                <ProtectedRoute allowedRoles={['seeker', 'admin']}>
                  <SeekerShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<SeekerWorkspacePage />} />
              <Route path="discover" element={<SeekerDiscoverPage />} />
              <Route path="bookings" element={<SeekerBookingsPage />} />
              <Route path="bookings/:bookingId" element={<SeekerBookingDetailPage />} />
              <Route path="messages" element={<SeekerMessagesPage />} />
              <Route path="profile" element={<SeekerProfilePage />} />
              <Route path="goals" element={<SeekerGoalsPage />} />
              <Route path="action-items" element={<SeekerActionItemsPage />} />
            </Route>

            {/* Mentor Authenticated Domain */}
            <Route
              path="/mentor"
              element={
                <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                  <MentorShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<MentorOverviewPage />} />
              <Route path="gigs" element={<MentorGigsPage />} />
              <Route path="gigs/:gigId" element={<MentorGigEditorPage />} />
              <Route path="availability" element={<MentorAvailabilityPage />} />
              <Route path="bookings" element={<MentorBookingsPage />} />
              <Route path="bookings/:bookingId" element={<MentorBookingDetailPage />} />
              <Route path="messages" element={<MentorMessagesPage />} />
              <Route path="earnings" element={<MentorEarningsPage />} />
              <Route path="profile" element={<MentorProfilePage />} />
            </Route>

            {/* Admin Authenticated Domain */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="segments" element={<AdminSegmentsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
               <Route path="mentors" element={<AdminMentorsPage />} />
              <Route path="mentors/:mentorId" element={<AdminMentorDetailPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
