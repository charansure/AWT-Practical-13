"use client";

export default function ActivityFeed({ items }) {
  return (
    <div className="card">
      <h2>Live Activity</h2>
      {items.length === 0 && <p className="empty">Waiting for activity... add or edit a task!</p>}
      <ul className="feed">
        {items.map((item) => (
          <li key={item.id}>
            <span className="time">{new Date(item.time).toLocaleTimeString()}</span> {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
