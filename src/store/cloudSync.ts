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
import type { AuditEntry, Db } from '../types/domain';
import { diffDb, emptyDiff, ENTITY_COLLECTIONS, fullDbDiff, stripSupporterDonations, type DbDiff } from '../lib/cloud-diff';
import { applyEntityPartial, applyMetaPartial } from '../lib/cloud-merge';
import { auditWriterEmail, donationSplitActive, pullAll, pullAuditRing, pushAuditRing, pushDiff, pushDonations, subscribeAll, supEnforceActive, type RemotePartial } from '../lib/cloud';
import { donationPartitionDiff } from '../lib/donationPartition';
import { supKeyMapOf } from '../lib/supporterPartition';

/**
 * מסלול-B — דחיפה מפוצלת-מודעת. במצב-כבוי: pushDiff רגיל (ביט-זהה). במצב-פיצול:
 * מסמכי-התומך בלי donations (עוברים לאוסף-הנפרד) + דחיפת diff-אוסף-התרומות.
 * מטפל בעצמו ב-diff ריק (כולל מקרה שרק ייעוד-תרומה השתנה ⇒ diff-ישויות ריק).
 */
async function pushSplitAware(prevSups: Db['supporters'], nextSups: Db['supporters'], diff: DbDiff): Promise<void> {
  // אכיפת-נתונים (dormant): מפת spId→skey לגזירת מפתח-אירוע בדחיפה. כבוי ⇒ מפה
  // ריקה, ו-pushDiff לא מזריק skey (ביט-זהה). נבנית מהתומכים-שאחרי-השינוי.
  const supKeyMap = supEnforceActive() ? supKeyMapOf(nextSups) : new Map<string, string>();
  if (!donationSplitActive()) {
    if (!emptyDiff(diff)) await pushDiff(diff, cloudDek, supKeyMap);
  } else {
    const stripped = stripSupporterDonations(diff);
    if (!emptyDiff(stripped)) await pushDiff(stripped, cloudDek, supKeyMap);
    const dd = donationPartitionDiff(prevSups, nextSups);
    if (dd.sets.length || dd.deletes.length) await pushDonations(dd, cloudDek);
  }
  // לוג-מנהל מסונכרן: כשאכיפה דלוקה והלוג השתנה (רוכב על diff.meta), דוחפים את
  // טבעת-הפעולות **של המחובר-בלבד** (who===email שלו) למסמכו auditlog/{uid}.
  const audit = (diff.meta as { audit?: AuditEntry[] } | null | undefined)?.audit;
  if (supEnforceActive() && Array.isArray(audit)) {
    const mine = audit.filter((e) => (e.who ?? '').trim().toLowerCase() === auditWriterEmail());
    await pushAuditRing(mine, cloudDek);
  }
}

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
export { changePassword, encryptExistingCloud, fetchIncomingPayments, fetchNedarimDonors, initCloud, markIncomingPayment, migrateDonationsToCollection, migrateSupportersToKeyed, readCloudEnvelope, resetPassword, setAllowedPurposes, setAuditContext, setCloudScope, setDonationSplit, setSupEnforce, signIn, signOutCloud, signUp, supEnforceActive, watchAuth, writeCloudEnvelope, writeMailOutbox, writeSmsOutbox } from '../lib/cloud';
export type { CloudUser, IncomingPayment, NedarimDonor } from '../lib/cloud';
// קונפיג-בענן (CLOUD2 ענן 2) — נטען עם מודול הענן, לא עם ה-bundle הראשי
export { deleteOrgCompletely, deleteOrgRequest, deleteOrgJoinRequest, deleteOrgMemberConfig, fetchAllOrgs, fetchOrgCloudConfig, fetchOrgJoinRequests, fetchOrgLeads, fetchOrgRequests, findMemberOrgSlugs, watchOrgCloudConfig, writeOrgCloudConfig, writeOrgCloudDoc, writeOrgJoinRequest, writeOrgLead, writeOrgRequest } from '../lib/cloudConfig';
export type { EmployeeOverride, OrgCloudDoc, OrgJoinRequestDoc, OrgLeadDoc, OrgRequestDoc } from '../lib/cloudConfig';
// 💬 צ׳אט-תמיכה חי (17.8) — onSnapshot אמיתי, נטען עם מודול-הענן
export { sendSupportMessage, sendSupportReply, watchSupportMessages, watchSupportThreadMeta, watchAllSupportThreads, markSupportRead } from '../lib/cloudConfig';
// 💬 צ׳אט-צוות תוך-ארגוני (17.8)
export { sendTeamMessage, watchTeamMessages } from '../lib/cloudConfig';

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
  // 🐛 נחיל-9×9 (13.8): שמירה/שחזור של הערך הקודם (במקום =false קשיח) — כדי
  // שקינון תחת cloudReplaceNow (שמדליק applyingRemote) לא ינקה את הדגל באמצע.
  const prev = applyingRemote;
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = prev;
  }
}

