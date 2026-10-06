import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Camera, Activity, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SectionHeader from '../../components/common/SectionHeader';
import Badge from '../../components/common/Badge';

const steps = [
  { title: 'Open Camera', description: 'Launch secure webcam analysis with a single tap.' },
  { title: 'Detect Posture', description: 'MediaPipe traces movement and joint alignment.' },
  { title: 'Analyze Risk', description: 'A posture score and ergonomic risk score update live.' },
  { title: 'Improve Habits', description: 'Follow suggestions, stretch, and build healthier habits.' },
];

const features = [
  { icon: Camera, title: 'Real-Time Monitoring', text: 'See posture and time spent sitting in real time.' },
  { icon: Activity, title: 'AI Posture Analysis', text: 'From body landmarks to risk scoring and posture class detection.' },
  { icon: TrendingUp, title: 'Ergonomic Wellness Risk', text: 'A proactive wellness score built for long computer sessions.' },
  { icon: Sparkles, title: 'Yoga & Exercises', text: 'Stay active with guided movement reminders and exercises.' },
  { icon: ShieldCheck, title: 'Privacy First', text: 'No unnecessary storage of webcam images or videos.' },
  { icon: CheckCircle2, title: 'Weekly Reports', text: 'See progress, patterns and better working habits over time.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <main>
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <Badge tone="info">Demo Data</Badge>
              <h1 style={{ fontSize: 'clamp(2.7rem, 5vw, 5rem)', marginTop: 18 }}>Sit Better. Move Better. Live Better.</h1>
              <p style={{ fontSize: 20, maxWidth: 560, marginBottom: 22 }}>AI-powered posture monitoring that helps you build healthier sitting habits.</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button className="btn primary" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}>Start Monitoring <ArrowRight size={18} /></button>
                <button className="btn ghost" onClick={() => navigate('/features')}>Explore Features</button>
              </div>
              <div style={{ marginTop: 22, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="status-pill"><span className="status-dot" />Posture: Good</div>
                <div className="status-pill"><span className="status-dot" style={{ background: 'var(--success)' }} /> Risk: Low</div>
                <div className="status-pill">Sitting Time: 2h 14m</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative', padding: 28 }}>
              <div className="card" style={{ padding: 24, borderRadius: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 700 }}>Daily Session</span>
                  <Badge tone="success">Demo Data</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card" style={{ padding: 16 }}><div style={{ color: 'var(--text-secondary)' }}>Posture Score</div><div style={{ fontSize: 32, fontWeight: 800 }}>86</div></div>
                  <div className="card" style={{ padding: 16 }}><div style={{ color: 'var(--text-secondary)' }}>Risk</div><div style={{ fontSize: 32, fontWeight: 800 }}>Low</div></div>
                  <div className="card" style={{ padding: 16, gridColumn: '1 / span 2' }}><div style={{ color: 'var(--text-secondary)' }}>Sitting Time</div><div style={{ fontSize: 28, fontWeight: 800 }}>2h 14m</div></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container">
          <SectionHeader eyebrow="Why it matters" title="Healthy posture is not a luxury. It is a daily habit." description="Long sitting and poor posture can gradually lead to discomfort, low energy and reduced focus." align="center" />
          <div className="grid grid-3">
            {['Long Sitting', 'Poor Posture', 'Low Awareness'].map((item) => (
              <div className="card" key={item} style={{ padding: 24 }}>
                <h3>{item}</h3>
                <p>Without a reliable posture check-in, screen time silently builds strain over the day.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="How it works" title="A simple four-step wellness flow" description="From your camera to actionable suggestions, Yoga Yen turns raw posture data into clear guidance." align="center" />
          <div className="grid grid-4">
            {steps.map((step, index) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card" style={{ padding: 22 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(31,77,58,0.08)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{index + 1}</div>
                <h3 style={{ marginTop: 14 }}>{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container">
          <SectionHeader eyebrow="Features" title="Everything you need to work better, breathe easier and move more." align="center" />
          <div className="grid grid-3">
            {features.map((feature) => (
              <motion.div key={feature.title} whileHover={{ y: -4 }} className="card" style={{ padding: 22 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(31,77,58,0.08)', color: 'var(--primary)' }}>
                  <feature.icon size={22} />
                </div>
                <h3 style={{ marginTop: 18 }}>{feature.title}</h3>
                <p>{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="card" style={{ padding: 40, background: 'linear-gradient(135deg, rgba(31,77,58,0.04), rgba(200,150,62,0.08))' }}>
            <p style={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 10 }}>Privacy</p>
            <h2 style={{ marginBottom: 18 }}>Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.</h2>
            <p style={{ maxWidth: 760, margin: '0 auto 28px', fontSize: 18 }}>Live monitoring sends normalized landmark coordinates in connected mode. A photo is sent only when you choose to analyze it with a connected backend.</p>
            <button className="btn primary" onClick={() => navigate('/register')}>Ready to improve your sitting habits?</button>
          </div>
        </div>
      </section>
    </main>
  );
}
