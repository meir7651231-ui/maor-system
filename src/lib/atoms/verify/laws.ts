/**
 * ✅ המאמת · החוקים של שמונת המנועים הקטנים (ATOMS-VERIFY, 14.10.2026).
 *
 * הבעלים: "למה אתה לא בונה מנוע מפרק, מנוע שמחבר ומנוע שמאמת?". כאן — מה כל חלק **חייב** לקיים על כל קלט,
 * לא על דוגמה אחת. כל חוק = פונקציה טהורה שמקבלת קלט (מ-gen.ts) ומחזירה null (תקין) או משפט שמסביר מה נשבר.
 * החוקים נכתבו מתוך מה שהחלק מבטיח (הכרטיס, ההערות בקוד, דוח ATOMS-CORE) — ולא מתוך מה שהוא עושה היום:
 * חוק שנכשל = באג בחלק, לא בחוק. **אין להחליש חוק כדי שיעבור.**
 *
 * טהור: בלי store/DOM/שעון. מייבא רק את החלקים עצמם (+ levenshtein לבדיקת "רחוק").
 */
import type { AtomId } from '../contract';
import { DIVIDE_MAX_PIECES, divideAmount, divideSpan, pointsAt, type Piece } from '../parts/divide';
import { mergeRuns, type Run } from '../parts/merge';
import { firstRun, nextAfter } from '../parts/next';
import { roundTo, type RoundDir } from '../parts/round';
import { hhmmToMinutes, offsetAll, resolveRelative } from '../parts/offset';
import { escalationPlan, escalationState, type EscInput } from '../parts/escalate';
import { dayIndex, fairAssign, turnIndex, turnOf } from '../parts/rotate';
import { fuzzyFind, normHe, type FuzzyCandidate } from '../parts/fuzzy';

/* ═══════════════ קלטים ═══════════════ */

export type AtomInput =
  | { k: 'divide.parts'; from: number; to: number; parts: number }
  | { k: 'divide.size'; from: number; to: number; size: number; gap: number; remainder: 'drop' | 'shorten' }
  | { k: 'divide.amount'; total: number; parts: number; step: number }
  | { k: 'divide.points'; from: number; to: number; parts: number; at: number[] }
  | { k: 'merge'; items: boolean[]; maxGap: number; minLength: number }
  | { k: 'next.times'; times: (number | string)[]; now: number | string; count: number }
  | { k: 'next.runs'; flags: boolean[]; minLength: number; fromIndex: number }
  | { k: 'round'; value: number; step: number; dir: RoundDir }
  | { k: 'offset.times'; times: number[]; minutes: number }
  | { k: 'offset.days'; iso: string; minute: number; days: number; minutes: number }
  | { k: 'offset.relative'; anchors: Record<string, number | string | null>; name: string; delta: number }
  | { k: 'escalate'; input: EscInput; probes: number[] }
  | { k: 'rotate'; list: string[]; start: number; window: number; items: number }
  | { k: 'rotate.days'; iso: string; days: number }
  | { k: 'fuzzy'; expect: 'exact' | 'typo' | 'prefix' | 'far'; query: string; target: string; candidates: FuzzyCandidate[] };

export type InputKind = AtomInput['k'];

/** חוק: מזהה, המשפט בעברית, על אילו קלטים הוא חל, והבדיקה. */
export interface AtomLaw {
  atom: AtomId;
  id: string;
  says: string;
  on: readonly InputKind[];
  /** null = תקין; אחרת — מה נשבר. */
  check: (input: AtomInput) => string | null;
}

/* ═══════════════ עזרים ═══════════════ */

const EPS = 1e-9;
/** סובלנות נקודה-צפה יחסית לגודל. */
const tol = (...xs: number[]): number => EPS * Math.max(1, ...xs.map((x) => Math.abs(x)));
const near = (a: number, b: number, t = tol(a, b)): boolean => Math.abs(a - b) <= t;
const isMultiple = (v: number, step: number): boolean => {
  const q = v / step;
  return Math.abs(q - Math.round(q)) <= 1e-7 * Math.max(1, Math.abs(q));
};
const j = (x: unknown): string => JSON.stringify(x);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const DAY_MS = 86_400_000;
/** תאריך ISO + ימים, בחשבון UTC (בלי שעון-המערכת) — מקור-אמת עצמאי לבדיקת ימים. */
export const isoPlus = (iso: string, days: number): string => new Date(Date.parse(iso + 'T12:00:00Z') + days * DAY_MS).toISOString().slice(0, 10);

/* ═══════════════ ✂️ divide ═══════════════ */

