"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const AGENTS = [
  { id: "Planner",     label: "Planner",      icon: "🧠" },
  { id: "Retrieval",   label: "Retrieval",    icon: "🔍" },
  { id: "Enrichment",  label: "Enrichment",   icon: "⚡" },
  { id: "Validator",   label: "Validator",    icon: "🛡️" },
  { id: "GTMStrategy", label: "GTM Strategy", icon: "🚀" },
];

const EXAMPLES = [
  "Find high-growth AI SaaS companies in the US and generate outbound hooks for their VP Sales",
  "Identify fintech startups hiring aggressively and suggest outreach strategies",
  "Find companies likely to churn competitors and how to target them",
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const agentColor = {
  Planner: "#7c3aed", Retrieval: "#0ea5e9", Enrichment: "#059669",
  Validator: "#d97706", GTMStrategy: "#db2777", System: "#94a3b8",
};

const signalColor = {
  hiring_surge: "#059669", funding_event: "#059669",
  geographic_expansion: "#0ea5e9", partnership: "#0ea5e9",
  executive_hire: "#7c3aed", steady_growth: "#7c3aed",
  risk_signal: "#dc2626", warning: "#d97706",
};

function ICPRing({ score, tier }: { score: number; tier: string }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = tier === "A" ? "#059669" : tier === "B" ? "#0ea5e9" : "#94a3b8";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <svg width={44} height={44} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={r} fill="none" stroke="#e2e8f0" strokeWidth={2.5}/>
        <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 20 20)" style={{transition:"stroke-dashoffset 0.8s"}}/>
        <text x={20} y={24} textAnchor="middle" fill={color}
          style={{fontFamily:"var(--font-mono)",fontSize:11,fontWeight:500}}>{score}</text>
      </svg>
      <span style={{fontFamily:"var(--font-mono)",fontSize:10,color}}>ICP {tier}</span>
    </div>
  );
}

