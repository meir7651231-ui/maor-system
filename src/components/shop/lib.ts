/**
 * מנוע החנות — טהור בלבד (בלי store/DOM); BUILD-ORDER-SHOP-2026-07-30.
 *
 * בידוד (הכרעת בעלים 30.7): כל החישובים על shopProducts/shopStores/
 * shopCriteria/shopAssignments/shopEvents בלבד — אין תלות ב-db.events/
 * supporters/enrollments. Reuse טהור: holidayOf/hebParts מ-lib/hebrew,
 * isoOf מ-calLib (lib→lib מותר).
 */
import type { Db, Id, IsoDate, ShopAssignment, ShopAssignmentStatus, ShopComponent, ShopCriterion, ShopItem, ShopProduct, ShopRedemption } from '../../types/domain';
import { isoOf } from '../calendar/calLib';
import { hebParts, holidayOf } from '../../lib/hebrew';
import { smartFilter } from '../../lib/search';

/* ---------- מימושים חיים ---------- */

/**
 * המימושים החיים של שיוך — מוחרגים המבוטלים (voidedAt). ה-helper היחיד
 * להחרגת מבוטלים: כל חישוב (סכומים/מלאי/סטטוס-מימוש) עובר דרכו — לא
 * סינונים מפוזרים (BUILD-ORDER-SHOP3 סעיף 5). הרשומה עצמה לעולם לא
 * נמחקת וה-S- שלה נשאר בסדרה.
 */
export function liveRedemptions(a: ShopAssignment): ShopRedemption[] {
  return a.redemptions.filter((r) => !r.voidedAt);
}

/* ---------- פריטי קטלוג (SHOP4, הכרעה 18) ---------- */

/** רכיב-בחבילה מפוענח — הפריט + דריסות הרכיב (value/basePrice בלבד). */
export interface ResolvedItem {
  itemId: Id;
  name: string;
  kind: ShopComponent['kind'];
  storeId: Id | '';
  value: number;
  basePrice: number;
  stock?: number;
  validDays?: number;
  holidays?: string[];
  active: boolean;
}

/**
 * פענוח רכיב לפריט שלו + דריסות. רכיב טרום-מיגרציה (itemId ריק/מצביע
 * שבור) נופל לשדות-התאימות של הרכיב עצמו — אין קריסה על נתונים ישנים.
 */
export function itemOf(db: Db, comp: ShopComponent): ResolvedItem {
  const item = db.shopItems.find((i) => i.id === comp.itemId);
  if (!item) {
    return {
      itemId: comp.itemId,
      name: comp.label,
      kind: comp.kind,
      storeId: comp.storeId,
      value: comp.value ?? 0,
      basePrice: comp.basePrice ?? 0,
      stock: comp.stock,
      validDays: comp.validDays,
      active: true,
    };
  }
  return {
    itemId: item.id,
    name: item.name,
    kind: item.kind,
    storeId: item.storeId,
    value: comp.value ?? item.value,
    basePrice: comp.basePrice ?? item.basePrice,
    stock: item.stock,
    validDays: item.validDays,
    holidays: item.holidays,
    active: item.active,
  };
}

/** האם החג רלוונטי לפריט מתנת-חג — ריק/חסר = כל החגים (הכרעה 17). */
export function holidayAllowed(ri: { holidays?: string[] }, holidayName: string): boolean {
  return !ri.holidays?.length || ri.holidays.includes(holidayName);
}

/**
 * הנותר במלאי של פריט — לב הכרעה 18: מלאי הפריט פחות **כל** המימושים
 * החיים של רכיבים המצביעים עליו בכל החבילות. null = ללא מעקב.
 */
export function itemRemaining(db: Db, itemId: Id): number | null {
  const item = db.shopItems.find((i) => i.id === itemId);
  if (!item || item.stock === undefined) return null;
  let used = 0;
  for (const a of db.shopAssignments) {
    const p = db.shopProducts.find((x) => x.id === a.productId);
    if (!p) continue;
    for (const r of liveRedemptions(a)) {
      const c = p.components.find((x) => x.id === r.componentId);
      if (c?.itemId === itemId) used++;
    }
  }
  return Math.max(0, item.stock - used);
}

/* ---------- מחיר אפקטיבי ---------- */

/**
 * המחיר הסמלי אחרי הנחות קריטריונים — ההנחה **הגבוהה** מבין קריטריוני
 * המוטב (לא מצטבר — ברירת ארכיטקט, הבעלים רשאי להכריע אחרת), עיגול לש"ח
 * שלם, לעולם לא שלילי.
 */
