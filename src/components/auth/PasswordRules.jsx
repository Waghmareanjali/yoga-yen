import { Check, Circle } from 'lucide-react';
import { passwordRules } from '../../utils/validators';

export default function PasswordRules({ value }) {
  const strength = value.length < 8 ? 'Weak' : value.length < 12 ? 'Medium' : 'Strong';
  const filledBars = value.length < 8 ? (value ? 1 : 0) : value.length < 12 ? 2 : 4;

  return (
    <div className="auth-password-rules" aria-live="polite">
      <div className="auth-strength-top">
        <span>Password strength</span>
        <strong className={`strength-${strength.toLowerCase()}`}>{value ? strength : 'Not set'}</strong>
      </div>
      <div className="auth-strength-meter" aria-label={value ? `${strength} password` : 'Password strength not set'}>
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={bar <= filledBars ? `filled strength-${strength.toLowerCase()}` : ''} />
        ))}
      </div>
      <ul>
        {passwordRules.map((rule) => {
          const complete = rule.test(value);
          const Icon = complete ? Check : Circle;
          return (
            <li key={rule.key} className={complete ? 'rule-complete' : ''}>
              <Icon size={13} aria-hidden="true" /> {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
