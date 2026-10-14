/**
 * 🔬 הוכחה של מודול-gen אחד (INNER, 14.10.2026) — משותף לעובד (scripts/prove-worker.mjs) ולבדיקות.
 * אריזה בזיכרון ⇒ ארגז-החול של הקטלוג ⇒ לכל חלק: probePart (פעלי-האלפבית, n/n) + motionOf (תכונות-התנועה) ⇒
 * בסוף: זוגות-אחים שמקיפים יחד (orbit). ובנוסף entriesFor — הרכבת השורות של קובץ-ההתנהגות.
 */
import { bundleWithDeps, loadInSandbox, callerFor, resolvePart, resetBudget, stepsUsed, BudgetError, stepsLog } from '../../lib/sandbox.mjs';
import { probePart, behaviorHash, fnvHash } from '../../lib/probe.mjs';
import { entryFor } from '../../lib/entry.mjs';
import { motionOf, orbitPair } from './motion.mjs';
import path from 'node:path';
import { fingerprint, machineSalt, cacheGet, cachePut, CACHE_OFF } from '../../lib/cache.mjs';
import { depsStampOf } from '../../lib/probe-file.mjs';

/**
 * «מטביע חותם» לעבודה (מודול, חתימות, מילון-הקוד, זרע, המלח) — הנתיב יחסי לשורש (`job.rel`), כך שאותו מפתח בכל
 * worktree/שכפול; ועם טביעת מה שנארז (depsStampOf — אותה פונקציה של הקורא) ⇒ מפתח-התוצאה. משותף לעובד, לתהליך הראשי
 * ולחותמות שבריפו (catalog/self/stamps/inner-<source>.json).
 */
export const jobKeyOf = (job, seed) => fingerprint(machineSalt(), 'prove-v2', job.rel ?? job.abs, String(seed), JSON.stringify(job.parts), JSON.stringify(job.pool ?? null), String(!!job.motionOnly), String(job.esm), JSON.stringify(job.expose ?? []));
export const resultKeyOf = (jobKey, deps, base) => fingerprint(jobKey, depsStampOf(deps, base));

