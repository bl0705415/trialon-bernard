/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { createClient } from "@supabase/supabase-js";
import {
  LayoutGrid,
  FolderKanban,
  Clock3,
  FileText,
  Hexagon
} from "lucide-react";
import {
  IRBApplicationPDF,
  ConsentFormPDF,
  ClinicalTrialAgreementPDF
} from "./pdfDoc";
import { getPdfUrl, downloadPdf, invalidateStudyCache } from "./pdfUtils";

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

// ─── Supabase ────
const supabase = createClient(
  "https://rxepavvxustsikfsilpc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXBhdnZ4dXN0c2lrZnNpbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTIzMDYsImV4cCI6MjA5MDY2ODMwNn0.zLO00rby8ji5GzWcfNXwIjuUZ79Ee3sxSJH1m7EQ7Es"
);

// ─── Hardcoded Auth ────
const USERS = {
  "rc@test.com":    { password: "test345", persona: "researcher" },
  "legal@test.com": { password: "test234", persona: "legal" },
  "cro@test.com":   { password: "test123", persona: "sponsor" },
};

// ─── LiteLLM ────
const LITELLM_BASE  = "https://litellm-01.oit.duke.edu";
const LITELLM_KEY   = "sk-nC6KVrXD65MVLvso4sXsKA";
const LITELLM_MODEL = "GPT 4.1";

// ─── 50 Protocol Fields ────
const PROTOCOL_FIELDS = [
  { id:"protocol_title_full",                        label:"Protocol Title (Full)",                       category:"Study Identification", type:"text" },
  { id:"protocol_short_title",                       label:"Protocol Short Title / Acronym",              category:"Study Identification", type:"text" },
  { id:"protocol_number",                            label:"Protocol Number",                             category:"Study Identification", type:"text" },
  { id:"protocol_version_and_date",                  label:"Protocol Version & Date",                     category:"Study Identification", type:"text" },
  { id:"ind_number",                                 label:"IND Number (if applicable)",                  category:"Regulatory",           type:"text" },
  { id:"ide_number",                                 label:"IDE Number (if applicable)",                  category:"Regulatory",           type:"text" },
  { id:"study_phase",                                label:"Phase",                                       category:"Study Design",         type:"select", options:["Phase 1","Phase 1b","Phase 2","Phase 2a","Phase 2b","Phase 3","Phase 4","N/A"] },
  { id:"study_type",                                 label:"Study Type",                                  category:"Study Design",         type:"select", options:["Interventional","Observational","Registry","Specimen-only"] },
  { id:"allocation_randomization",                   label:"Allocation / Randomization",                  category:"Study Design",         type:"select", options:["Randomized","Non-randomized"] },
  { id:"blinding_masking",                           label:"Blinding / Masking",                          category:"Study Design",         type:"select", options:["Open-label","Single-blind","Double-blind","Triple-blind"] },
  { id:"control_type",                               label:"Control Type",                                category:"Study Design",         type:"select", options:["Placebo","Active comparator","Standard of care","None"] },
  { id:"primary_objective",                          label:"Primary Objective",                           category:"Study Design",         type:"textarea" },
  { id:"primary_endpoints",                          label:"Primary Endpoint(s)",                         category:"Study Design",         type:"textarea" },
  { id:"secondary_endpoints",                        label:"Key Secondary Endpoint(s)",                   category:"Study Design",         type:"textarea" },
  { id:"target_condition",                           label:"Target Indication / Condition",               category:"Study Population",     type:"text" },
  { id:"population_age_range",                       label:"Population Age Range",                        category:"Study Population",     type:"text" },
  { id:"inclusion_criteria_summary",                 label:"Key Inclusion Criteria",                      category:"Study Population",     type:"textarea" },
  { id:"exclusion_criteria_summary",                 label:"Key Exclusion Criteria",                      category:"Study Population",     type:"textarea" },
  { id:"vulnerable_populations_included",            label:"Vulnerable Populations Included?",            category:"Study Population",     type:"text" },
  { id:"investigational_product_name",               label:"Investigational Product Name",                category:"Study Product",        type:"text" },
  { id:"product_type",                               label:"Product Type",                                category:"Study Product",        type:"select", options:["Drug","Device","Biologic","Combination","Digital therapeutic"] },
  { id:"route_of_administration",                    label:"Route of Administration",                     category:"Study Product",        type:"text" },
  { id:"dose_regimen",                               label:"Dose Level(s) / Regimen",                     category:"Study Product",        type:"text" },
  { id:"storage_conditions",                         label:"Storage Conditions",                          category:"Study Product",        type:"text" },
  { id:"emergency_unblinding_process",               label:"Emergency Unblinding Process",                category:"Study Product",        type:"textarea" },
  { id:"number_of_study_visits",                     label:"Number of Study Visits",                      category:"Procedures",           type:"text" },
  { id:"screening_window_days",                      label:"Screening Window (days)",                     category:"Procedures",           type:"text" },
  { id:"key_procedures_high_level",                  label:"Key Procedures by Visit",                     category:"Procedures",           type:"textarea" },
  { id:"imaging_procedures",                         label:"Imaging Procedures (if any)",                 category:"Procedures",           type:"text" },
  { id:"invasive_procedures",                        label:"Invasive Procedures (if any)",                category:"Procedures",           type:"text" },
  { id:"high_risk_procedures_flag",                  label:"High-Risk Procedures?",                       category:"Risk/Safety",          type:"yesno" },
  { id:"data_monitoring_plan_present",               label:"Data Monitoring Plan Present?",               category:"Risk/Safety",          type:"yesno" },
  { id:"dsmb_present",                               label:"DMC/DSMB Established?",                       category:"Risk/Safety",          type:"yesno" },
  { id:"dsmb_review_frequency",                      label:"DSMB Review Frequency",                       category:"Risk/Safety",          type:"text" },
  { id:"stopping_rules_summary",                     label:"Stopping Rules / Early Termination Criteria", category:"Risk/Safety",          type:"textarea" },
  { id:"sae_reporting_timeline_to_sponsor",          label:"SAE Reporting Timeline to Sponsor",           category:"Risk/Safety",          type:"text" },
  { id:"safety_report_handling",                     label:"Safety Letters / IND Safety Report Handling", category:"Risk/Safety",          type:"textarea" },
  { id:"consent_type",                               label:"Consent Type",                                category:"Consent",              type:"select", options:["Paper","eConsent","Hybrid"] },
  { id:"electronic_signature_used",                  label:"Electronic Signature Used?",                  category:"Consent",              type:"yesno" },
  { id:"identity_verification_method_for_e_consent", label:"Identity Verification for eConsent",         category:"Consent",              type:"text" },
  { id:"reconsent_triggers_summary",                 label:"Re-Consent Triggers",                         category:"Consent",              type:"textarea" },
  { id:"recruitment_methods",                        label:"Recruitment Methods",                         category:"Recruitment",          type:"textarea" },
  { id:"recruitment_material_types",                 label:"Recruitment Materials Types",                 category:"Recruitment",          type:"text" },
  { id:"subject_compensation_amount_and_schedule",   label:"Subject Compensation Amount & Schedule",      category:"Payments to Subjects", type:"text" },
  { id:"subject_reimbursement_types",                label:"Subject Reimbursement Types",                 category:"Payments to Subjects", type:"text" },
  { id:"data_collected_types",                       label:"Data Collected Types",                        category:"Data/Privacy",         type:"textarea" },
  { id:"digital_tools_used",                         label:"Mobile App / Wearable / ePRO Used?",          category:"Data/Privacy",         type:"yesno" },
  { id:"biospecimens_collected",                     label:"Biospecimens Collected?",                     category:"Specimens",            type:"yesno" },
  { id:"future_use_banking_plan",                    label:"Future Use / Banking Plan",                   category:"Specimens",            type:"textarea" },
  { id:"genetic_testing_performed",                  label:"Genetic Testing Performed?",                  category:"Specimens/Genetics",   type:"yesno" },
];

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text;
}

async function extractFieldsWithGPT(rawText) {
  const fieldList = PROTOCOL_FIELDS.map(f => `  "${f.id}": "${f.label}"`).join(",\n");
  const prompt = `You are a clinical trial data extraction assistant. Extract ONLY these exact 50 fields from the protocol text. Return a valid JSON object only — no markdown, no explanation, just raw JSON. Use empty string "" for any field not found.

Fields:
{
${fieldList}
}

Protocol text:
${rawText.substring(0, 14000)}`;

  const res = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LITELLM_KEY}` },
    body: JSON.stringify({ model: LITELLM_MODEL, max_tokens: 3000, temperature: 0, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) throw new Error(`LiteLLM error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const clean = content.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

const PERSONAS = { R: "researcher", L: "legal", S: "sponsor" };
const ST = { AUTO: "auto", CONFIRM: "confirm", MISSING: "missing" };
const C = {
  bg:"#f0f2f5", surface:"#ffffff", surfaceAlt:"#f7f8fa", border:"#e0e4ea", borderLight:"#ebeef3",
  text:"#111827", textSec:"#4b5563", textMuted:"#9ca3af", textDim:"#d1d5db",
  accent:"#2563eb", accentLight:"#eff6ff",
  green:"#16a34a", greenBg:"#dcfce7", yellow:"#d97706", yellowBg:"#fef3c7",
  red:"#dc2626", redBg:"#fee2e2", purple:"#7c3aed", purpleBg:"#f3f0ff",
};

function buildDocElement(docId, extractedData, clauses) {
  switch (docId) {
    case "irb":     return <IRBApplicationPDF data={extractedData} />;
    case "consent": return <ConsentFormPDF data={extractedData} />;
    case "cta":     return <ClinicalTrialAgreementPDF data={extractedData} clauses={clauses} />;
    default: throw new Error(`Unknown docId: ${docId}`);
  }
}

