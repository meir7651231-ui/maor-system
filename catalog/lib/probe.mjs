/**
 * 🔬 קורא-ההתנהגות (CATALOG-VERBS, 14.10.2026) — מריץ חלק על קלטים עם זרע ובודק אילו פעלים הוא מקיים.
 *
 * לא מסתכלים על השם ולא על העולם שבשבילו החלק נבנה — רק על מה שהוא **עושה**: מייצרים קלטים לפי הצורה (shape.mjs),
 * קוראים לחלק (call — בארגז-חול, ראו sandbox.mjs), ומריצים את החוקים של כל פועל (verbs.mjs) על כל קישור אפשרי
 * ("איזה קלט הוא הרשימה, איזה הוא המפתח"). פועל "מתקיים" רק אם **כל** החוקים שלו עברו על **כל** המקרים שחלו (n/n),
 * היו מספיק מקרים, ונמצא מקרה-עד שהוא לא טריוויאלי. בלי זה — לא מדביקים תווית.
 *
 * טהור ודטרמיניסטי: אותו חלק + אותו זרע ⇒ אותה תווית. בלי שעון ובלי I/O (הקריאה לחלק מוזרקת).
 */
import { gen, hintOf, canon, same, isArr, isNum, isStr, isObj, isNil, classOf, toNum, axisClass } from './shape.mjs';
import { VERBS, PRIMARY_ORDER, IMPLIES } from './verbs.mjs';

export const PROBE = { CASES: 24, MIN_FIT: 4, MIN_PASS: 3, LAW_CASES: 12, SWEEP_GROUPS: 3, SWEEP_POINTS: 16, MIN_SWEEP: 6 };

class CallFail extends Error {}

/** fnv-1a קצר — לטביעת-התנהגות ולזרעים. */
export function fnvHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/* ═══════════════ קישורים: איזה קלט משחק איזה תפקיד ═══════════════ */

const timeLike = (v, d) => { const c = classOf(v); return c === 'isodt' || c === 'date' || (c === 'num' && ((d && d.h === 'ms') || Math.abs(v) > 1e11)); };
const someArgs = (cases, k, pred) => cases.some((c) => pred(c.args[k], c));
const argIdx = (sig) => sig.takes.map((_, k) => k);

/** שני קלטים "מאותו סוג": אותה צורה (ובאובייקט — אותו שם-טיפוס). */
function sameDesc(a, b) {
  if (!a || !b) return false;
  const live = (d) => (d.t === 'or' ? d.of.filter((x) => x.t !== 'null' && x.t !== 'undef') : [d]);
  const la = live(a); const lb = live(b);
  if (la.length !== 1 || lb.length !== 1) return canon(a) === canon(b);
  const x = la[0]; const y = lb[0];
  const t = (d) => (d.t === 'int' ? 'num' : d.t);
  if (t(x) !== t(y)) return x.t === 'any' || y.t === 'any';
  if (x.t === 'obj') return (x.n ?? '') === (y.n ?? '') && x.n !== undefined;
  if (x.t === 'arr') return sameDesc(x.of, y.of);
  return true;
}

