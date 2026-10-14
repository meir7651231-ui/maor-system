/**
 * 🔓 פותח-הפונקציות · בונה מקור אחד (INNER, 14.10.2026): ריפו ⇒ { files: {נתיב: טקסט}, stats }.
 * משותף לסקריפט (open.mjs) ולבדיקה. לא כותב לדיסק ולא מריץ קוד.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { typeToDesc } from '../../lib/tsdesc.mjs';
import { makeRepoProgram } from './resolve.mjs';
import { kindOfDesc as rawKind } from '../../lib/entry.mjs';
import { conformKind } from '../../lib/build-index.mjs';
import { openFile, moduleText, toJs, PII, makeRepoCtx, useToJsMemo, takeToJsMemo } from './opener.mjs';
import { fingerprint, machineSalt, cacheGet, cachePut, CACHE_OFF } from '../../lib/cache.mjs';
import { sourceViewCached } from '../../lib/blank.mjs';
import { nameOf, doesOf } from './name.mjs';
import { REPOS, sourceFiles } from './repos.mjs';
import { packParts, storeText } from './store.mjs';
import { unwrap, symbolOf, isValueRef } from './purity.mjs';
import { byId, rankCounts } from '../../self/parts.mjs';

export const INNER_VERSION = 2; // v2: מעקב-ייבוא · עוזרים-סגורים · namespace · מחסן דחוס
/** סוג מהמילון המשותף (אחרי יישור: record:Foo-bar ⇒ record:fooBar; לא מוכר ⇒ unknown). */
const kindOfDesc = (d, n) => conformKind(rawKind(d, n));
const ARITH = new Set([ts.SyntaxKind.MinusToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.SlashToken, ts.SyntaxKind.PercentToken, ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken]);

const sortObj = rankCounts; // 🧩 SELF: חלק-המכונה המוכח (catalog/self/parts.mjs)
const typeTextRaw = (checker, t) => { try { const s = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation); return (s.length > 120 ? s.slice(0, 117) + '…' : s) || 'unknown'; } catch { return 'unknown'; } };

/** טיפוס של קלט: לפי ההצהרה שלו (גם בקובץ JS עם JSDoc). */
function paramType(checker, p) {
  let s = p.sym;
  if (s && s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s); } catch { /* */ } }
  const d = s && (s.valueDeclaration ?? s.declarations?.[0]);
  if (!d) return null;
  try { return checker.getTypeOfSymbolAtLocation(s, d); } catch { return null; }
}

/**
 * צורה יציבה וקטנה: מפתחות-סמל פנימיים של המהדר (`__@toStringTag@51` — המספר משתנה בין ריצות) נזרקים, ואובייקט ענק
 * (DOM, אירועים, React) נחתך בעומק עד שהצורה קטנה מ-6,000 תווים. עד 40 שדות לאובייקט (כמו typeToDesc).
 */
export function shrinkDesc(d, depth = 0, maxDepth = 3) {
  if (!d || typeof d !== 'object') return d;
  if (d.t === 'obj') return depth >= maxDepth ? { t: 'obj', ...(d.n ? { n: d.n } : {}), p: [] } : { ...d, p: (d.p ?? []).filter(([k]) => !String(k).startsWith('__@')).slice(0, 40).map(([k, v, o]) => [k, shrinkDesc(v, depth + 1, maxDepth), o]) };
  if (d.t === 'or') return d.of.length > 8 ? { t: 'any' } : { ...d, of: d.of.map((x) => shrinkDesc(x, depth, maxDepth)) };
  if (d.t === 'arr' || d.t === 'set' || d.t === 'rec') return { ...d, of: shrinkDesc(d.of, depth + 1, maxDepth) };
  if (d.t === 'tup') return { ...d, of: d.of.map((x) => shrinkDesc(x, depth + 1, maxDepth)) };
  if (d.t === 'map') return { ...d, k: shrinkDesc(d.k, depth + 1, maxDepth), v: shrinkDesc(d.v, depth + 1, maxDepth) };
  if (d.t === 'tp') return { ...d, of: shrinkDesc(d.of, depth, maxDepth) };
  return d;
}
const descOfRaw = (checker, t) => {
  if (!t) return { t: 'any' };
  let d = shrinkDesc(typeToDesc(checker, t), 0, 99);
  for (const md of [4, 3, 2, 1, 0]) { if (JSON.stringify(d).length <= 6000) break; d = shrinkDesc(d, 0, md); }
  return d;
};

