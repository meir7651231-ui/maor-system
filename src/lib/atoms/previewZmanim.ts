/**
 * 🧬 מנועים וחלקים — התצוגות האמיתיות של 🕯️ מחשבון הזמנים (ATOMS-PREVIEWS, 14.10.2026).
 *
 * כל מקום של מנוע הזמנים × כל חלק שמתחבר אליו ⇒ `{ title, lines }` על המיקום של הארגון: אותו מיקום כמו לוח-הזמנים
 * (`resolveZmanimLoc(db.ui.parnasa.zmanim)` — ואם אין, בני ברק), ואותו חישוב NOAA (`zmanimBoard.ts` ⇒ telephony engine).
 * אין שעה מומצאת: זמן שאי אפשר לחשב (קוטב) ⇒ שורה שאומרת זאת, לא מספר.
 *
 * בנוסף — הערכה המשותפת לשלושת קבצי-התצוגה (`previewWhatNeed`, `previewBookingsMore`): קריאת-פרטים, חיתוך-שורות,
 * שעון ישראל. **בכוונה לא מייבאים ערכים מ-preview.ts** (רק טיפוסים): preview.ts מייבא את הקבצים האלה ופורס אותם
 * ב-BUILDERS; ייבוא-ערך הפוך היה יוצר מעגל, וכניסה דרך הקובץ הזה הייתה פוגשת את BUILDERS לפני שהוא קיים.
 * טהור ודטרמיניסטי: "עכשיו" רק מ-`ctx.nowMs`. לעולם לא זורק (וגם previewOf עוטף).
 */
import type { ClosedWindow } from '../telephony/engine';
import type { Builder, Preview, PreviewCtx } from './preview';
import {
  addDaysIso,
  clockAt,
  dayInfo,
  dayTimes,
  dayZmanim,
  hmToMin,
  locNote,
  minToHm,
  PR_DAY_NAMES,
  PR_MGA_MIN,
  PR_TZ,
  resolveZmanimLoc,
  shabbatOf,
  upcomingClosures,
  type PrClock,
  type PrZmanimLoc,
} from '../../components/parnasa/zmanimBoard';
import { divideAmount, divideSpan, type Piece } from './parts/divide';
import { mergeRuns } from './parts/merge';
import { nextAfter } from './parts/next';
import { roundTo, type RoundDir } from './parts/round';
import { offsetAll } from './parts/offset';

/* ═══════════════ הערכה המשותפת ═══════════════ */

/** כמו PREVIEW_MAX_LINES של preview.ts (ננעל ב-ratchet ששניהם 6). */
export const KIT_MAX_LINES = 6;
/** כמה ימים קדימה בודקים שבתות וחגים. */
export const CLOSED_WINDOW_DAYS = 30;

export type Params = Record<string, number | string>;

export const num = (p: Params, k: string, d: number): number => (typeof p[k] === 'number' && Number.isFinite(p[k] as number) ? (p[k] as number) : d);
export const str = (p: Params, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);

/** עד 6 שורות; השאר ⇒ "ועוד N". */
export function capped(lines: string[]): string[] {
  if (lines.length <= KIT_MAX_LINES) return lines;
  return [...lines.slice(0, KIT_MAX_LINES - 1), 'ועוד ' + (lines.length - KIT_MAX_LINES + 1)];
}

/** תצוגה רק כשיש שורות. */
export const out = (title: string, lines: string[]): Preview | null => (lines.length ? { title, lines: capped(lines) } : null);

/** שעון-הקיר בישראל ברגע המוזרק. */
export const israelClock = (ctx: PreviewCtx): PrClock => clockAt(ctx.nowMs, PR_TZ);

/** "2026-10-20" ⇒ "20/10". */
export function dm(iso: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  return m ? +m[2] + '/' + +m[1] : iso;
}

/** ₪ עם מפריד-אלפים, עד אגורות. */
export const shekel = (n: number): string => '₪' + (Math.round(n * 100) / 100).toLocaleString('en-US');

