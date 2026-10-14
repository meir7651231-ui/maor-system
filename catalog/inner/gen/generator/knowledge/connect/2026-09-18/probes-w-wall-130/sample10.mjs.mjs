// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:knowledge/connect/2026-09-18/probes-w-wall-130/sample10.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$verdict$real(all) {
    const real = all.filter(x => x.cls && x.strict !== false && (x.fields || []).length);
    return real;
}
export function inner$verdict$noCls(all) {
    const noCls = all.filter(x => !x.cls);
    return noCls;
}
export function inner$verdict$loose(all) {
    const loose = all.filter(x => x.strict === false);
    return loose;
}

export const SIGS = {
  inner$verdict$real: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$verdict$noCls: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$verdict$loose: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
