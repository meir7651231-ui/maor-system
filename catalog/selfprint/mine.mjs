#!/usr/bin/env node
/**
 * ⛏️ הכורה של מנוע-השרטוטים-העצמי (SELFPRINT, 15.10.2026) — "מבנים שחוזרים בפונקציות אמיתיות בכל הפרויקטים".
 *
 * **למה הכורה של BLUEPRINTS נתן 0 שרטוטים שרצים** (blueprints/mine.mjs › callGraphOf): הוא קיבל רק פונקציה שכל הגוף
 * שלה הוא קריאות לפונקציות-עם-פועל-מוכח, ודחה כל אופרטור (‎/ − + *‎), כל ‎.length‎, כל ‎Math.max‎, כל מתודה וכל קריאה
 * לפונקציה בלי תווית. אבל החיווט בקוד שלנו עשוי בדיוק מאלה ("החיווט בקוד שלנו עשוי מאופרטורים, לא מקריאות" — הדוח שם, §6).
 * לכן 0 עברו. **התיקון:** כל חישוב — אופרטור, ‎.length‎, ‎Math.*‎, מתודה (בלי פונקציה כארגומנט), קריאה לכל פונקציה —
 * הופך ל**חור**. נשאר רק השלד: מי מקבל את מה. הסוגים של החורים לא נקבעים מהשם אלא בזמן המילוי (העולם של הצמיחה:
 * מספר · רשימת-מספרים · נקודה · רשימת-נקודות); אופרטור קובע את הסוג שלו (‎/‎ ⇐ מספר,מספר ⇒ מספר).
 * שני מקומות עם אותה תווית (אותו אופרטור / אותה פונקציה) ⇒ אותו חור (ממולא באותו דבר) — כמו בקוד.
 *
 * שלד שהצמיחה כבר יודעת לבנות בעצמה (שרשרת ב(א(x)), זוג ב(א(x),א(y))) לא נכנס — אין בו כלום חדש.
 * הפלט — `catalog/selfprint/library-code.json`: לכל שלד: הצורה · כמה פונקציות · מאיפה (קובץ:שורה, שם, תוויות-החורים).
 * טהור ודטרמיניסטי (סדר-קבצים ממוין, בלי שעון). **לא קורא את blueprints/shapes.mjs ולא את library.json הישן.**
 *
 *   node catalog/selfprint/mine.mjs           # כותב library-code.json
 *   node catalog/selfprint/mine.mjs --check   # יציאה 1 אם לא מעודכן
 */
import './guard.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readFn } from './read.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
export const OUT = path.join(HERE, 'library-code.json');

/** המקורות — כמו הכורה הקודם: אורביט, הליבות, והמחסן של הפותח (בלי gen/orbit — נגזר מ-src/). */
export const SOURCES = [
  ['orbit', 'src', /\.(ts|tsx)$/],
  ['orbit', 'telephony', /\.(mjs|js|ts)$/],
  ['orbit', 'functions', /\.(mjs|js|ts)$/],
  ['core', 'catalog/core', /\.mjs$/],
  ...['14kk', 'buildsmart', 'generator', 'mmmm', 'yeshiva', 'yoman-habina'].map((r) => [r, 'catalog/inner/gen/' + r, /\.mjs$/]),
];
const SKIP = /(^|\/)(node_modules|__tests__|dist|build)(\/|$)|\.(test|spec|d)\.(ts|tsx|mjs|js)$/;
function walk(rel, re, out = []) {
  let es; try { es = fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of es.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const r = rel + '/' + e.name;
    if (SKIP.test(r)) continue;
    if (e.isDirectory()) walk(r, re, out); else if (re.test(e.name)) out.push(r);
  }
  return out;
}

const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n);
const BIN = new Map([[ts.SyntaxKind.PlusToken, '+'], [ts.SyntaxKind.MinusToken, '-'], [ts.SyntaxKind.AsteriskToken, '*'], [ts.SyntaxKind.SlashToken, '/'], [ts.SyntaxKind.PercentToken, '%'], [ts.SyntaxKind.AsteriskAsteriskToken, '**']]);
const MATH = new Set(['max', 'min', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'hypot', 'pow', 'sign', 'trunc', 'log', 'exp']);
const unwrap = (x) => { while (x && (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(x)))) x = x.expression; return x; };
const fnName = (n) => {
  if (n.name && ts.isIdentifier(n.name)) return n.name.text;
  const p = n.parent;
  if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
  if (p && ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) return p.name.text;
  return '';
};

