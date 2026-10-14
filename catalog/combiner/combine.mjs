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
import { assemble, fit, provenAs, adapterRole, ADAPTER_VERBS } from './core.mjs';
import { SHAPE_KINDS, materialDesc } from '../lib/kind-shape.mjs';
import { HERE, CATALOG, loadGoals, loadIndex, loadParts, loadRecipes } from './load.mjs';
import { runGraph, graphProblem, graphParts } from './graph.mjs';

const ROOT = path.resolve(CATALOG, '..');
export const SEED = 0x0c0b1e;
const K = 24;
/** עומק 3 (MACHINE-V2): עד K3 שרשראות של שלושה חלקים לזוג — רק כשאף זוג של שניים לא עבר. */
const K3 = 24;
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
/**
 * מתאם של מקום/קול/תמונה/תור (MACHINE-V3): מתאם-סוג מוכח (הפועל הראשי ממיר/מעצב/…, מוכח בהרצה) שהקלט הראשי או הפלט
 * שלו הוא אחד מארבעת הסוגים, והקלטים הנוספים הם **מספרים בלבד** (זווית, קנה-מידה, רדיוס — פרמטרים, לא עולם).
 * בלי זה אין שום מתאם: הנקודות והצלילים בקוד תמיד באים עם פרמטר (project(p, yaw, pitch)). עד 4 קלטים.
 */
export const shapeAdapter = (p) =>
  ADAPTER_VERBS.has(p.primary) && provenAs(p, p.primary) && p.takes.length >= 1 && p.takes.length <= 4 && plainKind(p.takes[0]) && p.takes.slice(1).every((k) => k === 'number') &&
  plainKind(p.gives) && fit(p.gives, p.takes[0]) === 0 && (SHAPE_KINDS.includes(p.takes[0]) || SHAPE_KINDS.includes(p.gives));
/** דבק כללי מותר רק כשהוא עולם-ריק: מתאם-סוג מוכח (adapterRole — אותו חוק כמו בטבעות), או מתאם-צורה. בוררים ייכנסו רק דרך רמז-מתכון. */
const worldFree = (p) => !!adapterRole(p) || shapeAdapter(p);

/** שלב ברמז: {part} — החלק הזה בשמו המלא (ו-{verb} = התפקיד שהוא מוכח לו); {verb} — חלק מוכח לפועל הזה; {takes} — כל חלק מוכח שאחד הקלטים שלו מהסוג הזה. */
function stepPool(ix, raw, st, all) {
  if (st.part) { const p = partByHome(ix, st.part); return p && homeOf(p, raw) && (!st.verb || provenAs(p, st.verb)) ? [p] : []; }
  if (st.verb) return provenRunnable(ix, raw, st.verb);
  return all.filter((p) => pairAt(p, st.takes) >= 0 && plainKind(p.gives));
}

/** חלק לפי מזהה-בית (כולל בתים שאוחדו לחלק אחד באינדקס). */
export function partByHome(ix, id) {
  if (ix.byId.has(id)) return ix.byId.get(id);
  if (!ix.byHome) { ix.byHome = new Map(); for (const p of ix.parts) for (const h of p.homes) if (!ix.byHome.has(h.id)) ix.byHome.set(h.id, p); }
  return ix.byHome.get(id) || null;
}

/**
 * מתכון-גרף (צורת `graph`) ⇒ מועמד: כל צומת נקרא בשם החלק המלא, והחלק חייב להיות מוכח-בהרצה לתפקיד שהמתכון נותן לו (`role`).
 * חלק שחסר / לא מוכח / לא רץ כאן ⇒ המועמד נושא את הסיבה (`bad`) ונרשם ב-tried — בלי לנחש תחליף.
 */
function graphCandidate(h, ix, raw) {
  const prob = graphProblem(h);
  const parts = graphParts(h).map((id) => partByHome(ix, id));
  let bad = prob;
  if (!bad) {
    for (const n of h.nodes) {
      const p = partByHome(ix, n.part);
      if (!p) { bad = n.id + ': החלק לא באינדקס (' + n.part + ')'; break; }
      if (!provenAs(p, n.role)) { bad = n.id + ': ' + n.part + ' לא מוכח כ-' + n.role; break; }
      if (!homeOf(p, raw)) { bad = n.id + ': ' + n.part + ' לא רץ כאן'; break; }
    }
  }
  const roles = graphParts(h).map((id) => h.nodes.find((n) => n.part === id).role);
  return { form: 'graph', graph: h, steps: parts.filter(Boolean), roles, hint: h.why, ...(bad ? { bad } : {}) };
}

