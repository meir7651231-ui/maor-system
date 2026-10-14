// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/offset.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hhmmToMinutes(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    if (!m)
        return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (mi > 59 || h > 24 || (h === 24 && mi !== 0))
        return null;
    return h * 60 + mi;
}
const anchorMin = (a) => typeof a === 'number' ? (Number.isFinite(a) ? a : null) : typeof a === 'string' ? hhmmToMinutes(a) : null;
export function inner$offsetAll$d(minutes) {
    const d = typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 0;
    return d;
}
export function inner$hhmmToMinutes$m(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    return m;
}
export function inner$hhmmToMinutes$h(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    const h = Number(m[1]);
    return h;
}
export function inner$hhmmToMinutes$h$$step(m) {
    const h = Number(m[1]);
    return h;
}
export function inner$hhmmToMinutes$mi(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    const mi = Number(m[2]);
    return mi;
}
export function inner$hhmmToMinutes$mi$$step(m) {
    const mi = Number(m[2]);
    return mi;
}
export function inner$resolveRelative$s(token) {
    const s = String(token ?? '').trim();
    return s;
}
export function inner$resolveRelative$fixed(token) {
    const s = String(token ?? '').trim();
    const fixed = hhmmToMinutes(s);
    return fixed;
}
export function inner$resolveRelative$fixed$$step(s) {
    const fixed = hhmmToMinutes(s);
    return fixed;
}
export function inner$resolveRelative$m(token) {
    const s = String(token ?? '').trim();
    const m = /^([a-zא-ת_]+)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    return m;
}
export function inner$resolveRelative$m$$step(s) {
    const m = /^([a-zא-ת_]+)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    return m;
}
export function inner$resolveRelative$base(anchors, key) {
    const base = anchorMin(anchors[key]);
    return base;
}
export function inner$offsetAll$out$$after_loop(times, minutes) {
    const d = typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 0;
    const out = [];
    for (const t of times)
        if (typeof t === 'number' && Number.isFinite(t))
            out.push(t + d);
    return out;
}

export const SIGS = {
  inner$offsetAll$d: [{"name":"minutes","d":{"t":"num"},"opt":false}],
  inner$hhmmToMinutes$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hhmmToMinutes$h: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hhmmToMinutes$h$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$hhmmToMinutes$mi: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hhmmToMinutes$mi$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$resolveRelative$s: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveRelative$fixed: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveRelative$fixed$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$resolveRelative$m: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveRelative$m$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$resolveRelative$base: [{"name":"anchors","d":{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$offsetAll$out$$after_loop: [{"name":"times","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"minutes","d":{"t":"num"},"opt":false}],
};
