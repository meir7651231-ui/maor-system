// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/mahulal/nl-smoke.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const NS_PREFIX = 'corp';
export function inner$wipe$re() {
    const NS = 'meter';
    const re = new RegExp(`^gen_goal_${NS}\\d+(_proof)?\\.dart$`);
    return re;
}
export function inner$climb$ns(i) {
    const NS = 'meter';
    const ns = NS + String(i + 1).padStart(3, '0');
    return ns;
}
export function inner$climb$errLines(r) {
    const errLines = String(r.stderr || '').split('\n').map((l) => l.trim()).filter(Boolean);
    return errLines;
}
export function inner$climb$s2(L) {
    const s2 = (L.steps || []).find((s) => s.step === 2);
    return s2;
}
export function inner$climb$step6(L) {
    const step6 = (L.steps || []).find((s) => s.step === 6);
    return step6;
}
export function inner$climb$bh(src) {
    const bh = (src.match(/^\s*\S[^\n]*\s(bh[A-Z]\w*)\s*\(/gm) || []).length;
    return bh;
}
export function inner$climb$mirrorChecked(fa) {
    const mirrorChecked = !!(fa && fa.status === 'עבר');
    return mirrorChecked;
}
export function inner$climb$m(pr) {
    const m = String(pr.out || '').match(/✓\s*(\d+)\s*דוגמאות\s*·\s*(\d+)\s*התנהגויות/);
    return m;
}
export function inner$climb$ex(pr) {
    const m = String(pr.out || '').match(/✓\s*(\d+)\s*דוגמאות\s*·\s*(\d+)\s*התנהגויות/);
    const ex = m ? +m[1] : 0;
    return ex;
}
export function inner$climb$ex$$step(m) {
    const ex = m ? +m[1] : 0;
    return ex;
}
export function inner$climb$beh(pr) {
    const m = String(pr.out || '').match(/✓\s*(\d+)\s*דוגמאות\s*·\s*(\d+)\s*התנהגויות/);
    const beh = m ? +m[2] : 0;
    return beh;
}
export function inner$climb$beh$$step(m) {
    const beh = m ? +m[2] : 0;
    return beh;
}
export function inner$wipe$re_L338() {
    const re = new RegExp(`^gen_app_${NS_PREFIX}\\d+_.*\\.dart$`);
    return re;
}

export const SIGS = {
  inner$wipe$re: [],
  inner$climb$ns: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$climb$errLines: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$climb$s2: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$climb$step6: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$climb$bh: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$climb$mirrorChecked: [{"name":"fa","d":{"t":"any"},"opt":false}],
  inner$climb$m: [{"name":"pr","d":{"t":"any"},"opt":false}],
  inner$climb$ex: [{"name":"pr","d":{"t":"any"},"opt":false}],
  inner$climb$ex$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$climb$beh: [{"name":"pr","d":{"t":"any"},"opt":false}],
  inner$climb$beh$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$wipe$re_L338: [],
};