/**
 * פונקציה ⇒ שלד-עם-חורים, או null — **כמתכון-גרף רגיל של combiner/graph.mjs**, שבו צומת-חור = ‎{id, part: '□<v>', args}‎
 * (v = משתנה-החור; אותה תווית ⇒ אותו v). הגוף: ביטוי, או ‎const …;‎ ואז ‎return <ביטוי>‎, או צבירה:
 * ‎let s = <התחלה>; for (const x of <קלט>) s = …/s += …; return s;‎. שמירות-קצה (‎if (…) return 0;‎) לפני — מדולגות. בתוך ביטוי: ‎xs.reduce((s, x) => …, <התחלה>)‎ ⇒ צומת-לולאה
 * (צבירה), ‎xs.map(x => …)‎ ⇒ צומת-לולאה (על כל פריט). חוטים: ‎$iK‎ · ‎$iK.x/.y‎ (שדה של נקודה) · מספר · ‎$it/$st‎ בלולאה.
 */
export function skeletonOf(fn) {
  if (!fn.body) return null;
  const params = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null));
  if (!params.length || params.some((p) => !p)) return null;
  const used = new Map(); const vars = new Map(); const labels = []; let bad = false; let nH = 0; let nL = 0;
  const top = [];
  const env0 = new Map();
  const inp = (name) => { if (!used.has(name)) used.set(name, 'i' + used.size); return '$' + used.get(name); };
  for (const p of params) env0.set(p, () => inp(p));
  const hole = (label, args, ctx) => {
    if (bad || !args.length || args.length > 2 || args.some((a) => a === null) || args.every((a) => typeof a === 'number')) { bad = true; return null; }
    if (!vars.has(label)) { vars.set(label, vars.size); labels.push(label); }
    const id = 'h' + nH++;
    ctx.nodes.push({ id, part: '□' + vars.get(label), args });
    return '@' + id;
  };
  const isParamWire = (s) => typeof s === 'string' && /^\$(i\d|it|st)$/.test(s);
  const loop = (overW, initW, item, st, bodyFn, emit, ctx) => {
    if (bad || typeof overW !== 'string' || initW === null) { bad = true; return null; }
    const id = 'L' + nL++; const env = new Map(ctx.env);
    if (item) env.set(item, () => '$it');
    if (st) env.set(st, () => '$st');
    const inner = { env, nodes: [], inLoop: true };
    if (ctx.inLoop) { bad = true; return null; } // לולאה בתוך לולאה — לא כאן
    const res = bodyFn(inner);
    if (bad || res === null || !inner.nodes.length) { bad = true; return null; }
    const L = { over: overW, init: emit ? 0 : initW, item: 'it', state: 'st', nodes: inner.nodes, next: emit ? '$st' : res };
    if (emit) L.emit = res;
    ctx.nodes.push({ id, loop: L });
    return '@' + id + (emit ? '.emits' : '.state');
  };
  const arrowBody = (a) => { const b = a.body; if (!ts.isBlock(b)) return b; const st = b.statements; return st.length === 1 && ts.isReturnStatement(st[0]) && st[0].expression ? st[0].expression : null; };
  const w = (x0, ctx) => {
    if (bad) return null;
    const x = unwrap(x0);
    if (!x) { bad = true; return null; }
    if (ts.isIdentifier(x) && ctx.env.has(x.text)) return ctx.env.get(x.text)();
    if (ts.isNumericLiteral(x)) return Number(x.text);
    if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(unwrap(x.operand))) return -Number(unwrap(x.operand).text);
    if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken) return hole('neg', [w(x.operand, ctx)], ctx);
    if (ts.isPropertyAccessExpression(x)) {
      const nm = x.name.text;
      if (nm === 'length') return hole('.length', [w(x.expression, ctx)], ctx);
      if (nm === 'x' || nm === 'y') { const b = w(x.expression, ctx); if (isParamWire(b)) return b + '.' + nm; }
      bad = true; return null;
    }
    if (ts.isBinaryExpression(x) && BIN.has(x.operatorToken.kind)) return hole(BIN.get(x.operatorToken.kind), [w(x.left, ctx), w(x.right, ctx)], ctx);
    if (ts.isCallExpression(x)) {
      const c = unwrap(x.expression);
      const a0 = x.arguments[0] && unwrap(x.arguments[0]);
      if (ts.isPropertyAccessExpression(c) && (c.name.text === 'reduce' || c.name.text === 'map') && a0 && (ts.isArrowFunction(a0) || ts.isFunctionExpression(a0))) {
        const ps = a0.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null));
        const body = arrowBody(a0);
        if (!body || ps.some((p) => !p)) { bad = true; return null; }
        const over = w(c.expression, ctx);
        if (c.name.text === 'reduce') {
          if (x.arguments.length !== 2 || ps.length !== 2) { bad = true; return null; }
          return loop(over, w(x.arguments[1], ctx), ps[1], ps[0], (inner) => w(body, inner), false, ctx);
        }
        if (x.arguments.length !== 1 || ps.length !== 1) { bad = true; return null; }
        return loop(over, 0, ps[0], null, (inner) => w(body, inner), true, ctx);
      }
      if (x.arguments.some((a) => isFn(unwrap(a)) || ts.isSpreadElement(a))) { bad = true; return null; }
      if (ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression) && c.expression.text === 'Math' && MATH.has(c.name.text)) return hole('Math.' + c.name.text, x.arguments.map((a) => w(a, ctx)), ctx);
      if (ts.isIdentifier(c)) return hole('call:' + c.text, x.arguments.map((a) => w(a, ctx)), ctx);
      if (ts.isPropertyAccessExpression(c)) return hole('.' + c.name.text + '()', [w(c.expression, ctx), ...x.arguments.map((a) => w(a, ctx))], ctx);
    }
    bad = true; return null;
  };
  const ctx = { env: env0, nodes: top, inLoop: false };
  let out = null;
  const b = fn.body;
  if (!ts.isBlock(b)) out = w(b, ctx);
  else {
    const st = b.statements;
    if (!st.length || !ts.isReturnStatement(st[st.length - 1]) || !st[st.length - 1].expression) return null;
    // צבירה: let s = …; for (const x of xs) <s = … | s += …>; return s;
    const acc = st.length === 3 && ts.isVariableStatement(st[0]) && st[0].declarationList.declarations.length === 1 && ts.isForOfStatement(st[1]) ? st[0].declarationList.declarations[0] : null;
    if (acc && ts.isIdentifier(acc.name) && acc.initializer && ts.isIdentifier(unwrap(st[2].expression)) && unwrap(st[2].expression).text === acc.name.text) {
      const s = acc.name.text; const f = st[1];
      const item = f.initializer && ts.isVariableDeclarationList(f.initializer) && f.initializer.declarations.length === 1 && ts.isIdentifier(f.initializer.declarations[0].name) ? f.initializer.declarations[0].name.text : null;
      let body = f.statement; if (ts.isBlock(body)) body = body.statements.length === 1 ? body.statements[0] : null;
      if (!item || !body || !ts.isExpressionStatement(body) || !ts.isBinaryExpression(body.expression) || idText(body.expression.left) !== s) return null;
      const op = body.expression.operatorToken.kind; const rhs = body.expression.right;
      const AS = new Map([[ts.SyntaxKind.PlusEqualsToken, '+'], [ts.SyntaxKind.MinusEqualsToken, '-'], [ts.SyntaxKind.AsteriskEqualsToken, '*']]);
      if (op !== ts.SyntaxKind.EqualsToken && !AS.has(op)) return null;
      out = loop(w(f.expression, ctx), w(acc.initializer, ctx), item, s, (inner) => (op === ts.SyntaxKind.EqualsToken ? w(rhs, inner) : hole(AS.get(op), ['$st', w(rhs, inner)], inner)), false, ctx);
    } else {
      const lets = [];
      for (const x of st.slice(0, -1)) {
        if (guardIf(x)) continue; // ‎if (!xs.length) return 0;‎ — שמירה בקצה, לא חלק מהחישוב
        if (!ts.isVariableStatement(x) || !(x.declarationList.flags & ts.NodeFlags.Const)) return null;
        for (const d of x.declarationList.declarations) { if (!ts.isIdentifier(d.name) || !d.initializer) return null; lets.push([d.name.text, d.initializer]); }
      }
      for (const [name, init] of lets) { const v = w(init, ctx); if (bad) return null; ctx.env.set(name, () => v); }
      out = w(st[st.length - 1].expression, ctx);
    }
  }
  if (bad || typeof out !== 'string' || !out.startsWith('@') || nH < 2 || vars.size > 4 || used.size < 1 || used.size > 2) return null;
  // רק צמתים שהפלט תלוי בהם
  const refs = (o, acc = new Set()) => { if (typeof o === 'string') { const m = /^@(\w+)/.exec(o); if (m) acc.add(m[1]); } else if (o && typeof o === 'object') Object.values(o).forEach((v) => refs(v, acc)); return acc; };
  const need = new Set([refs(out)].flatMap((s) => [...s]));
  for (let k = top.length - 1; k >= 0; k--) if (need.has(top[k].id)) for (const r of refs(top[k].loop || top[k].args)) need.add(r);
  if (top.some((n) => !need.has(n.id))) return null;
  return { inputs: used.size, graph: { inputs: [...used.values()], nodes: top, out }, labels, holes: vars.size };
}
/** ‎if (…) return <קבוע/קלט/כלום>;‎ בלי else — שמירת-קצה (רשימה ריקה, אפס). השלד הוא החישוב שאחריה. */
const guardIf = (x) => {
  if (!ts.isIfStatement(x) || x.elseStatement) return false;
  let t = x.thenStatement; if (ts.isBlock(t)) t = t.statements.length === 1 ? t.statements[0] : null;
  if (!t || !ts.isReturnStatement(t)) return false;
  const e = t.expression && unwrap(t.expression);
  return !e || ts.isNumericLiteral(e) || ts.isIdentifier(e) || ts.isStringLiteral(e) || e.kind === ts.SyntaxKind.NullKeyword || ts.isArrayLiteralExpression(e) && !e.elements.length || ts.isPrefixUnaryExpression(e) && ts.isNumericLiteral(unwrap(e.operand));
};
const idText = (e) => (e && ts.isIdentifier(e) ? e.text : null);

