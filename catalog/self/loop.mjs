#!/usr/bin/env node
/**
 * 🔁 הלולאה — המכונה מתקנת ומשפרת את עצמה (SELF-LOOP, 14.10.2026). בלי AI: מנוע דטרמיניסטי על הקוד של המכונה (catalog/).
 *
 * בקשת-הבעלים: "אז הוא בעצם לא משפר את עצמו" ⇒ "ברור". עד כאן המכונה *מצאה* בעיות בקוד שלה (self-check), וסשן *תיקן*.
 * כאן היא גם מתקנת — עם החלקים המוכחים שלה, ו"יותר טוב" הוא חוק (חוק-המהירות, למטה), לא דעה.
 *
 *   1. מוצאת   — הנבדקים: כל פונקציה של המכונה שהפועל שלה ידוע — 17 התפקידים (self/roles.mjs) + כל חלק-מכונה שהקורא
 *                הוכיח לו פועל (self/behavior-machine.json). לכל אחד: (א) באג — נכשל בחוק של הפועל שלו;
 *                (ב) כפילות — חלק מוכח עושה בדיוק אותו דבר (אותו פועל, אותה צורה, אותם פלטים על אותם קלטים);
 *                (ג) חלופה זולה — כמו (ב) ובפחות צעדים.
 *   2. חוק-המהירות — «יותר טוב» = אותם פלטים בדיוק על **כל** הקלטים שהקורא נתן לפונקציה, ופחות צעדים לפי מונה-הצעדים
 *                הדטרמיניסטי (lib/steps.mjs) — לא שעון. שוויון ⇒ לא מחליפים. רשום כחוק (`speed.fewer`, `speed.same`) עם
 *                מוטנט שהוא תופס (catalog/__tests__/self-loop.test.ts).
 *   3. מחפשת   — במחסן: חלקי-המכונה המוכחים · הקטלוג (כל מקור שרץ כאן, כולל הפנימיים) · השילובים (combos.json). מועמד =
 *                עובר את חוקי הפועל n/n **וגם** (חוץ מבאג) פלט זהה על כל הקלטים; הצורה מתאימה במתאמים בלבד (אותו מספר קלטים;
 *                המתאם של התפקיד — אם יש — עוטף גם אותו).
 *   4. מחליפה  — שינוי-קוד מכני שהלולאה מייצרת: גוף-הפונקציה ⇒ קריאה לחלק המוכח (import + קריאה). על עותק זמני.
 *   5. בודקת   — על העותק: חוקי-הפועל n/n · פלטים · צעדים · `rebuild` (כל פלטי-הקטלוג ביט-זהים) · `npx vitest run catalog`.
 *   6. משאירה או מחזירה — רק אם הכול עבר; אחרת מחזירה ורושמת למה.
 *   7. פנקס    — catalog/self/loop-ledger.json: לכל נבדק — מה נמצא, איזה חלק ומאיפה (פרויקט · קובץ:שורה), מה נבדק, מה הוחלט ולמה.
 *   8. דטרמיניזם — סדר קבוע (לפי מזהה), זרע קבוע, בלי שעון/אקראי בהחלטות ⇒ שתי הרצות על אותו קוד = אותו פנקס.
 *
 *   node catalog/self/loop.mjs            # מה היה עושה — בלי לגעת בריפו (הפנקס מודפס; --out <קובץ> כותב אותו)
 *   node catalog/self/loop.mjs --apply    # + מחיל את מה שנשאר, וכותב את הפנקס
 *   node catalog/self/loop.mjs --check    # רק החיפוש (בלי עותק): יציאה 1 אם יש שיפור שלא הוחל — למידע
 *   --quick                               # בלי rebuild/vitest על העותק (לבדיקות-השימור בלבד; נרשם בפנקס)
 *   --no-history                          # בלי «הגרסה של אתמול» (רק המחסן) — כמו SELF-LOOP
 *
 * SELF-LOOP2 (14.10.2026) — מקור-חלקים נוסף: **ההיסטוריה של המכונה עצמה**. לכל נבדק, הגרסאות הקודמות של אותה פונקציה מ-git
 * (HEAD ואבותיו, מהחדשה לישנה, עד HIST_CAP) הן מועמדים רגילים — אותם חוקים, אותם קלטים, אותם שערי-עותק; ההחלפה = ההצהרה
 * ההיסטורית במקום הנוכחית. סדר-ההעדפה: באג ⇒ קודם ההיסטוריה (השינוי הקטן ביותר), ואז המחסן; מהירות ⇒ הכי מעט צעדים,
 * ובשוויון — ההיסטוריה. ראו historySource/historyVersions/makeHistoryPatch.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { syncBuiltinESMExports } from 'node:module';
import crypto from 'node:crypto';
import { gitIndex, gitIndexAsync, fileSha, readHead } from '../lib/gitfp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
export const LEDGER = 'catalog/self/loop-ledger.json';
const SEED = 0x0ca7a10; // = הזרע של הקורא / self-check
const BEH = 'catalog/self/behavior-machine.json';

/* ═══════════════ חוק-המהירות ═══════════════ */

/**
 * «יותר טוב» כחוק — אותה צורה כמו חוקי-הפועלים (id · he · check), כדי שיירשם ויוכח כמו כל חוק:
 *   speed.same  — אותם פלטים בדיוק על כל הקלטים (כשל: הקלט הראשון שבו הפלט שונה);
 *   speed.fewer — פחות צעדים (שוויון ⇒ כשל: "לא מחליפים").
 * `a`/`b` = {outs: [פלט מקודד לכל קלט], steps}. טהור.
 */
export const SPEED_LAW = {
  id: 'speed', he: 'מהיר יותר', plain: 'אותו דבר בדיוק, בפחות צעדים',
  laws: [
    { id: 'speed.same', he: 'אותם פלטים על כל הקלטים', check: (a, b) => {
      if (a.outs.length !== b.outs.length) return { ok: false, why: 'מספר קלטים שונה' };
      const diff = a.outs.flatMap((o, k) => (o === b.outs[k] ? [] : [k]));
      return diff.length ? { ok: false, why: 'פלט אחר על ' + (diff.length === 1 ? 'קלט אחד' : diff.length + ' קלטים') + ' (#' + diff[0] + ')', at: diff[0], count: diff.length } : { ok: true };
    } },
    { id: 'speed.fewer', he: 'פחות צעדים', check: (a, b) => (b.steps < a.steps ? { ok: true } : { ok: false, why: b.steps === a.steps ? 'שוויון בצעדים (' + a.steps + ') — לא מחליפים' : 'יותר צעדים (' + b.steps + ' מול ' + a.steps + ')' }) },
  ],
};
/** a = הקיים, b = החלופה. מחזיר {ok, laws: {id: {ok, why}}} — כל החוקים נבדקים (בלי עצירה מוקדמת). */
export function speedLaw(a, b) {
  const laws = Object.fromEntries(SPEED_LAW.laws.map((L) => [L.id, L.check(a, b)]));
  return { ok: Object.values(laws).every((r) => r.ok), laws };
}

/* ═══════════════ הקוד: הצהרות ושינוי מכני ═══════════════ */

let tsMod = null;
const TS = async () => (tsMod ??= (await import('typescript')).default);

/** ההצהרה העליונה של סמל בקובץ JS: פונקציה · const = פונקציה · const = שם (כינוי). null ⇒ לא בקובץ הזה. */
export async function findDecl(text, symbol) {
  const ts = await TS();
  const sf = ts.createSourceFile('x.mjs', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const imports = new Map(); // שם מקומי ⇒ {from, name}
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      for (const el of st.importClause.namedBindings.elements) imports.set(el.name.text, { from: st.moduleSpecifier.text, name: (el.propertyName ?? el.name).text });
    }
  }
  const exported = (st) => !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name?.text === symbol && st.body) {
      return { kind: 'function', exported: exported(st), line: lineOf(st), stmt: [st.getStart(sf), st.end], params: st.parameters.map((p) => p.getText(sf)), simple: st.parameters.every((p) => ts.isIdentifier(p.name) && !p.initializer && !p.dotDotDotToken), names: st.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null)), body: [st.body.getStart(sf), st.body.end], imports, sf };
    }
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || d.name.text !== symbol || !d.initializer) continue;
        const init = d.initializer;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          return { kind: 'const', exported: exported(st), line: lineOf(st), stmt: [st.getStart(sf), st.end], params: init.parameters.map((p) => p.getText(sf)), simple: init.parameters.every((p) => ts.isIdentifier(p.name) && !p.initializer && !p.dotDotDotToken), names: init.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null)), init: [init.getStart(sf), init.end], imports, sf };
        }
        if (ts.isIdentifier(init)) return { kind: 'alias', exported: exported(st), line: lineOf(st), stmt: [st.getStart(sf), st.end], target: init.text, init: [init.getStart(sf), init.end], imports, sf, params: null };
      }
    }
  }
  return null;
}

/** כל השמות העליונים בקובץ (כדי שה-import החדש לא יתנגש). */
async function topNames(text) {
  const ts = await TS();
  const sf = ts.createSourceFile('x.mjs', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const out = new Set();
  const add = (n) => { if (n && ts.isIdentifier(n)) out.add(n.text); };
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) add(st.name);
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) add(d.name);
    if (ts.isImportDeclaration(st)) { const c = st.importClause; if (c?.name) add(c.name); const nb = c?.namedBindings; if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) add(el.name); if (nb && ts.isNamespaceImport(nb)) add(nb.name); }
  }
  return out;
}

const specFrom = (fromRel, toRel) => { let s = path.posix.relative(path.posix.dirname(fromRel), toRel); if (!s.startsWith('.')) s = './' + s; return s; };

/**
 * השינוי המכני: הנבדק `subj` (קובץ · סמל) ⇒ קריאה לחלק `cand` (קובץ · סמל). מחזיר {files: {rel: טקסט-חדש}} או {why}.
 * גוף-פונקציה ⇒ `return cand(…)`; const = פונקציה ⇒ `(…) => cand(…)`; כינוי ⇒ השם של החלק. import אחד נוסף (בלי התנגשות-שמות);
 * חלק שלא מיוצא בקובץ שלו ⇒ מילת `export` לפני ההצהרה שלו (גם זה מכני). שורת-הערה אחת מסמנת שהלולאה כתבה את השינוי.
 */
