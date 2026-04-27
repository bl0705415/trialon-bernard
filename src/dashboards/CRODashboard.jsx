

import React, { useState, useEffect } from "react";
import C from "../constants/colors";
import { supabase } from "../services/database";
import StudyPDFs from "../components/StudyPDFs";


// ─── CRO Dashboard (reads from Supabase) ────
const CRODashboard = ({ onNav, onViewPDFs }) => {
  const [taskFilter,setTaskFilter]   = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));
  const [expandedSection,setExpandedSection] = useState(null);
  const [sharedStudies,setSharedStudies]     = useState([]);
  const [loadingStudies,setLoadingStudies]   = useState(true);

  useEffect(() => {
    supabase.from("studies").select("*").eq("archived",false).eq("pushed_to_cro",true).order("uploaded_at",{ascending:false}).then(({data,error}) => {
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
        const updated = {...s, [key]: s[key].map(sec => sec.id===sectionId ? {...sec,croStatus:newStatus} : sec)};
        supabase.from("studies").update({[dbKey]: updated[key]}).eq("id", studyId).then(({error}) => { if(error) console.error("Update error:", error); });
        return updated;
      });
      return next;
    });
  };

  const allContracts  = sharedStudies.flatMap(s => s.contractSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId,sponsor:s.sponsor})));
  const allConsent    = sharedStudies.flatMap(s => s.consentSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId})));
  const inNegotiation = allContracts.filter(c => c.croStatus==="pending"||c.croStatus==="countered").length;
  const awaitingSite  = allContracts.filter(c => c.legalStatus==="flagged").length;
  const consentReview = allConsent.filter(c => c.croStatus==="pending").length;
  const croApproved   = allContracts.filter(c=>c.croStatus==="approved").length + allConsent.filter(c=>c.croStatus==="approved").length;

  const croTasks = sharedStudies.flatMap(s => {
    const t=[]; const name=(s.title||"Study").substring(0,25);
    s.contractSections.filter(c=>c.legalStatus==="approved"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ca-${c.id}`,title:`Review Legal-approved ${c.title} — ${name}`,study:name,tag:"Contract",dueText:"Due today",dueType:"dueToday"}));
    s.consentSections.filter(c=>c.legalStatus==="approved"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ica-${c.id}`,title:`Review Legal-approved ${c.title} (ICF) — ${name}`,study:name,tag:"Consent",dueText:"Due today",dueType:"dueToday"}));
    s.contractSections.filter(c=>c.legalStatus==="flagged").forEach(c=>t.push({id:`${s.studyId}-cf-${c.id}`,title:`Respond to flagged ${c.title} — ${name}`,study:name,tag:"Negotiation",dueText:"Needs response",dueType:"overdue"}));
    s.contractSections.filter(c=>c.legalStatus==="pending"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-cp-${c.id}`,title:`Awaiting Legal review of ${c.title} — ${name}`,study:name,tag:"Waiting",dueText:"Pending",dueType:"upcoming"}));
    return t;
  });
  if (croTasks.length===0) croTasks.push({id:"empty",title:"No studies uploaded yet — waiting for RC to submit a protocol",study:"—",tag:"Info",dueText:"Pending",dueType:"upcoming"});
  const filteredTasks = taskFilter==="Due Today" ? croTasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? croTasks.filter(t=>t.dueType==="overdue") : croTasks;

  const legalBadge = status => { const map={pending:{color:"#94a3b8",label:"Legal: Pending"},approved:{color:"#16a34a",label:"Legal: Approved"},flagged:{color:"#dc2626",label:"Legal: Flagged"}}; const s=map[status]||map.pending; return <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:s.color+"18",color:s.color,fontWeight:600}}>{s.label}</span>; };
  const croBadge  = status => { const map={pending:{color:"#d97706",label:"Pending"},approved:{color:"#16a34a",label:"Approved"},countered:{color:"#7c3aed",label:"Countered"}}; const s=map[status]||map.pending; return <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:s.color+"18",color:s.color,fontWeight:600}}>{s.label}</span>; };

  if (loadingStudies) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Loading studies…</div>;

  return (
    <div style={{padding:"24px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
        <h2 style={{fontSize:24,fontWeight:700,color:C.text}}>Sponsor / CRO Dashboard</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16,marginBottom:24}}>
        {[
          {label:"In Negotiation",value:inNegotiation,color:"#d97706"},
          {label:"Flagged by Legal",value:awaitingSite,color:"#dc2626"},
          {label:"Consent Under Review",value:consentReview,color:"#2563eb"},
          {label:"Sections Approved",value:croApproved,color:"#16a34a"},
        ].map(card => (
          <div key={card.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",minHeight:88,boxSizing:"border-box"}}>
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
                <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Consent Form (ICF)</div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                  {study.consentSections.map((sec,i) => {
                    const key=`${study.studyId}-ic-${sec.id}`;
                    return (
                      <div key={sec.id}>
                        <div onClick={() => setExpandedSection(expandedSection===key?null:key)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",cursor:"pointer",borderBottom:expandedSection===key||i!==study.consentSections.length-1?`1px solid ${C.border}`:"none"}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{sec.title}</span>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            {legalBadge(sec.legalStatus)}{croBadge(sec.croStatus)}
                            <span style={{fontSize:12,color:C.textMuted,transform:expandedSection===key?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                          </div>
                        </div>
                        {expandedSection===key && (
                          <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:i!==study.consentSections.length-1?`1px solid ${C.border}`:"none"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                              <div style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                                <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:4}}>Protocol Data (from RC Upload)</div>
                                <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{sec.source}</div>
                              </div>
                              <div style={{background:sec.legalStatus==="approved"?"#dcfce7":sec.legalStatus==="flagged"?"#fee2e2":"#f8fafc",borderRadius:8,padding:"10px 12px",border:`1px solid ${sec.legalStatus==="approved"?"#bbf7d0":sec.legalStatus==="flagged"?"#fecaca":C.border}`}}>
                                <div style={{fontSize:11,fontWeight:700,color:sec.legalStatus==="approved"?"#166534":sec.legalStatus==="flagged"?"#991b1b":"#64748b",marginBottom:4}}>Legal Review Status</div>
                                <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{sec.legalStatus==="approved"?"Legal has approved this section.":sec.legalStatus==="flagged"?"Legal has flagged this section for risk concerns.":"Awaiting legal review."}</div>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","approved")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.croStatus==="approved"?"#16a34a":"#dcfce7",color:sec.croStatus==="approved"?"#fff":"#16a34a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.croStatus==="approved"?"✓ Accepted":"Accept"}</button>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","countered")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.croStatus==="countered"?"#7c3aed":"#f3f0ff",color:sec.croStatus==="countered"?"#fff":"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.croStatus==="countered"?"↺ Countered":"Counter-Propose"}</button>
                              {sec.croStatus!=="pending" && <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","pending")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSec,fontSize:12,fontWeight:600,cursor:"pointer"}}>Reset</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {sharedStudies.length===0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⏳</div>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:6}}>Waiting for Protocol Upload</div>
              <div style={{fontSize:13,color:C.textMuted}}>The Regulatory Coordinator needs to upload a protocol PDF. Once uploaded, the proposed agreement and consent form will appear here.</div>
            </div>
          )}
        </div>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:10}}>My Tasks</h3>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
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
                    <div style={{fontSize:14,color:checkedTasks[t.id]?C.textMuted:C.text,lineHeight:1.4,textDecoration:checkedTasks[t.id]?"line-through":"none"}}>{t.title}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:4}}>
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


export default CRODashboard;