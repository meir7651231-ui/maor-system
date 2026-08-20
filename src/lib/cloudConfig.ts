/**
 * קונפיג-בענן (CLOUD2 ענן 2) — מסמך הארגון בפלטפורמה: קונפיג חי, חברים,
 * מצב "הוקם". נטען רק דרך ה-dynamic-import של הענן (cloudSync) — ארגון
 * מקומי לא מוריד את firebase.
 *
 * הערת-נתיב (הכרעת בנאי, מתועדת): ‏"platform/orgs/{slug}" מהפקודה אינו נתיב
 * מסמך חוקי ב-Firestore (מספר מקטעים אי-זוגי) — מומש כשני אוספי-שורש
 * ייעודיים: ‏platformOrgs/{slug} ו-platformRequests/{uid}. אותם שמות, אותה
 * סמנטיקה, נתיבים חוקיים; אין התנגשות עם 18 אוספי הישויות.
 */
import { addDoc, collection, deleteDoc, deleteField, doc, FieldPath, getDoc, getDocs, increment, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { cloudDb } from './cloud';
import type { OrgConfig } from '../types/config';
import { sanitizeSupportText, type SupportMsg, type SupportSide, type SupportThread, type TeamMsg } from './supportChat';

/** אוסף מסמכי הארגונים של הפלטפורמה. */
export const PLATFORM_ORGS = 'platformOrgs';
/** אוסף בקשות ההרשמה הממתינות. */
export const PLATFORM_REQUESTS = 'platformRequests';
/** אוסף לידים — "נחזור אליכם" בלי חשבון (create-only ציבורי; קריאה למיילי-על). */
export const PLATFORM_LEADS = 'platformLeads';

/** ליד "נחזור אליכם" — platformLeads/{autoId}. */
export interface OrgLeadDoc {
  contactName?: string;
  phone?: string;
  preferredTime?: string;
  notes?: string;
  at?: string;
}

/** כרטיס-עובד (ORGADMIN) — דריסת-קונפיג אישית: המנהל מדליק/מכבה פר-עובד/ת דרך
 *  אותו אשף של הארגון. רק **הגבלה** (false = מוסתר לעובד/ת); ריק = כמו הארגון.
 *  אילוץ-על: ההסתרה ברמת-הממשק בלבד (מסמך-יחיד — ראה BUILD-ORDER-ORGADMIN). */
export interface EmployeeOverride {
  /** מודולים לכבות לעובד/ת (false = מוסתר). חסר = יורש מהארגון. */
  modules?: Record<string, boolean>;
  /** דגלי-פיצ'ר לכבות לעובד/ת (false = מוסתר). חסר = יורש מהארגון. */
  features?: Record<string, boolean>;
  /** 🎯 יעד-פעולות-שבועי (מודיעין-עובדים, 20.8) — additive: חסר = בלי יעד. */
  weeklyGoal?: number;
  /**
   * ייעודי-תרומה מותרים לעובד/ת (בקשת-בעלים 13.8 ג'): העובד/ת רואה **רק** תרומות
   * של הייעודים ברשימה. חסר/ריק = בלי הגבלה (רואה הכל). מנהל/בעלים תמיד רואה הכל.
   */
  designations?: string[];
}

/** מסמך ארגון בפלטפורמה — platformOrgs/{slug}.
 *  שדות ORGADMIN (manager/memberConfigs/joinOpen/joinCode) — additive: חסר = התנהגות v2. */
export interface OrgCloudDoc {
  config?: unknown;
  members?: string[];
  /** מייל מנהל-הארגון (lowercase) — נקבע ע"י מייל-על באישור. חסר = אין מנהל-מואצל. */
  manager?: string;
  /** כרטיס-עובד פר-מייל (דריסות אישיות). חבר בלי רשומה = רואה כמו הארגון (מלא). */
  memberConfigs?: Record<string, EmployeeOverride>;
  /** מתג "הרשמת-עובדים" של המנהל. */
  joinOpen?: boolean;
  /** טוקן בקישור-ההזמנה (?org=slug&join=<code>). */
  joinCode?: string;
  provisioned?: boolean;
  orgName?: string;
  createdAt?: string;
  /** מצבת-מחיקה (5.8): הארגון נמחק — הלקוח מנקה מקומית ומקבל מסך "הוסר". */
  deleted?: boolean;
  deletedAt?: string;
}

/** בקשת-הצטרפות של עובד/ת — platformOrgs/{slug}/joinRequests/{uid}. create-only ע"י המבקש. */
export interface OrgJoinRequestDoc {
  email?: string;
  name?: string;
  /** טלפון העובד/ת (הרשמת-עובד במסך-האחיד) — למנהל לזיהוי לפני אישור. */
  phone?: string;
  /** הקוד מהקישור/מהבוס — לבדיקה-רכה מול joinCode של הארגון (המנהל מאשר ממילא). */
  code?: string;
  at?: string;
}

/** בקשת הרשמה ממתינה — platformRequests/{uid}. הזרימה מבוססת שיחה — איש קשר וטלפון. */
export interface OrgRequestDoc {
  orgName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  at?: string;
  // פרופיל האשף (SIGNUP3) — נתוני-הכשרה לבעלים לפני האישור. Rules: אין הגבלת-שדות
  // על platformRequests (רק uid תואם) ⇒ אין צורך בעדכון כללים.
  industry?: string; // מזהה חבילת-ורטיקל (VERTICAL_PACKS)
  size?: string; // 'small' | 'medium' | 'large'
  needs?: string[]; // צרכים נבחרים (ORG_NEEDS)
}

/** משיכה חד-פעמית של מסמך הארגון — null כשאין (או אין הרשאה). */
export async function fetchOrgCloudConfig(slug: string): Promise<OrgCloudDoc | null> {
  try {
    const snap = await getDoc(doc(cloudDb(), PLATFORM_ORGS, slug));
    return snap.exists() ? (snap.data() as OrgCloudDoc) : null;
  } catch {
    return null;
  }
}

/**
 * האזנה חיה למסמך הארגון (onSnapshot) — הלב של "עריכה בלייב": מתג אצל
 * הבעלים ⇒ ‏cb אצל הלקוח בשניות, בלי רענון. מחזיר unsubscribe; שגיאות
 * (הרשאה/רשת) נבלעות — כשל ענן לא עוצר עבודה מקומית.
 */
export function watchOrgCloudConfig(slug: string, cb: (d: OrgCloudDoc | null) => void): () => void {
  return onSnapshot(
    doc(cloudDb(), PLATFORM_ORGS, slug),
    (snap) => cb(snap.exists() ? (snap.data() as OrgCloudDoc) : null),
    () => {
      /* אין הרשאה/רשת — נשארים על הקונפיג הנוכחי */
    },
  );
}

/** כתיבת מסמך ארגון (לוח הבקרה — מיילי-על בלבד לפי Rules). merge=עדכון חלקי. */
export async function writeOrgCloudDoc(slug: string, data: Partial<OrgCloudDoc>): Promise<void> {
  await setDoc(doc(cloudDb(), PLATFORM_ORGS, slug), JSON.parse(JSON.stringify(data)), { merge: true });
}

/** כתיבת קונפיג הארגון בשלמותו (כל מתג בלוח הבקרה ⇒ הלקוח רואה חי). */
export async function writeOrgCloudConfig(slug: string, config: OrgConfig): Promise<void> {
  await writeOrgCloudDoc(slug, { config: JSON.parse(JSON.stringify(config)) as unknown });
}

/* ── כספת-מפתחות פר-ארגון (בקשת-בעלים 9.8: "כל מנהל יש את הסודות שלו") ──
   ‏orgSecrets/{slug} = הסודות עצמם — Rules: מנהל-הארגון כותב, **איש לא קורא
   מהדפדפן** (read:false; רק ה-functions ב-Admin-SDK). ‏orgSecretsMeta/{slug} =
   מדדי-"מוגדר ✓" בוליאניים בלבד — קריאים לחברי-הארגון, בלי הסוד עצמו. */
const ORG_SECRETS = 'orgSecrets';
const ORG_SECRETS_META = 'orgSecretsMeta';

/** המפתחות המוכרים — allowlist; כל השאר נזרק (כמו INTEGRATION_SETTING_KEYS). */
export const ORG_SECRET_KEYS = ['yemotToken', 'nedarimMosad', 'nedarimApiPass', 'smsApiKey', 'smtpUrl'] as const;
export type OrgSecretKey = (typeof ORG_SECRET_KEYS)[number];

/** כתיבת סודות (merge): ערך מלא = נשמר; '' = נמחק מהכספת; שדה שלא נשלח לא נגוע.
 *  לעולם אין קריאה-חוזרת של הערכים — רק המטא ("מוגדר") מתעדכן. */
export async function writeOrgSecrets(slug: string, patch: Partial<Record<OrgSecretKey, string>>): Promise<void> {
  const secret: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};
  for (const k of ORG_SECRET_KEYS) {
    if (!(k in patch)) continue;
    const v = (patch[k] ?? '').trim();
    secret[k] = v || deleteField();
    meta[k] = !!v;
  }
  if (!Object.keys(secret).length) return;
  await setDoc(doc(cloudDb(), ORG_SECRETS, slug), secret, { merge: true });
  await setDoc(doc(cloudDb(), ORG_SECRETS_META, slug), { ...meta, updatedAt: new Date().toISOString() }, { merge: true });
}