function piecesOk(ps: Piece[]): string | null {
  for (const p of ps) {
    if (![p.from, p.to, p.length].every(Number.isFinite)) return 'חלק לא-סופי ' + j(p);
    if (!near(p.length, p.to - p.from)) return 'אורך ≠ סוף−התחלה ' + j(p);
    if (p.to < p.from - tol(p.from)) return 'חלק הפוך ' + j(p);
  }
  for (let i = 1; i < ps.length; i++) if (ps[i].from < ps[i - 1].to - tol(ps[i].from)) return 'חלקים לא לפי הסדר / חופפים ' + i;
  return null;
}

const DIVIDE_LAWS: AtomLaw[] = [
  {
    atom: 'divide',
    id: 'divide.parts.count-cover',
    says: 'לפי מספר: בדיוק כמה שביקשו, הראשון מתחיל בהתחלה והאחרון נגמר בסוף, צמודים ולפי הסדר',
    on: ['divide.parts'],
    check: (i) => {
      if (i.k !== 'divide.parts') return null;
      const ps = divideSpan({ from: i.from, to: i.to }, { parts: i.parts });
      const n = Math.floor(i.parts);
      if (!(n >= 1 && n <= DIVIDE_MAX_PIECES)) return ps.length ? 'מספר-חלקים פגום ⇒ צריך [] ' : null;
      if (ps.length !== n) return 'ביקשו ' + n + ' וקיבלו ' + ps.length;
      if (ps[0].from !== i.from) return 'הראשון לא מתחיל בהתחלה';
      if (ps[n - 1].to !== i.to) return 'האחרון לא נגמר בסוף';
      for (let k = 1; k < n; k++) if (ps[k].from !== ps[k - 1].to) return 'רווח/חפיפה בין חלק ' + k + ' לקודם';
      return piecesOk(ps);
    },
  },
  {
    atom: 'divide',
    id: 'divide.parts.equal',
    says: 'לפי מספר: כל החלקים שווים (עד רעש נקודה-צפה) והסכום = האורך כולו',
    on: ['divide.parts'],
    check: (i) => {
      if (i.k !== 'divide.parts') return null;
      const ps = divideSpan({ from: i.from, to: i.to }, { parts: i.parts });
      if (!ps.length) return null;
      const unit = (i.to - i.from) / ps.length;
      const t = tol(i.from, i.to) * 8;
      for (const p of ps) if (!near(p.length, unit, t)) return 'חלק ' + p.length + ' ≠ ' + unit;
      if (!near(sum(ps.map((p) => p.length)), i.to - i.from, t * ps.length)) return 'הסכום ≠ האורך';
      return null;
    },
  },
  {
    atom: 'divide',
    id: 'divide.size.exact',
    says: 'לפי גודל: כל חלק בדיוק בגודל, ההפסקה בדיוק בין חלק לחלק, ורק האחרון (בבחירת "קצר יותר") קצר יותר',
    on: ['divide.size'],
    check: (i) => {
      if (i.k !== 'divide.size') return null;
      const ps = divideSpan({ from: i.from, to: i.to }, { size: i.size, gap: i.gap, remainder: i.remainder });
      if (ps.length && ps[0].from !== i.from) return 'הראשון לא מתחיל בהתחלה';
      for (let k = 0; k < ps.length; k++) {
        const last = k === ps.length - 1;
        if (!near(ps[k].length, i.size) && !(last && i.remainder === 'shorten' && ps[k].length < i.size && ps[k].length > 0 && ps[k].to === i.to))
          return 'חלק ' + k + ' באורך ' + ps[k].length + ' ולא ' + i.size;
        if (k && !near(ps[k].from, ps[k - 1].to + i.gap)) return 'ההפסקה לפני חלק ' + k + ' ≠ ' + i.gap;
        if (ps[k].to > i.to + tol(i.to)) return 'חלק ' + k + ' חורג מהסוף';
      }
      return piecesOk(ps);
    },
  },
  {
    atom: 'divide',
    id: 'divide.size.maximal',
    says: 'לפי גודל: לא נשאר מקום לעוד חלק — "לוותר" ⇒ חלק שלם נוסף לא נכנס; "קצר יותר" ⇒ הכול מכוסה עד הסוף',
    on: ['divide.size'],
    check: (i) => {
      if (i.k !== 'divide.size') return null;
      const ps = divideSpan({ from: i.from, to: i.to }, { size: i.size, gap: i.gap, remainder: i.remainder });
      if (ps.length >= DIVIDE_MAX_PIECES) return null;
      const nextFrom = ps.length ? ps[ps.length - 1].to + i.gap : i.from;
      if (i.remainder === 'drop' && nextFrom + i.size <= i.to - tol(i.to)) return 'נשאר מקום לעוד חלק שלם מ-' + nextFrom;
      if (i.remainder === 'shorten' && nextFrom < i.to - tol(i.to)) return 'נשאר קטע לא-מכוסה מ-' + nextFrom;
      return null;
    },
  },
  {
    atom: 'divide',
    id: 'divide.amount.sum',
    says: 'סכום: מספר התשלומים כמו שביקשו, והסכום שלהם בדיוק הסכום המקורי (עד האגורה)',
    on: ['divide.amount'],
    check: (i) => {
      if (i.k !== 'divide.amount') return null;
      const xs = divideAmount(i.total, i.parts, i.step);
      const n = Math.floor(i.parts);
      if (!(n >= 1 && n <= DIVIDE_MAX_PIECES)) return xs.length ? 'מספר-חלקים פגום ⇒ צריך []' : null;
      if (xs.length !== n) return 'ביקשו ' + n + ' וקיבלו ' + xs.length;
      if (!xs.every(Number.isFinite)) return 'תשלום לא-סופי';
      if (!near(sum(xs), i.total, 1e-7 * Math.max(1, Math.abs(i.total)))) return 'הסכום ' + sum(xs) + ' ≠ ' + i.total + ' ' + j(xs);
      return null;
    },
  },
  {
    atom: 'divide',
    id: 'divide.amount.equal',
    says: 'סכום: כל תשלום כפולה של היחידה (חוץ מהשבר שלא מתחלק, בתשלום הראשון), ההפרש בין הגדול לקטן ≤ יחידה אחת, והגדולים קודם',
    on: ['divide.amount'],
    check: (i) => {
      if (i.k !== 'divide.amount') return null;
      const xs = divideAmount(i.total, i.parts, i.step);
      if (xs.length < 1) return null;
      const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
      const q = i.total / st;
      const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
      const rest = i.total - units * st;
      for (let k = 1; k < xs.length; k++) if (!isMultiple(xs[k], st)) return 'תשלום ' + k + ' (' + xs[k] + ') לא כפולה של ' + st;
      if (!isMultiple(xs[0] - rest, st)) return 'התשלום הראשון בלי השבר לא כפולה של ' + st;
      const core = [xs[0] - rest, ...xs.slice(1)];
      const spread = Math.max(...core) - Math.min(...core);
      if (spread > st + 1e-7 * Math.max(1, Math.abs(i.total))) return 'הפרש ' + spread + ' > יחידה ' + st + ' ' + j(xs);
      for (let k = 1; k < core.length; k++) if (Math.abs(core[k]) > Math.abs(core[k - 1]) + tol(core[k])) return 'תשלום גדול אחרי קטן ב-' + k + ' ' + j(xs);
      return null;
    },
  },
  {
    atom: 'divide',
    id: 'divide.points.formula',
    says: 'נקודות: הנקודה ה-a = התחלה + a·(אורך/מספר), לפי הסדר של a',
    on: ['divide.points'],
    check: (i) => {
      if (i.k !== 'divide.points') return null;
      const xs = pointsAt({ from: i.from, to: i.to }, i.parts, i.at);
      if (xs.length !== i.at.length) return 'מספר נקודות ' + xs.length + ' ≠ ' + i.at.length;
      const unit = (i.to - i.from) / i.parts;
      for (let k = 0; k < xs.length; k++) if (!near(xs[k], i.from + i.at[k] * unit, tol(i.from, i.to) * 4)) return 'נקודה ' + i.at[k] + ' = ' + xs[k];
      return null;
    },
  },
];

