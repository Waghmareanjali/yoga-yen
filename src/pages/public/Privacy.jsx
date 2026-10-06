import SectionHeader from '../../components/common/SectionHeader';

export default function Privacy() {
  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="Privacy" title="Your privacy comes first." description="Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos." />
        <div className="card" style={{ padding: 28 }}>
          <p>We do not persist webcam frames or video recordings. Only posture landmarks, extracted posture features, risk information and session metadata are processed for real-time analysis and insight generation.</p>
          <p>We recommend using the app in a private environment and always reviewing what data is shared with the backend before starting a monitoring session.</p>
          <p>Privacy is preserved by design: Motion analysis runs in-browser when possible, with only minimal session data sent to the backend for classification and reporting.</p>
        </div>
      </div>
    </main>
  );
}
