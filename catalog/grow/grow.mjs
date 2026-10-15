#!/usr/bin/env node
/**
 * 🌱 מנוע-הצמיחה (GROW, 15.10.2026) — בלי בקשה ובלי מטרה. הרעיון של הבעלים:
 *   "הוא מתחיל לבנות: חיבור א עם ב — יצא ג. הוא רושם ג. הוא הולך ומחפש: יש ג יותר טוב או לא? אם אין — הוא רושם אותו.
 *    אם יש — הוא בודק איזה מהם יותר טוב, וממשיך לבנות מעליו."
 *
 * GROW2 (15.10.2026) — ארבעה תיקונים אחרי אימות-המנהל ("הוא לא יודע מה מועיל ובוחר באקראי"):
 *   1. ניקוד-תועלת לכל דבר על המדף: שם מיוחד (חוקים + אמת + לחץ) ⇒ 2 · קרבה לפעלים (lib.mjs › closeness — אחוז
 *      הקלטים שבהם הפלט = פלט מימוש-הייחוס באותה חתימה) ⇒ 0..1, "כמעט" = המדרון · זבל ⇒ לא על המדף בכלל.
 *      נקודת-זכות עוברת למרכיבים של דבר שקיבל שם (ישיר 1.2, נכד 0.9).
 *      זול: הקרבה מחושבת מהפלטים שכבר יש בטביעה; החוקים המלאים (probePart) רק למועמדים הטובים (קרבה ≥ NAME_AT).
 *   2. בחירה לפי ניקוד: GUIDED מהתקציב של כל קומה לחיבורים שאחד מהם בין ה-TOP הטובים (הטובים קודם, סבב-סבבים
 *      לפי ניקוד — lib.mjs › pickGuided), והשאר אקראי כמו קודם. דטרמיניסטי.
 *   3. זבל לפני המדף: "רשימה של פריט אחד שחוזר" (lib.mjs › judge) — לא נכנס ולא בונים עליו.
 *   4. בדיקת-לחץ (lib.mjs › stressSamples: רשימות 40–500, מספרים עד 10^15, שליליים, כפולים): שיפור מחליף רק אם
 *      זהה גם שם; שם ניתן רק אם האמת עוברת גם בלחץ (או, בלי אמת, אם הדבר רץ בלחץ וזהה לייחוס כשהוא זהה לו בסט).
 * ההרצה = שתי ריצות באותו תקציב: "random" (הבחירה של GROW) ו-"score" (החדשה) ⇒ compare.json; המדף והפנקס = score.
 *
 * קומה 0 — החלקים המוכחים שרצים כאן ⇒ טביעת-התנהגות על סט-קלטים קבוע. אותה טביעה = אותו "דבר" ⇒ נשאר רק הטוב.
 * קומה k — מחברים מהמדף בצורות-חיווט בלבד (chain/pair/map/mapc/fold/fix — combiner/graph.mjs).
 * מתאר — חוקי כל הפעלים (probePart) + בדיקת-אמת (truth.mjs) + לחץ ⇒ שם.
 *
 * עיוור כמו מנוע-השרטוטים: אותו שומר-קריאה (מתכוני-יד / combo / found לא נקראים). בלי שעון בפנקס.
 *
 *   node catalog/grow/grow.mjs            # כותב ledger.json + compare.json + shelf/
 *   node catalog/grow/grow.mjs --check    # מריץ שוב ומשווה בית-בבית (יציאה 1 אם שונה)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { makeRuntime } = await import('./runtime.mjs');
const { provenAs } = await import('../combiner/core.mjs');
const { graphProblem, graphNodes } = await import('../combiner/graph.mjs');
const { callerFor, resetBudget } = await import('../lib/sandbox.mjs');
const { probePart, directCall } = await import('../lib/probe.mjs');
const { VERBS, VERB_BY_ID } = await import('../lib/verbs.mjs');
const { semOfD } = await import('../blueprints/engine.mjs');
const L = await import('./lib.mjs');
const { WEAK, hasTruth, truthOf } = await import('./truth.mjs');

export const LEDGER = path.join(HERE, 'ledger.json');
export const COMPARE = path.join(HERE, 'compare.json');
export const SHELF = path.join(HERE, 'shelf');
const BUD = JSON.parse(fs.readFileSync(path.join(HERE, 'budget.json'), 'utf8'));

/** סוג מוצהר של קלט-חלק ⇒ הסוגים בעולם שננסה. */
const TRY = { num: ['num'], nums: ['nums'], pt: ['pt'], pts: ['pts'], list: ['nums', 'pts'], any: L.SEMS };
/** תיאור-קלט (לחוקי-הפעלים של הקורא) לכל סוג. */
const PT = { t: 'obj', n: 'Point', p: [['x', { t: 'int', lo: 0, hi: 40 }, false], ['y', { t: 'int', lo: 0, hi: 40 }, false]] };
const DESC = { num: { t: 'int', lo: -20, hi: 60 }, nums: { t: 'arr', of: { t: 'int', lo: -20, hi: 60 }, max: 8 }, pt: PT, pts: { t: 'arr', of: PT, max: 7 } };
/** פעלים "גדולים" — להשוואה בסוף (גילויים בלי שביקשו). */
const BIG = ['tour', 'allot', 'schedule', 'shortest-path', 'spread', 'sun-heading', 'sort', 'reverse', 'dedupe', 'sum', 'average', 'extreme', 'count', 'compare', 'next'];
/** הפעלים שמדדי GROW2 עוקבים אחריהם (ההתאמה הכי קרובה). */
export const WATCH = ['sort', 'extreme', 'count', 'dedupe', 'sum', 'average', 'tour', 'compare'];
export const GENERIC = new Set(['convert', 'normalize', 'map', 'format', 'round', 'tier', 'clamp', 'ratio', 'gap', 'combine', 'offset', 'split', 'join']);
/** ניקוד: שם מיוחד · זכות למרכיב ישיר / לנכד · "טוב" = לפחות זה · לבדוק חוקים מלאים מקרבה זו. */
export const SCORE = { named: 2, creditChild: 1.2, creditGrand: 0.9, good: 0.5, nameAt: 0.5, top: 40, guided: 0.8, nameCap: 150 };

