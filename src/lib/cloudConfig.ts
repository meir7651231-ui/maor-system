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
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { cloudDb } from './cloud';
import type { OrgConfig } from '../types/config';

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
}

/** בקשת-הצטרפות של עובד/ת — platformOrgs/{slug}/joinRequests/{uid}. create-only ע"י המבקש. */
export interface OrgJoinRequestDoc {
  email?: string;
  name?: string;
  /** הקוד מהקישור — לבדיקה-רכה מול joinCode של הארגון (המנהל מאשר ממילא). */
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

/** כל ארגוני הפלטפורמה — לוח הבקרה (מיילי-על בלבד לפי Rules). */
export async function fetchAllOrgs(): Promise<Array<OrgCloudDoc & { slug: string }>> {
  const snap = await getDocs(collection(cloudDb(), PLATFORM_ORGS));
  return snap.docs.map((d) => ({ slug: d.id, ...(d.data() as OrgCloudDoc) }));
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
