/**
 * 🛏️ מנוע ההזמנות — קוראי-המקומות (ATOMS-ENGINES, 14.10.2026).
 * פונקציות טהורות שקוראות את הנתונים של כל מקום בכרטיס bookings מתוך Db, בצורה שהחלקים הכלליים מקבלים:
 * טווח = דקות-ביום או תאריכי ISO · סכום = מספר · רצף = מערך מסודר · זמנים = רשימה מסודרת · ממתין = פריטים + מקבלים.
 * "היום" מוזרק (בלי שעון-המערכת). שימוש-חוזר במנוע האמיתי (hosting/transitions.ts) — אפס חשבון חדש של לילות/יתרות/זמינות.
 * לעולם לא זורק: Db חסר/פגום ⇒ תוצאה ריקה.
 */
import type { Db, HostBooking, HostCleanTask, HostFault, HostGuest, HostRecord, HostStaff, HostUnit } from '../../../types/domain';
import {
  addDaysIso,
  blocksAvailability,
  bookingBalance,
  bookingParty,
  bookingTotal,
  checkAvailability,
  hostSettings,
  isActive,
  isIso,
  nightsBetween,
} from '../../../components/hosting/transitions';

type DbLike = Partial<Pick<Db, 'hostUnits' | 'hostBookings' | 'hostRecords' | 'ui'>> | null | undefined;

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const bookingsOf = (db: DbLike): HostBooking[] =>
  arr<HostBooking>(db?.hostBookings).filter((b) => !!b && typeof b === 'object' && typeof b.id === 'string' && Array.isArray(b.charges) && Array.isArray(b.payments));
const unitsOf = (db: DbLike): HostUnit[] => arr<HostUnit>(db?.hostUnits).filter((u) => !!u && typeof u === 'object' && typeof u.id === 'string');
const recordsOf = (db: DbLike): HostRecord[] => arr<HostRecord>(db?.hostRecords).filter((r) => !!r && typeof r === 'object' && typeof r.id === 'string');
const byIso = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** "HH:MM" ⇒ דקות מחצות; פגום ⇒ null. */
export function hmToMinutes(hm: unknown): number | null {
  if (typeof hm !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hm)) return null;
  return +hm.slice(0, 2) * 60 + +hm.slice(3, 5);
}

/* ═══════════════ טווחים (span) ═══════════════ */

/** טווח בדקות-ביום. */
export interface MinuteSpan {
  from: number;
  to: number;
}

/**
 * bookings.turnover — החלון בין שעת-העזיבה לשעת-הכניסה של ההגדרות (11:00–15:00 כברירת מחדל), בדקות.
 * הגדרה הפוכה (כניסה לפני עזיבה) ⇒ טווח ריק (from === to) — אין חלון, לא ממציאים.
 */
export function turnoverSpan(db: DbLike): MinuteSpan & { fromHm: string; toHm: string } {
  const s = hostSettings(db?.ui?.hosting);
  const from = hmToMinutes(s.checkout) ?? 11 * 60;
  const to = hmToMinutes(s.checkin) ?? 15 * 60;
  return { from, to: Math.max(from, to), fromHm: s.checkout, toHm: s.checkin };
}

/** טווח תאריכים [from, to) של הזמנה. */
export interface StaySpan {
  id: string;
  unitId: string;
  guestId: string;
  from: string;
  to: string;
  nights: number;
  people: number;
}

/**
 * bookings.stay — השהיות שעוד לא נגמרו (לא בוטלה, לא הושלמה, יציאה אחרי היום), לפי תאריך-כניסה.
 * תאריכים פגומים ⇒ מדולגת.
 */
export function stays(db: DbLike, today: string): StaySpan[] {
  return bookingsOf(db)
    .filter((b) => blocksAvailability(b) && isIso(b.checkIn) && isIso(b.checkOut) && nightsBetween(b.checkIn, b.checkOut) > 0 && b.checkOut > today)
    .sort((a, b) => byIso(a.checkIn, b.checkIn) || byIso(a.id, b.id))
    .map((b) => ({ id: b.id, unitId: b.unitId, guestId: b.guestId, from: b.checkIn, to: b.checkOut, nights: nightsBetween(b.checkIn, b.checkOut), people: bookingParty(b) }));
}

