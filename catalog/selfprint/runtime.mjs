/**
 * 🧭 זמן-הריצה של מנוע-השרטוטים-העצמי — אותו עולם בדיוק כמו של הצמיחה (catalog/grow/runtime.mjs: אותם חלקים מוכחים,
 * אותו ארגז-חול, אותם צעדים), רק בלי לייבא את catalog/blueprints/search.mjs (שמייבא את shapes.mjs — שרטוטי-AI).
 * `loadWorld` כאן = העתק של search.mjs › loadWorld (בלי מתכוני-combo), אחרי השומר.
 */
import './guard.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { buildIndex, provenAs } = await import('../combiner/core.mjs');
const { loadParts, loadProofs, loadBehavior, loadLeads, CATALOG } = await import('../combiner/load.mjs');
const { loadRunners } = await import('../combiner/combine.mjs');
const { graphNodes, runGraph } = await import('../combiner/graph.mjs');
const { isRunnable } = await import('../lib/probe-file.mjs');
const { callerFor, resetBudget, stepsUsed, BudgetError } = await import('../lib/sandbox.mjs');
const { bundleBridge } = await import('../lib/load-bridge.mjs');
const L = await import('../grow/lib.mjs');

const RUN_SOURCES = new Set(['orbit', 'core', 'core-b', 'core-c']);
const runnableHere = (r) => r && (r.source.startsWith('inner-') ? (r.tags || []).some((t) => t.startsWith('gen:')) : RUN_SOURCES.has(r.source) && isRunnable(r));

export function loadWorld() {
  const parts = loadParts();
  const raw = new Map(parts.map((p) => [p.id, p]));
  const rdir = path.join(CATALOG, 'recipes');
  const recipes = (fs.existsSync(rdir) ? fs.readdirSync(rdir) : []).filter((f) => f.endsWith('.json') && !f.startsWith('combo-')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(rdir, f), 'utf8')));
  const ix = buildIndex(parts, { proofs: loadProofs(), behavior: loadBehavior(), recipes, leads: loadLeads() });
  const homeOf = (p) => { for (const h of p.homes) { const r = raw.get(h.id); if (runnableHere(r)) return r; } return null; };
  return { ix, raw, homeOf };
}

/** כמו grow/runtime.mjs › makeRuntime (אותו קוד) — רק עם loadWorld של כאן. */
export async function makeRuntime({ callSteps, only = null } = {}) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const { ix, raw, homeOf } = loadWorld();
  const want = only && new Set(only);
  const proven = ix.parts.filter((p) => (!want || want.has(p.id)) && Object.keys(p.proofs || {}).some((v) => provenAs(p, v)) && homeOf(p)).sort((a, b) => (a.id < b.id ? -1 : 1));
  const runners = await loadRunners(proven, raw);
  const callers = new Map();
  let memo = new Map();
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
    m = { r: r.async ? { err: 'async' } : r, s: r.err === 'budget' ? callSteps : stepsOf(C.ctx) };
    if (memo.size > 4e6) memo = new Map();
    memo.set(k, m);
    return m;
  };
  const nodesOf = new WeakMap();
  const runOne = (t, args, cap = Infinity) => {
    let ps = nodesOf.get(t.graph);
    if (!ps) { ps = graphNodes(t.graph).map((n) => n.part); nodesOf.set(t.graph, ps); }
    let s = 0;
    const r = runGraph(t.graph, args, (k, a) => { if (s > cap) return { err: 'budget' }; const m = callPart(ps[k], a); s += m.s; return m.r; });
    const v = !r || r.async || 'err' in r || s > cap ? null : r.v;
    return { v: v === null || L.semOfValue(v) === null ? null : v, s };
  };
  return { B, ix, raw, homeOf, proven, runners, callPart, runOne };
}