/** מריץ עבודה (מודול אחד). onStart/onDone לשומר-הקריסה; onDeps — מה נארז. מחזיר { results: Map, pairs: [] }. */
export async function proveJob(job, { B, seed, onStart = () => {}, onDone = () => {}, onDeps = () => {} }) {
  const results = new Map();
  let mod = null; let why = null; let code = null; let deps = [job.abs];
  const base = job.base ?? path.dirname(job.abs);
  // ⚡ SELF: אף קובץ שנארז לא השתנה ⇒ אותן תוצאות (בלי לארוז ובלי להריץ)
  const jobKey = jobKeyOf(job, seed);
  const known = CACHE_OFF ? undefined : cacheGet('prove-deps', jobKey);
  const hit = Array.isArray(known) && cacheGet('prove', resultKeyOf(jobKey, known, base));
  if (hit) { onDeps(known); for (const [id, r] of hit.results) { onStart(id); results.set(id, r); onDone(id, r); } return { results, pairs: hit.pairs }; }
  try { const b = await bundleWithDeps(job.abs, { esm: job.esm !== false, expose: job.expose ?? [] }); code = b.code; if (b.deps.length) deps = b.deps; } catch (err) { why = String((err && err.message) || err).split('\n')[0].slice(0, 140); }
  onDeps(deps);
  if (code !== null) { try { mod = loadInSandbox(code); } catch (err) { why = String((err && err.message) || err).split('\n')[0].slice(0, 140); } }
  const seriesByPart = new Map();
  for (const p of job.parts) {
    onStart(p.id);
    let result;
    if (!mod) result = { status: 'load-failed', why };
    else {
      try {
        const got = p.exp ? (typeof mod.exports[p.exp] === 'function' ? { fn: mod.exports[p.exp] } : null) : resolvePart(mod.exports, p.symbol, p.method);
        const fn = got && got.fn;
        if (typeof fn === 'function') resetBudget(mod.ctx); // ⏱️ SELF-V2: תקציב-צעדים לחלק (לא שעון)
        if (typeof fn !== 'function') result = { status: 'not-callable' };
        else if (job.motionOnly) {
          // קו-הבסיס: רק תכונות-התנועה, על חלק שלם מהקטלוג (הפעלים שלו כבר בקובץ-ההתנהגות שלו)
          const m = motionOf({ sig: p.sig, call: callerFor(mod.ctx, fn, 11, got.self), key: p.motionKey, seed, B });
          result = { status: 'ran', motion: m.motion };
          seriesByPart.set(p.id, m.series);
        } else {
          const s = (fnvHash(p.id) ^ seed) >>> 0;
          const Bp = { ...B, pool: job.pool };
          result = probePart({ sig: p.sig, call: callerFor(mod.ctx, fn, s), seed: s, B: Bp });
          if (result.status === 'ran') {
            result.hash = behaviorHash(p.sig, callerFor(mod.ctx, fn, 7), B);
            const m = motionOf({ sig: p.sig, call: callerFor(mod.ctx, fn, 11), key: p.motionKey, seed, B });
            if (m.motion.length) result.motion = m.motion;
            seriesByPart.set(p.id, m.series);
          }
        }
        if (process.env.CATALOG_STEPS_LOG) stepsLog(stepsUsed(mod.ctx), p.id);
      } catch (err) {
        result = err instanceof BudgetError ? { status: 'budget' } : { status: 'probe-error', why: String((err && err.message) || err).slice(0, 160) };
        if (process.env.CATALOG_STEPS_LOG) stepsLog(err instanceof BudgetError ? 'BUDGET' : 'err', p.id);
      }
    }
    results.set(p.id, result);
    onDone(p.id, result);
  }
  // orbit: אחים (אותו motionKey) שמתנדנדים על אותה סריקה — האם (x,y) על אליפסה
  const byKey = new Map();
  for (const p of job.parts) { if (!byKey.has(p.motionKey)) byKey.set(p.motionKey, []); byKey.get(p.motionKey).push(p.id); }
  const pairs = [];
  for (const ids of byKey.values()) {
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const sa = seriesByPart.get(ids[a]); const sb = seriesByPart.get(ids[b]);
      if (!sa || !sb) continue;
      for (const [key, xs] of sa) { const ys = sb.get(key); const n = ys && orbitPair(xs, ys); if (n) { pairs.push({ a: ids[a], b: ids[b], key, n }); break; } }
    }
  }
  if (!CACHE_OFF) { cachePut('prove-deps', jobKey, deps); cachePut('prove', resultKeyOf(jobKey, deps, base), { results: [...results], pairs }); }
  return { results, pairs };
}

/** שורות קובץ-ההתנהגות: entryFor של הקטלוג + motion (תכונות + orbit מהזוגות). */
export function entriesFor(parts, results, pairs, sigs) {
  const orbitOf = new Map();
  for (const pr of pairs.slice().sort((a, b) => (a.a + a.b < b.a + b.b ? -1 : 1))) {
    const on = pr.key.split('@')[0];
    for (const [x, y] of [[pr.a, pr.b], [pr.b, pr.a]]) {
      if (!orbitOf.has(x)) orbitOf.set(x, []);
      orbitOf.get(x).push({ id: 'orbit', on, with: y, holds: `${pr.n}/${pr.n}` });
    }
  }
  return parts.map((p) => {
    const res = results.get(p.id);
    const e = entryFor(p, res, sigs.get(p.id));
    const mo = [...(res && res.motion ? res.motion : []), ...(orbitOf.get(p.id) ?? [])];
    if (e.labeledBy === 'run' && mo.length) e.motion = mo;
    return e;
  });
}
