import clsx from 'clsx';

export default function Badge({ children, tone = 'info', className = '' }) {
  return <span className={clsx('badge', tone, className)}>{children}</span>;
}
