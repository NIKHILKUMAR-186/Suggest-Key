import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { DashboardSidebar } from '../../components/navigation/DashboardSidebar';
import { DashboardShellConfig } from './roleNavConfigs';

interface DashboardShellProps {
  config: DashboardShellConfig;
  renderSidebarBottomContent?: (props: { collapsed: boolean }) => React.ReactNode;
  preContent?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  config,
  renderSidebarBottomContent,
  preContent,
  children,
}) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('suggest-key-sidebar-collapsed');
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

  const homePath = config.role === 'seeker' ? '/seeker' : config.role === 'mentor' ? '/mentor' : '/admin';

  return (
    <div className="h-screen flex flex-col bg-[#050507] text-white overflow-hidden">
      <header className="h-16 border-b border-white/10 bg-[#08080a]/95 shrink-0 px-4 sm:px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center p-[2px]"
              style={{
                background: `linear-gradient(to top right, ${config.brandGradientFrom}, ${config.brandGradientTo})`,
              }}
            >
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <div
                  className="w-2 h-2 rounded-xs rotate-45 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: config.brandDotColor }}
                />
              </div>
            </div>
            <span className="font-medium text-base tracking-tight text-white">Suggest Key</span>
          </Link>
          <span
            className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 border rounded-full bg-white/[0.02] hidden sm:inline-block"
            style={{
              color: config.headerLabelColor,
              borderColor: `${config.headerLabelColor}30`,
              backgroundColor: `${config.headerLabelColor}10`,
            }}
          >
            {config.headerLabel}
          </span>
        </div>

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
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border"
                style={{
                  color: config.brandDotColor,
                  backgroundColor: `${config.brandDotColor}20`,
                  borderColor: `${config.brandDotColor}30`,
                }}
              >
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <span className="text-xs font-medium text-[#e0e0e0] hidden sm:inline">
              {profile?.full_name || 'User'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#9a9a9a] transition-transform duration-200 ${
                userMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 bg-[#0e0e11] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="p-3 border-b border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">
                    {profile?.full_name || 'User'}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border"
                    style={{
                      color: config.brandDotColor,
                      backgroundColor: `${config.brandDotColor}10`,
                      borderColor: `${config.brandDotColor}20`,
                    }}
                  >
                    {config.sidebarSubtitle}
                  </span>
                </div>
                <p className="text-[11px] text-[#707070] truncate">{profile?.email || ''}</p>
              </div>
              <div className="py-1.5 space-y-0.5">
                <Link
                  to={homePath === '/seeker' ? '/seeker/profile' : homePath === '/mentor' ? '/mentor/profile' : '/admin/settings'}
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#bdbdbd] hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                >
                  <User className="w-4 h-4" style={{ color: config.brandDotColor }} />
                  <span>My Profile</span>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block shrink-0">
          <DashboardSidebar
            config={config}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            renderBottomContent={
              renderSidebarBottomContent
                ? () => renderSidebarBottomContent({ collapsed: isSidebarCollapsed })
                : undefined
            }
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {preContent}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <DashboardSidebar
              config={config}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              renderBottomContent={
                renderSidebarBottomContent
                  ? () => renderSidebarBottomContent({ collapsed: false })
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {config.mobileBottomNavItems && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090c]/95 border-t border-white/10 px-4 py-2 flex items-center justify-around backdrop-blur-xl">
          {config.mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-colors ${
                    isActive ? 'text-white' : 'text-[#8e8e93] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8e8e93]'}`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};