export async function makePatch(root, subj, cand, note) {
  const sText = fs.readFileSync(path.join(root, subj.path), 'utf8');
  const d = await findDecl(sText, subj.symbol);
  if (!d) return { why: 'ההצהרה של הנבדק לא נמצאה כפונקציה עליונה' };
  const files = {};
  const same = subj.path === cand.path;
  let local = cand.symbol;
  let head = '';
  if (!same) {
    const cText = fs.readFileSync(path.join(root, cand.path), 'utf8');
    const cd = await findDecl(cText, cand.symbol);
    if (!cd) return { why: 'החלק לא נמצא כהצהרה עליונה בקובץ שלו' };
    if (!cd.exported) files[cand.path] = cText.slice(0, cd.stmt[0]) + 'export ' + cText.slice(cd.stmt[0]);
    const names = await topNames(sText);
    const imported = [...d.imports].find(([, v]) => v.name === cand.symbol && path.posix.join(path.posix.dirname(subj.path), v.from) === cand.path);
    if (imported) local = imported[0];
    else {
      for (let k = 2; names.has(local) || local === subj.symbol; k++) local = cand.symbol + k;
      head = 'import { ' + (local === cand.symbol ? cand.symbol : cand.symbol + ' as ' + local) + " } from '" + specFrom(subj.path, cand.path) + "';\n";
    }
  } else if (cand.symbol === subj.symbol) return { why: 'אותה פונקציה' };
  const args = d.params && d.simple ? d.names.join(', ') : '...args';
  const params = d.params && d.simple ? d.params.join(', ') : '...args';
  const mark = '// 🔁 הלולאה (SELF-LOOP): ' + note + '\n';
  let out;
  if (d.kind === 'function') out = sText.slice(0, d.body[0]) + '{\n  ' + mark.trimEnd() + '\n  return ' + local + '(' + args + ');\n}' + sText.slice(d.body[1]);
  else if (d.kind === 'const') out = sText.slice(0, d.stmt[0]) + mark + sText.slice(d.stmt[0], d.init[0]) + '(' + params + ') => ' + local + '(' + args + ')' + sText.slice(d.init[1]);
  else out = sText.slice(0, d.stmt[0]) + mark + sText.slice(d.stmt[0], d.init[0]) + local + sText.slice(d.init[1]);
  // הערה בסוף השורה שהלולאה כתבה מחדש תיארה את הגוף הישן ⇒ יורדת (שורת-הסימון שמעל אומרת מה יש עכשיו)
  if (d.kind !== 'function') {
    const end = out.indexOf('\n', out.indexOf(mark) + mark.length);
    const line = out.slice(out.indexOf(mark) + mark.length, end < 0 ? out.length : end);
    const m = /;([ \t]*\/\/[^\n]*)$/.exec(line);
    if (m) { const at0 = out.indexOf(mark) + mark.length + m.index + 1; out = out.slice(0, at0) + out.slice(at0 + m[1].length); }
  }
  if (head) {
    // אחרי ה-import האחרון (או בראש הקובץ, אחרי ה-shebang וההערה הפותחת)
    const ts = await TS();
    const sf = ts.createSourceFile('x.mjs', out, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const imps = sf.statements.filter((s) => ts.isImportDeclaration(s));
    const at = imps.length ? imps[imps.length - 1].end + 1 : sf.statements[0] ? sf.statements[0].getStart(sf) : out.length;
    out = out.slice(0, at) + head + out.slice(at);
  }
  files[subj.path] = out;
  return { files };
}

/* ═══════════════ ההרצה: חוקים · פלטים · צעדים ═══════════════ */

/** טוען את המודולים של המכונה מ-root (הלולאה רצה על ה-root שלה; העותק מריץ את הלולאה שלו). */
async function machineMods(root) {
  const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);
  const [sandbox, probe, verbs, roles, bridge, tsdesc] = await Promise.all(['catalog/lib/sandbox.mjs', 'catalog/lib/probe.mjs', 'catalog/lib/verbs.mjs', 'catalog/self/roles.mjs', 'catalog/lib/load-bridge.mjs', 'catalog/lib/tsdesc.mjs'].map(imp));
  const B = await import(pathToFileURL(await bridge.bundleBridge()).href);
  return { sandbox, probe, verbs, roles, B, tsdesc };
}

const enc = (r) => ('budget' in r ? '⏱' : 'err' in r ? '!' : r.async ? '…' : JSON.stringify(r.v));

/** פונקציה בארגז ⇒ runner: {ctx, fn, sig}. adapt (של התפקיד) עוטף בתוך הארגז. */
function runnerOf(M, mod, symbol, sig, adapt) {
  const got = mod && M.sandbox.resolvePart(mod.exports, symbol);
  if (!got || got.self !== undefined) return null;
  const fn = adapt ? vm.runInContext('(' + adapt + ')', mod.ctx)(got.fn) : got.fn;
  return { ctx: mod.ctx, fn, sig };
}

/** חוקי הפועל n/n + **כל** הקלטים שהקורא נתן (לפי הסדר, בלי כפולים). */
function lawsOf(M, R, verbId, o) {
  const { seed, B } = o;
  const verb = M.verbs.VERB_BY_ID.get(verbId);
  const inputs = new Map();
  const base = M.sandbox.callerFor(R.ctx, R.fn, seed);
  const call = (args) => { const k = JSON.stringify(args); if (!inputs.has(k)) inputs.set(k, args); return base(args); };
  M.sandbox.resetBudget(R.ctx);
  let res;
  try { res = M.probe.probePart({ sig: R.sig, call, seed, B, verbs: o.all ? M.verbs.VERBS : [verb] }); } catch (err) { res = { status: err instanceof M.sandbox.BudgetError ? 'budget' : 'crash' }; }
  const h = res.status === 'ran' ? (res.verbs || []).find((v) => v.id === verbId) : null;
  const out = { inputs: withStretched([...inputs.values()]) };
  if (h && /^(\d+)\/\1$/.test(h.holds)) return { ...out, held: true, holds: h.holds };
  // לא עמד: החוק הראשון שנכשל (אותם מקרים, אותו זרע — כמו self/roles.mjs)
  let law = null; let why = res.status !== 'ran' ? res.status : null;
  try {
    M.sandbox.resetBudget(R.ctx);
    const c2 = M.sandbox.callerFor(R.ctx, R.fn, seed);
    const cases = M.probe.baseCases(R.sig, c2, seed, B);
    for (const b of cases.length ? M.probe.bindingsOf(verb, R.sig, cases) : []) {
      const rep = M.probe.evalVerb(verb, b, R.sig, cases, M.probe.fOf(c2), seed, B, true);
      if (!rep) continue;
      const bad = Object.entries(rep.laws).find(([, L]) => L.fail);
      if (bad) { law = bad[0]; why = String(bad[1].why); break; }
      why ??= !rep.witness ? 'אין מקרה-עד' : !rep.dep ? 'הפלט לא תלוי בקלט' : 'פחות מדי מקרים';
    }
  } catch { why ??= 'budget'; }
  return { ...out, held: false, law: law ?? '-', why: String(why ?? '?').slice(0, 160) };
}

/**
 * «קלטים מתוחים» — לכל אחד מ-STRETCH הקלטים הראשונים גם גרסה ארוכה: כל מחרוזת ×16 (עד 2,000 תווים), כל רשימה ×4
 * (עד 400 פריטים). הקורא מחולל קלטים קצרים; חלופה ש"מקצרת דרך" (חותכת מחרוזת ארוכה, מסתכלת רק על ההתחלה) הייתה שווה
 * על כולם — כאן היא נתפסת. דטרמיניסטי (נגזר מהקלטים עצמם), נוסף **אחרי** הקלטים של הקורא ובלי כפולים.
 */
export const STRETCH = 8;
export function stretched(v) {
  if (typeof v === 'string') return v.length ? v.repeat(Math.max(1, Math.min(16, Math.floor(2000 / v.length)))) : v;
  if (Array.isArray(v)) return [...v, ...v, ...v, ...v].slice(0, Math.max(v.length, 400));
  if (v && typeof v === 'object' && !('$$' in v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? stretched(x) : x]));
  return v;
}
function withStretched(inputs) {
  const seen = new Set(inputs.map((a) => JSON.stringify(a)));
  const more = [];
  for (const a of inputs.slice(0, STRETCH)) { const b = a.map(stretched); const k = JSON.stringify(b); if (!seen.has(k)) { seen.add(k); more.push(b); } }
  return [...inputs, ...more];
}

/**
 * איך הנבדק נבדק — **בדיוק** כמו מי שהוכיח לו את הפועל: תפקיד ⇒ כמו self/roles.mjs (זרע לפי חלק|פועל, רק הפועל הזה);
 * חלק שהקורא הוכיח ⇒ כמו הקורא (lib/probe-file.mjs: זרע לפי החלק, מאגר-הליטרלים של הקובץ, כל הפעלים).
 */
function probeOpts(root, M, s) {
  if (s.from === 'תפקיד') return { seed: (M.probe.fnvHash(s.part + '|' + s.verb) ^ SEED) >>> 0, B: M.B, all: false };
  return { seed: (M.probe.fnvHash(s.part) ^ SEED) >>> 0, B: { ...M.B, pool: M.tsdesc.literalPool(path.join(root, s.path)) }, all: true };
}

/**
 * «קלטים מבחינים» — שוויון-פלטים מוכיח משהו רק כשהקלטים מפרידים בין פלטים: פרדיקט שמחזיר false על 29 מ-30 קלטים
 * "שווה" לכל פרדיקט אחר שגם הוא כמעט תמיד false. דרישה: לפחות MIN_DISTINCT פלטים שונים, והפלט הנפוץ ביותר ≤ MAX_SHARE מהקלטים.
 * אחרת ⇒ "אין מספיק קלטים מבחינים" — השוויון לא נחשב (ולא מחליפים על סמכו). טהור.
 */
export const MIN_DISTINCT = 2;
export const MAX_SHARE = 0.75;
export function distinguishing(outs) {
  const c = new Map(); for (const o of outs) c.set(o, (c.get(o) ?? 0) + 1);
  const top = Math.max(0, ...c.values());
  return outs.length > 0 && c.size >= MIN_DISTINCT && top / outs.length <= MAX_SHARE;
}

/** הפלטים (מקודדים) והצעדים על רשימת-קלטים — אותו זרע, אותו סדר. */
function runOn(M, R, inputs, seed) {
  M.sandbox.resetBudget(R.ctx);
  const c = M.sandbox.callerFor(R.ctx, R.fn, seed);
  const outs = [];
  for (const a of inputs) { let r; try { r = c(a); } catch (err) { r = err instanceof M.sandbox.BudgetError ? { budget: true } : { err: 1 }; M.sandbox.resetBudget(R.ctx); } outs.push(enc(r)); }
  return { outs, steps: vm.runInContext('__catalogSteps', R.ctx)() };
}

/* ═══════════════ הנבדקים והמחסן ═══════════════ */

/**
 * הנבדקים: התפקידים (פועל + מתאם ידועים מהקוד) ואחריהם חלקי-המכונה שהקורא הוכיח להם פועל (כל פועל ראשי, לא-נגזר).
 * ממוינים לפי מזהה ⇒ סדר-ניסיונות קבוע.
 */
