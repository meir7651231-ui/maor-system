/**
 * 🔬 הכנה והרצה של קובץ-מקור אחד (CATALOG-VERBS, 14.10.2026) — משותף לעובד (probe-worker.mjs) ולבדיקות.
 *   prepareJobs — חתימות דרך המהדר (בלי להריץ), דוגמאות מהמפקד, מילון-הקוד, ייצוא-בזיכרון לפנימיים ⇒ עבודות לפי קובץ.
 *   probeJob    — אריזה ⇒ ארגז-חול ⇒ לכל חלק: probePart + טביעת-התנהגות.
 */
import fs from 'node:fs';
import path from 'node:path';
import { makeProgram, signatureOf, fillFromKinds, literalPool } from './tsdesc.mjs';
import { bundleWithDeps, loadInSandbox, callerFor, resolvePart } from './sandbox.mjs';
import { probePart, behaviorHash, fnvHash } from './probe.mjs';
import { fingerprint, machineSalt, cacheGet, cachePut, stampOf, CACHE_OFF } from './cache.mjs';

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
    abs, parts, pool: literalPool(abs), esm: esmOf.get(abs), ...(cli ? { cli: true } : {}),
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

/** מריץ עבודה אחת (קובץ אחד). onStart(id) לפני כל חלק (לשומר-הזמן), onDone(id, result) אחריו. מחזיר [{id, result}]. */
export async function probeJob(job, { B, seed, onStart = () => {}, onDone = () => {} }) {
  let mod = null;
  let why = null;
  // ⚡ SELF: «מטביע חותם» + «מחפש לפי מפתח». מפתח-קובץ (הקובץ, הייצוא, המלח של המכונה) ⇒ רשימת הקבצים שנארזו בפעם הקודמת;
  // הטביעה של התוכן הנוכחי שלהם + הזרע + מילון-הקוד + החלק ⇒ מפתח-חלק. אף קובץ לא השתנה ⇒ אותה תוצאה (הקורא טהור
  // ודטרמיניסטי) — בלי לארוז ובלי להריץ. גם "timeout" נזכר (התהליך הראשי כותב אותו), כדי שהרצה חמה לא תחכה שוב 20 שניות.
  const fileKey = CACHE_OFF ? null : fingerprint(machineSalt(), 'probe-v2', job.abs, JSON.stringify(job.expose ?? []), String(job.esm), String(!!job.cli));
  const partKey = (stamp, p) => fingerprint(fileKey, stamp, String(seed), JSON.stringify(job.pool ?? null), JSON.stringify(p));
  if (fileKey) {
    const list = cacheGet('probe-deps', fileKey);
    if (Array.isArray(list) && list.length) {
      const st = stampOf(list);
      const got = job.parts.map((p) => cacheGet('probe-part', partKey(st, p)));
      if (got.every((r) => r !== undefined)) {
        return job.parts.map((p, k) => { onStart(p.id, null); onDone(p.id, got[k]); return { id: p.id, result: got[k] }; });
      }
    }
  }
  let code = null; let stamp = null;
  try {
    const b = await bundleWithDeps(job.abs, { expose: job.expose ?? [], esm: job.esm !== false, cli: !!job.cli });
    code = b.code;
    if (fileKey && b.deps.length) { cachePut('probe-deps', fileKey, b.deps); stamp = stampOf(b.deps); }
    mod = loadInSandbox(code);
  } catch (err) {
    why = buildWhy(err);
  }
  const out = [];
  for (const p of job.parts) {
    const key = stamp && partKey(stamp, p);
    const hit = key && cacheGet('probe-part', key);
    if (hit !== undefined && hit !== null && key) { onStart(p.id, null); out.push({ id: p.id, result: hit }); onDone(p.id, hit); continue; }
    onStart(p.id, key);
    if (!mod) { const r = { status: 'load-failed', why }; if (key) cachePut('probe-part', key, r); out.push({ id: p.id, result: r }); onDone(p.id, r); continue; }
    let result;
    try {
      const got = resolvePart(mod.exports, p.symbol, p.method);
      if (!got) result = { status: 'not-callable' };
      else {
        const s = (fnvHash(p.id) ^ seed) >>> 0;
        const Bp = { ...B, pool: job.pool };
        result = probePart({ sig: p.sig, call: callerFor(mod.ctx, got.fn, s, got.self), seed: s, B: Bp });
        if (result.status === 'ran') result.hash = behaviorHash(p.sig, callerFor(mod.ctx, got.fn, 7, got.self), B);
      }
    } catch (err) {
      result = { status: 'probe-error', why: String((err && err.message) || err).slice(0, 160) };
    }
    if (key) cachePut('probe-part', key, result);
    out.push({ id: p.id, result });
    onDone(p.id, result);
  }
  return out;
}
