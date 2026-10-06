import { mockAchievements } from '../../data/mockData';
import { apiConfig } from '../../api/client';

export default function Achievements() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="page-header">
        <div><h1>Achievements</h1><p>Small milestones for consistent wellness habits.</p></div>
        <span className="badge info">{apiConfig.useMockApi ? 'Demo Data' : 'Preview only'}</span>
      </div>
      {apiConfig.useMockApi ? <div className="grid grid-2">
        {mockAchievements.map((achievement) => (
          <div key={achievement.id} className="card" style={{ padding: 22, opacity: achievement.unlocked ? 1 : 0.7 }}>
            <div style={{ fontWeight: 800 }}>{achievement.title}</div>
            <p>{achievement.description}</p>
            <span className={`badge ${achievement.unlocked ? 'success' : 'warning'}`}>{achievement.unlocked ? 'Unlocked' : 'In progress'}</span>
          </div>
        ))}
      </div> : <div className="card" style={{ padding: 22 }}><p>Achievement data is not available from the connected backend yet.</p></div>}
    </div>
  );
}
