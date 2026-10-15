#!/usr/bin/env node
/**
 * 🌱 מנוע-הצמיחה (GROW, 15.10.2026) — בלי בקשה ובלי מטרה. הרעיון של הבעלים:
 *   "הוא מתחיל לבנות: חיבור א עם ב — יצא ג. הוא רושם ג. הוא הולך ומחפש: יש ג יותר טוב או לא? אם אין — הוא רושם אותו.
 *    אם יש — הוא בודק איזה מהם יותר טוב, וממשיך לבנות מעליו."
 *
 * קומה 0 — החלקים המוכחים שרצים כאן, לכל אחד חתימה בעולם של 4 סוגים (lib.mjs) ⇒ טביעת-התנהגות על סט-קלטים קבוע.
 *          אותה טביעה = אותו "דבר" ⇒ נשאר רק הטוב (פחות צעדים ⇒ פחות צמתים ⇒ מפתח).
 * קומה k — בונה מחברים מהמדף בצורות-חיווט בלבד (chain/pair/map/mapc/fold/fix — דרך combiner/graph.mjs), רק כשלפחות
 *          אחד מהשניים חדש מהקומה הקודמת. כל תוצאה: טביעה ⇒ חדש (נרשם) / טוב יותר מהקיים (מחליף, ונרשם מי במי ולמה) /
 *          כפול (נזרק). עוצר כשקומה לא הוסיפה כלום או כשנגמר התקציב (budget.json).
 * מתאר — לכל מה שנשאר על המדף: חוקי **כל** הפעלים (probePart של הקורא) + בדיקת-אמת (truth.mjs) ⇒ שם, או "בלי שם עדיין".
 * גילויים — בסוף: המדף מול מימושי-הייחוס של פעלים "גדולים" (טביעה + חוקים + אמת).
 *
 * "צעדים" = lib/steps.mjs (מונה דטרמיניסטי בתוך ארגז-החול), לכל קריאה לחלק — נשמר במטמון לפי (חלק, קלט): אותו חלק על
 * אותו קלט ⇒ אותו פלט ואותם צעדים (חלקים אקראיים נזרקים בקומה 0). צעדי-דבר = סכום צעדי-הקריאות שלו על כל סט-הקלטים.
 * החוטים (graph.mjs) לא נספרים — הם לא מחשבים. בלי שעון בפנקס: שעון-קיר רק מודפס.
 *
 * עיוור כמו מנוע-השרטוטים: מתקין את אותו שומר-קריאה (מתכוני-יד / combo / found לא נקראים).
 *
 *   node catalog/grow/grow.mjs            # כותב ledger.json + shelf/
 *   node catalog/grow/grow.mjs --check    # מריץ שוב ומשווה בית-בבית (יציאה 1 אם שונה)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { loadWorld } = await import('../blueprints/search.mjs'); // מתקין את השומר (בלי מתכוני-יד/combo)
const { provenAs } = await import('../combiner/core.mjs');
const { loadRunners } = await import('../combiner/combine.mjs');
const { graphProblem, graphNodes, runGraph } = await import('../combiner/graph.mjs');
const { callerFor, resetBudget, stepsUsed, BudgetError } = await import('../lib/sandbox.mjs');
const { probePart, directCall } = await import('../lib/probe.mjs');
const { bundleBridge } = await import('../lib/load-bridge.mjs');
const { VERBS, VERB_BY_ID } = await import('../lib/verbs.mjs');
const { semOfD } = await import('../blueprints/engine.mjs');
const L = await import('./lib.mjs');
const { WEAK, hasTruth, truthOf } = await import('./truth.mjs');

export const LEDGER = path.join(HERE, 'ledger.json');
export const SHELF = path.join(HERE, 'shelf');
const BUD = JSON.parse(fs.readFileSync(path.join(HERE, 'budget.json'), 'utf8'));

/** סוג מוצהר של קלט-חלק ⇒ הסוגים בעולם שננסה. */
const TRY = { num: ['num'], nums: ['nums'], pt: ['pt'], pts: ['pts'], list: ['nums', 'pts'], any: L.SEMS };
/** תיאור-קלט (לחוקי-הפעלים של הקורא) לכל סוג. */
const PT = { t: 'obj', n: 'Point', p: [['x', { t: 'int', lo: 0, hi: 40 }, false], ['y', { t: 'int', lo: 0, hi: 40 }, false]] };
const DESC = { num: { t: 'int', lo: -20, hi: 60 }, nums: { t: 'arr', of: { t: 'int', lo: -20, hi: 60 }, max: 8 }, pt: PT, pts: { t: 'arr', of: PT, max: 7 } };
/** פעלים "גדולים" — להשוואה בסוף (גילויים בלי שביקשו). */
const BIG = ['tour', 'allot', 'schedule', 'shortest-path', 'spread', 'sun-heading', 'sort', 'reverse', 'dedupe', 'sum', 'average', 'extreme', 'count', 'compare', 'next'];

