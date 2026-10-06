import { Activity, Clock3, HeartPulse, Layers3 } from 'lucide-react';
import StatCard from '../common/StatCard';

export default function KpiGrid({ current, history = [] }) {
  const postureScore = Number(current?.score);
  const wellnessRisk = Number(current?.risk);
  const sessionDuration = Number(current?.duration);
  return (
    <div className="grid grid-4">
      <StatCard icon={Activity} label="Latest posture score" value={Number.isFinite(postureScore) ? postureScore : null} tone="success" />
      <StatCard icon={HeartPulse} label="Wellness risk" value={Number.isFinite(wellnessRisk) ? wellnessRisk : null} tone={wellnessRisk >= 60 ? 'danger' : 'warning'} />
      <StatCard icon={Clock3} label="Current session" value={Number.isFinite(sessionDuration) ? sessionDuration : null} suffix="m" tone="primary" />
      <StatCard icon={Layers3} label="Recorded sessions" value={history.length} tone="success" />
    </div>
  );
}
