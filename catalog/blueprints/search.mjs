#!/usr/bin/env node
/**
 * 🔍 חיפוש-לפי-שרטוט (BLUEPRINTS, 14.10.2026) — המבחן העיוור: "מה המנוע מצליח לגלות לבד?"
 *
 * לכל פועל-יעד ב-targets.json: כל שרטוט שמתאים לחתימה — מספריית-הצורות (shapes.mjs) ומהכרייה (library.json › runnable) —
 * ממולא בחלקים מוכחים (engine.mjs), והתוצאה עוברת את **חוקי פועל-היעד בלבד** n/n במנגנון של מכונת-השילוב
 * (combine.mjs: composeGraph + verify, אותו ארגז-חול). דירוג: הכי מעט חלקים ⇒ הכי מעט צעדים ⇒ מזהה. תקציב מוצהר
 * (targets.json › budget: ניסיונות לפועל ולתבנית, צעדים לניסיון). דטרמיניסטי — אותו קוד ⇒ אותו פנקס.
 *
 * **בלי לרמות** (ratchet: blueprints.test.ts): לפני כל קריאה מהדיסק מותקן שומר — קריאה של מתכוני-היד
 * (`catalog/combiner/verb-recipes.json`), של מה שמכונת-השילוב מצאה (`combos.json`, `recipes/combo-*`, `lab-data.json`)
 * או של מה שהמנוע עצמו מצא קודם (`blueprints/found/`) ⇒ זריקה. האינדקס נבנה בלי מתכוני-combo. וכל חלק שמוכח
 * לפועל-היעד עצמו יוצא מכל המאגרים.
 *
 * הפלט: `catalog/blueprints/ledger.json` (הפנקס — מה נוסה, כמה מילויים, מה עבר/נכשל ולמה; "זמן" = ניסיונות + צעדי-ארגז-החול,
 * כי שעון-קיר אינו דטרמיניסטי — הוא מודפס בסוף ומדווח בדוח) · `catalog/blueprints/found/<פועל>-<חומר>.json` — כל שילוב שעבר,
 * בפורמט של `catalog/recipes/combo-*.json` + `by: "מנוע-השרטוטים"`.
 *
 *   node catalog/blueprints/search.mjs                 # כותב ledger.json + found/
 *   node catalog/blueprints/search.mjs --only tour     # פועל אחד (לא כותב)
 *   node catalog/blueprints/search.mjs --check         # יציאה 1 אם לא מעודכן
 */
import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ═══════════════ השומר — מתקין את עצמו לפני כל קריאה ═══════════════ */