async function subjectsOf(root, M) {
  const out = [];
  for (const r of M.roles.ROLES) out.push({ id: 'machine:' + r.path + '#' + (r.as ?? r.symbol) + '·' + r.verb, part: 'machine:' + r.path + '#' + (r.as ?? r.symbol), path: r.path, symbol: r.symbol, verb: r.verb, from: 'תפקיד', role: r.role, takes: r.takes, adapt: r.adapt ?? null });
  const beh = JSON.parse(fs.readFileSync(path.join(root, BEH), 'utf8'));
  const census = JSON.parse(fs.readFileSync(path.join(root, 'catalog/self/machine.json'), 'utf8'));
  const raw = new Map(census.parts.map((p) => [p.id, p]));
  const held = beh.parts.filter((e) => e.labeledBy === 'run' && e.verbs.some((v) => !v.implied) && raw.has(e.id));
  // החתימות (תיאורי-הקלט) — אותו prepareJobs של הקורא, במצב cli
  const pf = await import(pathToFileURL(path.join(root, 'catalog/lib/probe-file.mjs')).href);
  const { sigs } = pf.prepareJobs(root, held.map((e) => raw.get(e.id)), { cli: true });
  for (const e of held) {
    const p = raw.get(e.id); const sig = sigs.get(e.id);
    if (!sig) continue;
    for (const v of e.verbs.filter((x) => !x.implied)) if (!out.some((o) => o.path === p.path && o.symbol === p.symbol && o.verb === v.id)) out.push({ id: e.id + '·' + v.id, part: e.id, path: p.path, symbol: p.symbol, verb: v.id, from: 'הקורא', role: null, sig, adapt: null });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** טוען קובץ של המכונה לארגז (ייצוא בזיכרון לסמלים הפנימיים) — פעם אחת לכל קובץ+סמלים. */
function fileLoader(root, M) {
  const memo = new Map();
  return async (rel, symbols) => {
    const k = rel + '|' + [...symbols].sort().join(',');
    if (memo.has(k)) return memo.get(k);
    const abs = path.join(root, rel);
    const text = fs.readFileSync(abs, 'utf8');
    const expose = [...new Set(symbols)].filter((s) => !new RegExp('export\\s+(async\\s+)?(function|const|let|class)\\s+' + s + '\\b').test(text)).sort();
    let mod = null;
    try { mod = M.sandbox.loadInSandbox(await M.sandbox.bundleFile(abs, { expose, esm: true, cli: true })); } catch { mod = null; }
    memo.set(k, mod);
    return mod;
  };
}

/** המחסן לפועל: חלקי-המכונה (שאר הנבדקים) · הקטלוג (כל מקור שרץ כאן) · השילובים. כל מועמד: {id, project, path, symbol, line, R?}. */
async function warehouse(root, M, subjects) {
  const comb = await import(pathToFileURL(path.join(root, 'catalog/combiner/combine.mjs')).href);
  const load = await import(pathToFileURL(path.join(root, 'catalog/combiner/load.mjs')).href);
  const core = await import(pathToFileURL(path.join(root, 'catalog/combiner/core.mjs')).href);
  const ix = load.loadIndex();
  const raw = new Map(load.loadParts().map((p) => [p.id, p]));
  const verbs = new Set(subjects.map((s) => s.verb));
  const byVerb = new Map([...verbs].map((v) => [v, []]));
  for (const p of ix.parts) for (const v of verbs) if (core.provenAs(p, v)) byVerb.get(v).push(p);
  const combos = JSON.parse(fs.readFileSync(path.join(root, 'catalog/combiner/combos.json'), 'utf8')).results.filter((r) => r.found && verbs.has(r.verb));
  return { comb, ix, raw, byVerb, combos, core };
}

/** קובץ:שורה של סמל (השורה של ההצהרה; לא נמצא ⇒ בלי שורה). */
async function lineOf(root, rel, symbol) {
  try { const d = await findDecl(fs.readFileSync(path.join(root, rel), 'utf8'), symbol.split('.')[0]); return d ? d.line : null; } catch { return null; }
}
const at = (p, line) => p + (line ? ':' + line : '');

/**
 * הקבצים שהפלט שלהם נבדק כאן ביט-אחר-ביט: כל מה ששלבי-הבונה-מחדש (catalog/scripts/rebuild.mjs › STAGES) מייבאים, טרנזיטיבית
 * (`from '…'` · `import('…')` יחסיים). קוד מחוץ לגרף הזה (מפקדי-החוץ — buildsmart/generator/others/rings — שרצים רק מול
 * שכפולים) ⇒ אי אפשר להוכיח כאן שההחלפה ביט-זהה ⇒ הלולאה לא נוגעת בו (נרשם: "דורש שכפול לאימות").
 */
export async function verifiable(root) {
  const { STAGES } = await import(pathToFileURL(path.join(root, 'catalog/scripts/rebuild.mjs')).href);
  const seen = new Set();
  const visit = (rel) => {
    if (seen.has(rel) || !fs.existsSync(path.join(root, rel))) return;
    seen.add(rel);
    const t = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const m of t.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const to = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      if (/\.m?js$/.test(to)) visit(to);
    }
  };
  for (const st of STAGES) visit(st.run[0]);
  return seen;
}

/** ניתן לייבוא מקוד המכונה: קובץ JS בתוך catalog (לא gen). */
const importable = (rel) => /^catalog\/(?!inner\/gen\/)[^]*\.m?js$/.test(rel);

/* ═══════════════ מקור-חלקים: ההיסטוריה של המכונה («הגרסה של אתמול») — SELF-LOOP2 ═══════════════ */

/**
 * לכל נבדק — הגרסאות הקודמות של **אותה פונקציה** מההיסטוריה של git: רק קומיטים (HEAD ואבותיו — לעולם לא שינויים שלא
 * קומטו), מהחדשה לישנה, עד HIST_CAP גרסאות שונות. איתור לפי שם בקובץ שלה (findDecl — מנתח TS, לא regex); גרסה זהה-טקסט
 * לנוכחית או לגרסה חדשה יותר ⇒ מדלגים; קומיט שבו הפונקציה לא קיימת ⇒ מדלגים. אין git / אין היסטוריה ⇒ נאמר בפנקס, לא נכשלים.
 * מקור ה-git: `SELF_LOOP_GIT` (תיקיית-git — להדגמות, שהעותק שלהן בלי .git) או ה-.git של root. דטרמיניסטי: אותו ריפו ⇒ אותן גרסאות.
 */
export const HIST_CAP = 20;
const git = (G, args, input) => spawnSync('git', [...G.pre, ...args], { cwd: G.cwd, input, encoding: input === undefined ? 'utf8' : 'buffer', maxBuffer: 1 << 30, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', LC_ALL: 'C' } });
export function historySource(root) {
  const env = process.env.SELF_LOOP_GIT;
  const G = env ? { pre: ['--git-dir', env], cwd: root } : fs.existsSync(path.join(root, '.git')) ? { pre: ['-C', root], cwd: root } : null;
  if (!G) return { state: 'אין היסטוריה זמינה כאן (אין git)', G: null };
  const head = git(G, ['rev-parse', '--verify', '-q', 'HEAD']);
  if (head.status !== 0) return { state: 'אין היסטוריה זמינה כאן (אין קומיטים)', G: null };
  const shallow = String(git(G, ['rev-parse', '--is-shallow-repository']).stdout).trim() === 'true';
  return { state: shallow ? 'שכפול רדוד — רק הקומיטים שהורדו' : 'מלאה', G, memo: new Map() };
}
/** הקומיטים (HEAD ואבותיו) שנגעו בקובץ, מהחדש לישן, עם הטקסט של הקובץ בכל אחד (null ⇒ הקובץ לא קיים שם). */
function fileHistory(H, rel) {
  if (H.memo.has(rel)) return H.memo.get(rel);
  const log = git(H.G, ['log', '--format=%H%x09%s', 'HEAD', '--', rel]);
  const commits = log.status === 0 ? String(log.stdout).split('\n').filter(Boolean).map((l) => { const [hash, ...s] = l.split('\t'); return { hash, short: hash.slice(0, 7), subject: s.join('\t').slice(0, 120) }; }) : [];
  if (commits.length) {
    const r = git(H.G, ['cat-file', '--batch'], Buffer.from(commits.map((c) => c.hash + ':' + rel).join('\n') + '\n'));
    const buf = r.stdout; let i = 0;
    for (const c of commits) {
      const nl = buf.indexOf(10, i); const head = buf.subarray(i, nl).toString('utf8'); i = nl + 1;
      const m = /^\S+ blob (\d+)$/.exec(head);
      if (!m) { c.text = null; continue; }
      const n = Number(m[1]); c.text = buf.subarray(i, i + n).toString('utf8'); i += n + 1;
    }
  }
  H.memo.set(rel, commits);
  return commits;
}
/**
 * הטווח של הצהרה **כולל הערה בסוף השורה האחרונה שלה** (`… ; // …`) — השחזור מחזיר את השורה כמו שהייתה, בלי הערה ישנה
 * שמתארת את הגוף שהוחלף. הזהות (כפולים / "זהה לנוכחית") — לפי הקוד בלבד, בלי ההערה.
 */
export function declSpan(text, d) {
  const nl = text.indexOf('\n', d.stmt[1]);
  const rest = text.slice(d.stmt[1], nl < 0 ? text.length : nl);
  return [d.stmt[0], /^[ \t]*(\/\/.*)?$/.test(rest) ? d.stmt[1] + rest.replace(/[ \t]+$/, '').length : d.stmt[1]];
}
/** הגרסאות ההיסטוריות של הפונקציה (ההצהרה העליונה בלבד), מהחדשה לישנה, בלי כפולים ובלי הנוכחית. + מונים למה דולגו. */
export async function historyVersions(H, rel, symbol, current) {
  const out = { versions: [], scanned: 0, absent: 0, same: 0 };
  if (!H.G) return out;
  const seen = new Set([current]);
  for (const c of fileHistory(H, rel)) {
    if (out.versions.length >= HIST_CAP) break;
    out.scanned++;
    const d = c.text == null ? null : await findDecl(c.text, symbol);
    if (!d) { out.absent++; continue; }
    const code = c.text.slice(d.stmt[0], d.stmt[1]);
    if (seen.has(code)) { out.same++; continue; }
    seen.add(code);
    const sp = declSpan(c.text, d);
    out.versions.push({ hash: c.hash, short: c.short, subject: c.subject, stmt: c.text.slice(sp[0], sp[1]), line: d.line });
  }
  return out;
}
/**
 * «מבטל איחוד» — חלקי-המכונה המוכחים (catalog/self/parts.mjs: "כל אחד פעם אחת") שההצהרה של היום קוראת להם וההיסטורית לא.
 * גרסה ישנה שמעתיקה את החלק במקום לקרוא לו חוסכת רק את עלות-הקריאה (צעד או שניים לכל קריאה) — ומחזירה העתק שהמכונה
 * כבר איחדה (SELF). במסלול-המהירות זה לא "נסיגה בביצועים" ⇒ לא משחזרים. מחזיר את השמות (ממוינים). טהור.
 */
export const SHARED_PARTS = 'catalog/self/parts.mjs';
export async function sharedPartsDropped(rel, text, d, histStmt) {
  const ts = await TS();
  const shared = [...d.imports].filter(([, v]) => path.posix.normalize(path.posix.join(path.posix.dirname(rel), v.from)) === SHARED_PARTS).map(([k]) => k);
  if (!shared.length) return [];
  const refs = (src) => { const out = new Set(); const sf = ts.createSourceFile('x.mjs', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS); const walk = (n) => { if (ts.isIdentifier(n)) out.add(n.text); ts.forEachChild(n, walk); }; walk(sf); return out; };
  const now = refs(text.slice(d.stmt[0], d.stmt[1])); const then = refs(histStmt);
  return shared.filter((k) => now.has(k) && !then.has(k)).sort();
}

/** השינוי המכני של שחזור: ההצהרה הנוכחית ⇒ ההצהרה ההיסטורית, מילה במילה (שאר הקובץ — כמו שהוא). */
export async function makeHistoryPatch(root, subj, stmt) {
  const t = fs.readFileSync(path.join(root, subj.path), 'utf8');
  const d = await findDecl(t, subj.symbol);
  if (!d) return { why: 'ההצהרה של הנבדק לא נמצאה כפונקציה עליונה' };
  const sp = declSpan(t, d);
  return { files: { [subj.path]: t.slice(0, sp[0]) + stmt + t.slice(sp[1]) } };
}
/** טוען גרסה של קובץ (טקסט בזיכרון) לארגז: קובץ-אח זמני באותה תיקייה (הייבואים היחסיים נפתרים כמו במקור), נמחק מיד. */
async function loadVariant(root, M, rel, text, symbols) {
  const abs = path.join(root, rel);
  const tmp = path.join(path.dirname(abs), '.self-loop-hist-' + process.pid + path.extname(abs));
  const expose = [...new Set(symbols)].filter((s) => !new RegExp('export\\s+(async\\s+)?(function|const|let|class)\\s+' + s + '\\b').test(text)).sort();
  try {
    fs.writeFileSync(tmp, text);
    return M.sandbox.loadInSandbox(await M.sandbox.bundleFile(tmp, { expose, esm: true, cli: true }));
  } catch { return null; } finally { fs.rmSync(tmp, { force: true }); }
}

/* ═══════════════ ⚡ הזיכרון (SPEED1000, 14.10.2026) ═══════════════ */

/**
 * "הלולאה עם זיכרון" — שתי שכבות, כל אחת עם נפילה בטוחה לחישוב המלא, והפנקס ביט-זהה בכל דרך (ratchet: speed1000.test):
 *   1. **הכול-או-כלום** (`wholeKey`): טביעה של כל קובץ ב-catalog/ · src/ · telephony/ · functions/ + הגדרות-TS + גרסאות
 *      node/typescript/rolldown + האפשרויות — דרך האינדקס של git (lib/gitfp.mjs — בלי לקרוא קובץ נקי). + ההיסטוריה: הקומיט
 *      שבו נשמר הזיכרון (P) הוא אב של HEAD, בלי מיזוגים בדרך, ואף קומיט P..HEAD לא נגע בקובץ של נבדק ⇒ "הגרסה של אתמול"
 *      של כל נבדק זהה. שווה ⇒ השורות מהזיכרון (הפנקס שבריפו — אם טביעתו = מה שנרשם — או המטמון המקומי). שכפול טרי: ~0.2s.
 *   2. **לפי נבדק** (מטמון מקומי): השלב הגלובלי רץ (הנבדקים, המחסן — שניות), ולכל נבדק — שורת-הפנקס נשלפת אם **כל קובץ
 *      שהבדיקה שלו נגעה בו** (נרשם תוך כדי: קריאות-fs בתהליך + כל מה שהאורז ארז — globalThis.__catalogBundleDeps ב-sandbox)
 *      עם אותה טביעה, ההיסטוריה של הקובץ שלו זהה, וערכי השלב הגלובלי (הנבדקים · המחסן לפועל · כלי-הבדיקה) זהים.
 *      שינוי בפונקציה אחת ⇒ רק הנבדקים שקבציהם (שלהם או של המועמדים שלהם) השתנו נבדקים מחדש. שינוי בכלי-הבדיקה עצמו
 *      (catalog/lib · combiner · inner/lib · core · self/{loop,roles,parts} · src/lib/atoms — החוקים, הארגז, המחולל) ⇒ הכול.
 * שורה שמחכה לבדיקה על עותק ('לבדיקה') לא נשמרת — היא תמיד מחושבת מחדש. `CATALOG_CACHE=off` / `SELF_LOOP_MEMO=off` ⇒ בלי זיכרון.
 */
export const MEMO = 'catalog/self/loop-memo.json';
const MEMO_V = 'loop-memo-v1';
const MEMO_OFF = () => process.env.CATALOG_CACHE === 'off' || process.env.SELF_LOOP_MEMO === 'off';
const SCOPE_DIRS = ['catalog', 'src', 'telephony', 'functions'];
const SCOPE_FILES = ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'jsconfig.json'];
const SCOPE_SKIP = new Set(['node_modules', 'gen', '.git', '.cache']);
/** הפלטים של הלולאה עצמה (לא קלט שלה) + הקבצים הפרושים (נגזרים מהמחסן, שנמצא בהיקף). */
const notInput = (rel) => rel === LEDGER || rel === MEMO || rel === 'catalog/self/loop-demo.json' || /^catalog\/(sources|behavior)\/inner-[^/]*\.json$/.test(rel);
const fpOf = (...parts) => { const h = crypto.createHash('sha256'); for (const p of parts) { const b = Buffer.from(String(p)); h.update(b.length + ':'); h.update(b); } return h.digest('hex').slice(0, 32); };
const verOf = (root, pkg) => { try { return JSON.parse(fs.readFileSync(path.join(root, 'node_modules', pkg, 'package.json'), 'utf8')).version; } catch { return '?'; } };
const envKey = (root) => ['node' + process.versions.node.split('.')[0], verOf(root, 'typescript'), verOf(root, 'rolldown'), process.env.SELF_LOOP_GIT ? 'git:' + process.env.SELF_LOOP_GIT : fs.existsSync(path.join(root, '.git')) ? 'git' : 'no-git'];

/** כל הקבצים בהיקף (יחסיים, ממוינים). */
function scopeFiles(root) {
  const out = [];
  const walk = (rel) => {
    let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) { if (!SCOPE_SKIP.has(e.name)) walk(r); } else if (e.isFile() && !/^\.env/.test(e.name) && !notInput(r)) out.push(r);
    }
  };
  for (const d of SCOPE_DIRS) walk(d);
  for (const f of SCOPE_FILES) if (fs.existsSync(path.join(root, f))) out.push(f);
  return out.sort();
}
/** שכבה 1: טביעת כל ההיקף + הסביבה + האפשרויות. */
export function wholeKey(root, opts, idx = gitIndex(root)) {
  return fpOf(MEMO_V, JSON.stringify(opts), ...envKey(root), ...scopeFiles(root).flatMap((f) => [f, fileSha(root, idx, f)]));
}
/** HEAD + האם רדוד — כמו historySource (אותו מקור-git). מהיר: קריאה ישירה מ-.git (readHead + קובץ shallow), בלי תהליך. */
function headOf(root) {
  if (!process.env.SELF_LOOP_GIT) {
    const head = readHead(root);
    if (head) {
      let gd = path.join(root, '.git');
      try { if (fs.statSync(gd).isFile()) gd = path.resolve(root, /^gitdir: (.+)$/m.exec(fs.readFileSync(gd, 'utf8'))[1].trim()); let c = gd; try { c = path.resolve(gd, fs.readFileSync(path.join(gd, 'commondir'), 'utf8').trim()); } catch { /* */ } gd = c; } catch { /* */ }
      const state = fs.existsSync(path.join(gd, 'shallow')) ? 'שכפול רדוד — רק הקומיטים שהורדו' : 'מלאה'; // = historySource
      return { head, state, get H() { return historySource(root); } };
    }
  }
  const H = historySource(root);
  if (!H.G) return { head: null, state: H.state, H };
  return { head: String(git(H.G, ['rev-parse', 'HEAD']).stdout).trim(), state: H.state, H };
}
/** ההיסטוריה של כל קובץ-נבדק זהה לזו שב-P: P אב של HEAD, בלי מיזוג בדרך, ואף קומיט P..HEAD לא נגע בקבצים. */
export function historySame(root, memo, history) {
  if (!history) return true;
  const hh = headOf(root);
  const { head, state } = hh;
  if (state !== memo.hstate) return false;
  if (head && head === memo.head) return true; // אותו HEAD ⇒ אותה היסטוריה (בלי תהליך git)
  const H = hh.H;
  if (!H.G) return memo.head == null;
  if (!memo.head || git(H.G, ['merge-base', '--is-ancestor', memo.head, head]).status !== 0) return false;
  const log = git(H.G, ['log', '--format=%x01%P', '--name-only', '-m', memo.head + '..' + head]);
  if (log.status !== 0) return false;
  const files = new Set(memo.subjectFiles);
  for (const block of String(log.stdout).split('\x01').slice(1)) {
    const [parents, ...names] = block.split('\n');
    if (parents.trim().split(/\s+/).length > 1) return false; // מיזוג ⇒ הפישוט של git log עלול לבחור הורה אחר — לא סומכים
    if (names.some((n) => files.has(n.trim()))) return false;
  }
  return true;
}
/** שכבה 1 — שליפה. מחזיר {rows, hstate} או null. */
export async function wholeGet(root, opts) {
  if (MEMO_OFF()) return null;
  const idx = await gitIndexAsync(root);
  const key = wholeKey(root, opts, idx);
  // (א) הזיכרון שבריפו — מצביע על הפנקס שבריפו (רק כשאין שורה שמחכה לבדיקה ⇒ הפנקס = שורות-התוכנית)
  try {
    const m = JSON.parse(fs.readFileSync(path.join(root, MEMO), 'utf8'));
    if (m.version === MEMO_V && m.key === key && fileSha(root, idx, LEDGER) === m.ledger && historySame(root, m, opts.history)) {
      const L = JSON.parse(fs.readFileSync(path.join(root, LEDGER), 'utf8'));
      return { rows: L.rows, hstate: m.hstate, from: 'הזיכרון שבריפו' };
    }
  } catch { /* אין / פגום ⇒ הלאה */ }
  // (ב) המטמון המקומי
  const hit = cacheGetLocal(root, 'loop-all', key);
  if (hit && historySame(root, hit, opts.history)) return { rows: hit.rows, hstate: hit.hstate, from: 'המטמון המקומי' };
  return null;
}
/** שכבה 1 — שמירה (מקומי תמיד; בריפו — רק עם --apply, ורק כשאין שורה שמחכה ⇒ הפנקס שנכתב = השורות). */
export function wholePut(root, opts, rows, hstate, subjectFiles, { repo = false } = {}) {
  if (MEMO_OFF()) return;
  const idx = gitIndex(root);
  const key = wholeKey(root, opts, idx);
  const { head } = headOf(root);
  const files = [...new Set(subjectFiles)].sort();
  cachePutLocal(root, 'loop-all', key, { rows, hstate, head: opts.history ? head : null, subjectFiles: files });
  if (repo && !rows.some((r) => r.decision === 'לבדיקה')) {
    const m = { version: MEMO_V, note: 'נוצר ע"י catalog/self/loop.mjs --apply — הזיכרון של הלולאה: טביעת כל ההיקף (key), הפנקס שנכתב (ledger = sha של git), והקומיט שממנו נגזרה ההיסטוריה (head). שכפול טרי בלי שינוי ⇒ הפנקס נלקח מכאן בלי לבדוק שוב.', key, ledger: fileSha(root, idx, LEDGER), head: opts.history ? head : null, hstate, subjectFiles: files };
    fs.writeFileSync(path.join(root, MEMO), JSON.stringify(m, null, 1) + '\n');
  }
}
/** מטמון מקומי (node_modules/.cache/catalog-<מרחב>) — כמו lib/cache.mjs, של ה-root הנבדק (עותק ⇒ ה-node_modules המקושר). */
const cacheBase = (root) => (process.env.CATALOG_CACHE && process.env.CATALOG_CACHE !== 'off' ? path.resolve(process.env.CATALOG_CACHE) : path.join(root, 'node_modules/.cache'));
function cacheGetLocal(root, ns, key) {
  if (MEMO_OFF()) return undefined;
  try { return JSON.parse(fs.readFileSync(path.join(cacheBase(root), 'catalog-' + ns, key.slice(0, 2), key + '.json'), 'utf8')); } catch { return undefined; }
}
function cachePutLocal(root, ns, key, v) {
  if (MEMO_OFF()) return;
  const f = path.join(cacheBase(root), 'catalog-' + ns, key.slice(0, 2), key + '.json');
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = f + '.' + process.pid + '.tmp'; fs.writeFileSync(t, JSON.stringify(v)); fs.renameSync(t, f); } catch { /* האצה בלבד */ }
}

