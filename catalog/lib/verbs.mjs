/**
 * 🔤 אלפבית-הפעלים (CATALOG-VERBS, 14.10.2026) — רשימה קטנה וקבועה של פעולות בלי עולם.
 *
 * הבעלים: "מכונה שבונה כל דבר משילוב חלקים קטנים". "מחלק" מחלק שעות-תפילה, תשלומי-תרומה ומשיכות-כנף של דרקון —
 * אותה פעולה. הבקשה מביאה את העולם (חמנייה, רמזור, דרקון); החלק מביא רק את הפעולה.
 *
 * כל פועל: מזהה · שם-פועל עברי · משמעות בשורה · צורת קלט/פלט (בסוגי-הקטלוג) · **חוקים שאפשר להריץ**.
 * חוק = בדיקת-תכונה שחורה (black-box): מקבל מקרה (`e`) ומחזיר true (עבר) / null (לא חל) / משפט (מה נשבר).
 * לכל חוק יש "מוטנט" — מימוש מקולקל שהחוק חייב לתפוס (הבדיקה מוכיחה שהחוק נושך).
 * 8 פעלי-הארגז מצביעים גם על 30 החוקים של המאמת (`boxLaws` — src/lib/atoms/verify/laws.ts) שרצים על החלקים עצמם.
 * פועל בלי חוק חד ⇒ `staticOnly` (מזוהה רק משם/חתימה).
 *
 * הסביבה `e` (נבנית ב-probe.mjs): args · out · i · j · x=args[i] · y=args[j] · f(args)⇒ערך (זורק=כישלון) ·
 * put(v,k=i)⇒args חדשים · fresh(k=i)⇒ערך-חדש לקלט k · r (rng עם זרע) · B (הגשר) · mod · sweep=[{x,out}] (רק בחוקי-סריקה).
 * טהור: בלי שעון, בלי I/O.
 */
import { canon, same, isArr, isNum, isStr, isObj, isNil, classOf, toNum, axisClass, numEq, isSubseq, isPerm, shuffle, cat, entriesOf } from './shape.mjs';

/* ═══════════════ עזרים ═══════════════ */

const FAIL = (s) => s;
const numsEq = (a, b, mod) => isNum(a) && isNum(b) && numEq(a, b, mod);
const isScalar = (v) => { const c = classOf(v); return c === 'num' || c === 'str' || c === 'iso' || c === 'hhmm' || c === 'isodt' || c === 'bool'; };
/** קבוצות מתוך פלט-קיבוץ: מערך-של-מערכים · אובייקט/מפה שערכיו מערכים. */
function groupsOf(out) {
  if (isArr(out) && out.length && out.every(isArr)) return out;
  if (isArr(out) && out.length && out.every((g) => isObj(g) && Object.values(g).filter(isArr).length === 1)) return out.map((g) => Object.values(g).find(isArr));
  const ent = entriesOf(out);
  if (ent && ent.length && ent.every(([, v]) => isArr(v))) return ent.map(([, v]) => v);
  return null;
}
/** קטעים מתוך פלט: {from,to} · {start,end} · [s,e] · שני השדות המספריים הראשונים. */
function spanOf(o) {
  if (isArr(o) && o.length === 2 && o.every(isNum)) return { s: o[0], e: o[1] };
  if (!isObj(o)) return null;
  for (const [a, b] of [['from', 'to'], ['start', 'end'], ['s', 'e'], ['lo', 'hi'], ['startMin', 'endMin'], ['fromMin', 'toMin']]) {
    if (a in o && b in o) { const s = toNum(o[a]); const e = toNum(o[b]); if (Number.isFinite(s) && Number.isFinite(e)) return { s, e }; }
  }
  return null;
}
const spansOf = (out) => (isArr(out) && out.length && out.every((x) => spanOf(x)) ? out.map(spanOf) : null);
/** טקסט-החיפוש של מועמד: מחרוזת, או text/name/title/label, או השדה-הטקסטואלי הראשון. */
function textOf(c) {
  if (isStr(c)) return c;
  if (!isObj(c)) return null;
  for (const k of ['text', 'name', 'title', 'label']) if (isStr(c[k]) && c[k].trim()) return c[k];
  const v = Object.values(c).find((x) => isStr(x) && x.trim().length >= 3 && !/^\d/.test(x) && !/^id\d/.test(x));
  return v ?? null;
}
/** האם תוצאת-חיפוש מכילה את המועמד c (הוא עצמו, המזהה שלו, או הטקסט). */
function hits(result, c) {
  const keys = [canon(c)];
  if (isObj(c)) for (const k of ['id', 'key', 'text', 'name']) if (c[k] != null) keys.push(canon(c[k]));
  const has = (v) => keys.includes(canon(v));
  if (isArr(result)) return result.some((v) => has(v) || (isObj(v) && (has(v.id) || has(v.item) || has(v.c) || has(v.candidate))));
  if (isObj(result) && (has(result.id) || has(result.item))) return true;
  return has(result);
}
const isEmptyish = (v) => isNil(v) || (isArr(v) && v.length === 0) || v === false || v === '';
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
/** מנה של קבוצות (קבוצת-קבוצות קנונית) — לבדיקת קיבוץ שלא תלוי בסדר. */
const partitionKey = (gs) => gs.map((g) => g.map(canon).sort().join('|')).sort().join('‖');
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h.toString(16).padStart(8, '0'); };
const counter = (fn) => { let c = 0; return (...a) => fn(c++, ...a); };

/* ═══════════════ צורות-ייחוס ═══════════════ */

const NUMS = { t: 'arr', of: { t: 'int', lo: -20, hi: 60 } };
const INT = { t: 'int', lo: -50, hi: 120 };
const STR = { t: 'str', h: 'he' };
const AMOUNT = { t: 'num', h: 'amount' };

/* ═══════════════ הפעלים ═══════════════ */

