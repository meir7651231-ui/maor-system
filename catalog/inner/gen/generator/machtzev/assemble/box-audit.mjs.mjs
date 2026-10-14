// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/box-audit.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const kebab = (n) => n.includes('_')
    ? n.toLowerCase().replace(/_/g, '-')
    : n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export function inner$boxFor$base(draft) {
    const base = kebab(draft.replace('.box-draft.md', ''));
    return base;
}
export function inner$audit$keb(t, alias) {
    const keb = kebab(alias || t);
    return keb;
}
export function inner$audit$inCatalog(catalog, t, alias) {
    const keb = kebab(alias || t);
    const inCatalog = catalog.has(keb);
    return inCatalog;
}
export function inner$audit$inCatalog$$step(catalog, keb) {
    const inCatalog = catalog.has(keb);
    return inCatalog;
}
export function inner$audit$wired(boxSrc, t, alias) {
    const keb = kebab(alias || t);
    const wired = boxSrc.includes(`/${keb}.dart`) || new RegExp(`\\b${alias || t}\\b`).test(boxSrc);
    return wired;
}
export function inner$audit$wired$$step(boxSrc, t, alias, keb) {
    const wired = boxSrc.includes(`/${keb}.dart`) || new RegExp(`\\b${alias || t}\\b`).test(boxSrc);
    return wired;
}
export function inner$boxFor$best$$after_loop(boxes, draft) {
    const base = kebab(draft.replace('.box-draft.md', ''));
    let best = null;
    for (const b of boxes) {
        if (new RegExp(`(^|-)${b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}($|-)`).test(base))
            if (!best || b.length > best.length)
                best = b;
    }
    return best;
}
export function inner$audit$covered$$after_loop(catalog, ALIASES, threads, boxSrc) {
    const covered = [];
    const missing = [];
    const unresolved = [];
    for (const t of threads) {
        const alias = ALIASES[t];
        const keb = kebab(alias || t);
        const inCatalog = catalog.has(keb);
        const wired = boxSrc.includes(`/${keb}.dart`) || new RegExp(`\\b${alias || t}\\b`).test(boxSrc);
        if (wired)
            covered.push(t);
        else if (!inCatalog && !alias)
            unresolved.push(t); // שם לא נפתר בקטלוג — מדוּוח, לא נבלע
        else
            missing.push(t);
    }
    return covered;
}
export function inner$audit$missing$$after_loop(catalog, ALIASES, threads, boxSrc) {
    const covered = [];
    const missing = [];
    const unresolved = [];
    for (const t of threads) {
        const alias = ALIASES[t];
        const keb = kebab(alias || t);
        const inCatalog = catalog.has(keb);
        const wired = boxSrc.includes(`/${keb}.dart`) || new RegExp(`\\b${alias || t}\\b`).test(boxSrc);
        if (wired)
            covered.push(t);
        else if (!inCatalog && !alias)
            unresolved.push(t); // שם לא נפתר בקטלוג — מדוּוח, לא נבלע
        else
            missing.push(t);
    }
    return missing;
}
export function inner$audit$unresolved$$after_loop(catalog, ALIASES, threads, boxSrc) {
    const covered = [];
    const missing = [];
    const unresolved = [];
    for (const t of threads) {
        const alias = ALIASES[t];
        const keb = kebab(alias || t);
        const inCatalog = catalog.has(keb);
        const wired = boxSrc.includes(`/${keb}.dart`) || new RegExp(`\\b${alias || t}\\b`).test(boxSrc);
        if (wired)
            covered.push(t);
        else if (!inCatalog && !alias)
            unresolved.push(t); // שם לא נפתר בקטלוג — מדוּוח, לא נבלע
        else
            missing.push(t);
    }
    return unresolved;
}

export const SIGS = {
  inner$boxFor$base: [{"name":"draft","d":{"t":"any"},"opt":false}],
  inner$audit$keb: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"any"},"opt":false}],
  inner$audit$inCatalog: [{"name":"catalog","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"any"},"opt":false}],
  inner$audit$inCatalog$$step: [{"name":"catalog","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"keb","d":{"t":"any"},"opt":false}],
  inner$audit$wired: [{"name":"boxSrc","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"any"},"opt":false}],
  inner$audit$wired$$step: [{"name":"boxSrc","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"any"},"opt":false},{"name":"keb","d":{"t":"any"},"opt":false}],
  inner$boxFor$best$$after_loop: [{"name":"boxes","d":{"t":"any"},"opt":false},{"name":"draft","d":{"t":"any"},"opt":false}],
  inner$audit$covered$$after_loop: [{"name":"catalog","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ALIASES","d":{"t":"any"},"opt":false},{"name":"threads","d":{"t":"any"},"opt":false},{"name":"boxSrc","d":{"t":"any"},"opt":false}],
  inner$audit$missing$$after_loop: [{"name":"catalog","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ALIASES","d":{"t":"any"},"opt":false},{"name":"threads","d":{"t":"any"},"opt":false},{"name":"boxSrc","d":{"t":"any"},"opt":false}],
  inner$audit$unresolved$$after_loop: [{"name":"catalog","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ALIASES","d":{"t":"any"},"opt":false},{"name":"threads","d":{"t":"any"},"opt":false},{"name":"boxSrc","d":{"t":"any"},"opt":false}],
};
