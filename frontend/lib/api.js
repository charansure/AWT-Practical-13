// Backend URL comes from the environment:
//  - local:  frontend/.env.local
//  - Vercel: Project Settings -> Environment Variables
// (must be written exactly as process.env.NEXT_PUBLIC_API_URL so Next.js can inline it)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = json.errors ? `: ${json.errors.join(", ")}` : "";
    throw new Error((json.message || "Request failed") + details);
  }
  return json.data;
}

export const getTasks = () => request("/api/tasks");
export const createTask = (body) => request("/api/tasks", { method: "POST", body: JSON.stringify(body) });
export const updateTask = (id, body) =>
  request(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTask = (id) => request(`/api/tasks/${id}`, { method: "DELETE" });
