

import React from "react";
import C from "../constants/colors";


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


export default StudyPDFs;