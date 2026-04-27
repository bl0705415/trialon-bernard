import React from "react";
import { PERSONAS } from "../constants/personas";

// ─── TopBar ────
const TopBar = ({ persona, userName, onSignOut }) => {
  const pN = { [PERSONAS.R]:"Study Coordinator", [PERSONAS.L]:"Legal Reviewer", [PERSONAS.S]:"Sponsor / CRO" };
  const avatarC = { [PERSONAS.R]:"#3b82f6", [PERSONAS.L]:"#16a34a", [PERSONAS.S]:"#8b5cf6" };
  const displayName = userName ? userName.split("@")[0].split(".").map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(" ") : "User";
  const initials = displayName.split(" ").map(w => w.charAt(0)).join("").substring(0,2).toUpperCase();
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:"#fff", borderBottom:"1px solid #e5e7eb" }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#9ca3af", pointerEvents:"none" }}>🔍</span>
        <input placeholder="Search studies, tasks, documents..." style={{ padding:"9px 14px 9px 36px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:13, width:300, fontFamily:"inherit", background:"#f9fafb", color:"#374151" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, color:"#6b7280" }}><span style={{ fontSize:15 }}>🔔</span><span style={{ fontSize:13 }}>Notifications</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:avatarC[persona], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700 }}>{initials}</div>
          <div><div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{displayName}</div><div style={{ fontSize:11, color:"#6b7280" }}>{pN[persona]}</div></div>
          <button onClick={onSignOut} style={{ marginLeft:8, padding:"5px 12px", borderRadius:6, border:"1px solid #e5e7eb", background:"#fff", color:"#6b7280", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
};

export default TopBar