const J = (v) => JSON.stringify(v);
const idOf = (key) => L.fnv(key) + L.fnv('~' + key);
const sigKeyOf = (t) => t.sig.join(',') + '>' + t.out;

let RT = null;
/** זמן-הריצה + מה שמשותף לשתי הריצות (נטען פעם אחת). */
async function shared() {
  if (RT) return RT;
  const rt = await makeRuntime({ callSteps: BUD.callSteps });
  const samplesBySig = new Map();
  const samplesOf = (sig) => { const k = sig.join(','); if (!samplesBySig.has(k)) samplesBySig.set(k, L.samplesOf(sig)); return samplesBySig.get(k); };
  const stressBySig = new Map();
  const stressOf = (sig) => { const k = sig.join(','); if (!stressBySig.has(k)) stressBySig.set(k, L.stressSamples(sig)); return stressBySig.get(k); };
  /* הייחוסים: לכל פועל שרץ בעולם — לכל חתימה שלו: פלטי-הייחוס על סט-הטביעה ועל קלטי-הלחץ */
  const refs = new Map(); // sigKey ⇒ [{verb, outs, stress}]
  const refFn = new Map();
  for (const V of VERBS) {
    if (V.staticOnly || !V.ref || GENERIC.has(V.id)) continue;
    const decl = V.ref.sig.map((t) => semOfD(t.d));
    if (!decl.length || decl.length > 2 || decl.some((x) => !TRY[x])) continue;
    const sigs = decl.length === 1 ? TRY[decl[0]].map((x) => [x]) : TRY[decl[0]].flatMap((a) => TRY[decl[1]].map((b) => [a, b]));
    let fn;
    try { fn = directCall(V.ref.fn()); } catch { continue; }
    const f = (a) => { try { const r = fn(a); return 'err' in r || L.semOfValue(r.v) === null ? null : r.v; } catch { return null; } };
    for (const sig of sigs) {
      const S = samplesOf(sig); const outs = S.map(f);
      const j = L.judge(sig, S, outs);
      if (j.junk) continue;
      const k = sig.join(',') + '>' + j.out;
      if (!refs.has(k)) refs.set(k, []);
      refs.get(k).push({ verb: V.id, outs, stress: stressOf(sig).map(f) });
      refFn.set(V.id + '|' + k, f);
    }
  }
  RT = { ...rt, samplesOf, stressOf, refs, refFn, nameCache: new Map(), stressCache: new Map() };
  return RT;
}

/** הקרבה הכי גדולה של דבר לפועל-ייחוס באותה חתימה: {verb, c} או null. */
function closest(R, t, outs) {
  let best = null;
  for (const r of R.refs.get(sigKeyOf(t)) || []) {
    const c = L.closeness(R.samplesOf(t.sig), outs, r.outs);
    if (!best || c > best.c || (c === best.c && r.verb < best.verb)) best = { verb: r.verb, c };
  }
  return best;
}
/** הפלטים של דבר על קלטי-הלחץ (מטמון לפי מפתח). */
function stressOuts(R, t) {
  let o = R.stressCache.get(t.key);
  if (!o) { o = R.stressOf(t.sig).map((a) => R.runOne(t, a, BUD.thingSteps).v); R.stressCache.set(t.key, o); }
  return o;
}

/**
 * המתאר של דבר אחד: חוקי כל הפעלים + אמת + לחץ ⇒ {names, denied} (או {naming:'תקציב'}). מטמון לפי המפתח (אותו
 * מפתח = אותו גרף ⇒ אותה תשובה) — משותף לשתי הריצות.
 */
