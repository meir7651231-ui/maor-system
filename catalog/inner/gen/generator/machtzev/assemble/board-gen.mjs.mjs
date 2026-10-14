// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/board-gen.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$exprScanIds$isCall(scan, m, id) {
    const isCall = scan.slice(m.index + id.length).match(/^\s*\(/);
    return isCall;
}
export function inner$callSiteArgs$m(widget, scan) {
    const m = scan.match(new RegExp('(?<!class )\\b' + widget + '\\s*\\('));
    return m;
}
export function inner$callSiteArgs$j(widget, scan) {
    const m = scan.match(new RegExp('(?<!class )\\b' + widget + '\\s*\\('));
    let j = scan.indexOf('(', m.index);
    return j;
}
export function inner$callSiteArgs$j$$step(scan, m) {
    let j = scan.indexOf('(', m.index);
    return j;
}
export function inner$callSiteArgs$s0(open) {
    let s0 = open + 1;
    return s0;
}
export function inner$callSiteArgs$pushArg$raw(src, a, b) {
    const raw = src.slice(a, b).trim();
    return raw;
}
export function inner$callSiteArgs$pushArg$nm(src, a, b) {
    const raw = src.slice(a, b).trim();
    const nm = raw.match(/^([a-zA-Z_]\w*)\s*:\s*([\s\S]+)$/);
    return nm;
}
export function inner$callSiteArgs$pushArg$nm$$step(raw) {
    const nm = raw.match(/^([a-zA-Z_]\w*)\s*:\s*([\s\S]+)$/);
    return nm;
}
export function inner$callSiteArgs$k(open) {
    let k = open + 1;
    return k;
}
export function inner$origCtorInfo$d(src, widget) {
    const d = src.match(new RegExp('class\\s+' + widget + '\\b'));
    return d;
}
export function inner$origCtorInfo$cm(widget, body) {
    const cm = body.match(new RegExp('(?:const\\s+)?' + widget + '\\s*\\(([^)]*)\\)'));
    return cm;
}
export function inner$origCtorInfo$t(pp) {
    const t = pp.trim();
    return t;
}
export function inner$origCtorInfo$mm(pp) {
    const t = pp.trim();
    const mm = t.match(/this\.(\w+)/);
    return mm;
}
export function inner$origCtorInfo$mm$$step(t) {
    const mm = t.match(/this\.(\w+)/);
    return mm;
}
export function inner$innerWiring$d(src, widget) {
    const d = src.match(new RegExp('class\\s+' + widget + '\\b'));
    return d;
}
export function inner$innerWiring$vs(m) {
    const vs = m.index + m[0].length;
    return vs;
}
export function inner$innerWiring$n(seen, base) {
    const n = (seen.get(base) || 0) + 1;
    return n;
}
export function inner$resolve$pi(info, propName) {
    const pi = info.pos.indexOf(propName);
    return pi;
}
export function inner$resolve$pv(inner, propName) {
    const pv = inner.watches.get(propName);
    return pv;
}
export function inner$resolve$bare(pt) {
    const bare = pt.replace(/\?$/, '');
    return bare;
}
export function inner$resolve$e(args, info, pn) {
    const e = args?.named[pn] ?? (info.pos.indexOf(pn) >= 0 ? args?.positional[info.pos.indexOf(pn)] : null);
    return e;
}
export function inner$map$parts(srcDir, x) {
    const parts = (srcDir ? srcDir + '/' : '') + x[1];
    return parts;
}
export function inner$filter$mm(im) {
    const mm = im.match(/package:buildsmart\/([^']+)'/);
    return mm;
}
export function inner$exprScanIds$declared$$after_loop(scan) {
    const declared = new Set();
    for (const m of scan.matchAll(/\(\s*([\w ,]+)\)\s*=>|\bfor\s*\(\s*(?:final|var)\s+(\w+)|\b(?:final|var)\s+(\w+)\s*=/g))
        for (const v of (m[1] || m[2] || m[3] || '').split(','))
            declared.add(v.trim());
    return declared;
}
export function inner$callSiteArgs$d$$after_loop(widget, scan) {
    const m = scan.match(new RegExp('(?<!class )\\b' + widget + '\\s*\\('));
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
export function inner$callSiteArgs$j$$after_loop(widget, scan) {
    const m = scan.match(new RegExp('(?<!class )\\b' + widget + '\\s*\\('));
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
export function inner$innerWiring$handlers$$after_loop(src, body, scan, IOISH) {
    const handlers = new Map();
    const seen = new Map();
    for (const m of [...scan.matchAll(/\b(on[A-Z]\w*)\s*:\s*/g)]) {
        const vs = m.index + m[0].length;
        if (!/^\(\)?\s*\w*\)?\s*(=>|\{|async)|^\(\s*\w+\s*\)\s*(=>|\{|async)/.test(scan.slice(vs, vs + 24)) && !/^\(\)/.test(scan.slice(vs, vs + 4)))
            continue;
        let dd = 0, j = vs;
        for (; j < scan.length; j++) {
            const c = scan[j];
            if (c === '(' || c === '[' || c === '{')
                dd++;
            else if (c === ')' || c === ']' || c === '}') {
                if (!dd)
                    break;
                dd--;
            }
            else if (c === ',' && !dd)
                break;
        }
        if (!IOISH.test(scan.slice(vs, j)))
            continue;
        const base = m[1];
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        handlers.set(n === 1 ? base : base + n, src.slice(0, 0) + body.slice(vs, j).trim());
    }
    return handlers;
}
export function inner$innerWiring$seen$$after_loop(src, body, scan, IOISH) {
    const handlers = new Map();
    const seen = new Map();
    for (const m of [...scan.matchAll(/\b(on[A-Z]\w*)\s*:\s*/g)]) {
        const vs = m.index + m[0].length;
        if (!/^\(\)?\s*\w*\)?\s*(=>|\{|async)|^\(\s*\w+\s*\)\s*(=>|\{|async)/.test(scan.slice(vs, vs + 24)) && !/^\(\)/.test(scan.slice(vs, vs + 4)))
            continue;
        let dd = 0, j = vs;
        for (; j < scan.length; j++) {
            const c = scan[j];
            if (c === '(' || c === '[' || c === '{')
                dd++;
            else if (c === ')' || c === ']' || c === '}') {
                if (!dd)
                    break;
                dd--;
            }
            else if (c === ',' && !dd)
                break;
        }
        if (!IOISH.test(scan.slice(vs, j)))
            continue;
        const base = m[1];
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        handlers.set(n === 1 ? base : base + n, src.slice(0, 0) + body.slice(vs, j).trim());
    }
    return seen;
}
export function inner$innerWiring$dd$$after_loop(scan, m) {
    const vs = m.index + m[0].length;
    let dd = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            dd++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!dd)
                break;
            dd--;
        }
        else if (c === ',' && !dd)
            break;
    }
    return dd;
}
export function inner$innerWiring$j$$after_loop(scan, m) {
    const vs = m.index + m[0].length;
    let dd = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            dd++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!dd)
                break;
            dd--;
        }
        else if (c === ',' && !dd)
            break;
    }
    return j;
}
export function inner$innerWiring$watches$$after_loop(body) {
    const watches = new Map();
    for (const m of body.matchAll(/ref\.watch\(\s*([a-zA-Z0-9_]+Provider)\s*(?:\([^()]*\))?\s*\)/g))
        watches.set(m[1].replace(/Provider$/, '').replace(/^_/, ''), m[1]);
    return watches;
}
export function inner$map$seg$$after_loop(srcDir, x) {
    const parts = (srcDir ? srcDir + '/' : '') + x[1];
    const seg = [];
    for (const p of parts.split('/')) {
        if (p === '..')
            seg.pop();
        else if (p !== '.')
            seg.push(p);
    }
    return seg;
}

export const SIGS = {
  inner$exprScanIds$isCall: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$m: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$j: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$j$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$s0: [{"name":"open","d":{"t":"num"},"opt":false}],
  inner$callSiteArgs$pushArg$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$pushArg$nm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$pushArg$nm$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$k: [{"name":"open","d":{"t":"num"},"opt":false}],
  inner$origCtorInfo$d: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"widget","d":{"t":"any"},"opt":false}],
  inner$origCtorInfo$cm: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$origCtorInfo$t: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$origCtorInfo$mm: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$origCtorInfo$mm$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$innerWiring$d: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"widget","d":{"t":"any"},"opt":false}],
  inner$innerWiring$vs: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$innerWiring$n: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$resolve$pi: [{"name":"info","d":{"t":"obj","p":[["pos",{"t":"arr","of":{"t":"any"}},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false]]},"opt":false},{"name":"propName","d":{"t":"any"},"opt":false}],
  inner$resolve$pv: [{"name":"inner","d":{"t":"obj","p":[["handlers",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["watches",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false]]},"opt":false},{"name":"propName","d":{"t":"any"},"opt":false}],
  inner$resolve$bare: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$resolve$e: [{"name":"args","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["named",{"t":"obj","n":"named","p":[]},false],["positional",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"info","d":{"t":"obj","p":[["pos",{"t":"arr","of":{"t":"any"}},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false]]},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$map$parts: [{"name":"srcDir","d":{"t":"str"},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$filter$mm: [{"name":"im","d":{"t":"any"},"opt":false}],
  inner$exprScanIds$declared$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$d$$after_loop: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$callSiteArgs$j$$after_loop: [{"name":"widget","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$innerWiring$handlers$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"IOISH","d":{"t":"any"},"opt":false}],
  inner$innerWiring$seen$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"IOISH","d":{"t":"any"},"opt":false}],
  inner$innerWiring$dd$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$innerWiring$j$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$innerWiring$watches$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$map$seg$$after_loop: [{"name":"srcDir","d":{"t":"str"},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
};
