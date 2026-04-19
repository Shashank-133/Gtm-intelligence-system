// agents.js — All 5 GTM Intelligence Agents powered by Groq

import Groq from "groq-sdk";
import { searchCompanies, getAllCompanies } from "./mockData.js";
import { queryCache } from "./memory.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

// ── Shared LLM helper ──────────────────────────────────────
async function llm(systemPrompt, userPrompt, maxTokens = 1200) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content.trim();
}

function parseJSON(text) {
  // Try direct parse
  try { return JSON.parse(text); } catch {}
  // Try extracting JSON block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error(`Could not parse JSON from LLM response: ${text.slice(0, 200)}`);
}

// ═══════════════════════════════════════════════════════════
// AGENT 1 — PLANNER
// ═══════════════════════════════════════════════════════════
export class PlannerAgent {
  constructor() { this.name = "Planner"; }

  async run(query, mem, previousIssues = []) {
    mem.setAgentStatus(this.name, "running", "Decomposing query into execution plan");
    mem.addTrace(this.name, "start", `Received query: "${query.slice(0, 80)}" — building plan`);

    const issuesCtx = previousIssues.length
      ? `\n\nPrevious execution failed with: ${JSON.stringify(previousIssues)}. Fix the plan to address these issues.`
      : "";

    const system = `You are a GTM intelligence planning agent.
Decompose the user's query into a structured execution plan.
Return ONLY valid JSON — no markdown, no explanation:
{
  "entity_type": "company",
  "intent": "prospect | churn_risk | competitive | hiring_signal | general",
  "tasks": ["search","enrich","analyze","generate_outreach"],
  "filters": {
    "industry": "string or null",
    "country": "string or null",
    "stage": "Seed | Series A | Series B | Series C | null",
    "minGrowth": number or null,
    "hiringKeyword": "string or null",
    "competitorKeyword": "string or null",
    "techKeyword": "string or null"
  },
  "targetPersona": "VP Sales | CTO | CEO | general",
  "strategy": "one sentence GTM approach",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    try {
      const raw = await llm(system, `GTM Query: ${query}${issuesCtx}`);
      const plan = parseJSON(raw);
      ["entity_type", "tasks", "filters", "confidence"].forEach(k => {
        if (!(k in plan)) plan[k] = k === "confidence" ? 0.5 : "unknown";
      });
      mem.plan = plan;
      mem.addTrace(this.name, "plan_created",
        `Plan: intent=${plan.intent}, persona=${plan.targetPersona}, filters=${JSON.stringify(plan.filters)}`,
        plan.confidence || 0.7);
      mem.setAgentStatus(this.name, "done", `Confidence: ${Math.round((plan.confidence || 0.7) * 100)}%`);
      return plan;
    } catch (err) {
      mem.addTrace(this.name, "error", `Planning failed: ${err.message}`, 0, true);
      mem.setAgentStatus(this.name, "failed", err.message);
      // Fallback plan
      const fallback = {
        entity_type: "company", intent: "general",
        tasks: ["search","enrich","analyze","generate_outreach"],
        filters: { industry: null, country: "US", stage: null },
        targetPersona: "VP Sales",
        strategy: "Broad GTM scan with general outreach",
        confidence: 0.3, reasoning: "Fallback due to planning error",
      };
      mem.plan = fallback;
      return fallback;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// AGENT 2 — RETRIEVAL
// ═══════════════════════════════════════════════════════════
export class RetrievalAgent {
  constructor() { this.name = "Retrieval"; }

  async run(plan, mem) {
    mem.setAgentStatus(this.name, "running", "Querying company database");
    const filters = plan.filters || {};
    mem.addTrace(this.name, "start", `Applying filters: ${JSON.stringify(filters)}`);

    const cacheKey = { type: "retrieval", filters };
    const cached = queryCache.get(cacheKey);
    if (cached) {
      mem.addTrace(this.name, "cache_hit", `${cached.length} companies from cache — skipping API call`);
      mem.setAgentStatus(this.name, "done", `${cached.length} results (cached)`);
      mem.rawResults = cached;
      return cached;
    }

    let results = searchCompanies({
      industry: filters.industry,
      country: filters.country,
      stage: filters.stage,
      minGrowth: filters.minGrowth,
      hiringKeyword: filters.hiringKeyword,
      competitorKeyword: filters.competitorKeyword,
      techKeyword: filters.techKeyword,
    });

    // Relax filters if over-constrained
    if (results.length === 0) {
      mem.addTrace(this.name, "relax_filters", "Zero results — relaxing constraints", 0.5);
      results = searchCompanies({ industry: filters.industry, country: filters.country });
    }

    // Ultimate fallback
    if (results.length === 0) {
      mem.addTrace(this.name, "fallback", "Still zero — returning unfiltered sample", 0.2);
      results = getAllCompanies().slice(0, 5);
    }

    queryCache.set(cacheKey, results);
    mem.rawResults = results;
    mem.addTrace(this.name, "retrieved", `Found ${results.length} companies`, results.length > 2 ? 0.85 : 0.5);
    mem.setAgentStatus(this.name, "done", `${results.length} companies retrieved`);
    return results;
  }
}

// ═══════════════════════════════════════════════════════════
// AGENT 3 — ENRICHMENT
// ═══════════════════════════════════════════════════════════
export class EnrichmentAgent {
  constructor() { this.name = "Enrichment"; }

  _computeICPScore(company, plan) {
    const growth = company.headcountGrowth6m;
    let growthPts = growth == null ? 15 : growth >= 50 ? 40 : growth >= 30 ? 30 : growth >= 15 ? 20 : 10;

    const signals = company.growthSignals || [];
    const churnSignals = company.churnSignals || [];
    let intentPts = Math.min(signals.length * 8, 30) - churnSignals.length * 5;
    intentPts = Math.max(0, intentPts);

    const planIndustry = (plan.filters?.industry || "").toLowerCase();
    const compIndustry = `${company.industry} ${company.vertical}`.toLowerCase();
    let fitPts = 20;
    if (planIndustry && compIndustry.includes(planIndustry)) fitPts += 10;
    if (company.fundingUsd > 10_000_000) fitPts += 5;
    fitPts = Math.min(fitPts, 30);

    const total = growthPts + intentPts + fitPts;
    return {
      total,
      max: 100,
      pct: total,
      breakdown: { growth: growthPts, intent: intentPts, fit: fitPts },
      tier: total >= 75 ? "A" : total >= 55 ? "B" : "C",
    };
  }

  _detectBuyingSignals(company) {
    const signals = [];
    const growth = company.headcountGrowth6m || 0;

    if (growth >= 40) signals.push({ type: "hiring_surge", detail: `${growth}% headcount growth`, strength: "strong" });
    else if (growth >= 20) signals.push({ type: "steady_growth", detail: `${growth}% headcount growth`, strength: "moderate" });

    for (const sig of company.growthSignals || []) {
      if (/series|funding|round/i.test(sig)) signals.push({ type: "funding_event", detail: sig, strength: "strong" });
      else if (/partner/i.test(sig)) signals.push({ type: "partnership", detail: sig, strength: "moderate" });
      else if (/expansion|emea|eu/i.test(sig)) signals.push({ type: "geographic_expansion", detail: sig, strength: "strong" });
      else if (/hire|vp|cro|cto/i.test(sig)) signals.push({ type: "executive_hire", detail: sig, strength: "moderate" });
    }
    for (const sig of company.churnSignals || []) {
      signals.push({ type: "risk_signal", detail: sig, strength: "warning" });
    }
    return signals;
  }

  async run(companies, plan, mem) {
    mem.setAgentStatus(this.name, "running", `Enriching ${companies.length} companies`);
    mem.addTrace(this.name, "start", `Enriching ${companies.length} records with ICP scores and buying signals`);

    const enriched = companies.map(company => {
      try {
        return {
          ...company,
          icpScore: this._computeICPScore(company, plan),
          buyingSignals: this._detectBuyingSignals(company),
          techFingerprint: {
            aiNative: company.techStack?.some(t => ["OpenAI API","LangChain","Anthropic","HuggingFace"].includes(t)),
            cloudProvider: company.techStack?.find(t => ["AWS","GCP","Azure"].includes(t)) || "Unknown",
            crm: company.techStack?.find(t => ["Salesforce","HubSpot"].includes(t)) || null,
          },
          revenueConfidence: company.revenueEstimate === "Data unavailable" ? "low" : "medium",
        };
      } catch {
        return company; // never drop a record
      }
    });

    // Sort by ICP score descending
    enriched.sort((a, b) => (b.icpScore?.total || 0) - (a.icpScore?.total || 0));

    mem.enrichedResults = enriched;
    const top = enriched[0];
    mem.addTrace(this.name, "enriched",
      `Enriched ${enriched.length} companies — top: ${top?.name} (ICP ${top?.icpScore?.total}/100)`, 0.88);
    mem.setAgentStatus(this.name, "done", `${enriched.length} records enriched`);
    return enriched;
  }
}

// ═══════════════════════════════════════════════════════════
// AGENT 4 — VALIDATOR / CRITIC
// ═══════════════════════════════════════════════════════════
export class ValidatorAgent {
  constructor() { this.name = "Validator"; }

  async run(enriched, plan, mem) {
    mem.setAgentStatus(this.name, "running", "Validating results and checking for hallucinations");
    mem.addTrace(this.name, "start", "Running quality checks: relevance, filter validity, contradictions");

    const issues = [];
    const warnings = [];

    // Check 1: empty results
    if (enriched.length === 0) {
      issues.push({ code: "NO_RESULTS", msg: "Zero results returned — filters may be over-constrained" });
    }

    // Check 2: industry relevance
    const targetIndustry = plan.filters?.industry?.toLowerCase();
    if (targetIndustry) {
      const mismatches = enriched.filter(c =>
        !`${c.industry} ${c.vertical}`.toLowerCase().includes(targetIndustry)
      );
      if (mismatches.length > enriched.length * 0.5) {
        issues.push({
          code: "INDUSTRY_MISMATCH",
          msg: `>50% of results don't match target industry "${targetIndustry}"`,
          affected: mismatches.slice(0, 3).map(c => c.name),
        });
      }
    }

    // Check 3: hallucinated/unrealistic filters
    if (plan.filters?.minGrowth > 200) {
      issues.push({ code: "UNREALISTIC_FILTER", msg: `Growth filter ${plan.filters.minGrowth}% is unrealistic` });
    }

    // Check 4: low ICP average
    const icpScores = enriched.map(c => c.icpScore?.total || 0);
    const avgICP = icpScores.length ? icpScores.reduce((a, b) => a + b, 0) / icpScores.length : 0;
    if (avgICP < 40 && enriched.length > 0) {
      warnings.push({ code: "LOW_ICP_AVG", msg: `Average ICP score is ${avgICP.toFixed(0)}/100 — low fit results` });
    }

    // Check 5: contradictions (high ICP + churn signals)
    const riskyHighICP = enriched.filter(c => c.icpScore?.total > 70 && c.churnSignals?.length > 0);
    if (riskyHighICP.length) {
      warnings.push({
        code: "CONTRADICTION",
        msg: `High-ICP companies with risk signals: ${riskyHighICP.map(c => c.name).join(", ")}`,
      });
    }

    const passed = issues.length === 0;
    const report = {
      passed,
      issues,
      warnings,
      avgICP: Math.round(avgICP),
      resultCount: enriched.length,
      confidence: passed && !warnings.length ? 0.9 : passed ? 0.65 : 0.3,
      recommendation: passed ? "proceed" : "replan",
    };

    mem.validationReport = report;
    if (passed) {
      mem.addTrace(this.name, "validated",
        `Validation PASSED — ${enriched.length} results, avg ICP ${avgICP.toFixed(0)}, ${warnings.length} warnings`,
        report.confidence);
      mem.setAgentStatus(this.name, "done", `Passed — ${warnings.length} warnings`);
    } else {
      mem.addTrace(this.name, "rejected",
        `Validation FAILED — ${issues.length} issues: ${issues.map(i => i.code).join(", ")}`,
        0.2, true);
      mem.setAgentStatus(this.name, "failed", `${issues.length} critical issues`);
    }

    return report;
  }
}