function nameThing(R, t) {
  if (R.nameCache.has(t.key)) return R.nameCache.get(t.key);
  let used = 0;
  class NameBudget extends Error {}
  const f = (args) => { const o = R.runOne(t, args); used += o.s; if (used > BUD.nameSteps) throw new NameBudget(); return o.v; };
  const sig = { takes: t.sig.map((x, k) => ({ name: 'ab'[k], d: DESC[x], kind: x })) };
  const sk = sigKeyOf(t);
  let res;
  const verbs = VERBS.filter((v) => !v.staticOnly);
  try { res = probePart({ sig, call: (a) => { const v = f(a); return v === null ? { err: 'fail' } : { v }; }, seed: parseInt(L.fnv('name|' + sk), 16), B: R.B, verbs }); }
  catch (e) { if (!(e instanceof NameBudget)) throw e; const out = { naming: 'תקציב' }; R.nameCache.set(t.key, out); return out; }
  const held = (res.verbs || []).filter((h) => /^(\d+)\/\1$/.test(h.holds) && !h.implied).map((h) => h.id);
  const names = []; const denied = [];
  const tf = (a) => R.runOne(t, a, BUD.thingSteps).v;
  for (const v of held) {
    const tr = hasTruth(v, sk) ? truthOf(v, sk, tf) : undefined;
    if (tr === undefined && WEAK.has(v)) { denied.push({ verb: v, why: 'חוקים חלשים ואין בדיקת-אמת לחתימה הזו' }); continue; }
    if (tr) { denied.push({ verb: v, why: 'עבר את החוקים, נכשל בבדיקת-האמת', example: tr }); continue; }
    // GROW2 · לחץ: אמת ⇒ גם בלחץ; בלי אמת ⇒ הדבר רץ בלחץ, וכשהוא זהה לייחוס בסט — זהה לו גם בלחץ
    if (tr === null) {
      const ts = truthOf(v, sk, tf, 0x7a17, { stress: true });
      if (ts) { denied.push({ verb: v, why: 'עבר את החוקים והאמת, נכשל בקלטי-לחץ', example: short(ts) }); continue; }
    } else if (!GENERIC.has(v)) {
      const so = stressOuts(R, t); const ran = so.filter((x) => x !== null).length;
      if (ran * 2 < so.length) { denied.push({ verb: v, why: 'נכשל בקלטי-לחץ: לא רץ על רובם' }); continue; }
      const r = (R.refs.get(sk) || []).find((x) => x.verb === v);
      if (r && L.closeness(R.samplesOf(t.sig), t.outs, r.outs) === 1) {
        const c = L.stressCompare(R.stressOf(t.sig), so, r.stress);
        if (!c.same) { denied.push({ verb: v, why: 'זהה לייחוס בסט, שונה בקלטי-לחץ', example: c.differ }); continue; }
      }
    }
    names.push({ verb: v, he: VERB_BY_ID.get(v).he, truth: tr === null });
  }
  const out = { names, ...(denied.length ? { denied } : {}) };
  R.nameCache.set(t.key, out);
  return out;
}
const short = (x) => JSON.parse(JSON.stringify(x, (k, v) => (Array.isArray(v) && v.length > 6 ? { len: v.length, head: v.slice(0, 4) } : v)));
const isSpecial = (t) => (t.names || []).some((n) => !GENERIC.has(n.verb));

/**
 * ריצה אחת. mode = 'random' (הבחירה של GROW: דגימה אקראית מהמועמדים) או 'score' (GROW2: הטובים קודם).
 * שתי הריצות באותו תקציב (budget.json) ועם אותם תיקונים 3+4 — ההבדל היחיד הוא הבחירה.
 */