function buildTemplates(d) {
  const au = v => v && v.toString().trim() && v !== "N/A" ? ST.AUTO : ST.MISSING;
  return {
    irb:{ name:"IRB Application", icon:"📋", desc:"Needs Review", sections:[
      { id:"a1", title:"CONTACT INFO", fields:[
        { id:"t",    label:"Study Title",     status:au(d.protocol_title_full),           value:d.protocol_title_full },
        { id:"nct",  label:"Protocol Number", status:au(d.protocol_number),               value:d.protocol_number },
        { id:"pi",   label:"PI Name",         status:ST.MISSING,                          value:"" },
        { id:"sp",   label:"Product Name",    status:au(d.investigational_product_name),  value:d.investigational_product_name },
        { id:"spt",  label:"Product Type",    status:au(d.product_type),                  value:d.product_type },
        { id:"ind",  label:"IND Number",      status:au(d.ind_number),                    value:d.ind_number },
      ]},
      { id:"a2", title:"STUDY DESIGN", fields:[
        { id:"phase", label:"Phase",          status:au(d.study_phase),               value:d.study_phase },
        { id:"stype", label:"Study Type",     status:au(d.study_type),                value:d.study_type },
        { id:"alloc", label:"Randomization",  status:au(d.allocation_randomization),  value:d.allocation_randomization },
        { id:"blind", label:"Blinding",       status:au(d.blinding_masking),          value:d.blinding_masking },
        { id:"ctrl",  label:"Control Type",   status:au(d.control_type),              value:d.control_type },
      ]},
      { id:"a4", title:"STUDY DETAILS", fields:[
        { id:"obj",  label:"Primary Objective",   type:"textarea", status:au(d.primary_objective),           value:d.primary_objective },
        { id:"ep",   label:"Primary Endpoints",   type:"textarea", status:au(d.primary_endpoints),           value:d.primary_endpoints },
        { id:"sep",  label:"Secondary Endpoints", type:"textarea", status:au(d.secondary_endpoints),         value:d.secondary_endpoints },
        { id:"inc",  label:"Inclusion Criteria",  type:"textarea", status:au(d.inclusion_criteria_summary),  value:d.inclusion_criteria_summary },
        { id:"exc",  label:"Exclusion Criteria",  type:"textarea", status:au(d.exclusion_criteria_summary),  value:d.exclusion_criteria_summary },
        { id:"cond", label:"Target Condition",    status:au(d.target_condition),                             value:d.target_condition },
        { id:"age",  label:"Age Range",           status:au(d.population_age_range),                        value:d.population_age_range },
      ]},
      { id:"a5", title:"SAFETY", fields:[
        { id:"dsmb", label:"DSMB Present?",          type:"yesno",    status:au(d.dsmb_present),                         value:d.dsmb_present },
        { id:"hr",   label:"High-Risk Procedures?",  type:"yesno",    status:au(d.high_risk_procedures_flag),             value:d.high_risk_procedures_flag },
        { id:"sae",  label:"SAE Reporting Timeline", status:au(d.sae_reporting_timeline_to_sponsor),                     value:d.sae_reporting_timeline_to_sponsor },
        { id:"stop", label:"Stopping Rules",         type:"textarea", status:au(d.stopping_rules_summary),                value:d.stopping_rules_summary },
      ]},
    ]},
    consent:{ name:"Informed Consent Form", icon:"📝", desc:"Review", sections:[
      { id:"ck", title:"CONSENT DETAILS", fields:[
        { id:"ctype", label:"Consent Type",           status:au(d.consent_type),                                       value:d.consent_type },
        { id:"esig",  label:"Electronic Signature?",  type:"yesno",    status:au(d.electronic_signature_used),          value:d.electronic_signature_used },
        { id:"cid",   label:"ID Verification Method", status:au(d.identity_verification_method_for_e_consent),         value:d.identity_verification_method_for_e_consent },
        { id:"recns", label:"Re-Consent Triggers",    type:"textarea", status:au(d.reconsent_triggers_summary),         value:d.reconsent_triggers_summary },
        { id:"inc2",  label:"Inclusion Criteria",     type:"textarea", status:au(d.inclusion_criteria_summary),         value:d.inclusion_criteria_summary },
        { id:"exc2",  label:"Exclusion Criteria",     type:"textarea", status:au(d.exclusion_criteria_summary),         value:d.exclusion_criteria_summary },
      ]},
    ]},
    reliance:{ name:"IRB Reliance Agreement", icon:"🤝", desc:"Review", sections:[
      { id:"rp", title:"PROTOCOL", fields:[
        { id:"rpn",  label:"Protocol Number", status:au(d.protocol_number),       value:d.protocol_number },
        { id:"rpt",  label:"Title",           status:au(d.protocol_title_full),   value:d.protocol_title_full },
        { id:"rind", label:"IND Number",      status:au(d.ind_number),            value:d.ind_number },
        { id:"ride", label:"IDE Number",      status:au(d.ide_number),            value:d.ide_number },
      ]},
    ]},
    disclosure:{ name:"Personal Data Disclosure", icon:"🔒", desc:"Review", sections:[
      { id:"dc", title:"DATA & SPECIMENS", fields:[
        { id:"dtype", label:"Data Collected Types",    type:"textarea", status:au(d.data_collected_types),                 value:d.data_collected_types },
        { id:"dtool", label:"Digital Tools Used?",     type:"yesno",    status:au(d.digital_tools_used),                   value:d.digital_tools_used },
        { id:"dbio",  label:"Biospecimens Collected?", type:"yesno",    status:au(d.biospecimens_collected),               value:d.biospecimens_collected },
        { id:"dbank", label:"Future Use / Banking",    type:"textarea", status:au(d.future_use_banking_plan),              value:d.future_use_banking_plan },
        { id:"dgen",  label:"Genetic Testing?",        type:"yesno",    status:au(d.genetic_testing_performed),            value:d.genetic_testing_performed },
        { id:"dcomp", label:"Subject Compensation",    status:au(d.subject_compensation_amount_and_schedule),             value:d.subject_compensation_amount_and_schedule },
        { id:"dreim", label:"Subject Reimbursement",   status:au(d.subject_reimbursement_types),                          value:d.subject_reimbursement_types },
      ]},
    ]},
    checklist:{ name:"Study Planning Checklist", icon:"✅", desc:"Review", sections:[
      { id:"cs", title:"STUDY ID", fields:[
        { id:"csp2", label:"Protocol #", status:au(d.protocol_number),           value:d.protocol_number },
        { id:"cst",  label:"Title",      status:au(d.protocol_title_full),       value:d.protocol_title_full },
        { id:"csvr", label:"Version",    status:au(d.protocol_version_and_date), value:d.protocol_version_and_date },
      ]},
      { id:"cd2", title:"PROCEDURES", fields:[
        { id:"cdvst", label:"# Visits",            status:au(d.number_of_study_visits),                           value:d.number_of_study_visits },
        { id:"cdscr", label:"Screening Window",    status:au(d.screening_window_days),                            value:d.screening_window_days },
        { id:"cdprc", label:"Key Procedures",      type:"textarea", status:au(d.key_procedures_high_level),       value:d.key_procedures_high_level },
        { id:"cdimg", label:"Imaging",             status:au(d.imaging_procedures),                               value:d.imaging_procedures },
        { id:"cdinv", label:"Invasive Procedures", status:au(d.invasive_procedures),                              value:d.invasive_procedures },
        { id:"cdrug", label:"Dose Regimen",        status:au(d.dose_regimen),                                     value:d.dose_regimen },
        { id:"cdrte", label:"Route of Admin",      status:au(d.route_of_administration),                          value:d.route_of_administration },
      ]},
    ]},
  };
}

function buildClauses(d) {
  const product = d.investigational_product_name || "[Product]";
  const conds   = d.target_condition || "[condition]";
  return [
    { id:"ind",    title:"Indemnification",      cat:"high-risk",   basis:`${d.study_type||"Study"} — ${conds}`,         text:`Sponsor shall indemnify Institution from claims arising from ${product} use, Sponsor breach, or Sponsor negligence.`, status:"pending" },
    { id:"inj",    title:"Subject Injury",        cat:"high-risk",   basis:`Involves ${d.product_type||"product"}`,       text:`Sponsor pays medical expenses for study-related injuries not covered by Subject's insurance.`, status:"pending" },
    { id:"ip",     title:"Intellectual Property", cat:"medium-risk", basis:`Protocol v${d.protocol_version_and_date||"TBD"}`, text:`${product} IP remains with Sponsor. Institution retains independent inventions.`, status:"pending" },
    { id:"pub",    title:"Publication",           cat:"medium-risk", basis:"Protocol Agreement",                          text:`Institution may publish after 60-day review. No suppression.`, status:"pending" },
    { id:"confid", title:"Confidentiality",       cat:"standard",    basis:"Protocol materials",                          text:`Five-year confidentiality. Standard carve-outs apply.`, status:"pending" },
    { id:"term",   title:"Termination",           cat:"standard",    basis:`Version: ${d.protocol_version_and_date||"TBD"}`, text:`30 days notice. Sponsor pays for completed work.`, status:"pending" },
  ];
}

// ─── Shared PDF Viewer for Legal/CRO ────
const StudyPDFs = ({ studyId, onViewPDFs }) => (
  <button
    onClick={() => onViewPDFs(studyId)}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: C.accentLight,
      color: C.accent,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: 14,
    }}>
    📄 View PDFs →
  </button>
);

