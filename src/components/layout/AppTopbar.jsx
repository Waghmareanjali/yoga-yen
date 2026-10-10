import { Bell, Menu, Moon, SunMedium, PanelLeftOpen, PanelLeftClose, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function AppTopbar({ title, onToggleSidebar, collapsed, onToggleMobileMenu, mobileOpen }) {
  const navigate = useNavigate();
  const theme = useSettingsStore((state) => state.theme);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

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
          {notificationsOpen && (
            <div className="app-notification-popover" role="region" aria-label="Notifications">
              <strong>{notifications.length ? 'Recent notifications' : 'You’re all caught up'}</strong>
              {notifications.length ? notifications.slice(-5).reverse().map((notification) => (
                <div className="app-notification-item" key={notification.id}>
                  <span><b>{notification.title}</b><small>{notification.description}</small></span>
                  <button type="button" className="btn ghost" aria-label={`Dismiss ${notification.title}`} onClick={() => removeNotification(notification.id)}>×</button>
                </div>
              )) : <span>Task due-soon and missed reminders will appear here.</span>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
