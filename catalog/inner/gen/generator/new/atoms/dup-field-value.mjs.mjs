// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/dup-field-value.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$dupFieldValue$idx(fams, def, pick) {
    const idx = pick[def.key] ?? fams.findIndex((f) => def.get(f));
    return idx;
}

export const SIGS = {
  inner$dupFieldValue$idx: [{"name":"fams","d":{"t":"any"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false},{"name":"pick","d":{"t":"any"},"opt":false}],
};