/** כל צמתי-החורים (גם בלולאות). */
export const holeNodes = (g) => { const out = []; const walk = (ns) => { for (const n of ns) if (n.loop) walk(n.loop.nodes); else out.push(n); }; walk(g.nodes); return out; };
/**
 * השלד כבר ב"צורות" של הצמיחה? שרשרת (כל חור מקבל רק את הקודם / קלט, בלי שדות וקבועים), זוג (אותו חור על שני
 * קלטים ואז צירוף), או לולאה אחת עם חור אחד (על-כל-פריט / צבירה — ‎map/fold‎ של הצמיחה).
 */
export function growCanBuild(sk) {
  const N = sk.graph.nodes;
  const plain = (a) => typeof a === 'string' && !a.includes('.') ;
  if (N.every((n) => !n.loop)) {
    const chain = N.every((n, k) => (k === 0 ? n.args.every((a) => plain(a) && a.startsWith('$')) : n.args[0] === '@' + N[k - 1].id && n.args.slice(1).every((a) => plain(a) && a.startsWith('$'))));
    if (chain) return 'chain';
    if (N.length === 3 && N[0].part === N[1].part && N[0].args.length === 1 && N[1].args.length === 1 && plain(N[0].args[0]) && plain(N[1].args[0]) && N[0].args[0] !== N[1].args[0] && N[2].args.join() === '@' + N[0].id + ',@' + N[1].id) return 'pair';
    return null;
  }
  if (N.length === 1 && N[0].loop.nodes.length === 1) return N[0].loop.emit ? 'map' : 'fold';
  return null;
}

