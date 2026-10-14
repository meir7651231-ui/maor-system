// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/auto-logic.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const norm = (t) => String(t || 'dynamic').replace(/\s+/g, '').replace(/\?$/, '').replace(/^(\w+(?:<[^>]*>)?)Function.*$/, '$1Function');
export function inner$catalog$map$lines(src) {
    const lines = src.split('\n').filter((l) => /^\s*\/\//.test(l)).slice(0, 8);
    return lines;
}
export function inner$catalog$map$m(src) {
    const lines = src.split('\n').filter((l) => /^\s*\/\//.test(l)).slice(0, 8);
    const first = lines[0] || '';
    const m = first.match(/—\s*(.+)$/);
    return m;
}
export function inner$catalog$map$m$$step(first) {
    const m = first.match(/—\s*(.+)$/);
    return m;
}
export function inner$catalog$map$origin(src) {
    const lines = src.split('\n').filter((l) => /^\s*\/\//.test(l)).slice(0, 8);
    const origin = ((lines.join(' ').match(/מוצא:\s*([\w./-]+)/) || [])[1] || '').replace(/:\d.*$/, '') || null;
    return origin;
}
export function inner$catalog$map$origin$$step(lines) {
    const origin = ((lines.join(' ').match(/מוצא:\s*([\w./-]+)/) || [])[1] || '').replace(/:\d.*$/, '') || null;
    return origin;
}
export function inner$composeOps$ATOM(CE) {
    const ATOM = Object.fromEntries([...CE.matchAll(/^\s*(\w+):\s*\{\s*atom:\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]));
    return ATOM;
}
export function inner$composeOps$NAMES(CE) {
    const NAMES = Object.fromEntries([...CE.matchAll(/\{ id: '([^']+)',\s*name: '((?:[^'\\]|\\.)*)',\s*f: \{ kind: '([^']+)'/g)].map((m) => [m[1], { name: m[2], kind: m[3] }]));
    return NAMES;
}
export function inner$composeOps$KIND_OPS(CE) {
    const KIND_OPS = Object.fromEntries([...CE.matchAll(/if \(f\.kind === '([^']+)'\)[^\n]*?\n?[^\n]*?return \[([\s\S]*?)\];/g)].map((m) => [m[1], [...m[2].matchAll(/op:\s*'(\w+)'/g)].map((x) => x[1])]));
    return KIND_OPS;
}
export function inner$sigOf$key(file, name) {
    const key = file + '#' + name;
    return key;
}
export function inner$sigOf$m(name, src) {
    const m = src.match(new RegExp(`^([A-Za-z_][\\w<>?,. ]*?)\\s+${name}\\(`, 'm'));
    return m;
}
export function inner$sigOf$i(name, src) {
    const m = src.match(new RegExp(`^([A-Za-z_][\\w<>?,. ]*?)\\s+${name}\\(`, 'm'));
    let i = m.index + m[0].length;
    return i;
}
export function inner$sigOf$i$$step(m) {
    let i = m.index + m[0].length;
    return i;
}
export function inner$sigOf$push$t(cur) {
    const t = cur.trim();
    return t;
}
export function inner$sigOf$push$noDef(cur) {
    const t = cur.trim();
    const noDef = t.replace(/\s*=.*$/, '');
    return noDef;
}
export function inner$sigOf$push$noDef$$step(t) {
    const noDef = t.replace(/\s*=.*$/, '');
    return noDef;
}
export function inner$sigOf$push$nm(cur) {
    const t = cur.trim();
    const noDef = t.replace(/\s*=.*$/, '');
    const nm = (noDef.match(/([A-Za-z_]\w*)\s*$/) || [])[1] || '';
    return nm;
}
export function inner$sigOf$push$nm$$step(noDef) {
    const nm = (noDef.match(/([A-Za-z_]\w*)\s*$/) || [])[1] || '';
    return nm;
}
export function inner$sigOf$push$ty(cur) {
    const t = cur.trim();
    const noDef = t.replace(/\s*=.*$/, '');
    const nm = (noDef.match(/([A-Za-z_]\w*)\s*$/) || [])[1] || '';
    const ty = noDef.slice(0, noDef.length - nm.length).replace(/\b(required|final|covariant)\b/g, '').trim() || 'dynamic';
    return ty;
}
export function inner$sigOf$push$ty$$step(noDef, nm) {
    const ty = noDef.slice(0, noDef.length - nm.length).replace(/\b(required|final|covariant)\b/g, '').trim() || 'dynamic';
    return ty;
}
export function inner$typeOf$m(p) {
    const m = String(p || 'dynamic').match(/^(.+Function\([^)]*\)\??)\s+\w+$/);
    return m;
}
export function inner$adapterCode$missingNamed(sd, sc) {
    const missingNamed = sc.named.filter((p) => p.required && !sd.named.find((q) => q.name === p.name)).map((p) => p.name);
    return missingNamed;
}
export function inner$adapterCode$args(sd, sc) {
    const dPos = [...sd.pos, ...sd.opt];
    const cPos = [...sc.pos, ...sc.opt];
    const args = cPos.slice(0, Math.min(cPos.length, dPos.length)).map((p, i) => { const a = norm(p.type), b = norm(dPos[i].type); return a === 'dynamic' || a === b ? dPos[i].name : `${dPos[i].name} as ${p.type}`; });
    return args;
}
export function inner$adapterCode$args$$step(dPos, cPos) {
    const args = cPos.slice(0, Math.min(cPos.length, dPos.length)).map((p, i) => { const a = norm(p.type), b = norm(dPos[i].type); return a === 'dynamic' || a === b ? dPos[i].name : `${dPos[i].name} as ${p.type}`; });
    return args;
}
export function inner$adapterCode$map$a(p) {
    const a = norm(p.type);
    return a;
}
export function inner$adapterCode$map$b(dPos, i) {
    const b = norm(dPos[i].type);
    return b;
}
export function inner$adapterCode$q(sd, p) {
    const q = sd.named.find((x) => x.name === p.name);
    return q;
}
export function inner$adapterCode$call(to, sd, sc) {
    const dPos = [...sd.pos, ...sd.opt];
    const cPos = [...sc.pos, ...sc.opt];
    const args = cPos.slice(0, Math.min(cPos.length, dPos.length)).map((p, i) => { const a = norm(p.type), b = norm(dPos[i].type); return a === 'dynamic' || a === b ? dPos[i].name : `${dPos[i].name} as ${p.type}`; });
    for (const p of sc.named) {
        const q = sd.named.find((x) => x.name === p.name);
        if (q)
            args.push(`${p.name}: ${q.name}`);
    }
    const call = `${to}(${args.join(', ')})`;
    return call;
}
export function inner$adapterCode$call$$step(to, args) {
    const call = `${to}(${args.join(', ')})`;
    return call;
}
export function inner$adapterCode$body(to, sd, sc) {
    const dPos = [...sd.pos, ...sd.opt];
    const cPos = [...sc.pos, ...sc.opt];
    const args = cPos.slice(0, Math.min(cPos.length, dPos.length)).map((p, i) => { const a = norm(p.type), b = norm(dPos[i].type); return a === 'dynamic' || a === b ? dPos[i].name : `${dPos[i].name} as ${p.type}`; });
    for (const p of sc.named) {
        const q = sd.named.find((x) => x.name === p.name);
        if (q)
            args.push(`${p.name}: ${q.name}`);
    }
    const call = `${to}(${args.join(', ')})`;
    const body = norm(sd.ret) === 'dynamic' || norm(sd.ret) === norm(sc.ret) ? call : `${call} as ${sd.ret}`;
    return body;
}
export function inner$adapterCode$body$$step(sd, sc, call) {
    const body = norm(sd.ret) === 'dynamic' || norm(sd.ret) === norm(sc.ret) ? call : `${call} as ${sd.ret}`;
    return body;
}
export function inner$compat$a(c, i) {
    const a = norm(c.params[i]);
    return a;
}
export function inner$compat$b(d, i) {
    const b = norm(d.params[i]);
    return b;
}
export function inner$compat$ra(c) {
    const ra = norm(c.ret);
    return ra;
}
export function inner$compat$rb(d) {
    const rb = norm(d.ret);
    return rb;
}
export function inner$agree$a(c, i) {
    const a = norm(c.params[i]);
    return a;
}
export function inner$rankAll$byId(rows) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    return byId;
}
export function inner$rankAll$k(m) {
    const k = m[1] + '/' + m[2];
    return k;
}
export function inner$rankAll$d(rows, atom) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const d = byId.get(atom);
    return d;
}
export function inner$rankAll$d$$step(byId, atom) {
    const d = byId.get(atom);
    return d;
}
export function inner$rankAll$layer(LAYER, atom) {
    const layer = LAYER ? LAYER.get(atom) : undefined;
    return layer;
}
export function inner$rankAll$declaredRank(atom, cands) {
    const declaredRank = cands.findIndex((c) => c.id === atom);
    return declaredRank;
}
export function inner$rankAll$map$isGold(atom, c) {
    const isGold = c.id === atom;
    return isGold;
}
export function inner$applySwap$rel(toFile) {
    const rel = '../' + toFile;
    return rel;
}
export function inner$applySwap$kebab(from) {
    const kebab = from.replace(/([A-Z])/g, '-$1').toLowerCase();
    return kebab;
}
export function inner$applySwap$repl(from, to, toFile, adapter) {
    const rel = '../' + toFile;
    const repl = adapter ? `import '${rel}'; // G19 · מנוע-לפי-ייעוד: ${from} ⇒ ${to} (עטיפת-חתימה למטה)` : `import '${rel}'; // G18 · מנוע-לפי-ייעוד: ${from} ⇒ ${to}`;
    return repl;
}
export function inner$applySwap$repl$$step(from, to, adapter, rel) {
    const repl = adapter ? `import '${rel}'; // G19 · מנוע-לפי-ייעוד: ${from} ⇒ ${to} (עטיפת-חתימה למטה)` : `import '${rel}'; // G18 · מנוע-לפי-ייעוד: ${from} ⇒ ${to}`;
    return repl;
}
export function inner$applySwap$lastImp(out) {
    const lastImp = out.split('\n').reduce((a, l, i) => (/^import '/.test(l) ? i : a), -1);
    return lastImp;
}
export function inner$applySwap$L(out) {
    const L = out.split('\n');
    return L;
}
export function inner$runTests$out(x) {
    const out = (x.stdout || '') + (x.stderr || '');
    return out;
}
export function inner$runTests$last(x) {
    const out = (x.stdout || '') + (x.stderr || '');
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    return last;
}
export function inner$runTests$last$$step(out) {
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    return last;
}
export function inner$runTests$p(x) {
    const out = (x.stdout || '') + (x.stderr || '');
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    const p = last ? +last[1] : 0;
    return p;
}
export function inner$runTests$p$$step(last) {
    const p = last ? +last[1] : 0;
    return p;
}
export function inner$runTests$f(x) {
    const out = (x.stdout || '') + (x.stderr || '');
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    const f = last && last[2] ? +last[2] : 0;
    return f;
}
export function inner$runTests$f$$step(last) {
    const f = last && last[2] ? +last[2] : 0;
    return f;
}
export function inner$prove$byId(rows) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    return byId;
}
export function inner$prove$d(rows, r) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const d = byId.get(r.declared);
    return d;
}
export function inner$prove$d$$step(byId, r) {
    const d = byId.get(r.declared);
    return d;
}
export function inner$prove$sensitive(sens) {
    const sensitive = !sens.ce && sens.n > 0 && sens.ok < sens.n;
    return sensitive;
}
export function inner$prove$proven(sens, pr) {
    const sensitive = !sens.ce && sens.n > 0 && sens.ok < sens.n;
    const proven = sensitive && !pr.ce && pr.n > 0 && pr.ok === pr.n;
    return proven;
}
export function inner$prove$proven$$step(pr, sensitive) {
    const proven = sensitive && !pr.ce && pr.n > 0 && pr.ok === pr.n;
    return proven;
}
export function inner$catalog$df$$after_loop(rows) {
    const df = {};
    for (const r of rows)
        for (const t of new Set([...r.titleTok, ...r.bodyTok]))
            df[t] = (df[t] || 0) + 1;
    return df;
}
export function inner$sigOf$i$$after_loop(name, src) {
    const m = src.match(new RegExp(`^([A-Za-z_][\\w<>?,. ]*?)\\s+${name}\\(`, 'm'));
    let i = m.index + m[0].length;
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
export function inner$sigOf$depth$$after_loop(name, src) {
    const m = src.match(new RegExp(`^([A-Za-z_][\\w<>?,. ]*?)\\s+${name}\\(`, 'm'));
    let i = m.index + m[0].length;
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
export function inner$sigOf$raw$$after_loop(name, src) {
    const m = src.match(new RegExp(`^([A-Za-z_][\\w<>?,. ]*?)\\s+${name}\\(`, 'm'));
    let i = m.index + m[0].length;
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
export function inner$adapterCode$args$$after_loop(sd, sc) {
    const dPos = [...sd.pos, ...sd.opt];
    const cPos = [...sc.pos, ...sc.opt];
    const args = cPos.slice(0, Math.min(cPos.length, dPos.length)).map((p, i) => { const a = norm(p.type), b = norm(dPos[i].type); return a === 'dynamic' || a === b ? dPos[i].name : `${dPos[i].name} as ${p.type}`; });
    for (const p of sc.named) {
        const q = sd.named.find((x) => x.name === p.name);
        if (q)
            args.push(`${p.name}: ${q.name}`);
    }
    return args;
}

export const SIGS = {
  inner$catalog$map$lines: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$catalog$map$m: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$catalog$map$m$$step: [{"name":"first","d":{"t":"str"},"opt":false}],
  inner$catalog$map$origin: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$catalog$map$origin$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$composeOps$ATOM: [{"name":"CE","d":{"t":"any"},"opt":false}],
  inner$composeOps$NAMES: [{"name":"CE","d":{"t":"any"},"opt":false}],
  inner$composeOps$KIND_OPS: [{"name":"CE","d":{"t":"any"},"opt":false}],
  inner$sigOf$key: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$sigOf$m: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOf$i: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOf$i$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$sigOf$push$t: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$noDef: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$noDef$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$nm: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$nm$$step: [{"name":"noDef","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$ty: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$sigOf$push$ty$$step: [{"name":"noDef","d":{"t":"str"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$typeOf$m: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$adapterCode$missingNamed: [{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$adapterCode$args: [{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$adapterCode$args$$step: [{"name":"dPos","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cPos","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$adapterCode$map$a: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$adapterCode$map$b: [{"name":"dPos","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$adapterCode$q: [{"name":"sd","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$adapterCode$call: [{"name":"to","d":{"t":"any"},"opt":false},{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$adapterCode$call$$step: [{"name":"to","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$adapterCode$body: [{"name":"to","d":{"t":"any"},"opt":false},{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$adapterCode$body$$step: [{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false},{"name":"call","d":{"t":"str"},"opt":false}],
  inner$compat$a: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$compat$b: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$compat$ra: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$compat$rb: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$agree$a: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$rankAll$byId: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$rankAll$k: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$rankAll$d: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$rankAll$d$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$rankAll$layer: [{"name":"LAYER","d":{"t":"or","of":[{"t":"null"},{"t":"map","k":{"t":"any"},"v":{"t":"any"}}]},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$rankAll$declaredRank: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false}],
  inner$rankAll$map$isGold: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$applySwap$rel: [{"name":"toFile","d":{"t":"any"},"opt":false}],
  inner$applySwap$kebab: [{"name":"from","d":{"t":"any"},"opt":false}],
  inner$applySwap$repl: [{"name":"from","d":{"t":"any"},"opt":false},{"name":"to","d":{"t":"any"},"opt":false},{"name":"toFile","d":{"t":"any"},"opt":false},{"name":"adapter","d":{"t":"null"},"opt":false}],
  inner$applySwap$repl$$step: [{"name":"from","d":{"t":"any"},"opt":false},{"name":"to","d":{"t":"any"},"opt":false},{"name":"adapter","d":{"t":"null"},"opt":false},{"name":"rel","d":{"t":"str"},"opt":false}],
  inner$applySwap$lastImp: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$applySwap$L: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$runTests$out: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$runTests$last: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$runTests$last$$step: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$runTests$p: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$runTests$p$$step: [{"name":"last","d":{"t":"any"},"opt":false}],
  inner$runTests$f: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$runTests$f$$step: [{"name":"last","d":{"t":"any"},"opt":false}],
  inner$prove$byId: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$prove$d: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$prove$d$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$prove$sensitive: [{"name":"sens","d":{"t":"obj","p":[["ok",{"t":"num"},false],["n",{"t":"num"},false],["ce",{"t":"bool"},false]]},"opt":false}],
  inner$prove$proven: [{"name":"sens","d":{"t":"obj","p":[["ok",{"t":"num"},false],["n",{"t":"num"},false],["ce",{"t":"bool"},false]]},"opt":false},{"name":"pr","d":{"t":"obj","p":[["ok",{"t":"num"},false],["n",{"t":"num"},false],["ce",{"t":"bool"},false]]},"opt":false}],
  inner$prove$proven$$step: [{"name":"pr","d":{"t":"obj","p":[["ok",{"t":"num"},false],["n",{"t":"num"},false],["ce",{"t":"bool"},false]]},"opt":false},{"name":"sensitive","d":{"t":"bool"},"opt":false}],
  inner$catalog$df$$after_loop: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$sigOf$i$$after_loop: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOf$depth$$after_loop: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOf$raw$$after_loop: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$adapterCode$args$$after_loop: [{"name":"sd","d":{"t":"any"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
};
