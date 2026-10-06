import { useEffect, useState } from 'react';
import { Activity, Clock3, HeartPulse } from 'lucide-react';
import { postureApi } from '../../api/postureApi';
import { apiConfig } from '../../api/client';
import StatCard from '../../components/common/StatCard';
import AuthAlert from '../../components/auth/AuthAlert';
import './posture-analysis.css';

export default function PostureAnalysis() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([postureApi.getCurrent(), postureApi.getHistory()])
      .then(([currentResult, historyResult]) => {
        if (!mounted) return;
        setCurrent(currentResult);
        setHistory(historyResult);
      })
      .catch((requestError) => { if (mounted) setError(requestError.message || 'Unable to load posture analysis.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const value = (key) => {
    const parsed = Number(current?.[key]);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return (
    <div className="posture-analysis-page" style={{ display: 'grid', gap: 20 }}>
      <div className="page-header">
        <div><span className={`badge ${apiConfig.useMockApi ? 'info' : 'success'}`}>{apiConfig.useMockApi ? 'Demo Data' : 'Live data'}</span><h1>Posture Analysis</h1><p>Review session indicators and your recent posture-awareness history.</p></div>
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      <div className="grid grid-3">
        <StatCard icon={Activity} label="Latest posture score" value={loading ? null : value('score')} tone="success" />
        <StatCard icon={HeartPulse} label="Wellness risk" value={loading ? null : value('risk')} tone="warning" />
        <StatCard icon={Clock3} label="Current session (min)" value={loading ? null : value('duration')} tone="primary" />
      </div>
      <section className="card posture-history-card" style={{ padding: 22 }}>
        <h2>Recent posture sessions</h2>
        {loading ? <p className="posture-analysis-muted">Loading session history…</p> : history.length ? (
          <div className="posture-history-table-wrap">
            <table>
              <thead><tr><th>Session</th><th>Posture class</th><th>Wellness risk</th><th>Duration</th></tr></thead>
              <tbody>{history.map((item) => <tr key={item.id}><td>{item.label || item.date || 'Session'}</td><td>{item.posture || '—'}</td><td>{item.risk ?? '—'}</td><td>{item.duration != null ? `${item.duration} min` : '—'}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="posture-analysis-muted">No completed posture sessions yet. Start a monitoring session to see history here.</p>}
      </section>
      <p className="posture-analysis-disclaimer">Wellness indicators are informational only and are not a medical diagnosis.</p>
    </div>
  );
}
