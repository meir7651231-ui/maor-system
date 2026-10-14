// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/ast-js-to-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const STD = {
    includes: 'contains', filter: 'where', push: 'add', some: 'any', every: 'every',
    findIndex: 'indexWhere', find: 'firstWhere', slice: 'sublist', join: 'join',
    split: 'split', trim: 'trim', toLowerCase: 'toLowerCase', toUpperCase: 'toUpperCase',
    startsWith: 'startsWith', endsWith: 'endsWith', repeat: '_repeat', padStart: '_padStart',
    replace: 'replaceFirst', replaceAll: 'replaceAll', concat: '_concat', reverse: '_reverse', /* JS reverse הופך במקום ומחזיר; Dart reversed הוא getter */
    pop: '_pop', shift: '_shift', splice: '_splice', unshift: '_unshift', at: '_at', fill: '_fill', // מחלקות · JS pop/shift על ריק ⇒ undefined (Dart removeLast זורק)
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
const gen = (sh) => { if (!sh || sh === '?' || sh === 'null' || sh === 'dynamic' || /Function/.test(sh) || /<\?/.test(sh))
    return null; const nul = sh.endsWith('?'); const c = nul ? sh.slice(0, -1) : sh; let g; if (c === 'int' || c === 'double')
    g = 'num';
else if (['String', 'bool', 'num', 'DateTime'].includes(c))
    g = c;
else if (c.startsWith('Map<String, '))
    g = 'Map<String, dynamic>';
else if (c.startsWith('List<')) {
    const i = c.slice(5, -1).replace(/\?$/, '');
    g = /^(String|bool)$/.test(i) ? `List<${i}>` : /^(int|double|num)$/.test(i) ? 'List<num>' : i.startsWith('Map<String') ? 'List<Map<String, dynamic>>' : 'List<dynamic>';
}
else
    return null; return nul ? g + '?' : g; };
