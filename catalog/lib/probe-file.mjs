/**
 * 🔬 הכנה והרצה של קובץ-מקור אחד (CATALOG-VERBS, 14.10.2026) — משותף לעובד (probe-worker.mjs) ולבדיקות.
 *   prepareJobs — חתימות דרך המהדר (בלי להריץ), דוגמאות מהמפקד, מילון-הקוד, ייצוא-בזיכרון לפנימיים ⇒ עבודות לפי קובץ.
 *   probeJob    — אריזה ⇒ ארגז-חול ⇒ לכל חלק: probePart + טביעת-התנהגות.
 */
import fs from 'node:fs';
import path from 'node:path';
import { makeProgram, signatureOf, fillFromKinds, literalPool } from './tsdesc.mjs';
import { bundleWithDeps, loadInSandbox, callerFor, resolvePart, resetBudget, stepsUsed, BudgetError, stepsLog } from './sandbox.mjs';
import { probePart, behaviorHash, fnvHash } from './probe.mjs';
import { fingerprint, machineSalt, cacheGet, cachePut, CACHE_OFF } from './cache.mjs';
import { sourceViewCached } from './blank.mjs';

const RUN_WHAT = new Set(['function', 'brick', 'particle', 'rule']);
const IDENT = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)?$/;
/** חלק שמותר להריץ: טהור · TS/JS · פונקציה (או מחלקה.מתודה) · לא קובץ-בדיקה. */
export const isRunnable = (p) => p.pure && (p.lang === 'ts' || p.lang === 'js') && RUN_WHAT.has(p.what) && IDENT.test(p.symbol) && /\.(ts|tsx|mts|js|mjs|jsx)$/.test(p.path) && !/\.(test|spec)\./.test(p.path);

/** הדוגמה מהמפקד (in לפי שמות-הקלט) ⇒ רשימת-קלטים להתחיל ממנה. */
function exampleArgs(p, takes) {
  const ex = p.example?.in;
  if (!ex || typeof ex !== 'object' || Array.isArray(ex)) return null;
  const names = takes.map((t) => t.name);
  if (!Object.keys(ex).every((k) => names.includes(k))) return null;
  return [names.map((n) => (n in ex ? ex[n] : { $$: 'undef' }))];
}

/** שורש-הריפו כנתיב אמיתי — האורז מחזיר תלויות בנתיב האמיתי, והחותמות יחסיות אליו (גם כשהשכפול הוא קישור-סמלי). */
export const realBase = (dir) => { try { return fs.realpathSync(dir); } catch { return dir; } };

/** חלקים ⇒ עבודות לפי קובץ (ממוינות) + תוצאות-מוקדמות לחלקים שלא הגיעו להרצה + החתימות. */
export function prepareJobs(dir, runnable, { cli = false } = {}) {
  const results = new Map();
  const files = [...new Set(runnable.map((p) => path.join(dir, p.path)))].filter((f) => fs.existsSync(f));
  const program = makeProgram(files);
  const jobs = new Map();
  const esmOf = new Map();
  for (const p of runnable) {
    const abs = path.join(dir, p.path);
    if (!fs.existsSync(abs)) { results.set(p.id, { status: 'no-file' }); continue; }
    const s = signatureOf(program, abs, p.symbol);
    if (!s.takes) { results.set(p.id, { status: s.why }); continue; }
    const takes = fillFromKinds(s.takes, p.takes).map((t, k) => ({ ...t, kind: p.takes[k]?.kind ?? 'unknown' }));
    const seeds = exampleArgs(p, takes);
    if (!jobs.has(abs)) jobs.set(abs, []);
    esmOf.set(abs, s.esm);
    jobs.get(abs).push({ id: p.id, symbol: p.symbol, method: s.method ?? undefined, internal: s.internal, sig: seeds ? { takes, seeds } : { takes } });
  }
  const list = [...jobs.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([abs, parts]) => ({
    abs, rel: path.relative(dir, abs).split(path.sep).join('/'), base: realBase(dir), parts, pool: literalPool(abs), esm: esmOf.get(abs), ...(cli ? { cli: true } : {}),
    expose: [...new Set(parts.filter((p) => p.internal).map((p) => (p.method ? p.method.cls : p.symbol)))].sort(),
  }));
  const sigs = new Map(list.flatMap((j) => j.parts.map((p) => [p.id, p.sig])));
  return { jobs: list, results, sigs };
}

/** הודעת-בנייה בלי צבעים: הקוד והמשפט הראשון ("PARSE_ERROR: Expected …"). */
function buildWhy(err) {
  const msg = String((err && err.message) || err).replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '');
  const m = /\[([A-Z_]+)\]\s*([^\n]+)/.exec(msg);
  return (m ? m[1] + ': ' + m[2] : msg.split('\n')[0]).slice(0, 140);
}

/* ═══════════════ «מטביע חותם» — המפתחות (משותפים לעובד, לתהליך הראשי ולחותמות שבריפו) ═══════════════ */

