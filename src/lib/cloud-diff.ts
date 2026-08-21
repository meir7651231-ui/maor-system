/**
 * מנוע ההשוואה של סנכרון הענן — טהור לחלוטין (ללא firebase, ללא DOM),
 * כדי שאפשר לבדוק אותו ביחידה בלי לגעת ברשת.
 *
 * המודל ב-Firestore: אוסף לכל סוג ישות (doc id = entity id, גוף = הישות),
 * ומסמך 'meta/org' אחד לכל שדות ה-DB שאינם רשימות ישויות.
 */
import type { Db } from '../types/domain';

/** שבעה-עשר אוספי הישויות — שם האוסף ב-Firestore = שם השדה ב-Db. */
export const ENTITY_COLLECTIONS = [
  'families',
  'courses',
  'enrollments',
  'events',
  'rooms',
  'teachers',
  'supporters',
  'tzCoordinators',
  'tzBoxes',
  'tzCampaigns',
  'tzEvents',
  'shopItems',
  'shopProducts',
  'shopStores',
  'shopCriteria',
  'shopAssignments',
  'shopEvents',
  'shopIntakes',
  'volunteers',
  'distributionDays',
  'deliveries',
  'tasks',
  'warehouse',
] as const;

export type EntityCol = (typeof ENTITY_COLLECTIONS)[number];

/* ---------- נתיבים פר-ארגון (CLOUD2 ענן 1) ---------- */

/**
 * נתיב אוסף בענן: ‏cloudRoot=true ⇒ האוסף בשורש הפרויקט — **ביט-זהה להיום**
 * (הגנה על הלקוח החי maor-hachesed); אחרת ⇒ `orgs/{slug}/{col}` (ארגון-פלטפורמה).
 */
export function colPath(slug: string, cloudRoot: boolean, col: string): string {
  return cloudRoot ? col : 'orgs/' + slug + '/' + col;
}

/** נתיב מסמך ה-meta: ‏cloudRoot ⇒ ‏meta/org (כמו היום); אחרת ⇒ orgs/{slug}/meta/org. */
export function metaPath(slug: string, cloudRoot: boolean): string {
  return cloudRoot ? 'meta/org' : 'orgs/' + slug + '/meta/org';
}

/**
 * נתיב מסמך ה-envelope (ה-DEK העטוף של הצפנת-הענן): ‏cloudRoot ⇒ ‏_enc/envelope
 * (שורש הלקוח החי); אחרת ⇒ orgs/{slug}/_enc/envelope. שני מקטעים (אוסף/מסמך) = תקין
 * ל-Firestore. ה-envelope נשמר plaintext-ciphertext — חסר-ערך בלי הסיסמה.
 */
export function envPath(slug: string, cloudRoot: boolean): string {
  return cloudRoot ? '_enc/envelope' : 'orgs/' + slug + '/_enc/envelope';
}

/** מסלול-B: שם-אוסף התרומות-הנפרד (doc-per-donation, מפתח=rid). לא ב-ENTITY_COLLECTIONS. */
export const DONATIONS_COL = 'donations';

/** נתיב אוסף-התרומות הנפרד (מסלול-B) — אותה חוקיות-נתיב כשאר האוספים. */
export function donationsPath(slug: string, cloudRoot: boolean): string {
  return colPath(slug, cloudRoot, DONATIONS_COL);
}

/**
 * מסלול-B (טהור) — מסיר את `donations` ממסמכי-התומך שב-diff (הם עוברים לאוסף-הנפרד).
 * לא מוט ציה: מחזיר diff חדש. שאר האוספים/meta/deletes ללא-שינוי. במצב-כבוי לא נקרא כלל.
 */
export function stripSupporterDonations(diff: DbDiff): DbDiff {
  return {
    ...diff,
    sets: diff.sets.map((s) =>
      s.col === 'supporters' && s.data && typeof s.data === 'object'
        ? { ...s, data: { ...(s.data as Record<string, unknown>), donations: [] } }
        : s,
    ),
  };
}

