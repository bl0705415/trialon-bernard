


import React, { useState } from "react";
import C from "../constants/colors";
import Badge from "./Badge";
import { ST } from "../constants/status";

// ─── IRB Review ────
const IRBReview = ({ tmpl, onBack }) => {
  const [data,setData] = useState(() => { const d={}; tmpl.sections.forEach(s=>s.fields.forEach(f=>{d[f.id]=f.value??"";})); return d; });
  const [sec,setSec]   = useState(tmpl.sections[0].id);
  const [saved,setSaved]       = useState(false);
  const [confirmed,setConfirmed] = useState(false);
  const cur   = tmpl.sections.find(s => s.id===sec);
  const stats = tmpl.sections.flatMap(s=>s.fields).reduce((a,f) => { a[f.status]=(a[f.status]||0)+1; a.total++; return a; }, {total:0});
  const inp   = { width:"100%", padding:"9px 12px", borderRadius:4, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", fontFamily:"inherit" };
  return (
    <div style={{padding:"24px 0"}}>
      <button onClick={onBack} style={{fontSize:12,color:C.accent,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Back</button>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{tmpl.icon} {tmpl.name}</h2>
      {(saved||confirmed) && <div style={{background:saved?C.accentLight:C.greenBg,border:`1px solid ${saved?C.accent:C.green}`,borderRadius:6,padding:"8px 14px",marginBottom:12,fontSize:13,color:saved?C.accent:C.green,fontWeight:600}}>{saved?"✓ Changes saved.":"✓ Section confirmed!"}</div>}
      <div style={{display:"flex",gap:24}}>
        <div style={{width:200,flexShrink:0}}>
          <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:14,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.green}}>Auto-Filled</span><span style={{fontWeight:700}}>{stats[ST.AUTO]||0}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.yellow}}>Confirm</span><span style={{fontWeight:700}}>{stats[ST.CONFIRM]||0}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:C.red}}>Missing</span><span style={{fontWeight:700}}>{stats[ST.MISSING]||0}</span></div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>Sections</div>
          {tmpl.sections.map(s => { const ss=s.fields.reduce((a,f)=>{a[f.status]=(a[f.status]||0)+1;return a;},{}); return (
            <button key={s.id} onClick={() => setSec(s.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:4,border:"none",background:sec===s.id?C.accentLight:"transparent",color:sec===s.id?C.accent:C.textSec,fontSize:12,fontWeight:sec===s.id?700:400,cursor:"pointer",marginBottom:2}}>
              <span>{s.title}</span><span style={{width:8,height:8,borderRadius:"50%",background:ss[ST.MISSING]?C.red:ss[ST.CONFIRM]?C.yellow:C.green}}/>
            </button>
          );})}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>{cur?.title}</h3>
          {cur?.fields.map(field => (
            <div key={field.id} style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{fontSize:13,fontWeight:600}}>{field.label}</label><Badge status={field.status}/></div>
              {field.type==="textarea" ? <textarea value={data[field.id]} onChange={e=>setData({...data,[field.id]:e.target.value})} rows={Math.min(Math.max((data[field.id]||"").split("\n").length+1,3),8)} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
              : field.type==="yesno" ? <div style={{display:"flex",gap:8}}>{["Yes","No"].map(o=><button key={o} onClick={()=>setData({...data,[field.id]:o})} style={{padding:"6px 20px",borderRadius:4,border:`1px solid ${data[field.id]===o?C.accent:C.border}`,background:data[field.id]===o?C.accentLight:C.surface,color:data[field.id]===o?C.accent:C.textMuted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{o}</button>)}</div>
              : <input value={data[field.id]} onChange={e=>setData({...data,[field.id]:e.target.value})} style={inp}/>}
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button onClick={() => {setSaved(true);setTimeout(()=>setSaved(false),2000);}} style={{padding:"8px 18px",borderRadius:4,border:"none",background:C.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>SAVE</button>
            <button onClick={() => {setConfirmed(true);setTimeout(()=>setConfirmed(false),2000);}} style={{padding:"8px 18px",borderRadius:4,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>CONFIRM ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default IRBReview;