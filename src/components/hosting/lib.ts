/**
 * 🏡 אירוח משפחתי — המנוע הטהור של המסכים (BUILD-ORDER-HOSTING-2026-10-12, אשכול 3).
 *
 * בצ'אנק-העצל של המסך בלבד. מייצא-מחדש את ליבת-המעברים (transitions.ts — מה שה-store אוכף) ומוסיף:
 * מצב-חי של יחידה (תיקון F8) · לוח-הבקרה (הגעות/עזיבות-באיחור F8, הכנסות-החודש עם שנה F2, יתרות F6) ·
 * רשימות (הזמנות/יחידות/אורחים/ניקיון) · יומן-תפוסה מעל `lib/monthGrid` (חודש לועזי **או** עברי) עם
 * נתיבים לחפיפות-חדרים · שבת/יו״ט מהמנוע העברי הקיים (`calLib.blockReason`) — אפס חשבון-תאריכים חדש ·
 * עזרי-תצוגה (כסף/תאריך/ראשי-תיבות/ברכה).
 * בלי store/DOM/Date.now — "היום"/"השעה" מוזרקים.
 */
import type { HostBooking, HostCleanTask, HostGuest, HostRecord, HostUnit } from '../../types/domain';
import { buildMonthGrid } from '../../lib/monthGrid';
import { gemYear } from '../../lib/hebrew';
import { blockReason } from '../calendar/calLib';
import {
  addDaysIso,
  bookingBalance,
  bookingPaid,
  bookingTotal,
  isActive,
  isIso,
  nightsBetween,
  roomsLabel,
} from './transitions';

export * from './transitions';

/* ═══════════════ עזרי-תצוגה (כמו במקור) ═══════════════ */

/** "₪ 1,234" — `money` במקור (מעוגל, מפריד-אלפים עברי). */
export function money(n: number): string {
  return '₪ ' + Math.round(Number.isFinite(n) ? n : 0).toLocaleString('he-IL');
}

/** "14/10" — `fmtDate` במקור; לא-תקין ⇒ '—'. */
export function fmtDM(iso: string): string {
  if (!isIso(iso)) return '—';
  return +iso.slice(8, 10) + '/' + +iso.slice(5, 7);
}

/** ראשי-תיבות לאווטאר — `avatarText`/`ini` במקור. */
export function initialsOf(name: string): string {
  const p = (name || '').trim().split(/\s+/);
  const a = (p[0] || '').slice(0, 1);
  const b = (p[1] || '').slice(0, 1) || (p[0] || '').slice(1, 2);
  return a + b || '·';
}

/** ברכה לפי השעה — בדיוק כמו `viewDash` במקור. */
export function greetingOf(hour: number): [string, string] {
  if (hour < 5) return ['לילה טוב', '🌙'];
  if (hour < 12) return ['בוקר טוב', '🌅'];
  if (hour < 17) return ['צהריים טובים', '☀️'];
  if (hour < 21) return ['ערב טוב', '🌇'];
  return ['לילה טוב', '🌙'];
}

/** קישור "שתף בוואטסאפ" בלי נמען (דוח/הושבה) — wa.me או סכמת-האפליקציה (מצב-סינון כשר). */
export function waShareHref(text: string, appScheme: boolean): string {
  const t = encodeURIComponent(text);
  return appScheme ? 'whatsapp://send?text=' + t : 'https://wa.me/?text=' + t;
}

