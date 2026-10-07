const env = require("./config/env"); // loads .env and validates it first

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const Task = require("./models/Task");
const { validateTask } = require("./utils/validate");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.CLIENT_URLS } });

// ---------- middleware (security + performance) ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // secure HTTP headers
app.use(compression()); // gzip responses -> smaller payloads
app.use(cors({ origin: env.CLIENT_URLS }));
app.use(express.json({ limit: "100kb" }));

// ---------- helpers ----------

// Push a real-time event + an activity message to every connected browser
function notify(event, payload, message) {
  io.emit(event, payload);
  io.emit("activity", {
    id: `${Date.now()}-${Math.random()}`,
    event,
    message,
    time: new Date().toISOString(),
  });
}

function sendError(res, status, message, errors) {
  return res.status(status).json({ success: false, message, errors });
}

// ---------- health check (used by Render to know the service is alive) ----------
app.get("/", (req, res) => {
  res.json({ success: true, message: "Live Task Board API", health: "/api/health" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ---------- REST API (CRUD) ----------

// READ all (optional ?status=todo&search=text)
app.get("/api/tasks", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const safe = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// Stats: number of tasks per status (declared before "/:id")
app.get("/api/tasks/stats", async (req, res) => {
  try {
    const rows = await Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const stats = { todo: 0, "in-progress": 0, done: 0 };
    rows.forEach((r) => {
      stats[r._id] = r.count;
    });
    stats.total = stats.todo + stats["in-progress"] + stats.done;
    res.json({ success: true, data: stats });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// READ one
app.get("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, "Invalid task id");
    const task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// CREATE
app.post("/api/tasks", async (req, res) => {
  try {
    const { ok, errors, clean } = validateTask(req.body);
    if (!ok) return sendError(res, 400, "Validation failed", errors);

    const task = await Task.create(clean);
    notify("task:created", task, `New task added: "${task.title}"`);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// UPDATE (send only the fields you want to change)
app.put("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, "Invalid task id");

    const { ok, errors, clean } = validateTask(req.body, true);
    if (!ok) return sendError(res, 400, "Validation failed", errors);

    const task = await Task.findByIdAndUpdate(req.params.id, clean, {
      new: true,
      runValidators: true,
    });
    if (!task) return sendError(res, 404, "Task not found");

    notify("task:updated", task, `Task updated: "${task.title}" is now ${task.status}`);
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// DELETE
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, "Invalid task id");

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return sendError(res, 404, "Task not found");

    notify("task:deleted", { id: String(task._id) }, `Task deleted: "${task.title}"`);
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.use((req, res) => sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`));

// ---------- Socket.IO (real-time) ----------

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  io.emit("clients:count", io.sockets.sockets.size);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    io.emit("clients:count", io.sockets.sockets.size);
  });
});

// ---------- Start ----------

async function seedIfEmpty() {
  if ((await Task.countDocuments()) > 0) return;
  await Task.insertMany([
    { title: "Design database schema", description: "Plan the MongoDB collections", status: "done", priority: "high" },
    { title: "Build REST API", description: "CRUD endpoints with Express", status: "done", priority: "high" },
    { title: "Create Next.js frontend", description: "Task board UI", status: "in-progress", priority: "medium" },
    { title: "Deploy to Render and Vercel", description: "Go live", status: "in-progress", priority: "medium" },
    { title: "Write documentation", description: "Practical report", status: "todo", priority: "low" },
  ]);
  console.log("Seeded 5 sample tasks");
}

mongoose
  .connect(env.MONGO_URI)
  .then(async () => {
    console.log(`MongoDB connected successfully (${env.NODE_ENV})`);
    await seedIfEmpty();
    server.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Backend running on port ${env.PORT}`);
      console.log(`Allowed origins: ${env.CLIENT_URLS.join(", ")}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Render sends SIGTERM on every redeploy - close connections cleanly
function shutdown(signal) {
  console.log(`${signal} received - shutting down`);
  io.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
