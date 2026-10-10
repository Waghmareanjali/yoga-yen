import { useState } from 'react';
import { ArrowRight, Mail, Phone, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordRules from '../../components/auth/PasswordRules';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validators';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!validateName(form.full_name)) nextErrors.full_name = 'Enter your full name (at least 2 characters).';
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!validatePhone(form.phone)) nextErrors.phone = 'Enter a 10-digit mobile number.';
    if (!validatePassword(form.password)) nextErrors.password = 'Password must be at least 8 characters.';
    if (!form.confirm_password) nextErrors.confirm_password = 'Confirm your password.';
    else if (form.password !== form.confirm_password) nextErrors.confirm_password = 'Passwords do not match.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await register(form);
      if (!result.authenticated) {
        navigate('/login', { replace: true, state: { registrationComplete: true, from: location.state?.from } });
        return;
      }
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard', { replace: true });
    } catch (error) {
      setFormError(error?.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Start with a better habit</div>
        <h1>Create your account</h1>
        <p>Set up your profile to start your Yoga Yen wellness journey.</p>
      </div>

      <div className="auth-info-note">
        <UserRound size={15} />
        <span>All fields are required. Your account details are submitted securely to the Yoga Yen service.</span>
      </div>
      <AuthAlert>{formError}</AuthAlert>

      <form className="auth-form auth-register-grid" onSubmit={handleSubmit} noValidate>
        <AuthField id="register-name" label="Full name" error={errors.full_name}>
          <div className={`auth-input-wrap ${errors.full_name ? 'has-error' : ''}`}>
            <UserRound size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="register-name"
              name="full_name"
              value={form.full_name}
              onChange={updateField}
              required
              minLength={2}
              aria-invalid={Boolean(errors.full_name)}
              aria-describedby={errors.full_name ? 'register-name-error' : undefined}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>
        </AuthField>

        <AuthField id="register-email" label="Email address" error={errors.email}>
          <div className={`auth-input-wrap ${errors.email ? 'has-error' : ''}`}>
            <Mail size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </AuthField>

        <AuthField id="register-phone" label="Mobile number" error={errors.phone} hint="Enter a 10-digit mobile number.">
          <div className={`auth-input-wrap ${errors.phone ? 'has-error' : ''}`}>
            <Phone size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="register-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => {
                const phone = event.target.value.replace(/\D/g, '').slice(0, 10);
                setForm((current) => ({ ...current, phone }));
                setErrors((current) => ({ ...current, phone: '' }));
                setFormError('');
              }}
              required
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'register-phone-error' : 'register-phone-hint'}
              placeholder="10-digit mobile number"
              autoComplete="tel"
            />
          </div>
        </AuthField>

        <AuthField id="register-password" label="Password" error={errors.password}>
          <PasswordInput
            id="register-password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password}
          />
          <PasswordRules value={form.password} />
        </AuthField>

        <AuthField id="register-confirm-password" label="Confirm password" error={errors.confirm_password}>
          <PasswordInput
            id="register-confirm-password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={updateField}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirm_password}
          />
        </AuthField>

        <button className="auth-submit auth-field-full" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Creating account...</> : <>Create account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link className="auth-inline-link" to="/login" state={location.state}>Sign in</Link>
      </p>
      <p className="auth-privacy-note">Your password is sent only to the Yoga Yen authentication service. Wellness indicators are not medical advice.</p>
    </AuthLayout>
  );
}
