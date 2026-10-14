// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/tel.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opt$i(rest, name) {
    const i = rest.indexOf(name);
    return i;
}
export function inner$prevMetaOf$m(prev, tid) {
    const m = JSON.parse((prev[tid] || {})['manifest.json'] || '{}');
    return m;
}

export const SIGS = {
  inner$opt$i: [{"name":"rest","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$prevMetaOf$m: [{"name":"prev","d":{"t":"any"},"opt":false},{"name":"tid","d":{"t":"any"},"opt":false}],
};
