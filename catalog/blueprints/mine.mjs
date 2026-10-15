#!/usr/bin/env node
/**
 * ⛏️ כורה-השרטוטים (BLUEPRINTS, 14.10.2026) — "איזה צורות-חיבור כבר יש בקוד שלנו?"
 *
 * לכל פונקציה (הצהרה · חץ · ביטוי · מתודה) בקוד שהקטלוג קורא כאן — אורביט (`src/`, `telephony/`, `functions/`),
 * הליבות (`catalog/core/*.mjs`) והחלקים שהפותח הרים מהפרויקטים החיצוניים (`catalog/inner/gen/<ריפו>/`, בלי `gen/orbit` —
 * הוא נגזר מ-`src/`) — המנתח של TypeScript (בלי מהדר-טיפוסים, בלי להריץ) מחלץ **צורה**: מה קורא למה, ואילו מבני-בקרה.
 *
 * הצורה היא עץ של אסימונים:
 *   loop[…]   לולאה על רשימה (for/for-of/for-in/forEach)          fix[…]   חזרה-עד-שאין-שינוי (while על דגל שמתאפס ומודלק בפנים)
 *   while[…]  לולאה אחרת                                          acc      צבירה (‎+=‎, ‎x = x + …‎, ‎Math.max(x, …)‎ לתוך x)
 *   inc       ‎++/--‎ (מונה)       push      איסוף לרשימה                                        map/filter/fold/find/any  מתודות-המערך
 *   sort1     מיין-ואז-ראשון (‎.sort(…)[0]‎ / ‎.sort(…).at(0)‎)    topk     מיין-ואז-קח-k (‎.sort(…).slice(0, k)‎)
 *   group     קיבוץ-ואז-ספירה (‎m[k] = (m[k] ?? 0) + 1‎ / ‎m.set(k, (m.get(k) ?? 0) + 1)‎)
 *   pick      בחירה-לפי-תנאי (?: / if-return)                     bsearch  חיפוש-בינארי (lo/hi/mid)
 *   queue     תור (‎shift()‎ / ‎q[head++]‎ בתוך while)               window   חלון-נע (‎slice(i, i + w)‎ / ‎a[i - w]‎)
 *   merge2    מיזוג שני רצפים (שני מצביעים מול שני אורכים)        max/min  ‎Math.max/min‎
 *   ⟨פועל⟩    קריאה לפונקציה שלנו — **משבצת-פועל** לפי התווית שהקטלוג הוכיח לחלק באותו שם (‎⟨sort⟩‎, ‎⟨convert⟩‎…), אחרת ‎⟨f⟩‎
 * נרמול: אסימונים זהים צמודים מתמזגים, עלים בלי מבנה נעלמים, הקריאות בתוך אסימון נשמרות בסדר. דדופ לפי המחרוזת.
 *
 * הפלט — `catalog/blueprints/library.json`: לכל שרטוט: המחרוזת · תדירות · עד 5 "נמצא ב: קובץ:שורה" · צורות-העל שהוא מממש;
 * ובנוסף **שרטוטים-ברי-הרצה** — פונקציות שכל הגוף שלהן הוא ביטוי של קריאות לחלקים מוכחים (בלי בקרה): הקריאות הופכות
 * למשבצות בצורת graph.mjs, ומנוע-החיפוש (search.mjs) ממלא אותן בחלקים אחרים מאותו פועל.
 * טהור ודטרמיניסטי: אותו קוד ⇒ אותו קובץ (סדר-קבצים ממוין, בלי שעון).
 *
 *   node catalog/blueprints/mine.mjs           # כותב library.json
 *   node catalog/blueprints/mine.mjs --check   # יציאה 1 אם לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { SUPER } from './shapes.mjs';
import { buildIndex, provenAs } from '../combiner/core.mjs';
import { loadParts, loadProofs, loadBehavior } from '../combiner/load.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
export const OUT = path.join(HERE, 'library.json');

/** המקורות: [שם-מקור, תיקייה, מסנן]. */
export const MINE_SOURCES = [
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

/* ═══════════════ תוויות-פועל לקריאות ═══════════════ */

/** שם-פונקציה ⇒ הפועל שהקטלוג הוכיח לחלק בשם הזה (הבית הראשון לפי סדר; `x.y.z` ⇒ y.z ו-z). */
export function verbNames(ix) {
  const m = new Map();
  for (const p of ix.parts || []) {
    const v = p.primary && provenAs(p, p.primary) ? p.primary : null;
    if (!v || v === 'recipe') continue;
    const sym = String(p.id).split('#')[1] || '';
    const last = sym.split('.').pop().replace(/:.*$/, '');
    if (/^[A-Za-z_$][\w$]*$/.test(last) && !m.has(last)) m.set(last, v);
  }
  return m;
}

/* ═══════════════ צורה של פונקציה ═══════════════ */

const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n);
const ARR = new Map([['map', 'map'], ['flatMap', 'map'], ['filter', 'filter'], ['reduce', 'fold'], ['reduceRight', 'fold'], ['find', 'find'], ['findIndex', 'find'], ['some', 'any'], ['every', 'any'], ['forEach', 'loop']]);
const idText = (e) => (e && ts.isIdentifier(e) ? e.text : null);
/** ‎x‎ שמופיע גם בצד ימין של ההשמה (צבירה): ‎x = x + …‎ · ‎x = Math.max(x, …)‎ · ‎x = [...x, …]‎. */
function selfRef(name, e) {
  let hit = false;
  const v = (n) => { if (hit) return; if (ts.isIdentifier(n) && n.text === name) hit = true; else ts.forEachChild(n, v); };
  v(e);
  return hit;
}
function sortedThen(call) {
  // ‎.sort(…)‎ / ‎.toSorted(…)‎ ואחריו ‎[0]‎ / ‎.at(0)‎ / ‎.slice(0, k)‎
  const p = call.parent;
  if (p && ts.isElementAccessExpression(p) && p.expression === call && ts.isNumericLiteral(p.argumentExpression) && p.argumentExpression.text === '0') return 'sort1';
  if (p && ts.isPropertyAccessExpression(p) && p.expression === call && p.parent && ts.isCallExpression(p.parent)) {
    const nm = p.name.text; const a = p.parent.arguments;
    if (nm === 'at' && a.length === 1 && ts.isNumericLiteral(a[0]) && a[0].text === '0') return 'sort1';
    if (nm === 'slice' && a.length === 2 && ts.isNumericLiteral(a[0]) && a[0].text === '0') return 'topk';
  }
  return null;
}