/** קריאת מדדי-"מוגדר" בלבד — הסודות עצמם לא קריאים מהלקוח לעולם. */
export async function readOrgSecretsMeta(slug: string): Promise<Partial<Record<OrgSecretKey, boolean>>> {
  try {
    const snap = await getDoc(doc(cloudDb(), ORG_SECRETS_META, slug));
    return snap.exists() ? (snap.data() as Partial<Record<OrgSecretKey, boolean>>) : {};
  } catch {
    return {};
  }
}

/** מחיקת בקשת הרשמה (אישור/דחייה בלוח הבקרה). */
export async function deleteOrgRequest(uid: string): Promise<void> {
  await deleteDoc(doc(cloudDb(), PLATFORM_REQUESTS, uid));
}

/** כתיבת בקשת הרשמה — המסמך היחיד שנרשם-חדש רשאי לכתוב (Rules v2). */
export async function writeOrgRequest(uid: string, req: OrgRequestDoc): Promise<void> {
  await setDoc(doc(cloudDb(), PLATFORM_REQUESTS, uid), JSON.parse(JSON.stringify(req)));
}

/** כל הבקשות הממתינות — לוח הבקרה (מיילי-על בלבד לפי Rules). */
export async function fetchOrgRequests(): Promise<Array<OrgRequestDoc & { uid: string }>> {
  const snap = await getDocs(collection(cloudDb(), PLATFORM_REQUESTS));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as OrgRequestDoc) }));
}

