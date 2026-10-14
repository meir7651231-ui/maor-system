// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:knowledge/connect/2026-09-18/probes-w-wall-130/probe1.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$map$rq(g, i) {
    const rq = g.requirements.filter(r => r.demand === i);
    return rq;
}

export const SIGS = {
  inner$map$rq: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
};
