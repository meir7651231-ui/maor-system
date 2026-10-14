/**
 * 🧬 מנועים וחלקים — התצוגה האמיתית של יכולת (ATOMS, 14.10.2026): "מה החיבור הזה נותן אצלכם, עכשיו".
 *
 * `previewOf(cap, ctx)` ⇒ `{ title, lines }` או null. מחושב רק מהנתונים האמיתיים של הארגון — דרך הקוראים של
 * מנוע-ההזמנות (`engines/bookingsData.ts`) והחלקים עצמם (`parts/`), עם הפרטים שנבחרו ביכולת.
 * null ⇒ אין עדיין תצוגה כנה (המסך כותב "התצוגה תגיע בקרוב"). **בלי שמות אורחים** — יחידות, תאריכים, סכומים ושמות-צוות בלבד.
 * `chainsFor(engineId, ctx?)` ⇒ שרשראות של שני חלקים (חלק אחרי חלק) ושורה מחושבת לכל אחת.
 * טהור ודטרמיניסטי: "עכשיו" מוזרק (`nowMs`); השעון והתאריך באזור-הזמן של ישראל.
 */
import type { Db } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import type { AtomId, Capability, EngineId } from './contract';
import { atomCard } from './cards';
import { cleanParams } from './capabilities';
import { divideAmount, divideSpan, type Piece } from './parts/divide';
import { mergeRuns, type Run } from './parts/merge';
import { firstRun, nextAfter } from './parts/next';
import { roundTo, type RoundDir } from './parts/round';
import { offsetAll } from './parts/offset';
import { escalationState, type EscStep } from './parts/escalate';
import { dayIndex, fairAssign, turnOf } from './parts/rotate';
import { chainPreviewStrict } from './chainPreview';
import { arrivals, balances, nightsOf, stays, totals, turnoverSpan, untilArrival, waiting, type Recipient, type WaitingKind } from './engines/bookingsData';
import { ZMANIM_BUILDERS } from './previewZmanim';
import { WHAT_NEED_BUILDERS } from './previewWhatNeed';
import { BOOKINGS_MORE_BUILDERS } from './previewBookingsMore';

export interface PreviewCtx {
  db: Partial<Db> | null | undefined;
  config?: OrgConfig | null;
  nowMs: number;
  /** CHAIN 14.10 (תוספתי): היכולות השמורות — כדי שמנוע שבנוי על מנוע ימצא את מה שהוא בנוי עליו. */
  caps?: readonly Capability[];
}

export interface Preview {
  title: string;
  lines: string[];
}

/** כמה שורות לכל היותר בתצוגה (השאר ⇒ "ועוד N"). */
export const PREVIEW_MAX_LINES = 6;
/** חלון-הלילות שנבדק קדימה. */
export const NIGHTS_WINDOW = 60;

const TZ = 'Asia/Jerusalem';
const DAY_MS = 86_400_000;

/* ───────── זמן ותאריך (ישראל) ───────── */

function parts(ms: number): { iso: string; minute: number } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  return { iso: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
}

/** היום (ISO) והדקה-ביום בישראל לרגע מוזרק. */
export function israelNow(nowMs: number): { iso: string; minute: number } {
  return parts(Number.isFinite(nowMs) ? nowMs : 0);
}

/** רגע (ms) של תאריך ISO + דקה-ביום בישראל. */
export function israelMs(iso: string, minute: number): number {
  const guess = Date.parse(iso + 'T00:00:00Z') + minute * 60_000;
  // ההפרש בין הקיר בישראל ל-UTC ברגע הזה (שעון קיץ/חורף) — שני סבבים מספיקים
  let ms = guess;
  for (let i = 0; i < 2; i++) {
    const p = parts(ms);
    const wall = Date.parse(p.iso + 'T00:00:00Z') + p.minute * 60_000;
    ms += guess - wall;
  }
  return ms;
}

const pad = (n: number): string => String(n).padStart(2, '0');
/** דקות ⇒ "HH:MM" (מנורמל ליממה, מעוגל לדקה). */
export function hm(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
}
/** "2026-10-20" ⇒ "20/10". */
export function dm(iso: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  return m ? +m[2] + '/' + +m[1] : iso;
}
const isoOfDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);
const shekel = (n: number): string => '₪' + (Math.round(n * 100) / 100).toLocaleString('en-US');

function capped(lines: string[]): string[] {
  if (lines.length <= PREVIEW_MAX_LINES) return lines;
  return [...lines.slice(0, PREVIEW_MAX_LINES - 1), 'ועוד ' + (lines.length - PREVIEW_MAX_LINES + 1)];
}

