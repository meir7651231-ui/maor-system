/**
 * מיזוג צד-הקבלה של סנכרון הענן — טהור לחלוטין (ללא firebase/DOM), כדי שניתן
 * לבדוק ביחידה את הלוגיקה הרגישה ביותר: החלת שינוי מרוחק על ה-DB המקומי בלי
 * לדלוף, בלי לשכפל ובלי לקרוס על מסמך מרוחק פגום.
 */
import { mergeDelLogs, type DelEntry, type Db } from '../types/domain';
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
  // רשימת ההמתנה על הפריט (SHOP6 חנות 27)
  shopItems: ['waits'],
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

/**
 * מיזוג-תרומות חסין-אובדן (בקשת-בעלים 19.8 פריט ח' — "תרומות לא מסונכרנות"):
 * המיזוג הרגיל מחליף מסמך-תומך שלם ("הענן מנצח"). התרומות יושבות בתוך המסמך —
 * ולכן תרומה שנרשמה במכשיר אחד נדרסה כשמכשיר אחר מסתנכרן עם גרסה ישנה של אותו
 * תומך. הפתרון: **איחוד תרומות לפי rid** (מזהה-הקבלה הרציף) — הענן מנצח על rid
 * שקיים בשני הצדדים (עריכה), אך תרומה שקיימת רק-מקומית לעולם לא אובדת. המונים
 * הסקלריים לא-יורדים (max) — עקבי עם "מונים רק עולים". שאר השדות = הענן מנצח.
 * חל רק על supporters; לכל אוסף אחר מחזיר את המסמך המרוחק כמות-שהוא.
 */
export function mergeDonationsPreserving(
  col: string,
  local: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  if (col !== 'supporters') return incoming;
  const localDon = Array.isArray(local.donations) ? (local.donations as Array<{ rid?: string }>) : [];
  const incDon = Array.isArray(incoming.donations) ? (incoming.donations as Array<{ rid?: string }>) : [];
  const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
  const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const count = Math.max(num(incoming.count), num(local.count));
  const ils = Math.max(num(incoming.ils), num(local.ils));
  const usd = Math.max(num(incoming.usd), num(local.usd));
  // אם אין תרומה מקומית-בלבד והמונים לא גדלו — אין מה לשמר, הענן כמות-שהוא.
  if (localOnly.length === 0 && count === num(incoming.count) && ils === num(incoming.ils) && usd === num(incoming.usd)) {
    return incoming;
  }
  return { ...incoming, donations: [...incDon, ...localOnly], count, ils, usd };
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
        // איחוד-תרומות חסין-אובדן (פריט ח') — לתומכים בלבד; שאר האוספים כרגיל.
        const merged = mergeDonationsPreserving(col, x as unknown as Record<string, unknown>, inc);
        return merged as unknown as { id: string };
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
  assign('budget', meta.budget); // ORGADMIN/SHOP9 — סנכרון סקלר ארגוני (ציד-באגים 3.8)
  assign('usdRate', meta.usdRate);
  assign('audit', meta.audit); // לוג-פעולות (#10) — הענן-מנצח כמו שאר ה-meta
  // 🪦 מצבות (ביקורת-האמון 24.8): איחוד — לא הענן-מנצח, אחרת מצבה מקומית
  // טרייה (מחיקה שטרם נדחפה) נמחקת מהטבעת והרשומה קמה לתחייה בסיבוב הבא.
  if (Array.isArray(meta.delLog)) {
    const mergedDel = mergeDelLogs(db.delLog, meta.delLog as DelEntry[]);
    if (JSON.stringify(mergedDel) !== JSON.stringify(db.delLog ?? [])) {
      next.delLog = mergedDel;
      changed = true;
    }
  }
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
