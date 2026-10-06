import { motion } from 'framer-motion';
import SectionHeader from '../../components/common/SectionHeader';

const timeline = [
  'Capture posture landmarks with a standard laptop webcam',
  'Extract joint-angle and sitting posture features',
  'Classify posture with a Random Forest model on the backend',
  'Turn posture insights into a wellness score and reminders',
];

export default function About() {
  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="About Yoga Yen" title="Built for healthier workdays and calmer study sessions." description="The idea behind Yoga Yen is simple: people spend long periods seated in front of a screen, yet few tools explain how posture changes over time or suggest gentle corrective actions." />

        <div className="grid grid-2" style={{ marginTop: 28 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3>Why it was built</h3>
            <p>Prolonged sitting among students and office workers often leads to neck strain, shoulder discomfort and lower back fatigue.</p>
            <p>Existing posture tools often focus on a binary outcome and do not combine posture monitoring with sitting-time tracking, guided exercises, break reminders and weekly progress.</p>
            <p>Yoga Yen brings these pieces together in one calm, privacy-conscious Wellness Indicator.</p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h3>How AI is used</h3>
            <p>MediaPipe landmark detection helps identify the position of the head, shoulders and wrist landmarks in-browser.</p>
            <p>Joint-angle and posture features are extracted and sent to the backend, where a Random Forest model classifies posture and computes an Ergonomic Wellness Risk score.</p>
            <p>The app then shares personalized exercise and break recommendations.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginTop: 28 }}>
          <h3>Why a standard webcam is a good fit</h3>
          <p>Using a regular webcam makes posture monitoring accessible, affordable and non-intrusive. It removes the need for additional hardware and is easier to adopt in real student and professional environments.</p>
          <p>Privacy is central: only landmark coordinates and posture session information are processed. The app does not require storing webcam images or videos.</p>
        </div>

        <div style={{ marginTop: 36 }}>
          <SectionHeader eyebrow="Vision" title="Our design goals" />
          <div className="grid grid-4">
            {['SDG 3: Good Health and Well-being', 'Affordable desk-side monitoring', 'Personalized wellness reminders', 'Clear confidence-building insights'].map((item) => (
              <motion.div key={item} whileHover={{ y: -4 }} className="card" style={{ padding: 22 }}>
                <h4>{item}</h4>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 36 }}>
          <SectionHeader eyebrow="Process" title="How the system works" />
          <div className="grid grid-4">
            {timeline.map((step, index) => (
              <div key={step} className="card" style={{ padding: 22 }}>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{index + 1}</div>
                <p style={{ marginTop: 10 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginTop: 32 }}>
          <h3>Future Scope</h3>
          <p>Micro-break reminders and IoT/wearable integration.</p>
        </div>

        <div className="card" style={{ padding: 28, marginTop: 32 }}>
          <h3>Credits</h3>
          <p>Guide: Prof. A. S. Akalwadi</p>
          <p>Team: Someshwari Choudhari, Snehal Pudale, Vaishnavi Shukla, Anjali Waghmare</p>
        </div>
      </div>
    </main>
  );
}