const J = (v) => JSON.stringify(v);
const idOf = (key) => L.fnv(key) + L.fnv('~' + key);

export async function grow({ log = () => {} } = {}) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const B = await import(pathToFileURL(await bundleBridge()).href);
  const { ix, raw, homeOf } = loadWorld();
  const proven = ix.parts.filter((p) => Object.keys(p.proofs || {}).some((v) => provenAs(p, v)) && homeOf(p)).sort((a, b) => (a.id < b.id ? -1 : 1));
  const runners = await loadRunners(proven, raw);
  log(`קומה 0: ${proven.length} חלקים מוכחים שרצים כאן · ${runners.size} נטענו`);

  /* ─── קריאה לחלק — עם מטמון (חלק, קלט) ⇒ {פלט, צעדים} ─── */
  const callers = new Map();
  const memo = new Map();
  let realCalls = 0;
  const stepsOf = (ctx) => Number(String(stepsUsed(ctx)).split(' ')[0]) || 0;
  const callPart = (pid, args) => {
    const k = pid + '\u0001' + J(args);
    let m = memo.get(k);
    if (m) return m;
    let C = callers.get(pid);
    if (!C) { const R = runners.get(pid); C = { ctx: R.ctx, call: callerFor(R.ctx, R.fn, 0, R.self) }; callers.set(pid, C); }
    resetBudget(C.ctx, BUD.callSteps, BUD.callSteps);
    let r;
    try { r = C.call(args); } catch (e) { if (!(e instanceof BudgetError)) throw e; r = { err: 'budget' }; }
    realCalls++;
    m = { r: r.async ? { err: 'async' } : r, s: r.err === 'budget' ? BUD.callSteps : stepsOf(C.ctx) };
    memo.set(k, m);
    return m;
  };
  /** מריץ דבר (גרף) על קלט אחד: {v|null, s}. */
  const nodesOf = new WeakMap();
  const runOne = (t, args) => {
    let ps = nodesOf.get(t.graph);
    if (!ps) { ps = graphNodes(t.graph).map((n) => n.part); nodesOf.set(t.graph, ps); }
    let s = 0;
    const r = runGraph(t.graph, args, (k, a) => { const m = callPart(ps[k], a); s += m.s; return m.r; });
    const v = !r || r.async || 'err' in r ? null : r.v;
    return { v: v === null || L.semOfValue(v) === null ? null : v, s };
  };
  const samplesBySig = new Map();
  const samplesOf = (sig) => { const k = sig.join(','); if (!samplesBySig.has(k)) samplesBySig.set(k, L.samplesOf(sig)); return samplesBySig.get(k); };
  /** דבר ⇒ טביעה (או זבל). */
  const measure = (t) => {
    const S = samplesOf(t.sig); const outs = []; let steps = 0;
    for (const a of S) { const o = runOne(t, a); outs.push(o.v); steps += o.s; if (steps > BUD.thingSteps) return { junk: 'חרג מתקציב-הצעדים' }; }
    const j = L.judge(t.sig, S, outs);
    if (j.junk) return j;
    return { ...j, steps, outs };
  };

  /* ─── המדף ─── */
  const shelf = new Map(); // טביעה ⇒ הדבר הטוב ביותר
  const all = []; // כל מה שעלה פעם על המדף (גם מה שהוחלף) — לפי סדר
  const floors = [];
  const replacements = [];
  let nextIdx = 0;
  const offer = (t, F, changed) => {
    const cur = shelf.get(t.fp);
    if (!cur) { t.idx = nextIdx++; shelf.set(t.fp, t); all.push(t); changed.push(t); F.new++; return; }
    if (L.better(t, cur) < 0) {
      t.idx = nextIdx++; shelf.set(t.fp, t); all.push(t); changed.push(t); F.replaced++;
      replacements.push({ floor: t.floor, fp: t.fp, sig: t.sig.join(',') + '>' + t.out, old: { id: cur.id, floor: cur.floor, form: cur.form, steps: cur.steps, nodes: cur.nParts }, now: { id: t.id, floor: t.floor, form: t.form, steps: t.steps, nodes: t.nParts }, why: cur.steps > t.steps ? 'פחות צעדים: ' + cur.steps + ' ⇒ ' + t.steps : 'אותם צעדים, פחות צמתים: ' + cur.nParts + ' ⇒ ' + t.nParts });
      return;
    }
    F.dup++;
  };
  const junkOf = (F, why) => { F.junk[why] = (F.junk[why] || 0) + 1; };

  /* ─── קומה 0 ─── */
  const F0 = { floor: 0, built: 0, new: 0, replaced: 0, dup: 0, junk: {}, outside: 0, realCalls: 0 };
  let changed = [];
  for (const p of proven) {
    const R = runners.get(p.id);
    if (!R) { F0.outside++; continue; }
    const decl = R.sig.takes.map((t) => semOfD(t.d));
    if (!decl.length || decl.length > 2 || decl.some((s) => !TRY[s])) { F0.outside++; continue; }
    const sigs = decl.length === 1 ? TRY[decl[0]].map((s) => [s]) : TRY[decl[0]].flatMap((a) => TRY[decl[1]].map((b) => [a, b]));
    for (const sig of sigs) {
      const key = 'P(' + p.id + '|' + sig.join(',') + ')';
      const t = { key, id: idOf(key), floor: 0, form: 'part', part: p.id, of: [], sig, graph: L.partGraph(p.id, sig.length), nParts: 1 };
      F0.built++;
      const m = measure(t);
      if (m.junk) { junkOf(F0, m.junk); continue; }
      // אקראי? אותם קלטים, זרע אחר ⇒ פלט אחר
      const C2 = callerFor(R.ctx, R.fn, 0x5eed1, R.self);
      const S = samplesOf(sig);
      let rnd = false;
      for (let k = 0; k < S.length && !rnd; k++) {
        if (m.outs[k] === null) continue;
        resetBudget(R.ctx, BUD.callSteps, BUD.callSteps);
        let r2; try { r2 = C2(S[k]); } catch { r2 = { err: 'budget' }; }
        if (!('v' in r2) || J(L.canon(r2.v)) !== J(L.canon(m.outs[k]))) rnd = true;
      }
      if (rnd) { junkOf(F0, 'אקראי / תלוי-זרע'); continue; }
      Object.assign(t, { out: m.out, fp: m.fp, steps: m.steps, ex: exampleOf(S, m.outs) });
      offer(t, F0, changed);
    }
  }
  F0.realCalls = realCalls;
  F0.shelf = shelf.size;
  floors.push(F0);
  log(`קומה 0: ${F0.built} נבדקו · ${F0.new} חדשים · ${F0.replaced} תאומים-זולים-יותר · ${F0.dup} כפולים · ${Object.values(F0.junk).reduce((a, b) => a + b, 0)} זבל · ${F0.outside} מחוץ לעולם`);

  /* ─── הקומות ─── */
  const ONE = Object.entries(L.FORMS).filter(([, f]) => !f.two);
  for (let fl = 1; fl <= BUD.maxFloors; fl++) {
    const fresh = changed.filter((t) => shelf.get(t.fp) === t);
    const isNew = new Set(fresh.map((t) => t.idx));
    const F = { floor: fl, seeds: fresh.length, candidates: 0, built: 0, budgetCut: 0, new: 0, replaced: 0, dup: 0, junk: {} };
    const cur = [...shelf.values()].sort((a, b) => a.idx - b.idx);
    const buckets = new Map();
    for (const t of cur) { const k = L.bucketKey(t.sig[0], t.sig.length, t.sig[1], isNew.has(t.idx)); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
    // הזוגות לא נפרסים: בלוקים לפי דליי-סוג ⇒ סך המועמדים ⇒ דגימה דטרמיניסטית של buildsPerFloor מהם (כשיש יותר)
    const { blocks, total: pairs } = L.pairBlocks(cur, (i) => isNew.has(i), buckets);
    // הצורות החד-מקומיות (map/mapc/fold/fix) על כל חדש — מכסה נפרדת (unaryPerFloor), אחרת אלפי-הזוגות בולעים אותן
    const unary = [];
    for (const A of fresh) for (const [name, f] of ONE) { const ty = f.type(A); if (ty) unary.push([name, f, A, null, ty]); }
    const total = pairs + unary.length;
    const jobs = [];
    for (const i of L.sampleIdx(pairs, BUD.buildsPerFloor, 0x6703 + fl)) {
      const { block, B: Bt } = L.pairAt(blocks, i);
      const f = L.FORMS[block.form]; const ty = f.type(block.A, Bt);
      if (ty) jobs.push([block.form, f, block.A, Bt, ty]);
    }
    for (const i of L.sampleIdx(unary.length, BUD.unaryPerFloor, 0x7531 + fl)) jobs.push(unary[i]);
    F.candidates = total;
    F.budgetCut = total - jobs.length;
    changed = [];
    for (const [name, f, A, Bt, ty] of jobs) {
      const key = name + '(' + A.id + (Bt ? ',' + Bt.id : '') + ')';
      const g = Bt ? f.graph(A, Bt) : f.graph(A);
      F.built++;
      const prob = graphProblem(g);
      if (prob) { junkOf(F, 'חיווט: ' + prob.split(':')[0]); continue; }
      const t = { key, id: idOf(key), floor: fl, form: name, of: Bt ? [A.id, Bt.id] : [A.id], sig: ty.sig, graph: g, nParts: graphNodes(g).length };
      const m = measure(t);
      if (m.junk) { junkOf(F, m.junk); continue; }
      if (m.out !== ty.out) { junkOf(F, 'פלט בסוג אחר מהצפוי'); continue; }
      Object.assign(t, { out: m.out, fp: m.fp, steps: m.steps, ex: exampleOf(samplesOf(t.sig), m.outs) });
      offer(t, F, changed);
    }
    F.shelf = shelf.size;
    F.realCalls = realCalls;
    floors.push(F);
    log(`קומה ${fl}: ${F.seeds} זרעים · ${F.candidates} מועמדים · ${F.built} נבנו (${F.budgetCut} נחסמו בתקציב) · ${F.new} חדשים · ${F.replaced} החליפו בטוב יותר · ${F.dup} כפולים · ${Object.values(F.junk).reduce((a, b) => a + b, 0)} זבל · מדף ${F.shelf}`);
    if (!F.new && !F.replaced) { F.stop = 'הקומה לא הוסיפה כלום חדש'; break; }
    if (fl === BUD.maxFloors) F.stop = 'נגמר התקציב: ' + BUD.maxFloors + ' קומות';
  }

  /* ─── המתאר: חוקי כל הפעלים + בדיקת-אמת ─── */
  const final = [...shelf.values()].sort((a, b) => a.idx - b.idx);
  let nameSteps = 0; const NAMECAP = { v: 0 };
  class NameBudget extends Error {}
  const thingFn = (t) => (args) => {
    const o = runOne(t, args); NAMECAP.v += o.s;
    if (NAMECAP.v > BUD.nameSteps) throw new NameBudget();
    return o.v;
  };
  const verbs = VERBS.filter((v) => !v.staticOnly);
  for (const [k, t] of final.entries()) {
    // המטמון רק חוסך זמן (אותו חלק + אותו קלט ⇒ אותו פלט ואותם צעדים) — מנקים כדי שאיסוף-הזבל לא יחנוק את הריצה
    if (k && k % 2500 === 0) { log(`  המתאר: ${k}/${final.length} · מטמון ${memo.size}`); memo.clear(); }
    NAMECAP.v = 0;
    const f = thingFn(t);
    const sig = { takes: t.sig.map((s, k) => ({ name: 'ab'[k], d: DESC[s], kind: s })) };
    // אותם קלטי-בדיקה לכל הדברים באותה חתימה (כמו הטביעה) ⇒ המטמון של החלקים עובד גם כאן
    const sk = t.sig.join(',') + '>' + t.out;
    let res;
    try { res = probePart({ sig, call: (a) => { const v = f(a); return v === null ? { err: 'fail' } : { v }; }, seed: parseInt(L.fnv('name|' + sk), 16), B, verbs }); }
    catch (e) { if (!(e instanceof NameBudget)) throw e; t.naming = 'תקציב'; nameSteps += NAMECAP.v; continue; }
    nameSteps += NAMECAP.v;
    const held = (res.verbs || []).filter((h) => /^(\d+)\/\1$/.test(h.holds) && !h.implied).map((h) => h.id);
    const names = []; const denied = [];
    for (const v of held) {
      const tr = hasTruth(v, sk) ? truthOf(v, sk, f) : undefined;
      if (tr === undefined && WEAK.has(v)) { denied.push({ verb: v, why: 'חוקים חלשים ואין בדיקת-אמת לחתימה הזו' }); continue; }
      if (tr) { denied.push({ verb: v, why: 'עבר את החוקים, נכשל בבדיקת-האמת', example: tr }); continue; }
      names.push({ verb: v, he: VERB_BY_ID.get(v).he, truth: tr === null });
    }
    t.names = names; if (denied.length) t.denied = denied;
  }
  log(`המתאר: ${final.filter((t) => t.names?.length).length}/${final.length} קיבלו שם · ${nameSteps} צעדים`);

  /* ─── גילויים: המדף מול מימושי-הייחוס ─── */
  const fpIndex = new Map(final.map((t) => [t.fp, t]));
  const discover = [];
  for (const v of BIG) {
    const V = VERB_BY_ID.get(v);
    const sems = V.ref.sig.map((t) => semOfD(t.d));
    const row = { verb: v, he: V.he, refSig: sems.join(',') };
    const named = final.filter((t) => t.names?.some((n) => n.verb === v));
    row.named = named.length;
    if (named.length) { const b = [...named].sort(L.better)[0]; row.best = { id: b.id, floor: b.floor, form: b.form, steps: b.steps, nodes: b.nParts, sig: b.sig.join(',') + '>' + b.out }; row.byFloor = countBy(named, (t) => t.floor); }
    row.deniedByTruth = final.filter((t) => t.denied?.some((d) => d.verb === v)).length;
    if (sems.length > 2 || sems.some((s) => !L.SEMS.includes(s))) { row.reach = 'מחוץ לעולם של הצמיחה (' + sems.join(', ') + ')'; discover.push(row); continue; }
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

  /* ─── אימות נוסף: "אותה טביעה" = שווים על הסט הקבוע. כאן — 200 קלטים אקראיים אחרים ─── */
  const sameOnExtra = (t, other) => {
    let same = 0; let n = 0; let ex = null;
    for (const a of L.extraSamples(t.sig)) {
      const x = runOne(t, a).v; const y = other(a);
      n++;
      if (J(x === null ? null : L.canon(x)) === J(y === null ? null : L.canon(y))) same++; else ex ||= { in: L.canon(a), got: x === null ? null : L.canon(x), want: y === null ? null : L.canon(y) };
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
  const byId = new Map(all.map((t) => [t.id, t]));
  const baseParts = (t, acc = new Set()) => { if (t.form === 'part') acc.add(t.part); else for (const id of t.of) baseParts(byId.get(id), acc); return acc; };
  const partIx = {};
  const doesOf = (t) => (t.names?.length ? t.names.map((n) => n.he + (n.truth ? ' ✓אמת' : '')).join(' · ') : t.naming === 'תקציב' ? 'לא נבדק (תקציב-הבדיקה)' : 'בלי שם עדיין');
  /** רשומה מלאה (קומה 0, בעלי-שם-מיוחד, שיפורים): ממה, מה עושה, צעדים, החלקים + "נמצא ב:" (parts.json), דוגמה. */
  const entry = (t) => {
    const ps = [...baseParts(t)].sort();
    for (const p of ps) if (!partIx[p]) { const q = partById.get(p); partIx[p] = { where: where(p), name: q?.name || '', proven: Object.keys(q?.proofs || {}).filter((v) => provenAs(q, v)).sort() }; }
    return {
      id: t.id, floor: t.floor, form: t.form, formHe: L.FORM_HE[t.form], ...(t.part ? { part: t.part } : { of: t.of }), sig: t.sig.join(',') + '>' + t.out,
      steps: t.steps, nodes: t.nParts, parts: ps, does: doesOf(t),
      ...(t.names?.length ? { verbs: t.names.map((n) => n.verb) } : {}), ...(t.denied ? { denied: t.denied } : {}),
      fp: t.fp, example: t.ex,
    };
  };
  /** שורה קומפקטית (קומות 1+): [id, צורה, ממה, חתימה, צעדים, צמתים, פעלים, טביעה]. */
  const COLS = ['id', 'form', 'of', 'sig', 'steps', 'nodes', 'verbs', 'fp'];
  const rowOf = (t) => [t.id, t.form, t.of, t.sig.join(',') + '>' + t.out, t.steps, t.nParts, (t.names || []).map((n) => n.verb).join(','), t.fp];
  const rows = (ts) => '{"cols":' + J(COLS) + ',"rows":[\n' + ts.map((t) => J(rowOf(t))).join(',\n') + '\n]}\n';
  const list = (es) => '[\n' + es.map((e) => J(e)).join(',\n') + '\n]\n';

  // שיפור למדף הקיים = הטביעה הייתה של חלק מקורי (קומה 0), ועכשיו מחזיק בה דבר שנבנה — בפחות צעדים
  const firstOf = new Map(); for (const t of all) if (!firstOf.has(t.fp)) firstOf.set(t.fp, t);
  const improvements = final.filter((t) => t.floor > 0 && firstOf.get(t.fp).floor === 0).map((t) => {
    const o = firstOf.get(t.fp);
    return { fp: t.fp, sig: t.sig.join(',') + '>' + t.out, old: { id: o.id, part: o.part, where: where(o.part), steps: o.steps }, now: { id: t.id, floor: t.floor, form: t.form, steps: t.steps, nodes: t.nParts, does: doesOf(t) }, saved: o.steps - t.steps, pct: Math.round((100 * (o.steps - t.steps)) / o.steps), extra: sameOnExtra(t, (a) => runOne(o, a).v) };
  }).sort((a, b) => b.pct - a.pct || (a.fp < b.fp ? -1 : 1));
  const GENERIC = new Set(['convert', 'normalize', 'map', 'format', 'round', 'tier', 'clamp', 'ratio', 'gap', 'combine', 'offset', 'split', 'join']);
  const special = final.filter((t) => t.floor > 0 && (t.names || []).some((n) => !GENERIC.has(n.verb)));
  const shelfFiles = {};
  const fls = [...new Set(final.map((t) => t.floor))].sort((a, b) => a - b);
  for (const f of fls) shelfFiles['floor-' + f + '.json'] = f === 0 ? list(final.filter((t) => t.floor === 0).map(entry)) : rows(final.filter((t) => t.floor === f));
  shelfFiles['named.json'] = list(special.map(entry));
  shelfFiles['improved.json'] = list(improvements.map((r) => entry(byId.get(r.now.id))));
  // רכיבים שהוחלפו בדרך אבל עדיין בשרשרת של דבר שנשאר — כדי ש"ממה הוא בנוי" יהיה שלם
  const need = new Set(); const walk = (id) => { if (need.has(id)) return; need.add(id); for (const c of byId.get(id).of) walk(c); };
  for (const t of final) walk(t.id);
  for (const r of improvements) need.add(r.old.id); // והחלק המקורי שהשיפור החליף
  const gone = all.filter((t) => need.has(t.id) && shelf.get(t.fp) !== t);
  shelfFiles['replaced.json'] = list(gone.map((t) => (t.floor === 0 ? entry(t) : Object.fromEntries(COLS.map((c, k) => [c, rowOf(t)[k]])))));
  shelfFiles['parts.json'] = JSON.stringify(Object.fromEntries(Object.keys(partIx).sort().map((k) => [k, partIx[k]])), null, 1) + '\n';

  for (const F of floors) F.named = final.filter((t) => t.floor === F.floor && t.names?.length).length;
  for (const F of floors) F.namedSpecial = final.filter((t) => t.floor === F.floor && (t.names || []).some((n) => !GENERIC.has(n.verb))).length;
  const ledger = {
    about: 'נבנה ע״י catalog/grow/grow.mjs — לא לערוך ביד. "צעדים" = lib/steps.mjs על סט-הקלטים הקבוע (lib.mjs › VALUES); בלי שעון. שמות כלליים (GENERIC) נספרים אבל לא נחשבים "שם מיוחד"',
    budget: BUD, world: L.SEMS, forms: Object.keys(L.FORMS), generic: [...GENERIC],
    floors, reachedFloor: floors[floors.length - 1].floor,
    shelf: final.length, named: final.filter((t) => t.names?.length).length, namedSpecial: special.length + final.filter((t) => t.floor === 0 && (t.names || []).some((n) => !GENERIC.has(n.verb))).length,
    totalBuilt: floors.reduce((a, F) => a + F.built, 0), realCalls,
    namedBy: countBy(final.flatMap((t) => (t.names || []).map((n) => n.verb)), (v) => v),
    deniedBy: countBy(final.flatMap((t) => (t.denied || []).map((d) => d.verb + ' · ' + d.why.split(',')[0])), (v) => v),
    twinsFloor0: replacements.filter((r) => r.floor === 0).length,
    replacedInGrowth: replacements.filter((r) => r.floor > 0).length,
    improvements,
    discover,
  };
  return { ledger: JSON.stringify(ledger, null, 1) + '\n', shelfFiles };
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

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const t0 = Date.now();
  const check = process.argv.includes('--check');
  const { ledger, shelfFiles } = await grow({ log: check ? () => {} : (s) => console.log(s + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's') });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const cur = fs.existsSync(SHELF) ? fs.readdirSync(SHELF).filter((f) => f.endsWith('.json')).sort() : [];
  if (check) {
    const rd = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
    const stale = rd(LEDGER) !== ledger || J(cur) !== J(Object.keys(shelfFiles).sort()) || cur.some((f) => rd(path.join(SHELF, f)) !== shelfFiles[f]);
    if (stale) { console.error('catalog/grow: ledger.json / shelf/ לא זהים להרצה חוזרת — הריצו node catalog/grow/grow.mjs'); process.exit(1); }
    console.log('✓ catalog/grow: הרצה חוזרת ⇒ אותו פנקס ואותו מדף · ' + secs + 's');
    process.exit(0);
  }
  fs.mkdirSync(SHELF, { recursive: true });
  for (const f of cur) if (!shelfFiles[f]) fs.unlinkSync(path.join(SHELF, f));
  for (const [f, t] of Object.entries(shelfFiles)) fs.writeFileSync(path.join(SHELF, f), t);
  fs.writeFileSync(LEDGER, ledger);
  console.log('🌱 נכתב · ' + secs + 's');
}
