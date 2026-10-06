import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, GitCompareArrows } from 'lucide-react';
import { postureApi } from '../../api/postureApi';
import { apiConfig } from '../../api/client';
import TrendChart from '../../components/analytics/TrendChart';
import RiskDistribution from '../../components/analytics/RiskDistribution';
import AuthAlert from '../../components/auth/AuthAlert';
import './history.css';

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

function dateValue(item) {
  if (item.timestamp) return new Date(item.timestamp);
  if (item.date) return new Date(item.date);
  return null;
}

function matchesRange(item, range, dates) {
  if (range === 'yesterday') {
    const date = dateValue(item);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return Boolean(date && date.toDateString() === yesterday.toDateString());
  }
  if (range === 'today') {
    const date = dateValue(item);
    return !date || date.toDateString() === new Date().toDateString();
  }
  if (range === '7d' || range === '30d') {
    const date = dateValue(item);
    return !date || (Date.now() - date.getTime()) <= (range === '7d' ? 7 : 30) * 86400000;
  }
  if (range === 'custom' && dates.from && dates.to) {
    const date = dateValue(item);
    const from = new Date(`${dates.from}T00:00:00`);
    const to = new Date(`${dates.to}T23:59:59`);
    return Boolean(date && date >= from && date <= to);
  }
  return true;
}

export default function History() {
  const [range, setRange] = useState('7d');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [compare, setCompare] = useState(false);
  const [records, setRecords] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([postureApi.getHistory(), postureApi.getTrends()])
      .then(([history, trendData]) => {
        if (!active) return;
        setRecords(history);
        setTrends(trendData);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load posture history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredRecords = useMemo(() => records.filter((item) => matchesRange(item, range, dates)), [records, range, dates]);

  return (
    <div className="history-page">
      <div className="page-header">
        <div><h1>History &amp; Trends</h1><p>Review your posture and ergonomic wellness patterns over time.</p></div>
        {apiConfig.useMockApi && <span className="badge info">Demo Data</span>}
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}

      <div className="history-filters card">
        <label htmlFor="history-range"><CalendarDays size={16} /> View period</label>
        <select id="history-range" value={range} onChange={(event) => setRange(event.target.value)}>
          {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {range === 'custom' && (
          <div className="history-custom-dates">
            <label>From <input type="date" value={dates.from} onChange={(event) => setDates((current) => ({ ...current, from: event.target.value }))} /></label>
            <label>To <input type="date" value={dates.to} onChange={(event) => setDates((current) => ({ ...current, to: event.target.value }))} /></label>
          </div>
        )}
        <button className={`btn ${compare ? 'primary' : 'ghost'} history-compare`} onClick={() => setCompare((value) => !value)} aria-pressed={compare}>
          <GitCompareArrows size={16} /> {compare ? 'Comparison on' : 'Compare period'}
        </button>
      </div>

      {loading ? (
        <div className="history-skeletons"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
      ) : (
        <>
          <div className={`history-chart-grid ${apiConfig.useMockApi ? '' : 'single-chart'}`}>
            <TrendChart data={trends} />
            {apiConfig.useMockApi && <RiskDistribution />}
          </div>
          {compare && (
            <section className="card history-comparison">
              <div><strong>Current period</strong><span>{filteredRecords.length} posture sessions</span></div>
              <div><strong>Comparison period</strong><span>{range === 'today' ? 'Yesterday' : 'Previous period'} · comparison will populate as history grows</span></div>
            </section>
          )}
          <section className="card history-table-card">
            <div className="history-table-heading"><h2>Posture sessions</h2><span>{filteredRecords.length} results</span></div>
            {filteredRecords.length ? (
              <div className="history-table-scroll">
                <table>
                  <thead><tr><th>Date / time</th><th>Posture class</th><th>Ergonomic Wellness Risk</th><th>Session length</th></tr></thead>
                  <tbody>{filteredRecords.map((item) => (
                    <tr key={item.id || item._id || `${item.label}-${item.posture}`}>
                      <td>{item.label || (item.timestamp && new Date(item.timestamp).toLocaleString()) || item.date || 'Session'}</td>
                      <td>{item.posture || item.posture_class || 'Not classified'}</td>
                      <td><span className={`history-risk ${Number(item.risk) > 70 ? 'high' : Number(item.risk) >= 40 ? 'medium' : 'low'}`}>{Number.isFinite(Number(item.risk)) ? `${item.risk} / 100` : '—'}</span></td>
                      <td>{Number.isFinite(Number(item.duration)) ? `${item.duration} min` : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div className="history-empty"><CalendarDays size={26} /><strong>No posture data for this period yet.</strong><span>Start your first monitoring session to build your history.</span></div>
            )}
          </section>
          <p className="history-note">Wellness thresholds are tunable, not medical thresholds. Charts and records in Demo mode are illustrative preview data.</p>
        </>
      )}
    </div>
  );
}
