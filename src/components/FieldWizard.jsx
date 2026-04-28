/**
 * AI Attribution:
 * ChatGPT assisted with UI structure and state handling logic.
 * The final implementation and integration were completed manually.
 */

import React, { useState } from "react";
import C from "../constants/colors";


// ─── Missing Fields Wizard ────
const FieldWizard = ({ missingFields, extractedData, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [val, setVal] = useState("");
  const field = missingFields[idx];
  const total = missingFields.length;
  const pct = Math.round((idx / total) * 100);

  const advance = (value) => {
    const newAnswers = { ...answers, [field.id]: value };
    setAnswers(newAnswers);
    setVal("");
    if (idx + 1 >= total) {
      onComplete({ ...extractedData, ...newAnswers });
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ width:520, background:"#fff", borderRadius:16, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", padding:"44px 48px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#fff" }}>⚕</div>
          <span style={{ fontSize:18, fontWeight:700 }}>Trial<span style={{ color:"#3b82f6" }}>ON</span></span>
        </div>
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMuted, marginBottom:8 }}>
            <span>Field {idx + 1} of {total}</span>
            <span>{pct}% complete</span>
          </div>
          <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"#3b82f6", borderRadius:3, transition:"width 0.3s" }} />
          </div>
        </div>
        <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:C.accentLight, color:C.accent, fontSize:11, fontWeight:600, marginBottom:12 }}>
          {field.category}
        </div>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8, lineHeight:1.3 }}>{field.label}</h2>
        <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>This field couldn't be extracted from the PDF. Please enter it manually.</p>

        {field.type === "yesno" ? (
          <div style={{ display:"flex", gap:12, marginBottom:28 }}>
            {["Yes","No"].map(o => (
              <button key={o} onClick={() => advance(o)}
                style={{ flex:1, padding:"14px 0", borderRadius:8, border:`2px solid ${val===o?"#3b82f6":"#e2e8f0"}`, background:val===o?"#eff6ff":"#fff", color:val===o?"#1e40af":"#374151", fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                {o}
              </button>
            ))}
          </div>
        ) : field.type === "select" ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:28 }}>
            {field.options.map(o => (
              <button key={o} onClick={() => setVal(o)}
                style={{ padding:"10px 16px", borderRadius:8, border:`2px solid ${val===o?"#3b82f6":"#e2e8f0"}`, background:val===o?"#eff6ff":"#fff", color:val===o?"#1e40af":"#374151", fontSize:13, fontWeight:val===o?600:400, cursor:"pointer", transition:"all 0.15s" }}>
                {o}
              </button>
            ))}
          </div>
        ) : field.type === "textarea" ? (
          <textarea value={val} onChange={e => setVal(e.target.value)} rows={4}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", resize:"vertical", lineHeight:1.6, marginBottom:28, outline:"none" }} />
        ) : (
          <input value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key==="Enter" && val.trim() && advance(val.trim())}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", marginBottom:28, outline:"none" }} />
        )}

        {field.type !== "yesno" && (
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={() => advance("N/A")}
              style={{ flex:1, padding:"12px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", color:"#6b7280", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
              Skip for now
            </button>
            <button onClick={() => advance(val.trim() || "N/A")} disabled={!val.trim() && field.type !== "select"}
              style={{ flex:2, padding:"12px 0", borderRadius:8, border:"none", background:(val.trim()||field.type==="select")?"#3b82f6":"#e2e8f0", color:(val.trim()||field.type==="select")?"#fff":"#94a3b8", fontSize:14, fontWeight:600, cursor:(val.trim()||field.type==="select")?"pointer":"not-allowed", fontFamily:"inherit" }}>
              {idx+1>=total ? "Finish →" : "Next →"}
            </button>
          </div>
        )}
        <p style={{ textAlign:"center", fontSize:12, color:C.textMuted, marginTop:16 }}>{total-idx-1} fields remaining after this</p>
      </div>
    </div>
  );
};


export default FieldWizard;