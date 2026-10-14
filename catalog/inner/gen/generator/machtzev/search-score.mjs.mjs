// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/search-score.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const tok = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9א-ת]+/).filter((t) => t.length > 1).map((t) => t.replace(/^[והלבמכש](?=[א-ת]{3,})/, ''));
const near = (x, t) => x === t || (t.length >= 4 && x.startsWith(t)) || (x.length >= 4 && t.startsWith(x));
export function inner$scoreFor$idT(entry) {
    const idT = new Set(tok(entry.id || entry.name));
    return idT;
}
export function inner$scoreFor$purT(entry) {
    const purT = new Set(tok((entry.purpose || []).join(' ')));
    return purT;
}
export function inner$loadOracle$filter$k(e) {
    const k = e.layer + ':' + e.id;
    return k;
}
export function inner$scoreFor$s$$after_loop(q, entry, fileT) {
    const idT = new Set(tok(entry.id || entry.name));
    const purT = new Set(tok((entry.purpose || []).join(' ')));
    let s = 0;
    const hits = [];
    for (const t of q) {
        if ([...idT].some((x) => near(x, t))) {
            s += 3;
            hits.push(t);
            continue;
        }
        if ([...fileT].some((x) => near(x, t))) {
            s += 2;
            hits.push(t);
            continue;
        }
        if (purT.has(t)) {
            s += 1;
            hits.push(t);
        }
    }
    return s;
}
export function inner$scoreFor$hits$$after_loop(q, entry, fileT) {
    const idT = new Set(tok(entry.id || entry.name));
    const purT = new Set(tok((entry.purpose || []).join(' ')));
    let s = 0;
    const hits = [];
    for (const t of q) {
        if ([...idT].some((x) => near(x, t))) {
            s += 3;
            hits.push(t);
            continue;
        }
        if ([...fileT].some((x) => near(x, t))) {
            s += 2;
            hits.push(t);
            continue;
        }
        if (purT.has(t)) {
            s += 1;
            hits.push(t);
        }
    }
    return hits;
}

export const SIGS = {
  inner$scoreFor$idT: [{"name":"entry","d":{"t":"any"},"opt":false}],
  inner$scoreFor$purT: [{"name":"entry","d":{"t":"any"},"opt":false}],
  inner$loadOracle$filter$k: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$scoreFor$s$$after_loop: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"entry","d":{"t":"any"},"opt":false},{"name":"fileT","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$scoreFor$hits$$after_loop: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"entry","d":{"t":"any"},"opt":false},{"name":"fileT","d":{"t":"set","of":{"t":"str"}},"opt":false}],
};