export function inner$inferFn$names(params) {
    const names = params.map((p) => p.name.text);
    return names;
}
export function inner$typeOfParam$st(CTX, nm) {
    const st = (CTX && CTX.params.get(nm + '#static')) || null;
    return st;
}
export function inner$classOf$t(CTX, GLOBALS, e) {
    const t = (CTX && CTX.locals.get(e.text)) || GLOBALS.get(e.text);
    return t;
}
export function inner$emitTs$walk$key(owner, fname) {
    const key = owner + '.' + fname;
    return key;
}
export function inner$fnHead$hp(CUR_CLASS, HINT, name) {
    const hp = HINT.params[(CUR_CLASS || '') + '.' + name] || {};
    return hp;
}
export function inner$fnHead$t(TYPES, FORCE, CUR_CLASS, HINT, name, inf, nm) {
    const ev = TYPES[name] || {};
    const hp = HINT.params[(CUR_CLASS || '') + '.' + name] || {};
    const o = ev.params && ev.params[nm];
    const t = hp[nm] ? null : (FORCE && o) ? (o === 'dynamic' ? null : o) : (o || inf.params[nm] || null);
    return t;
}
export function inner$fnHead$t$$step(FORCE, inf, hp, nm, o) {
    const t = hp[nm] ? null : (FORCE && o) ? (o === 'dynamic' ? null : o) : (o || inf.params[nm] || null);
    return t;
}
export function inner$fnHead$ret(TYPES, FORCE, name, inf) {
    const ev = TYPES[name] || {};
    const ret = (FORCE && ev.ret) ? ev.ret : (ev.ret || inf.ret || 'dynamic');
    return ret;
}
export function inner$fnHead$ret$$step(FORCE, inf, ev) {
    const ret = (FORCE && ev.ret) ? ev.ret : (ev.ret || inf.ret || 'dynamic');
    return ret;
}
export function inner$fnHead$map$rs() {
    const rs = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => `__r${k}`);
    return rs;
}
export function inner$fnHead$map$v(i) {
    const v = '__p' + i;
    return v;
}
export function inner$fnHead$opt(parts) {
    const opt = parts.filter((x) => x.startsWith('['));
    return opt;
}
export function inner$fnHead$ps(parts) {
    const opt = parts.filter((x) => x.startsWith('['));
    const ps = opt.length < 2 ? parts.join(', ') : [...parts.filter((x) => !x.startsWith('[')), `[${opt.map((x) => x.slice(1, -1)).join(', ')}]`].join(', ');
    return ps;
}
export function inner$fnHead$ps$$step(parts, opt) {
    const ps = opt.length < 2 ? parts.join(', ') : [...parts.filter((x) => !x.startsWith('[')), `[${opt.map((x) => x.slice(1, -1)).join(', ')}]`].join(', ');
    return ps;
}
export function inner$gen$map$v(j) {
    const v = `__d${j}`;
    return v;
}
export function inner$gen$els(K, nm) {
    const els = nm.elements.filter((e) => e.name).map((e, i) => nm.kind === K.ArrayBindingPattern ? `final ${e.name.text} = __e[${i}];` : `final ${e.name.text} = __e['${(e.propertyName || e.name).text}'];`);
    return els;
}
export function inner$gen$cases(n, K) {
    const cases = n.caseBlock.clauses.filter((c) => c.kind !== K.DefaultClause);
    return cases;
}
export function inner$gen$def(n, K) {
    const def = n.caseBlock.clauses.find((c) => c.kind === K.DefaultClause);
    return def;
}
export function inner$bindingPre$forEach$taken(pat) {
    const taken = pat.elements.filter((x) => !x.dotDotDotToken && x.name).map((x) => `'${(x.propertyName || x.name).text}'`);
    return taken;
}
export function inner$param$t(CTX, name) {
    const t = ((CTX && CTX.params.get(name)) || 'dynamic').replace('#map', '');
    return t;
}
export function inner$boolCtx$t(CTX, e) {
    const t = CTX.params.get(e.text);
    return t;
}
export function inner$boolCtx$lt(CTX, e) {
    const lt = CTX.locals.get(e.text);
    return lt;
}
export function inner$nullableParam$t(CTX, e) {
    const t = CTX.params.get(e.text);
    return t;
}
export function inner$isStrParam$t(CTX, e) {
    const t = CTX.params.get(e.text);
    return t;
}
export function inner$isMapParam$t(CTX, e) {
    const t = CTX.params.get(e.text);
    return t;
}
export function inner$expr$s(n) {
    let s = "'" + esc(n.head.text);
    return s;
}
export function inner$expr$arith(K, op) {
    const arith = [K.MinusToken, K.AsteriskToken, K.SlashToken, K.PercentToken, K.LessThanToken, K.GreaterThanToken, K.LessThanEqualsToken, K.GreaterThanEqualsToken].includes(op);
    return arith;
}
export function inner$expr$rt(CTX, n, K) {
    const rt = CTX && n.expression.kind === K.Identifier ? (CTX.params.get(n.expression.text) || CTX.locals.get(n.expression.text) || '') : '';
    return rt;
}
export function inner$expr$listy(CTX, n, K) {
    const rt = CTX && n.expression.kind === K.Identifier ? (CTX.params.get(n.expression.text) || CTX.locals.get(n.expression.text) || '') : '';
    const listy = /^List/.test(rt);
    return listy;
}
export function inner$expr$listy$$step(rt) {
    const listy = /^List/.test(rt);
    return listy;
}
export function inner$expr$intIdx(CTX, n, K, idx) {
    const rt = CTX && n.expression.kind === K.Identifier ? (CTX.params.get(n.expression.text) || CTX.locals.get(n.expression.text) || '') : '';
    const listy = /^List/.test(rt);
    const intIdx = listy && idx.kind !== K.NumericLiteral && idx.kind !== K.StringLiteral && !(idx.kind === K.Identifier && /^[ijk]$/.test(idx.text)) && (idx.kind === K.BinaryExpression || idx.kind === K.CallExpression || idx.kind === K.ParenthesizedExpression || idx.kind === K.Identifier);
    return intIdx;
}
export function inner$expr$intIdx$$step(K, idx, listy) {
    const intIdx = listy && idx.kind !== K.NumericLiteral && idx.kind !== K.StringLiteral && !(idx.kind === K.Identifier && /^[ijk]$/.test(idx.text)) && (idx.kind === K.BinaryExpression || idx.kind === K.CallExpression || idx.kind === K.ParenthesizedExpression || idx.kind === K.Identifier);
    return intIdx;
}
export function inner$expr$dm(m) {
    const dm = m === 'filter' ? 'where' : Object.hasOwn(STD, m) ? STD[m] : m;
    return dm;
}
export function inner$expr$lenP(K, a0) {
    const lenP = a0 && a0.kind === K.ObjectLiteralExpression && a0.properties.find((p) => p.name && p.name.text === 'length');
    return lenP;
}
export function inner$expr$call$ar(K, f) {
    const ar = f && (f.kind === K.ArrowFunction || f.kind === K.FunctionExpression) ? f.parameters.length : 2;
    return ar;
}
export function inner$expr$dm_L392(m) {
    const dm = Object.hasOwn(STD, m) ? STD[m] : m;
    return dm;
}
export function inner$expr$mm(n) {
    const mm = n.text.match(/^\/([^]*)\/([gimsuy]*)$/);
    return mm;
}
export function inner$expr$ps(n) {
    const ps = n.parameters.map(p => p.name.text).join(', ');
    return ps;
}
export function inner$classDecl$name(n) {
    const name = n.name ? n.name.text : '_Anon';
    return name;
}
export function inner$classDecl$ext(n, K) {
    const ext = (n.heritageClauses || []).find((h) => h.token === K.ExtendsKeyword);
    return ext;
}
export function inner$classDecl$stmts(m) {
    let stmts = m.body ? [...m.body.statements] : [];
    return stmts;
}
export function inner$classDecl$pad(ARITY, K, m, nm) {
    const pad = m.kind === K.MethodDeclaration && !m.parameters.some((p) => p.dotDotDotToken) ? (ARITY[nm] || 0) - m.parameters.length : 0;
    return pad;
}
export function inner$classDecl$extra(ARITY, K, m, nm) {
    const pad = m.kind === K.MethodDeclaration && !m.parameters.some((p) => p.dotDotDotToken) ? (ARITY[nm] || 0) - m.parameters.length : 0;
    const extra = Array.from({ length: pad }, (_, k) => `dynamic __x${k}`);
    return extra;
}
export function inner$classDecl$extra$$step(pad) {
    const extra = Array.from({ length: pad }, (_, k) => `dynamic __x${k}`);
    return extra;
}
export function inner$typesFromEvidence$gen$nul(sh) {
    const nul = sh.endsWith('?');
    return nul;
}
export function inner$typesFromEvidence$gen$c(sh) {
    const nul = sh.endsWith('?');
    const c = nul ? sh.slice(0, -1) : sh;
    return c;
}
export function inner$typesFromEvidence$gen$c$$step(sh, nul) {
    const c = nul ? sh.slice(0, -1) : sh;
    return c;
}
export function inner$typesFromEvidence$gen$i(sh) {
    const nul = sh.endsWith('?');
    const c = nul ? sh.slice(0, -1) : sh;
    const i = c.slice(5, -1).replace(/\?$/, '');
    return i;
}
export function inner$typesFromEvidence$gen$i$$step(c) {
    const i = c.slice(5, -1).replace(/\?$/, '');
    return i;
}
export function inner$typesFromEvidence$e(ev, name) {
    const e = Object.values(ev).find((x) => x && x.fn === name);
    return e;
}
export function inner$typesFromEvidence$forEach$t(e, i) {
    const t = gen(e.params[i]);
    return t;
}
export function inner$emitVerified$remaining(ts, sf) {
    const fns = [];
    for (const st of sf.statements) {
        if (st.kind === ts.SyntaxKind.FunctionDeclaration)
            fns.push({ name: st.name.text, params: st.parameters.map((p) => p.name.text) });
        else if (st.kind === ts.SyntaxKind.VariableStatement) {
            const d = st.declarationList.declarations[0];
            if (d.initializer && (d.initializer.kind === ts.SyntaxKind.ArrowFunction || d.initializer.kind === ts.SyntaxKind.FunctionExpression))
                fns.push({ name: d.name.text, params: d.initializer.parameters.map((p) => p.name.text) });
        }
    }
    const remaining = fns.flatMap((f) => [{ f: f.name, k: 'ret' }, ...f.params.map((p) => ({ f: f.name, k: p }))]);
    return remaining;
}
export function inner$emitVerified$remaining$$step(fns) {
    const remaining = fns.flatMap((f) => [{ f: f.name, k: 'ret' }, ...f.params.map((p) => ({ f: f.name, k: p }))]);
    return remaining;
}
export function inner$emitVerified$line(err) {
    const line = (err.match(/:(\d+):\d+/) || [])[1];
    return line;
}
export function inner$emitVerified$srcLine(helpers, code, err) {
    const line = (err.match(/:(\d+):\d+/) || [])[1];
    const srcLine = line ? (helpers + '\n' + code).split('\n')[+line - 1] || '' : '';
    return srcLine;
}
export function inner$emitVerified$srcLine$$step(helpers, code, line) {
    const srcLine = line ? (helpers + '\n' + code).split('\n')[+line - 1] || '' : '';
    return srcLine;
}
export function inner$emitVerified$pick(helpers, remaining, code, err) {
    const line = (err.match(/:(\d+):\d+/) || [])[1];
    const srcLine = line ? (helpers + '\n' + code).split('\n')[+line - 1] || '' : '';
    let pick = remaining.find((r) => r.k !== 'ret' && (new RegExp(`\\b${r.k}\\b`).test(err) || new RegExp(`\\b${r.k}\\b`).test(srcLine)));
    return pick;
}
export function inner$emitVerified$pick$$step(remaining, err, srcLine) {
    let pick = remaining.find((r) => r.k !== 'ret' && (new RegExp(`\\b${r.k}\\b`).test(err) || new RegExp(`\\b${r.k}\\b`).test(srcLine)));
    return pick;
}
export function inner$typesFromEvidence$out$$after_loop(ts, ev, sf) {
    const out = {};
    for (const st of sf.statements) {
        let name = null, params = null;
        if (st.kind === ts.SyntaxKind.FunctionDeclaration) {
            name = st.name.text;
            params = st.parameters;
        }
        else if (st.kind === ts.SyntaxKind.VariableStatement) {
            const d = st.declarationList.declarations[0];
            if (d.initializer && (d.initializer.kind === ts.SyntaxKind.ArrowFunction || d.initializer.kind === ts.SyntaxKind.FunctionExpression)) {
                name = d.name.text;
                params = d.initializer.parameters;
            }
        }
        if (!name)
            continue;
        const e = Object.values(ev).find((x) => x && x.fn === name);
        if (!e || !e.calls)
            continue;
        const pm = {};
        params.forEach((p, i) => { const t = gen(e.params[i]); if (t)
            pm[p.name.text] = t; });
        out[name] = { params: pm, ret: gen(e.ret) };
    }
    return out;
}
export function inner$emitVerified$fns$$after_loop(ts, sf) {
    const fns = [];
    for (const st of sf.statements) {
        if (st.kind === ts.SyntaxKind.FunctionDeclaration)
            fns.push({ name: st.name.text, params: st.parameters.map((p) => p.name.text) });
        else if (st.kind === ts.SyntaxKind.VariableStatement) {
            const d = st.declarationList.declarations[0];
            if (d.initializer && (d.initializer.kind === ts.SyntaxKind.ArrowFunction || d.initializer.kind === ts.SyntaxKind.FunctionExpression))
                fns.push({ name: d.name.text, params: d.initializer.parameters.map((p) => p.name.text) });
        }
    }
    return fns;
}
export function inner$emitVerified$merged$t$$after_loop(types, fns, over) {
    const t = {};
    for (const f of fns) {
        const ev = types[f.name] || {};
        t[f.name] = { params: { ...(ev.params || {}), ...over[f.name].params }, ret: over[f.name].ret || ev.ret || null };
    }
    return t;
}