/* ───────── עזרים על נתוני-הארגון ───────── */

const unitsOf = (db: PreviewCtx['db']): { id: string; name: string }[] =>
  (Array.isArray(db?.hostUnits) ? db!.hostUnits : [])
    .filter((u) => !!u && typeof u.id === 'string')
    .map((u) => ({ id: u.id, name: typeof u.name === 'string' && u.name.trim() ? u.name.trim() : 'יחידה' }));
const unitNameMap = (db: PreviewCtx['db']): Map<string, string> => new Map(unitsOf(db).map((u) => [u.id, u.name]));
const bookingUnit = (db: PreviewCtx['db']): Map<string, string> => {
  const names = unitNameMap(db);
  const out = new Map<string, string>();
  for (const b of Array.isArray(db?.hostBookings) ? db!.hostBookings : []) if (b && typeof b.id === 'string') out.set(b.id, names.get(b.unitId) ?? 'יחידה');
  return out;
};

const num = (p: Record<string, number | string>, k: string, d: number): number => (typeof p[k] === 'number' && Number.isFinite(p[k] as number) ? (p[k] as number) : d);
const str = (p: Record<string, number | string>, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);

/** הפרטים של היכולת, מנוקים מול הכרטיס (ברירות-מחדל לכל מה שחסר). */
function paramsOf(cap: Pick<Capability, 'atom' | 'params'>): Record<string, number | string> {
  const a = atomCard(cap.atom);
  return a ? cleanParams(a, cap.params) : {};
}

/** divide על טווח לפי הפרטים: לפי מספר חלקים, או לפי גודל עם הפסקה ושארית. */
function divideBy(span: { from: number; to: number }, p: Record<string, number | string>): Piece[] {
  return str(p, 'by', 'parts') === 'size'
    ? divideSpan(span, { size: num(p, 'size', 30), gap: num(p, 'gap', 0), remainder: str(p, 'remainder', 'drop') === 'shorten' ? 'shorten' : 'drop' })
    : divideSpan(span, { parts: num(p, 'parts', 12) });
}

/** סכום מחולק לפי הפרטים: לפי מספר תשלומים, או לפי גודל-תשלום (האחרון סופג את השארית). */
function divideMoney(total: number, p: Record<string, number | string>): number[] {
  if (str(p, 'by', 'parts') === 'size') return divideBy({ from: 0, to: total }, { ...p, gap: 0, remainder: 'shorten' }).map((x) => x.length);
  return divideAmount(total, num(p, 'parts', 12), 1);
}

/** "₪1,200 = 3 × ₪400" · "₪1,000 = ₪334 + 2 × ₪333". */
export function installmentsLine(total: number, pieces: readonly number[]): string {
  if (!pieces.length) return shekel(total);
  const groups: { v: number; n: number }[] = [];
  for (const v of pieces) {
    const g = groups[groups.length - 1];
    if (g && g.v === v) g.n++;
    else groups.push({ v, n: 1 });
  }
  return shekel(total) + ' = ' + groups.map((g) => (g.n > 1 ? g.n + ' × ' + shekel(g.v) : shekel(g.v))).join(' + ');
}

/** רצפי-הלילות הפנויים של יחידה מהיום, NIGHTS_WINDOW לילות קדימה. */
function freeRuns(db: PreviewCtx['db'], unitId: string, today: string, opts: { maxGap?: number; minLength?: number } = {}): { nights: { iso: string; free: boolean }[]; runs: Run[] } {
  const nights = nightsOf(db, unitId, today, NIGHTS_WINDOW);
  return { nights, runs: mergeRuns(nights, (n) => n.free, opts) };
}

/** "פנוי 3 לילות ברצף מ-20/10" — רצף שנוגע בסוף-החלון ⇒ "מ-X והלאה". */
function runLine(name: string, nights: { iso: string }[], r: Run): string {
  const open = r.to === nights.length - 1;
  return name + ' · פנוי ' + (open ? 'מ-' + dm(nights[r.from].iso) + ' והלאה' : r.length + (r.length === 1 ? ' לילה' : ' לילות') + ' ברצף מ-' + dm(nights[r.from].iso));
}