/** קלט בלי טיפוס (JS): אם הוא משמש בחשבון ⇒ מספר. */
function usedAsNumber(L, p, checker) {
  let num = false;
  const nodes = [...L.stmts, ...(L.envelope ? L.envelope.events.flatMap((e) => [...e.args, ...(e.cond ? [e.cond] : [])]) : [])];
  const visit = (n) => {
    if (num) return;
    if (ts.isIdentifier(n) && isValueRef(n) && symbolOf(checker, n) === p.sym) {
      let x = n; while (x.parent && (ts.isParenthesizedExpression(x.parent) || ts.isNonNullExpression(x.parent))) x = x.parent;
      const q = x.parent;
      if (q && ts.isBinaryExpression(q) && (ARITH.has(q.operatorToken.kind) || (q.operatorToken.kind === ts.SyntaxKind.PlusToken && (ts.isNumericLiteral(unwrap(q.left)) || ts.isNumericLiteral(unwrap(q.right)))))) num = true;
      if (q && ts.isPrefixUnaryExpression(q) && q.operator === ts.SyntaxKind.MinusToken) num = true;
      if (q && ts.isCallExpression(q) && ts.isPropertyAccessExpression(q.expression) && ts.isIdentifier(q.expression.expression) && q.expression.expression.text === 'Math') num = true;
    }
    ts.forEachChild(n, visit);
  };
  for (const n of nodes) visit(n);
  return num;
}

/** מקור אחד: { files, stats } או { missing }. */
export function buildSource(ROOT, SRC, source, self = null) {
  // ⚡ SELF: «מטביע חותם» על כל מה שהפותח קורא (כל קובצי-המקור, קובץ-הקטלוג, tsconfig, המלח של המכונה) ⇒ אותה תוצאה
  // שמורה. אחרת — בנייה, עם מטמון-transpile לכל צומת/מודול (טקסט זהה ⇒ אותו JS). ביט-זהה: open --check.
  const t0 = buildInputs(ROOT, SRC, source, self);
  if (t0.key) { const hit = cacheGet('open', t0.key); if (hit) return hit; }
  const tjKey = fingerprint(machineSalt(), 'tojs-v1', ts.version, source);
  useToJsMemo(CACHE_OFF ? [] : cacheGet('tojs', tjKey));
  let res;
  try { res = buildSourceRaw(ROOT, SRC, source, self); } finally { const used = takeToJsMemo(); if (!CACHE_OFF) cachePut('tojs', tjKey, used); }
  if (t0.key && !res.missing) cachePut('open', t0.key, res);
  return res;
}

/** המפתח של בנייה: כל קובץ שהפותח עשוי לקרוא. null כשאין מטמון / חסר שכפול. */
function buildInputs(ROOT, SRC, source, self) {
  if (CACHE_OFF) return { key: null };
  const R = self ? { catalog: source, dir: null, roots: self.roots } : REPOS[source];
  const base = R.dir ? path.join(SRC, R.dir) : ROOT;
  if (!fs.existsSync(base)) return { key: null };
  const rels = self?.files ?? sourceFiles(base, R.roots);
  const catPath = path.join(ROOT, self ? self.docPath : path.join('catalog/sources', R.catalog + '.json'));
  const cfgs = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'jsconfig.json', 'package-lock.json'].map((f) => path.join(base, f)).filter((f) => fs.existsSync(f));
  const files = [catPath, ...cfgs, ...rels.map((r) => path.join(base, r))];
  // 🧽 SELF-V2: הפותח קורא TS בלי הערות (lib/blank.mjs) ⇒ הטביעה על אותה גרסה; נתיבים יחסיים ⇒ אותו מפתח בכל worktree
  const view = (f) => { const t = fs.readFileSync(f, 'utf8'); return f.startsWith(base + path.sep) ? sourceViewCached(f, t) : t; };
  return { key: fingerprint(machineSalt(), 'open-v2', source, JSON.stringify(self ?? null), ...files.flatMap((f) => [path.relative(ROOT, f), view(f)])) };
}

