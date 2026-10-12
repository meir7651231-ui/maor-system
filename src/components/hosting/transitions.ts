/**
 * 🏡 אירוח משפחתי — ליבת-המעברים הטהורה שה-store מפעיל (BUILD-ORDER-HOSTING-2026-10-12, אשכולות 3–4).
 *
 * קטן ותלוי-domain/config בלבד **במכוון**: ה-store המרכזי (בבנדל-הראשי) מייבא רק את הקובץ הזה ואת model.ts —
 * לא את lib.ts (לוח-עברי, יומן, דוחות, מטבח, הושבה), שנשאר בצ'אנק-העצל של המסך. lib.ts מייצא-מחדש את כל מה
 * שכאן, כך שהממשק והבדיקות מייבאים מ-'./lib'.
 *
 * מה כאן: תאריכים (לילות, חפיפה) · ברירות-המחדל של ההגדרות · תיק-השהייה (סה״כ/שולם/יתרה) · זמינות מודעת-חדרים
 * (כולל חסימת-יחידה — תיקון F1) · תמחור (לינה+ניקיון+מע״מ) · החלפת החיובים-המחושבים בלבד (F3) · חיוב-ארוחה (F4)
 * · מעברי-סטטוס של הזמנה · סנכרון ארוחות לגודל-ההזמנה · חבילת-שבת (F9) · ניקיון (F10) · תחזוקה · טמפ׳ (F7).
 * בלי store/DOM/Date.now — "היום"/"עכשיו" מוזרקים ⇒ דטרמיניסטי ונבדק-ביחידה.
 * בידוד (הכרעה 2): אין כאן — ולא יהיה — שום נגיעה בקבלות/תרומות/מונים/לוח-ראשי/חדרי-החוגים.
 */
import type {
  HostBooking,
  HostBookingStatus,
  HostCharge,
  HostCleanTask,
  HostingPrefs,
  HostMeal,
  HostRecord,
  HostUnit,
} from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { canGrantedAction, featureOn } from '../../lib/config';
import { HOST_DEFAULTS } from './model';

/* ═══════════════ הרשאות ═══════════════ */

/** שתי הפעולות המוגבלות של המודול (GRANTABLE_STAFF_FEATURES) — מנהל/בעלים תמיד, עובד/ת רק בהדלקה. */
export type HostGrantKey = 'hosting.delete' | 'hosting.manage';

/** הרשאה אחידה לממשק ול-store: הדגל דלוק (כולל שרשור-המודול — opt-in) **וגם** סמכות-מנהל או הדלקה-פר-עובד. */
export function hostCan(config: OrgConfig, email: string | null | undefined, isManager: boolean, key: HostGrantKey): boolean {
  return featureOn(config, key) && canGrantedAction(config, email, isManager, key);
}

/* ═══════════════ תאריכים (ISO, בלי אזורי-זמן — חשבון-UTC על תאריך-קלנדרי) ═══════════════ */

const DAY_MS = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIso(v: unknown): v is string {
  return typeof v === 'string' && ISO_RE.test(v);
}

function utcOf(iso: string): number {
  return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}

/** מספר הלילות [a, b) — לא-תקין ⇒ 0 (כמו `nights` במקור). */
export function nightsBetween(a: string, b: string): number {
  if (!isIso(a) || !isIso(b)) return 0;
  return Math.round((utcOf(b) - utcOf(a)) / DAY_MS);
}

