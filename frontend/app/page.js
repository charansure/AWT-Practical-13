import TaskBoard from "@/components/TaskBoard";
import { API_URL } from "@/lib/api";

// Always render on the server with fresh data from the backend
export const dynamic = "force-dynamic";

async function loadTasks() {
  try {
    const res = await fetch(`${API_URL}/api/tasks`, { cache: "no-store" });
    if (!res.ok) return { tasks: [], failed: true };
    const json = await res.json();
    return { tasks: json.data, failed: false };
  } catch {
    return { tasks: [], failed: true };
  }
}

export default async function HomePage() {
  const { tasks, failed } = await loadTasks();

  return (
    <>
      <h1>Live Task Board</h1>
      <p className="subtitle">Next.js frontend + Node.js/Express API + MongoDB + Socket.IO</p>
      {failed && (
        <p className="error">
          Could not reach the backend at {API_URL}. Start it with <code>npm run dev</code> in the
          backend folder.
        </p>
      )}
      <TaskBoard initialTasks={tasks} />
    </>
  );
}