/**
 * VERIFY 14.10: שם-תצוגה לכל איש צוות — השם, ובלי שם התפקיד. שני אנשים עם אותה תווית (בלי שם באותו תפקיד, או שתי "דנה")
 * ⇒ ממוספרים ("משק בית 1", "משק בית 2"): בלי זה התורות נראו כאילו אותו אדם מקבל הכול ("היום ⇒ משק בית · מחר ⇒ משק בית").
 */
export function staffLabels(list: readonly { name?: string; role?: string }[]): string[] {
  const base = list.map((r) => (typeof r.name === 'string' && r.name.trim()) || (typeof r.role === 'string' && r.role.trim()) || 'איש צוות');
  const total = new Map<string, number>();
  for (const b of base) total.set(b, (total.get(b) ?? 0) + 1);
  const seen = new Map<string, number>();
  return base.map((b) => {
    if ((total.get(b) ?? 0) < 2) return b;
    const k = (seen.get(b) ?? 0) + 1;
    seen.set(b, k);
    return b + ' ' + k;
  });
}

/** אנשי צוות בלי כפילויות (לפי מזהה), עם התוויות של staffLabels. */
export function staffPeople(list: readonly { id: string; name?: string; role?: string }[]): string[] {
  return staffLabels([...new Map(list.map((r) => [r.id, r])).values()]);
}

/* ───────── הסלמה וסבב על "ממתין" ───────── */

const WAIT_KIND: Readonly<Record<string, WaitingKind>> = { 'bookings.cleaning': 'cleaning', 'bookings.faults': 'faults', 'bookings.unpaid': 'unpaid' };
const NOBODY: Readonly<Record<WaitingKind, string>> = {
  cleaning: 'אין עדיין אנשי צוות בתפקיד ניקיון — הוסיפו אותם בצוות, וההעברה הלאה תתחיל לעבוד',
  faults: 'אין עדיין אנשי צוות בתפקיד תחזוקה — הוסיפו אותם בצוות, וההעברה הלאה תתחיל לעבוד',
  unpaid: 'אין עדיין אנשי צוות בתפקיד גבייה או ניהול — הוסיפו אותם בצוות, וההעברה הלאה תתחיל לעבוד',
};
const WAIT_TITLE: Readonly<Record<WaitingKind, string>> = { cleaning: 'משימת ניקיון', faults: 'תקלה', unpaid: 'יתרה' };

/** פריטי-ההמתנה בלי שמות אורחים: יתרה ⇒ סכום + יחידה. */
function waitingSafe(db: PreviewCtx['db'], kind: WaitingKind): { items: { id: string; label: string; since: string; createdMs: number | null; urgent: boolean }[]; recipients: Recipient[] } {
  const w = waiting(db, kind);
  const names = unitNameMap(db);
  const recs = new Map<string, { createdAt?: unknown; category?: unknown }>();
  for (const r of Array.isArray(db?.hostRecords) ? db!.hostRecords : []) if (r && typeof r.id === 'string') recs.set(r.id, r as { createdAt?: unknown; category?: unknown });
  const items = w.items.map((it) => {
    const unit = names.get(it.unitId);
    // VERIFY 14.10: תקלה ⇒ התחום שלה, לא התיאור החופשי — התיאור נכתב ביד ("משפחת לוי דיווחו…, טלפון 050…") ודלף לתצוגה
    const cat = recs.get(it.id)?.category;
    const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
    const label =
      kind === 'unpaid' ? shekel(it.amount ?? 0) + (unit ? ' · ' + unit : '') : kind === 'cleaning' ? unit || it.label : faultLabel;
    const ca = recs.get(it.id)?.createdAt;
    const createdMs = typeof ca === 'string' && Number.isFinite(Date.parse(ca)) ? Date.parse(ca) : null;
    return { id: it.id, label, since: it.since, createdMs, urgent: kind === 'faults' && (it.priority ?? 4) <= 1 };
  });
  return { items, recipients: w.recipients };
}

/**
 * מתי הפריט התחיל לחכות. ניקיון/יתרה = היום שלו בשעת-העזיבה (11:00 כברירת-מחדל — המשימה נשלחת כשהאורח עוזב);
 * תקלה = רגע-הפתיחה שלה. אין ⇒ null.
 */
function startOf(db: PreviewCtx['db'], kind: WaitingKind, it: { since: string; createdMs: number | null }): number | null {
  if (kind === 'faults') return it.createdMs;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.since)) return it.createdMs;
  return israelMs(it.since, turnoverSpan(db).from);
}

function whenLine(ms: number, nowIso: string): string {
  const p = israelNow(ms);
  return p.iso === nowIso ? hm(p.minute) : dm(p.iso) + ' ' + hm(p.minute);
}

