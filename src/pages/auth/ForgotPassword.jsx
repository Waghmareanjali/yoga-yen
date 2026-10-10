import { useState } from 'react';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/authApi';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import { validateEmail } from '../../utils/validators';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [apiError, setApiError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldError('');
    setApiError('');
    setMessage('');
    if (!email.trim()) {
      setFieldError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setMessage('If an account exists for this email, password reset instructions will be sent.');
    } catch (requestError) {
      setApiError(requestError?.message || 'Unable to request a password reset right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Account recovery</div>
        <h1>Forgot Your Password?</h1>
        <p>Enter your registered email address and we&apos;ll help you reset your password.</p>
      </div>
      <AuthAlert>{apiError}</AuthAlert>
      <AuthAlert type="success">{message}</AuthAlert>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="forgot-email" label="Email Address" error={fieldError}>
          <div className={`auth-input-wrap ${fieldError ? 'has-error' : ''}`}>
            <Mail size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(event) => { setEmail(event.target.value); setFieldError(''); setApiError(''); setMessage(''); }}
              placeholder="Enter your email address"
              autoComplete="email"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'forgot-email-error' : undefined}
            />
          </div>
        </AuthField>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Sending...</> : <>Send Reset Link <ArrowRight size={16} /></>}
        </button>
      </form>
      <p className="auth-switch"><Link className="auth-inline-link" to="/login">Back to Login</Link></p>
    </AuthLayout>
  );
}
