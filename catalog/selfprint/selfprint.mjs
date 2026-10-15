#!/usr/bin/env node
/**
 * 🧭 מנוע-השרטוטים-העצמי (SELFPRINT, 15.10.2026) — הבעלים: "המנוע צריך לבנות לעצמו שרטוטים — ואני מדגיש: לבנות לעצמו."
 *
 * שני מקורות לשרטוטים, שניהם אוטומטיים (אסור: blueprints/shapes.mjs ושום שרטוט שנכתב ביד — guard.mjs חוסם קריאה וייבוא):
 *   1. **מההצלחות של עצמו** — כל דבר על המדף שקיבל שם אמיתי (חוקים + אמת + לחץ) ⇒ שרטוטים: אותו עץ, ורכיב אחד (או שניים)
 *      הוחלף בחור מאותה חתימה (lib.mjs › derive). "ממיין ⇒ קח-ראשון" = "הקטן" ⇒ "ממיין ⇒ □".
 *   2. **מהקוד שלנו** — שלדים שחוזרים בפונקציות אמיתיות (mine.mjs ⇒ library-code.json): כל אופרטור/קריאה ⇒ חור.
 * השימוש: ממלאים חורים בדברים מהמדף (דטרמיניסטי, בשכבות), בודקים (טביעה · חוקים + אמת + לחץ), ומה שהצליח
 * (א) עולה למדף, (ב) **הופך בעצמו לשרטוט חדש** (קומות של שרטוטים — שרטוט בתוך שרטוט).
 * יושר — השאר-אחד-בחוץ: שרטוט שמקורו (הדבר / כל הפונקציות שהשלד נמצא בהן) מממש את פועל-המטרה — לא נספר כגילוי שלו.
 *
 * ההשוואה (budget.json): baseline = הצמיחה של GROW3 (score) בתקציב המלא; selfprint = אותה צמיחה בחצי + השרטוטים בחצי.
 * הצמיחה רצה בתהליך-בן (grow-run.mjs, הקוד של catalog/grow כמו שהוא); השרטוטים — כאן, עם השומר.
 *
 *   node catalog/selfprint/selfprint.mjs           # ⇒ ledger.json · compare.json · blueprints.json · found.json
 *   node catalog/selfprint/selfprint.mjs --check   # הכול מחדש (גם הצמיחה, בלי מטמון) ⇒ אותם בתים
 */
import './guard.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const { makeRuntime } = await import('./runtime.mjs');
const { graphProblem, graphNodes, runGraph } = await import('../combiner/graph.mjs');
const { probePart, directCall } = await import('../lib/probe.mjs');
const { VERBS, VERB_BY_ID } = await import('../lib/verbs.mjs');
const { semOfD } = await import('../blueprints/engine.mjs');
const L = await import('../grow/lib.mjs');
const S = await import('./lib.mjs');
const { WEAK, hasTruth, truthOf } = await import('../grow/truth.mjs');

export const OUT = { control: path.join(HERE, 'control-v1.json'), ledger: path.join(HERE, 'ledger.json'), compare: path.join(HERE, 'compare.json'), blueprints: path.join(HERE, 'blueprints.json'), found: path.join(HERE, 'found.json') };
const BUD = JSON.parse(fs.readFileSync(path.join(HERE, 'budget.json'), 'utf8'));
const CODE = JSON.parse(fs.readFileSync(path.join(HERE, 'library-code.json'), 'utf8'));
/* MINER2 · ‎SELFPRINT_OUT=<תיקייה>‎ ⇒ הפלט לשם (לניסויים מחוץ לריפו) */
const CACHE = path.join(ROOT, 'node_modules/.cache/selfprint');

/* העתקים מ-catalog/grow/grow.mjs (לא מיוצאים שם) — אותה מדיניות בדיוק */
const TRY = { num: ['num'], nums: ['nums'], pt: ['pt'], pts: ['pts'], list: ['nums', 'pts'], any: L.SEMS };
const PT = { t: 'obj', n: 'Point', p: [['x', { t: 'int', lo: 0, hi: 40 }, false], ['y', { t: 'int', lo: 0, hi: 40 }, false]] };
const DESC = { num: { t: 'int', lo: -20, hi: 60 }, nums: { t: 'arr', of: { t: 'int', lo: -20, hi: 60 }, max: 8 }, pt: PT, pts: { t: 'arr', of: PT, max: 7 } };
const GENERIC = new Set(['convert', 'normalize', 'map', 'format', 'round', 'tier', 'clamp', 'ratio', 'gap', 'combine', 'offset', 'split', 'join']);
/** המדדים: פעלי-הייחוס + שני מדדי-תצוגה בלבד (חציון, מקסימום — לא משמשים לחיפוש). */
export const WATCH = ['average', 'sort', 'tour', 'extreme', 'sum', 'count', 'dedupe', 'compare'];
const EXTRA_REF = {
  median: (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; },
  max: (xs) => (xs.length ? Math.max(...xs) : null),
};
/** פעלים שמילים בשם-הפונקציה מסגירות שהיא מממשת אותם (השאר-אחד-בחוץ, לפונקציות שאינן חלק מוכח). */
const NAME_WORDS = { average: /avg|mean|average/i, sum: /sum|total/i, count: /count|len|size/i, extreme: /max|min|largest|smallest|best/i, sort: /sort|order|rank/i, compare: /compare|cmp|diff/i, tour: /tour|route|nearest|neighbo|2-?opt|twoopt|tsp|stops/i, dedupe: /dedupe|uniq/i, reverse: /reverse/i };
/** MINER2 · המשווים של המנוע (חלקי-בסיס) — המועמדים הראשונים בחור-השוואה; הם לא עולים למדף ולא נספרים. */
const CMP_FAMILY = ['<', '<=', '>', '>=', '===', '!=='];

