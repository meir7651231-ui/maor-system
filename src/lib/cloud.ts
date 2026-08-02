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
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import type { FirebaseOrgConfig } from '../types/config';
import { DB_VERSION, type Db } from '../types/domain';
import { migrate } from '../store/persist';
import { ENTITY_COLLECTIONS, colPath, envPath, fullDbDiff, metaPath, type DbDiff } from './cloud-diff';
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

/** אתחול חד-פעמי (idempotent) — קריאה חוזרת מחזירה את אותם singletons. */
export function initCloud(fb: FirebaseOrgConfig): { auth: Auth; db: Firestore } {
  if (app && auth && fsDb) return { auth, db: fsDb };
  app = initializeApp(fb);
  auth = getAuth(app);
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

/** Firestore דוחה undefined — סיבוב JSON מנקה (וגם מנתק הפניות). */
function toPlain(data: unknown): DocumentData {
  return JSON.parse(JSON.stringify(data)) as DocumentData;
}

/**
 * דחיפת diff בכתיבות אצווה — עד 400 פעולות ל-batch (מגבלת Firestore: 500).
 * dek אופציונלי (הצפנת-ענן doc-level): קיים ⇒ כל מסמך מוצפן ל-{enc,iv} לפני
 * הכתיבה; **נעדר ⇒ נתיב plaintext ביט-זהה להיום** (ratchet). ה-id נשאר מפתח-המסמך.
 */
export async function pushDiff(diff: DbDiff, dek?: CryptoKey | null): Promise<void> {
  const db = requireDb();
  const ops: Array<(b: WriteBatch) => void> = [];
  for (const s of diff.sets) {
    const body = dek ? await encryptDoc(toPlain(s.data), dek) : toPlain(s.data);
    ops.push((b) => b.set(doc(db, scopedCol(s.col), s.id), body));
  }
  for (const d of diff.deletes) {
    ops.push((b) => b.delete(doc(db, scopedCol(d.col), d.id)));
  }
  if (diff.meta) {
    const meta = dek ? await encryptDoc(toPlain(diff.meta), dek) : toPlain(diff.meta);
    ops.push((b) => b.set(doc(db, scopedMeta()), meta));
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
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
  await pushDiff(fullDbDiff(db), dek);
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
    ENTITY_COLLECTIONS.map((col) => getDocs(collection(db, scopedCol(col)))),
  );
  for (let i = 0; i < ENTITY_COLLECTIONS.length; i++) {
    raw[ENTITY_COLLECTIONS[i]] = await Promise.all(
      snaps[i].docs.map(async (d) => ({ ...(dek ? await decryptDoc(d.data(), dek) : d.data()), id: d.id })),
    );
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
  const unsubs = ENTITY_COLLECTIONS.map((col) =>
    onSnapshot(
      collection(db, scopedCol(col)),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        const changes = snap.docChanges();
        if (!changes.length) return;
        // dek נעדר ⇒ נתיב ביט-זהה להיום. קיים ⇒ פענוח לפני onRemote (מחוקים אין מה לפענח).
        if (!dek) {
          onRemote({ col, docs: changes.map((ch) => ({ id: ch.doc.id, data: ch.doc.data(), deleted: ch.type === 'removed' })) });
          return;
        }
        void Promise.all(
          changes.map(async (ch) => ({
            id: ch.doc.id,
            data: ch.type === 'removed' ? ch.doc.data() : await decryptDoc(ch.doc.data(), dek),
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