export async function grow({ log = () => {}, mode = 'score' } = {}) {
  const R = await shared();
  const { proven, runners, runOne, samplesOf } = R;
  log(`[${mode}] קומה 0: ${proven.length} חלקים מוכחים שרצים כאן · ${runners.size} נטענו`);
  const measure = (t) => {
    const S = samplesOf(t.sig); const outs = []; let steps = 0;
    for (const a of S) { const o = runOne(t, a); outs.push(o.v); steps += o.s; if (steps > BUD.thingSteps) return { junk: 'חרג מתקציב-הצעדים' }; }
    const j = L.judge(t.sig, S, outs);
    if (j.junk) return j;
    // GROW2 · זבל: מתעלם מאחד הקלטים (‏(רשימה, 4) ⇒ ממיין(רשימה)) — זה הדבר החד-מקומי בתחפושת, לא חדש
    if (t.sig.length === 2) for (let a = 0; a < 2; a++) {
      let n = 0; let same = 0;
      for (let k = 0; k < S.length; k++) {
        if (outs[k] === null) continue;
        const alt = [...S[k]]; alt[a] = S[(k + 7) % S.length][a];
        if (L.sameOut(alt[a], S[k][a])) continue;
        const o = runOne(t, alt).v; if (o === null) continue;
        n++; if (L.sameOut(o, outs[k])) same++;
      }
      if (n >= 6 && same === n) return { junk: 'מתעלם מקלט' };
    }
    return { ...j, steps, outs };
  };

  /* ─── המדף ─── */
  const shelf = new Map(); // טביעה ⇒ הדבר הטוב ביותר
  const all = [];
  const byKey = new Map();
  const floors = [];
  const replacements = [];
  const stressRejected = [];
  const builtKeys = new Set();
  let nextIdx = 0;
  const offer = (t, F, changed) => {
    const cur = shelf.get(t.fp);
    if (!cur) { t.idx = nextIdx++; shelf.set(t.fp, t); all.push(t); byKey.set(t.id, t); changed.push(t); F.new++; return; }
    if (L.better(t, cur) < 0) {
      // GROW2 · לחץ: "אותה טביעה" על הסט הקבוע לא מספיקה — חייב להיות זהה גם על קלטי-הלחץ
      const c = L.stressCompare(R.stressOf(t.sig), stressOuts(R, t), stressOuts(R, cur));
      if (!c.same) { F.stressRejected++; stressRejected.push({ floor: t.floor, fp: t.fp, sig: sigKeyOf(t), old: { id: cur.id, floor: cur.floor, steps: cur.steps }, now: { id: t.id, form: t.form, steps: t.steps }, ran: c.ran + '/' + c.n, ...(c.differ ? { differ: c.differ } : {}) }); return; }
      t.idx = nextIdx++; shelf.set(t.fp, t); all.push(t); byKey.set(t.id, t); changed.push(t); F.replaced++;
      replacements.push({ floor: t.floor, fp: t.fp, sig: sigKeyOf(t), old: { id: cur.id, floor: cur.floor, form: cur.form, steps: cur.steps, nodes: cur.nParts }, now: { id: t.id, floor: t.floor, form: t.form, steps: t.steps, nodes: t.nParts }, why: cur.steps > t.steps ? 'פחות צעדים: ' + cur.steps + ' ⇒ ' + t.steps : 'אותם צעדים, פחות צמתים: ' + cur.nParts + ' ⇒ ' + t.nParts });
      return;
    }
    F.dup++;
  };
  const junkOf = (F, why) => { F.junk[why] = (F.junk[why] || 0) + 1; };
  /** ניקוד (תיקון 1): קרבה ⇒ שם מיוחד ⇒ זכות למרכיבים. */
  const credit = (t, v) => { if (t && (t.score ?? 0) < v) t.score = v; };
  const scoreFloor = (fresh, F) => {
    for (const t of fresh) { t.close = closest(R, t, t.outs); t.score = t.close ? t.close.c : 0; }
    if (mode !== 'score') return;
    const cand = fresh.filter((t) => t.close && t.close.c >= SCORE.nameAt).sort((a, b) => b.close.c - a.close.c || a.idx - b.idx).slice(0, SCORE.nameCap);
    for (const t of cand) {
      Object.assign(t, nameThing(R, t)); F.namedDuring = (F.namedDuring || 0) + 1;
      if (!isSpecial(t)) continue;
      t.score = SCORE.named;
      for (const c of t.of.map((id) => byKey.get(id))) { credit(c, SCORE.creditChild); for (const g of c?.of || []) credit(byKey.get(g), SCORE.creditGrand); }
    }
  };

  /* ─── קומה 0 ─── */
  const F0 = { floor: 0, built: 0, new: 0, replaced: 0, dup: 0, stressRejected: 0, junk: {}, outside: 0 };
  let changed = [];
  for (const p of proven) {
    const Rn = runners.get(p.id);
    if (!Rn) { F0.outside++; continue; }
    const decl = Rn.sig.takes.map((t) => semOfD(t.d));
    if (!decl.length || decl.length > 2 || decl.some((x) => !TRY[x])) { F0.outside++; continue; }
    const sigs = decl.length === 1 ? TRY[decl[0]].map((x) => [x]) : TRY[decl[0]].flatMap((a) => TRY[decl[1]].map((b) => [a, b]));
    for (const sig of sigs) {
      const key = 'P(' + p.id + '|' + sig.join(',') + ')';
      const t = { key, id: idOf(key), floor: 0, form: 'part', part: p.id, of: [], sig, graph: L.partGraph(p.id, sig.length), nParts: 1 };
      F0.built++;
      const m = measure(t);
      if (m.junk) { junkOf(F0, m.junk); continue; }
      const C2 = callerFor(Rn.ctx, Rn.fn, 0x5eed1, Rn.self);
      const S = samplesOf(sig);
      let rnd = false;
      for (let k = 0; k < S.length && !rnd; k++) {
        if (m.outs[k] === null) continue;
        resetBudget(Rn.ctx, BUD.callSteps, BUD.callSteps);
        let r2; try { r2 = C2(S[k]); } catch { r2 = { err: 'budget' }; }
        if (!('v' in r2) || J(L.canon(r2.v)) !== J(L.canon(m.outs[k]))) rnd = true;
      }
      if (rnd) { junkOf(F0, 'אקראי / תלוי-זרע'); continue; }
      Object.assign(t, { out: m.out, fp: m.fp, steps: m.steps, outs: m.outs, ex: exampleOf(S, m.outs) });
      offer(t, F0, changed);
    }
  }
  scoreFloor(changed.filter((t) => shelf.get(t.fp) === t), F0);
  F0.shelf = shelf.size;
  floors.push(F0);
  log(`[${mode}] קומה 0: ${F0.built} נבדקו · ${F0.new} חדשים · ${F0.replaced} תאומים-זולים · ${F0.stressRejected} נדחו בלחץ · ${sumJunk(F0)} זבל`);

  /* ─── הקומות ─── */
  const ONE = Object.entries(L.FORMS).filter(([, f]) => !f.two);
  const TOTAL = BUD.buildsPerFloor + BUD.unaryPerFloor;
  for (let fl = 1; fl <= BUD.maxFloors; fl++) {
    const fresh = changed.filter((t) => shelf.get(t.fp) === t);
    const isNew = new Set(fresh.map((t) => t.idx));
    const F = { floor: fl, seeds: fresh.length, candidates: 0, built: 0, guided: 0, budgetCut: 0, new: 0, replaced: 0, dup: 0, stressRejected: 0, junk: {} };
    const cur = [...shelf.values()].sort((a, b) => a.idx - b.idx);
    const buckets = new Map();
    for (const t of cur) { const k = L.bucketKey(t.sig[0], t.sig.length, t.sig[1], isNew.has(t.idx)); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
    const { blocks, total: pairs } = L.pairBlocks(cur, (i) => isNew.has(i), buckets);
    const unary = [];
    for (const A of fresh) for (const [name, f] of ONE) { const ty = f.type(A); if (ty) unary.push([name, f, A, null, ty]); }
    const jobs = [];
    const jobKey = (name, A, Bt) => name + '(' + A.id + (Bt ? ',' + Bt.id : '') + ')';
    // תיקון 2 · לפי ניקוד: GUIDED מהתקציב לחיבורים שאחד מהם בין ה-TOP הטובים (גם ישנים — כדי לבנות מעל "משווה")
    if (mode === 'score') {
      const good = cur.filter((t) => (t.score ?? 0) >= SCORE.good).sort((a, b) => b.score - a.score || a.idx - b.idx).slice(0, SCORE.top);
      const gj = [];
      const push = (name, A, Bt, anchor, partner) => {
        const f = L.FORMS[name]; const ty = Bt ? f.type(A, Bt) : f.type(A);
        if (!ty) return;
        const key = jobKey(name, A, Bt);
        if (!builtKeys.has(key)) gj.push({ key, anchor: anchor.id, anchorScore: anchor.score, partnerScore: partner ? partner.score ?? 0 : anchor.score, job: [name, f, A, Bt, ty] });
      };
      for (const G of good) {
        for (const [name] of ONE) push(name, G, null, G, null);
        for (const X of cur) {
          if (X === G) continue;
          push('chain', G, X, G, X); push('chain', X, G, G, X);
          push('pair', G, X, G, X); push('pair', X, G, G, X);
        }
      }
      const picked = L.pickGuided(gj, Math.round(SCORE.guided * TOTAL));
      for (const j of picked) jobs.push(j.job);
      F.guided = picked.length;
      F.candidates += gj.length;
    }
    const rest = TOTAL - jobs.length;
    const pairCap = Math.round((rest * BUD.buildsPerFloor) / TOTAL);
    for (const i of L.sampleIdx(pairs, pairCap, 0x6703 + fl)) {
      const { block, B: Bt } = L.pairAt(blocks, i);
      const f = L.FORMS[block.form]; const ty = f.type(block.A, Bt);
      if (ty) jobs.push([block.form, f, block.A, Bt, ty]);
    }
    for (const i of L.sampleIdx(unary.length, rest - pairCap, 0x7531 + fl)) jobs.push(unary[i]);
    F.candidates += pairs + unary.length;
    changed = [];
    for (const [name, f, A, Bt, ty] of jobs) {
      const key = jobKey(name, A, Bt);
      if (builtKeys.has(key)) continue;
      builtKeys.add(key);
      const g = Bt ? f.graph(A, Bt) : f.graph(A);
      F.built++;
      const prob = graphProblem(g);
      if (prob) { junkOf(F, 'חיווט: ' + prob.split(':')[0]); continue; }
      const t = { key, id: idOf(key), floor: fl, form: name, of: Bt ? [A.id, Bt.id] : [A.id], sig: ty.sig, graph: g, nParts: graphNodes(g).length };
      const m = measure(t);
      if (m.junk) { junkOf(F, m.junk); continue; }
      if (m.out !== ty.out) { junkOf(F, 'פלט בסוג אחר מהצפוי'); continue; }
      Object.assign(t, { out: m.out, fp: m.fp, steps: m.steps, outs: m.outs, ex: exampleOf(samplesOf(t.sig), m.outs) });
      offer(t, F, changed);
    }
    F.budgetCut = F.candidates - F.built;
    scoreFloor(changed.filter((t) => shelf.get(t.fp) === t), F);
    F.shelf = shelf.size;
    floors.push(F);
    log(`[${mode}] קומה ${fl}: ${F.candidates} מועמדים · ${F.built} נבנו (${F.guided} לפי ניקוד) · ${F.new} חדשים · ${F.replaced} החליפו · ${F.stressRejected} נדחו בלחץ · ${F.dup} כפולים · ${sumJunk(F)} זבל · מדף ${F.shelf}`);
    if (!F.new && !F.replaced) { F.stop = 'הקומה לא הוסיפה כלום חדש'; break; }
    if (fl === BUD.maxFloors) F.stop = 'נגמר התקציב: ' + BUD.maxFloors + ' קומות';
  }

  /* ─── המתאר: כל המדף (אותה מדיניות לשתי הריצות; מטמון משותף) ─── */
  const final = [...shelf.values()].sort((a, b) => a.idx - b.idx);
  for (const [k, t] of final.entries()) {
    if (k && k % 1000 === 0) log(`[${mode}]   המתאר: ${k}/${final.length}`);
    if (!t.names && !t.naming) Object.assign(t, nameThing(R, t));
  }
  // גם המרכיבים שהוחלפו בדרך — כדי ש"נבנה מעל דבר-עם-שם" ייספר באותה מדיניות בשתי הריצות
  for (const t of all) for (const id of t.of) { const c = byKey.get(id); if (!c.names && !c.naming) Object.assign(c, nameThing(R, c)); }
  log(`[${mode}] המתאר: ${final.filter((t) => t.names?.length).length}/${final.length} קיבלו שם · ${final.filter(isSpecial).length} מיוחד`);
  return finish({ R, mode, final, all, byKey, floors, replacements, stressRejected });
}
const sumJunk = (F) => Object.values(F.junk).reduce((a, b) => a + b, 0);

/** המדדים (GROW2) + הפנקס + המדף. */
function finish({ R, mode, final, all, byKey, floors, replacements, stressRejected }) {
  const { runOne, homeOf, proven } = R;
  /* ─── גילויים: המדף מול מימושי-הייחוס ─── */
  const fpIndex = new Map(final.map((t) => [t.fp, t]));
  const discover = [];
  for (const v of BIG) {
    const V = VERB_BY_ID.get(v);
    const sems = V.ref.sig.map((t) => semOfD(t.d));
    const row = { verb: v, he: V.he, refSig: sems.join(',') };
    const named = final.filter((t) => t.names?.some((n) => n.verb === v));
    row.named = named.length;
    if (named.length) { const b = [...named].sort(L.better)[0]; row.best = { id: b.id, floor: b.floor, form: b.form, steps: b.steps, nodes: b.nParts, sig: sigKeyOf(b) }; row.byFloor = countBy(named, (t) => t.floor); }
    row.deniedByTruth = final.filter((t) => t.denied?.some((d) => d.verb === v)).length;
    if (sems.length > 2 || sems.some((x) => !L.SEMS.includes(x))) { row.reach = 'מחוץ לעולם של הצמיחה (' + sems.join(', ') + ')'; discover.push(row); continue; }
    const fn = directCall(V.ref.fn());
    const S = L.samplesOf(sems);
    const outs = S.map((a) => { const r = fn(a); return 'err' in r || L.semOfValue(r.v) === null ? null : r.v; });
    const j = L.judge(sems, S, outs);
    if (j.junk) { row.reach = 'הייחוס עצמו לא נמדד על סט-הקלטים: ' + j.junk; discover.push(row); continue; }
    const hit = fpIndex.get(j.fp);
    row.reach = hit ? 'נמצא — אותה טביעה בדיוק' : 'לא נמצא באותה טביעה';
    if (hit) row.twin = { id: hit.id, floor: hit.floor, form: hit.form, steps: hit.steps, nodes: hit.nParts };
    discover.push(row);
  }
  const sameOnExtra = (t, other) => {
    let same = 0; let n = 0; let ex = null;
    for (const a of L.extraSamples(t.sig)) {
      const x = runOne(t, a).v; const y = other(a);
      n++;
      if (L.sameOut(x, y)) same++; else ex ||= { in: L.canon(a), got: x === null ? null : L.canon(x), want: y === null ? null : L.canon(y) };
    }
    return { n, same, ...(ex ? { differ: ex } : {}) };
  };
  for (const row of discover) {
    if (!row.twin) continue;
    const V = VERB_BY_ID.get(row.verb); const fn = directCall(V.ref.fn());
    row.twin.extra = sameOnExtra(final.find((t) => t.id === row.twin.id), (a) => { const r = fn(a); return 'err' in r || L.semOfValue(r.v) === null ? null : r.v; });
  }

  /* ─── כתיבה ─── */
  const partById = new Map(proven.map((p) => [p.id, p]));
  const where = (pid) => { const r = homeOf(partById.get(pid)); const o = r?.origins?.[0]; return o ? (o.repo ? o.repo.split('/').pop() : r.source) + ':' + o.file + (o.line ? ':' + o.line : '') : r?.path || pid; };
  const baseParts = (t, acc = new Set()) => { if (t.form === 'part') acc.add(t.part); else for (const id of t.of) baseParts(byKey.get(id), acc); return acc; };
  const partIx = {};
  const doesOf = (t) => (t.names?.length ? t.names.map((n) => n.he + (n.truth ? ' ✓אמת' : '')).join(' · ') : t.naming === 'תקציב' ? 'לא נבדק (תקציב-הבדיקה)' : 'בלי שם עדיין');
  const entry = (t) => {
    const ps = [...baseParts(t)].sort();
    for (const p of ps) if (!partIx[p]) { const q = partById.get(p); partIx[p] = { where: where(p), name: q?.name || '', proven: Object.keys(q?.proofs || {}).filter((v) => provenAs(q, v)).sort() }; }
    return {
      id: t.id, floor: t.floor, form: t.form, formHe: L.FORM_HE[t.form], ...(t.part ? { part: t.part } : { of: t.of }), sig: sigKeyOf(t),
      steps: t.steps, nodes: t.nParts, parts: ps, does: doesOf(t),
      ...(t.names?.length ? { verbs: t.names.map((n) => n.verb) } : {}), ...(t.denied ? { denied: t.denied } : {}),
      ...(t.close ? { close: { verb: t.close.verb, pct: Math.round(100 * t.close.c) } } : {}),
      fp: t.fp, example: t.ex,
    };
  };
  const COLS = ['id', 'form', 'of', 'sig', 'steps', 'nodes', 'verbs', 'close', 'fp'];
  const rowOf = (t) => [t.id, t.form, t.of, sigKeyOf(t), t.steps, t.nParts, (t.names || []).map((n) => n.verb).join(','), t.close ? t.close.verb + ':' + Math.round(100 * t.close.c) : '', t.fp];
  const rows = (ts) => '{"cols":' + J(COLS) + ',"rows":[\n' + ts.map((t) => J(rowOf(t))).join(',\n') + '\n]}\n';
  const list = (es) => '[\n' + es.map((e) => J(e)).join(',\n') + '\n]\n';

  const firstOf = new Map(); for (const t of all) if (!firstOf.has(t.fp)) firstOf.set(t.fp, t);
  const improvements = final.filter((t) => t.floor > 0 && firstOf.get(t.fp).floor === 0).map((t) => {
    const o = firstOf.get(t.fp);
    const st = L.stressCompare(R.stressOf(t.sig), stressOuts(R, t), stressOuts(R, o));
    return { fp: t.fp, sig: sigKeyOf(t), old: { id: o.id, part: o.part, where: where(o.part), steps: o.steps }, now: { id: t.id, floor: t.floor, form: t.form, steps: t.steps, nodes: t.nParts, does: doesOf(t) }, saved: o.steps - t.steps, pct: Math.round((100 * (o.steps - t.steps)) / o.steps), extra: sameOnExtra(t, (a) => runOne(o, a).v), stress: { same: st.same, ran: st.ran, n: st.n } };
  }).sort((a, b) => b.pct - a.pct || (a.fp < b.fp ? -1 : 1));
  const special = final.filter((t) => t.floor > 0 && isSpecial(t));
  const shelfFiles = {};
  const fls = [...new Set(final.map((t) => t.floor))].sort((a, b) => a - b);
  for (const f of fls) shelfFiles['floor-' + f + '.json'] = f === 0 ? list(final.filter((t) => t.floor === 0).map(entry)) : rows(final.filter((t) => t.floor === f));
  shelfFiles['named.json'] = list(special.map(entry));
  shelfFiles['improved.json'] = list(improvements.map((r) => entry(byKey.get(r.now.id))));
  const need = new Set(); const walk = (id) => { if (need.has(id)) return; need.add(id); for (const c of byKey.get(id).of) walk(c); };
  for (const t of final) walk(t.id);
  for (const r of improvements) need.add(r.old.id);
  const gone = all.filter((t) => need.has(t.id) && final.indexOf(t) < 0);
  shelfFiles['replaced.json'] = list(gone.map((t) => (t.floor === 0 ? entry(t) : Object.fromEntries(COLS.map((c, k) => [c, rowOf(t)[k]])))));

  /* ─── GROW2 · המדדים ─── */
  const metrics = metricsOf({ R, final, all, byKey, floors, improvements, stressRejected, entry });
  shelfFiles['parts.json'] = JSON.stringify(Object.fromEntries(Object.keys(partIx).sort().map((k) => [k, partIx[k]])), null, 1) + '\n';

  for (const F of floors) F.named = final.filter((t) => t.floor === F.floor && t.names?.length).length;
  for (const F of floors) F.namedSpecial = final.filter((t) => t.floor === F.floor && isSpecial(t)).length;
  const ledger = {
    about: 'נבנה ע״י catalog/grow/grow.mjs — לא לערוך ביד. מצב ' + mode + '. "צעדים" = lib/steps.mjs על סט-הקלטים הקבוע (lib.mjs › VALUES); בלי שעון. שמות כלליים (GENERIC) נספרים אבל לא נחשבים "שם מיוחד"',
    mode, budget: BUD, score: SCORE, world: L.SEMS, forms: Object.keys(L.FORMS), generic: [...GENERIC],
    floors, reachedFloor: floors[floors.length - 1].floor,
    shelf: final.length, named: final.filter((t) => t.names?.length).length, namedSpecial: final.filter(isSpecial).length,
    totalBuilt: floors.reduce((a, F) => a + F.built, 0),
    namedBy: countBy(final.flatMap((t) => (t.names || []).map((n) => n.verb)), (v) => v),
    deniedBy: countBy(final.flatMap((t) => (t.denied || []).map((d) => d.verb + ' · ' + d.why.split(',')[0])), (v) => v),
    twinsFloor0: replacements.filter((r) => r.floor === 0).length,
    replacedInGrowth: replacements.filter((r) => r.floor > 0).length,
    stressRejected,
    improvements,
    discover,
    metrics,
  };
  return { mode, metrics, ledger: JSON.stringify(ledger, null, 1) + '\n', shelfFiles };
}

/** המדדים שמשווים בין הריצות. */
function metricsOf({ R, final, all, byKey, floors, improvements, stressRejected, entry }) {
  const special = final.filter(isSpecial);
  const verbsOf = (t) => (t.names || []).map((n) => n.verb);
  const onNamed = final.filter((t) => t.of.some((id) => isSpecial(byKey.get(id))));
  const compares = new Set([...byKey.values()].filter((t) => verbsOf(t).includes('compare')).map((t) => t.id));
  const onCompare = final.filter((t) => t.of.some((id) => compares.has(id)));
  // הסולם: דבר-עם-שם שנבנה ישירות מדבר-עם-שם, וכן הלאה
  const rung = new Map();
  const ladderOf = (t) => {
    if (!t || !isSpecial(t)) return 0;
    if (rung.has(t.id)) return rung.get(t.id);
    const v = 1 + Math.max(0, ...t.of.map((id) => ladderOf(byKey.get(id))));
    rung.set(t.id, v); return v;
  };
  let top = null;
  for (const t of final) { const d = ladderOf(t); if (d > 1 && (!top || d > top.d || (d === top.d && t.idx < top.t.idx))) top = { d, t }; }
  const chainOf = (t) => { const out = []; let x = t; while (x) { out.push({ id: x.id, floor: x.floor, form: x.form, verbs: verbsOf(x).filter((v) => !GENERIC.has(v)), example: x.ex }); x = x.of.map((id) => byKey.get(id)).find((c) => isSpecial(c)); } return out; };
  const best = {}; const grown = {};
  for (const v of WATCH) {
    let b = null;
    for (const t of final) {
      for (const r of R.refs.get(sigKeyOf(t)) || []) {
        if (r.verb !== v) continue;
        const c = L.closeness(R.samplesOf(t.sig), t.outs, r.outs);
        if (!b || c > b.c || (c === b.c && t.idx < b.t.idx)) b = { c, t, sig: sigKeyOf(t) };
      }
    }
    let g = null;
    for (const t of final) {
      if (!t.floor) continue;
      for (const r of R.refs.get(sigKeyOf(t)) || []) {
        if (r.verb !== v) continue;
        const c = L.closeness(R.samplesOf(t.sig), t.outs, r.outs);
        if (!g || c > g.c || (c === g.c && t.idx < g.t.idx)) g = { c, t };
      }
    }
    grown[v] = g ? { pct: Math.round(100 * g.c), id: g.t.id, floor: g.t.floor, form: g.t.form, sig: sigKeyOf(g.t), example: g.t.ex } : { pct: null };
    best[v] = b ? { pct: Math.round(100 * b.c), id: b.t.id, floor: b.t.floor, form: b.t.form, sig: b.sig, named: verbsOf(b.t).includes(v), example: b.t.ex } : { pct: null, why: 'אין על המדף דבר בחתימה של הייחוס' };
  }
  const junk = {};
  for (const F of floors) for (const [k, n] of Object.entries(F.junk)) junk[k] = (junk[k] || 0) + n;
  const examples = onNamed.filter(isSpecial).slice(0, 12).map(entry);
  return {
    built: floors.reduce((a, F) => a + F.built, 0),
    shelf: final.length,
    namedSpecial: special.length,
    namedSpecialGrown: special.filter((t) => t.floor > 0).length,
    specialBy: countBy(special.flatMap((t) => verbsOf(t).filter((v) => !GENERIC.has(v))), (v) => v),
    // כל מה שעלה פעם על המדף (גם מה שהוחלף אחר-כך) ונבנה מעל דבר-עם-שם-מיוחד — אחרי המתאר הסופי, אותה מדיניות לשתי הריצות
    everOnNamed: all.filter((t) => t.of.some((id) => isSpecial(byKey.get(id)))).length,
    shelfOnNamed: onNamed.length,
    shelfOnNamedSpecial: onNamed.filter(isSpecial).length,
    shelfOnCompare: onCompare.length,
    shelfOnCompareSpecial: onCompare.filter(isSpecial).length,
    ladder: top ? { height: top.d, chain: chainOf(top.t) } : { height: special.length ? 1 : 0 },
    bestMatch: best,
    bestGrown: grown,
    junk, junkTotal: Object.values(junk).reduce((a, b) => a + b, 0),
    junkUniform: junk['רשימה של פריט אחד שחוזר'] || 0,
    stressRejected: stressRejected.length,
    improvements: improvements.length,
    wrongImprovements: improvements.filter((r) => !r.stress.same || r.extra.same !== r.extra.n).length,
    examplesOnNamed: examples,
  };
}

function countBy(xs, f) { const o = {}; for (const x of xs) { const k = f(x); o[k] = (o[k] || 0) + 1; } return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))); }
/** דוגמת קלט ⇒ פלט: הקלט הראשון שהפלט שלו תקין, עם רשימה לא-ריקה (אם יש). */
function exampleOf(S, outs) {
  let k = S.findIndex((a, i) => outs[i] !== null && a.every((x) => !Array.isArray(x) || x.length >= 3));
  if (k < 0) k = outs.findIndex((o) => o !== null);
  return { in: show(S[k]), out: show(outs[k]) };
}
/** לתצוגה בלבד: 6 ספרות משמעותיות ועד 6 אחרי הנקודה (טביעה = 12 — lib.mjs › canon). */
function show(v) {
  if (typeof v === 'number') { const r = Number(Number(v.toPrecision(6)).toFixed(6)); return Object.is(r, -0) ? 0 : r; }
  if (Array.isArray(v)) return v.map(show);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, show(v[k])]));
  return v;
}