/** אופרטורים בסיסיים (משפחה אחת לכל מידה) — לסדר-המילוי של חור-אופרטור: אחרי האופרטור המקורי, האחים שלו. */
const FAMILY = ['+', '-', '*', '/', '%', 'Math.max', 'Math.min', 'neg', 'Math.abs'];
const J = (v) => JSON.stringify(v);
const idOf = (key) => L.fnv(key) + L.fnv('~' + key);
const sigKeyOf = (t) => t.sig.join(',') + '>' + t.out;
const isSpecial = (t) => (t.names || []).some((n) => !GENERIC.has(n.verb));
const specialVerbs = (t) => (t.names || []).map((n) => n.verb).filter((v) => !GENERIC.has(v)).sort();

/* ═══════════════ הצמיחה (תהליך-בן) ═══════════════ */

function growSources() { let s = J(BUD); for (const f of ['grow.mjs', 'lib.mjs', 'runtime.mjs', 'truth.mjs']) s += fs.readFileSync(path.join(ROOT, 'catalog/grow', f), 'utf8'); return L.fnv(s); }
async function growRun(name, b, fresh) {
  fs.mkdirSync(CACHE, { recursive: true });
  const key = growSources();
  const out = path.join(CACHE, name + '-' + key + '.json');
  if (!fresh && fs.existsSync(out)) return JSON.parse(fs.readFileSync(out, 'utf8'));
  const bf = path.join(CACHE, name + '-budget.json');
  fs.writeFileSync(bf, J({ ...b, callSteps: BUD.callSteps, thingSteps: BUD.thingSteps, nameSteps: BUD.nameSteps }));
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [path.join(HERE, 'grow-run.mjs'), out], { env: { ...process.env, GROW_BUDGET: bf }, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', (d) => { err += d; if (err.length > 1e5) err = err.slice(-5e4); });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('grow-run ' + name + ' נכשל:\n' + err.slice(-2000)))));
  });
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

/* ═══════════════ העולם המשותף ═══════════════ */

let RT = null;
async function shared() {
  if (RT) return RT;
  const rt = await makeRuntime({ callSteps: BUD.callSteps });
  const samplesBySig = new Map(); const stressBySig = new Map();
  const samplesOf = (sig) => { const k = sig.join(','); if (!samplesBySig.has(k)) samplesBySig.set(k, L.samplesOf(sig)); return samplesBySig.get(k); };
  const stressOf = (sig) => { const k = sig.join(','); if (!stressBySig.has(k)) stressBySig.set(k, L.stressSamples(sig)); return stressBySig.get(k); };
  const refs = new Map();
  const addRef = (verb, sig, f) => {
    const S0 = samplesOf(sig); const outs = S0.map(f); const j = L.judge(sig, S0, outs);
    if (j.junk) return;
    const k = sig.join(',') + '>' + j.out;
    if (!refs.has(k)) refs.set(k, []);
    refs.get(k).push({ verb, outs, stress: stressOf(sig).map(f) });
  };
  for (const V of VERBS) {
    if (V.staticOnly || !V.ref || GENERIC.has(V.id)) continue;
    const decl = V.ref.sig.map((t) => semOfD(t.d));
    if (!decl.length || decl.length > 2 || decl.some((x) => !TRY[x])) continue;
    const sigs = decl.length === 1 ? TRY[decl[0]].map((x) => [x]) : TRY[decl[0]].flatMap((a) => TRY[decl[1]].map((b) => [a, b]));
    let fn; try { fn = directCall(V.ref.fn()); } catch { continue; }
    const f = (a) => { try { const r = fn(a); return 'err' in r || L.semOfValue(r.v) === null ? null : r.v; } catch { return null; } };
    for (const sig of sigs) addRef(V.id, sig, f);
  }
  const extra = new Map();
  for (const [k, fn] of Object.entries(EXTRA_REF)) { const S0 = samplesOf(['nums']); extra.set(k, { outs: S0.map(([xs]) => { const v = fn(xs); return v === null || !Number.isFinite(v) ? null : v; }), stress: stressOf(['nums']).map(([xs]) => fn(xs)) }); }
  RT = { ...rt, samplesOf, stressOf, refs, extra, nameCache: new Map(), stressCache: new Map() };
  return RT;
}
function stressOuts(R, t) {
  let o = R.stressCache.get(t.key);
  if (!o) { o = R.stressOf(t.sig).map((a) => R.runOne(t, a, BUD.thingSteps).v); R.stressCache.set(t.key, o); }
  return o;
}
/** העתק של grow.mjs › nameThing (אותה מדיניות: חוקים + אמת + לחץ). */
function nameThing(R, t) {
  if (R.nameCache.has(t.key)) return R.nameCache.get(t.key);
  let used = 0;
  class NameBudget extends Error {}
  const f = (args) => { const o = R.runOne(t, args); used += o.s; if (used > BUD.nameSteps) throw new NameBudget(); return o.v; };
  const sig = { takes: t.sig.map((x, k) => ({ name: 'ab'[k], d: DESC[x], kind: x })) };
  const sk = sigKeyOf(t);
  let res;
  try { res = probePart({ sig, call: (a) => { const v = f(a); return v === null ? { err: 'fail' } : { v }; }, seed: parseInt(L.fnv('name|' + sk), 16), B: R.B, verbs: VERBS.filter((v) => !v.staticOnly) }); }
  catch (e) { if (!(e instanceof NameBudget)) throw e; const out = { naming: 'תקציב' }; R.nameCache.set(t.key, out); return out; }
  const held = (res.verbs || []).filter((h) => /^(\d+)\/\1$/.test(h.holds) && !h.implied).map((h) => h.id);
  const names = []; const denied = [];
  const tf = (a) => R.runOne(t, a, BUD.thingSteps).v;
  for (const v of held) {
    const tr = hasTruth(v, sk) ? truthOf(v, sk, tf) : undefined;
    if (tr === undefined && WEAK.has(v)) { denied.push({ verb: v, why: 'חוקים חלשים ואין בדיקת-אמת לחתימה הזו' }); continue; }
    if (tr) { denied.push({ verb: v, why: 'עבר את החוקים, נכשל בבדיקת-האמת' }); continue; }
    if (tr === null) {
      const ts = truthOf(v, sk, tf, 0x7a17, { stress: true });
      if (ts) { denied.push({ verb: v, why: 'עבר את החוקים והאמת, נכשל בקלטי-לחץ' }); continue; }
    } else if (!GENERIC.has(v)) {
      const so = stressOuts(R, t); const ran = so.filter((x) => x !== null).length;
      if (ran * 2 < so.length) { denied.push({ verb: v, why: 'נכשל בקלטי-לחץ: לא רץ על רובם' }); continue; }
      const r = (R.refs.get(sk) || []).find((x) => x.verb === v);
      if (r && L.closeness(R.samplesOf(t.sig), t.outs, r.outs) === 1) {
        const c = L.stressCompare(R.stressOf(t.sig), so, r.stress);
        if (!c.same) { denied.push({ verb: v, why: 'זהה לייחוס בסט, שונה בקלטי-לחץ' }); continue; }
      }
    }
    names.push({ verb: v });
  }
  const out = { names, ...(denied.length ? { denied } : {}) };
  R.nameCache.set(t.key, out);
  return out;
}

