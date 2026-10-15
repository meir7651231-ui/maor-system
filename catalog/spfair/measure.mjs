/**
 * ⚖️ SP-FAIR — כלי-המדידה (לא חלק מהמנוע; נטען רק אחרי שהמנוע סיים).
 *
 * לכל מטרה (targets.mjs) ולכל דבר על המדף בחתימה שלה:
 *   1. **סט-הליבה** — סט-הקלטים הקבוע של המנוע (L.samplesOf), בלי רשימות של פחות מ-2 איברים (כמו closeness של המנוע):
 *      כל פלט חייב להיות זהה (L.sameOut — 12 ספרות משמעותיות) למטרה. זה "100%".
 *   2. **לחץ** — 12 קלטי-הלחץ של המנוע (L.stressSamples) + 16 משלנו (רשימות 40–500, ±10^15, שליליים, כפולים, הכול-שווה)
 *      + 200 קלטים אקראיים (L.extraSamples). בכל מקום שהמטרה מוגדרת — הדבר חייב לרוץ ולהחזיר אותו דבר.
 *   3. **לא עטיפה** — אף צאצא של הדבר (עץ ה-of) לא זהה למטרה בסט-הליבה; אחרת זו עטיפה של מה שכבר היה.
 * מה שעבר את שלושתם = "נבנה בדיוק". נרשם ממה נבנה: צורה, שרטוט (מקור: קוד / הצלחה / הצלחה-של-שרטוט, עומק), המרכיבים.
 * כמעט-פגיעות (100% בליבה, נפל בלחץ) נרשמות בנפרד, עם הקלט הראשון שבו נפל.
 */
export function ownStress() {
  let s = 0x5f417 >>> 0;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const ri = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const out = [];
  for (const n of [40, 100, 250, 500]) {
    out.push(Array.from({ length: n }, () => ri(-9, 9))); // קטנים, הרבה כפולים
    out.push(Array.from({ length: n }, () => (r() < 0.5 ? 1e15 : -1e15) * (r() < 0.5 ? 1 : 0.5) + ri(-1000, 1000))); // ענקיים ושליליים
    out.push(Array.from({ length: n }, () => -ri(1, 1e6))); // כולם שליליים
    out.push(Array.from({ length: n }, (_, k) => (k % 3 ? 7 : -7))); // שני ערכים בלבד
  }
  return out.map((xs) => [xs]);
}

/** דוגמאות קלט⇒פלט לדוח (פלט הדבר מול המטרה). */
export const EXAMPLES = [[6, 1, 9, 1, 3, 7, 2], [-4, 10, -4, 2.5]];
const KEY = (t) => t.sig.join(',') + '>' + t.out;

/**
 * @param {object} o — { R (runtime של המנוע), L (catalog/grow/lib.mjs), things, shelf, bpById, targets, thingSteps }
 * @returns {{ hits: object[], near: object[], best: object }}
 */
