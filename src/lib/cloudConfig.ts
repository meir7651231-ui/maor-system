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
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { cloudDb } from './cloud';
import type { OrgConfig } from '../types/config';

/** אוסף מסמכי הארגונים של הפלטפורמה. */
export const PLATFORM_ORGS = 'platformOrgs';
/** אוסף בקשות ההרשמה הממתינות. */
export const PLATFORM_REQUESTS = 'platformRequests';

/** מסמך ארגון בפלטפורמה — platformOrgs/{slug}. */
export interface OrgCloudDoc {
  config?: unknown;
  members?: string[];
  provisioned?: boolean;
  orgName?: string;
  createdAt?: string;
}

/** בקשת הרשמה ממתינה — platformRequests/{uid}. */
export interface OrgRequestDoc {
  orgName?: string;
  email?: string;
  at?: string;
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