/** כל הקישורים של פועל לחלק: [{i, j?}]. */
function bindingsFor(verb, sig, cases) {
  const ks = argIdx(sig);
  const arrArgs = ks.filter((k) => someArgs(cases, k, isArr));
  const numArgs = ks.filter((k) => someArgs(cases, k, isNum));
  const out = [];
  switch (verb.bind) {
    case 'list>list': case 'list>any': case 'flags': return arrArgs.map((i) => ({ i }));
    case 'list+key': case 'list+any>list': for (const i of arrArgs) for (const j of ks) if (j !== i) out.push({ i, j }); return out;
    case 'text+list': for (const i of ks.filter((k) => someArgs(cases, k, isStr))) for (const j of arrArgs) if (j !== i) out.push({ i, j }); return out;
    case 'num>num': return numArgs.map((i) => ({ i }));
    case 'x>x': case 'x>any': return ks.filter((k) => someArgs(cases, k, (v) => !isNil(v) && typeof v !== 'boolean')).map((i) => ({ i }));
    case 'str>any': return ks.filter((k) => someArgs(cases, k, isStr)).map((i) => ({ i }));
    case 'time>any': return ks.filter((k) => someArgs(cases, k, (v) => timeLike(v, sig.takes[k].d))).map((i) => ({ i }));
    case 'rec>str': return ks.filter((k) => someArgs(cases, k, isObj)).map((i) => ({ i }));
    case 'any>any': return [{ i: -1 }];
    case 'x+x>any': for (const i of ks) for (const j of ks) if (i < j && sameDesc(sig.takes[i].d, sig.takes[j].d) && someArgs(cases, i, (v, c) => !isNil(v) && classOf(v) === classOf(c.args[j]))) out.push({ i, j }); return out;
    case 'x+n>x': for (const i of ks) for (const j of numArgs) if (i !== j) out.push({ i, j }); return out;
    case 'tier': return ks.filter((k) => someArgs(cases, k, (v) => axisClass(classOf(v)) && (verb.axis !== 'time' || timeLike(v, sig.takes[k].d) || classOf(v) === 'iso'))).map((i) => ({ i }));
    case 'divide': {
      for (const i of arrArgs) out.push({ i });
      for (const i of numArgs) for (const j of numArgs) if (i !== j) out.push({ i, j });
      for (const i of ks.filter((k) => someArgs(cases, k, isObj))) out.push({ i });
      return out;
    }
    default: return out;
  }
}

/** האם מקרה מתאים לקישור (לפני ה-fit של הפועל). */
function baseFit(verb, b, c) {
  const x = c.args[b.i]; const y = b.j != null ? c.args[b.j] : undefined; const o = c.out;
  switch (verb.bind) {
    case 'list>list': case 'list+any>list': return isArr(x) && isArr(o);
    case 'list>any': case 'list+key': return isArr(x);
    case 'flags': return isArr(x) && x.length > 0 && x.every((v) => typeof v === 'boolean') && isArr(o);
    case 'text+list': return isStr(x) && isArr(y) && y.length > 0;
    case 'num>num': return isNum(x) && isNum(o);
    case 'x>x': { const cx = classOf(x); return cx !== 'nil' && cx !== 'bool' && cx === classOf(o); }
    case 'x>any': return !isNil(x) && typeof x !== 'boolean';
    case 'str>any': return isStr(x);
    case 'time>any': return !isNil(o);
    case 'rec>str': return isObj(x) && isStr(o);
    case 'any>any': return true;
    case 'x+x>any': return !isNil(x) && !isNil(y);
    case 'x+n>x': { const cx = classOf(x); return cx !== 'nil' && cx !== 'bool' && cx !== 'str' && isNum(y) && Number.isInteger(y) && cx === classOf(o) && (cx !== 'arr' || (x.length > 0 && x.every(isNum))); }
    case 'tier': { const co = classOf(o); return axisClass(classOf(x)) && (co === 'num' || co === 'str' || co === 'iso' || co === 'hhmm'); }
    case 'divide': {
      if (!isArr(o) || !o.length) return false;
      if (b.j != null) return isNum(x) && isNum(y) && o.every(isNum);
      if (isArr(x)) return o.every(isArr);
      return isObj(x) && o.every((p) => isObj(p) || isArr(p));
    }
    default: return false;
  }
}

/* ═══════════════ סריקה: אותו מקרה, קלט אחד משתנה ═══════════════ */