/** שדות ה-meta שנבדקים לשינוי (savedAt מוחרג — משתנה בכל שמירה, רעש). */
const META_KEYS = [
  'orgName',
  'orgSite',
  'orgDonate',
  'orgGoal',
  // ציד-באגים 3.8.2026 (🟡): budget (SHOP9) ו-usdRate הם סקלרים ארגוניים עריכים
  // (ליד orgGoal) שנשמטו מסנכרון-הענן ⇒ התחשבנות/מבט-הנהלה ותיוג-תורמים סטו בין מכשירים.
  'budget',
  'usdRate',
  'audit', // לוג-פעולות (#10) — רוכב על meta; חצוב-תקרה בצד-הלקוח (AUDIT_CAP)
  'notif',
  'reports',
  'ui',
  'seq',
  'receiptSeq',
  'donationSeq',
  'shopReceiptSeq',
  'attnDone',
] as const;

export interface DbDiff {
  /** כתיבות (יצירה/עדכון) — doc אחד לישות. */
  sets: Array<{ col: string; id: string; data: unknown }>;
  /** מחיקות לפי מזהה. */
  deletes: Array<{ col: string; id: string }>;
  /** מסמך meta/org המלא כשמשהו בו השתנה, אחרת null. */
  meta: Record<string, unknown> | null;
}

/** גוף מסמך meta/org — כל שדות ה-Db שאינם אוספי ישויות (ללא v — נגזר במיגרציה). */
export function metaOf(db: Db): Record<string, unknown> {
  return {
    orgName: db.orgName,
    orgSite: db.orgSite,
    orgDonate: db.orgDonate,
    orgGoal: db.orgGoal,
    budget: db.budget,
    usdRate: db.usdRate,
    audit: db.audit, // לוג-פעולות (#10) — רוכב על meta כמו attnDone
    notif: db.notif,
    reports: db.reports,
    ui: db.ui,
    seq: db.seq,
    receiptSeq: db.receiptSeq,
    donationSeq: db.donationSeq,
    shopReceiptSeq: db.shopReceiptSeq,
    attnDone: db.attnDone,
    savedAt: db.savedAt,
  };
}

function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * השוואת שני מצבי DB → סט הפעולות המינימלי מול Firestore.
 * השוואה פר-ישות לפי id בשוויון JSON; רשימה זהה (===) מדולגת בזול.
 */
export function diffDb(prev: Db, next: Db): DbDiff {
  const sets: DbDiff['sets'] = [];
  const deletes: DbDiff['deletes'] = [];
  for (const col of ENTITY_COLLECTIONS) {
    const prevList = prev[col] as Array<{ id: string }>;
    const nextList = next[col] as Array<{ id: string }>;
    if (prevList === nextList) continue;
    const prevById = new Map(prevList.map((x) => [x.id, x]));
    for (const item of nextList) {
      const old = prevById.get(item.id);
      prevById.delete(item.id);
      if (!old || !sameJson(old, item)) sets.push({ col, id: item.id, data: item });
    }
    for (const id of prevById.keys()) deletes.push({ col, id });
  }
  let meta: DbDiff['meta'] = null;
  for (const k of META_KEYS) {
    if (!sameJson(prev[k], next[k])) {
      meta = metaOf(next);
      break;
    }
  }
  return { sets, deletes, meta };
}

/** ה-DB המלא כ-diff — להעלאה ראשונה של נתונים מקומיים לפרויקט ענן ריק. */
export function fullDbDiff(db: Db): DbDiff {
  const sets: DbDiff['sets'] = [];
  for (const col of ENTITY_COLLECTIONS) {
    for (const item of db[col] as Array<{ id: string }>) {
      sets.push({ col, id: item.id, data: item });
    }
  }
  return { sets, deletes: [], meta: metaOf(db) };
}

/** האם ה-diff ריק — אין מה לדחוף. */
export function emptyDiff(d: DbDiff): boolean {
  return d.sets.length === 0 && d.deletes.length === 0 && d.meta === null;
}
