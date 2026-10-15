/**
 * 📖 הקורא של מנוע-השרטוטים-העצמי (MINER2, 15.10.2026) — "ללמד אותו לקרוא בקוד גם 'אם', לולאות עם תנאי, 'חזור עד שאין
 * שיפור' ו'בחר את הטוב ביותר'".
 *
 * הכורה הראשון (mine.mjs › skeletonOf) קרא רק גוף שהוא ביטוי / ‎const…; return‎ / צבירה פשוטה — 235 שלדים מתוך 30,781
 * פונקציות. כאן הקורא עובר **משפט-משפט** על הגוף, עם סביבה (שם ⇒ חוט), ובונה מתכון-גרף רגיל של combiner/graph.mjs:
 *
 *   · כל חישוב ⇒ **חור** כמו קודם (אופרטור · ‎.length‎ · ‎Math.max/min/abs…‎ · מתודה · קריאה), ועכשיו גם **השוואה**
 *     (‎< <= > >= === !==‎ — חור-אופרטור; ממולא קודם במשווים של המנוע, ראו lib.mjs › CMPS).
 *   · **"אם"** — שלושה חלקי-בסיס מבניים (שייכים למנוע, כמו החוטים — לא פועל-מטרה; הריצה שלהם ב-lib.mjs › BASE_FN):
 *       ‎⟨choose⟩(c, a, b)‎ — ‎c≠0 ? a : b‎ · ‎⟨range⟩(a, b, כולל)‎ — הכותרת של ‎for (let i = a; i < b; i++)‎ · ‎⟨at⟩(xs, i)‎ — ‎xs[i]‎.
 *     ‎if/else‎ ⇒ כל משתנה שהשתנה בענף = ‎choose(c, ערך-בענף-אחד, ערך-בשני)‎ · ‎c ? a : b‎ ⇒ choose · ‎return‎ מוקדם (שמירה)
 *     ⇒ ‎choose(c, מה-שהוחזר, כל-השאר)‎ · ‎!x‎ ⇒ ‎choose(x, 0, 1)‎ · ‎a && b‎ ⇒ ‎choose(a, b, a)‎ · ‎a || b‎ ⇒ ‎choose(a, a, b)‎.
 *     שני הענפים מחושבים; שגיאה בענף שלא נבחר לא מפילה (lib.mjs › "רעל") — אותה משמעות כמו בקוד.
 *   · **לולאות** — דרך צומת-הלולאה הקיים (state / next / emit / until:"stable"), בלי לשנות את graph.mjs:
 *       ‎for…of‎ / ‎for (let i…)‎ עם כל גוף (גם ‎if‎ בפנים, ‎continue‎) ⇒ המצב = כל המשתנים מבחוץ שהגוף משנה (רשומה ‎{a,b,…}‎
 *       כשיש יותר מאחד); ‎xs.push(x)‎ ⇒ ‎xs ⇐ [...xs, x]‎ (חוט ‎$cat‎) · ‎filter/some/every/map/reduce‎ עם חץ ⇒ לולאה ·
 *       "בחר את הטוב לפי ציון" (‎if (score(x) < best) { best = …; arg = x }‎) יוצא מזה לבד: מצב ‎{best, arg}‎ + choose ·
 *       ‎while (changed) { changed = false; … changed = true … }‎ / ‎do … while (changed)‎ ⇒ ‎until: "stable"‎ (הדגל עצמו =
 *       "היה שינוי" — לא נכנס למצב) · ‎while (cond) {…}‎ ⇒ ‎until: "stable"‎ עם ‎next = choose(cond, הגוף, המצב)‎.
 *   · ‎[a, ...xs]‎ ⇒ ‎$cat‎ · ‎xs.slice(a, b)‎ ⇒ ‎$slice‎ · ‎{x, y}‎ ⇒ נקודה (חוט-רשומה) — חוטים, לא חישוב.
 * מה לא: ‎break‎/‎return‎ בתוך לולאה, ‎switch/try/throw‎, פירוק-מבנים, פונקציה-בתוך-פונקציה, מחרוזות, שדות שאינם ‎x/y‎.
 * ‎Infinity‎ / ‎Number.MAX_VALUE‎ ⇒ ‎±1e308‎ (חוטים נשמרים ב-JSON, ו-Infinity אינו ערך תקין בגרף).
 *
 * הפלט: ‎{inputs, graph, labels, holes, feats}‎ — feats = מה נקרא כאן (‎if · ternary · guard · loop-if · best · until · while ·
 * filter · index-loop · math‎) — למדידה בלבד. טהור ודטרמיניסטי.
 */
