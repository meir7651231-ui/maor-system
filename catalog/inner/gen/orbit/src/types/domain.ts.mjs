// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/types/domain.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pushDelLog$i(list, entries) {
    const merged = [...(list ?? []), ...entries];
    let i = merged.length - 1;
    return i;
}
export function inner$pushDelLog$i$$step(merged) {
    let i = merged.length - 1;
    return i;
}
export function inner$pushDelLog$k(list, entries, i) {
    const merged = [...(list ?? []), ...entries];
    const k = merged[i].col + '|' + merged[i].id;
    return k;
}
export function inner$pushDelLog$k$$step(merged, i) {
    const k = merged[i].col + '|' + merged[i].id;
    return k;
}
export function inner$mergeDelLogs$k(e) {
    const k = e.col + '|' + e.id;
    return k;
}
export function inner$mergeDelLogs$cur(byKey, e) {
    const k = e.col + '|' + e.id;
    const cur = byKey.get(k);
    return cur;
}
export function inner$mergeDelLogs$cur$$step(byKey, k) {
    const cur = byKey.get(k);
    return cur;
}
export function inner$pushDelLog$seen$$after_loop(list, entries) {
    const merged = [...(list ?? []), ...entries];
    const seen = new Set();
    const out = [];
    for (let i = merged.length - 1; i >= 0; i--) {
        const k = merged[i].col + '|' + merged[i].id;
        if (seen.has(k))
            continue;
        seen.add(k);
        out.unshift(merged[i]);
    }
    return seen;
}
export function inner$pushDelLog$out$$after_loop(list, entries) {
    const merged = [...(list ?? []), ...entries];
    const seen = new Set();
    const out = [];
    for (let i = merged.length - 1; i >= 0; i--) {
        const k = merged[i].col + '|' + merged[i].id;
        if (seen.has(k))
            continue;
        seen.add(k);
        out.unshift(merged[i]);
    }
    return out;
}
export function inner$mergeDelLogs$byKey$$after_loop(a, b) {
    const byKey = new Map();
    for (const e of [...(a ?? []), ...(b ?? [])]) {
        const k = e.col + '|' + e.id;
        const cur = byKey.get(k);
        if (!cur || e.at > cur.at)
            byKey.set(k, e);
    }
    return byKey;
}

export const SIGS = {
  inner$pushDelLog$i: [{"name":"list","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false},{"name":"entries","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false}],
  inner$pushDelLog$i$$step: [{"name":"merged","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false}],
  inner$pushDelLog$k: [{"name":"list","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false},{"name":"entries","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$pushDelLog$k$$step: [{"name":"merged","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mergeDelLogs$k: [{"name":"e","d":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]},"opt":false}],
  inner$mergeDelLogs$cur: [{"name":"byKey","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false},{"name":"e","d":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]},"opt":false}],
  inner$mergeDelLogs$cur$$step: [{"name":"byKey","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$pushDelLog$seen$$after_loop: [{"name":"list","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false},{"name":"entries","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false}],
  inner$pushDelLog$out$$after_loop: [{"name":"list","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false},{"name":"entries","d":{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}},"opt":false}],
  inner$mergeDelLogs$byKey$$after_loop: [{"name":"a","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false},{"name":"b","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DelEntry","p":[["at",{"t":"str"},false],["col",{"t":"str"},false],["id",{"t":"str"},false]]}}]},"opt":false}],
};
