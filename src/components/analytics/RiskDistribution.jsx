import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const data = [
  { name: 'Low', value: 46 },
  { name: 'Medium', value: 38 },
  { name: 'High', value: 16 },
];
const colors = ['var(--success)', 'var(--warning)', 'var(--danger)'];

export default function RiskDistribution() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><h3>Risk distribution</h3><span className="badge info">Demo Data</span></div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={84} paddingAngle={4}>
              {data.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