/** מדידה — כמו grow.mjs › measure (כולל "מתעלם מקלט"). */
function measure(R, t) {
  const Sx = R.samplesOf(t.sig); const outs = []; let steps = 0;
  for (const a of Sx) { const o = R.runOne(t, a); outs.push(o.v); steps += o.s; if (steps > BUD.thingSteps) return { junk: 'חרג מתקציב-הצעדים' }; }
  const j = L.judge(t.sig, Sx, outs);
  if (j.junk) return j;
  if (t.sig.length === 2) for (let a = 0; a < 2; a++) {
    let n = 0; let same = 0;
    for (let k = 0; k < Sx.length; k++) {
      if (outs[k] === null) continue;
      const alt = [...Sx[k]]; alt[a] = Sx[(k + 7) % Sx.length][a];
      if (L.sameOut(alt[a], Sx[k][a])) continue;
      const o = R.runOne(t, alt).v; if (o === null) continue;
      n++; if (L.sameOut(o, outs[k])) same++;
    }
    if (n >= 6 && same === n) return { junk: 'מתעלם מקלט' };
  }
  return { ...j, steps, outs };
}

/* ═══════════════ המדף של ריצת-צמיחה ⇒ דברים ═══════════════ */

function loadShelf(R, shelfFiles) {
  const rec = new Map();
  const COLS = ['id', 'form', 'of', 'sig', 'steps', 'nodes', 'verbs', 'close', 'fp'];
  const take = (e, floor) => {
    const verbs = Array.isArray(e.verbs) ? e.verbs : e.verbs ? String(e.verbs).split(',').filter(Boolean) : [];
    const [a, o] = e.sig.split('>');
    rec.set(e.id, { id: e.id, floor, form: e.form, part: e.part, of: e.of || [], sig: a.split(','), out: o, fp: e.fp, steps: e.steps, nParts: e.nodes, names: verbs.map((v) => ({ verb: v })) });
  };
  const finalIds = new Set();
  for (const [f, text] of Object.entries(shelfFiles)) {
    const m = /^floor-(\d+)\.json$/.exec(f);
    if (!m) continue;
    const fl = Number(m[1]); const d = JSON.parse(text);
    if (Array.isArray(d)) for (const e of d) { take(e, fl); finalIds.add(e.id); }
    else for (const r of d.rows) { const e = Object.fromEntries(COLS.map((c, k) => [c, r[k]])); take(e, fl); finalIds.add(e.id); }
  }
  for (const e of JSON.parse(shelfFiles['replaced.json'])) if (!rec.has(e.id)) take(e, e.floor ?? (e.part ? 0 : 1));
  const things = new Map();
  const build = (id) => {
    if (things.has(id)) return things.get(id);
    const r = rec.get(id); if (!r) throw new Error('חסר דבר ' + id);
    const t = { ...r, key: r.form === 'part' ? 'P(' + r.part + '|' + r.sig.join(',') + ')' : r.form + '(' + r.of.join(',') + ')' };
    if (r.form === 'part') t.graph = L.partGraph(r.part, r.sig.length);
    else { const ks = r.of.map(build); const f = L.FORMS[r.form]; t.graph = f.two ? f.graph(ks[0], ks[1]) : f.graph(ks[0]); }
    things.set(id, t);
    return t;
  };
  let bad = 0;
  for (const id of [...rec.keys()].sort()) build(id);
  for (const t of things.values()) {
    const m = measure(R, t);
    if (m.junk || m.fp !== t.fp) { bad++; t.outs = m.outs || R.samplesOf(t.sig).map(() => null); continue; }
    t.outs = m.outs;
  }
  const shelf = new Map(); // fp ⇒ דבר
  for (const id of [...finalIds].sort()) { const t = things.get(id); shelf.set(t.fp, t); }
  return { things, shelf, fpMismatch: bad };
}

/* ═══════════════ השאר-אחד-בחוץ ═══════════════ */

/** פועלי-הייחוס שהדבר הזה מממש בדיוק (100% בסט). */
function exactVerbs(R, t) {
  const out = [];
  for (const r of R.refs.get(sigKeyOf(t)) || []) if (L.closeness(R.samplesOf(t.sig), t.outs, r.outs) === 1) out.push(r.verb);
  return out;
}
/** לשלד-מהקוד: לכל פונקציה-מקור — אילו פעלים היא (כנראה) מממשת: לפי מילים בשם, ואם כל החורים אופרטורים — לפי התנהגות. */
function originVerbs(R, shape, o) {
  const vs = new Set();
  for (const [v, re] of Object.entries(NAME_WORDS)) if (re.test(o.name || '')) vs.add(v);
  if (o.verb) vs.add(o.verb); // ייחוס של פועל (catalog/lib/verbs*.mjs › ref)
  if (o.labels.every((l) => S.OPS[l])) {
    for (const ty of S.typings({ graph: shape.graph }, [o.labels], () => true) || []) {
      const sk = ty.ins.join(',') + '>' + ty.out;
      const Sx = R.samplesOf(ty.ins);
      const outs = Sx.map((a) => { try { const v = S.runOpsGraph(shape.graph, o.labels, a, runGraph, graphNodes); return v === null || L.semOfValue(v) === null ? null : v; } catch { return null; } });
      for (const r of R.refs.get(sk) || []) if (L.closeness(Sx, outs, r.outs) === 1) vs.add(r.verb);
    }
  }
  return [...vs].sort();
}

