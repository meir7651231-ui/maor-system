/**
 * שכבת ההתמדה — חגורה + שלייקס:
 * 1. localStorage — כתיבה מיידית (debounced 500ms) של כל שינוי.
 * 2. IndexedDB — עותק שני + טבעת גיבויים יומיים (30 אחרונים).
 * 3. ייצוא/ייבוא JSON ידני + גיבוי אוטומטי בסוף יום (הורדת קובץ).
 *
 * אין שרת. הנתונים חיים אצל הלקוח — ולכן כל שכבה כאן קריטית.
 */
import { openDB, type IDBPDatabase } from 'idb';
import {
  DB_VERSION,
  emptyDb,
  type CredLogEntry,
  type Db,
  type FamilyCred,
  type FamilyDoc,
} from '../types/domain';
import {
  isEncrypted,
  openDek,
  decryptDb,
  reencryptDb,
  encryptDb,
  rewrapPassword,
  genRecoveryKey,
  type EncEnvelope,
} from '../lib/crypto';

/**
 * מצב ההצפנה מוחזק בזיכרון בלבד: ה-DEK (מפתח הנתונים) והמעטפת הנוכחית.
 * נקבע רק לאחר פענוח מוצלח (unlock/enable). saveDb משתמש בהם כדי לכתוב מוצפן.
 * לעולם לא נשמר לדיסק — סגירת הדפדפן מוחקת אותו, ואז צריך שוב סיסמה.
 */
let dek: CryptoKey | null = null;
let envelope: EncEnvelope | null = null;

/** האם השמירה הנוכחית מוצפנת (יש DEK בזיכרון). */
export function isCryptoActive(): boolean {
  return !!dek && !!envelope;
}
/** ניקוי מצב ההצפנה מהזיכרון (נעילה/התנתקות). */
export function clearCrypto(): void {
  dek = null;
  envelope = null;
}

let LS_KEY = 'maor_db';
let LS_CORRUPT_KEY = 'maor_db_corrupt';
let IDB_NAME = 'maor';
const IDB_STORE = 'db';
const IDB_SNAPSHOTS = 'snapshots';
const SNAPSHOT_KEEP = 30;

/**
 * מרחב-שמות לפי ארגון: כמה לקוחות על אותו host (?org=<slug>) לא חולקים נתונים.
 * חובה לקרוא לפני loadDb (init עושה זאת). slug 'default' שומר על המפתחות הישנים.
 */
export function setPersistNamespace(slug: string): void {
  if (!slug || slug === 'default') return;
  LS_KEY = `maor_db:${slug}`;
  LS_CORRUPT_KEY = `maor_db_corrupt:${slug}`;
  IDB_NAME = `maor:${slug}`;
  idb = null; // חיבור קודם (אם נפתח) מצביע ל-DB הלא נכון
}

let idb: Promise<IDBPDatabase> | null = null;

function getIdb(): Promise<IDBPDatabase> {
  if (!idb) {
    idb = openDB(IDB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore(IDB_STORE);
        d.createObjectStore(IDB_SNAPSHOTS);
      },
    });
  }
  return idb;
}

/** v1 שמר מסמכים כמערך שמות קבצים — ממירים לאובייקטי FamilyDoc. */
function migrateDocs(raw: unknown): FamilyDoc[] {
  if (!Array.isArray(raw)) return [];
  const out: FamilyDoc[] = [];
  raw.forEach((d, i) => {
    if (typeof d === 'string') {
      out.push({ id: 'dx' + i, name: d, addedAt: '' });
    } else if (d && typeof d === 'object') {
      const o = d as Partial<FamilyDoc>;
      out.push({ id: o.id || 'dx' + i, name: o.name ?? '', addedAt: o.addedAt ?? '' });
    }
    // ערכים אחרים (null / מספרים) — נזרקים
  });
  return out;
}

/**
 * ניקוד משפחתי: ב-v1 רשומות הלוג היו {d|date, delta, desc} — ממופות
 * ל-{date, delta, reason}. cred חסר מקבל את ברירת המחדל המקורית (700).
 */
function migrateCred(raw: unknown): FamilyCred {
  const o = (raw && typeof raw === 'object' ? raw : {}) as { score?: unknown; log?: unknown };
  const score = typeof o.score === 'number' && Number.isFinite(o.score) ? o.score : 700;
  const log: CredLogEntry[] = Array.isArray(o.log)
    ? o.log
        .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
        .map((e) => ({
          date: String(e.date ?? e.d ?? ''),
          delta: typeof e.delta === 'number' && Number.isFinite(e.delta) ? e.delta : Number(e.delta) || 0,
          reason: String(e.reason ?? e.desc ?? ''),
        }))
    : [];
  return { score, log };
}

