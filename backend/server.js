// server.js — Express backend with SSE streaming, rate limiting, logging

import express from "express";
import cors from "cors";
import "dotenv/config";
import { Orchestrator } from "./orchestrator.js";
import { queryCache } from "./memory.js";

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ── Logging ────────────────────────────────────────────────
const logBuffer = [];

function log(level, msg) {
  const entry = { level, msg, ts: new Date().toISOString() };
  logBuffer.push(entry);
  if (logBuffer.length > 500) logBuffer.shift();
  console.log(`[${level}] ${msg}`);
}

// ── Rate Limiting ──────────────────────────────────────────
const rateLimitMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 15;
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// ── Routes ─────────────────────────────────────────────────

// POST /api/query — Main SSE streaming endpoint
app.post("/api/query", async (req, res) => {
  const ip = req.ip || "unknown";
  const { query } = req.body;

  if (!query || query.trim().length < 5) {
    return res.status(400).json({ error: "Query too short" });
  }
  if (query.length > 1000) {
    return res.status(400).json({ error: "Query too long" });
  }
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded — max 15 requests/minute" });
  }

  log("INFO", `Query from ${ip}: "${query.slice(0, 80)}"`);

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const orchestrator = new Orchestrator();
    await orchestrator.run(query.trim(), res);
  } catch (err) {
    log("ERROR", `Pipeline error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ event: "error", data: { message: err.message } })}\n\n`);
  } finally {
    res.end();
  }
});

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    cacheStats: queryCache.stats(),
    logCount: logBuffer.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/logs
app.get("/api/logs", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ logs: logBuffer.slice(-limit), total: logBuffer.length });
});

// GET /api/cache-stats
app.get("/api/cache-stats", (req, res) => {
  res.json(queryCache.stats());
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  log("INFO", `GTM Intelligence backend running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    log("WARN", "GROQ_API_KEY not set! Add it to backend/.env");
  }
});

