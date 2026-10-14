// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/creditCore.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function dartStringHashCode(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h + s.charCodeAt(i)) >>> 0; // hash += codeUnit
        h = (h + ((h << 10) >>> 0)) >>> 0; // hash += hash << 10
        h = (h ^ (h >>> 6)) >>> 0; // hash ^= hash >> 6
    }
    h = (h + ((h << 3) >>> 0)) >>> 0; // hash += hash << 3
    h = (h ^ (h >>> 11)) >>> 0; // hash ^= hash >> 11
    h = (h + ((h << 15) >>> 0)) >>> 0; // hash += hash << 15
    h = h & 0x3fffffff; // mask to kHashBits = 30
    return h === 0 ? 1 : h; // FinalizeHash zero-guard
}
export function inner$contractorCredit$span() {
    const lo = 30000;
    const hi = 120000;
    const span = hi - lo;
    return span;
}
export function inner$contractorCredit$h(name) {
    const h = dartStringHashCode(name);
    return h;
}
export function inner$contractorCredit$raw(name) {
    const lo = 30000;
    const hi = 120000;
    const span = hi - lo;
    const h = dartStringHashCode(name);
    const raw = lo + (h % (span + 1));
    return raw;
}
export function inner$contractorCredit$raw$$step(span, h) {
    const lo = 30000;
    const raw = lo + (h % (span + 1));
    return raw;
}
export function inner$orderSum$t$$after_loop(lines) {
    let t = 0;
    for (const l of lines) {
        const p = l?.price;
        if (typeof p === "number" && Number.isFinite(p))
            t += Math.round(p);
    }
    return t;
}

export const SIGS = {
  inner$contractorCredit$span: [],
  inner$contractorCredit$h: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$contractorCredit$raw: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$contractorCredit$raw$$step: [{"name":"span","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$orderSum$t$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
};