/**
 * מיגרציה מגרסאות קודמות של הסכמה (כולל v1 של האב-טיפוס).
 * v3: נוסף שדה supporter.ayin (מעקב טיפול) — אופציונלי; תומכות קיימות
 * עוברות כמות שהן (ayin נשאר undefined עד השימוש הראשון), אין צורך בטרנספורמציה.
 */
export function migrate(raw: unknown): Db | null {
  if (!raw || typeof raw !== 'object') return null;
  const db = raw as Partial<Db> & { v?: number };
  if (!db.v || db.v > DB_VERSION) return null;
  const base = emptyDb();
  const merged: Db = {
    ...base,
    ...db,
    v: DB_VERSION,
    families: Array.isArray(db.families) ? db.families : [],
    enrollments: Array.isArray(db.enrollments) ? db.enrollments : [],
    courses: Array.isArray(db.courses) ? db.courses : [],
    events: Array.isArray(db.events) ? db.events : [],
    rooms: Array.isArray(db.rooms) ? db.rooms : [],
    teachers: Array.isArray(db.teachers) ? db.teachers : [],
    supporters: Array.isArray(db.supporters) ? db.supporters : [],
    notif: { ...base.notif, ...(db.notif ?? {}) },
    reports: { ...base.reports, ...(db.reports ?? {}) },
    ui: { ...base.ui, ...(db.ui ?? {}) },
    seq: Math.max(db.seq ?? 0, base.seq),
    receiptSeq: db.receiptSeq ?? base.receiptSeq,
    donationSeq: db.donationSeq ?? base.donationSeq,
    security: db.security ?? base.security,
  };
  // גרסאות ישנות מיספרו קבלות מתוך seq המשותף. מזריעים את המונים הרציפים
  // מעל המספר הגבוה ביותר שכבר הונפק, כדי שהמספור הבא יימשך רציף וללא התנגשות.
  const maxRid = (prefix: string, rids: string[]): number =>
    rids.reduce((mx, rid) => {
      const n = rid?.startsWith(prefix) ? parseInt(rid.slice(prefix.length), 10) : NaN;
      return Number.isFinite(n) && n >= mx ? n + 1 : mx;
    }, 0);
  const rNext = maxRid(
    'R-',
    merged.enrollments.flatMap((e) => (Array.isArray(e.payments) ? e.payments.map((p) => p.rid) : [])),
  );
  const dNext = maxRid(
    'D-',
    merged.supporters.flatMap((s) => (Array.isArray(s.donations) ? s.donations.map((d) => d.rid) : [])),
  );
  if (rNext > merged.receiptSeq) merged.receiptSeq = rNext;
  if (dNext > merged.donationSeq) merged.donationSeq = dNext;
  // היגיינה: מזהים חסרים, כפילויות, מערכים חסרים בתוך משפחות
  const seen = new Set<string>();
  // מזהי בני-משפחה חייבים להיות ייחודיים גלובלית: deleteMember מסנן שיבוצים
  // לפי memberId על פני כל ה-DB, ולכן id כפול בין שתי משפחות (מיובא/ממוזג)
  // היה גורם למחיקת בן-משפחה באחת למחוק בטעות את שיבוצי השנייה. משכפלים →
  // מזהה חדש ייחודי (השיבוצים הדו-משמעיים נשארים על ההופעה הראשונה).
  const seenMember = new Set<string>();
  let mSeq = 0;
  const freshMemberId = (): string => {
    let id: string;
    do {
      id = 'mx' + mSeq++;
    } while (seenMember.has(id));
    return id;
  };
  merged.families = merged.families
    .filter(Boolean)
    .map((f, i) => {
      const members = (Array.isArray(f.members) ? f.members : []).map((m, j) => {
        let id = m?.id || 'fm' + i + '_' + j;
        if (seenMember.has(id)) id = freshMemberId();
        seenMember.add(id);
        return { ...m, id };
      });
      return {
        ...f,
        id: f.id || 'fx' + i,
        members,
        docs: migrateDocs(f.docs),
        cred: migrateCred(f.cred),
      };
    })
    .filter((f) => !seen.has(f.id) && !!seen.add(f.id));
  return merged;
}

