import { useState } from 'react';
import { ArrowRight, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register(form);
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout mode="register">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Start with a better habit</div>
        <h1>Create Your Preview Profile</h1>
        <p>Try the Yoga Yen experience without setting up an account.</p>
      </div>

      <div className="auth-demo-note">
        <UserRound size={15} />
        <span><strong>No account required:</strong> all fields are optional and nothing is sent to a server.</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="register-name" label="Name (optional)">
          <div className="auth-input-wrap">
            <UserRound size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="register-name"
              name="full_name"
              value={form.full_name}
              onChange={updateField}
              placeholder="What should we call you?"
              autoComplete="name"
            />
          </div>
        </AuthField>

        <AuthField id="register-email" label="Email address (optional)">
          <div className="auth-input-wrap">
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="Enter your email, or leave blank"
              autoComplete="email"
            />
          </div>
        </AuthField>

        <AuthField id="register-password" label="Password (optional)">
          <PasswordInput
            id="register-password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="Not saved or checked"
            autoComplete="new-password"
          />
        </AuthField>

        <button className="auth-submit" type="submit">
          Continue to Yoga Yen <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        Already tried Yoga Yen? <Link className="auth-inline-link" to="/login">Sign in to preview</Link>
      </p>
      <p className="auth-privacy-note">This is a UI-only preview. No registration, authentication, or database is connected.</p>
    </AuthLayout>
  );
}
