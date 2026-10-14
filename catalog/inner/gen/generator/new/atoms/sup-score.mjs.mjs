// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup-score.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supScore$days(T, now, last) {
    const days = last
        ? Math.floor((now - new Date(last + 'T12:00:00').getTime()) / T.k1)
        : T.k2;
    return days;
}
export function inner$supScore$R(T, now, last) {
    const days = last
        ? Math.floor((now - new Date(last + 'T12:00:00').getTime()) / T.k1)
        : T.k2;
    const R = days <= T.k3 ? T.k4 : days <= T.k5 ? T.k6 : days <= T.k7 ? T.k8 : days <= T.k9 ? T.k10 : T.k11;
    return R;
}
export function inner$supScore$R$$step(T, days) {
    const R = days <= T.k3 ? T.k4 : days <= T.k5 ? T.k6 : days <= T.k7 ? T.k8 : days <= T.k9 ? T.k10 : T.k11;
    return R;
}
export function inner$supScore$F(T, cnt) {
    const F = cnt >= T.k12 ? T.k13 : cnt >= 5 ? T.k14 : cnt >= 3 ? T.k15 : cnt >= 2 ? T.k16 : T.k17;
    return F;
}
export function inner$supScore$M(T, tot) {
    const M = tot >= T.k18 ? T.k4 : tot >= T.k19 ? T.k6 : tot >= T.k20 ? T.k21 : tot >= T.k22 ? T.k23 : tot >= T.k16 ? T.k24 : T.k11;
    return M;
}

export const SIGS = {
  inner$supScore$days: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"last","d":{"t":"any"},"opt":false}],
  inner$supScore$R: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"last","d":{"t":"any"},"opt":false}],
  inner$supScore$R$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"days","d":{"t":"num"},"opt":false}],
  inner$supScore$F: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"cnt","d":{"t":"num"},"opt":false}],
  inner$supScore$M: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"tot","d":{"t":"num"},"opt":false}],
};
