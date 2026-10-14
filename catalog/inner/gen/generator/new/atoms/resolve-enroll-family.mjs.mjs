// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/resolve-enroll-family.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$resolveEnrollFamily$existing(families, famSel) {
    const existing = families.find((f) => f.id === famSel);
    return existing;
}

export const SIGS = {
  inner$resolveEnrollFamily$existing: [{"name":"families","d":{"t":"any"},"opt":false},{"name":"famSel","d":{"t":"any"},"opt":false}],
};
