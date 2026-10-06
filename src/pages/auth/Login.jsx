import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiConfig } from '../../api/client';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validators';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!validateEmail(form.email.trim())) nextErrors.email = 'Please enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    if (loading || !validate()) return;

    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password }, { rememberMe });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(error?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Your wellness journey</div>
        <h1>Welcome Back</h1>
        <p>Sign in to continue your YogaYen wellness journey.</p>
      </div>

      {apiConfig.useMockApi && (
        <div className="auth-demo-note">
          <LockKeyhole size={15} />
          <span><strong>Demo mode:</strong> sign-in uses preview data. No real account or credentials are checked.</span>
        </div>
      )}
      {location.state?.message && <AuthAlert type="info">{location.state.message}</AuthAlert>}
      <AuthAlert>{apiError}</AuthAlert>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="login-email" label="Email Address" error={errors.email}>
          <div className={`auth-input-wrap ${errors.email ? 'has-error' : ''}`}>
            <Mail size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={updateField}
              placeholder="Enter your email address"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
        </AuthField>

        <AuthField id="login-password" label="Password" error={errors.password}>
          <PasswordInput
            id="login-password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
          />
        </AuthField>

        <div className="auth-login-options">
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <Link className="auth-inline-link" to="/register">Create an account</Link>
      </p>
      <p className="auth-privacy-note">Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.</p>
    </AuthLayout>
  );
}