export const HIDDEN = [/catalog\/combiner\/verb-recipes\.json$/, /catalog\/combiner\/combos\.json$/, /catalog\/recipes\/combo-[^/]*$/, /catalog\/combiner\/lab-data\.json$/, /catalog\/blueprints\/found\//];
export const hiddenPath = (p) => { const s = String(p instanceof URL ? fileURLToPath(p) : p).replace(/\\/g, '/'); return HIDDEN.some((r) => r.test(s)); };
/** הקריאה המקורית — רק ל---check, **אחרי** שהחיפוש הסתיים (משווים את found/ שעל הדיסק לתוצאה). */
const ORIG_READ = fs.readFileSync.__bpGuard ? fs.readFileSync.__orig : fs.readFileSync;
export function guardReads() {
  if (fs.readFileSync.__bpGuard) return;
  const wrap = (orig, name) => { const f = function (p, ...a) { if (hiddenPath(p)) throw new Error('🚫 מנוע-השרטוטים לא קורא את ' + p + ' (' + name + ')'); return orig.call(this, p, ...a); }; f.__bpGuard = true; f.__orig = orig; return f; };
  fs.readFileSync = wrap(fs.readFileSync, 'readFileSync');
  fs.openSync = wrap(fs.openSync, 'openSync');
  fs.createReadStream = wrap(fs.createReadStream, 'createReadStream');
  fs.promises.readFile = wrap(fs.promises.readFile, 'promises.readFile');
  module.syncBuiltinESMExports();
}
guardReads();

const { buildIndex, provenAs } = await import('../combiner/core.mjs');
const { loadParts, loadProofs, loadBehavior, loadLeads, CATALOG } = await import('../combiner/load.mjs');
const { loadRunners, composeGraph, verify, partByHome, SEED } = await import('../combiner/combine.mjs');
const { graphProblem, graphParts, graphNodes } = await import('../combiner/graph.mjs');
const { isRunnable } = await import('../lib/probe-file.mjs');
const { argsOf, fnvHash, directCall } = await import('../lib/probe.mjs');
const { resetBudget, stepsUsed } = await import('../lib/sandbox.mjs');
const { bundleBridge } = await import('../lib/load-bridge.mjs');
const { VERB_BY_ID: LAW_VERBS } = await import('../lib/verbs.mjs');
const { SUPER, templatesOf } = await import('./shapes.mjs');
const E = await import('./engine.mjs');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/** חתימה מוקשחת (לחץ): מספר שלם בטווח צר (עד 5 ערכים ⇒ הרבה כפולים), רשימות ארוכות פי 1.5 (עד 10). חוקי הפועל לא משתנים. */
export function stressSig(sig) {
  const h = (d) => {
    if (!d || typeof d !== 'object') return d;
    if (d.t === 'int' && Number.isFinite(d.lo) && Number.isFinite(d.hi)) return { ...d, hi: Math.min(d.hi, d.lo + 4) };
    if (d.t === 'arr') return { ...d, of: h(d.of), max: Math.min(10, Math.ceil(1.5 * (d.max || 6))) };
    if (d.t === 'obj') return { ...d, p: (d.p || []).map(([n, dd, o]) => [n, h(dd), o]) };
    return d;
  };
  return sig.map((t) => ({ ...t, d: h(t.d) }));
}
/** הזרעים של ניסיון אחד: הזרע שלו + שניים נגזרים (דטרמיניסטי). */
export const SEEDS = (seed) => [seed, (seed ^ 0x9e3779b9) >>> 0, (seed ^ 0x7f4a7c15) >>> 0];
export const LEDGER = path.join(HERE, 'ledger.json');
export const FOUND = path.join(HERE, 'found');

/* ═══════════════ האינדקס — בלי מתכוני-combo ═══════════════ */

const RUN_SOURCES = new Set(['orbit', 'core', 'core-b', 'core-c']);
const runnableHere = (r) => r && (r.source.startsWith('inner-') ? (r.tags || []).some((t) => t.startsWith('gen:')) : RUN_SOURCES.has(r.source) && isRunnable(r));

export function loadWorld() {
  const parts = loadParts();
  const raw = new Map(parts.map((p) => [p.id, p]));
  const rdir = path.join(CATALOG, 'recipes');
  const recipes = (fs.existsSync(rdir) ? fs.readdirSync(rdir) : []).filter((f) => f.endsWith('.json') && !f.startsWith('combo-')).sort().map((f) => readJson(path.join(rdir, f)));
  const ix = buildIndex(parts, { proofs: loadProofs(), behavior: loadBehavior(), recipes, leads: loadLeads() });
  const homeOf = (p) => { for (const h of p.homes) { const r = raw.get(h.id); if (runnableHere(r)) return r; } return null; };
  return { ix, raw, homeOf };
}

/** תבניות-הכרייה ⇒ תבניות-חיפוש: כל קריאה = משבצת שמוכחת לאותו פועל (בלי חוזה; הסוגים פתוחים). */
export function minedTemplates(lib) {
  return (lib.runnable || []).map((m) => {
    const slots = {};
    for (const n of m.graph.nodes) slots[n.slot] = { sem: n.args.map((a) => (typeof a === 'number' ? 'num' : 'any')), out: 'any', roles: [n.role] };
    return { shape: m.id, variant: 'mined', mined: true, inputs: m.graph.inputs, nodes: m.graph.nodes.map((n) => ({ id: n.id, slot: n.slot, args: n.args })), out: m.graph.out, slots, consts: {}, at: m.at, n: m.n, inSems: m.graph.inputs.map(() => 'any') };
  });
}

const shapeInputSems = (tpl) => (tpl.mined ? tpl.inSems : SUPER.find((s) => s.id === tpl.shape).inputs.map((i) => i.sem));
const slotOrder = (tpl) => { const out = []; for (const n of graphNodesAny(tpl.nodes)) if (n.slot && !out.includes(n.slot)) out.push(n.slot); return out; };
function graphNodesAny(nodes, out = []) { for (const n of nodes) { if (n.loop) graphNodesAny(n.loop.nodes, out); else out.push(n); } return out; }

/** הסוגים של הקלטים של הפועל (sig) מול השרטוט: null = לא מתאים; אחרת מיפוי שם-קלט ⇒ סוג. */
export function matchSig(tpl, verbSems) {
  const want = shapeInputSems(tpl);
  if (want.length !== verbSems.length) return null;
  const bind = {};
  for (let k = 0; k < want.length; k++) {
    let w = want[k];
    if (w.startsWith('@')) { const j = tpl.inputs.indexOf(w.slice(1)); w = j >= 0 ? verbSems[j] : 'any'; if (w !== verbSems[k]) return null; }
    if (!E.semAccepts(w, verbSems[k])) return null;
    bind[tpl.inputs[k]] = verbSems[k];
  }
  return bind;
}
const ELEM = { nums: 'num', pts: 'pt', list: 'any' };
/** ‎@x‎ = הסוג של הקלט x · ‎@x[]‎ = סוג הפריט שלו. */
const resolveSem = (s, bind) => (s.endsWith('[]') ? ELEM[bind[s.slice(1, -2)]] || 'any' : s.startsWith('@') ? bind[s.slice(1)] || 'any' : s);

/** סוג-הפלט של הפועל, מהרצה **אחת** של מימוש-הייחוס: רק שמות-השדות והסוגים שלהם (לא ערכים) ⇒ ITEM/BIN. */
function fieldMapOf(V, sig, B, spec) {
  if (!spec) return {};
  const verb = LAW_VERBS.get(V);
  const fn = directCall(verb.ref.fn());
  for (let s = 1; s < 12; s++) {
    const r = fn(argsOf({ takes: sig }, B.rng(s), B));
    const row = !('err' in r) && Array.isArray(r.v) ? r.v[0] : null;
    if (!row || typeof row !== 'object') continue;
    const map = {};
    for (const [ph, sem] of Object.entries(spec)) {
      const ks = Object.keys(row).filter((k) => E.valueIs(sem, row[k]));
      if (ks.length !== 1) return null;
      map[ph] = ks[0];
    }
    return map;
  }
  return null;
}

/* ═══════════════ הריצה ═══════════════ */

export async function searchAll({ only = null, log = () => {} } = {}) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const cfg = readJson(path.join(HERE, 'targets.json'));
  const BUD = cfg.budget;
  const lib = readJson(path.join(HERE, 'library.json'));
  const { ix, raw, homeOf } = loadWorld();
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const homeId = (p) => homeOf(p).id;
  const runners = new Map();
  const ensure = async (parts) => {
    const miss = [...new Set(parts)].filter((p) => !runners.has(p.id));
    if (!miss.length) return;
    const got = await loadRunners(miss, raw);
    for (const p of miss) runners.set(p.id, got.get(p.id) || null);
  };
  const templates = [...SUPER.flatMap(templatesOf), ...minedTemplates(lib)];
  const results = [];
  const found = {};
  for (const T of cfg.targets) {
    if (only && T.verb !== only) continue;
    const V = T.verb; const verb = LAW_VERBS.get(V);
    const sig = T.sig === 'material' ? T.sems.map((s, k) => ({ name: 'abcd'[k], d: s === 'pt' ? { t: 'obj', n: 'Point', p: [['x', { t: 'int', lo: 0, hi: 40 }, false], ['y', { t: 'int', lo: 0, hi: 40 }, false]] } : { t: 'int', lo: -50, hi: 120 } })) : verb.ref.sig;
    const verbSems = sig.map((t) => E.semOfD(t.d));
    const hide = (p) => T.hide.includes('parts') && provenAs(p, V);
    const hiddenParts = ix.parts.filter((p) => provenAs(p, V)).length;
    const row = { verb: V, he: verb.he, material: T.material, sems: verbSems, today: T.today, hidden: { hand: T.hide.includes('hand'), combo: T.hide.includes('combo') || T.hide.includes('hand'), parts: T.hide.includes('parts') ? hiddenParts : 0 }, templates: [], attempts: 0, steps: 0, found: null };
    const unmatched = [];
    let left = BUD.attemptsPerVerb;
    const passes = [];
    const cands = templates.map((t) => ({ t, bind: matchSig(t, verbSems) })).filter((x) => { if (!x.bind && !x.t.mined) unmatched.push(x.t.shape + '/' + x.t.variant); return x.bind; });
    // סדר: פחות משבצות קודם (הכי מעט חלקים), ואז סדר-הספרייה (צורות-על לפני כרייה)
    cands.sort((a, b) => slotOrder(a.t).length - slotOrder(b.t).length || 0);
    for (const { t, bind } of cands) {
      const tT = process.env.BP_TIME ? Date.now() : 0; // שעון-קיר רק להדפסה (BP_TIME) — לא נכנס לפנקס
      const tr = { shape: t.shape, variant: t.variant, ...(t.mined ? { mined: true, at: t.at[0] } : {}), slots: {}, space: 0, tried: 0, passed: 0, fails: {}, examples: [] };
      row.templates.push(tr);
      if (left <= 0) { tr.skipped = 'נגמר תקציב-הפועל'; continue; }
      const fmap = fieldMapOf(V, sig, B, t.outSpec);
      if (fmap === null) { tr.skipped = 'סוג-הפלט של הפועל לא תואם את השדות של השרטוט (' + Object.keys(t.outSpec).join(', ') + ')'; continue; }
      const names = slotOrder(t);
      const pools = [];
      for (const S of names) {
        const slot = t.slots[S];
        const sems = slot.sem.map((s) => resolveSem(s, bind));
        const outSem = resolveSem(slot.out, bind);
        const stat = E.staticPool(slot, sems, ix, homeOf, hide, BUD.staticCap);
        await ensure(stat.map((c) => c.part));
        const concrete = !sems.includes('any') || slot.contract;
        let pool; let rejected = null;
        if (concrete) ({ pool, rejected } = E.screenPool(stat, slot, sems, outSem, runners, fnvHash('screen|' + S + '|' + sems.join(',') + '|' + (slot.contract || '')) >>> 0, BUD.poolKeep));
        else pool = stat.filter((c) => runners.get(c.part.id)).slice(0, BUD.poolKeep).map((c) => ({ part: c.part, role: c.role, layout: c.layouts[0] }));
        tr.slots[S] = { roles: E.rolesOf(slot).length, static: stat.length, pool: pool.length, ...(rejected ? { rejected } : {}), contract: slot.contract || 'none' };
        pools.push(pool);
      }
      tr.space = pools.reduce((a, p) => a * p.length, 1);
      if (!tr.space) { tr.skipped = 'משבצת בלי אף חלק מתאים: ' + names.filter((_, k) => !pools[k].length).join(', '); continue; }
      const cap = Math.min(BUD.attemptsPerTemplate, left);
      for (const tup of E.bestFirst(pools.map((p) => p.length), cap)) {
        const fill = Object.fromEntries(names.map((S, k) => [S, pools[k][tup[k]]]));
        const g = E.expand(t, fill, fmap, homeId);
        tr.tried++; left--; row.attempts++;
        const failWith = (law, why) => { tr.fails[law] = (tr.fails[law] || 0) + 1; if (tr.examples.length < 3) tr.examples.push({ fill: names.map((S) => fill[S].part.id), law, why }); };
        if (g.bad) { failWith('wiring', g.bad); continue; }
        const prob = graphProblem(g);
        if (prob) { failWith('wiring', prob); continue; }
        const Rs = graphNodes(g).map((n) => runners.get(partByHome(ix, n.part).id));
        const ids = graphParts(g);
        const seed = (fnvHash('bp|' + V + '|' + t.shape + '|' + t.variant + '|' + ids.join('>')) ^ SEED) >>> 0;
        const ctxs = [...new Set(Rs.map((R) => R.ctx))];
        for (const c of ctxs) resetBudget(c, BUD.stepsPerAttempt);
        let v;
        try {
          // שלושה זרעים (לא אחד): חוק שעובר רק בזרע אחד = חוק חלש על הקלטים האלה, לא שילוב טוב (ראו `lucky`)
          for (const [k, sd] of SEEDS(seed).entries()) {
            for (const c of ctxs) resetBudget(c, BUD.stepsPerAttempt);
            const composed = composeGraph(g, Rs, sd, sig.map((x, j) => ({ ...x, name: g.inputs[j] })));
            v = verify(V, composed, sd, B);
            if (!v.ok) { if (k > 0) { tr.lucky = (tr.lucky || 0) + 1; v = { ...v, why: 'עבר בזרע ' + (k === 1 ? 'הראשון' : 'הראשון והשני') + ', נכשל בזרע ' + (k + 1) + ': ' + v.why }; } break; }
          }
          // סבב רביעי — **קלטי-לחץ** (אותם חוקים, חתימה מוקשחת: טווח צר ⇒ כפולים, רשימות ארוכות פי 2). עדיין רק חוקי הפועל
          if (v.ok) {
            for (const c of ctxs) resetBudget(c, BUD.stepsPerAttempt);
            const ss = stressSig(sig);
            const vs = verify(V, composeGraph(g, Rs, seed, ss.map((x, j) => ({ ...x, name: g.inputs[j] }))), seed, B);
            if (!vs.ok) { tr.stress = (tr.stress || 0) + 1; v = { ...vs, why: 'עבר 3 זרעים, נכשל בקלטי-לחץ: ' + vs.why }; }
          }
          if (v.ok) {
            const composed = composeGraph(g, Rs, seed, sig.map((x, j) => ({ ...x, name: g.inputs[j] })));
            for (const c of ctxs) resetBudget(c, BUD.stepsPerAttempt);
            const r0 = B.rng(0x5eed);
            for (let k = 0; k < 8; k++) composed.call(argsOf({ takes: sig }, r0, B));
            v.steps = ctxs.reduce((a, c) => a + Number(String(stepsUsed(c)).split(' ')[0]), 0);
          }
        } catch (e) { v = { ok: false, law: 'budget', why: String(e?.message || e).slice(0, 120) }; }
        if (!v.ok) { failWith(v.law || 'other', v.why); continue; }
        tr.passed++;
        row.steps += v.steps;
        passes.push({ t, g, fill: names.map((S) => fill[S].part.id), parts: ids.length, steps: v.steps, holds: v.holds, laws: v.laws, roles: ids.map((id) => graphNodes(g).find((n) => n.part === id).role) });
        if (tr.passed >= BUD.keepPerTemplate) break;
      }
      tr.fails = Object.fromEntries(Object.entries(tr.fails).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
      log(`  ${V} · ${t.shape}/${t.variant}: ${tr.tried} ניסיונות, ${tr.passed} עברו` + (process.env.BP_TIME ? ' · ' + ((Date.now() - tT) / 1000).toFixed(1) + 's' : ''));
    }
    row.unmatchedShapes = unmatched.length;
    passes.sort((a, b) => a.parts - b.parts || a.steps - b.steps || (a.t.shape + a.fill.join() < b.t.shape + b.fill.join() ? -1 : 1));
    if (passes.length) {
      const P = passes[0];
      row.found = { shape: P.t.shape, variant: P.t.variant, ...(P.t.mined ? { mined: true, at: P.t.at } : {}), parts: P.parts, steps: P.steps, holds: P.holds, fill: P.fill, alternatives: passes.length - 1 };
      row.passes = passes.slice(0, 8).map((x) => ({ shape: x.t.shape, variant: x.t.variant, parts: x.parts, steps: x.steps, holds: x.holds, fill: x.fill }));
      const id = 'bp-' + V + '-' + T.material;
      found[id + '.json'] = JSON.stringify({
        id, word: V + ' · ' + T.material, by: 'מנוע-השרטוטים (catalog/blueprints/search.mjs)',
        title: 'שילוב «' + verb.he + '» לפי השרטוט «' + (SUPER.find((s) => s.id === P.t.shape)?.he || 'נכרה: ' + P.t.at[0]) + '»: ' + P.parts + ' חלקים',
        blueprint: { shape: P.t.shape, variant: P.t.variant, ...(P.t.mined ? { minedAt: P.t.at } : {}) },
        combo: { verb: V, material: T.material, form: 'graph', steps: graphParts(P.g), roles: P.roles, holds: P.holds, laws: P.laws, ...(T.sig === 'material' ? { sig: sig } : {}), graph: { inputs: P.g.inputs, consts: P.g.consts, nodes: P.g.nodes, out: P.g.out } },
        // שאר המילויים שעברו (לפי הדירוג) — כדי שבדיקת-האמת בדיעבד (truth.mjs) תבדוק גם אותם
        alternatives: passes.slice(1, 30).map((x) => ({ shape: x.t.shape, variant: x.t.variant, parts: x.parts, steps: x.steps, holds: x.holds, graph: { inputs: x.g.inputs, nodes: x.g.nodes, out: x.g.out } })),
      }, null, 1) + '\n';
    } else {
      const tried = row.templates.filter((x) => x.tried);
      row.why = !cands.length ? 'אין שרטוט שהחתימה שלו מתאימה (' + verbSems.join(', ') + ')' : !tried.length ? 'כל השרטוטים המתאימים נעצרו לפני ניסיון: ' + [...new Set(row.templates.map((x) => x.skipped))].join(' · ') : 'אף מילוי לא עבר את כל החוקים (' + row.attempts + ' ניסיונות)';
    }
    results.push(row);
    log(`${V}: ${row.found ? '✅ ' + row.found.shape + ' (' + row.found.parts + ' חלקים, ' + row.found.holds + ')' : '✗ ' + row.why} · ${row.attempts} ניסיונות`);
  }
  const ledger = {
    about: 'נבנה ע״י catalog/blueprints/search.mjs — לא לערוך ביד. "זמן" = ניסיונות + צעדי-ארגז-החול (דטרמיניסטי); שעון-קיר מודפס בהרצה ומדווח בדוח',
    budget: BUD, shapes: SUPER.length, executableShapes: SUPER.filter((s) => s.exec).length, templates: templates.length, minedTemplates: templates.filter((t) => t.mined).length,
    solved: results.filter((r) => r.found).length, targets: results.length, results,
  };
  return { ledger: JSON.stringify(ledger, null, 1) + '\n', found };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  const oi = process.argv.indexOf('--only');
  const only = oi > 0 ? process.argv[oi + 1] : null;
  const quiet = process.argv.includes('--check');
  const { ledger, found } = await searchAll({ only, log: quiet ? () => {} : (s) => console.log(s) });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (only) { console.log(`(--only: לא נכתב) · ${secs}s`); process.exit(0); }
  const cur = fs.existsSync(FOUND) ? fs.readdirSync(FOUND).filter((f) => f.endsWith('.json')).sort() : [];
  if (process.argv.includes('--check')) {
    const readRaw = (p) => (fs.existsSync(p) ? ORIG_READ(p, 'utf8') : '');
    const stale = (fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8') : '') !== ledger || JSON.stringify(cur) !== JSON.stringify(Object.keys(found).sort()) || cur.some((f) => readRaw(path.join(FOUND, f)) !== found[f]);
    if (stale) { console.error('ledger.json / found/ לא מעודכנים — הריצו node catalog/blueprints/search.mjs'); process.exit(1); }
    console.log('✓ ledger.json + found/ מעודכנים · ' + secs + 's');
    process.exit(0);
  }
  fs.mkdirSync(FOUND, { recursive: true });
  for (const f of cur) if (!found[f]) fs.unlinkSync(path.join(FOUND, f));
  for (const [f, t] of Object.entries(found)) fs.writeFileSync(path.join(FOUND, f), t);
  fs.writeFileSync(LEDGER, ledger);
  const L = JSON.parse(ledger);
  console.log(`🔍 ${L.solved}/${L.targets} פעלי-יעד נמצאו לבד · ${L.results.reduce((a, r) => a + r.attempts, 0)} ניסיונות · ${secs}s`);
}
