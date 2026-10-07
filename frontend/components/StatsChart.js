"use client";

const LABELS = { todo: "To Do", "in-progress": "In Progress", done: "Done" };

// Simple animated bar chart - bars grow/shrink as the numbers change in real time
export default function StatsChart({ stats }) {
  const values = Object.values(stats);
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, v) => sum + v, 0);
  const percentDone = total ? Math.round((stats.done / total) * 100) : 0;

  return (
    <div className="card">
      <h2>Live Statistics</h2>
      <div className="chart">
        {Object.entries(stats).map(([key, value]) => (
          <div className="bar-col" key={key}>
            <span className="bar-value">{value}</span>
            <div className="bar-track">
              <div className={`bar ${key}`} style={{ height: `${(value / max) * 100}%` }} />
            </div>
            <span className="bar-label">{LABELS[key]}</span>
          </div>
        ))}
      </div>
      <p className="progress-text">Completed: {percentDone}%</p>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${percentDone}%` }} />
      </div>
    </div>
  );
}
