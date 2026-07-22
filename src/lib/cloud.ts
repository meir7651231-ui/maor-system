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
  writeBatch,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import type { FirebaseOrgConfig } from '../types/config';
import { DB_VERSION, type Db } from '../types/domain';
import { migrate } from '../store/persist';
import { ENTITY_COLLECTIONS, type DbDiff } from './cloud-diff';

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

/** דחיפת diff בכתיבות אצווה — עד 400 פעולות ל-batch (מגבלת Firestore: 500). */
export async function pushDiff(diff: DbDiff): Promise<void> {
  const db = requireDb();
  const ops: Array<(b: WriteBatch) => void> = [];
  for (const s of diff.sets) {
    ops.push((b) => b.set(doc(db, s.col, s.id), toPlain(s.data)));
  }
  for (const d of diff.deletes) {
    ops.push((b) => b.delete(doc(db, d.col, d.id)));
  }
  if (diff.meta) {
    const meta = diff.meta;
    ops.push((b) => b.set(doc(db, 'meta', 'org'), toPlain(meta)));
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
}

/**
 * משיכת כל הנתונים מהענן והרכבת Db תקין דרך persist.migrate.
 * null = פרויקט ריק (אין מסמך meta/org). ענן קיים אך פגום → זריקה (לא נדרוס).
 */
export async function pullAll(): Promise<Db | null> {
  const db = requireDb();
  const metaSnap = await getDoc(doc(db, 'meta', 'org'));
  if (!metaSnap.exists()) return null;
  const raw: Record<string, unknown> = { ...metaSnap.data(), v: DB_VERSION };
  const snaps = await Promise.all(
    ENTITY_COLLECTIONS.map((col) => getDocs(collection(db, col))),
  );
  ENTITY_COLLECTIONS.forEach((col, i) => {
    raw[col] = snaps[i].docs.map((d) => ({ ...d.data(), id: d.id }));
  });
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
): () => void {
  const db = requireDb();
  const unsubs = ENTITY_COLLECTIONS.map((col) =>
    onSnapshot(
      collection(db, col),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        const docs = snap
          .docChanges()
          .map((ch) => ({ id: ch.doc.id, data: ch.doc.data(), deleted: ch.type === 'removed' }));
        if (docs.length) onRemote({ col, docs });
      },
      (e) => onError?.(e),
    ),
  );
  unsubs.push(
    onSnapshot(
      doc(db, 'meta', 'org'),
      (snap) => {
        if (snap.metadata.hasPendingWrites || !snap.exists()) return;
        onRemote({ meta: snap.data() });
      },
      (e) => onError?.(e),
    ),
  );
  return () => {
    for (const u of unsubs) u();
  };
}
