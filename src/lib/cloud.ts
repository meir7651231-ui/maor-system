/**
 * מנוע הענן — Firebase Auth + Firestore. נטען דינמית רק כשלארגון יש
 * config.firebase, כך שארגון מקומי-בלבד לא מוריד את firebase כלל.
 *
 * מודל הנתונים בפרויקט של הארגון:
 * - אוסף לכל סוג ישות (families/courses/…): doc id = entity id, הגוף = הישות.
 * - מסמך יחיד 'meta/org' לכל שאר שדות ה-Db (orgName, seq, ui, attnDone…).
 *
 * כל השגיאות למשתמש — בעברית. כשל ענן לעולם אינו עוצר את העבודה המקומית.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initAppCheck } from './appCheck';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import type { FirebaseOrgConfig } from '../types/config';
import { AUDIT_CAP, DB_VERSION, type AuditEntry, type Db, type Donation } from '../types/domain';
import { migrate } from '../store/persist';
import { ENTITY_COLLECTIONS, colPath, donationsPath, envPath, fullDbDiff, metaPath, type DbDiff } from './cloud-diff';
import { donAllowedKeys, type DonationCloudDiff } from './donationPartition';
import { SUP_KEYED_COLS, docSkey, stripAuditMeta, supAllowedKeys, supKeyMapOf, supKeyOf, stripSupKey } from './supporterPartition';
import type { Supporter } from '../types/domain';
import { decryptDoc, encryptDoc } from './cloudCrypto';
import type { EncEnvelope } from './crypto';

// ה-diff עצמו טהור וחי ב-cloud-diff.ts (כדי שהבדיקות לא ייגעו ב-firebase) —
// יצוא-מחדש כאן משלים את ה-API של מנוע הענן.
export { diffDb, fullDbDiff, metaOf, ENTITY_COLLECTIONS } from './cloud-diff';
export type { DbDiff, EntityCol } from './cloud-diff';

export interface CloudUser {
  uid: string;
  email: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let fsDb: Firestore | null = null;

/**
 * תחום הארגון (CLOUD2 ענן 1) — קובע את נתיבי האוספים. ברירת המחדל הבטוחה:
 * נתיבי-שורש (ביט-זהה להיום) — כך שגם אם setCloudScope לא נקרא, הלקוח
 * הקיים לא מושפע. ארגון-פלטפורמה מקבל orgs/{slug}/ דרך setCloudScope.
 */
let scope: { slug: string; cloudRoot: boolean } = { slug: 'default', cloudRoot: true };

/** קביעת תחום הארגון — נקרא מ-connectCloud עם ה-config הטעון. */
export function setCloudScope(slug: string, cloudRoot: boolean): void {
  scope = { slug, cloudRoot };
}

/** נתיב אוסף/מטא בתחום הנוכחי — עטיפות דקות על ה-helpers הטהורים. */
function scopedCol(col: string): string {
  return colPath(scope.slug, scope.cloudRoot, col);
}
function scopedMeta(): string {
  return metaPath(scope.slug, scope.cloudRoot);
}
function scopedEnv(): string {
  return envPath(scope.slug, scope.cloudRoot);
}
function scopedDonations(): string {
  return donationsPath(scope.slug, scope.cloudRoot);
}

/* ── מסלול-B: פיצול-תרומות (דגל-אב, off-by-default, מגודר גם מ-cloudRoot) ── */
let splitOn = false;
/** נקבע מ-connectCloud לפי donationSplitOn(config). */
export function setDonationSplit(on: boolean): void {
  splitOn = on;
}
/** האם הסנכרון פועל במצב-פיצול (הצד-הדוחף שואל לפני push). */
export function donationSplitActive(): boolean {
  return splitOn;
}

// מסלול-B P3 — ייעודים מותרים לעובד/ת המחובר/ת: null=בלי-הגבלה (מנהל/בעלים ⇒ קריאה
// לא-מסוננת). מערך ⇒ שאילתת-donations מוגבלת ל-`where pkey in [...allowed, _shared_]`
// כדי ש-Firestore Rules יתירו את ה-list (רשימה לא-מסוננת של עובד-מוגבל נדחית).
let allowedPurposes: string[] | null = null;
export function setAllowedPurposes(p: string[] | null): void {
  allowedPurposes = p && p.length ? p : null;
}

/* ── אכיפת-תומכים בשכבת-הנתונים (פאזה-2, dormant): כשדלוק — כל מסמך-תומך נדחף עם
   `skey` plaintext (=forWho), ועובד/ת מוגבל/ת מושך/ת בשאילתת `where skey in […]`
   (Rules דוחים list לא-מסונן). off-by-default ⇒ אף קוד לא מדליק עד פאזת-ההפעלה
   ⇒ ביט-זהה להיום (בלי skey, בלי סינון). ─────────────────────────────────── */