// ═══════════════════════════════════════════════════════════
// AGENT 5 — GTM STRATEGY
// ═══════════════════════════════════════════════════════════
export class GTMStrategyAgent {
  constructor() { this.name = "GTMStrategy"; }

  async run(enriched, plan, mem) {
    mem.setAgentStatus(this.name, "running", "Generating personalized GTM hooks and email snippets");
    const top = enriched.slice(0, 5);
    mem.addTrace(this.name, "start", `Generating strategy for ${top.length} companies, persona: ${plan.targetPersona}`);

    const companiesSummary = top.map(c => `${c.name} (${c.industry}, ${c.stage}): growth ${c.headcountGrowth6m}%, signals: ${c.buyingSignals?.slice(0,2).map(s=>s.detail).join(", ")}, tech: ${c.techStack?.slice(0,3).join(", ")}`).join("\n");

    const system = `You are a world-class GTM strategist.
Return ONLY valid JSON — no markdown, no backticks:
{
  "hooks": [{"company":"...","hook":"1-2 sentence compelling outreach angle"}],
  "angles": [{"company":"...","angle":"why they need this solution NOW"}],
  "email_snippets": [{"company":"...","subject":"...","opening":"2-3 sentence personalized email opening"}],
  "persona_strategies": {
    "VP Sales": "strategy for VP Sales",
    "CTO": "strategy for CTO",
    "CEO": "strategy for CEO"
  },
  "icp_insights": "2-3 sentences on common patterns across top prospects",
  "competitive_positioning": "how to position against their current vendors",
  "recommended_sequence": ["step1","step2","step3","step4"]
}
Be specific — reference actual company signals. No generic templates.`;

    try {
      const raw = await llm(system, `Target persona: ${plan.targetPersona}\nQuery: ${mem.originalQuery}\n\nProspects:\n${companiesSummary}`, 2000);
      const strategy = parseJSON(raw);
      ["hooks","angles","email_snippets","persona_strategies","icp_insights"].forEach(k => {
        if (!(k in strategy)) strategy[k] = Array.isArray([]) ? [] : {};
      });

      mem.gtmOutput = strategy;
      mem.addTrace(this.name, "strategy_generated",
        `Generated ${strategy.hooks?.length || 0} hooks, ${strategy.email_snippets?.length || 0} email snippets, multi-persona strategies`,
        0.87);
      mem.setAgentStatus(this.name, "done", `${strategy.hooks?.length || 0} hooks generated`);
      return strategy;
    } catch (err) {
      mem.addTrace(this.name, "error", `Strategy generation failed: ${err.message}`, 0, true);
      mem.setAgentStatus(this.name, "failed", err.message);
      return {
        hooks: top.map(c => ({ company: c.name, hook: `Personalized outreach for ${c.name} based on ${c.stage} stage and recent signals.` })),
        angles: [], email_snippets: [], persona_strategies: {},
        icp_insights: "Strategy generation encountered an error — using fallback",
        competitive_positioning: "", recommended_sequence: ["Research","LinkedIn connect","Cold email","Follow-up"],
      };
    }
  }
}

