import { useEffect } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import './toast.css';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration || 6000);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const Icon = toast.type === 'task-completed' ? CheckCircle2 : Info;
  return (
    <div className="task-toast card" role="status">
      <Icon size={18} aria-hidden="true" />
      <span><strong>{toast.title}</strong><small>{toast.description}</small></span>
      <button type="button" className="btn ghost" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}><X size={15} /></button>
    </div>
  );
}

export default function ToastViewport() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const visible = notifications.filter((item) => String(item.type).startsWith('task')).slice(-3);
  if (!visible.length) return null;
  return (
    <div className="task-toast-viewport" aria-live="polite" aria-relevant="additions">
      {visible.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={removeNotification} />)}
    </div>
  );
}