/**
 * ניתוב-עצמי בכניסה (ORGADMIN): הסלאגים של ארגוני-הפלטפורמה שבהם המייל חבר.
 * מאפשר ל"כפתור הכניסה" בשורש להכניס את המנהל/העובד ישירות לאתר שלו (?org=slug),
 * בלי קישור נפרד. שאילתה מוגבלת-לעצמי (array-contains המייל) — כלל ה-list ב-Rules
 * מתיר רק מסמכים שבהם המייל ב-members. בלי הכלל (או בלי הרשאה/רשת) ⇒ [] (נפילה
 * בטוחה: המשתמש נשאר במסך-המתנה, כמו קודם — אין רגרסיה).
 */
export async function findMemberOrgSlugs(email: string): Promise<string[]> {
  try {
    const mail = email.trim().toLowerCase();
    if (!mail) return [];
    const q = query(collection(cloudDb(), PLATFORM_ORGS), where('members', 'array-contains', mail));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  } catch {
    return [];
  }
}

/** כל ארגוני הפלטפורמה — לוח הבקרה (מיילי-על בלבד לפי Rules). */
export async function fetchAllOrgs(): Promise<Array<OrgCloudDoc & { slug: string }>> {
  const snap = await getDocs(collection(cloudDb(), PLATFORM_ORGS));
  return snap.docs.map((d) => ({ slug: d.id, ...(d.data() as OrgCloudDoc) }));
}

/* ─────────── ORGADMIN — בקשות-הצטרפות של עובדות (subcollection של הארגון) ───────────
 * platformOrgs/{slug}/joinRequests/{uid} — create ע"י המבקש; קריאה/מחיקה = מנהל+מייל-על. */

/** עובד/ת שולח/ת בקשת-הצטרפות (create-only, uid=uid לפי Rules v3). */
export async function writeOrgJoinRequest(slug: string, uid: string, req: OrgJoinRequestDoc): Promise<void> {
  await setDoc(doc(cloudDb(), PLATFORM_ORGS, slug, 'joinRequests', uid), JSON.parse(JSON.stringify(req)));
}

/** המנהל מושך את הבקשות הממתינות של הארגון שלו. */
export async function fetchOrgJoinRequests(slug: string): Promise<Array<OrgJoinRequestDoc & { uid: string }>> {
  const snap = await getDocs(collection(cloudDb(), PLATFORM_ORGS, slug, 'joinRequests'));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as OrgJoinRequestDoc) }));
}

/** המנהל מוחק בקשה (אחרי אישור/דחייה). */
export async function deleteOrgJoinRequest(slug: string, uid: string): Promise<void> {
  await deleteDoc(doc(cloudDb(), PLATFORM_ORGS, slug, 'joinRequests', uid));
}