let supEnforceOn = false;
/** נקבע מ-connectCloud/applyCloudDoc לפי supEnforceOn(config) — עדיין לא מחווט (פאזה-5). */
export function setSupEnforce(on: boolean): void {
  supEnforceOn = on;
}
/** האם אכיפת-התומכים פעילה (הצד-הדוחף/המושך שואל). */
export function supEnforceActive(): boolean {
  return supEnforceOn;
}

/* ── לוג-מנהל מסונכרן (משטח #3, "מנהל מסונכרן"): הלוג לא רוכב על meta המשותף
   אלא על `auditlog/{uid}` — כל משתמש כותב **רק** את מסמכו (טבעת-פעולותיו); מנהל/
   מייל-על קורא את **כל** המסמכים וממזג ⇒ רואה הכל. עובד/ת לא רשאי/ת לקרוא (Rules)
   ⇒ לא לומד/ת על פעולות של אחרת. dormant: פעיל רק כשאכיפה דלוקה. ─────────── */
let auditUid = '';
let auditEmail = '';
let auditReadable = false;
/** נקבע מהחיבור: uid+email של המחובר, ו-canRead=מנהל/מייל-על (קורא את כל הלוגים). */
export function setAuditContext(uid: string, email: string, canRead: boolean): void {
  auditUid = uid;
  auditEmail = email.trim().toLowerCase();
  auditReadable = canRead;
}
/** המייל שכותב את הלוג (לסינון הטבעת-הנדחפת לפעולות-שלו-בלבד). */
export function auditWriterEmail(): string {
  return auditEmail;
}

/** דחיפת טבעת-הלוג של המחובר למסמכו (auditlog/{uid}) — כתיבת-מסמך-עצמו בלבד. */
export async function pushAuditRing(entries: AuditEntry[], dek?: CryptoKey | null): Promise<void> {
  if (!auditUid) return;
  const db = requireDb();
  const ring = entries.slice(-AUDIT_CAP);
  const body = dek ? await encryptDoc({ entries: ring }, dek) : { entries: ring };
  await setDoc(doc(db, scopedCol('auditlog'), auditUid), body as DocumentData);
}

/** משיכת כל טבעות-הלוג וממוזגות (מנהל/מייל-על בלבד) — עובד/ת ⇒ null (בלי גישה). */
export async function pullAuditRing(dek?: CryptoKey | null): Promise<AuditEntry[] | null> {
  if (!auditReadable) return null;
  const db = requireDb();
  const snap = await getDocs(collection(db, scopedCol('auditlog')));
  const all: AuditEntry[] = [];
  for (const d of snap.docs) {
    const data = (dek ? await decryptDoc(d.data(), dek) : d.data()) as { entries?: AuditEntry[] };
    if (Array.isArray(data.entries)) all.push(...data.entries);
  }
  all.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return all.slice(-AUDIT_CAP);
}

/**
 * מסלול-B — דחיפת אופרציות אוסף-התרומות (set/delete batched, ‏≤400). גוף-המסמך =
 * ‏{supporterId, pkey, ...donation}; ‏id=rid. מוצפן אם dek (כמו שאר האוספים).
 */