/** @type {import('./verbs').Verb[]} */
export const VERBS = [
  /* ─────────── 8 פעלי-הארגז ─────────── */
  {
    id: 'divide', noDep: true, he: 'מחלק', box: true,
    means: 'מחלק שלם לחלקים שווים: טווח לחתיכות, סכום לתשלומים, רשימה לדפים — ושום דבר לא הולך לאיבוד',
    takes: ['span|amount|list', 'number'], gives: 'sequence',
    bind: 'divide',
    witness: (e) => isArr(e.out) && e.out.length >= 2,
    laws: [
      {
        id: 'divide.cover', says: 'החלקים מרכיבים בחזרה את השלם: הרשימה המשורשרת = המקור · סכום-התשלומים = הסכום · החתיכות מכסות את הטווח מתחילתו ועד סופו בלי חפיפה',
        check: (e) => {
          const o = e.out;
          if (!isArr(o)) return FAIL('הפלט לא רשימה');
          if (isArr(e.x)) return o.every(isArr) ? (same(o.flat(), e.x) ? true : FAIL('השרשור ≠ המקור')) : null;
          if (isNum(e.x)) return o.every(isNum) ? (numsEq(sum(o), e.x, e.mod) ? true : FAIL('סכום החלקים ' + sum(o) + ' ≠ ' + e.x)) : null;
          const w = spanOf(e.x); const ps = spansOf(o);
          if (!w || !ps) return null;
          if (!ps.length) return true;
          if (Math.abs(ps[0].s - w.s) > 1e-9) return FAIL('החלק הראשון לא מתחיל בהתחלה');
          for (let k = 0; k < ps.length; k++) {
            if (ps[k].e < ps[k].s - 1e-9) return FAIL('חלק הפוך');
            if (ps[k].e > w.e + 1e-9) return FAIL('חלק חורג מהסוף');
            if (k && ps[k].s < ps[k - 1].e - 1e-9) return FAIL('חפיפה');
          }
          return true;
        },
      },
      {
        id: 'divide.equal', says: 'החלקים שווים ככל האפשר: בסכום — עד שלושה גדלים והפער ביניהם קטן מחלק אחד (השארית מתפזרת), ברשימה/בטווח — כולם באותו גודל ורק האחרון קצר יותר',
        check: (e) => {
          const o = e.out;
          if (!isArr(o) || o.length < 2) return null;
          if (o.every(isNum)) {
            const a = o.map(Math.abs);
            const vals = [...new Set(o.map((v) => canon(v)))];
            if (vals.length > 3) return FAIL('יותר משלושה גדלים: ' + vals.slice(0, 4).join(', '));
            const spread = Math.max(...a) - Math.min(...a);
            const pos = a.filter((v) => v > 0);
            const allowed = (isNum(e.x) ? Math.abs(e.x) / o.length : 0) + (pos.length ? Math.min(...pos) : 0) + 1e-9;
            return spread <= allowed ? true : FAIL('הפער בין החלקים (' + spread + ') גדול מחלק שלם');
          }
          const lens = o.every(isArr) ? o.map((g) => g.length) : spansOf(o)?.map((p) => p.e - p.s);
          if (!lens) return null;
          const first = lens[0];
          for (let k = 0; k < lens.length - 1; k++) if (Math.abs(lens[k] - first) > 1e-9 * Math.max(1, first)) return FAIL('חלק ' + k + ' בגודל ' + lens[k] + ' ולא ' + first);
          const last = lens[lens.length - 1];
          if (last > first + 1e-9 || (o.every(isArr) && last === 0)) return FAIL('האחרון גדול מהשאר או ריק');
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'total', d: AMOUNT }, { name: 'parts', d: { t: 'int', lo: 1, hi: 12 } }], fn: (B) => (t, n) => B.divideAmount(t, n, 0.01) },
    mutants: {
      'divide.cover': (B) => (t, n) => B.divideAmount(t, n, 0.01).slice(0, Math.max(1, n - 1)).concat(n > 1 ? [0] : []),
      'divide.equal': () => (t, n) => (n <= 1 ? [t] : [Math.round((t - (n - 1)) * 100) / 100, ...Array(n - 1).fill(1)]),
    },
    boxLaws: 'divide',
    cues: { en: ['divide', 'split', 'chunk', 'paginate', 'installments', 'slots', 'portion', 'share', 'segment', 'partition'], he: ['מחלק', 'מפצל', 'מקצה'] },
  },
  {
    id: 'merge', noDep: true, he: 'מחבר רצפים', box: true,
    means: 'מוצא רצפים של פריטים "כן" צמודים ומחזיר כל רצף כקטע אחד (שבת ליד חג = חלון אחד; לילות פנויים ברצף)',
    takes: ['sequence'], gives: 'sequence',
    bind: 'flags',
    witness: (e) => isArr(e.out) && e.out.length >= 1 && spansOf(e.out)?.some((p) => p.e > p.s),
    laws: [
      {
        id: 'merge.ordered', says: 'הקטעים לפי הסדר ולא חופפים',
        check: (e) => {
          const ps = isArr(e.out) && e.out.length === 0 ? [] : spansOf(e.out);
          if (!ps) return FAIL('הפלט לא רשימת קטעים');
          for (let k = 0; k < ps.length; k++) {
            if (ps[k].e < ps[k].s) return FAIL('קטע הפוך');
            if (k && ps[k].s <= ps[k - 1].e) return FAIL('קטעים חופפים או לא לפי הסדר');
          }
          return true;
        },
      },
      {
        id: 'merge.ends', says: 'כל קטע מתחיל ונגמר בפריט "כן"',
        check: (e) => {
          const ps = spansOf(e.out);
          if (!ps) return isArr(e.out) && !e.out.length ? true : FAIL('הפלט לא רשימת קטעים');
          for (const p of ps) {
            const endOn = e.x[p.e] === true || (e.x[p.e] !== true && e.x[p.e - 1] === true && p.e > p.s);
            if (e.x[p.s] !== true || !endOn) return FAIL('קטע ' + p.s + '–' + p.e + ' לא נשען על "כן"');
          }
          return true;
        },
      },
      {
        id: 'merge.maximal', says: 'אי אפשר להאריך קטע: הפריט שלפניו והפריט שאחריו הם "לא" (או סוף)',
        check: (e) => {
          const ps = spansOf(e.out);
          if (!ps) return isArr(e.out) && !e.out.length ? true : FAIL('הפלט לא רשימת קטעים');
          for (const p of ps) {
            const incl = e.x[p.e] === true;
            const after = incl ? p.e + 1 : p.e;
            if (e.x[p.s - 1] === true || e.x[after] === true) return FAIL('קטע ' + p.s + '–' + p.e + ' נעצר ליד "כן"');
          }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'flags', d: { t: 'arr', of: { t: 'bool' }, max: 14 } }], fn: (B) => (fl) => B.mergeRuns(fl) },
    mutants: {
      'merge.ordered': (B) => (fl) => B.mergeRuns(fl).reverse(),
      'merge.ends': (B) => (fl) => B.mergeRuns(fl).map((r) => ({ ...r, from: Math.max(0, r.from - 1) })),
      'merge.maximal': (B) => (fl) => B.mergeRuns(fl).flatMap((r) => (r.to > r.from ? [{ from: r.from, to: r.from, length: 1 }, { from: r.from + 1 + 1 <= r.to ? r.from + 2 : r.to, to: r.to, length: 1 }] : [r])),
    },
    boxLaws: 'merge',
    cues: { en: ['merge', 'runs', 'coalesce', 'contiguous', 'streak', 'consecutive', 'blocks', 'windows'], he: ['מאחד', 'ממזג', 'רצף', 'מחבר'] },
  },
  {
    id: 'next', noDep: true, he: 'מוצא את הבא בתור', box: true,
    means: 'מתוך רשימת רגעים/ערכים — מה הבא אחרי "עכשיו" (התפילה הבאה, התשלום הבא, הלילה הפנוי הבא)',
    takes: ['times|list', 'times'], gives: 'times',
    bind: 'list+key',
    fit: (e) => isArr(e.x) && e.x.length > 0 && e.x.every((v) => axisClass(classOf(v)) && classOf(v) === classOf(e.y)) && (isArr(e.out) || isNil(e.out) || classOf(e.out) === classOf(e.y)),
    witness: (e) => !isEmptyish(e.out) && e.x.some((v) => toNum(v) < toNum(e.y)),
    laws: [
      { id: 'next.member', says: 'מה שהוחזר נמצא ברשימה', check: (e) => { const o = isArr(e.out) ? e.out : isNil(e.out) ? [] : [e.out]; return o.every((v) => e.x.some((w) => same(v, w))) ? true : FAIL('הוחזר ערך שלא ברשימה'); } },
      { id: 'next.after', says: 'מה שהוחזר לא לפני "עכשיו"', check: (e) => { const o = isArr(e.out) ? e.out : isNil(e.out) ? [] : [e.out]; const now = toNum(e.y); return o.every((v) => toNum(v) >= now) ? true : FAIL('הוחזר רגע שעבר'); } },
      {
        id: 'next.nearest', says: 'אין ברשימה רגע שבא אחרי "עכשיו" ולפני מה שהוחזר (ובכמה — לפי הסדר)',
        check: (e) => {
          const o = isArr(e.out) ? e.out : isNil(e.out) ? [] : [e.out];
          const now = toNum(e.y);
          const later = e.x.map(toNum).filter((v) => v >= now).sort((a, b) => a - b);
          const got = o.map(toNum);
          for (let k = 1; k < got.length; k++) if (got[k] < got[k - 1]) return FAIL('לא לפי הסדר');
          if (!got.length) return later.length ? FAIL('יש רגע הבא ולא הוחזר') : true;
          for (let k = 0; k < got.length; k++) if (got[k] !== later[k]) return FAIL('דילג על ' + later[k]);
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'times', d: { t: 'arr', of: { t: 'int', lo: 0, hi: 1440 }, max: 8 } }, { name: 'now', d: { t: 'int', lo: 0, hi: 1440 } }], fn: (B) => (t, now) => B.nextAfter(t, now, 1) },
    mutants: {
      'next.member': (B) => (t, now) => B.nextAfter(t, now, 1).map((v) => v + 0.5),
      'next.after': () => (t, now) => { const b = t.filter((v) => v < now); return b.length ? [Math.max(...b)] : []; },
      'next.nearest': () => (t, now) => { const a = t.filter((v) => v >= now); return a.length ? [Math.max(...a)] : []; },
    },
    boxLaws: 'next',
    cues: { en: ['next', 'upcoming', 'following', 'after', 'soonest', 'nearest', 'first'], he: ['הבא', 'הקרוב', 'הבאה'] },
  },
  {
    id: 'round', noDep: true, he: 'מעגל', box: true, sweepJitter: true,
    means: 'מקרב ערך לשנתה הקרובה (לרבע שקל, לחמש דקות, לעשרה) — ושוב-עיגול לא משנה',
    takes: ['number|amount|times'], gives: 'number',
    bind: 'num>num',
    witness: (e) => !numsEq(e.out, e.x),
    laws: [
      { id: 'round.idem', says: 'לעגל פעמיים = לעגל פעם אחת', check: (e) => (numsEq(e.f(e.put(e.out)), e.out, e.mod) ? true : FAIL('עיגול שני שינה')) },
      { id: 'round.monotone', sweep: true, says: 'ערך גדול יותר לא מתעגל לקטן יותר', check: (e) => { for (let k = 1; k < e.sweep.length; k++) if (e.sweep[k].out < e.sweep[k - 1].out - 1e-9) return FAIL('ירידה אחרי ' + e.sweep[k - 1].x); return true; } },
      {
        id: 'round.grid', sweep: true, says: 'התוצאות יושבות על שנתות: שני ערכים צמודים מאוד יוצאים אותו דבר, והמרווח בין תוצאות הוא כפולה של שנתה אחת',
        check: (e) => {
          const outs = [...new Set(e.sweep.map((p) => p.out))].sort((a, b) => a - b);
          const ins = new Set(e.sweep.map((p) => p.x));
          if (outs.length >= ins.size) return FAIL('כל ערך יצא שונה — אין שנתות');
          let g = 0;
          for (let k = 1; k < outs.length; k++) g = fgcd(g, outs[k] - outs[0]);
          // השנתה חייבת להיות גסה יותר מהמרווח הקטן בין הקלטים (בשלמים: לפחות 2) — אחרת זה לא עיגול
          const xs = [...ins].sort((a, b) => a - b);
          let dx = Infinity;
          for (let k = 1; k < xs.length; k++) if (xs[k] > xs[k - 1]) dx = Math.min(dx, xs[k] - xs[k - 1]);
          const eps = Math.max(...e.sweep.map((p) => 1e-4 * Math.max(1, Math.abs(p.x))));
          return outs.length < 2 || (g >= eps && g > dx * 1.5) ? true : FAIL('השנתה ' + g + ' לא גסה מהקלטים');
        },
      },
    ],
    ref: { sig: [{ name: 'value', d: { t: 'num' } }], fn: (B) => (v) => B.roundTo(v, 5, 'nearest') },
    mutants: {
      'round.idem': (B) => (v) => B.roundTo(v + 2.6, 5, 'nearest'),
      'round.monotone': (B) => (v) => (v > 50 ? -B.roundTo(v, 5, 'nearest') : B.roundTo(v, 5, 'nearest')),
      'round.grid': () => (v) => v,
    },
    boxLaws: 'round',
    cues: { en: ['round', 'snap', 'floor', 'ceil', 'quantize', 'nearest'], he: ['מעגל', 'מקרב'] },
  },
  {
    id: 'offset', noDep: true, he: 'מזיז', box: true,
    means: 'מזיז ערך על הציר שלו בכמות נתונה (תאריך + ימים, שעה + דקות, מספר + הפרש) — הזזה ב-0 לא עושה כלום',
    takes: ['times|date|number', 'number'], gives: 'times',
    bind: 'x+n>x',
    witness: (e) => !same(e.out, e.x),
    laws: [
      { id: 'offset.zero', says: 'הזזה באפס מחזירה את אותו ערך', check: (e) => { const z = e.f(e.put(0, e.j)); return same(z, e.x) || (isNum(z) && numsEq(z, e.x, e.mod)) ? true : FAIL('הזזה ב-0 שינתה'); } },
      {
        id: 'offset.compose', says: 'להזיז ב-א ואז ב-ב = להזיז בבת אחת ב-א+ב',
        check: (e) => {
          const b = e.r.int(-30, 30);
          const two = e.f(Object.assign(e.put(e.out), { [e.j]: b }));
          const one = e.f(e.put(e.y + b, e.j));
          return same(two, one) || (isNum(two) && numsEq(two, one, e.mod)) || (isArr(two) && isArr(one) && two.length === one.length && two.every((v, k) => numsEq(v, one[k], e.mod))) ? true : FAIL('שתי הזזות ≠ הזזה אחת');
        },
      },
    ],
    ref: { sig: [{ name: 'times', d: { t: 'arr', of: { t: 'int', lo: 0, hi: 1440 } } }, { name: 'minutes', d: { t: 'int', lo: -120, hi: 120 } }], fn: (B) => (t, m) => B.offsetAll(t, m) },
    mutants: {
      'offset.zero': (B) => (t, m) => B.offsetAll(t, m + 1),
      'offset.compose': (B) => (t, m) => B.offsetAll(t, m * 2 + (m ? 1 : 0)),
    },
    boxLaws: 'offset',
    cues: { en: ['add', 'shift', 'offset', 'plus', 'minus', 'move', 'advance', 'delay', 'addDays', 'addMonths', 'addMinutes'], he: ['מזיז', 'מוסיף', 'מקדים', 'דוחה'] },
  },
  {
    id: 'escalate', noDep: true, he: 'מסלים בזמן', box: true,
    means: 'ככל שעובר זמן — עולה בשלבים (קודם לבעלי-מקצוע, אחרי 3 שעות לכולם) ולא חוזר אחורה. "מדרג" שהציר שלו הוא זמן',
    takes: ['times'], gives: 'choice',
    bind: 'tier', axis: 'time',
    witness: (e) => new Set(e.sweep.map((p) => canon(p.out))).size >= 2,
    laws: [
      { id: 'escalate.blocks', sweep: true, says: 'כל שלב תופס קטע-זמן רציף אחד (לא קופץ הלוך-חזור)', check: (e) => blocksLaw(e) },
      { id: 'escalate.few', sweep: true, says: 'מעט שלבים — לא שלב חדש בכל רגע', check: (e) => fewLaw(e) },
      { id: 'escalate.forward', sweep: true, says: 'עם הזמן השלב רק עולה', check: (e) => { const o = e.sweep.map((p) => p.out); if (!o.every(isNum)) return null; for (let k = 1; k < o.length; k++) if (o[k] < o[k - 1]) return FAIL('ירד משלב ' + o[k - 1] + ' ל-' + o[k]); return true; } },
    ],
    ref: { sig: [{ name: 'nowMs', d: { t: 'num', h: 'ms' } }], fn: (B) => (now) => B.escalationState({ createdMs: Date.UTC(2026, 9, 14, 6), steps: [{ to: ['a'], waitMin: 180 }, { to: ['b'], waitMin: 60 }, { to: ['c'], waitMin: 30 }], nowMs: now }).stepIndex },
    mutants: {
      'escalate.blocks': () => (now) => Math.floor(now / 3_600_000) % 2,
      'escalate.few': () => (now) => Math.floor(now / 60_000),
      'escalate.forward': (B) => (now) => 2 - B.escalationState({ createdMs: Date.UTC(2026, 9, 14, 6), steps: [{ to: ['a'], waitMin: 180 }, { to: ['b'], waitMin: 60 }, { to: ['c'], waitMin: 30 }], nowMs: now }).stepIndex,
    },
    boxLaws: 'escalate',
    cues: { en: ['escalate', 'escalation', 'overdue', 'stage', 'urgency', 'sla', 'reminder', 'late'], he: ['מסלים', 'הסלמה', 'מזכיר', 'דחוף'] },
  },
  {
    id: 'rotate', noDep: true, he: 'מחלק בתורות', box: true,
    means: 'עובר על רשימה בתורות קבועות (מי בתורנות היום, את מי שואלים עכשיו) — אחרי סיבוב שלם חוזרים להתחלה וכולם קיבלו תור',
    takes: ['list', 'number|date'], gives: 'choice',
    bind: 'list+key', keyInt: true,
    fit: (e) => isArr(e.x) && e.x.length >= 1 && (Number.isInteger(e.y) || classOf(e.y) === 'iso') && !isArr(e.out),
    witness: (e) => e.x.length >= 2 && new Set(e.x.map(canon)).size === e.x.length,
    laws: [
      { id: 'rotate.member', says: 'התור תמיד נופל על מישהו מהרשימה', check: (e) => (e.x.some((v) => same(v, e.out)) ? true : FAIL('הוחזר מי שלא ברשימה')) },
      {
        id: 'rotate.period', says: 'אחרי סיבוב שלם (כמספר האנשים) חוזרים לאותו אחד',
        check: (e) => {
          const n = e.x.length;
          const k2 = classOf(e.y) === 'iso' ? isoPlus(e.y, n) : e.y + n;
          return same(e.f(e.put(k2, e.j)), e.out) ? true : FAIL('אחרי ' + n + ' תורות לא חזר');
        },
      },
      {
        id: 'rotate.fair', says: 'בסיבוב שלם כל אחד מקבל בדיוק תור אחד',
        check: (e) => {
          const n = e.x.length;
          if (new Set(e.x.map(canon)).size !== n) return null;
          const got = [];
          for (let k = 0; k < n; k++) got.push(e.f(e.put(classOf(e.y) === 'iso' ? isoPlus(e.y, k) : e.y + k, e.j)));
          return isPerm(got, e.x) ? true : FAIL('בסיבוב לא כולם קיבלו תור');
        },
      },
    ],
    ref: { sig: [{ name: 'list', d: { t: 'arr', of: { t: 'str', h: 'id' }, u: true, max: 7 } }, { name: 'n', d: { t: 'int', lo: -40, hi: 400 } }], fn: (B) => (l, n) => B.turnOf(l, n) },
    mutants: {
      'rotate.member': () => (l, n) => (l.length ? l[((n % l.length) + l.length) % l.length] + '!' : null),
      'rotate.period': () => (l, n) => (l.length ? l[Math.max(0, Math.min(l.length - 1, n))] : null),
      'rotate.fair': () => (l) => (l.length ? l[0] : null),
    },
    boxLaws: 'rotate',
    cues: { en: ['rotate', 'turn', 'roundrobin', 'round-robin', 'duty', 'shift', 'cycle', 'fair', 'rotation', 'who'], he: ['תורות', 'בתורות', 'תורנות', 'בתורו', 'מסובב'] },
  },
  {
    id: 'fuzzy', noDep: true, he: 'מוצא גם עם טעות', box: true,
    means: 'מחפש מילה ברשימה וסולח על טעות-הקלדה אחת ("אינסטלתור" ⇒ אינסטלטור), אבל לא ממציא התאמה למילה רחוקה',
    takes: ['text', 'list'], gives: 'list',
    bind: 'text+list',
    laws: [
      { id: 'fuzzy.exact', says: 'מילה שכתובה בדיוק — נמצאת', check: (e) => fuzzyCase(e, 'exact') },
      { id: 'fuzzy.typo', says: 'טעות-הקלדה אחת במילה ארוכה — עדיין נמצאת', check: (e) => fuzzyCase(e, 'typo') },
      { id: 'fuzzy.far', says: 'מילה בלי שום אות משותפת — לא נמצאת', check: (e) => fuzzyCase(e, 'far') },
    ],
    ref: { sig: [{ name: 'query', d: STR }, { name: 'candidates', d: { t: 'arr', of: { t: 'obj', p: [['id', { t: 'str', h: 'id' }, false], ['text', STR, false]] }, max: 6 } }], fn: (B) => (q, c) => B.fuzzyFind(q, c) },
    mutants: {
      'fuzzy.exact': () => () => [],
      'fuzzy.typo': () => (q, cs) => cs.filter((c) => String(c.text).split(' ').includes(q)).map((c) => c.id),
      'fuzzy.far': () => (q, cs) => cs.map((c) => c.id),
    },
    boxLaws: 'fuzzy',
    cues: { en: ['fuzzy', 'search', 'match', 'typo', 'levenshtein', 'similar', 'suggest', 'autocomplete'], he: ['מחפש', 'מוצא', 'חיפוש'] },
  },

  /* ─────────── רשימה ⇒ רשימה ─────────── */
  {
    id: 'sort', he: 'ממיין', means: 'מסדר את אותם פריטים לפי סדר קבוע — אותם פריטים, רק בסדר אחר, והסדר לא תלוי באיך שהגיעו',
    takes: ['list'], gives: 'sequence', bind: 'list>list',
    witness: (e) => !same(e.out, e.x),
    laws: [
      { id: 'sort.perm', says: 'אותם פריטים בדיוק — שום דבר לא נוסף ולא נעלם', check: (e) => (isPerm(e.out, e.x) ? true : FAIL('לא אותם פריטים')) },
      { id: 'sort.order-free', says: 'ערבוב הקלט לא משנה את התוצאה', check: (e) => (e.x.length < 2 ? null : same(e.f(e.put(shuffle(e.x, e.r))), e.out) ? true : FAIL('ערבוב שינה את הסדר')) },
      {
        id: 'sort.consistent', says: 'הסדר עקבי: אחרי הוספת פריטים, הישנים נשארים באותו סדר ביניהם',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const big = e.f(e.put(cat(e.x, b, e.u)));
          if (!isArr(big)) return FAIL('הפלט לא רשימה');
          const mine = new Map();
          for (const v of e.x) mine.set(canon(v), (mine.get(canon(v)) ?? 0) + 1);
          const proj = big.filter((v) => { const c = canon(v); const n = mine.get(c); if (!n) return false; mine.set(c, n - 1); return true; });
          return same(proj, e.out) ? true : FAIL('הסדר בין הישנים השתנה');
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => [...xs].sort((a, b) => a - b) },
    mutants: {
      'sort.perm': () => (xs) => [...xs].sort((a, b) => a - b).slice(0, -1),
      'sort.order-free': () => (xs) => [...xs],
      'sort.consistent': () => (xs) => [...xs].sort((a, b) => (xs.length % 2 ? a - b : b - a)),
    },
    cues: { en: ['sort', 'sorted', 'order', 'orderby', 'rank', 'ranked', 'byDate', 'by'], he: ['ממיין', 'מסדר', 'מדרג'] },
  },
  {
    id: 'filter', he: 'מסנן', means: 'משאיר רק את מה שעובר תנאי — כל פריט נבחן לבד, והסדר נשמר',
    takes: ['list'], gives: 'list', bind: 'list>list',
    witness: (e) => e.out.length < e.x.length && e.out.length > 0,
    laws: [
      { id: 'filter.subseq', says: 'כל מה שיצא היה בקלט, באותו סדר', check: (e) => (isSubseq(e.out, e.x) ? true : FAIL('יצא פריט שלא היה, או בסדר אחר')) },
      {
        id: 'filter.split', says: 'לסנן שתי רשימות ביחד = לסנן כל אחת לבד ולחבר (כל פריט נבחן לבד)',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const both = e.f(e.put(cat(e.x, b, e.u)));
          const fb = e.f(e.put(b));
          return isArr(both) && isArr(fb) && same(both, e.out.concat(fb)) ? true : FAIL('הסינון של המחובר ≠ חיבור הסינונים');
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => xs.filter((v) => v > 10) },
    mutants: {
      'filter.subseq': () => (xs) => xs.filter((v) => v > 10).map((v) => v + 1),
      'filter.split': () => (xs) => xs.filter((v) => v > 10).slice(0, 2),
    },
    cues: { en: ['filter', 'only', 'where', 'select', 'active', 'visible', 'eligible', 'pending', 'open', 'without', 'exclude', 'keep'], he: ['מסנן', 'משאיר', 'מוציא'] },
  },
  {
    id: 'dedupe', he: 'מסיר כפולים', means: 'משאיר כל דבר פעם אחת — שכפול הקלט לא משנה כלום',
    takes: ['list'], gives: 'list', bind: 'list>list',
    witness: (e) => e.out.length > 0,
    laws: [
      { id: 'dedupe.subseq', says: 'מה שיצא היה בקלט, באותו סדר', check: (e) => (isSubseq(e.out, e.x) ? true : FAIL('יצא פריט שלא היה, או בסדר אחר')) },
      { id: 'dedupe.double', says: 'לשכפל את הקלט (כל פריט פעמיים) — אותה תוצאה', check: (e) => (e.x.length && !e.u ? (same(e.f(e.put(e.x.concat(e.x))), e.out) ? true : FAIL('השכפול שינה')) : null) },
      { id: 'dedupe.idem', says: 'להסיר כפולים פעמיים = פעם אחת', check: (e) => (same(e.f(e.put(e.out)), e.out) ? true : FAIL('הסרה שנייה שינתה')) },
      { id: 'dedupe.keeps', says: 'כשאין כפולים — הכול נשאר', check: (e) => (new Set(e.x.map(canon)).size !== e.x.length ? null : same(e.out, e.x) ? true : FAIL('הוסר פריט שאינו כפול')) },
    ],
    ref: { sig: [{ name: 'xs', d: { t: 'arr', of: { t: 'int', lo: 0, hi: 6 } } }], fn: () => (xs) => xs.filter((v, k) => xs.indexOf(v) === k) },
    mutants: {
      'dedupe.subseq': () => (xs) => xs.filter((v, k) => xs.indexOf(v) === k).reverse(),
      'dedupe.double': () => (xs) => xs.slice(),
      'dedupe.idem': () => (xs) => { const u = xs.filter((v, k) => xs.indexOf(v) === k); return u.length >= 3 ? u.slice(0, -1) : u; },
      'dedupe.keeps': () => (xs) => xs.filter((v, k) => xs.indexOf(v) === k).slice(0, 2),
    },
    cues: { en: ['dedupe', 'dedup', 'unique', 'uniq', 'distinct', 'duplicates', 'dups'], he: ['כפולים', 'כפילויות', 'ייחודיים'] },
  },
  {
    id: 'reverse', he: 'הופך סדר', means: 'מהסוף להתחלה — הפוך של הפוך = המקור',
    takes: ['list'], gives: 'sequence', bind: 'list>list',
    witness: (e) => e.x.length >= 2 && !same(e.x[0], e.x[e.x.length - 1]),
    laws: [
      { id: 'reverse.involution', says: 'להפוך פעמיים מחזיר את המקור', check: (e) => (same(e.f(e.put(e.out)), e.x) ? true : FAIL('הפוך-של-הפוך ≠ מקור')) },
      {
        id: 'reverse.split', says: 'הפוך של (א ואז ב) = (הפוך ב) ואז (הפוך א)',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const fb = e.f(e.put(b));
          return isArr(fb) && same(e.f(e.put(cat(e.x, b, e.u))), fb.concat(e.out)) ? true : FAIL('החיבור לא התהפך');
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => [...xs].reverse() },
    mutants: { 'reverse.involution': () => (xs) => [...xs].reverse().map((v) => v + 1), 'reverse.split': () => (xs) => [...xs] },
    cues: { en: ['reverse', 'reversed', 'backwards', 'newestFirst'], he: ['הפוך', 'הופך'] },
  },
  {
    id: 'map', he: 'ממיר כל פריט', means: 'עושה את אותו דבר לכל פריט לחוד — אותו אורך, ופריט לא מושפע מהשכנים',
    takes: ['list'], gives: 'list', bind: 'list>list',
    witness: (e) => !same(e.out, e.x) && e.x.length > 0,
    laws: [
      { id: 'map.len', says: 'פריט אחד נכנס — פריט אחד יוצא', check: (e) => (e.out.length === e.x.length ? true : FAIL('אורך ' + e.out.length + ' ≠ ' + e.x.length)) },
      {
        id: 'map.split', says: 'להמיר שתי רשימות ביחד = להמיר כל אחת ולחבר',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const fb = e.f(e.put(b));
          return isArr(fb) && same(e.f(e.put(cat(e.x, b, e.u))), e.out.concat(fb)) ? true : FAIL('תלוי בשכנים');
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => xs.map((v) => v * 2) },
    mutants: { 'map.len': () => (xs) => xs.flatMap((v) => [v * 2, v * 2]), 'map.split': () => (xs) => xs.map((v, k) => v * 2 + k) },
    cues: { en: ['map', 'each', 'all', 'toRows', 'rows', 'convertAll', 'normalizeAll', 'enrich', 'with'], he: ['כל', 'לכל'] },
  },
  {
    id: 'transcript', he: 'רושם ביומן', means: 'מוסיף רשומה אחת ליומן וכל מה שנרשם קודם נשאר כמו שהיה',
    takes: ['list', 'record'], gives: 'list', bind: 'list+any>list',
    witness: (e) => e.x.length >= 1,
    laws: [
      { id: 'transcript.keeps', says: 'היומן הישן נשאר שלם — בתחילת היומן החדש או בסופו', check: (e) => (sideOf(e.out, e.x) ? true : FAIL('משהו ישן השתנה או זז')) },
      { id: 'transcript.one', says: 'נוספה בדיוק רשומה אחת', check: (e) => (e.out.length === e.x.length + 1 ? true : FAIL('נוספו ' + (e.out.length - e.x.length))) },
      {
        id: 'transcript.side', says: 'רישום שני מוסיף באותו צד כמו הראשון',
        check: (e) => {
          const s1 = sideOf(e.out, e.x);
          if (!s1 || e.x.length === 0) return null;
          const out2 = e.f(e.put(e.out));
          const s2 = isArr(out2) && sideOf(out2, e.out);
          return s2 && (s1 === s2 || s1 === 'both' || s2 === 'both') ? true : FAIL('הצד התחלף');
        },
      },
    ],
    ref: { sig: [{ name: 'log', d: { t: 'arr', of: { t: 'int', lo: 0, hi: 99 } } }, { name: 'entry', d: { t: 'int', lo: 100, hi: 999 } }], fn: () => (log, e) => [...log, e] },
    mutants: {
      'transcript.keeps': () => (log, e) => [...log].reverse().concat([e]),
      'transcript.one': () => (log, e) => [...log, e, e],
      'transcript.side': () => (log, e) => (log.length % 2 ? [e, ...log] : [...log, e]),
    },
    cues: { en: ['log', 'append', 'push', 'record', 'audit', 'history', 'transcript', 'journal', 'trail'], he: ['רושם', 'יומן', 'מתעד'] },
  },

  /* ─────────── רשימה ⇒ מבנה/מספר ─────────── */
  {
    id: 'group', he: 'מקבץ', means: 'מחלק פריטים לקבוצות לפי מה שהם (לפי יום, לפי סוג) — כל פריט בקבוצה אחת, והחלוקה לא תלויה בסדר',
    takes: ['list'], gives: 'list', bind: 'list>any',
    fit: (e) => isArr(e.x) && groupsOf(e.out) !== null,
    witness: (e) => { const g = groupsOf(e.out).filter((x) => x.length); return g.length >= 2 && g.some((x) => x.length >= 2); },
    laws: [
      { id: 'group.partition', says: 'כל פריט נמצא בדיוק בקבוצה אחת (מותרות קבוצות ריקות — "תחום בלי עסקים")', check: (e) => (isPerm(groupsOf(e.out).flat(), e.x) ? true : FAIL('פריט חסר או כפול')) },
      { id: 'group.order-free', says: 'ערבוב הקלט לא משנה מי עם מי', check: (e) => { if (e.x.length < 2) return null; const g2 = groupsOf(e.f(e.put(shuffle(e.x, e.r)))); return g2 && partitionKey(g2) === partitionKey(groupsOf(e.out)) ? true : FAIL('הקבוצות השתנו מערבוב'); } },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => { const o = {}; for (const v of xs) (o[v % 2 ? 'odd' : 'even'] ??= []).push(v); return o; } },
    mutants: {
      'group.partition': () => (xs) => { const o = {}; for (const v of xs) (o[v % 2 ? 'odd' : 'even'] ??= []).push(v); if (xs.length) (o.even ??= []).push(xs[0]); return o; },
      'group.order-free': () => (xs) => { const o = []; for (let k = 0; k < xs.length; k += 2) o.push(xs.slice(k, k + 2)); return o; },
    },
    cues: { en: ['group', 'groupBy', 'bucket', 'byDay', 'byMonth', 'byKind', 'byType', 'categorize', 'index', 'keyBy', 'partition', 'cluster'], he: ['מקבץ', 'מקבצת', 'קבוצות', 'מחלק לפי'] },
  },
  {
    id: 'tally', he: 'סופר לפי קבוצה', means: 'כמה מכל סוג — סכום כל המונים = כמה פריטים היו',
    takes: ['list'], gives: 'list', bind: 'list>any',
    fit: (e) => { if (!isArr(e.x)) return false; const ent = entriesOf(e.out); return !!ent && ent.length > 0 && ent.every(([, v]) => Number.isInteger(v) && v >= 0); },
    witness: (e) => entriesOf(e.out).some(([, v]) => v >= 2),
    laws: [
      { id: 'tally.total', says: 'סכום כל המונים = מספר הפריטים', check: (e) => (sum(entriesOf(e.out).map(([, v]) => v)) === e.x.length ? true : FAIL('סכום המונים ≠ ' + e.x.length)) },
      {
        id: 'tally.add', says: 'לספור שתי רשימות ביחד = לספור כל אחת ולחבר מונים',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const tb = entriesOf(e.f(e.put(b)));
          const tab = entriesOf(e.f(e.put(cat(e.x, b, e.u))));
          if (!tb || !tab) return FAIL('הפלט לא מונים');
          const m = new Map();
          for (const [k, v] of [...entriesOf(e.out), ...tb]) m.set(k, (m.get(k) ?? 0) + v);
          const n = new Map(tab);
          for (const [k, v] of m) if (v && (n.get(k) ?? 0) !== v) return FAIL('המונה של ' + k + ' לא מתחבר');
          for (const [k, v] of n) if (v && (m.get(k) ?? 0) !== v) return FAIL('מונה חדש ' + k);
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => { const o = {}; for (const v of xs) o[v % 2 ? 'odd' : 'even'] = (o[v % 2 ? 'odd' : 'even'] ?? 0) + 1; return o; } },
    mutants: {
      'tally.total': () => (xs) => { const o = { all: 1 }; for (const v of xs) o[v % 2 ? 'odd' : 'even'] = (o[v % 2 ? 'odd' : 'even'] ?? 0) + 1; return o; },
      'tally.add': () => (xs) => { const o = {}; xs.forEach((v, k) => { o[k % 2 ? 'odd' : 'even'] = (o[k % 2 ? 'odd' : 'even'] ?? 0) + 1; }); return o; },
    },
    cues: { en: ['countBy', 'tally', 'histogram', 'counts', 'breakdown', 'distribution', 'stats', 'perKind'], he: ['פילוח', 'כמה מכל', 'מונה לפי'] },
  },
  {
    id: 'count', he: 'סופר', means: 'כמה פריטים עונים על משהו — רשימה ריקה = 0, ושתי רשימות = סכום הספירות',
    takes: ['list'], gives: 'number', bind: 'list>any',
    fit: (e) => isArr(e.x) && isNum(e.out),
    witness: (e) => e.out > 0,
    laws: [
      { id: 'count.empty', says: 'ברשימה ריקה — 0', check: (e) => (numsEq(e.f(e.put([])), 0, e.mod) ? true : FAIL('ריק ≠ 0')) },
      { id: 'count.add', says: 'ספירה של שתי רשימות ביחד = סכום הספירות', check: (e) => addLaw(e) },
      { id: 'count.bound', says: 'מספר שלם בין 0 לאורך הרשימה', check: (e) => (Number.isInteger(e.out) && e.out >= 0 && e.out <= e.x.length ? true : FAIL(e.out + ' לא בין 0 ל-' + e.x.length)) },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => xs.filter((v) => v > 10).length },
    mutants: {
      'count.empty': () => (xs) => xs.filter((v) => v > 10).length + 1,
      'count.add': () => (xs) => Math.min(2, xs.filter((v) => v > 10).length),
      'count.bound': () => (xs) => 2 * xs.filter((v) => v > 10).length,
    },
    cues: { en: ['count', 'num', 'total', 'how', 'many', 'size', 'length', 'number'], he: ['סופר', 'מונה', 'כמה'] },
  },
  {
    id: 'sum', he: 'מסכם', means: 'מחבר ערכים לסכום אחד — רשימה ריקה = 0, ושתי רשימות = סכום הסכומים',
    takes: ['list'], gives: 'amount', bind: 'list>any',
    fit: (e) => isArr(e.x) && isNum(e.out),
    witness: (e) => !(Number.isInteger(e.out) && e.out >= 0 && e.out <= e.x.length),
    laws: [
      { id: 'sum.empty', says: 'ברשימה ריקה — 0', check: (e) => (numsEq(e.f(e.put([])), 0, e.mod) ? true : FAIL('ריק ≠ 0')) },
      { id: 'sum.add', says: 'סכום של שתי רשימות ביחד = סכום הסכומים', check: (e) => addLaw(e) },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => sum(xs) },
    mutants: { 'sum.empty': () => (xs) => sum(xs) + 1, 'sum.add': () => (xs) => Math.max(0, sum(xs)) },
    cues: { en: ['sum', 'total', 'totals', 'balance', 'paid', 'revenue', 'income', 'aggregate', 'ils', 'amount'], he: ['מסכם', 'מחשב סכום', 'סך'] },
  },
  {
    id: 'average', he: 'ממצע', means: 'הערך האמצעי של רשימה — שכפול הקלט לא משנה, והממוצע של שתי רשימות נמצא ביניהן',
    takes: ['list'], gives: 'number', bind: 'list>any',
    fit: (e) => isArr(e.x) && e.x.length > 0 && isNum(e.out),
    laws: [
      { id: 'average.double', says: 'שכפול הקלט לא משנה את הממוצע', check: (e) => (e.u ? null : numsEq(e.f(e.put(e.x.concat(e.x))), e.out) ? true : FAIL('השכפול שינה')) },
      {
        id: 'average.between', says: 'הממוצע של שתי רשימות ביחד נמצא בין שני הממוצעים',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b) || !b.length) return null;
          const fb = e.f(e.put(b)); const fab = e.f(e.put(cat(e.x, b, e.u)));
          if (!isNum(fb) || !isNum(fab)) return null;
          const lo = Math.min(e.out, fb); const hi = Math.max(e.out, fb); const t = 1e-9 * Math.max(1, Math.abs(lo), Math.abs(hi));
          if (fab < lo - t || fab > hi + t) return FAIL(fab + ' מחוץ ל-[' + lo + ',' + hi + ']');
          if (fab > lo + t && fab < hi - t) e.note('strict');
          return true;
        },
      },
    ],
    witnessNote: 'strict',
    ref: { sig: [{ name: 'xs', d: { t: 'arr', of: { t: 'int', lo: -20, hi: 60 } } }], fn: () => (xs) => (xs.length ? sum(xs) / xs.length : 0) },
    mutants: { 'average.double': () => (xs) => sum(xs), 'average.between': () => (xs) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0) },
    cues: { en: ['avg', 'average', 'mean', 'median'], he: ['ממוצע', 'ממצע'] },
  },
  {
    id: 'extreme', he: 'בוחר את הקיצוני', means: 'בוחר את הכי (גדול, מוקדם, יקר, חדש) — התשובה של שתי רשימות היא אחת משתי התשובות, והסדר לא משנה',
    takes: ['list'], gives: 'choice', bind: 'list>any',
    fit: (e) => isArr(e.x) && e.x.length > 0 && !isArr(e.out) && !isNil(e.out) && typeof e.out !== 'boolean' && (isScalar(e.out) || e.x.some((v) => same(v, e.out))),
    witness: (e) => e.x.length >= 2,
    laws: [
      {
        id: 'extreme.split', says: 'הכי-של שתי רשימות ביחד = הכי-של אחת מהן',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b) || !b.length) return null;
          const fb = e.f(e.put(b));
          if (isNil(fb)) return null;
          const fab = e.f(e.put(cat(e.x, b, e.u)));
          return same(fab, e.out) || same(fab, fb) ? true : FAIL('התשובה של המחובר לא אחת מהשתיים');
        },
      },
      { id: 'extreme.order-free', says: 'ערבוב הקלט לא משנה את הבחירה', check: (e) => (e.x.length < 2 ? null : same(e.f(e.put(shuffle(e.x, e.r))), e.out) ? true : FAIL('ערבוב שינה')) },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => (xs.length ? Math.max(...xs) : null) },
    mutants: { 'extreme.split': () => (xs) => (xs.length ? sum(xs) / xs.length : null), 'extreme.order-free': () => (xs) => (xs.length ? xs[0] : null) },
    cues: { en: ['max', 'min', 'latest', 'earliest', 'best', 'top', 'last', 'first', 'oldest', 'newest', 'biggest', 'highest', 'lowest', 'peak'], he: ['הכי', 'המקסימום', 'המינימום', 'האחרון', 'הראשון'] },
  },
  {
    id: 'lookup', he: 'מחפש לפי מפתח', means: 'מוצא ברשימה את הפריט הראשון שמתאים — ואם אין, כלום',
    takes: ['list', 'text'], gives: 'record', bind: 'list>any',
    fit: (e) => isArr(e.x) && !isArr(e.out) && typeof e.out !== 'boolean',
    witness: (e) => !isNil(e.out),
    laws: [
      { id: 'lookup.member', says: 'מה שנמצא הוא פריט מהרשימה (או כלום)', check: (e) => (isNil(e.out) || e.x.some((v) => same(v, e.out)) ? true : FAIL('נמצא פריט שלא ברשימה')) },
      {
        id: 'lookup.first', says: 'ברשימה מחוברת — הראשון שמתאים: אם נמצא בחלק הראשון, הוא; אחרת מהחלק השני',
        check: (e) => {
          const b = e.freshList();
          if (!isArr(b)) return null;
          const fb = e.f(e.put(b));
          const fab = e.f(e.put(cat(e.x, b, e.u)));
          const want = isNil(e.out) ? fb : e.out;
          return same(isNil(fab) ? null : fab, isNil(want) ? null : want) ? true : FAIL('לא הראשון שמתאים');
        },
      },
    ],
    ref: { sig: [{ name: 'xs', d: NUMS }], fn: () => (xs) => xs.find((v) => v > 40) ?? null },
    mutants: { 'lookup.member': () => (xs) => { const v = xs.find((w) => w > 40); return v == null ? null : v + 1; }, 'lookup.first': () => (xs) => xs.findLast((v) => v > 40) ?? null },
    cues: { en: ['find', 'get', 'byId', 'lookup', 'of', 'for', 'resolve', 'pick', 'which'], he: ['מוצא', 'מחזיר', 'מאתר'] },
  },

  /* ─────────── ערך ⇒ ערך ─────────── */
  {
    id: 'tier', noDep: true, he: 'מדרג לשלבים', means: 'שם ערך על סולם של כמה מדרגות (קטן/בינוני/גדול, ירוק/צהוב/אדום) — כל מדרגה היא קטע רציף אחד',
    takes: ['number|amount'], gives: 'choice', bind: 'tier', axis: 'any',
    witness: (e) => new Set(e.sweep.map((p) => canon(p.out))).size >= 2,
    laws: [
      { id: 'tier.blocks', sweep: true, says: 'כל מדרגה תופסת קטע רציף אחד על הציר', check: (e) => blocksLaw(e) },
      { id: 'tier.few', sweep: true, says: 'מעט מדרגות — לא ערך חדש לכל קלט', check: (e) => fewLaw(e) },
    ],
    ref: { sig: [{ name: 'amount', d: AMOUNT }], fn: () => (x) => (x < 100 ? 'low' : x < 1000 ? 'mid' : 'high') },
    mutants: { 'tier.blocks': () => (x) => (Math.floor(x / 37) % 2 ? 'a' : 'b'), 'tier.few': () => (x) => String(Math.floor(x * 7)) },
    cues: { en: ['tier', 'level', 'grade', 'band', 'bucket', 'status', 'severity', 'rank', 'class', 'classify', 'color', 'risk', 'traffic'], he: ['מדרג', 'דרגה', 'רמה', 'מסווג'] },
  },
  {
    id: 'clamp', noDep: true, he: 'מגביל לטווח', means: 'מכניס ערך לגבולות: מתחת לרצפה ⇒ הרצפה, מעל לתקרה ⇒ התקרה, באמצע ⇒ כמו שהוא',
    takes: ['number'], gives: 'number', bind: 'num>num',
    sweepWitness: (sw) => sw.some((p) => !numEq(p.out, p.x)) && sw.some((p) => numEq(p.out, p.x)),
    laws: [
      {
        id: 'clamp.formula', sweep: true, says: 'התוצאה = הערך, חתוך בין הנמוך לגבוה מבין התוצאות',
        check: (e) => {
          const outs = e.sweep.map((p) => p.out);
          const lo = Math.min(...outs); const hi = Math.max(...outs);
          for (const p of e.sweep) { const w = Math.min(Math.max(p.x, lo), hi); if (!numEq(p.out, w)) return FAIL(p.x + ' ⇒ ' + p.out + ' ולא ' + w); }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'v', d: { t: 'int', lo: -50, hi: 160 } }], fn: () => (v) => Math.min(Math.max(v, 0), 100) },
    mutants: { 'clamp.formula': () => (v) => (v < 0 ? 0 : v > 100 ? 50 : v) },
    cues: { en: ['clamp', 'bound', 'limit', 'cap', 'between', 'atLeast', 'atMost', 'minmax'], he: ['מגביל', 'חותך', 'תוחם'] },
  },
  {
    id: 'normalize', he: 'מנרמל', means: 'מביא ערך לצורה אחת קבועה (רווחים, אותיות סופיות, קידומת טלפון) — נרמול שני לא משנה',
    takes: ['text'], gives: 'text', bind: 'x>x',
    fit: (e) => !isObj(e.x),
    witness: (e) => !same(e.out, e.x),
    laws: [{ id: 'normalize.idem', says: 'לנרמל פעמיים = לנרמל פעם אחת', check: (e) => (same(e.f(e.put(e.out)), e.out) ? true : FAIL('נרמול שני שינה')) }],
    ref: { sig: [{ name: 's', d: { t: 'str' } }], fn: () => (s) => s.trim().replace(/\s+/g, ' ') },
    mutants: { 'normalize.idem': () => (s) => s.trim() + '.' },
    cues: { en: ['norm', 'normalize', 'normalise', 'clean', 'canonical', 'trim', 'sanitize', 'heal', 'fix', 'strip'], he: ['מנרמל', 'מנקה', 'מתקן', 'מרפא'] },
  },
  {
    id: 'settle', he: 'מעדכן למצב', means: 'מעביר רשומה למצב מסוים (נסגר, אושר, שונה-שם) — רוב השדות נשארים, ולעשות את זה שוב לא משנה כלום',
    takes: ['record'], gives: 'record', bind: 'x>x',
    fit: (e) => isObj(e.x) && isObj(e.out) && Object.keys(e.x).length >= 2,
    witness: (e) => !same(e.out, e.x),
    laws: [
      { id: 'settle.idem', says: 'לעדכן פעמיים = לעדכן פעם אחת', check: (e) => (same(e.f(e.put(e.out)), e.out) ? true : FAIL('עדכון שני שינה')) },
      {
        id: 'settle.keeps', says: 'רוב השדות של הרשומה נשארים כמו שהיו (עדכון, לא בנייה מחדש)',
        check: (e) => {
          const ks = Object.keys(e.x);
          const kept = ks.filter((k) => same(e.out[k], e.x[k])).length;
          return kept * 2 >= ks.length && kept >= 1 ? true : FAIL('נשארו רק ' + kept + ' מתוך ' + ks.length + ' שדות');
        },
      },
    ],
    ref: { sig: [{ name: 'r', d: { t: 'obj', p: [['id', { t: 'str', h: 'id' }, false], ['name', STR, false], ['status', { t: 'lit', v: ['open', 'closed'] }, false], ['n', INT, false]] } }], fn: () => (r) => ({ ...r, status: 'closed' }) },
    mutants: { 'settle.idem': () => (r) => ({ ...r, status: 'closed', n: r.n + 1 }), 'settle.keeps': () => () => ({ status: 'closed' }) },
    cues: { en: ['close', 'approve', 'set', 'mark', 'rename', 'toggle', 'cancel', 'archive', 'activate', 'update', 'patch', 'apply', 'confirm', 'complete', 'done'], he: ['מעדכן', 'סוגר', 'מאשר', 'מסמן', 'מבטל', 'משנה'] },
  },
  {
    id: 'convert', he: 'ממיר ערך', means: 'הופך ערך לייצוג אחר (שקלים⇄אגורות, תאריך⇄מספר-יום) — בלי לאבד מידע: ערכים שונים נשארים שונים',
    takes: ['number|date|times'], gives: 'number|date', bind: 'x>any',
    fit: (e) => isScalar(e.x) && ['num', 'iso', 'hhmm', 'isodt', 'date'].includes(classOf(e.out)),
    witness: (e) => classOf(e.out) !== classOf(e.x) || !same(e.out, e.x),
    laws: [
      { id: 'convert.injective', sweep: true, says: 'ערכים שונים ⇒ תוצאות שונות (אין איבוד מידע)', check: (e) => injectiveLaw(e) },
      { id: 'convert.det', says: 'אותו ערך ⇒ אותה תוצאה', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('תוצאה אחרת בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'ils', d: AMOUNT }], fn: () => (v) => Math.round(v * 100) },
    mutants: { 'convert.injective': () => (v) => Math.floor(v / 10), 'convert.det': () => counter((c, v) => Math.round(v * 100) + c) },
    cues: { en: ['to', 'from', 'toCents', 'parse', 'convert', 'as', 'minutes', 'toMinutes', 'toIso', 'toDate', 'hhmmTo', 'index', 'serial'], he: ['ממיר', 'הופך', 'מתרגם'] },
  },
  {
    id: 'format', he: 'מעצב לטקסט', means: 'כותב ערך כטקסט לקריאה (₪1,234 · "י״ד בתשרי" · "3 לילות") — ערכים שונים נכתבים שונה',
    takes: ['number|date|amount'], gives: 'text', bind: 'x>any',
    fit: (e) => !isArr(e.x) && classOf(e.out) === 'str',
    witness: (e) => !same(e.out, e.x),
    laws: [
      { id: 'format.injective', sweep: true, says: 'ערכים שונים ⇒ טקסטים שונים', check: (e) => injectiveLaw(e) },
      { id: 'format.det', says: 'אותו ערך ⇒ אותו טקסט', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('טקסט אחר בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'v', d: AMOUNT }], fn: () => (v) => '₪' + v.toFixed(2) },
    mutants: { 'format.injective': () => (v) => (v > 0 ? 'חיובי' : 'לא חיובי'), 'format.det': () => counter((c, v) => '₪' + v.toFixed(2) + (c ? '' : ' ')) },
    cues: { en: ['format', 'fmt', 'label', 'text', 'str', 'toString', 'display', 'render', 'describe', 'title', 'caption', 'pretty', 'he', 'words', 'heb'], he: ['מעצב', 'כותב', 'מציג', 'מתאר'] },
  },
  {
    id: 'fingerprint', he: 'מטביע חותם', means: 'מפיק "טביעת אצבע" קצרה ובאורך קבוע מתוכן — שינוי של אות אחת משנה את רוב החותם',
    takes: ['text'], gives: 'text', bind: 'str>any',
    fit: (e) => isStr(e.x) && (isStr(e.out) || Number.isInteger(e.out)),
    sweepWitness: (sw) => new Set(sw.map((p) => String(p.x).length)).size >= 3,
    laws: [
      { id: 'fingerprint.fixed', sweep: true, says: 'החותם תמיד באותו אורך, לא משנה כמה ארוך הקלט', check: (e) => { const L = new Set(e.sweep.map((p) => String(p.out).length)); return L.size === 1 ? true : FAIL('אורכים: ' + [...L].join(',')); } },
      { id: 'fingerprint.injective', sweep: true, says: 'תכנים שונים ⇒ חותמות שונים', check: (e) => injectiveLaw(e) },
      {
        id: 'fingerprint.spread', says: 'טעות של אות אחת משנה לפחות רבע מהחותם',
        check: (e) => {
          if (e.x.length < 2) return null;
          const t = e.B.typo(e.r, e.x);
          if (t === e.x) return null;
          const a = String(e.out); const b = String(e.f(e.put(t)));
          let d = Math.abs(a.length - b.length);
          for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] !== b[k]) d++;
          return d * 4 >= a.length ? true : FAIL('השתנו רק ' + d + ' מתוך ' + a.length);
        },
      },
    ],
    ref: { sig: [{ name: 's', d: { t: 'str' } }], fn: () => (s) => fnv(s) },
    mutants: {
      'fingerprint.fixed': () => (s) => s.length + ':' + fnv(s),
      'fingerprint.injective': () => (s) => fnv(s).slice(0, 1),
      'fingerprint.spread': () => (s) => s.padEnd(12, '_').slice(0, 12),
    },
    cues: { en: ['hash', 'fnv', 'checksum', 'digest', 'fingerprint', 'code', 'verify', 'signature', 'key'], he: ['חותם', 'קוד-אימות', 'מטביע'] },
  },
  {
    id: 'bucket', noDep: true, he: 'מקבץ לפי יום', means: 'נותן לכל רגע את "היום שלו" (צילום-יומי, מפתח-יום) — כל רגעי אותו יום מקבלים אותו מפתח, ויום אחר — מפתח אחר',
    takes: ['times'], gives: 'text', bind: 'time>any',
    laws: [
      { id: 'bucket.same-day', says: 'שני רגעים באותו יום ⇒ אותו מפתח', check: (e) => { const t = noonOf(e.x); return same(e.f(e.put(timePlus(t, e.r.int(-150, 150)))), e.f(e.put(t))) ? true : FAIL('אותו יום, מפתח אחר'); } },
      { id: 'bucket.next-day', says: 'רגע ביום אחר ⇒ מפתח אחר', check: (e) => { const t = noonOf(e.x); const d = e.r.pick([1, 2, 7, -1, 30]); return !same(e.f(e.put(timePlus(t, d * 1440))), e.f(e.put(t))) ? true : FAIL('יום אחר, אותו מפתח'); } },
    ],
    ref: { sig: [{ name: 'ms', d: { t: 'num', h: 'ms' } }], fn: () => (ms) => new Date(ms).toISOString().slice(0, 10) },
    mutants: { 'bucket.same-day': () => (ms) => Math.floor(ms / 3_600_000), 'bucket.next-day': () => (ms) => Math.floor(ms / (7 * 86_400_000)) },
    cues: { en: ['daily', 'snapshot', 'dayKey', 'day', 'today', 'dateKey', 'isoDay', 'todayIso', 'stamp'], he: ['צילום', 'יומי', 'היום'] },
  },
  {
    id: 'personalize', noDep: true, he: 'ממלא טקסט מרשומה', means: 'בונה טקסט מתוך הפרטים של מישהו (שם, עיר, סכום) — מה שכתוב ברשומה מגיע לטקסט',
    takes: ['record'], gives: 'text', bind: 'rec>str',
    laws: [
      {
        id: 'personalize.trace', says: 'שדה-טקסט של הרשומה מופיע בטקסט שיוצא (משנים אותו — רואים את השינוי)',
        check: (e) => {
          const keys = Object.keys(e.x).filter((k) => isStr(e.x[k]) && e.x[k].length >= 1);
          if (!keys.length) return null;
          for (const k of keys) {
            const tok = 'קקק' + e.r.int(100, 999);
            const o = e.f(e.put({ ...e.x, [k]: tok }));
            if (isStr(o) && o.includes(tok)) return true;
          }
          return FAIL('אף שדה מהרשומה לא הגיע לטקסט');
        },
      },
      { id: 'personalize.det', says: 'אותה רשומה ⇒ אותו טקסט', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('טקסט אחר בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'p', d: { t: 'obj', p: [['name', STR, false], ['city', STR, false], ['sum', AMOUNT, true]] } }], fn: () => (p) => 'שלום ' + p.name + ' מ' + p.city },
    mutants: { 'personalize.trace': () => () => 'שלום', 'personalize.det': () => counter((c, p) => 'שלום ' + p.name + (c ? '!' : '')) },
    cues: { en: ['personal', 'greeting', 'message', 'msg', 'letter', 'template', 'thank', 'thanks', 'reminder', 'whatsapp', 'wa', 'sms', 'body', 'text'], he: ['מכתב', 'הודעה', 'ברכה', 'תודה', 'אישי'] },
  },
  {
    id: 'validate', he: 'בודק', means: 'עונה כן/לא על שאלה (פתוח? תקין? זכאי? בסכנה?) — אותו קלט, אותה תשובה',
    takes: ['any'], gives: 'bool', bind: 'any>any',
    witnessAll: (cases) => cases.some((c) => c.out === true) && cases.some((c) => c.out === false),
    laws: [
      { id: 'validate.bool', says: 'התשובה תמיד כן או לא', check: (e) => (typeof e.out === 'boolean' ? true : FAIL('תשובה ' + classOf(e.out))) },
      { id: 'validate.det', says: 'אותו קלט ⇒ אותה תשובה', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('תשובה אחרת בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'n', d: INT }], fn: () => (n) => n > 10 },
    mutants: { 'validate.bool': () => (n) => (n > 10 ? 1 : 0), 'validate.det': () => counter((c, n) => (c % 7 < 4 ? n > 10 : n <= 10)) },
    cues: { en: ['is', 'has', 'can', 'should', 'valid', 'validate', 'check', 'allow', 'allowed', 'eligible', 'needs', 'gate', 'ok', 'open', 'closed', 'within', 'matches'], he: ['בודק', 'האם', 'מאמת', 'יודע'] },
  },
  {
    id: 'compare', he: 'משווה', means: 'אומר מי לפני מי בין שניים — כל אחד שווה לעצמו, להפוך את הסדר הופך את התשובה, והסדר עקבי',
    takes: ['any', 'any'], gives: 'number', bind: 'x+x>any',
    fit: (e) => (isNum(e.out) || typeof e.out === 'boolean') && classOf(e.x) === classOf(e.y),
    witness: (e) => !same(e.x, e.y),
    laws: [
      { id: 'compare.self', says: 'כל דבר שווה לעצמו', check: (e) => { const s = e.f(e.put(e.x, e.j)); return isNum(s) ? (s === 0 ? true : FAIL('השוואה לעצמו ≠ 0')) : typeof s === 'boolean' ? true : FAIL('תשובה לא מספר/כן-לא'); } },
      {
        id: 'compare.anti', says: 'להחליף את הסדר — מתהפכת התשובה',
        check: (e) => {
          const back = e.f(swap(e));
          if (isNum(e.out)) return Math.sign(back) === -Math.sign(e.out) ? true : FAIL('לא התהפך');
          if (same(e.x, e.y)) return null;
          const self = e.f(e.put(e.x, e.j));
          return self ? (e.out || back ? true : FAIL('אף אחד לא לפני השני')) : !(e.out && back) ? true : FAIL('כל אחד לפני השני');
        },
      },
      {
        id: 'compare.trans', says: 'אם א לפני ב וב לפני ג — אז א לפני ג',
        check: (e) => {
          const lt = (v) => (isNum(v) ? v < 0 : v === true);
          const at = (p, q) => { const a = e.args.slice(); a[e.i] = p; a[e.j] = q; return a; };
          let a = e.x; let b = e.y;
          if (!lt(e.out)) { if (!lt(e.f(swap(e)))) return null; [a, b] = [e.y, e.x]; }
          for (let t = 0; t < 8; t++) {
            const c = e.fresh(e.j);
            if (classOf(c) !== classOf(a)) continue;
            if (lt(e.f(at(b, c)))) return lt(e.f(at(a, c))) ? true : FAIL('לא עקבי (א<ב<ג אבל לא א<ג)');
          }
          return null;
        },
      },
    ],
    ref: { sig: [{ name: 'a', d: INT }, { name: 'b', d: INT }], fn: () => (a, b) => (a < b ? -1 : a > b ? 1 : 0) },
    mutants: {
      'compare.self': () => (a, b) => (a <= b ? -1 : 1),
      'compare.anti': () => (a, b) => (a === b ? 0 : 1),
      'compare.trans': () => (a, b) => (a === b ? 0 : ((((a - b) % 3) + 3) % 3 === 1 ? 1 : -1)),
    },
    cues: { en: ['compare', 'cmp', 'before', 'after', 'earlier', 'later', 'less', 'greater', 'newer', 'older', 'sorter', 'order'], he: ['משווה', 'לפני', 'אחרי'] },
  },
  {
    id: 'gap', he: 'מודד מרחק', means: 'כמה בין שניים (ימים בין תאריכים, דקות בין שעות, הפרש סכומים) — מעצמו 0, והמרחקים מתחברים',
    takes: ['any', 'any'], gives: 'number', bind: 'x+x>any',
    fit: (e) => isNum(e.out) && (axisClass(classOf(e.x)) || isStr(e.x)) && classOf(e.x) === classOf(e.y),
    witness: (e) => e.out !== 0,
    laws: [
      { id: 'gap.self', says: 'המרחק מדבר לעצמו — 0', check: (e) => (numsEq(e.f(e.put(e.x, e.j)), 0) ? true : FAIL('מרחק מעצמו ≠ 0')) },
      { id: 'gap.anti', says: 'להפוך את הסדר — אותו מרחק במינוס (או אותו מרחק בדיוק, כשהמרחק תמיד חיובי)', check: (e) => { const b = e.f(swap(e)); return numsEq(b, -e.out) || numsEq(b, e.out) ? true : FAIL(e.out + ' מול ' + b); } },
      {
        id: 'gap.chain', says: 'מא׳ לב׳ ועוד מב׳ לג׳ = מא׳ לג׳ (ובמרחק חיובי — לא יותר מזה)',
        check: (e) => {
          const c = e.fresh(e.j);
          const ab = e.out; const bc = e.f(Object.assign(e.put(e.y), { [e.j]: c })); const ac = e.f(e.put(c, e.j));
          if (!isNum(bc) || !isNum(ac)) return FAIL('לא מספר');
          if (numsEq(ab + bc, ac)) return true;
          const sym = numsEq(e.f(swap(e)), ab);
          return sym && ac <= ab + bc + 1e-9 ? true : FAIL(ab + ' + ' + bc + ' ≠ ' + ac);
        },
      },
    ],
    ref: { sig: [{ name: 'a', d: { t: 'str', h: 'iso' } }, { name: 'b', d: { t: 'str', h: 'iso' } }], fn: () => (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) },
    mutants: {
      'gap.self': () => (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1,
      'gap.anti': () => (a, b) => { const d = Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000); return d > 0 ? d : 2 * d; },
      'gap.chain': () => (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) ** 3,
    },
    cues: { en: ['diff', 'between', 'days', 'daysBetween', 'elapsed', 'age', 'distance', 'delta', 'since', 'until', 'duration', 'nights', 'minutesBetween'], he: ['כמה ימים', 'מרחק', 'הפרש', 'גיל'] },
  },
  {
    id: 'ratio', he: 'מחשב יחס', means: 'כמה חלק מתוך שלם (אחוז ניצול, אחוז נוכחות) — להכפיל את שניהם באותו מספר לא משנה את היחס',
    takes: ['number', 'number'], gives: 'number', bind: 'x+x>any',
    fit: (e) => isNum(e.x) && isNum(e.y) && isNum(e.out) && e.x !== 0 && e.y !== 0,
    witness: (e) => { const o2 = e.f(e.put(e.x + 1)); return !numsEq(o2, e.out); },
    laws: [{ id: 'ratio.scale', says: 'להכפיל את החלק ואת השלם באותו מספר — אותו יחס', check: (e) => { const k = e.r.pick([2, 3, 10]); const o = e.f(Object.assign(e.put(e.x * k), { [e.j]: e.y * k })); return numsEq(o, e.out) || Math.abs(o - e.out) <= 1e-6 * Math.max(1, Math.abs(o)) ? true : FAIL('×' + k + ' שינה: ' + e.out + ' ⇒ ' + o); } }],
    ref: { sig: [{ name: 'part', d: { t: 'int', lo: 1, hi: 90 } }, { name: 'whole', d: { t: 'int', lo: 1, hi: 120 } }], fn: () => (a, b) => (b ? (100 * a) / b : 0) },
    mutants: { 'ratio.scale': () => (a, b) => (b ? (100 * (a + 1)) / b : 0) },
    cues: { en: ['pct', 'percent', 'ratio', 'rate', 'share', 'fraction', 'utilization', 'occupancy', 'progress'], he: ['אחוז', 'יחס', 'ניצול', 'תפוסה'] },
  },
  {
    id: 'combine', he: 'מצרף שניים', means: 'מצרף שני ערכים מאותו סוג לאחד (חיבור, איחוד, הגדול מהשניים) — הסדר והקיבוץ לא משנים',
    takes: ['any', 'any'], gives: 'any', bind: 'x+x>any',
    fit: (e) => classOf(e.out) === classOf(e.x) && classOf(e.x) === classOf(e.y) && !isArr(e.x),
    witness: (e) => !same(e.out, e.x) || !same(e.out, e.y),
    laws: [
      { id: 'combine.comm', says: 'א עם ב = ב עם א', check: (e) => { const b = e.f(swap(e)); return same(b, e.out) || (isNum(b) && numsEq(b, e.out, e.mod)) ? true : FAIL('הסדר משנה'); } },
      {
        id: 'combine.assoc', says: '(א עם ב) עם ג = א עם (ב עם ג)',
        check: (e) => {
          const c = e.fresh(e.j);
          if (classOf(c) !== classOf(e.x)) return null;
          const l = e.f(Object.assign(e.put(e.out), { [e.j]: c }));
          const bc = e.f(Object.assign(e.put(e.y), { [e.j]: c }));
          const rr = e.f(e.put(bc, e.j));
          return same(l, rr) || (isNum(l) && numsEq(l, rr, e.mod)) ? true : FAIL('הקיבוץ משנה');
        },
      },
    ],
    ref: { sig: [{ name: 'a', d: INT }, { name: 'b', d: INT }], fn: () => (a, b) => a + b },
    mutants: { 'combine.comm': () => (a) => a, 'combine.assoc': () => (a, b) => (a + b) / 2 },
    cues: { en: ['merge', 'combine', 'union', 'join', 'plus', 'add', 'max', 'min', 'and', 'or', 'mergeWith', 'assign'], he: ['מצרף', 'מאחד', 'ממזג'] },
  },
  {
    id: 'split', he: 'מפצל טקסט', means: 'שובר טקסט לחתיכות (מילים, שורות, שדות) — כל חתיכה נלקחה מהטקסט, לפי הסדר',
    takes: ['text'], gives: 'list', bind: 'str>any',
    fit: (e) => isStr(e.x) && isArr(e.out) && e.out.every((p) => isStr(p) || isNum(p)),
    witness: (e) => e.out.length >= 2,
    laws: [
      { id: 'split.pieces', says: 'כל חתיכה מופיעה בטקסט', check: (e) => (e.out.every((p) => e.x.includes(String(p))) ? true : FAIL('חתיכה שלא בטקסט')) },
      { id: 'split.order', says: 'החתיכות לפי הסדר שבטקסט', check: (e) => { let at = 0; for (const p of e.out) { const k = e.x.indexOf(String(p), at); if (k < 0) return FAIL('לא לפי הסדר'); at = k + String(p).length; } return true; } },
    ],
    ref: { sig: [{ name: 's', d: { t: 'str' } }], fn: () => (s) => s.split(/\s+/).filter(Boolean) },
    mutants: { 'split.pieces': () => (s) => s.split(/\s+/).filter(Boolean).map((w) => w + '!'), 'split.order': () => (s) => s.split(/\s+/).filter(Boolean).reverse() },
    cues: { en: ['split', 'tokens', 'tokenize', 'words', 'lines', 'parse', 'parseCsv', 'csv', 'fields', 'explode'], he: ['מפצל', 'מפרק', 'מפענח'] },
  },
  {
    id: 'join', he: 'מצרף לטקסט', means: 'מחבר רשימה לטקסט אחד ("א, ב ו-ג") — כל פריט מופיע, לפי הסדר',
    takes: ['list'], gives: 'text', bind: 'list>any',
    fit: (e) => isArr(e.x) && isStr(e.out) && e.x.every((p) => (isStr(p) && p.length > 0) || isNum(p)),
    witness: (e) => e.x.length >= 2,
    laws: [{ id: 'join.contains', says: 'כל פריט מופיע בטקסט, לפי הסדר', check: (e) => { let at = 0; for (const p of e.x) { const k = e.out.indexOf(String(p), at); if (k < 0) return FAIL('"' + p + '" חסר או לא לפי הסדר'); at = k + String(p).length; } return true; } }],
    ref: { sig: [{ name: 'xs', d: { t: 'arr', of: STR } }], fn: () => (xs) => xs.join(', ') },
    mutants: { 'join.contains': () => (xs) => xs.slice(1).join(', ') },
    cues: { en: ['join', 'list', 'listText', 'summary', 'line', 'lines', 'csv', 'concat', 'names'], he: ['מחבר', 'מצרף', 'רשימה'] },
  },
  {
    id: 'provide', he: 'נותן ערך קבוע', noDep: true, means: 'חלק בלי קלטים שתמיד מחזיר את אותו דבר (ברירת-מחדל, רשימת-אפשרויות, תבנית ריקה)',
    takes: [], gives: 'any', bind: 'any>any',
    witnessAll: (cases) => cases.length >= 3 && cases[0].args.length === 0,
    laws: [{ id: 'provide.same', says: 'כל הקריאות מחזירות אותו ערך', check: (e) => (same(e.f(e.args), e.first) ? true : FAIL('ערך אחר')) }],
    ref: { sig: [], fn: () => () => ({ open: 9, close: 17 }) },
    mutants: { 'provide.same': () => counter((c) => ({ open: 9, close: 17 + c })) },
    cues: { en: ['default', 'defaults', 'empty', 'blank', 'initial', 'options', 'presets', 'list', 'all', 'catalog', 'schema', 'make', 'new', 'create'], he: ['ריק', 'ברירת', 'מחזיר את'] },
  },

  /* ─────────── פעלים שמזוהים רק משם/חתימה (אין חוק חד) ─────────── */
  { id: 'require-source', he: 'דורש מקור', staticOnly: true, means: 'לא מקבל טענה/נתון בלי מקור מצוין (ציטוט, מזהה, קישור)', takes: ['record'], gives: 'bool', cues: { en: ['source', 'provenance', 'cite', 'citation', 'requireSource', 'sourced', 'evidence', 'ref'], he: ['מקור', 'מצטט', 'ציטוט', 'ראיה'] } },
  { id: 'freeze', he: 'מקפיא ומחליף תוכן', staticOnly: true, means: 'מקבע תמונה ומחליף את התוכן שבתוכה בלי לשבור את המסגרת', takes: ['record'], gives: 'record', cues: { en: ['freeze', 'frozen', 'immutable', 'swap', 'replaceContent', 'keyframe', 'still'], he: ['מקפיא', 'קפוא', 'מחליף'] } },
  { id: 'assign-role', he: 'מקצה תפקיד', staticOnly: true, means: 'קובע מי עושה מה (מנהל/מורה/מתנדב) ומה מותר לו', takes: ['record'], gives: 'choice', cues: { en: ['role', 'roles', 'assign', 'owner', 'permission', 'permissions', 'grant', 'acl', 'isManager', 'isAdmin'], he: ['תפקיד', 'מקצה', 'משייך', 'הרשאה'] } },
  { id: 'route', he: 'מנתב לפי ערוץ', staticOnly: true, means: 'שולח את אותו דבר בדרך שמתאימה לערוץ (וואטסאפ/SMS/מייל/טלפון)', takes: ['choice', 'record'], gives: 'record', cues: { en: ['route', 'routing', 'channel', 'channels', 'dispatch', 'driver', 'via', 'transport', 'deliver'], he: ['מנתב', 'ערוץ', 'שולח'] } },
  { id: 'tolerate', he: 'סובל כשל', staticOnly: true, means: 'כשמשהו נכשל — ממשיך בנחת עם תשובה בטוחה במקום ליפול', takes: ['any'], gives: 'any', cues: { en: ['safe', 'try', 'fallback', 'retry', 'tolerant', 'soft', 'graceful', 'guard', 'catch', 'orDefault'], he: ['בטוח', 'נופל-רך', 'כשל'] } },
  { id: 'pace', he: 'מווסת קצב', staticOnly: true, means: 'לא נותן לעשות יותר מדי מהר (השהיה, הגבלת-קצב, ניסיון-חוזר עם המתנה)', takes: ['times'], gives: 'times', cues: { en: ['throttle', 'debounce', 'pace', 'backoff', 'rateLimit', 'cooldown', 'quiet', 'quietHours', 'wait'], he: ['קצב', 'השהיה', 'מנוחה'] } },
  { id: 'relay', he: 'מעביר דרך מרכז', staticOnly: true, means: 'לא מדבר ישר — מעביר דרך תחנה באמצע (מרכזייה, מתווך, שרת)', takes: ['record'], gives: 'record', cues: { en: ['relay', 'proxy', 'hub', 'forward', 'bridge', 'switchboard', 'broker', 'outbox', 'queue'], he: ['מעביר', 'מתווך', 'מרכזייה', 'ממסר'] } },
];

/* ═══════════════ חוקים משותפים ═══════════════ */

/** מחלק-משותף-גדול של שברים (עם סובלנות). */
function fgcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  const tol = 1e-7 * Math.max(1, a, b);
  while (b > tol) [a, b] = [b, a % b];
  return a;
}
function fewLaw(e) {
  const n = new Set(e.sweep.map((p) => canon(p.out))).size;
  return n <= Math.max(3, Math.floor(e.sweep.length / 3)) ? true : FAIL(n + ' מדרגות שונות');
}
function blocksLaw(e) {
  const seen = new Set();
  let prev = null;
  for (const p of e.sweep) {
    const c = canon(p.out);
    if (c !== prev) { if (seen.has(c)) return FAIL('המדרגה ' + c + ' חזרה אחרי שעזבה'); seen.add(c); prev = c; }
  }
  return true;
}
function injectiveLaw(e) {
  const m = new Map();
  for (const p of e.sweep) {
    const k = canon(p.out); const xk = canon(p.x);
    if (m.has(k) && m.get(k) !== xk) return FAIL('שני ערכים שונים ⇒ אותה תוצאה');
    m.set(k, xk);
  }
  return true;
}
function addLaw(e) {
  const b = e.freshList();
  if (!isArr(b)) return null;
  const fb = e.f(e.put(b)); const fab = e.f(e.put(cat(e.x, b, e.u)));
  return isNum(fb) && isNum(fab) && numEq(fab, e.out + fb, e.mod) ? true : FAIL('ביחד ' + fab + ' ≠ ' + e.out + ' + ' + fb);
}
/** האם `old` נשמר שלם בתחילת `nu` או בסופו: 'start' · 'end' · 'both' · null. */
function sideOf(nu, old) {
  if (!isArr(nu)) return null;
  const st = same(nu.slice(0, old.length), old);
  const en = same(nu.slice(nu.length - old.length), old);
  return st && en ? 'both' : st ? 'start' : en ? 'end' : null;
}
function swap(e) { const a = e.args.slice(); [a[e.i], a[e.j]] = [a[e.j], a[e.i]]; return a; }
export function isoPlus(iso, days) { return new Date(Date.parse(iso + 'T12:00:00Z') + days * 86_400_000).toISOString().slice(0, 10); }
/** רגע + דקות, באותה צורה (מספר ms · טקסט ISO מלא · תאריך-JS מקודד). */
/** אותו יום בשעה 12:00 UTC (= בין 14:00 ל-15:00 בישראל) — רחוק מחצות בשני האזורים. */
function noonOf(t) {
  const c = classOf(t);
  const ms = c === 'num' ? t : c === 'date' ? t.v : Date.parse(t);
  const noon = Math.floor(ms / 86_400_000) * 86_400_000 + 43_200_000;
  return c === 'num' ? noon : c === 'date' ? { $$: 'date', v: noon } : new Date(noon).toISOString();
}
function timePlus(t, minutes) {
  const c = classOf(t);
  if (c === 'num') return t + minutes * 60_000;
  if (c === 'date') return { $$: 'date', v: t.v + minutes * 60_000 };
  if (c === 'isodt') return new Date(Date.parse(t) + minutes * 60_000).toISOString();
  return t;
}
const norm = (e, s) => (e.B && e.B.normHe ? e.B.normHe(s) : String(s));
function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, k) => k);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let k = 1; k <= b.length; k++) { const t = d[k]; d[k] = Math.min(d[k] + 1, d[k - 1] + 1, prev + (a[i - 1] === b[k - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
function fuzzyCase(e, kind) {
  const cs = e.y;
  if (!isArr(cs) || !cs.length) return null;
  const idx = e.r.int(0, cs.length - 1);
  const c = cs[idx];
  const t = textOf(c);
  if (!t) return null;
  const words = t.split(/\s+/).filter((w) => w.length >= 5);
  if (!words.length) return null;
  const w = words[e.r.int(0, words.length - 1)];
  let q = w;
  if (kind === 'typo') {
    // כמו המאמת: טעות אחת = אות אחת **אחרי הנרמול**, ובמילה של 4+ אותיות
    q = e.B.typo(e.r, w);
    const nq = norm(e, q); const nw = norm(e, w);
    if (nq.length < 4 || nw.length < 4 || lev(nq, nw) !== 1) return null;
  }
  if (kind === 'far') { q = e.B.farWord(e.r, cs.map(textOf).join('')); if (!q) return null; }
  const res = e.f(e.put(q, e.i));
  if (kind === 'far') return hits(res, c) ? FAIL('מילה רחוקה ("' + q + '") מצאה') : true;
  return hits(res, c) ? true : FAIL((kind === 'typo' ? 'טעות-הקלדה' : 'מילה מדויקת') + ' לא נמצאה');
}

/* ═══════════════ גישה ═══════════════ */

export const VERB_BY_ID = new Map(VERBS.map((v) => [v.id, v]));
/** סדר-הספציפיות: הפועל הראשון שמתקיים = "הפועל הראשי" של החלק. */
export const PRIMARY_ORDER = ['divide', 'merge', 'next', 'rotate', 'fuzzy', 'escalate', 'tier', 'round', 'offset', 'bucket', 'fingerprint', 'clamp', 'sort', 'reverse', 'dedupe', 'filter', 'transcript', 'group', 'tally', 'count', 'sum', 'average', 'extreme', 'lookup', 'gap', 'compare', 'ratio', 'combine', 'split', 'join', 'personalize', 'map', 'settle', 'normalize', 'convert', 'format', 'validate', 'provide'];
/** פועל ספציפי שמכסה פועל כללי — כשהספציפי מתקיים, הכללי לא נספר בנפרד. */
export const IMPLIES = { count: ['sum'], gap: ['compare'], escalate: ['tier'], fuzzy: ['lookup'], round: ['normalize', 'convert'], clamp: ['normalize'], filter: ['normalize'], dedupe: ['normalize'], sort: ['normalize'], settle: ['normalize'] };
