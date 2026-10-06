import { useState } from 'react';
import SectionHeader from '../../components/common/SectionHeader';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="Contact" title="Ask us anything" description="We would love to hear from students, faculty, researchers and wellness teams." />
        <div className="grid grid-2">
          <form className="card" style={{ padding: 28 }} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 16 }}>
              <input style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Your name" />
              <input style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Email address" />
              <textarea rows="6" style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Your message" />
              <button className="btn primary" type="submit">Send message</button>
              {submitted && <p style={{ color: 'var(--success)' }}>Message sent. Demo response only.</p>}
            </div>
          </form>
          <div className="card" style={{ padding: 28 }}>
            <h3>Project support</h3>
            <p>Email: yoga-yen@example.com</p>
            <p>Guide: Prof. A. S. Akalwadi</p>
            <p>Bharati Vidyapeeth's College of Engineering for Women, Pune</p>
          </div>
        </div>
      </div>
    </main>
  );
}
