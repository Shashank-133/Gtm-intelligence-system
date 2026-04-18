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

const API = "http://localhost:4000";

const agentColor = {
  Planner: "#a78bfa", Retrieval: "#38bdf8", Enrichment: "#22d3a5",
  Validator: "#f59e0b", GTMStrategy: "#f472b6", System: "#5c5a6b",
};

const signalColor = {
  hiring_surge: "#22d3a5", funding_event: "#22d3a5",
  geographic_expansion: "#38bdf8", partnership: "#38bdf8",
  executive_hire: "#a78bfa", steady_growth: "#a78bfa",
  risk_signal: "#f43f5e", warning: "#f59e0b",
};

function ICPRing({ score, tier }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = tier === "A" ? "#22d3a5" : tier === "B" ? "#38bdf8" : "#5c5a6b";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <svg width={44} height={44} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2.5}/>
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

function AgentPipeline({ agentStatuses, completedCount }) {
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
      {AGENTS.map((a, i) => {
        const status = agentStatuses[a.id] || "pending";
        const borderColor = status==="done"?"#22d3a5":status==="running"?"#6c63ff":status==="failed"?"#f43f5e":status==="retrying"?"#f59e0b":"rgba(255,255,255,0.12)";
        const bg = status==="done"?"rgba(34,211,165,0.08)":status==="running"?"rgba(108,99,255,0.12)":status==="failed"?"rgba(244,63,94,0.08)":status==="retrying"?"rgba(245,158,11,0.08)":"var(--surface)";
        const dotColor = status==="done"?"#22d3a5":status==="running"?"#6c63ff":status==="failed"?"#f43f5e":status==="retrying"?"#f59e0b":"#5c5a6b";
        const labelColor = status==="done"?"#22d3a5":status==="running"?"#a78bfa":status==="failed"?"#f43f5e":status==="retrying"?"#f59e0b":"#5c5a6b";
        const isConnectorActive = i < completedCount;
        return (
          <div key={a.id} style={{display:"flex",alignItems:"center",flex:i<AGENTS.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:88}}>
              <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,border:`1.5px solid ${borderColor}`,background:bg,position:"relative",transition:"all 0.3s",...(status==="running"?{animation:"icon-pulse 1.5s ease-in-out infinite"}:{})}}>
                {a.icon}
                <div style={{position:"absolute",top:-3,right:-3,width:7,height:7,borderRadius:"50%",background:dotColor,border:"1.5px solid var(--bg)",...(status==="running"?{animation:"pulse-dot 1s infinite"}:{})}}/>
              </div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:9,color:labelColor,textAlign:"center"}}>{a.label}</span>
            </div>
            {i < AGENTS.length-1 && (
              <div style={{flex:1,height:1,background:isConnectorActive?"linear-gradient(90deg,#22d3a5,#6c63ff)":"var(--border2)",position:"relative",top:-17,minWidth:12}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyCard({ company }) {
  const [showWhy, setShowWhy] = useState(false);
  const icp = company.icpScore;
  const signals = (company.buyingSignals||[]).slice(0,4);
  const whyText = icp
    ? `${company.name} scored ${icp.tier}-tier (${icp.total}/100): growth ${icp.breakdown.growth}/40, intent ${icp.breakdown.intent}/30, fit ${icp.breakdown.fit}/30.${signals.length?" Key signals: "+signals.map(s=>s.detail).join("; ")+".":""}${company.churnSignals?.length?" ⚠️ Risk: "+company.churnSignals.join(", ")+".":""}`
    : "Scored based on growth velocity, funding stage, hiring signals, and industry fit.";

  return (
    <div className="animate-fade-in" style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:20,transition:"border-color 0.2s, transform 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateY(0)";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontFamily:"var(--font-syne)",fontSize:16,fontWeight:700,letterSpacing:"-0.01em"}}>{company.name}</div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text3)",marginTop:2}}>{company.industry} · {company.city}</div>
        </div>
        {icp && <ICPRing score={icp.total} tier={icp.tier}/>}
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {signals.map((s,i)=>(
          <span key={i} style={{fontFamily:"var(--font-mono)",fontSize:10,color:signalColor[s.type]||"#9896aa",border:`1px solid ${signalColor[s.type]||"#9896aa"}30`,background:`${signalColor[s.type]||"#9896aa"}08`,padding:"2px 7px",borderRadius:4}}>
            {s.detail.slice(0,38)}{s.detail.length>38?"…":""}
          </span>
        ))}
      </div>

      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        {(company.techStack||[]).slice(0,5).map((t,i)=>(
          <span key={i} style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)",border:"1px solid var(--border)",padding:"2px 6px",borderRadius:4}}>{t}</span>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid var(--border)"}}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>
          {company.stage} · {company.headcount||"?"} ppl{company.headcountGrowth6m?` · +${company.headcountGrowth6m}% 6m`:""}
        </span>
        <button onClick={()=>setShowWhy(v=>!v)} style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--accent)",background:"rgba(108,99,255,0.08)",border:"1px solid rgba(108,99,255,0.2)",padding:"4px 10px",borderRadius:6,cursor:"pointer"}}>
          {showWhy?"▾ Why this?":"▸ Why this?"}
        </button>
      </div>

      {showWhy && (
        <div className="animate-fade-in" style={{marginTop:14,padding:14,background:"var(--bg2)",borderRadius:8,border:"1px solid var(--border)"}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:6}}>⚡ Why this result?</div>
          <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.7,fontWeight:300}}>{whyText}</div>
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

  const addLog = useCallback((agent, msg, cls)=>{
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
        <div style={{display:"flex",alignItems:"center",gap:10,fontFamily:"var(--font-syne)",fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#6c63ff,#a855f7)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🎯</div>
          Outmate GTM Intelligence
        </div>
        <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--accent)",border:"1px solid rgba(108,99,255,0.3)",padding:"3px 10px",borderRadius:20,background:"rgba(108,99,255,0.08)"}}>
          5-Agent Pipeline · Groq LLaMA 3.3
        </span>
      </div>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--font-mono)",fontSize:10,color:"var(--green)",border:"1px solid rgba(34,211,165,0.2)",padding:"4px 12px",borderRadius:20,background:"rgba(34,211,165,0.06)",marginBottom:16}}>
          <span className="animate-pulse-dot" style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",display:"inline-block"}}/>
          Multi-Agent Orchestration · Planner → Retrieval → Enrichment → Validator → GTM
        </div>
        <h1 style={{fontFamily:"var(--font-syne)",fontSize:"clamp(30px,5vw,50px)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.03em",marginBottom:12,background:"linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.45))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          GTM Intelligence,<br/>Fully Autonomous
        </h1>
        <p style={{fontSize:14,color:"var(--text2)",fontWeight:300,maxWidth:420,margin:"0 auto",lineHeight:1.6}}>
          One query → 5 AI agents that plan, retrieve, enrich, validate, and generate personalized outreach
        </p>
      </div>

      {/* Query box */}
      <div style={{background:"var(--surface)",border:"1px solid rgba(108,99,255,0.35)",borderRadius:12,overflow:"hidden",boxShadow:"0 0 40px rgba(108,99,255,0.1)",marginBottom:28}}>
        <textarea value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")handleRun();}}
          disabled={running}
          placeholder="e.g. Find high-growth AI SaaS companies in the US and generate personalized outbound hooks for their VP Sales..."
          rows={3}
          style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--text)",fontFamily:"var(--font-sans)",fontSize:15,fontWeight:300,padding:"18px 22px 12px",resize:"none",lineHeight:1.6}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px 12px",borderTop:"1px solid var(--border)"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {EXAMPLES.map((ex,i)=>(
              <button key={i} onClick={()=>setQuery(ex)}
                style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--text3)",border:"1px solid var(--border)",padding:"3px 9px",borderRadius:20,cursor:"pointer",background:"transparent"}}
                onMouseEnter={e=>{e.target.style.color="var(--accent)";e.target.style.borderColor="rgba(108,99,255,0.35)";}}
                onMouseLeave={e=>{e.target.style.color="var(--text3)";e.target.style.borderColor="var(--border)";}}>
                {ex.slice(0,44)}…
              </button>
            ))}
          </div>
          <button onClick={handleRun} disabled={running||!query.trim()}
            style={{display:"flex",alignItems:"center",gap:7,background:"linear-gradient(135deg,#6c63ff,#a855f7)",color:"white",border:"none",borderRadius:8,padding:"9px 18px",fontFamily:"var(--font-syne)",fontSize:13,fontWeight:600,cursor:running?"not-allowed":"pointer",opacity:running||!query.trim()?0.5:1}}>
            {running
              ? <><span className="animate-spin" style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%",display:"inline-block"}}/> Running</>
              : "▶ Run Intelligence"}
          </button>
        </div>
      </div>

      {/* Agent pipeline */}
      {(running||hasOutput) && <AgentPipeline agentStatuses={agentStatuses} completedCount={completedCount}/>}

      {/* Live log */}
      {(running||logs.length>0) && (
        <div ref={logRef} style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",marginBottom:20,fontFamily:"var(--font-mono)",fontSize:11,maxHeight:130,overflowY:"auto"}}>
          {logs.map((l,i)=>(
            <div key={i} className="animate-fade-in" style={{display:"flex",gap:10,padding:"2px 0",lineHeight:1.5}}>
              <span style={{color:"var(--text3)",minWidth:38}}>{l.ts}</span>
              <span style={{minWidth:80,color:agentColor[l.agent]||"var(--text3)"}}>{l.agent}</span>
              <span style={{color:l.cls==="error"?"var(--red)":l.cls==="retry"?"var(--amber)":"var(--text2)",flex:1}}>{l.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Retry banners */}
      {retryBanners.map((b,i)=>(
        <div key={i} className="animate-fade-in" style={{display:"flex",alignItems:"center",gap:10,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:13,color:"var(--amber)"}}>
          ⚠️ <strong>Retry {b.attempt}/{b.max}</strong> — Validator rejected: {b.reason.join(", ")} → Replanning…
        </div>
      ))}

      {/* Confidence meter */}
      {confidence>0 && (
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text3)",minWidth:110}}>System confidence</span>
          <div style={{flex:1,height:4,background:"var(--border2)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.round(confidence*100)}%`,background:"linear-gradient(90deg,#6c63ff,#22d3a5)",borderRadius:2,transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          </div>
          <span style={{fontFamily:"var(--font-mono)",fontSize:13,fontWeight:500,minWidth:36,textAlign:"right",color:confidence>0.75?"#22d3a5":confidence>0.5?"#f59e0b":"#f43f5e"}}>
            {Math.round(confidence*100)}%
          </span>
        </div>
      )}

      {/* Validation banners */}
      {validation && <>
        {validation.issues?.map((issue,i)=>(
          <div key={i} className="animate-fade-in" style={{background:"rgba(244,63,94,0.06)",border:"1px solid rgba(244,63,94,0.15)",borderRadius:8,padding:"10px 16px",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--red)",marginBottom:3}}>Issue: {issue.code}</div>
            <div style={{fontSize:12,color:"var(--text2)",fontWeight:300}}>{issue.msg}</div>
          </div>
        ))}
        {validation.warnings?.map((warn,i)=>(
          <div key={i} className="animate-fade-in" style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:8,padding:"10px 16px",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--amber)",marginBottom:3}}>Warning: {warn.code}</div>
            <div style={{fontSize:12,color:"var(--text2)",fontWeight:300}}>{warn.msg}</div>
          </div>
        ))}
      </>}

      {/* Error */}
      {error && (
        <div style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.2)",borderRadius:8,padding:"12px 16px",marginBottom:20,color:"var(--red)",fontSize:13}}>
          ✗ {error}
        </div>
      )}

      {/* Results */}
      {results.length>0 && (
        <div style={{marginBottom:48}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <h2 style={{fontFamily:"var(--font-syne)",fontSize:20,fontWeight:700,letterSpacing:"-0.02em"}}>🏢 Top Prospects</h2>
            <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text3)",background:"var(--surface)",border:"1px solid var(--border)",padding:"2px 8px",borderRadius:6}}>{results.length} companies</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
            {results.map(c=><CompanyCard key={c.id} company={c}/>)}
          </div>
        </div>
      )}

      {/* GTM Strategy */}
      {gtmStrategy && (
        <div style={{marginBottom:48}}>
          <h2 style={{fontFamily:"var(--font-syne)",fontSize:20,fontWeight:700,letterSpacing:"-0.02em",marginBottom:20}}>🚀 GTM Strategy</h2>
          <div style={{display:"flex",gap:2,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:4,width:"fit-content",marginBottom:16}}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>setGtmTab(t)}
                style={{fontFamily:"var(--font-mono)",fontSize:11,padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",background:gtmTab===t?"var(--accent)":"transparent",color:gtmTab===t?"white":"var(--text3)",transition:"all 0.15s"}}>
                {t==="hooks"?"Outreach Hooks":t==="emails"?"Email Snippets":t==="personas"?"Persona Angles":"Sequence"}
              </button>
            ))}
          </div>

          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            {gtmTab==="hooks" && (gtmStrategy.hooks||[]).map((h,i)=>(
              <div key={i} style={{padding:"16px 20px",borderBottom:i<gtmStrategy.hooks.length-1?"1px solid var(--border)":"none"}}>
                <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h.company}</div>
                <div style={{fontSize:14,color:"var(--text)",lineHeight:1.6,fontWeight:300}}>{h.hook}</div>
              </div>
            ))}
            {gtmTab==="emails" && (gtmStrategy.email_snippets||[]).map((e,i)=>(
              <div key={i} style={{padding:"16px 20px",borderBottom:i<gtmStrategy.email_snippets.length-1?"1px solid var(--border)":"none"}}>
                <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{e.company}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text3)",marginBottom:6}}>Subject: <span style={{color:"var(--text2)",fontSize:12}}>{e.subject}</span></div>
                <div style={{fontSize:13,color:"var(--text)",lineHeight:1.7,fontWeight:300,whiteSpace:"pre-wrap"}}>{e.opening}</div>
              </div>
            ))}
            {gtmTab==="personas" && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"var(--border)"}}>
                {Object.entries(gtmStrategy.persona_strategies||{}).map(([role,strat])=>(
                  <div key={role} style={{background:"var(--surface)",padding:20}}>
                    <div style={{fontFamily:"var(--font-syne)",fontSize:13,fontWeight:700,marginBottom:10}}>{role}</div>
                    <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,fontWeight:300}}>{strat}</div>
                  </div>
                ))}
              </div>
            )}
            {gtmTab==="sequence" && (
              <div style={{padding:20}}>
                {(gtmStrategy.recommended_sequence||[]).map((step,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<gtmStrategy.recommended_sequence.length-1?"1px solid var(--border)":"none"}}>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:20,color:"var(--accent)",fontWeight:700,minWidth:28}}>{i+1}</span>
                    <span style={{fontSize:14,color:"var(--text2)",fontWeight:300,lineHeight:1.5,paddingTop:2}}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {gtmStrategy.icp_insights && (
            <div style={{marginTop:14,padding:16,background:"rgba(108,99,255,0.05)",border:"1px solid rgba(108,99,255,0.15)",borderRadius:8}}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:5}}>ICP INSIGHTS</div>
              <div style={{fontSize:13,color:"var(--text2)",fontWeight:300,lineHeight:1.7}}>{gtmStrategy.icp_insights}</div>
            </div>
          )}
        </div>
      )}

      {/* Reasoning Trace */}
      {trace.length>0 && (
        <div style={{marginBottom:48}}>
          <h2 style={{fontFamily:"var(--font-syne)",fontSize:16,fontWeight:700,letterSpacing:"-0.01em",marginBottom:16}}>⚙️ Reasoning Trace</h2>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            {trace.map((t,i)=>(
              <div key={i} className="animate-fade-in" style={{display:"flex",gap:14,padding:"13px 20px",borderBottom:i<trace.length-1?"1px solid var(--border)":"none"}}>
                <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text3)",minWidth:22,paddingTop:2}}>#{t.step}</span>
                <div style={{width:8,height:8,borderRadius:"50%",background:t.isError?"var(--red)":"var(--green)",marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:agentColor[t.agent]||"var(--text2)",marginBottom:3}}>{t.agent} · {t.action}</div>
                  <div style={{fontSize:13,color:"var(--text2)",fontWeight:300,lineHeight:1.5}}>{t.summary}</div>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)",marginTop:3}}>confidence: {Math.round(t.confidence*100)}% · t+{t.ts}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running&&!hasOutput&&(
        <div style={{textAlign:"center",padding:"80px 20px",color:"var(--text3)"}}>
          <div style={{fontSize:40,marginBottom:16,opacity:0.3}}>🎯</div>
          <div style={{fontFamily:"var(--font-syne)",fontSize:18,color:"var(--text2)",marginBottom:8}}>Ready for GTM Intelligence</div>
          <div style={{fontSize:14,fontWeight:300}}>Enter a query above to start the 5-agent pipeline</div>
        </div>
      )}
    </main>
  );
}
