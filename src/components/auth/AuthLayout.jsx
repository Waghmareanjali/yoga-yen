import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Leaf, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { images } from '../../data/images';
import './auth.css';

export default function AuthLayout({ children, mode = 'login' }) {
  const reducedMotion = useReducedMotion();
  const isRegister = mode === 'register';

  return (
    <main className="auth-page">
      <motion.aside
        className="auth-visual"
        initial={reducedMotion ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: 'easeOut' }}
      >
        <Link to="/" className="auth-brand" aria-label="Yoga Yen home">
          <span className="auth-brand-mark"><Leaf size={19} strokeWidth={2.2} /></span>
          <span>Yoga Yen</span>
        </Link>
        <div className="auth-visual-copy">
          <span className="auth-kicker"><span /> Posture • Movement • Well-being</span>
          <h2>Sit Better.<br />Move Better.<br /><span>Live Better.</span></h2>
          <p>AI-powered posture monitoring and personalized wellness guidance for healthier everyday sitting.</p>
        </div>
        <div className="auth-illustration-wrap">
          <img src={images.authWellness.src} alt={images.authWellness.alt} />
          <div className="auth-float-card">
            <span className="auth-float-icon"><ShieldCheck size={17} /></span>
            <span><strong>Privacy-first by design</strong><small>Wellness insights, not diagnosis</small></span>
          </div>
        </div>
        <p className="auth-visual-foot">Small posture check-ins. Healthier workday habits.</p>
      </motion.aside>

      <section className={`auth-form-panel ${isRegister ? 'auth-form-panel-register' : ''}`}>
        <div className="auth-mobile-brand">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark"><Leaf size={19} strokeWidth={2.2} /></span>
            <span>Yoga Yen</span>
          </Link>
          <span className="auth-mobile-tagline">Sit Better. Move Better. Live Better.</span>
        </div>
        <Link to="/" className="auth-back-link"><ArrowLeft size={15} /> Back to home</Link>
        <motion.div
          className={`auth-card ${isRegister ? 'auth-card-register' : ''}`}
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
        <p className="auth-panel-footer">A gentle reminder: this is a wellness indicator, not medical advice.</p>
      </section>
    </main>
  );
}
