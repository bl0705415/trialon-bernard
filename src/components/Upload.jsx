

import React, { useState, useCallback } from "react";
import C from "../constants/colors";
import { extractTextFromPDF } from "../utils/extractPdfText";
import { extractFieldsWithGPT, generateDocumentContent } from "../services/aiService";


// ─── Upload ────
const Upload = ({ onParsed, onCancel }) => {
    const [form, setForm] = useState({ studyTitle: "", sponsorName: "", piName: "", coordName: "", sponsorType: "Industry" });
    const [file, setFile] = useState(null); const [loading, setLoading] = useState(false); const [prog, setProg] = useState(0); const [progMsg, setProgMsg] = useState(""); const [err, setErr] = useState(null);
    const handleFile = useCallback(f => { if (!f) return; if (!f.name.endsWith(".pdf")) { setErr("Please upload a PDF file."); return; } setFile(f); setErr(null); }, []);
    const inp = { width: "100%", padding: "11px 16px", borderRadius: 10, border: `1px solid ${ C.border }`, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", background: "#fff", color: C.text };

    const go = async () => {
        if (!file) { setErr("Upload a PDF protocol file first."); return; }
        setLoading(true); setErr(null); setProg(10); setProgMsg("Reading PDF...");
        try {
            const text = await extractTextFromPDF(file);
            setProg(35); setProgMsg("Extracting text...");
            if (!text || text.trim().length < 100) { setErr("Could not extract text from PDF."); setLoading(false); return; }
            setProg(55); setProgMsg("Running AI extraction of 50 fields...");
            const extracted = await extractFieldsWithGPT(text);
            const generatedContent = await generateDocumentContent(extracted);
            
            
            if (form.studyTitle) extracted.protocol_title_full = form.studyTitle;
            if (form.sponsorName) {
                extracted.investigational_product_name =
                    extracted.investigational_product_name || form.sponsorName;
            }

            // merge
            const combined = {
                ...extracted,
                generatedContent
            };

            onParsed(combined, form);

            setProg(100); setProgMsg("Done!");
        } catch (e) { setErr("Error: " + e.message); setLoading(false); }
    };

    if (loading) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 24 }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${ C.border }`, borderTopColor: "#1f3b73", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Extracting 50 Protocol Fields...</div>
            <div style={{ width: 300, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${ prog }%`, height: "100%", background: "#1f3b73", transition: "width 0.4s" }} /></div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{progMsg}</div>
        </div>
    );

    return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 0" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>Create New Study</h2>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${ C.border }` }}>Fill in the study details below and upload a protocol PDF to begin.</p>
            {err && <div style={{ background: C.redBg, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C.red }}>{err}</div>}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${ C.border }`, padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Study Title <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional override)</span></label><input value={form.studyTitle} onChange={e => setForm({ ...form, studyTitle: e.target.value })} style={inp} placeholder="Auto-extracted from PDF" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Sponsor Name <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional override)</span></label><input value={form.sponsorName} onChange={e => setForm({ ...form, sponsorName: e.target.value })} style={inp} placeholder="Auto-extracted from PDF" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Principal Investigator Name</label><input value={form.piName} onChange={e => setForm({ ...form, piName: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Coordinator Name</label><input value={form.coordName} onChange={e => setForm({ ...form, coordName: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Sponsor Type</label>
                    <select value={form.sponsorType} onChange={e => setForm({ ...form, sponsorType: e.target.value })} style={{ ...inp, cursor: "pointer", appearance: "auto" }}><option>Industry</option><option>NIH</option><option>Other Federal</option><option>Network</option><option>Other</option></select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: C.textSec }}>Upload Protocol PDF <span style={{ color: C.red }}>*</span></label>
                    <div onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf"; i.onchange = e => handleFile(e.target.files[0]); i.click(); }}
                        onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                        style={{ border: `2px dashed ${ file ? "#16a34a" : C.border }`, borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: file ? "#dcfce7" : "#f8fafc" }}>
                        {file ? <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>📄 {file.name}</span> : <span style={{ fontSize: 13, color: C.textMuted }}>☁ Drag and drop a <strong>PDF</strong> or <span style={{ color: "#1f3b73", fontWeight: 600 }}>Browse</span></span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>AI extracts all 50 protocol fields. Missing fields will be prompted one at a time.</div>
                </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={go} disabled={!file} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: file ? "#1f3b73" : C.border, color: file ? "#fff" : C.textMuted, fontSize: 13, fontWeight: 700, cursor: file ? "pointer" : "not-allowed" }}>Create New Study</button>
                {onCancel && <button onClick={onCancel} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${ C.border }`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>}
            </div>
        </div>
    );
};

export default Upload;