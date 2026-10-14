// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/hok-effectively-active.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hokEffectivelyActive$monthsAgoIso$y(iso) {
    const [y, m] = iso.slice(0, 7).split('-').map(Number);
    return y;
}
export function inner$hokEffectivelyActive$monthsAgoIso$m(iso) {
    const [y, m] = iso.slice(0, 7).split('-').map(Number);
    return m;
}
export function inner$hokEffectivelyActive$monthsAgoIso$ty(todayIso) {
    const [ty, tm] = todayIso.slice(0, 7).split('-').map(Number);
    return ty;
}
export function inner$hokEffectivelyActive$monthsAgoIso$tm(todayIso) {
    const [ty, tm] = todayIso.slice(0, 7).split('-').map(Number);
    return tm;
}
export function inner$hokEffectivelyActive$last$$after_loop(sp, T) {
    let last = '';
    for (const e of sp.hist ?? [])
        if ((e.clearer === T.k1 || e.clearer === T.k2) && (e.d || '') > last)
            last = e.d || '';
    return last;
}

export const SIGS = {
  inner$hokEffectivelyActive$monthsAgoIso$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$hokEffectivelyActive$monthsAgoIso$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$hokEffectivelyActive$monthsAgoIso$ty: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$hokEffectivelyActive$monthsAgoIso$tm: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$hokEffectivelyActive$last$$after_loop: [{"name":"sp","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
