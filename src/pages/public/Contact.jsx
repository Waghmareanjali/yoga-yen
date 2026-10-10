import { useState } from 'react';
import { contactApi } from '../../api/contactApi';
import AuthAlert from '../../components/auth/AuthAlert';
import SectionHeader from '../../components/common/SectionHeader';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await contactApi.sendMessage(form);
      setSuccess('Your message has been sent.');
      setForm({ name: '', email: '', message: '' });
    } catch (requestError) {
      setError(requestError?.message || 'Unable to send your message right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section">
      <div className="container">
        <SectionHeader eyebrow="Contact" title="Ask us anything" description="We would love to hear from students, faculty, researchers and wellness teams." />
        <div className="grid grid-2">
          <form className="card" style={{ padding: 28 }} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 16 }}>
              <label htmlFor="contact-name">Your name</label>
              <input id="contact-name" name="name" required value={form.name} onChange={updateField} autoComplete="name" style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Your name" />
              <label htmlFor="contact-email">Email address</label>
              <input id="contact-email" name="email" type="email" required value={form.email} onChange={updateField} autoComplete="email" style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Email address" />
              <label htmlFor="contact-message">Your message</label>
              <textarea id="contact-message" name="message" rows="6" required value={form.message} onChange={updateField} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)' }} placeholder="Your message" />
              {error && <AuthAlert>{error}</AuthAlert>}
              {success && <AuthAlert type="success">{success}</AuthAlert>}
              <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send message'}</button>
            </div>
          </form>
          <div className="card" style={{ padding: 28 }}>
            <h3>Project support</h3>
            <p>Guide: Prof. A. S. Akalwadi</p>
            <p>Bharati Vidyapeeth's College of Engineering for Women, Pune</p>
          </div>
        </div>
      </div>
    </main>
  );
}
