import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './public-navbar.css';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/features', label: 'Features' },
  { path: '/image-analysis', label: 'Image Analysis' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="public-navbar" style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(18px)', background: 'rgba(250,248,243,0.8)', borderBottom: '1px solid var(--border)' }}>
      <div className="container public-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 76 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 22 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(31,77,58,0.10)', color: 'var(--primary)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3c2.6 2.4 4 5.1 4 8.1A4.9 4.9 0 0 1 11.1 16 4.9 4.9 0 0 1 6 11.1C6 8.1 7.4 5.4 10 3c.6-.6 1.4-1 2-1ZM9 15.1c1.1.9 2 1.3 3 1.3Z" /></svg>
          </span>
          Yoga Yen
        </Link>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''} style={{ position: 'relative', color: 'var(--text-primary)', opacity: 0.9, fontWeight: 600 }}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="public-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <button className="btn primary public-desktop-auth" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          ) : (
            <>
              <button className="btn ghost public-desktop-auth" onClick={() => navigate('/login')}>Login</button>
              <button className="btn primary public-desktop-auth" onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}
          <button className="btn ghost public-menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 30 }}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', width: 280, height: '100%', background: 'var(--surface)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 800 }}>Menu</div>
                <button className="btn ghost" onClick={() => setOpen(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {navItems.map((item) => (
                  <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--surface-alt)', fontWeight: 600 }}>{item.label}</NavLink>
                ))}
                {!isAuthenticated ? (
                  <div className="public-mobile-auth">
                    <button className="btn ghost" onClick={() => { setOpen(false); navigate('/login'); }}>Login</button>
                    <button className="btn primary" onClick={() => { setOpen(false); navigate('/register'); }}>Get Started</button>
                  </div>
                ) : (
                  <button className="btn primary" onClick={() => { setOpen(false); navigate('/dashboard'); }}>Go to Dashboard</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
