import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { ShieldCheck, Users, Award, FileCheck2, Calendar, AlertTriangle, Settings, LogOut, Layers } from 'lucide-react';

export const AdminShell: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
    { to: '/admin/segments', label: 'Segments', icon: Layers, end: false },
    { to: '/admin/users', label: 'Users', icon: Users, end: false },
    { to: '/admin/mentors', label: 'Mentors', icon: Award, end: false },
    { to: '/admin/verification', label: 'Verification Queue', icon: FileCheck2, end: false },
    { to: '/admin/bookings', label: 'Bookings', icon: Calendar, end: false },
    { to: '/admin/reports', label: 'Reports', icon: AlertTriangle, end: false },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Admin Nav */}
      <header className="h-16 border-b border-white/5 bg-black/90 sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ffb829] to-[#8052ff] flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#ffb829] rounded-xs rotate-45" />
              </div>
            </div>
            <span className="font-medium text-base tracking-tight">Suggest Key</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#ffb829] px-2.5 py-0.5 border border-[#ffb829]/30 bg-[#ffb829]/10 rounded-full font-medium">
            Platform Operator
          </span>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#ffb829]/20 text-[#ffb829] flex items-center justify-center text-xs font-semibold">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <span className="text-sm text-[#bdbdbd] hidden sm:inline">{profile?.full_name || 'Admin'}</span>
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
                      ? 'bg-[#ffb829] text-black font-semibold shadow-sm shadow-[#ffb829]/30'
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

      {/* Main Admin Content Canvas */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};
