/**
 * מנוע החנות — טהור בלבד (בלי store/DOM); BUILD-ORDER-SHOP-2026-07-30.
 *
 * בידוד (הכרעת בעלים 30.7): כל החישובים על shopProducts/shopStores/
 * shopCriteria/shopAssignments/shopEvents בלבד — אין תלות ב-db.events/
 * supporters/enrollments. Reuse טהור: holidayOf/hebParts מ-lib/hebrew,
 * isoOf מ-calLib (lib→lib מותר).
 */
import type { Db, Id, IsoDate, ShopAssignment, ShopComponent, ShopCriterion, ShopProduct, ShopRedemption } from '../../types/domain';
import { isoOf } from '../calendar/calLib';
import { hebParts, holidayOf } from '../../lib/hebrew';

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
export function couponExpiry(a: ShopAssignment, comp: ShopComponent): IsoDate | '' {
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
  for (const p of db.shopProducts) {
    if (!p.active) continue;
    for (const comp of p.components) {
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
      if (comp.kind === 'holidayGift') {
        for (const h of holidays) {
          if (!assignmentRedeemed(a, comp.id, h)) {
            due.push({
              kind: 'holidayDue',
              assignmentId: a.id,
              componentId: comp.id,
              label: who + ' — ' + comp.label,
              hint: h.name + ' ב-' + h.iso + ' — טרם נמסרה',
            });
          }
        }
      } else if (comp.kind === 'meeting' && !assignmentRedeemed(a, comp.id)) {
        meetings.push({
          kind: 'meetingPending',
          assignmentId: a.id,
          componentId: comp.id,
          label: who + ' — ' + comp.label,
          hint: 'פגישת ליווי טרם התקיימה',
        });
      } else if (comp.kind === 'coupon' && !assignmentRedeemed(a, comp.id)) {
        const expiry = couponExpiry(a, comp);
        if (expiry && expiry < todayIso) {
          expired.push({
            kind: 'couponExpired',
            assignmentId: a.id,
            componentId: comp.id,
            label: who + ' — ' + comp.label,
            hint: 'הקופון פג בתוקף ב-' + expiry + ' וטרם מומש',
          });
        } else {
          coupons.push({
            kind: 'couponPending',
            assignmentId: a.id,
            componentId: comp.id,
            label: who + ' — ' + comp.label,
            hint: expiry ? 'קופון טרם מומש · בתוקף עד ' + expiry : 'קופון טרם מומש',
          });
        }
      }
    }
  }
  return [...due, ...meetings, ...coupons, ...expired, ...stock];
}

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
