import { useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, api } from '../services/api';

export default function AuthModal({ onClose }) {
  const [token, setToken] = useState(getAuthToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((res) => setUser(res?.user || null))
        .catch(() => setUser(null));
    }
  }, [token]);

  const handleGuest = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.loginGuest();
      setToken(res.token);
      setUser(res.user);
      setMsg({ type: 'success', text: '👻 Spooky guest session summoned!' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Guest session failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setToken('');
    setUser(null);
    setMsg({ type: 'success', text: '⚰️ Session buried. Logged out.' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 z-50" onClick={onClose}>
      <div className="bg-[#16161c] border border-white/15 rounded-xl max-w-[460px] w-full p-5 sm:p-6 shadow-2xl animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 m-0">
            <img src="/logo.png" alt="Haunted Inbox AI" className="w-5 h-5 object-contain" />
            <span>Identity & Authentication</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-xs text-zinc-400 hover:text-zinc-100 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            ✖️
          </button>
        </div>

        {msg && (
          <div
            className={`px-3 py-2 rounded-md text-[12.5px] mb-3.5 border ${
              msg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}
          >
            {msg.text}
          </div>
        )}

        {token && user ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 p-3 rounded-md bg-[#0c0c10] border border-white/10">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-[38px] h-[38px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[38px] h-[38px] rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg">
                  🧙‍♂️
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-100 truncate">{user.username}</div>
                <div className="text-[11.5px] text-zinc-400">
                  {user.isGuest ? '👻 Anonymous Ghost Session' : '🎮 Discord Linked'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold rounded-md bg-[#14141a] hover:bg-[#1c1c24] text-zinc-200 border border-white/15 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <span>⚰️</span>
              <span>Sign Out & Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="m-0 mb-2.5 text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
              Sign in with Discord or summon an instant anonymous guest session.
            </p>

            <button
              type="button"
              onClick={() => { window.location.href = api.getDiscordLoginUrl(); }}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-bold rounded-md bg-[#5865F2] hover:bg-[#4752c4] text-white transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <span>🎮</span>
              <span>Login with Discord</span>
            </button>

            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-bold rounded-md bg-[#14141a] hover:bg-[#1c1c24] text-zinc-200 border border-white/15 hover:border-amber-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>👻</span>
              <span>{loading ? 'Summoning session...' : 'Instant Guest Session'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
