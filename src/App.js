

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
import LegalDocumentsTab from "./components/LegalDocumentsTab";
import ActivationMap from "./components/ActivationMap";
import ActivationReadiness from "./components/ActivationReadiness";
import ReviewDocs from "./components/ReviewDocs";
import { buildDocElement } from "./utils/buildDocElement";
import { pdf } from "@react-pdf/renderer";



pdfjsLib.GlobalWorkerOptions.workerSrc = `${ process.env.PUBLIC_URL }/pdf.worker.min.js`;










// ─── Main App ────
function App() {
  const [persona, setPersona] = useState(null);
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState("upload");
  const [studyData, setStudyData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [activeTmpl, setActiveTmpl] = useState(null);
  const [studies, setStudies] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [wizardData, setWizardData] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [, setClauses] = useState([]);
  const [, setGeneratingDocs] = useState(false);

  //DELETE A STUDY
  const handleDeleteStudy = async (studyId) => {
    console.log("DELETE CLICKED:", studyId);

    if (!studyId) {
      console.error("Missing ID");
      return;
    }

    //  1. list files in folder
    const { data: files, error: listError } = await supabase
      .storage
      .from("study-pdfs")
      .list(studyId);

    if (listError) {
      console.error("LIST ERROR:", listError);
    }

    if (files && files.length > 0) {
      const paths = files.map(f => `${ studyId }/${ f.name }`);

      //  2. delete files
      const { error: deleteFilesError } = await supabase
        .storage
        .from("study-pdfs")
        .remove(paths);

      if (deleteFilesError) {
        console.error("FILE DELETE ERROR:", deleteFilesError);
      } else {
        console.log("FILES DELETED:", paths);
      }
    }

    //  3. delete DB row
    const { error } = await supabase
      .from("studies")
      .delete()
      .eq("id", studyId);

    if (error) {
      console.error("DELETE ERROR:", error);
    } else {
      console.log("DELETE SUCCESS");
      setStudies(prev => prev.filter(s => s.id !== studyId));
    }
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
            documents: r.documents || [],
            templates: tmpls,
            clauses: cls,
          };
        }));
      }
    });
  }, [persona]);

  const handleExtracted = (extracted, form) => {
    console.log("RECEIVED IN APP:", extracted);
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
        {
          id: "irb",
          name: "IRB Application.pdf",
          type: "IRB Application",
          path: `${ studyId }/irb-${ Date.now() }.pdf`,
          createdAt: new Date().toISOString()
        },
        {
          id: "consent",
          name: "Consent Form.pdf",
          type: "Consent Form",
          path: `${ studyId }/consent-${ Date.now() }.pdf`,
          createdAt: new Date().toISOString()
        },
        {
          id: "cta",
          name: "Draft Clinical Trial Agreement.pdf",
          type: "Clinical Trial Agreement",
          path: `${ studyId }/cta-${ Date.now() }.pdf`,
          createdAt: new Date().toISOString()
        }
      ];


      for (const doc of documents) {
        try {
          console.log("START:", doc.id);

          const docElement = buildDocElement(doc.id, data, builtClauses);
          console.log("docElement:", !!docElement);

          const blob = await pdf(docElement).toBlob();
          console.log("Blob size:", blob.size);

          const { error } = await supabase.storage
            .from("study-pdfs")
            .upload(doc.path, blob, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (error) {
            console.error("UPLOAD ERROR:", error);
          } else {
            console.log("UPLOAD SUCCESS:", doc.path);
          }

        } catch (err) {
          console.error("LOOP ERROR:", doc.id, err);
        }
      }
      const allF = Object.values(tmpls).flatMap(t => t.sections.flatMap(s => s.fields));
      const filledCount = allF.filter(f => f.status === ST.AUTO).length;
      const confirmCount = allF.filter(f => f.status === ST.CONFIRM).length;
      const missingCount = allF.filter(f => f.status === ST.MISSING).length;

      const newStudy = {
        id: studyId,
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
      console.log("=== ABOUT TO INSERT ===", { id: studyId, studyId, title: newStudy.title });
      const { data: insertData, error: insertError } = await supabase
        .from("studies")
        .insert({
          id: studyId,
          title: newStudy.title,
          sponsor: newStudy.sponsor,
          phases: newStudy.phases,
          pi: newStudy.pi,
          contract_sections: contractSections,
          consent_sections: consentSections,
          uploaded_at: Date.now(),
          extracted_fields: data,
          documents: documents,  
          archived: false,
        })
        .select();   // 👈 ADD THIS
      console.log("INSERTED ROW:", insertData);
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
        const normalized = prev.map(s => ({
          ...s,
          id: s.id || s.studyId
        }));

        const newNormalized = {
          ...newStudy,
          id: newStudy.id || newStudy.studyId
        };

        let next;
        const protocolNum = data.protocol_number;

        if (protocolNum) {
          const existingIdx = normalized.findIndex(
            s => s.extractedData?.protocol_number === protocolNum
          );

          if (existingIdx !== -1) {
            invalidateStudyCache(normalized[existingIdx].id);
            next = [newNormalized, ...normalized.filter((_, i) => i !== existingIdx)];
          } else {
            next = [newNormalized, ...normalized];
          }
        } else {
          next = [newNormalized, ...normalized];
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
          <AllStudies studies={studies}
            onNew={() => setPage("upload")}
            onDelete={handleDeleteStudy}
            onSelect={s => {
              if (!s) return;
              setSelectedStudy(s);
              setStudyData(s.extractedData || null);
              setTemplates(s.templates || null);
              setClauses(s.clauses || []);
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
        if (page === "study" || page === "studies" || page === "review" || page === "tasks") return <LegalDashboard onViewPDFs={(study) => {
          const fullStudy = studies.find(
            s => s.id === (study.id || study.studyId)
          );

          console.log("STUDY PASSED IN:", study);
          console.log("MATCHED FULL STUDY:", fullStudy);

          if (!fullStudy) {
            alert("Could not find study — ID mismatch.");
            return;
          }

          setSelectedStudy(fullStudy);
          setPage("legalDocs");
        }} />;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            documents={selectedStudy.documents || []}
            studyTitle={selectedStudy.title}
            isPushed={selectedStudy.pushed_to_legal || false}
            onBack={() => setPage("study")}
          />
        );
        if (!studyData) return <WaitingScreen />;
        return <FieldsSummary extractedData={studyData} onContinue={() => setPage("study")} editable />;

      case PERSONAS.S:
        if (page === "study" || page === "studies" || page === "review" || page === "tasks") return <CRODashboard onNav={setPage} onViewPDFs={(study) => {
          const fullStudy = studies.find(
            s => s.id === (study.id || study.studyId)
          );

          console.log("STUDY PASSED IN:", study);
          console.log("MATCHED FULL STUDY:", fullStudy);

          if (!fullStudy) {
            alert("Could not find study — ID mismatch.");
            return;
          }

          setSelectedStudy(fullStudy);
          setPage("legalDocs");
        }} />;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            documents={selectedStudy.documents || []}
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