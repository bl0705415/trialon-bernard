

import React from "react";
import C from "../constants/colors";

// ─── Activation Readiness ────
const ActivationReadiness = ({ data, onBack, onNav }) => {
  const pct = 65;
  const remaining = [{ item: "IRB not approved", owner: "Regulatory", nav: "review" }, { item: "Contract not signed", owner: "Legal", nav: "review" }, { item: "Budget not final", owner: "Finance", nav: "review" }];
  return (
    <div style={{ padding: "24px 0", maxWidth: 600 }}>
      <button onClick={onBack} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>← Go back</button>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>ACTIVATION READINESS</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke={C.border} strokeWidth="12" /><circle cx="80" cy="80" r="70" fill="none" stroke={C.accent} strokeWidth="12" strokeDasharray={`${ pct * 4.4 } 440`} strokeLinecap="round" transform="rotate(-90 80 80)" /></svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>ACTIVATION</div><div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>READY</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{pct}%</div>
          </div>
        </div>
      </div>
      {remaining.map((r, i) => (
        <div key={i} style={{ background: C.surface, borderRadius: 6, border: `1px solid ${ C.border }`, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r.item}</div><div style={{ fontSize: 11, color: C.textMuted }}>Owner: {r.owner}</div></div>
          <button onClick={() => onNav && onNav(r.nav)} style={{ padding: "4px 12px", borderRadius: 4, border: `1px solid ${ C.border }`, background: C.surface, fontSize: 11, fontWeight: 600, color: C.accent, cursor: "pointer" }}>GO TO {r.item.split(" ")[0].toUpperCase()} →</button>
        </div>
      ))}
    </div>
  );
};

export default ActivationReadiness;