/** מפתח-קובץ: הקובץ (יחסי לשורש-הריפו שלו — בלי נתיב מוחלט ⇒ אותו מפתח בכל worktree/שכפול), הייצוא, המצב, המלח. */
export const fileKeyOf = (job) => fingerprint(machineSalt(), 'probe-v3', job.rel ?? job.abs, JSON.stringify(job.expose ?? []), String(job.esm), String(!!job.cli));
/** טביעת הקבצים שנארזו (יחסיים לשורש; TS — בלי הערות, כמו שהאורז קורא אותם). קובץ חסר ⇒ '!'. */
export function depsStampOf(deps, base) {
  return fingerprint('deps-v1', ...deps.flatMap((f) => {
    let b; try { b = fs.readFileSync(f, 'utf8'); } catch { return [rel(base, f), '!']; }
    return [rel(base, f), fingerprint(sourceViewCached(f, b))];
  }));
}
/** נתיב-תלות יחסי — ותלות מתוך node_modules נרשמת כ-node_modules/… (גם כשהתיקייה היא קישור, כמו ב-worktree). */
export function relDep(base, f) {
  const i = f.indexOf(path.sep + 'node_modules' + path.sep);
  if (i >= 0) return f.slice(i + 1).split(path.sep).join('/');
  // 🪞 SELF-V2 (הסריקה-העצמית השנייה, «מנרמל» · normalize.idem): נתיב שכבר יחסי נשאר כמו שהוא — path.relative היה פותר
  // אותו מול תיקיית-העבודה של התהליך ⇒ חותמת שתלויה במקום שממנו הרצת. ratchet: self-v2.test
  return path.isAbsolute(f) ? path.relative(base, f).split(path.sep).join('/') : f.split(path.sep).join('/');
}
const rel = relDep;
/** מפתח-חלק: הקובץ + מה שנארז + הזרע + מילון-הקוד + החלק (חתימה, סמל). */
export const partKeyOf = (fileKey, stamp, seed, pool, p) => fingerprint(fileKey, stamp, String(seed), JSON.stringify(pool ?? null), JSON.stringify(p));

/**
 * מריץ עבודה אחת (קובץ אחד). onStart(id) לפני כל חלק (לשומר-הקריסה), onDone(id, result) אחריו, onDeps(deps) — הקבצים
 * שנארזו (מוחלטים). מחזיר [{id, result}].
 * ⚡ SELF: «מחפש לפי מפתח» — אף קובץ שנארז לא השתנה (לפי הטביעה, TS בלי הערות) ⇒ אותה תוצאה, בלי לארוז ובלי להריץ.
 */
export async function probeJob(job, { B, seed, onStart = () => {}, onDone = () => {}, onDeps = () => {} }) {
  let mod = null;
  let why = null;
  const fileKey = fileKeyOf(job);
  const base = job.base ?? path.dirname(job.abs);
  if (!CACHE_OFF) {
    const list = cacheGet('probe-deps', fileKey);
    if (Array.isArray(list) && list.length) {
      const st = depsStampOf(list, base);
      const got = job.parts.map((p) => cacheGet('probe-part', partKeyOf(fileKey, st, seed, job.pool, p)));
      if (got.every((r) => r !== undefined)) {
        onDeps(list);
        return job.parts.map((p, k) => { onStart(p.id); onDone(p.id, got[k]); return { id: p.id, result: got[k] }; });
      }
    }
  }
  let code = null; let deps = [job.abs];
  try {
    const b = await bundleWithDeps(job.abs, { expose: job.expose ?? [], esm: job.esm !== false, cli: !!job.cli });
    code = b.code;
    if (b.deps.length) deps = b.deps;
    mod = loadInSandbox(code);
  } catch (err) {
    why = buildWhy(err);
  }
  if (!CACHE_OFF) cachePut('probe-deps', fileKey, deps);
  onDeps(deps);
  const stamp = depsStampOf(deps, base);
  const out = [];
  for (const p of job.parts) {
    const key = partKeyOf(fileKey, stamp, seed, job.pool, p);
    const hit = CACHE_OFF ? undefined : cacheGet('probe-part', key);
    if (hit !== undefined && hit !== null) { onStart(p.id); out.push({ id: p.id, result: hit }); onDone(p.id, hit); continue; }
    onStart(p.id);
    if (!mod) { const r = { status: 'load-failed', why }; cachePut('probe-part', key, r); out.push({ id: p.id, result: r }); onDone(p.id, r); continue; }
    let result;
    try {
      const got = resolvePart(mod.exports, p.symbol, p.method);
      if (!got) result = { status: 'not-callable' };
      else {
        const s = (fnvHash(p.id) ^ seed) >>> 0;
        const Bp = { ...B, pool: job.pool };
        resetBudget(mod.ctx); // ⏱️ SELF-V2: תקציב-צעדים לחלק (לא שעון)
        result = probePart({ sig: p.sig, call: callerFor(mod.ctx, got.fn, s, got.self), seed: s, B: Bp });
        if (result.status === 'ran') result.hash = behaviorHash(p.sig, callerFor(mod.ctx, got.fn, 7, got.self), B);
        if (process.env.CATALOG_STEPS_LOG) stepsLog(stepsUsed(mod.ctx), p.id);
      }
    } catch (err) {
      result = err instanceof BudgetError ? { status: 'budget' } : { status: 'probe-error', why: String((err && err.message) || err).slice(0, 160) };
      if (process.env.CATALOG_STEPS_LOG) stepsLog(err instanceof BudgetError ? 'BUDGET' : 'err', p.id);
    }
    cachePut('probe-part', key, result);
    out.push({ id: p.id, result });
    onDone(p.id, result);
  }
  return out;
}
