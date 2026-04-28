



import C from "../constants/colors";



const LegalDocumentsTab = ({ documents = [], studyTitle, onBack, isPushed }) => {
    const BUCKET_URL = "https://ceeokkzjugmjckdvjnwf.supabase.co/storage/v1/object/public/study-pdfs";

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
                {documents.map(doc => {
                    const url = `${ BUCKET_URL }/${ doc.path }`;

                    return (
                        <div
                            key={doc.id}
                            style={{
                                background: "#fff",
                                border: `1px solid ${ C.border }`,
                                borderRadius: 10,
                                padding: 16,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                                    {doc.name}
                                </div>
                                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                                    {doc.type}
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        background: C.accentLight,
                                        color: C.accent,
                                        border: "none",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                >
                                    View
                                </button>

                                <button
                                    onClick={async () => {
                                        const res = await fetch(url);
                                        if (!res.ok) {
                                            alert("PDF not found.");
                                            return;
                                        }
                                        const blob = await res.blob();
                                        const a = document.createElement("a");
                                        a.href = URL.createObjectURL(blob);
                                        a.download = doc.name;
                                        a.click();
                                    }}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        background: C.accent,
                                        color: "#fff",
                                        border: "none",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                >
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


export default LegalDocumentsTab;