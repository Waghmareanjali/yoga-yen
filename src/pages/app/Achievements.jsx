import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Award, CalendarClock, CheckCircle2, CirclePlus, Clock3, Flame, ListChecks, Plus, Search, Target, Trophy, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { achievementsApi } from '../../api/achievementsApi';
import { isMockApiMode } from '../../data/previewData';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import AuthAlert from '../../components/auth/AuthAlert';
import { useTaskStore } from '../../store/taskStore';
import { getTaskMetrics, getTaskStatus, getTaskStatusTone, isTaskInRange } from '../../utils/taskStatus';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import './achievements.css';

const categories = ['Posture', 'Breaks', 'Exercise', 'Monitoring', 'Habit'];
const priorities = ['Low', 'Medium', 'High'];
const tabs = ['All', 'In Progress', 'Completed', 'Missed'];

function StatusIcon({ status, isAtRisk }) {
  if (isAtRisk || status === 'Missed') return <AlertTriangle size={12} aria-hidden="true" />;
  if (status === 'Completed On Time') return <CheckCircle2 size={12} aria-hidden="true" />;
  if (status === 'Completed Late') return <Clock3 size={12} aria-hidden="true" />;
  if (status === 'In Progress') return <Activity size={12} aria-hidden="true" />;
  return <CalendarClock size={12} aria-hidden="true" />;
}

function formatDue(task, now = Date.now()) {
  const metrics = getTaskMetrics(task, now);
  if (metrics.status === 'Missed') return `Overdue by ${metrics.overdueBy}`;
  if (metrics.status.startsWith('Completed')) return `Due ${new Date(task.dueAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
  return `Due in ${metrics.timeLeft}`;
}

function buildChartData(tasks) {
  const weeks = new Map();
  tasks.forEach((task) => {
    const date = new Date(task.dueAt);
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const name = start.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const row = weeks.get(name) || { week: name, onTime: 0, late: 0, missed: 0, completed: 0, total: 0 };
    const status = getTaskStatus(task);
    if (status === 'Completed On Time') row.onTime += 1;
    if (status === 'Completed Late') row.late += 1;
    if (status === 'Missed') row.missed += 1;
    if (status.startsWith('Completed')) row.completed += 1;
    row.total += 1;
    weeks.set(name, row);
  });
  return [...weeks.values()].slice(-6).map((row) => ({ ...row, rate: row.total ? Math.round((row.onTime / row.total) * 100) : 0 }));
}

function TaskCard({ task, onOpen, onProgress }) {
  const metrics = getTaskMetrics(task);
  const tone = getTaskStatusTone(metrics.status, metrics.isAtRisk);
  return (
    <motion.article className={`task-card task-card-${tone}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} whileHover={{ y: -2 }}>
      <button type="button" className="task-card-main" onClick={() => onOpen(task)} aria-label={`Open ${task.title}`}>
        <span className="task-card-title-row"><strong>{task.title}</strong><Badge tone={tone}><StatusIcon status={metrics.status} isAtRisk={metrics.isAtRisk} />{metrics.isAtRisk ? 'At Risk' : metrics.status}</Badge></span>
        <span className="task-card-badges"><Badge tone="neutral">{task.category}</Badge><Badge tone={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'neutral'}>{task.priority} priority</Badge></span>
        <span className="task-progress-track" aria-label={`${metrics.percentComplete}% complete`}><span style={{ width: `${metrics.percentComplete}%` }} /></span>
        <span className="task-progress-copy">{task.progress}/{task.target} {task.unit} · {metrics.percentComplete}% done · {metrics.remaining} left</span>
        <span className="task-due-line"><CalendarClock size={15} />{formatDue(task)}</span>
        {metrics.status === 'Completed On Time' && <span className="task-result-line"><CheckCircle2 size={14} />Completed on time</span>}
        {metrics.status === 'Completed Late' && <span className="task-result-line"><Clock3 size={14} />Completed late</span>}
        {metrics.status === 'Missed' && <span className="task-result-line task-missed-copy">{task.failureReason || `Completed ${task.progress} of ${task.target} ${task.unit}.`}</span>}
      </button>
      <div className="task-card-actions">
        {metrics.status === 'Missed'
          ? <button type="button" className="btn secondary" onClick={() => onProgress(task, 'retry')}>Retry</button>
          : !metrics.status.startsWith('Completed') && <button type="button" className="btn secondary" onClick={() => onProgress(task, 'increment')} disabled={metrics.remaining <= 0}>+1 progress</button>}
        <span className="task-points"><Award size={14} />{task.points} pts</span>
      </div>
    </motion.article>
  );
}

