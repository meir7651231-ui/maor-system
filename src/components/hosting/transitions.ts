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
  HostDish,
  HostFault,
  HostingPrefs,
  HostMeal,
  HostMealItem,
  HostRecord,
  HostUnit,
} from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { canGrantedAction, featureOn, termOf } from '../../lib/config';
import { HOST_DEFAULTS } from './model';

/* ═══════════════ הרשאות ═══════════════ */

/** שתי הפעולות המוגבלות של המודול (GRANTABLE_STAFF_FEATURES) — מנהל/בעלים תמיד, עובד/ת רק בהדלקה. */
export type HostGrantKey = 'hosting.delete' | 'hosting.manage';

/** הרשאה אחידה לממשק ול-store: הדגל דלוק (כולל שרשור-המודול — opt-in) **וגם** סמכות-מנהל או הדלקה-פר-עובד. */
export function hostCan(config: OrgConfig, email: string | null | undefined, isManager: boolean, key: HostGrantKey): boolean {
  return featureOn(config, key) && canGrantedAction(config, email, isManager, key);
}

/* ═══════════════ מונחים ═══════════════ */

export interface HostTerms {
  nav: string;
  unit: string;
  units: string;
  guest: string;
  guests: string;
  booking: string;
  bookings: string;
}

/**
 * מונחי-המודול לממשק ול-store (מקור-אמת אחד): מונח-האשף גובר; אחרת — מתג "משפחה מתארחת" של המקור
 * (`term('אורח')` ⇒ "משפחה מתארחת", ובלשונית/KPI "אורחים" ⇒ "משפחות").
 */
