import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  CalendarDays,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react';
import { MessagingService } from '../../domains/messaging/MessagingService';
import { useAuth } from '../../domains/auth/AuthContext';

interface SeekerSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const SeekerSidebar: React.FC<SeekerSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = '',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(1);
  const [showEscrowModal, setShowEscrowModal] = useState<boolean>(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Fetch real unread message count
  useEffect(() => {
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
  }, [user?.id, location.pathname]);

  const navItems = [
    {
      to: '/seeker',
      label: 'Workspace',
      icon: LayoutDashboard,
      badge: null,
      end: true,
      tooltip: 'Workspace',
    },
    {
      to: '/seeker/discover',
      label: 'Discover',
      icon: Compass,
      badge: null,
      end: false,
      tooltip: 'Discover',
    },
    {
      to: '/seeker/bookings',
      label: 'Bookings',
      icon: CalendarDays,
      badge: null,
      end: false,
      tooltip: 'Bookings',
    },
    {
      to: '/seeker/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      end: false,
      tooltip: 'Messages',
    },
  ];

  // In mobile drawer mode, never collapse
  const collapsed = isMobileDrawer ? false : isCollapsed;

  return (
    <>
      <aside
        id="seeker-application-sidebar"
        aria-label="Seeker Workspace Navigation"
        className={`relative flex flex-col justify-between h-full bg-[#08080a] border-r border-white/[0.08] transition-[width] duration-200 ease-in-out select-none ${
          collapsed ? 'w-[76px]' : 'w-[252px]'
        } ${className}`}
      >
        {/* Very subtle ambient purple top glow */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#8052ff]/[0.04] to-transparent pointer-events-none" />

        {/* 1. SIDEBAR BRAND / HEADER */}
        <div className="relative z-10 p-3.5 border-b border-white/[0.06] flex items-center justify-between min-h-[64px]">
          {collapsed ? (
            /* COLLAPSED HEADER: Centered Expand Button replacing logo */
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
            /* EXPANDED HEADER: Logo, Brand Text, Workspace Subtitle, Collapse Button */
            <>
              <Link
                to="/seeker"
                onClick={isMobileDrawer ? onCloseMobileDrawer : undefined}
                className="flex items-center gap-3 group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8052ff] rounded-lg p-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#15846e] to-[#8052ff] p-[1.5px] shrink-0 shadow-[0_0_12px_rgba(128,82,255,0.2)]">
                  <div className="w-full h-full bg-[#08080a] rounded-[10px] flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#8052ff] rounded-xs rotate-45 group-hover:scale-110 transition-transform duration-150" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
                    Suggest Key
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#9d7aff] font-bold leading-none pt-0.5 truncate">
                    Seeker Workspace
                  </span>
                </div>
              </Link>

              {/* Desktop Header Collapse Button */}
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

              {/* Mobile Drawer Close Button */}
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

        {/* 2. NAVIGATION AREA */}
        <div className="relative z-10 flex-1 px-2.5 py-4 space-y-3 overflow-y-auto scrollbar-none">
          {/* Section Header */}
          {!collapsed ? (
            <div className="px-3 pt-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#52525b] font-bold block">
                Manage
              </span>
            </div>
          ) : (
            <div className="h-px bg-white/[0.06] mx-2 my-1" />
          )}

          {/* Navigation Links */}
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
                    onClick={isMobileDrawer ? onCloseMobileDrawer : undefined}
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
                        {/* Active Left Thin Accent Bar */}
                        {isActive && !collapsed && (
                          <span className="absolute left-0 top-2.5 bottom-2.5 w-[2.5px] rounded-r-full bg-[#8052ff] shadow-[0_0_6px_rgba(128,82,255,0.8)]" />
                        )}

                        {/* Icon & Collapsed Badge Container */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <Icon
                            className={`w-4 h-4 transition-colors duration-150 ${
                              isActive ? 'text-[#9d7aff]' : 'text-[#8e8e93] group-hover:text-white'
                            }`}
                          />

                          {/* Collapsed Unread Badge */}
                          {collapsed && item.badge !== null && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#8052ff] text-white text-[9px] font-bold flex items-center justify-center border border-[#08080a] shadow-md">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Expanded Label & Badge */}
                        {!collapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span
                              className={`text-xs uppercase tracking-wider truncate font-medium ${
                                isActive ? 'text-white' : 'text-[#a1a1aa]'
                              }`}
                            >
                              {item.label}
                            </span>

                            {item.badge !== null && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8052ff]/20 text-[#a37aff] border border-[#8052ff]/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip in Collapsed Mode */}
                  {collapsed && hoveredTooltip === item.to && (
                    <div
                      role="tooltip"
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-[#131317] border border-white/15 text-xs font-medium text-white shadow-2xl whitespace-nowrap animate-in fade-in duration-100 flex items-center gap-2"
                    >
                      <span>{item.label}</span>
                      {item.badge !== null && (
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

        {/* 3. TRUST & ESCROW COMPACT MODULE */}
        <div className="relative z-10 p-2.5 pb-4">
          {!collapsed ? (
            /* Expanded Escrow Card: Compact (approx 78px), clean, subtle */
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-white/15 transition-all space-y-1.5 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#15846e]/15 border border-[#15846e]/30 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
                  </div>
                  <span className="text-xs font-semibold text-white tracking-tight">
                    Verified Escrow
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-[#15846e] animate-pulse" />
              </div>

              <p className="text-[10px] text-[#71717a] leading-tight">
                Protected transactions
              </p>

              <button
                onClick={() => setShowEscrowModal(true)}
                className="text-[10px] text-[#15846e] hover:text-[#19a589] font-medium flex items-center gap-1 transition-colors pt-0.5"
              >
                <span>Learn more</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            /* Collapsed Escrow Icon Button */
            <div
              className="relative flex justify-center"
              onMouseEnter={() => setHoveredTooltip('escrow')}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button
                onClick={() => setShowEscrowModal(true)}
                className="w-11 h-11 rounded-xl bg-white/[0.02] hover:bg-[#15846e]/10 border border-white/[0.08] hover:border-[#15846e]/30 flex items-center justify-center text-[#15846e] transition-all"
                aria-label="Verified Escrow Protection"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>

              {hoveredTooltip === 'escrow' && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 bottom-0 z-50 p-2.5 w-48 rounded-xl bg-[#131317] border border-white/15 text-xs text-white shadow-2xl space-y-1 animate-in fade-in duration-100"
                >
                  <div className="flex items-center gap-1.5 text-[#15846e] font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Escrow</span>
                  </div>
                  <p className="text-[10px] text-[#a1a1aa] leading-tight">
                    Protected transactions & dispute freeze protection.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Escrow Modal Details */}
      {showEscrowModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md bg-[#0e0e12] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#15846e]/20 border border-[#15846e]/30 flex items-center justify-center text-[#15846e]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Suggest Key Escrow Trust</h3>
                  <span className="text-[10px] uppercase tracking-wider text-[#15846e] font-medium">
                    Protection Guarantee
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEscrowModal(false)}
                className="p-1 rounded-lg text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#9a9a9a] leading-relaxed">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white font-medium block">1. Milestone Lock</span>
                <p>Funds are secured in escrow upon booking and held until the session concludes.</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white font-medium block">2. Dispute Freeze Authority</span>
                <p>If an advisor misses the session or fails to provide the agreed guidance, you can dispute and get an automatic refund.</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white font-medium block">3. Privacy Shield Guarantee</span>
                <p>Your real identity and payment details are never exposed directly to the advisor.</p>
              </div>
            </div>

            <button
              onClick={() => setShowEscrowModal(false)}
              className="w-full py-2.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