import ts from 'typescript';

export const BASE = { choose: '⟨choose⟩', range: '⟨range⟩', at: '⟨at⟩' };
export const BIG = 1e308;
export const UNTIL_MAX = 20;
const ARITH = new Map([[ts.SyntaxKind.PlusToken, '+'], [ts.SyntaxKind.MinusToken, '-'], [ts.SyntaxKind.AsteriskToken, '*'], [ts.SyntaxKind.SlashToken, '/'], [ts.SyntaxKind.PercentToken, '%'], [ts.SyntaxKind.AsteriskAsteriskToken, '**']]);
const CMP = new Map([[ts.SyntaxKind.LessThanToken, '<'], [ts.SyntaxKind.LessThanEqualsToken, '<='], [ts.SyntaxKind.GreaterThanToken, '>'], [ts.SyntaxKind.GreaterThanEqualsToken, '>='], [ts.SyntaxKind.EqualsEqualsEqualsToken, '==='], [ts.SyntaxKind.EqualsEqualsToken, '==='], [ts.SyntaxKind.ExclamationEqualsEqualsToken, '!=='], [ts.SyntaxKind.ExclamationEqualsToken, '!==']]);
const ASSIGN = new Map([[ts.SyntaxKind.PlusEqualsToken, '+'], [ts.SyntaxKind.MinusEqualsToken, '-'], [ts.SyntaxKind.AsteriskEqualsToken, '*'], [ts.SyntaxKind.SlashEqualsToken, '/']]);
const MATH = new Set(['max', 'min', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'hypot', 'pow', 'sign', 'trunc', 'log', 'exp']);
const LOOPY = new Set(['map', 'filter', 'reduce', 'some', 'every']);
const FIELDS = 'abcdefgh';

class No extends Error {}
const no = (why) => { throw new No(why); };
const unwrap = (x) => { while (x && (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x) || ts.isTypeAssertionExpression?.(x) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(x)))) x = x.expression; return x; };
const isFnNode = (n) => ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n);
const idOf = (e) => { const u = unwrap(e); return u && ts.isIdentifier(u) ? u.text : null; };
const stmtsOf = (s) => (!s ? [] : ts.isBlock(s) ? [...s.statements] : [s]);
const isWireStr = (w) => typeof w === 'string' && /^[$@]/.test(w);

/** משפטים שתמיד מסתיימים ב-return (בלי לולאות). */
function alwaysReturns(list) {
  for (const s of list) {
    if (ts.isReturnStatement(s)) return true;
    if (ts.isIfStatement(s) && s.elseStatement && alwaysReturns(stmtsOf(s.thenStatement)) && alwaysReturns(stmtsOf(s.elseStatement))) return true;
    if (ts.isBlock(s) && alwaysReturns([...s.statements])) return true;
  }
  return false;
}
/** יש return איפשהו (לא בפונקציה פנימית)? */
function hasReturn(n) {
  let r = false;
  const v = (x) => { if (r || isFnNode(x)) return; if (ts.isReturnStatement(x)) { r = true; return; } ts.forEachChild(x, v); };
  if (Array.isArray(n)) n.forEach(v); else v(n);
  return r;
}
/** המשתנים שהמשפטים משנים (השמה · ‎+=‎ · ‎++‎ · ‎.push‎), לפי סדר-הופעה. */
function assignedIn(list) {
  const out = [];
  const add = (n) => { if (n && !out.includes(n)) out.push(n); };
  const v = (x) => {
    if (isFnNode(x)) return;
    if (ts.isBinaryExpression(x) && (x.operatorToken.kind === ts.SyntaxKind.EqualsToken || ASSIGN.has(x.operatorToken.kind))) add(idOf(x.left));
    if ((ts.isPostfixUnaryExpression(x) || ts.isPrefixUnaryExpression(x)) && (x.operator === ts.SyntaxKind.PlusPlusToken || x.operator === ts.SyntaxKind.MinusMinusToken)) add(idOf(x.operand));
    if (ts.isCallExpression(x)) { const c = unwrap(x.expression); if (ts.isPropertyAccessExpression(c) && c.name.text === 'push') add(idOf(c.expression)); }
    ts.forEachChild(x, v);
  };
  list.forEach(v);
  return out;
}

/**
 * פונקציה ⇒ שלד (או null). opts.maxVars — כמה משתני-חור לכל היותר.
 */
