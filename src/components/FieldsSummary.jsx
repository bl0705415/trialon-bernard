
/**
 * AI Attribution:
 * ChatGPT assisted with UI structure and state handling logic.
 * The final implementation and integration were completed manually.
 */

import React, { useState } from "react";
import { PROTOCOL_FIELDS } from "../constants/protocolFields";
import C from "../constants/colors";


// ─── Fields Summary ────
const FieldsSummary = ({ extractedData, onContinue, editable }) => {
  const [data, setData] = useState(extractedData);
  const categories = [...new Set(PROTOCOL_FIELDS.map(f => f.category))];
  const filled = PROTOCOL_FIELDS.filter(f => data[f.id] && data[f.id] !== "N/A" && data[f.id] !== "").length;
  const inp = { width:"100%", padding:"7px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", background:"#fff", marginTop:4 };

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>
            {editable ? "Protocol Fields — Fill Missing" : "Protocol Fields Extracted"}
          </h2>
          <p style={{ fontSize:13, color:C.textMuted }}>
            {editable ? `${50 - filled} fields still need input` : `${filled} of 50 fields successfully filled`}
          </p>
        </div>
        <button onClick={() => onContinue(data)} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          {editable ? "Save & Continue →" : "Continue to Documents →"}
        </button>
      </div>
      <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:28 }}>
        <div style={{ width:`${Math.round(filled/50*100)}%`, height:"100%", background:C.green, borderRadius:3 }} />
      </div>
      {categories.map(cat => {
        const fields = PROTOCOL_FIELDS.filter(f => f.category === cat);
        return (
          <div key={cat} style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, padding:20, marginBottom:16 }}>
            <h3 style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>{cat}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 24px" }}>
              {fields.map(f => {
                const v = data[f.id];
                const empty = !v || v === "N/A" || v === "";
                const canEdit = editable && empty;
                return (
                  <div key={f.id} style={{ borderBottom:`1px solid ${C.borderLight}`, paddingBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.textMuted }}>{f.label}</span>
                      {empty && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:3, background:C.redBg, color:C.red, fontWeight:600 }}>MISSING</span>}
                    </div>
                    {canEdit ? (
                      f.type === "yesno" ? (
                        <div style={{ display:"flex", gap:8, marginTop:6 }}>
                          {["Yes","No"].map(o => (
                            <button key={o} onClick={() => setData({...data, [f.id]: o})}
                              style={{ padding:"5px 16px", borderRadius:6, border:`1.5px solid ${data[f.id]===o?"#3b82f6":"#e2e8f0"}`, background:data[f.id]===o?"#eff6ff":"#fff", color:data[f.id]===o?"#1e40af":"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              {o}
                            </button>
                          ))}
                        </div>
                      ) : f.type === "select" ? (
                        <select value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})} style={{...inp}}>
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})} rows={3}
                          placeholder={`Enter ${f.label.toLowerCase()}...`} style={{...inp, resize:"vertical", lineHeight:1.5}}/>
                      ) : (
                        <input value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})}
                          placeholder={`Enter ${f.label.toLowerCase()}...`} style={inp}/>
                      )
                    ) : (
                      <div style={{ fontSize:13, color:empty?C.textMuted:C.text, fontStyle:empty?"italic":"normal", marginTop:2 }}>
                        {empty ? "Not provided" : v}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <button onClick={() => onContinue(data)} style={{ width:"100%", padding:"14px 0", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", marginTop:8 }}>
        {editable ? "Save & Continue →" : "Continue to Documents →"}
      </button>
    </div>
  );
};

export default FieldsSummary;