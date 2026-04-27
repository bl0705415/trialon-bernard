import { useState } from "react";
import { USERS } from "../constants/users";


// ─── Login ────
const Login = ({ onLogin }) => {
  const [user,setUser] = useState(""); const [pass,setPass] = useState(""); const [err,setErr] = useState(null);
  const inp = { width:"100%", padding:"11px 14px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", fontFamily:"inherit", background:"#fff" };
  const handleSignIn = () => {
    const u = user.trim().toLowerCase();
    const account = USERS[u];
    if (!account) { setErr("Email not recognized."); return; }
    if (pass !== account.password) { setErr("Incorrect password."); return; }
    setErr(null); onLogin(account.persona, user);
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ width:"42%", background:"linear-gradient(160deg,#1a2332 0%,#1e3a5f 100%)", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 56px", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:300, height:300, background:"radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:44 }}>
            <div style={{ width:38, height:38, borderRadius:8, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#fff" }}>⚕</div>
            <span style={{ fontSize:30, fontWeight:800, letterSpacing:-0.5 }}>Trial<span style={{ color:"#60a5fa" }}>ON</span></span>
          </div>
          <h1 style={{ fontSize:30, fontWeight:700, lineHeight:1.3, marginBottom:14 }}>Clinical Trial<br/>Startup Platform</h1>
          <p style={{ fontSize:15, color:"#94a3b8", lineHeight:1.7, marginBottom:48 }}>Streamline your clinical trial activation from intake to site readiness.</p>
          {[{icon:"📋",text:"Streamlined IRB submissions & regulatory workflows"},{icon:"⚖️",text:"Automated contract review & legal compliance"},{icon:"📊",text:"Real-time activation tracking & reporting"}].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
              <div style={{ width:38, height:38, borderRadius:8, background:"rgba(59,130,246,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{item.icon}</div>
              <span style={{ fontSize:13, color:"#94a3b8", lineHeight:1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
        <div style={{ width:420, background:"#fff", borderRadius:12, padding:"44px 40px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:6 }}>Welcome to TrialOn</h2>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>Sign in to your account to continue</p>
          {err && <div style={{ background:"#fef2f2", color:"#dc2626", borderRadius:6, padding:"10px 14px", fontSize:13, marginBottom:16, border:"1px solid #fecaca" }}>{err}</div>}
          <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email</label>
          <input value={user} onChange={e => { setUser(e.target.value); setErr(null); }} placeholder="rc@test.com" style={{ ...inp, marginBottom:20 }}/>
          <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Password</label>
          <input type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(null); }} placeholder="••••••••" onKeyDown={e => { if(e.key==="Enter") handleSignIn(); }} style={{ ...inp, marginBottom:28 }}/>
          <button onClick={handleSignIn} style={{ width:"100%", padding:"12px 0", borderRadius:6, border:"none", background:user.trim()&&pass.trim()?"#3b82f6":"#e2e8f0", color:user.trim()&&pass.trim()?"#fff":"#94a3b8", fontSize:14, fontWeight:600, cursor:user.trim()&&pass.trim()?"pointer":"not-allowed" }}>Sign In</button>
          <div style={{ marginTop:20, padding:"14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:12, color:"#64748b" }}>
            <div style={{ fontWeight:600, marginBottom:6 }}>Test accounts:</div>
            <div>rc@test.com / test345 → Coordinator</div>
            <div>legal@test.com / test234 → Legal</div>
            <div>cro@test.com / test123 → Sponsor</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;