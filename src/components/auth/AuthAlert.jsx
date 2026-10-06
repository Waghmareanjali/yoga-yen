import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const alertIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export default function AuthAlert({ type = 'error', children }) {
  const Icon = alertIcons[type] || AlertCircle;
  return (
    <AnimatePresence mode="wait">
      {children && (
        <motion.div
          className={`auth-alert auth-alert-${type}`}
          role={type === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          <Icon size={17} aria-hidden="true" />
          <span>{children}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
