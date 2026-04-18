// memory.js — Session memory + LRU query cache

import crypto from "crypto";

// ── LRU Cache ─────────────────────────────────────────────
export class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  _key(obj) {
    return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
  }

  get(keyObj) {
    const k = this._key(keyObj);
    if (!this.cache.has(k)) { this.misses++; return null; }
    const entry = this.cache.get(k);
    if (Date.now() - entry.ts > entry.ttl * 1000) { this.cache.delete(k); this.misses++; return null; }
    // Move to end (most recently used)
    this.cache.delete(k);
    this.cache.set(k, entry);
    this.hits++;
    return entry.value;
  }

  set(keyObj, value, ttl = 300) {
    const k = this._key(keyObj);
    if (this.cache.size >= this.maxSize) {
      // Delete oldest
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(k, { value, ts: Date.now(), ttl });
  }

  stats() {
    return { hits: this.hits, misses: this.misses, size: this.cache.size };
  }
}

// ── Session Memory ─────────────────────────────────────────
export class SessionMemory {
  constructor(sessionId, query) {
    this.sessionId = sessionId;
    this.originalQuery = query;
    this.plan = {};
    this.retrievalFilters = {};
    this.rawResults = [];
    this.enrichedResults = [];
    this.validationReport = {};
    this.gtmOutput = {};
    this.reasoningTrace = [];
    this.retryCount = 0;
    this.agentStatuses = {};
    this.startedAt = Date.now();
  }

  addTrace(agent, action, summary, confidence = 1.0, isError = false) {
    this.reasoningTrace.push({
      agent,
      action,
      summary,
      confidence,
      isError,
      ts: ((Date.now() - this.startedAt) / 1000).toFixed(2),
    });
  }

  setAgentStatus(agent, status, detail = "") {
    this.agentStatuses[agent] = {
      status, // pending | running | done | failed | retrying
      detail,
      ts: ((Date.now() - this.startedAt) / 1000).toFixed(2),
    };
  }

  toContextDict() {
    return {
      originalQuery: this.originalQuery,
      plan: this.plan,
      filtersUsed: this.retrievalFilters,
      resultCount: this.enrichedResults.length,
      validationIssues: this.validationReport.issues || [],
      retryCount: this.retryCount,
    };
  }
}

// Global cache singleton
export const queryCache = new LRUCache(100);