export async function pushDonations(diff: DonationCloudDiff, dek?: CryptoKey | null): Promise<void> {
  const db = requireDb();
  const ops: Array<(b: WriteBatch) => void> = [];
  for (const d of diff.sets) {
    // pkey נשמר plaintext (מחוץ למעטפה) כדי ש-where-pkey-in + Rules יעבדו גם בארגון-מוצפן.
    const payload: Record<string, unknown> = { supporterId: d.supporterId, ...d.donation };
    const body: Record<string, unknown> = dek ? { pkey: d.pkey, ...(await encryptDoc(payload, dek)) } : { pkey: d.pkey, ...payload };
    ops.push((b) => b.set(doc(db, scopedDonations(), d.id), body as DocumentData));
  }
  for (const id of diff.deletes) {
    ops.push((b) => b.delete(doc(db, scopedDonations(), id)));
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
}

/**
 * מסלול-B פאזה-4 — מיגרציית-פיצול חד-פעמית (חלון-בעלים): מפרקת את **כל** תרומות
 * התומכים לאוסף-התרומות-הנפרד (upsert לפי rid). **אינה נוגעת ב-donationSeq** ולא
 * מוחקת את התרומות המקוננות (הפיך: כיבוי-הדגל ⇒ הנתונים המקוננים עדיין שם).
 * אידמפוטנטית — הרצה חוזרת כותבת את אותם מסמכים. מריצים לפני הדלקת donationSplit.
 * מחזירה את מספר התרומות שהוגרו.
 */
export async function migrateDonationsToCollection(supporters: Db['supporters'], dek?: CryptoKey | null): Promise<number> {
  const { donationPartitionDiff } = await import('./donationPartition');
  const diff = donationPartitionDiff([], supporters); // prev ריק ⇒ כל התרומות = sets
  await pushDonations(diff, dek);
  return diff.sets.length;
}

/**
 * אכיפת-תומכים · מיגרציה חד-פעמית (חלון-בעלים): כותבת-מחדש כל מסמך-תומך **עם**
 * `skey`=forWho (upsert לפי id) — התוכן ביט-זהה, רק נוסף מפתח-plaintext. אידמפוטנטית
 * ולא-הרסת (בלי skey הסינון פשוט לא מסנן). מריצים לפני הדלקת supEnforce. מחזירה
 * את מספר התומכים ש-seed להם skey. (לא נוגעת בתרומות/מונים/rid.)
 */
export async function migrateSupportersToKeyed(
  supporters: Supporter[],
  events: Db['events'],
  dek?: CryptoKey | null,
): Promise<number> {
  const db = requireDb();
  const map = supKeyMapOf(supporters);
  const ops: Array<(b: WriteBatch) => void> = [];
  for (const sp of supporters) {
    const inner = dek ? await encryptDoc(toPlain(sp), dek) : toPlain(sp);
    ops.push((b) => b.set(doc(db, scopedCol('supporters'), sp.id), { skey: supKeyOf(sp), ...(inner as Record<string, unknown>) } as DocumentData));
  }
  // אירועי-הלוח: skey=מפתח-התומך-המקושר (אירוע כללי ⇒ משותף) — כדי ששם-תורם בלוח
  // לא ידלוף לעובדת אחרת. אירוע ללא-קישור נשאר גלוי לכולן (משותף).
  for (const ev of events) {
    const inner = dek ? await encryptDoc(toPlain(ev), dek) : toPlain(ev);
    ops.push((b) => b.set(doc(db, scopedCol('events'), ev.id), { skey: docSkey('events', ev as unknown as Record<string, unknown>, map), ...(inner as Record<string, unknown>) } as DocumentData));
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
  return supporters.length + events.length;
}

/** אתחול חד-פעמי (idempotent) — קריאה חוזרת מחזירה את אותם singletons. */
export function initCloud(fb: FirebaseOrgConfig): { auth: Auth; db: Firestore } {
  if (app && auth && fsDb) return { auth, db: fsDb };
  app = initializeApp(fb);
  // הגנת-מקור (16.8) — App Check: כשהוגדר firebase.appCheckKey, רק האפליקציה-
  // הרשמית (attestation) מדברת עם ה-Firestore הזה; עותק-מגורר נחסם. דורמנטי בלי מפתח.
  initAppCheck(app, (fb as FirebaseOrgConfig & { appCheckKey?: string }).appCheckKey);
  auth = getAuth(app);
  // מיילי-Auth (איפוס סיסמה, אימות) בשפת המכשיר — דפדפן עברי ⇒ מייל בעברית
  auth.useDeviceLanguage();
  try {
    // התמדה לא-מקוונת + תיאום בין טאבים — Firestore מתזמר תור כתיבות בעצמו
    fsDb = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    /* דפדפן ללא IndexedDB / initializeFirestore כבר נקרא — נמשיך בלי cache מתמיד */
    fsDb = getFirestore(app);
  }
  return { auth, db: fsDb };
}

function requireAuth(): Auth {
  if (!auth) throw new Error('הענן לא אותחל — פנו למנהל המערכת');
  return auth;
}

function requireDb(): Firestore {
  if (!fsDb) throw new Error('הענן לא אותחל — פנו למנהל המערכת');
  return fsDb;
}

/** ה-Firestore המאותחל — ל-cloudConfig (CLOUD2); זורק בעברית כשהענן לא אותחל. */
export function cloudDb(): Firestore {
  return requireDb();
}

/** מיפוי קודי שגיאה של Firebase Auth להודעות בעברית. */
function hebrewAuthError(e: unknown): Error {
  const code = ((e as { code?: string } | null)?.code ?? '').toString();
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new Error('אימייל או סיסמה שגויים');
    case 'auth/network-request-failed':
      return new Error('אין חיבור לאינטרנט — בדקו את החיבור ונסו שוב');
    case 'auth/too-many-requests':
      return new Error('יותר מדי ניסיונות — המתינו מספר דקות ונסו שוב');
    case 'auth/user-disabled':
      return new Error('החשבון הושבת — פנו למנהל המערכת');
    default:
      return new Error('הכניסה נכשלה — נסו שוב');
  }
}

/** מעקב אחר מצב ההתחברות — מחזיר unsubscribe. */
export function watchAuth(cb: (user: CloudUser | null) => void): () => void {
  return onAuthStateChanged(requireAuth(), (u) => {
    cb(u ? { uid: u.uid, email: u.email ?? '' } : null);
  });
}

/** כניסה באימייל+סיסמה — זורק Error עם הודעה בעברית. אין הרשמה עצמית. */
export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(requireAuth(), email, password);
  } catch (e) {
    throw hebrewAuthError(e);
  }
}

/**
 * הרשמה עצמית (CLOUD2 ענן 3) — יוצרת משתמש Auth ומחזירה את ה-uid; המשתמש
 * מחובר אך לא רואה כלום עד שהבעלים מאשר (שער החברות). שגיאות בעברית.
 */
