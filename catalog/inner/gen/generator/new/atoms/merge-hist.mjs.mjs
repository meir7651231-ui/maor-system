// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/merge-hist.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const key = (h) => h.d + '|' + h.a + '|' + (h.c ?? '₪');
export function inner$mergeHist$arr(incByKey, h) {
    const arr = incByKey.get(key(h));
    return arr;
}
export function inner$mergeHist$map$k(h) {
    const k = key(h);
    return k;
}
export function inner$mergeHist$map$arr(incByKey, h) {
    const k = key(h);
    const arr = incByKey.get(k);
    return arr;
}
export function inner$mergeHist$map$arr$$step(incByKey, k) {
    const arr = incByKey.get(k);
    return arr;
}
export function inner$mergeHist$map$idx(usedInc, h) {
    const k = key(h);
    const idx = usedInc.get(k) ?? 0;
    return idx;
}
export function inner$mergeHist$map$idx$$step(usedInc, k) {
    const idx = usedInc.get(k) ?? 0;
    return idx;
}
export function inner$mergeHist$k(h) {
    const k = key(h);
    return k;
}
export function inner$mergeHist$n(seen, h) {
    const k = key(h);
    const n = (seen.get(k) ?? 0) + 1;
    return n;
}
export function inner$mergeHist$n$$step(seen, k) {
    const n = (seen.get(k) ?? 0) + 1;
    return n;
}
export function inner$mergeHist$incByKey$$after_loop(incoming) {
    const incByKey = new Map();
    for (const h of incoming) {
        const arr = incByKey.get(key(h));
        if (arr)
            arr.push(h);
        else
            incByKey.set(key(h), [h]);
    }
    return incByKey;
}
export function inner$mergeHist$haveCount$$after_loop(existing) {
    const haveCount = new Map();
    for (const h of existing)
        haveCount.set(key(h), (haveCount.get(key(h)) ?? 0) + 1);
    return haveCount;
}

export const SIGS = {
  inner$mergeHist$arr: [{"name":"incByKey","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$map$k: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$map$arr: [{"name":"incByKey","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$map$arr$$step: [{"name":"incByKey","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$mergeHist$map$idx: [{"name":"usedInc","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$map$idx$$step: [{"name":"usedInc","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$mergeHist$k: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$n: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$mergeHist$n$$step: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$mergeHist$incByKey$$after_loop: [{"name":"incoming","d":{"t":"any"},"opt":false}],
  inner$mergeHist$haveCount$$after_loop: [{"name":"existing","d":{"t":"any"},"opt":false}],
};