function escalatePreview(ctx: PreviewCtx, kind: WaitingKind, p: Record<string, number | string>): Preview | null {
  const { items, recipients } = waitingSafe(ctx.db, kind);
  if (!items.length) return null;
  const title = 'מעביר הלאה · ' + (items.length === 1 ? 'ממתין אחד' : items.length + ' ממתינים');
  if (!recipients.length) return { title, lines: [NOBODY[kind]] };
  const waitMin = num(p, 'waitMin', 180);
  const steps: EscStep[] = recipients.map((r) => ({ to: [r.id], waitMin }));
  const labels = staffLabels(recipients);
  const nameOf = new Map(recipients.map((r, i) => [r.id, labels[i]]));
  const now = israelNow(ctx.nowMs);
  const lines: string[] = [];
  for (const it of items) {
    const start = startOf(ctx.db, kind, it);
    if (start === null) continue;
    if (start > ctx.nowMs) {
      lines.push(WAIT_TITLE[kind] + ' · ' + it.label + ' — תישלח ל' + nameOf.get(recipients[0].id) + ' ב-' + whenLine(start, now.iso));
      continue;
    }
    const st = escalationState({ createdMs: start, steps, urgent: it.urgent, urgentWaitMin: num(p, 'urgentWaitMin', 60), nowMs: ctx.nowMs });
    const who = nameOf.get(st.currentTo[0] ?? '') ?? '';
    const head = WAIT_TITLE[kind] + ' · ' + it.label + ' — עכשיו אצל ' + who;
    if (st.done || st.nextMoveMs === null) lines.push(head + ' (אחרון בתור)');
    else lines.push(head + ' · אם אין אישור עד ' + whenLine(st.nextMoveMs, now.iso) + ' ⇒ ' + nameOf.get(steps[st.stepIndex + 1].to[0]));
  }
  return lines.length ? { title, lines: capped(lines) } : null;
}

function rotatePreview(ctx: PreviewCtx, kind: WaitingKind, p: Record<string, number | string>): Preview | null {
  const { items, recipients } = waitingSafe(ctx.db, kind);
  if (!recipients.length) return items.length ? { title: 'בתורות', lines: [NOBODY[kind]] } : null;
  const now = israelNow(ctx.nowMs);
  const names = staffLabels(recipients);
  if (str(p, 'by', 'day') === 'day') {
    const d = dayIndex(now.iso);
    const lines = [0, 1, 2].map((k) => (k === 0 ? 'היום' : k === 1 ? 'מחר' : dm(isoOfDay(d + k))) + ' ⇒ ' + turnOf(names, d + k));
    return { title: 'בתורות לפי יום · ' + names.length + ' בתור', lines };
  }
  const assigned = fairAssign(items, names, 0);
  const lines = assigned.map((a) => WAIT_TITLE[kind] + ' · ' + a.item.label + ' ⇒ ' + a.person);
  lines.push('המשימה החדשה הבאה ⇒ ' + turnOf(names, items.length));
  return { title: 'בתורות לפי פריט · ' + names.length + ' בתור', lines: capped(lines) };
}

/* ───────── התצוגות לפי מקום ───────── */

export type Builder = (ctx: PreviewCtx, p: Record<string, number | string>) => Preview | null;

/** חלון-ניקיון ריק: שעת הכניסה בהגדרות לא אחרי שעת העזיבה. */
const EMPTY_TURNOVER = (span: { fromHm: string; toHm: string }): string =>
  'שעת הכניסה בהגדרות (' + span.toHm + ') לא אחרי שעת העזיבה (' + span.fromHm + ') — אין זמן לניקיון ביניהן, ולכן אין תורים. כדאי לבדוק את השעות בהגדרות האירוח.';

function turnoverDivide(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  // בלי יחידות אין חלון-ניקיון אמיתי (רק ברירת-המחדל של ההגדרות) ⇒ אין תצוגה
  if (!unitsOf(ctx.db).length) return null;
  const span = turnoverSpan(ctx.db);
  // VERIFY 14.10: כניסה לא אחרי עזיבה ⇒ אין חלון (הקורא מחזיר טווח ריק) — לא מציגים 12 תורים של "12:00–12:00"
  if (span.to <= span.from) return { title: 'חלון הניקיון', lines: [EMPTY_TURNOVER(span)] };
  const pieces = divideBy(span, p);
  if (!pieces.length) return null;
  const cleaners = staffLabels(waiting(ctx.db, 'cleaning').recipients);
  const who = fairAssign(pieces, cleaners, 0);
  const lines = pieces.map((x, i) => hm(x.from) + '–' + hm(x.to) + (who[i] ? ' · ' + who[i].person : ''));
  return { title: 'חלון הניקיון ' + span.fromHm + '–' + span.toHm + ' · ' + pieces.length + ' תורים', lines: capped(lines) };
}

