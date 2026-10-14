// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/op-twins.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SIG = /^\s*(num|int|double|bool|String|dynamic)\s+(\w+)\(([^)]*)\)\s*=>\s*(.+?);\s*$/m;
function parseOp(src) {
    const code = src.split('\n').filter((l) => !/^\s*(\/\/|import )/.test(l)).join('\n');
    const m = code.match(SIG);
    if (!m)
        return null;
    const params = m[3].split(',').map((p) => p.trim()).filter(Boolean).map((p) => { const q = p.match(/^(num|int|double|bool|String|dynamic)\s+(\w+)$/); return q ? { type: q[1], name: q[2] } : null; });
    if (!params.length || params.some((p) => !p))
        return null;
    return { ret: m[1], name: m[2], params, expr: m[4].trim() };
}
const isNum = (v) => typeof v === 'number';
const T = (msg) => { throw new Error(msg); };
const cmp = (a, b) => (typeof a === typeof b && (typeof a === 'string' || isNum(a)) ? (a < b ? -1 : a > b ? 1 : 0) : T('compareTo'));
const dLit = (v) => (typeof v === 'string' ? "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$') + "'" : String(v));
export function inner$parseOp$code(src) {
    const code = src.split('\n').filter((l) => !/^\s*(\/\/|import )/.test(l)).join('\n');
    return code;
}
export function inner$parseOp$m(src) {
    const code = src.split('\n').filter((l) => !/^\s*(\/\/|import )/.test(l)).join('\n');
    const m = code.match(SIG);
    return m;
}
export function inner$parseOp$m$$step(code) {
    const m = code.match(SIG);
    return m;
}
export function inner$parseOp$params(src) {
    const code = src.split('\n').filter((l) => !/^\s*(\/\/|import )/.test(l)).join('\n');
    const m = code.match(SIG);
    const params = m[3].split(',').map((p) => p.trim()).filter(Boolean).map((p) => { const q = p.match(/^(num|int|double|bool|String|dynamic)\s+(\w+)$/); return q ? { type: q[1], name: q[2] } : null; });
    return params;
}
export function inner$parseOp$params$$step(m) {
    const params = m[3].split(',').map((p) => p.trim()).filter(Boolean).map((p) => { const q = p.match(/^(num|int|double|bool|String|dynamic)\s+(\w+)$/); return q ? { type: q[1], name: q[2] } : null; });
    return params;
}
export function inner$parseOp$map$q(p) {
    const q = p.match(/^(num|int|double|bool|String|dynamic)\s+(\w+)$/);
    return q;
}
export function inner$dmod$r(a, b) {
    const r = a % b;
    return r;
}
export function inner$twinOf$P(op) {
    const P = op.params.map((p) => p.name);
    return P;
}
export function inner$twinOf$body$c(i, j, a) {
    const c = cmp(a[i], a[j]);
    return c;
}
export function inner$twinOf$eq(m) {
    const eq = m[2] === '==';
    return eq;
}
export function inner$build$base(f) {
    const base = f.replace(/\.dart$/, '');
    return base;
}
export function inner$build$op(src) {
    const op = parseOp(src);
    return op;
}
export function inner$build$prog(cands) {
    const prog = [...cands.map((c) => c.src.split('\n').filter((l) => !/^\s*import /.test(l)).join('\n')), 'void main() {',
        ...cands.flatMap((c) => c.cases.map((args, k) => `  try { print('${c.op.name}|${k}|' + (${c.op.name}(${args.map(dLit).join(', ')})).toString()); } catch (e) { print('${c.op.name}|${k}|!THROW'); }`)), '}'].join('\n');
    return prog;
}
export function inner$build$got(r) {
    const got = new Map(r.stdout.split('\n').filter(Boolean).map((l) => { const [n, k, ...v] = l.split('|'); return [`${n}|${k}`, v.join('|')]; }));
    return got;
}
export function inner$build$map$n(l) {
    const [n, k, ...v] = l.split('|');
    return n;
}
export function inner$build$map$k(l) {
    const [n, k, ...v] = l.split('|');
    return k;
}
export function inner$build$map$v(l) {
    const [n, k, ...v] = l.split('|');
    return v;
}
export function inner$build$map$d(got, c, k) {
    const d = got.get(`${c.op.name}|${k}`);
    return d;
}
export function inner$verifiedTwin$op(src) {
    const op = parseOp(src);
    return op;
}

export const SIGS = {
  inner$parseOp$code: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseOp$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseOp$m$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$parseOp$params: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseOp$params$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseOp$map$q: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$dmod$r: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$twinOf$P: [{"name":"op","d":{"t":"any"},"opt":false}],
  inner$twinOf$body$c: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$twinOf$eq: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$build$base: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$build$op: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$build$prog: [{"name":"cands","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$build$got: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$build$map$n: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$build$map$k: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$build$map$v: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$build$map$d: [{"name":"got","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"obj","p":[["file",{"t":"any"},false],["src",{"t":"any"},false],["op",{"t":"obj","p":[["ret",{"t":"any"},false],["name",{"t":"any"},false],["params",{"t":"any"},false],["expr",{"t":"any"},false]]},false],["fn",{"t":"obj","p":[["length",{"t":"any"},false]]},false],["cases",{"t":"any"},false]]},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$verifiedTwin$op: [{"name":"src","d":{"t":"any"},"opt":false}],
};