/** משך בדקות ⇒ עברית פשוטה: "חצי שעה" · "שעה ו-20 דקות" · "57 דקות ו-30 שניות". */
export function durationText(min: number): string {
  const sec = Math.round(min * 60);
  if (sec <= 0) return '0 דקות';
  const s = sec % 60;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!s) {
    if (m === 15) return 'רבע שעה';
    if (m === 30) return 'חצי שעה';
    if (m === 60) return 'שעה';
    if (m === 120) return 'שעתיים';
  }
  const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
  const parts: string[] = [];
  if (h) parts.push(H);
  if (r) parts.push(r + ' דקות');
  if (s) parts.push(s + ' שניות');
  if (!parts.length) return '0 דקות';
  return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' ו-' + parts[parts.length - 1];
}

/** חלוקת טווח-דקות לפי הפרטים: למספר חלקים, או לגודל קבוע עם הפסקה ושארית (כמו preview.ts). */
export function divideBy(span: { from: number; to: number }, p: Params): Piece[] {
  return str(p, 'by', 'parts') === 'size'
    ? divideSpan(span, { size: num(p, 'size', 30), gap: num(p, 'gap', 0), remainder: str(p, 'remainder', 'drop') === 'shorten' ? 'shorten' : 'drop' })
    : divideSpan(span, { parts: num(p, 'parts', 12) });
}

/** סכום מחולק: למספר תשלומים, או לגודל-תשלום (האחרון סופג את השארית) — כמו preview.ts. */
export function divideMoney(total: number, p: Params): number[] {
  if (str(p, 'by', 'parts') === 'size') return divideBy({ from: 0, to: total }, { ...p, gap: 0, remainder: 'shorten' }).map((x) => x.length);
  return divideAmount(total, num(p, 'parts', 12), 1);
}

/** "₪1,200 = 3 × ₪400" · "₪1,000 = ₪334 + 2 × ₪333" — אותו נוסח כמו installmentsLine של preview.ts. */
export function moneyLine(total: number, pieces: readonly number[]): string {
  if (!pieces.length) return shekel(total);
  const groups: { v: number; n: number }[] = [];
  for (const v of pieces) {
    const g = groups[groups.length - 1];
    if (g && g.v === v) g.n++;
    else groups.push({ v, n: 1 });
  }
  return shekel(total) + ' = ' + groups.map((g) => (g.n > 1 ? g.n + ' × ' + shekel(g.v) : shekel(g.v))).join(' + ');
}

/** "היום" · "מחר" · "ביום ראשון 18/10". */
export function dayWord(iso: string, todayIso: string): string {
  if (iso === todayIso) return 'היום';
  if (iso === addDaysIso(todayIso, 1)) return 'מחר';
  const d = new Date(iso + 'T12:00:00Z').getUTCDay();
  return 'ביום ' + (PR_DAY_NAMES[d] ?? '') + ' ' + dm(iso);
}

/* ═══════════════ המיקום והזמנים ═══════════════ */

/** המיקום של הארגון — בדיוק כמו לוח-הזמנים (פרנסה׳לע); חסר ⇒ בני ברק. */
export function zmanimLoc(ctx: PreviewCtx): PrZmanimLoc {
  const ui = ctx.db && typeof ctx.db === 'object' ? ctx.db.ui : undefined;
  const pr = ui && typeof ui === 'object' ? ui.parnasa : undefined;
  const z = pr && typeof pr === 'object' && pr.zmanim && typeof pr.zmanim === 'object' ? pr.zmanim : null;
  return resolveZmanimLoc(z);
}

/** "לפי בני ברק". */
const where = (loc: PrZmanimLoc): string => locNote(loc).replace(/^לפי אופק /, 'לפי ');

/** השעון באזור-הזמן של המיקום (ישראל, אלא אם הארגון בחו״ל). */
const clockOf = (ctx: PreviewCtx, loc: PrZmanimLoc): PrClock => clockAt(ctx.nowMs, loc.tz);

/** דקות (עם שבר) ⇒ "09:13:40" (שניות למטה — כדי שהעיגול שאחריו לא ייראה סותר). */
export function hms(min: number): string {
  const totalSec = Math.floor(min * 60 + 1e-6);
  const x = ((totalSec % 86_400) + 86_400) % 86_400;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return pad(Math.floor(x / 3600)) + ':' + pad(Math.floor((x % 3600) / 60)) + ':' + pad(x % 60);
}

const CANT = (loc: PrZmanimLoc): Preview => ({
  title: 'אי אפשר לחשב את הזמנים · ' + where(loc),
  lines: ['השמש לא זורחת או לא שוקעת במקום הזה היום, ולכן אין זמנים. לא ממציאים שעה.'],
});