/** bookings.untilArrival — מהיום עד הכניסה, להזמנות שעוד לא הגיעו (ממתינה/מאושרת, כניסה אחרי היום). */
export function untilArrival(db: DbLike, today: string): { id: string; from: string; to: string; days: number }[] {
  if (!isIso(today)) return [];
  return bookingsOf(db)
    .filter((b) => (b.status === 'pending' || b.status === 'confirmed') && isIso(b.checkIn) && b.checkIn > today)
    .sort((a, b) => byIso(a.checkIn, b.checkIn) || byIso(a.id, b.id))
    .map((b) => ({ id: b.id, from: today, to: b.checkIn, days: nightsBetween(today, b.checkIn) }));
}

/* ═══════════════ סכומים (amount) ═══════════════ */

export interface AmountItem {
  id: string;
  amount: number;
}

/** bookings.balance — יתרות פתוחות (לא בוטלה, חוב > 0, גם אחרי עזיבה), מהגדולה לקטנה — כמו openBalances. */
export function balances(db: DbLike): AmountItem[] {
  return bookingsOf(db)
    .filter((b) => isActive(b) && bookingBalance(b) > 0)
    .map((b) => ({ id: b.id, amount: bookingBalance(b) }))
    .sort((a, b) => b.amount - a.amount || byIso(a.id, b.id));
}

/** bookings.total — המחיר הכולל של כל הזמנה שלא בוטלה, עם הלילות והאנשים (לחלוקה ללילה/לאדם). */
export function totals(db: DbLike): (AmountItem & { nights: number; people: number })[] {
  return bookingsOf(db)
    .filter(isActive)
    .sort((a, b) => byIso(a.checkIn, b.checkIn) || byIso(a.id, b.id))
    .map((b) => ({ id: b.id, amount: bookingTotal(b), nights: Math.max(0, nightsBetween(b.checkIn, b.checkOut)), people: bookingParty(b) }));
}

/* ═══════════════ רצף (sequence) ═══════════════ */

/** תקרת-החלון של רצפים (שנה+). */
const MAX_DAYS = 400;

/**
 * bookings.nights — הלילות של יחידה מ-fromIso, days לילות, כל אחד פנוי/תפוס. "פנוי" = כל היחידה פנויה באותו
 * לילה לפי checkAvailability האמיתי (יחידה חסומה ⇒ אף לילה לא פנוי; יחידת-חדרים ⇒ כל החדרים פנויים).
 * יחידה לא קיימת / תאריך פגום ⇒ [].
 */
export function nightsOf(db: DbLike, unitId: string, fromIso: string, days: number): { iso: string; free: boolean }[] {
  const u = unitsOf(db).find((x) => x.id === unitId);
  if (!u || !isIso(fromIso)) return [];
  const n = Math.max(0, Math.min(MAX_DAYS, Math.floor(Number.isFinite(days) ? days : 0)));
  const bookings = bookingsOf(db);
  const rooms = arr<{ id: string }>(u.subRooms).map((r) => r.id);
  const unit: HostUnit = { ...u, subRooms: arr(u.subRooms) };
  const out: { iso: string; free: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const iso = addDaysIso(fromIso, i);
    out.push({ iso, free: checkAvailability(bookings, unit, iso, addDaysIso(iso, 1), rooms).ok });
  }
  return out;
}

/* ═══════════════ זמנים (times) ═══════════════ */

export interface ArrivalMoment {
  id: string;
  iso: string;
  /** שעת-הכניסה מההגדרות (HH:MM). */
  time: string;
  /** אותה שעה בדקות מחצות. */
  minute: number;
  unitId: string;
  guestId: string;
}

/** bookings.arrivals — הגעות שעוד לא קרו (ממתינה/מאושרת) בחלון [fromIso, fromIso+days), לפי תאריך. */
export function arrivals(db: DbLike, fromIso: string, days: number): ArrivalMoment[] {
  if (!isIso(fromIso)) return [];
  const n = Math.max(0, Math.min(MAX_DAYS, Math.floor(Number.isFinite(days) ? days : 0)));
  const end = addDaysIso(fromIso, n);
  const s = hostSettings(db?.ui?.hosting);
  const minute = hmToMinutes(s.checkin) ?? 15 * 60;
  return bookingsOf(db)
    .filter((b) => (b.status === 'pending' || b.status === 'confirmed') && isIso(b.checkIn) && b.checkIn >= fromIso && b.checkIn < end)
    .sort((a, b) => byIso(a.checkIn, b.checkIn) || byIso(a.id, b.id))
    .map((b) => ({ id: b.id, iso: b.checkIn, time: s.checkin, minute, unitId: b.unitId, guestId: b.guestId }));
}