function stayDivide(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const today = israelNow(ctx.nowMs).iso;
  const names = unitNameMap(ctx.db);
  const lines: string[] = [];
  for (const s of stays(ctx.db, today)) {
    const d0 = dayIndex(s.from);
    const cuts = new Set<number>();
    for (const x of divideBy({ from: 0, to: s.nights }, p).slice(1)) {
      const d = Math.round(x.from);
      if (d > 0 && d < s.nights) cuts.add(d);
    }
    if (!cuts.size) continue;
    lines.push((names.get(s.unitId) ?? 'יחידה') + ' · ' + dm(s.from) + '–' + dm(s.to) + ' ⇒ ניקיון ב-' + [...cuts].map((d) => dm(isoOfDay(d0 + d))).join(', '));
  }
  return lines.length ? { title: 'ניקיון באמצע שהייה', lines: capped(lines) } : null;
}

function untilArrivalDivide(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const today = israelNow(ctx.nowMs).iso;
  const unitOf = bookingUnit(ctx.db);
  const lines: string[] = [];
  for (const u of untilArrival(ctx.db, today)) {
    const d0 = dayIndex(u.from);
    const marks = new Set<number>();
    for (const x of divideBy({ from: 0, to: u.days }, p).slice(1)) {
      const d = Math.round(x.from);
      if (d > 0 && d < u.days) marks.add(d);
    }
    if (!marks.size) continue;
    lines.push((unitOf.get(u.id) ?? 'יחידה') + ' · הגעה ' + dm(u.to) + ' ⇒ ' + [...marks].map((d) => dm(isoOfDay(d0 + d))).join(', '));
  }
  return lines.length ? { title: 'מועדים עד ההגעה', lines: capped(lines) } : null;
}

function amountDivide(list: { id: string; amount: number }[], title: string): Builder {
  return (ctx, p) => {
    const unitOf = bookingUnit(ctx.db);
    const lines = list
      .filter((x) => x.amount > 0)
      .map((x) => (unitOf.get(x.id) ?? 'יחידה') + ' · ' + installmentsLine(x.amount, divideMoney(x.amount, p)));
    return lines.length ? { title, lines: capped(lines) } : null;
  };
}

function amountRound(list: { id: string; amount: number }[], title: string): Builder {
  return (ctx, p) => {
    const unitOf = bookingUnit(ctx.db);
    const step = num(p, 'step', 1);
    const dir = str(p, 'dir', 'down') as RoundDir;
    const lines = list.map((x) => (unitOf.get(x.id) ?? 'יחידה') + ' · ' + shekel(x.amount) + ' ⇒ ' + shekel(roundTo(x.amount, step, dir)));
    return lines.length ? { title, lines: capped(lines) } : null;
  };
}

