// mockData.js — Simulated company database (replaces paid Explorium/Apollo APIs)

export const COMPANIES_DB = [
  {
    id: "c001",
    name: "Vendiq AI",
    industry: "AI SaaS",
    vertical: "Sales Intelligence",
    country: "US",
    city: "San Francisco",
    stage: "Series B",
    fundingUsd: 42_000_000,
    headcount: 180,
    headcountGrowth6m: 34,
    revenueEstimate: "10M-20M ARR",
    techStack: ["Salesforce", "HubSpot", "OpenAI API", "Snowflake", "AWS"],
    hiringRoles: ["VP Sales", "AE Enterprise", "ML Engineer", "RevOps"],
    competitors: ["Gong", "Clari", "Chorus"],
    growthSignals: ["Series B closed Q4 2024", "Expanding to EMEA", "New VP Marketing hired"],
    churnSignals: ["CTO departure", "Glassdoor rating declined to 3.1"],
    website: "vendiq.ai",
    description: "AI-powered revenue intelligence platform helping B2B sales teams close deals faster.",
  },
  {
    id: "c002",
    name: "Finstra",
    industry: "Fintech",
    vertical: "Embedded Finance",
    country: "US",
    city: "New York",
    stage: "Series A",
    fundingUsd: 18_000_000,
    headcount: 95,
    headcountGrowth6m: 52,
    revenueEstimate: "5M-10M ARR",
    techStack: ["Stripe", "Plaid", "PostgreSQL", "React", "GCP"],
    hiringRoles: ["Head of Sales", "Account Executive", "Backend Engineer", "Compliance Lead"],
    competitors: ["Unit", "Treasury Prime", "Bond"],
    growthSignals: ["Series A closed", "3 new enterprise contracts Q1 2025", "Banking partnership announced"],
    churnSignals: [],
    website: "finstra.io",
    description: "Embedded finance infrastructure for non-bank brands.",
  },
  {
    id: "c003",
    name: "NovaMed Intelligence",
    industry: "HealthTech",
    vertical: "Clinical AI",
    country: "US",
    city: "Boston",
    stage: "Series C",
    fundingUsd: 120_000_000,
    headcount: 420,
    headcountGrowth6m: 21,
    revenueEstimate: "30M-50M ARR",
    techStack: ["AWS", "PyTorch", "Epic EHR", "HIPAA infra", "Databricks"],
    hiringRoles: ["VP Sales", "Enterprise AE", "Clinical Informatics Lead", "Data Scientist"],
    competitors: ["Veeva", "Flatiron Health"],
    growthSignals: ["FDA clearance Q2 2025", "Partnership with Mass General", "IPO speculation"],
    churnSignals: ["Regulatory delay in EU"],
    website: "novamed.ai",
    description: "AI clinical decision support for oncology and radiology.",
  },
  {
    id: "c004",
    name: "ShiftLogix",
    industry: "AI SaaS",
    vertical: "Workforce Automation",
    country: "US",
    city: "Austin",
    stage: "Seed",
    fundingUsd: 4_500_000,
    headcount: 28,
    headcountGrowth6m: 75,
    revenueEstimate: "1M-3M ARR",
    techStack: ["OpenAI API", "Retool", "Supabase", "Vercel"],
    hiringRoles: ["First Sales Hire", "Growth Marketer", "Full-stack Engineer"],
    competitors: ["Rippling", "Deputy"],
    growthSignals: ["Seed round from a16z", "Product Hunt #1 of the day", "10x MoM signups"],
    churnSignals: [],
    website: "shiftlogix.com",
    description: "AI-driven shift scheduling and workforce optimization for SMBs.",
  },
  {
    id: "c005",
    name: "DataPulse",
    industry: "AI SaaS",
    vertical: "Data Observability",
    country: "US",
    city: "Seattle",
    stage: "Series B",
    fundingUsd: 55_000_000,
    headcount: 210,
    headcountGrowth6m: 28,
    revenueEstimate: "15M-25M ARR",
    techStack: ["dbt", "Snowflake", "Databricks", "Kafka", "GCP"],
    hiringRoles: ["Enterprise AE", "Solutions Engineer", "VP Customer Success"],
    competitors: ["Monte Carlo", "Bigeye", "Great Expectations"],
    growthSignals: ["Microsoft partnership", "SOC2 Type II certified", "EU expansion"],
    churnSignals: ["Negative G2 reviews on support quality"],
    website: "datapulse.io",
    description: "Data pipeline monitoring and anomaly detection for modern data stacks.",
  },
  {
    id: "c006",
    name: "LexaFinance",
    industry: "Fintech",
    vertical: "Legal & Compliance Tech",
    country: "US",
    city: "Chicago",
    stage: "Series A",
    fundingUsd: 22_000_000,
    headcount: 110,
    headcountGrowth6m: 40,
    revenueEstimate: "8M-12M ARR",
    techStack: ["Salesforce", "Stripe", "AWS", "Python", "LangChain"],
    hiringRoles: ["VP Sales", "Sales Development Rep", "Compliance Engineer"],
    competitors: ["Palantir", "Chainalysis"],
    growthSignals: ["Series A led by GV", "3 new bank clients signed", "Hiring aggressively"],
    churnSignals: [],
    website: "lexafinance.com",
    description: "AI compliance and AML monitoring for mid-market financial institutions.",
  },
  {
    id: "c007",
    name: "Quantra Labs",
    industry: "AI SaaS",
    vertical: "Predictive Analytics",
    country: "US",
    city: "Denver",
    stage: "Series A",
    fundingUsd: 15_000_000,
    headcount: 70,
    headcountGrowth6m: 43,
    revenueEstimate: "4M-8M ARR",
    techStack: ["Python", "TensorFlow", "AWS SageMaker", "Tableau"],
    hiringRoles: ["Account Executive", "Data Scientist", "VP Marketing"],
    competitors: ["Salesforce Einstein", "Anaplan"],
    growthSignals: ["New CRO hired from Stripe", "AWS co-sell partnership", "2x headcount plan"],
    churnSignals: [],
    website: "quantralabs.com",
    description: "Predictive revenue and demand forecasting for enterprise sales teams.",
  },
  {
    id: "c008",
    name: "BuildBot AI",
    industry: "AI SaaS",
    vertical: "Developer Tools",
    country: "US",
    city: "San Francisco",
    stage: "Seed",
    fundingUsd: 6_000_000,
    headcount: 18,
    headcountGrowth6m: 80,
    revenueEstimate: "500K-1M ARR",
    techStack: ["GitHub", "OpenAI API", "Docker", "TypeScript", "Vercel"],
    hiringRoles: ["Developer Advocate", "Early Sales", "ML Engineer"],
    competitors: ["GitHub Copilot", "Cursor", "Devin"],
    growthSignals: ["YC W25 batch", "5K GitHub stars", "Viral HN post"],
    churnSignals: [],
    website: "buildbot.ai",
    description: "AI code review and auto-fix agent for engineering teams.",
  },
  {
    id: "c009",
    name: "Nexio Pay",
    industry: "Fintech",
    vertical: "Payments Infrastructure",
    country: "US",
    city: "Miami",
    stage: "Series B",
    fundingUsd: 38_000_000,
    headcount: 155,
    headcountGrowth6m: 18,
    revenueEstimate: "12M-18M ARR",
    techStack: ["Stripe", "Node.js", "React", "PostgreSQL", "Cloudflare"],
    hiringRoles: ["Enterprise Sales", "Partnerships Manager"],
    competitors: ["Rapyd", "Checkout.com", "Adyen"],
    growthSignals: ["Latin America expansion", "PCI DSS Level 1 cert"],
    churnSignals: ["VP Engineering left", "Slower growth vs Q3"],
    website: "nexiopay.com",
    description: "Cross-border payment rails for global e-commerce platforms.",
  },
  {
    id: "c010",
    name: "ClearRoute Logistics",
    industry: "Supply Chain Tech",
    vertical: "Route Optimization",
    country: "US",
    city: "Dallas",
    stage: "Series A",
    fundingUsd: 11_000_000,
    headcount: 60,
    headcountGrowth6m: 30,
    revenueEstimate: "3M-6M ARR",
    techStack: ["Python", "Google Maps API", "PostgreSQL", "React"],
    hiringRoles: ["VP Sales", "Operations Manager", "Data Engineer"],
    competitors: ["Samsara", "KeepTruckin", "Project44"],
    growthSignals: ["Walmart pilot", "New fleet insurance partnership"],
    churnSignals: ["COO departure"],
    website: "clearroute.io",
    description: "AI-powered last-mile delivery optimization for regional logistics companies.",
  },
];