/* ═══════════════ ממתין לתשובה (waiting) ═══════════════ */

export type WaitingKind = 'cleaning' | 'faults' | 'unpaid';

export interface WaitingItem {
  id: string;
  /** מה מחכה, בעברית. */
  label: string;
  /** מאיזה תאריך הוא מחכה (ISO). */
  since: string;
  unitId: string;
  /** תקלה: עדיפות 0–4 · יתרה: הסכום. */
  amount?: number;
  priority?: number;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  role: string;
}

/**
 * מילות-תפקיד לכל סוג (תפקידי הצוות במודול הם תפקידי-מטבח — K_ROLES; תפקיד אחר נשמר כמות-שהוא).
 * מקבל = איש-צוות שהתפקיד שלו מכיל אחת המילים. אין כזה בנתונים ⇒ רשימה ריקה (לא ממציאים מנקה).
 */
const ROLE_WORDS: Readonly<Record<WaitingKind, readonly string[]>> = {
  cleaning: ['ניקי', 'מנק', 'משק בית'],
  faults: ['תחזוק', 'אחזק', 'טכנאי', 'שיפוצ'],
  unpaid: ['מנהל', 'גבי', 'הנהלת חשבונות', 'קבלה'],
};

/** bookings.cleaning / faults / unpaid — הפריטים שמחכים, לפי ותק, ורשימת המקבלים המסודרת (לפי שם). */
export function waiting(db: DbLike, kind: WaitingKind): { items: WaitingItem[]; recipients: Recipient[] } {
  const recs = recordsOf(db);
  const unitName = new Map(unitsOf(db).map((u) => [u.id, typeof u.name === 'string' ? u.name : ''] as const));
  const guestName = new Map(recs.filter((r): r is HostGuest => r.kind === 'guest').map((g) => [g.id, typeof g.name === 'string' ? g.name : ''] as const));
  let items: WaitingItem[] = [];
  if (kind === 'cleaning') {
    items = recs
      .filter((r): r is HostCleanTask => r.kind === 'clean' && r.status === 'open')
      .map((t) => ({ id: t.id, label: (t.type || 'ניקיון') + (unitName.get(t.unitId) ? ' · ' + unitName.get(t.unitId) : ''), since: String(t.date || ''), unitId: t.unitId }))
      .sort((a, b) => byIso(a.since, b.since) || byIso(a.id, b.id));
  } else if (kind === 'faults') {
    items = recs
      .filter((r): r is HostFault => r.kind === 'fault' && r.status !== 'done')
      .map((f) => ({ id: f.id, label: f.desc || f.category || 'תקלה', since: String(f.createdAt || '').slice(0, 10), unitId: f.unitId || '', priority: Number.isFinite(f.priority) ? f.priority : 4 }))
      .sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4) || byIso(a.since, b.since) || byIso(a.id, b.id));
  } else if (kind === 'unpaid') {
    items = bookingsOf(db)
      .filter((b) => isActive(b) && bookingBalance(b) > 0)
      .map((b) => ({
        id: b.id,
        label: (guestName.get(b.guestId) || 'אורח') + (unitName.get(b.unitId) ? ' · ' + unitName.get(b.unitId) : ''),
        since: String(b.checkIn || ''),
        unitId: b.unitId,
        amount: bookingBalance(b),
      }))
      .sort((a, b) => byIso(a.since, b.since) || byIso(a.id, b.id));
  }
  const words = ROLE_WORDS[kind] ?? [];
  const recipients = recs
    .filter((r): r is HostStaff => r.kind === 'staff' && typeof r.role === 'string' && words.some((w) => r.role.includes(w)))
    .map((s) => ({ id: s.id, name: String(s.name || ''), phone: String(s.phone || ''), role: s.role }))
    .sort((a, b) => a.name.localeCompare(b.name, 'he') || byIso(a.id, b.id));
  return { items, recipients };
}

/* ═══════════════ טקסט (text) ═══════════════ */

/** bookings.guests — שמות האורחים ואחריהם שמות היחידות (ריקים מדולגים). */
export function guestTexts(db: DbLike): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const r of recordsOf(db)) if (r.kind === 'guest' && typeof r.name === 'string' && r.name.trim()) out.push({ id: r.id, text: r.name.trim() });
  for (const u of unitsOf(db)) if (typeof u.name === 'string' && u.name.trim()) out.push({ id: u.id, text: u.name.trim() });
  return out;
}