function sweepValues(x0, d, r, B) {
  const c = classOf(x0);
  const vals = [];
  const h = d?.h ?? '';
  if (d && d.t === 'int' && d.hi - d.lo <= 40) { for (let v = d.lo; v <= d.hi; v++) vals.push(v); return vals; }
  for (let k = 0; k < PROBE.SWEEP_POINTS; k++) {
    if (c === 'num') {
      if (h === 'ms' || Math.abs(x0) > 1e11) vals.push(x0 + r.int(-4320, 4320) * 60_000);
      else if (h === 'amount') vals.push(r.pick([0, 1, r.int(1, 99) / 100, r.int(1, 999), r.int(1000, 99999), r.int(1, 9999999) / 100, -r.int(1, 999)]));
      else if (h === 'count') vals.push(r.int(0, 40));
      else {
        const s = Math.max(10, Math.abs(x0));
        let v = x0 + (r.next() * 6 - 3) * s;
        if (x0 >= 0) v = Math.abs(v);
        vals.push(Number.isInteger(x0) ? Math.round(v) : Math.round(v * 1000) / 1000);
      }
    } else if (c === 'iso') vals.push(new Date(Date.parse(x0 + 'T12:00:00Z') + r.int(-400, 400) * 86_400_000).toISOString().slice(0, 10));
    else if (c === 'hhmm') vals.push(String(r.int(0, 23)).padStart(2, '0') + ':' + String(r.int(0, 59)).padStart(2, '0'));
    else if (c === 'isodt') vals.push(new Date(Date.parse(x0) + r.int(-4320, 4320) * 60_000).toISOString());
    else if (c === 'date') vals.push({ $$: 'date', v: x0.v + r.int(-4320, 4320) * 60_000 });
    else if (c === 'str') vals.push(B.heWord(r, 1, 12));
    else vals.push(gen(d, r, B, 0));
  }
  return vals;
}

/* ═══════════════ הבדיקה ═══════════════ */

/** קלטים למקרה אחד. קלט אופציונלי (עם ברירת-מחדל) — בחצי מהמקרים לא נשלח, כמו אצל הקוראים האמיתיים. */
export function argsOf(sig, r, B) {
  const Bc = { ...B, tpick: new Map() };
  return sig.takes.map((t) => (t.opt && r.bool(0.5) ? { $$: 'undef' } : gen(t.d, r, Bc, 0, hintOf(t.name))));
}

/**
 * @param {{ sig: {takes: {name:string, d:object, kind?:string}[], mod?:number}, call: (args:any[]) => ({v:any}|{err:string}|{async:true}), seed: number, B: object, verbs?: object[] }} o
 */
export function probePart({ sig, call, seed, B, verbs = VERBS }) {
  const r0 = B.rng(seed);
  const genArgs = (r) => argsOf(sig, r, B);
  const cases = [];
  let errs = 0; let calls = 0;
  const f = (args) => {
    calls++;
    const res = call(args);
    if (res.async) throw new CallFail('async');
    if ('err' in res) throw new CallFail(res.err);
    return res.v;
  };
  const n = sig.takes.length === 0 ? 3 : PROBE.CASES;
  let sawAsync = false;
  // קודם הדוגמאות האמיתיות (מהבדיקות, דרך המפקד), אחר כך קלטים מחוללים
  const seeds = (sig.seeds ?? []).filter((a) => Array.isArray(a) && a.length === sig.takes.length).slice(0, 6);
  for (let k = 0; k < n; k++) {
    const args = k < seeds.length ? seeds[k] : genArgs(r0);
    const res = call(args); calls++;
    if (res.async) { sawAsync = true; break; }
    if ('err' in res) { errs++; continue; }
    cases.push({ args, out: res.v });
  }
  if (sawAsync) return { status: 'async', calls };
  if (cases.length < Math.min(n, PROBE.MIN_FIT)) return { status: 'no-fitting-input', ok: cases.length, errors: errs, calls };
  for (const c of cases.slice(0, 4)) {
    let again;
    try { again = f(c.args); } catch { return { status: 'nondeterministic', calls }; }
    if (!same(again, c.out)) return { status: 'nondeterministic', calls };
  }

  // תצורת-ברירת-המחדל: כל הקלטים האופציונליים לא נשלחים (כך רוב הקוראים משתמשים בחלק)
  let dcases = null;
  const defaults = () => {
    if (dcases) return dcases;
    dcases = [];
    if (!sig.takes.some((t) => t.opt)) return dcases;
    const rd = B.rng(seed ^ 0x2f6b);
    for (let k = 0; k < 16; k++) {
      const Bc = { ...B, tpick: new Map() };
      const args = sig.takes.map((t) => (t.opt ? { $$: 'undef' } : gen(t.d, rd, Bc, 0, hintOf(t.name))));
      const res = call(args); calls++;
      if (!res.async && !('err' in res)) dcases.push({ args, out: res.v });
    }
    return dcases;
  };
  const held = [];
  for (const verb of verbs) {
    if (verb.staticOnly) continue;
    let got = null;
    for (const cs of [cases, null]) {
      const use = cs ?? defaults();
      if (!use.length) continue;
      for (const b of bindingsFor(verb, sig, use)) {
        if (cs === null && b.i >= 0 && sig.takes[b.i]?.opt) continue;
        const g = tryVerb(verb, b, sig, use, f, seed, B);
        if (g) { got = { ...g, b, dflt: cs === null }; break; }
      }
      if (got) break;
    }
    if (got) {
      const { b } = got;
      const h = { id: verb.id, on: b.i < 0 ? '*' : [sig.takes[b.i]?.name, b.j != null ? sig.takes[b.j]?.name : null].filter(Boolean).join('+'), holds: got.pass + '/' + got.n, i: b.i };
      if (got.dflt) h.config = 'defaults';
      held.push(h);
    }
  }
  const ids = new Set(held.map((h) => h.id));
  for (const [k, vs] of Object.entries(IMPLIES)) if (ids.has(k)) for (const v of vs) ids.delete(v);
  const primary = PRIMARY_ORDER.find((v) => ids.has(v)) ?? null;
  return {
    status: 'ran', calls, ok: cases.length, errors: errs,
    verbs: held.map(({ i: _i, ...h }) => (ids.has(h.id) ? h : { ...h, implied: true })),
    primary, primaryArg: held.find((h) => h.id === primary)?.i ?? null,
    traits: traitsOf(sig, cases, f, B.rng(seed ^ 0x5bd1e995), B),
  };
}