// Add noise to simulate real API partial data
function addNoise(company) {
  const c = { ...company };
  const roll = Math.random();
  if (roll < 0.15) c.headcountGrowth6m = null;
  if (roll < 0.10) c.revenueEstimate = "Data unavailable";
  if (roll < 0.05) c.techStack = c.techStack.slice(0, 2);
  return c;
}

export function searchCompanies({ industry, country, stage, minGrowth, hiringKeyword, competitorKeyword, techKeyword } = {}) {
  let results = COMPANIES_DB.map(addNoise);

  if (industry) {
    const kw = industry.toLowerCase();
    results = results.filter(c =>
      c.industry.toLowerCase().includes(kw) || c.vertical.toLowerCase().includes(kw)
    );
  }
  if (country) results = results.filter(c => c.country.toLowerCase() === country.toLowerCase());
  if (stage) results = results.filter(c => c.stage.toLowerCase().includes(stage.toLowerCase()));
  if (minGrowth != null) results = results.filter(c => c.headcountGrowth6m != null && c.headcountGrowth6m >= minGrowth);
  if (hiringKeyword) {
    const kw = hiringKeyword.toLowerCase();
    results = results.filter(c => c.hiringRoles.some(r => r.toLowerCase().includes(kw)));
  }
  if (competitorKeyword) {
    const kw = competitorKeyword.toLowerCase();
    results = results.filter(c => c.competitors.some(r => r.toLowerCase().includes(kw)));
  }
  if (techKeyword) {
    const kw = techKeyword.toLowerCase();
    results = results.filter(c => c.techStack.some(t => t.toLowerCase().includes(kw)));
  }

  return results;
}

export function getAllCompanies() {
  return COMPANIES_DB.map(addNoise);
}
