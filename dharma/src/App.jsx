import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Timer, WifiOff, LogIn } from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import { getCurrentStreak } from './utils/streakUtils';
import { DEFAULT_PILLARS } from './data/defaultPillars';
import BottomNav, { SideNav } from './components/BottomNav';
import MilestoneScreen from './components/MilestoneScreen';
import FocusTimer from './components/FocusTimer';
import AuthModal from './components/AuthModal';
import Profile from './pages/Profile';
import { NavDirectionProvider, useNavDirection } from './hooks/useNavDirection';
import { AuthProvider, useAuth } from './context/AuthContext';

import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Sadhana from './pages/Sadhana';
import Manan from './pages/Manan';
import Drishti from './pages/Drishti';
import Gyaan from './pages/Gyaan';
import Settings from './pages/Settings';
import HabitTracker from './pages/HabitTracker';

const NAV_ROUTES = ['/home', '/sadhana', '/manan', '/drishti', '/gyaan'];

/* ── Offline banner ─────────────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white"
      style={{ background: 'rgba(30,30,50,0.95)', backdropFilter: 'blur(8px)' }}>
      <WifiOff size={12} /> You're offline — your data is saved locally
    </div>
  );
}

/* ── Avatar button (profile) ─────────────────────────────────────── */
function ProfileButton({ onClick }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <button onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: 'rgba(232,132,60,0.12)', color: '#E8843C' }}>
        <LogIn size={13} /> Sign in
      </button>
    );
  }
  if (user.avatarPhoto) {
    return (
      <button onClick={onClick} title={user.name}
        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 transition-all hover:scale-105 border-2"
        style={{ borderColor: user.avatarColor || '#E8843C' }}>
        <img src={user.avatarPhoto} alt={user.name} className="w-full h-full object-cover" />
      </button>
    );
  }
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 transition-all hover:scale-105"
      style={{ background: user.avatarColor || '#E8843C' }}
      title={user.name}>
      {initials}
    </button>
  );
}

/* ── Swipe handler ───────────────────────────────────────────────── */
function useSwipeNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const startX = useRef(null);
  const startY = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const idx = NAV_ROUTES.indexOf(location.pathname);
    if (idx === -1) return;
    if (dx < 0 && idx < NAV_ROUTES.length - 1) navigate(NAV_ROUTES[idx + 1]);
    else if (dx > 0 && idx > 0) navigate(NAV_ROUTES[idx - 1]);
  };

  return { handleTouchStart, handleTouchEnd };
}

/* ── App shell ───────────────────────────────────────────────────── */
function AppShell({ children, onOpenFocus, onOpenProfile }) {
  const { direction }  = useNavDirection();
  const location       = useLocation();
  const { handleTouchStart, handleTouchEnd } = useSwipeNav();

  return (
    <div className="flex min-h-screen w-full">
      <SideNav onOpenFocus={onOpenFocus} onOpenProfile={onOpenProfile} />
      <div className="flex-1 min-w-0 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        <div key={location.pathname}
          className={direction === 'forward' ? 'page-forward' : 'page-backward'}>
          {children}
        </div>
        <BottomNav />
        <button onClick={onOpenFocus} title="Focus Timer"
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg lg:hidden transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#E8843C,#C9A961)', boxShadow: '0 4px 20px rgba(232,132,60,0.4)' }}>
          <Timer size={20} color="white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ── Main App (needs router context) ────────────────────────────── */
function AppInner() {
  const { state, updateSettings, logFocusSession } = useStorage();
  const { settings } = state;
  const pillars = state.pillars || DEFAULT_PILLARS;

  const [milestone,    setMilestone]    = useState(null);
  const [showFocus,    setShowFocus]    = useState(false);
  const [showAuth,     setShowAuth]     = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const stored = localStorage.getItem('dharma_app_v1');
      if (!stored || !JSON.parse(stored)?.settings?.theme) {
        updateSettings({ theme: e.matches ? 'dark' : 'light' });
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [updateSettings]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const streak = getCurrentStreak(state.logs, pillars);
    if ([30, 90, 180, 365].includes(streak)) {
      const key = `milestone_seen_${streak}`;
      if (!sessionStorage.getItem(key)) { setMilestone(streak); sessionStorage.setItem(key, '1'); }
    }
  }, [state.logs]);

  const { user } = useAuth();
  const openProfile = () => user ? setShowProfile(true) : setShowAuth(true);
  const openFocus   = () => setShowFocus(true);

  return (
    <NavDirectionProvider>
      <OfflineBanner />
      {milestone    && <MilestoneScreen days={milestone} onClose={() => setMilestone(null)} />}
      {showFocus    && <FocusTimer onClose={() => setShowFocus(false)} onComplete={(s) => { logFocusSession(s); setShowFocus(false); }} />}
      {showAuth     && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile  && user && <Profile onClose={() => setShowProfile(false)} />}

      <Routes>
        <Route path="/onboarding" element={<Onboarding onComplete={() => updateSettings({ onboardingComplete: true })} />} />
        <Route path="/" element={settings.onboardingComplete ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
        <Route path="/home"     element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Home onOpenFocus={openFocus} onOpenProfile={openProfile} /></AppShell>} />
        <Route path="/sadhana"  element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Sadhana /></AppShell>} />
        <Route path="/manan"    element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Manan /></AppShell>} />
        <Route path="/drishti"  element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Drishti /></AppShell>} />
        <Route path="/gyaan"    element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Gyaan /></AppShell>} />
        <Route path="/settings" element={<AppShell onOpenFocus={openFocus} onOpenProfile={openProfile}><Settings /></AppShell>} />
        <Route path="/tracker"  element={<HabitTracker />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </NavDirectionProvider>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <BrowserRouter>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
