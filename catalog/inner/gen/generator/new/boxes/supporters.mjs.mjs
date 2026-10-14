// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/supporters.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$visibleSupportersForDesignations$set(allowed) {
    const set = new Set(allowed.map((s) => s.trim()));
    return set;
}
export function inner$visibleSupportersForDesignations$map$filter$p(d) {
    const p = (d.purpose ?? '').trim();
    return p;
}

export const SIGS = {
  inner$visibleSupportersForDesignations$set: [{"name":"allowed","d":{"t":"any"},"opt":false}],
  inner$visibleSupportersForDesignations$map$filter$p: [{"name":"d","d":{"t":"any"},"opt":false}],
};
