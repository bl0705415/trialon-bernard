
import React, { useState } from "react";
import C from "../constants/colors";


// ─── RC Dashboard ────
const RCDashboard = ({ studies, onNav, onSelect }) => {
  const [taskFilter,setTaskFilter] = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));

  const activeCount = studies.length;
  const blockedCount = studies.filter(s => s.blocked).length;
  const irbInProgress = studies.filter(s => s.irbStatus==="In Progress"||s.irbStatus==="Submitted").length;
  const contractsPending = studies.filter(s => s.contractStatus!=="Executed").length;
  const avgDays = studies.length ? Math.round(studies.reduce((sum,s) => sum+(s.activationDays||0),0)/studies.length) : 0;

  const stats = [
    {label:"Active Studies",value:activeCount,color:"#2563eb"},
    {label:"Studies Blocked",value:blockedCount,color:blockedCount>0?"#dc2626":"#16a34a"},
    {label:"IRB In Progress",value:irbInProgress,color:"#d97706"},
    {label:"Contracts Pending",value:contractsPending,color:"#7c3aed"},
    {label:"Avg Days to Activation",value:avgDays,color:"#0891b2"},
  ];

  const tasks = studies.length > 0 ? studies.flatMap((s,idx) => {
    const t = [];
    if (s.missing>10) t.push({id:`${idx}-fields`,title:`Complete missing fields — ${(s.title||"Study").substring(0,30)}`,dueType:"overdue",study:s,action:"fields"});
    if (s.irbStatus==="Not Started") t.push({id:`${idx}-irb`,title:`Submit IRB application — ${(s.title||"Study").substring(0,30)}`,dueType:"dueToday"});
    if (s.contractStatus==="Not Started"||s.contractStatus==="Drafting") t.push({id:`${idx}-contract`,title:`Review contract — ${(s.title||"Study").substring(0,30)}`,dueType:"upcoming"});
    if (s.missing<=10&&s.missing>0) t.push({id:`${idx}-confirm`,title:`Confirm extracted fields — ${(s.title||"Study").substring(0,30)}`,dueType:"dueToday",study:s,action:"fields"});
    return t;
  }) : [{id:"empty-1",title:"Upload your first protocol to generate tasks",dueType:"upcoming"}];

  const filteredTasks = taskFilter==="Due Today" ? tasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? tasks.filter(t=>t.dueType==="overdue") : tasks;
  const priorityActions = studies.filter(s=>s.blocked||s.missing>5).slice(0,5).map(s=>({
    study:(s.title||"Untitled").substring(0,25),
    workstream:s.irbStatus==="Not Started"?"IRB":s.contractStatus==="Not Started"?"Contract":"Fields",
    action:s.missing>15?"Complete missing fields":s.missing>5?"Review flagged fields":"Confirm extracted data",
    next:s.nextTask||"Review →"
  }));

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:26 }}>
        <h2 style={{ fontSize:24, fontWeight:700, color:C.text }}>Study Coordinator Dashboard</h2>
        <button onClick={() => onNav("upload")} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"#1f2a44", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>+ Create New Study</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:16, marginBottom:24 }}>
        {stats.map(card => (
          <div key={card.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", minHeight:98, boxSizing:"border-box" }}>
            <div style={{ fontSize:13, color:"#7c8aa5", marginBottom:8 }}>{card.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr", gap:16, alignItems:"start" }}>
        <div>
          <div style={{ marginBottom:18 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>My Priority Actions</h3>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", minHeight:120 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 2fr 1.2fr", padding:"12px 16px", fontSize:12, fontWeight:600, color:"#7c8aa5", background:"#f8fafc", borderBottom:`1px solid ${C.border}` }}>
                <div>Study</div><div>Workstream</div><div>Action Needed</div><div>Next Step</div>
              </div>
              {priorityActions.length===0
                ? <div style={{ padding:"16px", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>No priority actions. Upload a study to get started.</div>
                : priorityActions.map((a,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 2fr 1.2fr", padding:"10px 16px", fontSize:13, borderBottom:i!==priorityActions.length-1?`1px solid ${C.border}`:"none", alignItems:"center" }}>
                    <div style={{ fontWeight:600, color:C.text }}>{a.study}</div>
                    <div><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:"#e8eefb", color:"#355c9a", fontWeight:600 }}>{a.workstream}</span></div>
                    <div style={{ color:C.textSec }}>{a.action}</div>
                    <div style={{ color:C.accent, fontSize:12, cursor:"pointer" }}>{a.next}</div>
                  </div>
                ))
              }
            </div>
          </div>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>Recently Updated Studies</h3>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", minHeight:80 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr", padding:"12px 16px", fontSize:12, fontWeight:600, color:"#7c8aa5", background:"#f8fafc", borderBottom:`1px solid ${C.border}` }}>
                <div>Study</div><div>Status</div><div>Last Updated</div><div>Owner</div>
              </div>
              {studies.length===0
                ? <div style={{ padding:"16px", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>No studies uploaded yet.</div>
                : studies.slice(0,5).map((s,i) => {
                  const pct = Math.round((s.filled/(s.filled+s.missing+s.confirm))*100)||0;
                  const statusLabel = pct>80?"Mostly Complete":pct>50?"In Progress":pct>20?"Early Stage":"Needs Attention";
                  const statusColor = pct>80?"#16a34a":pct>50?"#2563eb":pct>20?"#d97706":"#dc2626";
                  return (
                    <div key={i} onClick={() => onSelect && onSelect(s)} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr", padding:"10px 16px", fontSize:13, borderBottom:i!==Math.min(studies.length,5)-1?`1px solid ${C.border}`:"none", alignItems:"center", cursor:"pointer" }} onMouseEnter={e => e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background=""}>
                      <div>
                        <div style={{ fontWeight:600, color:C.text }}>{(s.title||"Untitled").substring(0,30)}{(s.title||"").length>30?"...":""}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{s.phases} · {s.sponsorType}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:statusColor+"18", color:statusColor, fontWeight:600 }}>{statusLabel}</span>
                        <span style={{ fontSize:11, color:C.textMuted }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted }}>{s.updated||"Just now"}</div>
                      <div style={{ fontSize:12, color:C.textSec }}>{s.coordinator||"—"}</div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>My Tasks</h3>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background:"#f8fafc" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Assigned to me</span>
                <span style={{ fontSize:11, fontWeight:700, color:filteredTasks.length?"#4f46e5":"#94a3b8" }}>{filteredTasks.length}</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {["All","Due Today","Overdue"].map(label => (
                  <button key={label} onClick={() => setTaskFilter(label)} style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:taskFilter===label?"#1f3b73":"#fff", color:taskFilter===label?"#fff":"#64748b", border:`1px solid ${taskFilter===label?"#1f3b73":C.border}`, cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>
                ))}
              </div>
            </div>
            {filteredTasks.length===0
              ? <div style={{ padding:"18px 16px", fontSize:13, color:C.textMuted }}>No tasks match this filter.</div>
              : filteredTasks.map((t,i) => (
                <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"14px 16px", borderBottom:i!==filteredTasks.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ width:6, height:6, borderRadius:999, background:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#16a34a", marginTop:8, flexShrink:0 }}/>
                  <div onClick={() => toggleTask(t.id)} style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checkedTasks[t.id]?"#1f3b73":C.border}`, background:checkedTasks[t.id]?"#1f3b73":"#fff", marginTop:2, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checkedTasks[t.id] && <span style={{ color:"#fff", fontSize:10, lineHeight:1 }}>✓</span>}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14, color:checkedTasks[t.id]?C.textMuted:C.text, lineHeight:1.4, textDecoration:checkedTasks[t.id]?"line-through":"none" }}>{t.title}</div>
                    <div style={{ fontSize:11, color:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#94a3b8", fontWeight:600, marginTop:2 }}>
                      {t.dueType==="dueToday"?"Due today":t.dueType==="overdue"?"Overdue":"Upcoming"}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};


export default RCDashboard;