function tryVerb(verb, b, sig, cases, f, seed, B) {
  const rep = evalVerb(verb, b, sig, cases, f, seed, B, false);
  return rep && rep.held ? { pass: rep.pass, n: rep.n } : null;
}

/**
 * הערכת פועל אחד בקישור אחד. `report` ⇒ בלי עצירה מוקדמת, עם פירוט לכל חוק (לבדיקות: "החוק נושך").
 * מחזיר null כשאין מספיק מקרים מתאימים.
 */
export function evalVerb(verb, b, sig, cases, f, seed, B, report = true) {
  const notes = new Set();
  function env(c, r) {
    const e = {
      args: c.args, out: c.out, i: b.i, j: b.j, x: c.args[b.i], y: b.j != null ? c.args[b.j] : undefined, first: cases[0].out,
      f, B, mod: sig.mod ?? 0, u: !!sig.takes[b.i]?.d?.u, r,
      put: (v, k = b.i) => { const a = c.args.slice(); a[k] = v; return a; },
      fresh: (k = b.i) => gen(sig.takes[k].d, e.r, { ...B, tpick: new Map() }, 0, hintOf(sig.takes[k].name)),
      /** רשימה חדשה לאותו קלט; ברשימה "ייחודית" (u) — בלי פריטים שכבר ב-x, כדי ששרשור לא יבלע אותם */
      freshList: () => { const v = e.fresh(); if (!isArr(v) || !e.u || !isArr(e.x)) return v; const seen = new Set(e.x.map(canon)); return v.filter((y) => !seen.has(canon(y))); },
      note: (t) => { notes.add(t); },
    };
    return e;
  }
  const fit = cases.filter((c) => { try { return baseFit(verb, b, c) && (!verb.fit || verb.fit(env(c, B.rng(3)))); } catch { return false; } });
  if (fit.length < (cases[0].args.length === 0 ? 1 : PROBE.MIN_FIT)) return null;
  let pass = 0; let tot = 0; let held = true;
  const laws = {};
  const lawSeed = (lawId, k) => (seed ^ Math.imul(k + 1, 0x9e3779b1) ^ fnvHash(lawId)) >>> 0;
  const groups = [];
  const needSweep = verb.laws.some((l) => l.sweep) || verb.sweepWitness || verb.bind === 'tier';
  if (needSweep) {
    // הסריקה מתחילה ממקרים שהקלט שלהם מהסוג השכיח (תאריך כשרוב הקלטים תאריכים) — לא מקלט-זבל שנפל לברירת-מחדל
    const cnt = new Map();
    for (const c of fit) { const k = classOf(c.args[b.i]); cnt.set(k, (cnt.get(k) ?? 0) + 1); }
    const major = [...cnt.entries()].sort((p, q) => q[1] - p[1])[0]?.[0];
    for (const c of fit.filter((c) => classOf(c.args[b.i]) === major).slice(0, PROBE.SWEEP_GROUPS)) {
      const r = B.rng(lawSeed('sweep', groups.length));
      let xs = sweepValues(c.args[b.i], sig.takes[b.i]?.d, r, B);
      // זוגות צמודים (x ו-x+ε): מעגל אמיתי שולח את שניהם לאותה שנתה (לא בתחום של שלמים — שם אין "צמוד")
      if (verb.sweepJitter && sig.takes[b.i]?.d?.t !== 'int') xs = xs.flatMap((x) => (isNum(x) ? [x, x + 1e-4 * Math.max(1, Math.abs(x))] : [x]));
      const seen = new Set(); const pts = [];
      for (const x of [c.args[b.i], ...xs]) {
        const k = canon(x); if (seen.has(k)) continue; seen.add(k);
        try { const a = c.args.slice(); a[b.i] = x; const o = f(a); if (verb.bind === 'num>num' && !isNum(o)) continue; pts.push({ x, out: o }); } catch { /* מחוץ לתחום */ }
      }
      if (pts.length < PROBE.MIN_SWEEP) continue;
      if (axisClass(classOf(pts[0].x))) pts.sort((p, q) => toNum(p.x) - toNum(q.x));
      groups.push({ c, pts });
    }
  }
  for (const law of verb.laws) {
    const L = (laws[law.id] = { pass: 0, fail: 0, na: 0, why: null });
    const one = (e) => {
      const v = runLaw(law, e);
      if (v === null) { L.na++; return true; }
      tot++;
      if (v !== true) { L.fail++; L.why ??= v; return false; }
      L.pass++; pass++;
      return true;
    };
    if (law.sweep) {
      for (let g = 0; g < groups.length; g++) {
        const e = env(groups[g].c, B.rng(lawSeed(law.id, g)));
        e.sweep = groups[g].pts;
        if (!one(e) && !report) return { held: false, pass, n: tot, laws };
      }
      if (L.pass < 2) held = false;
    } else {
      let k = 0;
      for (const c of fit.slice(0, PROBE.LAW_CASES)) {
        if (!one(env(c, B.rng(lawSeed(law.id, k++)))) && !report) return { held: false, pass, n: tot, laws };
      }
      if (L.pass < Math.min(PROBE.MIN_PASS, fit.length)) held = false;
    }
    if (L.fail) held = false;
    if (!held && !report) return { held: false, pass, n: tot, laws };
  }
  // עד: מקרה שמראה שהחלק לא טריוויאלי (לא זהות, לא קבוע, לא ריק)
  let wit = true;
  if (verb.witnessAll) wit = verb.witnessAll(fit);
  else if (verb.sweepWitness) wit = groups.some((g) => verb.sweepWitness(g.pts));
  else if (verb.witnessNote) wit = notes.has(verb.witnessNote);
  else if (verb.witness) {
    wit = false;
    if (verb.bind === 'tier') wit = groups.some((g) => { const e = env(g.c, B.rng(1)); e.sweep = g.pts; return safe(() => verb.witness(e)); });
    else for (const c of fit) { if (safe(() => verb.witness(env(c, B.rng(2))))) { wit = true; break; } }
  }
  // הפלט חייב להשתנות בין המקרים, ולהיות תלוי בקלט שקושר (אחרת כל פונקציה "קבועה" הייתה מקיימת חוקים בחינם)
  let dep = true;
  if (held && wit && !verb.noDep) {
    if (fit.length > 1 && fit.every((c) => same(c.out, fit[0].out))) dep = false;
    else if (b.i >= 0) {
      dep = false;
      const r = B.rng(lawSeed('dep', 0));
      for (const c of fit.slice(0, 8)) {
        const a = c.args.slice(); a[b.i] = gen(sig.takes[b.i].d, r, B, 0, hintOf(sig.takes[b.i].name));
        if (same(a[b.i], c.args[b.i])) continue;
        try { if (!same(f(a), c.out)) { dep = true; break; } } catch { /* מחוץ לתחום */ }
      }
    }
  }
  return { held: held && wit && dep, witness: wit, dep, pass, n: tot, laws, fit: fit.length };
}

