import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, ExternalLink, X } from 'lucide-react';
import { MessagingService } from '../../domains/messaging/MessagingService';
import { useAuth } from '../../domains/auth/AuthContext';
import { DashboardShellConfig, SidebarNavItem } from '../../app/layout/roleNavConfigs';

interface DashboardSidebarProps {
  config: DashboardShellConfig;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  renderBottomContent?: () => React.ReactNode;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  config,
  isCollapsed,
  onToggleCollapse,
  className = '',
  isMobileDrawer = false,
  onCloseMobileDrawer,
  renderBottomContent,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(1);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const navItems = config.navItems.map((item) => {
    if (item.label === 'Messages' && config.role === 'seeker') {
      return { ...item, badge: unreadMessagesCount > 0 ? unreadMessagesCount : null };
    }
    return item;
  });

  useEffect(() => {
    if (config.role !== 'seeker') return;
    async function loadUnreadCount() {
      try {
        const userId = user?.id || 'usr-seeker-01';
        const channels = await MessagingService.getChannels(userId, 'seeker');
        const count = channels.reduce((sum, ch) => sum + (ch.unread_count || 0), 0);
        setUnreadMessagesCount(count > 0 ? count : 1);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    }
    loadUnreadCount();
  }, [user?.id, location.pathname, config.role]);

  const collapsed = isMobileDrawer ? false : isCollapsed;

  return (
    <aside
      id={`${config.role}-dashboard-sidebar`}
      aria-label={`${config.sidebarSubtitle} Navigation`}
      className={`relative flex flex-col justify-between h-full bg-[#08080a] border-r border-white/[0.08] transition-[width] duration-200 ease-in-out select-none ${
        collapsed ? 'w-[76px]' : 'w-[252px]'
      } ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#8052ff]/[0.04] to-transparent pointer-events-none" />

      <div className="relative z-10 p-3.5 border-b border-white/[0.06] flex items-center justify-between min-h-[64px]">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <button
              id="sidebar-toggle-btn-collapsed-header"
              onClick={onToggleCollapse}
              onMouseEnter={() => setHoveredTooltip('expand-header')}
              onMouseLeave={() => setHoveredTooltip(null)}
              className="w-11 h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-[#8e8e93] hover:text-white border border-white/[0.06] hover:border-white/15 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff] group"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#8e8e93] group-hover:text-white transition-colors" />
              {hoveredTooltip === 'expand-header' && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-md bg-[#131317] border border-white/15 text-[11px] font-medium text-white shadow-xl whitespace-nowrap animate-in fade-in duration-100"
                >
                  Expand Sidebar
                </div>
              )}
            </button>
          </div>
        ) : (
          <>
            <Link
              to={config.role === 'seeker' ? '/seeker' : config.role === 'mentor' ? '/mentor' : '/admin'}
              onClick={onCloseMobileDrawer ? onCloseMobileDrawer : undefined}
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff] rounded-lg p-0.5"
            >
              <div
                className="w-8 h-8 rounded-xl p-[1.5px] shrink-0 shadow-[0_0_12px_rgba(128,82,255,0.2)]"
                style={{
                  background: `linear-gradient(to top right, ${config.brandGradientFrom}, ${config.brandGradientTo})`,
                }}
              >
                <div className="w-full h-full bg-[#08080a] rounded-[10px] flex items-center justify-center">
                  <div
                    className="w-2 h-2 rounded-xs rotate-45 group-hover:scale-110 transition-transform duration-150"
                    style={{ backgroundColor: config.brandDotColor }}
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
                  {config.sidebarTitle}
                </span>
                <span
                  className="text-[9px] uppercase tracking-[0.18em] font-bold leading-none pt-0.5 truncate"
                  style={{ color: config.brandDotColor }}
                >
                  {config.sidebarSubtitle}
                </span>
              </div>
            </Link>

            {!isMobileDrawer && (
              <button
                id="sidebar-toggle-btn-header"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff]"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {isMobileDrawer && onCloseMobileDrawer && (
              <button
                onClick={onCloseMobileDrawer}
                className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.08] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="relative z-10 flex-1 px-2.5 py-4 space-y-3 overflow-y-auto scrollbar-none">
        {!collapsed && (
          <div className="px-3 pt-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#52525b] font-bold block">
              Manage
            </span>
          </div>
        )}
        {collapsed && <div className="h-px bg-white/[0.06] mx-2 my-1" />}

        <nav className="space-y-1.5" aria-label="Secondary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => collapsed && setHoveredTooltip(item.to)}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobileDrawer ? onCloseMobileDrawer : undefined}
                  className={({ isActive }) =>
                    `relative flex items-center transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff] ${
                      collapsed
                        ? 'justify-center w-11 h-11 mx-auto'
                        : 'h-11 px-3.5 gap-3'
                    } ${
                      isActive
                        ? 'bg-[#8052ff]/10 text-white border border-[#8052ff]/20 shadow-[0_0_14px_rgba(128,82,255,0.06)]'
                        : 'text-[#8e8e93] hover:text-[#f4f4f5] hover:bg-white/[0.04] border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-[2.5px] rounded-r-full bg-[#8052ff] shadow-[0_0_6px_rgba(128,82,255,0.8)]" />
                      )}
                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon
                          className={`w-4 h-4 transition-colors duration-150 ${
                            isActive ? 'text-[#9d7aff]' : 'text-[#8e8e93]'
                          }`}
                        />
                        {collapsed && item.badge !== null && item.badge !== undefined && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#8052ff] text-white text-[9px] font-bold flex items-center justify-center border border-[#08080a] shadow-md">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span
                            className={`text-xs uppercase tracking-wider truncate font-medium ${
                              isActive ? 'text-white' : 'text-[#a1a1aa]'
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8052ff]/20 text-[#a37aff] border border-[#8052ff]/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>

                {collapsed && hoveredTooltip === item.to && (
                  <div
                    role="tooltip"
                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-[#131317] border border-white/15 text-xs font-medium text-white shadow-2xl whitespace-nowrap animate-in fade-in duration-100 flex items-center gap-2"
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8052ff] text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {renderBottomContent && (
        <div className="relative z-10 p-2.5 pb-4">
          {renderBottomContent()}
        </div>
      )}
    </aside>
  );
};