/* ═══════════════ שלב 2: השרטוטים ═══════════════ */

async function selfprint({ R, things, shelf, log, shapes = CODE.shapes }) {
  const bps = []; const bpByKey = new Map();
  let nextIdx = Math.max(0, ...[...things.values()].map((t) => t.idx || 0)) + 1;
  const addBp = (bp) => {
    const graph = bp.graph || S.treeGraph(bp.tree, things);
    const key = J(graph);
    if (bpByKey.has(key)) { const o = bpByKey.get(key); o.alsoFrom = (o.alsoFrom || 0) + 1; return null; }
    const b = { id: (bp.source === 'code' ? 'bp-c-' : 'bp-s-') + L.fnv(key).slice(0, 8), ...bp, graph, key, built: 0, ran: 0, fresh: 0, successes: 0, typed: null };
    bps.push(b); bpByKey.set(key, b); return b;
  };
  /* MINER2 · המשווים של המנוע (‎< <= > >= === !==‎ ⇒ 1/0) — דברים בסיסיים שלא על המדף; רק מועמדים לחור-השוואה */
  const BASE_CMP = CMP_FAMILY.map((l) => {
    const part = '⟨cmp' + l + '⟩';
    const t = { id: 'base:' + l, key: 'B(' + l + ')', floor: 0, form: 'base', part, of: [], sig: ['num', 'num'], out: 'num', graph: L.partGraph(part, 2), nParts: 1, names: [] };
    const m = measure(R, t);
    Object.assign(t, { fp: m.fp || 'base:' + l, steps: m.steps || 0, outs: m.outs || R.samplesOf(t.sig).map(() => null) });
    things.set(t.id, t);
    return t;
  });
  /* מקור 2 — הקוד */
  for (const sh of shapes.filter((x) => x.n >= BUD.minSupport)) { // "מבנים שחוזרים" — שלד שנמצא בפונקציה אחת בלבד לא נכנס
    const per = sh.origins.map((o) => originVerbs(R, sh, o));
    const taint = (sh.taint || []).map((o) => originVerbs(R, sh, o));
    // MINER2 · השאר-אחד-בחוץ **חמור** (הבעלים: "כל פונקציה שהתנהגותה = מסלול… לא תורמת שלד לגילוי מסלול; אותו דבר לכל
    // פועל-מטרה"): פועל נחסם אם **אחד** מהמקורות מממש אותו (ב-SELFPRINT: רק אם כולם), וגם אם פונקציה טמאה (ייחוס-פועל /
    // מוצר-החלוקה) בעלת אותו שלד מממשת אותו.
    const excl = [...new Set([...per.flat(), ...taint.flat()])].sort();
    addBp({ source: 'code', by: sh.by, feats: sh.feats, origin: { code: sh.id, n: sh.n, at: sh.origins.slice(0, 3).map((o) => o.at), names: [...new Set(sh.origins.map((o) => o.name).filter(Boolean))].slice(0, 4), ...(sh.taint ? { taint: sh.taint.slice(0, 3).map((o) => o.at) } : {}) }, labels: sh.origins.map((o) => o.labels), graph: sh.graph, depth: 1, excl, perOrigin: per });
  }
  /* מקור 1 — ההצלחות של הצמיחה */
  /* חידוש: הצלחה הופכת לשרטוט רק אם היא ידע חדש — אחד הפעלים המיוחדים שלה עוד לא הוליד novelty שרטוטים-מהצלחה.
     (בהרצה הראשונה "משווה" — שם זול — הוליד מאות שרטוטים כמעט זהים, והתקציב התפזר עליהם.) */
  const bornBy = new Map();
  const novel = (t) => specialVerbs(t).some((v) => (bornBy.get(v) || 0) < BUD.novelty);
  const fromSuccess = (t, parent) => {
    if (!novel(t)) return 0;
    for (const v of specialVerbs(t)) bornBy.set(v, (bornBy.get(v) || 0) + 1);
    const excl = [...new Set([...(parent?.excl || []), ...specialVerbs(t), ...exactVerbs(R, t)])].sort();
    let n = 0;
    for (const d of S.derive(t, things, { depth: 2, maxHoles: 1 })) {
      const b = addBp({ source: parent ? 'success-of-blueprint' : 'success', origin: { thing: t.id, verbs: specialVerbs(t), ...(parent ? { blueprint: parent.id } : {}) }, tree: d.tree, holed: d.holed, depth: (parent?.depth || 0) + 1, excl, labels: null });
      if (b) n++;
    }
    return n;
  };
  const grown = [...shelf.values()].filter((t) => t.floor > 0 && isSpecial(t)).sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const t of grown) fromSuccess(t, null);
  log(`שרטוטים: ${bps.filter((b) => b.source === 'code').length} מהקוד · ${bps.filter((b) => b.source === 'success').length} מ-${grown.length} הצלחות של הצמיחה`);

  const rounds = []; const replacements = [];
  const builtKeys = new Set();
  for (let rd = 1; rd <= BUD.rounds; rd++) {
    const F = { round: rd, blueprints: bps.length, built: 0, new: 0, replaced: 0, dup: 0, junk: {}, typingsTried: 0 };
    /* מאגרים לפי חתימה (מהמדף הנוכחי): קודם עם-שם-מיוחד, אחר-כך הכי פשוט (צעדים) */
    const bySig = new Map();
    for (const t of shelf.values()) { const k = sigKeyOf(t); if (!bySig.has(k)) bySig.set(k, []); bySig.get(k).push(t); }
    const ord = (a, b) => (isSpecial(b) - isSpecial(a)) || a.steps - b.steps || a.nParts - b.nParts || (a.id < b.id ? -1 : 1);
    for (const l of bySig.values()) l.sort(ord);
    const opCache = new Map(); const opLike = new Set();
    const poolOf = (sk, label) => {
      const base = CMP_FAMILY.includes(label) && sk === 'num,num>num' ? [...BASE_CMP, ...(bySig.get(sk) || [])] : bySig.get(sk) || [];
      const f = label && S.OPS[label];
      if (!f) return base.slice(0, BUD.poolCap);
      const ck = sk + '|' + label;
      if (!opCache.has(ck)) {
        const [a] = sk.split('>'); const Sx = R.samplesOf(a.split(','));
        const want = Sx.map((args) => { const v = f(...args); return Number.isFinite(v) ? v : null; });
        const like = (g) => { const w = Sx.map((args) => { const v = g(...args); return Number.isFinite(v) ? v : null; }); return base.filter((t) => Sx.every((x, k) => w[k] === null || L.sameOut(t.outs[k], w[k]))); };
        // קודם מה שמתנהג כמו האופרטור שהיה שם בקוד; אחריו "אחיו" — שאר האופרטורים הבסיסיים מאותה מידה (סדר קבוע)
        const hit = like(f);
        const sib = (CMP_FAMILY.includes(label) ? CMP_FAMILY : FAMILY).filter((o) => o !== label && S.OPS[o].length === f.length).flatMap((o) => like(S.OPS[o]));
        const seen = new Set(); const ordered = [...hit, ...sib, ...base].filter((t) => !seen.has(t.id) && seen.add(t.id));
        const pool = ordered.slice(0, BUD.poolCap);
        for (const t of [...hit, ...sib]) opLike.add(sk + '|' + t.id);
        opCache.set(ck, pool);
      }
      return opCache.get(ck);
    };
    /* מחוללים: לכל שרטוט חי ולכל סוג (עד BUD.typings, קודם הסוגים שבחורים שלהם יש דברים עם שם מיוחד) — מילויים בשכבות */
    const gens = [];
    for (const b of bps) {
      if (b.built >= 8 && L.yieldOf(b) < 0.1) continue; // שרטוט שנותן רק כפולים/זבל — יוצא
      if (b.source === 'code') {
        const tys = S.typings({ graph: b.graph }, b.labels, (sk) => bySig.has(sk) || sk === 'num,num>num') || [];
        if (b.typed === null) b.typed = tys.length;
        const lab = (v) => { const ls = b.labels.map((x) => x[v]); return ls.every((l) => l === ls[0]) ? ls[0] : null; };
        const scored = tys.map((ty) => ({ ty, sp: ty.holes.reduce((a, h, v) => a + ((bySig.get(S.sigKey(h.sig, h.out)) || []).some(isSpecial) ? 1 : 0), 0) })).sort((x, y) => y.sp - x.sp || (x.ty.key < y.ty.key ? -1 : 1)).slice(0, BUD.typings);
        F.typingsTried += scored.length;
        for (const { ty } of scored) {
          const pools = ty.holes.map((h, v) => poolOf(S.sigKey(h.sig, h.out), lab(v)));
          const und = (v) => (t) => isSpecial(t) || opLike.has(S.sigKey(ty.holes[v].sig, ty.holes[v].out) + '|' + t.id);
          gens.push({ b, ty, it: S.conceptsFirst(pools.map((p, v) => p.map((t) => ({ t, v }))), (x) => und(x.v)(x.t), (c) => new Set(c.map((x) => x.t.fp)).size === c.length), unwrap: true, take: 1 + Math.floor(Math.log2(b.origin.n)) });
        }
      } else {
        const hs = S.treeHoles(b.tree);
        const pools = hs.map((h) => (bySig.get(S.sigKey(h.sig, h.out)) || []).filter((t) => !b.holed.includes(t.id)).slice(0, BUD.poolCap));
        gens.push({ b, ty: { holes: hs, ins: b.tree.sig, out: b.tree.out }, it: S.conceptsFirst(pools, isSpecial, (c) => new Set(c.map((t) => t.fp)).size === c.length), take: 1 });
      }
    }
    const jobs = []; const done = gens.map(() => false);
    while (jobs.length < BUD.perRound && done.some((d) => !d)) {
      for (let i = 0; i < gens.length && jobs.length < BUD.perRound; i++) {
        if (done[i]) continue;
        for (let k = 0; k < gens[i].take && jobs.length < BUD.perRound; ) {
          const n = gens[i].it.next();
          if (n.done) { done[i] = true; break; }
          const g = gens[i]; const fill = g.unwrap ? n.value.map((x) => x.t) : n.value;
          const key = g.b.id + '(' + fill.map((t) => t.id).join(',') + ')';
          if (builtKeys.has(key)) continue;
          builtKeys.add(key); jobs.push({ g, fill, key }); k++;
        }
      }
    }
    const fresh = [];
    for (const { g, fill, key } of jobs) {
      const b = g.b; b.built++; F.built++;
      let graph; let tree;
      if (b.source === 'code') { tree = { k: 'skel', graph: b.graph, kids: fill.map((t) => ({ k: 'ref', id: t.id, sig: t.sig, out: t.out })), sig: g.ty.ins, out: g.ty.out, bp: b.id }; }
      else { tree = { ...S.fillTree(b.tree, fill.map((t) => ({ k: 'ref', id: t.id, sig: t.sig, out: t.out }))), bp: b.id }; }
      try { graph = S.treeGraph(tree, things); } catch (e) { F.junk['חיווט: ' + String(e.message).slice(0, 30)] = (F.junk['חיווט: ' + String(e.message).slice(0, 30)] || 0) + 1; continue; }
      const prob = graphProblem(graph);
      if (prob) { const k = 'חיווט: ' + prob.split(':')[0]; F.junk[k] = (F.junk[k] || 0) + 1; continue; }
      const sig = tree.sig || g.ty.ins;
      const t = { key, id: idOf(key), floor: 'bp' + rd, round: rd, form: 'bp', bp: b.id, fill: fill.map((x) => x.id), keep: b.source === 'code' ? [] : S.concrete(b.tree), of: [...fill.map((x) => x.id), ...(b.source === 'code' ? [] : S.concrete(b.tree))], sig, graph, tree, nParts: graphNodes(graph).length };
      let m;
      try { m = measure(R, t); } catch (e) { m = { junk: 'חיווט: ' + String(e?.message || e).slice(0, 30) }; } // MINER2: חוט שהגרף לא מבין — זבל, לא קריסה
      if (m.junk) { F.junk[m.junk] = (F.junk[m.junk] || 0) + 1; continue; }
      b.ran++;
      Object.assign(t, { out: m.out, fp: m.fp, steps: m.steps, outs: m.outs, ex: exampleOf(R.samplesOf(sig), m.outs) });
      if (t.out !== (tree.out || g.ty.out)) { F.junk['פלט בסוג אחר'] = (F.junk['פלט בסוג אחר'] || 0) + 1; continue; }
      const cur = shelf.get(t.fp);
      if (!cur) { t.idx = nextIdx++; shelf.set(t.fp, t); things.set(t.id, t); fresh.push(t); F.new++; b.fresh++; continue; }
      if (L.better(t, cur) < 0) {
        const c = L.stressCompare(R.stressOf(t.sig), stressOuts(R, t), stressOuts(R, cur));
        if (!c.same) { F.stressRejected = (F.stressRejected || 0) + 1; continue; }
        // גם 200 קלטים אקראיים (בהרצה הראשונה "שיפור" אחד עבר את הלחץ ונפל כאן — עכשיו נבדק לפני ההחלפה)
        if (L.extraSamples(t.sig).some((a) => !L.sameOut(R.runOne(t, a).v, R.runOne(cur, a).v))) { F.extraRejected = (F.extraRejected || 0) + 1; continue; }
        t.idx = nextIdx++; shelf.set(t.fp, t); things.set(t.id, t); fresh.push(t); F.replaced++; b.fresh++;
        replacements.push({ round: rd, fp: t.fp, sig: sigKeyOf(t), old: { id: cur.id, floor: cur.floor, steps: cur.steps, part: cur.part }, now: { id: t.id, bp: b.id, steps: t.steps } });
        continue;
      }
      F.dup++;
    }
    /* המתאר — לכל מה שעלה למדף בסבב */
    for (const t of fresh) Object.assign(t, nameThing(R, t));
    const succ = fresh.filter((t) => shelf.get(t.fp) === t && isSpecial(t));
    F.named = succ.length;
    /* הצלחה ⇒ שרטוט חדש (שרטוט בתוך שרטוט) */
    let born = 0;
    for (const t of succ) { const b = bps.find((x) => x.id === t.bp); b.successes++; if (rd < BUD.rounds) born += fromSuccess(t, b); else F.lastRoundSuccess = (F.lastRoundSuccess || 0) + 1; }
    F.bornBlueprints = born;
    rounds.push(F);
    log(`סבב ${rd}: ${F.built} נבנו · ${F.new} חדשים · ${F.replaced} החליפו · ${F.dup} כפולים · ${Object.values(F.junk).reduce((a, x) => a + x, 0)} זבל · ${F.named} קיבלו שם מיוחד ⇒ ${born} שרטוטים חדשים (סה״כ ${bps.length})`);
  }
  return { bps, rounds, replacements };
}

