import SectionHeader from '../../components/common/SectionHeader';

export default function Terms() {
  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="Terms" title="Terms and conditions" description="A short informational page for sign-up and account use." />
        <div className="card" style={{ padding: 28 }}>
          <p>Yoga Yen is intended for wellness awareness and educational use.</p>
          <p>Users are expected to use the service responsibly and understand that the posture analysis provided is a wellness indicator rather than a medical diagnosis.</p>
          <p>We do not claim clinical validation. Features are designed around safe, supportive, health-tech use patterns.</p>
        </div>
      </div>
    </main>
  );
}