/** כל הקישורים של פועל לחלק (לבדיקות). */
export function bindingsOf(verb, sig, cases) { return bindingsFor(verb, sig, cases); }

/** מקרי-הבסיס של חלק (לבדיקות): אותם קלטים שה-probe מייצר. */
export function baseCases(sig, call, seed, B) {
  const r0 = B.rng(seed);
  const cases = [];
  const n = sig.takes.length === 0 ? 3 : PROBE.CASES;
  for (let k = 0; k < n; k++) {
    const args = argsOf(sig, r0, B);
    const res = call(args);
    if (!res.async && !('err' in res)) cases.push({ args, out: res.v });
  }
  return cases;
}

/** call ⇒ f: מחזיר ערך או זורק (קריאה שנכשלה = חוק שנכשל). */
export function fOf(call) {
  return (args) => {
    const res = call(args);
    if (res.async) throw new CallFail('async');
    if ('err' in res) throw new CallFail(res.err);
    return res.v;
  };
}

/** קריאה ישירה לפונקציה JS (בלי ארגז-חול) — למימושי-הייחוס ולמוטנטים. */
export function directCall(fn) {
  const enc = (v) => JSON.parse(JSON.stringify(v === undefined ? { $$: 'undef' } : v, (_k, x) => (x === undefined ? { $$: 'undef' } : typeof x === 'number' && !Number.isFinite(x) ? (Number.isNaN(x) ? { $$: 'nan' } : { $$: 'inf', s: Math.sign(x) }) : x)));
  return (args) => {
    try { return { v: enc(fn(...JSON.parse(JSON.stringify(args)))) }; } catch (err) { return { err: String(err && err.message) }; }
  };
}