/** מפתח-קנוני: הגרף (המשתנים כבר לפי סדר-הופעה), בלי התוויות. */
export const shapeKey = (sk) => JSON.stringify(sk.graph);

/**
 * MINER2 — מקורות "טמאים" לגילוי (השאר-אחד-בחוץ חמור): פונקציות שמממשות פועל-מטרה בכל הפרויקטים — הייחוסים של הפעלים
 * (‎catalog/lib/verbs*.mjs‎ › ‎ref‎ — הפועל = ה-id של האובייקט) ומוצר-החלוקה (‎catalog/products‎ — מסלול/שכן-קרוב/2-opt).
 * הן לא נכנסות לספרייה ולא נספרות; אם השלד שלהן זהה לשלד בספרייה — השלד מסומן ‎taint‎, והמנוע לא סופר כל מה שנבנה
 * ממנו כגילוי של הפועל הזה (selfprint.mjs › excl).
 */
export const TAINT_SOURCES = [
  ['verbs', 'catalog/lib', /^verbs.*\.mjs$/],
  ['products', 'catalog/products', /\.(mjs|js)$/],
];
/** ‎ref: { fn: () => (xs) => … }‎ בתוך ‎{ id: 'tour', … }‎ ⇒ 'tour'. */
function refVerbOf(n) {
  let inRef = false;
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'ref') inRef = true;
    if (inRef && ts.isObjectLiteralExpression(p)) {
      const id = p.properties.find((q) => ts.isPropertyAssignment(q) && ts.isIdentifier(q.name) && q.name.text === 'id' && ts.isStringLiteral(q.initializer));
      if (id) return id.initializer.text;
    }
  }
  return null;
}

