// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/tighten-types.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const generalize = (sh) => {
    const nul = sh.endsWith('?');
    const core = nul ? sh.slice(0, -1) : sh;
    let g;
    if (core === 'int' || core === 'double')
        g = 'num';
    else if (core === 'String' || core === 'bool' || core === 'num' || core === 'DateTime')
        g = core;
    else if (core.startsWith('Map<String, '))
        g = 'Map<String, dynamic>';
    else if (core.startsWith('List<')) {
        const inner = core.slice(5, -1).replace(/\?$/, '');
        g = /^(String|bool)$/.test(inner) ? `List<${inner}>` : /^(int|double|num)$/.test(inner) ? 'List<num>' : inner.startsWith('Map<String') ? 'List<Map<String, dynamic>>' : inner.startsWith('List<') ? 'List<List<dynamic>>' : 'List<dynamic>';
    }
    else if (core.startsWith('Set<'))
        g = 'Set<dynamic>';
    else
        return null;
    return nul ? g + '?' : g;
};
const dartType = (sh) => { if (!sh || sh === '?' || sh === 'null' || sh === 'dynamic' || /Function/.test(sh) || /<\?>|<\?\?>/.test(sh))
    return null; if (sh === 'Map<dynamic, dynamic>')
    return null; return generalize(sh.replace(/Map<String, null>/g, 'Map<String, dynamic>')); };