function exampleOf(Sx, outs) {
  let k = Sx.findIndex((a, i) => outs[i] !== null && a.every((x) => !Array.isArray(x) || x.length >= 3));
  if (k < 0) k = outs.findIndex((o) => o !== null);
  return { in: show(Sx[k]), out: show(outs[k]) };
}
function show(v) {
  if (typeof v === 'number') { const r = Number(Number(v.toPrecision(6)).toFixed(6)); return Object.is(r, -0) ? 0 : r; }
  if (Array.isArray(v)) return v.map(show);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, show(v[k])]));
  return v;
}

/* ═══════════════ המדדים — אותה הגדרה לשתי הריצות ═══════════════ */

function metricsOf(R, things, shelf, bpById = new Map()) {
  const final = [...shelf.values()];
  const grown = (t) => t.floor !== 0;
  const kids = (t) => (t.of || []).map((id) => things.get(id)).filter(Boolean);
  const exactTo = (t, v) => (R.refs.get(sigKeyOf(t)) || []).some((r) => r.verb === v && L.closeness(R.samplesOf(t.sig), t.outs, r.outs) === 1);
  const desc = (t, acc = new Set()) => { for (const c of kids(t)) if (!acc.has(c.id)) { acc.add(c.id); desc(c, acc); } return acc; };
  const exclChain = (t) => { const out = new Set(); const b = t.bp && bpById.get(t.bp); if (b) for (const v of b.excl) out.add(v); return out; };
  const exact = {};
  for (const t of final) {
    if (!grown(t)) continue;
    for (const r of R.refs.get(sigKeyOf(t)) || []) {
      if (GENERIC.has(r.verb) || L.closeness(R.samplesOf(t.sig), t.outs, r.outs) !== 1) continue;
      if (!L.stressCompare(R.stressOf(t.sig), stressOuts(R, t), r.stress).same) continue;
      const e = (exact[r.verb] ||= { exact: 0, fromOthers: 0, byBlueprint: 0, byBlueprintFair: 0, best: null });
      e.exact++;
      if ([...desc(t)].some((id) => exactTo(things.get(id), r.verb))) continue;
      e.fromOthers++;
      if (t.bp) { e.byBlueprint++; if (!exclChain(t).has(r.verb)) e.byBlueprintFair++; }
      const rank = (x) => (x.bp && !exclChain(x).has(r.verb) ? 0 : 1);
      if (!e.best || rank(t) < rank(e.best) || (rank(t) === rank(e.best) && L.better(t, e.best) < 0)) e.best = t;
    }
  }
  const brief = (t) => ({ id: t.id, floor: t.floor, form: t.form, ...(t.bp ? { blueprint: t.bp } : {}), sig: sigKeyOf(t), steps: t.steps, nodes: t.nParts, example: t.ex || null, of: kids(t).map((c) => ({ id: c.id, form: c.form, ...(c.part ? { part: c.part } : {}), verbs: specialVerbs(c) })) });
  for (const e of Object.values(exact)) e.best = e.best ? brief(e.best) : null; // MINER2: פועל שנבנה רק "מחלק שכבר היה הוא" — אין "הכי טוב"
  const closeBest = (outsRef, sk) => { let b = null; for (const t of final) { if (!grown(t) || sigKeyOf(t) !== sk) continue; const c = L.closeness(R.samplesOf(t.sig), t.outs, outsRef); if (!b || c > b.c || (c === b.c && (t.idx ?? 0) < (b.t.idx ?? 0))) b = { c, t }; } return b; };
  const bestGrown = {};
  for (const v of WATCH) {
    let b = null;
    for (const [sk, rs] of R.refs) for (const r of rs) if (r.verb === v) { const x = closeBest(r.outs, sk); if (x && (!b || x.c > b.c)) b = { ...x, sk }; }
    bestGrown[v] = b ? { pct: Math.round(100 * b.c), id: b.t.id, ...(b.t.bp ? { blueprint: b.t.bp } : { form: b.t.form }), sig: b.sk } : { pct: null };
  }
  for (const [k, x] of R.extra) { const b = closeBest(x.outs, 'nums>num'); bestGrown[k] = b ? { pct: Math.round(100 * b.c), id: b.t.id, ...(b.t.bp ? { blueprint: b.t.bp } : { form: b.t.form }), sig: 'nums>num', metricOnly: true } : { pct: null }; }
  return {
    shelf: final.length,
    namedSpecial: final.filter(isSpecial).length,
    namedSpecialGrown: final.filter((t) => grown(t) && isSpecial(t)).length,
    specialBy: countBy(final.filter(grown).flatMap(specialVerbs)),
    exactRebuilt: Object.fromEntries(Object.keys(exact).sort().map((k) => [k, exact[k]])),
    exactFromOthers: Object.values(exact).filter((e) => e.fromOthers).length,
    exactByBlueprintFair: Object.values(exact).filter((e) => e.byBlueprintFair).length,
    bestGrown,
  };
}
function countBy(xs) { const o = {}; for (const k of xs) o[k] = (o[k] || 0) + 1; return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))); }