export interface LoadResult {
  db: Db;
  corrupt: boolean;
  /** השמירה מוצפנת — נדרש קוד לפני שאפשר לפענח (db יהיה ריק עד decryptAndLoad). */
  encrypted?: boolean;
}

/** קורא את הערך הגולמי (מפוענח-JSON) מ-localStorage ואז מ-IndexedDB. */
async function readRaw(): Promise<unknown> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* חסום או JSON פגום — ננסה IndexedDB */
  }
  try {
    return await (await getIdb()).get(IDB_STORE, 'current');
  } catch {
    return null;
  }
}

/** טעינה: localStorage תחילה, נפילה ל-IndexedDB, ואז DB ריק. מזהה מעטפת מוצפנת. */
export async function loadDb(): Promise<LoadResult> {
  const raw = await readRaw();
  if (isEncrypted(raw)) {
    // מוצפן — לא מפענחים כאן (אין קוד). מחזירים דגל; App יבקש קוד.
    envelope = raw;
    return { db: emptyDb(), corrupt: false, encrypted: true };
  }
  const parsed = migrate(raw);
  if (parsed) return { db: parsed, corrupt: false };
  // לא-null אך לא תקין → פגום; שומרים עותק אם אפשר
  if (raw) {
    try {
      localStorage.setItem(LS_CORRUPT_KEY, JSON.stringify(raw));
    } catch {
      /* אין מקום */
    }
    return { db: emptyDb(), corrupt: true };
  }
  return { db: emptyDb(), corrupt: false };
}

/**
 * פענוח השמירה המוצפנת בעזרת קוד (סיסמה) או מפתח שחזור.
 * מצליח → קובע DEK+מעטפת בזיכרון ומחזיר את ה-Db. נכשל → null (קוד שגוי).
 */
export async function decryptAndLoad(secret: string, via: 'pass' | 'rec'): Promise<Db | null> {
  if (!envelope) return null;
  const key = await openDek(envelope, secret, via);
  if (!key) return null;
  try {
    const json = await decryptDb(envelope, key);
    const parsed = migrate(JSON.parse(json));
    if (!parsed) return null;
    dek = key;
    return parsed;
  } catch {
    return null;
  }
}

/** הפעלת הצפנה על DB קיים — מייצר מעטפת + מפתח שחזור, כותב, ומחזיר את המפתח. */
export async function beginEncryption(db: Db, password: string): Promise<string> {
  const recoveryKey = genRecoveryKey();
  const env = await encryptDb(JSON.stringify({ ...db, savedAt: new Date().toISOString() }), password, recoveryKey);
  const key = await openDek(env, password, 'pass');
  if (!key) throw new Error('כשל בהפעלת ההצפנה');
  dek = key;
  envelope = env;
  await writeEnvelope(env);
  return recoveryKey;
}

/** כיבוי הצפנה — כותב את ה-DB כטקסט גלוי ומנקה את מצב ההצפנה. */
export async function stopEncryption(db: Db): Promise<void> {
  dek = null;
  envelope = null;
  await saveDb(db); // נכתב גלוי (אין DEK)
  try {
    // ודא שהעותק המוצפן הישן לא נשאר ב-IndexedDB
    await (await getIdb()).put(IDB_STORE, { ...db, savedAt: new Date().toISOString() }, 'current');
  } catch {
    /* לא קריטי */
  }
}

/** החלפת סיסמה — מאמת ישן, עוטף מחדש את ה-DEK בסיסמה חדשה. false = ישן שגוי. */
export async function changeEncryptionPassword(oldPw: string, newPw: string): Promise<boolean> {
  if (!envelope || !dek) return false;
  const check = await openDek(envelope, oldPw, 'pass');
  if (!check) return false;
  envelope = await rewrapPassword(envelope, dek, newPw);
  await writeEnvelope(envelope);
  return true;
}

/** כתיבת מעטפת מוצפנת לשתי השכבות. */
async function writeEnvelope(env: EncEnvelope): Promise<void> {
  const json = JSON.stringify(env);
  try {
    localStorage.setItem(LS_KEY, json);
  } catch {
    /* מכסה מלאה */
  }
  try {
    await (await getIdb()).put(IDB_STORE, env, 'current');
  } catch {
    /* IndexedDB נכשל */
  }
}