/**
 * פונקציה ⇒ עץ-אסימונים. `names` = שם ⇒ פועל. לא נכנסים לפונקציות פנימיות שיש להן שם (הן שרטוט משלהן); חץ אנונימי
 * בתוך קריאה (‎xs.map(x => …)‎) — כן: הגוף שלו הוא הגוף של ה-map.
 */
export function shapeOf(fn, names) {
  const visit = (n, out) => {
    if (!n) return;
    if (n !== fn && isFn(n) && !(n.parent && ts.isCallExpression(n.parent))) return; // פונקציה פנימית עם שם — נכרית בנפרד
    if (ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n)) { out.push(['loop', kids(n.statement)]); return; }
    if (ts.isWhileStatement(n) || ts.isDoStatement(n)) {
      const c = n.expression; const body = kids(n.statement);
      const flag = idText(c);
      let tok = 'while';
      if (flag && assignsTrue(n.statement, flag)) tok = 'fix';
      else if (lohi(c)) tok = 'bsearch';
      else if (hasQueue(n.statement)) tok = 'queue';
      else if (twoLen(c)) tok = 'merge2';
      out.push([tok, body]);
      return;
    }
    if (ts.isConditionalExpression(n)) { out.push(['pick', []]); visit(n.condition, out); visit(n.whenTrue, out); visit(n.whenFalse, out); return; }
    if (ts.isIfStatement(n) && returnsOrAssigns(n.thenStatement)) out.push(['pick', []]);
    if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind; const L = idText(n.left);
      if (op === ts.SyntaxKind.PlusEqualsToken || op === ts.SyntaxKind.MinusEqualsToken || op === ts.SyntaxKind.AsteriskEqualsToken) out.push(['acc', []]);
      else if (op === ts.SyntaxKind.EqualsToken && L && selfRef(L, n.right)) out.push(['acc', []]);
      else if (op === ts.SyntaxKind.EqualsToken && ts.isElementAccessExpression(n.left) && groupRhs(n.left, n.right)) out.push(['group', []]);
    }
    if ((ts.isPostfixUnaryExpression(n) || ts.isPrefixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) out.push(['inc', []]);
    if (ts.isElementAccessExpression(n) && ts.isBinaryExpression(n.argumentExpression) && n.argumentExpression.operatorToken.kind === ts.SyntaxKind.MinusToken && !ts.isNumericLiteral(n.argumentExpression.right)) out.push(['window', []]);
    if (ts.isCallExpression(n)) {
      const e = n.expression;
      if (ts.isPropertyAccessExpression(e)) {
        const m = e.name.text;
        if ((m === 'sort' || m === 'toSorted')) { const st = sortedThen(n); if (st) out.push([st, []]); }
        if (m === 'push' || m === 'unshift') out.push(['push', []]);
        if (m === 'slice' && n.arguments.length === 2 && ts.isBinaryExpression(n.arguments[1]) && n.arguments[1].operatorToken.kind === ts.SyntaxKind.PlusToken) out.push(['window', []]);
        if (m === 'set' && n.arguments.length === 2 && groupRhs(null, n.arguments[1], n.arguments[0])) out.push(['group', []]);
        if (idText(e.expression) === 'Math' && (m === 'max' || m === 'min')) out.push([m, []]);
        if (ARR.has(m) && n.arguments.length && (ts.isArrowFunction(n.arguments[0]) || ts.isFunctionExpression(n.arguments[0]))) {
          visit(e.expression, out);
          out.push([ARR.get(m), kids(n.arguments[0].body)]);
          for (const a of n.arguments.slice(1)) visit(a, out);
          return;
        }
      } else if (ts.isIdentifier(e)) {
        out.push(['⟨' + (names.get(e.text) || 'f') + '⟩', []]);
      }
    }
    ts.forEachChild(n, (c) => visit(c, out));
  };
  const kids = (n) => { const out = []; if (n) visit(n, out); return out; };
  const out = [];
  if (fn.body) { if (ts.isBlock(fn.body)) ts.forEachChild(fn.body, (c) => visit(c, out)); else visit(fn.body, out); }
  return out;
}
function assignsTrue(stmt, flag) {
  let t = false;
  const v = (n) => { if (t) return; if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && idText(n.left) === flag && n.right.kind === ts.SyntaxKind.TrueKeyword) t = true; else ts.forEachChild(n, v); };
  if (stmt) v(stmt);
  return t;
}
const lohi = (c) => { let s = ''; const v = (n) => { if (ts.isIdentifier(n)) s += ' ' + n.text.toLowerCase(); ts.forEachChild(n, v); }; if (c) v(c); return /\b(lo|low|l|left|start)\b/.test(s) && /\b(hi|high|h|r|right|end)\b/.test(s) && !/length/.test(s); };
const twoLen = (c) => { let k = 0; const v = (n) => { if (ts.isPropertyAccessExpression(n) && n.name.text === 'length') k++; ts.forEachChild(n, v); }; if (c) v(c); return k >= 2 && c && ts.isBinaryExpression(c) && c.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken; };
function hasQueue(stmt) {
  let q = false;
  const v = (n) => { if (q) return; if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'shift' && !n.arguments.length) q = true; else if (ts.isElementAccessExpression(n) && ts.isPostfixUnaryExpression(n.argumentExpression)) q = true; else ts.forEachChild(n, v); };
  if (stmt) v(stmt);
  return q;
}
const returnsOrAssigns = (s) => !!s && (ts.isReturnStatement(s) || (ts.isBlock(s) && s.statements.length <= 2 && s.statements.some((x) => ts.isReturnStatement(x) || (ts.isExpressionStatement(x) && ts.isBinaryExpression(x.expression) && x.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken))));
/** ‎m[k] = (m[k] ?? 0) + 1‎ · ‎m.set(k, (m.get(k) || 0) + 1)‎ — ספירה לפי מפתח. */
function groupRhs(left, right) {
  const t = right.getText();
  return /\+\s*1\s*\)?$/.test(t) && /(\?\?|\|\|)\s*0/.test(t) && (left ? t.includes(left.expression.getText()) : /\.get\(/.test(t));
}

