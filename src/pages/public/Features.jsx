import { motion } from 'framer-motion';
import SectionHeader from '../../components/common/SectionHeader';
import { featureCards } from '../../data/features';

export default function Features() {
  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="Features" title="A complete posture wellness toolkit." description="Built to help students, professionals, and home office users stay aware, comfortable and productive." align="center" />
        <div className="grid grid-3">
          {featureCards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} className="card" style={{ padding: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(31,77,58,0.08)', display: 'grid', placeItems: 'center', color: 'var(--primary)', fontWeight: 800 }}>0{index + 1}</div>
              <h3 style={{ marginTop: 16 }}>{card.title}</h3>
              <p>{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
