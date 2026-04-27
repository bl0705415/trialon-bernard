

import React, { useState, useEffect } from "react";
import { supabase } from "../services/database";
import C from "../constants/colors";
import StudyPDFs from "../components/StudyPDFs";


// ─── Legal Dashboard (reads from Supabase) ────
const LegalDashboard = ({ onNav, onViewPDFs }) => {
  const [taskFilter,setTaskFilter]   = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));
  const [expandedSection,setExpandedSection] = useState(null);
  const [sharedStudies,setSharedStudies]     = useState([]);
  const [loadingStudies,setLoadingStudies]   = useState(true);

  useEffect(() => {
    supabase.from("studies").select("*").eq("archived",false).eq("pushed_to_legal",true).order("uploaded_at",{ascending:false}).then(({data,error}) => {
      if (!error && data) {
        setSharedStudies(data.map(r => ({
          studyId: r.id, title: r.title, sponsor: r.sponsor,
          phases: r.phases, pi: r.pi,
          contractSections:  r.contract_sections  || [],
          consentSections:   r.consent_sections   || [],
          uploadedAt:        r.uploaded_at,
          pushed_to_legal:   r.pushed_to_legal    || false,
          pushed_to_cro:     r.pushed_to_cro      || false,
        })));
      }
      setLoadingStudies(false);
    });
  }, []);

  const updateSectionStatus = (studyId, sectionId, type, newStatus) => {
    setSharedStudies(prev => {
      const next = prev.map(s => {
        if (s.studyId !== studyId) return s;
        const key  = type==="contract" ? "contractSections" : "consentSections";
        const dbKey= type==="contract" ? "contract_sections" : "consent_sections";
        const updated = {...s, [key]: s[key].map(sec => sec.id===sectionId ? {...sec,legalStatus:newStatus} : sec)};
        supabase.from("studies").update({[dbKey]: updated[key]}).eq("id", studyId).then(({error}) => { if(error) console.error("Update error:", error); });
        return updated;
      });
      return next;
    });
  };

  const allContracts    = sharedStudies.flatMap(s => s.contractSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId,sponsor:s.sponsor})));
  const allConsent      = sharedStudies.flatMap(s => s.consentSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId})));
  const pendingContracts= allContracts.filter(c => c.legalStatus==="pending").length;
  const approvedContracts=allContracts.filter(c => c.legalStatus==="approved").length;
  const flaggedContracts= allContracts.filter(c => c.legalStatus==="flagged").length;
  const riskItems       = [...allContracts.filter(c=>c.legalStatus==="flagged"), ...allConsent.filter(c=>c.legalStatus==="flagged")];

  const legalTasks = sharedStudies.flatMap(s => {
    const t=[]; const name=(s.title||"Study").substring(0,25);
    s.contractSections.filter(c=>c.legalStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-c-${c.id}`,title:`Review ${c.title} — ${name}`,study:name,tag:"Contract",dueText:"Due today",dueType:"dueToday"}));
    s.consentSections.filter(c=>c.legalStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ic-${c.id}`,title:`Review ${c.title} (ICF) — ${name}`,study:name,tag:"Consent",dueText:"Due today",dueType:"dueToday"}));
    s.contractSections.filter(c=>c.legalStatus==="flagged").forEach(c=>t.push({id:`${s.studyId}-f-${c.id}`,title:`Resolve flagged ${c.title} — ${name}`,study:name,tag:"Risk",dueText:"Needs attention",dueType:"overdue"}));
    return t;
  });
  if (legalTasks.length===0) legalTasks.push({id:"empty",title:"No studies uploaded yet — waiting for RC to submit a protocol",study:"—",tag:"Info",dueText:"Pending",dueType:"upcoming"});
  const filteredTasks = taskFilter==="Due Today" ? legalTasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? legalTasks.filter(t=>t.dueType==="overdue") : legalTasks;

  const statusBadge = status => {
    const map = {pending:{bg:"#fef3c718",color:"#d97706",label:"Pending Review"},approved:{bg:"#dcfce718",color:"#16a34a",label:"Approved"},flagged:{bg:"#fee2e218",color:"#dc2626",label:"Flagged"}};
    const s = map[status]||map.pending;
    return <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:s.bg,color:s.color,fontWeight:600}}>{s.label}</span>;
  };

  if (loadingStudies) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Loading studies…</div>;


  return (
    <div style={{padding:"24px 0"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:700,color:C.text}}>Legal Reviewer Dashboard</h2>
        {sharedStudies.length===0 && <p style={{fontSize:13,color:C.textMuted,marginTop:6}}>No protocols uploaded yet. The RC needs to upload a study first.</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16,marginBottom:22}}>
        {[
          {label:"Contracts Pending Review",value:pendingContracts,color:"#d97706"},
          {label:"Sections Approved",value:approvedContracts,color:"#16a34a"},
          {label:"Sections Flagged",value:flaggedContracts,color:"#dc2626"},
          {label:"Studies Received",value:sharedStudies.length,color:"#2563eb"},
        ].map(card => (
          <div key={card.label} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:"16px 18px",minHeight:80,boxSizing:"border-box"}}>
            <div style={{fontSize:13,color:"#7c8aa5",marginBottom:8}}>{card.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:card.color}}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr",gap:16,alignItems:"start"}}>
        <div>
          {sharedStudies.map(study => (
            <div key={study.studyId} style={{marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>{study.title}</h3>
              <p style={{fontSize:12,color:C.textMuted,marginBottom:10}}>{study.sponsor} · {study.phases} · PI: {study.pi}</p>
              <StudyPDFs
                studyId={study.studyId}
                onViewPDFs={() => onViewPDFs(study)}
              />
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Contract Sections (CTA)</div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                  {study.contractSections.map((sec,i) => {
                    const key=`${study.studyId}-c-${sec.id}`;
                    return (
                      <div key={sec.id}>
                        <div onClick={() => setExpandedSection(expandedSection===key?null:key)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",cursor:"pointer",borderBottom:expandedSection===key||i!==study.contractSections.length-1?`1px solid ${C.border}`:"none"}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{sec.title}</span>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {statusBadge(sec.legalStatus)}
                            <span style={{fontSize:12,color:C.textMuted,transform:expandedSection===key?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                          </div>
                        </div>
                        {expandedSection===key && (
                          <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:i!==study.contractSections.length-1?`1px solid ${C.border}`:"none"}}>
                            <div style={{fontSize:12,fontWeight:600,color:C.textMuted,marginBottom:4}}>Extracted from Protocol:</div>
                            <div style={{fontSize:13,color:C.text,lineHeight:1.5,marginBottom:12,background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>{sec.source}</div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","approved")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.legalStatus==="approved"?"#16a34a":"#dcfce7",color:sec.legalStatus==="approved"?"#fff":"#16a34a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.legalStatus==="approved"?"✓ Approved":"Approve"}</button>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","flagged")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.legalStatus==="flagged"?"#dc2626":"#fee2e2",color:sec.legalStatus==="flagged"?"#fff":"#dc2626",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.legalStatus==="flagged"?"⚠ Flagged":"Flag for Review"}</button>
                              {sec.legalStatus!=="pending" && <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","pending")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSec,fontSize:12,fontWeight:600,cursor:"pointer"}}>Reset</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              
              {riskItems.length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Risk Alerts</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {riskItems.map((r,i) => (
                      <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center"}}>
                        <div style={{width:3,height:24,borderRadius:999,background:"#dc2626",marginRight:12,flexShrink:0}}/>
                        <div><span style={{fontSize:13,fontWeight:600,color:C.text}}>{r.title}</span><span style={{fontSize:12,color:C.textMuted,marginLeft:8}}>— {r.studyTitle||study.title}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {sharedStudies.length===0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⏳</div>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:6}}>Waiting for Protocol Upload</div>
              <div style={{fontSize:13,color:C.textMuted}}>The Regulatory Coordinator needs to upload a protocol PDF. Once uploaded, contract and consent sections will appear here for your review.</div>
            </div>
          )}
        </div>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:10}}>My Tasks</h3>
          <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:"#f8fafc"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Assigned to me</span>
                <span style={{fontSize:11,fontWeight:700,color:filteredTasks.length?"#4f46e5":"#94a3b8"}}>{filteredTasks.length}</span>
              </div>
              <div style={{display:"flex",gap:4}}>
                {["All","Due Today","Overdue"].map(label => <button key={label} onClick={() => setTaskFilter(label)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:taskFilter===label?"#1f3b73":"#fff",color:taskFilter===label?"#fff":"#64748b",border:`1px solid ${taskFilter===label?"#1f3b73":C.border}`,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>)}
              </div>
            </div>
            {filteredTasks.length===0 ? <div style={{padding:"18px 16px",fontSize:13,color:C.textMuted}}>No tasks match this filter.</div> :
              filteredTasks.map((t,i) => (
                <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px",borderBottom:i!==filteredTasks.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:999,background:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#16a34a",marginTop:8,flexShrink:0}}/>
                  <div onClick={() => toggleTask(t.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checkedTasks[t.id]?"#1f3b73":C.border}`,background:checkedTasks[t.id]?"#1f3b73":"#fff",marginTop:2,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {checkedTasks[t.id] && <span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:checkedTasks[t.id]?C.textMuted:C.text,lineHeight:1.4,marginBottom:4,textDecoration:checkedTasks[t.id]?"line-through":"none"}}>{t.title}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#e8eefb",color:"#355c9a",fontWeight:600}}>{t.study}</span>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#f3f4f6",color:"#8b5e3c",fontWeight:600}}>{t.tag}</span>
                      <span style={{fontSize:11,color:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#94a3b8",fontWeight:600}}>{t.dueText}</span>
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

export default LegalDashboard;