/** מועמדים לצורך: [{form, at?, steps:[P1,P2(,P3)] | graph, roles, hint?}] — רמזים קודם, אחר-כך כלליים; עד K, בלי כפילויות. */
export function candidatesFor(need, ix, raw) {
  RAW = raw;
  const V = need.verb; const M = need.material;
  const out = []; const seen = new Set();
  for (const h of HINTS.filter((x) => x.form === 'graph' && x.verb === V && (!x.material || x.material === M))) out.push(graphCandidate(h, ix, raw));
  const all = ix.parts.filter((p) => p.primary && provenAs(p, p.primary) && p.takes.length > 0 && p.gives !== 'unknown' && homeOf(p, raw));
  const push = (form, a, b, ra, rb, hint, at) => {
    const key = form + '|' + a.id + '>' + b.id;
    if (out.length >= K || seen.has(key) || a.id === b.id) return;
    seen.add(key);
    out.push({ form, ...(form === 'pair' ? { at } : {}), steps: [a, b], roles: [ra, rb], ...(hint ? { hint } : {}) });
  };
  // רמזי-מתכון: הפעלים (או הסוגים) שבתוכם — כל זוג מוכח-בהרצה; רק החוקים של V מחליטים
  for (const h of HINTS.filter((x) => x.verb === V && (!x.material || x.material === M) && x.steps?.length === 2)) {
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

/**
 * עומק 3 (MACHINE-V2): שלושה חלקים בשרשרת — חלק אחד מחזיק את הפועל (ליבה מוכחת ל-V), והשניים האחרים **מתאמי-סוג מוכחים**
 * (adapterRole — אותו כלל עולם-ריק), או לפי רמז-מתכון בן שלושה צעדים. שלוש צורות:
 *   ליבה ⇒ מתאם ⇒ מתאם (הפלט מגיע לחומר בשני צעדים) · מתאם ⇒ מתאם ⇒ ליבה (החומר נכנס בשני צעדים) · מתאם ⇒ ליבה ⇒ מתאם.
 * חסום (עד K3, 3 מתאמים לכל משבצת, 8 ליבות) ודטרמיניסטי (אותו סדר כמו בעומק 2). רק החוקים של V מחליטים.
 */
export function candidates3For(need, ix, raw) {
  RAW = raw;
  const V = need.verb; const M = need.material;
  const out = []; const seen = new Set();
  const push = (steps, roles, hint) => {
    const key = steps.map((p) => p.id).join('>');
    if (out.length >= K3 || seen.has(key) || new Set(steps.map((p) => p.id)).size !== steps.length) return;
    seen.add(key);
    out.push({ form: 'chain', steps, roles, ...(hint ? { hint } : {}) });
  };
  const all = ix.parts.filter((p) => p.primary && provenAs(p, p.primary) && p.takes.length > 0 && p.gives !== 'unknown' && homeOf(p, raw));
  for (const h of HINTS.filter((x) => x.verb === V && (!x.material || x.material === M) && x.steps?.length === 3)) {
    const [A, Bs, Cs] = h.steps.map((st, k) => stepPool(ix, raw, st, all).slice(0, k ? 6 : 8));
    for (const a of A) for (const b of Bs) for (const c of Cs) if (accepts(b, a.gives) && accepts(c, b.gives)) push([a, b, c], h.steps.map((st, k) => st.verb || [a, b, c][k].primary), h.why);
  }
  const rank = (p) => { const k = SELECTORS.indexOf(p.primary); return [k < 0 ? 99 : k, p.takes.length, p.id]; };
  const cmp = (x, y) => { const a = rank(x); const b = rank(y); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  const glue = all.filter(worldFree).sort(cmp);
  const cores = provenRunnable(ix, raw, V).slice(0, 8);
  const take = (xs) => xs.slice(0, 3);
  for (const c of cores) {
    const G = glue.filter((g) => g.id !== c.id);
    // ליבה ⇒ מתאם ⇒ מתאם
    for (const g1 of take(G.filter((g) => accepts(g, c.gives) && fit(g.gives, M) === 0)))
      for (const g2 of take(G.filter((g) => g.id !== g1.id && accepts(g, g1.gives) && fit(g.gives, M) > 0))) push([c, g1, g2], [V, g1.primary, g2.primary]);
    // מתאם ⇒ מתאם ⇒ ליבה
    for (const f1 of take(G.filter((f) => accepts(f, M) && !accepts(c, f.gives))))
      for (const f2 of take(G.filter((f) => f.id !== f1.id && accepts(f, f1.gives) && accepts(c, f.gives)))) push([f1, f2, c], [f1.primary, f2.primary, V]);
    // מתאם ⇒ ליבה ⇒ מתאם
    for (const f of take(G.filter((f) => accepts(f, M) && accepts(c, f.gives))))
      for (const g of take(G.filter((g) => g.id !== f.id && accepts(g, c.gives) && fit(g.gives, M) > 0))) push([f, c, g], [f.primary, V, g.primary]);
  }
  return out;
}

/**
 * צורת `on` (MACHINE-V3): **אותו חלק, על החומר.** חלק מוכח ל-V שהקלט שלו פתוח (any / T / T[] / אובייקט כללי) — מריצים אותו
 * שוב כשבמקום הקלט הפתוח נכנס החומר עצמו (נקודות · צלילים · תמונות · תור — `MATERIAL_DESC`), ומקבלים רק אם **החוקים של V**
 * עוברים n/n **והקישור שעבר הוא הקלט שהוחלף**. בלי דבק ובלי עולם: "הקוד הכללי כבר עושה את זה על נקודות" — מוכח בהרצה.
 * רק לארבעת הסוגים. עד K_ON חלקים, לפי הסדר של האינדקס.
 */
const K_ON = 24;
const OPEN_TYPE = /^(readonly\s+)?([A-Z]\w{0,3}|any|unknown|object)(\[\])?$|^(Readonly)?Array<([A-Z]\w{0,3}|any|unknown)>$/;
export function candidatesOnFor(need, ix, raw) {
  if (!SHAPE_KINDS.includes(need.material)) return [];
  const out = [];
  for (const p of provenRunnable(ix, raw, need.verb)) {
    if (out.length >= K_ON) break;
    const r = homeOf(p, raw);
    if (!(r.takes || []).some((t) => OPEN_TYPE.test(String(t.type || '').trim()))) continue;
    out.push({ form: 'on', steps: [p], roles: [need.verb] });
  }
  return out;
}
const LIST_BINDS = new Set(['list>list', 'list>any', 'list+key', 'list+any>list', 'flags', 'text+list', 'divide']);
const openD = (d) => !d || d.t === 'any' || (d.t === 'tp' && (!d.of || d.of.t === 'any')) || (d.t === 'obj' && !(d.p || []).length);
/** הקלט הפתוח שאליו נכנס החומר: ברשימה (פועל של רשימות) — מערך של פתוח; אחרת — פתוח. */
export function onSlot(R, V, M) {
  const many = LIST_BINDS.has(LAW_VERBS.get(V)?.bind) || M === 'waiting';
  const ts = R.sig.takes;
  for (let k = 0; k < ts.length; k++) { const d = ts[k].d; if (many && d && (d.t === 'arr' || d.t === 'set') && openD(d.of)) return { k, many: true }; }
  for (let k = 0; k < ts.length; k++) if (openD(ts[k].d)) return { k, many };
  return null;
}
/** אותו חלק, כשבקלט הפתוח נכנס החומר. */
export function composeOn(R, slot, M, seed) {
  const c = callerFor(R.ctx, R.fn, seed, R.self);
  const takes = R.sig.takes.map((t, k) => (k === slot.k ? { ...t, d: materialDesc(M, slot.many), kind: M } : t));
  return { sig: { takes }, call: (args) => c(args) };
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

/** שרשרת של N חלקים: C(a…, b…, c…) = P3(P2(P1(a…), b…), c…). הקלטים הנוספים של כל שלב הם קלטים חופשיים של השילוב. */
export function composeChain(Rs, seed) {
  if (Rs.length === 2) return compose('chain', Rs[0], Rs[1], seed);
  const cs = Rs.map((R, k) => callerFor(R.ctx, R.fn, seed ^ Math.imul(k, 0x55), R.self));
  const takes = [...Rs[0].sig.takes, ...Rs.slice(1).flatMap((R) => R.sig.takes.slice(1))];
  const call = (args) => {
    let at = Rs[0].sig.takes.length;
    let r = cs[0](args.slice(0, at)); if ('err' in r || r.async) return r;
    for (let k = 1; k < Rs.length; k++) {
      const extra = Rs[k].sig.takes.length - 1;
      r = cs[k]([r.v, ...args.slice(at, at + extra)]); at += extra;
      if ('err' in r || r.async) return r;
    }
    return r;
  };
  return { sig: { takes }, call };
}

/**
 * גרף (צורת `graph`): כל צומת = חלק מוכח אחד בארגז-החול; החוטים רק מעבירים/בוחרים שדה (graph.mjs).
 * החתימה = החתימה של הפועל עצמו (הבקשה מביאה את העולם — המקום, היום, הרגע).
 */
export function composeGraph(g, Rs, seed, sig) {
  const cs = Rs.map((R, k) => callerFor(R.ctx, R.fn, seed ^ Math.imul(k + 1, 0x9e3779b1), R.self));
  return { sig: { takes: sig }, call: (args) => runGraph(g, args, (k, a) => cs[k](a)) };
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

const KIND_HE_ON = { geo: 'נקודות', sound: 'צלילים', image: 'תמונות', waiting: 'תור' };
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
  const plans = [...want.values()].sort((a, b) => (a.verb + a.material < b.verb + b.material ? -1 : 1)).map((w) => ({ ...w, cands: candidatesFor(w, ix, raw), candsOn: candidatesOnFor(w, ix, raw), cands3: candidates3For(w, ix, raw) }));
  const runners = await loadRunners([...new Set(plans.flatMap((p) => [...p.cands, ...p.candsOn, ...p.cands3].flatMap((c) => c.steps)))], raw);
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const results = [];
  const ids = (c) => (c.form === 'graph' ? graphParts(c.graph) : c.steps.map((s) => s.id));
  for (const pl of plans) {
    const tried = [];
    let found = null;
    let n3 = 0;
    const attempt = (c) => {
      if (c.bad) { tried.push({ steps: ids(c), form: c.form, why: c.bad }); return null; }
      const Rs = c.form === 'graph' ? c.graph.nodes.map((n) => runners.get(partByHome(ix, n.part).id)) : c.steps.map((s) => runners.get(s.id));
      if (Rs.some((R) => !R)) { tried.push({ steps: ids(c), form: c.form, why: 'לא נטען להרצה' }); return null; }
      if (c.form === 'pair' && pl.material === 'geo' && !pointDesc(Rs[0].sig.takes[c.at]?.d) && Rs[0].sig.takes[c.at]?.kind !== 'geo') { tried.push({ steps: ids(c), form: c.form, why: 'הקלט אינו מקום (אין x,y)' }); return null; }
      const seed = (fnvHash(c.form + ids(c).join('>')) ^ SEED) >>> 0;
      let v;
      try {
        let composed;
        if (c.form === 'graph') {
          const ref = LAW_VERBS.get(pl.verb)?.ref?.sig;
          if (!ref || ref.length !== c.graph.inputs.length) throw new Error('הקלטים של הגרף לא תואמים את הפועל');
          composed = composeGraph(c.graph, Rs, seed, ref.map((t, k) => ({ ...t, name: c.graph.inputs[k] })));
        } else if (c.form === 'on') {
          const slot = onSlot(Rs[0], pl.verb, pl.material);
          if (!slot) throw new Error('אין קלט פתוח שאפשר להכניס אליו ' + pl.material);
          composed = composeOn(Rs[0], slot, pl.material, seed);
          v = verify(pl.verb, composed, seed, B);
          // עבר — אבל רק אם הקישור שעבר הוא הקלט שהוחלף (אחרת החלק עבד על משהו אחר, לא על החומר)
          const nm = composed.sig.takes[slot.k].name;
          if (v.ok && !String(v.on || '').split('+').includes(nm)) v = { ok: false, why: 'החוקים עברו על קלט אחר (' + v.on + '), לא על ' + pl.material };
          if (v.ok) v = { ...v, slot: slot.k, many: slot.many };
        } else composed = c.form === 'pair' ? compose('pair', Rs[0], Rs[1], seed, c.at ?? 0) : composeChain(Rs, seed);
        if (c.form !== 'on') v = verify(pl.verb, composed, seed, B);
        // מקום/קול/תמונה/תור: החוקים חייבים לעבור **על החומר** — הקלט הראשון של השרשרת (בזוג: שני העותקים), לא על פרמטר צדדי
        if (v.ok && c.form !== 'graph' && c.form !== 'on' && SHAPE_KINDS.includes(pl.material)) {
          const want = c.form === 'pair' ? composed.sig.takes.slice(0, 2).map((t) => t.name) : [composed.sig.takes[0].name];
          const on = String(v.on || '').split('+');
          if (!want.every((n) => on.includes(n))) v = { ok: false, why: 'החוקים עברו על ' + v.on + ', לא על ' + pl.material + ' (' + want.join('+') + ')' };
        }
      } catch (e) { v = { ok: false, why: 'שגיאה: ' + String(e?.message || e).slice(0, 100) }; }
      if (v.ok) return { ...c, ...v };
      tried.push({ steps: ids(c), form: c.form, ...(c.steps.length === 3 && c.form === 'chain' ? { depth: 3 } : {}), ...(v.law ? { law: v.law } : {}), why: v.why });
      return null;
    };
    // רמזי-מתכון (גרף/זוג/שרשרת) ⇒ אותו חלק על החומר ⇒ ליבה + מתאם ⇒ עומק 3
    const hinted = pl.cands.filter((c) => c.form === 'graph' || c.hint);
    const general = pl.cands.filter((c) => !(c.form === 'graph' || c.hint));
    let nOn = 0;
    for (const c of hinted) if ((found = attempt(c))) break;
    if (!found) for (const c of pl.candsOn) { nOn++; if ((found = attempt(c))) break; }
    if (!found) for (const c of general) if ((found = attempt(c))) break;
    if (!found) for (const c of pl.cands3) { n3++; if ((found = attempt(c))) break; }
    const fsteps = found ? ids(found) : null;
    results.push({
      verb: pl.verb, material: pl.material, behaviors: pl.behaviors.slice(0, 6), nBehaviors: pl.behaviors.length, candidates: pl.cands.length, ...(nOn ? { candidatesOn: nOn } : {}), candidates3: n3,
      found: found ? {
        form: found.form, depth: fsteps.length, ...(found.form === 'pair' ? { at: found.at } : {}), ...(found.form === 'on' ? { slot: found.slot, many: found.many } : {}), steps: fsteps, roles: found.roles, holds: found.holds, on: found.on, laws: found.laws, ...(found.hint ? { hint: found.hint } : {}),
        ...(found.form === 'graph' ? { graph: { inputs: found.graph.inputs, consts: found.graph.consts, nodes: found.graph.nodes, out: found.graph.out } } : {}),
      } : null,
      tried: tried.slice(0, 8),
    });
  }
  const recipes = {};
  for (const r of results.filter((x) => x.found)) {
    const id = 'combo-' + slug(r.verb) + '-' + slug(r.material);
    const ps = r.found.steps.map((s) => partByHome(ix, s));
    const v = LAW_VERBS.get(r.verb);
    const io = r.found.form === 'graph' ? { takes: v.takes.map((k) => String(k).split('|')[0]), gives: String(v.gives).split('|')[0] } : {};
    recipes[id + '.json'] = JSON.stringify({
      id, word: r.verb + ' · ' + r.material,
      // גרף: השם נושא את הפועל ואת מילות-הרמז שלו (כיוון · אזימוט…) — כך צורך עם keys של הבעלים מוצא אותו
      title: r.found.form === 'on' ? ps[0].name + ' — על ' + KIND_HE_ON[r.material] : r.found.form === 'graph' ? 'שילוב «' + v.he + '» (' + (v.cues?.he || []).join(' · ') + ', ' + (v.cues?.en || []).slice(0, 2).join(' · ') + '): ' + ps.length + ' חלקים — ' + ps[0].name + ' ⇒ … ⇒ ' + ps[ps.length - 1].name : 'שילוב: ' + ps.map((p) => p.name).join(' ⇒ '),
      combo: { verb: r.verb, material: r.material, form: r.found.form, ...(r.found.form === 'pair' ? { at: r.found.at } : {}), ...(r.found.form === 'on' ? { slot: r.found.slot, many: r.found.many } : {}), steps: r.found.steps, roles: r.found.roles, holds: r.found.holds, laws: r.found.laws, ...(r.found.hint ? { hint: r.found.hint } : {}), ...io, ...(r.found.graph ? { graph: r.found.graph } : {}) },
      needs: [{ need: 'combo', verb: r.verb, material: r.material, chain: r.found.steps }],
    }, null, 1) + '\n';
  }
  const byDepth = (d) => results.filter((r) => r.found && (d === 'graph' ? r.found.form === 'graph' : r.found.form !== 'graph' && r.found.form !== 'on' && r.found.depth === d)).length;
  const summary = { about: 'נבנה ע״י catalog/combiner/combine.mjs — לא לערוך ביד', seed: SEED, k: K, k3: K3, pairs: results.length, proven: results.filter((r) => r.found).length, depth: { on: results.filter((r) => r.found?.form === 'on').length, 2: byDepth(2), 3: byDepth(3), graph: byDepth('graph') }, results };
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