export async function signUp(email: string, password: string): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
    // 🛡️ נחיל-אבטחה 17.8 (ממצא #1 · שלב-1, תוספתי/לא-שובר): שולחים מייל-אימות
    // מיד בהרשמה. כרגע לא-אוכף (אף בדיקת-הרשאה עדיין לא דורשת email_verified) ⇒
    // ביט-זהה למשתמשים הקיימים. זו נקודת-הפתיחה למיגרציה: כשכל החברים אימתו,
    // אפשר לדרוש email_verified ב-Rules (orgManager/superAdmin/allowedRoot) —
    // וזה יסגור את "חטיפת-זהות-מוקדמת של מנהל". שליחה best-effort (כשל-רך).
    void sendEmailVerification(cred.user).catch(() => { /* כשל-שליחה לא מפיל הרשמה */ });
    return cred.user.uid;
  } catch (e) {
    const code = ((e as { code?: string } | null)?.code ?? '').toString();
    if (code === 'auth/email-already-in-use') throw new Error('האימייל כבר רשום — נסו להתחבר או לאפס סיסמה');
    if (code === 'auth/weak-password') throw new Error('הסיסמה חלשה מדי — לפחות 6 תווים');
    if (code === 'auth/invalid-email') throw new Error('כתובת האימייל אינה תקינה');
    if (code === 'auth/operation-not-allowed') throw new Error('ההרשמה סגורה כרגע — פנו למנהל המערכת');
    throw hebrewAuthError(e);
  }
}

export async function signOutCloud(): Promise<void> {
  try {
    await signOut(requireAuth());
  } catch {
    /* ניתוק נכשל (רשת) — מצב ה-auth המקומי יתעדכן בהזדמנות הבאה */
  }
}

/** שליחת מייל איפוס סיסמה — זורק Error בעברית. */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(requireAuth(), email);
  } catch (e) {
    const code = ((e as { code?: string } | null)?.code ?? '').toString();
    if (code === 'auth/user-not-found') throw new Error('לא נמצא משתמש עם האימייל הזה');
    if (code === 'auth/invalid-email') throw new Error('כתובת האימייל אינה תקינה');
    throw hebrewAuthError(e);
  }
}

/**
 * שינוי סיסמה למשתמש מחובר — אימות-מחדש עם הסיסמה הנוכחית (דרישת Firebase
 * ל-recent-login) ואז החלפה. שגיאות בעברית; הסשן נשאר מחובר.
 */
export async function changePassword(currentPass: string, nextPass: string): Promise<void> {
  const u = requireAuth().currentUser;
  if (!u || !u.email) throw new Error('אין משתמש מחובר — התחברו ונסו שוב');
  try {
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, currentPass));
  } catch (e) {
    const code = ((e as { code?: string } | null)?.code ?? '').toString();
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials')
      throw new Error('הסיסמה הנוכחית שגויה');
    throw hebrewAuthError(e);
  }
  try {
    await updatePassword(u, nextPass);
  } catch (e) {
    const code = ((e as { code?: string } | null)?.code ?? '').toString();
    if (code === 'auth/weak-password') throw new Error('הסיסמה החדשה חלשה מדי — לפחות 6 תווים');
    throw hebrewAuthError(e);
  }
}

/** Firestore דוחה undefined — סיבוב JSON מנקה (וגם מנתק הפניות). */
function toPlain(data: unknown): DocumentData {
  return JSON.parse(JSON.stringify(data)) as DocumentData;
}

/**
 * דחיפת diff בכתיבות אצווה — עד 400 פעולות ל-batch (מגבלת Firestore: 500).
 * dek אופציונלי (הצפנת-ענן doc-level): קיים ⇒ כל מסמך מוצפן ל-{enc,iv} לפני
 * הכתיבה; **נעדר ⇒ נתיב plaintext ביט-זהה להיום** (ratchet). ה-id נשאר מפתח-המסמך.
 */
/** מוני-הענן — מונוטוניים בלבד (רצף קבלות-מס). לעולם לא לרדת במסמך ה-meta. */
const META_COUNTER_KEYS = ['seq', 'receiptSeq', 'donationSeq', 'shopReceiptSeq'] as const;

/**
 * כתיבת מסמך ה-meta בטוחה-למונים (🐛 נחיל-עמוק 13.8): כתיבת set() עיוורת דרסה את
 * המונים בענן כשמכשיר עם מונה-מפגר דחף שינוי-meta שאינו-מונה (מרוץ תת-שנייה) ⇒
 * קבלת-מס כפולה. עסקה קוראת את המונים החיים בענן ברגע-הכתיבה ומרימה למקסימום —
 * כך הענן לעולם אינו נסוג. עובד גם לנתיב-המוצפן (פענוח/הצפנה בתוך העסקה).
 */