export function effectivePrice(basePrice: number, criterionIds: readonly Id[], criteria: readonly ShopCriterion[]): number {
  const pct = maxDiscountPct(criterionIds, criteria);
  const base = Number.isFinite(basePrice) ? basePrice : 0;
  return Math.max(0, Math.round(base * (1 - pct / 100)));
}

/** אחוז ההנחה האפקטיבי — הגבוה מבין קריטריוני המוטב (0 כשאין). */
export function maxDiscountPct(criterionIds: readonly Id[], criteria: readonly ShopCriterion[]): number {
  let pct = 0;
  for (const id of criterionIds) {
    const c = criteria.find((x) => x.id === id);
    if (c && Number.isFinite(c.discountPct) && c.discountPct > pct) pct = c.discountPct;
  }
  return Math.min(100, Math.max(0, pct));
}

/* ---------- חגים קרובים ---------- */

/**
 * החגים בטווח הימים הקרוב — סריקה יום-יום עם holidayOf; שם-חג ייחודי
 * (חג רב-ימי מוחזר ביומו הראשון בטווח).
 */
export function upcomingHolidays(fromIso: IsoDate, days = 45): { iso: IsoDate; name: string }[] {
  const out: { iso: IsoDate; name: string }[] = [];
  const seen = new Set<string>();
  const start = new Date(fromIso + 'T12:00:00');
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const name = holidayOf(d);
    if (name && !seen.has(name)) {
      seen.add(name);
      out.push({ iso: isoOf(d), name });
    }
  }
  return out;
}

let holidayNamesCache: string[] | null = null;

/**
 * כל שמות החגים הייחודיים — סריקת שנה עברית מלאה (400 יום מעוגן קבוע,
 * דטרמיניסטי) עם holidayOf; ממורש ברמת המודול (הרשימה קבועה). לבורר
 * החגים של מתנת-חג (הכרעה 17).
 */