export const SIGS = {
  inner$inferFn$names: [{"name":"params","d":{"t":"any"},"opt":false}],
  inner$typeOfParam$st: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$classOf$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"GLOBALS","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$emitTs$walk$key: [{"name":"owner","d":{"t":"any"},"opt":false},{"name":"fname","d":{"t":"any"},"opt":false}],
  inner$fnHead$hp: [{"name":"CUR_CLASS","d":{"t":"any"},"opt":false},{"name":"HINT","d":{"t":"obj","p":[["fields",{"t":"obj","p":[]},false],["params",{"t":"obj","p":[]},false]]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$fnHead$t: [{"name":"TYPES","d":{"t":"obj","n":"TYPES","p":[]},"opt":false},{"name":"FORCE","d":{"t":"bool"},"opt":false},{"name":"CUR_CLASS","d":{"t":"any"},"opt":false},{"name":"HINT","d":{"t":"obj","p":[["fields",{"t":"obj","p":[]},false],["params",{"t":"obj","p":[]},false]]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"inf","d":{"t":"obj","p":[["params",{"t":"obj","n":"out","p":[]},false],["ret",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$fnHead$t$$step: [{"name":"FORCE","d":{"t":"bool"},"opt":false},{"name":"inf","d":{"t":"obj","p":[["params",{"t":"obj","n":"out","p":[]},false],["ret",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"hp","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$fnHead$ret: [{"name":"TYPES","d":{"t":"obj","n":"TYPES","p":[]},"opt":false},{"name":"FORCE","d":{"t":"bool"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"inf","d":{"t":"obj","p":[["params",{"t":"obj","n":"out","p":[]},false],["ret",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$fnHead$ret$$step: [{"name":"FORCE","d":{"t":"bool"},"opt":false},{"name":"inf","d":{"t":"obj","p":[["params",{"t":"obj","n":"out","p":[]},false],["ret",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
  inner$fnHead$map$rs: [],
  inner$fnHead$map$v: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$fnHead$opt: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$fnHead$ps: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$fnHead$ps$$step: [{"name":"parts","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"any"},"opt":false}],
  inner$gen$map$v: [{"name":"j","d":{"t":"any"},"opt":false}],
  inner$gen$els: [{"name":"K","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$gen$cases: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false}],
  inner$gen$def: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false}],
  inner$bindingPre$forEach$taken: [{"name":"pat","d":{"t":"any"},"opt":false}],
  inner$param$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$boolCtx$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$boolCtx$lt: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$nullableParam$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$isStrParam$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$isMapParam$t: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$expr$s: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$expr$arith: [{"name":"K","d":{"t":"any"},"opt":false},{"name":"op","d":{"t":"any"},"opt":false}],
  inner$expr$rt: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false}],
  inner$expr$listy: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false}],
  inner$expr$listy$$step: [{"name":"rt","d":{"t":"any"},"opt":false}],
  inner$expr$intIdx: [{"name":"CTX","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"any"},"opt":false}],
  inner$expr$intIdx$$step: [{"name":"K","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"any"},"opt":false},{"name":"listy","d":{"t":"bool"},"opt":false}],
  inner$expr$dm: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$expr$lenP: [{"name":"K","d":{"t":"any"},"opt":false},{"name":"a0","d":{"t":"any"},"opt":false}],
  inner$expr$call$ar: [{"name":"K","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$expr$dm_L392: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$expr$mm: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$expr$ps: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$classDecl$name: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$classDecl$ext: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"K","d":{"t":"any"},"opt":false}],
  inner$classDecl$stmts: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$classDecl$pad: [{"name":"ARITY","d":{"t":"obj","n":"ARITY","p":[]},"opt":false},{"name":"K","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$classDecl$extra: [{"name":"ARITY","d":{"t":"obj","n":"ARITY","p":[]},"opt":false},{"name":"K","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$classDecl$extra$$step: [{"name":"pad","d":{"t":"num"},"opt":false}],
  inner$typesFromEvidence$gen$nul: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$gen$c: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$gen$c$$step: [{"name":"sh","d":{"t":"any"},"opt":false},{"name":"nul","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$gen$i: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$gen$i$$step: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$e: [{"name":"ev","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$typesFromEvidence$forEach$t: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$emitVerified$remaining: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"sf","d":{"t":"any"},"opt":false}],
  inner$emitVerified$remaining$$step: [{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emitVerified$line: [{"name":"err","d":{"t":"any"},"opt":false}],
  inner$emitVerified$srcLine: [{"name":"helpers","d":{"t":"str"},"opt":false},{"name":"code","d":{"t":"str"},"opt":false},{"name":"err","d":{"t":"any"},"opt":false}],
  inner$emitVerified$srcLine$$step: [{"name":"helpers","d":{"t":"str"},"opt":false},{"name":"code","d":{"t":"str"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$emitVerified$pick: [{"name":"helpers","d":{"t":"str"},"opt":false},{"name":"remaining","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"code","d":{"t":"str"},"opt":false},{"name":"err","d":{"t":"any"},"opt":false}],
  inner$emitVerified$pick$$step: [{"name":"remaining","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"err","d":{"t":"any"},"opt":false},{"name":"srcLine","d":{"t":"str"},"opt":false}],
  inner$typesFromEvidence$out$$after_loop: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false},{"name":"sf","d":{"t":"any"},"opt":false}],
  inner$emitVerified$fns$$after_loop: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"sf","d":{"t":"any"},"opt":false}],
  inner$emitVerified$merged$t$$after_loop: [{"name":"types","d":{"t":"obj","p":[]},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"over","d":{"t":"obj","n":"over","p":[]},"opt":false}],
};