/**
 * שכבה 2 — «רושם»: כל קובץ שנקרא (fs בתהליך — גם המהדר) או נארז (האורז) בזמן שקבוצה פתוחה נרשם לכל הקבוצות הפתוחות.
 * קבצים מחוץ ל-root / ב-node_modules — מכוסים בגרסאות (envKey), לא נרשמים. תיקייה ⇒ נרשמת עם רשימת-השמות שלה.
 */
function makeRecorder(root) {
  const stack = [];
  const real = (() => { try { return fs.realpathSync(root); } catch { return root; } })();
  const relOf = (p) => {
    if (p instanceof URL) p = fileURLToPath(p);
    if (typeof p !== 'string') return null;
    const abs = path.resolve(p);
    for (const base of [root, real]) {
      const r = path.relative(base, abs);
      if (r && !r.startsWith('..') && !path.isAbsolute(r)) return r.split(path.sep).includes('node_modules') ? null : r.split(path.sep).join('/');
    }
    return null;
  };
  const note = (p, dir) => { if (!stack.length) return; const r = relOf(p); if (r == null) return; for (const set of stack) set.add(dir ? r + '/' : r); };
  const orig = {}; let prevHook;
  const NAMES = [['readFileSync', false], ['existsSync', false], ['statSync', false], ['lstatSync', false], ['readdirSync', true]];
  return {
    start() {
      for (const [n, dir] of NAMES) { orig[n] = fs[n]; const f = orig[n]; fs[n] = function (p, ...rest) { note(p, dir); return f.call(this, p, ...rest); }; }
      syncBuiltinESMExports();
      prevHook = globalThis.__catalogBundleDeps; // (מעקב-קריאות של בדיקות — lib/trace-reads.mjs — ממשיך לקבל)
      globalThis.__catalogBundleDeps = (deps) => { for (const d of deps) note(d, false); prevHook?.(deps); };
    },
    stop() { for (const [n] of NAMES) fs[n] = orig[n]; syncBuiltinESMExports(); if (prevHook) globalThis.__catalogBundleDeps = prevHook; else delete globalThis.__catalogBundleDeps; },
    /** מריץ fn כשהקבוצה פתוחה (מקוננת: כל קבוצה פתוחה מקבלת). */
    async within(set, fn) { stack.push(set); try { return await fn(); } finally { stack.splice(stack.lastIndexOf(set), 1); } },
    /** תלויות של זיכרון-פנימי (נשלף בלי לקרוא שוב) ⇒ לכל הקבוצות הפתוחות. */
    add(files) { for (const set of stack) for (const f of files) set.add(f); },
  };
}
/** טביעה של רשימת-תלויות: קובץ ⇒ sha (חסר ⇒ '!'); תיקייה ⇒ שמות-הרשומות שבה. */
function depsPrint(root, idx, deps) {
  return deps.map((d) => {
    if (d.endsWith('/')) { let es; try { es = fs.readdirSync(path.join(root, d)).sort().join('\n'); } catch { es = '!'; } return [d, fpOf(es)]; }
    let st; try { st = fs.statSync(path.join(root, d)); } catch { return [d, '!']; }
    return [d, st.isFile() ? fileSha(root, idx, d) : st.isDirectory() ? 'dir' : '?'];
  });
}
const SUBJ_SLOTS = 4;
/** כלי-הבדיקה: קבצים שכל שינוי בהם משנה את הבדיקה של כולם (החוקים · הארגז · המחולל · המחסן · הלולאה). */
const TOOL_DIRS = ['catalog/lib', 'catalog/combiner', 'catalog/inner/lib', 'catalog/core', 'src/lib/atoms'];
const TOOL_FILES = ['catalog/self/loop.mjs', 'catalog/self/roles.mjs', 'catalog/self/parts.mjs', 'catalog/scripts/rebuild.mjs'];
function toolKey(root, idx) {
  const out = [];
  const walk = (rel) => { let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; } for (const e of es) { const r = rel + '/' + e.name; if (e.isDirectory()) { if (!SCOPE_SKIP.has(e.name) && r !== 'src/lib/atoms/engines/generated') walk(r); } else if (e.isFile() && /\.(mjs|js|ts|tsx|json)$/.test(e.name)) out.push(r); } };
  for (const d of TOOL_DIRS) walk(d);
  out.push(...TOOL_FILES);
  return fpOf('tools', ...envKey(root), ...out.sort().flatMap((f) => [f, fileSha(root, idx, f) ?? '!']));
}

