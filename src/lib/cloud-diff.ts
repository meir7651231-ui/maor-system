/**
 * מנוע ההשוואה של סנכרון הענן — טהור לחלוטין (ללא firebase, ללא DOM),
 * כדי שאפשר לבדוק אותו ביחידה בלי לגעת ברשת.
 *
 * המודל ב-Firestore: אוסף לכל סוג ישות (doc id = entity id, גוף = הישות),
 * ומסמך 'meta/org' אחד לכל שדות ה-DB שאינם רשימות ישויות.
 */
import type { Db } from '../types/domain';

/** שבעת אוספי הישויות — שם האוסף ב-Firestore = שם השדה ב-Db. */
export const ENTITY_COLLECTIONS = [
  'families',
  'courses',
  'enrollments',
  'events',
  'rooms',
  'teachers',
  'supporters',
] as const;

export type EntityCol = (typeof ENTITY_COLLECTIONS)[number];

/** שדות ה-meta שנבדקים לשינוי (savedAt מוחרג — משתנה בכל שמירה, רעש). */
const META_KEYS = [
  'orgName',
  'orgSite',
  'orgDonate',
  'orgGoal',
  'notif',
  'reports',
  'ui',
  'seq',
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
    notif: db.notif,
    reports: db.reports,
    ui: db.ui,
    seq: db.seq,
    receiptSeq: db.receiptSeq,
    donationSeq: db.donationSeq,
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
