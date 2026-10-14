// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/with-nedarim-hok.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$withNedarimHok$keva(charge) {
    const keva = (charge.kevaId || '').trim();
    return keva;
}
export function inner$withNedarimHok$cd(charge, T) {
    const cd = (charge.d || charge.at || '').slice(0, T.k3);
    return cd;
}

export const SIGS = {
  inner$withNedarimHok$keva: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$withNedarimHok$cd: [{"name":"charge","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