/* ═══════════════ הלולאה ═══════════════ */

/**
 * שלב א׳ (זול, בלי עותק): לכל נבדק — חוקים, קלטים, מועמדים ופסיקה. מחזיר את שורות-הפנקס + התור לבדיקה על העותק.
 */
export async function plan(root = ROOT, { only = null, history = true } = {}) {
  const R0 = makeRecorder(root);
  R0.start();
  try { return await planInner(root, { only, history }, R0); } finally { R0.stop(); }
}
async function planInner(root, { only, history }, REC) {
  const M = await machineMods(root);
  const H = history ? historySource(root) : { state: 'כבוי (--no-history)', G: null };
  const all = await subjectsOf(root, M);
  const subjects = only ? all.filter((s) => only.some((o) => s.id.includes(o))) : all;
  const W = await warehouse(root, M, all);
  const loadFile0 = fileLoader(root, M);
  // ⚡ הזיכרון (שכבה 2): קובץ שנטען פעם אחת ונשלף מהזיכרון — התלויות שלו נרשמות גם למי ששלף
  const loadDeps = new Map();
  const loadFile = async (rel, symbols) => {
    const k = rel + '|' + [...symbols].sort().join(',');
    if (loadDeps.has(k)) { REC.add(loadDeps.get(k)); return loadFile0(rel, symbols); }
    const set = new Set([rel]);
    const mod = await REC.within(set, () => loadFile0(rel, symbols));
    loadDeps.set(k, set); REC.add(set);
    return mod;
  };
  const VER = await verifiable(root);
  const IDX = gitIndex(root);
  const scope0 = wholeKey(root, { only: null, history: true }, IDX); // לבדיקת-יציבות בסוף (ראו stable)
  const memoOn = !MEMO_OFF();
  // ערכי השלב הגלובלי שהשורה של נבדק תלויה בהם — כערכים (לא כקבצים), ורק של **הפועל שלו**: המועמדים הם מאותו פועל
  // (שאר הנבדקים · המחסן · השילובים), ומהגרף של הבונה-מחדש — רק האם הקובץ שלו בתוכו. נבדק חדש בפועל אחר לא נוגע בשורה.
  const TOOLS = toolKey(root, IDX);
  const gkeyOf = (s) => fpOf('loop-subj-v2', TOOLS, H.state, JSON.stringify(s), VER.has(s.path) ? 'checkable' : '-',
    JSON.stringify(all.filter((o) => o.verb === s.verb)),
    JSON.stringify((W.byVerb.get(s.verb) ?? []).map((p) => [p.id, p.takes.length, p.homes.map((h) => h.id)])),
    JSON.stringify(W.combos.filter((r) => r.verb === s.verb).length));
  const histOf = (rel) => (H.G ? fileHistory(H, rel).map((c) => c.hash) : [H.state]);
  // הרצת-המועמדים מהקטלוג — פעם אחת לכל פועל (loadRunners טוען כל קובץ פעם אחת)
  const runnersMemo = new Map(); const runnersDeps = new Map();
  const catalogRunners = async (verb, arity) => {
    const k = verb + '/' + arity;
    if (runnersMemo.has(k)) { REC.add(runnersDeps.get(k)); return runnersMemo.get(k); }
    const parts = W.byVerb.get(verb).filter((p) => p.takes.length === arity);
    const dset = new Set(); runnersDeps.set(k, dset);
    const rs = parts.length ? await REC.within(dset, () => W.comb.loadRunners(parts, W.raw)) : new Map();
    REC.add(dset);
    const list = [];
    for (const p of parts) {
      const R = rs.get(p.id);
      const home = p.homes.map((h) => W.raw.get(h.id)).find((r) => r && rs.has(p.id)) ?? W.raw.get(p.homes[0].id);
      list.push({ id: p.id, project: home?.source ?? p.source, path: home?.path ?? null, symbol: home?.symbol ?? null, R: R && !R.self ? R : null, why: !R ? 'לא נטען להרצה כאן' : R.self ? 'שיטה של מחלקה — דורש מתאם' : null });
    }
    runnersMemo.set(k, list);
    return list;
  };

  const rows = [];
  const queue = [];
  const memoStats = { reused: 0, checked: 0 };
  const puts = [];
  for (const s of subjects) {
    const mkey = gkeyOf(s);
    // כמה גרסאות אחרונות לכל נבדק (ביטול-שינוי / מעבר-ענף ⇒ עדיין מהזיכרון)
    const slot = (memoOn && cacheGetLocal(root, 'loop-subj', mkey)) || { list: [] };
    const hist = fpOf(...histOf(s.path));
    const hit = (slot.list || []).find((e) => e.hist === hist && JSON.stringify(depsPrint(root, IDX, e.deps.map(([d]) => d))) === JSON.stringify(e.deps));
    if (hit) { rows.push(hit.row); memoStats.reused++; continue; }
    memoStats.checked++;
    const deps = new Set([s.path]);
    const row = await REC.within(deps, () => planOne(s));
    if (row && memoOn && row.decision !== 'לבדיקה') puts.push(() => cachePutLocal(root, 'loop-subj', mkey, { list: [{ hist, deps: depsPrint(root, IDX, [...deps].sort()), row }, ...(slot.list || [])].slice(0, SUBJ_SLOTS) }));
  }
  // הזיכרון נכתב רק אם שום קובץ בהיקף לא השתנה במהלך ההרצה (עריכה באמצע ⇒ שורה שחושבה מהקוד הישן לא תישמר תחת הטביעה החדשה)
  const stable = memoOn && wholeKey(root, { only: null, history: true }) === scope0;
  if (stable) for (const put of puts) put();
  return { rows, queue, M, H, memo: { ...memoStats, ...(memoOn && !stable ? { unstable: true } : {}) }, subjectFiles: all.map((x) => x.path), stable };

  async function planOne(s) {
    const mod = await loadFile(s.path, [s.symbol]);
    const sig = s.sig ?? { takes: s.takes };
    const o = probeOpts(root, M, s); const { seed } = o;
    const d = await findDecl(fs.readFileSync(path.join(root, s.path), 'utf8'), s.symbol);
    const arity = d?.params ? d.params.length : sig.takes.length;
    const row = { subject: s.id, at: at(s.path, d?.line), verb: s.verb, from: s.from, ...(s.role ? { role: s.role } : {}) };
    const R = runnerOf(M, mod, s.symbol, sig, s.adapt);
    if (!R) { const r = { ...row, found: [], decision: 'נשאר', why: 'לא נטען לארגז-החול — אין על מה לבדוק' }; rows.push(r); return r; }
    const checkable = VER.has(s.path);
    const L = lawsOf(M, R, s.verb, o);
    const base = runOn(M, R, L.inputs, seed);
    const seen = new Set(L.inputs.map((a) => JSON.stringify(a)));
    row.laws = L.held ? L.holds : '✗ ' + L.law + ' — ' + L.why;
    row.inputs = L.inputs.length;
    row.steps = base.steps;
    const found = [];
    if (!L.held) found.push('באג: ' + L.law);

    // ── המועמדים, לפי הסדר: חלקי-המכונה · הקטלוג · השילובים
    const cands = [];
    for (const o of all) {
      if (o.verb !== s.verb || (o.path === s.path && o.symbol === s.symbol) || o.from === 'הקורא' && cands.some((c) => c.path === o.path && c.symbol === o.symbol)) continue;
      if (cands.some((c) => c.path === o.path && c.symbol === o.symbol)) continue;
      cands.push({ id: 'machine:' + o.path + '#' + o.symbol, project: 'machine', path: o.path, symbol: o.symbol, machine: true });
    }
    for (const c of await catalogRunners(s.verb, arity)) cands.push(c);
    const combos = W.combos.filter((r) => r.verb === s.verb);

    const tally = {}; const tried = [];
    const count = (why) => { tally[why] = (tally[why] ?? 0) + 1; };
    for (const c of cands) {
      let CR = c.R ?? null;
      if (c.machine) {
        const cm = await loadFile(c.path, [c.symbol]);
        const cd = await findDecl(fs.readFileSync(path.join(root, c.path), 'utf8'), c.symbol);
        if (!cd || (cd.params && cd.params.length !== arity)) { count('צורה אחרת — דורש מתאם'); continue; }
        CR = runnerOf(M, cm, c.symbol, sig, s.adapt);
        c.line = cd.line;
      } else if (CR) {
        if (CR.sig.takes.length !== arity) { count('צורה אחרת — דורש מתאם'); continue; }
        CR = { ctx: CR.ctx, fn: s.adapt ? vm.runInContext('(' + s.adapt + ')', CR.ctx)(CR.fn) : CR.fn, sig };
      }
      if (!CR) { count(c.why ?? 'לא נטען להרצה כאן'); continue; }
      const CL = lawsOf(M, CR, s.verb, o);
      if (!CL.held) { count('לא עובר את חוקי הפועל כאן'); continue; }
      // הקלטים: של הנבדק **ושל** החלופה (הקורא נתן לכל אחד את שלו) — שוויון בשני הכיוונים, לא רק על הקלטים של אחד מהם
      const ins = [...L.inputs, ...CL.inputs.filter((a) => !seen.has(JSON.stringify(a)))];
      const mine = ins.length === L.inputs.length ? base : runOn(M, R, ins, seed);
      const run = runOn(M, CR, ins, seed);
      const law = speedLaw(mine, run);
      const strong = distinguishing(mine.outs);
      if (L.held && law.laws['speed.same'].ok && !strong) { count('אותם פלטים — אבל אין מספיק קלטים מבחינים (פלט אחד שולט)'); continue; }
      const diffs = run.outs.reduce((n, x, k) => n + (x === mine.outs[k] ? 0 : 1), 0);
      c.line ??= c.path ? await lineOf(root, c.path, c.symbol) : null;
      const t = { cand: c.id, project: c.project, at: c.path ? at(c.path, c.line) : null, laws: CL.holds, inputs: ins.length, same: law.laws['speed.same'].ok ? 'כן' : law.laws['speed.same'].why, steps: run.steps + ' מול ' + mine.steps, diffs, _ins: ins, _base: mine, _n: run.steps, _outs: run.outs };
      if (!L.held) t.verdict = 'מתקן (עובר n/n)';
      else if (!law.laws['speed.same'].ok) t.verdict = 'נדחה — ' + law.laws['speed.same'].why;
      else if (!law.laws['speed.fewer'].ok) t.verdict = 'כפילות — ' + law.laws['speed.fewer'].why;
      else t.verdict = 'מהיר יותר (' + run.steps + ' מול ' + mine.steps + ' צעדים)';
      if (L.held && law.laws['speed.same'].ok) t.kind = law.laws['speed.fewer'].ok ? 'חלופה זולה' : 'כפילות';
      const eligible = (!L.held || law.ok);
      if (eligible && !(c.path && importable(c.path))) t.verdict += ' · דורש מתאם-ייבוא (' + (c.path ? (/\.tsx?$/.test(c.path) ? 'קובץ TS' : 'מחוץ למכונה') : 'ערך-בדרך בתוך פונקציה') + ')';
      t.eligible = eligible && !!c.path && importable(c.path) && !String(c.symbol).includes('.') && checkable;
      if (eligible && !checkable) t.verdict += ' · הקוד של הנבדק לא בגרף של הבונה-מחדש — דורש שכפול לאימות ביט-זהות';
      tried.push(t);
    }
    // ── «הגרסה של אתמול»: אותה פונקציה בקומיטים הקודמים, מהחדשה לישנה (SELF-LOOP2). כל גרסה = מועמד רגיל: חוקי-הפועל n/n
    //    על אותם קלטים · פלטים · צעדים — וההחלפה = ההצהרה ההיסטורית במקום הנוכחית (makeHistoryPatch), ואחריה שערי-העותק.
    const hist = [];
    if (d && H.G) {
      const text = fs.readFileSync(path.join(root, s.path), 'utf8');
      const hv = await historyVersions(H, s.path, s.symbol, text.slice(d.stmt[0], d.stmt[1]));
      const sp = declSpan(text, d);
      row.history = { scanned: hv.scanned, versions: hv.versions.length, ...(hv.same ? { sameText: hv.same } : {}), ...(hv.absent ? { absent: hv.absent } : {}) };
      for (const v of hv.versions) {
        const t = { cand: 'history:' + v.short, project: 'היסטוריה', commit: v.short + ' · ' + v.subject, at: at(s.path, v.line), hist: true, eligible: false, _stmt: v.stmt };
        hist.push(t);
        const HR = runnerOf(M, await loadVariant(root, M, s.path, text.slice(0, sp[0]) + v.stmt + text.slice(sp[1]), [s.symbol]), s.symbol, sig, s.adapt);
        if (!HR) { t.verdict = 'נדחה — הגרסה לא נטענת עם שאר הקובץ של היום'; continue; }
        const HL = lawsOf(M, HR, s.verb, o);
        t.laws = HL.held ? HL.holds : '✗ ' + HL.law;
        if (!HL.held) { t.verdict = 'נדחה — חוק הפועל נכשל גם בגרסה הזו (' + HL.law + ')'; continue; }
        const ins = [...L.inputs, ...HL.inputs.filter((a) => !seen.has(JSON.stringify(a)))];
        const mine = ins.length === L.inputs.length ? base : runOn(M, R, ins, seed);
        const run = runOn(M, HR, ins, seed);
        const law = speedLaw(mine, run);
        Object.assign(t, { inputs: ins.length, same: law.laws['speed.same'].ok ? 'כן' : law.laws['speed.same'].why, steps: run.steps + ' מול ' + mine.steps, _ins: ins, _base: mine, _n: run.steps, _outs: run.outs });
        const strong = distinguishing(mine.outs);
        if (!L.held) t.verdict = 'מתקן — שחזור (עובר n/n)';
        else if (!law.laws['speed.same'].ok) t.verdict = 'נדחה — ' + law.laws['speed.same'].why;
        else if (!strong) t.verdict = 'נדחה — אותם פלטים, אבל אין מספיק קלטים מבחינים';
        else if (!law.laws['speed.fewer'].ok) t.verdict = 'כמו היום — ' + law.laws['speed.fewer'].why;
        else if ((t._drop = await sharedPartsDropped(s.path, text, d, v.stmt)).length) t.verdict = 'נדחה — מבטל איחוד: מעתיקה את ' + t._drop.join(', ') + ' (חלק-מכונה מוכח, ' + SHARED_PARTS + ') במקום לקרוא לו — החיסכון (' + run.steps + ' מול ' + mine.steps + ' צעדים) הוא עלות-הקריאה בלבד';
        else { t.verdict = 'נסיגה בביצועים — הגרסה הזו מהירה יותר (' + run.steps + ' מול ' + mine.steps + ' צעדים)'; t.kind = 'נסיגה בביצועים'; }
        const fits = !L.held || (law.ok && strong && !t._drop?.length);
        if (fits && !checkable) t.verdict += ' · הקוד של הנבדק לא בגרף של הבונה-מחדש — דורש שכפול לאימות ביט-זהות';
        t.eligible = fits && checkable;
      }
    } else row.history = { state: H.G ? 'הנבדק לא נמצא כהצהרה עליונה' : H.state };
    for (const t of hist.filter((x) => x.kind)) found.push(t.kind + ': גרסה מ-' + t.commit);
    for (const r of combos) {
      if (s.adapt) { count('שילוב — דורש מתאם (לנבדק יש מתאם-תפקיד)'); continue; }
      count('שילוב — דורש מתאם-ייבוא (זמן-ריצה)');
    }
    // ההכרעה: באג ⇒ הקרוב ביותר להתנהגות הקיימת (הכי מעט פלטים שונים), ואז צעדים, ואז מזהה. מהירות ⇒ הכי מעט צעדים, ואז מזהה.
    const order = (a, b) => (!L.held ? a.diffs - b.diffs : 0) || a._n - b._n || (a.cand < b.cand ? -1 : a.cand > b.cand ? 1 : 0);
    tried.sort((a, b) => (a.cand < b.cand ? -1 : a.cand > b.cand ? 1 : 0));
    // סדר-ההעדפה (SELF-LOOP2): באג ⇒ קודם ההיסטוריה, מהחדשה לישנה (השינוי הקטן ביותר — אותה התנהגות בדיוק שהייתה), ורק
    // אחריה המחסן. מהירות ⇒ הכי מעט צעדים; שוויון בצעדים ⇒ ההיסטוריה קודם (שחזור מילה-במילה, בלי import חדש).
    const hw = hist.filter((t) => t.eligible);
    const ww = tried.filter((t) => t.eligible).sort(order);
    const winners = !L.held ? [...hw, ...ww] : [...hw, ...ww].sort((a, b) => a._n - b._n);
    // הממצאים: מהמכונה — כל אחד בשמו; מהמחסן — כמה, ודוגמה (הראשון לפי מזהה)
    for (const kind of ['כפילות', 'חלופה זולה']) {
      const ids = tried.filter((t) => t.kind === kind).map((t) => t.cand);
      for (const id of ids.filter((x) => x.startsWith('machine:'))) found.push(kind + ': ' + id);
      const other = ids.filter((x) => !x.startsWith('machine:'));
      if (other.length) found.push(kind + ': ' + (other.length === 1 ? other[0] : other.length + ' חלקים במחסן (לדוגמה ' + other[0] + ')'));
    }
    row.found = found;
    row.considered = cands.length + combos.length;
    // בפנקס: כל מועמד מהמכונה, וכל מי שעבר את חוק-המהירות או מתקן באג; שאר המחסן שנתן פלט אחר — נספר (בלי שורה לכל אחד)
    const keep = (t) => t.cand.startsWith('machine:') || t.same === 'כן' || !L.held;
    for (const t of tried) if (!keep(t)) count('עובר את החוקים — פלט אחר (חלק מהמחסן)');
    row.skipped = Object.fromEntries(Object.entries(tally).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
    row.tried = tried.filter(keep).map(({ eligible: _e, diffs: _d, _ins, _base, _n, _outs, kind: _k, ...t }) => t);
    if (hist.length) row.history.tried = hist.map(({ eligible: _e, hist: _h, _stmt, _drop, _ins, _base, _n, _outs, kind: _k, ...t }) => t);
    if (!winners.length) {
      row.decision = 'נשאר';
      row.why = !L.held ? 'באג — אין גרסה בהיסטוריה ואין חלק מוכח שעוברים את החוקים ונטענים מקוד המכונה' : found.length ? 'אין חלופה מהירה יותר שאפשר לייבא' : tried.length ? 'אין חלק עם אותם פלטים' : 'אין מועמד מאותה צורה';
    } else {
      row.decision = 'לבדיקה';
      queue.push({ s, row, winners, base, L, seed });
    }
    rows.push(row);
    return row;
  }
}

/* ═══════════════ העותק ═══════════════ */

const SKIP_COPY = new Set(['.git', 'node_modules', 'dist', 'knowledge']);
/** עותק של הריפו (בלי .git/node_modules/knowledge — node_modules קישור; הדוחות לא נקראים ע"י שום שלב/בדיקה). */
export function makeCopy(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_COPY.has(e.name)) continue;
    fs.cpSync(path.join(src, e.name), path.join(dst, e.name), { recursive: true, dereference: false });
  }
  fs.symlinkSync(path.join(src, 'node_modules'), path.join(dst, 'node_modules'));
  return dst;
}