/** שתי הריצות באותו תקציב ⇒ {ledger, shelfFiles, compare}. */
export async function growBoth({ log = () => {} } = {}) {
  const rnd = await grow({ log, mode: 'random' });
  const sc = await grow({ log, mode: 'score' });
  const compare = {
    about: 'GROW2 — אותו תקציב (budget.json), אותם תיקונים 3+4 (זבל לפני המדף, בדיקת-לחץ); ההבדל היחיד = הבחירה: random (דגימה אקראית מהמועמדים, כמו GROW) מול score (הטובים קודם, ' + Math.round(100 * SCORE.guided) + '% מהתקציב). נבנה ע״י grow.mjs — לא לערוך ביד',
    budget: BUD, score: SCORE, watch: WATCH,
    random: rnd.metrics, scored: sc.metrics,
  };
  return { ledger: sc.ledger, shelfFiles: sc.shelfFiles, compare: JSON.stringify(compare, null, 1) + '\n' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  const check = process.argv.includes('--check');
  const { ledger, shelfFiles, compare } = await growBoth({ log: check ? () => {} : (s) => console.log(s + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's') });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const cur = fs.existsSync(SHELF) ? fs.readdirSync(SHELF).filter((f) => f.endsWith('.json')).sort() : [];
  if (check) {
    const rd = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
    const stale = rd(LEDGER) !== ledger || rd(COMPARE) !== compare || J(cur) !== J(Object.keys(shelfFiles).sort()) || cur.some((f) => rd(path.join(SHELF, f)) !== shelfFiles[f]);
    if (stale) { console.error('catalog/grow: ledger.json / compare.json / shelf/ לא זהים להרצה חוזרת — הריצו node catalog/grow/grow.mjs'); process.exit(1); }
    console.log('✓ catalog/grow: הרצה חוזרת ⇒ אותו פנקס, אותה השוואה ואותו מדף · ' + secs + 's');
    process.exit(0);
  }
  fs.mkdirSync(SHELF, { recursive: true });
  for (const f of cur) if (!shelfFiles[f]) fs.unlinkSync(path.join(SHELF, f));
  for (const [f, t] of Object.entries(shelfFiles)) fs.writeFileSync(path.join(SHELF, f), t);
  fs.writeFileSync(LEDGER, ledger);
  fs.writeFileSync(COMPARE, compare);
  console.log('🌱 נכתב · ' + secs + 's');
}
