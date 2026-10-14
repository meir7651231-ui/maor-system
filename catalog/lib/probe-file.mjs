/**
 * 🔬 הכנה והרצה של קובץ-מקור אחד (CATALOG-VERBS, 14.10.2026) — משותף לעובד (probe-worker.mjs) ולבדיקות.
 *   prepareJobs — חתימות דרך המהדר (בלי להריץ), דוגמאות מהמפקד, מילון-הקוד, ייצוא-בזיכרון לפנימיים ⇒ עבודות לפי קובץ.
 *   probeJob    — אריזה ⇒ ארגז-חול ⇒ לכל חלק: probePart + טביעת-התנהגות.
 */
import fs from 'node:fs';
import path from 'node:path';
import { makeProgram, signatureOf, fillFromKinds, literalPool } from './tsdesc.mjs';
import { bundleFile, loadInSandbox, callerFor, resolvePart } from './sandbox.mjs';
import { probePart, behaviorHash, fnvHash } from './probe.mjs';

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
export function prepareJobs(dir, runnable) {
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
    abs, parts, pool: literalPool(abs), esm: esmOf.get(abs),
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
  try {
    const code = await bundleFile(job.abs, { expose: job.expose ?? [], esm: job.esm !== false });
    mod = loadInSandbox(code);
  } catch (err) {
    why = buildWhy(err);
  }
  const out = [];
  for (const p of job.parts) {
    onStart(p.id);
    if (!mod) { out.push({ id: p.id, result: { status: 'load-failed', why } }); onDone(p.id, out[out.length - 1].result); continue; }
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
    out.push({ id: p.id, result });
    onDone(p.id, result);
  }
  return out;
}
