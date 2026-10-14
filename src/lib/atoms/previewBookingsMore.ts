/**
 * 🧬 מנועים וחלקים — שאר התצוגות של 🛏️ מנהל ההזמנות (ATOMS-PREVIEWS, 14.10.2026).
 *
 * הקוראים שחסרו (`guestStays` · `unitStays` · `sacredDays` · `unitFaults`) — כאן, ליד הקיימים ב-`engines/bookingsData.ts`
 * (שלא נגענו בו): אותם קוראים (stays · arrivals · turnoverSpan) ואותם כללים של המנוע האמיתי (hosting/transitions.ts).
 * שבתות וחגים — **אותו מחשבון כמו מחשבון הזמנים** (`closedRuns` ב-previewZmanim: dayInfo + הדלקה/צאת), לפי המיקום של
 * הארגון (פרנסה׳לע, ואם אין — בני ברק).
 *
 * 🛡 בלי שמות אורחים: "אותו אורח" = אותו guestId; מוצגים רק יחידות, תאריכים ומונים. תקלה ⇒ התחום שלה, לא התיאור החופשי.
 * `HONEST_NULLS` — החיבורים שאין להם תצוגה כנה על שום נתונים, עם הסיבה (ratchet-כיסוי נועל: כל חיבור שהארגז מציע
 * או שיש לו תצוגה, או שהוא ברשימה הזו).
 * טהור ודטרמיניסטי: "עכשיו" רק מ-`ctx.nowMs`. לעולם לא זורק.
 */
import type { HostBooking, HostFault } from '../../types/domain';
import type { Builder, Preview, PreviewCtx } from './preview';
import { arrivals, stays, turnoverSpan, type StaySpan } from './engines/bookingsData';
import { addDaysIso, blocksAvailability, faultBlocksUnit, nightsBetween } from '../../components/hosting/transitions';
import { mergeRuns } from './parts/merge';
import { nextAfter } from './parts/next';
import { closedRuns, dm, israelClock, num, out, windowText, zmanimLoc, type Params } from './previewZmanim';

/** חיבורים בלי תצוגה כנה — ונשארים "התצוגה תגיע בקרוב". קצר ככל האפשר. */
export const HONEST_NULLS: Readonly<Record<string, string>> = {
  'bookings.day:divide': 'אין בנתונים "יום עבודה": ההגדרות שומרות רק שעת עזיבה ושעת כניסה (וזה חלון הניקיון, שכבר מחולק). לא ממציאים שעות.',
  'bookings.guests:fuzzy': 'פרטיות: חיפוש בשמות האורחים היה מציג שמות אורחים, ותצוגה אסור לה להציג שם אורח.',
};

/** כמה לילות קדימה (כמו NIGHTS_WINDOW של preview.ts). */
const WINDOW = 60;

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const unitNames = (ctx: PreviewCtx): Map<string, string> =>
  new Map(
    arr<{ id?: unknown; name?: unknown }>(ctx.db?.hostUnits)
      .filter((u) => !!u && typeof u === 'object' && typeof u.id === 'string')
      .map((u) => [u.id as string, typeof u.name === 'string' && u.name.trim() ? u.name.trim() : 'יחידה'] as const),
  );
const nightsWord = (n: number): string => (n === 1 ? 'לילה אחד' : n + ' לילות');
const fromTo = (a: string, b: string): string => dm(a) + '–' + dm(b);

/** הלילות שבין `from` ל-`from+days`, כל אחד: האם אחת השהיות מכסה אותו. */
function covered(list: readonly StaySpan[], from: string, days: number): { iso: string; on: boolean }[] {
  const res: { iso: string; on: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDaysIso(from, i);
    res.push({ iso, on: list.some((s) => s.from <= iso && iso < s.to) });
  }
  return res;
}

/* ───────── bookings.guestStays · 🔗 ───────── */

