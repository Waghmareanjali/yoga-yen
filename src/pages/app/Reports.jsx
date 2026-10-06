import { useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, CalendarDays, Clock3, Sparkles } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import { apiConfig } from '../../api/client';
import TrendChart from '../../components/analytics/TrendChart';
import AuthAlert from '../../components/auth/AuthAlert';
import './reports.css';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
    setNotice('');
    try {
      const result = await reportApi.downloadWeeklyReport();
      if (result.demo) {
        setNotice('PDF export is available when the FastAPI report download endpoint is connected. Demo data has not been exported.');
        return;
      }
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
        <div><span className="badge info">{apiConfig.useMockApi ? 'Demo Data' : 'Weekly summary'}</span><h1>Your Weekly Posture Report</h1><p>A wellness-focused view of your recent posture habits.</p></div>
        <button className="btn primary" onClick={download} disabled={loading || downloading || !report}><ArrowDownToLine size={16} />{downloading ? 'Preparing...' : 'Download PDF'}</button>
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="info">{notice}</AuthAlert>}
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
          {apiConfig.useMockApi && <p className="reports-footnote">Preview values are illustrative Demo Data. They do not represent measured activity or real model results.</p>}
        </>
      ) : (
        <div className="card report-empty"><CalendarDays size={27} /><strong>Your weekly report will appear after activity has been recorded.</strong><span>Start a monitoring session to begin collecting wellness history.</span></div>
      )}
    </div>
  );
}
