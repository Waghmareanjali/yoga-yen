import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="card" style={{ padding: 48, maxWidth: 560, margin: '0 auto' }}>
          <h1>404</h1>
          <p>This page seems to have wandered off. Try heading back home.</p>
          <Link to="/" className="btn primary">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
