#!/usr/bin/env node
/**
 * 🧩 המצרף · מכונת-השילוב (FINAL-MACHINE, 14.10.2026) — הלב של "לא חסר כלום".
 *
 * צורך (פועל V, חומר M) שאין לו חלק מוכח אחד (גם לא חלק פנימי) — לפני שהמכונה מציגה ⛏️/🔎 היא מנסה **שילוב** של
 * שני חלקים מוכחים-בהרצה (P1 → P2): הפלט של P1 נכנס לקלט הראשי של P2, והחומר של התוצאה מתאים ל-M.
 * הצעדים: מפרק (המועמדים לפי הפועל והחומר) ⇒ מחבר (פונקציה מורכבת אחת) ⇒ מאמת (**החוקים של V** מ-catalog/verbs.json,
 * באותה רתמה של קורא-ההתנהגות — probePart, ארגז-החול, אותו זרע). שילוב מתקבל **רק** אם V מתקיים n/n.
 *
 * שתי צורות (catalog/combiner/verb-recipes.json):
 *   chain — C(a…, b…) = P2(P1(a…), b…)
 *   pair  — C(x, y, k…) = P2(P1(x, k…), P1(y, k…))   (לפועל דו-מקומי: משווה, מודד-מרחק)
 * החיפוש חסום ודטרמיניסטי: קודם רמזי-המתכונים, אחר-כך עד K מועמדים לפי הפועל והחומר.
 * חלקים שרצים כאן: אורביט · הליבות (core, core-b) · החלקים הפנימיים (inner-*) — כולם בריפו, בלי שכפולים.
 *
 *   node catalog/combiner/combine.mjs           # כותב catalog/recipes/combo-*.json + catalog/combiner/combos.json
 *   node catalog/combiner/combine.mjs --check   # יציאה 1 אם לא מעודכן
 *
 * שילוב מוכח נשמר כמתכון (catalog/recipes/combo-<V>-<M>.json) — המנגנון הקיים: הוא נכנס לאינדקס כחלק אחד שמוכח ל-V.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { prepareJobs, isRunnable } from '../lib/probe-file.mjs';
import { bundleFile, loadInSandbox, callerFor, resolvePart } from '../lib/sandbox.mjs';
import { probePart, evalVerb, bindingsOf, baseCases, fOf, fnvHash } from '../lib/probe.mjs';
import { readSigs } from '../inner/lib/sigs.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';
import { assemble, fit, provenAs, adapterRole } from './core.mjs';
import { HERE, CATALOG, loadGoals, loadIndex, loadParts, loadRecipes } from './load.mjs';
await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true }); // INNER v2: gen/ והקבצים הפנימיים הפרושים נוצרים לפי דרישה

const ROOT = path.resolve(CATALOG, '..');
export const SEED = 0x0c0b1e;
const K = 24;
const RUN_SOURCES = new Set(['orbit', 'core', 'core-b']);
const runnableHere = (raw) => raw && (raw.source.startsWith('inner-') ? (raw.tags || []).some((t) => t.startsWith('gen:')) : RUN_SOURCES.has(raw.source) && isRunnable(raw));

const HINTS = JSON.parse(fs.readFileSync(path.join(HERE, 'verb-recipes.json'), 'utf8')).recipes;

/* ═══════════════ 1. מפרק — המועמדים ═══════════════ */

/** החלקים שמוכחים בהרצה לפועל v ושאפשר להריץ כאן, לפי הסדר של האינדקס (מוכח ⇒ פחות קלטים ⇒ פרויקט ⇒ מזהה). */
function provenRunnable(ix, raw, v) {
  return (ix.byVerb.get(v) || []).filter((p) => provenAs(p, v) && p.takes.length > 0 && p.gives !== 'unknown' && homeOf(p, raw));
}
/** הבית שאפשר להריץ: הבית הראשון של החלק (אותו חלק שהועתק בין פרויקטים) שרץ כאן. */
function homeOf(p, raw) {
  for (const h of p.homes) { const r = raw.get(h.id); if (runnableHere(r)) return r; }
  return null;
}
const accepts = (p, kind) => p.takes.length > 0 && fit(kind, p.takes[0]) > 0;
const SELECTORS = ['extreme', 'lookup', 'next', 'filter', 'sort', 'round', 'clamp', 'convert', 'format', 'normalize', 'map', 'tier', 'count', 'sum'];

