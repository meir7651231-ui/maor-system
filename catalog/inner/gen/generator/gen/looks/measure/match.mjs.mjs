// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/measure/match.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$refOf$keys(M, site) {
    const keys = Object.keys(M.sites).filter(k => k === site || k.startsWith(site + '·'));
    return keys;
}

export const SIGS = {
  inner$refOf$keys: [{"name":"M","d":{"t":"any"},"opt":false},{"name":"site","d":{"t":"any"},"opt":false}],
};
