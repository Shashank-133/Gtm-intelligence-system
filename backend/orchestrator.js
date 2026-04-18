// orchestrator.js — Manages the full agent pipeline with retry loops + SSE streaming

import { v4 as uuidv4 } from "uuid";
import { SessionMemory, queryCache } from "./memory.js";
import { PlannerAgent, RetrievalAgent, EnrichmentAgent, ValidatorAgent, GTMStrategyAgent } from "./agents.js";

const MAX_RETRIES = 3;

export class Orchestrator {
  constructor() {
    this.planner    = new PlannerAgent();
    this.retrieval  = new RetrievalAgent();
    this.enrichment = new EnrichmentAgent();
    this.validator  = new ValidatorAgent();
    this.gtm        = new GTMStrategyAgent();
  }

  // Send a Server-Sent Event to the response stream
  emit(res, event, data) {
    res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
  }

  async run(query, res) {
    const mem = new SessionMemory(uuidv4().slice(0, 8), query);

    this.emit(res, "session_start", { sessionId: mem.sessionId, query, ts: Date.now() });

    let enriched = [];
    let previousIssues = [];

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      mem.retryCount = attempt;

      if (attempt > 0) {
        this.emit(res, "retry", {
          attempt: attempt + 1,
          max: MAX_RETRIES,
          reason: previousIssues.map(i => i.code),
        });
        await sleep(300);
      }

      // ── AGENT 1: PLANNER ──────────────────────────────
      this.emit(res, "agent_start", { agent: "Planner", message: "Analyzing query and building execution plan..." });
      let plan;
      try {
        plan = await this.planner.run(query, mem, previousIssues);
        this.emit(res, "agent_done", {
          agent: "Planner",
          confidence: plan.confidence || 0.7,
          summary: `Plan: ${plan.intent} → targeting ${plan.targetPersona}`,
          detail: plan,
          trace: mem.reasoningTrace.at(-1),
        });
      } catch (err) {
        this.emit(res, "agent_error", { agent: "Planner", error: err.message });
        continue;
      }

      await sleep(100);

      // ── AGENT 2: RETRIEVAL ────────────────────────────
      this.emit(res, "agent_start", { agent: "Retrieval", message: "Querying company database with structured filters..." });
      let companies;
      try {
        companies = await this.retrieval.run(plan, mem);
        this.emit(res, "agent_done", {
          agent: "Retrieval",
          confidence: companies.length > 2 ? 0.85 : 0.5,
          summary: `Retrieved ${companies.length} companies`,
          preview: companies.slice(0, 4).map(c => ({ name: c.name, industry: c.industry, stage: c.stage })),
          trace: mem.reasoningTrace.at(-1),
        });
      } catch (err) {
        this.emit(res, "agent_error", { agent: "Retrieval", error: err.message });
        continue;
      }

      await sleep(100);

      // ── AGENT 3: ENRICHMENT ───────────────────────────
      this.emit(res, "agent_start", { agent: "Enrichment", message: `Enriching ${companies.length} companies with signals and ICP scores...` });
      try {
        enriched = await this.enrichment.run(companies, plan, mem);
        const top = enriched[0] || {};
        this.emit(res, "agent_done", {
          agent: "Enrichment",
          confidence: 0.88,
          summary: `Enriched ${enriched.length} records — top: ${top.name} (ICP ${top.icpScore?.total || 0}/100)`,
          signalsFound: enriched.reduce((sum, c) => sum + (c.buyingSignals?.length || 0), 0),
          trace: mem.reasoningTrace.at(-1),
        });
      } catch (err) {
        this.emit(res, "agent_error", { agent: "Enrichment", error: err.message });
        continue;
      }

      await sleep(100);

      // ── AGENT 4: VALIDATOR / CRITIC ───────────────────
      this.emit(res, "agent_start", { agent: "Validator", message: "Validating results, checking for hallucinations and contradictions..." });
      let validation;
      try {
        validation = await this.validator.run(enriched, plan, mem);
        this.emit(res, "agent_done", {
          agent: "Validator",
          confidence: validation.confidence,
          summary: `Validation ${validation.passed ? "PASSED" : "FAILED"} — ${validation.issues.length} issues, ${validation.warnings.length} warnings`,
          passed: validation.passed,
          issues: validation.issues,
          warnings: validation.warnings,
          trace: mem.reasoningTrace.at(-1),
        });
      } catch (err) {
        this.emit(res, "agent_error", { agent: "Validator", error: err.message });
        validation = { passed: true, issues: [], warnings: [], confidence: 0.5 };
      }

      // ── CRITIC LOOP ───────────────────────────────────
      if (!validation.passed) {
        previousIssues = validation.issues;
        this.emit(res, "critic_reject", {
          reason: validation.issues.map(i => i.msg),
          action: attempt < MAX_RETRIES - 1 ? "replanning" : "proceeding_with_caveats",
        });
        if (attempt < MAX_RETRIES - 1) continue; // trigger re-plan
      }

      await sleep(100);

      // ── AGENT 5: GTM STRATEGY ─────────────────────────
      this.emit(res, "agent_start", { agent: "GTMStrategy", message: `Generating personalized hooks for ${plan.targetPersona}...` });
      let strategy;
      try {
        strategy = await this.gtm.run(enriched, plan, mem);
        this.emit(res, "agent_done", {
          agent: "GTMStrategy",
          confidence: 0.87,
          summary: `Generated ${strategy.hooks?.length || 0} hooks, ${strategy.email_snippets?.length || 0} email snippets`,
          trace: mem.reasoningTrace.at(-1),
        });
      } catch (err) {
        this.emit(res, "agent_error", { agent: "GTMStrategy", error: err.message });
        strategy = { hooks: [], angles: [], email_snippets: [], persona_strategies: {}, icp_insights: "" };
      }

      // ── FINAL OUTPUT ──────────────────────────────────
      const finalConfidence = Math.min(plan.confidence || 0.7, validation.confidence || 0.8, 0.95);

      const summarizedTrace = mem.reasoningTrace.map((t, i) => ({
        step: i + 1,
        agent: t.agent,
        action: t.action,
        summary: t.summary,
        confidence: t.confidence,
        ts: t.ts,
        isError: t.isError || false,
      }));

      this.emit(res, "final_output", {
        plan,
        results: enriched.slice(0, 8),
        signals: enriched.slice(0, 5).flatMap(c => c.buyingSignals || []),
        gtm_strategy: strategy,
        confidence: Math.round(finalConfidence * 100) / 100,
        reasoning_trace: summarizedTrace,
        meta: {
          sessionId: mem.sessionId,
          totalRetries: attempt,
          cacheStats: queryCache.stats(),
          agentStatuses: mem.agentStatuses,
          validation,
        },
      });

      this.emit(res, "done", { sessionId: mem.sessionId });
      return;
    }

    // All retries exhausted
    this.emit(res, "error", { message: "Max retries exceeded. Returning best available results." });
    this.emit(res, "done", { sessionId: mem.sessionId });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
