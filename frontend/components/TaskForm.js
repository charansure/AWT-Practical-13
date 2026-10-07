"use client";

import { useEffect, useState } from "react";

const EMPTY = { title: "", description: "", priority: "medium", status: "todo" };

export default function TaskForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);

  // fill the form when "Edit" is clicked, clear it when editing stops
  useEffect(() => {
    setForm(
      editing
        ? {
            title: editing.title,
            description: editing.description || "",
            priority: editing.priority,
            status: editing.status,
          }
        : EMPTY
    );
  }, [editing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSave(form);
    if (success && !editing) setForm(EMPTY);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{editing ? "Edit Task" : "Add Task"}</h2>

      <input name="title" placeholder="Task title" value={form.title} onChange={handleChange} required />
      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={2}
        value={form.description}
        onChange={handleChange}
      />

      <div className="row">
        <select name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="row">
        <button type="submit" className="btn">
          {editing ? "Update Task" : "Add Task"}
        </button>
        {editing && (
          <button type="button" className="btn gray" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
