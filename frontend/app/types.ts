// types.ts — Shared TypeScript types

export type AgentStatus = "pending" | "running" | "done" | "failed" | "retrying";

export interface ICPScore {
  total: number;
  max: number;
  pct: number;
  tier: "A" | "B" | "C";
  breakdown: { growth: number; intent: number; fit: number };
}

export interface BuyingSignal {
  type: string;
  detail: string;
  strength: "strong" | "moderate" | "warning";
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  vertical: string;
  country: string;
  city: string;
  stage: string;
  fundingUsd: number;
  headcount: number;
  headcountGrowth6m: number | null;
  revenueEstimate: string;
  techStack: string[];
  hiringRoles: string[];
  competitors: string[];
  growthSignals: string[];
  churnSignals: string[];
  website: string;
  description: string;
  icpScore?: ICPScore;
  buyingSignals?: BuyingSignal[];
  techFingerprint?: {
    aiNative: boolean;
    cloudProvider: string;
    crm: string | null;
  };
  revenueConfidence?: string;
}

export interface Plan {
  entity_type: string;
  intent: string;
  tasks: string[];
  filters: Record<string, unknown>;
  targetPersona: string;
  strategy: string;
  confidence: number;
  reasoning: string;
}

export interface GTMStrategy {
  hooks: Array<{ company: string; hook: string }>;
  angles: Array<{ company: string; angle: string }>;
  email_snippets: Array<{ company: string; subject: string; opening: string }>;
  persona_strategies: Record<string, string>;
  icp_insights: string;
  competitive_positioning: string;
  recommended_sequence: string[];
}

export interface TraceStep {
  step: number;
  agent: string;
  action: string;
  summary: string;
  confidence: number;
  ts: string;
  isError: boolean;
}

export interface ValidationReport {
  passed: boolean;
  issues: Array<{ code: string; msg: string }>;
  warnings: Array<{ code: string; msg: string }>;
  avgICP: number;
  confidence: number;
}

export interface FinalOutput {
  plan: Plan;
  results: Company[];
  signals: BuyingSignal[];
  gtm_strategy: GTMStrategy;
  confidence: number;
  reasoning_trace: TraceStep[];
  meta: {
    sessionId: string;
    totalRetries: number;
    validation: ValidationReport;
  };
}

export interface LogLine {
  agent: string;
  msg: string;
  ts: string;
  cls?: string;
}

export interface RetryBanner {
  attempt: number;
  max: number;
  reason: string[];
}

export interface AgentInfo {
  id: string;
  label: string;
  icon: string;
}