export function inner$casesProbe$m(src) {
    const m = src.match(/^const CASES = (\[[\s\S]*?\]);$/m);
    return m;
}
export function inner$dartSig$m(src) {
    const m = src.match(/^([A-Za-z_][\w<>?,. ]*?)\s+([a-z]\w*)\((?![^)]*\)\s*=>\s*throw)/m);
    return m;
}
export function inner$dartSig$cands(src) {
    const cands = [...src.matchAll(/^([A-Za-z_][\w<>?,. ]*?)\s+([a-z]\w*)\(/gm)].filter((x) => !/^(if|for|while|switch|return|else|final|const|var)$/.test(x[1].trim()) && !x[2].startsWith('_'));
    return cands;
}
export function inner$dartSig$i(c) {
    let i = c.index + c[0].length;
    return i;
}
export function inner$record$fname(s) {
    const fname = s ? s.name : null;
    return fname;
}
export function inner$record$mine(calls, s) {
    const fname = s ? s.name : null;
    const mine = calls.filter((c) => c.name === fname);
    return mine;
}
export function inner$record$mine$$step(calls, fname) {
    const mine = calls.filter((c) => c.name === fname);
    return mine;
}
export function inner$record$argc(calls, s) {
    const fname = s ? s.name : null;
    const mine = calls.filter((c) => c.name === fname);
    const argc = Math.max(...mine.map((c) => c.args.length));
    return argc;
}
export function inner$record$argc$$step(mine) {
    const argc = Math.max(...mine.map((c) => c.args.length));
    return argc;
}
export function inner$generalize$nul(sh) {
    const nul = sh.endsWith('?');
    return nul;
}
export function inner$generalize$core(sh) {
    const nul = sh.endsWith('?');
    const core = nul ? sh.slice(0, -1) : sh;
    return core;
}
export function inner$generalize$core$$step(sh, nul) {
    const core = nul ? sh.slice(0, -1) : sh;
    return core;
}
export function inner$generalize$inner(sh) {
    const nul = sh.endsWith('?');
    const core = nul ? sh.slice(0, -1) : sh;
    const inner = core.slice(5, -1).replace(/\?$/, '');
    return inner;
}
export function inner$generalize$inner$$step(core) {
    const inner = core.slice(5, -1).replace(/\?$/, '');
    return inner;
}
export function inner$plan$ps(parts) {
    const ps = parts.filter((p) => p.t.trim());
    return ps;
}
export function inner$plan$m(p) {
    const m = p.t.match(/^(\s*)dynamic\s+(\w+)(\s*=.*)?$/);
    return m;
}
export function inner$plan$ty(e, idx) {
    let ty = dartType(e.params[idx]);
    return ty;
}
export function inner$plan$ty_L103(e) {
    const ty = dartType(e.ret);
    return ty;
}
export function inner$analyzeErrors$out(r) {
    const out = (r.stdout || '') + (r.stderr || '');
    return out;
}
export function inner$boxProofStage$identAt$at(col, txt) {
    const at = (txt.slice(Math.max(0, col - 1)).match(/^[\w.]+/) || [''])[0].split('.').filter(Boolean);
    return at;
}
export function inner$boxProofStage$attribute$byCol(fnOf, pool, at) {
    const byCol = pool.filter((k) => at.includes(fnOf.get(k)));
    return byCol;
}
export function inner$boxProofStage$attribute$filter$fn(fnOf, k) {
    const fn = fnOf.get(k);
    return fn;
}
export function inner$boxProofStage$why(out) {
    const why = (out.match(/Error: ([^\n]+)|Unhandled exception:\n([^\n]+)/) || []).slice(1).filter(Boolean)[0] || out.trim().split('\n').pop() || '';
    return why;
}
export function inner$apply$fnOf(P, led) {
    const fnOf = new Map([...Object.entries(led).map(([k, l]) => [k, l.fn]), ...P.map((p) => [p.k, p.fn])]);
    return fnOf;
}
export function inner$apply$fn(P, led, k) {
    const fnOf = new Map([...Object.entries(led).map(([k, l]) => [k, l.fn]), ...P.map((p) => [p.k, p.fn])]);
    const fn = fnOf.get(k);
    return fn;
}
export function inner$apply$fn$$step(fnOf, k) {
    const fn = fnOf.get(k);
    return fn;
}
export function inner$apply$fn_L212(P, led, k) {
    const fnOf = new Map([...Object.entries(led).map(([k, l]) => [k, l.fn]), ...P.map((p) => [p.k, p.fn])]);
    const fn = fnOf.get(k);
    return fn;
}
export function inner$apply$fn_L212$$step(fnOf, k) {
    const fn = fnOf.get(k);
    return fn;
}
export function inner$apply$p(P, k) {
    const p = P.find((x) => x.k === k);
    return p;
}
export function inner$apply$s0(applied, k) {
    const s0 = applied.get(k);
    return s0;
}
export function inner$dartSig$i$$after_loop(src, c) {
    let i = c.index + c[0].length;
    let depth = 1;
    let raw = '';
    for (; i < src.length && depth > 0; i++) {
        const ch = src[i];
        if (ch === '(')
            depth++;
        else if (ch === ')') {
            depth--;
            if (!depth)
                break;
        }
        raw += ch;
    }
    return i;
}
export function inner$dartSig$depth$$after_loop(src, c) {
    let i = c.index + c[0].length;
    let depth = 1;
    let raw = '';
    for (; i < src.length && depth > 0; i++) {
        const ch = src[i];
        if (ch === '(')
            depth++;
        else if (ch === ')') {
            depth--;
            if (!depth)
                break;
        }
        raw += ch;
    }
    return depth;
}
export function inner$dartSig$raw$$after_loop(src, c) {
    let i = c.index + c[0].length;
    let depth = 1;
    let raw = '';
    for (; i < src.length && depth > 0; i++) {
        const ch = src[i];
        if (ch === '(')
            depth++;
        else if (ch === ')') {
            depth--;
            if (!depth)
                break;
        }
        raw += ch;
    }
    return raw;
}

export const SIGS = {
  inner$casesProbe$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$dartSig$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$dartSig$cands: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$dartSig$i: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$record$fname: [{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["src",{"t":"any"},false],["ret",{"t":"any"},false],["name",{"t":"any"},false],["raw",{"t":"str"},false],["start",{"t":"any"},false],["rawStart",{"t":"any"},false],["rawEnd",{"t":"any"},false]]}]},"opt":false}],
  inner$record$mine: [{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["src",{"t":"any"},false],["ret",{"t":"any"},false],["name",{"t":"any"},false],["raw",{"t":"str"},false],["start",{"t":"any"},false],["rawStart",{"t":"any"},false],["rawEnd",{"t":"any"},false]]}]},"opt":false}],
  inner$record$mine$$step: [{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fname","d":{"t":"any"},"opt":false}],
  inner$record$argc: [{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["src",{"t":"any"},false],["ret",{"t":"any"},false],["name",{"t":"any"},false],["raw",{"t":"str"},false],["start",{"t":"any"},false],["rawStart",{"t":"any"},false],["rawEnd",{"t":"any"},false]]}]},"opt":false}],
  inner$record$argc$$step: [{"name":"mine","d":{"t":"any"},"opt":false}],
  inner$generalize$nul: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$generalize$core: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$generalize$core$$step: [{"name":"sh","d":{"t":"any"},"opt":false},{"name":"nul","d":{"t":"any"},"opt":false}],
  inner$generalize$inner: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$generalize$inner$$step: [{"name":"core","d":{"t":"any"},"opt":false}],
  inner$plan$ps: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$plan$m: [{"name":"p","d":{"t":"obj","p":[["t",{"t":"str"},false],["mode",{"t":"str"},false]]},"opt":false}],
  inner$plan$ty: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$plan$ty_L103: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$analyzeErrors$out: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$boxProofStage$identAt$at: [{"name":"col","d":{"t":"num"},"opt":false},{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$boxProofStage$attribute$byCol: [{"name":"fnOf","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$boxProofStage$attribute$filter$fn: [{"name":"fnOf","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$boxProofStage$why: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$apply$fnOf: [{"name":"P","d":{"t":"arr","of":{"t":"obj","p":[["k",{"t":"any"},false],["file",{"t":"any"},false],["fn",{"t":"any"},false],["changes",{"t":"arr","of":{"t":"str"}},false],["ret0",{"t":"any"},false],["raw0",{"t":"str"},false],["apply",{"t":"obj","p":[]},false]]}},"opt":false},{"name":"led","d":{"t":"any"},"opt":false}],
  inner$apply$fn: [{"name":"P","d":{"t":"arr","of":{"t":"obj","p":[["k",{"t":"any"},false],["file",{"t":"any"},false],["fn",{"t":"any"},false],["changes",{"t":"arr","of":{"t":"str"}},false],["ret0",{"t":"any"},false],["raw0",{"t":"str"},false],["apply",{"t":"obj","p":[]},false]]}},"opt":false},{"name":"led","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$apply$fn$$step: [{"name":"fnOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$apply$fn_L212: [{"name":"P","d":{"t":"arr","of":{"t":"obj","p":[["k",{"t":"any"},false],["file",{"t":"any"},false],["fn",{"t":"any"},false],["changes",{"t":"arr","of":{"t":"str"}},false],["ret0",{"t":"any"},false],["raw0",{"t":"str"},false],["apply",{"t":"obj","p":[]},false]]}},"opt":false},{"name":"led","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$apply$fn_L212$$step: [{"name":"fnOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$apply$p: [{"name":"P","d":{"t":"arr","of":{"t":"obj","p":[["k",{"t":"any"},false],["file",{"t":"any"},false],["fn",{"t":"any"},false],["changes",{"t":"arr","of":{"t":"str"}},false],["ret0",{"t":"any"},false],["raw0",{"t":"str"},false],["apply",{"t":"obj","p":[]},false]]}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$apply$s0: [{"name":"applied","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$dartSig$i$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$dartSig$depth$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$dartSig$raw$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
};
