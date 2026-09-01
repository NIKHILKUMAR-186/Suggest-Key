import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { LayoutDashboard, Sparkles, CalendarDays, CalendarCheck, MessageSquare, DollarSign, UserCheck, LogOut } from 'lucide-react';

export const MentorShell: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/mentor', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/mentor/gigs', label: 'Sessions & Gigs', icon: Sparkles, end: false },
    { to: '/mentor/availability', label: 'Availability', icon: CalendarDays, end: false },
    { to: '/mentor/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
    { to: '/mentor/messages', label: 'Messages', icon: MessageSquare, end: false },
    { to: '/mentor/earnings', label: 'Earnings', icon: DollarSign, end: false },
    { to: '/mentor/profile', label: 'Mentor Profile', icon: UserCheck, end: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Mentor Studio Nav */}
      <header className="h-16 border-b border-white/5 bg-black/90 sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#8052ff] rounded-xs rotate-45" />
              </div>
            </div>
            <span className="font-medium text-base tracking-tight">Suggest Key</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#8052ff] px-2.5 py-0.5 border border-[#8052ff]/30 bg-[#8052ff]/10 rounded-full font-medium">
              Mentor Studio
            </span>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-7 h-7 rounded-full object-cover border border-[#8052ff]/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#8052ff]/20 text-[#8052ff] flex items-center justify-center text-xs font-semibold">
                {profile?.full_name?.charAt(0) || 'M'}
              </div>
            )}
            <span className="text-sm text-[#bdbdbd] hidden sm:inline">{profile?.full_name || 'Mentor'}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="border-b border-white/5 bg-black/40 px-6">
        <div className="max-w-[1280px] mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-[#8052ff] text-white shadow-sm shadow-[#8052ff]/30'
                      : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};
