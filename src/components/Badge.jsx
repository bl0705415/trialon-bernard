import C from "../constants/colors";

const STATUS_STYLES = {
  auto:       { bg: C.greenBg,    c: C.green,  l: "AUTO-FILLED" },
  confirm:    { bg: C.yellowBg,   c: C.yellow, l: "CONFIRM" },
  missing:    { bg: C.redBg,      c: C.red,    l: "MISSING" },

  pending:    { bg: C.yellowBg,   c: C.yellow, l: "PENDING" },
  accepted:   { bg: C.greenBg,    c: C.green,  l: "ACCEPTED" },
  flagged:    { bg: C.redBg,      c: C.red,    l: "FLAGGED" },
  edited:     { bg: C.accentLight,c: C.accent, l: "EDITED" },
  unresolved: { bg: C.yellowBg,   c: C.yellow, l: "UNRESOLVED" },
};

export default function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: s.bg,
        color: s.c,
        letterSpacing: 0.5
      }}
    >
      {s.l}
    </span>
  );
}