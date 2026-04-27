


import React from "react";
import C from "../constants/colors";


// ─── Activation Map ────
const ActivationMap = ({ onBack, onNav }) => {
  const steps = [{ name: "INTAKE", status: "complete", desc: "Submit IRB application and approvals" }, { name: "IRB", status: "active", desc: "Submit IRB application and approvals" }, { name: "CONTRACT", status: "locked", desc: "Clinical trial agreement review" }, { name: "BUDGET", status: "locked", desc: "Budget negotiation and approval" }, { name: "ACTIVATION READINESS", status: "locked", desc: "Final activation checklist" }];
  const icons = { complete: "✅", active: "📝", locked: "🔒" };
  const colors = { complete: C.green, active: C.accent, locked: C.textDim };
  return (
    <div style={{ padding: "24px 0", maxWidth: 500 }}>
      <button onClick={onBack} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>← Go back</button>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Activation Map</h2>
      {steps.map((s, i) => (
        <div key={s.name} style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: s.status === "locked" ? C.bg : s.status === "complete" ? C.greenBg : C.accentLight, border: `2px solid ${ colors[s.status] }`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icons[s.status]}</div>
            {i < steps.length - 1 && <div style={{ width: 2, height: 40, background: C.border }} />}
          </div>
          <div style={{ paddingTop: 4, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.status === "locked" ? C.textMuted : C.text }}>{s.name}</span>
              {s.status === "active" && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: C.redBg, color: C.red }}>BLOCKED</span>}
              {s.status === "complete" && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: C.greenBg, color: C.green }}>COMPLETE</span>}
            </div>
            {s.status !== "locked" && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{s.desc}</div>}
            {s.status === "locked" && <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, fontStyle: "italic" }}>Locked until previous steps complete</div>}
            {s.status === "active" && <button onClick={() => onNav("review")} style={{ marginTop: 6, padding: "4px 12px", borderRadius: 4, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>GO TO IRB →</button>}
            <div style={{ height: i < steps.length - 1 ? 16 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivationMap;