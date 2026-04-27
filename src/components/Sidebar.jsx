

import React from "react";
import {
  LayoutGrid,
  FolderKanban,
  Clock3,
  FileText,
  Hexagon
} from "lucide-react";


// ─── Sidebar ────
const Sidebar = ({ persona, page, onNav }) => {
  const items = [
    { id:"study",     label:"Dashboard", icon:LayoutGrid },
    { id:"studies",   label:"Studies",   icon:FolderKanban },
    { id:"review",    label:"Tasks",     icon:Clock3 },
    { id:"reviewTmpl",label:"Documents", icon:FileText },
    { id:"readiness", label:"Reports",   icon:Hexagon },
  ];
  return (
    <div style={{ width:180, background:"#183B73", minHeight:"100vh", paddingTop:20, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"0 20px", marginBottom:32, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff" }}>⚕</div>
        <span style={{ fontSize:18, fontWeight:700, color:"#fff" }}>Trial<span style={{ color:"#60a5fa" }}>ON</span></span>
      </div>
      {items.map(item => {
        const active = page === item.id ||
          (item.id === "study"   && ["study","activation","readiness"].includes(page)) ||
          (item.id === "studies" && ["studies","upload","fields","wizard"].includes(page)) ||
          (item.id === "reviewTmpl" && ["legalDocs"].includes(page));
        const Icon = item.icon;
        return (
          <button key={item.label} onClick={() => onNav(item.id)}
            style={{ margin:"0 12px 12px", padding:"14px 16px", border:"none", borderRadius:16, background:active?"#2F5DB3":"transparent", color:active?"#ffffff":"#8FB0DD", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <Icon size={22} strokeWidth={2} />
              <span style={{ fontSize:16, fontWeight:active?600:500 }}>{item.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;