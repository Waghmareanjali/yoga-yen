import { useState } from 'react';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { previewAccount } from '../../constants/previewAccount';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const registrationComplete = Boolean(location.state?.registrationComplete);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!validateEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    else if (!validatePassword(password)) nextErrors.password = 'Password must be at least 8 characters.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await login({ email, password });
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard', { replace: true });
    } catch (error) {
      setFormError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Your wellness journey</div>
        <h1>Welcome Back</h1>
        <p>Sign in to continue your Yoga Yen wellness journey.</p>
      </div>

      <div className="auth-info-note">
        <Mail size={15} />
        <span>
          {previewAccount
            ? <>Development preview only: <strong>{previewAccount.email}</strong> / <strong>{previewAccount.password}</strong>. This is not a real account.</>
            : 'Sign in with your registered account to continue.'}
        </span>
      </div>
      {registrationComplete && <AuthAlert type="success">Your account was created. Sign in to continue.</AuthAlert>}
      <AuthAlert>{formError}</AuthAlert>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="login-email" label="Email address" error={errors.email}>
          <div className={`auth-input-wrap ${errors.email ? 'has-error' : ''}`}>
            <Mail size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: '' })); setFormError(''); }}
              placeholder="you@example.com"
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
            value={password}
            onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: '' })); setFormError(''); }}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
          />
        </AuthField>

        <div className="auth-login-options">
          <span />
          <Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="auth-switch">
        New to Yoga Yen? <Link className="auth-inline-link" to="/register" state={location.state}>Create an account</Link>
      </p>
      <p className="auth-privacy-note">Your account is verified by the Yoga Yen service. Wellness indicators are not medical advice.</p>
    </AuthLayout>
  );
}
