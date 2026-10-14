// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/perturb.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$shiftIso$t(iso) {
    const t = Date.parse(iso + 'T12:00:00Z');
    return t;
}
export function inner$shiftAt$t(s) {
    const t = Date.parse(s);
    return t;
}
export function inner$mutateValue$t(sur, p) {
    const t = 'סוד אישי של ' + sur + ' טלפון ' + p;
    return t;
}
export function inner$mutateList$items(list) {
    const items = list.slice(0, 400);
    return items;
}
export function inner$mutateList$i(out) {
    let i = out.length - 1;
    return i;
}
export function inner$perturbDb$c(seed, r) {
    const secrets = { names: [], phones: [], emails: [], texts: [] };
    const c = { r, secrets, n: seed % 7 };
    return c;
}
export function inner$perturbDb$c$$step(seed, r, secrets) {
    const c = { r, secrets, n: seed % 7 };
    return c;
}

export const SIGS = {
  inner$shiftIso$t: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$shiftAt$t: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$mutateValue$t: [{"name":"sur","d":{"t":"str"},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$mutateList$items: [{"name":"list","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mutateList$i: [{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$perturbDb$c: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"obj","n":"Rng","p":[["next",{"t":"fn"},false],["int",{"t":"fn"},false],["pick",{"t":"fn"},false],["bool",{"t":"fn"},false]]},"opt":false}],
  inner$perturbDb$c$$step: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"obj","n":"Rng","p":[["next",{"t":"fn"},false],["int",{"t":"fn"},false],["pick",{"t":"fn"},false],["bool",{"t":"fn"},false]]},"opt":false},{"name":"secrets","d":{"t":"obj","n":"OrgSecrets","p":[["names",{"t":"arr","of":{"t":"str"}},false],["phones",{"t":"arr","of":{"t":"str"}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["texts",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
};
