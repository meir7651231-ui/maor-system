/**
 * מנוע SHOP7 — מתנדבים · יום-חלוקה · מסירות. טהור לחלוטין (בלי store/DOM),
 * נכס-כפול לבנייה-חכמה. מעקב **קדימה** (pickup→enroute→delivered); הקלט =
 * shopAssignments הפעילים (המסירה מצביעה, לא משכפלת); אפס כסף/S-.
 */
import type { Db, Delivery, DeliveryStatus, ShopAssignment, Volunteer } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
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

/** מסירות של משפחה (לפאנל כרטיס-המשפחה — תצוגה בלבד). */
export function deliveriesOfFamily(db: Db, famId: string): Delivery[] {
  return db.deliveries.filter((d) => d.familyId === famId);
}

/**
 * מסירות פתוחות עד-היום שטרם נמסרו — למונה-הבית.
 * תיקון (19.8): גם ימי-חלוקה **שחלפו** ולא נסגרו נספרים (מסירה שלא בוצעה אתמול
 * לא נעלמת מהמונה בחצות); יום שסומן closed = ארכיון ואינו צף מחדש.
 */
export function pendingDeliveriesToday(db: Db, todayIso: string): Delivery[] {
  const openDays = new Set(
    db.distributionDays.filter((d) => d.date <= todayIso && !d.closed).map((d) => d.id),
  );
  return db.deliveries.filter((d) => openDays.has(d.dayId) && d.status !== 'delivered');
}

/**
 * שורות תדפיס ליום-חלוקה — מקובצות פר-מתנדב: כותרת-מתנדב ואז
 * "משפחה · סטטוס · 📍 כתובת · הערה" לכל מסירה. familyName/volunteerName/address
 * מוזרקים ב-caller; בלי address השורה זהה-ביט לפורמט הקודם (גל ב׳ — דף-מסלול
 * אמיתי למתנדב על נייר).
 */
export function deliveryListLines(
  rows: Array<Delivery & { familyName: string; volunteerName: string; address?: string }>,
): string[] {
  const byVol = new Map<string, Array<Delivery & { familyName: string; volunteerName: string; address?: string }>>();
  for (const r of rows) {
    const arr = byVol.get(r.volunteerName) ?? [];
    arr.push(r);
    byVol.set(r.volunteerName, arr);
  }
  const out: string[] = [];
  for (const [volName, list] of byVol) {
    out.push(`🦺 ${volName} (${list.length} מסירות)`);
    for (const r of list) {
      out.push(
        `  • ${r.familyName} · ${statusLabel(r.status)}` +
          (r.address ? ' · 📍 ' + r.address : '') +
          (r.note ? ' · ' + r.note : ''),
      );
    }
  }
  return out;
}

/**
 * שורות CSV של כל המסירות — תאריך-יום · משפחה · מתנדב · סטטוס · הערה.
 * שקיפות מלאה (כמו בשאר המודולים): מסירות שטרם נמסרו מסומנות בסטטוסן, לא מוסתרות.
 * תצוגה בלבד — אפס כסף/S- (שמירה על בידוד המודול).
 */
export function deliveriesCsvRows(db: Db, config?: OrgConfig): (string | number)[][] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const dayDate = (id: string) => db.distributionDays.find((d) => d.id === id)?.date ?? '';
  const famName = (id: string) => db.families.find((f) => f.id === id)?.name ?? '';
  const famAddr = (id: string) => {
    const f = db.families.find((x) => x.id === id);
    return f ? [f.address, f.city].map((s) => (s || '').trim()).filter(Boolean).join(', ') : '';
  };
  const volName = (id: string) => db.volunteers.find((v) => v.id === id)?.name ?? '';
  // גל ב׳: עמודת כתובת (שדרוג-פורמט מתועד — ה-ratchet עודכן במודע)
  const rows: (string | number)[][] = [['תאריך', T('entity.family', 'משפחה'), 'כתובת', 'מתנדב', 'סטטוס', 'הערה']];
  for (const d of db.deliveries) {
    rows.push([dayDate(d.dayId), famName(d.familyId), famAddr(d.familyId), volName(d.volunteerId), statusLabel(d.status), d.note ?? '']);
  }
  return rows;
}

/**
 * עצירות-המסלול של מתנדב ביום-חלוקה (INTEGRATIONS גל א׳ · הרחבת maps):
 * כתובות המשפחות של המסירות שלו באותו יום, בסדר-הלוח, '[address, city]'
 * מסונן-ריקים; משפחה בלי כתובת מדולגת (אין מה לנווט אליו). תצוגה בלבד.
 */
export function volunteerRouteStops(db: Db, dayId: string, volunteerId: string): string[] {
  const out: string[] = [];
  for (const d of db.deliveries) {
    if (d.dayId !== dayId || d.volunteerId !== volunteerId) continue;
    const fam = db.families.find((f) => f.id === d.familyId);
    if (!fam) continue;
    const stop = [fam.address, fam.city].map((s) => (s || '').trim()).filter(Boolean).join(', ');
    if (stop) out.push(stop);
  }
  return out;
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