/** "סוף זמן ק״ש" ⇒ "סוף זמן קריאת שמע"; עם המקור בסוגריים. */
const zmanLabel = (label: string, sub: string): string => {
  const l = label.replace('ק״ש', 'קריאת שמע');
  return sub && !/דק׳/.test(sub) ? l + ' (' + sub + ')' : l;
};

/* ───────── zmanim.day · ✂️ — השעות הזמניות ───────── */

function dayDivide(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const t = dayTimes(clock.iso, loc);
  const sr = hmToMin(t.sunrise);
  const ss = hmToMin(t.sunset);
  if (sr === null || ss === null || ss <= sr) return CANT(loc);
  const pieces = divideBy({ from: sr, to: ss }, p);
  if (!pieces.length) return null;
  const twelve = str(p, 'by', 'parts') !== 'size' && pieces.length === 12;
  const head = twelve
    ? 'שעה זמנית היום = ' + durationText(pieces[0].length)
    : pieces.length + ' חלקים של ' + durationText(pieces[0].length);
  const lines = pieces.map((x, i) => (twelve ? 'שעה ' : 'חלק ') + (i + 1) + ' · ' + minToHm(Math.round(x.from)) + '–' + minToHm(Math.round(x.to)));
  return { title: head + ' · מהנץ ' + t.sunrise + ' עד השקיעה ' + t.sunset + ' · ' + where(loc), lines: capped(lines) };
}

/* ───────── zmanim.shabbat · ✂️ — משמרות בשבת ───────── */

function shabbatDivide(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const sh = shabbatOf(clockOf(ctx, loc), loc);
  const candle = hmToMin(sh.candle);
  const end = hmToMin(sh.end);
  if (!sh.friIso || candle === null || end === null) {
    return { title: 'אי אפשר לחשב את זמני השבת · ' + where(loc), lines: ['אין שעת הדלקה או צאת שבת במקום הזה השבוע. לא ממציאים שעה.'] };
  }
  const span = { from: candle, to: 1440 + end };
  const pieces = divideBy(span, p);
  if (!pieces.length) return null;
  const at = (m: number): string => {
    const r = Math.round(m);
    return (r >= 1440 ? 'שבת ' : 'שישי ') + minToHm(r);
  };
  const lines = pieces.map((x, i) => {
    const a = at(x.from);
    const b = at(x.to);
    return 'משמרת ' + (i + 1) + ' · ' + a + '–' + (a.split(' ')[0] === b.split(' ')[0] ? b.split(' ')[1] : b);
  });
  return {
    title: 'השבת ' + dm(sh.friIso) + '–' + dm(sh.satIso) + ' · מהדלקת הנרות ' + sh.candle + ' עד צאת השבת ' + sh.end + ' · ' + pieces.length + ' משמרות של ' + durationText(pieces[0].length),
    lines: capped(lines),
  };
}

/** FACTORY 14.10: היום מהנץ עד השקיעה (דקות) — הבסיס של ✂️ על היום, גם כשבונים עליו. אי אפשר לחשב ⇒ null. */
export function zmanimDaySpan(ctx: PreviewCtx): { from: number; to: number; label: string } | null {
  const loc = zmanimLoc(ctx);
  const t = dayTimes(clockOf(ctx, loc).iso, loc);
  const sr = hmToMin(t.sunrise);
  const ss = hmToMin(t.sunset);
  return sr === null || ss === null || ss <= sr ? null : { from: sr, to: ss, label: t.sunrise + '–' + t.sunset };
}

/** FACTORY 14.10: זמני היום והמחר כרגעים (יום·דקה), עם שם הזמן — הבסיס של ⏭️ ⏱️ 🎯 כשבונים על מחשבון הזמנים. */
export function zmanimMoments(ctx: PreviewCtx): { iso: string; minute: number; name: string }[] {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const out: { iso: string; minute: number; name: string }[] = [];
  for (const iso of [clock.iso, addDaysIso(clock.iso, 1)])
    for (const r of timedRows(iso, loc)) {
      const m = hmToMin(r.time);
      if (m !== null) out.push({ iso, minute: m, name: r.name });
    }
  return out;
}

/* ───────── zmanim.times · ⏭️ ⏱️ 🎯 ───────── */

