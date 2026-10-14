// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/labels.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$priceText$t(p) {
    const t = String(p ?? '').trim();
    return t;
}
export function inner$priceText$m(p) {
    const t = String(p ?? '').trim();
    const m = /^מ[־-]?\s*(\d[\d,.]*)$/.exec(t);
    return m;
}
export function inner$priceText$m$$step(t) {
    const m = /^מ[־-]?\s*(\d[\d,.]*)$/.exec(t);
    return m;
}
export function inner$agoText$t(iso) {
    const t = Date.parse(iso);
    return t;
}
export function inner$agoText$min(iso, nowMs) {
    const t = Date.parse(iso);
    const min = Math.max(0, Math.round((nowMs - t) / 60000));
    return min;
}
export function inner$agoText$min$$step(nowMs, t) {
    const min = Math.max(0, Math.round((nowMs - t) / 60000));
    return min;
}
export function inner$agoText$h(iso, nowMs) {
    const t = Date.parse(iso);
    const min = Math.max(0, Math.round((nowMs - t) / 60000));
    const h = Math.floor(min / 60);
    return h;
}
export function inner$agoText$h$$step(min) {
    const h = Math.floor(min / 60);
    return h;
}
export function inner$agoText$d(iso, nowMs) {
    const t = Date.parse(iso);
    const min = Math.max(0, Math.round((nowMs - t) / 60000));
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    return d;
}
export function inner$agoText$d$$step(h) {
    const d = Math.floor(h / 24);
    return d;
}

export const SIGS = {
  inner$priceText$t: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$priceText$m: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$priceText$m$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$agoText$t: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$agoText$min: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$agoText$min$$step: [{"name":"nowMs","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$agoText$h: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$agoText$h$$step: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$agoText$d: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$agoText$d$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
};