/**
 * מחיקת כרטיס-העובד של מייל מהענן. ‏writeOrgCloudDoc משתמש ב-merge:true שממזג-עומק
 * מפות ⇒ השמטת מפתח *לא מוחקת* אותו (הכרטיס והמייל היו נשארים לנצח, וחוזרים באישור-מחדש).
 * FieldPath('memberConfigs', email) + deleteField() מוחק את המפתח הנקודתי בבטחה (המייל
 * מכיל נקודות — FieldPath מטפל בהן, לא נתיב-נקודה). ‏updateDoc — המסמך תמיד קיים כאן.
 */
export async function deleteOrgMemberConfig(slug: string, email: string): Promise<void> {
  await updateDoc(doc(cloudDb(), PLATFORM_ORGS, slug), new FieldPath('memberConfigs', email), deleteField());
}

/**
 * 🗑 מחיקת-לקוח מלאה (5.8.2026 — "איך אני מוחק לקוחות"): ב-Firestore מחיקת
 * מסמך **לא** מוחקת תתי-אוספים — לכן מוחקים מסודר: כל אוספי-הנתונים של הארגון
 * (‏ENTITY_COLLECTIONS + התורים + meta + envelope), בקשות-ההצטרפות, ולבסוף
 * מסמך-הארגון עצמו. מייל-על בלבד (Rules). חשבונות-Auth נמחקים בקונסולה —
 * ל-SDK-הדפדפן אין הרשאת-מחיקת-משתמשים.
 * מחזירה את מספר-המסמכים שנמחקו (לחיווי-בעלים).
 */
export async function deleteOrgCompletely(
  slug: string,
  entityCols: readonly string[],
): Promise<number> {
  const db = cloudDb();
  let deleted = 0;
  const wipeCol = async (path: string) => {
    const snap = await getDocs(collection(db, path));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      deleted++;
    }
  };
  // אוספי-הנתונים + התורים של השרת (webhook/sms/mail) תחת orgs/{slug}
  for (const col of [...entityCols, 'incomingPayments', 'smsOutbox', 'mailOutbox']) {
    await wipeCol('orgs/' + slug + '/' + col);
  }
  // מסמכי-היחיד: meta + envelope-ההצפנה (מדולגים בשקט אם אינם)
  for (const p of ['orgs/' + slug + '/meta/org', 'orgs/' + slug + '/_enc/envelope']) {
    await deleteDoc(doc(db, p)).catch(() => {});
    deleted++;
  }
  // בקשות-ההצטרפות של העובדים, ואז מסמך-הארגון — שמוחלף ב**מצבת** (deleted:true):
  // הלקוח שנכנס קורא אותה (Rules מתירים get למצבות בלבד), מנקה את המגירה
  // המקומית שלו ורואה מסך "הארגון הוסר". מחיקה-מלאה של המסמך הייתה משאירה את
  // הלקוח עם permission-denied עמום — בלתי-ניתן-להבחנה מ"עוד לא אושרת".
  await wipeCol(PLATFORM_ORGS + '/' + slug + '/joinRequests');
  await setDoc(doc(db, PLATFORM_ORGS, slug), { deleted: true, deletedAt: new Date().toISOString() });
  deleted++;
  return deleted;
}

/**
 * כתיבת ליד "נחזור אליכם" (SIGNUP מיתוג 3) — **בלי חשבון**. אוסף
 * create-only ציבורי (Rules: allow create בלבד; קריאה למיילי-על) — לכידת-ליד
 * בטוחה: אף אחד לא יכול לקרוא/למנות את הלידים חוץ מהבעלים.
 */
export async function writeOrgLead(lead: OrgLeadDoc): Promise<void> {
  await addDoc(collection(cloudDb(), PLATFORM_LEADS), JSON.parse(JSON.stringify(lead)));
}

/** כל הלידים — לוח הבקרה (מיילי-על בלבד לפי Rules). */
export async function fetchOrgLeads(): Promise<Array<OrgLeadDoc & { id: string }>> {
  const snap = await getDocs(collection(cloudDb(), PLATFORM_LEADS));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as OrgLeadDoc) }));
}

/* ───────────── 💬 צ׳אט-תמיכה חי (17.8) — supportChats/{uid} + messages ─────────────
 * חי-באמת דרך onSnapshot: הלקוח (auth.uid==uid) והתמיכה (מייל-על) בלבד. הודעות
 * בלתי-משתנות (create בלבד); from נאכף ב-Rules (user↔admin). טקסט בלבד, תחום-גודל. */
export const SUPPORT_CHATS = 'supportChats';