/** זמני היום שיש להם שעה (בסדר הלוח). */
const timedRows = (iso: string, loc: PrZmanimLoc): { key: string; name: string; time: string }[] =>
  dayZmanim(iso, loc)
    .filter((r) => r.time)
    .map((r) => ({ key: r.key, name: zmanLabel(r.label, r.sub), time: r.time as string }));

function timesNext(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const count = Math.max(1, Math.min(KIT_MAX_LINES, Math.floor(num(p, 'count', 1))));
  const today = timedRows(clock.iso, loc);
  const tomorrowIso = addDaysIso(clock.iso, 1);
  const tomorrow = timedRows(tomorrowIso, loc);
  if (!today.length && !tomorrow.length) return CANT(loc);
  // רגע = "יום|שעה" — מסתדר לפי סדר (next לא יודע מה זה זמן)
  const all = new Map<string, string>();
  for (const r of today) all.set(clock.iso + ' ' + r.time + ' ' + r.key, r.name + ' ' + r.time);
  for (const r of tomorrow) all.set(tomorrowIso + ' ' + r.time + ' ' + r.key, 'מחר · ' + r.name + ' ' + r.time);
  const next = nextAfter([...all.keys()], clock.iso + ' ' + clock.hhmm + ' ~', count);
  if (!next.length) return null;
  const lines = next.map((k, i) => (i === 0 ? 'הזמן הבא: ' : '') + all.get(k)!);
  return { title: (count > 1 ? 'הזמנים הבאים' : 'הזמן הבא') + ' · עכשיו ' + clock.hhmm + ' · ' + where(loc), lines };
}

/** הזמנים העיקריים להזזה (מה שמניינים ותזכורות נבנים עליו). */
const OFFSET_KEYS = ['netz', 'chatzot', 'minchaK', 'candle', 'shkia', 'tzeis', 'end'];

function timesOffset(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const rows = timedRows(clock.iso, loc).filter((r) => OFFSET_KEYS.includes(r.key));
  if (!rows.length) return CANT(loc);
  const minutes = num(p, 'minutes', -10);
  const base = rows.map((r) => hmToMin(r.time) ?? 0);
  const moved = offsetAll(base, minutes);
  const dayNote = (m: number): string => (m < 0 ? ' (יום קודם)' : m >= 1440 ? ' (למחרת)' : '');
  const lines = rows.map((r, i) => r.name + ' ' + r.time + ' ← ' + minToHm(moved[i]) + dayNote(moved[i])).slice(0, KIT_MAX_LINES);
  const rel = minutes === 0 ? 'בדיוק בזמן' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל זמן';
  const example = rows.find((r) => r.key === 'shkia');
  const ex = example && minutes !== 0 ? ' · למשל: מניין ' + Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' השקיעה ← ' + minToHm(moved[rows.indexOf(example)]) : '';
  return { title: rel + ex + ' · ' + where(loc), lines };
}

/**
 * הזמנים המחושבים של היום לפני העיגול (דקות עם שבר) — אותן נוסחאות כמו dayZmanim בלוח, וכיוון-החומרא של הלוח:
 * סוף זמן ⇒ למטה, תחילת זמן ⇒ למעלה.
 */
function rawZmanim(iso: string, loc: PrZmanimLoc): { name: string; raw: number; dir: RoundDir; kind: 'סוף' | 'התחלה' }[] | null {
  const t = dayTimes(iso, loc);
  const sr = hmToMin(t.sunrise);
  const ss = hmToMin(t.sunset);
  if (sr === null || ss === null || ss <= sr) return null;
  const gra = (ss - sr) / 12;
  const dawn = sr - PR_MGA_MIN;
  const mga = (ss + PR_MGA_MIN - dawn) / 12;
  return [
    { name: 'סוף זמן קריאת שמע (מגן אברהם)', raw: dawn + 3 * mga, dir: 'down', kind: 'סוף' },
    { name: 'סוף זמן קריאת שמע (גר״א)', raw: sr + 3 * gra, dir: 'down', kind: 'סוף' },
    { name: 'סוף זמן תפילה (גר״א)', raw: sr + 4 * gra, dir: 'down', kind: 'סוף' },
    { name: 'מנחה גדולה', raw: sr + 6.5 * gra, dir: 'up', kind: 'התחלה' },
    { name: 'מנחה קטנה', raw: sr + 9.5 * gra, dir: 'up', kind: 'התחלה' },
    { name: 'פלג המנחה', raw: sr + 10.75 * gra, dir: 'up', kind: 'התחלה' },
  ];
}

