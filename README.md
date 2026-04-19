# GTM Intelligence System

**Live Frontend:** https://gtm-intelligence-system.vercel.app
**Live Backend:** https://gtm-intelligence-system.onrender.com


# Outmate GTM Intelligence System
### Multi-Agent AI · Node.js + Express · Next.js · Groq (Free)

---

## Quick Start (3 steps)

### Step 1 — Get your free Groq API key
1. Go to https://console.groq.com
2. Sign up (free, no credit card)
3. Create an API key

### Step 2 — Start the backend
```bash
cd backend
cp .env.example .env


# Paste your Groq key into .env
npm install
npm run dev


# Running on http://localhost:4000
```

### Step 3 — Start the frontend
```bash
cd frontend
npm install
npm run dev
# GTM Intelligence System

**Live Frontend:** https://gtm-intelligence-system.vercel.app
**Live Backend:** https://gtm-intelligence-system.onrender.com


# Running on http://localhost:3000
```

Open **http://localhost:3000** and run a query.

---

## Architecture

```
User Query (natural language)
        │
        ▼
┌───────────────────────────────────┐
│         ORCHESTRATOR              │
│  Retry loop · SSE streaming       │
└──┬────────────────────────────────┘
   │
   ▼ (up to 3 attempts)
   │
┌──▼──────┐  ┌──────────┐  ┌────────────┐
│ Planner │─▶│Retrieval │─▶│ Enrichment │
│  Agent  │  │  Agent   │  │   Agent    │
└─────────┘  └──────────┘  └─────┬──────┘
                                  │
                          ┌───────▼───────┐
                          │  Validator /  │──▶ FAIL → re-plan
                          │ Critic Agent  │
                          └───────┬───────┘
                                  │ PASS
                          ┌───────▼───────┐
                          │  GTM Strategy │
                          │    Agent      │
                          └───────┬───────┘
                                  │
                          Final JSON Output
                          + SSE Stream to UI
```

---

## The 5 Agents

| Agent | What it does |
|-------|-------------|
| **Planner** | Breaks natural language query into structured execution plan with filters and target persona |
| **Retrieval** | Queries the company database using plan filters. Relaxes constraints if zero results. Uses LRU cache to avoid repeat calls |
| **Enrichment** | Computes ICP scores (0–100), detects buying signals (funding, hiring surge, expansion), builds tech fingerprints |
| **Validator** | Checks relevance, detects hallucinated filters, flags contradictions. Rejects bad results and triggers re-plan |
| **GTM Strategy** | Generates personalized hooks, cold email snippets, per-persona strategies, and recommended outreach sequence |

---

## Advanced Features Implemented

**A. Buying Signal Detection**
- Hiring surges (>40% 6-month headcount growth)
- Funding events (Series A/B/C signals)
- Geographic expansion signals
- Executive hires (CRO, VP Sales, etc.)
- Risk/churn signals

**B. ICP Scoring Engine**
- Growth score (0–40 pts): headcount velocity
- Intent score (0–30 pts): growth signals minus churn signals
- Fit score (0–30 pts): industry match + funding stage
- Tier: A (≥75), B (≥55), C (<55)

**C. Multi-Persona Targeting**
- VP Sales, CTO, CEO strategies generated per query

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 18+ |
| Backend framework | Express.js |
| AI model | Groq — LLaMA 3.3-70b-versatile (free) |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS + inline styles |
| Fonts | Syne, DM Mono, DM Sans |
| Caching | In-memory LRU cache |
| Data layer | Mock company DB (simulates Explorium/Apollo) |

---

## Folder Structure

```
gtm-v2/
├── backend/
│   ├── server.js        ← Express app, SSE endpoint, rate limiting
│   ├── orchestrator.js  ← Agent pipeline, retry loop
│   ├── agents.js        ← All 5 agent implementations
│   ├── mockData.js      ← 10 companies with noisy/partial data
│   ├── memory.js        ← LRU cache + SessionMemory
│   ├── .env.example     ← Copy to .env, add GROQ_API_KEY
│   └── package.json
└── frontend/
    ├── app/
    │   ├── page.tsx     ← Full UI with streaming, agent pipeline viz
    │   ├── layout.tsx   ← Fonts + metadata
    │   ├── globals.css  ← Dark theme + animations
    │   └── types.ts     ← TypeScript interfaces
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/query` | Main SSE stream — runs the full pipeline |
| GET | `/api/health` | System health + cache stats |
| GET | `/api/logs` | Recent log buffer |
| GET | `/api/cache-stats` | LRU cache hit/miss stats |

### SSE Events emitted by `/api/query`

| Event | Payload |
|-------|---------|
| `session_start` | sessionId, query |
| `agent_start` | agent name, message |
| `agent_done` | agent, confidence, summary |
| `agent_error` | agent, error message |
| `retry` | attempt number, reason |
| `critic_reject` | reason, action taken |
| `final_output` | full result object |
| `done` | sessionId |

---

## Example Queries to Try

- `Find high-growth AI SaaS companies in the US and generate outbound hooks for their VP Sales`
- `Identify fintech startups hiring aggressively and suggest outreach strategies`
- `Find companies likely to churn competitors and how to target them`
- `Find Seed stage developer tool companies and generate CTO outreach`

