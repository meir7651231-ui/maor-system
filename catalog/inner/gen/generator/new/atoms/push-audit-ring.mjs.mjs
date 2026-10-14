// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/push-audit-ring.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pushAuditRing$ring(entries, T) {
    const ring = entries.slice(-T.tbl1);
    return ring;
}

export const SIGS = {
  inner$pushAuditRing$ring: [{"name":"entries","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
