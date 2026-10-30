import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAuthToken, api } from '../services/api';
import AuthModal from './AuthModal';

export default function Navigation() {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasToken, setHasToken] = useState(Boolean(getAuthToken()));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkToken = () => {
      const token = getAuthToken();
      setHasToken(Boolean(token));
      if (token) {
        api.getMe()
          .then((res) => setUser(res?.user || null))
          .catch(() => setUser(null));
      } else {
        setUser(null);
      }
    };

    checkToken();
    window.addEventListener('haunted:auth-change', checkToken);
    return () => window.removeEventListener('haunted:auth-change', checkToken);
  }, []);

  const isDashboardActive = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portals') ||
    location.pathname.startsWith('/requests');

  const isLandingPage = location.pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060505]/92 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <img
              src="/long-logo.png"
              alt="Haunted Inbox AI"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            {isLandingPage && (
              <div className="hidden lg:flex items-center gap-4 text-xs font-bold text-zinc-400">
                <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-orange-400 transition-colors">How It Works</a>

                <a
                  href="https://github.com/CycloneAddons/haunted-inbox-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <span>GitHub</span>
                </a>
              </div>
            )}

            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-bold transition-all ${isDashboardActive
                  ? 'bg-orange-500 text-white shadow-[0_0_14px_rgba(232,89,12,0.6)]'
                  : 'bg-orange-500/15 text-orange-300 border border-orange-500/40 hover:bg-orange-500 hover:text-white'
                }`}
            >
              <span>Workbench</span>
            </Link>



            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#14100f] hover:bg-[#1e1715] text-zinc-200 border transition-all cursor-pointer select-none ${hasToken
                  ? 'border-orange-500/50 shadow-[0_0_8px_rgba(232,89,12,0.3)]'
                  : 'border-white/10 hover:border-white/20'
                }`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <img
                  src="/logo.png"
                  alt="Session"
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-xs max-w-[110px] truncate">
                {user ? user.username : hasToken ? 'Active Session' : 'Sign In'}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