/** שמירה לשתי השכבות. מחזיר false אם שתיהן נכשלו. מצפין אם ההצפנה פעילה. */
export async function saveDb(db: Db): Promise<boolean> {
  const doc: Db = { ...db, savedAt: new Date().toISOString() };
  const json = JSON.stringify(doc);
  // הצפנה פעילה → כותבים מעטפת מוצפנת (אותו DEK, data מעודכן)
  const payload: string = dek && envelope ? JSON.stringify((envelope = await reencryptDb(envelope, dek, json))) : json;
  const idbValue: unknown = dek && envelope ? envelope : doc;
  let ok = false;
  try {
    localStorage.setItem(LS_KEY, payload);
    ok = true;
  } catch {
    /* מכסה מלאה / מצב פרטי */
  }
  try {
    await (await getIdb()).put(IDB_STORE, idbValue, 'current');
    ok = true;
  } catch {
    /* IndexedDB נכשל */
  }
  return ok;
}

/** צילום יומי ל-IndexedDB — טבעת של SNAPSHOT_KEEP ימים. מוצפן אם ההצפנה פעילה. */
export async function dailySnapshot(db: Db): Promise<void> {
  try {
    const d = await getIdb();
    const key = new Date().toISOString().slice(0, 10);
    const doc = { ...db, savedAt: new Date().toISOString() };
    // הצפנה פעילה → הצילום נשמר מוצפן, אחרת נדלוף נתונים גלויים ב-IndexedDB
    const value: unknown = dek && envelope ? await reencryptDb(envelope, dek, JSON.stringify(doc)) : doc;
    await d.put(IDB_SNAPSHOTS, value, key);
    const keys = (await d.getAllKeys(IDB_SNAPSHOTS)).sort();
    while (keys.length > SNAPSHOT_KEEP) {
      await d.delete(IDB_SNAPSHOTS, keys.shift()!);
    }
  } catch {
    /* לא קריטי — יש עוד שכבות */
  }
}

export async function listSnapshots(): Promise<string[]> {
  try {
    const d = await getIdb();
    return (await d.getAllKeys(IDB_SNAPSHOTS)).map(String).sort().reverse();
  } catch {
    return [];
  }
}

export async function loadSnapshot(key: string): Promise<Db | null> {
  try {
    const raw = await (await getIdb()).get(IDB_SNAPSHOTS, key);
    // צילום מוצפן — מפענחים עם ה-DEK הפעיל (המשתמש כבר מחובר)
    if (isEncrypted(raw)) {
      if (!dek) return null;
      return migrate(JSON.parse(await decryptDb(raw, dek)));
    }
    return migrate(raw);
  } catch {
    return null;
  }
}

/** ייצוא קובץ גיבוי JSON (הורדה בדפדפן). מוצפן אם ההצפנה פעילה. */
export async function exportBackupFile(db: Db): Promise<void> {
  const doc = { ...db, savedAt: new Date().toISOString() };
  // הצפנה פעילה → הגיבוי יורד מוצפן (שחזור ידרוש סיסמה/מפתח שחזור)
  const content =
    dek && envelope
      ? JSON.stringify((envelope = await reencryptDb(envelope, dek, JSON.stringify(doc))), null, 1)
      : JSON.stringify(doc, null, 1);
  const blob = new Blob([content], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const enc = dek ? '-encrypted' : '';
  a.download = `maor-backup${enc}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** האם טקסט הגיבוי הוא מעטפת מוצפנת (שחזורו דורש סיסמה/מפתח שחזור). */
export function isEncryptedBackup(text: string): boolean {
  try {
    return isEncrypted(JSON.parse(text));
  } catch {
    return false;
  }
}

/** ייבוא קובץ גיבוי גלוי — מחזיר DB תקין או זורק שגיאה בעברית. */
export function parseBackupFile(text: string): Db {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('הקובץ אינו JSON תקין');
  }
  if (isEncrypted(raw)) {
    throw new Error('זהו קובץ גיבוי מוצפן — יש לשחזר אותו דרך "שחזור גיבוי מוצפן" עם הסיסמה או מפתח השחזור');
  }
  const db = migrate(raw);
  if (!db) throw new Error('הקובץ אינו קובץ גיבוי של מאור החסד (או גרסה חדשה מדי)');
  return db;
}

/** ייבוא קובץ גיבוי מוצפן עם סיסמה/מפתח שחזור. null = קוד שגוי / קובץ פגום. */
export async function decryptBackupFile(text: string, secret: string, via: 'pass' | 'rec'): Promise<Db | null> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isEncrypted(raw)) return null;
  const key = await openDek(raw, secret, via);
  if (!key) return null;
  try {
    return migrate(JSON.parse(await decryptDb(raw, key)));
  } catch {
    return null;
  }
}