function timesRound(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const rows = rawZmanim(clock.iso, loc);
  if (!rows) return CANT(loc);
  const step = num(p, 'step', 1);
  const nearest = str(p, 'dir', 'down') === 'nearest';
  const lines = rows.map((r) => {
    const v = roundTo(r.raw, step, nearest ? 'nearest' : r.dir);
    return r.name + ' ' + hms(r.raw) + ' ← ' + minToHm(v);
  });
  const unit = step === 1 ? 'לדקה' : 'ל-' + step + ' דקות';
  const how = nearest ? 'לקרוב' : 'לחומרא: סוף זמן למטה, התחלה למעלה';
  return { title: 'מעוגל ' + unit + ' ' + how + ' · ' + where(loc), lines: capped(lines) };
}

/* ───────── zmanim.closedDays · 🔗 ⏭️ ───────── */

export interface ClosedRun {
  /** היום הסגור הראשון והאחרון. */
  first: string;
  last: string;
  /** כמה ימים בחלון (כולל ימי חול שנבלעו). */
  days: number;
  /** כמה ימי חול נבלעו באמצע (maxGap > 0). */
  gapDays: number;
  /** "שבת" · "ראש השנה ושבת". */
  name: string;
  /** ערב-היום-הראשון: שעת ההדלקה ('' = אי אפשר לחשב). */
  startIso: string;
  startTime: string;
  /** היום האחרון: צאת ('' = אי אפשר לחשב ⇒ כל היום סגור). */
  endTime: string;
}

/**
 * הימים הסגורים (שבת / יום טוב) מ-fromIso, `days` ימים — כל יום כן/לא — מחוברים בחלק 🔗 (maxGap/minLength מהפרטים).
 * הגבולות: ההדלקה בערב היום הראשון וצאת ביום האחרון, מאותו מחשבון (dayTimes). חלון שכבר נגמר ⇒ לא מוחזר.
 */
export function closedRuns(loc: PrZmanimLoc, clock: PrClock, opts: { maxGap?: number; minLength?: number; days?: number } = {}): ClosedRun[] {
  const n = Math.max(1, Math.min(120, Math.floor(opts.days ?? CLOSED_WINDOW_DAYS)));
  const days: { iso: string; closed: boolean; holiday: string; dow: number }[] = [];
  for (let i = 0; i < n; i++) {
    const iso = addDaysIso(clock.iso, i);
    const d = dayInfo(iso, loc);
    days.push({ iso, closed: d.closed, holiday: d.cls.yomTov ?? '', dow: d.cls.dow });
  }
  const runs = mergeRuns(days, (d) => d.closed, { maxGap: opts.maxGap, minLength: opts.minLength });
  const outRuns: ClosedRun[] = [];
  const nowKey = clock.iso + ' ' + clock.hhmm;
  for (const r of runs) {
    const span = days.slice(r.from, r.to + 1);
    let first = span[0].iso;
    // היום הראשון בחלון הוא היום ⇒ אולי החלון התחיל לפני היום (חג ואחריו שבת)
    for (let i = 0; i < 4 && r.from === 0 && dayInfo(addDaysIso(first, -1), loc).closed; i++) first = addDaysIso(first, -1);
    const last = span[span.length - 1].iso;
    const eve = addDaysIso(first, -1);
    const startTime = dayTimes(eve, loc).candle;
    const endTime = dayTimes(last, loc).tzeis;
    if ((endTime ? last + ' ' + endTime : last + ' 23:59') <= nowKey) continue;
    const names: string[] = [];
    for (const d of span) {
      if (!d.closed) continue;
      for (const nm of [d.holiday, d.dow === 6 ? 'שבת' : '']) if (nm && !names.includes(nm)) names.push(nm);
    }
    outRuns.push({
      first,
      last,
      days: Math.round((Date.parse(last + 'T12:00:00Z') - Date.parse(first + 'T12:00:00Z')) / 86_400_000) + 1,
      gapDays: span.filter((d) => !d.closed).length,
      name: names.length > 1 ? names.slice(0, -1).join(', ') + ' ו' + names[names.length - 1] : names[0] || 'יום סגור',
      startIso: eve,
      startTime,
      endTime,
    });
  }
  return outRuns;
}

