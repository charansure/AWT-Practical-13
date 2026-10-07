// Central place that reads and validates environment variables.
// Locally they come from the .env file; on Render they come from the dashboard.
require("dotenv").config();

const required = ["MONGO_URI"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy .env.example to .env and fill in the values.");
  process.exit(1); // fail fast instead of crashing later
}

const NODE_ENV = process.env.NODE_ENV || "development";

const env = {
  NODE_ENV,
  isProduction: NODE_ENV === "production",
  PORT: Number(process.env.PORT) || 5000, // Render injects PORT automatically
  MONGO_URI: process.env.MONGO_URI,
  // comma separated list of frontend URLs allowed by CORS / Socket.IO
  CLIENT_URLS: (process.env.CLIENT_URLS || "http://localhost:3000")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, "")) // remove trailing slash
    .filter(Boolean),
};

module.exports = env;
