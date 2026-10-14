// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup-dup-field-value.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supDupFieldValue$idx(sups, def, pick) {
    const idx = pick[def.key] ?? sups.findIndex((s) => def.get(s));
    return idx;
}

export const SIGS = {
  inner$supDupFieldValue$idx: [{"name":"sups","d":{"t":"any"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false},{"name":"pick","d":{"t":"any"},"opt":false}],
};