/* ═══════════════ 🔗 merge ═══════════════ */

/** מקור-אמת עצמאי: האשכולות של "כן" שהרווח ביניהם ≤ maxGap (לפני סינון האורך). */
function clusters(items: readonly boolean[], maxGap: number): [number, number][] {
  const on = items.map((x, k) => (x ? k : -1)).filter((k) => k >= 0);
  const out: [number, number][] = [];
  for (const k of on) {
    const last = out[out.length - 1];
    if (last && k - last[1] - 1 <= maxGap) last[1] = k;
    else out.push([k, k]);
  }
  return out;
}

const MERGE_LAWS: AtomLaw[] = [
  {
    atom: 'merge',
    id: 'merge.shape',
    says: 'כל קבוצה מתחילה ונגמרת ב"כן", האורך = סוף−התחלה+1, הקבוצות לפי הסדר ולא חופפות',
    on: ['merge'],
    check: (i) => {
      if (i.k !== 'merge') return null;
      const rs = mergeRuns(i.items, undefined, { maxGap: i.maxGap, minLength: i.minLength });
      let prev = -1;
      for (const r of rs) {
        if (!i.items[r.from] || !i.items[r.to]) return 'קבוצה שמתחילה/נגמרת ב"לא" ' + j(r);
        if (r.length !== r.to - r.from + 1) return 'אורך שגוי ' + j(r);
        if (r.from <= prev) return 'קבוצות חופפות/לא לפי הסדר';
        prev = r.to;
      }
      return null;
    },
  },
  {
    atom: 'merge',
    id: 'merge.gaps',
    says: 'בתוך קבוצה אין רווח גדול מהמותר; בין שתי קבוצות הרווח גדול מהמותר (אי אפשר לחבר אותן — מקסימליות)',
    on: ['merge'],
    check: (i) => {
      if (i.k !== 'merge') return null;
      const rs = mergeRuns(i.items, undefined, { maxGap: i.maxGap, minLength: i.minLength });
      for (const r of rs) {
        let off = 0;
        for (let k = r.from; k <= r.to; k++) {
          off = i.items[k] ? 0 : off + 1;
          if (off > i.maxGap) return 'רווח של ' + off + ' בתוך ' + j(r);
        }
      }
      for (let k = 1; k < rs.length; k++) if (rs[k].from - rs[k - 1].to - 1 <= i.maxGap) return 'שתי קבוצות שהיה צריך לחבר ' + j([rs[k - 1], rs[k]]);
      return null;
    },
  },
  {
    atom: 'merge',
    id: 'merge.cover',
    says: 'כל "כן" נמצא בדיוק בקבוצה אחת — חוץ מקבוצה קצרה מהאורך המינימלי, שכולה נשמטת; וכל קבוצה ≥ האורך המינימלי',
    on: ['merge'],
    check: (i) => {
      if (i.k !== 'merge') return null;
      const rs = mergeRuns(i.items, undefined, { maxGap: i.maxGap, minLength: i.minLength });
      const minLen = Math.max(1, i.minLength);
      for (const r of rs) if (r.length < minLen) return 'קבוצה קצרה מ-' + minLen + ' ' + j(r);
      const want = clusters(i.items, i.maxGap).filter(([a, b]) => b - a + 1 >= minLen);
      if (j(want) !== j(rs.map((r) => [r.from, r.to]))) return 'הכיסוי ≠ האשכולות ' + j(want) + ' מול ' + j(rs);
      return null;
    },
  },
];