async function pushMetaCounterSafe(meta: Record<string, unknown>, dek?: CryptoKey | null): Promise<void> {
  const db = requireDb();
  const ref = doc(db, scopedMeta());
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    let existing: Record<string, unknown> | null = null;
    if (snap.exists()) {
      const raw = snap.data();
      existing = dek ? await decryptDoc(raw, dek) : raw;
    }
    const safe: Record<string, unknown> = { ...meta };
    for (const k of META_COUNTER_KEYS) {
      const cur = existing?.[k];
      const nxt = safe[k];
      if (typeof cur === 'number' && (typeof nxt !== 'number' || cur > nxt)) safe[k] = cur;
    }
    const body = dek ? await encryptDoc(safe, dek) : safe;
    tx.set(ref, body as DocumentData);
  });
}

export async function pushDiff(diff: DbDiff, dek?: CryptoKey | null, supKeyBySpId: Map<string, string> = new Map()): Promise<void> {
  const db = requireDb();
  const ops: Array<(b: WriteBatch) => void> = [];
  for (const s of diff.sets) {
    const inner = dek ? await encryptDoc(toPlain(s.data), dek) : toPlain(s.data);
    // אכיפת-נתונים (dormant): מסמך באוסף-נאכף (supporters/events) נושא `skey` plaintext
    // מחוץ למעטפה, כדי ש-Rules ושאילתת-where יבחנו אותו גם בארגון-מוצפן. כבוי ⇒ ביט-זהה.
    const keyed = supEnforceOn && (SUP_KEYED_COLS as readonly string[]).includes(s.col);
    const body = keyed
      ? ({ skey: docSkey(s.col, s.data as Record<string, unknown>, supKeyBySpId), ...(inner as Record<string, unknown>) } as DocumentData)
      : (inner as DocumentData);
    ops.push((b) => b.set(doc(db, scopedCol(s.col), s.id), body));
  }
  for (const d of diff.deletes) {
    ops.push((b) => b.delete(doc(db, scopedCol(d.col), d.id)));
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
  // מסמך ה-meta נכתב בעסקה נפרדת בטוחה-למונים (לא בכתיבת-האצווה העיוורת).
  // אכיפת-נתונים (משטח #3): לוג-הפעולות נושא שמות-תורמים ורוכב על meta המשותף —
  // כשהאכיפה דלוקה מקלפים אותו (הלוג נשאר מקומי). כבוי ⇒ ביט-זהה (רוכב כרגיל).
  const meta = supEnforceOn && diff.meta ? stripAuditMeta(diff.meta) : diff.meta;
  if (meta) await pushMetaCounterSafe(toPlain(meta), dek);
}

/* ============================ הצפנת-ענן — envelope + מיגרציה ============================ */

/**
 * קריאת ה-envelope (ה-DEK העטוף) מ-`_enc/envelope`. **failure-safe:** כל שגיאה
 * (הרשאות ה-Rules לא מתירות `_enc`, רשת, ענן-לא-אותחל) ⇒ null ⇒ הקורא ממשיך
 * בנתיב plaintext כהיום. כך הוספת הבדיקה לזרימת-החיבור **אינה יכולה לשבור את
 * הלקוח החי** גם אם ה-Rules של `_enc` טרם פורסמו. null = אין הצפנה בארגון הזה.
 */
export async function readCloudEnvelope(): Promise<EncEnvelope | null> {
  try {
    const snap = await getDoc(doc(requireDb(), scopedEnv()));
    if (!snap.exists()) return null;
    const d = snap.data();
    // ולידציה רזה — envelope תקין בלבד; פורמט זר ⇒ מתעלמים (null).
    return d && typeof d === 'object' && d.$enc === 2 ? (d as EncEnvelope) : null;
  } catch {
    return null;
  }
}

/** כתיבת ה-envelope (הפעלת הצפנה — פעולת-בעלים). לא failure-safe: כשל = זריקה. */
export async function writeCloudEnvelope(env: EncEnvelope): Promise<void> {
  await setDoc(doc(requireDb(), scopedEnv()), env as unknown as DocumentData);
}

/**
 * מיגרציית-הצפנה חד-פעמית: כותבת מחדש את כל הנתונים (ישויות + meta) מוצפנים,
 * דרך נתיב ה-push הקיים והבדוק (`pushDiff(fullDbDiff(db), dek)` — כל `set` מוצפן
 * ל-{enc,iv}). ‏decryptDoc תואם-לאחור ⇒ מכשיר שקורא באמצע-מיגרציה לא קורס.
 * הבעלים מריץ (כפתור, אחרי גיבוי כפוי) — לא רץ אוטומטית.
 */
export async function encryptExistingCloud(db: Db, dek: CryptoKey): Promise<void> {
  // אכיפת-נתונים: אם דלוקה, גם מיגרציית-ההצפנה שומרת skey על אוספים-נאכפים.
  await pushDiff(fullDbDiff(db), dek, supKeyMapOf(db.supporters));
}

/**
 * משיכת כל הנתונים מהענן והרכבת Db תקין דרך persist.migrate.
 * null = פרויקט ריק (אין מסמך meta/org). ענן קיים אך פגום → זריקה (לא נדרוס).
 */
export async function pullAll(dek?: CryptoKey | null): Promise<Db | null> {
  const db = requireDb();
  const metaSnap = await getDoc(doc(db, scopedMeta()));
  if (!metaSnap.exists()) return null;
  // dek קיים ⇒ פענוח בגבול-הקריאה, לפני migrate/merge (הם נשארים על plaintext).
  const metaData = dek ? await decryptDoc(metaSnap.data(), dek) : metaSnap.data();
  const raw: Record<string, unknown> = { ...metaData, v: DB_VERSION };
  const snaps = await Promise.all(
    ENTITY_COLLECTIONS.map((col) => {
      // אכיפת-נתונים (dormant): עובד/ת מוגבל/ת ⇒ שאילתת אוסף-נאכף (supporters/events)
      // מסוננת ב-skey (Rules דוחים list לא-מסונן). מנהל/בעלים (null) / כבוי ⇒ קריאה מלאה.
      if (supEnforceOn && (SUP_KEYED_COLS as readonly string[]).includes(col) && allowedPurposes) {
        return getDocs(query(collection(db, scopedCol(col)), where('skey', 'in', supAllowedKeys(allowedPurposes))));
      }
      return getDocs(collection(db, scopedCol(col)));
    }),
  );
  for (let i = 0; i < ENTITY_COLLECTIONS.length; i++) {
    const col = ENTITY_COLLECTIONS[i];
    const keyed = (SUP_KEYED_COLS as readonly string[]).includes(col);
    raw[col] = await Promise.all(
      snaps[i].docs.map(async (d) => {
        const data = dek ? await decryptDoc(d.data(), dek) : d.data();
        // קילוף skey (plaintext, לא-מוצפן) רק מאוספים-נאכפים — no-op בשאר.
        return { ...(keyed ? stripSupKey(data as Record<string, unknown>) : data), id: d.id };
      }),
    );
  }
  // מסלול-B: התרומות באוסף-נפרד — קוראים ומרכיבים חזרה לתומכים **לפני migrate**,
  // כדי ש-supporterAggregates (ריפוי-המונים ב-migrate) יראה תרומות מלאות (סיכון-#1).
  if (splitOn) {
    // עובד/ת מוגבל/ת (allowedPurposes) ⇒ שאילתה מסוננת (Rules דוחים list לא-מסוננת);
    // מנהל/בעלים (null) ⇒ קריאה מלאה. 'in' תומך ≤30 ערכים — 29 ייעודים + המשותף.
    const donRef = collection(db, scopedDonations());
    const dsnap = await getDocs(
      allowedPurposes
        ? query(donRef, where('pkey', 'in', donAllowedKeys(allowedPurposes)))
        : donRef,
    );
    const bySup = new Map<string, Donation[]>();
    for (const d of dsnap.docs) {
      const data = (dek ? await decryptDoc(d.data(), dek) : d.data()) as Record<string, unknown>;
      const supporterId = data.supporterId;
      if (typeof supporterId !== 'string') continue;
      const { supporterId: _s, pkey: _p, ...donation } = data; // rid נשמר בתוך ...donation
      void _s; void _p;
      const arr = bySup.get(supporterId) ?? [];
      arr.push(donation as unknown as Donation);
      bySup.set(supporterId, arr);
    }
    const sups = raw.supporters as Array<{ id: string; donations?: Donation[] }> | undefined;
    if (Array.isArray(sups)) for (const sp of sups) sp.donations = bySup.get(sp.id) ?? [];
  }
  const migrated = migrate(raw);
  if (!migrated) throw new Error('נתוני הענן אינם בפורמט מוכר — לא בוצע סנכרון');
  return migrated;
}

export type RemotePartial =
  | { col: string; docs: Array<{ id: string; data: unknown; deleted: boolean }> }
  | { meta: Record<string, unknown> };

/**
 * האזנה חיה לכל האוספים + meta/org. snapshots עם hasPendingWrites (הד מקומי
 * של כתיבות שלנו) מדולגים — רק שינויים שאושרו בשרת מגיעים ל-onRemote.
 */
export function subscribeAll(
  onRemote: (partial: RemotePartial) => void,
  onError?: (e: unknown) => void,
  dek?: CryptoKey | null,
): () => void {
  const db = requireDb();
  // אכיפת-נתונים (dormant): קילוף skey מאוספים-נאכפים; no-op בשאר האוספים.
  const clean = (col: string, data: Record<string, unknown>) =>
    (SUP_KEYED_COLS as readonly string[]).includes(col) ? stripSupKey(data) : data;
  const unsubs = ENTITY_COLLECTIONS.map((col) =>
    onSnapshot(
      // עובד/ת מוגבל/ת ⇒ מנוי אוסף-נאכף מסונן ב-skey (Rules דוחים list לא-מסונן).
      supEnforceOn && (SUP_KEYED_COLS as readonly string[]).includes(col) && allowedPurposes
        ? query(collection(db, scopedCol(col)), where('skey', 'in', supAllowedKeys(allowedPurposes)))
        : collection(db, scopedCol(col)),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        const changes = snap.docChanges();
        if (!changes.length) return;
        // dek נעדר ⇒ נתיב ביט-זהה להיום. קיים ⇒ פענוח לפני onRemote (מחוקים אין מה לפענח).
        if (!dek) {
          onRemote({ col, docs: changes.map((ch) => ({ id: ch.doc.id, data: clean(col, ch.doc.data()), deleted: ch.type === 'removed' })) });
          return;
        }
        void Promise.all(
          changes.map(async (ch) => ({
            id: ch.doc.id,
            data: ch.type === 'removed' ? clean(col, ch.doc.data()) : clean(col, await decryptDoc(ch.doc.data(), dek)),
            deleted: ch.type === 'removed',
          })),
        )
          .then((docs) => onRemote({ col, docs }))
          .catch((e) => onError?.(e));
      },
      (e) => onError?.(e),
    ),
  );
  unsubs.push(
    onSnapshot(
      doc(db, scopedMeta()),
      (snap) => {
        if (snap.metadata.hasPendingWrites || !snap.exists()) return;
        if (!dek) {
          onRemote({ meta: snap.data() });
          return;
        }
        void decryptDoc(snap.data(), dek)
          .then((meta) => onRemote({ meta }))
          .catch((e) => onError?.(e));
      },
      (e) => onError?.(e),
    ),
  );
  return () => {
    for (const u of unsubs) u();
  };
}