/** הלקוח שולח הודעה: כותב message(from:'user') + מעדכן מטא-שיחה (unreadAdmin++). */
export async function sendSupportMessage(
  uid: string,
  meta: { email?: string; orgName?: string },
  text: string,
): Promise<void> {
  const clean = sanitizeSupportText(text);
  if (!clean) return;
  const now = new Date().toISOString();
  await addDoc(collection(cloudDb(), SUPPORT_CHATS, uid, 'messages'), { from: 'user', text: clean, at: now });
  await setDoc(
    doc(cloudDb(), SUPPORT_CHATS, uid),
    {
      email: (meta.email ?? '').slice(0, 120),
      orgName: (meta.orgName ?? '').slice(0, 120),
      lastText: clean.slice(0, 120),
      lastAt: now,
      lastFrom: 'user',
      unreadAdmin: increment(1),
    },
    { merge: true },
  );
}

/** התמיכה (מייל-על) משיבה: message(from:'admin') + מטא (unreadUser++). */
export async function sendSupportReply(uid: string, text: string): Promise<void> {
  const clean = sanitizeSupportText(text);
  if (!clean) return;
  const now = new Date().toISOString();
  await addDoc(collection(cloudDb(), SUPPORT_CHATS, uid, 'messages'), { from: 'admin', text: clean, at: now });
  await setDoc(
    doc(cloudDb(), SUPPORT_CHATS, uid),
    { lastText: clean.slice(0, 120), lastAt: now, lastFrom: 'admin', unreadUser: increment(1) },
    { merge: true },
  );
}

/** האזנה-חיה להודעות השיחה (onSnapshot) — ממוינות בצד-הלקוח (בלי אינדקס). */
export function watchSupportMessages(uid: string, cb: (msgs: SupportMsg[]) => void): () => void {
  return onSnapshot(
    collection(cloudDb(), SUPPORT_CHATS, uid, 'messages'),
    (snap) => cb(snap.docs.map((d) => d.data() as SupportMsg)),
    () => { /* אין הרשאה/רשת — נשארים על מה שיש */ },
  );
}

/** האזנה-חיה למטא-השיחה (תגי לא-נקרא). null כשאין שיחה עדיין. */
export function watchSupportThreadMeta(uid: string, cb: (t: SupportThread | null) => void): () => void {
  return onSnapshot(
    doc(cloudDb(), SUPPORT_CHATS, uid),
    (snap) => cb(snap.exists() ? (snap.data() as SupportThread) : null),
    () => { /* נבלע */ },
  );
}

/** תיבת-השיחות של התמיכה (מייל-על) — כל השיחות, חי. */
export function watchAllSupportThreads(cb: (threads: Array<SupportThread & { uid: string }>) => void): () => void {
  return onSnapshot(
    collection(cloudDb(), SUPPORT_CHATS),
    (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as SupportThread) }))),
    () => { /* נבלע */ },
  );
}

/** איפוס מונה-לא-נקרא לצד שקרא (אחרי פתיחת השיחה). */
export async function markSupportRead(uid: string, side: SupportSide): Promise<void> {
  const field = side === 'admin' ? 'unreadAdmin' : 'unreadUser';
  await setDoc(doc(cloudDb(), SUPPORT_CHATS, uid), { [field]: 0 }, { merge: true }).catch(() => {});
}

/* ───────── 💬 צ׳אט-צוות תוך-ארגוני (17.8) — teamChats/{slug}/messages ─────────
 * ערוץ-קבוצה אחד לכל הארגון: כל אנשי-הצוות (orgMember/allowedRoot-לשורש) כותבים
 * וקוראים חי. הודעות = create בלבד. מגודר בדגל `shell.teamchat`. */
export const TEAM_CHATS = 'teamChats';

/** איש-צוות שולח הודעה לערוץ-הארגון. */
export async function sendTeamMessage(slug: string, sender: string, name: string, text: string): Promise<void> {
  const clean = sanitizeSupportText(text);
  if (!clean) return;
  await addDoc(collection(cloudDb(), TEAM_CHATS, slug, 'messages'), {
    sender: (sender || '').slice(0, 120),
    name: (name || '').slice(0, 60),
    text: clean,
    at: new Date().toISOString(),
  });
}

/** האזנה-חיה להודעות-הצוות (onSnapshot) — ממוינות בצד-הלקוח. */
export function watchTeamMessages(slug: string, cb: (msgs: TeamMsg[]) => void): () => void {
  return onSnapshot(
    collection(cloudDb(), TEAM_CHATS, slug, 'messages'),
    (snap) => cb(snap.docs.map((d) => d.data() as TeamMsg)),
    () => { /* אין הרשאה/רשת — נבלע */ },
  );
}
