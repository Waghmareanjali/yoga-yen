import { motion } from 'framer-motion';

export default function AuthField({ id, label, error, hint, className = '', children }) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={`auth-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small className="auth-field-hint" id={hintId}>{hint}</small>}
      {error && (
        <motion.small
          className="auth-field-error"
          id={errorId}
          role="alert"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.small>
      )}
    </div>
  );
}