/* ─────────── גל ד׳ "עד-השרת" — צד-הלקוח של functions/ (סליקה-מלאה · SMS) ───────────
 * שני האוספים חיים בתחום-הארגון (scopedCol — שורש ללקוח-הקיים, orgs/{slug} לפלטפורמה):
 *   incomingPayments — נכתב ע"י paymentsWebhook (Admin), נקרא/מסומן כאן.
 *   smsOutbox — נכתב כאן ({to,text,status:'pending'}), נשלח ע"י smsOutbox בענן.
 * בלי Functions פרוסות: הרשימה ריקה וההודעות יישארו pending — כשל-רך, אפס נזק. */

/** תשלום-נכנס מחברת-הסליקה — ממתין לאישור-רישום של המזכירה. */
export interface IncomingPayment {
  id: string;
  amount: number;
  name: string;
  phone: string;
  reference: string;
  at: string;
  status: string;
  // שדות-נדרים מועשרים (אופציונליים — רשומות-ותיקות/ספקים-אחרים בלעדיהם):
  currency?: string; // '₪' | '$'
  email?: string;
  zeout?: string; // ת"ז/ח.פ — לשיוך לתומך קיים
  category?: string; // Groupe — ייעוד/קטגוריה
  kevaId?: string; // מזהה הו"ק — חיוב הוראת-קבע
  // שדות-סנכרון (nedarimHistory · additive) — לשיוך-100% ולרישום ב-hist[]:
  toremId?: string; // מזהה-תורם נדרים — מפתח-שיוך חזק
  txnId?: string; // מספר-עסקה ייחודי — דדופ-חיובים
  d?: string; // תאריך-העסקה (ISO) — hist[].d
  receipt?: string; // KabalaId — מספר-קבלת-נדרים (§46) → hist[].receipt
  last4?: string; // 4 ספרות אחרונות → hist[].last4
  kind?: string; // 'refund' (Amount<0) / 'cancel' (Amount 0) — פאזה-מודעת-כסף
}

