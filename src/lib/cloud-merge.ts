/**
 * מיזוג צד-הקבלה של סנכרון הענן — טהור לחלוטין (ללא firebase/DOM), כדי שניתן
 * לבדוק ביחידה את הלוגיקה הרגישה ביותר: החלת שינוי מרוחק על ה-DB המקומי בלי
 * לדלוף, בלי לשכפל ובלי לקרוס על מסמך מרוחק פגום.
 */
import type { Db } from '../types/domain';
import { ENTITY_COLLECTIONS, type EntityCol } from './cloud-diff';

/**
 * חיזוק מסמך ישות מרוחק: מסמך שנכתב בגרסה ישנה / נערך ידנית ב-Firestore עלול
 * להגיע בלי שדות-רשימה (או עם ערך לא-מערך). נתיב pullAll עובר migrate ומתוקן
 * (persist.ts מגן על families.members/docs, enrollments.payments/absences,
 * supporters.donations), אבל המיזוג החי מיזג גולמי — וצרכנים שמריצים
 * `for (const m of f.members)` / `fam.docs` (famHistoryOf), `en.payments`/
 * `en.absences` (ManageModal/reports), `sp.donations` (customExport) היו קורסים.
 * מבטיחים מערך לכל שדה-רשימה לפני המיזוג, בהתאמה למיגרציה.
 */
const LIST_FIELDS: Record<string, readonly string[]> = {
  families: ['members', 'docs'],
  enrollments: ['payments', 'absences'],
  supporters: ['donations'],
  // קופות צדקה — ריקונים ולוג ניקוד (BUILD-ORDER-TZEDAKA)
  tzBoxes: ['collections'],
  tzCoordinators: ['scoreLog'],
  // חנות — רכיבי מוצר, מימושים וקריטריונים (BUILD-ORDER-SHOP)
  shopProducts: ['components'],
  shopAssignments: ['redemptions', 'criterionIds'],
};

export function sanitizeIncoming(col: string, item: Record<string, unknown>): Record<string, unknown> {
  const fields = LIST_FIELDS[col];
  if (!fields) return item;
  let out = item;
  for (const f of fields) {
    if (!Array.isArray(out[f])) out = { ...out, [f]: [] };
  }
  return out;
}

/** מיזוג שינויי אוסף מרוחקים לרשימה מקומית — upsert לפי id, מחוקים יוצאים. */
export function applyEntityPartial(
  db: Db,
  col: string,
  docs: Array<{ id: string; data: unknown; deleted: boolean }>,
): Db {
  if (!(ENTITY_COLLECTIONS as readonly string[]).includes(col)) return db;
  const key = col as EntityCol;
  const list = db[key] as Array<{ id: string }>;
  const deleted = new Set(docs.filter((d) => d.deleted).map((d) => d.id));
  const incoming = new Map(
    docs
      .filter((d) => !d.deleted)
      .map((d) => [d.id, sanitizeIncoming(col, { ...(d.data as Record<string, unknown>), id: d.id })]),
  );
  // עדכונים במקומם (שומר סדר), חדשים לראש הרשימה — כמו upsertIn של ה-store
  const kept = list
    .filter((x) => !deleted.has(x.id))
    .map((x) => {
      const inc = incoming.get(x.id);
      if (inc) {
        incoming.delete(x.id);
        return inc as unknown as { id: string };
      }
      return x;
    });
  const next = [...(incoming.values() as Iterable<{ id: string }>), ...kept];
  if (JSON.stringify(next) === JSON.stringify(list)) return db;
  return { ...db, [key]: next } as Db;
}

/** מיזוג מסמך meta/org מרוחק — שדות שאינם ישויות; seq תמיד המקסימום. */
export function applyMetaPartial(db: Db, meta: Record<string, unknown>): Db {
  const next: Db = { ...db };
  let changed = false;
  const assign = <K extends keyof Db>(k: K, v: unknown) => {
    if (v === undefined) return;
    if (JSON.stringify(db[k]) !== JSON.stringify(v)) {
      next[k] = v as Db[K];
      changed = true;
    }
  };
  assign('orgName', meta.orgName);
  assign('orgSite', meta.orgSite);
  assign('orgDonate', meta.orgDonate);
  assign('orgGoal', meta.orgGoal);
  assign('notif', meta.notif);
  assign('reports', meta.reports);
  assign('ui', meta.ui);
  assign('attnDone', meta.attnDone);
  // מונים: לעולם לא מקטינים — מונע התנגשות מזהים/מספרי-קבלה בין מכשירים
  const bumpCounter = (k: 'seq' | 'receiptSeq' | 'donationSeq' | 'shopReceiptSeq') => {
    const v = meta[k];
    if (typeof v === 'number' && Number.isFinite(v) && v > db[k]) {
      next[k] = v;
      changed = true;
    }
  };
  bumpCounter('seq');
  bumpCounter('receiptSeq');
  bumpCounter('donationSeq');
  bumpCounter('shopReceiptSeq');
  return changed ? next : db;
}
