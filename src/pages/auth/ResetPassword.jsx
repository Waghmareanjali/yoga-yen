import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetUserPassword } from '../../api/authApi';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordRules from '../../components/auth/PasswordRules';
import { validateSecurePassword } from '../../utils/validators';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError('This reset link is incomplete. Please request a new password reset link.');
      return;
    }
    if (!validateSecurePassword(password)) {
      setFieldError('Password must meet all the requirements below.');
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    setFieldError('');
    setLoading(true);
    try {
      await resetUserPassword({ token: resetToken, password });
      setSuccess('Password updated. You can now sign in.');
    } catch (requestError) {
      setError(requestError?.message || 'Unable to reset your password right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Secure account recovery</div>
        <h1>Reset Password</h1>
        <p>Choose a new password to get back to your wellness journey.</p>
      </div>
      <AuthAlert>{error}</AuthAlert>
      <AuthAlert type="success">{success}</AuthAlert>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="reset-password" label="New Password" error={fieldError}>
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setFieldError(''); setSuccess(''); }}
            placeholder="Create a new password"
            autoComplete="new-password"
            error={fieldError}
          />
          <PasswordRules value={password} />
        </AuthField>
        <AuthField id="reset-confirm" label="Confirm New Password" error={fieldError && password !== confirm ? fieldError : ''}>
          <PasswordInput
            id="reset-confirm"
            value={confirm}
            onChange={(event) => { setConfirm(event.target.value); setFieldError(''); setSuccess(''); }}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            error={fieldError && password !== confirm ? fieldError : ''}
          />
        </AuthField>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Updating...</> : <>Update Password <ArrowRight size={16} /></>}
        </button>
      </form>
      <p className="auth-switch"><Link className="auth-inline-link" to="/login">Back to Login</Link></p>
    </AuthLayout>
  );
}
