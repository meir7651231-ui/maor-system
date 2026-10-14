// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/constellation-donor-constellation.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donorConstellation$radiusFor$base(T, daysSince) {
    const base = daysSince <= T.k4 ? 0.30 : daysSince <= T.k5 ? 0.45 : daysSince <= T.k6 ? 0.60 : daysSince <= T.k7 ? 0.75 : 0.9;
    return base;
}
export function inner$donorConstellation$lg(scan) {
    const lg = Math.log10(scan.ils + 1);
    return lg;
}
export function inner$donorConstellation$hash01$h$$after_loop(T, s) {
    let h = T.k2;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, T.k3);
    }
    return h;
}

export const SIGS = {
  inner$donorConstellation$radiusFor$base: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$donorConstellation$lg: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$donorConstellation$hash01$h$$after_loop: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
};
