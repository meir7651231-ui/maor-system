/**
 * 🔓 פותח-הפונקציות (INNER, 14.10.2026) — הרמה הבאה של המפרק.
 *
 * בתוך פונקציה גדולה יש ערכים-בדרך: `const decl = …` בדרך לשעת-הזריחה, `const pulse = …` בתוך לולאת-ציור.
 * קטלוג של פונקציות שלמות לא רואה אותם. הפותח מוצא כל ערך כזה (בכל עומק — גם בתוך callback, useEffect,
 * requestAnimationFrame, map/reduce), חותך אחורה את מה שהוא תלוי בו (backward slice), ובונה ממנו פונקציה טהורה
 * עומדת-בפני-עצמה: הקלטים = המשתנים החופשיים שלה; הגוף = ההצהרות שהיא צריכה + העוזרים הטהורים מאותו קובץ.
 *
 * שלושה סוגי ערכים:
 *   · value       — `const x = <ביטוי>` (או let שלא משתנה) בתוך פונקציה.
 *   · accumulator — `let best = null` שמתעדכן רק בתוך לולאה אחת שאחריו ⇒ הערך שלו אחרי הלולאה.
 *   · envelope    — רצף קריאות-אוטומציה על AudioParam (setValueAtTime / linearRamp… / exponentialRamp… /
 *                   setTargetAtTime) ⇒ פונקציה טהורה של הזמן: מה הערך ברגע `when` (לפי המפרט של Web Audio).
 * ושתי צורות: slice (הקלטים = קלטי-הפונקציה העוטפת) ו-step (הקלטים = המשתנים שהביטוי עצמו קורא — הנוסחה עצמה).
 *
 * מה לא מורם (ונספר לפי סיבה): await · this · שעון · אקראי · DOM/IO · קריאה לפונקציה לא-ידועה/מיובאת · שינוי של
 * משהו מבחוץ · לולאה שלא נחתכת בבטחה. תלות לא-טהורה (useState, ref.current, Date.now()) **לא** מפילה את הערך —
 * היא נחתכת והופכת לקלט (הזרקה): הערך שאחריה טהור ביחס אליה.
 * טהור (קורא AST בלבד). לא מריץ שום קוד.
 */
import ts from 'typescript';
import { impurity, classify, symbolOf, isValueRef, homeOf, within, isPureRead, isComputation, isFnLike, unwrap, rootOf, isAssignOp } from './purity.mjs';
import { fingerprint } from '../../lib/cache.mjs';

const AUTOMATION = { setValueAtTime: 'set', linearRampToValueAtTime: 'lin', exponentialRampToValueAtTime: 'exp', setTargetAtTime: 'target' };
const PARAM_DEFAULT = { gain: 1, frequency: 440, detune: 0, Q: 1, playbackRate: 1, pan: 0, delayTime: 0, offset: 1, threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 };
const LOOP = (n) => ts.isForOfStatement(n) || ts.isForInStatement(n) || ts.isForStatement(n);
const MAX_TEXT = 20000;

