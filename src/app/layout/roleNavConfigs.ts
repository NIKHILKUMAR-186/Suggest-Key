import {
  LayoutDashboard,
  Compass,
  CalendarDays,
  MessageSquare,
  Sparkles,
  CalendarCheck,
  DollarSign,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Users,
  Award,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Settings,
  Layers,
} from 'lucide-react';
import { ComponentType, ReactNode } from 'react';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number | null;
  end?: boolean;
  tooltip: string;
}

export interface DashboardShellConfig {
  role: 'seeker' | 'mentor' | 'admin';
  navItems: SidebarNavItem[];
  sidebarTitle: string;
  sidebarSubtitle: string;
  mobileBottomNavItems?: SidebarNavItem[];
  brandGradientFrom: string;
  brandGradientTo: string;
  brandDotColor: string;
  headerLabel: string;
  headerLabelColor: string;
  escrowModule?: ReactNode;
}

export const seekerNavConfig: DashboardShellConfig = {
  role: 'seeker',
  navItems: [
    { to: '/seeker', label: 'Workspace', icon: LayoutDashboard, end: true, tooltip: 'Workspace' },
    { to: '/seeker/discover', label: 'Discover', icon: Compass, end: false, tooltip: 'Discover' },
    { to: '/seeker/bookings', label: 'Bookings', icon: CalendarDays, end: false, tooltip: 'Bookings' },
    { to: '/seeker/messages', label: 'Messages', icon: MessageSquare, badge: null, end: false, tooltip: 'Messages' },
  ],
  sidebarTitle: 'Suggest Key',
  sidebarSubtitle: 'Seeker Workspace',
  mobileBottomNavItems: [
    { to: '/seeker', label: 'Workspace', icon: LayoutDashboard, end: true, tooltip: 'Workspace' },
    { to: '/seeker/discover', label: 'Discover', icon: Compass, end: false, tooltip: 'Discover' },
    { to: '/seeker/bookings', label: 'Bookings', icon: CalendarDays, end: false, tooltip: 'Bookings' },
    { to: '/seeker/messages', label: 'Messages', icon: MessageSquare, end: false, tooltip: 'Messages' },
  ],
  brandGradientFrom: '#15846e',
  brandGradientTo: '#8052ff',
  brandDotColor: '#8052ff',
  headerLabel: 'Seeker Workspace',
  headerLabelColor: '#9a9a9a',
};

export const mentorNavConfig: DashboardShellConfig = {
  role: 'mentor',
  navItems: [
    { to: '/mentor', label: 'Dashboard', icon: LayoutDashboard, end: true, tooltip: 'Dashboard' },
    { to: '/mentor/gigs', label: 'My Gigs', icon: Sparkles, end: false, tooltip: 'My Gigs' },
    { to: '/mentor/gigs/new', label: 'Create Gig', icon: Sparkles, end: false, tooltip: 'Create Gig' },
    { to: '/mentor/availability', label: 'Availability', icon: CalendarDays, end: false, tooltip: 'Availability' },
    { to: '/mentor/bookings', label: 'Bookings', icon: CalendarCheck, end: false, tooltip: 'Bookings' },
    { to: '/mentor/messages', label: 'Messages', icon: MessageSquare, end: false, tooltip: 'Messages' },
    { to: '/mentor/earnings', label: 'Earnings', icon: DollarSign, end: false, tooltip: 'Earnings' },
    { to: '/mentor/profile', label: 'Profile', icon: UserCheck, end: false, tooltip: 'Profile' },
  ],
  sidebarTitle: 'Suggest Key',
  sidebarSubtitle: 'Mentor Studio',
  mobileBottomNavItems: [
    { to: '/mentor', label: 'Dashboard', icon: LayoutDashboard, end: true, tooltip: 'Dashboard' },
    { to: '/mentor/gigs', label: 'Gigs', icon: Sparkles, end: false, tooltip: 'Gigs' },
    { to: '/mentor/bookings', label: 'Bookings', icon: CalendarCheck, end: false, tooltip: 'Bookings' },
    { to: '/mentor/messages', label: 'Messages', icon: MessageSquare, end: false, tooltip: 'Messages' },
  ],
  brandGradientFrom: '#15846e',
  brandGradientTo: '#8052ff',
  brandDotColor: '#8052ff',
  headerLabel: 'Mentor Studio',
  headerLabelColor: '#8052ff',
};

export const adminNavConfig: DashboardShellConfig = {
  role: 'admin',
  navItems: [
    { to: '/admin', label: 'Dashboard', icon: ShieldCheck, end: true, tooltip: 'Dashboard' },
    { to: '/admin/users', label: 'Users', icon: Users, end: false, tooltip: 'Users' },
    { to: '/admin/mentors', label: 'Mentors', icon: Award, end: false, tooltip: 'Mentors' },
    { to: '/admin/segments', label: 'Segments', icon: Layers, end: false, tooltip: 'Segments' },
    { to: '/admin/verification', label: 'Verification', icon: FileCheck2, end: false, tooltip: 'Verification' },
    { to: '/admin/bookings', label: 'Bookings', icon: Calendar, end: false, tooltip: 'Bookings' },
    { to: '/admin/reports', label: 'Reports', icon: AlertTriangle, end: false, tooltip: 'Reports' },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false, tooltip: 'Settings' },
  ],
  sidebarTitle: 'Suggest Key',
  sidebarSubtitle: 'Platform Operator',
  mobileBottomNavItems: [
    { to: '/admin', label: 'Dashboard', icon: ShieldCheck, end: true, tooltip: 'Dashboard' },
    { to: '/admin/users', label: 'Users', icon: Users, end: false, tooltip: 'Users' },
    { to: '/admin/segments', label: 'Segments', icon: Layers, end: false, tooltip: 'Segments' },
    { to: '/admin/reports', label: 'Reports', icon: AlertTriangle, end: false, tooltip: 'Reports' },
  ],
  brandGradientFrom: '#ffb829',
  brandGradientTo: '#8052ff',
  brandDotColor: '#ffb829',
  headerLabel: 'Platform Operator',
  headerLabelColor: '#ffb829',
};
