/**
 * ניקוי-דמו-שהתערבב (ממצא-בעלים 23.8): נתוני-ההדגמה (public/demo.json) נכנסו
 * לנתונים האמיתיים (ייבוא/קישור-דמו) ויש להסירם **בלי לגעת ברשומות האמיתיות**.
 *
 * זיהוי לפי **תוכן** ולא לפי id: הזורע (`freshenDemoDb`) משנה **רק תאריכים** —
 * שמות/טלפונים/מיילים של רשומות-הדמו נשארים ביט-זהים ל-demo.json. לכן טביעת-אצבע
 * על שדות-זיהוי יציבים תופסת בדיוק את רשומות-הדמו, ולעולם לא מתנגשת ברשומה אמיתית
 * (גם אם הלקוח משתמש ב-id רציף כמו sp639 — התוכן שונה). id **לא** משמש להתאמה,
 * כדי לעמוד גם במקרה שהייבוא מספר-מחדש מזהים.
 *
 * מפל (cascade): רשומות-תלויות (שיבוצים/מסירות/שיוכי-חנות/קופות-צדקה) שמצביעות על
 * ישות-דמו שהוסרה — מוסרות לפי ה-id **בפועל** של רשומת-האב שהוסרה (יהיה אשר יהיה).
 *
 * טהור, בלי DOM/store — נבדק ביחידה. הרכיב מזין את demo.json הנטען (fetch).
 */
import type { Db } from '../types/domain';

/** שדות-זיהוי יציבים פר-ישות (בלי id/תאריכים/מערכים-מקוננים/מונים). */
const FP_FIELDS: Record<string, string[]> = {
  families: ['name', 'father', 'mother', 'phone', 'phone2', 'city', 'address', 'email'],
  supporters: ['name', 'phone', 'email', 'idNum', 'cat', 'forWho'],
  courses: ['name', 'description', 'price', 'price1', 'price2'],
  teachers: ['name', 'phone', 'email', 'idNum', 'specialty'],
  rooms: ['name', 'location', 'cap'],
  events: ['title', 'type', 'customType', 'notes', 'price', 'time'],
  volunteers: ['name', 'phone', 'area'],
  distributionDays: ['title', 'note'],
  tzCoordinators: ['name', 'phone'],
  tzCampaigns: ['name', 'title', 'goal'],
  tzEvents: ['title', 'name', 'notes'],
  shopItems: ['name', 'kind', 'value', 'basePrice'],
  shopStores: ['name', 'phone', 'address'],
  shopCriteria: ['name', 'label', 'desc'],
  shopProducts: ['name', 'title', 'kind'],
  shopEvents: ['title', 'name', 'notes'],
  shopIntakes: ['name', 'note'],
  tasks: ['title', 'note', 'desc'],
  warehouse: ['name', 'sku', 'note'],
};

/** ישויות-בסיס שמזוהות לפי טביעת-אצבע (סדר-שמות לתצוגה: name/title). */
const ROOT_ENTITIES = Object.keys(FP_FIELDS);

type Rec = Record<string, unknown>;
const SEP = '';

function fingerprint(rec: Rec, fields: string[]): string {
  return fields.map((f) => String(rec?.[f] ?? '')).join(SEP);
}

function nameOf(rec: Rec): string {
  return String(rec?.name ?? rec?.title ?? rec?.id ?? '').trim() || '(ללא שם)';
}

export interface DemoCleanupPlan {
  cleaned: Db;
  total: number;
  /** פר-ישות: כמה יוסרו + עד 8 שמות לתצוגה-מקדימה. */
  removed: Record<string, { count: number; names: string[] }>;
}

/**
 * מתכננת ניקוי: מקבלת את ה-DB הנוכחי ואת demo.json הנטען, ומחזירה עותק-מנוקה +
 * סיכום פר-ישות. אינה משנה את db הנכנס (immutable).
 */
export function planDemoCleanup(db: Db, demoDb: Partial<Db>): DemoCleanupPlan {
  const cleaned: Db = { ...db };
  const removed: DemoCleanupPlan['removed'] = {};

  // ids של ישויות-אב שהוסרו — לצורך מפל
  const removedIds: Record<string, Set<string>> = {};
  const removedMemberIds = new Set<string>();

  for (const ent of ROOT_ENTITIES) {
    const cur = (db as unknown as Record<string, unknown>)[ent];
    const demo = (demoDb as unknown as Record<string, unknown>)[ent];
    if (!Array.isArray(cur) || !Array.isArray(demo) || demo.length === 0) continue;
    const fields = FP_FIELDS[ent];
    const demoFps = new Set(demo.map((r) => fingerprint(r as Rec, fields)));
    const keep: Rec[] = [];
    const drop: Rec[] = [];
    const ids = new Set<string>();
    for (const r of cur as Rec[]) {
      if (demoFps.has(fingerprint(r, fields))) {
        drop.push(r);
        const id = String(r.id ?? '');
        if (id) ids.add(id);
        // חברי-משפחה שהוסרה — לצורך מפל-שיבוצים (memberId)
        if (ent === 'families' && Array.isArray(r.members)) {
          for (const m of r.members as Rec[]) {
            const mid = String(m?.id ?? '');
            if (mid) removedMemberIds.add(mid);
          }
        }
      } else {
        keep.push(r);
      }
    }
    if (drop.length) {
      (cleaned as unknown as Record<string, unknown>)[ent] = keep;
      removedIds[ent] = ids;
      removed[ent] = { count: drop.length, names: drop.slice(0, 8).map(nameOf) };
    }
  }

  // ── מפל: רשומות-תלויות שמצביעות על ישות-דמו שהוסרה ──
  const has = (ent: string, id: unknown) => !!removedIds[ent]?.has(String(id ?? ''));

  const cascade = (
    ent: string,
    pred: (r: Rec) => boolean,
  ): void => {
    const cur = (db as unknown as Record<string, unknown>)[ent];
    if (!Array.isArray(cur)) return;
    const keep: Rec[] = [];
    const drop: Rec[] = [];
    for (const r of cur as Rec[]) (pred(r) ? drop : keep).push(r);
    if (drop.length) {
      (cleaned as unknown as Record<string, unknown>)[ent] = keep;
      const prev = removed[ent]?.count ?? 0;
      removed[ent] = { count: prev + drop.length, names: (removed[ent]?.names ?? []).concat(drop.slice(0, 8).map(nameOf)).slice(0, 8) };
    }
  };

  // שיבוצים: חבר-דמו או חוג-דמו
  cascade('enrollments', (r) => removedMemberIds.has(String(r.memberId ?? '')) || has('courses', r.courseId));
  // מסירות: יום/מתנדב/שיוך/משפחה של דמו
  cascade('deliveries', (r) => has('distributionDays', r.dayId) || has('volunteers', r.volunteerId) || has('shopAssignments', r.assignmentId) || has('families', r.familyId));
  // שיוכי-חנות: מוצר-דמו או משפחת-דמו
  cascade('shopAssignments', (r) => has('shopProducts', r.productId) || has('families', r.famId));
  // קופות-צדקה: רכז-דמו או משפחת-דמו
  cascade('tzBoxes', (r) => has('tzCoordinators', r.coordinatorId) || has('families', r.famId));

  let total = 0;
  for (const k of Object.keys(removed)) total += removed[k].count;
  return { cleaned, total, removed };
}
