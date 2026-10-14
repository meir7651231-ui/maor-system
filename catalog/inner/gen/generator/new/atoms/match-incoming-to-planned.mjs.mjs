// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/match-incoming-to-planned.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$matchIncomingToPlanned$targetCents(inc, T) {
    const targetCents = Math.round(inc.amount * T.k1);
    return targetCents;
}
export function inner$matchIncomingToPlanned$incDate(inc, T) {
    const incDate = (inc.at || '').slice(0, T.k2);
    return incDate;
}
export function inner$matchIncomingToPlanned$planCents(T, ref) {
    const planCents = Math.round(ref.plan.amount * T.k1);
    return planCents;
}
export function inner$matchIncomingToPlanned$conf(T, dd) {
    const conf = Math.max(T.k3, T.k1 - dd * T.k2);
    return conf;
}

export const SIGS = {
  inner$matchIncomingToPlanned$targetCents: [{"name":"inc","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$matchIncomingToPlanned$incDate: [{"name":"inc","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$matchIncomingToPlanned$planCents: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$matchIncomingToPlanned$conf: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"dd","d":{"t":"num"},"opt":false}],
};