function safe(fn) { try { return !!fn(); } catch { return false; } }
function runLaw(law, e) {
  try { return law.check(e); } catch (err) { return err instanceof CallFail ? 'זרק: ' + err.message : 'שגיאת-חוק: ' + (err && err.message); }
}

/* ═══════════════ תכונות: חתימת-התנהגות לחלקים שלא מתאימים לשום פועל ═══════════════ */

const CLS = (v) => { const c = classOf(v); return c === 'iso' || c === 'hhmm' || c === 'isodt' ? 'time' : c; };
/** חתימה גסה: מה נכנס, מה יוצא, ואיך הפלט מתנהג. שני חלקים עם אותה חתימה = אותו "סוג פעולה" (מועמד לפועל חדש). */
function traitsOf(sig, cases, f, r, B) {
  const outC = [...new Set(cases.map((c) => CLS(c.out)))].sort();
  const inC = sig.takes.map((_, k) => { const s = [...new Set(cases.map((c) => CLS(c.args[k])))].filter((x) => x !== 'nil').sort(); return s.length ? s.join('|') : 'nil'; });
  const constant = cases.every((c) => same(c.out, cases[0].out));
  // רגישות: האם החלפת קלט אחד משנה את הפלט
  const sens = sig.takes.map((t, k) => {
    let changed = 0; let tried = 0;
    for (const c of cases.slice(0, 6)) {
      const a = c.args.slice(); a[k] = gen(t.d, r, B, 0, hintOf(t.name));
      if (same(a[k], c.args[k])) continue;
      tried++;
      try { if (!same(f(a), c.out)) changed++; } catch { changed++; }
    }
    return tried ? (changed ? 1 : 0) : 0;
  });
  // גודל הפלט מול רשימת-הקלט הראשונה
  const li = sig.takes.findIndex((_, k) => cases.some((c) => isArr(c.args[k])));
  let len = '-';
  if (li >= 0 && cases.every((c) => !isArr(c.args[li]) || isArr(c.out))) {
    const rel = new Set(cases.filter((c) => isArr(c.args[li]) && isArr(c.out)).map((c) => Math.sign(c.out.length - c.args[li].length)));
    len = rel.size === 1 ? ['<', '=', '>'][[...rel][0] + 1] : rel.size ? '~' : '-';
  }
  // תת-קבוצה: כל איברי הפלט היו בקלט
  let sub = 0;
  if (li >= 0 && cases.some((c) => isArr(c.out) && c.out.length)) {
    sub = cases.every((c) => !isArr(c.out) || !isArr(c.args[li]) || c.out.every((v) => c.args[li].some((w) => same(v, w)))) ? 1 : 0;
  }
  // רשומה ⇒ רשומה: האם הפלט מרחיב את הקלט (כל השדות + עוד), מקרין (חלק מהשדות), או בונה חדש
  let rec = '';
  const oi = sig.takes.findIndex((_, k) => cases.some((c) => isObj(c.args[k])));
  const ro = cases.filter((c) => oi >= 0 && isObj(c.args[oi]) && isObj(c.out));
  if (ro.length) {
    const rel = ro.map((c) => { const ik = Object.keys(c.args[oi]); const ok = new Set(Object.keys(c.out)); const all = ik.every((k) => ok.has(k)); return all && ok.size > ik.length ? 'ext' : all ? 'same' : ik.some((k) => ok.has(k)) ? 'part' : 'new'; });
    rec = rel.every((x) => x === rel[0]) ? rel[0] : 'mix';
  }
  // מספרים: תמיד שלמים? תמיד לא-שליליים?
  const nums = cases.map((c) => c.out).filter(isNum);
  const num = nums.length >= Math.max(3, cases.length / 2) ? (nums.every(Number.isInteger) ? 'int' : 'real') + (nums.every((v) => v >= 0) ? '+' : '') : '';
  return { in: inC, out: outC, constant: constant ? 1 : 0, sens, len, sub, rec, num };
}

