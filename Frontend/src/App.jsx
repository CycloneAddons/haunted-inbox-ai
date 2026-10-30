import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { getAuthToken, setAuthToken, api } from './services/api';

export default function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authError = params.get('auth_error');

    if (token) {
      setAuthToken(token);
      params.delete('token');
      const cleanSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, document.title, window.location.pathname + cleanSearch);
      return;
    }

    if (authError) {
      params.delete('auth_error');
      const cleanSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, document.title, window.location.pathname + cleanSearch);
      alert(`Discord authentication failed: ${authError}`);
      return;
    }

    if (!getAuthToken()) {
      api.loginGuest().catch((err) => {
        console.warn('Auto guest login failed:', err.message);
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col text-zinc-100">
        <Navigation />
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-3 sm:px-5 py-5 pb-12">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/portals/:id" element={<DashboardPage />} />
            <Route path="/requests/:id" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