/* ═══════════════ ⏭️ next ═══════════════ */

const NEXT_LAWS: AtomLaw[] = [
  {
    atom: 'next',
    id: 'next.future',
    says: 'מה שחוזר תמיד אחרי "עכשיו" (אף פעם לא בעבר ולא ברגע עצמו), מהקרוב לרחוק',
    on: ['next.times'],
    check: (i) => {
      if (i.k !== 'next.times') return null;
      const r = nextAfter(i.times, i.now, i.count);
      for (const t of r) if (!(t > i.now)) return 'החזיר ' + t + ' שלא אחרי ' + i.now;
      for (let k = 1; k < r.length; k++) if (r[k] < r[k - 1]) return 'לא מהקרוב לרחוק';
      return null;
    },
  },
  {
    atom: 'next',
    id: 'next.earliest',
    says: 'מה שחוזר = בדיוק הכי-מוקדמים שעוד לא קרו (כמה שביקשו); אין כאלה ⇒ כלום',
    on: ['next.times'],
    check: (i) => {
      if (i.k !== 'next.times') return null;
      const r = nextAfter(i.times, i.now, i.count);
      const future = i.times.filter((t) => typeof t === typeof i.now && t > i.now).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      const want = future.slice(0, Math.max(0, Math.floor(i.count)));
      if (j(r) !== j(want)) return 'צריך ' + j(want) + ' וקיבלנו ' + j(r);
      return null;
    },
  },
  {
    atom: 'next',
    id: 'next.firstRun',
    says: 'הרצף הבא: הראשון שמתחיל מהמקום הנוכחי והלאה ואורכו ≥ המינימום; רצף שכבר התחיל נחתך מהמקום הנוכחי; אין ⇒ null',
    on: ['next.runs'],
    check: (i) => {
      if (i.k !== 'next.runs') return null;
      const runs: Run[] = mergeRuns(i.flags);
      const r = firstRun(runs, i.minLength, i.fromIndex);
      const min = Math.max(1, i.minLength);
      let want: Run | null = null;
      for (const x of runs) {
        if (x.to < i.fromIndex) continue;
        const from = Math.max(x.from, i.fromIndex);
        if (x.to - from + 1 >= min) {
          want = { from, to: x.to, length: x.to - from + 1 };
          break;
        }
      }
      if (j(r) !== j(want)) return 'צריך ' + j(want) + ' וקיבלנו ' + j(r);
      if (r && (r.from < i.fromIndex || !i.flags[r.from] || !i.flags[r.to])) return 'רצף בעבר / על "לא"';
      return null;
    },
  },
];

