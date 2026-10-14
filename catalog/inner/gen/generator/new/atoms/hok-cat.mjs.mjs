// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/hok-cat.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$monthsAgoIso$y(iso) {
    const [y, m] = iso.slice(0, 7).split('-').map(Number);
    return y;
}
export function inner$monthsAgoIso$m(iso) {
    const [y, m] = iso.slice(0, 7).split('-').map(Number);
    return m;
}
export function inner$monthsAgoIso$ty(todayIso) {
    const [ty, tm] = todayIso.slice(0, 7).split('-').map(Number);
    return ty;
}
export function inner$monthsAgoIso$tm(todayIso) {
    const [ty, tm] = todayIso.slice(0, 7).split('-').map(Number);
    return tm;
}

export const SIGS = {
  inner$monthsAgoIso$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$monthsAgoIso$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$monthsAgoIso$ty: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$monthsAgoIso$tm: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
