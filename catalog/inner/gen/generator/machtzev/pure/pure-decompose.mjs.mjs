// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/pure/pure-decompose.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clean = s => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
export function inner$parse$nm(html) {
    const nm = [...html.matchAll(/<span class="nm">([^<]+)<\/span>/g)].map(m => clean(m[1]));
    return nm;
}
export function inner$parse$seam(html) {
    const seam = [...html.matchAll(/<span class="seam[^"]*">([^<]+)<\/span>/g)].map(m => clean(m[1]).toLowerCase().split(/\s/)[0]);
    return seam;
}
export function inner$parse$chip(html) {
    const chip = [...html.matchAll(/<span class="chip">([^<]+)<\/span>/g)].map(m => clean(m[1]));
    return chip;
}
export function inner$parse$forEach$parts(raw) {
    const parts = raw.split('·').map(x => x.trim());
    return parts;
}
export function inner$parse$forEach$note(raw) {
    const parts = raw.split('·').map(x => x.trim());
    const note = parts.slice(1).join(' · ');
    return note;
}
export function inner$parse$forEach$note$$step(parts) {
    const note = parts.slice(1).join(' · ');
    return note;
}

export const SIGS = {
  inner$parse$nm: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$parse$seam: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$parse$chip: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$parse$forEach$parts: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parse$forEach$note: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parse$forEach$note$$step: [{"name":"parts","d":{"t":"any"},"opt":false}],
};