const LegalDocumentsTab = ({ studyId, studyTitle, onBack, isPushed }) => {
  const BUCKET_URL = "https://rxepavvxustsikfsilpc.supabase.co/storage/v1/object/public/study-pdfs";

  const docs = [
    { id:"irb",     name:"IRB Application.pdf",               type:"IRB Application" },
    { id:"consent", name:"Consent Form.pdf",                  type:"Consent Form" },
    { id:"cta",     name:"Draft Clinical Trial Agreement.pdf", type:"Clinical Trial Agreement" },
  ];

  if (!isPushed) return (
    <div style={{ padding:"24px 0" }}>
      <button onClick={onBack} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.text, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:16, textAlign:"center" }}>
        <div style={{ fontSize:40 }}>📭</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:C.text }}>Documents Not Yet Shared</h2>
        <p style={{ fontSize:14, color:C.textMuted, maxWidth:360, lineHeight:1.6 }}>The Regulatory Coordinator hasn't sent these documents to you yet. Check back soon!</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>Documents</h2>
          <p style={{ fontSize:13, color:C.textMuted }}>{studyTitle || "Untitled Study"}</p>
        </div>
        <button
          onClick={onBack}
          style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display:"grid", gap:12, marginBottom:24 }}>
        {docs.map(doc => {
          const url = `${BUCKET_URL}/${studyId}/${doc.id}.pdf`;
          return (
            <div key={doc.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{doc.name}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>{doc.type}</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  style={{ padding:"8px 12px", borderRadius:8, background:C.accentLight, color:C.accent, border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
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
                  style={{ padding:"8px 12px", borderRadius:8, background:C.accent, color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
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

// ─── Missing Fields Wizard ────
const FieldWizard = ({ missingFields, extractedData, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [val, setVal] = useState("");
  const field = missingFields[idx];
  const total = missingFields.length;
  const pct = Math.round((idx / total) * 100);

  const advance = (value) => {
    const newAnswers = { ...answers, [field.id]: value };
    setAnswers(newAnswers);
    setVal("");
    if (idx + 1 >= total) {
      onComplete({ ...extractedData, ...newAnswers });
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ width:520, background:"#fff", borderRadius:16, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", padding:"44px 48px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#fff" }}>⚕</div>
          <span style={{ fontSize:18, fontWeight:700 }}>Trial<span style={{ color:"#3b82f6" }}>ON</span></span>
        </div>
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMuted, marginBottom:8 }}>
            <span>Field {idx + 1} of {total}</span>
            <span>{pct}% complete</span>
          </div>
          <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"#3b82f6", borderRadius:3, transition:"width 0.3s" }} />
          </div>
        </div>
        <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:C.accentLight, color:C.accent, fontSize:11, fontWeight:600, marginBottom:12 }}>
          {field.category}
        </div>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8, lineHeight:1.3 }}>{field.label}</h2>
        <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>This field couldn't be extracted from the PDF. Please enter it manually.</p>

        {field.type === "yesno" ? (
          <div style={{ display:"flex", gap:12, marginBottom:28 }}>
            {["Yes","No"].map(o => (
              <button key={o} onClick={() => advance(o)}
                style={{ flex:1, padding:"14px 0", borderRadius:8, border:`2px solid ${val===o?"#3b82f6":"#e2e8f0"}`, background:val===o?"#eff6ff":"#fff", color:val===o?"#1e40af":"#374151", fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                {o}
              </button>
            ))}
          </div>
        ) : field.type === "select" ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:28 }}>
            {field.options.map(o => (
              <button key={o} onClick={() => setVal(o)}
                style={{ padding:"10px 16px", borderRadius:8, border:`2px solid ${val===o?"#3b82f6":"#e2e8f0"}`, background:val===o?"#eff6ff":"#fff", color:val===o?"#1e40af":"#374151", fontSize:13, fontWeight:val===o?600:400, cursor:"pointer", transition:"all 0.15s" }}>
                {o}
              </button>
            ))}
          </div>
        ) : field.type === "textarea" ? (
          <textarea value={val} onChange={e => setVal(e.target.value)} rows={4}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", resize:"vertical", lineHeight:1.6, marginBottom:28, outline:"none" }} />
        ) : (
          <input value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key==="Enter" && val.trim() && advance(val.trim())}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", marginBottom:28, outline:"none" }} />
        )}

        {field.type !== "yesno" && (
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={() => advance("N/A")}
              style={{ flex:1, padding:"12px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", color:"#6b7280", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
              Skip for now
            </button>
            <button onClick={() => advance(val.trim() || "N/A")} disabled={!val.trim() && field.type !== "select"}
              style={{ flex:2, padding:"12px 0", borderRadius:8, border:"none", background:(val.trim()||field.type==="select")?"#3b82f6":"#e2e8f0", color:(val.trim()||field.type==="select")?"#fff":"#94a3b8", fontSize:14, fontWeight:600, cursor:(val.trim()||field.type==="select")?"pointer":"not-allowed", fontFamily:"inherit" }}>
              {idx+1>=total ? "Finish →" : "Next →"}
            </button>
          </div>
        )}
        <p style={{ textAlign:"center", fontSize:12, color:C.textMuted, marginTop:16 }}>{total-idx-1} fields remaining after this</p>
      </div>
    </div>
  );
};

// ─── Fields Summary ────
const FieldsSummary = ({ extractedData, onContinue, editable }) => {
  const [data, setData] = useState(extractedData);
  const categories = [...new Set(PROTOCOL_FIELDS.map(f => f.category))];
  const filled = PROTOCOL_FIELDS.filter(f => data[f.id] && data[f.id] !== "N/A" && data[f.id] !== "").length;
  const inp = { width:"100%", padding:"7px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", background:"#fff", marginTop:4 };

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>
            {editable ? "Protocol Fields — Fill Missing" : "Protocol Fields Extracted"}
          </h2>
          <p style={{ fontSize:13, color:C.textMuted }}>
            {editable ? `${50 - filled} fields still need input` : `${filled} of 50 fields successfully filled`}
          </p>
        </div>
        <button onClick={() => onContinue(data)} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          {editable ? "Save & Continue →" : "Continue to Documents →"}
        </button>
      </div>
      <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:28 }}>
        <div style={{ width:`${Math.round(filled/50*100)}%`, height:"100%", background:C.green, borderRadius:3 }} />
      </div>
      {categories.map(cat => {
        const fields = PROTOCOL_FIELDS.filter(f => f.category === cat);
        return (
          <div key={cat} style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, padding:20, marginBottom:16 }}>
            <h3 style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>{cat}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 24px" }}>
              {fields.map(f => {
                const v = data[f.id];
                const empty = !v || v === "N/A" || v === "";
                const canEdit = editable && empty;
                return (
                  <div key={f.id} style={{ borderBottom:`1px solid ${C.borderLight}`, paddingBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.textMuted }}>{f.label}</span>
                      {empty && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:3, background:C.redBg, color:C.red, fontWeight:600 }}>MISSING</span>}
                    </div>
                    {canEdit ? (
                      f.type === "yesno" ? (
                        <div style={{ display:"flex", gap:8, marginTop:6 }}>
                          {["Yes","No"].map(o => (
                            <button key={o} onClick={() => setData({...data, [f.id]: o})}
                              style={{ padding:"5px 16px", borderRadius:6, border:`1.5px solid ${data[f.id]===o?"#3b82f6":"#e2e8f0"}`, background:data[f.id]===o?"#eff6ff":"#fff", color:data[f.id]===o?"#1e40af":"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              {o}
                            </button>
                          ))}
                        </div>
                      ) : f.type === "select" ? (
                        <select value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})} style={{...inp}}>
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})} rows={3}
                          placeholder={`Enter ${f.label.toLowerCase()}...`} style={{...inp, resize:"vertical", lineHeight:1.5}}/>
                      ) : (
                        <input value={data[f.id]||""} onChange={e => setData({...data,[f.id]:e.target.value})}
                          placeholder={`Enter ${f.label.toLowerCase()}...`} style={inp}/>
                      )
                    ) : (
                      <div style={{ fontSize:13, color:empty?C.textMuted:C.text, fontStyle:empty?"italic":"normal", marginTop:2 }}>
                        {empty ? "Not provided" : v}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <button onClick={() => onContinue(data)} style={{ width:"100%", padding:"14px 0", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", marginTop:8 }}>
        {editable ? "Save & Continue →" : "Continue to Documents →"}
      </button>
    </div>
  );
};

// ─── Badge ────
const Badge = ({ status }) => {
  const m = {
    [ST.AUTO]:    { bg:C.greenBg,    c:C.green,  l:"AUTO-FILLED" },
    [ST.CONFIRM]: { bg:C.yellowBg,   c:C.yellow, l:"CONFIRM" },
    [ST.MISSING]: { bg:C.redBg,      c:C.red,    l:"MISSING" },
    pending:      { bg:C.yellowBg,   c:C.yellow, l:"PENDING" },
    accepted:     { bg:C.greenBg,    c:C.green,  l:"ACCEPTED" },
    flagged:      { bg:C.redBg,      c:C.red,    l:"FLAGGED" },
    edited:       { bg:C.accentLight,c:C.accent, l:"EDITED" },
    unresolved:   { bg:C.yellowBg,   c:C.yellow, l:"UNRESOLVED" },
  };
  const s = m[status] || m.pending;
  return <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:s.bg, color:s.c, letterSpacing:0.5 }}>{s.l}</span>;
};

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

// ─── DocumentsTab ────
const DocumentsTab = ({ study, templates, activeTmpl, onOpenTemplate, onBack }) => {
  const [pushedLegal, setPushedLegal] = React.useState(study?.pushed_to_legal || false);
  const [pushedCRO, setPushedCRO] = React.useState(study?.pushed_to_cro || false);
  const [pushing, setPushing] = React.useState(null);
  if (!study) return null;

  const pushTo = async (role) => {
    setPushing(role);
    const field = role === "legal" ? "pushed_to_legal" : "pushed_to_cro";
    const { error } = await supabase.from("studies").update({ [field]: true }).eq("id", study.studyId || study.id);
    if (!error) {
      if (role === "legal") setPushedLegal(true);
      else setPushedCRO(true);
    } else {
      alert("Error pushing documents: " + error.message);
    }
    setPushing(null);
  };

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>Documents</h2>
          <p style={{ fontSize:13, color:C.textMuted }}>{study.title || "Untitled Study"}</p>
        </div>
        <button onClick={onBack} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Back
        </button>
      </div>

      {/* Push to Legal/CRO */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>Send Documents to Reviewers</div>
          <div style={{ fontSize:12, color:C.textMuted }}>Push this study's documents to Legal and/or CRO for review.</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => pushTo("legal")} disabled={pushedLegal || pushing==="legal"}
            style={{ padding:"9px 18px", borderRadius:8, border:"none", background:pushedLegal?"#dcfce7":"#1f3b73", color:pushedLegal?"#16a34a":"#fff", fontSize:13, fontWeight:600, cursor:pushedLegal?"default":"pointer" }}>
            {pushing==="legal" ? "Sending..." : pushedLegal ? "✓ Sent to Legal" : "Send to Legal"}
          </button>
          <button onClick={() => pushTo("cro")} disabled={pushedCRO || pushing==="cro"}
            style={{ padding:"9px 18px", borderRadius:8, border:"none", background:pushedCRO?"#f3f0ff":"#7c3aed", color:pushedCRO?"#7c3aed":"#fff", fontSize:13, fontWeight:600, cursor:pushedCRO?"default":"pointer" }}>
            {pushing==="cro" ? "Sending..." : pushedCRO ? "✓ Sent to CRO" : "Send to CRO"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gap:12, marginBottom:24 }}>
        {(study.documents || []).map(doc => (
          <DocCard key={doc.id} doc={doc} study={study} />
        ))}
      </div>

      {templates && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Structured Review Documents</h3>
          <div style={{ display:"grid", gap:10 }}>
            {Object.entries(templates).map(([key, tmpl]) => (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", border:`1px solid ${C.borderLight}`, borderRadius:10, padding:"12px 14px" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{tmpl.icon} {tmpl.name}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>{tmpl.desc}</div>
                </div>
                <button onClick={() => onOpenTemplate(key)}
                  style={{ padding:"8px 12px", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {templates && activeTmpl && templates[activeTmpl] && (
        <div style={{ marginTop:20 }}>
          <IRBReview tmpl={templates[activeTmpl]} onBack={() => onOpenTemplate(null)} />
        </div>
      )}
    </div>
  );
};

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

// ─── Upload ────
const Upload = ({ onParsed, onCancel }) => {
  const [form,setForm] = useState({ studyTitle:"", sponsorName:"", piName:"", coordName:"", sponsorType:"Industry" });
  const [file,setFile] = useState(null); const [loading,setLoading] = useState(false); const [prog,setProg] = useState(0); const [progMsg,setProgMsg] = useState(""); const [err,setErr] = useState(null);
  const handleFile = useCallback(f => { if(!f) return; if(!f.name.endsWith(".pdf")) { setErr("Please upload a PDF file."); return; } setFile(f); setErr(null); }, []);
  const inp = { width:"100%", padding:"11px 16px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", fontFamily:"inherit", background:"#fff", color:C.text };

  const go = async () => {
    if (!file) { setErr("Upload a PDF protocol file first."); return; }
    setLoading(true); setErr(null); setProg(10); setProgMsg("Reading PDF...");
    try {
      const text = await extractTextFromPDF(file);
      setProg(35); setProgMsg("Extracting text...");
      if (!text || text.trim().length < 100) { setErr("Could not extract text from PDF."); setLoading(false); return; }
      setProg(55); setProgMsg("Running AI extraction of 50 fields...");
      const extracted = await extractFieldsWithGPT(text);
      if (form.studyTitle) extracted.protocol_title_full = form.studyTitle;
      if (form.sponsorName) extracted.investigational_product_name = extracted.investigational_product_name || form.sponsorName;
      setProg(100); setProgMsg("Done!");
      setTimeout(() => onParsed(extracted, form), 400);
    } catch(e) { setErr("Error: " + e.message); setLoading(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:24 }}>
      <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTopColor:"#1f3b73", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <div style={{ fontSize:15, fontWeight:600, color:C.text }}>Extracting 50 Protocol Fields...</div>
      <div style={{ width:300, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}><div style={{ width:`${prog}%`, height:"100%", background:"#1f3b73", transition:"width 0.4s" }}/></div>
      <div style={{ fontSize:12, color:C.textMuted }}>{progMsg}</div>
    </div>
  );

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 0" }}>
      <h2 style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:6 }}>Create New Study</h2>
      <p style={{ fontSize:13, color:C.textMuted, marginBottom:24, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>Fill in the study details below and upload a protocol PDF to begin.</p>
      {err && <div style={{ background:C.redBg, borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:C.red }}>{err}</div>}
      <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"24px", display:"flex", flexDirection:"column", gap:18 }}>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Study Title <span style={{ color:C.textMuted, fontWeight:400 }}>(optional override)</span></label><input value={form.studyTitle} onChange={e => setForm({...form,studyTitle:e.target.value})} style={inp} placeholder="Auto-extracted from PDF"/></div>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Sponsor Name <span style={{ color:C.textMuted, fontWeight:400 }}>(optional override)</span></label><input value={form.sponsorName} onChange={e => setForm({...form,sponsorName:e.target.value})} style={inp} placeholder="Auto-extracted from PDF"/></div>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Principal Investigator Name</label><input value={form.piName} onChange={e => setForm({...form,piName:e.target.value})} style={inp}/></div>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Coordinator Name</label><input value={form.coordName} onChange={e => setForm({...form,coordName:e.target.value})} style={inp}/></div>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Sponsor Type</label>
          <select value={form.sponsorType} onChange={e => setForm({...form,sponsorType:e.target.value})} style={{...inp,cursor:"pointer",appearance:"auto"}}><option>Industry</option><option>NIH</option><option>Other Federal</option><option>Network</option><option>Other</option></select></div>
        <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:6, color:C.textSec }}>Upload Protocol PDF <span style={{ color:C.red }}>*</span></label>
          <div onClick={() => { const i=document.createElement("input"); i.type="file"; i.accept=".pdf"; i.onchange=e=>handleFile(e.target.files[0]); i.click(); }}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            style={{ border:`2px dashed ${file?"#16a34a":C.border}`, borderRadius:12, padding:"24px", textAlign:"center", cursor:"pointer", background:file?"#dcfce7":"#f8fafc" }}>
            {file ? <span style={{ fontSize:13, color:"#16a34a", fontWeight:600 }}>📄 {file.name}</span> : <span style={{ fontSize:13, color:C.textMuted }}>☁ Drag and drop a <strong>PDF</strong> or <span style={{ color:"#1f3b73", fontWeight:600 }}>Browse</span></span>}
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:8 }}>AI extracts all 50 protocol fields. Missing fields will be prompted one at a time.</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:20 }}>
        <button onClick={go} disabled={!file} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:file?"#1f3b73":C.border, color:file?"#fff":C.textMuted, fontSize:13, fontWeight:700, cursor:file?"pointer":"not-allowed" }}>Create New Study</button>
        {onCancel && <button onClick={onCancel} style={{ padding:"10px 24px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.textSec, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>}
      </div>
    </div>
  );
};

// ─── AllStudies ────
const AllStudies = ({ studies, onSelect, onNew }) => {
  const [filter,setFilter] = useState(""); const [showFilter,setShowFilter] = useState(false);
  const filtered = filter ? studies.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || s.sponsor?.toLowerCase().includes(filter.toLowerCase())) : studies;
  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:700 }}>All Studies</h2>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onNew} style={{ padding:"8px 16px", borderRadius:4, border:"none", background:C.accent, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>START NEW STUDY</button>
          <button onClick={() => setShowFilter(s => !s)} style={{ padding:"8px 16px", borderRadius:4, border:`1px solid ${C.border}`, background:showFilter?C.accentLight:C.surface, color:showFilter?C.accent:C.textSec, fontSize:12, fontWeight:600, cursor:"pointer" }}>🔽 FILTER</button>
        </div>
      </div>
      {showFilter && <div style={{ marginBottom:12 }}><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by title or product..." style={{ padding:"8px 12px", borderRadius:4, border:`1px solid ${C.border}`, fontSize:13, width:300, boxSizing:"border-box" }}/>{filter && <button onClick={() => setFilter("")} style={{ marginLeft:8, fontSize:12, color:C.red, background:"none", border:"none", cursor:"pointer" }}>✕ Clear</button>}</div>}
      <div style={{ background:C.surface, borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${C.border}`, textAlign:"left" }}>
            {["STUDY TITLE","PRODUCT","PHASE","PROGRESS","TOP BLOCKER","MY NEXT TASK","LAST UPDATED"].map(h => <th key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((s,i) => { const pct = Math.round((s.filled/(s.filled+s.missing+s.confirm))*100)||0; return (
              <tr key={i} onClick={() => onSelect(i)} style={{ borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer" }} onMouseEnter={e => e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background=""}>
                <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:600 }}>{(s.title||"Untitled").substring(0,40)}{(s.title||"").length>40?"...":""}</div><div style={{ fontSize:11, color:C.textMuted }}>{s.sponsor} · {s.phases}</div></td>
                <td style={{ padding:"12px 14px", color:C.textSec }}>{s.sponsorType||"—"}</td>
                <td style={{ padding:"12px 14px" }}><Badge status={s.phases?"accepted":"pending"}/></td>
                <td style={{ padding:"12px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:80, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}><div style={{ width:`${pct}%`, height:"100%", background:pct>60?C.green:pct>30?C.yellow:C.red, borderRadius:3 }}/></div><span style={{ fontSize:11, color:C.textMuted }}>{pct}%</span></div></td>
                <td style={{ padding:"12px 14px" }}>{s.blocker ? <span style={{ color:C.red, fontSize:12 }}>⚠ {s.blocker}</span> : <span style={{ color:C.textMuted, fontSize:12 }}>—</span>}</td>
                <td style={{ padding:"12px 14px" }}><span style={{ color:C.accent, fontSize:12 }}>{s.nextTask||"Review docs"} →</span></td>
                <td style={{ padding:"12px 14px", color:C.textMuted, fontSize:12 }}>{s.updated||"Just now"}</td>
              </tr>
            );})}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>{studies.length===0 ? "No studies yet. Click \"Start New Study\" to begin." : "No studies match your filter."}</div>}
      </div>
    </div>
  );
};

// ─── RC Dashboard ────
const RCDashboard = ({ studies, onNav, onSelect }) => {
  const [taskFilter,setTaskFilter] = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));

  const activeCount = studies.length;
  const blockedCount = studies.filter(s => s.blocked).length;
  const irbInProgress = studies.filter(s => s.irbStatus==="In Progress"||s.irbStatus==="Submitted").length;
  const contractsPending = studies.filter(s => s.contractStatus!=="Executed").length;
  const avgDays = studies.length ? Math.round(studies.reduce((sum,s) => sum+(s.activationDays||0),0)/studies.length) : 0;

  const stats = [
    {label:"Active Studies",value:activeCount,color:"#2563eb"},
    {label:"Studies Blocked",value:blockedCount,color:blockedCount>0?"#dc2626":"#16a34a"},
    {label:"IRB In Progress",value:irbInProgress,color:"#d97706"},
    {label:"Contracts Pending",value:contractsPending,color:"#7c3aed"},
    {label:"Avg Days to Activation",value:avgDays,color:"#0891b2"},
  ];

  const tasks = studies.length > 0 ? studies.flatMap((s,idx) => {
    const t = [];
    if (s.missing>10) t.push({id:`${idx}-fields`,title:`Complete missing fields — ${(s.title||"Study").substring(0,30)}`,dueType:"overdue",study:s,action:"fields"});
    if (s.irbStatus==="Not Started") t.push({id:`${idx}-irb`,title:`Submit IRB application — ${(s.title||"Study").substring(0,30)}`,dueType:"dueToday"});
    if (s.contractStatus==="Not Started"||s.contractStatus==="Drafting") t.push({id:`${idx}-contract`,title:`Review contract — ${(s.title||"Study").substring(0,30)}`,dueType:"upcoming"});
    if (s.missing<=10&&s.missing>0) t.push({id:`${idx}-confirm`,title:`Confirm extracted fields — ${(s.title||"Study").substring(0,30)}`,dueType:"dueToday",study:s,action:"fields"});
    return t;
  }) : [{id:"empty-1",title:"Upload your first protocol to generate tasks",dueType:"upcoming"}];

  const filteredTasks = taskFilter==="Due Today" ? tasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? tasks.filter(t=>t.dueType==="overdue") : tasks;
  const priorityActions = studies.filter(s=>s.blocked||s.missing>5).slice(0,5).map(s=>({
    study:(s.title||"Untitled").substring(0,25),
    workstream:s.irbStatus==="Not Started"?"IRB":s.contractStatus==="Not Started"?"Contract":"Fields",
    action:s.missing>15?"Complete missing fields":s.missing>5?"Review flagged fields":"Confirm extracted data",
    next:s.nextTask||"Review →"
  }));

  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:26 }}>
        <h2 style={{ fontSize:24, fontWeight:700, color:C.text }}>Study Coordinator Dashboard</h2>
        <button onClick={() => onNav("upload")} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"#1f2a44", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>+ Create New Study</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:16, marginBottom:24 }}>
        {stats.map(card => (
          <div key={card.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", minHeight:98, boxSizing:"border-box" }}>
            <div style={{ fontSize:13, color:"#7c8aa5", marginBottom:8 }}>{card.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr", gap:16, alignItems:"start" }}>
        <div>
          <div style={{ marginBottom:18 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>My Priority Actions</h3>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", minHeight:120 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 2fr 1.2fr", padding:"12px 16px", fontSize:12, fontWeight:600, color:"#7c8aa5", background:"#f8fafc", borderBottom:`1px solid ${C.border}` }}>
                <div>Study</div><div>Workstream</div><div>Action Needed</div><div>Next Step</div>
              </div>
              {priorityActions.length===0
                ? <div style={{ padding:"16px", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>No priority actions. Upload a study to get started.</div>
                : priorityActions.map((a,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 2fr 1.2fr", padding:"10px 16px", fontSize:13, borderBottom:i!==priorityActions.length-1?`1px solid ${C.border}`:"none", alignItems:"center" }}>
                    <div style={{ fontWeight:600, color:C.text }}>{a.study}</div>
                    <div><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:"#e8eefb", color:"#355c9a", fontWeight:600 }}>{a.workstream}</span></div>
                    <div style={{ color:C.textSec }}>{a.action}</div>
                    <div style={{ color:C.accent, fontSize:12, cursor:"pointer" }}>{a.next}</div>
                  </div>
                ))
              }
            </div>
          </div>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>Recently Updated Studies</h3>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", minHeight:80 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr", padding:"12px 16px", fontSize:12, fontWeight:600, color:"#7c8aa5", background:"#f8fafc", borderBottom:`1px solid ${C.border}` }}>
                <div>Study</div><div>Status</div><div>Last Updated</div><div>Owner</div>
              </div>
              {studies.length===0
                ? <div style={{ padding:"16px", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>No studies uploaded yet.</div>
                : studies.slice(0,5).map((s,i) => {
                  const pct = Math.round((s.filled/(s.filled+s.missing+s.confirm))*100)||0;
                  const statusLabel = pct>80?"Mostly Complete":pct>50?"In Progress":pct>20?"Early Stage":"Needs Attention";
                  const statusColor = pct>80?"#16a34a":pct>50?"#2563eb":pct>20?"#d97706":"#dc2626";
                  return (
                    <div key={i} onClick={() => onSelect && onSelect(s)} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr", padding:"10px 16px", fontSize:13, borderBottom:i!==Math.min(studies.length,5)-1?`1px solid ${C.border}`:"none", alignItems:"center", cursor:"pointer" }} onMouseEnter={e => e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background=""}>
                      <div>
                        <div style={{ fontWeight:600, color:C.text }}>{(s.title||"Untitled").substring(0,30)}{(s.title||"").length>30?"...":""}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{s.phases} · {s.sponsorType}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:statusColor+"18", color:statusColor, fontWeight:600 }}>{statusLabel}</span>
                        <span style={{ fontSize:11, color:C.textMuted }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted }}>{s.updated||"Just now"}</div>
                      <div style={{ fontSize:12, color:C.textSec }}>{s.coordinator||"—"}</div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:10 }}>My Tasks</h3>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background:"#f8fafc" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Assigned to me</span>
                <span style={{ fontSize:11, fontWeight:700, color:filteredTasks.length?"#4f46e5":"#94a3b8" }}>{filteredTasks.length}</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {["All","Due Today","Overdue"].map(label => (
                  <button key={label} onClick={() => setTaskFilter(label)} style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:taskFilter===label?"#1f3b73":"#fff", color:taskFilter===label?"#fff":"#64748b", border:`1px solid ${taskFilter===label?"#1f3b73":C.border}`, cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>
                ))}
              </div>
            </div>
            {filteredTasks.length===0
              ? <div style={{ padding:"18px 16px", fontSize:13, color:C.textMuted }}>No tasks match this filter.</div>
              : filteredTasks.map((t,i) => (
                <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"14px 16px", borderBottom:i!==filteredTasks.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ width:6, height:6, borderRadius:999, background:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#16a34a", marginTop:8, flexShrink:0 }}/>
                  <div onClick={() => toggleTask(t.id)} style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checkedTasks[t.id]?"#1f3b73":C.border}`, background:checkedTasks[t.id]?"#1f3b73":"#fff", marginTop:2, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checkedTasks[t.id] && <span style={{ color:"#fff", fontSize:10, lineHeight:1 }}>✓</span>}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14, color:checkedTasks[t.id]?C.textMuted:C.text, lineHeight:1.4, textDecoration:checkedTasks[t.id]?"line-through":"none" }}>{t.title}</div>
                    <div style={{ fontSize:11, color:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#94a3b8", fontWeight:600, marginTop:2 }}>
                      {t.dueType==="dueToday"?"Due today":t.dueType==="overdue"?"Overdue":"Upcoming"}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Legal Dashboard (reads from Supabase) ────
const LegalDashboard = ({ onNav, onViewPDFs }) => {
  const [taskFilter,setTaskFilter]   = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));
  const [expandedSection,setExpandedSection] = useState(null);
  const [sharedStudies,setSharedStudies]     = useState([]);
  const [loadingStudies,setLoadingStudies]   = useState(true);

  useEffect(() => {
    supabase.from("studies").select("*").eq("archived",false).eq("pushed_to_legal",true).order("uploaded_at",{ascending:false}).then(({data,error}) => {
      if (!error && data) {
        setSharedStudies(data.map(r => ({
          studyId: r.id, title: r.title, sponsor: r.sponsor,
          phases: r.phases, pi: r.pi,
          contractSections:  r.contract_sections  || [],
          consentSections:   r.consent_sections   || [],
          uploadedAt:        r.uploaded_at,
          pushed_to_legal:   r.pushed_to_legal    || false,
          pushed_to_cro:     r.pushed_to_cro      || false,
        })));
      }
      setLoadingStudies(false);
    });
  }, []);

  const updateSectionStatus = (studyId, sectionId, type, newStatus) => {
    setSharedStudies(prev => {
      const next = prev.map(s => {
        if (s.studyId !== studyId) return s;
        const key  = type==="contract" ? "contractSections" : "consentSections";
        const dbKey= type==="contract" ? "contract_sections" : "consent_sections";
        const updated = {...s, [key]: s[key].map(sec => sec.id===sectionId ? {...sec,legalStatus:newStatus} : sec)};
        supabase.from("studies").update({[dbKey]: updated[key]}).eq("id", studyId).then(({error}) => { if(error) console.error("Update error:", error); });
        return updated;
      });
      return next;
    });
  };

  const allContracts    = sharedStudies.flatMap(s => s.contractSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId,sponsor:s.sponsor})));
  const allConsent      = sharedStudies.flatMap(s => s.consentSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId})));
  const pendingContracts= allContracts.filter(c => c.legalStatus==="pending").length;
  const approvedContracts=allContracts.filter(c => c.legalStatus==="approved").length;
  const flaggedContracts= allContracts.filter(c => c.legalStatus==="flagged").length;
  const riskItems       = [...allContracts.filter(c=>c.legalStatus==="flagged"), ...allConsent.filter(c=>c.legalStatus==="flagged")];

  const legalTasks = sharedStudies.flatMap(s => {
    const t=[]; const name=(s.title||"Study").substring(0,25);
    s.contractSections.filter(c=>c.legalStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-c-${c.id}`,title:`Review ${c.title} — ${name}`,study:name,tag:"Contract",dueText:"Due today",dueType:"dueToday"}));
    s.consentSections.filter(c=>c.legalStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ic-${c.id}`,title:`Review ${c.title} (ICF) — ${name}`,study:name,tag:"Consent",dueText:"Due today",dueType:"dueToday"}));
    s.contractSections.filter(c=>c.legalStatus==="flagged").forEach(c=>t.push({id:`${s.studyId}-f-${c.id}`,title:`Resolve flagged ${c.title} — ${name}`,study:name,tag:"Risk",dueText:"Needs attention",dueType:"overdue"}));
    return t;
  });
  if (legalTasks.length===0) legalTasks.push({id:"empty",title:"No studies uploaded yet — waiting for RC to submit a protocol",study:"—",tag:"Info",dueText:"Pending",dueType:"upcoming"});
  const filteredTasks = taskFilter==="Due Today" ? legalTasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? legalTasks.filter(t=>t.dueType==="overdue") : legalTasks;

  const statusBadge = status => {
    const map = {pending:{bg:"#fef3c718",color:"#d97706",label:"Pending Review"},approved:{bg:"#dcfce718",color:"#16a34a",label:"Approved"},flagged:{bg:"#fee2e218",color:"#dc2626",label:"Flagged"}};
    const s = map[status]||map.pending;
    return <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:s.bg,color:s.color,fontWeight:600}}>{s.label}</span>;
  };

  if (loadingStudies) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Loading studies…</div>;


  return (
    <div style={{padding:"24px 0"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:700,color:C.text}}>Legal Reviewer Dashboard</h2>
        {sharedStudies.length===0 && <p style={{fontSize:13,color:C.textMuted,marginTop:6}}>No protocols uploaded yet. The RC needs to upload a study first.</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16,marginBottom:22}}>
        {[
          {label:"Contracts Pending Review",value:pendingContracts,color:"#d97706"},
          {label:"Sections Approved",value:approvedContracts,color:"#16a34a"},
          {label:"Sections Flagged",value:flaggedContracts,color:"#dc2626"},
          {label:"Studies Received",value:sharedStudies.length,color:"#2563eb"},
        ].map(card => (
          <div key={card.label} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:"16px 18px",minHeight:80,boxSizing:"border-box"}}>
            <div style={{fontSize:13,color:"#7c8aa5",marginBottom:8}}>{card.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:card.color}}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr",gap:16,alignItems:"start"}}>
        <div>
          {sharedStudies.map(study => (
            <div key={study.studyId} style={{marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>{study.title}</h3>
              <p style={{fontSize:12,color:C.textMuted,marginBottom:10}}>{study.sponsor} · {study.phases} · PI: {study.pi}</p>
              <StudyPDFs
                studyId={study.studyId}
                onViewPDFs={() => onViewPDFs(study)}
              />
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Contract Sections (CTA)</div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                  {study.contractSections.map((sec,i) => {
                    const key=`${study.studyId}-c-${sec.id}`;
                    return (
                      <div key={sec.id}>
                        <div onClick={() => setExpandedSection(expandedSection===key?null:key)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",cursor:"pointer",borderBottom:expandedSection===key||i!==study.contractSections.length-1?`1px solid ${C.border}`:"none"}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{sec.title}</span>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {statusBadge(sec.legalStatus)}
                            <span style={{fontSize:12,color:C.textMuted,transform:expandedSection===key?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                          </div>
                        </div>
                        {expandedSection===key && (
                          <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:i!==study.contractSections.length-1?`1px solid ${C.border}`:"none"}}>
                            <div style={{fontSize:12,fontWeight:600,color:C.textMuted,marginBottom:4}}>Extracted from Protocol:</div>
                            <div style={{fontSize:13,color:C.text,lineHeight:1.5,marginBottom:12,background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>{sec.source}</div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","approved")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.legalStatus==="approved"?"#16a34a":"#dcfce7",color:sec.legalStatus==="approved"?"#fff":"#16a34a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.legalStatus==="approved"?"✓ Approved":"Approve"}</button>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","flagged")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.legalStatus==="flagged"?"#dc2626":"#fee2e2",color:sec.legalStatus==="flagged"?"#fff":"#dc2626",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.legalStatus==="flagged"?"⚠ Flagged":"Flag for Review"}</button>
                              {sec.legalStatus!=="pending" && <button onClick={() => updateSectionStatus(study.studyId,sec.id,"contract","pending")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSec,fontSize:12,fontWeight:600,cursor:"pointer"}}>Reset</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              
              {riskItems.length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Risk Alerts</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {riskItems.map((r,i) => (
                      <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center"}}>
                        <div style={{width:3,height:24,borderRadius:999,background:"#dc2626",marginRight:12,flexShrink:0}}/>
                        <div><span style={{fontSize:13,fontWeight:600,color:C.text}}>{r.title}</span><span style={{fontSize:12,color:C.textMuted,marginLeft:8}}>— {r.studyTitle||study.title}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {sharedStudies.length===0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⏳</div>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:6}}>Waiting for Protocol Upload</div>
              <div style={{fontSize:13,color:C.textMuted}}>The Regulatory Coordinator needs to upload a protocol PDF. Once uploaded, contract and consent sections will appear here for your review.</div>
            </div>
          )}
        </div>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:10}}>My Tasks</h3>
          <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:"#f8fafc"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Assigned to me</span>
                <span style={{fontSize:11,fontWeight:700,color:filteredTasks.length?"#4f46e5":"#94a3b8"}}>{filteredTasks.length}</span>
              </div>
              <div style={{display:"flex",gap:4}}>
                {["All","Due Today","Overdue"].map(label => <button key={label} onClick={() => setTaskFilter(label)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:taskFilter===label?"#1f3b73":"#fff",color:taskFilter===label?"#fff":"#64748b",border:`1px solid ${taskFilter===label?"#1f3b73":C.border}`,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>)}
              </div>
            </div>
            {filteredTasks.length===0 ? <div style={{padding:"18px 16px",fontSize:13,color:C.textMuted}}>No tasks match this filter.</div> :
              filteredTasks.map((t,i) => (
                <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px",borderBottom:i!==filteredTasks.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:999,background:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#16a34a",marginTop:8,flexShrink:0}}/>
                  <div onClick={() => toggleTask(t.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checkedTasks[t.id]?"#1f3b73":C.border}`,background:checkedTasks[t.id]?"#1f3b73":"#fff",marginTop:2,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {checkedTasks[t.id] && <span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:checkedTasks[t.id]?C.textMuted:C.text,lineHeight:1.4,marginBottom:4,textDecoration:checkedTasks[t.id]?"line-through":"none"}}>{t.title}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#e8eefb",color:"#355c9a",fontWeight:600}}>{t.study}</span>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#f3f4f6",color:"#8b5e3c",fontWeight:600}}>{t.tag}</span>
                      <span style={{fontSize:11,color:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#94a3b8",fontWeight:600}}>{t.dueText}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CRO Dashboard (reads from Supabase) ────
const CRODashboard = ({ onNav, onViewPDFs }) => {
  const [taskFilter,setTaskFilter]   = useState("All");
  const [checkedTasks,setCheckedTasks] = useState({});
  const toggleTask = id => setCheckedTasks(prev => ({...prev,[id]:!prev[id]}));
  const [expandedSection,setExpandedSection] = useState(null);
  const [sharedStudies,setSharedStudies]     = useState([]);
  const [loadingStudies,setLoadingStudies]   = useState(true);

  useEffect(() => {
    supabase.from("studies").select("*").eq("archived",false).eq("pushed_to_cro",true).order("uploaded_at",{ascending:false}).then(({data,error}) => {
      if (!error && data) {
        setSharedStudies(data.map(r => ({
          studyId: r.id, title: r.title, sponsor: r.sponsor,
          phases: r.phases, pi: r.pi,
          contractSections:  r.contract_sections  || [],
          consentSections:   r.consent_sections   || [],
          uploadedAt:        r.uploaded_at,
          pushed_to_legal:   r.pushed_to_legal    || false,
          pushed_to_cro:     r.pushed_to_cro      || false,
        })));
      }
      setLoadingStudies(false);
    });
  }, []);

  const updateSectionStatus = (studyId, sectionId, type, newStatus) => {
    setSharedStudies(prev => {
      const next = prev.map(s => {
        if (s.studyId !== studyId) return s;
        const key  = type==="contract" ? "contractSections" : "consentSections";
        const dbKey= type==="contract" ? "contract_sections" : "consent_sections";
        const updated = {...s, [key]: s[key].map(sec => sec.id===sectionId ? {...sec,croStatus:newStatus} : sec)};
        supabase.from("studies").update({[dbKey]: updated[key]}).eq("id", studyId).then(({error}) => { if(error) console.error("Update error:", error); });
        return updated;
      });
      return next;
    });
  };

  const allContracts  = sharedStudies.flatMap(s => s.contractSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId,sponsor:s.sponsor})));
  const allConsent    = sharedStudies.flatMap(s => s.consentSections.map(c => ({...c,studyTitle:s.title,studyId:s.studyId})));
  const inNegotiation = allContracts.filter(c => c.croStatus==="pending"||c.croStatus==="countered").length;
  const awaitingSite  = allContracts.filter(c => c.legalStatus==="flagged").length;
  const consentReview = allConsent.filter(c => c.croStatus==="pending").length;
  const croApproved   = allContracts.filter(c=>c.croStatus==="approved").length + allConsent.filter(c=>c.croStatus==="approved").length;

  const croTasks = sharedStudies.flatMap(s => {
    const t=[]; const name=(s.title||"Study").substring(0,25);
    s.contractSections.filter(c=>c.legalStatus==="approved"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ca-${c.id}`,title:`Review Legal-approved ${c.title} — ${name}`,study:name,tag:"Contract",dueText:"Due today",dueType:"dueToday"}));
    s.consentSections.filter(c=>c.legalStatus==="approved"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-ica-${c.id}`,title:`Review Legal-approved ${c.title} (ICF) — ${name}`,study:name,tag:"Consent",dueText:"Due today",dueType:"dueToday"}));
    s.contractSections.filter(c=>c.legalStatus==="flagged").forEach(c=>t.push({id:`${s.studyId}-cf-${c.id}`,title:`Respond to flagged ${c.title} — ${name}`,study:name,tag:"Negotiation",dueText:"Needs response",dueType:"overdue"}));
    s.contractSections.filter(c=>c.legalStatus==="pending"&&c.croStatus==="pending").forEach(c=>t.push({id:`${s.studyId}-cp-${c.id}`,title:`Awaiting Legal review of ${c.title} — ${name}`,study:name,tag:"Waiting",dueText:"Pending",dueType:"upcoming"}));
    return t;
  });
  if (croTasks.length===0) croTasks.push({id:"empty",title:"No studies uploaded yet — waiting for RC to submit a protocol",study:"—",tag:"Info",dueText:"Pending",dueType:"upcoming"});
  const filteredTasks = taskFilter==="Due Today" ? croTasks.filter(t=>t.dueType==="dueToday") : taskFilter==="Overdue" ? croTasks.filter(t=>t.dueType==="overdue") : croTasks;

  const legalBadge = status => { const map={pending:{color:"#94a3b8",label:"Legal: Pending"},approved:{color:"#16a34a",label:"Legal: Approved"},flagged:{color:"#dc2626",label:"Legal: Flagged"}}; const s=map[status]||map.pending; return <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:s.color+"18",color:s.color,fontWeight:600}}>{s.label}</span>; };
  const croBadge  = status => { const map={pending:{color:"#d97706",label:"Pending"},approved:{color:"#16a34a",label:"Approved"},countered:{color:"#7c3aed",label:"Countered"}}; const s=map[status]||map.pending; return <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:s.color+"18",color:s.color,fontWeight:600}}>{s.label}</span>; };

  if (loadingStudies) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Loading studies…</div>;

  return (
    <div style={{padding:"24px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
        <h2 style={{fontSize:24,fontWeight:700,color:C.text}}>Sponsor / CRO Dashboard</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16,marginBottom:24}}>
        {[
          {label:"In Negotiation",value:inNegotiation,color:"#d97706"},
          {label:"Flagged by Legal",value:awaitingSite,color:"#dc2626"},
          {label:"Consent Under Review",value:consentReview,color:"#2563eb"},
          {label:"Sections Approved",value:croApproved,color:"#16a34a"},
        ].map(card => (
          <div key={card.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",minHeight:88,boxSizing:"border-box"}}>
            <div style={{fontSize:13,color:"#7c8aa5",marginBottom:8}}>{card.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:card.color}}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr",gap:16,alignItems:"start"}}>
        <div>
          {sharedStudies.map(study => (
            <div key={study.studyId} style={{marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>{study.title}</h3>
              <p style={{fontSize:12,color:C.textMuted,marginBottom:10}}>{study.sponsor} · {study.phases} · PI: {study.pi}</p>

              <StudyPDFs
                studyId={study.studyId}
                onViewPDFs={() => onViewPDFs(study)}
              />

              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Consent Form (ICF)</div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                  {study.consentSections.map((sec,i) => {
                    const key=`${study.studyId}-ic-${sec.id}`;
                    return (
                      <div key={sec.id}>
                        <div onClick={() => setExpandedSection(expandedSection===key?null:key)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",cursor:"pointer",borderBottom:expandedSection===key||i!==study.consentSections.length-1?`1px solid ${C.border}`:"none"}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{sec.title}</span>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            {legalBadge(sec.legalStatus)}{croBadge(sec.croStatus)}
                            <span style={{fontSize:12,color:C.textMuted,transform:expandedSection===key?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                          </div>
                        </div>
                        {expandedSection===key && (
                          <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:i!==study.consentSections.length-1?`1px solid ${C.border}`:"none"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                              <div style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                                <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:4}}>Protocol Data (from RC Upload)</div>
                                <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{sec.source}</div>
                              </div>
                              <div style={{background:sec.legalStatus==="approved"?"#dcfce7":sec.legalStatus==="flagged"?"#fee2e2":"#f8fafc",borderRadius:8,padding:"10px 12px",border:`1px solid ${sec.legalStatus==="approved"?"#bbf7d0":sec.legalStatus==="flagged"?"#fecaca":C.border}`}}>
                                <div style={{fontSize:11,fontWeight:700,color:sec.legalStatus==="approved"?"#166534":sec.legalStatus==="flagged"?"#991b1b":"#64748b",marginBottom:4}}>Legal Review Status</div>
                                <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{sec.legalStatus==="approved"?"Legal has approved this section.":sec.legalStatus==="flagged"?"Legal has flagged this section for risk concerns.":"Awaiting legal review."}</div>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","approved")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.croStatus==="approved"?"#16a34a":"#dcfce7",color:sec.croStatus==="approved"?"#fff":"#16a34a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.croStatus==="approved"?"✓ Accepted":"Accept"}</button>
                              <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","countered")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:sec.croStatus==="countered"?"#7c3aed":"#f3f0ff",color:sec.croStatus==="countered"?"#fff":"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sec.croStatus==="countered"?"↺ Countered":"Counter-Propose"}</button>
                              {sec.croStatus!=="pending" && <button onClick={() => updateSectionStatus(study.studyId,sec.id,"consent","pending")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSec,fontSize:12,fontWeight:600,cursor:"pointer"}}>Reset</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {sharedStudies.length===0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⏳</div>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:6}}>Waiting for Protocol Upload</div>
              <div style={{fontSize:13,color:C.textMuted}}>The Regulatory Coordinator needs to upload a protocol PDF. Once uploaded, the proposed agreement and consent form will appear here.</div>
            </div>
          )}
        </div>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:10}}>My Tasks</h3>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:"#f8fafc"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Assigned to me</span>
                <span style={{fontSize:11,fontWeight:700,color:filteredTasks.length?"#4f46e5":"#94a3b8"}}>{filteredTasks.length}</span>
              </div>
              <div style={{display:"flex",gap:4}}>
                {["All","Due Today","Overdue"].map(label => <button key={label} onClick={() => setTaskFilter(label)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:taskFilter===label?"#1f3b73":"#fff",color:taskFilter===label?"#fff":"#64748b",border:`1px solid ${taskFilter===label?"#1f3b73":C.border}`,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>)}
              </div>
            </div>
            {filteredTasks.length===0 ? <div style={{padding:"18px 16px",fontSize:13,color:C.textMuted}}>No tasks match this filter.</div> :
              filteredTasks.map((t,i) => (
                <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px",borderBottom:i!==filteredTasks.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:999,background:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#16a34a",marginTop:8,flexShrink:0}}/>
                  <div onClick={() => toggleTask(t.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checkedTasks[t.id]?"#1f3b73":C.border}`,background:checkedTasks[t.id]?"#1f3b73":"#fff",marginTop:2,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {checkedTasks[t.id] && <span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:checkedTasks[t.id]?C.textMuted:C.text,lineHeight:1.4,textDecoration:checkedTasks[t.id]?"line-through":"none"}}>{t.title}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:4}}>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#e8eefb",color:"#355c9a",fontWeight:600}}>{t.study}</span>
                      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#f3f4f6",color:"#8b5e3c",fontWeight:600}}>{t.tag}</span>
                      <span style={{fontSize:11,color:t.dueType==="overdue"?"#dc2626":t.dueType==="dueToday"?"#d97706":"#94a3b8",fontWeight:600}}>{t.dueText}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

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

// ─── Activation Map ────
const ActivationMap = ({ onBack, onNav }) => {
  const steps = [{name:"INTAKE",status:"complete",desc:"Submit IRB application and approvals"},{name:"IRB",status:"active",desc:"Submit IRB application and approvals"},{name:"CONTRACT",status:"locked",desc:"Clinical trial agreement review"},{name:"BUDGET",status:"locked",desc:"Budget negotiation and approval"},{name:"ACTIVATION READINESS",status:"locked",desc:"Final activation checklist"}];
  const icons  = {complete:"✅",active:"📝",locked:"🔒"};
  const colors = {complete:C.green,active:C.accent,locked:C.textDim};
  return (
    <div style={{padding:"24px 0",maxWidth:500}}>
      <button onClick={onBack} style={{fontSize:12,color:C.accent,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Go back</button>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:24}}>Activation Map</h2>
      {steps.map((s,i) => (
        <div key={s.name} style={{display:"flex",gap:16}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:8,background:s.status==="locked"?C.bg:s.status==="complete"?C.greenBg:C.accentLight,border:`2px solid ${colors[s.status]}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icons[s.status]}</div>
            {i<steps.length-1 && <div style={{width:2,height:40,background:C.border}}/>}
          </div>
          <div style={{paddingTop:4,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:700,color:s.status==="locked"?C.textMuted:C.text}}>{s.name}</span>
              {s.status==="active"  && <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:C.redBg,color:C.red}}>BLOCKED</span>}
              {s.status==="complete"&& <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:C.greenBg,color:C.green}}>COMPLETE</span>}
            </div>
            {s.status!=="locked" && <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{s.desc}</div>}
            {s.status==="locked"  && <div style={{fontSize:12,color:C.textDim,marginTop:2,fontStyle:"italic"}}>Locked until previous steps complete</div>}
            {s.status==="active"  && <button onClick={() => onNav("review")} style={{marginTop:6,padding:"4px 12px",borderRadius:4,border:"none",background:C.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>GO TO IRB →</button>}
            <div style={{height:i<steps.length-1?16:0}}/>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Activation Readiness ────
const ActivationReadiness = ({ data, onBack, onNav }) => {
  const pct = 65;
  const remaining = [{item:"IRB not approved",owner:"Regulatory",nav:"review"},{item:"Contract not signed",owner:"Legal",nav:"review"},{item:"Budget not final",owner:"Finance",nav:"review"}];
  return (
    <div style={{padding:"24px 0",maxWidth:600}}>
      <button onClick={onBack} style={{fontSize:12,color:C.accent,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Go back</button>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:24}}>ACTIVATION READINESS</h2>
      <div style={{display:"flex",justifyContent:"center",marginBottom:32}}>
        <div style={{position:"relative",width:160,height:160}}>
          <svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke={C.border} strokeWidth="12"/><circle cx="80" cy="80" r="70" fill="none" stroke={C.accent} strokeWidth="12" strokeDasharray={`${pct*4.4} 440`} strokeLinecap="round" transform="rotate(-90 80 80)"/></svg>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.textMuted}}>ACTIVATION</div><div style={{fontSize:11,fontWeight:700,color:C.textMuted}}>READY</div>
            <div style={{fontSize:28,fontWeight:800,color:C.accent}}>{pct}%</div>
          </div>
        </div>
      </div>
      {remaining.map((r,i) => (
        <div key={i} style={{background:C.surface,borderRadius:6,border:`1px solid ${C.border}`,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:13,fontWeight:600}}>{r.item}</div><div style={{fontSize:11,color:C.textMuted}}>Owner: {r.owner}</div></div>
          <button onClick={() => onNav&&onNav(r.nav)} style={{padding:"4px 12px",borderRadius:4,border:`1px solid ${C.border}`,background:C.surface,fontSize:11,fontWeight:600,color:C.accent,cursor:"pointer"}}>GO TO {r.item.split(" ")[0].toUpperCase()} →</button>
        </div>
      ))}
    </div>
  );
};

// ─── Review Docs ────
const ReviewDocs = ({ templates, onSelect, onContinue, onCancel }) => (
  <div style={{padding:"24px 0"}}>
    <h2 style={{fontSize:20,fontWeight:700,marginBottom:20}}>Review Documents</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
      {Object.entries(templates).map(([key,tmpl]) => { const stats=tmpl.sections.flatMap(s=>s.fields).reduce((a,f)=>{a[f.status]=(a[f.status]||0)+1;a.total++;return a;},{total:0}); return (
        <div key={key} onClick={() => onSelect(key)} style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:20,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{tmpl.icon} {tmpl.name}</div>
          <div style={{fontSize:12,color:C.textMuted}}>{tmpl.desc}</div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <span style={{fontSize:10,color:C.green,fontWeight:600}}>● {stats[ST.AUTO]||0}</span>
            <span style={{fontSize:10,color:C.yellow,fontWeight:600}}>● {stats[ST.CONFIRM]||0}</span>
            <span style={{fontSize:10,color:C.red,fontWeight:600}}>● {stats[ST.MISSING]||0}</span>
          </div>
        </div>
      );})}
    </div>
    <div style={{display:"flex",gap:10}}>
      <button onClick={onContinue} style={{padding:"9px 22px",borderRadius:4,border:"none",background:C.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>CONTINUE</button>
      <button onClick={onCancel} style={{padding:"9px 22px",borderRadius:4,border:"none",background:C.red,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>CANCEL</button>
    </div>
  </div>
);

// ─── Main App ────
function App() {
  const [persona,setPersona]           = useState(null);
  const [userName,setUserName]         = useState("");
  const [page,setPage]                 = useState("upload");
  const [studyData,setStudyData]       = useState(null);
  const [formData,setFormData]         = useState(null);
  const [templates,setTemplates]       = useState(null);
  const [clauses,setClauses]           = useState([]);
  const [activeTmpl,setActiveTmpl]     = useState(null);
  const [studies,setStudies]           = useState([]);
  const [missingFields,setMissingFields] = useState([]);
  const [wizardData,setWizardData]     = useState(null);
  const [selectedStudy,setSelectedStudy] = useState(null);
  const [generatingDocs,setGeneratingDocs] = useState(false);

  // Load studies from Supabase on login
  useEffect(() => {
    if (!persona) return;
    supabase.from("studies").select("*").eq("archived", false).order("uploaded_at", { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        setStudies(data.map(r => {
          const extractedData = r.extracted_fields || {};
          const tmpls = Object.keys(extractedData).length ? buildTemplates(extractedData) : null;
          const cls   = Object.keys(extractedData).length ? buildClauses(extractedData)   : [];
          const allF  = tmpls ? Object.values(tmpls).flatMap(t => t.sections.flatMap(s => s.fields)) : [];
          const filledCount  = allF.filter(f => f.status === ST.AUTO).length;
          const confirmCount = allF.filter(f => f.status === ST.CONFIRM).length;
          const missingCount = allF.filter(f => f.status === ST.MISSING).length;

          return {
            id:              r.id,
            studyId:         r.id,
            pushed_to_legal: r.pushed_to_legal || false,
            pushed_to_cro:   r.pushed_to_cro   || false,
            title:           r.title,
            sponsor:         r.sponsor,
            phases:          r.phases || "N/A",
            sponsorType:     "—",
            pi:              r.pi || "—",
            coordinator:     "—",
            updated:         new Date(r.uploaded_at).toLocaleString(),
            filled:          filledCount,
            confirm:         confirmCount,
            missing:         missingCount,
            irbStatus:       "Not Started",
            contractStatus:  "Not Started",
            blocked:         missingCount > 20,
            activationDays:  Math.max(5, Math.round(45 - filledCount * 0.6)),
            blocker:         missingCount > 15 ? "Missing critical fields" : missingCount > 5 ? "IRB Indemnification" : "None",
            nextTask:        missingCount > 10 ? "Complete missing fields →" : "Review documents →",
            extractedData,
            contractSections: r.contract_sections || [],
            consentSections:  r.consent_sections  || [],
            documents: [
              { id: "irb",     name: "IRB Application.pdf",               type: "IRB Application",         createdAt: r.uploaded_at },
              { id: "consent", name: "Consent Form.pdf",                  type: "Consent Form",             createdAt: r.uploaded_at },
              { id: "cta",     name: "Draft Clinical Trial Agreement.pdf", type: "Clinical Trial Agreement", createdAt: r.uploaded_at },
            ],
            templates: tmpls,
            clauses:   cls,
          };
        }));
      }
    });
  }, [persona]);

  const handleExtracted = (extracted, form) => {
    setFormData(form);
    const missing = PROTOCOL_FIELDS.filter(f => { const v=extracted[f.id]; return !v||v.toString().trim()===""||v==="N/A"; });
    if (missing.length > 0) { setMissingFields(missing); setWizardData(extracted); setPage("wizard"); }
    else { finalize(extracted, form); }
  };

  const finalize = async (data, form) => {
    try {
      setGeneratingDocs(true);

      const tmpls        = buildTemplates(data);
      const builtClauses = buildClauses(data);
      const studyId      = crypto.randomUUID();

      // ── Contract & Consent sections ──
      const contractSections = [
        { id:"indemnification", title:"Indemnification",           source: data.high_risk_procedures_flag || "Not specified" },
        { id:"payment",         title:"Payment Terms",              source: data.subject_compensation_amount_and_schedule || "Not specified" },
        { id:"publication",     title:"Publication Rights",         source: data.primary_objective || "Not specified" },
        { id:"confidentiality", title:"Confidentiality & Data Privacy", source: data.data_collected_types || "Not specified" },
        { id:"ip_rights",       title:"Intellectual Property",     source: data.investigational_product_name || "Not specified" },
        { id:"insurance",       title:"Insurance & Liability",     source: data.high_risk_procedures_flag==="Yes" ? "High-risk procedures present" : "Standard risk" },
        { id:"termination",     title:"Termination Clauses",       source: data.stopping_rules_summary || "Not specified" },
      ].map(s => ({...s, legalStatus:"pending", croStatus:"pending"}));

      const consentSections = [
        { id:"lay_summary",      title:"Lay Summary",         source: data.primary_objective || "Not specified" },
        { id:"risk_description", title:"Risk Description",    source: data.stopping_rules_summary || data.sae_reporting_timeline_to_sponsor || "Not specified" },
        { id:"compensation",     title:"Subject Compensation",source: data.subject_compensation_amount_and_schedule || "Not specified" },
        { id:"data_privacy",     title:"Data Privacy",        source: data.data_collected_types || "Not specified" },
        { id:"specimens",        title:"Specimen Banking",    source: data.biospecimens_collected==="Yes" ? (data.future_use_banking_plan||"Specimens collected") : "No specimens" },
        { id:"genetic",          title:"Genetic Testing",     source: data.genetic_testing_performed==="Yes" ? "Genetic testing included" : "No genetic testing" },
      ].map(s => ({...s, legalStatus:"pending", croStatus:"pending"}));

      // ── PDF document descriptors (lazy) ──
      const documents = [
        { id:"irb",     name:"IRB Application.pdf",               type:"IRB Application",         createdAt: new Date().toISOString() },
        { id:"consent", name:"Consent Form.pdf",                  type:"Consent Form",             createdAt: new Date().toISOString() },
        { id:"cta",     name:"Draft Clinical Trial Agreement.pdf", type:"Clinical Trial Agreement", createdAt: new Date().toISOString() },
      ];

      const allF         = Object.values(tmpls).flatMap(t => t.sections.flatMap(s => s.fields));
      const filledCount  = allF.filter(f => f.status===ST.AUTO).length;
      const confirmCount = allF.filter(f => f.status===ST.CONFIRM).length;
      const missingCount = allF.filter(f => f.status===ST.MISSING).length;

      const newStudy = {
        studyId,
        title:           data.protocol_title_full || form?.studyTitle || "Untitled",
        sponsor:         data.investigational_product_name || form?.sponsorName || "—",
        phases:          data.study_phase || "N/A",
        sponsorType:     data.product_type || "—",
        pi:              form?.piName || "—",
        coordinator:     form?.coordName || userName || "—",
        filled:          filledCount,
        confirm:         confirmCount,
        missing:         missingCount,
        irbStatus:       "Not Started",
        contractStatus:  "Not Started",
        blocked:         missingCount > 20,
        activationDays:  Math.max(5, Math.round(45 - filledCount * 0.6)),
        blocker:         missingCount > 15 ? "Missing critical fields" : missingCount > 5 ? "IRB Indemnification" : "None",
        nextTask:        missingCount > 10 ? "Complete missing fields →" : "Review documents →",
        updated:         new Date().toLocaleString(),
        uploadedAt:      Date.now(),
        extractedData:   data,
        documents,
        templates:       tmpls,
        clauses:         builtClauses,
        contractSections,
        consentSections,
      };

      // ── Save to Supabase ──
      console.log("=== ABOUT TO INSERT ===", { studyId, title: newStudy.title });
      const { data: insertData, error: insertError } = await supabase.from("studies").insert({
        id:                studyId,
        title:             newStudy.title,
        sponsor:           newStudy.sponsor,
        phases:            newStudy.phases,
        pi:                newStudy.pi,
        contract_sections: contractSections,
        consent_sections:  consentSections,
        uploaded_at:       Date.now(),
        extracted_fields:  data,
        archived:          false,
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
            next = [newStudy, ...prev.filter((_,i) => i !== existingIdx)];
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
    }
  };

  if (!persona) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}`}</style>
      <Login onLogin={(p,u) => { setPersona(p); setUserName(u||""); setPage("study"); }}/>
    </>
  );

  if (page==="wizard" && missingFields.length>0) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <FieldWizard missingFields={missingFields} extractedData={wizardData} onComplete={completed => finalize(completed, formData)}/>
    </>
  );

  const WaitingScreen = () => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16,textAlign:"center"}}>
      <div style={{fontSize:40}}>⏳</div>
      <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Waiting for Protocol</h2>
      <p style={{fontSize:14,color:C.textMuted,maxWidth:360,lineHeight:1.6}}>No study has been uploaded yet. The Regulatory Coordinator needs to upload the protocol PDF first. Check back soon!</p>
    </div>
  );

  const content = () => {
    switch (persona) {
      case PERSONAS.R:
        if (page==="upload") return <Upload onParsed={handleExtracted} onCancel={() => setPage(studies.length?"studies":"upload")}/>;

        if (page==="studies") return (
          <AllStudies studies={studies} onNew={() => setPage("upload")}
            onSelect={idx => {
              const picked = typeof idx==="number" ? studies[idx] : idx;
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

        if (page==="fields") return <FieldsSummary extractedData={studyData} onContinue={(updatedData) => {setStudyData(updatedData); setPage("reviewTmpl")}}/>;

        if (page==="study") return (
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

        if (page==="review" && templates) return (
          <ReviewDocs templates={templates}
            onSelect={k => { setActiveTmpl(k); setPage("reviewTmpl"); }}
            onContinue={() => setPage("study")}
            onCancel={() => setPage("study")}
          />
        );

        if (page==="reviewTmpl") return (
          <DocumentsTab
            study={selectedStudy}
            templates={templates}
            activeTmpl={activeTmpl}
            onOpenTemplate={k => setActiveTmpl(k)}
            onBack={() => setPage("studies")}
          />
        );

        if (page==="activation") return <ActivationMap onBack={() => setPage("study")} onNav={setPage}/>;
        if (page==="readiness")  return <ActivationReadiness data={studyData} onBack={() => setPage("activation")} onNav={setPage}/>;
        return <Upload onParsed={handleExtracted}/>;

      case PERSONAS.L:
        if (page==="study" || page==="studies" || page==="review" || page==="tasks") return <LegalDashboard onNav={setPage} onViewPDFs={(study) => { setSelectedStudy(study); setPage("legalDocs"); }}/>;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            studyId={selectedStudy.studyId}
            studyTitle={selectedStudy.title}
            isPushed={selectedStudy.pushed_to_legal || false}
            onBack={() => setPage("study")}
          />
        );
        if (!studyData) return <WaitingScreen/>;
        return <FieldsSummary extractedData={studyData} onContinue={() => setPage("study")} editable/>;

      case PERSONAS.S:
        if (page==="study" || page==="studies" || page==="review" || page==="tasks") return <CRODashboard onNav={setPage} onViewPDFs={(study) => { setSelectedStudy(study); setPage("legalDocs"); }}/>;
        if (page === "legalDocs" && selectedStudy) return (
          <LegalDocumentsTab
            studyId={selectedStudy.studyId}
            studyTitle={selectedStudy.title}
            isPushed={selectedStudy.pushed_to_cro || false}
            onBack={() => setPage("study")}
          />
        );
        if (!studyData) return <WaitingScreen/>;
        return <FieldsSummary extractedData={studyData} onContinue={() => setPage("study")} editable/>;

      default: return null;
    }
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Inter',system-ui,-apple-system,sans-serif",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg);}}*{margin:0;padding:0;box-sizing:border-box;}button{font-family:inherit;}textarea:focus,input:focus{border-color:${C.accent}!important;outline:none;}`}</style>
      <Sidebar persona={persona} page={page} onNav={setPage}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <TopBar persona={persona} userName={userName} onSignOut={() => {
          setPersona(null); setUserName(""); setPage("upload");
          setStudyData(null); setFormData(null); setTemplates(null);
          setClauses([]); setActiveTmpl(null); setStudies([]);
          setMissingFields([]); setWizardData(null);
          setSelectedStudy(null); setGeneratingDocs(false);
        }}/>
        <div style={{flex:1,background:"#f1f5f9",overflow:"auto"}}>
          <div style={{padding:"0 32px"}}>{content()}</div>
        </div>
      </div>
    </div>
  );
}

export default App;