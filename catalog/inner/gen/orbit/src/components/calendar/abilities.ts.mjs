// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/calendar/abilities.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function parseIso(v) {
    if (typeof v !== 'string')
        return null;
    const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!mt)
        return null;
    const y = +mt[1];
    const m = +mt[2];
    const d = +mt[3];
    const t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d)
        return null;
    return { y, m, d };
}
export function inner$parseIso$mt(v) {
    const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return mt;
}
export function inner$parseIso$t(v) {
    const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    const y = +mt[1];
    const m = +mt[2];
    const d = +mt[3];
    const t = new Date(Date.UTC(y, m - 1, d));
    return t;
}
export function inner$parseIso$t$$step(y, m, d) {
    const t = new Date(Date.UTC(y, m - 1, d));
    return t;
}
export function inner$dayInfoOf$p(iso) {
    const p = parseIso(iso);
    return p;
}
export function inner$dayInfoOf$local(iso) {
    const p = parseIso(iso);
    const local = new Date(p.y, p.m - 1, p.d, 12);
    return local;
}
export function inner$dayInfoOf$local$$step(p) {
    const local = new Date(p.y, p.m - 1, p.d, 12);
    return local;
}
export function inner$dayInfoOf$dow(iso) {
    const p = parseIso(iso);
    const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
    return dow;
}
export function inner$dayInfoOf$dow$$step(p) {
    const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
    return dow;
}
export function inner$dayInfoOf$isShabbat(iso) {
    const p = parseIso(iso);
    const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
    const isShabbat = dow === 6;
    return isShabbat;
}
export function inner$dayInfoOf$isShabbat$$step(dow) {
    const isShabbat = dow === 6;
    return isShabbat;
}
export function inner$dayInfoOf$isYomTov(YOM_TOV, holiday) {
    const isYomTov = holiday !== null && YOM_TOV.includes(holiday);
    return isYomTov;
}

export const SIGS = {
  inner$parseIso$mt: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseIso$t: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseIso$t$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$dayInfoOf$p: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$dayInfoOf$local: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$dayInfoOf$local$$step: [{"name":"p","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["y",{"t":"num"},false],["m",{"t":"num"},false],["d",{"t":"num"},false]]}]},"opt":false}],
  inner$dayInfoOf$dow: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$dayInfoOf$dow$$step: [{"name":"p","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["y",{"t":"num"},false],["m",{"t":"num"},false],["d",{"t":"num"},false]]}]},"opt":false}],
  inner$dayInfoOf$isShabbat: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$dayInfoOf$isShabbat$$step: [{"name":"dow","d":{"t":"num"},"opt":false}],
  inner$dayInfoOf$isYomTov: [{"name":"YOM_TOV","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"holiday","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