/** מפתח-קבוצה מחתימה גסה (למועמדי-פעלים): בלי שמות-שדות, רק צורה והתנהגות. */
export function traitKey(t) {
  if (!t) return null;
  const ins = t.in.map((c, k) => (t.sens[k] ? c : '·')).filter((c) => c !== '·');
  return 'in[' + ins.join(',') + ']>' + t.out.join('|') + (t.constant ? ' const' : '') + (t.len !== '-' ? ' len' + t.len : '') + (t.sub ? ' ⊆' : '') + (t.rec ? ' rec:' + t.rec : '') + (t.num ? ' ' + t.num : '');
}

/* ═══════════════ טביעת-התנהגות: אותה צורה + אותם פלטים ⇒ אותה פעולה בדיוק ═══════════════ */

export function behaviorHash(sig, call, B) {
  const shapeKey = canon(sig.takes.map((t) => [t.d, hintOf(t.name)]));
  const r = B.rng(fnvHash(shapeKey));
  const outs = [];
  const ins = [];
  for (let k = 0; k < 24; k++) {
    const args = argsOf(sig, r, B);
    ins.push(args);
    const res = call(args);
    outs.push(res.async ? 'async' : 'err' in res ? '!' : canon(res.v));
  }
  // טביעה רק להתנהגות שאומרת משהו: לא כשהכול נכשל, לא כשהפלט קבוע/ריק, ולא כשהפלט = הקלט (זהות על קלטים שלא בתחום)
  const ok = outs.filter((o) => o !== '!' && o !== 'async');
  const EMPTY = new Set(['null', '[]', '{}', '""', 'false', '0', '{"$$":"undef"}']);
  if (ok.length < 4 || new Set(ok).size < 2 || ok.every((o) => EMPTY.has(o)) || ins.every((a, k) => outs[k] === canon(a[0]))) return null;
  return (fnvHash(shapeKey).toString(16) + '-' + fnvHash(outs.join('\n')).toString(16));
}

export { isArr, isNum, isStr };
