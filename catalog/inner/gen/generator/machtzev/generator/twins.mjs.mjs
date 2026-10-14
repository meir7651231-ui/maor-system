// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/twins.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const balanced = (s, start, open = '(', close = ')') => {
    let d = 1, q = null;
    for (let j = start; j < s.length; j++) {
        const ch = s[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if (ch === open || '([{'.includes(ch))
            d++;
        else if (ch === close || ')]}'.includes(ch)) {
            d--;
            if (d === 0)
                return j;
        }
    }
    return -1;
};
const splitTop = (s) => {
    const out = [];
    let d = 0, q = null, cur = '';
    for (let j = 0; j < s.length; j++) {
        const ch = s[j];
        if (q) {
            cur += ch;
            if (ch === '\\') {
                cur += s[j + 1] ?? '';
                j++;
            }
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            cur += ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        if (')]}'.includes(ch))
            d--;
        if (ch === ',' && d === 0) {
            out.push(cur.trim());
            cur = '';
            continue;
        }
        cur += ch;
    }
    if (cur.trim())
        out.push(cur.trim());
    return out;
};
export function inner$jsonable$s(v) {
    const s = JSON.stringify(v);
    return s;
}
export function inner$buildCtx$st(m) {
    const st = m.index + m[0].length;
    return st;
}
export function inner$replayCapture$stray(base, testSrc) {
    const stray = [...testSrc.matchAll(/^import\s+(?!type)([^;]*?)from\s+['"]([^'"]+)['"]/gm)]
        .filter(m => m[2] !== `./${base}.mjs` && !/^node:/.test(m[2]));
    return stray;
}
export function inner$replayCapture$keepNode(testSrc) {
    const keepNode = [...testSrc.matchAll(/^import\s+.*from\s+['"]node:[^'"]+['"];?$/gm)].map(m => m[0]);
    return keepNode;
}
export function inner$replayCapture$body(testSrc) {
    const body = testSrc.replace(/^import\s+.*$/gm, '').replace(/process\.exit\s*\([^)]*\)/g, 'void 0');
    return body;
}
export function inner$buildTwinRegistry$wm(f, tt) {
    const wm = tt.match(new RegExp(`__pure_${f.name}\\(\\.\\.\\.a,\\s*\\.\\.\\.Array\\(Math\\.max\\([^)]*\\)\\)\\.fill\\(undefined\\),\\s*([^)]+)\\)`));
    return wm;
}
export function inner$buildTwinRegistry$cm(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    return cm;
}
export function inner$buildTwinRegistry$st2(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    return st2;
}
export function inner$buildTwinRegistry$st2$$step(cm) {
    const st2 = cm.index + cm[0].length;
    return st2;
}
export function inner$buildTwinRegistry$clean(tt) {
    const clean = tt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    return clean;
}
export function inner$buildTwinRegistry$callRe(f) {
    const callRe = new RegExp(`(?<![\\w.$])${f.name}\\(`, 'g');
    return callRe;
}
export function inner$buildTwinRegistry$end(tt, cm2) {
    const clean = tt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    const end = balanced(clean, cm2.index + cm2[0].length);
    return end;
}
export function inner$buildTwinRegistry$end$$step(clean, cm2) {
    const end = balanced(clean, cm2.index + cm2[0].length);
    return end;
}
export function inner$buildTwinRegistry$args(tt, cm2) {
    const clean = tt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    const end = balanced(clean, cm2.index + cm2[0].length);
    const args = splitTop(clean.slice(cm2.index + cm2[0].length, end));
    return args;
}
export function inner$buildTwinRegistry$args$$step(clean, cm2, end) {
    const args = splitTop(clean.slice(cm2.index + cm2[0].length, end));
    return args;
}
export function inner$buildCtx$d$$after_loop(tt, m) {
    const st = m.index + m[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$buildCtx$j$$after_loop(tt, m) {
    const st = m.index + m[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return j;
}
export function inner$buildCtx$q$$after_loop(tt, m) {
    const st = m.index + m[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$buildTwinRegistry$d2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d2++;
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return d2;
}
export function inner$buildTwinRegistry$j2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d2++;
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return j2;
}
export function inner$buildTwinRegistry$q2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d2++;
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return q2;
}
export function inner$buildTwinRegistry$out$$after_loop(twinMeta) {
    const out = {};
    for (const [n, meta] of twinMeta)
        out[n] = meta;
    return out;
}

export const SIGS = {
  inner$jsonable$s: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$buildCtx$st: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$replayCapture$stray: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"testSrc","d":{"t":"any"},"opt":false}],
  inner$replayCapture$keepNode: [{"name":"testSrc","d":{"t":"any"},"opt":false}],
  inner$replayCapture$body: [{"name":"testSrc","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$wm: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$cm: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$st2: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$st2$$step: [{"name":"cm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$buildTwinRegistry$clean: [{"name":"tt","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$callRe: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$end: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"cm2","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$end$$step: [{"name":"clean","d":{"t":"str"},"opt":false},{"name":"cm2","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$args: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"cm2","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$args$$step: [{"name":"clean","d":{"t":"str"},"opt":false},{"name":"cm2","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"any"},"opt":false}],
  inner$buildCtx$d$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$buildCtx$j$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$buildCtx$q$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$buildTwinRegistry$d2$$after_loop: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$j2$$after_loop: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$q2$$after_loop: [{"name":"tt","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$buildTwinRegistry$out$$after_loop: [{"name":"twinMeta","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
};
