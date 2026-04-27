

import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';

import { invalidateStudyCache } from "./pdfUtils";

import C from "./constants/colors";
import { PROTOCOL_FIELDS } from "./constants/protocolFields";
import { PERSONAS } from "./constants/personas";
import { ST } from "./constants/status";
import { buildTemplates, buildClauses } from "./utils/buildTemplates";
import { supabase } from "./services/database";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Upload from "./components/Upload";
import AllStudies from "./components/AllStudies";
import FieldWizard from "./components/FieldWizard";
import FieldsSummary from "./components/FieldsSummary";
import DocumentsTab from "./components/DocumentsTab";
import RCDashboard from "./dashboards/RCDashboard";
import LegalDashboard from "./dashboards/LegalDashboard";
import CRODashboard from "./dashboards/CRODashboard";



pdfjsLib.GlobalWorkerOptions.workerSrc = `${ process.env.PUBLIC_URL }/pdf.worker.min.js`;






const LegalDocumentsTab = ({ studyId, studyTitle, onBack, isPushed }) => {
  const BUCKET_URL = "https://rxepavvxustsikfsilpc.supabase.co/storage/v1/object/public/study-pdfs";

  const docs = [
    { id: "irb", name: "IRB Application.pdf", type: "IRB Application" },
    { id: "consent", name: "Consent Form.pdf", type: "Consent Form" },
    { id: "cta", name: "Draft Clinical Trial Agreement.pdf", type: "Clinical Trial Agreement" },
  ];

  if (!isPushed) return (
    <div style={{ padding: "24px 0" }}>
      <button onClick={onBack} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${ C.border }`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>← Back</button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Documents Not Yet Shared</h2>
        <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 360, lineHeight: 1.6 }}>The Regulatory Coordinator hasn't sent these documents to you yet. Check back soon!</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Documents</h2>
          <p style={{ fontSize: 13, color: C.textMuted }}>{studyTitle || "Untitled Study"}</p>
        </div>
        <button
          onClick={onBack}
          style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${ C.border }`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {docs.map(doc => {
          const url = `${ BUCKET_URL }/${ studyId }/${ doc.id }.pdf`;
          return (
            <div key={doc.id} style={{ background: "#fff", border: `1px solid ${ C.border }`, borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{doc.type}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  style={{ padding: "8px 12px", borderRadius: 8, background: C.accentLight, color: C.accent, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  View
                </button>
                <button
                  onClick={async () => {
                    const res = await fetch(url);
                    if (!res.ok) { alert("PDF not yet generated. Ask the RC to view it first."); return; }
                    const blob = await res.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = doc.name;
                    a.click();
                  }}
                  style={{ padding: "8px 12px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};





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

// ─── Main App ────
function App() {
  const [persona, setPersona] = useState(null);
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState("upload");
  const [studyData, setStudyData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [setClauses] = useState([]);
  const [activeTmpl, setActiveTmpl] = useState(null);
  const [studies, setStudies] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [wizardData, setWizardData] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [setGeneratingDocs] = useState(false);
  //DELETE A STUDY
  const handleDeleteStudy = async (studyId) => {
    const { error } = await supabase.from("studies").delete().eq("id", studyId);
    if (!error) setStudies(prev => prev.filter(s => s.studyId !== studyId));
    else alert("Failed to delete: " + error.message);
  };

  // Load studies from Supabase on login
  useEffect(() => {
    if (!persona) return;
    supabase.from("studies").select("*").eq("archived", false).order("uploaded_at", { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        setStudies(data.map(r => {
          const extractedData = r.extracted_fields || {};
          const tmpls = Object.keys(extractedData).length ? buildTemplates(extractedData) : null;
          const cls = Object.keys(extractedData).length ? buildClauses(extractedData) : [];
          const allF = tmpls ? Object.values(tmpls).flatMap(t => t.sections.flatMap(s => s.fields)) : [];
          const filledCount = allF.filter(f => f.status === ST.AUTO).length;
          const confirmCount = allF.filter(f => f.status === ST.CONFIRM).length;
          const missingCount = allF.filter(f => f.status === ST.MISSING).length;

          return {
            id: r.id,
            studyId: r.id,
            pushed_to_legal: r.pushed_to_legal || false,
            pushed_to_cro: r.pushed_to_cro || false,
            title: r.title,
            sponsor: r.sponsor,
            phases: r.phases || "N/A",
            sponsorType: "—",
            pi: r.pi || "—",
            coordinator: "—",
            updated: new Date(r.uploaded_at).toLocaleString(),
            filled: filledCount,
            confirm: confirmCount,
            missing: missingCount,
            irbStatus: "Not Started",
            contractStatus: "Not Started",
            blocked: missingCount > 20,
            activationDays: Math.max(5, Math.round(45 - filledCount * 0.6)),
            blocker: missingCount > 15 ? "Missing critical fields" : missingCount > 5 ? "IRB Indemnification" : "None",
            nextTask: missingCount > 10 ? "Complete missing fields →" : "Review documents →",
            extractedData,
            contractSections: r.contract_sections || [],
            consentSections: r.consent_sections || [],
            documents: [
              { id: "irb", name: "IRB Application.pdf", type: "IRB Application", createdAt: r.uploaded_at },
              { id: "consent", name: "Consent Form.pdf", type: "Consent Form", createdAt: r.uploaded_at },
              { id: "cta", name: "Draft Clinical Trial Agreement.pdf", type: "Clinical Trial Agreement", createdAt: r.uploaded_at },
            ],
            templates: tmpls,
            clauses: cls,
          };
        }));
      }
    });
  }, [persona]);

  const handleExtracted = (extracted, form) => {
    setFormData(form);
    const missing = PROTOCOL_FIELDS.filter(f => { const v = extracted[f.id]; return !v || v.toString().trim() === "" || v === "N/A"; });
    if (missing.length > 0) { setMissingFields(missing); setWizardData(extracted); setPage("wizard"); }
    else { finalize(extracted, form); }
  };

  const finalizingRef = useRef(false);

  const finalize = async (data, form) => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    try {
      setGeneratingDocs(true);

      const tmpls = buildTemplates(data);
      const builtClauses = buildClauses(data);
      const studyId = crypto.randomUUID();

      // ── Contract & Consent sections ──
      const contractSections = [
        { id: "indemnification", title: "Indemnification", source: data.high_risk_procedures_flag || "Not specified" },
        { id: "payment", title: "Payment Terms", source: data.subject_compensation_amount_and_schedule || "Not specified" },
        { id: "publication", title: "Publication Rights", source: data.primary_objective || "Not specified" },
        { id: "confidentiality", title: "Confidentiality & Data Privacy", source: data.data_collected_types || "Not specified" },
        { id: "ip_rights", title: "Intellectual Property", source: data.investigational_product_name || "Not specified" },
        { id: "insurance", title: "Insurance & Liability", source: data.high_risk_procedures_flag === "Yes" ? "High-risk procedures present" : "Standard risk" },
        { id: "termination", title: "Termination Clauses", source: data.stopping_rules_summary || "Not specified" },
      ].map(s => ({ ...s, legalStatus: "pending", croStatus: "pending" }));

      const consentSections = [
        { id: "lay_summary", title: "Lay Summary", source: data.primary_objective || "Not specified" },
        { id: "risk_description", title: "Risk Description", source: data.stopping_rules_summary || data.sae_reporting_timeline_to_sponsor || "Not specified" },
        { id: "compensation", title: "Subject Compensation", source: data.subject_compensation_amount_and_schedule || "Not specified" },
        { id: "data_privacy", title: "Data Privacy", source: data.data_collected_types || "Not specified" },
        { id: "specimens", title: "Specimen Banking", source: data.biospecimens_collected === "Yes" ? (data.future_use_banking_plan || "Specimens collected") : "No specimens" },
        { id: "genetic", title: "Genetic Testing", source: data.genetic_testing_performed === "Yes" ? "Genetic testing included" : "No genetic testing" },
      ].map(s => ({ ...s, legalStatus: "pending", croStatus: "pending" }));

      // ── PDF document descriptors (lazy) ──
      const documents = [
        { id: "irb", name: "IRB Application.pdf", type: "IRB Application", createdAt: new Date().toISOString() },
        { id: "consent", name: "Consent Form.pdf", type: "Consent Form", createdAt: new Date().toISOString() },
        { id: "cta", name: "Draft Clinical Trial Agreement.pdf", type: "Clinical Trial Agreement", createdAt: new Date().toISOString() },
      ];

      const allF = Object.values(tmpls).flatMap(t => t.sections.flatMap(s => s.fields));
      const filledCount = allF.filter(f => f.status === ST.AUTO).length;
      const confirmCount = allF.filter(f => f.status === ST.CONFIRM).length;
      const missingCount = allF.filter(f => f.status === ST.MISSING).length;

      const newStudy = {
        studyId,
        title: data.protocol_title_full || form?.studyTitle || "Untitled",
        sponsor: data.investigational_product_name || form?.sponsorName || "—",
        phases: data.study_phase || "N/A",
        sponsorType: data.product_type || "—",
        pi: form?.piName || "—",
        coordinator: form?.coordName || userName || "—",
        filled: filledCount,
        confirm: confirmCount,
        missing: missingCount,
        irbStatus: "Not Started",
        contractStatus: "Not Started",
        blocked: missingCount > 20,
        activationDays: Math.max(5, Math.round(45 - filledCount * 0.6)),
        blocker: missingCount > 15 ? "Missing critical fields" : missingCount > 5 ? "IRB Indemnification" : "None",
        nextTask: missingCount > 10 ? "Complete missing fields →" : "Review documents →",
        updated: new Date().toLocaleString(),
        uploadedAt: Date.now(),
        extractedData: data,
        documents,
        templates: tmpls,
        clauses: builtClauses,
        contractSections,
        consentSections,
      };

      // ── Save to Supabase ──
      console.log("=== ABOUT TO INSERT ===", { studyId, title: newStudy.title });
      const { data: insertData, error: insertError } = await supabase.from("studies").insert({
        id: studyId,
        title: newStudy.title,
        sponsor: newStudy.sponsor,
        phases: newStudy.phases,
        pi: newStudy.pi,
        contract_sections: contractSections,
        consent_sections: consentSections,
        uploaded_at: Date.now(),
        extracted_fields: data,
        archived: false,
      });
      console.log("=== INSERT DONE ===", { insertData, insertError });
      if (insertError) console.error("Supabase insert error:", insertError.message);

      // ── Update local state ──
      setFormData(form);
      setStudyData(data);
      setTemplates(tmpls);
      setClauses(builtClauses);
      setActiveTmpl(null);
      setSelectedStudy(newStudy);

      setStudies(prev => {
        const protocolNum = data.protocol_number;
        let next;
        if (protocolNum) {
          const existingIdx = prev.findIndex(s => s.extractedData?.protocol_number === protocolNum);
          if (existingIdx !== -1) {
            invalidateStudyCache(prev[existingIdx].studyId);
            next = [newStudy, ...prev.filter((_, i) => i !== existingIdx)];
          } else {
            next = [newStudy, ...prev];
          }
        } else {
          next = [newStudy, ...prev];
        }
        return next;
      });

      setPage("fields");
    } catch (err) {
      console.error("Failed to finalize study:", err.message);
      alert("There was a problem setting up the study: " + err.message);
    } finally {
      setGeneratingDocs(false);
      finalizingRef.current = false;
    }
  };

  if (!persona) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}`}</style>
      <Login onLogin={(p, u) => { setPersona(p); setUserName(u || ""); setPage("study"); }} />
    </>
  );

  if (page === "wizard" && missingFields.length > 0) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <FieldWizard missingFields={missingFields} extractedData={wizardData} onComplete={completed => finalize(completed, formData)} />
    </>
  );

  const WaitingScreen = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Waiting for Protocol</h2>
      <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 360, lineHeight: 1.6 }}>No study has been uploaded yet. The Regulatory Coordinator needs to upload the protocol PDF first. Check back soon!</p>
    </div>
  );

  const content = () => {
    switch (persona) {
      case PERSONAS.R:
        if (page === "upload") return <Upload onParsed={handleExtracted} onCancel={() => setPage(studies.length ? "studies" : "upload")} />;

        if (page === "studies") return (
          <AllStudies studies={studies} onNew={() => setPage("upload")}
            onDelete={handleDeleteStudy}
            onSelect={idx => {
              const picked = typeof idx === "number" ? studies[idx] : idx;
              if (!picked) return;
              setSelectedStudy(picked);
              setStudyData(picked.extractedData || null);
              setTemplates(picked.templates || null);
              setClauses(picked.clauses || []);
              setActiveTmpl(null);
              setPage("fields");
            }}
          />
        );

        if (page === "fields") return <FieldsSummary extractedData={studyData} onContinue={(updatedData) => { setStudyData(updatedData); setPage("reviewTmpl") }} />;

        if (page === "study") return (
          <RCDashboard studies={studies} onNav={setPage}
            onSelect={s => {
              setSelectedStudy(s);
              setStudyData(s.extractedData || null);
              setTemplates(s.templates || null);
              setClauses(s.clauses || []);
              setActiveTmpl(null);
              setPage("fields");
            }}
          />
        );

        if (page === "review" && templates) return (
          <ReviewDocs templates={templates}
            onSelect={k => { setActiveTmpl(k); setPage("reviewTmpl"); }}
            onContinue={() => setPage("study")}
            onCancel={() => setPage("study")}
          />
        );

        if (page === "reviewTmpl") return (
          <DocumentsTab
            study={selectedStudy}
            templates={templates}
            activeTmpl={activeTmpl}
            onOpenTemplate={k => setActiveTmpl(k)}
            onBack={() => setPage("studies")}
          />
        );

        if (page === "activation") return <ActivationMap onBack={() => setPage("study")} onNav={setPage} />;
        if (page === "readiness") return <ActivationReadiness data={studyData} onBack={() => setPage("activation")} onNav={setPage} />;
        return <Upload onParsed={handleExtracted} />;

      case PERSONAS.L:
        if (page === "study" || page === "studies" || page === "review" || page === "tasks") return <LegalDashboard onNav={setPage} onViewPDFs={(study) => { setSelectedStudy(study); setPage("legalDocs"); }} />;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            studyId={selectedStudy.studyId}
            studyTitle={selectedStudy.title}
            isPushed={selectedStudy.pushed_to_legal || false}
            onBack={() => setPage("study")}
          />
        );
        if (!studyData) return <WaitingScreen />;
        return <FieldsSummary extractedData={studyData} onContinue={() => setPage("study")} editable />;

      case PERSONAS.S:
        if (page === "study" || page === "studies" || page === "review" || page === "tasks") return <CRODashboard onNav={setPage} onViewPDFs={(study) => { setSelectedStudy(study); setPage("legalDocs"); }} />;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            studyId={selectedStudy.studyId}
            studyTitle={selectedStudy.title}
            isPushed={selectedStudy.pushed_to_cro || false}
            onBack={() => setPage("study")}
          />
        );
        if (!studyData) return <WaitingScreen />;
        return <FieldsSummary extractedData={studyData} onContinue={() => setPage("study")} editable />;

      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter',system-ui,-apple-system,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg);}}*{margin:0;padding:0;box-sizing:border-box;}button{font-family:inherit;}textarea:focus,input:focus{border-color:${ C.accent }!important;outline:none;}`}</style>
      <Sidebar persona={persona} page={page} onNav={setPage} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar persona={persona} userName={userName} onSignOut={() => {
          setPersona(null); setUserName(""); setPage("upload");
          setStudyData(null); setFormData(null); setTemplates(null);
          setClauses([]); setActiveTmpl(null); setStudies([]);
          setMissingFields([]); setWizardData(null);
          setSelectedStudy(null); setGeneratingDocs(false);
        }} />
        <div style={{ flex: 1, background: "#f1f5f9", overflow: "auto" }}>
          <div style={{ padding: "0 32px" }}>{content()}</div>
        </div>
      </div>
    </div>
  );
}

export default App;