export function readFn(fn, { maxVars = 5, maxNodes = 48, onNo = null } = {}) {
  if (!fn.body) return null;
  const params = fn.parameters.map((p) => (ts.isIdentifier(p.name) && !p.dotDotDotToken ? p.name.text : null));
  if (!params.length || params.some((p) => !p)) return null;
  const used = new Map(); const vars = new Map(); const labels = []; const feats = new Set();
  let nH = 0; let nB = 0; let nL = 0;
  const top = [];
  const inp = (name) => { if (!used.has(name)) used.set(name, 'p' + params.indexOf(name)); return '$' + used.get(name); }; // ‎pK‎ = הפרמטר ה-K; ‎canonical‎ ⇒ ‎i0,i1‎ לפי סדר-הפרמטרים
  const P = (name) => ({ __p: name });
  const env0 = new Map(params.map((p) => [p, P(p)]));
  const get = (c, name) => { if (!c.env.has(name)) no('לא מוכר: ' + name); const v = c.env.get(name); if (v === FLAG) no('דגל נקרא'); return v && v.__p ? inp(v.__p) : v; };
  const hole = (label, args, c) => {
    if (!args.length || args.length > 2 || args.some((a) => a === null) || args.every((a) => typeof a === 'number')) no('חור לא תקין');
    if (!vars.has(label)) { vars.set(label, vars.size); labels.push(label); }
    const id = 'h' + nH++;
    c.nodes.push({ id, part: '□' + vars.get(label), args });
    return '@' + id;
  };
  const base = (kind, args, c) => { const id = 'b' + nB++; c.nodes.push({ id, part: BASE[kind], args }); return '@' + id; };
  const choose = (cond, a, b, c) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return a;
    if (typeof cond === 'number') return cond !== 0 ? a : b;
    return base('choose', [cond, a, b], c);
  };

  /* ═════ ביטויים ═════ */
  const w = (x0, c) => {
    const x = unwrap(x0);
    if (!x) no('ריק');
    if (ts.isIdentifier(x)) {
      if (x.text === 'undefined') return null;
      if (x.text === 'Infinity') return BIG;
      return get(c, x.text);
    }
    if (ts.isNumericLiteral(x)) return Number(x.text);
    if (x.kind === ts.SyntaxKind.TrueKeyword) return 1;
    if (x.kind === ts.SyntaxKind.FalseKeyword) return 0;
    if (x.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(x)) {
      if (x.operator === ts.SyntaxKind.MinusToken) { const v = w(x.operand, c); return typeof v === 'number' ? -v : hole('neg', [v], c); }
      if (x.operator === ts.SyntaxKind.PlusToken) return w(x.operand, c);
      if (x.operator === ts.SyntaxKind.ExclamationToken) { feats.add('if'); return choose(w(x.operand, c), 0, 1, c); }
      no('אונרי');
    }
    if (ts.isPropertyAccessExpression(x)) {
      const nm = x.name.text;
      if (ts.isIdentifier(x.expression) && x.expression.text === 'Number' && !c.env.has('Number')) {
        if (nm === 'MAX_VALUE' || nm === 'POSITIVE_INFINITY' || nm === 'MAX_SAFE_INTEGER') return BIG;
        if (nm === 'NEGATIVE_INFINITY' || nm === 'MIN_SAFE_INTEGER') return -BIG;
        no('Number.' + nm);
      }
      if (nm === 'length') return hole('.length', [w(x.expression, c)], c);
      if (nm === 'x' || nm === 'y') {
        const b = w(x.expression, c);
        if (isWireStr(b)) return b + '.' + nm;
        if (b && typeof b === 'object' && !Array.isArray(b) && nm in b && Object.keys(b).length === 2) return b[nm];
      }
      no('שדה ' + nm);
    }
    if (ts.isElementAccessExpression(x)) return base('at', [w(x.expression, c), w(x.argumentExpression, c)], c);
    if (ts.isConditionalExpression(x)) { feats.add('ternary'); return choose(w(x.condition, c), w(x.whenTrue, c), w(x.whenFalse, c), c); }
    if (ts.isBinaryExpression(x)) {
      const k = x.operatorToken.kind;
      if (ARITH.has(k)) return hole(ARITH.get(k), [w(x.left, c), w(x.right, c)], c);
      if (CMP.has(k)) { feats.add('compare'); return hole(CMP.get(k), [w(x.left, c), w(x.right, c)], c); }
      if (k === ts.SyntaxKind.AmpersandAmpersandToken) { feats.add('if'); const a = w(x.left, c); return choose(a, w(x.right, c), a, c); }
      if (k === ts.SyntaxKind.BarBarToken) { feats.add('if'); const a = w(x.left, c); return choose(a, a, w(x.right, c), c); }
      no('בינרי');
    }
    if (ts.isObjectLiteralExpression(x)) {
      const o = {};
      for (const p of x.properties) {
        if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) o[p.name.text] = w(p.initializer, c);
        else if (ts.isShorthandPropertyAssignment(p)) o[p.name.text] = w(p.name, c);
        else no('רשומה');
      }
      if (Object.keys(o).sort().join() !== 'x,y') no('רשומה שאינה נקודה');
      return { x: o.x, y: o.y };
    }
    if (ts.isArrayLiteralExpression(x)) {
      const segs = []; let cur = [];
      for (const e of x.elements) {
        if (ts.isSpreadElement(e)) { if (cur.length) segs.push(cur); cur = []; segs.push(w(e.expression, c)); }
        else cur.push(w(e, c));
      }
      if (!segs.length) return cur;
      if (cur.length) segs.push(cur);
      return segs.length === 1 ? segs[0] : { $cat: segs };
    }
    if (ts.isCallExpression(x)) {
      const f = unwrap(x.expression);
      const a0 = x.arguments[0] && unwrap(x.arguments[0]);
      if (ts.isPropertyAccessExpression(f) && LOOPY.has(f.name.text) && a0 && (ts.isArrowFunction(a0) || ts.isFunctionExpression(a0))) return methodLoop(f.name.text, w(f.expression, c), a0, x.arguments, c);
      if (x.arguments.some((a) => isFnNode(unwrap(a)))) no('פונקציה כקלט');
      if (x.arguments.some((a) => ts.isSpreadElement(a))) no('פיזור בקריאה');
      if (ts.isPropertyAccessExpression(f) && ts.isIdentifier(f.expression) && f.expression.text === 'Math' && MATH.has(f.name.text)) {
        if (/^(max|min|abs)$/.test(f.name.text)) feats.add('math');
        return hole('Math.' + f.name.text, x.arguments.map((a) => w(a, c)), c);
      }
      if (ts.isPropertyAccessExpression(f) && f.name.text === 'slice' && x.arguments.length >= 1 && x.arguments.length <= 2) {
        const l = w(f.expression, c); const ab = x.arguments.map((a) => w(a, c));
        if (ab.some((v) => v === null)) no('slice');
        return { $slice: [l, ...ab] };
      }
      if (ts.isPropertyAccessExpression(f) && f.name.text === 'concat' && x.arguments.length === 1) return { $cat: [w(f.expression, c), w(x.arguments[0], c)] };
      if (ts.isIdentifier(f)) return hole('call:' + f.text, x.arguments.map((a) => w(a, c)), c);
      if (ts.isPropertyAccessExpression(f)) return hole('.' + f.name.text + '()', [w(f.expression, c), ...x.arguments.map((a) => w(a, c))], c);
    }
    no('ביטוי ' + ts.SyntaxKind[x.kind]);
  };

  /* ═════ לולאות ═════ */
  /** צומת-לולאה. carried = שמות המשתנים מבחוץ שהגוף משנה; body(inner) ⇒ מעדכן את inner.env (ו/או מחזיר emit). */
  const loopNode = ({ over, carried, item, index, body, emit = false, until = false, cond = null }, c) => {
    if (c.depth >= 2) no('לולאה בעומק 3');
    if (over === null || typeof over === 'number') no('over');
    const d = c.depth; const sfx = d ? String(d) : '';
    const IT = 'it' + sfx; const ST = 'st' + sfx; const IX = 'ix' + sfx;
    const id = 'L' + nL++;
    const env = new Map(c.env);
    if (item) env.set(item, '$' + IT);
    if (index) env.set(index, '$' + IX);
    const many = carried.length > 1;
    const init = emit ? 0 : many ? Object.fromEntries(carried.map((v, k) => [FIELDS[k], get(c, v)])) : carried.length ? get(c, carried[0]) : no('לולאה בלי מצב');
    if (!emit) carried.forEach((v, k) => env.set(v, many ? '$' + ST + '.' + FIELDS[k] : '$' + ST));
    const inner = { env, nodes: [], depth: d + 1, inLoop: true };
    const cw = cond ? cond(inner) : null; // התנאי של while — על המצב בתחילת הסיבוב
    const em = body(inner);
    let next = emit ? '$' + ST : many ? Object.fromEntries(carried.map((v, k) => [FIELDS[k], get(inner, v)])) : get(inner, carried[0]);
    if (cond) next = choose(cw, next, '$' + ST, inner);
    const L = { over, init, item: IT, state: ST, nodes: inner.nodes };
    if (index) L.index = IX;
    L.next = next;
    if (emit) L.emit = em;
    if (until) { L.until = 'stable'; L.max = UNTIL_MAX; }
    c.nodes.push({ id, loop: L });
    if (emit) return '@' + id + '.emits';
    carried.forEach((v, k) => c.env.set(v, '@' + id + '.state' + (many ? '.' + FIELDS[k] : '')));
    return null;
  };
  const arrowParams = (a) => a.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : no('פרמטר')));
  /** גוף של חץ ⇒ חוט (ביטוי, או בלוק שמסתיים ב-return) בסביבה inner. */
  const arrowValue = (a, inner) => (ts.isBlock(a.body) ? block([...a.body.statements], inner, true) : w(a.body, inner));
  const methodLoop = (m, over, a, args, c) => {
    const ps = arrowParams(a);
    if (m === 'map') {
      if (args.length !== 1 || ps.length < 1 || ps.length > 2) no('map');
      return loopNode({ over, carried: [], item: ps[0], index: ps[1], emit: true, body: (inner) => arrowValue(a, inner) }, c);
    }
    if (m === 'reduce') {
      if (args.length !== 2 || ps.length < 2 || ps.length > 3) no('reduce');
      const S = '__acc' + nL; c.env.set(S, w(args[1], c));
      loopNode({ over, carried: [S], item: ps[1], index: ps[2], body: (inner) => { inner.env.set(ps[0], get(inner, S)); inner.env.set(S, arrowValue(a, inner)); } }, c);
      return get(c, S);
    }
    if (args.length !== 1 || ps.length < 1 || ps.length > 2) no(m);
    const S = '__' + m + nL;
    c.env.set(S, m === 'filter' ? [] : m === 'some' ? 0 : 1);
    if (m === 'filter') feats.add('filter');
    loopNode({ over, carried: [S], item: ps[0], index: ps[1], body: (inner) => {
      const t = arrowValue(a, inner); const st = get(inner, S);
      const IT = inner.env.get(ps[0]);
      inner.env.set(S, m === 'filter' ? choose(t, { $cat: [st, [IT]] }, st, inner) : m === 'some' ? choose(t, 1, st, inner) : choose(t, st, 0, inner));
    } }, c);
    return get(c, S);
  };

  /* ═════ משפטים ═════ */
  const FLAG = { __flag: 1 };
  const copy = (c) => ({ ...c, env: new Map(c.env) });
  /** מאחד שני ענפים: כל משתנה שהיה קיים לפני ושונה ⇒ choose. */
  const merge = (c, cond, A, B) => {
    for (const k of c.env.keys()) {
      const a = A.env.get(k); const b = B.env.get(k);
      if (a === FLAG || b === FLAG) continue;
      if (JSON.stringify(a) !== JSON.stringify(b)) c.env.set(k, choose(cond, a && a.__p ? inp(a.__p) : a, b && b.__p ? inp(b.__p) : b, c));
    }
  };
  /**
   * רשימת-משפטים בסביבה c. fnTail = זה סוף הפונקציה (חייב להחזיר). מחזיר את החוט שהוחזר, או undefined (נפל-דרך).
   * הצמתים נכתבים ל-c.nodes לפי הסדר (שני הענפים — לפני ה-choose שלהם).
   */
  function block(list, c, fnTail) {
    for (let k = 0; k < list.length; k++) {
      const s = list[k];
      if (ts.isReturnStatement(s)) { if (c.inLoop) no('return בלולאה'); if (!s.expression) no('return ריק'); return w(s.expression, c); }
      if (ts.isEmptyStatement(s)) continue;
      if (ts.isBlock(s)) { const r = block([...s.statements], c, fnTail && k === list.length - 1); if (r !== undefined) return r; continue; }
      if (ts.isVariableStatement(s)) {
        for (const d of s.declarationList.declarations) {
          if (!ts.isIdentifier(d.name)) no('פירוק');
          c.env.set(d.name.text, d.initializer ? w(d.initializer, c) : null);
        }
        continue;
      }
      if (ts.isExpressionStatement(s)) { stmtExpr(unwrap(s.expression), c); continue; }
      if (ts.isIfStatement(s)) {
        const cond = w(s.expression, c);
        const T = stmtsOf(s.thenStatement); const E = stmtsOf(s.elseStatement);
        const rest = list.slice(k + 1);
        // continue בתוך לולאה: ‎if (c) continue;‎ ⇒ כל השאר רק כשהתנאי לא מתקיים
        if (c.inLoop && T.length === 1 && ts.isContinueStatement(T[0]) && !E.length) {
          feats.add('loop-if');
          const B = copy(c); block(rest, B, false);
          merge(c, cond, c, B); // A = c (לא השתנה)
          return undefined;
        }
        if (hasReturn(T) || hasReturn(E)) {
          if (c.inLoop) no('return בלולאה');
          const tR = alwaysReturns(T); const eR = alwaysReturns(E);
          if (!tR && !eR) no('return חלקי');
          feats.add(!s.elseStatement && tR && isGuard(T) ? 'guard' : 'if');
          const A = copy(c); const B = copy(c);
          const ra = block(tR ? T : [...T, ...rest], A, true);
          const rb = block(eR ? E : [...E, ...rest], B, true);
          if (ra === undefined || rb === undefined) no('ענף בלי return');
          if (tR && eR && rest.length) { /* קוד מת אחרי if/else שמחזירים */ }
          return choose(cond, ra, rb, c);
        }
        if (T.some((x) => ts.isContinueStatement(x) || ts.isBreakStatement(x)) || E.some((x) => ts.isContinueStatement(x) || ts.isBreakStatement(x))) no('continue/break חלקי');
        feats.add(c.inLoop ? 'loop-if' : 'if');
        if (c.inLoop && isBestIf(s, cond, c)) feats.add('best');
        const A = copy(c); const B = copy(c);
        block(T, A, false); block(E, B, false);
        merge(c, cond, A, B);
        continue;
      }
      if (ts.isForOfStatement(s)) {
        const d = s.initializer;
        const item = d && ts.isVariableDeclarationList(d) && d.declarations.length === 1 && ts.isIdentifier(d.declarations[0].name) ? d.declarations[0].name.text : no('for-of');
        const body = stmtsOf(s.statement);
        const carried = assignedIn(body).filter((v) => c.env.has(v) && v !== item && c.env.get(v) !== FLAG);
        loopNode({ over: w(s.expression, c), carried, item, body: (inner) => block(body, inner, false) }, c);
        continue;
      }
      if (ts.isForStatement(s)) { forIndex(s, c); continue; }
      if (ts.isWhileStatement(s) || ts.isDoStatement(s)) { whileLoop(s, c); continue; }
      if (ts.isContinueStatement(s) && c.inLoop && k === list.length - 1) continue;
      no('משפט ' + ts.SyntaxKind[s.kind]);
    }
    if (fnTail) no('סוף בלי return');
    return undefined;
  }
  /** ‎if (score < best) { best = score; arg = x; }‎ — תנאי-השוואה מול משתנה-מצב, והגוף מעדכן ≥1 משתני-מצב. */
  const isBestIf = (s, cond, c) => {
    const e = unwrap(s.expression);
    if (!ts.isBinaryExpression(e) || !CMP.has(e.operatorToken.kind)) return false;
    const st = (n) => { const id = idOf(n); return id && typeof c.env.get(id) === 'string' && /^\$st/.test(c.env.get(id)); };
    return (st(e.left) || st(e.right)) && assignedIn(stmtsOf(s.thenStatement)).some((v) => typeof c.env.get(v) === 'string' && /^\$st/.test(c.env.get(v)));
  };
  const isGuard = (T) => T.length === 1 && ts.isReturnStatement(T[0]);
  function stmtExpr(e, c) {
    if (ts.isBinaryExpression(e) && (e.operatorToken.kind === ts.SyntaxKind.EqualsToken || ASSIGN.has(e.operatorToken.kind))) {
      const v = idOf(e.left); if (!v || !c.env.has(v)) no('השמה');
      if (c.env.get(v) === FLAG) return; // דגל ‎changed = true‎ — זה "היה שינוי"; until:"stable" כבר מודד את זה
      const rhs = w(e.right, c);
      c.env.set(v, e.operatorToken.kind === ts.SyntaxKind.EqualsToken ? rhs : hole(ASSIGN.get(e.operatorToken.kind), [get(c, v), rhs], c));
      return;
    }
    if ((ts.isPostfixUnaryExpression(e) || ts.isPrefixUnaryExpression(e)) && (e.operator === ts.SyntaxKind.PlusPlusToken || e.operator === ts.SyntaxKind.MinusMinusToken)) {
      const v = idOf(e.operand); if (!v || !c.env.has(v)) no('++');
      c.env.set(v, hole(e.operator === ts.SyntaxKind.PlusPlusToken ? '+' : '-', [get(c, v), 1], c));
      return;
    }
    if (ts.isCallExpression(e)) {
      const f = unwrap(e.expression);
      if (ts.isPropertyAccessExpression(f) && f.name.text === 'push') {
        const v = idOf(f.expression); if (!v || !c.env.has(v)) no('push');
        if (e.arguments.some((a) => ts.isSpreadElement(a))) no('push…');
        c.env.set(v, { $cat: [get(c, v), e.arguments.map((a) => w(a, c))] });
        return;
      }
    }
    no('ביטוי-משפט');
  }
  /** ‎for (let i = A; i < B; i++)‎ ⇒ לולאה על ‎⟨range⟩(A, B, כולל)‎. */
  function forIndex(s, c) {
    const d = s.initializer;
    if (!d || !ts.isVariableDeclarationList(d) || d.declarations.length !== 1 || !ts.isIdentifier(d.declarations[0].name) || !d.declarations[0].initializer) no('for');
    const i = d.declarations[0].name.text;
    const cond = s.condition && unwrap(s.condition);
    if (!cond || !ts.isBinaryExpression(cond) || idOf(cond.left) !== i || ![ts.SyntaxKind.LessThanToken, ts.SyntaxKind.LessThanEqualsToken].includes(cond.operatorToken.kind)) no('for תנאי');
    const inc = s.incrementor && unwrap(s.incrementor);
    const ok = inc && (((ts.isPostfixUnaryExpression(inc) || ts.isPrefixUnaryExpression(inc)) && inc.operator === ts.SyntaxKind.PlusPlusToken && idOf(inc.operand) === i)
      || (ts.isBinaryExpression(inc) && inc.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken && idOf(inc.left) === i && ts.isNumericLiteral(unwrap(inc.right)) && unwrap(inc.right).text === '1'));
    if (!ok) no('for צעד');
    const body = stmtsOf(s.statement);
    if (assignedIn(body).includes(i)) no('for משנה את i');
    feats.add('index-loop');
    const over = base('range', [w(d.declarations[0].initializer, c), w(cond.right, c), cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken ? 1 : 0], c);
    const carried = assignedIn(body).filter((v) => c.env.has(v) && c.env.get(v) !== FLAG);
    loopNode({ over, carried, item: i, body: (inner) => block(body, inner, false) }, c);
  }
  /** ‎while (changed) { changed = false; … }‎ / ‎do {…} while (changed)‎ ⇒ until:"stable" · ‎while (cond)‎ ⇒ until + choose. */
  function whileLoop(s, c) {
    const body = stmtsOf(s.statement);
    const f = idOf(s.expression);
    const first = body[0] && ts.isExpressionStatement(body[0]) && ts.isBinaryExpression(unwrap(body[0].expression)) ? unwrap(body[0].expression) : null;
    const isFlag = f && c.env.has(f) && first && first.operatorToken.kind === ts.SyntaxKind.EqualsToken && idOf(first.left) === f && [ts.SyntaxKind.FalseKeyword].includes(unwrap(first.right).kind);
    if (isFlag) {
      feats.add('until');
      c.env.set(f, FLAG);
      const rest = body.slice(1);
      const carried = assignedIn(rest).filter((v) => c.env.has(v) && v !== f && c.env.get(v) !== FLAG);
      loopNode({ over: [0], carried, item: null, until: true, body: (inner) => block(rest, inner, false) }, c);
      c.env.delete(f);
      return;
    }
    if (ts.isDoStatement(s)) no('do בלי דגל');
    if (s.expression.kind === ts.SyntaxKind.TrueKeyword) no('while(true)');
    feats.add('while');
    const carried = assignedIn(body).filter((v) => c.env.has(v) && c.env.get(v) !== FLAG);
    loopNode({ over: [0], carried, item: null, until: true, cond: (inner) => w(s.expression, inner), body: (inner) => block(body, inner, false) }, c);
  }

  const c0 = { env: env0, nodes: top, depth: 0, inLoop: false };
  let out;
  try {
    out = ts.isBlock(fn.body) ? block([...fn.body.statements], c0, true) : w(fn.body, c0);
  } catch (e) { if (e instanceof No) { if (onNo) onNo(e.message); return null; } throw e; }
  if (!isWireStr(out) || !out.startsWith('@')) return null;
  const g = canonical({ inputs: [...used.values()].sort(), nodes: top, out }, labels);
  if (!g) return null;
  const nHoles = holesIn(g.graph).length;
  const nBase = baseIn(g.graph).length;
  if (nHoles < 1 || nHoles + nBase < 2 || g.labels.length > maxVars || g.graph.inputs.length < 1 || g.graph.inputs.length > 2 || allNodes(g.graph).length > maxNodes) return null;
  return { inputs: g.graph.inputs.length, graph: g.graph, labels: g.labels, holes: g.labels.length, feats: [...feats].sort() };
}

