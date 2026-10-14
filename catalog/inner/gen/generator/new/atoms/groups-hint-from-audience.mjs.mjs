// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/groups-hint-from-audience.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$groupsHintFromAudience$m(audience) {
    const m = (audience || '').match(/(\d+)\s*(?:קבוצות|פעמים)/);
    return m;
}
export function inner$groupsHintFromAudience$n(audience, T) {
    const m = (audience || '').match(/(\d+)\s*(?:קבוצות|פעמים)/);
    const n = parseInt(m[1], T.k1);
    return n;
}
export function inner$groupsHintFromAudience$n$$step(T, m) {
    const n = parseInt(m[1], T.k1);
    return n;
}

export const SIGS = {
  inner$groupsHintFromAudience$m: [{"name":"audience","d":{"t":"any"},"opt":false}],
  inner$groupsHintFromAudience$n: [{"name":"audience","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$groupsHintFromAudience$n$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