/** "מ-16/10 17:46 עד 17/10 18:47" — בלי שעה (קוטב) ⇒ "כל היום". */
export function windowText(w: { startIso: string; startTime: string; last: string; endTime: string }): string {
  if (!w.startTime && !w.endTime) {
    const first = addDaysIso(w.startIso, 1);
    return 'סגור כל היום ' + (first === w.last ? dm(first) : dm(first) + '–' + dm(w.last)) + ' (אי אפשר לחשב שעה)';
  }
  const a = w.startTime ? dm(w.startIso) + ' ' + w.startTime : dm(addDaysIso(w.startIso, 1)) + ' (כל היום — אי אפשר לחשב שעה)';
  const b = w.endTime ? dm(w.last) + ' ' + w.endTime : dm(w.last) + ' (עד סוף היום — אי אפשר לחשב שעה)';
  return 'מ-' + a + ' עד ' + b;
}

function closedMerge(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const runs = closedRuns(loc, clockOf(ctx, loc), { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
  const lines = runs.map((r) => {
    const many = r.days > 1;
    const head = many ? r.name + ' · ' + r.days + ' ימים צמודים' + (r.gapDays ? ' (כולל ' + r.gapDays + ' ימי חול באמצע)' : '') + ' ← חלון סגור אחד' : r.name;
    return head + ' · ' + windowText(r);
  });
  return out('השבתות והחגים ב-' + CLOSED_WINDOW_DAYS + ' הימים הקרובים · ' + where(loc), lines);
}

/** חלונות שבת/חג שעוד לא נגמרו — ממנוע הטלפוניה (upcomingClosures), אותו מקור כמו "שבת/חג קרוב" בלוח. */
function upcoming(ctx: PreviewCtx, loc: PrZmanimLoc): ClosedWindow[] {
  return upcomingClosures(clockOf(ctx, loc), loc, CLOSED_WINDOW_DAYS);
}

function closedNext(ctx: PreviewCtx, p: Params): Preview | null {
  const loc = zmanimLoc(ctx);
  const clock = clockOf(ctx, loc);
  const count = Math.max(1, Math.min(KIT_MAX_LINES, Math.floor(num(p, 'count', 1))));
  const min = Math.max(1, Math.floor(num(p, 'minLength', 1)));
  const wins = upcoming(ctx, loc).filter((w) => w.days >= min);
  const keyed = new Map(wins.map((w) => [w.endIso + ' ' + (w.endTime || '23:59') + ' ' + w.startIso, w]));
  const next = nextAfter([...keyed.keys()], clock.iso + ' ' + clock.hhmm, count);
  if (!next.length) return null;
  const nowKey = clock.iso + ' ' + clock.hhmm;
  const lines = next.map((k, i) => {
    const w = keyed.get(k)!;
    const now = w.startIso + ' ' + (w.startTime || '00:00') <= nowKey ? ' (עכשיו)' : '';
    const name = w.reason || 'שבת';
    // fail-closed של המנוע (קוטב): 00:00–23:59 ⇒ "כל היום", לא שעה
    const blind = w.startTime === '00:00' && w.endTime === '23:59';
    const win = blind ? { startIso: addDaysIso(w.startIso, -1), startTime: '', last: w.endIso, endTime: '' } : { startIso: w.startIso, startTime: w.startTime, last: w.endIso, endTime: w.endTime };
    return (i === 0 ? (w.kind === 'yomtov' ? 'החג הבא: ' : 'השבת הבאה: ') : '') + name + (w.days > 1 ? ' · ' + w.days + ' ימים' : '') + now + ' · ' + windowText(win);
  });
  return { title: 'השבת או החג הבא · ' + where(loc), lines };
}

export const ZMANIM_BUILDERS: Readonly<Record<string, Builder>> = {
  'zmanim.day:divide': dayDivide,
  'zmanim.shabbat:divide': shabbatDivide,
  'zmanim.times:next': timesNext,
  'zmanim.times:offset': timesOffset,
  'zmanim.times:round': timesRound,
  'zmanim.closedDays:merge': closedMerge,
  'zmanim.closedDays:next': closedNext,
};
