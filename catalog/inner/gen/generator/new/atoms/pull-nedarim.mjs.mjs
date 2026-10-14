// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/pull-nedarim.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pullNedarim$clean(pullUrl) {
    const clean = String(pullUrl || '').trim();
    return clean;
}
export function inner$pullNedarim$org(scope, T) {
    const org = scope.cloudRoot ? T.k3 : scope.slug;
    return org;
}

export const SIGS = {
  inner$pullNedarim$clean: [{"name":"pullUrl","d":{"t":"any"},"opt":false}],
  inner$pullNedarim$org: [{"name":"scope","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
