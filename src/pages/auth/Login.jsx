import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login({ email });
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-heading">
        <div className="auth-eyebrow"><Sparkles size={14} /> Your wellness journey</div>
        <h1>Welcome Back</h1>
        <p>Sign in to continue your Yoga Yen wellness journey.</p>
      </div>

      <div className="auth-demo-note">
        <LockKeyhole size={15} />
        <span><strong>Preview sign-in:</strong> no username or password is checked. Select Sign In to continue.</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="login-email" label="Email address (optional)">
          <div className="auth-input-wrap">
            <Mail size={17} className="auth-input-icon" aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter any email, or leave blank"
              autoComplete="email"
            />
          </div>
        </AuthField>

        <AuthField id="login-password" label="Password (optional)">
          <PasswordInput
            id="login-password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter anything, or leave blank"
            autoComplete="current-password"
          />
        </AuthField>

        <button className="auth-submit" type="submit">
          Sign In <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        New to Yoga Yen? <Link className="auth-inline-link" to="/register">Create a preview profile</Link>
      </p>
      <p className="auth-privacy-note">This UI preview does not create an account or save credentials. Your wellness indicators are not medical advice.</p>
    </AuthLayout>
  );
}