/** קבצי-הקטלוג (בלי gen ובלי הקבצים הפרושים — כמו .gitignore). */
function catalogFiles(root) {
  const out = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) { if (e.name !== 'gen' && e.name !== 'node_modules') walk(r); } else if (!/^catalog\/(sources|behavior)\/inner-[^/]*\.json$/.test(r)) out.push(r);
    }
  };
  walk('catalog');
  return out.sort();
}
/** הקבצים שונים בין שני עצים (בתוך catalog). */
function diffFiles(a, b) {
  const fa = new Set(catalogFiles(a)); const fb = new Set(catalogFiles(b));
  const out = [];
  for (const f of [...new Set([...fa, ...fb])].sort()) {
    if (!fa.has(f) || !fb.has(f)) { out.push(f); continue; }
    if (!fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f)))) out.push(f);
  }
  return out;
}

/**
 * שלב ב׳: נסיון אחד על עותק. מחזיר {ok, checks, why?, files?}. העותק = הבסיס + השינוי.
 * הבדיקות, לפי הסדר (עוצרים בראשונה שנכשלת): חוקי-הפועל n/n · פלטים · צעדים · rebuild ביט-זהה · vitest catalog.
 */
async function attempt(base, W, item, w, { quick }) {
  const { s, L } = item;
  const note = w.hist ? '' : (L.held ? 'אותם פלטים, פחות צעדים — ' : 'תיקון באג (' + L.law + ') — ') + w.cand + (w.at ? ' (' + w.at + ')' : '');
  const p = w.hist ? await makeHistoryPatch(W, s, w._stmt) : await makePatch(W, s, { path: w.at.split(':')[0], symbol: w.cand.split('#')[1] }, note);
  const checks = {};
  if (p.why) return { ok: false, why: p.why, checks };
  for (const [rel, t] of Object.entries(p.files)) fs.writeFileSync(path.join(W, rel), t);
  // 1–3 · חוקים · פלטים · צעדים — בתהליך נפרד (מודולים טריים מהעותק)
  // הקלטים של הנבדק **המקורי** (חוקים כמו אידמפוטנטיות מזינים פלט כקלט — אחרי השינוי היו נוצרים קלטים אחרים)
  const inFile = path.join(W, '..', 'inputs.json'); fs.writeFileSync(inFile, JSON.stringify(w._ins));
  const r = spawnSync(process.execPath, [path.join(W, 'catalog/self/loop.mjs'), '--probe', s.id], { cwd: W, encoding: 'utf8', env: { ...process.env, SELF_LOOP_INPUTS: inFile }, maxBuffer: 1 << 28 });
  let pr = null; try { pr = JSON.parse(r.stdout.trim().split('\n').pop()); } catch { /* */ }
  if (!pr) return { ok: false, why: 'הנבדק לא נטען אחרי השינוי: ' + String(r.stderr).split('\n').find((l) => /Error/.test(l))?.slice(0, 140), checks };
  checks.laws = pr.held ? pr.holds : '✗ ' + pr.law;
  if (!pr.held) return { ok: false, why: 'חוקי הפועל נכשלו אחרי השינוי (' + pr.law + ')', checks };
  const want = L.held ? w._base.outs : item.fixOuts;
  const same = pr.outsOn === undefined ? null : speedLaw({ outs: want, steps: 0 }, { outs: pr.outsOn, steps: 0 }).laws['speed.same'];
  checks.outputs = same?.ok ? 'זהים (' + want.length + ' קלטים)' : '✗ ' + (same?.why ?? '?');
  if (!same?.ok) return { ok: false, why: 'פלט אחר אחרי השינוי — ' + same?.why, checks };
  checks.steps = pr.steps + ' מול ' + w._base.steps;
  if (L.held && !(pr.steps < w._base.steps)) return { ok: false, why: 'חוק-המהירות: אחרי השינוי ' + pr.steps + ' צעדים מול ' + w._base.steps + ' — לא פחות', checks };
  if (quick) { checks.rebuild = 'דולג (--quick)'; checks.vitest = 'דולג (--quick)'; return { ok: true, checks, files: Object.keys(p.files) }; }
  // 4 · rebuild על העותק ⇒ כל פלטי-הקטלוג ביט-זהים לבסיס (חוץ מהקוד שהשתנה ומהתיאור-העצמי catalog/self/*)
  const rb = spawnSync(process.execPath, [path.join(W, 'catalog/scripts/rebuild.mjs')], { cwd: W, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (rb.status !== 0) { checks.rebuild = '✗ נכשל'; return { ok: false, why: 'rebuild נכשל: ' + String(rb.stderr || rb.stdout).trim().split('\n').slice(-1)[0].slice(0, 140), checks }; }
  const changed = diffFiles(base, W).filter((f) => !p.files[f] && !f.startsWith('catalog/self/'));
  checks.rebuild = changed.length ? '✗ ' + changed.length + ' פלטים השתנו (' + changed.slice(0, 3).join(' · ') + ')' : 'ביט-זהה';
  if (changed.length) return { ok: false, why: 'פלטי-הקטלוג השתנו: ' + changed.slice(0, 3).join(' · '), checks };
  // 5 · הבדיקות של הקטלוג
  const vt = spawnSync(process.execPath, [path.join(W, 'node_modules/vitest/vitest.mjs'), 'run', 'catalog'], { cwd: W, encoding: 'utf8', env: { ...process.env, SELF_LOOP_INNER: '1' }, maxBuffer: 1 << 28 });
  const tl = String(vt.stdout).split('\n').find((l) => /^\s*Tests\s/.test(l))?.replace(/\x1b\[[0-9;]*m/g, '').trim();
  checks.vitest = vt.status === 0 ? '✓ ' + (tl ?? '') : '✗ ' + (tl ?? 'נכשל');
  if (vt.status !== 0) return { ok: false, why: 'vitest catalog נכשל — ' + (tl ?? ''), checks };
  return { ok: true, checks, files: Object.keys(p.files) };
}

/** הלולאה כולה. apply ⇒ מעתיק לריפו את מה שנשאר (+ כל מה ש-rebuild כתב בעותק) וכותב את הפנקס. */
export async function loop({ root = ROOT, apply = false, quick = false, only = null, work = null, history = true } = {}) {
  const opts = { only, history };
  // ⚡ שכבה 1: כל ההיקף זהה ⇒ השורות מהזיכרון (רק כשאין שורה שמחכה לבדיקה על עותק — אחרת צריך את התור)
  const w = await wholeGet(root, opts);
  if (w && !w.rows.some((r) => r.decision === 'לבדיקה')) {
    const ledger = ledgerOf(w.rows, { quick, history: w.hstate });
    if (apply) { writeIfChanged(path.join(root, LEDGER), JSON.stringify(ledger, null, 1) + '\n'); }
    return Object.defineProperty(ledger, 'memo', { value: { from: w.from }, enumerable: false });
  }
  const { rows, queue, H, memo, subjectFiles, stable } = await plan(root, opts);
  const tmp = work ?? fs.mkdtempSync(path.join(os.tmpdir(), 'self-loop-'));
  const kept = []; let lastGood = null;
  for (const item of queue) {
    item.row.attempts = [];
    for (const w of item.winners) {
      // באג: הפלטים שהחלק המוכח נותן — הם מה שהנבדק אמור לתת אחרי השינוי
      if (!item.L.held) item.fixOuts = w._outs;
      const W = makeCopy(root, path.join(tmp, 'w'));
      for (const k of kept) for (const [rel, t] of Object.entries(k.texts)) fs.writeFileSync(path.join(W, rel), t);
      const res = await attempt(lastGood ?? root, W, item, w, { quick });
      item.row.attempts.push({ cand: w.cand, ...(w.hist ? { commit: w.commit } : {}), ok: res.ok, checks: res.checks, ...(res.why ? { why: res.why } : {}) });
      if (res.ok) {
        const texts = Object.fromEntries(res.files.map((f) => [f, fs.readFileSync(path.join(W, f), 'utf8')]));
        kept.push({ texts });
        const keep = path.join(tmp, 'good'); fs.rmSync(keep, { recursive: true, force: true }); fs.renameSync(W, keep); lastGood = keep;
        item.row.decision = 'הוחלף';
        item.row.by = w.hist ? w.cand + ' (שחזור · ' + w.commit + ')' : w.cand + (w.at ? ' (' + w.project + ' · ' + w.at + ')' : '');
        item.row.why = w.hist
          ? (item.L.held ? 'נסיגה בביצועים ⇒ שוחזרה הגרסה מהקומיט: אותם פלטים, ' + res.checks.steps + ' צעדים' : 'החוק נכשל (' + item.L.law + ') ⇒ שוחזרה הגרסה האחרונה מההיסטוריה שעוברת הכול (מילה במילה)')
          : item.L.held ? 'חוק-המהירות: אותם פלטים, ' + res.checks.steps + ' צעדים' : 'החוק נכשל (' + item.L.law + ') ⇒ החלק המוכח עובר n/n';
        if (w.hist) item.row.restored = w.commit;
        item.row.files = res.files;
        break;
      }
    }
    if (item.row.decision === 'לבדיקה') { item.row.decision = 'הוחזר'; item.row.why = 'כל המועמדים נכשלו בבדיקה על העותק — ' + item.row.attempts.map((a) => a.why).join(' / '); }
  }
  const ledger = ledgerOf(rows, { quick, history: H.state });
  if (apply && lastGood) {
    for (const f of diffFiles(root, lastGood)) {
      const src = path.join(lastGood, f); const dst = path.join(root, f);
      if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); } else fs.rmSync(dst, { force: true });
    }
  }
  if (apply) writeIfChanged(path.join(root, LEDGER), JSON.stringify(ledger, null, 1) + '\n');
  if (!work) fs.rmSync(tmp, { recursive: true, force: true });
  // הזיכרון: רק כשלא היה מה לנסות על עותק (אחרת הקוד אולי השתנה, וה-checks של הניסיונות תלויים ב---quick)
  if (!queue.length && stable) wholePut(root, opts, rows, H.state, subjectFiles, { repo: apply });
  return Object.defineProperty(ledger, 'memo', { value: { from: 'חישוב', ...memo }, enumerable: false });
}
const writeIfChanged = (abs, text) => { let cur = null; try { cur = fs.readFileSync(abs, 'utf8'); } catch { /* */ } if (cur !== text) fs.writeFileSync(abs, text); };

export function ledgerOf(rows, { quick = false, history = 'כבוי (--no-history)' } = {}) {
  const n = (d) => rows.filter((r) => r.decision === d).length;
  return {
    version: 2,
    note: 'נוצר ע"י catalog/self/loop.mjs — לכל פונקציה של המכונה שהפועל שלה ידוע: מה נמצא, במה נבדק, מה הוחלט ולמה. דטרמיניסטי (בלי שעון, בלי נתיבים זמניים).',
    law: { id: SPEED_LAW.id, he: SPEED_LAW.he, laws: SPEED_LAW.laws.map((l) => l.id + ' — ' + l.he) },
    history: { source: 'git — HEAD ואבותיו בלבד (לעולם לא שינויים שלא קומטו)', state: history, cap: HIST_CAP + ' גרסאות שונות לכל פונקציה' },
    checks: quick ? 'מהיר: חוקים · פלטים · צעדים (בלי rebuild/vitest)' : 'מלא: חוקים · פלטים · צעדים · rebuild ביט-זהה · vitest catalog',
    summary: { subjects: rows.length, bugs: rows.filter((r) => r.found?.some((f) => f.startsWith('באג'))).length, duplicates: rows.filter((r) => r.found?.some((f) => f.startsWith('כפילות'))).length, cheaper: rows.filter((r) => r.found?.some((f) => f.startsWith('חלופה זולה'))).length, replaced: n('הוחלף'), restored: rows.filter((r) => r.restored).length, regressions: rows.filter((r) => r.found?.some((f) => f.startsWith('נסיגה בביצועים'))).length, reverted: n('הוחזר'), kept: n('נשאר') },
    rows,
  };
}

/** הקלטים שהקורא נותן לנבדק (לפי מזהה) — כמו בלולאה עצמה. להדגמות ולבדיקות. */
export async function subjectInputs(root, id) {
  const M = await machineMods(root);
  const s = (await subjectsOf(root, M)).find((x) => x.id === id);
  const mod = await fileLoader(root, M)(s.path, [s.symbol]);
  return lawsOf(M, runnerOf(M, mod, s.symbol, s.sig ?? { takes: s.takes }, s.adapt), s.verb, probeOpts(root, M, s)).inputs;
}

/* ═══════════════ נקודת-הכניסה ═══════════════ */

async function main() {
  const argv = process.argv.slice(2);
  const val = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  if (argv.includes('--probe')) {
    // תת-מצב פנימי (העותק): הנבדק אחרי השינוי — חוקים, פלטים על הקלטים של הנבדק המקורי (נוצרים מחדש, אותו זרע), צעדים
    const id = val('--probe');
    const M = await machineMods(ROOT);
    const s = (await subjectsOf(ROOT, M)).find((x) => x.id === id);
    const mod = await fileLoader(ROOT, M)(s.path, [s.symbol]);
    const R = runnerOf(M, mod, s.symbol, s.sig ?? { takes: s.takes }, s.adapt);
    const o = probeOpts(ROOT, M, s); const { seed } = o;
    const L = lawsOf(M, R, s.verb, o);
    const inputs = process.env.SELF_LOOP_INPUTS ? JSON.parse(fs.readFileSync(process.env.SELF_LOOP_INPUTS, 'utf8')) : L.inputs;
    const run = runOn(M, R, inputs, seed);
    console.log(JSON.stringify({ held: L.held, holds: L.holds, law: L.law, outsOn: run.outs, steps: run.steps }));
    return;
  }
  const apply = argv.includes('--apply'); const quick = argv.includes('--quick'); const check = argv.includes('--check');
  const only = val('--only') ? val('--only').split(',') : null;
  if (check) {
    const opts = { only, history: !argv.includes('--no-history') };
    let rows = (await wholeGet(ROOT, opts))?.rows;
    if (!rows) { const p = await plan(ROOT, opts); rows = p.rows; if (p.stable) wholePut(ROOT, opts, rows, p.H.state, p.subjectFiles); }
    const pending = rows.filter((r) => r.decision === 'לבדיקה');
    for (const r of pending) console.log('• ' + r.subject + ' — ' + r.found.join(' · '));
    console.log(pending.length ? '✗ ' + pending.length + ' שיפורים שלא הוחלו — הרץ: node catalog/self/loop.mjs --apply' : '✓ אין שיפור שלא הוחל');
    process.exit(pending.length ? 1 : 0);
  }
  const ledger = await loop({ apply, quick, only, history: !argv.includes('--no-history') });
  const out = val('--out');
  if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(ledger, null, 1) + '\n');
  const s = ledger.summary;
  const mm = ledger.memo;
  if (mm) console.error('⚡ ' + (mm.from === 'חישוב' ? 'חישוב: ' + mm.checked + ' נבדקו · ' + mm.reused + ' מהזיכרון (לפי נבדק)' + (mm.unstable ? ' · ⚠️ קבצים השתנו במהלך ההרצה — הזיכרון לא נכתב' : '') : 'כל הפנקס מ' + mm.from));
  console.log(`🔁 הלולאה: ${s.subjects} נבדקים · באגים ${s.bugs} · כפילויות ${s.duplicates} · חלופות זולות ${s.cheaper} ⇒ הוחלפו ${s.replaced} (מהם שוחזרו מההיסטוריה ${s.restored}) · הוחזרו ${s.reverted} · נשארו ${s.kept}${apply ? ' · הפנקס: ' + LEDGER : ''}`);
  for (const r of ledger.rows.filter((x) => x.decision !== 'נשאר' || x.found.length)) console.log(`  ${r.decision === 'הוחלף' ? '✓' : r.decision === 'הוחזר' ? '↩' : '·'} ${r.subject} — ${r.found.join(' · ') || '—'} ⇒ ${r.decision}${r.by ? ' ב-' + r.by : ''}${r.why ? ' (' + r.why + ')' : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
