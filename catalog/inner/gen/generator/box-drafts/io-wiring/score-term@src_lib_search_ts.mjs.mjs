// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/io-wiring/score-term@src_lib_search_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$scoreTerm$stem(nq) {
    const stem = nq.slice(0, -2);
    return stem;
}
export function inner$scoreTerm$sq(nq) {
    const sq = nq.replace(/[יו]/g, '');
    return sq;
}
export function inner$scoreTerm$st(nt) {
    const st = nt.replace(/[יו]/g, '');
    return st;
}
export function inner$scoreTerm$max(nt) {
    const max = nt.length >= 6 ? 2 : 1;
    return max;
}

export const SIGS = {
  inner$scoreTerm$stem: [{"name":"nq","d":{"t":"any"},"opt":false}],
  inner$scoreTerm$sq: [{"name":"nq","d":{"t":"any"},"opt":false}],
  inner$scoreTerm$st: [{"name":"nt","d":{"t":"any"},"opt":false}],
  inner$scoreTerm$max: [{"name":"nt","d":{"t":"any"},"opt":false}],
};
