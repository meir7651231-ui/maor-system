/**
 * מנוע SHOP7 — מתנדבים · יום-חלוקה · מסירות. טהור לחלוטין (בלי store/DOM),
 * נכס-כפול לבנייה-חכמה. מעקב **קדימה** (pickup→enroute→delivered); הקלט =
 * shopAssignments הפעילים (המסירה מצביעה, לא משכפלת); אפס כסף/S-.
 */
import type { Db, Delivery, DeliveryStatus, ShopAssignment, Volunteer } from '../../types/domain';
import { smartFilter } from '../../lib/search';

/** סדר המכונה הלינארית — קדימה בלבד. */
const ORDER: DeliveryStatus[] = ['pickup', 'enroute', 'delivered'];

/** הסטטוס הבא — קדימה; delivered הוא סופי (מחזיר את עצמו). */
export function advanceStatus(status: DeliveryStatus): DeliveryStatus {
  const i = ORDER.indexOf(status);
  return i < 0 || i >= ORDER.length - 1 ? 'delivered' : ORDER[i + 1];
}

/** תווית הסטטוס לתצוגה. */
export function statusLabel(status: DeliveryStatus): string {
  return status === 'pickup' ? 'איסוף' : status === 'enroute' ? 'בדרך' : 'נמסר';
}

export function deliveriesOfDay(db: Db, dayId: string): Delivery[] {
  return db.deliveries.filter((d) => d.dayId === dayId);
}

export function deliveriesOfVolunteer(db: Db, volId: string, dayId?: string): Delivery[] {
  return db.deliveries.filter((d) => d.volunteerId === volId && (!dayId || d.dayId === dayId));
}

/**
 * שיוכי-חנות פעילים שטרם הפכו למסירה **ביום הזה** — הקלט לבורר-השיוך.
 * מבוסס על db.shopAssignments (SHOP6); לא משכפל, רק מצביע.
 */
export function eligibleAssignmentsForDay(db: Db, dayId: string): ShopAssignment[] {
  const taken = new Set(db.deliveries.filter((d) => d.dayId === dayId).map((d) => d.assignmentId));
  return db.shopAssignments.filter((a) => a.status === 'active' && !taken.has(a.id));
}

/** מד-התקדמות ליום — ספירת מסירות לפי סטטוס. */
export function dayProgress(db: Db, dayId: string): { total: number; pickup: number; enroute: number; delivered: number } {
  const list = deliveriesOfDay(db, dayId);
  return {
    total: list.length,
    pickup: list.filter((d) => d.status === 'pickup').length,
    enroute: list.filter((d) => d.status === 'enroute').length,
    delivered: list.filter((d) => d.status === 'delivered').length,
  };
}

/**
 * רמז-קיבולת (לא-חוסם): כמה מסירות כבר על המתנדב ביום, והאם חרג מ-maxDeliveries.
 * null = אין מגבלה מוגדרת.
 */
export function volunteerLoadHint(db: Db, vol: Volunteer, dayId: string): { count: number; over: boolean } | null {
  const count = deliveriesOfVolunteer(db, vol.id, dayId).length;
  if (vol.maxDeliveries == null) return { count, over: false };
  return { count, over: count >= vol.maxDeliveries };
}

/** סינון מתנדבים (שם/טלפון/אזור) דרך smartFilter. */
export function filterVolunteers(vols: Volunteer[], q: string): Volunteer[] {
  if (!q.trim()) return vols;
  return smartFilter(q, vols, (v) => [v.name, v.phone, v.area ?? '']);
}

/** סינון מסירות (שם-משפחה/סטטוס) — familyName נגזר ב-caller ומוזרק. */
export function filterDeliveries(
  rows: Array<Delivery & { familyName: string; volunteerName: string }>,
  q: string,
): Array<Delivery & { familyName: string; volunteerName: string }> {
  if (!q.trim()) return rows;
  return smartFilter(q, rows, (r) => [r.familyName, r.volunteerName, statusLabel(r.status)]);
}
