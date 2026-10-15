/**
 * 🌱 GROW2 · זמן-הריצה של מנוע-הצמיחה — טוען את החלקים המוכחים לארגז-החול ומריץ "דבר" (גרף) על קלט.
 * הופרד מ-grow.mjs כדי שגם הבדיקה (grow.test › השיפורים השגויים) תריץ דברים אמיתיים, רק עם החלקים שהיא צריכה.
 *
 * צעדים = lib/steps.mjs לכל קריאה לחלק; מטמון (חלק, קלט) ⇒ (פלט, צעדים) — אותו חלק על אותו קלט נותן אותו דבר
 * (חלקים אקראיים נזרקים בקומה 0). המטמון רק חוסך זמן; ניקוי שלו לא משנה תוצאה.
 */
import { pathToFileURL } from 'node:url';

const { loadWorld } = await import('../blueprints/search.mjs'); // מתקין את שומר-הקריאה (בלי מתכוני-יד/combo/found)
const { provenAs } = await import('../combiner/core.mjs');
const { loadRunners } = await import('../combiner/combine.mjs');
const { graphNodes, runGraph } = await import('../combiner/graph.mjs');
const { callerFor, resetBudget, stepsUsed, BudgetError } = await import('../lib/sandbox.mjs');
const { bundleBridge } = await import('../lib/load-bridge.mjs');
const L = await import('./lib.mjs');

/** only = רשימת מזהי-חלקים (לבדיקות); בלי ⇒ כל החלקים המוכחים שרצים כאן. */
export async function makeRuntime({ callSteps, only = null } = {}) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const { ix, raw, homeOf } = loadWorld();
  const want = only && new Set(only);
  const proven = ix.parts.filter((p) => (!want || want.has(p.id)) && Object.keys(p.proofs || {}).some((v) => provenAs(p, v)) && homeOf(p)).sort((a, b) => (a.id < b.id ? -1 : 1));
  const runners = await loadRunners(proven, raw);

  const callers = new Map();
  let memo = new Map();
  let realCalls = 0;
  const stepsOf = (ctx) => Number(String(stepsUsed(ctx)).split(' ')[0]) || 0;
  const callPart = (pid, args) => {
    const k = pid + '\u0001' + JSON.stringify(args);
    let m = memo.get(k);
    if (m) return m;
    let C = callers.get(pid);
    if (!C) { const R = runners.get(pid); C = { ctx: R.ctx, call: callerFor(R.ctx, R.fn, 0, R.self) }; callers.set(pid, C); }
    resetBudget(C.ctx, callSteps, callSteps);
    let r;
    try { r = C.call(args); } catch (e) { if (!(e instanceof BudgetError)) throw e; r = { err: 'budget' }; }
    realCalls++;
    m = { r: r.async ? { err: 'async' } : r, s: r.err === 'budget' ? callSteps : stepsOf(C.ctx) };
    if (memo.size > 4e6) memo = new Map();
    memo.set(k, m);
    return m;
  };
  const nodesOf = new WeakMap();
  /** דבר על קלט אחד ⇒ {v|null, s}. cap = תקרת-צעדים לקלט הזה (מעבר ⇒ null). */
  const runOne = (t, args, cap = Infinity) => {
    let ps = nodesOf.get(t.graph);
    if (!ps) { ps = graphNodes(t.graph).map((n) => n.part); nodesOf.set(t.graph, ps); }
    let s = 0;
    const r = runGraph(t.graph, args, (k, a) => { if (s > cap) return { err: 'budget' }; const m = callPart(ps[k], a); s += m.s; return m.r; });
    const v = !r || r.async || 'err' in r || s > cap ? null : r.v;
    return { v: v === null || L.semOfValue(v) === null ? null : v, s };
  };
  return { B, ix, raw, homeOf, proven, runners, callPart, runOne, realCalls: () => realCalls, clearMemo: () => { memo = new Map(); } };
}
