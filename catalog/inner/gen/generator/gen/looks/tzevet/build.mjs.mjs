// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/tzevet/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function inner$t2s$h(t) {
    const [h, m] = t.split(':').map(Number);
    return h;
}
export function inner$t2s$m(t) {
    const [h, m] = t.split(':').map(Number);
    return m;
}
export function inner$map$row(r) {
    const row = r + 2;
    return row;
}
export function inner$map$nm(s, r) {
    const row = r + 2;
    const nm = `<div class="nm" style="grid-row:${row}"><b>${esc(s.name)}</b><span>${esc(s.role)}${s.cls ? ' · ' + esc(s.cls) : ''}</span></div>`;
    return nm;
}
export function inner$map$nm$$step(s, row) {
    const nm = `<div class="nm" style="grid-row:${row}"><b>${esc(s.name)}</b><span>${esc(s.role)}${s.cls ? ' · ' + esc(s.cls) : ''}</span></div>`;
    return nm;
}

export const SIGS = {
  inner$t2s$h: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$t2s$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$map$row: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$map$nm: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$map$nm$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
};