/** שם לפונקציה עוטפת (לשרשרת-הסמל). */
function fnName(fn, sf) {
  if (fn.name && ts.isIdentifier(fn.name)) return fn.name.text;
  if (fn.name && (ts.isStringLiteral(fn.name) || ts.isNumericLiteral(fn.name))) return fn.name.text.replace(/\W+/g, '_') || 'fn';
  const p = fn.parent;
  if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
  if (p && ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return p.name.text.replace(/\W+/g, '_') || 'fn';
  if (p && ts.isBinaryExpression(p) && p.right === fn) { const l = p.left.getText(sf); return l.replace(/^.*\./, '').replace(/\W+/g, '_') || 'fn'; }
  if (p && (ts.isCallExpression(p) || ts.isNewExpression(p))) {
    const c = unwrap(p.expression);
    if (ts.isIdentifier(c)) return c.text;
    if (ts.isPropertyAccessExpression(c)) return c.name.text;
    return 'call';
  }
  if (p && ts.isExportAssignment(p)) return 'default';
  return 'fn';
}
/** הסמל של החלק-ההורה (הפונקציה ברמה העליונה) + השרשרת הפנימית. */
function chainOf(node, sf) {
  const fns = [];
  let x = node.parent;
  let cls = null;
  while (x && !ts.isSourceFile(x)) {
    if (isFnLike(x)) fns.unshift(x);
    if ((ts.isClassDeclaration(x) || ts.isClassExpression(x)) && !cls) cls = x;
    x = x.parent;
  }
  if (!fns.length) return null;
  const top = fns[0];
  let topName = fnName(top, sf);
  if (ts.isMethodDeclaration(top) || ts.isConstructorDeclaration(top) || ts.isGetAccessorDeclaration(top) || ts.isSetAccessorDeclaration(top)) {
    const c = top.parent;
    const cn = c && c.name ? c.name.text : c && c.parent && ts.isVariableDeclaration(c.parent) ? c.parent.name.getText(sf) : 'class';
    topName = cn + '.' + (ts.isConstructorDeclaration(top) ? 'constructor' : topName);
  } else if (cls && within(top, cls)) topName = (cls.name ? cls.name.text : 'class') + '.' + topName;
  return { top: topName, mids: fns.slice(1).map((f) => fnName(f, sf)), home: fns[fns.length - 1] };
}

/** כל הכתיבות בקובץ: סמל ⇒ [{node, kind: reassign|member|method}]. */
function writesOf(sf, checker) {
  const W = new Map();
  const add = (target, node) => {
    const t = unwrap(target);
    const r = rootOf(t);
    if (!ts.isIdentifier(r)) return;
    const s = symbolOf(checker, r);
    if (!s) return;
    if (!W.has(s)) W.set(s, []);
    W.get(s).push({ node, kind: t === r ? 'reassign' : 'member' });
  };
  const visit = (n) => {
    if (ts.isBinaryExpression(n) && isAssignOp(n.operatorToken.kind)) {
      const L = unwrap(n.left);
      if (ts.isObjectLiteralExpression(L)) for (const p of L.properties) add(ts.isShorthandPropertyAssignment(p) ? p.name : ts.isPropertyAssignment(p) ? p.initializer : p, n);
      else if (ts.isArrayLiteralExpression(L)) for (const e of L.elements) add(ts.isSpreadElement(e) ? e.expression : e, n);
      else add(L, n);
    } else if ((ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) add(n.operand, n);
    else if (ts.isDeleteExpression(n)) add(n.expression, n);
    else if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && /^(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin|set|add|delete|clear)$/.test(n.expression.name.text)) {
      const r = rootOf(n.expression.expression);
      if (ts.isIdentifier(r)) { const s = symbolOf(checker, r); if (s) { if (!W.has(s)) W.set(s, []); W.get(s).push({ node: n, kind: 'method' }); } }
    } else if ((ts.isForOfStatement(n) || ts.isForInStatement(n)) && !ts.isVariableDeclarationList(n.initializer)) add(n.initializer, n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return W;
}

/** המזהים בעמדת-ערך בתוך node שההצהרה שלהם מחוץ ל-node. */
function refsOf(node, checker) {
  const out = [];
  const visit = (n) => {
    if (ts.isTypeNode(n)) return;
    if (ts.isIdentifier(n) && isValueRef(n)) {
      const s = symbolOf(checker, n);
      const d = s && (s.valueDeclaration ?? s.declarations?.[0]);
      if (!(d && d.getSourceFile() === node.getSourceFile() && within(d, node))) {
        const call = ts.isCallExpression(n.parent) && unwrap(n.parent.expression) === n;
        out.push({ id: n, sym: s, call });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

/* ═══════════════ v2: מעקב-ייבוא בתוך הריפו (INNER v2, 14.10.2026) ═══════════════
 * עוזר מקובץ אחר באותו ריפו נכנס לחיתוך — אם הוא טהור לפי **אותם** חוקים (purity.mjs), בהקשר של הקובץ שלו.
 * טרנזיטיבי (עוזר שקורא לעוזר מקובץ שלישי), בטוח-מעגלים (memo + "בתהליך ⇒ טהור" כמו בעוזר מקומי), עם תקרת-עומק
 * (MAX_HOPS קפיצות-קובץ ⇒ `import-depth`), ודטרמיניסטי (סדר-הקבצים קבוע). שם-ייבוא שונה משם-ההצהרה
 * (`import { a as b }`, ‏default) ⇒ שורת-כינוי `const b = a;` במודול. ייבוא שלא נפתר לקובץ בריפו ⇒ כמו קודם.
 * ועוד: **עוזר-סגור (closure)** — פונקציה מקומית שקוראת משתנים של הפונקציה העוטפת — נכנס לגוף הפונקציה המורמת
 * כהצהרה, והמשתנים שהוא תופס נחתכים כמו כל משתנה (קלט או הצהרה). */
export const MAX_HOPS = 6;

/** הקשר לתוכנית אחת: inRepo(sf) — האם קובץ שייך לריפו (null = בלי מעקב-ייבוא). */
export function makeRepoCtx(program, inRepo = null) {
  return { program, inRepo, analyzers: new Map(), aliases: new Map(), extWrites: null };
}

const isModuleLevel = (vd) => { const st = vd.parent && vd.parent.parent; return !!st && ts.isVariableStatement(st) && ts.isSourceFile(st.parent); };
const fnInitOf = (vd) => { const i = vd.initializer && unwrap(vd.initializer); return i && (ts.isArrowFunction(i) || ts.isFunctionExpression(i)) ? i : null; };
const EMPTY = () => ({ why: null, helpers: new Set(), consts: new Set(), hops: 0 });

/** כינוי-ייבוא (שם מקומי ≠ שם ההצהרה) — אובייקט יחיד לכל זוג, כדי שזהות-הצומת תעבוד במודול. */
function aliasNode(R, local, decl, target) {
  const key = local + '=' + target + '@' + decl.getSourceFile().fileName + ':' + decl.pos;
  if (!R.aliases.has(key)) R.aliases.set(key, { alias: local, target, decl, pos: decl.pos });
  return R.aliases.get(key);
}

/** סמלים שקובץ אחר משנה דרך ייבוא (`REG.push(…)` על קבוע מיובא) — קבוע כזה הוא מצב, לא קבוע. */
function externalWrites(R) {
  if (R.extWrites) return R.extWrites;
  const out = new Set();
  const checker = R.program.getTypeChecker();
  for (const sf of R.program.getSourceFiles()) {
    if (!R.inRepo(sf)) continue;
    for (const s of analyzerFor(R, sf).W.keys()) {
      if (!(s.flags & ts.SymbolFlags.Alias)) continue;
      try { const t = checker.getAliasedSymbol(s); out.add(t); out.add(checker.getExportSymbolOfSymbol(t)); } catch { /* */ }
    }
  }
  R.extWrites = out;
  return out;
}

/** ייבוא ⇒ ההצהרה בקובץ בריפו: { k:'fn'|'var', decl, vd?, alias? } · { why } · null (לא בריפו / לא פונקציה-או-קבוע). */
function foreignOf(R, sym, name) {
  if (!R.inRepo || !sym) return null;
  const checker = R.program.getTypeChecker();
  let s = sym;
  if (s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s); } catch { return null; } }
  if (!s || s.flags & ts.SymbolFlags.Alias) return null;
  const decls = s.declarations ?? [];
  const d = decls.find((x) => ts.isFunctionDeclaration(x) && x.body) ?? s.valueDeclaration ?? decls[0];
  if (!d) return packageSpec(sym) ? { why: 'package-call' } : null; // לא נפתר: חבילה בלי טיפוסים (node:fs בלי @types/node) — לא שלנו
  const dsf = d.getSourceFile();
  // חבילה (react · firebase · …) — לא קוד שלנו; נספר בנפרד כדי שהשארית של imported-call תהיה רק "שלנו ולא נפתר"
  if (!R.inRepo(dsf)) return dsf.isDeclarationFile || /[\\/]node_modules[\\/]/.test(dsf.fileName) ? { why: 'package-call' } : null;
  let out;
  if (ts.isFunctionDeclaration(d)) {
    if (!d.body) return null;
    if (!d.name) return { why: 'imported-anon' };
    out = { k: 'fn', decl: d, declName: d.name.text };
  } else if (ts.isVariableDeclaration(d) && ts.isIdentifier(d.name) && isModuleLevel(d)) out = { k: 'var', decl: d, vd: d, declName: d.name.text };
  else return null;
  out.foreign = true;
  if (out.declName !== name) out.alias = aliasNode(R, name, d, out.declName);
  return out;
}

/** האם הייבוא מגיע מחבילה (לא נתיב יחסי/מוחלט ולא כינוי-נתיב של הריפו כמו `@/` או `~/`). */
function packageSpec(sym) {
  let x = sym && sym.declarations?.[0];
  while (x && !ts.isImportDeclaration(x) && !ts.isExportDeclaration(x)) x = x.parent;
  const m = x && x.moduleSpecifier && ts.isStringLiteral(x.moduleSpecifier) ? x.moduleSpecifier.text : null;
  return !!m && !/^(\.|\/|@\/|~\/|#)/.test(m);
}

/** `import * as U` ⇒ צומת-אובייקט אחד לכל הצהרת-ייבוא; כל `U.f` ⇒ צומת-חבר (בלי טקסט משלו) שאומר ל-U מה להכיל. */
function nsNodeOf(R, imp) {
  if (!R.nsNodes) R.nsNodes = new Map();
  if (!R.nsNodes.has(imp)) R.nsNodes.set(imp, { ns: imp.name.text, decl: imp, pos: imp.pos });
  return R.nsNodes.get(imp);
}
function nsMemberOf(R, nsNode, member, target, decl) {
  if (!R.nsMembers) R.nsMembers = new Map();
  const key = nsNode.decl.getSourceFile().fileName + ':' + nsNode.decl.pos + ':' + member + '=' + target;
  if (!R.nsMembers.has(key)) R.nsMembers.set(key, { nsm: nsNode, member, target, decl, pos: nsNode.pos });
  return R.nsMembers.get(key);
}
/**
 * הפניה `U.x` כש-U = `import * as U` מקובץ בריפו: null (לא namespace) · { why } · { k, decl, vd?, nodes:[U, U.x], call }.
 * U בלי `.x` (מועבר כערך) ⇒ לא נפתר.
 */
function nsRefOf(R, id, sym) {
  if (!R.inRepo || !sym || !(sym.flags & ts.SymbolFlags.Alias)) return null;
  const imp = sym.declarations?.[0];
  if (!imp || !ts.isNamespaceImport(imp)) return null;
  const p = id.parent;
  if (!(ts.isPropertyAccessExpression(p) && p.expression === id && ts.isIdentifier(p.name))) return { why: 'imported-namespace' };
  const ms = R.program.getTypeChecker().getSymbolAtLocation(p.name);
  const f = ms && foreignOf(R, ms, p.name.text);
  if (!f) return { why: packageSpec(sym) ? 'package-call' : 'imported-namespace' };
  if (f.why) return f;
  const U = nsNodeOf(R, imp);
  const call = ts.isCallExpression(p.parent) && p.parent.expression === p;
  return { k: f.k, decl: f.decl, vd: f.vd, call, nodes: [U, nsMemberOf(R, U, p.name.text, f.declName, f.decl)] };
}

/** מנתח לקובץ אחד (memo בהקשר): הכתיבות, העוזרים והקבועים שלו — לפי אותם חוקים בכל קובץ. */
export function analyzerFor(R, sf) {
  if (R.analyzers.has(sf)) return R.analyzers.get(sf);
  const { program } = R;
  const checker = program.getTypeChecker();
  const A = { sf, checker, W: null };
  R.analyzers.set(sf, A);
  A.W = writesOf(sf, checker);
  const writesIn = (sym) => A.W.get(sym) ?? [];
  A.writesIn = writesIn;
  const helperMemo = new Map();
  const constMemo = new Map();
  const closureMemo = new Map();
  const isConstList = (vd) => !!(vd.parent && ts.isVariableDeclarationList(vd.parent) && vd.parent.flags & ts.NodeFlags.Const);

  /** סיווג עם מעקב-ייבוא: ייבוא שנפתר ⇒ fn/var של הקובץ השני (+כינוי). */
  A.classify = (sym, name) => {
    const c = classify(checker, program, sf, sym, name);
    if (c.k !== 'import') return c;
    return foreignOf(R, sym, name) ?? c;
  };
  const otherFile = (decl) => decl.getSourceFile() !== sf;
  const mergeInto = (info, o, decl) => {
    if (o.why && !info.why) info.why = o.why;
    for (const h of o.helpers) info.helpers.add(h);
    for (const k of o.consts) info.consts.add(k);
    info.hops = Math.max(info.hops, (o.hops ?? 0) + (decl && otherFile(decl) ? 1 : 0));
    if (info.hops > MAX_HOPS && !info.why) info.why = 'import-depth';
  };
  A.mergeInto = mergeInto;

  /** עוזר (פונקציה): טהור וסגור? מחזיר {why, helpers:Set, consts:Set, hops}. */
  A.helperInfo = (decl) => {
    if (otherFile(decl)) return analyzerFor(R, decl.getSourceFile()).helperInfo(decl);
    if (helperMemo.has(decl)) return helperMemo.get(decl) ?? EMPTY();
    helperMemo.set(decl, null); // בתהליך (רקורסיה) ⇒ נחשב טהור
    const info = { why: null, helpers: new Set([decl]), consts: new Set(), hops: 0 };
    const fn = ts.isVariableDeclaration(decl) ? fnInitOf(decl) : decl;
    if (!fn || !fn.body) info.why = 'no-body';
    if (!info.why) info.why = impurity(fn, A.ctx);
    if (!info.why) {
      for (const r of refsOf(fn, checker)) {
        const c = A.classify(r.sym, r.id.text);
        if (c.why) { info.why = info.why || (r.call ? c.why : 'imported-value'); continue; }
        if (c.alias) info.helpers.add(c.alias);
        if (c.k === 'global') continue;
        if (c.k === 'fn') { mergeInto(info, A.helperInfo(c.decl), c.decl); continue; }
        if (c.k === 'var') {
          if (fnInitOf(c.vd)) { mergeInto(info, A.helperInfo(c.vd), c.vd); continue; }
          if (isModuleLevel(c.vd)) { mergeInto(info, A.constInfo(c.vd), c.vd); continue; }
          info.why = info.why || 'closure-helper';
          continue;
        }
        if (c.k === 'param') { info.why = info.why || 'closure-helper'; continue; }
        if (c.k === 'import') {
          const ns = nsRefOf(R, r.id, r.sym);
          if (ns && !ns.why) {
            const fnl = ns.k === 'fn' || !!fnInitOf(ns.vd);
            if (!fnl && ns.call) { info.why = info.why || 'imported-state'; continue; }
            for (const n of ns.nodes) info.helpers.add(n);
            mergeInto(info, fnl ? A.helperInfo(ns.decl) : A.constInfo(ns.decl), ns.decl);
            continue;
          }
          info.why = info.why || (ns ? ns.why : r.call ? 'imported-call' : 'imported-value'); continue;
        }
        info.why = info.why || c.k;
      }
    }
    helperMemo.set(decl, info);
    return info;
  };
  /** קבוע ברמת-הקובץ: טהור, לא משתנה בשום מקום (גם לא מקובץ אחר דרך ייבוא), וכל מה שהוא קורא כלול גם הוא. */
  A.constInfo = (vd) => {
    if (otherFile(vd)) return analyzerFor(R, vd.getSourceFile()).constInfo(vd);
    if (constMemo.has(vd)) return constMemo.get(vd) ?? EMPTY();
    constMemo.set(vd, null);
    const info = { why: null, helpers: new Set(), consts: new Set([vd]), hops: 0 };
    if (!vd.initializer) info.why = 'module-state';
    const names = [];
    const collect = (b) => { if (ts.isIdentifier(b)) names.push(b); else for (const e of b.elements) if (!ts.isOmittedExpression(e)) collect(e.name); };
    collect(vd.name);
    for (const id of names) {
      const s = checker.getSymbolAtLocation(id);
      if (s && writesIn(s).length) info.why = info.why || 'module-state';
      if (s && R.inRepo && (externalWrites(R).has(s) || externalWrites(R).has(checker.getExportSymbolOfSymbol(s)))) info.why = info.why || 'module-state';
    }
    if (!isConstList(vd) && !info.why) { /* let/var ברמת-הקובץ שלא נכתב — מותר */ }
    if (!info.why) info.why = impurity(vd.initializer, A.ctx) ? 'module-state' : null;
    if (!info.why) {
      for (const r of refsOf(vd.initializer, checker)) {
        const c = A.classify(r.sym, r.id.text);
        if (c.why) { info.why = info.why || 'module-state'; continue; }
        if (c.alias) info.helpers.add(c.alias);
        if (c.k === 'global') continue;
        if (c.k === 'fn') { mergeInto(info, A.helperInfo(c.decl), c.decl); continue; }
        if (c.k === 'var' && isModuleLevel(c.vd)) { mergeInto(info, fnInitOf(c.vd) ? A.helperInfo(c.vd) : A.constInfo(c.vd), c.vd); continue; }
        if (c.k === 'import') {
          const ns = nsRefOf(R, r.id, r.sym);
          if (ns && !ns.why && !(ns.call && ns.k === 'var' && !fnInitOf(ns.vd))) {
            const fnl = ns.k === 'fn' || !!fnInitOf(ns.vd);
            for (const n of ns.nodes) info.helpers.add(n);
            mergeInto(info, fnl ? A.helperInfo(ns.decl) : A.constInfo(ns.decl), ns.decl);
            continue;
          }
        }
        info.why = info.why || 'module-state';
      }
    }
    constMemo.set(vd, info);
    return info;
  };
  /** עוזר-סגור שאפשר להכניס לגוף: מקומי (לא ברמת-הקובץ), לא מוחלף, וגופו טהור (תפיסות ייחתכו בחיתוך). */
  A.closureOk = (decl) => {
    if (otherFile(decl)) return false;
    if (closureMemo.has(decl)) return closureMemo.get(decl) ?? true;
    closureMemo.set(decl, null);
    let ok = true;
    const fn = ts.isVariableDeclaration(decl) ? fnInitOf(decl) : decl;
    if (!fn || !fn.body) ok = false;
    if (ok && ts.isVariableDeclaration(decl) && (isModuleLevel(decl) || !ts.isIdentifier(decl.name))) ok = false;
    if (ok && ts.isFunctionDeclaration(decl) && (!decl.name || ts.isSourceFile(decl.parent))) ok = false;
    if (ok) { const s = checker.getSymbolAtLocation(decl.name); if (!s || writesIn(s).length) ok = false; }
    if (ok && impurity(fn, A.ctx)) ok = false;
    closureMemo.set(decl, ok);
    return ok;
  };
  A.ctx = {
    checker, program, sf, mutable: null,
    helper: (decl) => { const w = A.helperInfo(decl).why; return w === 'closure-helper' && A.closureOk(decl) ? null : w; },
    foreign: R.inRepo ? (sym, name) => {
      const f = foreignOf(R, sym, name);
      if (!f) return null;
      if (f.why) return f;
      return { decl: f.decl, fnLike: f.k === 'fn' || !!fnInitOf(f.vd) };
    } : null,
    /** U.f(…) כש-U = `import * as U` מקובץ בריפו: null (לא namespace) · { why } · { decl, fnLike } */
    nsCall: R.inRepo ? (recvId, sym) => {
      const ns = nsRefOf(R, recvId, sym);
      if (!ns || ns.why) return ns;
      return { decl: ns.decl, fnLike: ns.k === 'fn' || !!fnInitOf(ns.vd) };
    } : null,
  };
  return A;
}

/**
 * פותח קובץ אחד. מחזיר { lifts, skips, candidates }.
 * lift = { kind, form, top, symbol, value, line, home, params[{name, sym, decl}], stmts[node], closures:Set, helpers[decl|alias], consts[vd], ret, envelope? }
 * repo = הקשר מ-makeRepoCtx (בלי ⇒ קובץ בודד, בלי מעקב-ייבוא).
 */
export function openFile({ program, sf, repo }) {
  const R = repo ?? makeRepoCtx(program, null);
  const A = analyzerFor(R, sf);
  const checker = A.checker;
  const writesIn = A.writesIn;
  const ctx = A.ctx;
  const helperInfo = A.helperInfo;
  const constInfo = A.constInfo;
  const skips = {};
  const skip = (w) => { skips[w] = (skips[w] ?? 0) + 1; };
  let candidates = 0;
  const lifts = [];

  /** הלולאה שבה (ורק בה) מצטבר משתנה — או null. */
  function accLoopOf(sym, vd, home) {
    const ws = writesIn(sym);
    if (!ws.length) return null;
    const st = vd.parent && vd.parent.parent;
    if (!st || !ts.isVariableStatement(st)) return null;
    const block = st.parent;
    let L = null;
    for (const w of ws) {
      if (homeOf(w.node) !== home) return null;
      let x = w.node;
      while (x && x.parent !== block) x = x.parent;
      if (!x || !LOOP(x) || x.pos < st.end) return null;
      if (L && L !== x) return null;
      L = x;
    }
    return L;
  }
  const loopWhyMemo = new Map();
  function loopWhy(L, home) {
    if (loopWhyMemo.has(L)) return loopWhyMemo.get(L);
    let why = null;
    const block = L.parent;
    const accs = new Set();
    for (const st of block.statements ?? []) {
      if (st.pos >= L.pos) break;
      if (!ts.isVariableStatement(st)) continue;
      for (const d of st.declarationList.declarations) {
        const ids = [];
        const collect = (b) => { if (ts.isIdentifier(b)) ids.push(b); else for (const e of b.elements) if (!ts.isOmittedExpression(e)) collect(e.name); };
        collect(d.name);
        for (const id of ids) { const s = checker.getSymbolAtLocation(id); if (s && accLoopOf(s, d, home) === L) accs.add(s); }
      }
    }
    const visit = (n) => {
      if (why) return;
      if (ts.isReturnStatement(n) && homeOf(n) === home) { why = 'loop-return'; return; }
      if (isFnLike(n)) return;
      ts.forEachChild(n, visit);
    };
    visit(L);
    if (!why) why = impurity(L, { ...ctx, mutable: accs });
    if (why && why !== 'loop-return') why = 'loop-' + why;
    loopWhyMemo.set(L, why);
    return why;
  }

  /**
   * חיתוך-אחורה. roots = הצמתים שהערך קורא; point = המקום בקוד שבו הערך נמדד; step = רק הנוסחה עצמה.
   * מחזיר { why } או { params, stmts, closures, helpers, consts, foreign }.
   */
  function slice(roots, point, home, { step = false, own = [] } = {}) {
    const params = new Map(); const stmts = new Set(own); const helpers = new Set(); const consts = new Set(); const closures = new Set();
    let why = null;
    let hops = 0;
    const seen = new Set();
    const addParam = (sym, name, decl) => { if (!params.has(sym)) params.set(sym, { name, sym, pos: decl ? decl.getStart(sf) : 1e12 }); };
    const mergeInfo = (o, decl) => {
      if (o.why && !why) why = o.why;
      for (const h of o.helpers) helpers.add(h);
      for (const k of o.consts) consts.add(k);
      hops = Math.max(hops, (o.hops ?? 0) + (decl && decl.getSourceFile() !== sf ? 1 : 0));
      if (hops > MAX_HOPS && !why) why = 'import-depth';
    };
    /** עוזר-סגור ⇒ הצהרה בגוף (פעם אחת), והמשתנים שהוא תופס נחתכים דרך התור. */
    const inline = (decl, fn) => { if (!stmts.has(decl)) { stmts.add(decl); closures.add(decl); queue.push(fn); } };
    const queue = [...roots];
    while (queue.length && !why) {
      const node = queue.shift();
      for (const r of refsOf(node, checker)) {
        if (why) break;
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        const c = A.classify(r.sym, r.id.text);
        if (c.why) { if (r.call) why = c.why; else addParam(r.sym, r.id.text, null); continue; }
        if (c.k === 'global') continue;
        if (c.k === 'import') {
          const ns = nsRefOf(R, r.id, r.sym);
          if (ns && !ns.why) {
            const fnl = ns.k === 'fn' || !!fnInitOf(ns.vd);
            const o = fnl ? helperInfo(ns.decl) : constInfo(ns.decl);
            if (fnl || !o.why) { if (!o.why) for (const n of ns.nodes) helpers.add(n); mergeInfo(o, ns.decl); continue; }
            if (ns.call) { why = 'imported-state'; continue; }
          } else if (ns && ns.why && ns.why !== 'imported-namespace') { why = ns.why; continue; }
          if (r.call) why = 'imported-call'; else addParam(r.sym, r.id.text, null);
          continue;
        }
        if (c.k === 'param') { if (r.call) why = 'unknown-call'; else addParam(r.sym, declName(c.decl, r.id), c.decl); continue; }
        if (c.k === 'fn') {
          const o = helperInfo(c.decl);
          if (o.why === 'closure-helper' && A.closureOk(c.decl)) { inline(c.decl, c.decl); continue; }
          if (c.alias && !o.why) helpers.add(c.alias);
          mergeInfo(o, c.decl); continue;
        }
        if (c.k !== 'var') { why = c.k; continue; }
        const vd = c.vd;
        if (c.foreign) {
          // קבוע/עוזר מקובץ אחר: פונקציה ⇒ עוזר; ערך שלא נקרא כפונקציה ⇒ קלט כמו קודם (הזרקה)
          if (fnInitOf(vd)) { const o = helperInfo(vd); if (c.alias && !o.why) helpers.add(c.alias); mergeInfo(o, vd); continue; }
          if (r.call) why = 'imported-state'; else addParam(r.sym, r.id.text, null);
          continue;
        }
        if (fnInitOf(vd)) {
          const o = helperInfo(vd);
          if (o.why === 'closure-helper' && !isModuleLevel(vd) && A.closureOk(vd) && !(ts.isIdentifier(vd.name) && writesIn(r.sym).length)) { inline(vd, fnInitOf(vd)); continue; }
          mergeInfo(o, vd); continue;
        }
        if (isModuleLevel(vd)) { const o = constInfo(vd); if (o.why) { if (r.call) why = 'unknown-call'; else addParam(r.sym, r.id.text, vd); } else mergeInfo(o, vd); continue; }
        if (r.call) { why = 'unknown-call'; continue; }
        // קבוע מילולי (const TILT = 0.6) שלא נכתב — נכנס כמו שהוא, גם מפונקציה עוטפת וגם בצורת step
        if (!writesIn(r.sym).length && vd.initializer && isLiteral(vd.initializer) && ts.isIdentifier(vd.name)) { stmts.add(vd); continue; }
        const hD = homeOf(vd);
        if (hD !== home || step || stmts.has(vd)) { if (!stmts.has(vd)) addParam(r.sym, declName(c.decl, r.id), c.decl); continue; }
        const L = accLoopOf(r.sym, vd, home);
        if (L && point >= L.end && !loopWhy(L, home)) {
          if (!stmts.has(vd)) { stmts.add(vd); if (vd.initializer) queue.push(vd.initializer); }
          if (!stmts.has(L)) { stmts.add(L); queue.push(L); }
          continue;
        }
        if (writesIn(r.sym).length || !vd.initializer || vd.pos > point || isPureRead(vd.initializer) || impurity(vd.initializer, ctx)) { addParam(r.sym, declName(c.decl, r.id), c.decl); continue; }
        stmts.add(vd);
        queue.push(vd.initializer);
      }
    }
    if (why) return { why };
    // שם-קלט כפול או קלט שמסתיר עוזר ⇒ לא בטוח לשלוף; שני עוזרים שונים באותו שם (מקומי + מיובא) ⇒ התנגשות
    const names = new Set();
    for (const p of params.values()) { if (names.has(p.name)) return { why: 'shadowed-name' }; names.add(p.name); }
    for (const h of helpers) if (names.has(declTextName(h))) return { why: 'shadowed-name' };
    for (const k of consts) for (const n of boundNames(k)) if (names.has(n)) return { why: 'shadowed-name' };
    const top = new Map();
    for (const n of [...helpers, ...consts]) for (const nm of n.alias || n.ns || n.nsm ? [declTextName(n)] : ts.isVariableDeclaration(n) && !fnInitOf(n) ? boundNames(n) : [declTextName(n)]) {
      if (top.has(nm) && top.get(nm) !== n) return { why: 'name-clash' };
      top.set(nm, n);
    }
    const foreign = [...helpers, ...consts].some((n) => (n.alias || n.ns || n.nsm ? n.decl : n).getSourceFile() !== sf || !!n.ns);
    const ord = (a, b) => order(a, b, sf);
    return { params: [...params.values()].sort((a, b) => a.pos - b.pos), stmts: [...stmts].sort((a, b) => a.pos - b.pos), closures, helpers: [...helpers].sort(ord), consts: [...consts].sort(ord), foreign };
  }
  function declName(decl, id) { return decl && decl.name && ts.isIdentifier(decl.name) ? decl.name.text : id.text; }

  const used = new Set();
  const symName = (base, line) => { let s = base; if (used.has(s)) s = `${base}@${line}`; let k = 2; while (used.has(s)) s = `${base}@${line}~${k++}`; used.add(s); return s; };
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  /* ── 1. ערכים בשם ── */
  const values = [];
  const loops = [];
  const automation = new Map(); // home ⇒ [stmt]
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && !(n.parent && n.parent.parent && (ts.isForOfStatement(n.parent.parent) || ts.isForInStatement(n.parent.parent)))) {
      const home = homeOf(n);
      if (home && !ts.isSourceFile(home) && !fnInitOf(n)) values.push(n);
    }
    if (LOOP(n)) { const home = homeOf(n); if (home && !ts.isSourceFile(home)) loops.push(n); }
    if (ts.isExpressionStatement(n) && ts.isCallExpression(n.expression) && ts.isPropertyAccessExpression(n.expression.expression) && AUTOMATION[n.expression.expression.name.text]) {
      const home = homeOf(n);
      if (home && !ts.isSourceFile(home)) { if (!automation.has(home)) automation.set(home, []); automation.get(home).push(n); }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  for (const vd of values) {
    const ids = [];
    const collect = (b) => { if (ts.isIdentifier(b)) ids.push(b); else for (const e of b.elements) if (!ts.isOmittedExpression(e)) collect(e.name); };
    collect(vd.name);
    const ch = chainOf(vd, sf);
    if (!ch) continue;
    for (const id of ids) {
      candidates++;
      const init = vd.initializer;
      if (!isComputation(init)) { skip('trivial'); continue; }
      const why = impurity(init, ctx);
      if (why) { skip(why); continue; }
      const base = { kind: 'value', top: ch.top, mids: ch.mids, value: id.text, line: lineOf(vd), home: ch.home, ret: id.text, nameNode: id, init };
      const full = slice([init], vd.end, ch.home, { own: [vd] });
      if (full.why) { skip(full.why); continue; }
      const sym = symName([ch.top, ...ch.mids, id.text].join('.'), base.line);
      lifts.push({ ...base, form: 'slice', symbol: sym, ...full });
      if (full.stmts.length > 1) {
        const st = slice([init], vd.end, ch.home, { step: true, own: [vd] });
        if (!st.why && st.params.map((p) => p.name).join(',') !== full.params.map((p) => p.name).join(',')) lifts.push({ ...base, form: 'step', symbol: sym + ':step', ...st });
      }
    }
  }

  /* ── 2. מצטברים אחרי לולאה ── */
  for (const L of loops) {
    const home = homeOf(L);
    const block = L.parent;
    if (!block || !block.statements) continue;
    const ch = chainOf(L, sf);
    if (!ch) continue;
    for (const st of block.statements) {
      if (st.pos >= L.pos) break;
      if (!ts.isVariableStatement(st)) continue;
      for (const vd of st.declarationList.declarations) {
        if (!ts.isIdentifier(vd.name)) continue;
        const s = checker.getSymbolAtLocation(vd.name);
        if (!s || accLoopOf(s, vd, home) !== L) continue;
        candidates++;
        const lw = loopWhy(L, home);
        if (lw) { skip(lw); continue; }
        if (vd.initializer && impurity(vd.initializer, ctx)) { skip(impurity(vd.initializer, ctx)); continue; }
        const res = slice([L, ...(vd.initializer ? [vd.initializer] : [])], L.end, home, { own: [vd, L] });
        if (res.why) { skip(res.why); continue; }
        const line = lineOf(L);
        lifts.push({ kind: 'accumulator', form: 'slice', top: ch.top, mids: ch.mids, value: vd.name.text, line, home, ret: vd.name.text, nameNode: vd.name, init: L, symbol: symName([ch.top, ...ch.mids, vd.name.text].join('.') + ':after-loop', line), ...res });
      }
    }
  }

  /* ── 3. מעטפות-זמן (AudioParam) ── */
  for (const [home, list] of automation) {
    const groups = new Map();
    for (const st of list) {
      const call = st.expression;
      const recv = call.expression.expression.getText(sf);
      if (!groups.has(recv)) groups.set(recv, []);
      groups.get(recv).push(st);
    }
    const ch = chainOf(list[0], sf);
    if (!ch) continue;
    for (const [recv, sts] of groups) {
      candidates++;
      const events = []; const roots = [];
      let why = null;
      for (const st of sts) {
        const call = st.expression;
        const m = AUTOMATION[call.expression.name.text];
        // תנאי עוטף ישיר (if (fEnd) …) נכנס לפונקציה; כל מבנה אחר — לא בטוח
        let cond = null;
        let up = st.parent;
        if (ts.isIfStatement(up) && up.thenStatement === st && !up.elseStatement) { cond = up.expression; up = up.parent; }
        else if (ts.isBlock(up) && ts.isIfStatement(up.parent) && up.statements.length === 1 && !up.parent.elseStatement) { cond = up.parent.expression; up = up.parent.parent; }
        if (homeOf(st) !== home || (up && !ts.isBlock(up) && !ts.isSourceFile(up)) || (up && ts.isBlock(up) && up.parent !== home)) { why = 'envelope-structure'; break; }
        const args = [...call.arguments];
        if ((m === 'target' && args.length < 3) || (m !== 'target' && args.length < 2)) { why = 'envelope-args'; break; }
        for (const a of [...args, ...(cond ? [cond] : [])]) { const w = impurity(a, ctx); if (w) { why = w; break; } roots.push(a); }
        if (why) break;
        events.push({ m, args, cond });
      }
      if (why) { skip(why); continue; }
      if (!events.some((e) => e.m !== 'set')) { skip('envelope-static'); continue; }
      const res = slice(roots, sts[sts.length - 1].end, home, {});
      if (res.why) { skip(res.why); continue; }
      const prop = recv.replace(/^.*\./, '');
      const line = lineOf(sts[0]);
      lifts.push({ kind: 'envelope', form: 'slice', top: ch.top, mids: ch.mids, value: prop, line, home, ret: null, init: sts[0], recv, symbol: symName([ch.top, ...ch.mids, prop].join('.') + ':envelope', line), envelope: { def: PARAM_DEFAULT[prop] ?? 0, events }, ...res });
    }
  }
  return { lifts, skips, candidates };
}

function isLiteral(e) {
  const x = unwrap(e);
  return ts.isNumericLiteral(x) || ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x) || x.kind === ts.SyntaxKind.TrueKeyword || x.kind === ts.SyntaxKind.FalseKeyword || x.kind === ts.SyntaxKind.NullKeyword || (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(x.operand));
}
function declTextName(h) { return h.nsm ? h.nsm.ns + '.' + h.member : h.ns ? h.ns : h.alias ? h.alias : ts.isVariableDeclaration(h) ? h.name.getText() : h.name ? h.name.text : ''; }
/** סדר יציב לעוזרים/קבועים: של הקובץ לפי מקום · מקבצים אחרים לפי (קובץ, מקום) · כינויים בסוף. */
function order(a, b, sf) {
  const key = (n) => (n.alias || n.ns || n.nsm ? [2, declTextName(n), 0] : [n.getSourceFile() !== sf ? 1 : 0, n.getSourceFile().fileName, n.pos]);
  const x = key(a); const y = key(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
function boundNames(vd) {
  const out = [];
  const collect = (b) => { if (ts.isIdentifier(b)) out.push(b.text); else for (const e of b.elements) if (!ts.isOmittedExpression(e)) collect(e.name); };
  collect(vd.name);
  return out;
}

/* ═══════════════ כתיבת המודול ═══════════════ */

const strip = (t) => t.replace(/^(\s*(export|default|declare)\s+)+/, '');
function helperText(h, sf) {
  if (ts.isVariableDeclaration(h)) return `const ${h.getText(sf)};`;
  return strip(h.getText(sf));
}
/** טקסט של עוזר/קבוע/כינוי במודול. מקובץ אחר ⇒ מתורגם ל-JS לפי סוג הקובץ שלו (`<T>x` של .ts לא נשבר ב-.tsx). */
function nodeText(n, sf, nsOf) {
  if (n.alias) return `const ${n.alias} = ${n.target};`;
  if (n.nsm) return '';
  if (n.ns) return `const ${n.ns} = { ${[...(nsOf?.get(n) ?? [])].sort((a, b) => (a.member < b.member ? -1 : 1)).map((m) => (m.member === m.target ? m.member : `${m.member}: ${m.target}`)).join(', ')} };`;
  const own = n.getSourceFile();
  const t = ts.isVariableDeclaration(n) ? `const ${n.getText(own)};` : helperText(n, own);
  if (own === sf) return t;
  return toJs(t, /\.(tsx|jsx)$/.test(own.fileName)).replace(/^"use strict";\s*/, '').trim();
}
const isSynth = (n) => !!(n.alias || n.ns || n.nsm);
const namesOfNode = (n) => (isSynth(n) ? [declTextName(n)] : ts.isVariableDeclaration(n) && !fnInit(n) ? boundNames(n) : [declTextName(n)]);
/**
 * סדר-הטעינה: כל צומת אחרי מה שהוא קורא (DFS יציב). גם פונקציה "מושכת" את מה שבגוף שלה — קבוע שקורא לפונקציה
 * בזמן-הטעינה (`const VALID = computeValid()`) צריך שגם מה שהיא קוראת (PARTS מקובץ אחר) כבר יהיה מאותחל.
 * מעגלים נשברים לפי הסדר היציב. מודול של קובץ אחד בלי ייבוא — אותו סדר כמו בקובץ-המקור.
 */
function loadOrder(nodes, sf, nsOf) {
  const sorted = nodes.slice().sort((a, b) => order(a, b, sf));
  const byName = new Map();
  for (const n of sorted) for (const nm of namesOfNode(n)) byName.set(nm, n);
  const out = []; const state = new Map();
  const visit = (n) => {
    if (state.get(n)) return;
    state.set(n, 1);
    const ids = new Set(nodeText(n, sf, nsOf).match(/[A-Za-z_$][\w$]*/g) ?? []);
    for (const id of [...ids].sort()) { const d = byName.get(id); if (d && d !== n) visit(d); }
    out.push(n);
  };
  for (const n of sorted) visit(n);
  return out;
}
function stmtText(n, sf) {
  if (ts.isVariableDeclaration(n)) {
    const isConst = n.parent && n.parent.flags & ts.NodeFlags.Const;
    return `${isConst ? 'const' : 'let'} ${n.getText(sf)};`;
  }
  return n.getText(sf);
}

/** המנוע של מעטפת-הזמן — מוטבע פעם אחת בכל מודול שצריך אותו (המפרט של Web Audio: set · lin · exp · target). */
export const AUDIO_PARAM_AT = `function __audioParamAt(def, evs, when) {
  const ev = evs.map((e, i) => ({ k: e[0], v: e[1], t: e[2], tc: e[3], i })).sort((a, b) => a.t - b.t || a.i - b.i);
  let st = { k: 'hold', v: def }; let tp = 0;
  const val = (s, at) => (s.k === 'hold' ? s.v : s.vt + (s.v0 - s.vt) * Math.exp(-(at - s.t) / s.tc));
  for (const e of ev) {
    if (e.k === 'lin' || e.k === 'exp') {
      const v0 = val(st, tp);
      if (when < e.t) {
        if (when < tp) return val(st, when);
        if (e.t <= tp) return e.v;
        const f = (when - tp) / (e.t - tp);
        if (e.k === 'lin') return v0 + (e.v - v0) * f;
        if (v0 === 0 || v0 * e.v < 0) return v0;
        return v0 * Math.pow(e.v / v0, f);
      }
      st = { k: 'hold', v: e.v }; tp = e.t;
    } else if (e.k === 'set') {
      if (when < e.t) return val(st, when);
      st = { k: 'hold', v: e.v }; tp = e.t;
    } else {
      if (when < e.t) return val(st, when);
      st = { k: 'target', v0: val(st, e.t), vt: e.v, t: e.t, tc: e.tc > 0 ? e.tc : 1e-9 }; tp = e.t;
    }
  }
  return val(st, when);
}`;

/** שם-ייצוא קריא ויציב. */
export function exportName(symbol) {
  return 'inner$' + symbol.replace(/[^A-Za-z0-9_$]/g, (c) => (c === '.' ? '$' : c === ':' ? '$$' : c === '@' ? '_L' : c === '~' ? '_' : '_'));
}

/** סדר ההצהרות בגוף: עוזרים-סגורים קודם (נקראים רק אחר-כך), ואז השאר לפי המקום בקוד. */
const bodyOrder = (L) => (L.closures && L.closures.size ? [...L.stmts.filter((s) => L.closures.has(s)), ...L.stmts.filter((s) => !L.closures.has(s))] : L.stmts);

/** הטקסט של פונקציה מורמת אחת (TS — עוד לפני הסרת-הטיפוסים). */
export function liftText(L, sf) {
  const params = L.params.map((p) => p.name);
  const body = [];
  if (L.kind === 'envelope') {
    params.push('since');
    body.push('const ev = [];');
    for (const st of bodyOrder(L)) body.push(stmtText(st, sf));
    for (const e of L.envelope.events) {
      const a = e.args.map((x) => x.getText(sf));
      const item = e.m === 'target' ? `['target', ${a[0]}, ${a[1]}, ${a[2]}]` : `['${e.m}', ${a[0]}, ${a[1]}]`;
      body.push(e.cond ? `if (${e.cond.getText(sf)}) ev.push(${item});` : `ev.push(${item});`);
    }
    // since = זמן מאז האירוע הראשון שנקבע על הציר
    body.push(`return __audioParamAt(${JSON.stringify(L.envelope.def)}, ev, (ev.length ? Math.min(...ev.map((e) => e[2])) : 0) + since);`);
  } else {
    for (const st of bodyOrder(L)) body.push(stmtText(st, sf));
    body.push(`return ${L.ret};`);
  }
  return `export function ${exportName(L.symbol)}(${params.join(', ')}) {\n  ${body.join('\n').split('\n').join('\n  ')}\n}`;
}

/**
 * מודול אחד לקובץ-מקור: קבועים + עוזרים (פעם אחת) + הפונקציות המורמות + SIGS. מחזיר {ts, kept[], clashes}.
 * פונקציה שהעוזר/הקבוע שלה מתנגש בשם עם אחר (שני `glow` מרכיבים שונים) — לא נכנסת (name-clash).
 */
/** פרטיות: טקסט-קוד שנראה כמו מייל · טלפון · ת״ז · טוקן — לא נכתב למודול (החלק מדולג, privacy). */
export const PII = [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/, /(?<![\w.])(?:0|\+972-?)\d{1,2}-?\d{7}(?![\w])/, /(?<![\w.])\d{9}(?![\w.])/, /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/];
const piiIn = (t) => PII.some((re) => re.test(t));

export function moduleText(lifts, sf, header) {
  const byName = new Map(); // שם ⇒ צומת
  const kept = []; let clashes = 0; let privacy = 0; let tooBig = 0;
  for (const L of lifts) {
    const need = [...L.consts.flatMap((k) => boundNames(k).map((n) => [n, k])), ...L.helpers.map((h) => [declTextName(h), h])];
    if (L.kind === 'envelope') need.push(['__audioParamAt', 'AUDIO']);
    const mine = new Map();
    if (need.some(([n, node]) => (mine.has(n) && mine.get(n) !== node) || (mine.set(n, node), false))) { clashes++; continue; }
    if (need.some(([n, node]) => byName.has(n) && byName.get(n) !== node)) { clashes++; continue; }
    const text = liftText(L, sf);
    if (text.length > MAX_TEXT) { tooBig++; continue; }
    if (piiIn(text) || need.some(([, node]) => node !== 'AUDIO' && piiIn(isSynth(node) ? declTextName(node) + ' ' + (node.target ?? '') : node.getText(node.getSourceFile())))) { privacy++; continue; }
    for (const [n, node] of need) byName.set(n, node);
    kept.push({ ...L, text });
  }
  const all = [...new Set([...byName.values()].filter((x) => x !== 'AUDIO'))];
  const nsOf = new Map();
  for (const m of all) if (m.nsm) { if (!nsOf.has(m.nsm)) nsOf.set(m.nsm, new Set()); nsOf.get(m.nsm).add(m); }
  const nodes = loadOrder(all.filter((n) => !n.nsm), sf, nsOf);
  const out = [header, ''];
  for (const n of nodes) out.push(nodeText(n, sf, nsOf));
  if ([...byName.values()].includes('AUDIO')) out.push(AUDIO_PARAM_AT);
  if (nodes.length) out.push('');
  for (const k of kept) out.push(k.text, '');
  return { text: out.join('\n'), kept, clashes, privacy, tooBig };
}
function fnInit(vd) { const i = vd.initializer && unwrap(vd.initializer); return !!i && (ts.isArrowFunction(i) || ts.isFunctionExpression(i)); }

/**
 * ⚡ SELF: «מחפש לפי מפתח» + «מקצב» (קריאה/כתיבה אחת לכל ריצה, לא קובץ לכל קריאה) — ה-transpile של כל צומת וכל מודול
 * הוא פונקציה טהורה של הטקסט; buildSource טוען את המטמון בתחילת ריצה (useToJsMemo) ושומר בסופה רק מה שנגעו בו.
 */
let TOJS = null; let TOJS_USED = null;
export function useToJsMemo(entries) { TOJS = new Map(entries ?? []); TOJS_USED = new Map(); }
export function takeToJsMemo() { const used = TOJS_USED ? [...TOJS_USED] : []; TOJS = null; TOJS_USED = null; return used; }

/** TS ⇒ JS (בלי טיפוסים). */
export function toJs(text, tsx) {
  if (!TOJS) return toJsRaw(text, tsx);
  const k = (tsx ? 'x' : 't') + fingerprint(text);
  let v = TOJS.get(k);
  if (v === undefined) { v = toJsRaw(text, tsx); TOJS.set(k, v); }
  TOJS_USED.set(k, v);
  return v;
}
function toJsRaw(text, tsx) {
  return ts.transpileModule(text, { fileName: tsx ? 'gen.tsx' : 'gen.ts', compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, removeComments: false, verbatimModuleSyntax: false, isolatedModules: true } }).outputText;
}