/** עץ ⇒ מחרוזת מנורמלת: אסימונים צמודים זהים מתמזגים; עלה-בקרה בלי ילדים נשמר; ‎⟨f⟩‎ צמודים ⇒ אחד. */
export function norm(tree) {
  const parts = [];
  for (const [t, ch] of tree) {
    const inner = norm(ch);
    const s = inner ? t + '[' + inner + ']' : t;
    if (parts[parts.length - 1] !== s) parts.push(s);
  }
  return parts.join(' ');
}
const STRUCT = /^(loop|fix|while|bsearch|queue|merge2|map|filter|fold|find|any|sort1|topk|group|window)$/;
/** האם יש בצורה מבנה (לא רק קריאות/השמות) — רק אלה נכנסים לספרייה. */
export const structural = (tree) => tree.some(([t, ch]) => STRUCT.test(t) || structural(ch));
const tokensOf = (tree, out = new Set()) => { for (const [t, ch] of tree) { out.add(t.replace(/^⟨.*⟩$/, (m) => m)); tokensOf(ch, out); } return out; };

/* ═══════════════ שרטוטים-ברי-הרצה: ביטוי של קריאות ═══════════════ */

/**
 * פונקציה שכל הגוף שלה הוא ביטוי (או `return <ביטוי>` יחיד) שבנוי רק מ: קלט · ‎קלט.שדה‎ · מספר · קריאה לפונקציה שלנו
 * עם פועל מוכח — ⇒ מתכון-גרף עם משבצות: ‎{id, slot: 'S<k>', role: <פועל>, args: [חוטים]}‎. 2–4 קריאות, 1–3 קלטים.
 * כל דבר אחר (אופרטור, תנאי, מתודה, קבוע מיובא) ⇒ null — הוא לא חיווט בלבד, ומשבצת-גרף לא יכולה לשאת אותו.
 */