/** הקלט של P1 שמשחק את "הדבר" בצורת pair: הראשון שהסוג שלו הוא החומר (מקום ⇒ גם רשומה, נבדק אחרי הטעינה שיש לה x,y). */
const POINT_TYPE = /\bx\??:\s*number\b[\s\S]*\by\??:\s*number\b/;
let RAW = new Map();
const pairAt = (a, M) => {
  const r = homeOf(a, RAW);
  return a.takes.findIndex((k, i) => fit(k, M) > 0 || (M === 'geo' && String(k).startsWith('record:') && POINT_TYPE.test(String(r?.takes?.[i]?.type || ''))));
};
const plainKind = (k) => !!k && k !== 'unknown' && !String(k).startsWith('record');
/** דבק כללי מותר רק כשהוא עולם-ריק: מתאם-סוג מוכח (adapterRole — אותו חוק כמו בטבעות). בוררים ייכנסו רק דרך רמז-מתכון. */
const worldFree = (p) => !!adapterRole(p);

/** שלב ברמז: {verb} — חלק מוכח לפועל הזה; {takes} — כל חלק מוכח שאחד הקלטים שלו מהסוג הזה. */
function stepPool(ix, raw, st, all) {
  if (st.verb) return provenRunnable(ix, raw, st.verb);
  return all.filter((p) => pairAt(p, st.takes) >= 0 && plainKind(p.gives));
}