export function hostTerms(config: OrgConfig, prefs?: HostingPrefs | null): HostTerms {
  const fam = prefs?.familyTerm === true;
  return {
    nav: termOf(config, 'nav.hosting', 'אירוח משפחתי'),
    unit: termOf(config, 'entity.hostUnit', 'יחידה'),
    units: termOf(config, 'entity.hostUnits', 'יחידות'),
    guest: termOf(config, 'entity.hostGuest', fam ? 'משפחה מתארחת' : 'אורח'),
    guests: termOf(config, 'entity.hostGuests', fam ? 'משפחות' : 'אורחים'),
    booking: termOf(config, 'entity.hostBooking', 'הזמנה'),
    bookings: termOf(config, 'entity.hostBookings', 'הזמנות'),
  };
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

/* ═══════════════ מטבח — הליבה שה-store אוכף (המנוע המלא ב-kitchen.ts) ═══════════════ */

/** ארוחה פעילה = לא נמסרה ולא בוטלה. */
export function isMealActive(m: Pick<HostMeal, 'status'>): boolean {
  return m.status !== 'served' && m.status !== 'cancelled';
}

/** המנה בתפריט — לפי dishId, ואם אין (נתוני-מקור) — לפי השם (כמו במקור). */
export function dishOf(item: Pick<HostMealItem, 'dishId' | 'name'>, dishes: readonly HostDish[]): HostDish | undefined {
  return (item.dishId && dishes.find((d) => d.id === item.dishId)) || dishes.find((d) => d.name === item.name);
}

/**
 * "🔄 סנכרן הכל" (`syncAllKitchen`): כל ארוחה פעילה המשויכת — סועדים ⇐ משתתפי-ההזמנה (וחיוב-המטבח מתחדש);
 * כל מנה בלי טבח ⇐ טבח-ברירת-המחדל של המנה, ואם אין — המכין-האחראי של הארוחה.
 */
export function syncAllKitchen(
  meals: readonly HostMeal[],
  bookings: readonly HostBooking[],
  dishes: readonly HostDish[],
  nowIso: string,
): { meals: HostMeal[]; bookings: HostBooking[]; mealsSynced: number; dishesAssigned: number } {
  const byId = new Map(meals.map((m) => [m.id, m] as const));
  const changedBookings: HostBooking[] = [];
  const seen = new Set<string>();
  let mealsSynced = 0;
  for (const m of meals) {
    if (!isMealActive(m) || !m.bookingId || seen.has(m.bookingId)) continue;
    seen.add(m.bookingId);
    const b = bookings.find((x) => x.id === m.bookingId);
    if (!b) continue;
    const res = syncMealsToParty([...byId.values()], b, nowIso);
    for (const nm of res.meals) byId.set(nm.id, nm);
    mealsSynced += res.meals.length;
    changedBookings.push({ ...b, charges: res.charges, updatedAt: nowIso });
  }
  let dishesAssigned = 0;
  for (const m of Array.from(byId.values())) {
    if (!isMealActive(m)) continue;
    let touched = false;
    const items = m.items.map((it) => {
      if (it.by) return it;
      const def = dishOf(it, dishes)?.defBy || m.cook;
      if (!def) return it;
      dishesAssigned++;
      touched = true;
      return { ...it, by: def };
    });
    if (touched) byId.set(m.id, { ...m, items, updatedAt: nowIso });
  }
  const changedMeals = [...byId.values()].filter((m) => m !== meals.find((x) => x.id === m.id));
  return { meals: changedMeals, bookings: changedBookings, mealsSynced, dishesAssigned };
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

/**
 * תיקון F12: שחרור-חסימה מחזיר את היחידה ל"לניקיון" כשממתינה לה משימת "ניקיון אחרי עזיבה" (צ׳ק-אאוט שקרה
 * בזמן שהיחידה הייתה חסומה) — אחרת לפנויה. במקור צ׳ק-אאוט ביחידה חסומה "שחרר" אותה בשקט ל"מלוכלכת".
 */
export function releasedUnitStatus(unitId: string, records: readonly HostRecord[]): 'free' | 'dirty' {
  return checkoutTasksToClose(unitId, records).length ? 'dirty' : 'free';
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

/**
 * תיקון F13: קריאה חוסמת **נוספת** פתוחה על אותה יחידה — אז סגירת הקריאה הנוכחית לא משחררת את היחידה
 * (במקור סגירת קריאה אחת שחררה יחידה שעוד עמדה עליה קריאת P0 אחרת).
 */
export function otherBlockingFault(records: readonly HostRecord[], unitId: string, exceptId: string): boolean {
  return !!unitId && records.some((r) => r.kind === 'fault' && r.id !== exceptId && r.unitId === unitId && r.blocked && r.status !== 'done');
}

/** נקודות-המדידה של יומן-הטמפרטורה (כמו במקור). */
export const HOST_TEMP_DEVICES = ['מקרר', 'מקפיא', 'חימום'] as const;

/** בטיחות-מזון: מקרר עד 5° · מקפיא עד −15° · חימום מעל 63° (כמו במקור). */
export function tempOk(device: string, temp: number): boolean {
  return device === 'מקרר' ? temp <= 5 : device === 'מקפיא' ? temp <= -15 : temp >= 63;
}

/**
 * תיקון F7: חריגת-טמפרטורה ⇒ קריאה **כללית** (בלי יחידה), בטיחות, P1, לא חוסמת יחידה. במקור הקריאה נפתחה על
 * "היחידה הראשונה ברשימה" (שרירותי) — והופיעה כתקלה של צימר שאין לו קשר למטבח.
 */
export function tempBreachFault(device: string, temp: number, id: string, nowIso: string): HostFault {
  return {
    id,
    kind: 'fault',
    unitId: '',
    assetId: '',
    category: 'מיזוג/קירור',
    priority: 1,
    desc: 'חריגת טמפרטורה ב' + device + ' (' + temp + '°)',
    status: 'open',
    safety: true,
    blocked: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/* ═══════════════ מחיקה בלי יתומים ═══════════════ */

/**
 * תיקון F5: מחיקת הזמנה — הארוחות המשויכות **נשמרות ומתנתקות** (במקור נשארו מצביעות להזמנה שאינה), ומשימת-העזיבה
 * שלה מאבדת את הקישור. בלי שינוי ⇒ אותו מערך.
 */
export function unlinkBookingRecords(records: readonly HostRecord[], bookingId: string, nowIso: string): HostRecord[] {
  let touched = false;
  const out = records.map((r): HostRecord => {
    if (r.kind === 'meal' && r.bookingId === bookingId) {
      touched = true;
      return { ...r, bookingId: '', updatedAt: nowIso };
    }
    if (r.kind === 'clean' && r.bookingId === bookingId) {
      touched = true;
      const next: HostCleanTask = { ...r, updatedAt: nowIso };
      delete next.bookingId;
      return next;
    }
    return r;
  });
  return touched ? out : (records as HostRecord[]);
}

/** מחיקת איש-צוות (כמו במקור): כל השיבוצים שלו — מכין/מגיש/מפנה/מסדר, טבח-המנה, טבח-ברירת-המחדל של מנה — מתרוקנים. */
export function clearStaffRefs(records: readonly HostRecord[], staffId: string, nowIso: string): HostRecord[] {
  let touched = false;
  const out = records.map((r): HostRecord => {
    if (r.kind === 'meal') {
      const roles = r.cook === staffId || r.server === staffId || r.clearer === staffId || r.tableSetter === staffId;
      const items = r.items.some((it) => it.by === staffId);
      if (!roles && !items) return r;
      touched = true;
      return {
        ...r,
        cook: r.cook === staffId ? '' : r.cook,
        server: r.server === staffId ? '' : r.server,
        clearer: r.clearer === staffId ? '' : r.clearer,
        tableSetter: r.tableSetter === staffId ? '' : r.tableSetter,
        items: items ? r.items.map((it) => (it.by === staffId ? { ...it, by: '' } : it)) : r.items,
        updatedAt: nowIso,
      };
    }
    if (r.kind === 'dish' && r.defBy === staffId) {
      touched = true;
      return { ...r, defBy: '', updatedAt: nowIso };
    }
    return r;
  });
  return touched ? out : (records as HostRecord[]);
}

/** מחיקת ציוד (יכולת חדשה — במקור לא היה אפשר למחוק ציוד): קריאות ותוכניות-תחזוקה שהצביעו אליו — מתנתקות. */
export function clearAssetRefs(records: readonly HostRecord[], assetId: string, nowIso: string): HostRecord[] {
  let touched = false;
  const out = records.map((r): HostRecord => {
    if ((r.kind === 'fault' || r.kind === 'plan') && r.assetId === assetId) {
      touched = true;
      return { ...r, assetId: '', updatedAt: nowIso };
    }
    return r;
  });
  return touched ? out : (records as HostRecord[]);
}

/* ═══════════════ רשומות "פשוטות" (טופס ⇒ שמירה) ═══════════════ */

/**
 * הסוגים שנשמרים בשמירה-גנרית (upsertHostRecord). ארוחה (חיוב-תיק), ניקיון (שחרור-יחידה), תקלה (חסימה) וטמפ׳
 * (קריאה בחריגה) — רק דרך הפעולות הייעודיות שאוכפות את הכללים.
 */
export const HOST_PLAIN_KINDS = ['guest', 'dish', 'staff', 'supply', 'tableItem', 'asset', 'plan'] as const;
export type HostPlainKind = (typeof HOST_PLAIN_KINDS)[number];

export function isPlainKind(kind: unknown): kind is HostPlainKind {
  return typeof kind === 'string' && (HOST_PLAIN_KINDS as readonly string[]).includes(kind);
}

/** ניקוי-הטופס של המקור + הודעת-השגיאה שלו (שם חסר וכו׳). הרשומה כבר מרופאת (healHostRecord). */
export function cleanPlainRecord(r: HostRecord): { ok: true; record: HostRecord } | { ok: false; error: string } {
  switch (r.kind) {
    case 'guest':
      return { ok: true, record: { ...r, name: r.name.trim() || '—', phone: r.phone.trim(), email: r.email.trim() } };
    case 'dish': {
      const name = r.name.trim();
      if (!name) return { ok: false, error: 'שם מנה חסר' };
      return { ok: true, record: { ...r, name, ingredients: r.ingredients.filter((x) => x.trim()), steps: r.steps.filter((x) => x.trim()) } };
    }
    case 'staff': {
      const name = r.name.trim();
      return name ? { ok: true, record: { ...r, name, phone: r.phone.trim() } } : { ok: false, error: 'שם חסר' };
    }
    case 'supply': {
      const name = r.name.trim();
      return name ? { ok: true, record: { ...r, name } } : { ok: false, error: 'שם פריט חסר' };
    }
    case 'tableItem': {
      const name = r.name.trim();
      return name ? { ok: true, record: { ...r, name } } : { ok: false, error: 'שם חסר' };
    }
    case 'asset': {
      const name = r.name.trim();
      return name ? { ok: true, record: { ...r, name } } : { ok: false, error: 'שם חסר' };
    }
    case 'plan': {
      const task = r.task.trim();
      return task ? { ok: true, record: { ...r, task } } : { ok: false, error: 'משימה חסרה' };
    }
    default:
      return { ok: false, error: '' };
  }
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
