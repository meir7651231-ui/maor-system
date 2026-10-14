// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/plan-nedarim-sync.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$planNedarimSync$out(existing) {
    const out = existing.map((s) => ({ ...s, hist: s.hist ? [...s.hist] : undefined }));
    return out;
}
export function inner$planNedarimSync$registerName$prev(nameIndex, nk) {
    const prev = nameIndex.get(nk);
    return prev;
}
export function inner$planNedarimSync$findIdx$i(keyIndex, k) {
    const i = keyIndex.get(k);
    return i;
}
export function inner$planNedarimSync$keySetFor$s(seenKeys, idx) {
    let s = seenKeys.get(idx);
    return s;
}
export function inner$planNedarimSync$refund(c) {
    const refund = c.amount < 0;
    return refund;
}
export function inner$planNedarimSync$same(out, sp) {
    const same = out.findIndex((s) => s.id === sp.id);
    return same;
}

export const SIGS = {
  inner$planNedarimSync$out: [{"name":"existing","d":{"t":"any"},"opt":false}],
  inner$planNedarimSync$registerName$prev: [{"name":"nameIndex","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"nk","d":{"t":"any"},"opt":false}],
  inner$planNedarimSync$findIdx$i: [{"name":"keyIndex","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$planNedarimSync$keySetFor$s: [{"name":"seenKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"idx","d":{"t":"any"},"opt":false}],
  inner$planNedarimSync$refund: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$planNedarimSync$same: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
};
