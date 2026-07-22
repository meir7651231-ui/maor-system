/**
 * הדבק בין ה-store לענן — מתוזמר כולו מ-useApp (בטעינה דינמית, רק כשלארגון
 * יש config.firebase):
 *
 * 1. בהתחברות: pullAll(). ענן ריק + נתונים מקומיים → העלאה מלאה (הגירה
 *    ראשונה). ענן עם נתונים → החלפת ה-DB המקומי (שכבות ההתמדה המקומיות
 *    ממשיכות לכתוב כרגיל — הענן הוא שכבה נוספת, לא תחליף).
 * 2. subscribeAll → מיזוג שינויים מרוחקים לתוך ה-store, בלי לייצר הד-דחיפה
 *    (דגל applyingRemote + נתיב setDbFromRemote שלא קורא ל-cloudOnDbChange).
 * 3. cloudOnDbChange(prev, next) — נקרא מנתיב setDb של ה-store, debounce
 *    800ms, מחשב diffDb ודוחף. תור לא-מקוון מנוהל ע"י Firestore עצמו.
 */
import type { Db } from '../types/domain';
import {
  diffDb,
  emptyDiff,
  fullDbDiff,
  ENTITY_COLLECTIONS,
  type EntityCol,
} from '../lib/cloud-diff';
import { pullAll, pushDiff, subscribeAll, type RemotePartial } from '../lib/cloud';

// יצוא-מחדש של שכבת ה-auth — ל-useApp יש import דינמי אחד בלבד (המודול הזה)
export { initCloud, resetPassword, signIn, signOutCloud, watchAuth } from '../lib/cloud';
export type { CloudUser } from '../lib/cloud';

export type CloudStatus = 'idle' | 'connecting' | 'synced' | 'error';

export interface CloudSyncHooks {
  getDb: () => Db;
  /** החלפת ה-DB ב-store + שמירה מקומית — בלי להפעיל דחיפת ענן חוזרת. */
  setDbFromRemote: (db: Db) => void;
  toast: (text: string) => void;
  setStatus: (status: CloudStatus) => void;
}

let hooks: CloudSyncHooks | null = null;
let active = false;
/** דגל הד: true בזמן החלת שינוי מרוחק — cloudOnDbChange מדלג. */
let applyingRemote = false;
let unsubAll: (() => void) | null = null;

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushBase: Db | null = null;
let pushLatest: Db | null = null;

const PUSH_DEBOUNCE_MS = 800;

function withRemoteFlag(fn: () => void): void {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

/** מיזוג שינויי אוסף מרוחקים לרשימה מקומית — upsert לפי id, מחוקים יוצאים. */
function applyEntityPartial(
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
      .map((d) => [d.id, { ...(d.data as Record<string, unknown>), id: d.id }]),
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
function applyMetaPartial(db: Db, meta: Record<string, unknown>): Db {
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
  // seq: לעולם לא מקטינים — מונע התנגשות מזהים בין מכשירים
  if (typeof meta.seq === 'number' && Number.isFinite(meta.seq) && meta.seq > db.seq) {
    next.seq = meta.seq;
    changed = true;
  }
  return changed ? next : db;
}

function onRemote(partial: RemotePartial): void {
  const h = hooks;
  if (!h || !active) return;
  const db = h.getDb();
  const next =
    'meta' in partial
      ? applyMetaPartial(db, partial.meta)
      : applyEntityPartial(db, partial.col, partial.docs);
  if (next === db) return;
  withRemoteFlag(() => h.setDbFromRemote(next));
}

/**
 * הפעלת הסנכרון אחרי התחברות מוצלחת. כל כשל → טוסט + status 'error',
 * והעבודה המקומית ממשיכה כרגיל.
 */
export async function startCloudSync(h: CloudSyncHooks): Promise<void> {
  hooks = h;
  h.setStatus('connecting');
  try {
    const cloudDb = await pullAll();
    const local = h.getDb();
    if (cloudDb === null) {
      // פרויקט ענן ריק — הגירה ראשונה: מעלים את כל הנתונים המקומיים
      if (local.families.length) {
        await pushDiff(fullDbDiff(local));
        h.toast('הנתונים הועלו לענן ✓');
      }
    } else {
      // בענן יש נתונים — הם האמת; ההתמדה המקומית ממשיכה לשמור אותם כרגיל
      withRemoteFlag(() => h.setDbFromRemote(cloudDb));
    }
    active = true;
    unsubAll = subscribeAll(onRemote, () => {
      hooks?.setStatus('error');
    });
    h.setStatus('synced');
  } catch (e) {
    active = false;
    h.setStatus('error');
    h.toast(e instanceof Error ? `⚠ ${e.message}` : '⚠ הסנכרון לענן נכשל — ממשיכים בעבודה מקומית');
  }
}

/** עצירת הסנכרון (יציאה מהחשבון) — הנתונים המקומיים נשארים. */
export function stopCloudSync(): void {
  active = false;
  unsubAll?.();
  unsubAll = null;
  clearTimeout(pushTimer);
  pushBase = null;
  pushLatest = null;
  hooks?.setStatus('idle');
  hooks = null;
}

async function flushPush(): Promise<void> {
  if (!active || !pushBase || !pushLatest) return;
  const base = pushBase;
  const latest = pushLatest;
  pushBase = null;
  pushLatest = null;
  const diff = diffDb(base, latest);
  if (emptyDiff(diff)) return;
  try {
    await pushDiff(diff);
    if (active) hooks?.setStatus('synced');
  } catch {
    if (active) {
      hooks?.setStatus('error');
      hooks?.toast('⚠ הדחיפה לענן נכשלה — הנתונים שמורים מקומית ויסונכרנו בהמשך');
    }
  }
}

/**
 * נקודת הכניסה מנתיב setDb של ה-store: debounce 800ms על בסיס-prev יציב
 * (ה-prev הראשון מאז הדחיפה האחרונה), כך שגם רצף שינויים מהיר נדחף כ-diff
 * אחד. אסור לחסום שמירה מקומית — הפונקציה סינכרונית ולעולם לא זורקת.
 */
export function cloudOnDbChange(prev: Db, next: Db): void {
  if (!active || applyingRemote) return;
  pushBase ??= prev;
  pushLatest = next;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void flushPush();
  }, PUSH_DEBOUNCE_MS);
}

/** לחשיפה בבדיקות/דיבוג — האם כרגע מוחל שינוי מרוחק. */
export function isApplyingRemote(): boolean {
  return applyingRemote;
}