function onRemote(partial: RemotePartial): void {
  const h = hooks;
  if (!h || !active) return;
  // 🐛 נחיל-9×9 (13.8): במהלך כתיבה-סמכותית (cloudReplaceNow: reset/restore)
  // applyingRemote=true — snapshot מרוחק שמגיע תוך-כדי הוא מרוץ ומחיה נמחקים; מדלגים.
  if (applyingRemote) return;
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
    // לוג-מנהל מסונכרן: כשאכיפה דלוקה, הלוג לא רוכב על meta — מנהל/מייל-על ממזג
    // את כל טבעות-auditlog; עובד/ת ⇒ null (בלי גישה, נשאר עם הלוג המקומי).
    if (cloudDb && supEnforceActive()) {
      const ring = await pullAuditRing(cloudDek);
      if (ring) cloudDb.audit = ring;
    }
    // אם stopCloudSync רץ במקביל (יציאה/פקיעת טוקן במהלך ה-pull) hooks כבר אופס —
    // אין להמשיך ולהפעיל מחדש סנכרון לחשבון שיצא.
    if (hooks !== h) return;
    const local = h.getDb();
    // המצב שהענן מחזיק אחרי לחיצת-היד — בסיס לדחיפת-ההשלמה (#2 למטה).
    let syncedBaseline: Db = local;
    if (cloudDb === null) {
      // פרויקט ענן ריק — הגירה ראשונה: מעלים את כל הנתונים המקומיים
      if (ENTITY_COLLECTIONS.some((c) => local[c].length)) {
        await pushSplitAware([], local.supporters, fullDbDiff(local));
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
      // 🐛 נחיל-עמוק (13.8): מוני-הקבלות חייבים לעלות בלבד. merged ירש את מונה-הענן
      // (אולי נמוך ממה שהמכשיר כבר הנפיק local-first לפני החיבור) ⇒ הקבלה הבאה קיבלה
      // מספר-מס שכבר הונפק (כפילות §46). מרימים לערך החי — כמו restoreDb.
      merged.seq = Math.max(local.seq, cloudDb.seq);
      merged.receiptSeq = Math.max(local.receiptSeq, cloudDb.receiptSeq);
      merged.donationSeq = Math.max(local.donationSeq, cloudDb.donationSeq);
      merged.shopReceiptSeq = Math.max(local.shopReceiptSeq ?? 0, cloudDb.shopReceiptSeq ?? 0);
      withRemoteFlag(() => h.setDbFromRemote(merged));
      syncedBaseline = merged;
      // diffDb(cloudDb, merged) = רק התוספות המקומיות (merged ⊇ ישויות הענן, אין
      // מחיקות), וללא שינוי meta (merged שומר את meta של הענן) → הענן נשאר סמכותי.
      const additions = diffDb(cloudDb, merged);
      await pushSplitAware(cloudDb.supporters, merged.supporters, additions);
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
    // 🐛 נחיל-עמוק (13.8): עריכות שנעשו בזמן לחיצת-היד (לפני active) נשמרו מקומית אך
    // cloudOnDbChange דילג עליהן (!active) ולא נדחפו לעולם. דחיפת-השלמה חד-פעמית:
    // diff בין מה שהענן מחזיק (syncedBaseline) לבין המצב החי כעת.
    const liveDb = h.getDb();
    await pushSplitAware(syncedBaseline.supporters, liveDb.supporters, diffDb(syncedBaseline, liveDb));
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
  if (emptyDiff(diff)) return; // כל שינוי-תרומה משנה גם את מסמך-התומך ⇒ diff לא-ריק (גם בפיצול)
  try {
    await pushSplitAware(base.supporters, latest.supporters, diff);
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

/**
 * החלפה סמכותית מיידית (איפוס/שחזור) — 12.8, תיקון "האיפוס לא מוחק תורמים
 * מהענן". הזרימה הרגילה (cloudOnDbChange) עוברת debounce 800ms ו-flushPush
 * שקורא-מחדש את ה-DB **החי** — וכך snapshot-ענן שנכנס בחלון-ההשהיה מחזיר את
 * הישויות שנמחקו מקומית אל ה-live, והמחיקה אובדת (הישות "קמה לתחייה"). כאן:
 * מבטלים דחיפה ממתינה, מחשבים diff מ-prev המקושר **הקפוא** (לא מ-live),
 * חוסמים מיזוג-מרוחק תוך-כדי (applyingRemote), ודוחפים מיד וממתינים.
 */
export async function cloudReplaceNow(prev: Db, next: Db): Promise<void> {
  if (!active) return;
  // ביטול כל דחיפה מושהית — היא הייתה מבוססת live ומחיה את הנמחקים
  clearTimeout(pushTimer);
  pushBase = null;
  pushLatest = null;
  const diff = diffDb(prev, next);
  if (emptyDiff(diff)) return;
  const wasApplying = applyingRemote;
  applyingRemote = true; // חוסם flushPush/מיזוג-מרוחק מלרוץ תוך-כדי הכתיבה הסמכותית
  try {
    // מסלול-B: reset/restore בפיצול מוחק/כותב גם את מסמכי-אוסף-התרומות (מונע קבלות-יתומות).
    await pushSplitAware(prev.supporters, next.supporters, diff);
    // 🐛 נחיל-עמוק (13.8): עריכת-משתמש בזמן חלון-הדחיפה (applyingRemote חסם את
    // cloudOnDbChange) לא נדחפה ונבלעה עד העריכה הבאה. דחיפת-השלמה: diff מול המצב
    // החי אם השתנה מ-next.
    const live = hooks?.getDb();
    if (live && live !== next) {
      await pushSplitAware(next.supporters, live.supporters, diffDb(next, live));
    }
    if (active) hooks?.setStatus('synced');
  } catch {
    if (active) {
      hooks?.setStatus('error');
      hooks?.toast('⚠ מחיקת הנתונים בענן נכשלה — נסו שוב כשהחיבור יציב');
      // 🐛 נחיל-9×9 (13.8): כשל-רשת באמצע reset/restore (pushDiff לא-אטומי, אצוות
      // ≤400) השאיר מחיקות חלקיות בענן בלי retry. מציבים דחייה ממתינה ומתזמנים
      // ניסיון-חוזר (כמו flushPush) כדי שהמצב הסמכותי יגיע במלואו.
      pushBase = prev;
      pushLatest = next;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => void flushPush(), 5000);
    }
  } finally {
    applyingRemote = wasApplying;
  }
}

/** לחשיפה בבדיקות/דיבוג — האם כרגע מוחל שינוי מרוחק. */
export function isApplyingRemote(): boolean {
  return applyingRemote;
}