function AgentPipeline({ agentStatuses, completedCount }: { agentStatuses: Record<string, string>; completedCount: number }) {
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:24,background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      {AGENTS.map((a, i) => {
        const status = agentStatuses[a.id] || "pending";
        const borderColor = status==="done"?"#059669":status==="running"?"#4f46e5":status==="failed"?"#dc2626":status==="retrying"?"#d97706":"#e2e8f0";
        const bg = status==="done"?"#f0fdf4":status==="running"?"#eef2ff":status==="failed"?"#fef2f2":status==="retrying"?"#fffbeb":"#f8fafc";
        const dotColor = status==="done"?"#059669":status==="running"?"#4f46e5":status==="failed"?"#dc2626":status==="retrying"?"#d97706":"#cbd5e1";
        const labelColor = status==="done"?"#059669":status==="running"?"#4f46e5":status==="failed"?"#dc2626":status==="retrying"?"#d97706":"#94a3b8";
        const isConnectorActive = i < completedCount;
        return (
          <div key={a.id} style={{display:"flex",alignItems:"center",flex:i<AGENTS.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:88}}>
              <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,border:`1.5px solid ${borderColor}`,background:bg,position:"relative",transition:"all 0.3s",...(status==="running"?{animation:"icon-pulse 1.5s ease-in-out infinite"}:{})}}>
                {a.icon}
                <div style={{position:"absolute",top:-3,right:-3,width:7,height:7,borderRadius:"50%",background:dotColor,border:"1.5px solid #ffffff",...(status==="running"?{animation:"pulse-dot 1s infinite"}:{})}}/>
              </div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:9,color:labelColor,textAlign:"center"}}>{a.label}</span>
            </div>
            {i < AGENTS.length-1 && (
              <div style={{flex:1,height:2,background:isConnectorActive?"linear-gradient(90deg,#059669,#4f46e5)":"#e2e8f0",position:"relative",top:-17,minWidth:12,borderRadius:1}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyCard({ company }: { company: any }) {
  const [showWhy, setShowWhy] = useState(false);
  const icp = company.icpScore;
  const signals = (company.buyingSignals||[]).slice(0,4);
  const whyText = icp
    ? `${company.name} scored ${icp.tier}-tier (${icp.total}/100): growth ${icp.breakdown.growth}/40, intent ${icp.breakdown.intent}/30, fit ${icp.breakdown.fit}/30.${signals.length?" Key signals: "+signals.map((s:any)=>s.detail).join("; ")+".":""}${company.churnSignals?.length?" ⚠️ Risk: "+company.churnSignals.join(", ")+".":""}`
    : "Scored based on growth velocity, funding stage, hiring signals, and industry fit.";

  return (
    <div className="animate-fade-in" style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,padding:20,transition:"border-color 0.2s, transform 0.15s, box-shadow 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c7d2fe";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(79,70,229,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontFamily:"var(--font-syne)",fontSize:16,fontWeight:700,letterSpacing:"-0.01em",color:"#0f172a"}}>{company.name}</div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#94a3b8",marginTop:2}}>{company.industry} · {company.city}</div>
        </div>
        {icp && <ICPRing score={icp.total} tier={icp.tier}/>}
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {signals.map((s,i)=>(
          <span key={i} style={{fontFamily:"var(--font-mono)",fontSize:10,color:signalColor[s.type]||"#64748b",border:`1px solid ${signalColor[s.type]||"#64748b"}40`,background:`${signalColor[s.type]||"#64748b"}10`,padding:"2px 7px",borderRadius:4}}>
            {s.detail.slice(0,38)}{s.detail.length>38?"…":""}
          </span>
        ))}
      </div>

      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        {(company.techStack||[]).slice(0,5).map((t,i)=>(
          <span key={i} style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#64748b",border:"1px solid #e2e8f0",background:"#f8fafc",padding:"2px 6px",borderRadius:4}}>{t}</span>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #f1f5f9"}}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#94a3b8"}}>
          {company.stage} · {company.headcount||"?"} ppl{company.headcountGrowth6m?` · +${company.headcountGrowth6m}% 6m`:""}
        </span>
        <button onClick={()=>setShowWhy(v=>!v)} style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#4f46e5",background:"#eef2ff",border:"1px solid #c7d2fe",padding:"4px 10px",borderRadius:6,cursor:"pointer"}}>
          {showWhy?"▾ Why this?":"▸ Why this?"}
        </button>
      </div>

      {showWhy && (
        <div className="animate-fade-in" style={{marginTop:14,padding:14,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#4f46e5",marginBottom:6}}>⚡ Why this result?</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{whyText}</div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [logs, setLogs] = useState([]);
  const [retryBanners, setRetryBanners] = useState([]);
  const [results, setResults] = useState([]);
  const [gtmStrategy, setGtmStrategy] = useState(null);
  const [trace, setTrace] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [validation, setValidation] = useState(null);
  const [gtmTab, setGtmTab] = useState("hooks");
  const [error, setError] = useState(null);

  const logRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(()=>{
    if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  },[logs]);

  const addLog = useCallback((agent, msg, cls?)=>{
    const ts = ((Date.now()-startTimeRef.current)/1000).toFixed(1)+"s";
    setLogs(prev=>[...prev.slice(-60),{agent,msg,ts,cls}]);
  },[]);

  const handleSSE = useCallback((event, data)=>{
    switch(event){
      case "session_start": addLog("System",`Session ${data.sessionId} started`); break;
      case "agent_start":
        setAgentStatuses(p=>({...p,[data.agent]:"running"}));
        addLog(data.agent, data.message); break;
      case "agent_done":
        setAgentStatuses(p=>({...p,[data.agent]:"done"}));
        addLog(data.agent,`✓ ${data.summary}`); break;
      case "agent_error":
        setAgentStatuses(p=>({...p,[data.agent]:"failed"}));
        addLog(data.agent,`✗ ${data.error}`,"error"); break;
      case "retry":
        setRetryBanners(p=>[...p,data]);
        addLog("System",`Retry ${data.attempt}/${data.max}: ${data.reason.join(", ")}`,"retry"); break;
      case "critic_reject":
        addLog("Validator",`Rejected → ${data.action}`,"error"); break;
      case "final_output":
        setResults(data.results||[]);
        setGtmStrategy(data.gtm_strategy||null);
        setTrace(data.reasoning_trace||[]);
        setConfidence(data.confidence||0);
        setValidation(data.meta?.validation||null);
        addLog("System",`Complete — ${data.results?.length||0} results, ${Math.round((data.confidence||0)*100)}% confidence`);
        break;
      case "done": addLog("System",`Session ${data.sessionId} finished`); break;
      case "error": setError(data.message); addLog("System",data.message,"error"); break;
    }
  },[addLog]);

  async function handleRun(){
    if(!query.trim()||running) return;
    setRunning(true);
    setAgentStatuses({}); setLogs([]); setRetryBanners([]);
    setResults([]); setGtmStrategy(null); setTrace([]);
    setConfidence(0); setValidation(null); setError(null);
    startTimeRef.current = Date.now();
    addLog("System","Starting GTM intelligence pipeline…");
    try {
      const res = await fetch(`${API}/api/query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query})});
      if(!res.ok){const e=await res.json();throw new Error(e.error);}
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer="";
      while(true){
        const{done,value}=await reader.read();
        if(done) break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split("\n\n");
        buffer=lines.pop()||"";
        for(const line of lines){
          if(!line.startsWith("data: ")) continue;
          try{const{event,data}=JSON.parse(line.slice(6));handleSSE(event,data);}catch{}
        }
      }
    } catch(err){
      setError(err.message);
      addLog("System",`Error: ${err.message}`,"error");
    } finally { setRunning(false); }
  }

  const completedCount = Object.values(agentStatuses).filter(s=>s==="done").length;
  const hasOutput = results.length>0;
  const tabs = ["hooks","emails","personas","sequence"];

  return (
    <main style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"36px 24px 80px"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
        <div style={{display:"flex",alignItems:"center",gap:10,fontFamily:"var(--font-syne)",fontSize:17,fontWeight:700,letterSpacing:"-0.02em",color:"#0f172a"}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🎯</div>
          Outmate GTM Intelligence
        </div>
        <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#4f46e5",border:"1px solid #c7d2fe",padding:"3px 10px",borderRadius:20,background:"#eef2ff"}}>
          5-Agent Pipeline · Groq LLaMA 3.3
        </span>
      </div>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--font-mono)",fontSize:10,color:"#059669",border:"1px solid #bbf7d0",padding:"4px 12px",borderRadius:20,background:"#f0fdf4",marginBottom:20}}>
          <span className="animate-pulse-dot" style={{width:5,height:5,borderRadius:"50%",background:"#059669",display:"inline-block"}}/>
          Multi-Agent Orchestration · Planner → Retrieval → Enrichment → Validator → GTM
        </div>
        <h1 style={{fontFamily:"var(--font-syne)",fontSize:"clamp(30px,5vw,50px)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.03em",marginBottom:14,background:"linear-gradient(135deg,#0f172a 40%,#4f46e5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          GTM Intelligence,<br/>Fully Autonomous
        </h1>
        <p style={{fontSize:15,color:"#475569",fontWeight:400,maxWidth:460,margin:"0 auto",lineHeight:1.7}}>
          One query → 5 AI agents that plan, retrieve, enrich, validate, and generate personalized outreach
        </p>
      </div>

      {/* Query box */}
      <div style={{background:"#ffffff",border:"1px solid #c7d2fe",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 24px rgba(79,70,229,0.08)",marginBottom:28}}>
        <textarea value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")handleRun();}}
          disabled={running}
          placeholder="e.g. Find high-growth AI SaaS companies in the US and generate personalized outbound hooks for their VP Sales..."
          rows={3}
          style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"#0f172a",fontFamily:"var(--font-sans)",fontSize:15,fontWeight:400,padding:"18px 22px 12px",resize:"none",lineHeight:1.6}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px 12px",borderTop:"1px solid #f1f5f9",background:"#fafafa"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {EXAMPLES.map((ex,i)=>(
              <button key={i} onClick={()=>setQuery(ex)}
                style={{fontFamily:"var(--font-mono)",fontSize:9,color:"#94a3b8",border:"1px solid #e2e8f0",padding:"3px 9px",borderRadius:20,cursor:"pointer",background:"#ffffff"}}
                onMouseEnter={e=>{e.currentTarget.style.color="#4f46e5";e.currentTarget.style.borderColor="#c7d2fe";e.currentTarget.style.background="#eef2ff";}}
                onMouseLeave={e=>{e.currentTarget.style.color="#94a3b8";e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#ffffff";}}>
                {ex.slice(0,44)}…
              </button>
            ))}
          </div>
          <button onClick={handleRun} disabled={running||!query.trim()}
            style={{display:"flex",alignItems:"center",gap:7,background:running||!query.trim()?"#e2e8f0":"linear-gradient(135deg,#4f46e5,#7c3aed)",color:running||!query.trim()?"#94a3b8":"white",border:"none",borderRadius:8,padding:"9px 18px",fontFamily:"var(--font-syne)",fontSize:13,fontWeight:600,cursor:running?"not-allowed":"pointer",transition:"all 0.2s"}}>
            {running
              ? <><span className="animate-spin" style={{width:13,height:13,border:"2px solid #cbd5e1",borderTopColor:"#64748b",borderRadius:"50%",display:"inline-block"}}/> Running</>
              : "▶ Run Intelligence"}
          </button>
        </div>
      </div>

      {/* Agent pipeline */}
      {(running||hasOutput) && <AgentPipeline agentStatuses={agentStatuses} completedCount={completedCount}/>}

      {/* Live log */}
      {(running||logs.length>0) && (
        <div ref={logRef} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",marginBottom:20,fontFamily:"var(--font-mono)",fontSize:11,maxHeight:130,overflowY:"auto"}}>
          {logs.map((l,i)=>(
            <div key={i} className="animate-fade-in" style={{display:"flex",gap:10,padding:"2px 0",lineHeight:1.5}}>
              <span style={{color:"#cbd5e1",minWidth:38}}>{l.ts}</span>
              <span style={{minWidth:80,color:agentColor[l.agent]||"#94a3b8"}}>{l.agent}</span>
              <span style={{color:l.cls==="error"?"#dc2626":l.cls==="retry"?"#d97706":"#475569",flex:1}}>{l.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Retry banners */}
      {retryBanners.map((b,i)=>(
        <div key={i} className="animate-fade-in" style={{display:"flex",alignItems:"center",gap:10,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:13,color:"#92400e"}}>
          ⚠️ <strong>Retry {b.attempt}/{b.max}</strong> — Validator rejected: {b.reason.join(", ")} → Replanning…
        </div>
      ))}

      {/* Confidence meter */}
      {confidence>0 && (
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28,background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#64748b",minWidth:110}}>System confidence</span>
          <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.round(confidence*100)}%`,background:confidence>0.75?"linear-gradient(90deg,#059669,#34d399)":confidence>0.5?"linear-gradient(90deg,#d97706,#fbbf24)":"linear-gradient(90deg,#dc2626,#f87171)",borderRadius:3,transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          </div>
          <span style={{fontFamily:"var(--font-mono)",fontSize:13,fontWeight:600,minWidth:36,textAlign:"right",color:confidence>0.75?"#059669":confidence>0.5?"#d97706":"#dc2626"}}>
            {Math.round(confidence*100)}%
          </span>
        </div>
      )}

      {/* Validation banners */}
      {validation && <>
        {validation.issues?.map((issue,i)=>(
          <div key={i} className="animate-fade-in" style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 16px",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#dc2626",marginBottom:3}}>Issue: {issue.code}</div>
            <div style={{fontSize:12,color:"#7f1d1d"}}>{issue.msg}</div>
          </div>
        ))}
        {validation.warnings?.map((warn,i)=>(
          <div key={i} className="animate-fade-in" style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 16px",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#d97706",marginBottom:3}}>Warning: {warn.code}</div>
            <div style={{fontSize:12,color:"#78350f"}}>{warn.msg}</div>
          </div>
        ))}
      </>}

      {/* Error */}
      {error && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",marginBottom:20,color:"#dc2626",fontSize:13}}>
          ✗ {error}
        </div>
      )}

      {/* Results */}
      {results.length>0 && (
        <div style={{marginBottom:48}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <h2 style={{fontFamily:"var(--font-syne)",fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:"#0f172a"}}>🏢 Top Prospects</h2>
            <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"2px 8px",borderRadius:6}}>{results.length} companies</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
            {results.map(c=><CompanyCard key={c.id} company={c}/>)}
          </div>
        </div>
      )}

      {/* GTM Strategy */}
      {gtmStrategy && (
        <div style={{marginBottom:48}}>
          <h2 style={{fontFamily:"var(--font-syne)",fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:"#0f172a",marginBottom:20}}>🚀 GTM Strategy</h2>
          <div style={{display:"flex",gap:2,background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:10,padding:4,width:"fit-content",marginBottom:16}}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>setGtmTab(t)}
                style={{fontFamily:"var(--font-mono)",fontSize:11,padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",background:gtmTab===t?"#4f46e5":"transparent",color:gtmTab===t?"white":"#64748b",transition:"all 0.15s",fontWeight:gtmTab===t?600:400}}>
                {t==="hooks"?"Outreach Hooks":t==="emails"?"Email Snippets":t==="personas"?"Persona Angles":"Sequence"}
              </button>
            ))}
          </div>

          <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            {gtmTab==="hooks" && (gtmStrategy.hooks||[]).map((h,i)=>(
              <div key={i} style={{padding:"18px 20px",borderBottom:i<gtmStrategy.hooks.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#4f46e5",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{h.company}</div>
                <div style={{fontSize:14,color:"#1e293b",lineHeight:1.7}}>{h.hook}</div>
              </div>
            ))}
            {gtmTab==="emails" && (gtmStrategy.email_snippets||[]).map((e,i)=>(
              <div key={i} style={{padding:"18px 20px",borderBottom:i<gtmStrategy.email_snippets.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#4f46e5",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{e.company}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#94a3b8",marginBottom:8}}>Subject: <span style={{color:"#475569",fontSize:12}}>{e.subject}</span></div>
                <div style={{fontSize:13,color:"#334155",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{e.opening}</div>
              </div>
            ))}
            {gtmTab==="personas" && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0}}>
                {Object.entries(gtmStrategy.persona_strategies||{}).map(([role,strat],i)=>(
                  <div key={role} style={{padding:20,borderRight:i<2?"1px solid #f1f5f9":"none"}}>
                    <div style={{fontFamily:"var(--font-syne)",fontSize:13,fontWeight:700,marginBottom:10,color:"#0f172a"}}>{role}</div>
                    <div style={{fontSize:13,color:"#475569",lineHeight:1.6}}>{strat}</div>
                  </div>
                ))}
              </div>
            )}
            {gtmTab==="sequence" && (
              <div style={{padding:20}}>
                {(gtmStrategy.recommended_sequence||[]).map((step,i)=>(
                  <div key={i} style={{display:"flex",gap:16,padding:"14px 0",borderBottom:i<gtmStrategy.recommended_sequence.length-1?"1px solid #f1f5f9":"none",alignItems:"flex-start"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-mono)",fontSize:12,fontWeight:700,color:"#4f46e5",flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:"#334155",lineHeight:1.6,paddingTop:4}}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {gtmStrategy.icp_insights && (
            <div style={{marginTop:14,padding:16,background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:8}}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#4f46e5",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>ICP Insights</div>
              <div style={{fontSize:13,color:"#3730a3",lineHeight:1.7}}>{gtmStrategy.icp_insights}</div>
            </div>
          )}
        </div>
      )}

      {/* Reasoning Trace */}
      {trace.length>0 && (
        <div style={{marginBottom:48}}>
          <h2 style={{fontFamily:"var(--font-syne)",fontSize:16,fontWeight:700,letterSpacing:"-0.01em",marginBottom:16,color:"#0f172a"}}>⚙️ Reasoning Trace</h2>
          <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            {trace.map((t,i)=>(
              <div key={i} className="animate-fade-in" style={{display:"flex",gap:14,padding:"13px 20px",borderBottom:i<trace.length-1?"1px solid #f8fafc":"none",background:i%2===0?"#ffffff":"#fafafa"}}>
                <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"#cbd5e1",minWidth:22,paddingTop:2}}>#{t.step}</span>
                <div style={{width:8,height:8,borderRadius:"50%",background:t.isError?"#dc2626":"#059669",marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:agentColor[t.agent]||"#64748b",marginBottom:3,fontWeight:500}}>{t.agent} · {t.action}</div>
                  <div style={{fontSize:13,color:"#334155",lineHeight:1.5}}>{t.summary}</div>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"#94a3b8",marginTop:3}}>confidence: {Math.round(t.confidence*100)}% · t+{t.ts}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running&&!hasOutput&&(
        <div style={{textAlign:"center",padding:"80px 20px"}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#eef2ff,#e0e7ff)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 20px"}}>🎯</div>
          <div style={{fontFamily:"var(--font-syne)",fontSize:18,color:"#0f172a",marginBottom:8,fontWeight:700}}>Ready for GTM Intelligence</div>
          <div style={{fontSize:14,color:"#94a3b8"}}>Enter a query above to start the 5-agent pipeline</div>
        </div>
      )}
    </main>
  );
}


