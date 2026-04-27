

import React from "react";
import C from "../constants/colors";
import { ST } from "../constants/status";

// ─── Review Docs ────
const ReviewDocs = ({ templates, onSelect, onContinue, onCancel }) => (
  <div style={{ padding: "24px 0" }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Review Documents</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
      {Object.entries(templates).map(([key, tmpl]) => {
        const stats = tmpl.sections.flatMap(s => s.fields).reduce((a, f) => { a[f.status] = (a[f.status] || 0) + 1; a.total++; return a; }, { total: 0 }); return (
          <div key={key} onClick={() => onSelect(key)} style={{ background: C.surface, borderRadius: 8, border: `1px solid ${ C.border }`, padding: 20, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{tmpl.icon} {tmpl.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{tmpl.desc}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>● {stats[ST.AUTO] || 0}</span>
              <span style={{ fontSize: 10, color: C.yellow, fontWeight: 600 }}>● {stats[ST.CONFIRM] || 0}</span>
              <span style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>● {stats[ST.MISSING] || 0}</span>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={onContinue} style={{ padding: "9px 22px", borderRadius: 4, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>CONTINUE</button>
      <button onClick={onCancel} style={{ padding: "9px 22px", borderRadius: 4, border: "none", background: C.red, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>CANCEL</button>
    </div>
  </div>
);


export default ReviewDocs;