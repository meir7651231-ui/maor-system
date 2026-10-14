// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/luach.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$shulRows$s(by, m) {
    let s = by.get(m.postId);
    return s;
}
export function inner$shulRows$p(m, s) {
    let p = s.prayers.find((x) => x.prayer === m.prayer);
    return p;
}
export function inner$shulRows$at$i(order, id) {
    const i = order.indexOf(id);
    return i;
}
export function inner$minsUntil$m(a, b) {
    const m = a === null || b === null ? 0 : Math.max(0, a - b);
    return m;
}
export function inner$luachZmanim$out(rows) {
    const out = rows.slice();
    return out;
}
export function inner$luachZmanim$at(out) {
    const at = out.findIndex((r) => r.key === 'alot');
    return at;
}
export function inner$shulRows$out$$after_loop(minyanim, next, hhmm) {
    const out = [];
    const by = new Map();
    for (const m of minyanim) {
        let s = by.get(m.postId);
        if (!s) {
            s = { id: m.postId, shul: m.shul, place: m.place, prayers: [] };
            by.set(m.postId, s);
            out.push(s);
        }
        let p = s.prayers.find((x) => x.prayer === m.prayer);
        if (!p) {
            p = { prayer: m.prayer, times: [] };
            s.prayers.push(p);
        }
        p.times.push({ time: m.time, past: m.time < hhmm, next: next === m });
    }
    return out;
}
export function inner$shulRows$by$$after_loop(minyanim, next, hhmm) {
    const out = [];
    const by = new Map();
    for (const m of minyanim) {
        let s = by.get(m.postId);
        if (!s) {
            s = { id: m.postId, shul: m.shul, place: m.place, prayers: [] };
            by.set(m.postId, s);
            out.push(s);
        }
        let p = s.prayers.find((x) => x.prayer === m.prayer);
        if (!p) {
            p = { prayer: m.prayer, times: [] };
            s.prayers.push(p);
        }
        p.times.push({ time: m.time, past: m.time < hhmm, next: next === m });
    }
    return by;
}

export const SIGS = {
  inner$shulRows$s: [{"name":"by","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"PnShulRow","p":[["id",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"obj","p":[["time",{"t":"str"},false],["past",{"t":"bool"},false],["next",{"t":"bool"},false]]}},false]]}},false]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]},"opt":false}],
  inner$shulRows$p: [{"name":"m","d":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]},"opt":false},{"name":"s","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PnShulRow","p":[["id",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"obj","p":[["time",{"t":"str"},false],["past",{"t":"bool"},false],["next",{"t":"bool"},false]]}},false]]}},false]]}]},"opt":false}],
  inner$shulRows$at$i: [{"name":"order","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$minsUntil$m: [{"name":"a","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"b","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$luachZmanim$out: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}},"opt":false}],
  inner$luachZmanim$at: [{"name":"out","d":{"t":"arr","of":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}},"opt":false}],
  inner$shulRows$out$$after_loop: [{"name":"minyanim","d":{"t":"arr","of":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}},"opt":false},{"name":"next","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}]},"opt":false},{"name":"hhmm","d":{"t":"str"},"opt":false}],
  inner$shulRows$by$$after_loop: [{"name":"minyanim","d":{"t":"arr","of":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}},"opt":false},{"name":"next","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}]},"opt":false},{"name":"hhmm","d":{"t":"str"},"opt":false}],
};
