// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/census/atom-index.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const BOILER = new Set(['מהמקור', 'אל', 'תערוך', 'ידנית', 'מוצא', 'בנייה', 'חכמה', 'הורם', 'ע"י', 'מנוע', 'המדף', 'verbatim', 'Stateless', 'Stateful', 'main', 'v2', 'shelf', 'lift']);
const heToks = (s) => [...String(s || '').matchAll(/[֐-׿]{2,}/g)].map((m) => m[0]);
export function inner$atomIndex$origin(src) {
    const origin = (src.match(/מוצא:\s*(screens__[a-z0-9_]+)/) || [])[1] || null;
    return origin;
}
export function inner$atomIndex$ownHe(src) {
    const ownHe = [...new Set(heToks(src.split('\n').filter((l) => /^\s*\/\//.test(l)).join(' ')))].filter((w) => !BOILER.has(w));
    return ownHe;
}
export function inner$atomIndex$purityHe(src) {
    const purityHe = (src.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n').match(/[֐-׿]{2,}/g) || []).filter((w) => !/^[֐׿׳״]+$/.test(w)).length;
    return purityHe;
}
export function inner$atomIndex$purpose(screenTerms, src) {
    const origin = (src.match(/מוצא:\s*(screens__[a-z0-9_]+)/) || [])[1] || null;
    const ownHe = [...new Set(heToks(src.split('\n').filter((l) => /^\s*\/\//.test(l)).join(' ')))].filter((w) => !BOILER.has(w));
    const purpose = origin && screenTerms[origin] && screenTerms[origin].length ? screenTerms[origin] : ownHe;
    return purpose;
}
export function inner$atomIndex$purpose$$step(screenTerms, origin, ownHe) {
    const purpose = origin && screenTerms[origin] && screenTerms[origin].length ? screenTerms[origin] : ownHe;
    return purpose;
}
export function inner$atomIndex$noPurpose(out) {
    const noPurpose = out.filter((a) => a.purposeFrom === 'none');
    return noPurpose;
}

export const SIGS = {
  inner$atomIndex$origin: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$atomIndex$ownHe: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$atomIndex$purityHe: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$atomIndex$purpose: [{"name":"screenTerms","d":{"t":"obj","n":"screenTerms","p":[]},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$atomIndex$purpose$$step: [{"name":"screenTerms","d":{"t":"obj","n":"screenTerms","p":[]},"opt":false},{"name":"origin","d":{"t":"any"},"opt":false},{"name":"ownHe","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$atomIndex$noPurpose: [{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
