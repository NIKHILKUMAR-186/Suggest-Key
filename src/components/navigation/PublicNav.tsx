import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { Menu, X } from 'lucide-react';

export const PublicNav: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'mentor') return '/mentor';
    return '/seeker';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#8052ff] rounded-xs rotate-45 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <span className="font-medium text-lg tracking-tight text-white">Suggest Key</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/explore"
            className={`text-nav-label transition-colors duration-200 ${
              location.pathname.startsWith('/explore') ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/explore"
            className={`text-nav-label transition-colors duration-200 ${
              location.pathname.startsWith('/explore') ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Advisors
          </Link>
          <a
            href="/#how-it-works"
            className="text-nav-label text-[#9a9a9a] hover:text-white transition-colors duration-200"
          >
            How it works
          </a>
        </nav>

        {/* Right Auth / Action CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={getDashboardLink()}
                className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-nav-label transition-all duration-200 shadow-sm shadow-[#8052ff]/20"
              >
                Go to Workspace
              </Link>
              <button
                onClick={signOut}
                className="text-nav-label text-[#9a9a9a] hover:text-white px-3 py-2 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-nav-label text-[#9a9a9a] hover:text-white px-3 py-2 transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-nav-label transition-all duration-200 shadow-sm shadow-[#8052ff]/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#9a9a9a] hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold uppercase tracking-wider text-[#9a9a9a] hover:text-white py-2"
            >
              Explore
            </Link>
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold uppercase tracking-wider text-[#9a9a9a] hover:text-white py-2"
            >
              Advisors
            </Link>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold uppercase tracking-wider text-[#9a9a9a] hover:text-white py-2"
            >
              How it works
            </a>
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#8052ff] text-white text-center rounded-full text-xs font-semibold uppercase tracking-wider"
                >
                  Workspace
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#9a9a9a]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white border border-white/10 rounded-full"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#8052ff] text-white text-center rounded-full text-xs font-semibold uppercase tracking-wider"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
