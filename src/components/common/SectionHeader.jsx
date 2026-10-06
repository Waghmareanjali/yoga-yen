export default function SectionHeader({ eyebrow, title, description, align = 'left' }) {
  return (
    <div style={{ textAlign: align === 'center' ? 'center' : 'left', marginBottom: 32 }}>
      {eyebrow && <p style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12, marginBottom: 12 }}>{eyebrow}</p>}
      <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.7rem)', marginBottom: 10 }}>{title}</h2>
      {description && <p style={{ maxWidth: 640, margin: '0 auto', color: 'var(--text-secondary)' }}>{description}</p>}
    </div>
  );
}
