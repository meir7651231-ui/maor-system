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
}

/** טעינה: localStorage תחילה, נפילה ל-IndexedDB, ואז DB ריק. */
export async function loadDb(): Promise<LoadResult> {
  let corrupt = false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = migrate(JSON.parse(raw));
        if (parsed) return { db: parsed, corrupt };
        corrupt = true;
        localStorage.setItem(LS_CORRUPT_KEY, raw);
      } catch {
        corrupt = true;
        try {
          localStorage.setItem(LS_CORRUPT_KEY, raw);
        } catch {
          /* אין מקום — נוותר על שימור העותק הפגום */
        }
      }
    }
  } catch {
    /* localStorage חסום (מצב פרטי) — ננסה IndexedDB */
  }
  try {
    const fromIdb = migrate(await (await getIdb()).get(IDB_STORE, 'current'));
    if (fromIdb) return { db: fromIdb, corrupt };
  } catch {
    /* IndexedDB לא זמין */
  }
  return { db: emptyDb(), corrupt };
}

/** שמירה לשתי השכבות. מחזיר false אם שתיהן נכשלו. */
export async function saveDb(db: Db): Promise<boolean> {
  const doc: Db = { ...db, savedAt: new Date().toISOString() };
  const json = JSON.stringify(doc);
  let ok = false;
  try {
    localStorage.setItem(LS_KEY, json);
    ok = true;
  } catch {
    /* מכסה מלאה / מצב פרטי */
  }
  try {
    await (await getIdb()).put(IDB_STORE, doc, 'current');
    ok = true;
  } catch {
    /* IndexedDB נכשל */
  }
  return ok;
}

/** צילום יומי ל-IndexedDB — טבעת של SNAPSHOT_KEEP ימים. */
export async function dailySnapshot(db: Db): Promise<void> {
  try {
    const d = await getIdb();
    const key = new Date().toISOString().slice(0, 10);
    await d.put(IDB_SNAPSHOTS, { ...db, savedAt: new Date().toISOString() }, key);
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
    return migrate(await (await getIdb()).get(IDB_SNAPSHOTS, key));
  } catch {
    return null;
  }
}

/** ייצוא קובץ גיבוי JSON (הורדה בדפדפן). */
export function exportBackupFile(db: Db): void {
  const blob = new Blob([JSON.stringify({ ...db, savedAt: new Date().toISOString() }, null, 1)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `maor-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** ייבוא קובץ גיבוי — מחזיר DB תקין או זורק שגיאה בעברית. */
export function parseBackupFile(text: string): Db {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('הקובץ אינו JSON תקין');
  }
  const db = migrate(raw);
  if (!db) throw new Error('הקובץ אינו קובץ גיבוי של מאור החסד (או גרסה חדשה מדי)');
  return db;
}
