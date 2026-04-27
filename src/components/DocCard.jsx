

import React, { useState, useRef, useCallback } from "react";
import C from "../constants/colors";
import { getPdfUrl, downloadPdf } from "../pdfUtils";
import { buildDocElement } from "../utils/buildDocElement";

// ─── DocCard ────
const DocCard = ({ doc, study }) => {
  const [url, setUrl]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const generatingRef         = useRef(false);

  const ensureUrl = useCallback(async () => {
    if (url) return url;
    if (generatingRef.current) return null;
    generatingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const clauses    = study.clauses || [];
      const docElement = buildDocElement(doc.id, study.extractedData, clauses);
      const generated  = await getPdfUrl(study.studyId, doc.id, docElement);
      setUrl(generated);
      return generated;
    } catch (e) {
      setError("Failed to generate PDF.");
      return null;
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  }, [url, study, doc.id]);

  const handleView = async () => {
    const pdfUrl = await ensureUrl();
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    if (loading) return;
    const clauses    = study.clauses || [];
    const docElement = buildDocElement(doc.id, study.extractedData, clauses);
    await downloadPdf(study.studyId, doc.id, doc.name, docElement);
  };

  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{doc.name}</div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>
          {doc.type}
          {loading && <span style={{ marginLeft:8, color:C.accent }}>· Generating…</span>}
        </div>
        {error && <div style={{ fontSize:12, color:C.red, marginTop:4 }}>{error}</div>}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={handleView} disabled={loading}
          style={{ padding:"8px 12px", borderRadius:8, background:loading?C.border:C.accentLight, color:loading?C.textMuted:C.accent, border:"none", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
          {loading ? "…" : "View"}
        </button>
        <button onClick={handleDownload} disabled={loading}
          style={{ padding:"8px 12px", borderRadius:8, background:loading?C.border:C.accent, color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
          Download
        </button>
      </div>
    </div>
  );
};


export default DocCard;