import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppSidebar from '../../components/layout/AppSidebar';
import AppTopbar from '../../components/layout/AppTopbar';
import { useSettingsStore } from '../../store/settingsStore';
import { isPreviewMode } from '../../data/previewData';
import AuthAlert from '../../components/auth/AuthAlert';
import ToastViewport from '../../components/common/ToastViewport';
import { useTaskStore } from '../../store/taskStore';
import './app-layout.css';

const titles = {
  '/dashboard': 'Dashboard',
  '/live-monitor': 'Live Monitor',
  '/posture-analysis': 'Posture Analysis',
  '/yoga': 'Yoga & Exercises',
  '/break-reminders': 'Breaks',
  '/breaks': 'Breaks',
  '/history': 'History & Trends',
  '/reports': 'Weekly Reports',
  '/achievements': 'Achievements & Goals',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed);
  const [mobileDrawer, setMobileDrawer] = useState({ open: false, path: location.pathname });
  const recheckDeadlines = useTaskStore((state) => state.recheckDeadlines);
  const loadTasks = useTaskStore((state) => state.loadTasks);

  useEffect(() => {
    loadTasks();
    const interval = window.setInterval(recheckDeadlines, 30_000);
    return () => window.clearInterval(interval);
  }, [loadTasks, recheckDeadlines]);

  const title = titles[location.pathname] || 'Dashboard';

  const drawerVisible = mobileDrawer.open && location.pathname === mobileDrawer.path;

  return (
    <div className="page-shell" style={{ background: 'var(--background)' }}>
      <div className="app-shell">
        <div className="app-sidebar-desktop">
          <AppSidebar collapsed={sidebarCollapsed} />
        </div>
        <div className="app-main-column">
          <AppTopbar
            title={title}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            collapsed={sidebarCollapsed}
            onToggleMobileMenu={() => {
              if (drawerVisible) {
                setMobileDrawer((current) => ({ ...current, open: false }));
              } else {
                setMobileDrawer({ open: true, path: location.pathname });
              }
            }}
            mobileOpen={drawerVisible}
          />
          <main className="app-main-content">
            {import.meta.env.DEV && isPreviewMode() && (
              <AuthAlert type="info">
                Preview mode — sample wellness data is for display only and is not saved to a database.
              </AuthAlert>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      <AnimatePresence>
        {drawerVisible && (
          <motion.div className="app-mobile-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileDrawer((current) => ({ ...current, open: false }))}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()}>
              <AppSidebar mobile onClose={() => setMobileDrawer((current) => ({ ...current, open: false }))} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastViewport />
    </div>
  );
}
