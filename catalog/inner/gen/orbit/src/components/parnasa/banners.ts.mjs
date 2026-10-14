// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/banners.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nameFit$s(n) {
    const s = String(n || '');
    return s;
}
export function inner$nameFit$w(n) {
    const s = String(n || '');
    const w = s.split(/[\s־-]+/).map((x) => [...x].length);
    return w;
}
export function inner$nameFit$w$$step(s) {
    const w = s.split(/[\s־-]+/).map((x) => [...x].length);
    return w;
}
export function inner$nameFit$m(n) {
    const s = String(n || '');
    const w = s.split(/[\s־-]+/).map((x) => [...x].length);
    const m = Math.max(0, ...w);
    return m;
}
export function inner$nameFit$m$$step(w) {
    const m = Math.max(0, ...w);
    return m;
}

export const SIGS = {
  inner$nameFit$s: [{"name":"n","d":{"t":"str"},"opt":false}],
  inner$nameFit$w: [{"name":"n","d":{"t":"str"},"opt":false}],
  inner$nameFit$w$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$nameFit$m: [{"name":"n","d":{"t":"str"},"opt":false}],
  inner$nameFit$m$$step: [{"name":"w","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
};
