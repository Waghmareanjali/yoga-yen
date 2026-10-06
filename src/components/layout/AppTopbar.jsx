import { Bell, LogOut, Menu, Moon, SunMedium, Wifi, WifiOff, PanelLeftOpen, PanelLeftClose, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../context/AuthContext';

export default function AppTopbar({ title, onToggleSidebar, collapsed, onToggleMobileMenu, mobileOpen }) {
  const navigate = useNavigate();
  const theme = useSettingsStore((state) => state.theme);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const { logout } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-topbar">
      <div className="app-topbar-title">
        <button className="btn ghost app-desktop-sidebar-toggle" onClick={onToggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button className="btn ghost app-mobile-menu-trigger" onClick={onToggleMobileMenu} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <div>
          <div className="app-topbar-eyebrow">Yoga Yen</div>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="app-topbar-actions">
        <div className="status-pill app-online-pill">
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? 'Online' : 'Offline'}
        </div>
        <button className="btn primary app-monitor-cta" onClick={() => navigate('/live-monitor')}>
          <Play size={16} /> Start Monitoring
        </button>
        <button className="btn ghost app-icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
        </button>
        <div className="app-notification-wrap">
          <button className="btn ghost app-icon-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications" aria-expanded={notificationsOpen}>
            <Bell size={18} />
          </button>
          {notificationsOpen && <div className="app-notification-popover"><strong>You&apos;re all caught up</strong><span>New reminders will appear here.</span></div>}
        </div>
        <button className="btn ghost app-icon-button app-logout-button" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
