import { useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, CalendarDays, Clock3, Sparkles } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import TrendChart from '../../components/analytics/TrendChart';
import AuthAlert from '../../components/auth/AuthAlert';
import { isMockApiMode, isPreviewMode } from '../../data/previewData';
import { useTaskStore } from '../../store/taskStore';
import { getTaskStatus } from '../../utils/taskStatus';
import Badge from '../../components/common/Badge';
import './reports.css';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const tasks = useTaskStore((state) => state.tasks);
  const retryTask = useTaskStore((state) => state.retryTask);

  const [now] = useState(Date.now);
  const weeklyTasks = tasks.filter((task) => {
    const due = new Date(task.dueAt).getTime();
    return due >= now - 7 * 24 * 60 * 60 * 1000 && due <= now;
  });
  const missedTasks = weeklyTasks.filter((task) => getTaskStatus(task) === 'Missed');
  const completedOnTime = weeklyTasks.filter((task) => getTaskStatus(task) === 'Completed On Time').length;
  const completedLate = weeklyTasks.filter((task) => getTaskStatus(task) === 'Completed Late').length;
  const taskCompletionRate = weeklyTasks.length ? Math.round(((completedOnTime + completedLate) / weeklyTasks.length) * 100) : 0;

  useEffect(() => {
    let active = true;
    reportApi.getWeeklyReport()
      .then(({ report: data }) => { if (active) setReport(data); })
      .catch((requestError) => { if (active) setError(requestError?.message || 'Unable to load the weekly report.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      const result = await reportApi.downloadWeeklyReport();
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to download the weekly report.');
    } finally {
      setDownloading(false);
    }
  };

  const score = Number(report?.score ?? report?.average_posture_score);
  const risk = Number(report?.risk ?? report?.average_risk);
  const sittingHours = Number(report?.sittingHours ?? report?.sitting_hours);
  const alerts = Number(report?.alerts ?? report?.break_count);
  const stats = [
    { label: 'Average posture score', value: Number.isFinite(score) ? `${score}/100` : '—', icon: Activity },
    { label: 'Average Ergonomic Wellness Risk', value: Number.isFinite(risk) ? `${risk}/100` : '—', icon: Sparkles },
    { label: 'Total sitting time', value: Number.isFinite(sittingHours) ? `${sittingHours} hrs` : '—', icon: Clock3 },
    { label: 'Breaks / alerts logged', value: Number.isFinite(alerts) ? alerts : '—', icon: CalendarDays },
  ];

  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div><h1>Your Weekly Posture Report</h1><p>A wellness-focused view of your recent posture habits.</p></div>
        <button className="btn primary" onClick={download} disabled={loading || downloading || !report}><ArrowDownToLine size={16} />{downloading ? 'Preparing...' : import.meta.env.DEV && isPreviewMode() ? 'Download preview' : 'Download PDF'}</button>
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      {loading ? (
        <div className="reports-stats">{stats.map((stat) => <div className="card report-skeleton" key={stat.label}><div /><div /></div>)}</div>
      ) : report ? (
        <>
          <div className="reports-stats">{stats.map(({ label, value, icon: Icon }) => (
            <div className="card report-stat" key={label}><span><Icon size={17} /></span><small>{label}</small><strong>{value}</strong></div>
          ))}</div>
          <div className="reports-grid">
            <TrendChart data={report.trends || []} />
            <section className="card report-summary"><h2>Weekly overview</h2><dl>
              <div><dt>Best day</dt><dd>{report.bestDay || 'Not available'}</dd></div>
              <div><dt>Most common posture issue</dt><dd>{report.postureClass || report.most_common_issue || 'Not available'}</dd></div>
              <div><dt>Improvement vs previous week</dt><dd>{Number.isFinite(Number(report.improved)) ? `${report.improved}%` : 'Not available'}</dd></div>
            </dl></section>
          </div>
          <section className="card report-guidance">
            <div><h2>Suggested focus for next week</h2><p>Use your monitoring and break routines consistently to build a clearer personal trend. Any score shown here is a wellness indicator, not a medical finding.</p></div>
            <span className="report-note"><Sparkles size={18} />Wellness insights are not medical advice.</span>
          </section>
          <section className="card report-goals">
            <div className="report-goals-heading"><div><h2>Goals &amp; Tasks</h2><p>Wellness goals due in the past seven days.</p></div>{isMockApiMode() && <Badge tone="warning">Demo Data</Badge>}</div>
            <div className="report-goals-stats">
              <div><small>Completed on time</small><strong>{completedOnTime}</strong></div>
              <div><small>Completed late</small><strong>{completedLate}</strong></div>
              <div><small>Missed</small><strong>{missedTasks.length}</strong></div>
              <div><small>Completion rate</small><strong>{taskCompletionRate}%</strong></div>
            </div>
            {missedTasks.length ? <div className="report-missed-list"><h3>Missed goals · suggested retries</h3>{missedTasks.map((task) => <div key={task.id}><span><strong>{task.title}</strong><small>{task.failureReason || `${task.progress} of ${task.target} ${task.unit} completed.`}</small></span><button className="btn secondary" onClick={() => retryTask(task.id)}>Retry</button></div>)}</div> : <p className="report-goals-empty">No missed goals in this period.</p>}
          </section>
        </>
      ) : (
        <div className="card report-empty"><CalendarDays size={27} /><strong>Your weekly report will appear after activity has been recorded.</strong><span>Start a monitoring session to begin collecting wellness history.</span></div>
      )}
    </div>
  );
}
