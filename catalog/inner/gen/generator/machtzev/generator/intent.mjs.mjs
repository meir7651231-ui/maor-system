// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/intent.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const NOISE = new Set(['detail', 'chrome']);
export function inner$intentProfile$sorted(CAPS, atoms) {
    const cap = {};
    for (const a of atoms)
        for (const c of (CAPS[a.cls] || []))
            if (!NOISE.has(c))
                cap[c] = +((cap[c] || 0) + a.s).toFixed(2);
    const sorted = Object.entries(cap).sort((a, b) => b[1] - a[1]);
    return sorted;
}
export function inner$intentProfile$sorted$$step(cap) {
    const sorted = Object.entries(cap).sort((a, b) => b[1] - a[1]);
    return sorted;
}
export function inner$intentProfile$total(CAPS, atoms) {
    const cap = {};
    for (const a of atoms)
        for (const c of (CAPS[a.cls] || []))
            if (!NOISE.has(c))
                cap[c] = +((cap[c] || 0) + a.s).toFixed(2);
    const sorted = Object.entries(cap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    return total;
}
export function inner$intentProfile$total$$step(sorted) {
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    return total;
}
export function inner$intentProfile$present(CAPS, atoms) {
    const cap = {};
    for (const a of atoms)
        for (const c of (CAPS[a.cls] || []))
            if (!NOISE.has(c))
                cap[c] = +((cap[c] || 0) + a.s).toFixed(2);
    const sorted = Object.entries(cap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    const present = sorted.filter(([, v]) => v / total >= 0.12).map(([c]) => c);
    return present;
}
export function inner$intentProfile$present$$step(sorted, total) {
    const present = sorted.filter(([, v]) => v / total >= 0.12).map(([c]) => c);
    return present;
}
export function inner$intentProfile$cap$$after_loop(CAPS, atoms) {
    const cap = {};
    for (const a of atoms)
        for (const c of (CAPS[a.cls] || []))
            if (!NOISE.has(c))
                cap[c] = +((cap[c] || 0) + a.s).toFixed(2);
    return cap;
}

export const SIGS = {
  inner$intentProfile$sorted: [{"name":"CAPS","d":{"t":"obj","n":"CAPS","p":[]},"opt":false},{"name":"atoms","d":{"t":"any"},"opt":false}],
  inner$intentProfile$sorted$$step: [{"name":"cap","d":{"t":"obj","n":"cap","p":[]},"opt":false}],
  inner$intentProfile$total: [{"name":"CAPS","d":{"t":"obj","n":"CAPS","p":[]},"opt":false},{"name":"atoms","d":{"t":"any"},"opt":false}],
  inner$intentProfile$total$$step: [{"name":"sorted","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"any"}]}},"opt":false}],
  inner$intentProfile$present: [{"name":"CAPS","d":{"t":"obj","n":"CAPS","p":[]},"opt":false},{"name":"atoms","d":{"t":"any"},"opt":false}],
  inner$intentProfile$present$$step: [{"name":"sorted","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"any"}]}},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
  inner$intentProfile$cap$$after_loop: [{"name":"CAPS","d":{"t":"obj","n":"CAPS","p":[]},"opt":false},{"name":"atoms","d":{"t":"any"},"opt":false}],
};