export function callGraphOf(fn, names) {
  if (!fn.body) return null;
  let e = fn.body;
  const lets = new Map(); // ‎const v = <ביטוי>‎ לפני ה-return ⇒ החוט של הביטוי
  let pending = [];
  if (ts.isBlock(e)) {
    const st = e.statements;
    if (!st.length || !ts.isReturnStatement(st[st.length - 1]) || !st[st.length - 1].expression) return null;
    for (const x of st.slice(0, -1)) {
      if (!ts.isVariableStatement(x) || !(x.declarationList.flags & ts.NodeFlags.Const)) return null;
      for (const d of x.declarationList.declarations) { if (!ts.isIdentifier(d.name) || !d.initializer) return null; pending.push([d.name.text, d.initializer]); }
    }
    e = st[st.length - 1].expression;
  }
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
  const params = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null));
  if (!params.length || params.length > 3 || params.some((p) => !p)) return null;
  const nodes = []; let bad = false;
  const w = (x) => {
    if (bad) return null;
    while (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x)) x = x.expression;
    if (ts.isIdentifier(x) && lets.has(x.text)) return lets.get(x.text);
    if (ts.isIdentifier(x) && params.includes(x.text)) return '$' + x.text;
    if (ts.isPropertyAccessExpression(x) && ts.isIdentifier(x.expression) && params.includes(x.expression.text)) return '$' + x.expression.text + '.' + x.name.text;
    if (ts.isPropertyAccessExpression(x) && ts.isIdentifier(x.expression) && lets.has(x.expression.text) && typeof lets.get(x.expression.text) === 'string') return lets.get(x.expression.text) + '.' + x.name.text;
    if (ts.isNumericLiteral(x)) return Number(x.text);
    if (ts.isCallExpression(x) && ts.isIdentifier(x.expression) && names.has(x.expression.text) && x.arguments.length >= 1 && x.arguments.length <= 4) {
      const args = x.arguments.map(w);
      if (bad) return null;
      const id = 'n' + nodes.length;
      nodes.push({ id, slot: 'S' + nodes.length, role: names.get(x.expression.text), args });
      return '@' + id;
    }
    bad = true; return null;
  };
  for (const [name, init] of pending) { const v = w(init); if (bad) return null; lets.set(name, v); }
  pending = null;
  const out = w(e);
  if (bad || !nodes.length || nodes.length < 2 || nodes.length > 4 || typeof out !== 'string' || !out.startsWith('@')) return null;
  return { inputs: params, nodes, out: out.slice(1) };
}