/** מועמדים לצורך: [{form, at?, steps:[P1,P2], roles:[v1,v2], hint?}] — רמזים קודם, אחר-כך כלליים; עד K, בלי כפילויות. */
export function candidatesFor(need, ix, raw) {
  RAW = raw;
  const V = need.verb; const M = need.material;
  const out = []; const seen = new Set();
  const all = ix.parts.filter((p) => p.primary && provenAs(p, p.primary) && p.takes.length > 0 && p.gives !== 'unknown' && homeOf(p, raw));
  const push = (form, a, b, ra, rb, hint, at) => {
    const key = form + '|' + a.id + '>' + b.id;
    if (out.length >= K || seen.has(key) || a.id === b.id) return;
    seen.add(key);
    out.push({ form, ...(form === 'pair' ? { at } : {}), steps: [a, b], roles: [ra, rb], ...(hint ? { hint } : {}) });
  };
  // רמזי-מתכון: הפעלים (או הסוגים) שבתוכם — כל זוג מוכח-בהרצה; רק החוקים של V מחליטים
  for (const h of HINTS.filter((x) => x.verb === V && (!x.material || x.material === M))) {
    const A = stepPool(ix, raw, h.steps[0], all).slice(0, 8);
    const Bs = stepPool(ix, raw, h.steps[1], all).slice(0, 12);
    for (const a of A) for (const b of Bs) {
      if (h.form === 'pair') {
        const at = pairAt(a, M);
        if (at < 0 || b.takes.length < 2 || !accepts(b, a.gives) || fit(a.gives, b.takes[1]) === 0) continue;
        push('pair', a, b, h.steps[0].verb || a.primary, h.steps[1].verb || b.primary, h.why, at);
      } else {
        if (!accepts(b, a.gives)) continue;
        push('chain', a, b, h.steps[0].verb || a.primary, h.steps[1].verb || b.primary, h.why);
      }
    }
  }
  // כללי: הליבה (מוכחת ל-V) ⇒ דבק עולם-ריק שמסיים בחומר; או דבק שמתחיל בחומר ⇒ הליבה
  const cores = provenRunnable(ix, raw, V).slice(0, 8);
  const rank = (p) => { const k = SELECTORS.indexOf(p.primary); return [adapterRole(p) ? 0 : 1, k < 0 ? 99 : k, p.takes.length, p.id]; };
  const cmp = (x, y) => { const a = rank(x); const b = rank(y); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  const glue = all.filter(worldFree);
  for (const c of cores) {
    for (const g of glue.filter((g) => g.id !== c.id && accepts(g, c.gives) && fit(g.gives, M) > 0).sort(cmp).slice(0, 4)) push('chain', c, g, V, g.primary);
    for (const f of glue.filter((f) => f.id !== c.id && accepts(f, M) && accepts(c, f.gives)).sort(cmp).slice(0, 4)) push('chain', f, c, f.primary, V);
  }
  return out;
}

/* ═══════════════ 2. מחבר — פונקציה מורכבת אחת ═══════════════ */

/** טוען את כל החלקים שצריך להריץ (פעם אחת לכל קובץ): id ⇒ {sig, call(seed)}. */
export async function loadRunners(parts, raw) {
  const homes = new Map();
  for (const p of parts) { const r = homeOf(p, raw); if (r) homes.set(p.id, r); }
  const code = [...new Set([...homes.values()].filter((r) => !r.source.startsWith('inner-')))];
  const { jobs } = code.length ? prepareJobs(ROOT, code) : { jobs: [] };
  const mods = new Map();
  const mod = async (abs, opts) => {
    const k = abs + '|' + (opts.expose || []).join(',');
    if (!mods.has(k)) { try { mods.set(k, loadInSandbox(await bundleFile(abs, opts))); } catch { mods.set(k, null); } }
    return mods.get(k);
  };
  const byRaw = new Map();
  for (const job of jobs) {
    const m = await mod(job.abs, { expose: job.expose ?? [], esm: job.esm !== false });
    for (const jp of job.parts) {
      const got = m && resolvePart(m.exports, jp.symbol, jp.method);
      if (got) byRaw.set(jp.id, { sig: jp.sig, ctx: m.ctx, fn: got.fn, self: got.self });
    }
  }
  for (const r of new Set([...homes.values()].filter((x) => x.source.startsWith('inner-')))) {
    const [genRel, exp] = r.tags.find((t) => t.startsWith('gen:')).slice(4).split('#');
    const abs = path.join(ROOT, genRel);
    const m = await mod(abs, { esm: true });
    const fn = m && m.exports[exp];
    if (typeof fn !== 'function') continue;
    const sigs = readSigs(fs.readFileSync(abs, 'utf8'));
    byRaw.set(r.id, { sig: { takes: (sigs[exp] ?? []).map((t, k) => ({ ...t, kind: r.takes[k]?.kind ?? 'unknown' })) }, ctx: m.ctx, fn });
  }
  const out = new Map();
  for (const [id, r] of homes) { const x = byRaw.get(r.id); if (x && x.sig.takes.length === r.takes.length) out.set(id, x); }
  return out;
}

/** החיבור: חתימה + קריאה של הפונקציה המורכבת. pair: `at` = הקלט של P1 שמשחק את "הדבר" (שני עותקים: A ו-B). */
export function compose(form, R1, R2, seed, at = 0) {
  const c1 = callerFor(R1.ctx, R1.fn, seed, R1.self);
  const c2 = callerFor(R2.ctx, R2.fn, seed ^ 0x55, R2.self);
  const n1 = R1.sig.takes.length;
  if (form === 'pair') {
    // שני העותקים הם אותו סוג בהגדרה — רשומה בלי שם-טיפוס מקבלת שם, כדי שהקורא יקשר אותם כזוג (x+x)
    const t0 = R1.sig.takes[at];
    const tx = t0.d?.t === 'obj' && t0.d.n === undefined ? { ...t0, d: { ...t0.d, n: 'Thing' } } : t0;
    const rest = R1.sig.takes.filter((_, k) => k !== at);
    const takes = [{ ...tx, name: tx.name + 'A' }, { ...tx, name: tx.name + 'B' }, ...rest, ...R2.sig.takes.slice(2)];
    const with1 = (x, k) => { const a = k.slice(); a.splice(at, 0, x); return a; };
    const call = (args) => {
      const k = args.slice(2, 1 + n1);
      const a = c1(with1(args[0], k)); if ('err' in a || a.async) return a;
      const b = c1(with1(args[1], k)); if ('err' in b || b.async) return b;
      return c2([a.v, b.v, ...args.slice(1 + n1)]);
    };
    return { sig: { takes }, call };
  }
  const takes = [...R1.sig.takes, ...R2.sig.takes.slice(1)];
  const call = (args) => {
    const a = c1(args.slice(0, n1)); if ('err' in a || a.async) return a;
    return c2([a.v, ...args.slice(n1)]);
  };
  return { sig: { takes }, call };
}

/** מקום = רשומה עם x ו-y מספריים (או geo מפורש). */
export const pointDesc = (d) => !!d && d.t === 'obj' && ['x', 'y'].every((k) => (d.p || []).some(([n, dd]) => n === k && (dd.t === 'num' || dd.t === 'int')));

/* ═══════════════ 3. מאמת — החוקים של V ═══════════════ */

/** מריץ את חוקי V על הפונקציה המורכבת. מתקבל ⇒ {ok, holds, laws}; לא ⇒ {ok:false, law, why} (החוק הראשון שנכשל). */
export function verify(V, composed, seed, B) {
  const verb = LAW_VERBS.get(V);
  if (!verb) return { ok: false, why: 'לפועל אין חוקי-הרצה' };
  const res = probePart({ sig: composed.sig, call: composed.call, seed, B, verbs: [verb] });
  if (res.status !== 'ran') return { ok: false, why: 'לא רץ: ' + res.status };
  const h = (res.verbs || []).find((x) => x.id === V);
  if (h && /^(\d+)\/\1$/.test(h.holds)) return { ok: true, holds: h.holds, on: h.on, laws: verb.laws.map((l) => l.id) };
  // למה לא: הקישור הכי-קרוב (הכי הרבה חוקים שעברו) — החוק הראשון שנכשל
  const cases = baseCases(composed.sig, composed.call, seed, B);
  if (cases.length < 4) return { ok: false, why: 'לא היו מספיק קלטים שהפונקציה המורכבת מקבלת (' + cases.length + ')' };
  let best = null;
  for (const b of bindingsOf(verb, composed.sig, cases)) {
    const rep = evalVerb(verb, b, composed.sig, cases, fOf(composed.call), seed, B, true);
    if (!rep) continue;
    if (!best || rep.pass > best.pass) best = rep;
  }
  if (!best) return { ok: false, why: 'הפלט לא בצורה שהחוקים של «' + verb.he + '» בודקים (אין קישור מתאים)' };
  const bad = Object.entries(best.laws).find(([, L]) => L.fail);
  if (bad) return { ok: false, law: bad[0], why: String(bad[1].why).slice(0, 140) };
  const thin = Object.entries(best.laws).find(([, L]) => L.pass < 2);
  if (thin) return { ok: false, law: thin[0], why: 'החוק כמעט לא חל (' + thin[1].pass + ' מקרים)' };
  if (!best.witness) return { ok: false, why: 'אין מקרה-עד לא-טריוויאלי' };
  if (!best.dep) return { ok: false, why: 'הפלט לא תלוי בקלט' };
  return { ok: false, why: 'לא עבר' };
}

/* ═══════════════ הכול ═══════════════ */

const slug = (s) => String(s).replace(/[^a-z0-9-]/gi, '-');

/** כל הצרכים בלי חלק מוכח ⇒ ניסיון-שילוב לכל זוג (פועל, חומר). */
export async function combineAll() {
  const raw = new Map(loadParts().map((p) => [p.id, p]));
  const ix = loadIndex({ recipes: loadRecipes().filter((r) => !r.combo) });
  const goals = loadGoals();
  const want = new Map();
  for (const g of goals)
    for (const n of assemble(g, ix).needs) {
      if (n.chain || n.need.verb.startsWith('NEW:') || !LAW_VERBS.get(n.need.verb)) continue;
      const k = n.need.verb + '|' + n.need.material;
      if (!want.has(k)) want.set(k, { verb: n.need.verb, material: n.need.material, behaviors: [] });
      want.get(k).behaviors.push(g.word + ': ' + n.need.behavior);
    }
  const plans = [...want.values()].sort((a, b) => (a.verb + a.material < b.verb + b.material ? -1 : 1)).map((w) => ({ ...w, cands: candidatesFor(w, ix, raw) }));
  const runners = await loadRunners([...new Set(plans.flatMap((p) => p.cands.flatMap((c) => c.steps)))], raw);
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const results = [];
  for (const pl of plans) {
    const tried = [];
    let found = null;
    for (const c of pl.cands) {
      const R1 = runners.get(c.steps[0].id); const R2 = runners.get(c.steps[1].id);
      if (!R1 || !R2) { tried.push({ steps: c.steps.map((s) => s.id), why: 'לא נטען להרצה' }); continue; }
      if (c.form === 'pair' && pl.material === 'geo' && !pointDesc(R1.sig.takes[c.at]?.d) && R1.sig.takes[c.at]?.kind !== 'geo') { tried.push({ steps: c.steps.map((s) => s.id), form: c.form, why: 'הקלט אינו מקום (אין x,y)' }); continue; }
      const seed = (fnvHash(c.form + c.steps.map((s) => s.id).join('>')) ^ SEED) >>> 0;
      let v;
      try { v = verify(pl.verb, compose(c.form, R1, R2, seed, c.at ?? 0), seed, B); } catch (e) { v = { ok: false, why: 'שגיאה: ' + String(e?.message || e).slice(0, 100) }; }
      if (v.ok) { found = { ...c, ...v }; break; }
      tried.push({ steps: c.steps.map((s) => s.id), form: c.form, ...(v.law ? { law: v.law } : {}), why: v.why });
    }
    results.push({ verb: pl.verb, material: pl.material, behaviors: pl.behaviors.slice(0, 6), nBehaviors: pl.behaviors.length, candidates: pl.cands.length, found: found ? { form: found.form, ...(found.form === 'pair' ? { at: found.at } : {}), steps: found.steps.map((s) => s.id), roles: found.roles, holds: found.holds, on: found.on, laws: found.laws, ...(found.hint ? { hint: found.hint } : {}) } : null, tried: tried.slice(0, 8) });
  }
  const recipes = {};
  for (const r of results.filter((x) => x.found)) {
    const id = 'combo-' + slug(r.verb) + '-' + slug(r.material);
    const [a, b] = r.found.steps.map((s) => ix.byId.get(s));
    recipes[id + '.json'] = JSON.stringify({
      id, word: r.verb + ' · ' + r.material, title: 'שילוב: ' + a.name + ' ⇒ ' + b.name,
      combo: { verb: r.verb, material: r.material, form: r.found.form, ...(r.found.form === 'pair' ? { at: r.found.at } : {}), steps: r.found.steps, roles: r.found.roles, holds: r.found.holds, laws: r.found.laws, ...(r.found.hint ? { hint: r.found.hint } : {}) },
      needs: [{ need: 'combo', verb: r.verb, material: r.material, chain: r.found.steps }],
    }, null, 1) + '\n';
  }
  const summary = { about: 'נבנה ע״י catalog/combiner/combine.mjs — לא לערוך ביד', seed: SEED, k: K, pairs: results.length, proven: results.filter((r) => r.found).length, results };
  return { summary: JSON.stringify(summary, null, 1) + '\n', recipes };
}

if (process.argv[1] && process.argv[1].endsWith('combine.mjs')) {
  const { summary, recipes } = await combineAll();
  const RDIR = path.join(CATALOG, 'recipes');
  const OUT = path.join(HERE, 'combos.json');
  const cur = fs.existsSync(RDIR) ? fs.readdirSync(RDIR).filter((f) => f.startsWith('combo-') && f.endsWith('.json')).sort() : [];
  if (process.argv.includes('--check')) {
    const stale = (fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '') !== summary || JSON.stringify(cur) !== JSON.stringify(Object.keys(recipes).sort()) || cur.some((f) => fs.readFileSync(path.join(RDIR, f), 'utf8') !== recipes[f]);
    if (stale) { console.error('combos.json / recipes/combo-* לא מעודכנים — הריצו node catalog/combiner/combine.mjs'); process.exit(1); }
    process.exit(0);
  }
  fs.mkdirSync(RDIR, { recursive: true });
  for (const f of cur) if (!recipes[f]) fs.unlinkSync(path.join(RDIR, f));
  for (const [f, t] of Object.entries(recipes)) fs.writeFileSync(path.join(RDIR, f), t);
  fs.writeFileSync(OUT, summary);
  const s = JSON.parse(summary);
  console.log('🧩 ' + s.proven + '/' + s.pairs + ' זוגות (פועל·חומר) נמצאו כשילוב מוכח · ' + Object.keys(recipes).length + ' מתכוני-שילוב');
}