/** שיפורים שגויים: דבר-משרטוט שהחליף דבר קיים ⇒ חייב להיות זהה גם על 200 קלטים אקראיים. */
function wrongImprovements(R, things, replacements) {
  let wrong = 0;
  for (const r of replacements) {
    const t = things.get(r.now.id); const o = things.get(r.old.id);
    for (const a of L.extraSamples(t.sig)) if (!L.sameOut(R.runOne(t, a).v, R.runOne(o, a).v)) { wrong++; r.wrong = true; break; }
  }
  return wrong;
}

/* ═══════════════ הריצה ═══════════════ */

export async function run({ log = () => {}, fresh = false } = {}) {
  const [base, half] = await Promise.all([growRun('baseline', BUD.baseline, fresh), growRun('half', BUD.half, fresh)]);
  log('הצמיחה: baseline + half מוכנים');
  const R = await shared();
  const B0 = loadShelf(R, base.shelfFiles);
  const H0 = loadShelf(R, half.shelfFiles);
  log(`מדפים: baseline ${B0.shelf.size} (טביעה שונה בטעינה: ${B0.fpMismatch}) · half ${H0.shelf.size} (${H0.fpMismatch})`);
  const { bps, rounds, replacements } = await selfprint({ R, things: H0.things, shelf: H0.shelf, log });
  const bpById = new Map(bps.map((b) => [b.id, b]));
  const mBase = metricsOf(R, B0.things, B0.shelf);
  const mSelf = metricsOf(R, H0.things, H0.shelf, bpById);
  const wrong = wrongImprovements(R, H0.things, replacements);
  const builtTotal = { baseline: base.metrics.built, selfprint: half.metrics.built + rounds.reduce((a, F) => a + F.built, 0) };
  const bpOut = bps.map((b) => ({ id: b.id, source: b.source, ...(b.by ? { by: b.by, feats: b.feats, typed: b.typed } : {}), depth: b.depth, origin: b.origin, ...(b.alsoFrom ? { alsoFrom: b.alsoFrom } : {}), holes: S.holeVars(b.graph).length, excl: b.excl, built: b.built, ran: b.ran, fresh: b.fresh, successes: b.successes, graph: b.graph }));
  const birthed = bps.filter((b) => b.successes);
  /* MINER2 · השלדים מהקוד: כמה נכנסו (≥minSupport), כמה מקבלים סוג, כמה נבנו, כמה רצו (נמדד, לא זבל), כמה הביאו חדש/שם */
  const codeStats = (xs) => ({ blueprints: xs.length, typed: xs.filter((b) => b.typed).length, built: xs.filter((b) => b.built).length, ran: xs.filter((b) => b.ran).length, fresh: xs.filter((b) => b.fresh).length, success: xs.filter((b) => b.successes).length });
  const codeBps = bps.filter((b) => b.source === 'code');
  const codeSummary = { all: codeStats(codeBps), v1: codeStats(codeBps.filter((b) => b.by.includes('v1'))), v2Only: codeStats(codeBps.filter((b) => !b.by.includes('v1'))), byFeat: Object.fromEntries([...new Set(codeBps.flatMap((b) => b.feats))].sort().map((f) => [f, codeStats(codeBps.filter((b) => b.feats.includes(f)))])) };
  const blueprintsSummary = {
    total: bps.length,
    bySource: countBy(bps.map((b) => b.source)),
    used: bps.filter((b) => b.built).length,
    birthedSuccess: birthed.length,
    birthedBySource: countBy(birthed.map((b) => b.source)),
    maxDepth: Math.max(...bps.map((b) => b.depth)),
    maxDepthUsed: Math.max(0, ...bps.filter((b) => b.built).map((b) => b.depth)),
    maxDepthSuccess: Math.max(0, ...birthed.map((b) => b.depth)),
    code: codeSummary,
  };
  const fromBp = [...H0.shelf.values()].filter((t) => t.bp);
  const found = fromBp.filter(isSpecial).sort((a, b) => a.round - b.round || (a.idx ?? 0) - (b.idx ?? 0)).map((t) => {
    const b = bpById.get(t.bp);
    return { id: t.id, round: t.round, verbs: specialVerbs(t), sig: sigKeyOf(t), steps: t.steps, nodes: t.nParts, example: t.ex, blueprint: { id: b.id, source: b.source, depth: b.depth, origin: b.origin, excl: b.excl }, fill: t.fill.map((id) => { const c = H0.things.get(id); return { id, form: c.form, ...(c.part ? { part: c.part } : {}), verbs: specialVerbs(c), example: c.ex || null }; }), excludedByLeaveOneOut: specialVerbs(t).filter((v) => b.excl.includes(v)) };
  });
  const compare = {
    about: 'SELFPRINT — אותו תקציב-חיבורים: baseline = צמיחת GROW3 (score) ב-budget.baseline; selfprint = אותה צמיחה ב-budget.half + השרטוטים-העצמיים (rounds × perRound). המדדים — אותה הגדרה לשתיהן (selfprint.mjs › metricsOf). נבנה ע״י selfprint.mjs — לא לערוך ביד',
    budget: BUD, built: builtTotal,
    baseline: mBase, selfprint: mSelf,
    blueprints: blueprintsSummary,
    wrongImprovements: wrong, replacements: replacements.length,
    fpMismatchOnLoad: { baseline: B0.fpMismatch, half: H0.fpMismatch },
  };
  const ledger = { about: 'הפנקס של מנוע-השרטוטים-העצמי — סבבים, שרטוטים, החלפות. נבנה ע״י selfprint.mjs', rounds, blueprints: blueprintsSummary, replacements, growMetrics: { baseline: pick(base.metrics), half: pick(half.metrics) } };
  /* MINER2 · ביקורת (נכתבת לריפו, נבדקת ב---check): אותו מנוע, אותו תקציב, אותה צמיחה — רק עם השלדים שהכורה הראשון
     (SELFPRINT) קרא. מפריד בין "המנוע השתנה" לבין "הספרייה גדלה והתקציב התפזר". */
  const H1 = loadShelf(R, half.shelfFiles);
  const ctl = await selfprint({ R, things: H1.things, shelf: H1.shelf, log: (x) => log('ביקורת-v1 · ' + x), shapes: CODE.shapes.filter((x) => x.by.includes('v1')) });
  const ctlById = new Map(ctl.bps.map((b) => [b.id, b]));
  const ctlFound = [...H1.shelf.values()].filter((t) => t.bp && isSpecial(t)).sort((a, b) => a.round - b.round || (a.idx ?? 0) - (b.idx ?? 0)).map((t) => {
    const b = ctlById.get(t.bp);
    return { id: t.id, round: t.round, verbs: specialVerbs(t), sig: sigKeyOf(t), example: t.ex, blueprint: { id: b.id, source: b.source, origin: b.origin, excl: b.excl }, fill: t.fill.map((id) => { const c = H1.things.get(id); return { id, form: c.form, ...(c.part ? { part: c.part } : {}), verbs: specialVerbs(c) }; }), excludedByLeaveOneOut: specialVerbs(t).filter((v) => b.excl.includes(v)) };
  });
  const control = { about: 'MINER2 · ביקורת: אותו מנוע ואותו תקציב, רק השלדים של הכורה הראשון (by ∋ v1). נבנה ע״י selfprint.mjs — לא לערוך ביד', codeBlueprints: ctl.bps.filter((b) => b.source === 'code').length, selfprint: metricsOf(R, H1.things, H1.shelf, ctlById), wrongImprovements: wrongImprovements(R, H1.things, ctl.replacements), found: ctlFound.filter((x) => x.blueprint.source === 'code') };
  return {
    control: JSON.stringify(control, null, 1) + '\n',
    ledger: J(ledger) && JSON.stringify(ledger, null, 1) + '\n',
    compare: JSON.stringify(compare, null, 1) + '\n',
    blueprints: '[\n' + bpOut.map(J).join(',\n') + '\n]\n',
    found: '[\n' + found.map(J).join(',\n') + '\n]\n',
  };
}
const pick = (m) => ({ built: m.built, shelf: m.shelf, namedSpecialGrown: m.namedSpecialGrown, exactFromOthers: m.exactFromOthers });

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  const check = process.argv.includes('--check');
  const res = await run({ fresh: check, log: (s) => console.log(s + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's') });
  if (check) {
    const stale = Object.entries(OUT).filter(([k, p]) => !fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== res[k]).map(([k]) => k);
    if (stale.length) { console.error('catalog/selfprint: לא זהה להרצה חוזרת: ' + stale.join(', ')); process.exit(1); }
    console.log('✓ catalog/selfprint: הרצה חוזרת (גם הצמיחה, בלי מטמון) ⇒ אותם בתים'); process.exit(0);
  }
  for (const [k, p] of Object.entries(OUT)) fs.writeFileSync(process.env.SELFPRINT_OUT ? path.join(process.env.SELFPRINT_OUT, path.basename(p)) : p, res[k]);
  console.log('🧭 נכתב · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
