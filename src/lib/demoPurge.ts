/**
 * 🧹 הסרת נתוני-הדמו בלבד (בקשת-בעלים 14.9 "איפה אני מאפס את הנתונים דמו שנכנסו"):
 * כפתור "📊 טעינת נתוני דמו" מופיע כשהמאגר-המקומי ריק — במכשיר-ענן חדש, לפני שהמשיכה
 * מהענן הסתיימה, לחיצה טענה את הדמו והסנכרון מיזג אותו לתוך הנתונים האמיתיים.
 * "איפוס" מוחק **הכול** (גם בענן) — לא הכלי הנכון. כאן: מסירים **רק** רשומות שמזהיהן
 * מופיעים בקובץ-הדמו (המזהים בקובץ קבועים: f128…, sp639…, c114…, ev614…, t100…).
 * טהור — בלי store/DOM/רשת.
 */
import type { Db } from '../types/domain';

export interface DemoPurgePlan {
  next: Db;
  /** כמה הוסרו פר-אוסף (רק אוספים שנגעו). */
  removed: Record<string, number>;
  total: number;
}

type IdRow = { id?: unknown };

/** אוספי-הישויות בקובץ-הדמו = כל מפתח שערכו מערך של אובייקטים עם id. */
export function demoIdSets(demo: Partial<Db> | Record<string, unknown>): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [k, v] of Object.entries(demo)) {
    if (!Array.isArray(v)) continue;
    const ids = (v as IdRow[]).map((r) => (r && typeof r.id === 'string' ? r.id : '')).filter(Boolean);
    if (ids.length) out[k] = new Set(ids);
  }
  return out;
}

/** תוכנית-הסרה: אותו db בלי הרשומות שמזהיהן בדמו. אוסף שלא קיים ב-db מדולג. */
export function planDemoPurge(db: Db, demo: Partial<Db> | Record<string, unknown>): DemoPurgePlan {
  const sets = demoIdSets(demo);
  const next: Record<string, unknown> = { ...db };
  const removed: Record<string, number> = {};
  let total = 0;
  for (const [col, ids] of Object.entries(sets)) {
    const cur = (db as unknown as Record<string, unknown>)[col];
    if (!Array.isArray(cur)) continue;
    const kept = (cur as IdRow[]).filter((r) => !(r && typeof r.id === 'string' && ids.has(r.id)));
    const n = cur.length - kept.length;
    if (n > 0) {
      next[col] = kept;
      removed[col] = n;
      total += n;
    }
  }
  return { next: next as unknown as Db, removed, total };
}

/** תוויות-עברית לאוספים (לתצוגת "נמצאו N רשומות-דמו: …"). */
export const PURGE_LABELS: Record<string, string> = {
  families: 'משפחות', enrollments: 'שיבוצים', courses: 'חוגים', events: 'אירועי-לוח', rooms: 'חדרים', teachers: 'מורים',
  supporters: 'תורמים', tzCoordinators: 'רכזי-קופות', tzBoxes: 'קופות', tzCampaigns: 'מבצעי-קופות', tzEvents: 'אירועי-קופות',
  shopItems: 'פריטי-חנות', shopStores: 'חנויות', shopCriteria: 'קריטריונים', shopProducts: 'מוצרים', shopAssignments: 'שיוכי-חנות',
  shopEvents: 'אירועי-חנות', shopIntakes: 'קליטות', volunteers: 'מתנדבים', distributionDays: 'ימי-חלוקה', deliveries: 'מסירות',
  tasks: 'משימות', warehouse: 'מחסן',
};

export function purgeSummary(removed: Record<string, number>): string {
  return Object.entries(removed).map(([k, n]) => (PURGE_LABELS[k] ?? k) + ' ' + n).join(' · ');
}