function nightsMerge(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const today = israelNow(ctx.nowMs).iso;
  const lines: string[] = [];
  for (const u of unitsOf(ctx.db)) {
    const { nights, runs } = freeRuns(ctx.db, u.id, today, { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
    for (const r of runs.slice(0, 2)) lines.push(runLine(u.name, nights, r));
  }
  return lines.length ? { title: 'לילות פנויים צמודים ב-' + NIGHTS_WINDOW + ' הלילות הקרובים', lines: capped(lines) } : null;
}

function nightsNext(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const today = israelNow(ctx.nowMs).iso;
  const min = num(p, 'minLength', 1);
  const count = num(p, 'count', 1);
  const lines: string[] = [];
  for (const u of unitsOf(ctx.db)) {
    const { nights, runs } = freeRuns(ctx.db, u.id, today);
    if (min > 1) {
      const r = firstRun(runs, min, 0);
      if (r) lines.push(u.name + ' · ' + min + ' לילות פנויים ברצף מ-' + dm(nights[r.from].iso));
      continue;
    }
    const free = nights.filter((n) => n.free).slice(0, count);
    if (free.length) lines.push(u.name + ' · ' + (count > 1 ? 'הלילות הפנויים הבאים: ' : 'הלילה הפנוי הבא: ') + free.map((n) => (n.iso === today ? 'הלילה' : dm(n.iso))).join(', '));
  }
  return lines.length ? { title: 'הלילה הפנוי הבא', lines: capped(lines) } : null;
}

/** הגעות בחלון הקרוב, כרגע-מוחלט בדקות (יום·1440 + דקה) — לחישובי זמן-יחסי/עיגול. */
function arrivalMoments(ctx: PreviewCtx): { id: string; iso: string; minute: number; abs: number; unit: string }[] {
  const today = israelNow(ctx.nowMs).iso;
  const names = unitNameMap(ctx.db);
  return arrivals(ctx.db, today, NIGHTS_WINDOW).map((a) => ({ id: a.id, iso: a.iso, minute: a.minute, abs: dayIndex(a.iso) * 1440 + a.minute, unit: names.get(a.unitId) ?? 'יחידה' }));
}
const absLine = (abs: number): string => dm(isoOfDay(Math.floor(abs / 1440))) + ' ' + hm(abs - Math.floor(abs / 1440) * 1440);

function arrivalsOffset(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const list = arrivalMoments(ctx);
  if (!list.length) return null;
  const minutes = num(p, 'minutes', -10);
  const moved = offsetAll(list.map((a) => a.abs), minutes);
  const lines = list.map((a, i) => a.unit + ' · הגעה ' + absLine(a.abs) + ' ⇒ תזכורת ' + absLine(moved[i]));
  const rel = minutes === 0 ? 'ברגע ההגעה' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל הגעה';
  return { title: 'תזכורת ' + rel, lines: capped(lines) };
}

function arrivalsNext(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const now = israelNow(ctx.nowMs);
  const list = arrivalMoments(ctx);
  const keyed = new Map(list.map((a) => [a.iso + ' ' + hm(a.minute) + ' ' + a.id, a]));
  const next = nextAfter([...keyed.keys()], now.iso + ' ' + hm(now.minute), num(p, 'count', 1));
  if (!next.length) return null;
  const lines = next.map((k) => {
    const a = keyed.get(k)!;
    return (a.iso === now.iso ? 'היום ' + hm(a.minute) : absLine(a.abs)) + ' · ' + a.unit;
  });
  return { title: next.length > 1 ? 'ההגעות הבאות' : 'ההגעה הבאה', lines };
}

function arrivalsRound(ctx: PreviewCtx, p: Record<string, number | string>): Preview | null {
  const list = arrivalMoments(ctx);
  if (!list.length) return null;
  const step = num(p, 'step', 1);
  const dir = str(p, 'dir', 'down') as RoundDir;
  const lines = list.map((a) => a.unit + ' · ' + dm(a.iso) + ' ' + hm(a.minute) + ' ⇒ ' + hm(roundTo(a.minute, step, dir)));
  return { title: 'שעת הגעה מעוגלת', lines: capped(lines) };
}

const waitBuilder = (atom: 'escalate' | 'rotate', place: string): Builder => (ctx, p) =>
  atom === 'escalate' ? escalatePreview(ctx, WAIT_KIND[place], p) : rotatePreview(ctx, WAIT_KIND[place], p);

const BUILDERS: Readonly<Record<string, Builder>> = {
  'bookings.turnover:divide': turnoverDivide,
  'bookings.stay:divide': stayDivide,
  'bookings.untilArrival:divide': untilArrivalDivide,
  'bookings.balance:divide': (c, p) => amountDivide(balances(c.db), 'היתרות בתשלומים שווים')(c, p),
  'bookings.balance:round': (c, p) => amountRound(balances(c.db), 'היתרות מעוגלות')(c, p),
  'bookings.total:divide': (c, p) => amountDivide(totals(c.db), 'המחיר הכולל בחלקים שווים')(c, p),
  'bookings.total:round': (c, p) => amountRound(totals(c.db).filter((x) => x.amount > 0), 'המחיר הכולל מעוגל')(c, p),
  'bookings.nights:merge': nightsMerge,
  'bookings.nights:next': nightsNext,
  'bookings.arrivals:offset': arrivalsOffset,
  'bookings.arrivals:next': arrivalsNext,
  'bookings.arrivals:round': arrivalsRound,
  'bookings.cleaning:escalate': waitBuilder('escalate', 'bookings.cleaning'),
  'bookings.cleaning:rotate': waitBuilder('rotate', 'bookings.cleaning'),
  'bookings.faults:escalate': waitBuilder('escalate', 'bookings.faults'),
  'bookings.faults:rotate': waitBuilder('rotate', 'bookings.faults'),
  'bookings.unpaid:escalate': waitBuilder('escalate', 'bookings.unpaid'),
  'bookings.unpaid:rotate': waitBuilder('rotate', 'bookings.unpaid'),
  ...ZMANIM_BUILDERS,
  ...WHAT_NEED_BUILDERS,
  ...BOOKINGS_MORE_BUILDERS,
};

/** לאילו חיבורים (מקום:חלק) יש תצוגה אמיתית. השאר ⇒ "התצוגה תגיע בקרוב". */
export const PREVIEW_KEYS: readonly string[] = Object.keys(BUILDERS);

export function hasPreview(place: string, atom: AtomId | string): boolean {
  return Object.prototype.hasOwnProperty.call(BUILDERS, place + ':' + atom);
}

/** התצוגה האמיתית של יכולת על נתוני-הארגון. אין תצוגה כנה ⇒ null. לעולם לא זורק. */
export function previewOf(cap: Pick<Capability, 'place' | 'atom' | 'params'> & { id?: string; parent?: string }, ctx: PreviewCtx): Preview | null {
  try {
    return previewStrict(cap, ctx);
  } catch {
    return null;
  }
}

/** ✅ VERIFY 14.10: אותו חישוב בדיוק, בלי ה-try — כדי שהמאמת יראה חריגה אמיתית ולא null שקט. המסך משתמש ב-previewOf. */
export function previewStrict(cap: Pick<Capability, 'place' | 'atom' | 'params'> & { id?: string; parent?: string }, ctx: PreviewCtx): Preview | null {
  // CHAIN 14.10: מנוע שבנוי על מנוע — קודם הפלט של מה שהוא בנוי עליו, אחר כך החלק (chainPreview.ts)
  if (cap.parent) return chainPreviewStrict(cap as Capability, ctx);
  const b = BUILDERS[cap.place + ':' + cap.atom];
  if (!b || !ctx || !Number.isFinite(ctx.nowMs)) return null;
  const r = b(ctx, paramsOf(cap));
  return r && r.lines.length ? r : null;
}

/** CHAIN 14.10: העזרים שהשרשראות השמורות (chainPreview.ts) משתמשות בהם — אותו קוד, לא עותק. */
export { capped, divideBy, freeRuns, isoOfDay, paramsOf, unitsOf, arrivalMoments, absLine, NOBODY };

/* ═══════════════ שרשראות: חלק אחרי חלק ═══════════════ */

export interface ChainStep {
  atom: AtomId;
  place: string;
}

export interface Chain {
  id: string;
  engine: EngineId;
  steps: readonly ChainStep[];
  /** שם היכולת שהשרשרת יוצרת. */
  name: string;
  /** משפט: מה קורה כשהחלק השני מקבל את התוצאה של הראשון. */
  explain: string;
  /** שורות מחושבות מהנתונים האמיתיים (ריק בלי ctx או בלי נתונים). */
  lines: string[];
}

/** הפרטים של יכולת קיימת (אם נוצרה) — כדי שהשרשרת תשתמש במה שהארגון כבר בחר. */
function capParams(caps: readonly Capability[] | undefined, place: string, atom: AtomId): Record<string, number | string> {
  const c = (caps ?? []).find((x) => x && x.place === place && x.atom === atom);
  return paramsOf({ atom, params: c?.params ?? {} });
}

function divideMergeLines(ctx: PreviewCtx, caps?: readonly Capability[]): string[] {
  if (!unitsOf(ctx.db).length) return [];
  const span = turnoverSpan(ctx.db);
  const base = capParams(caps, 'bookings.turnover', 'divide');
  const size = str(base, 'by', 'parts') === 'size' ? num(base, 'size', 20) : 20;
  const slots = divideSpan(span, { size, remainder: 'drop' });
  if (slots.length < 2) return [];
  const lines = [slots.length + ' משבצות של ' + size + ' דקות בחלון ' + span.fromHm + '–' + span.toHm];
  for (const k of [2, 3]) {
    if (slots.length < k) break;
    const [r] = mergeRuns(slots.slice(0, k), () => true);
    lines.push('תור של ' + k + ' משבצות = ' + k * size + ' דקות · ' + hm(slots[r.from].from) + '–' + hm(slots[r.to].to));
  }
  return lines;
}

function mergeNextLines(ctx: PreviewCtx, n: number): string[] {
  const today = israelNow(ctx.nowMs).iso;
  const lines: string[] = [];
  for (const u of unitsOf(ctx.db)) {
    const { nights, runs } = freeRuns(ctx.db, u.id, today);
    const r = firstRun(runs, n, 0);
    if (r) lines.push(u.name + ' · ' + n + ' לילות פנויים ברצף מ-' + dm(nights[r.from].iso) + ' עד ' + dm(addDay(nights[r.from + n - 1].iso)));
  }
  return capped(lines);
}
const addDay = (iso: string): string => isoOfDay(dayIndex(iso) + 1);

function mergeDivideLines(ctx: PreviewCtx): string[] {
  const today = israelNow(ctx.nowMs).iso;
  const staff = [...waiting(ctx.db, 'cleaning').recipients, ...waiting(ctx.db, 'faults').recipients];
  const people = staffPeople(staff);
  const parts = Math.max(2, people.length);
  const lines: string[] = [];
  for (const u of unitsOf(ctx.db)) {
    const { nights, runs } = freeRuns(ctx.db, u.id, today);
    const r = runs.find((x) => x.length >= parts && x.to < nights.length - 1);
    if (!r) continue;
    const pieces = divideSpan({ from: r.from, to: r.to + 1 }, { parts });
    const shares = pieces.map((x, i) => {
      const a = nights[Math.round(x.from)].iso;
      const z = nights[Math.round(x.to) - 1]?.iso ?? nights[r.to].iso;
      return (people[i] ?? 'חלק ' + (i + 1)) + ' ' + (a === z ? dm(a) : dm(a) + '–' + dm(z));
    });
    lines.push(u.name + ' · פנוי ' + r.length + ' לילות ⇒ ' + shares.join(' · '));
  }
  return capped(lines);
}

/**
 * השרשראות של מנוע: לפחות ✂️⇒🔗 תורים באורך משתנה · 🔗⇒⏭️ החלון הפנוי הבא של N לילות · 🔗⇒✂️ חלוקה הוגנת של הזמן הפנוי.
 * עם ctx — שורות מחושבות מהנתונים האמיתיים; עם caps — הפרטים שהארגון כבר בחר (N = האורך הקצר ביותר במיזוג הלילות).
 */
export function chainsFor(engineId: EngineId | string, ctx?: PreviewCtx | null, caps?: readonly Capability[]): Chain[] {
  if (engineId !== 'bookings') return [];
  const safe = (f: () => string[]): string[] => {
    try {
      return ctx && Number.isFinite(ctx.nowMs) ? f() : [];
    } catch {
      return [];
    }
  };
  const mergeP = capParams(caps, 'bookings.nights', 'merge');
  const n = Math.max(2, num(mergeP, 'minLength', 1) > 1 ? num(mergeP, 'minLength', 3) : 3);
  return [
    {
      id: 'bookings:divide>merge',
      engine: 'bookings',
      steps: [
        { atom: 'divide', place: 'bookings.turnover' },
        { atom: 'merge', place: 'bookings.turnover' },
      ],
      name: 'תורים באורך משתנה',
      explain: '✂️ מחלק לחלקים שווים: משבצות קטנות ושוות; 🔗 מחבר דברים צמודים: שתי משבצות צמודות ⇒ תור אחד ארוך — יחידה גדולה מקבלת תור כפול.',
      lines: safe(() => divideMergeLines(ctx!, caps)),
    },
    {
      id: 'bookings:merge>next',
      engine: 'bookings',
      steps: [
        { atom: 'merge', place: 'bookings.nights' },
        { atom: 'next', place: 'bookings.nights' },
      ],
      name: 'החלון הפנוי הבא של ' + n + ' לילות',
      explain: '🔗 מחבר דברים צמודים: לילות פנויים צמודים ⇒ חלון אחד; ⏭️ מוצא את הבא בתור: החלון הראשון שארוך מספיק.',
      lines: safe(() => mergeNextLines(ctx!, n)),
    },
    {
      id: 'bookings:merge>divide',
      engine: 'bookings',
      steps: [
        { atom: 'merge', place: 'bookings.nights' },
        { atom: 'divide', place: 'bookings.nights' },
      ],
      name: 'חלוקה הוגנת של הזמן הפנוי',
      explain: '🔗 מחבר דברים צמודים: מוצא את הלילות הפנויים שצמודים; ✂️ מחלק לחלקים שווים: בין אנשי הצוות (תחזוקה, ניקיון יסודי).',
      lines: safe(() => mergeDivideLines(ctx!)),
    },
  ];
}
