import { Activity, AlarmClockCheck, NotebookText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  { title: 'Start live monitor', text: 'Check your posture live', icon: Activity, path: '/live-monitor' },
  { title: 'Your yoga plan', text: 'Guided exercises for today', icon: Sparkles, path: '/yoga' },
  { title: 'Break reminders', text: 'Review your movement rhythm', icon: AlarmClockCheck, path: '/break-reminders' },
  { title: 'Weekly reports', text: 'See posture insights', icon: NotebookText, path: '/reports' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-4">
      {actions.map((item) => (
        <Link key={item.title} to={item.path} className="card" style={{ padding: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(31,77,58,0.08)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
            <item.icon size={18} />
          </div>
          <h3 style={{ marginTop: 16 }}>{item.title}</h3>
          <p>{item.text}</p>
        </Link>
      ))}
    </div>
  );
}