export function holidayNames(): string[] {
  if (holidayNamesCache) return holidayNamesCache;
  const out: string[] = [];
  const seen = new Set<string>();
  const start = new Date('2026-01-01T12:00:00');
  for (let i = 0; i < 400; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const name = holidayOf(d);
    if (name && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  holidayNamesCache = out;
  return out;
}

/** השנה העברית של תאריך ISO — להשוואת מימושי מתנת-חג בין שנים. */
function hebYearOf(iso: IsoDate): number {
  return hebParts(new Date(iso + 'T12:00:00')).year;
}

/**
 * האם רכיב מומש בשיוך. למתנת-חג (holiday מועבר): מומש רק אם קיים מימוש
 * לאותו שם-חג **באותה שנה עברית** של מופע החג — מימוש לחג X אשתקד אינו
 * מכסה את השנה (המתנה מחזורית).
 */
export function assignmentRedeemed(
  a: ShopAssignment,
  componentId: Id,
  holiday?: { iso: IsoDate; name: string },
): boolean {
  const live = liveRedemptions(a);
  if (!holiday) return live.some((r) => r.componentId === componentId);
  const year = hebYearOf(holiday.iso);
  return live.some(
    (r) => r.componentId === componentId && r.holiday === holiday.name && !!r.date && hebYearOf(r.date) === year,
  );
}

/* ---------- מלאי ---------- */

/**
 * הנותר במלאי לרכיב — null כשאין מעקב (stock=undefined); אחרת stock פחות
 * סך מימושי הרכיב בכל שיוכי המוצר, קטום ב-0. המלאי נצרך במימוש —
 * לא בשיוך (שיוך = הבטחה, מימוש = מסירה בפועל).
 */
export function componentRemaining(
  componentId: Id,
  productId: Id,
  assignments: readonly ShopAssignment[],
  stock: number | undefined,
): number | null {
  if (stock === undefined) return null;
  let used = 0;
  for (const a of assignments) {
    if (a.productId !== productId) continue;
    for (const r of liveRedemptions(a)) if (r.componentId === componentId) used++;
  }
  return Math.max(0, stock - used);
}

/* ---------- תוקף קופונים ---------- */

/**
 * תאריך פקיעת קופון — '' כשאין validDays (או 0) או שאין לשיוך since.
 * הפקיעה = since + validDays; יום הגבול עצמו עדיין בתוקף (פג רק למחרת).
 */
export function couponExpiry(a: ShopAssignment, comp: { validDays?: number }): IsoDate | '' {
  if (!comp.validDays || !a.since) return '';
  const d = new Date(a.since + 'T12:00:00');
  d.setDate(d.getDate() + comp.validDays);
  return isoOf(d);
}

/* ---------- דורש טיפול ---------- */

export interface ShopCareItem {
  kind: 'holidayDue' | 'meetingPending' | 'couponPending' | 'couponExpired' | 'stockOut';
  assignmentId: Id;
  componentId: Id;
  label: string;
  hint: string;
}

/** ימי ההתראה למתנת-חג — חג בתוך ≤30 יום בלי מימוש נכנס לרשימת הטיפול. */
export const SHOP_HOLIDAY_DUE_DAYS = 30;

/**
 * רשימת הטיפול המשרדי — ממוינת לפי סוג: מתנות-חג שמועדן קרב →
 * פגישות שטרם מומשו → קופונים שטרם מומשו → קופונים שפקעו → מלאי שאזל.
 * שיוכים active בלבד (מלאי — פר-רכיב במוצר active, בלי שיוך: assignmentId='').
 * קופון שפקע מדווח כ-couponExpired (במקום couponPending — לא כפול).
 */
export function needsCare(db: Db, todayIso: IsoDate): ShopCareItem[] {
  const holidays = upcomingHolidays(todayIso, SHOP_HOLIDAY_DUE_DAYS);
  const due: ShopCareItem[] = [];
  const meetings: ShopCareItem[] = [];
  const coupons: ShopCareItem[] = [];
  const expired: ShopCareItem[] = [];
  const stock: ShopCareItem[] = [];
  // מלאי משותף (הכרעה 18): התרעת אזל פר-פריט — הנותר נספר על-פני כל החבילות
  for (const item of db.shopItems) {
    if (!item.active) continue;
    if (itemRemaining(db, item.id) === 0) {
      stock.push({
        kind: 'stockOut',
        assignmentId: '',
        componentId: item.id,
        label: item.name + ' — המלאי אזל',
        hint: 'לחדש מלאי או לעדכן את הפריט',
      });
    }
  }
  // תאימות לנתונים טרום-מיגרציה: רכיב בלי itemId עם מלאי משלו
  for (const p of db.shopProducts) {
    if (!p.active) continue;
    for (const comp of p.components) {
      if (comp.itemId) continue;
      const rem = componentRemaining(comp.id, p.id, db.shopAssignments, comp.stock);
      if (rem === 0) {
        stock.push({
          kind: 'stockOut',
          assignmentId: '',
          componentId: comp.id,
          label: comp.label + ' (' + p.name + ') — המלאי אזל',
          hint: 'לחדש מלאי או לעדכן את הרכיב במוצר',
        });
      }
    }
  }
  for (const a of db.shopAssignments) {
    if (a.status !== 'active') continue;
    const product = db.shopProducts.find((p) => p.id === a.productId);
    if (!product) continue;
    const who = beneficiaryLabel(db, a);
    for (const comp of product.components) {
      const ri = itemOf(db, comp);
      if (ri.kind === 'holidayGift') {
        for (const h of holidays) {
          // חגים נבחרים (הכרעה 17): "מה מגיע" רק לחגים שסומנו על הפריט
          if (!holidayAllowed(ri, h.name)) continue;
          if (!assignmentRedeemed(a, comp.id, h)) {
            due.push({
              kind: 'holidayDue',
              assignmentId: a.id,
              componentId: comp.id,
              label: who + ' — ' + ri.name,
              hint: h.name + ' ב-' + h.iso + ' — טרם נמסרה',
            });
          }
        }
      } else if (ri.kind === 'meeting' && !assignmentRedeemed(a, comp.id)) {
        meetings.push({
          kind: 'meetingPending',
          assignmentId: a.id,
          componentId: comp.id,
          label: who + ' — ' + ri.name,
          hint: 'פגישת ליווי טרם התקיימה',
        });
      } else if (ri.kind === 'coupon' && !assignmentRedeemed(a, comp.id)) {
        const expiry = couponExpiry(a, ri);
        if (expiry && expiry < todayIso) {
          expired.push({
            kind: 'couponExpired',
            assignmentId: a.id,
            componentId: comp.id,
            label: who + ' — ' + ri.name,
            hint: 'הקופון פג בתוקף ב-' + expiry + ' וטרם מומש',
          });
        } else {
          coupons.push({
            kind: 'couponPending',
            assignmentId: a.id,
            componentId: comp.id,
            label: who + ' — ' + ri.name,
            hint: expiry ? 'קופון טרם מומש · בתוקף עד ' + expiry : 'קופון טרם מומש',
          });
        }
      }
    }
  }
  return [...due, ...meetings, ...coupons, ...expired, ...stock];
}

/* ---------- פגישות קרובות (חנות 23, הכרעה 22) ---------- */

/**
 * הפגישות הקרובות — אירועי meeting פתוחים (done=false) בטווח הימים
 * (ברירת מחדל 2 = היום ומחר), ממוינים תאריך+שעה (בלי שעה — לסוף היום),
 * עם שם המוטב ושם החדר. משטח התזכורות של העמודה (אין תשתית push —
 * לא ממציאים).
 */
export function upcomingMeetings(
  db: Db,
  todayIso: IsoDate,
  days = 2,
): { ev: ShopEventLike; who: string; roomName: string }[] {
  const end = new Date(todayIso + 'T12:00:00');
  end.setDate(end.getDate() + days - 1);
  const endIso = isoOf(end);
  return db.shopEvents
    .filter((e) => e.kind === 'meeting' && !e.done && e.date >= todayIso && e.date <= endIso)
    .sort((x, y) => (x.date + '·' + (x.time || '99:99')).localeCompare(y.date + '·' + (y.time || '99:99')))
    .map((ev) => {
      const a = db.shopAssignments.find((x) => x.id === ev.assignmentId);
      return {
        ev,
        who: a ? beneficiaryLabel(db, a) : ev.title,
        roomName: ev.roomId ? (db.rooms.find((r) => r.id === ev.roomId)?.name ?? '') : '',
      };
    });
}

type ShopEventLike = Db['shopEvents'][number];

/* ---------- סכומים ---------- */

/** Σ השווי שנמסר בפועל (value של המימושים החיים — מבוטלים מוחרגים). */
export function givenValue(assignments: readonly ShopAssignment[]): number {
  let sum = 0;
  for (const a of assignments) for (const r of liveRedemptions(a)) sum += Number.isFinite(r.value) ? r.value : 0;
  return sum;
}

/** Σ מה ששולם בפועל במחיר הסמלי (מימושים חיים בלבד). */
export function collectedPaid(assignments: readonly ShopAssignment[]): number {
  let sum = 0;
  for (const a of assignments) for (const r of liveRedemptions(a)) sum += Number.isFinite(r.paid) ? r.paid : 0;
  return sum;
}

/** הסבסוד הכולל — שווי שנמסר פחות מה ששולם. */
export function subsidyTotal(assignments: readonly ShopAssignment[]): number {
  return givenValue(assignments) - collectedPaid(assignments);
}

/** השיוכים של מוצר נתון. */
export function productAssignments(assignments: readonly ShopAssignment[], productId: Id): ShopAssignment[] {
  return assignments.filter((a) => a.productId === productId);
}

/* ---------- חיפוש/סינון/מיון (UX סינון 2) — טהור, smartFilter הקיים ---------- */

/** כמה רכיבים בשיוך עדיין ממתינים (לא-מומשים; מבוטל = ממתין). */
function pendingCount(db: Db, a: ShopAssignment): number {
  const product = db.shopProducts.find((p) => p.id === a.productId);
  if (!product) return 0;
  return product.components.filter((c) => !assignmentRedeemed(a, c.id)).length;
}

/** התקדמות המימוש 0..1 (בלי רכיבים = 1 — אין מה לממש). */
function progressOf(db: Db, a: ShopAssignment): number {
  const product = db.shopProducts.find((p) => p.id === a.productId);
  const total = product?.components.length ?? 0;
  if (!total) return 1;
  return (total - pendingCount(db, a)) / total;
}

/**
 * סינון+מיון השיוכים: q על שם המשפחה/החבילה (smartFilter); 'pending'
 * (ברירת המחדל) = יש-רכיב-ממתין קודם, ובתוכם since עולה — הכי-ותיק-ממתין
 * ראשון; ממומש-כולו אחרון.
 */
export function filterAssignments(
  db: Db,
  q: string,
  status: ShopAssignmentStatus | '',
  pendingOnly: boolean,
  productId: Id | '',
  sort: 'pending' | 'name' | 'progress',
): ShopAssignment[] {
  let list = [...db.shopAssignments];
  if (status) list = list.filter((a) => a.status === status);
  if (productId) list = list.filter((a) => a.productId === productId);
  if (pendingOnly) list = list.filter((a) => pendingCount(db, a) > 0);
  list = smartFilter(q, list, (a) => {
    const fam = db.families.find((f) => f.id === a.famId);
    const product = db.shopProducts.find((p) => p.id === a.productId);
    return [fam?.name ?? '', ...(fam?.name.split(/\s+/) ?? []), product?.name ?? ''];
  });
  const famName = (a: ShopAssignment) => db.families.find((f) => f.id === a.famId)?.name ?? '';
  const cmp: Record<typeof sort, (a: ShopAssignment, b: ShopAssignment) => number> = {
    pending: (a, b) => {
      const pa = pendingCount(db, a) > 0 ? 0 : 1;
      const pb = pendingCount(db, b) > 0 ? 0 : 1;
      if (pa !== pb) return pa - pb; // ממתינים קודם; ממומש-כולו אחרון
      return (a.since || '9999').localeCompare(b.since || '9999'); // הכי-ותיק-ממתין ראשון
    },
    name: (a, b) => famName(a).localeCompare(famName(b), 'he'),
    progress: (a, b) => progressOf(db, a) - progressOf(db, b),
  };
  return list.sort(cmp[sort]);
}

/** סינון החבילות בקטלוג — q על שם/תיאור; פעילות בלבד (רשות). */
export function filterProducts(
  products: readonly ShopProduct[],
  q: string,
  onlyActive: boolean,
): ShopProduct[] {
  const base = onlyActive ? products.filter((p) => p.active) : [...products];
  return smartFilter(q, base, (p) => [p.name, p.desc]);
}

/**
 * סינון הפריטים — q על השם; מצב מלאי: out=אזל · low=נמוך (≤2, כשיש מעקב)
 * · untracked=ללא מעקב.
 */
export function filterItems(db: Db, q: string, stockState: '' | 'out' | 'low' | 'untracked'): ShopItem[] {
  let list = [...db.shopItems];
  if (stockState) {
    list = list.filter((i) => {
      const rem = itemRemaining(db, i.id);
      if (stockState === 'untracked') return rem === null;
      if (stockState === 'out') return rem === 0;
      return rem !== null && rem > 0 && rem <= 2; // low
    });
  }
  return smartFilter(q, list, (i) => [i.name, ...i.name.split(/\s+/)]);
}

/** סינון מימושי שיוך — טווח כוללני; includeVoided=true (ברירת שקיפות). */
export function filterRedemptions(
  a: ShopAssignment,
  fromIso: IsoDate | '',
  toIso: IsoDate | '',
  includeVoided: boolean,
): ShopRedemption[] {
  return a.redemptions.filter(
    (r) =>
      (!fromIso || r.date >= fromIso) &&
      (!toIso || r.date <= toIso) &&
      (includeVoided || !r.voidedAt),
  );
}

/* ---------- ייצוא (CONNECT חיבור 6) ---------- */

/**
 * שורות CSV של כל המימושים — תאריך, מוטב, פריט, חבילה, שולם, שווי, אישור,
 * מבוטל. **מבוטל מסומן ולא מוסתר** — שקיפות מלאה בייצוא.
 */
export function redemptionsCsvRows(db: Db): (string | number)[][] {
  const rows: (string | number)[][] = [['תאריך', 'מוטב', 'פריט', 'חבילה', 'שולם', 'שווי', 'אישור', 'מבוטל']];
  for (const a of db.shopAssignments) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    const who = beneficiaryLabel(db, a);
    for (const r of a.redemptions) {
      const comp = product?.components.find((c) => c.id === r.componentId);
      rows.push([
        r.date,
        who,
        comp ? itemOf(db, comp).name : '',
        product?.name ?? '',
        r.paid,
        r.value,
        r.rid ?? '',
        r.voidedAt ? 'בוטל ב-' + r.voidedAt : '',
      ]);
    }
  }
  return rows;
}

/* ---------- תוויות ---------- */

/** "משפחת X — שם הבן/בת" (בלי בן/בת ספציפי/ת — שם המשפחה בלבד). */
export function beneficiaryLabel(db: Db, a: ShopAssignment): string {
  const fam = db.families.find((f) => f.id === a.famId);
  const famLabel = fam ? 'משפחת ' + fam.name : 'משפחה לא ידועה';
  if (!a.memberId || !fam) return famLabel;
  const m = fam.members.find((x) => x.id === a.memberId);
  return m ? famLabel + ' — ' + m.first : famLabel;
}

/** ספירת רכיבי מוצר לפי סוג — לתצוגת כרטיסי הקטלוג. */
export function componentCounts(p: ShopProduct): Record<ShopComponent['kind'], number> {
  const out: Record<ShopComponent['kind'], number> = { meeting: 0, coupon: 0, gift: 0, holidayGift: 0 };
  for (const c of p.components) out[c.kind]++;
  return out;
}