/* ═════ ניקוי + שמות קנוניים ═════ */
const allNodes = (g) => { const out = []; const walk = (ns) => { for (const n of ns) { out.push(n); if (n.loop) walk(n.loop.nodes); } }; walk(g.nodes); return out; };
const holesIn = (g) => allNodes(g).filter((n) => n.part && n.part.startsWith('□'));
const baseIn = (g) => allNodes(g).filter((n) => n.part && n.part.startsWith('⟨'));
function refsIn(w, acc) {
  if (typeof w === 'string') { const m = /^@(\w+)/.exec(w); if (m) acc.set(m[1], (acc.get(m[1]) || 0) + 1); }
  else if (Array.isArray(w)) w.forEach((x) => refsIn(x, acc));
  else if (w && typeof w === 'object') Object.values(w).forEach((x) => refsIn(x, acc));
  return acc;
}
const wiresOfNode = (n) => (n.loop ? [n.loop.over, n.loop.init, n.loop.next, n.loop.emit] : [n.args]);
/** מסיר צמתים שאף אחד לא קורא (קוד שלא משפיע על הפלט), ונותן שמות קנוניים (צמתים, משתני-חור, קלטים) לפי סדר-הופעה. */
function canonical(g, labels) {
  for (;;) {
    const acc = new Map(); refsIn(g.out, acc);
    for (const n of allNodes(g)) for (const x of wiresOfNode(n)) refsIn(x, acc);
    let changed = false;
    const prune = (ns) => ns.filter((n) => { if (n.loop) n.loop.nodes = prune(n.loop.nodes); if (acc.has(n.id)) return true; changed = true; return false; });
    g.nodes = prune(g.nodes);
    if (!changed) break;
  }
  // שמות: לולאה ⇒ L0.., חור ⇒ h0.., בסיס ⇒ b0.. לפי סדר-הופעה; משתני-חור ⇒ לפי סדר-הופעה; קלטים ⇒ לפי סדר-הופעה בחוטים
  const ren = new Map(); let h = 0; let b = 0; let l = 0;
  const vmap = new Map(); const newLabels = [];
  for (const n of allNodes(g)) {
    if (n.loop) ren.set(n.id, 'L' + l++);
    else if (n.part.startsWith('□')) { ren.set(n.id, 'h' + h++); const v = Number(n.part.slice(1)); if (!vmap.has(v)) { vmap.set(v, vmap.size); newLabels.push(labels[v]); } }
    else ren.set(n.id, 'b' + b++);
  }
  // קלטים: רק מה שנשאר בשימוש אחרי הניקוי, לפי סדר-הפרמטרים של הפונקציה
  const usedP = new Set(); const scan = (w) => { if (typeof w === 'string') { const m = /^\$(p\d+)/.exec(w); if (m) usedP.add(m[1]); } else if (w && typeof w === 'object') Object.values(w).forEach(scan); };
  scan(g.out); for (const n of allNodes(g)) wiresOfNode(n).forEach(scan);
  const imap = new Map(g.inputs.filter((p) => usedP.has(p)).map((p, k) => [p, 'i' + k]));
  const rw = (w) => {
    if (typeof w === 'string') {
      const m = /^([$@])(\w+)(.*)$/.exec(w);
      if (!m) return w;
      if (m[1] === '@') return '@' + ren.get(m[2]) + m[3];
      if (/^p\d+$/.test(m[2])) return '$' + imap.get(m[2]) + m[3];
      return w;
    }
    if (Array.isArray(w)) return w.map(rw);
    if (w && typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, rw(v)]));
    return w;
  };
  const walk = (ns) => ns.map((n) => {
    if (!n.loop) return { id: ren.get(n.id), part: n.part.startsWith('□') ? '□' + vmap.get(Number(n.part.slice(1))) : n.part, args: rw(n.args) };
    const L = n.loop; const o = { over: rw(L.over), init: rw(L.init), item: L.item, state: L.state };
    const inner = walk(L.nodes);
    if (L.index) o.index = L.index;
    o.nodes = inner; o.next = rw(L.next);
    if (L.emit !== undefined) o.emit = rw(L.emit);
    if (L.until) { o.until = L.until; o.max = L.max; }
    return { id: ren.get(n.id), loop: o };
  });
  const nodes = walk(g.nodes);
  const out = rw(g.out);
  const inputs = [...imap.values()];
  if (inputs.length > 2) return null;
  if (!inputs.length) return null;
  return { graph: { inputs, nodes, out }, labels: newLabels };
}
