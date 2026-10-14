// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/lift-lib.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
export function inner$classBody$i(src, startIdx) {
    const i = src.indexOf('{', startIdx);
    return i;
}
export function inner$bodyIssue$code(body) {
    const code = stripComments(body);
    return code;
}
export function inner$maskLitsKeepInterp$out(src) {
    const out = src.split('');
    return out;
}
export function inner$maskLits$out(src) {
    const out = src.split('');
    return out;
}
export function inner$parseCallArgs$re(widget) {
    const re = new RegExp('(?<!class )\\b' + widget + '\\s*\\(', 'g');
    return re;
}
export function inner$parseCallArgs$m(scan, re) {
    const m = re.exec(scan);
    return m;
}
export function inner$parseCallArgs$j(scan, re) {
    const m = re.exec(scan);
    let j = scan.indexOf('(', m.index);
    return j;
}
export function inner$parseCallArgs$j$$step(scan, m) {
    let j = scan.indexOf('(', m.index);
    return j;
}
export function inner$parseCallArgs$s0(open) {
    let s0 = open + 1;
    return s0;
}
export function inner$parseCallArgs$push$raw(src, a, b) {
    const raw = src.slice(a, b).trim();
    return raw;
}
export function inner$parseCallArgs$push$nm(src, a, b) {
    const raw = src.slice(a, b).trim();
    const nm = raw.match(/^([a-zA-Z_]\w*)\s*:\s*([\s\S]+)$/);
    return nm;
}
export function inner$parseCallArgs$push$nm$$step(raw) {
    const nm = raw.match(/^([a-zA-Z_]\w*)\s*:\s*([\s\S]+)$/);
    return nm;
}
export function inner$parseCallArgs$k(open) {
    let k = open + 1;
    return k;
}
export function inner$loopContext$m(widget, scan) {
    let m = new RegExp('([\\w.\\]\\[!?]+(?:\\([^()]*\\))?)\\.map\\(\\s*\\(\\s*(\\w+)\\s*\\)\\s*=>\\s*(?:const\\s+)?' + widget + '\\s*\\(', 'd').exec(scan);
    return m;
}
export function inner$parseCallArgs$d$$after_loop(scan, re) {
    const m = re.exec(scan);
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$parseCallArgs$j$$after_loop(scan, re) {
    const m = re.exec(scan);
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}

export const SIGS = {
  inner$classBody$i: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"startIdx","d":{"t":"any"},"opt":false}],
  inner$bodyIssue$code: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$maskLitsKeepInterp$out: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$maskLits$out: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$re: [{"name":"widget","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$m: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$j: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$j$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseCallArgs$s0: [{"name":"open","d":{"t":"num"},"opt":false}],
  inner$parseCallArgs$push$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$push$nm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$push$nm$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$k: [{"name":"open","d":{"t":"num"},"opt":false}],
  inner$loopContext$m: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$d$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$parseCallArgs$j$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
};
