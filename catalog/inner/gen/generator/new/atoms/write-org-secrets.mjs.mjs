// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/write-org-secrets.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$writeOrgSecrets$v(patch, k) {
    const v = (patch[k] ?? '').trim();
    return v;
}

export const SIGS = {
  inner$writeOrgSecrets$v: [{"name":"patch","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
};
