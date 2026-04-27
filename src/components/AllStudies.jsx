
import React, { useState } from "react";
import C from "../constants/colors";
import Badge from "./Badge";

// ─── AllStudies ────
const AllStudies = ({ studies, onSelect, onNew, onDelete }) => {
  const [filter,setFilter] = useState(""); const [showFilter,setShowFilter] = useState(false);
  const filtered = filter ? studies.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || s.sponsor?.toLowerCase().includes(filter.toLowerCase())) : studies;
  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:700 }}>All Studies</h2>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onNew} style={{ padding:"8px 16px", borderRadius:4, border:"none", background:C.accent, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>START NEW STUDY</button>
          <button onClick={() => setShowFilter(s => !s)} style={{ padding:"8px 16px", borderRadius:4, border:`1px solid ${C.border}`, background:showFilter?C.accentLight:C.surface, color:showFilter?C.accent:C.textSec, fontSize:12, fontWeight:600, cursor:"pointer" }}>🔽 FILTER</button>
        </div>
      </div>
      {showFilter && <div style={{ marginBottom:12 }}><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by title or product..." style={{ padding:"8px 12px", borderRadius:4, border:`1px solid ${C.border}`, fontSize:13, width:300, boxSizing:"border-box" }}/>{filter && <button onClick={() => setFilter("")} style={{ marginLeft:8, fontSize:12, color:C.red, background:"none", border:"none", cursor:"pointer" }}>✕ Clear</button>}</div>}
      <div style={{ background:C.surface, borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${C.border}`, textAlign:"left" }}>
            {["STUDY TITLE","PRODUCT","PHASE","PROGRESS","TOP BLOCKER","MY NEXT TASK","LAST UPDATED",""].map(h => <th key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((s,i) => { const pct = Math.round((s.filled/(s.filled+s.missing+s.confirm))*100)||0; return (
              <tr key={i} onClick={() => onSelect(i)} style={{ borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer" }} onMouseEnter={e => e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background=""}>
                <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:600 }}>{(s.title||"Untitled").substring(0,40)}{(s.title||"").length>40?"...":""}</div><div style={{ fontSize:11, color:C.textMuted }}>{s.sponsor} · {s.phases}</div></td>
                <td style={{ padding:"12px 14px", color:C.textSec }}>{s.sponsorType||"—"}</td>
                <td style={{ padding:"12px 14px" }}><Badge status={s.phases?"accepted":"pending"}/></td>
                <td style={{ padding:"12px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:80, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}><div style={{ width:`${pct}%`, height:"100%", background:pct>60?C.green:pct>30?C.yellow:C.red, borderRadius:3 }}/></div><span style={{ fontSize:11, color:C.textMuted }}>{pct}%</span></div></td>
                <td style={{ padding:"12px 14px" }}>{s.blocker ? <span style={{ color:C.red, fontSize:12 }}>⚠ {s.blocker}</span> : <span style={{ color:C.textMuted, fontSize:12 }}>—</span>}</td>
                <td style={{ padding:"12px 14px" }}><span style={{ color:C.accent, fontSize:12 }}>{s.nextTask||"Review docs"} →</span></td>
                <td style={{ padding:"12px 14px", color:C.textMuted, fontSize:12 }}>{s.updated||"Just now"}</td>
                <td style={{ padding:"12px 14px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this study?")) onDelete(s.studyId || s.id);
                    }}
                    style={{ padding:"5px 10px", borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>{studies.length===0 ? "No studies yet. Click \"Start New Study\" to begin." : "No studies match your filter."}</div>}
      </div>
    </div>
  );
};

export default AllStudies;