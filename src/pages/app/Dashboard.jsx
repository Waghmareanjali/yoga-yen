import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import KpiGrid from '../../components/dashboard/KpiGrid';
import QuickActions from '../../components/dashboard/QuickActions';
import TrendChart from '../../components/analytics/TrendChart';
import AuthAlert from '../../components/auth/AuthAlert';
import TodaysGoals from '../../components/dashboard/TodaysGoals';
import { postureApi } from '../../api/postureApi';
import { recommendationApi } from '../../api/recommendationApi';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      postureApi.getCurrent(),
      postureApi.getHistory(),
      postureApi.getTrends(),
      recommendationApi.getRecommendations(),
    ]).then((results) => {
      if (!mounted) return;
      const nextErrors = [];
      if (results[0].status === 'fulfilled') setCurrent(results[0].value);
      else nextErrors.push(results[0].reason?.message || 'Current posture data is unavailable.');
      if (results[1].status === 'fulfilled') setHistory(results[1].value);
      else nextErrors.push(results[1].reason?.message || 'Session history is unavailable.');
      if (results[2].status === 'fulfilled') setTrends(results[2].value);
      else nextErrors.push(results[2].reason?.message || 'Trend data is unavailable.');
      if (results[3].status === 'fulfilled') setRecommendations(results[3].value.items || []);
      else nextErrors.push(results[3].reason?.message || 'Recommendations are unavailable.');
      setErrors(nextErrors);
    });
    return () => { mounted = false; };
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {errors.map((message) => <AuthAlert key={message}>{message}</AuthAlert>)}
      <div className="page-header">
        <div>
          <h1>Welcome, {firstName}</h1>
        </div>
        <Link to="/live-monitor" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Start monitoring <ArrowRight size={16} /></Link>
      </div>

      <KpiGrid current={current} history={history} />
      <TodaysGoals />
      <QuickActions />

      <div className="grid grid-1">
        <TrendChart data={trends} />
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3>Recommended actions</h3>
          <Link to="/yoga" style={{ color: 'var(--primary)', fontWeight: 700 }}>View all <ChevronRight size={16} /></Link>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {recommendations.map((item) => (
            <motion.div key={item.id} whileHover={{ x: 4 }} className="card" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{item.summary}</div>
                </div>
                <span className={`badge ${item.severity === 'high' ? 'danger' : item.severity === 'medium' ? 'warning' : 'success'}`}>{item.severity}</span>
              </div>
            </motion.div>
          ))}
          {!recommendations.length && <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No recommendations are available yet.</p>}
        </div>
      </div>
    </div>
  );
}