export function scanTargets({ R, L, things, shelf, bpById = new Map(), targets, thingSteps }) {
  const hits = []; const near = []; const best = {};
  const final = [...shelf.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const bySig = new Map();
  for (const t of final) { const k = KEY(t); if (!bySig.has(k)) bySig.set(k, []); bySig.get(k).push(t); }
  const stressCache = new Map();
  for (const T of targets) {
    const [ins] = T.sig.split('>'); const sig = ins.split(',');
    const S = R.samplesOf(sig);
    const core = S.map((a, k) => k).filter((k) => S[k].every((x) => !Array.isArray(x) || x.length >= 2));
    const want = S.map((a) => T.f(...a));
    const coreOf = (t) => { let hit = 0; for (const k of core) if (t.outs[k] !== null && want[k] !== null && L.sameOut(t.outs[k], want[k])) hit++; else if (want[k] === null && t.outs[k] === null) hit++; return hit / core.length; };
    if (!stressCache.has(T.sig)) stressCache.set(T.sig, [...R.stressOf(sig), ...ownStress(), ...L.extraSamples(sig)]);
    const ST = stressCache.get(T.sig);
    const wantST = ST.map((a) => T.f(...a));
    const desc = (t, acc = new Set()) => { for (const id of t.of || []) { const c = things.get(id); if (c && !acc.has(c.id)) { acc.add(c.id); desc(c, acc); } } return acc; };
    let b = null;
    for (const t of bySig.get(T.sig) || []) {
      const c = coreOf(t);
      if (!b || c > b.c || (c === b.c && t.id < b.id)) b = { c, id: t.id };
      if (c < 1) continue;
      let fail = null; let ran = 0;
      for (let k = 0; k < ST.length; k++) {
        if (wantST[k] === null) continue;
        const o = R.runOne(t, ST[k], thingSteps).v;
        if (o === null) { fail = fail || { at: k, why: 'לא רץ', len: ST[k][0].length }; continue; }
        ran++;
        if (!L.sameOut(o, wantST[k])) { fail = fail || { at: k, why: 'פלט שונה', len: ST[k][0].length, got: brief(o), want: brief(wantST[k]) }; }
      }
      const wrap = [...desc(t)].map((id) => things.get(id)).filter((c) => c.sig.join(',') === ins && c.out === T.sig.split('>')[1] && coreOf(c) === 1).map((c) => c.id);
      const rec = { target: T.id, he: T.he, known: !!T.known, ...describe(t, things, bpById), example: EXAMPLES.map((xs) => ({ in: xs, out: R.runOne(t, [xs], thingSteps).v, want: T.f(xs) })), ...(wrap.length ? { wrapperOf: wrap.slice(0, 3) } : {}) };
      if (fail) near.push({ ...rec, stressFail: fail, stressRan: ran });
      else if (!wrap.length) hits.push(rec);
      else near.push({ ...rec, why: 'עטיפה' });
    }
    best[T.id] = b ? { pct: Math.round(100 * b.c), id: b.id } : { pct: null };
  }
  return { hits, near, best };
}

function brief(v) { return Array.isArray(v) ? (v.length > 4 ? { len: v.length, head: v.slice(0, 3) } : v) : v; }

/** ממה נבנה הדבר: קומה/צורה, שרטוט (מקור, עומק), המרכיבים. */
export function describe(t, things, bpById) {
  const kid = (id) => { const c = things.get(id); return c ? { id, form: c.form, ...(c.part ? { part: c.part } : {}), ...(c.names?.length ? { verbs: c.names.map((n) => n.verb) } : {}) } : { id }; };
  const out = { id: t.id, floor: t.floor, form: t.form, steps: t.steps, nodes: t.nParts };
  if (t.part) out.part = t.part;
  if (t.bp) {
    const b = bpById.get(t.bp);
    out.blueprint = { id: b.id, source: b.source, depth: b.depth, origin: b.origin, excl: b.excl };
    out.fill = (t.fill || []).map(kid);
  } else out.of = (t.of || []).map(kid);
  return out;
}

/** הדבר הזה — לאיזו מטרה הוא הכי קרוב (אחוז בסט-הליבה), ומה הוא מחזיר על הדוגמאות. לדוח של "בונה מעל מה שבנה". */
export function closestTarget({ R, L, t, targets, thingSteps }) {
  let best = null;
  for (const T of targets) {
    if (T.sig !== KEY(t)) continue;
    const S = R.samplesOf(t.sig);
    const core = S.map((a, k) => k).filter((k) => S[k].every((x) => !Array.isArray(x) || x.length >= 2));
    let hit = 0; for (const k of core) { const w = T.f(...S[k]); if ((w === null && t.outs[k] === null) || (w !== null && t.outs[k] !== null && L.sameOut(t.outs[k], w))) hit++; }
    const pct = Math.round((100 * hit) / core.length);
    if (!best || pct > best.pct) best = { target: T.id, pct };
  }
  const ex = t.sig.length === 1 && t.sig[0] === 'nums' ? EXAMPLES.map((xs) => ({ in: xs, out: R.runOne(t, [xs], thingSteps).v })) : [{ in: null, out: null, note: 'חתימה ' + KEY(t) }];
  return { ...(best || {}), example: ex };
}
