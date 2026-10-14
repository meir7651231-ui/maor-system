// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/src/10-ui.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ring$r(size, thick) {
    const r = (size - thick) / 2;
    return r;
}
export function inner$ring$c(size, thick) {
    const r = (size - thick) / 2;
    const c = 2 * Math.PI * r;
    return c;
}
export function inner$ring$c$$step(r) {
    const c = 2 * Math.PI * r;
    return c;
}
export function inner$ring$on(pct, size, thick) {
    const r = (size - thick) / 2;
    const c = 2 * Math.PI * r;
    const on = Math.max(0, Math.min(100, pct)) / 100 * c;
    return on;
}
export function inner$ring$on$$step(pct, c) {
    const on = Math.max(0, Math.min(100, pct)) / 100 * c;
    return on;
}
export function inner$spark$max(vals) {
    const max = Math.max(...vals);
    return max;
}
export function inner$spark$min(vals) {
    const min = Math.min(...vals);
    return min;
}
export function inner$bars$max(items) {
    const max = Math.max(...items.map(i => i[1])) || 1;
    return max;
}

export const SIGS = {
  inner$ring$r: [{"name":"size","d":{"t":"num"},"opt":false},{"name":"thick","d":{"t":"num"},"opt":false}],
  inner$ring$c: [{"name":"size","d":{"t":"num"},"opt":false},{"name":"thick","d":{"t":"num"},"opt":false}],
  inner$ring$c$$step: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$ring$on: [{"name":"pct","d":{"t":"num"},"opt":false},{"name":"size","d":{"t":"num"},"opt":false},{"name":"thick","d":{"t":"num"},"opt":false}],
  inner$ring$on$$step: [{"name":"pct","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$spark$max: [{"name":"vals","d":{"t":"any"},"opt":false}],
  inner$spark$min: [{"name":"vals","d":{"t":"any"},"opt":false}],
  inner$bars$max: [{"name":"items","d":{"t":"any"},"opt":false}],
};