/** ISO + n ימים — לא-תקין ⇒ ''. */
export function addDaysIso(iso: string, n: number): string {
  if (!isIso(iso)) return '';
  return new Date(utcOf(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

/** חפיפת שהיות (לילות חצי-פתוחים) — כמו `overlap` במקור. */
export function overlaps(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}

/* ═══════════════ הגדרות ═══════════════ */

export interface HostSettings {
  checkin: string;
  checkout: string;
  cleaningFee: number;
  taxPct: number;
  orderLeadDays: number;
  familyTerm: boolean;
}

/** ההגדרות האפקטיביות — חסר ⇒ ברירות-המחדל של האפליקציה המקורית. */
export function hostSettings(prefs?: HostingPrefs | null): HostSettings {
  return {
    checkin: prefs?.checkin ?? HOST_DEFAULTS.checkin,
    checkout: prefs?.checkout ?? HOST_DEFAULTS.checkout,
    cleaningFee: prefs?.cleaningFee ?? HOST_DEFAULTS.cleaningFee,
    taxPct: prefs?.taxPct ?? HOST_DEFAULTS.taxPct,
    orderLeadDays: prefs?.orderLeadDays ?? HOST_DEFAULTS.orderLeadDays,
    familyTerm: prefs?.familyTerm === true,
  };
}

/* ═══════════════ תיק-שהייה ═══════════════ */

export function bookingTotal(b: Pick<HostBooking, 'charges'>): number {
  return b.charges.reduce((s, c) => s + (Number.isFinite(c.amount) ? c.amount : 0), 0);
}
export function bookingPaid(b: Pick<HostBooking, 'payments'>): number {
  return b.payments.reduce((s, p) => s + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}
export function bookingBalance(b: Pick<HostBooking, 'charges' | 'payments'>): number {
  return bookingTotal(b) - bookingPaid(b);
}
/** משתתפי-ההזמנה (מבוגרים+ילדים) — `resPeople` במקור. */
export function bookingParty(b: Pick<HostBooking, 'adults' | 'kids'> | null | undefined): number {
  return b ? (b.adults || 0) + (b.kids || 0) : 0;
}

/** הזמנה "פעילה" = לא בוטלה (`activeRes` במקור — כולל הושלמה). */
export function isActive(b: Pick<HostBooking, 'status'>): boolean {
  return b.status !== 'cancelled';
}

/* ═══════════════ חדרים ═══════════════ */

export function unitHasRooms(u: Pick<HostUnit, 'subRooms'> | null | undefined): boolean {
  return !!u && u.subRooms.length > 0;
}
export function roomNameOf(u: Pick<HostUnit, 'subRooms'> | null | undefined, rid: string): string {
  return u?.subRooms.find((r) => r.id === rid)?.name ?? rid;
}
/** "חדר הורים + חדר ילדים" — '' כשהוזמנה כל היחידה. */
export function roomsLabel(u: Pick<HostUnit, 'subRooms'> | null | undefined, roomIds: readonly string[]): string {
  return roomIds.length ? roomIds.map((id) => roomNameOf(u, id)).join(' + ') : '';
}
/** מיטות של בחירת-החדרים (או קיבולת-היחידה כשלמה) — `bookBeds` במקור. */
export function bookBeds(u: HostUnit, roomIds: readonly string[]): number {
  if (!unitHasRooms(u) || !roomIds.length) return u.cap;
  return u.subRooms.filter((r) => roomIds.includes(r.id)).reduce((s, r) => s + (r.beds || 0), 0);
}
/** מחיר-ללילה של בחירת-החדרים (או מחיר-היחידה) — `bookRate` במקור. */
export function bookRate(u: HostUnit, roomIds: readonly string[]): number {
  if (!unitHasRooms(u) || !roomIds.length) return u.rate;
  return u.subRooms.filter((r) => roomIds.includes(r.id)).reduce((s, r) => s + (r.rate || 0), 0);
}

/* ═══════════════ זמינות (מניעת overbooking, מודעת-חדרים) ═══════════════ */

/** סמן "כל היחידה תפוסה" בסט-החדרים-התפוסים. */
export const ALL_ROOMS = '__ALL__';

/** הזמנה חוסמת-זמינות: לא בוטלה ולא הושלמה (כמו `occupiedRooms` במקור). */
export function blocksAvailability(b: Pick<HostBooking, 'status'>): boolean {
  return b.status !== 'cancelled' && b.status !== 'done';
}

/** החדרים התפוסים ביחידה בטווח (ALL_ROOMS = היחידה כולה) — `occupiedRooms` במקור. */
export function occupiedRoomIds(bookings: readonly HostBooking[], u: HostUnit, checkIn: string, checkOut: string, exceptId?: string | null): Set<string> {
  const set = new Set<string>();
  const roomed = unitHasRooms(u);
  for (const b of bookings) {
    if (b.unitId !== u.id || b.id === exceptId || !blocksAvailability(b)) continue;
    if (!overlaps(checkIn, checkOut, b.checkIn, b.checkOut)) continue;
    if (!roomed) {
      set.add(ALL_ROOMS);
      continue;
    }
    if (b.roomIds.length) for (const id of b.roomIds) set.add(id);
    else for (const r of u.subRooms) set.add(r.id);
  }
  return set;
}

export type HostAvailReason = 'dates' | 'rooms' | 'blocked' | 'clash';
export type HostAvailability = { ok: true } | { ok: false; reason: HostAvailReason };

/**
 * בדיקת-זמינות להזמנה (חדשה או עריכה — exceptId). סדר: תאריכים ⇒ בחירת-חדר ביחידה משותפת ⇒
 * **יחידה חסומה** (תיקון F1 — במקור `isAvailableRooms` התעלם מ-status ותקלת P0/P1 לא מנעה הזמנה) ⇒ חפיפה.
 */
export function checkAvailability(
  bookings: readonly HostBooking[],
  u: HostUnit,
  checkIn: string,
  checkOut: string,
  roomIds: readonly string[],
  exceptId?: string | null,
): HostAvailability {
  if (nightsBetween(checkIn, checkOut) <= 0) return { ok: false, reason: 'dates' };
  const roomed = unitHasRooms(u);
  if (roomed && !roomIds.length) return { ok: false, reason: 'rooms' };
  if (u.status === 'blocked') return { ok: false, reason: 'blocked' };
  const occ = occupiedRoomIds(bookings, u, checkIn, checkOut, exceptId);
  if (occ.has(ALL_ROOMS)) return { ok: false, reason: 'clash' };
  if (!roomed) return occ.size === 0 ? { ok: true } : { ok: false, reason: 'clash' };
  return roomIds.every((id) => !occ.has(id)) ? { ok: true } : { ok: false, reason: 'clash' };
}

/* ═══════════════ תמחור וחיובים ═══════════════ */

export interface HostQuote {
  nights: number;
  /** מחיר-ללילה של הבחירה. */
  rate: number;
  stay: number;
  cleaning: number;
  taxPct: number;
  tax: number;
  total: number;
  /** "לינה · 2 לילות · חדר הורים" */
  stayLabel: string;
}

/** הצעת-המחיר של המקור: לינה (מחיר×לילות) + דמי-ניקיון + מע״מ על השניים (מעוגל). */
export function priceQuote(u: HostUnit, roomIds: readonly string[], checkIn: string, checkOut: string, s: HostSettings): HostQuote {
  const nights = Math.max(0, nightsBetween(checkIn, checkOut));
  const rate = bookRate(u, roomIds);
  const stay = rate * nights;
  const cleaning = s.cleaningFee;
  const tax = Math.round(((stay + cleaning) * s.taxPct) / 100);
  const rl = unitHasRooms(u) ? roomsLabel(u, roomIds) : '';
  return { nights, rate, stay, cleaning, taxPct: s.taxPct, tax, total: stay + cleaning + tax, stayLabel: 'לינה · ' + nights + ' לילות' + (rl ? ' · ' + rl : '') };
}

/** החיובים המחושבים (מזהים קבועים — מוחלפים בכל שמירה). */
export function systemCharges(q: HostQuote): HostCharge[] {
  return [
    { id: 'stay', kind: 'stay', label: q.stayLabel, amount: q.stay },
    { id: 'cleaning', kind: 'cleaning', label: 'דמי ניקיון', amount: q.cleaning },
    { id: 'tax', kind: 'tax', label: 'מע״מ ' + q.taxPct + '%', amount: q.tax },
  ];
}

const SYSTEM_KINDS: ReadonlySet<string> = new Set(['stay', 'cleaning', 'tax']);

/**
 * תיקון F3: שמירת-הזמנה מחליפה **רק** את החיובים-המחושבים (לינה/ניקיון/מע״מ) ומשאירה כל חיוב אחר — ארוחות,
 * חבילת-שבת, חיובים ידניים. במקור הנוסחה [לינה, ניקיון, מע״מ, ...ארוחות] מחקה את חיוב "חבילת שבת" בכל שמירה.
 */
export function withSystemCharges(charges: readonly HostCharge[], q: HostQuote): HostCharge[] {
  return [...systemCharges(q), ...charges.filter((c) => !SYSTEM_KINDS.has(c.kind))];
}

/* ═══════════════ ארוחות ⇄ תיק ═══════════════ */

/** סכום הזמנת-מטבח — Σ מחיר×כמות (`koTotal` במקור). */
export function mealTotal(m: Pick<HostMeal, 'items'>): number {
  return m.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
}

/**
 * חיוב-הארוחה בתיק: מסיר את החיוב הקודם של הארוחה ומוסיף חדש כשיש סכום. **תיקון F4:** ארוחה שבוטלה
 * לא מחויבת (במקור הביטול השאיר את החיוב בתיק, והארוחה נעלמה מרשימת-הארוחות של ההזמנה).
 */
export function withMealCharge(charges: readonly HostCharge[], m: Pick<HostMeal, 'id' | 'items' | 'status'>): HostCharge[] {
  const rest = charges.filter((c) => c.mealId !== m.id);
  const tot = mealTotal(m);
  if (tot <= 0 || m.status === 'cancelled') return rest;
  return [...rest, { id: 'meal:' + m.id, kind: 'meal', label: 'הזמנת מטבח (' + m.items.length + ' מנות)', amount: tot, mealId: m.id }];
}

/**
 * סנכרון ארוחות-ההזמנה לגודל-ההזמנה (`syncMealsToRes` במקור): כל ארוחה פעילה המשויכת — מס׳ הסועדים =
 * משתתפי-ההזמנה; כמות-מנה שלא שונתה ידנית (=הסועדים הקודמים, או ריקה) מתעדכנת; וחיוב-המטבח בתיק מתחדש.
 */
export function syncMealsToParty(meals: readonly HostMeal[], b: HostBooking, nowIso: string): { meals: HostMeal[]; charges: HostCharge[] } {
  const ppl = bookingParty(b);
  let charges = b.charges.slice();
  const changed: HostMeal[] = [];
  for (const m of meals) {
    if (m.bookingId !== b.id || m.status === 'served' || m.status === 'cancelled') continue;
    const prev = m.dinerCount;
    const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
    const next: HostMeal = { ...m, items, dinerCount: ppl, updatedAt: nowIso };
    changed.push(next);
    charges = withMealCharge(charges, next);
  }
  return { meals: changed, charges };
}

/* ═══════════════ מעברי-סטטוס של הזמנה ═══════════════ */

/**
 * מעברים מותרים: אישור ⇐ ממתינה · צ׳ק-אין ⇐ ממתינה/מאושרת (קיצור-הלוח של המקור) · צ׳ק-אאוט ⇐ בשהייה ·
 * ביטול ⇐ ממתינה/מאושרת/בשהייה (ההיסטוריה נשמרת). הושלמה/בוטלה — סופיות.
 */
export function canSetBookingStatus(from: HostBookingStatus, to: HostBookingStatus): boolean {
  if (to === 'confirmed') return from === 'pending';
  if (to === 'in') return from === 'pending' || from === 'confirmed';
  if (to === 'done') return from === 'in';
  if (to === 'cancelled') return from === 'pending' || from === 'confirmed' || from === 'in';
  return false;
}

/** משימת-הניקיון שצ׳ק-אאוט פותח (כמו במקור). */
export const AFTER_CHECKOUT_CLEAN = 'ניקיון אחרי עזיבה';

/** תשלום מותר בכל הזמנה שלא בוטלה — **תיקון F6** (במקור נחסם אחרי צ׳ק-אאוט אף שהחוב בדוח-הגבייה). */
export function canAddPayment(b: Pick<HostBooking, 'status'>): boolean {
  return b.status !== 'cancelled';
}

/* ═══════════════ חבילת שבת (תיקון F9) ═══════════════ */

export const SHABBAT_PACKAGE_PRICE = 250;
export const SHABBAT_PACKAGE_ITEMS = ['נרות', 'חלות', 'מיץ ענבים', 'פלטה + מיחם'] as const;

/** הזמנת-המטבח של חבילת-השבת — הסועדים **מההזמנה** (במקור מכרטיס-האורח, ולכן לא תאמה את ההזמנה). */
export function shabbatPackageMeal(b: HostBooking, s: HostSettings, id: string, nowIso: string): HostMeal {
  const ppl = bookingParty(b);
  return {
    id,
    kind: 'meal',
    mealName: 'חבילת שבת',
    bookingId: b.id,
    unitId: b.unitId,
    guestId: b.guestId,
    diners: [{ guestId: b.guestId, adults: b.adults, kids: b.kids }],
    dinerCount: ppl,
    date: b.checkIn,
    time: s.checkin,
    cook: '',
    server: '',
    clearer: '',
    tableSetter: '',
    items: SHABBAT_PACKAGE_ITEMS.map((name) => ({ name, price: 0, qty: 1, alg: '', by: '' })),
    status: 'new',
    allergens: '',
    notes: 'חבילת שבת',
    seatPlan: { people: [], tables: [] },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/* ═══════════════ ניקיון (תיקונים F10/F11) ═══════════════ */

export function isCleanTask(r: HostRecord): r is HostCleanTask {
  return r.kind === 'clean';
}

/**
 * תיקון F10: סיום משימה משחרר יחידה מלוכלכת רק כשאין לה משימה פתוחה נוספת (במקור כל סיום שחרר — גם
 * כש"ניקיון אחרי עזיבה" עוד פתוחה, והיחידה הוצגה "פנויה" לפני שנוקתה).
 */
export function unitFreeAfter(u: Pick<HostUnit, 'id' | 'status'>, records: readonly HostRecord[], finishedTaskId: string): boolean {
  if (u.status !== 'dirty') return false;
  return !records.some((r) => isCleanTask(r) && r.unitId === u.id && r.status === 'open' && r.id !== finishedTaskId);
}

/** תיקון F11: "🧹 נקייה" ידני סוגר את משימות "ניקיון אחרי עזיבה" הפתוחות של היחידה (במקור נשארו פתוחות לנצח). */
export function checkoutTasksToClose(unitId: string, records: readonly HostRecord[]): string[] {
  return records.filter((r) => isCleanTask(r) && r.unitId === unitId && r.status === 'open' && r.type === AFTER_CHECKOUT_CLEAN).map((r) => r.id);
}

/* ═══════════════ תחזוקה וטמפרטורה ═══════════════ */

/** P0 (סכנת חיים) / P1 (יחידה לא ראויה) חוסמות את היחידה ומתריעות (כמו במקור). */
export function faultBlocksUnit(priority: number): boolean {
  return priority <= 1;
}
/** פתוחה ⇒ בטיפול ⇒ טופלה (טופלה ⇒ סופית). */
export function nextFaultStatus(s: 'open' | 'inprogress' | 'done'): 'inprogress' | 'done' | null {
  return s === 'open' ? 'inprogress' : s === 'inprogress' ? 'done' : null;
}

/** בטיחות-מזון: מקרר עד 5° · מקפיא עד −15° · חימום מעל 63° (כמו במקור). */
export function tempOk(device: string, temp: number): boolean {
  return device === 'מקרר' ? temp <= 5 : device === 'מקפיא' ? temp <= -15 : temp >= 63;
}

/* ═══════════════ מזהים מקומיים (חדרים/חיובים/תשלומים/הושבה) ═══════════════ */

/** מזהה-מקומי הבא ברשימה: prefix + (הסיומת המספרית הגבוהה + 1) — דטרמיניסטי, בלי לצרוך את מונה-ה-DB. */
export function nextLocalId(prefix: string, list: readonly { id: string }[]): string {
  let max = 0;
  for (const x of list) {
    if (typeof x.id !== 'string' || !x.id.startsWith(prefix)) continue;
    const n = Number(x.id.slice(prefix.length));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return prefix + (max + 1);
}
