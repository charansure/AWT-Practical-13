"use client";

const STATUS_LABEL = { todo: "To Do", "in-progress": "In Progress", done: "Done" };

export default function TaskItem({ task, flashing, onMove, onEdit, onDelete }) {
  return (
    <div className={`task ${flashing ? "flash" : ""}`}>
      <div className="task-top">
        <h3>{task.title}</h3>
        <span className={`pill ${task.priority}`}>{task.priority}</span>
      </div>
      {task.description && <p className="desc">{task.description}</p>}
      <div className="task-bottom">
        <span className={`status ${task.status}`}>{STATUS_LABEL[task.status]}</span>
        <div className="actions">
          <button onClick={() => onMove(task)}>Move &rarr;</button>
          <button onClick={() => onEdit(task)}>Edit</button>
          <button className="danger" onClick={() => onDelete(task._id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
