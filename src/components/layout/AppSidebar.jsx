import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Activity, BookOpen, BriefcaseBusiness, History, House, LogOut, MonitorCog, Settings, Sparkles, Stethoscope, Trophy, UserRound, X } from 'lucide-react';
import { appSidebarItems } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';

const icons = {
  'Dashboard': House,
  'Live Monitor': MonitorCog,
  'Posture Analysis': Activity,
  'Yoga & Exercises': Sparkles,
  'Breaks': BookOpen,
  'Break Reminders': BookOpen,
  'History & Trends': History,
  'Weekly Reports': BriefcaseBusiness,
  'Achievements': Trophy,
  'Profile': UserRound,
  'Settings': Settings,
};

export default function AppSidebar({ collapsed = false, mobile = false, onClose = () => {} }) {
  const groups = ['Overview', 'Monitor', 'Wellness', 'Analytics', 'Progress', 'Account'];
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <aside className={`app-sidebar ${mobile ? 'app-sidebar-mobile' : ''}`} style={{ width: mobile ? undefined : collapsed ? 88 : 260 }}>
      <div className="app-sidebar-brand">
        <span className="app-sidebar-brand-icon"><Activity size={18} /></span>
        {!collapsed && <strong>Yoga Yen</strong>}
        {mobile && <button className="app-sidebar-close" type="button" onClick={onClose} aria-label="Close navigation"><X size={19} /></button>}
      </div>
      <div className="app-sidebar-nav">
        {groups.map((group) => {
          const items = appSidebarItems.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="app-sidebar-group">
              {!collapsed && <div className="app-sidebar-group-label">{group}</div>}
              <div style={{ display: 'grid', gap: 6 }}>
                {items.map((item) => {
                  const Icon = icons[item.label] || Stethoscope;
                  return (
                    <NavLink key={item.path} to={item.path} onClick={onClose} title={collapsed ? item.label : undefined} className={({ isActive }) => `sidebar-link ${isActive ? 'active-sidebar-link' : ''}`}>
                      <Icon size={18} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <Link className="app-sidebar-home" to="/" onClick={onClose} title={collapsed ? 'Visit public website' : undefined}>
        <House size={17} />{!collapsed && <span>Visit website</span>}
      </Link>
      <button className="app-sidebar-signout" type="button" onClick={handleSignOut} title={collapsed ? 'Sign out of preview' : undefined}>
        <LogOut size={17} />{!collapsed && <span>Sign out</span>}
      </button>
    </aside>
  );
}
