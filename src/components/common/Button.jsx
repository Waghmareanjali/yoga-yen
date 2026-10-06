import clsx from 'clsx';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={clsx('btn', variant, className)} {...props}>
      {children}
    </button>
  );
}
