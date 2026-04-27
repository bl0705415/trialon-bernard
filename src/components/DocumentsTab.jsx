
import React from "react";
import C from "../constants/colors";
import DocCard from "./DocCard";
import { supabase } from "../services/database";
import IRBReview from "./IRBReview";


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
        <div style={{ padding: "24px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Documents</h2>
                    <p style={{ fontSize: 13, color: C.textMuted }}>{study.title || "Untitled Study"}</p>
                </div>
                <button onClick={onBack} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${ C.border }`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Back
                </button>
            </div>

            {/* Push to Legal/CRO */}
            <div style={{ background: "#fff", border: `1px solid ${ C.border }`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Send Documents to Reviewers</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Push this study's documents to Legal and/or CRO for review.</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => pushTo("legal")} disabled={pushedLegal || pushing === "legal"}
                        style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: pushedLegal ? "#dcfce7" : "#1f3b73", color: pushedLegal ? "#16a34a" : "#fff", fontSize: 13, fontWeight: 600, cursor: pushedLegal ? "default" : "pointer" }}>
                        {pushing === "legal" ? "Sending..." : pushedLegal ? "✓ Sent to Legal" : "Send to Legal"}
                    </button>
                    <button onClick={() => pushTo("cro")} disabled={pushedCRO || pushing === "cro"}
                        style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: pushedCRO ? "#f3f0ff" : "#7c3aed", color: pushedCRO ? "#7c3aed" : "#fff", fontSize: 13, fontWeight: 600, cursor: pushedCRO ? "default" : "pointer" }}>
                        {pushing === "cro" ? "Sending..." : pushedCRO ? "✓ Sent to CRO" : "Send to CRO"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                {(study.documents || []).map(doc => (
                    <DocCard key={doc.id} doc={doc} study={study} />
                ))}
            </div>

            {templates && (
                <div style={{ background: "#fff", border: `1px solid ${ C.border }`, borderRadius: 12, padding: 18 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Structured Review Documents</h3>
                    <div style={{ display: "grid", gap: 10 }}>
                        {Object.entries(templates).map(([key, tmpl]) => (
                            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${ C.borderLight }`, borderRadius: 10, padding: "12px 14px" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{tmpl.icon} {tmpl.name}</div>
                                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{tmpl.desc}</div>
                                </div>
                                <button onClick={() => onOpenTemplate(key)}
                                    style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                    Open
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {templates && activeTmpl && templates[activeTmpl] && (
                <div style={{ marginTop: 20 }}>
                    <IRBReview tmpl={templates[activeTmpl]} onBack={() => onOpenTemplate(null)} />
                </div>
            )}
        </div>
    );
};


export default DocumentsTab;