function buildSourceRaw(ROOT, SRC, source, self = null) {
  // 🪞 SELF: `self` = { roots, docPath, files? } — הפותח על הקוד של המכונה עצמה (מחוץ ל-REPOS, כדי שלא ייכנס לצינור-המוצרים)
  const R = self ? { catalog: source, dir: null, roots: self.roots } : REPOS[source];
  const catDoc = JSON.parse(fs.readFileSync(path.join(ROOT, self ? self.docPath : path.join('catalog/sources', R.catalog + '.json')), 'utf8'));
  let base = ROOT;
  if (R.dir) {
    base = path.join(SRC, R.dir);
    if (!fs.existsSync(base)) return { missing: 'אין שכפול-קריאה ב-' + base };
    const sha = String(catDoc.ref).split('@')[1] ?? '';
    let head = '';
    try { head = execFileSync('git', ['-C', base, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* */ }
    if (!sha || !head.startsWith(sha.slice(0, 7))) return { missing: `השכפול ב-${head.slice(0, 7) || '?'} ולא ב-${sha.slice(0, 7)} (ה-ref של המפקד)` };
  }
  const rels = self?.files ?? sourceFiles(base, R.roots);
  const program = makeRepoProgram(rels.map((r) => path.join(base, r)), base);
  const checker = program.getTypeChecker();
  // ⚡ SELF: «מחפש לפי מפתח» — צורת-טיפוס היא פונקציה טהורה של הטיפוס, ואותו טיפוס (Db, Supporter, OrgConfig…) חוזר
  // אלפי פעמים, וכל קלט חושב פעמיים (פרטיות + SIGS). מטמון לפי הטיפוס עצמו ⇒ 50s ⇒ ~10s, ביט-זהה (open --check).
  const descMemo = new Map(); const textMemo = new Map();
  const descOf = (c, t) => { if (!t) return descOfRaw(c, t); let d = descMemo.get(t); if (d === undefined) { d = descOfRaw(c, t); descMemo.set(t, d); } return d; };
  const typeText = (c, t) => { let x = textMemo.get(t); if (x === undefined) { x = typeTextRaw(c, t); textMemo.set(t, x); } return x; };
  const ptMemo = new Map(); const djMemo = new Map();
  const paramTypeOf = (p) => { if (!ptMemo.has(p)) ptMemo.set(p, paramType(checker, p)); return ptMemo.get(p); };
  const descJson = (d) => { let j = djMemo.get(d); if (j === undefined) { j = JSON.stringify(d); djMemo.set(d, j); } return j; };
  // v2: עוזרים מקבצים אחרים — רק מקבצי-המקור של הריפו עצמו (אותה רשימה שהפותח קורא)
  const repoSfs = new Set(rels.map((r) => program.getSourceFile(path.join(base, r))).filter(Boolean));
  const repo = makeRepoCtx(program, (x) => repoSfs.has(x));
  const catalogued = new Set(catDoc.parts.map((p) => p.path + '#' + p.symbol));
  const repoName = catDoc.repo;
  const files = {};
  const parts = [];
  const skips = {};
  const perFile = [];
  let candidates = 0; let sliced = 0; let clashes = 0;
  for (const rel of rels) {
    const sf = program.getSourceFile(path.join(base, rel));
    if (!sf) continue;
    let r;
    try { r = openFile({ program, sf, repo }); } catch (err) { skips['opener-error'] = (skips['opener-error'] ?? 0) + 1; void err; continue; }
    candidates += r.candidates;
    for (const [k, v] of Object.entries(r.skips)) skips[k] = (skips[k] ?? 0) + v;
    if (!r.lifts.length) continue;
    const genRel = `catalog/inner/gen/${source}/${rel}.mjs`;
    const header = `// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך ${source}:${rel} — לא לערוך ביד.\n// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.`;
    let mod = moduleText(r.lifts, sf, header);
    // פרטיות גם בצורות-הקלט: טיפוס-ליטרלי ('x@y.com') נכנס ל-SIGS ול-type — חלק כזה לא נכתב
    // ⚡ SELF-V2: «מחפש לפי מפתח» — הטיפוס של קלט נשאל פעם אחת (paramTypeOf), ו-JSON של צורה פעם אחת לכל צורה (descJson);
    // המחרוזת שנבדקת זהה תו-בתו ל-JSON.stringify של הרשימה (אותה פרטיות בדיוק)
    const sigOf = (L) => L.params.map((p) => { const t = paramTypeOf(p); return { p, t, d: descOf(checker, t), type: t ? typeText(checker, t) : 'unknown' }; });
    const leaky = mod.kept.filter((L) => { const txt = '[' + sigOf(L).map((x) => '[' + descJson(x.d) + ',' + JSON.stringify(x.type) + ']').join(',') + ']'; return PII.some((re) => re.test(txt)); });
    if (leaky.length) {
      const bad = new Set(leaky.map((L) => L.symbol));
      skips['privacy'] = (skips['privacy'] ?? 0) + leaky.length;
      mod = moduleText(r.lifts.filter((L) => !bad.has(L.symbol)), sf, header);
    }
    clashes += mod.clashes;
    if (mod.clashes) skips['name-clash'] = (skips['name-clash'] ?? 0) + mod.clashes;
    if (mod.privacy) skips['privacy'] = (skips['privacy'] ?? 0) + mod.privacy;
    if (mod.tooBig) skips['too-big'] = (skips['too-big'] ?? 0) + mod.tooBig;
    if (!mod.kept.length) continue;
    const sigs = {};
    for (const L of mod.kept) {
      const takes = L.params.map((p) => {
        const t = paramTypeOf(p);
        let d = descOf(checker, t);
        if (d.t === 'any' && usedAsNumber(L, p, checker)) d = { t: 'num' };
        return { name: p.name, d, opt: false, type: t ? typeText(checker, t) : 'unknown' };
      });
      if (L.kind === 'envelope') takes.push({ name: 'since', d: { t: 'num' }, opt: false, type: 'number' });
      let gives;
      if (L.kind === 'envelope') gives = { kind: 'number', type: 'number' };
      else {
        let gt = null;
        try { gt = checker.getTypeAtLocation(L.nameNode); } catch { /* */ }
        const gd = descOf(checker, gt);
        gives = { kind: kindOfDesc(gd, L.value), type: gt ? typeText(checker, gt) : 'unknown' };
      }
      const exp = L.text.match(/^export function (\S+)\(/)[1];
      sigs[exp] = takes.map(({ type: _t, ...x }) => x);
      const parentSym = L.top;
      const isCat = catalogued.has(rel + '#' + parentSym);
      const lang = /\.(ts|tsx|mts)$/.test(rel) ? 'ts' : 'js';
      parts.push({
        id: `inner-${source}:${rel}#${L.symbol}`, source: `inner-${source}`, path: rel, symbol: L.symbol, lang, what: 'inner',
        name: nameOf(L), does: doesOf(L),
        takes: takes.map((t) => ({ name: t.name, kind: kindOfDesc(t.d, t.name), type: t.type })), gives, pure: true, example: null,
        tags: [`inner:${L.kind}`, `form:${L.form}`, isCat ? 'parent:cataloged' : 'parent:uncataloged', `gen:${genRel}#${exp}`, ...(L.foreign ? ['via:import'] : []), ...(L.closures && L.closures.size ? ['via:closure'] : [])],
        parent: `${R.catalog}:${rel}#${parentSym}`,
        origins: [{ repo: repoName, file: rel, line: L.line, what: `${L.kind}:${L.value}` }],
      });
    }
    sliced += new Set(mod.kept.filter((k) => k.form === 'slice').map((k) => k.symbol)).size;
    const tsx = /\.(tsx|jsx)$/.test(rel);
    let js = toJs(mod.text, tsx);
    js += `\nexport const SIGS = {\n${Object.entries(sigs).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join('\n')}\n};\n`;
    files[genRel] = js;
    perFile.push([rel, mod.kept.length]);
  }
  parts.sort(byId);
  const doc = { source: `inner-${source}`, repo: repoName, ref: catDoc.ref, generatedAt: null, parts };
  files[`catalog/sources/inner-${source}.json`] = JSON.stringify(doc, null, 1) + '\n';
  // v2: מה שנכנס לריפו = המחסן הדחוס (lib/store.mjs); הקובץ הפרוש נוצר לפי דרישה (ensure-gen) — ביט-זהה
  const packed = packParts(doc, { short: source, catalog: R.catalog });
  files[`catalog/inner/store/parts-${source}.json`] = storeText(packed.store);
  const stats = {
    source, version: INNER_VERSION, files: rels.length, candidates, sliced, parts: parts.length, modules: perFile.length,
    forms: sortObj(parts.reduce((o, p) => { const k = p.tags.find((t) => t.startsWith('form:')); o[k] = (o[k] ?? 0) + 1; return o; }, {})),
    kinds: sortObj(parts.reduce((o, p) => { const k = p.tags.find((t) => t.startsWith('inner:')); o[k] = (o[k] ?? 0) + 1; return o; }, {})),
    parents: sortObj(parts.reduce((o, p) => { const k = p.tags.find((t) => t.startsWith('parent:')); o[k] = (o[k] ?? 0) + 1; return o; }, {})),
    skipped: sortObj(skips),
    via: sortObj(parts.reduce((o, p) => { for (const t of p.tags) if (t.startsWith('via:')) o[t] = (o[t] ?? 0) + 1; return o; }, {})),
    ...(packed.overrides ? { storeOverrides: packed.overrides } : {}),
    topFiles: perFile.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 15),
  };

  files[`catalog/inner/open-${source}.json`] = JSON.stringify(stats, null, 1) + '\n';
  return { files, stats };
}
