import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 28, padding: '40px 0' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Yoga Yen</div>
          <p>AI-powered posture monitoring for healthier sitting habits.</p>
          <p style={{ marginTop: 20, fontSize: 14 }}>Wellness Indicator, not medical advice.</p>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Quick links</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link to="/features">Features</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Credits</div>
          <p>B.E. Information Technology Project, A.Y. 2026-27, Bharati Vidyapeeth's College of Engineering for Women, Pune.</p>
          <p>Guide: Prof. A. S. Akalwadi.</p>
          <p>Team: Someshwari Choudhari, Snehal Pudale, Vaishnavi Shukla, Anjali Waghmare.</p>
        </div>
      </div>
    </footer>
  );
}
