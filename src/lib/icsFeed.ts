/**
 * 🔗 מנוי-יומן חי (הרחבת gcal, 9.8) — במקום קובץ ICS חד-פעמי, המערכת מפרסמת
 * כתובת-מנוי שגוגל/אאוטלוק מושכים ממנה עדכונים לבד. ה-ICS מחושב **בלקוח**
 * (הלוח העברי נשאר צד-לקוח — מקור-אמת יחיד, הכרעת צרור-הלילה) ונכתב ל-
 * `icsFeeds/{slug}` עם token סודי; פונקציית `icsFeed` בשרת רק מגישה אותו.
 * ה-token חי במסמך-הפיד בלבד — לא בקונפיג, לא בגיבויים, לא ב-localStorage.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cloudDb } from './cloud';

const ICS_FEEDS = 'icsFeeds';

/** מסמך-הפיד גדול מדי ל-Firestore (גבול 1MB) — שומרים שולי-ביטחון. */
const MAX_ICS_BYTES = 900_000;

/** token אקראי 32-hex — crypto של הדפדפן, לא Math.random. */
export function mintFeedToken(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** ה-token הקיים של הפיד (אם פורסם) — כדי שרענון לא ישבור קישורים שכבר במנוי. */
export async function readIcsFeedToken(slug: string): Promise<string | null> {
  const snap = await getDoc(doc(cloudDb(), ICS_FEEDS, slug));
  const d = snap.exists() ? (snap.data() as { token?: unknown }) : null;
  return d && typeof d.token === 'string' && d.token ? d.token : null;
}

/**
 * פרסום/רענון הפיד. token קיים נשמר (הקישור אצל המנויים ממשיך לעבוד);
 * `rotate` מנפיק token חדש — הקישור הישן מת מיידית (ביטול-שיתוף).
 */
export async function publishIcsFeed(slug: string, ics: string, opts?: { rotate?: boolean }): Promise<string> {
  if (new TextEncoder().encode(ics).length > MAX_ICS_BYTES) {
    throw new Error('לוח-השנה גדול מדי לפרסום כפיד — פנו לתמיכה');
  }
  const token = (opts?.rotate ? null : await readIcsFeedToken(slug)) ?? mintFeedToken();
  await setDoc(doc(cloudDb(), ICS_FEEDS, slug), { token, ics, updatedAt: new Date().toISOString() });
  return token;
}

/** כתובת-המנוי הציבורית — פונקציית icsFeed בפרויקט-הענן של הארגון. */
export function icsFeedUrl(projectId: string, slug: string, token: string): string {
  return 'https://us-central1-' + projectId + '.cloudfunctions.net/icsFeed?org=' + encodeURIComponent(slug) + '&key=' + token;
}