/** רשומת-תורם מנדרים (staged ב-nedarimDonors) — נקראת לסנכרון-כרטיסים. */
export interface NedarimDonor {
  toremId: string;
  zeout?: string;
  name: string;
  firstName?: string;
  familyName?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  email?: string;
  notes?: string;
}

/** רשימת-התורמים ששוגרה מנדרים (nedarimDonors). אוסף-ריק ⇒ [] (הצלחה); כשל-קריאה
 *  אמיתי (הרשאה/רשת) ⇒ **זורק** — כך ה-caller מבחין בין "אין נתונים" ל"תקלת-חיבור"
 *  (במקום להציג 'הכול מסונכרן' שגוי בזמן תקלה). (תיקון 20.8) */
export async function fetchNedarimDonors(): Promise<NedarimDonor[]> {
  const snap = await getDocs(collection(requireDb(), scopedCol('nedarimDonors')));
  return snap.docs.map((d) => ({ toremId: d.id, ...(d.data() as Omit<NedarimDonor, 'toremId'>) }));
}

/** התשלומים הממתינים ("💰 תשלומים נכנסים"). אוסף-ריק ⇒ [] (הצלחה); כשל-קריאה אמיתי
 *  ⇒ **זורק** (ה-caller מציג 'שגיאת-חיבור' ולא 'אין תשלומים'/'הכול מסונכרן'). */