/* ═══════════════ 🎯 round ═══════════════ */

const ROUND_LAWS: AtomLaw[] = [
  {
    atom: 'round',
    id: 'round.multiple',
    says: 'התוצאה תמיד כפולה של היחידה',
    on: ['round'],
    check: (i) => {
      if (i.k !== 'round') return null;
      const r = roundTo(i.value, i.step, i.dir);
      return Number.isFinite(r) && isMultiple(r, i.step) ? null : i.value + ' ⇒ ' + r + ' לא כפולה של ' + i.step;
    },
  },
  {
    atom: 'round',
    id: 'round.direction',
    says: 'לחומרא למטה ⇒ לא עולה, ופחות מיחידה אחת מתחת · לחומרא למעלה ⇒ לא יורד, ופחות מיחידה מעל · לקרוב ⇒ לכל היותר חצי יחידה',
    on: ['round'],
    check: (i) => {
      if (i.k !== 'round') return null;
      const r = roundTo(i.value, i.step, i.dir);
      // סובלנות = רעש נקודה-צפה בלבד (קטנה בהרבה מכל צעד אפשרי)
      const t = 2e-9 * Math.max(1, Math.abs(i.value));
      const d = r - i.value;
      if (i.dir === 'down' && !(d <= t && d > -i.step + t / 2)) return i.value + ' למטה ⇒ ' + r;
      if (i.dir === 'up' && !(d >= -t && d < i.step - t / 2)) return i.value + ' למעלה ⇒ ' + r;
      if (i.dir === 'nearest' && !(Math.abs(d) <= i.step / 2 + t)) return i.value + ' לקרוב ⇒ ' + r;
      return null;
    },
  },
  {
    atom: 'round',
    id: 'round.idempotent',
    says: 'מספר שכבר עגול נשאר כמו שהוא (עיגול פעמיים = עיגול פעם אחת), בכל כיוון',
    on: ['round'],
    check: (i) => {
      if (i.k !== 'round') return null;
      const r = roundTo(i.value, i.step, i.dir);
      for (const dir of ['down', 'up', 'nearest'] as const) {
        const again = roundTo(r, i.step, dir);
        if (!near(again, r, 2e-9 * Math.max(1, Math.abs(r)))) return r + ' עוגל שוב (' + dir + ') ל-' + again;
      }
      return null;
    },
  },
];

/* ═══════════════ ⏱️ offset ═══════════════ */

const OFFSET_LAWS: AtomLaw[] = [
  {
    atom: 'offset',
    id: 'offset.exact',
    says: 'כל רגע זז בדיוק בכמות שביקשו — לא יותר ולא פחות, ולפי אותו סדר',
    on: ['offset.times'],
    check: (i) => {
      if (i.k !== 'offset.times') return null;
      const r = offsetAll(i.times, i.minutes);
      if (r.length !== i.times.length) return 'אבדו רגעים';
      for (let k = 0; k < r.length; k++) if (r[k] !== i.times[k] + i.minutes) return 'רגע ' + k + ': ' + r[k] + ' ≠ ' + (i.times[k] + i.minutes);
      return null;
    },
  },
  {
    atom: 'offset',
    id: 'offset.calendar',
    says: 'הזזה בדקות ובימים חוצה חצות, סוף חודש וסוף שנה ונוחתת בדיוק על התאריך והשעה הנכונים',
    on: ['offset.days'],
    check: (i) => {
      if (i.k !== 'offset.days') return null;
      const abs = dayIndex(i.iso) * 1440 + i.minute;
      const [moved] = offsetAll([abs], i.days * 1440 + i.minutes);
      const day = Math.floor(moved / 1440);
      const minute = moved - day * 1440;
      const wantMs = Date.parse(i.iso + 'T00:00:00Z') + (i.minute + i.days * 1440 + i.minutes) * 60_000;
      const want = new Date(wantMs).toISOString();
      const gotIso = new Date(day * DAY_MS).toISOString().slice(0, 10);
      if (gotIso !== want.slice(0, 10) || minute !== Number(want.slice(11, 13)) * 60 + Number(want.slice(14, 16))) return 'קיבלנו ' + gotIso + ' ' + minute + ' במקום ' + want;
      return null;
    },
  },
  {
    atom: 'offset',
    id: 'offset.relative',
    says: '"שם±N" = העוגן + N דקות בדיוק; עוגן חסר או שם לא-מוכר ⇒ null (לא ממציאים)',
    on: ['offset.relative'],
    check: (i) => {
      if (i.k !== 'offset.relative') return null;
      const tok = i.name + (i.delta ? (i.delta > 0 ? '+' : '-') + Math.abs(i.delta) : '');
      const r = resolveRelative(tok, i.anchors);
      const a = Object.prototype.hasOwnProperty.call(i.anchors, i.name) ? i.anchors[i.name] : undefined;
      const base = typeof a === 'number' ? a : typeof a === 'string' ? hhmmToMinutes(a) : null;
      const want = base === null ? null : base + i.delta;
      return r === want ? null : tok + ' ⇒ ' + r + ' במקום ' + want;
    },
  },
];