function TaskModal({ task, onClose, onProgress, onDelete, onRetry }) {
  const [amount, setAmount] = useState(1);
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onClose);
  if (!task) return null;
  const metrics = getTaskMetrics(task);
  const history = task.progressHistory?.length
    ? task.progressHistory.map((item) => ({ ...item, label: new Date(item.at).toLocaleDateString([], { month: 'short', day: 'numeric' }) }))
    : [{ at: task.startedAt || task.dueAt, progress: 0, label: 'Start' }, { at: task.dueAt, progress: task.progress, label: 'Current' }];
  return (
    <div className="task-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.section ref={dialogRef} tabIndex="-1" className="task-modal card" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
        <div className="task-modal-heading"><div><Badge tone={getTaskStatusTone(metrics.status, metrics.isAtRisk)}><StatusIcon status={metrics.status} isAtRisk={metrics.isAtRisk} />{metrics.isAtRisk ? 'At Risk' : metrics.status}</Badge><h2 id="task-detail-title">{task.title}</h2></div><button className="btn ghost" onClick={onClose} aria-label="Close task details"><X size={16} /></button></div>
        <p>{task.description}</p>
        <div className="task-detail-facts"><span>{task.category}</span><span>{task.priority} priority</span><span>Assigned by {task.assignedBy}</span><span>{task.points} points</span></div>
        <div className="task-detail-progress"><div className="task-progress-track"><span style={{ width: `${metrics.percentComplete}%` }} /></div><strong>{task.progress}/{task.target} {task.unit}</strong><small>{metrics.percentComplete}% done · {metrics.remaining} left · {formatDue(task)}</small></div>
        <h3>Progress history</h3>
        <div className="task-chart-wrap" role="img" aria-label={`Task progress history, current progress ${task.progress} of ${task.target} ${task.unit}.`}>
          <ResponsiveContainer width="100%" height={180}><LineChart data={history}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} /><YAxis allowDecimals={false} domain={[0, task.target]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="progress" name="Progress" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} isAnimationActive /></LineChart></ResponsiveContainer>
        </div>
        <div className="task-timeline"><strong>Timeline</strong><span>Assigned · {task.startedAt ? new Date(task.startedAt).toLocaleString() : 'Not started'}</span>{task.completedAt && <span>{metrics.status} · {new Date(task.completedAt).toLocaleString()}</span>}{metrics.status === 'Missed' && <span>Missed · {new Date(task.dueAt).toLocaleString()}</span>}</div>
        <div className="task-modal-actions">
          {!metrics.status.startsWith('Completed') && metrics.status !== 'Missed' && <>
            <label>Progress increment<input type="number" min="1" max={metrics.remaining} value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))} /></label>
            <button className="btn secondary" onClick={() => onProgress(task, 'increment', amount)}>Update Progress</button>
            <button className="btn primary" onClick={() => onProgress(task, 'complete')}>Mark Complete</button>
          </>}
          {metrics.status === 'Missed' && <button className="btn primary" onClick={() => onRetry(task)}>Retry</button>}
          <button className="btn ghost task-delete-button" onClick={() => onDelete(task)}>Delete</button>
        </div>
      </motion.section>
    </div>
  );
}

function AddTaskModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Habit', target: '1', unit: 'sessions', dueAt: '', priority: 'Medium' });
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onClose);
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('Enter a goal title.');
    if (!Number.isInteger(Number(form.target)) || Number(form.target) < 1) return setError('Target must be a whole number greater than zero.');
    if (!form.unit.trim()) return setError('Enter a unit for the target.');
    if (!form.dueAt || new Date(form.dueAt).getTime() <= Date.now()) return setError('Choose a deadline in the future.');
    onSave({ ...form, title: form.title.trim(), target: Number(form.target), progress: 0, dueAt: new Date(form.dueAt).toISOString(), points: 10, assignedBy: 'Self', status: 'Not Started', startedAt: null, completedAt: null, failureReason: null });
  };
  return (
    <div className="task-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.form ref={dialogRef} tabIndex="-1" className="task-modal card task-form-modal" role="dialog" aria-modal="true" aria-labelledby="add-task-title" onSubmit={submit} onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 id="add-task-title">Add Task / Set Goal</h2>
        <label>Title<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="task-form-grid">
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label>Target<input required type="number" min="1" step="1" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></label>
          <label>Unit<input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label>
        </div>
        <label>Due date and time<input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></label>
        {error && <p className="task-form-error" role="alert">{error}</p>}
        <div className="task-modal-actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" type="submit"><Plus size={15} />Create goal</button></div>
      </motion.form>
    </div>
  );
}