export async function fetchIncomingPayments(): Promise<IncomingPayment[]> {
  const snap = await getDocs(query(collection(requireDb(), scopedCol('incomingPayments')), where('status', '==', 'pending')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IncomingPayment, 'id'>) }));
}

/** 🔄 משיכת-נדרים **בקליק** (ייעול 20.8) — קורא ל-Function `nedarimPull?full=1` עם
 *  **טוקן-הכניסה** של המשתמש (Authorization: Bearer) במקום סוד-בדפדפן; השרת מאמת
 *  מייל-על/מנהל. מושך תורמים+עסקאות. `pullUrl` = כתובת-הפונקציה מהקונפיג (https בלבד).
 *  זורק בכשל (רשת/הרשאה/שרת). org נגזר מהתחום הנוכחי (שורש⇒'root', אחרת ה-slug). */
export async function pullNedarim(pullUrl: string, opts: { reset?: boolean } = {}): Promise<{ donors?: number; added?: number; pages?: number }> {
  const clean = String(pullUrl || '').trim();
  if (!/^https:\/\//i.test(clean)) throw new Error('כתובת-משיכה לא-תקינה (חייבת https)');
  const user = requireAuth().currentUser;
  if (!user) throw new Error('נדרשת התחברות-ענן');
  const token = await user.getIdToken();
  const org = scope.cloudRoot ? 'root' : scope.slug;
  const u = new URL(clean);
  u.searchParams.set('org', org);
  u.searchParams.set('full', '1');
  if (opts.reset) u.searchParams.set('reset', '1');
  const r = await fetch(u.toString(), { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; donors?: number; added?: number; pages?: number };
  if (!r.ok || j.ok === false) throw new Error(j.error || 'משיכה נכשלה (' + r.status + ')');
  return j;
}

/** 🔄 משיכה-בקליק מסולה (21.8, חיווט-כמו-נדרים) — קורא ל-solaPull עם טוקן-הכניסה
 *  (בלי סוד בדפדפן); ה-xKey יושב בכספת-הענן והפונקציה קוראת אותו בעצמה. */
export async function pullSola(pullUrl: string, opts: { reset?: boolean } = {}): Promise<{ added?: number; scanned?: number; window?: string }> {
  const clean = String(pullUrl || '').trim();
  if (!/^https:\/\//i.test(clean)) throw new Error('כתובת-משיכה לא-תקינה (חייבת https)');
  const user = requireAuth().currentUser;
  if (!user) throw new Error('נדרשת התחברות-ענן');
  const token = await user.getIdToken();
  const org = scope.cloudRoot ? 'root' : scope.slug;
  const u = new URL(clean);
  u.searchParams.set('org', org);
  if (opts.reset) u.searchParams.set('reset', '1');
  const r = await fetch(u.toString(), { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; added?: number; scanned?: number; window?: string };
  if (!r.ok || j.ok === false) throw new Error(j.error || 'משיכה נכשלה (' + r.status + ')');
  return j;
}

/** סימון תשלום-נכנס כ"נרשם" (אחרי שהמזכירה רשמה תרומה/תשלום במערכת). */
export async function markIncomingPayment(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), scopedCol('incomingPayments'), id), {
    status: 'handled',
    handledAt: new Date().toISOString(),
  });
}

/**
 * 🔴 האזנה-חיה לתשלומים-הנכנסים הממתינים — לחיבור-אוטומטי-לייב לכרטיס. כל חיוב
 * חדש שה-webhook כותב מפעיל את ה-callback מיד (event-driven, בלי polling). כשל-רך
 * ⇒ מחזיר no-op-unsub (בלי Firestore/הרשאות). ה-caller מסמן handled אחרי חיבור.
 */
export function watchIncomingPayments(cb: (rows: IncomingPayment[]) => void): () => void {
  try {
    const q = query(collection(requireDb(), scopedCol('incomingPayments')), where('status', '==', 'pending'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IncomingPayment, 'id'>) }))),
      () => {}, // שגיאת-האזנה (אין Rules/הרשאה) ⇒ שקט
    );
  } catch {
    return () => {};
  }
}

/** הכנסת SMS לתור-השליחה (הרחבת sms — נשלח ע"י ה-Function כל דקה). */
export async function writeSmsOutbox(to: string, text: string): Promise<void> {
  await addDoc(collection(requireDb(), scopedCol('smsOutbox')), {
    to,
    text,
    status: 'pending',
    at: new Date().toISOString(),
  });
}

/** הכנסת מייל לתור-השליחה (הרחבת mail, ROADMAP-100 ‏#1 — נשלח ע"י mailOutbox בענן). */
export async function writeMailOutbox(to: string, subject: string, text: string): Promise<void> {
  await addDoc(collection(requireDb(), scopedCol('mailOutbox')), {
    to,
    subject,
    text,
    status: 'pending',
    at: new Date().toISOString(),
  });
}