/** ראשית-החודש / סופו של תאריך ISO. */
export function monthBounds(iso: string): { from: string; to: string } {
  const y = +iso.slice(0, 4);
  const m = +iso.slice(5, 7);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` };
}

/* ═══════════════ מצב-חי של יחידה (תיקון F8) ═══════════════ */

export type HostLiveStatus = 'free' | 'dirty' | 'blocked' | 'occupied';

/** השהייה הנוכחית ביחידה — בצ׳ק-אין שהחל (כולל אורח שעבר את מועד-העזיבה ועוד לא עשה צ׳ק-אאוט). */
export function currentStay(u: Pick<HostUnit, 'id'>, bookings: readonly HostBooking[], today: string): HostBooking | null {
  let cur: HostBooking | null = null;
  for (const b of bookings) if (b.unitId === u.id && b.status === 'in' && b.checkIn <= today && (!cur || b.checkIn > cur.checkIn)) cur = b;
  return cur;
}

/** ההזמנה הבאה ליחידה (הגעה אחרי היום, לא בוטלה). */
export function nextStay(u: Pick<HostUnit, 'id'>, bookings: readonly HostBooking[], today: string): HostBooking | null {
  let nx: HostBooking | null = null;
  for (const b of bookings) if (b.unitId === u.id && isActive(b) && b.checkIn > today && (!nx || b.checkIn < nx.checkIn)) nx = b;
  return nx;
}

/**
 * מצב-היחידה עכשיו: חסומה > תפוסה > לניקיון > פנויה (`unitLiveStatus` במקור). **תיקון F8:** "תפוסה" כל עוד
 * יש צ׳ק-אין פעיל — במקור דרש גם `out > today`, ולכן יחידה עם אורח שלא עשה צ׳ק-אאוט הוצגה "פנויה".
 */
export function unitLiveStatus(u: HostUnit, bookings: readonly HostBooking[], today: string): HostLiveStatus {
  if (u.status === 'blocked') return 'blocked';
  if (currentStay(u, bookings, today)) return 'occupied';
  if (u.status === 'dirty') return 'dirty';
  return 'free';
}

/* ═══════════════ הגעות · עזיבות · יתרות (תיקונים F6/F8) ═══════════════ */

export interface HostArrival {
  b: HostBooking;
  /** הגעה שמועדה עבר ועוד לא נעשה צ׳ק-אין. */
  late: boolean;
}
export interface HostDeparture {
  b: HostBooking;
  /** עזיבה שמועדה עבר ועוד לא נעשה צ׳ק-אאוט. */
  overdue: boolean;
}

/** הגעות לטיפול היום — כולל **באיחור** (F8; במקור רק checkIn === היום — הגעה מאוחרת נעלמה מהלוח). */
export function arrivalsOn(bookings: readonly HostBooking[], today: string): HostArrival[] {
  return bookings
    .filter((b) => (b.status === 'confirmed' || b.status === 'pending') && b.checkIn <= today && b.checkOut > today)
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : a.checkIn > b.checkIn ? 1 : 0))
    .map((b) => ({ b, late: b.checkIn < today }));
}

/** עזיבות לטיפול היום — כולל **שעבר זמנן** (F8; במקור רק checkOut === היום). */
export function departuresOn(bookings: readonly HostBooking[], today: string): HostDeparture[] {
  return bookings
    .filter((b) => b.status === 'in' && b.checkOut <= today)
    .sort((a, b) => (a.checkOut < b.checkOut ? -1 : a.checkOut > b.checkOut ? 1 : 0))
    .map((b) => ({ b, overdue: b.checkOut < today }));
}

/** יתרות פתוחות — כל הזמנה שלא בוטלה עם חוב, **כולל אחרי צ׳ק-אאוט** (F6: החוב לא נעלם מהלוח). */
export function openBalances(bookings: readonly HostBooking[]): HostBooking[] {
  return bookings.filter((b) => isActive(b) && bookingBalance(b) > 0).sort((a, b) => bookingBalance(b) - bookingBalance(a));
}

/** תקבולי-החודש (לפי חודש-ההגעה) — **תיקון F2:** חודש **ושנה** (במקור `getMonth()` בלבד: ינואר-שעבר נספר). */
export function monthPaidRevenue(bookings: readonly HostBooking[], today: string): number {
  const ym = today.slice(0, 7);
  return bookings.filter((b) => isActive(b) && b.checkIn.slice(0, 7) === ym).reduce((s, b) => s + bookingPaid(b), 0);
}

/** חיובי-החודש (לפי חודש-ההגעה) — "הכנסת החודש" במרכז-ההזמנות (כמו במקור: טווח-תאריכים מלא). */
export function monthChargedRevenue(bookings: readonly HostBooking[], today: string): number {
  const { from, to } = monthBounds(today);
  return bookings.filter((b) => isActive(b) && b.checkIn >= from && b.checkIn <= to).reduce((s, b) => s + bookingTotal(b), 0);
}

const HE_MONTH_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

/** הכנסות N החודשים האחרונים (תקבולים לפי חודש-הגעה) — עמודות "📈 הכנסות · 6 חודשים". */
export function revenueSeries(bookings: readonly HostBooking[], today: string, n = 6): { ym: string; label: string; paid: number }[] {
  const y0 = +today.slice(0, 4);
  const m0 = +today.slice(5, 7) - 1;
  const out: { ym: string; label: string; paid: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y0, m0 - i, 1));
    const ym = d.toISOString().slice(0, 7);
    const paid = bookings.filter((b) => isActive(b) && b.checkIn.slice(0, 7) === ym).reduce((s, b) => s + bookingPaid(b), 0);
    out.push({ ym, label: HE_MONTH_SHORT[d.getUTCMonth()], paid });
  }
  return out;
}

/* ═══════════════ לוח-הבקרה ═══════════════ */

export interface HostDashboard {
  unitsN: number;
  occN: number;
  occPct: number;
  staying: HostBooking[];
  arrivals: HostArrival[];
  departures: HostDeparture[];
  dirtyUnits: HostUnit[];
  blockedN: number;
  freeN: number;
  openBal: HostBooking[];
  openBalSum: number;
  monthRevenue: number;
  openTasks: number;
  series: { ym: string; label: string; paid: number }[];
  live: Record<string, HostLiveStatus>;
}

export function dashboardOf(units: readonly HostUnit[], bookings: readonly HostBooking[], records: readonly HostRecord[], today: string): HostDashboard {
  const live: Record<string, HostLiveStatus> = {};
  for (const u of units) live[u.id] = unitLiveStatus(u, bookings, today);
  const count = (s: HostLiveStatus) => units.filter((u) => live[u.id] === s).length;
  const occN = count('occupied');
  const openBal = openBalances(bookings);
  return {
    unitsN: units.length,
    occN,
    occPct: Math.round((occN / Math.max(1, units.length)) * 100),
    staying: bookings.filter((b) => b.status === 'in'),
    arrivals: arrivalsOn(bookings, today),
    departures: departuresOn(bookings, today),
    dirtyUnits: units.filter((u) => live[u.id] === 'dirty'),
    blockedN: count('blocked'),
    freeN: count('free'),
    openBal,
    openBalSum: openBal.reduce((s, b) => s + bookingBalance(b), 0),
    monthRevenue: monthPaidRevenue(bookings, today),
    openTasks: records.filter((r) => r.kind === 'clean' && r.status === 'open').length,
    series: revenueSeries(bookings, today, 6),
    live,
  };
}

/* ═══════════════ מרכז-ההזמנות ═══════════════ */

export type HostBookingFilter = 'all' | HostBooking['status'];

export const HOST_BOOKING_FILTERS: readonly [HostBookingFilter, string][] = [
  ['all', 'הכל'],
  ['pending', 'ממתינות'],
  ['confirmed', 'מאושרות'],
  ['in', 'בבית'],
  ['done', 'הושלמו'],
  ['cancelled', 'בוטלו'],
];

/** סינון+חיפוש+מיון (ההגעה המאוחרת ראשונה) — `resCardsHtml` במקור; החיפוש: שם-אורח · יחידה · טלפון. */
export function bookingsView(
  bookings: readonly HostBooking[],
  filter: HostBookingFilter,
  q: string,
  guestOf: (id: string) => Pick<HostGuest, 'name' | 'phone'> | undefined,
  unitOf: (id: string) => Pick<HostUnit, 'name'> | undefined,
): HostBooking[] {
  let rs = bookings.slice().sort((a, b) => (a.checkIn < b.checkIn ? 1 : a.checkIn > b.checkIn ? -1 : 0));
  if (filter !== 'all') rs = rs.filter((b) => b.status === filter);
  const t = q.trim().toLowerCase();
  if (t) {
    rs = rs.filter((b) => {
      const g = guestOf(b.guestId);
      return ((g?.name ?? '') + ' ' + (unitOf(b.unitId)?.name ?? '') + ' ' + (g?.phone ?? '')).toLowerCase().includes(t);
    });
  }
  return rs;
}

export function bookingCounts(bookings: readonly HostBooking[]): Record<HostBookingFilter, number> {
  const out: Record<HostBookingFilter, number> = { all: bookings.length, pending: 0, confirmed: 0, in: 0, done: 0, cancelled: 0 };
  for (const b of bookings) out[b.status]++;
  return out;
}

/** 5 ה-KPI של מרכז-ההזמנות: הגעות · עזיבות · בבית · הכנסת החודש (חיובים) · לגבייה. */
export function bookingsKpis(bookings: readonly HostBooking[], today: string): { arrivals: number; departures: number; inHouse: number; monthCharged: number; owed: number } {
  const active = bookings.filter(isActive);
  return {
    arrivals: arrivalsOn(active, today).length,
    departures: departuresOn(active, today).length,
    inHouse: active.filter((b) => b.status === 'in').length,
    monthCharged: monthChargedRevenue(active, today),
    owed: active.reduce((s, b) => s + Math.max(0, bookingBalance(b)), 0),
  };
}

/* ═══════════════ יחידות ═══════════════ */

/** הכנסת-החודש של יחידה (חיובים, לפי חודש-הגעה) — כרטיס-היחידה. */
export function unitMonthRevenue(u: Pick<HostUnit, 'id'>, bookings: readonly HostBooking[], today: string): number {
  return monthChargedRevenue(
    bookings.filter((b) => b.unitId === u.id),
    today,
  );
}

/* ═══════════════ אורחים ═══════════════ */

export interface HostGuestStats {
  stays: number;
  spend: number;
  last: string;
}

/** שהיות · הוצאה · ביקור-אחרון (בלי ביטולים) — `guestStats` במקור. */
export function guestStats(guestId: string, bookings: readonly HostBooking[]): HostGuestStats {
  let stays = 0;
  let spend = 0;
  let last = '';
  for (const b of bookings) {
    if (b.guestId !== guestId || !isActive(b)) continue;
    stays++;
    spend += bookingTotal(b);
    if (b.checkIn > last) last = b.checkIn;
  }
  return { stays, spend, last };
}

/** רשימת-האורחים: חיפוש (שם/טלפון/מייל) + מיון לפי הוצאה יורדת. */
export function guestsView(guests: readonly HostGuest[], bookings: readonly HostBooking[], q: string): { g: HostGuest; s: HostGuestStats }[] {
  const t = q.trim().toLowerCase();
  return guests
    .filter((g) => !t || (g.name + ' ' + g.phone + ' ' + g.email).toLowerCase().includes(t))
    .map((g) => ({ g, s: guestStats(g.id, bookings) }))
    .sort((a, b) => b.s.spend - a.s.spend);
}

/* ═══════════════ ניקיון ═══════════════ */

export function cleanTasksOf(records: readonly HostRecord[]): { open: HostCleanTask[]; done: HostCleanTask[] } {
  const tasks = records.filter((r): r is HostCleanTask => r.kind === 'clean');
  return { open: tasks.filter((t) => t.status === 'open'), done: tasks.filter((t) => t.status === 'done') };
}

/* ═══════════════ שבת / יום-טוב — מהמנוע העברי הקיים ═══════════════ */

/**
 * שבת או יום-טוב בתאריך — `calLib.blockReason(…, 'org')` (שבת + חגים-מלאים כולל דין-נדחה), **בלי** צום
 * תשעה-באב (צום, לא יו״ט — צ׳ק-אין בו מותר). אפס חשבון-תאריכים חדש (הכרעה 4).
 */
export function sacredDayOf(iso: string): string | null {
  if (!isIso(iso)) return null;
  const br = blockReason(new Date(iso + 'T12:00:00'), 'org');
  return br && !br.startsWith('תשעה באב') ? br : null;
}

/** ימי שבת/יו״ט שבהם האורח שוהה (מיום-ההגעה עד יום-העזיבה, כולל). */
export function staySacredDays(checkIn: string, checkOut: string): { iso: string; name: string }[] {
  const n = nightsBetween(checkIn, checkOut);
  const out: { iso: string; name: string }[] = [];
  for (let i = 0; i <= n && i < 400; i++) {
    const iso = addDaysIso(checkIn, i);
    const name = sacredDayOf(iso);
    if (name) out.push({ iso, name });
  }
  return out;
}

/** אזהרת צ׳ק-אין/צ׳ק-אאוט בשבת/יו״ט (אזהרה — לא חסימה; שהייה שחוצה שבת היא הרגילה). */
export function arrivalWarnings(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const a = sacredDayOf(checkIn);
  const d = sacredDayOf(checkOut);
  if (a) out.push('צ׳ק-אין ב' + (a === 'שבת' ? 'שבת' : 'יום טוב · ' + a));
  if (d) out.push('צ׳ק-אאוט ב' + (d === 'שבת' ? 'שבת' : 'יום טוב · ' + d));
  return out;
}

/* ═══════════════ יומן-תפוסה (מעל lib/monthGrid) ═══════════════ */

export interface HostCalDay {
  iso: string;
  /** מספר-היום לכותרת (לועזי: "14"; עברי: היום בגימטריה). */
  head: string;
  /** תת-כותרת (לועזי: היום העברי; עברי: d/m). */
  sub: string;
  /** שישי/שבת — הדגשה כמו במקור. */
  weekend: boolean;
  /** שבת/יו״ט מהלוח העברי (או null). */
  sacred: string | null;
  /** כל מועד/חג (גם קל) — לטיפ. */
  holiday: string | null;
  today: boolean;
}

export interface HostCalMonth {
  days: HostCalDay[];
  label: string;
  subLabel: string;
  prevIso: string;
  nextIso: string;
}

/** ימי-החודש (לועזי או **עברי**) + ניווט — מתוך buildMonthGrid הקיים (אותו גריד של הקופות/החנות). */
export function calendarMonth(anchorIso: string, hebMode: boolean, today: string): HostCalMonth {
  const g = buildMonthGrid<{ date: string }>([], anchorIso, hebMode);
  const days = g.cells
    .filter((c) => c.inMonth)
    .map((c): HostCalDay => {
      const wd = new Date(c.iso + 'T12:00:00').getDay();
      return {
        iso: c.iso,
        head: hebMode ? c.hebDay : String(+c.iso.slice(8, 10)),
        sub: hebMode ? fmtDM(c.iso) : c.hebDay,
        weekend: wd === 5 || wd === 6,
        sacred: sacredDayOf(c.iso),
        holiday: c.holiday,
        today: c.iso === today,
      };
    });
  // מצב עברי: כותרת בעברית מלאה (הגריד המשותף מחזיר את מפתח-החודש באנגלית — "Heshvan" — ולא משנים אותו כאן,
  // כדי לא להזיז את הקופות/החנות); שם-החודש וגימטריית-השנה מ-Intl/gemYear הקיימים.
  const first = days[0]?.iso ?? anchorIso;
  const d0 = new Date(first + 'T12:00:00');
  const label = hebMode ? fmtHebMonth.format(d0) + ' ' + gemYear(fmtHebYear.format(d0)) : g.label;
  return { days, label, subLabel: g.subLabel, prevIso: g.prevIso, nextIso: g.nextIso };
}

const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHebYear = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });

export interface HostCalBar {
  id: string;
  unitId: string;
  /** אינדקס-היום שבו הפס מתחיל (בתוך days). */
  start: number;
  /** מספר הימים שהפס מכסה (לילות בתוך החלון). */
  span: number;
  lane: number;
  status: HostBooking['status'];
  label: string;
}

/**
 * הפסים של היומן + נתיבים לחפיפות (הזמנות-חדרים באותה יחידה) — `renderCal` במקור: נתיב = הראשון שהסתיים
 * עד ההגעה; פס מכסה את הלילות בתוך החלון (מההגעה עד יום-לפני-העזיבה).
 */
export function calendarBars(
  units: readonly HostUnit[],
  bookings: readonly HostBooking[],
  dayIsos: readonly string[],
  guestName: (id: string) => string,
): { bars: HostCalBar[]; lanes: Record<string, number> } {
  const bars: HostCalBar[] = [];
  const lanes: Record<string, number> = {};
  if (!dayIsos.length) return { bars, lanes };
  const first = dayIsos[0];
  const last = dayIsos[dayIsos.length - 1];
  for (const u of units) {
    const urs = bookings
      .filter((b) => b.unitId === u.id && isActive(b) && b.checkIn <= last && b.checkOut > first)
      .sort((a, b) => (a.checkIn < b.checkIn ? -1 : a.checkIn > b.checkIn ? 1 : 0));
    const ends: string[] = [];
    for (const b of urs) {
      let L = ends.findIndex((e) => e <= b.checkIn);
      if (L < 0) {
        L = ends.length;
        ends.push(b.checkOut);
      } else ends[L] = b.checkOut;
      const start = b.checkIn <= first ? 0 : nightsBetween(first, b.checkIn);
      const end = b.checkOut > last ? dayIsos.length - 1 : nightsBetween(first, b.checkOut) - 1;
      if (end < start) continue;
      const rl = roomsLabel(u, b.roomIds);
      bars.push({ id: b.id, unitId: u.id, start, span: end - start + 1, lane: L, status: b.status, label: guestName(b.guestId) + (rl ? ' · ' + rl : '') });
    }
    lanes[u.id] = Math.max(1, ends.length);
  }
  return { bars, lanes };
}
