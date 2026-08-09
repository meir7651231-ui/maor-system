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
import { diffDb, emptyDiff, ENTITY_COLLECTIONS, fullDbDiff } from '../lib/cloud-diff';
import { applyEntityPartial, applyMetaPartial } from '../lib/cloud-merge';
import { pullAll, pushDiff, subscribeAll, type RemotePartial } from '../lib/cloud';

// מפתח-הצפנת-הענן (opt-in) — null עד שהמשתמש מפעיל הצפנה ומזין סיסמה. כל עוד
// null, כל קריאות הענן זהות-בייט להיום (ratchet ב-cloud.ts). האחסון בזיכרון בלבד.
let cloudDek: CryptoKey | null = null;
export function setCloudDek(dek: CryptoKey | null): void {
  cloudDek = dek;
}
export function getCloudDek(): CryptoKey | null {
  return cloudDek;
}

// יצוא-מחדש של שכבת ה-auth — ל-useApp יש import דינמי אחד בלבד (המודול הזה)
export { changePassword, encryptExistingCloud, fetchIncomingPayments, initCloud, markIncomingPayment, readCloudEnvelope, resetPassword, setCloudScope, signIn, signOutCloud, signUp, watchAuth, writeCloudEnvelope, writeMailOutbox, writeSmsOutbox } from '../lib/cloud';
export type { CloudUser, IncomingPayment } from '../lib/cloud';
// קונפיג-בענן (CLOUD2 ענן 2) — נטען עם מודול הענן, לא עם ה-bundle הראשי
export { deleteOrgCompletely, deleteOrgRequest, deleteOrgJoinRequest, deleteOrgMemberConfig, fetchAllOrgs, fetchOrgCloudConfig, fetchOrgJoinRequests, fetchOrgLeads, fetchOrgRequests, findMemberOrgSlugs, watchOrgCloudConfig, writeOrgCloudConfig, writeOrgCloudDoc, writeOrgJoinRequest, writeOrgLead, writeOrgRequest } from '../lib/cloudConfig';
export type { EmployeeOverride, OrgCloudDoc, OrgJoinRequestDoc, OrgLeadDoc, OrgRequestDoc } from '../lib/cloudConfig';

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
    const cloudDb = await pullAll(cloudDek);
    // אם stopCloudSync רץ במקביל (יציאה/פקיעת טוקן במהלך ה-pull) hooks כבר אופס —
    // אין להמשיך ולהפעיל מחדש סנכרון לחשבון שיצא.
    if (hooks !== h) return;
    const local = h.getDb();
    if (cloudDb === null) {
      // פרויקט ענן ריק — הגירה ראשונה: מעלים את כל הנתונים המקומיים
      if (ENTITY_COLLECTIONS.some((c) => local[c].length)) {
        await pushDiff(fullDbDiff(local), cloudDek);
        h.toast('הנתונים הועלו לענן ✓');
      }
    } else {
      // בענן יש נתונים — הם האמת בקונפליקט, אך רשומות מקומיות-בלבד (עבודה
      // לא-מקוונת לפני החיבור הראשון) אסור שיידרסו. מאחדים לפי id: הענן מנצח
      // בהתנגשות, והתוספות המקומיות נשמרות ונדחפות לענן. בלי זה, כל עבודה
      // מקומית שקדמה לחיבור הראשון נמחקת בשקט.
      const merged: Db = { ...cloudDb };
      for (const col of ENTITY_COLLECTIONS) {
        const cloudList = cloudDb[col] as Array<{ id: string }>;
        const cloudIds = new Set(cloudList.map((x) => x.id));
        const localOnly = (local[col] as Array<{ id: string }>).filter((x) => !cloudIds.has(x.id));
        if (localOnly.length) (merged[col] as Array<{ id: string }>) = [...cloudList, ...localOnly];
      }
      withRemoteFlag(() => h.setDbFromRemote(merged));
      // diffDb(cloudDb, merged) = רק התוספות המקומיות (merged ⊇ ישויות הענן, אין
      // מחיקות), וללא שינוי meta (merged שומר את meta של הענן) → הענן נשאר סמכותי.
      const additions = diffDb(cloudDb, merged);
      if (!emptyDiff(additions)) await pushDiff(additions, cloudDek);
    }
    // התנתקות (logout) יכולה לרוץ סינכרונית במהלך ה-push-ים למעלה; אז hooks אופס
    // ו-stopCloudSync כבר סיים. בלי שער נוסף כאן היינו מחיים active=true, מתקינים
    // מנוי Firestore חי לחשבון שיצא (דליפה — stopCloudSync כבר רץ), וכותבים
    // 'synced' אחרי ה-'idle'. מגן על שני ה-await (81 ו-100), כמו השער בשורה 76.
    if (hooks !== h) return;
    active = true;
    unsubAll = subscribeAll(
      onRemote,
      () => {
        hooks?.setStatus('error');
      },
      cloudDek,
    );
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
  // מבססים את הדחיפה על ה-store החי אחרי מיזוג-מרוחק, לא על ה-snapshot שנתפס
  // ב-cloudOnDbChange. במהלך ה-debounce ‏(800ms) ייתכן ש-onRemote החליף את ה-DB
  // (applyingRemote חוסם עדכון של pushLatest), וכך pushLatest התיישן והיה מחייה
  // מסמך ישן של מכשיר A מעל השינוי המאושר של B. hooks מובטח לא-null בזמן active.
  const latest = hooks?.getDb() ?? pushLatest;
  pushBase = null;
  pushLatest = null;
  const diff = diffDb(base, latest);
  if (emptyDiff(diff)) return;
  try {
    await pushDiff(diff, cloudDek);
    if (active) hooks?.setStatus('synced');
  } catch {
    // כשל שאינו-offline: משחזרים את הדלתא הממתינה כדי שתידחף בעריכה הבאה.
    // base תמיד המוקדם ביותר; latest נשמר אם עריכה מקבילה כבר קבעה חדש יותר.
    if (active) {
      pushBase = base;
      pushLatest ??= latest;
      hooks?.setStatus('error');
      hooks?.toast('⚠ הדחיפה לענן נכשלה — הנתונים שמורים מקומית ויסונכרנו בהמשך');
      // flushPush נקרא רק מטיימר ה-debounce של cloudOnDbChange (עריכת משתמש). בלי
      // תזמון-מחדש, דלתא שנכשלה הייתה תלויה לנצח עד העריכה הבאה. מתזמנים ניסיון
      // חוזר עם backoff (5s, לא זמן ה-debounce) כדי לא להיכנס ללולאה הדוקה על
      // כשל מתמשך (permission-denied). stopCloudSync מנקה את pushTimer.
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => void flushPush(), 5000);
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
