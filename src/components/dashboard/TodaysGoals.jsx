import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import Badge from '../common/Badge';
import { useTaskStore } from '../../store/taskStore';
import { getTaskMetrics, isTaskInRange } from '../../utils/taskStatus';
import { isMockApiMode } from '../../data/previewData';
import './todays-goals.css';

export default function TodaysGoals() {
  const tasks = useTaskStore((state) => state.tasks);
  const todays = tasks.filter((task) => isTaskInRange(task, 'today'))
    .sort((left, right) => Number(getTaskMetrics(right).isAtRisk) - Number(getTaskMetrics(left).isAtRisk))
    .slice(0, 3);
  return (
    <section className="card todays-goals">
      <div className="todays-goals-heading"><div><span><Target size={17} /></span><div><h2>Today&apos;s Goals</h2><p>Small, manageable steps for today.</p></div></div><Link to="/achievements">All goals <ArrowRight size={14} /></Link></div>
      {isMockApiMode() && <Badge tone="warning">Demo Data</Badge>}
      {todays.length ? <div className="todays-goals-list">{todays.map((task) => {
        const metrics = getTaskMetrics(task);
        return <div className="todays-goal-item" key={task.id}>
          <div className="todays-goal-title"><strong>{task.title}</strong>{metrics.isAtRisk && <Badge tone="warning">At Risk</Badge>}</div>
          <div className="todays-goal-track"><span style={{ width: `${metrics.percentComplete}%` }} /></div>
          <small>{metrics.percentComplete}% · {metrics.remaining} {task.unit} remaining</small>
        </div>;
      })}</div> : <p className="todays-goals-empty">No goals due today. <Link to="/achievements">Set a wellness goal</Link></p>}
    </section>
  );
}