/** שלד אחד או שניים לכל פונקציה: הכורה הראשון (v1) והקורא החדש (v2, read.mjs). אותו מפתח ⇒ אחד. */
function skeletonsOf(n, stats) {
  const out = [];
  const v1 = skeletonOf(n);
  const v2 = readFn(n, { onNo: stats ? (why) => { const k = why.replace(/ .*/, ''); stats.why[k] = (stats.why[k] || 0) + 1; } : null });
  if (v1) out.push({ ...v1, by: 'v1', feats: [] });
  if (v2 && (!v1 || shapeKey(v1) !== shapeKey(v2))) out.push({ ...v2, by: 'v2' });
  else if (v2 && out[0]) out[0].by = 'v1+v2';
  return { out, v1: !!v1, v2: !!v2, feats: v2 ? v2.feats : [] };
}

export function mineFiles(files) {
  const lib = new Map(); let fns = 0; let skel = 0; const skippedGrow = { chain: 0, pair: 0, map: 0, fold: 0 };
  const st = { why: {}, v1: 0, v2: 0, any: 0, feats: {}, v1Grow: 0 };
  for (const [src, rel] of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : rel.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind);
    const visit = (n) => {
      if (isFn(n) && n.body) {
        fns++;
        const r = skeletonsOf(n, st);
        if (r.v1) st.v1++;
        if (r.v2) { st.v2++; for (const f of r.feats) st.feats[f] = (st.feats[f] || 0) + 1; }
        if (r.out.length) { st.any++; skel++; }
        for (const sk of r.out) {
          const g = growCanBuild(sk);
          if (g) { skippedGrow[g]++; if (sk.by !== 'v2') st.v1Grow++; continue; }
          const key = shapeKey(sk);
          let e = lib.get(key);
          if (!e) lib.set(key, (e = { key, inputs: sk.inputs, holes: sk.holes, graph: sk.graph, n: 0, sources: new Set(), origins: [], by: new Set(), feats: new Set() }));
          e.n++; e.sources.add(src); for (const b of sk.by.split('+')) e.by.add(b); for (const f of sk.feats) e.feats.add(f);
          e.origins.push({ at: rel + ':' + (sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1), name: fnName(n), labels: sk.labels });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return { lib, fns, skel, skippedGrow, stats: st };
}

/** הפונקציות הטמאות ⇒ ‎shapeKey ⇒ [{at, name, labels, verb?}]‎. */
export function taintOf(files) {
  const t = new Map();
  for (const [src, rel] of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = (n) => {
      if (isFn(n) && n.body) {
        for (const sk of skeletonsOf(n, null).out) {
          const key = shapeKey(sk);
          if (!t.has(key)) t.set(key, []);
          const verb = src === 'verbs' ? refVerbOf(n) : null;
          t.get(key).push({ at: rel + ':' + (sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1), name: fnName(n), labels: sk.labels, ...(verb ? { verb } : {}) });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return t;
}

export function mineAll() {
  const files = SOURCES.flatMap(([src, dir, re]) => walk(dir, re).map((rel) => [src, rel]));
  const tfiles = TAINT_SOURCES.flatMap(([src, dir, re]) => walk(dir, re).map((rel) => [src, rel]));
  const { lib, fns, skel, skippedGrow, stats } = mineFiles(files);
  const taint = taintOf(tfiles);
  const all = [...lib.values()];
  const shapes = all.map((e) => ({ inputs: e.inputs, holes: e.holes, by: [...e.by].sort(), feats: [...e.feats].sort(), graph: e.graph, n: e.n, sources: [...e.sources].sort(), origins: e.origins, ...(taint.has(e.key) ? { taint: taint.get(e.key) } : {}) }))
    .sort((a, b) => b.n - a.n || (JSON.stringify(a.graph) < JSON.stringify(b.graph) ? -1 : 1))
    .map((e, k) => ({ id: 'code-' + String(k + 1).padStart(4, '0'), ...e }));
  const v1Shapes = shapes.filter((s) => s.by.includes('v1'));
  const count = (xs) => ({ distinct: xs.length, recurring: xs.filter((s) => s.n >= 2).length });
  const why = Object.fromEntries(Object.entries(stats.why).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 20));
  return {
    about: 'נבנה ע״י catalog/selfprint/mine.mjs — לא לערוך ביד. שלדים מהקוד שלנו: כל אופרטור / השוואה / ‎.length‎ / ‎Math.*‎ / מתודה / קריאה ⇒ חור (גרף בצורת combiner/graph.mjs; צומת-חור part=□<v>; אותה תווית ⇒ אותו v); ‎if/?:/return-מוקדם ⇒ ⟨choose⟩‎ · ‎for (let i…) ⇒ ⟨range⟩‎ · ‎xs[i] ⇒ ⟨at⟩‎ · לולאות (גם עם תנאי, "בחר את הטוב", "חזור עד שאין שינוי") ⇒ צומת-לולאה (read.mjs). by: v1 = הכורה של SELFPRINT · v2 = הקורא של MINER2. origins = כל הפונקציות שהשלד נמצא בהן (שם + תוויות-החורים); taint = פונקציות שמממשות פועל-מטרה (ייחוסי-הפעלים, מוצר-החלוקה) עם אותו שלד — לבדיקת "השאר-אחד-בחוץ"',
    files: files.length, functions: fns, skeletons: skel, skippedGrowCanBuild: skippedGrow,
    readers: {
      v1: { functions: stats.v1, ...count(v1Shapes), growCanBuild: stats.v1Grow },
      v2: { functions: stats.v2, feats: Object.fromEntries(Object.entries(stats.feats).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) },
      any: { functions: stats.any, ...count(shapes) },
      v2Only: count(shapes.filter((s) => !s.by.includes('v1'))),
      notReadTop: why,
    },
    taintFiles: tfiles.length, tainted: shapes.filter((s) => s.taint).length,
    distinct: shapes.length, shapes,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const res = mineAll();
  const text = JSON.stringify(res, null, 1).replace(/\n\s+(-?\d+|"[^"\n]*"),?(?=\n)/g, (m) => m) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('library-code.json לא מעודכן — הריצו node catalog/selfprint/mine.mjs'); process.exit(1); }
    console.log('✓ library-code.json מעודכן'); process.exit(0);
  }
  fs.writeFileSync(OUT, text);
  console.log(`⛏️ ${res.files} קבצים · ${res.functions} פונקציות · לפני: ${res.readers.v1.functions} ⇒ ${res.readers.v1.distinct} שלדים (${res.readers.v1.recurring} חוזרים) · אחרי: ${res.readers.any.functions} ⇒ ${res.readers.any.distinct} (${res.readers.any.recurring} חוזרים) · טמאים ${res.tainted} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
