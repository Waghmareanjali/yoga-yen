import { useState } from 'react';
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiConfig } from '../../api/client';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordRules from '../../components/auth/PasswordRules';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateName, validateSecurePassword } from '../../utils/validators';

const initialForm = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  work_type: '',
  device_type: '',
  consent: false,
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!validateName(form.full_name)) nextErrors.full_name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!validateEmail(form.email.trim())) nextErrors.email = 'Please enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (!validateSecurePassword(form.password)) nextErrors.password = 'Password must meet all the requirements below.';
    if (!form.confirm_password) nextErrors.confirm_password = 'Please confirm your password.';
    else if (form.confirm_password !== form.password) nextErrors.confirm_password = 'Passwords do not match.';
    const age = Number(form.age);
    if (!form.age) nextErrors.age = 'Please enter your age.';
    else if (!Number.isInteger(age) || age < 13 || age > 120) nextErrors.age = 'Enter an age between 13 and 120.';
    const height = Number(form.height);
    if (!form.height) nextErrors.height = 'Please enter your height.';
    else if (!Number.isFinite(height) || height < 80 || height > 250) nextErrors.height = 'Enter a height between 80 and 250 cm.';
    const weight = Number(form.weight);
    if (!form.weight) nextErrors.weight = 'Please enter your weight.';
    else if (!Number.isFinite(weight) || weight < 20 || weight > 350) nextErrors.weight = 'Enter a weight between 20 and 350 kg.';
    if (!form.gender) nextErrors.gender = 'Please select a gender option.';
    if (!form.work_type) nextErrors.work_type = 'Please select your work type.';
    if (!form.device_type) nextErrors.device_type = 'Please select your primary device.';
    if (!form.consent) nextErrors.consent = 'Please accept the privacy consent to continue.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    if (loading || !validate()) return;

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      age: Number(form.age),
      gender: form.gender,
      height: Number(form.height),
      weight: Number(form.weight),
      work_type: form.work_type,
      device_type: form.device_type,
      consent: form.consent,
    };

    setLoading(true);
    try {
      const result = await register(payload);
      if (!result.authenticated) {
        navigate('/login', {
          replace: true,
          state: { message: 'Account created successfully. Please sign in to continue.' },
        });
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(error?.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const input = (name, type, placeholder, autoComplete = 'off') => (
    <div className={`auth-input-wrap ${errors[name] ? 'has-error' : ''}`}>
      <input
        id={`register-${name}`}
        name={name}
        type={type}
        value={form[name]}
        onChange={updateField}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={name === 'age' ? 13 : name === 'height' ? 80 : name === 'weight' ? 20 : undefined}
        max={name === 'age' ? 120 : name === 'height' ? 250 : name === 'weight' ? 350 : undefined}
        step={name === 'age' ? 1 : name === 'height' || name === 'weight' ? 0.1 : undefined}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `register-${name}-error` : undefined}
      />
    </div>
  );

  const select = (name, placeholder, options) => (
    <div className={`auth-input-wrap ${errors[name] ? 'has-error' : ''}`}>
      <select
        id={`register-${name}`}
        name={name}
        value={form[name]}
        onChange={updateField}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `register-${name}-error` : undefined}
        required
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="auth-input-end-icon" size={16} aria-hidden="true" />
    </div>
  );

  return (
    <AuthLayout mode="register">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Start with a better habit</div>
        <h1>Create Your YogaYen Account</h1>
        <p>Start your personalized posture and wellness journey.</p>
      </div>

      {apiConfig.useMockApi && (
        <div className="auth-demo-note">
          <ShieldCheck size={15} />
          <span><strong>Demo mode:</strong> registration uses preview data. No real account is created or sent to a server.</span>
        </div>
      )}
      <AuthAlert>{apiError}</AuthAlert>

      <form className="auth-form auth-register-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-register-grid">
          <AuthField id="register-full_name" label="Full Name" error={errors.full_name} className="auth-field-full">
            <div className={`auth-input-wrap ${errors.full_name ? 'has-error' : ''}`}>
              <UserRound size={17} className="auth-input-icon" aria-hidden="true" />
              <input
                id="register-full_name"
                name="full_name"
                value={form.full_name}
                onChange={updateField}
                required
                placeholder="Enter your full name"
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={errors.full_name ? 'register-full_name-error' : undefined}
              />
            </div>
          </AuthField>

          <AuthField id="register-email" label="Email Address" error={errors.email} className="auth-field-full">
            <div className={`auth-input-wrap ${errors.email ? 'has-error' : ''}`}>
              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                placeholder="Enter your email address"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
              />
            </div>
          </AuthField>

          <AuthField id="register-password" label="Password" error={errors.password} className="auth-field-full">
            <PasswordInput
              id="register-password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Create a password"
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordRules value={form.password} />
          </AuthField>

          <AuthField id="register-confirm_password" label="Confirm Password" error={errors.confirm_password} className="auth-field-full">
            <PasswordInput
              id="register-confirm_password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={updateField}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              error={errors.confirm_password}
            />
          </AuthField>

          <AuthField id="register-age" label="Age" error={errors.age}>
            {input('age', 'number', 'Your age')}
          </AuthField>
          <AuthField id="register-gender" label="Gender" error={errors.gender}>
            {select('gender', 'Select an option', ['Male', 'Female', 'Other', 'Prefer not to say'])}
          </AuthField>
          <AuthField id="register-height" label="Height (cm)" error={errors.height}>
            {input('height', 'number', 'e.g. 170')}
          </AuthField>
          <AuthField id="register-weight" label="Weight (kg)" error={errors.weight}>
            {input('weight', 'number', 'e.g. 65')}
          </AuthField>
          <AuthField id="register-work_type" label="Work Type" error={errors.work_type}>
            {select('work_type', 'Select your work type', ['Student', 'Office Work', 'Software/IT', 'Remote Work', 'Other'])}
          </AuthField>
          <AuthField id="register-device_type" label="Primary Device" error={errors.device_type}>
            {select('device_type', 'Select your device', ['Laptop', 'Desktop'])}
          </AuthField>
        </div>

        <div className="auth-consent-wrap">
          <label className="auth-consent">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={updateField}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'register-consent-error' : 'register-consent-note'}
            />
            <span>
              I agree to the YogaYen <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link> and <Link to="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link>. I understand posture monitoring supports wellness guidance and is not a medical diagnosis.
            </span>
          </label>
          {!form.consent && <small className="auth-field-hint" id="register-consent-note">Consent is required to create an account.</small>}
          {errors.consent && <small className="auth-field-error auth-consent-error" id="register-consent-error" role="alert">{errors.consent}</small>}
        </div>

        <button className="auth-submit" type="submit" disabled={loading || !form.consent}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Creating Account...</> : <>Create Account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link className="auth-inline-link" to="/login">Sign in</Link>
      </p>
      <p className="auth-privacy-note">Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.</p>
    </AuthLayout>
  );
}