export default function Achievements() {
  const tasks = useTaskStore((state) => state.tasks);
  const loading = useTaskStore((state) => state.loading);
  const error = useTaskStore((state) => state.error);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTaskProgress = useTaskStore((state) => state.updateTaskProgress);
  const markComplete = useTaskStore((state) => state.markComplete);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const retryTask = useTaskStore((state) => state.retryTask);
  const [achievements, setAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('due');
  const [category, setCategory] = useState('All');
  const [range, setRange] = useState('week');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState('');
  const [restartedAfterMissId, setRestartedAfterMissId] = useState(null);
  const loadTasks = useTaskStore((state) => state.loadTasks);

  useEffect(() => {
    achievementsApi.getAchievements().then(setAchievements).catch((requestError) => setActionError(requestError?.message || 'Unable to load badges.'));
  }, []);

  const scopedTasks = useMemo(() => tasks.filter((task) => isTaskInRange(task, range)), [tasks, range]);
  const metrics = useMemo(() => scopedTasks.map((task) => ({ task, ...getTaskMetrics(task) })), [scopedTasks]);
  const counts = useMemo(() => ({
    total: metrics.length,
    onTime: metrics.filter((item) => item.status === 'Completed On Time').length,
    late: metrics.filter((item) => item.status === 'Completed Late').length,
    missed: metrics.filter((item) => item.status === 'Missed').length,
    inProgress: metrics.filter((item) => item.status === 'In Progress').length,
    completeRate: metrics.length ? Math.round((metrics.filter((item) => item.status.startsWith('Completed')).length / metrics.length) * 100) : 0,
  }), [metrics]);
  const chartData = useMemo(() => buildChartData(scopedTasks), [scopedTasks]);
  const categoryData = useMemo(() => categories.map((name) => {
    const matching = scopedTasks.filter((task) => task.category === name);
    const complete = matching.filter((task) => getTaskStatus(task).startsWith('Completed')).length;
    return { category: name, progress: matching.length ? Math.round((matching.reduce((sum, task) => sum + getTaskMetrics(task).percentComplete, 0) / matching.length)) : 0, complete, total: matching.length };
  }), [scopedTasks]);
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = scopedTasks.filter((task) => {
      const status = getTaskStatus(task);
      const tabMatches = activeTab === 'All' || (activeTab === 'In Progress' && status === 'In Progress') || (activeTab === 'Completed' && status.startsWith('Completed')) || (activeTab === 'Missed' && status === 'Missed');
      return tabMatches && (category === 'All' || task.category === category) && (!query || `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(query));
    });
    return filtered.sort((left, right) => {
      if (sort === 'progress') return getTaskMetrics(right).percentComplete - getTaskMetrics(left).percentComplete;
      if (sort === 'priority') return priorities.indexOf(right.priority) - priorities.indexOf(left.priority);
      return new Date(left.dueAt) - new Date(right.dueAt);
    });
  }, [scopedTasks, activeTab, category, search, sort]);

  const onProgress = async (task, action, amount = 1) => {
    setActionError('');
    try {
      if (action === 'retry') await retryTask(task.id);
      else if (action === 'complete') await markComplete(task.id);
      else await updateTaskProgress(task.id, amount);
      setSelectedTask(null);
    } catch (requestError) {
      setActionError(requestError?.message || 'Unable to update this goal.');
    }
  };
  const onDelete = async (task) => {
    try { await deleteTask(task.id); setSelectedTask(null); } catch (requestError) { setActionError(requestError?.message || 'Unable to delete this goal.'); }
  };
  const handleCreate = async (payload) => {
    try { await createTask(payload); setShowAdd(false); } catch (requestError) { setActionError(requestError?.message || 'Unable to create this goal.'); }
  };
  const totalProgress = counts.total ? Math.round(((counts.onTime + counts.late) / counts.total) * 100) : 0;
  const points = scopedTasks.filter((task) => getTaskStatus(task).startsWith('Completed')).reduce((sum, task) => sum + (Number(task.points) || 0), 0);
  const onTimeDays = new Set(scopedTasks.filter((task) => getTaskStatus(task) === 'Completed On Time').map((task) => new Date(task.completedAt).toDateString())).size;
  const latestMissedTask = [...scopedTasks].filter((task) => getTaskStatus(task) === 'Missed').sort((left, right) => new Date(right.dueAt) - new Date(left.dueAt))[0];
  const latestCompletedAt = Math.max(0, ...scopedTasks.filter((task) => getTaskStatus(task) === 'Completed On Time').map((task) => new Date(task.completedAt).getTime()));
  const streakLost = Boolean(latestMissedTask && new Date(latestMissedTask.dueAt).getTime() > latestCompletedAt) && restartedAfterMissId !== latestMissedTask.id;

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <div><Badge tone="info">Progress &amp; goals</Badge><h1>Achievements &amp; Goals</h1><p>Track supportive, practical wellness goals at your own pace.</p></div>
        <div className="achievements-header-actions">{isMockApiMode() && <Badge tone="warning">Demo Data</Badge>}<button className="btn primary" onClick={() => setShowAdd(true)}><CirclePlus size={17} />Add Task / Set Goal</button></div>
      </div>
      {(error || actionError) && (
        <div>
          <AuthAlert>{error || actionError}</AuthAlert>
          {error && <button className="btn secondary" onClick={loadTasks}>Retry loading tasks</button>}
        </div>
      )}
      <div className="task-range-control"><label htmlFor="task-range">Time range</label><select id="task-range" value={range} onChange={(event) => setRange(event.target.value)}><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="all">All Tasks</option></select></div>

      <div className="task-stat-grid">
        <StatCard icon={ListChecks} label="Total Tasks" value={counts.total} tone="primary" />
        <StatCard icon={CheckCircle2} label="Completed On Time" value={counts.onTime} tone="success" />
        <StatCard icon={Clock3} label="Completed Late" value={counts.late} tone="warning" />
        <StatCard icon={Target} label="Missed" value={counts.missed} tone="danger" />
        <StatCard icon={Activity} label="In Progress" value={counts.inProgress} tone="primary" />
        <StatCard icon={Trophy} label="Completion Rate" value={counts.completeRate} suffix="%" tone="success" />
      </div>

      <section className="card goals-progress-card">
        <div className="goals-score"><div className="circular-score" style={{ '--score': `${totalProgress}%` }}><span>{totalProgress}%</span><small>complete</small></div><div><h2>Overall Progress</h2><p>{counts.onTime + counts.late} completed · {Math.max(0, counts.total - counts.onTime - counts.late)} remaining in this range</p></div></div>
        <div className="task-segmented-progress" aria-label={`${counts.onTime} completed on time, ${counts.late} completed late, ${counts.inProgress} in progress, ${counts.missed} missed, ${Math.max(0, counts.total - counts.onTime - counts.late - counts.inProgress - counts.missed)} not started`}>
          {[
            ['onTime', 'var(--success)'], ['late', 'var(--warning)'], ['inProgress', 'var(--info)'], ['missed', 'var(--danger)'],
          ].map(([key, color]) => <span key={key} style={{ width: `${counts.total ? (counts[key] / counts.total) * 100 : 0}%`, background: color }} />)}
          <span style={{ flex: 1, background: 'var(--surface-alt)' }} />
        </div>
        <div className="task-legend"><span><i className="legend-on-time" />On time</span><span><i className="legend-late" />Late</span><span><i className="legend-progress" />In progress</span><span><i className="legend-missed" />Missed</span><span><i className="legend-idle" />Not started</span></div>
      </section>

      <section className="task-streak-grid">
        <article className="card task-streak-card"><Flame size={21} /><div><small>Points earned</small><strong>{points}</strong></div><span>from completed goals</span></article>
        <article className="card task-streak-card"><Activity size={21} /><div><small>{streakLost ? 'Previous streak' : 'Current streak'}</small><strong>{streakLost ? `${onTimeDays} days` : `${onTimeDays} days`}</strong></div><span>{streakLost ? 'A fresh start is always available.' : 'On-time goal days in this range'}</span></article>
        <article className="card task-streak-card"><Trophy size={21} /><div><small>Best streak</small><strong>{Math.max(onTimeDays, 2)} days</strong></div><span>Keep a comfortable rhythm</span></article>
        <article className="card task-streak-card task-streak-action"><div><small>Streak status</small><strong>{streakLost ? 'Streak lost' : 'Building consistency'}</strong><span>{streakLost ? `Streak reset on ${new Date(latestMissedTask.dueAt).toLocaleDateString()}` : 'Small steps still count.'}</span></div><button className="btn secondary" onClick={() => setRestartedAfterMissId(latestMissedTask?.id || null)}>{streakLost ? 'Start a new streak' : 'View badges'}</button></article>
      </section>

      <section className="card task-badges"><div className="task-section-heading"><div><Badge tone="neutral">Milestones</Badge><h2>Badges</h2></div><Award size={20} /></div>
        {achievements.length ? <div className="task-badge-grid">{achievements.map((achievement) => <article key={achievement.id || achievement._id}><Trophy size={19} /><span><strong>{achievement.title}</strong><small>{achievement.description}</small></span><Badge tone={achievement.status === 'Completed' ? 'success' : 'neutral'}>{achievement.status || 'Locked'}</Badge></article>)}</div> : <p>Milestones will appear here as your activity is recorded.</p>}
      </section>

      <section className="tasks-section">
        <div className="task-section-heading"><div><Badge tone="neutral">Your plan</Badge><h2>Tasks &amp; goals</h2></div><button className="btn secondary" onClick={() => setShowAdd(true)}><Plus size={15} />Add goal</button></div>
        <div className="task-filters">
          <div className="task-tabs" role="tablist" aria-label="Filter tasks">{tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
          <label className="task-search"><Search size={15} /><input type="search" placeholder="Search goals" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search goals" /></label>
          <label className="task-filter-label">Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="task-filter-label">Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="due">Due date</option><option value="progress">Progress</option><option value="priority">Priority</option></select></label>
        </div>
        {loading ? <div className="task-list-skeleton" aria-label="Loading tasks"><span /><span /><span /></div> : filteredTasks.length ? (
          <AnimatePresence mode="popLayout"><div className="task-list">{filteredTasks.map((task) => <TaskCard key={task.id} task={task} onOpen={setSelectedTask} onProgress={onProgress} />)}</div></AnimatePresence>
        ) : <div className="card task-empty"><ListChecks size={24} /><strong>{tasks.length ? 'No tasks match these filters.' : 'No tasks yet. Set your first wellness goal.'}</strong>{tasks.length > 0 && <button className="btn ghost" onClick={() => { setActiveTab('All'); setCategory('All'); setSearch(''); }}>Clear filters</button>}</div>}
      </section>

      <section className="task-charts-grid">
        <ChartCard title="Completed vs Missed by Week" data={chartData} type="bar" />
        <ChartCard title="On-Time Completion Rate" data={chartData} type="line" />
        <ChartCard title="Progress by Category" data={categoryData} type="category" />
      </section>
      <div className="task-screen-reader-summary" aria-live="polite">{counts.total} tasks. {counts.onTime} completed on time, {counts.late} completed late, {counts.missed} missed, {counts.inProgress} in progress.</div>
      <AnimatePresence>{selectedTask && <TaskModal task={tasks.find((item) => item.id === selectedTask.id) || selectedTask} onClose={() => setSelectedTask(null)} onProgress={onProgress} onDelete={onDelete} onRetry={(task) => onProgress(task, 'retry')} />}</AnimatePresence>
      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={handleCreate} />}
    </div>
  );
}

function ChartCard({ title, data, type }) {
  return (
    <section className="card task-chart-card">
      <h2>{title}</h2>
      <div className="task-chart-wrap" role="img" aria-label={`${title}. Chart contains ${data.length} data points.`}>
        <ResponsiveContainer width="100%" height={220}>
          {type === 'bar' ? <BarChart data={data}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><Tooltip /><Bar dataKey="onTime" name="On time" stackId="complete" fill="var(--success)" radius={[3, 3, 0, 0]} /><Bar dataKey="late" name="Late" stackId="complete" fill="var(--warning)" /><Bar dataKey="missed" name="Missed" stackId="missed" fill="var(--danger)" /></BarChart>
            : type === 'line' ? <LineChart data={data}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><Tooltip formatter={(value) => `${value}%`} /><Line type="monotone" dataKey="rate" name="On time" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
              : <BarChart data={data} layout="vertical"><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><YAxis type="category" dataKey="category" width={80} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><Tooltip formatter={(value) => `${value}%`} /><Bar dataKey="progress" name="Progress" fill="var(--primary)" radius={[0, 6, 6, 0]} /></BarChart>}
        </ResponsiveContainer>
      </div>
      <p className="task-chart-summary">{title}: {data.map((row) => `${row.week || row.category}, ${row.onTime ?? row.progress ?? 0}${row.week ? ` on time and ${row.missed} missed` : '% progress'}`).join('; ') || 'No data yet.'}</p>
    </section>
  );
}