/* ═══════════════ 📣 escalate ═══════════════ */

const MIN = 60_000;
/** ההמתנה האפקטיבית של שלב לפי הכלל המתועד: בלי מקבלים ⇒ 0; דחוף ⇒ min(המתנה, המתנת-דחוף). */
function effWait(input: EscInput, k: number): number {
  const s = input.steps[k];
  const to = Array.isArray(s?.to) ? s.to.filter((x) => typeof x === 'string') : [];
  const w = Number.isFinite(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0;
  if (!to.length) return 0;
  if (input.urgent === true) {
    const u = Number.isFinite(input.urgentWaitMin) && (input.urgentWaitMin as number) >= 0 ? (input.urgentWaitMin as number) : 60;
    return Math.min(w, u);
  }
  return w;
}

const ESCALATE_LAWS: AtomLaw[] = [
  {
    atom: 'escalate',
    id: 'escalate.plan',
    says: 'לוח-הזמנים: השלבים לפי הסדר, כל שלב מתחיל בדיוק כשההמתנה של הקודם נגמרה (דחוף ⇒ ההמתנה הקצרה), הזמנים רק עולים',
    on: ['escalate'],
    check: (i) => {
      if (i.k !== 'escalate') return null;
      const plan = escalationPlan({ ...i.input, answeredMs: null });
      if (plan.length !== i.input.steps.length) return 'מספר שלבים ' + plan.length;
      let at = i.input.createdMs;
      for (let k = 0; k < plan.length; k++) {
        if (plan[k].stepIndex !== k) return 'שלב ' + k + ' לא לפי הסדר';
        if (plan[k].atMs !== at) return 'שלב ' + k + ' מתחיל ב-' + plan[k].atMs + ' במקום ' + at;
        if (k && (plan[k].atMs as number) < (plan[k - 1].atMs as number)) return 'זמנים יורדים';
        at += effWait(i.input, k) * MIN;
      }
      return null;
    },
  },
  {
    atom: 'escalate',
    id: 'escalate.state',
    says: 'בכל רגע (מהיצירה והלאה): השלב הנוכחי כבר התחיל, ההמתנה שלו עוד לא נגמרה, "למי" = המקבלים של השלב, ומעבר הבא = סוף ההמתנה',
    on: ['escalate'],
    check: (i) => {
      if (i.k !== 'escalate') return null;
      const plan = escalationPlan({ ...i.input, answeredMs: null });
      const atCreate = escalationState({ ...i.input, answeredMs: null, nowMs: i.input.createdMs });
      for (const now of i.probes) {
        const st = escalationState({ ...i.input, answeredMs: null, nowMs: now });
        const k = st.stepIndex;
        // לפני היצירה עוד לא זז כלום: לא רחוק יותר מהשלב של רגע היצירה
        if (now < i.input.createdMs) {
          if (k < 0 || k > atCreate.stepIndex) return 'לפני היצירה בשלב ' + k + ' (ברגע היצירה ' + atCreate.stepIndex + ')';
          continue;
        }
        if (k < 0 || k >= plan.length) return 'שלב ' + k + ' מחוץ לתחום';
        if ((plan[k].atMs as number) > now) return 'ב-' + now + ' בשלב ' + k + ' שעוד לא התחיל';
        if (j(st.currentTo) !== j(i.input.steps[k].to)) return 'המקבלים לא של שלב ' + k;
        const end = (plan[k].atMs as number) + effWait(i.input, k) * MIN;
        const last = k === plan.length - 1;
        if (last !== st.done) return 'done=' + st.done + ' בשלב ' + k;
        if (!last && st.nextMoveMs !== end) return 'מעבר ב-' + st.nextMoveMs + ' במקום ' + end;
        if (!last && end <= now) return 'ההמתנה של שלב ' + k + ' כבר נגמרה וזה עוד לא עבר';
      }
      return null;
    },
  },
  {
    atom: 'escalate',
    id: 'escalate.nobody-skipped',
    says: 'אף אחד לא מדולג: כל שלב עם מקבלים והמתנה > 0 הוא "הנוכחי" בדיוק מרגע ההתחלה שלו; והשלב רק מתקדם עם הזמן',
    on: ['escalate'],
    check: (i) => {
      if (i.k !== 'escalate') return null;
      const plan = escalationPlan({ ...i.input, answeredMs: null });
      for (let k = 0; k < plan.length; k++) {
        const own = effWait(i.input, k) > 0 || k === plan.length - 1;
        const hasTo = i.input.steps[k].to.length > 0;
        if (!own || !hasTo) continue;
        const st = escalationState({ ...i.input, answeredMs: null, nowMs: plan[k].atMs as number });
        if (st.stepIndex !== k) return 'שלב ' + k + ' דולג (ברגע שלו הנוכחי = ' + st.stepIndex + ')';
      }
      const sorted = [...i.probes].sort((a, b) => a - b);
      let prev = -1;
      for (const now of sorted) {
        const s = escalationState({ ...i.input, answeredMs: null, nowMs: now }).stepIndex;
        if (s < prev) return 'השלב חזר אחורה ב-' + now;
        prev = s;
      }
      return null;
    },
  },
  {
    atom: 'escalate',
    id: 'escalate.answered',
    says: 'תשובה מקפיאה: מרגע התשובה והלאה המצב = המצב ברגע התשובה, ואין יותר מעבר',
    on: ['escalate'],
    check: (i) => {
      if (i.k !== 'escalate' || !Number.isFinite(i.input.answeredMs)) return null;
      const ans = i.input.answeredMs as number;
      const at = escalationState({ ...i.input, answeredMs: null, nowMs: ans });
      for (const now of i.probes) {
        if (now < ans) continue;
        const st = escalationState({ ...i.input, nowMs: now });
        if (!st.done || st.nextMoveMs !== null) return 'אחרי התשובה עדיין זז';
        if (st.stepIndex !== at.stepIndex) return 'אחרי התשובה בשלב ' + st.stepIndex + ' ולא ' + at.stepIndex;
      }
      return null;
    },
  },
];

/* ═══════════════ 🔄 rotate ═══════════════ */

const ROTATE_LAWS: AtomLaw[] = [
  {
    atom: 'rotate',
    id: 'rotate.fair',
    says: 'הוגן: בכל חלון של ימים/סבבים רצופים, ההפרש בין מי שקיבל הכי הרבה למי שקיבל הכי מעט ≤ 1',
    on: ['rotate'],
    check: (i) => {
      if (i.k !== 'rotate' || !i.list.length) return null;
      const cnt = Array.from({ length: i.list.length }, () => 0);
      for (let n = i.start; n < i.start + i.window; n++) cnt[turnIndex(i.list.length, n)]++;
      const spread = Math.max(...cnt) - Math.min(...cnt);
      return spread <= 1 ? null : 'חלון ' + i.window + ' מ-' + i.start + ': ' + j(cnt);
    },
  },
  {
    atom: 'rotate',
    id: 'rotate.order',
    says: 'לפי הסדר: אחרי כל אחד בא הבא ברשימה (ואחרי האחרון — הראשון); אותו מספר ⇒ אותו אדם תמיד',
    on: ['rotate'],
    check: (i) => {
      if (i.k !== 'rotate' || !i.list.length) return null;
      const L = i.list.length;
      for (let n = i.start; n < i.start + Math.min(i.window, 3 * L); n++) {
        const a = turnIndex(L, n);
        const b = turnIndex(L, n + 1);
        if (a < 0 || a >= L) return 'אינדקס ' + a + ' מחוץ לרשימה';
        if (b !== (a + 1) % L) return 'אחרי ' + a + ' בא ' + b;
        if (turnOf(i.list, n) !== i.list[a] || turnOf(i.list, n + L) !== i.list[a]) return 'לא יציב ב-' + n;
      }
      return null;
    },
  },
  {
    atom: 'rotate',
    id: 'rotate.assign',
    says: 'שיבוץ פריטים: כל פריט מקבל אדם אחד, לפי הסדר מנקודת ההתחלה, וההפרש בין האנשים ≤ 1',
    on: ['rotate'],
    check: (i) => {
      if (i.k !== 'rotate' || !i.list.length) return null;
      const items = Array.from({ length: i.items }, (_, k) => k);
      const people = i.list.map((_, k) => k);
      const a = fairAssign(items, people, i.start);
      if (a.length !== items.length) return 'פריטים אבדו';
      const cnt = Array.from({ length: people.length }, () => 0);
      for (let k = 0; k < a.length; k++) {
        if (a[k].item !== k) return 'הסדר של הפריטים השתנה';
        if (a[k].person !== turnIndex(people.length, i.start + k)) return 'פריט ' + k + ' לא לפי התור';
        cnt[a[k].person]++;
      }
      return a.length && Math.max(...cnt) - Math.min(...cnt) > 1 ? 'לא הוגן ' + j(cnt) : null;
    },
  },
  {
    atom: 'rotate',
    id: 'rotate.days',
    says: 'לפי יום: יום אחרי יום = מספר-יום עוקב, גם בסוף חודש, סוף שנה ומעבר שעון קיץ/חורף',
    on: ['rotate.days'],
    check: (i) => {
      if (i.k !== 'rotate.days') return null;
      const d0 = dayIndex(i.iso);
      for (let k = 1; k <= i.days; k++) {
        const iso = isoPlus(i.iso, k);
        if (dayIndex(iso) !== d0 + k) return iso + ' ⇒ ' + dayIndex(iso) + ' במקום ' + (d0 + k);
      }
      return null;
    },
  },
];

/* ═══════════════ 🔍 fuzzy ═══════════════ */

const FUZZY_LAWS: AtomLaw[] = [
  {
    atom: 'fuzzy',
    id: 'fuzzy.finds',
    says: 'מוצא את המילה המדויקת, כל טעות-הקלדה אחת (במילה של 4 אותיות ומעלה — הכלל המתועד), ותחיליות ו/ה/ב/ל/מ/ש/כ',
    on: ['fuzzy'],
    check: (i) => {
      if (i.k !== 'fuzzy' || i.expect === 'far') return null;
      const ids = fuzzyFind(i.query, i.candidates);
      const want = i.candidates.filter((c) => c.text.split(' ').includes(i.target)).map((c) => c.id);
      for (const w of want) if (!ids.includes(w)) return '"' + i.query + '" (' + i.expect + ') לא מצא את "' + i.target + '"';
      return null;
    },
  },
  {
    atom: 'fuzzy',
    id: 'fuzzy.far',
    says: 'מילה רחוקה (אף אות משותפת, בלי תחילית) — לא נמצאת',
    on: ['fuzzy'],
    check: (i) => {
      if (i.k !== 'fuzzy' || i.expect !== 'far') return null;
      const ids = fuzzyFind(i.query, i.candidates);
      return ids.length ? '"' + i.query + '" (רחוקה) מצאה ' + j(ids) : null;
    },
  },
  {
    atom: 'fuzzy',
    id: 'fuzzy.rank',
    says: 'מי שמכיל את המילה המדויקת מדורג לפני מי שנמצא רק בזכות טעות; אותו קלט ⇒ אותו סדר',
    on: ['fuzzy'],
    check: (i) => {
      if (i.k !== 'fuzzy' || i.expect !== 'exact') return null;
      const ids = fuzzyFind(i.query, i.candidates);
      if (j(ids) !== j(fuzzyFind(i.query, i.candidates))) return 'לא דטרמיניסטי';
      const q = normHe(i.query);
      const exact = i.candidates.filter((c) => normHe(c.text).split(' ').includes(q)).map((c) => c.id);
      const pos = (id: string): number => ids.indexOf(id);
      for (const e of exact) for (const o of ids) if (!exact.includes(o) && pos(o) < pos(e)) return 'מועמד בלי המילה ("' + o + '") לפני המדויק ("' + e + '")';
      return null;
    },
  },
];

/** כל החוקים, לפי סדר החלקים בחוזה. */
export const ATOM_LAWS: readonly AtomLaw[] = [...DIVIDE_LAWS, ...MERGE_LAWS, ...NEXT_LAWS, ...ROUND_LAWS, ...OFFSET_LAWS, ...ESCALATE_LAWS, ...ROTATE_LAWS, ...FUZZY_LAWS];

/** החוקים של חלק, לפי סוג הקלט. */
export const lawsFor = (atom: AtomId, kind: InputKind): AtomLaw[] => ATOM_LAWS.filter((l) => l.atom === atom && l.on.includes(kind));

/** הקלטים שכל חלק מקבל (המחולל מסתובב ביניהם). */
export const ATOM_INPUTS: Readonly<Record<AtomId, readonly InputKind[]>> = {
  divide: ['divide.parts', 'divide.size', 'divide.amount', 'divide.points'],
  merge: ['merge'],
  next: ['next.times', 'next.runs'],
  round: ['round'],
  offset: ['offset.times', 'offset.days', 'offset.relative'],
  escalate: ['escalate'],
  rotate: ['rotate', 'rotate.days'],
  fuzzy: ['fuzzy'],
};

/** כל החוקים שנכשלים על קלט (ריק = הכול תקין). חוק שזורק = כישלון. */
export function violations(atom: AtomId, input: AtomInput): { law: string; why: string }[] {
  const out: { law: string; why: string }[] = [];
  for (const l of lawsFor(atom, input.k)) {
    let why: string | null;
    try {
      why = l.check(input);
    } catch (e) {
      why = 'זרק: ' + (e instanceof Error ? e.message : String(e));
    }
    if (why) out.push({ law: l.id, why });
  }
  return out;
}
