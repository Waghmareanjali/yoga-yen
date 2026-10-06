import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';

export default function StatCard({ icon: Icon, label, value, suffix = '', tone = 'primary', trend }) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const count = useCountUp(numericValue, 800);
  return (
    <motion.div whileHover={{ y: -4 }} className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(31,77,58,0.08)', color: 'var(--primary)' }}>
          <Icon size={20} />
        </div>
        {trend && <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>{trend}</span>}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Number.isFinite(value) ? `${count}${suffix}` : '—'}</div>
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(31,77,58,0.08)', marginTop: 15, overflow: 'hidden' }}>
        <div style={{ width: `${Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0}%`, height: '100%', borderRadius: 999, background: tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--success)' }} />
      </div>
    </motion.div>
  );
}
