import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function TrendChart({ data }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><h3>Wellness trend</h3></div>
      {!data.length ? <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>No trend data is available yet.</div> : (
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip />
            <Line type="monotone" dataKey="risk" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
