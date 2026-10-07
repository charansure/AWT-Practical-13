"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createTask, deleteTask, getTasks, updateTask } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import TaskForm from "./TaskForm";
import TaskItem from "./TaskItem";
import StatsChart from "./StatsChart";

// Code splitting: the activity feed is empty on first load, so load it lazily
const ActivityFeed = dynamic(() => import("./ActivityFeed"), {
  ssr: false,
  loading: () => <div className="card empty">Loading activity...</div>,
});

const NEXT_STATUS = { todo: "in-progress", "in-progress": "done", done: "todo" };
const FILTERS = ["all", "todo", "in-progress", "done"];

export default function TaskBoard({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activity, setActivity] = useState([]);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [flashIds, setFlashIds] = useState([]);
  const [error, setError] = useState("");

  // ---------- state helpers (safe to call twice for the same task) ----------
  const upsertTask = useCallback((task) => {
    setTasks((prev) =>
      prev.some((t) => t._id === task._id)
        ? prev.map((t) => (t._id === task._id ? task : t))
        : [task, ...prev]
    );
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const flash = useCallback((id) => {
    setFlashIds((prev) => [...prev, id]);
    setTimeout(() => setFlashIds((prev) => prev.filter((x) => x !== id)), 1500);
  }, []);

  // ---------- real-time: listen to Socket.IO events from the backend ----------
  useEffect(() => {
    let socket = null;
    let cancelled = false;

    const handlers = {
      connect: () => {
        setConnected(true);
        getTasks().then(setTasks).catch(() => {}); // re-sync after (re)connecting
      },
      disconnect: () => setConnected(false),
      "task:created": (task) => {
        upsertTask(task);
        flash(task._id);
      },
      "task:updated": (task) => {
        upsertTask(task);
        flash(task._id);
      },
      "task:deleted": ({ id }) => removeTask(id),
      activity: (item) => setActivity((prev) => [item, ...prev].slice(0, 8)),
      "clients:count": (count) => setOnline(count),
    };

    // socket.io-client is lazy loaded (see lib/socket.js)
    getSocket().then((s) => {
      if (cancelled) return;
      socket = s;
      Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
      if (socket.connected) handlers.connect();
    });

    return () => {
      cancelled = true;
      if (socket) {
        Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      }
    };
  }, [upsertTask, removeTask, flash]);

  // ---------- CRUD actions (call the REST API) ----------
  const handleSave = async (data) => {
    setError("");
    try {
      if (editing) {
        const updated = await updateTask(editing._id, data);
        upsertTask(updated);
        setEditing(null);
      } else {
        const created = await createTask(data);
        upsertTask(created);
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteTask(id);
      removeTask(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMove = async (task) => {
    setError("");
    try {
      const updated = await updateTask(task._id, { status: NEXT_STATUS[task.status] });
      upsertTask(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- derived data for the live chart ----------
  const stats = useMemo(() => {
    const counts = { todo: 0, "in-progress": 0, done: 0 };
    tasks.forEach((t) => {
      counts[t.status] += 1;
    });
    return counts;
  }, [tasks]);

  const visibleTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <>
      <div className="badges">
        <span className={`badge ${connected ? "on" : "off"}`}>
          {connected ? "● Live (connected)" : "● Offline (reconnecting...)"}
        </span>
        <span className="badge info">👥 {online} viewer(s) online</span>
        <span className="badge info">📋 {tasks.length} task(s)</span>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <div className="left">
          <TaskForm editing={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          <StatsChart stats={stats} />
          <ActivityFeed items={activity} />
        </div>

        <div className="right">
          <div className="filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {visibleTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              flashing={flashIds.includes(task._id)}
              onMove={handleMove}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
          {visibleTasks.length === 0 && <p className="empty">No tasks to show.</p>}
        </div>
      </div>
    </>
  );
}