/** צורת ה-DAG של קריאות: chain2 · chain3 · pair (אותה קריאה על שני קלטים ואז צירוף) · fan-in (שתי קריאות על אותו קלט ואז צירוף). */
export function dagForm(g) {
  const uses = (n, id) => n.args.some((a) => typeof a === 'string' && (a === '@' + id || a.startsWith('@' + id + '.')));
  const ins = (n) => n.args.filter((a) => typeof a === 'string' && a.startsWith('$')).map((a) => a.split('.')[0]);
  const N = g.nodes;
  if (N.length === 2 && uses(N[1], N[0].id)) return 'chain2';
  if (N.length === 3 && uses(N[1], N[0].id) && uses(N[2], N[1].id)) return 'chain3';
  if (N.length === 3 && uses(N[2], N[0].id) && uses(N[2], N[1].id)) {
    const a = ins(N[0]); const b = ins(N[1]);
    if (N[0].role === N[1].role && a.join() !== b.join()) return 'pair';
    if (a.length && a.join() === b.join()) return 'fan-in';
    return 'fan-in';
  }
  return null;
}
const ANY_NAMES = (names) => ({ has: () => true, get: (k) => names.get(k) || 'f' });

/* ═══════════════ הכרייה ═══════════════ */

export function mineFiles(files, names) {
  const lib = new Map(); const exec = new Map(); const dags = {}; let fns = 0; let structuralFns = 0;
  const anyNames = ANY_NAMES(names);
  for (const [src, rel] of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : rel.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind);
    const visit = (n) => {
      if (isFn(n) && n.body && !(n.parent && ts.isCallExpression(n.parent))) {
        fns++;
        const tree = shapeOf(n, names);
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        const where = rel + ':' + line;
        if (structural(tree)) {
          structuralFns++;
          const key = 'F' + n.parameters.length + '{' + norm(tree) + '}';
          let e = lib.get(key);
          if (!e) lib.set(key, (e = { shape: key, n: 0, sources: new Set(), at: [], tokens: [...tokensOf(tree)].sort() }));
          e.n++; e.sources.add(src); if (e.at.length < 3) e.at.push(where);
        }
        const gd = callGraphOf(n, anyNames);
        const form = gd && dagForm(gd);
        if (form) { const d = (dags[form] ||= { n: 0, knownVerbs: 0, at: [] }); d.n++; if (gd.nodes.every((x) => x.role !== 'f')) d.knownVerbs++; if (d.at.length < 5) d.at.push(where); }
        const g = gd && gd.nodes.every((x) => x.role !== 'f') ? gd : null;
        if (g) {
          const key = JSON.stringify({ i: g.inputs.length, n: g.nodes.map((x) => [x.role, x.args.map((a) => (typeof a === 'string' ? a.replace(/^\$(\w+)/, (_, p) => '$' + g.inputs.indexOf(p)) : a))]), o: g.out });
          let e = exec.get(key);
          if (!e) exec.set(key, (e = { graph: g, n: 0, at: [] }));
          e.n++; if (e.at.length < 5) e.at.push(where);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return { lib, exec, dags, fns, structuralFns };
}

/** צורות-העל (shapes.mjs) שהשרטוט מממש — `SUPER[].mined` (ביטוי) על מחרוזת-השרטוט. */
export const supersOf = (entry) => SUPER.filter((s) => s.mined instanceof RegExp && s.mined.test(entry.shape)).map((s) => s.id);

export function mineAll(index) {
  const names = verbNames(index);
  const files = MINE_SOURCES.flatMap(([src, dir, re]) => walk(dir, re).map((rel) => [src, rel]));
  const { lib, exec, dags, fns, structuralFns } = mineFiles(files, names);
  const blueprints = [...lib.values()].map((e) => ({ shape: e.shape, n: e.n, sources: [...e.sources].sort(), at: e.at, supers: supersOf(e) }))
    .sort((a, b) => b.n - a.n || (a.shape < b.shape ? -1 : 1));
  const runnable = [...exec.values()].map((e, k) => ({ id: 'mined-' + k, n: e.n, at: e.at, graph: e.graph }))
    .sort((a, b) => b.n - a.n || (a.at[0] < b.at[0] ? -1 : 1)).map((e, k) => ({ ...e, id: 'mined-' + String(k + 1).padStart(3, '0') }));
  const bySuper = {};
  for (const s of SUPER) {
    if (typeof s.mined === 'string') { const d = dags[s.mined.slice(4)] || { n: 0, knownVerbs: 0, at: [] }; bySuper[s.id] = { functions: d.n, blueprints: d.n, callDag: true, knownVerbs: d.knownVerbs, at: d.at }; continue; }
    const hits = blueprints.filter((b) => b.supers.includes(s.id));
    bySuper[s.id] = { functions: hits.reduce((a, b) => a + b.n, 0), blueprints: hits.length, at: hits.flatMap((b) => b.at).slice(0, 5) };
  }
  const bySource = {};
  for (const [src] of files) bySource[src] = (bySource[src] || 0) + 1;
  return {
    about: 'נבנה ע״י catalog/blueprints/mine.mjs — לא לערוך ביד. צורות-חיבור שנכרו מהקוד (TS AST, בלי להריץ); ⟨פועל⟩ = משבצת לפי התווית המוכחת של החלק באותו שם',
    files: files.length, filesBySource: bySource, functions: fns, structuralFunctions: structuralFns, distinct: blueprints.length,
    callDags: dags, bySuper, runnable, blueprints,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  // המודולים המורמים של הריפואים החיצוניים (gitignored) — נוצרים לפי דרישה, ביט-זהים; בלעדיהם הכרייה רואה פחות קבצים
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  // האינדקס של המכונה (תוויות מוכחות-בהרצה) — בלי מתכונים: הכורה לא צריך אותם
  const res = mineAll(buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: [], leads: [] }));
  const text = JSON.stringify(res, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('library.json לא מעודכן — הריצו node catalog/blueprints/mine.mjs'); process.exit(1); }
    process.exit(0);
  }
  fs.writeFileSync(OUT, text);
  console.log(`⛏️ ${res.files} קבצים · ${res.functions} פונקציות · ${res.structuralFunctions} עם מבנה ⇒ ${res.distinct} שרטוטים שונים · ${res.runnable.length} ברי-הרצה · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