function guestStaysMerge(ctx: PreviewCtx, p: Params): Preview | null {
  const today = israelClock(ctx).iso;
  const all = stays(ctx.db, today);
  if (!all.length) return null;
  const names = unitNames(ctx);
  const byGuest = new Map<string, StaySpan[]>();
  for (const s of all) byGuest.set(s.guestId, [...(byGuest.get(s.guestId) ?? []), s]);
  const lines: string[] = [];
  for (const list of byGuest.values()) {
    if (list.length < 2) continue;
    const start = list[0].from < today ? today : list[0].from;
    const end = list.reduce((m, s) => (s.to > m ? s.to : m), list[0].to);
    const nights = covered(list, start, Math.min(400, nightsBetween(start, end)));
    const runs = mergeRuns(nights, (n) => n.on, { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
    const used = new Set<string>();
    for (const r of runs) {
      const a = nights[r.from].iso;
      const b = addDaysIso(nights[r.to].iso, 1);
      const inRun = list.filter((s) => s.from < b && s.to > a);
      if (inRun.length < 2) continue;
      inRun.forEach((s) => used.add(s.id));
      const parts = inRun.map((s) => (names.get(s.unitId) ?? 'יחידה') + ' ' + fromTo(s.from, s.to)).join(' + ');
      const gaps = nights.slice(r.from, r.to + 1).filter((n) => !n.on).length;
      lines.push('אותו אורח · ' + parts + ' ← שהייה אחת ' + fromTo(a, b) + ' (' + nightsWord(r.length) + (gaps ? ', מהם ' + nightsWord(gaps) + ' בלי הזמנה' : '') + ')');
    }
    const rest = list.filter((s) => !used.has(s.id));
    for (let i = 1; i < rest.length; i++) {
      const gap = nightsBetween(rest[i - 1].to, rest[i].from);
      if (gap > 0) lines.push('אותו אורח · ' + fromTo(rest[i - 1].from, rest[i - 1].to) + ' ו-' + fromTo(rest[i].from, rest[i].to) + ' — לא צמודות (' + nightsWord(gap) + ' ביניהן)');
    }
  }
  if (!lines.length) return { title: 'הזמנות של אותו אורח', lines: ['לכל אורח יש הזמנה אחת בלבד בתקופה הקרובה — אין מה לחבר'] };
  return out('הזמנות של אותו אורח, מחוברות לשהייה אחת', lines);
}

/* ───────── bookings.unitStays · 🔗 ⏭️ ───────── */

function unitStaysMerge(ctx: PreviewCtx, p: Params): Preview | null {
  const today = israelClock(ctx).iso;
  const all = stays(ctx.db, today);
  if (!all.length) return null;
  const turn = turnoverSpan(ctx.db);
  const lines: string[] = [];
  for (const [unitId, name] of unitNames(ctx)) {
    const list = all.filter((s) => s.unitId === unitId);
    if (!list.length) continue;
    const nights = covered(list, today, WINDOW);
    const runs = mergeRuns(nights, (n) => n.on, { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
    for (const r of runs) {
      const a = nights[r.from].iso;
      const b = addDaysIso(nights[r.to].iso, 1);
      const inRun = list.filter((s) => s.from < b && s.to > a);
      if (inRun.length < 2) {
        lines.push(name + ' · הזמנה אחת ' + fromTo(inRun[0]?.from ?? a, inRun[0]?.to ?? b));
        continue;
      }
      const swaps = [...new Set(inRun.filter((s) => inRun.some((o) => o !== s && o.to === s.from)).map((s) => s.from))];
      const gaps = nights.slice(r.from, r.to + 1).filter((n) => !n.on).length;
      lines.push(
        name + ' · ' + inRun.length + ' הזמנות צמודות ← אורחים ברצף ' + fromTo(a, b) +
          (gaps ? ' (כולל ' + nightsWord(gaps) + ' פנוי באמצע)' : '') +
          (swaps.length ? ' · ניקיון בין עזיבה לכניסה ב-' + swaps.map(dm).join(', ') + ' ' + turn.fromHm + '–' + turn.toHm : ''),
      );
    }
  }
  return out('ההזמנות בכל יחידה ב-' + WINDOW + ' הלילות הקרובים', lines);
}

function unitStaysNext(ctx: PreviewCtx, p: Params): Preview | null {
  const clock = israelClock(ctx);
  const names = unitNames(ctx);
  if (!names.size) return null;
  const count = Math.max(1, Math.min(6, Math.floor(num(p, 'count', 1))));
  const bookings = new Map(arr<HostBooking>(ctx.db?.hostBookings).filter((b) => !!b && typeof b.id === 'string').map((b) => [b.id, b]));
  const now = clock.iso + ' ' + clock.hhmm;
  // עכשיו יש אורחים = בשהייה ('in'), או שהייה שהתחילה לפני היום ועוד לא נגמרה (מי שמגיע היום — עוד לא כאן)
  const current = stays(ctx.db, clock.iso).filter((s) => bookings.get(s.id)?.status === 'in' || s.from < clock.iso);
  const lines: string[] = [];
  for (const [unitId, name] of names) {
    const list = arrivals(ctx.db, clock.iso, WINDOW).filter((a) => a.unitId === unitId);
    const keyed = new Map(list.map((a) => [a.iso + ' ' + a.time + ' ' + a.id, a]));
    const next = nextAfter([...keyed.keys()], now, count).map((k) => keyed.get(k)!);
    const here = current.find((s) => s.unitId === unitId);
    const nowNote = here ? ' · עכשיו יש אורחים עד ' + dm(here.to) : '';
    if (!next.length) {
      lines.push(name + ' · אין הזמנה ב-' + WINDOW + ' הימים הקרובים' + nowNote);
      continue;
    }
    const txt = next.map((a) => {
      const b = bookings.get(a.id);
      const to = b?.checkOut ?? a.iso;
      return fromTo(a.iso, to) + ' (' + nightsWord(nightsBetween(a.iso, to)) + ')';
    });
    lines.push(name + ' · ' + (next.length > 1 ? 'ההזמנות הבאות: ' : 'ההזמנה הבאה: ') + txt.join(', ') + nowNote);
  }
  return out(count > 1 ? 'ההזמנות הבאות בכל יחידה' : 'ההזמנה הבאה בכל יחידה', lines);
}

/* ───────── bookings.sacredDays · 🔗 ⏭️ ───────── */

/** היחידות שיש בהן אורחים בחלון (כניסה עד היום האחרון, ויציאה מהיום הראשון והלאה). */
function guestsIn(ctx: PreviewCtx, first: string, last: string): string[] {
  const names = unitNames(ctx);
  const units: string[] = [];
  for (const b of arr<HostBooking>(ctx.db?.hostBookings)) {
    if (!b || typeof b !== 'object' || typeof b.checkIn !== 'string' || typeof b.checkOut !== 'string' || !blocksAvailability(b)) continue;
    if (b.checkIn <= last && b.checkOut >= first) {
      const n = names.get(b.unitId) ?? 'יחידה';
      if (!units.includes(n)) units.push(n);
    }
  }
  return units;
}

const unitsText = (u: string[]): string => (u.length === 1 ? 'יחידה אחת: ' : u.length + ' יחידות: ') + u.join(', ');

function sacredMerge(ctx: PreviewCtx, p: Params): Preview | null {
  if (!unitNames(ctx).size) return null; // בלי יחידות אין אירוח — אין "מי מתארח"
  const loc = zmanimLoc(ctx);
  const runs = closedRuns(loc, israelClock(ctx), { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
  const lines = runs.map((r) => {
    const g = guestsIn(ctx, r.first, r.last);
    const head = r.days > 1 ? r.name + ' · ' + r.days + ' ימים צמודים ← חלון סגור אחד' : r.name;
    return head + ' · ' + windowText(r) + ' ← ' + (g.length ? 'אורחים ב' + unitsText(g) : 'אין אורחים');
  });
  return out('שבתות וחגים, ומי מתארח בהם · ' + locNote(loc.label), lines);
}

function sacredNext(ctx: PreviewCtx, p: Params): Preview | null {
  if (!unitNames(ctx).size) return null; // בלי יחידות אין אירוח — אין "מי מתארח"
  const loc = zmanimLoc(ctx);
  const count = Math.max(1, Math.min(6, Math.floor(num(p, 'count', 1))));
  const min = Math.max(1, Math.floor(num(p, 'minLength', 1)));
  const runs = closedRuns(loc, israelClock(ctx)).filter((r) => r.days >= min);
  if (!runs.length) return null;
  const lines: string[] = [];
  for (const r of runs) {
    const g = guestsIn(ctx, r.first, r.last);
    if (!g.length) continue;
    lines.push((lines.length ? '' : (r.name === 'שבת' ? 'השבת הבאה' : 'החג הבא') + ' עם אורחים: ') + r.name + ' · ' + windowText(r) + ' · ' + unitsText(g));
    if (lines.length >= count) break;
  }
  if (!lines.length) return { title: 'השבת או החג הבא עם אורחים · ' + locNote(loc.label), lines: ['אין אורחים באף שבת או חג ב-30 הימים הקרובים'] };
  return { title: 'השבת או החג הבא עם אורחים · ' + locNote(loc.label), lines };
}

const locNote = (label: string): string => 'לפי ' + label;

/* ───────── bookings.unitFaults · 🔗 ───────── */

function unitFaultsMerge(ctx: PreviewCtx, p: Params): Preview | null {
  const names = unitNames(ctx);
  const open = arr<HostFault>(ctx.db?.hostRecords)
    .filter((r) => !!r && typeof r === 'object' && r.kind === 'fault' && r.status !== 'done' && typeof r.id === 'string')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || (a.id < b.id ? -1 : 1));
  if (!open.length) return null;
  const byUnit = new Map<string, HostFault[]>();
  for (const f of open) byUnit.set(f.unitId || '', [...(byUnit.get(f.unitId || '') ?? []), f]);
  const lines: string[] = [];
  const minLength = num(p, 'minLength', 1);
  for (const [unitId, list] of byUnit) {
    const name = unitId ? names.get(unitId) ?? 'יחידה' : 'כללי (לא ביחידה)';
    const blocks = (f: HostFault): boolean => f.blocked === true || faultBlocksUnit(Number.isFinite(f.priority) ? f.priority : 4);
    const urgent = list.filter(blocks);
    const [run] = mergeRuns(urgent, () => true, { maxGap: num(p, 'maxGap', 0), minLength });
    const what = list.map((f) => String(f.category || 'תקלה')).filter((x, i, a) => a.indexOf(x) === i).join(', ');
    const count = list.length === 1 ? 'תקלה פתוחה אחת' : list.length + ' תקלות פתוחות';
    if (run && unitId) {
      const since = String(urgent[0].createdAt).slice(0, 10);
      lines.push(name + ' · ' + count + ' (' + what + ') ← ' + (run.length > 1 ? run.length + ' דחופות = סגירה אחת' : 'סגורה') + ' מ-' + dm(since) + ' עד שהאחרונה מתוקנת');
    } else if (run) {
      lines.push(name + ' · ' + count + ' (' + what + ') — דחופה, אבל לא שייכת ליחידה ולכן לא סוגרת יחידה');
    } else if (urgent.length < minLength && urgent.length) {
      lines.push(name + ' · ' + count + ' (' + what + ') — פחות דחופות ממה שנבחר, היחידה נשארת פתוחה');
    } else {
      lines.push(name + ' · ' + count + ' (' + what + ') — לא דחופה, היחידה נשארת פתוחה');
    }
  }
  return out('התקלות הפתוחות בכל יחידה', lines);
}

export const BOOKINGS_MORE_BUILDERS: Readonly<Record<string, Builder>> = {
  'bookings.guestStays:merge': guestStaysMerge,
  'bookings.unitStays:merge': unitStaysMerge,
  'bookings.unitStays:next': unitStaysNext,
  'bookings.sacredDays:merge': sacredMerge,
  'bookings.sacredDays:next': sacredNext,
  'bookings.unitFaults:merge': unitFaultsMerge,
};
