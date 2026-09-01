import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import {
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  EyeOff,
  Menu,
  X,
  LayoutDashboard,
  Compass,
  CalendarDays,
  MessageSquare,
} from 'lucide-react';
import { PrimarySegmentSwitcher } from '../../components/navigation/PrimarySegmentSwitcher';
import { SeekerSidebar } from '../../components/navigation/SeekerSidebar';

export const SeekerShell: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Collapsed state persisted in localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('suggest-key-sidebar-collapsed') || localStorage.getItem('suggestkey_seeker_sidebar_collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('suggest-key-sidebar-collapsed', String(next));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  // Close user dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col selection:bg-[#8052ff]/30 selection:text-white">
      {/* 1. TOP APPLICATION HEADER */}
      <header className="h-16 border-b border-white/10 bg-[#08080a]/95 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md">
        {/* Left: Mobile Drawer Trigger & Brand Lockup */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#8052ff] rounded-xs rotate-45 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="font-medium text-base tracking-tight text-white">Suggest Key</span>
          </Link>

          <span className="text-[10px] uppercase tracking-widest text-[#9a9a9a] px-2.5 py-0.5 border border-white/10 rounded-full bg-white/[0.02] hidden sm:inline-block">
            Seeker Workspace
          </span>
        </div>

        {/* Right: User Identity Popover Trigger */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff]"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#8052ff]/20 text-[#8052ff] border border-[#8052ff]/30 flex items-center justify-center text-xs font-semibold">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <span className="text-xs font-medium text-[#e0e0e0] hidden sm:inline">
              {profile?.full_name || 'Alex Rivera'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#9a9a9a] transition-transform duration-200 ${
                userMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* User Popover Dropdown Menu */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 bg-[#0e0e11] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              {/* User Identity Header */}
              <div className="p-3 border-b border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">
                    {profile?.full_name || 'Alex Rivera'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#15846e] px-2 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/20 font-medium">
                    Seeker
                  </span>
                </div>
                <p className="text-[11px] text-[#707070] truncate">{profile?.email || 'alex.rivera@example.com'}</p>
                {profile?.is_anonymous_enabled && (
                  <div className="flex items-center gap-1 text-[10px] text-[#ffb829] pt-1">
                    <EyeOff className="w-3 h-3" />
                    <span>Privacy Shield Active</span>
                  </div>
                )}
              </div>

              {/* Menu Actions */}
              <div className="py-1.5 space-y-0.5">
                <Link
                  to="/seeker/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#bdbdbd] hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                >
                  <User className="w-4 h-4 text-[#8052ff]" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/seeker/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#bdbdbd] hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                >
                  <ShieldCheck className="w-4 h-4 text-[#15846e]" />
                  <span>Privacy & Shield Settings</span>
                </Link>
              </div>

              <div className="pt-1.5 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#ff5c5c] hover:bg-[#ff5c5c]/10 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN APPLICATION BODY (SIDEBAR + CONTENT CANVAS) */}
      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Persistent Sidebar — fixed pins it to the viewport so it never scrolls away */}
        <div className="hidden md:block shrink-0 fixed top-16 h-[calc(100vh-4rem)] z-30">
          <SeekerSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>

        {/* Content Region — offset by the pinned sidebar width (collapsed/expanded) so the fixed sidebar never overlaps content */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#050507] transition-[margin-left] duration-200 ease-in-out ${
            isSidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[252px]'
          }`}
        >
          {/* Primary Segment Switcher (Stays prominently ABOVE page content, outside the sidebar) */}
          <div className="sticky top-16 z-20 bg-[#050507]/90 backdrop-blur-md">
            <PrimarySegmentSwitcher />
          </div>

          {/* Main Outlet Workspace */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 transition-all duration-300">
            <Outlet />
          </main>
        </div>
      </div>

      {/* 3. MOBILE SLIDE-IN DRAWER */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <SeekerSidebar
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 4. MOBILE QUICK BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090c]/95 border-t border-white/10 px-4 py-2 flex items-center justify-around backdrop-blur-xl">
        {[
          { to: '/seeker', label: 'Workspace', icon: LayoutDashboard, end: true },
          { to: '/seeker/discover', label: 'Discover', icon: Compass, end: false },
          { to: '/seeker/bookings', label: 'Bookings', icon: CalendarDays, end: false },
          { to: '/seeker/messages', label: 'Messages', icon: MessageSquare, end: false },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium uppercase tracking-wider text-[#8e8e93] hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
