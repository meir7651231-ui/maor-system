/**
 * ⚠️ ratchet — ביקורת ביצועי-ההתמדה (12.10.2026): שער-המעטפת בין טאבים **במשטר-IDB-בלבד**.
 *
 * הבאג (נחשף בביקורת-עומק של חבילת-הביצועים): אחרי ש-readStoredEnvelope הפסיק לקרוא את המסמך
 * מה-IDB (34MB structured-clone לפני כל put), במשטר-המכסה (המסמך לא נכנס ל-LS — הלקוח האמיתי,
 * 16,000 תורמים) הוא החזיר את מעטפת-הזיכרון של הטאב **עצמו** ⇒ saveDb השווה אותה לעצמה:
 *  • טאב אחר החליף סיסמה ⇒ הטאב הזה דרס את העטיפה החדשה בישנה (אחרי רענון רק הסיסמה הישנה פתחה);
 *  • טאב אחר הצפין-מחדש עם DEK אחר ⇒ נדרס במקום false;
 *  • טאב גלוי שלא ראה מעטפת ⇒ כתב טקסט-גלוי על המעטפת.
 * התיקון: כותרת-מעטפת זעירה ב-IDB (מפתח 'enc', באותה טרנזקציה עם 'current') — בייטים, לא המסמך.
 * ה-IDB כאן: מוק-בזיכרון עם transaction (כמו idb).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import { isEncrypted, openDek, rewrapPassword, encryptDb, genRecoveryKey, type EncEnvelope } from '../../lib/crypto';

const { stores, st } = vi.hoisted(() => {
  const stores = new Map<string, Map<string, unknown>>();
  const st = (n: string) => { if (!stores.has(n)) stores.set(n, new Map()); return stores.get(n)!; };
  return { stores, st };
});
vi.mock('idb', () => ({
  openDB: async () => ({
    get: async (s: string, k: string) => structuredClone(st(s).get(k)),
    put: async (s: string, v: unknown, k: string) => { st(s).set(k, structuredClone(v)); },
    delete: async (s: string, k: string) => { st(s).delete(k); },
    getAllKeys: async (s: string) => [...st(s).keys()],
    transaction: (s: string) => ({
      store: {
        put: async (v: unknown, k: string) => { st(s).set(k, structuredClone(v)); },
        delete: async (k: string) => { st(s).delete(k); },
      },
      done: Promise.resolve(),
    }),
  }),
}));

class MemStorage {
  m = new Map<string, string>();
  quotaKeys = new Set<string>();
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string): void {
    if (this.quotaKeys.has(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
    this.m.set(k, String(v));
  }
  removeItem(k: string): void { this.m.delete(k); }
  clear(): void { this.m.clear(); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
}
const ls = new MemStorage();
(globalThis as unknown as { localStorage: MemStorage }).localStorage = ls;

const P = await import('../persist');
const seed = (over: Partial<Db> = {}): Db => ({ ...emptyDb(), orgName: 'עמותת ענק', ...over });
const header = (env: EncEnvelope): EncEnvelope => ({ ...env, data: '' });

beforeEach(() => {
  ls.clear(); ls.quotaKeys.clear();
  stores.clear();
  P.clearCrypto();
  P.setPersistNamespace('x'); P.setPersistNamespace('default'); // איפוס משטר-המכסה
});

describe('🔐 שער-המעטפת בין טאבים כשהמסמך לא נכנס ל-LS (משטר-IDB-בלבד)', () => {
  it('טאב אחר החליף סיסמה (IDB בלבד) ⇒ השמירה כאן מאמצת את העטיפה החדשה — הסיסמה החדשה פותחת', async () => {
    ls.quotaKeys.add('maor_db');
    await P.beginEncryption(seed(), 'old-pw'); // טאב A
    expect(st('db').has('enc')).toBe(true); // הכותרת נכתבה עם המעטפת
    P.clearCrypto(); // טאב B
    expect((await P.loadDb()).encrypted).toBe(true);
    expect(await P.decryptAndLoad('old-pw', 'pass')).not.toBeNull();
    expect(await P.saveDb(seed({ orgName: 'B-1' }))).toBe(true);
    expect(P.isLsDropped()).toBe(true);
    // טאב A מחליף סיסמה — writeEnvelope שם: מעטפת + כותרת
    const storedA = st('db').get('current') as EncEnvelope;
    const dekA = (await openDek(storedA, 'old-pw', 'pass'))!;
    const rewrapped = await rewrapPassword(storedA, dekA, 'new-pw');
    st('db').set('current', structuredClone(rewrapped));
    st('db').set('enc', structuredClone(header(rewrapped)));
    // טאב B שומר עריכה
    expect(await P.saveDb(seed({ orgName: 'B-2' }))).toBe(true);
    const after = st('db').get('current') as EncEnvelope;
    expect(isEncrypted(after)).toBe(true);
    expect(await openDek(after, 'new-pw', 'pass')).not.toBeNull();
    expect(await openDek(after, 'old-pw', 'pass')).toBeNull();
    expect((st('db').get('enc') as EncEnvelope).wrapPass).toBe(after.wrapPass); // הכותרת עוקבת
  }, 90_000);

  it('טאב אחר הצפין-מחדש עם DEK אחר ⇒ false, המעטפת שלו לא נדרסת', async () => {
    ls.quotaKeys.add('maor_db');
    await P.beginEncryption(seed(), 'old-pw');
    P.clearCrypto();
    await P.loadDb();
    expect(await P.decryptAndLoad('old-pw', 'pass')).not.toBeNull();
    expect(await P.saveDb(seed({ orgName: 'B-1' }))).toBe(true);
    const envA2 = await encryptDb(JSON.stringify(seed({ orgName: 'A-fresh' })), 'other-pw', genRecoveryKey());
    st('db').set('current', structuredClone(envA2));
    st('db').set('enc', structuredClone(header(envA2)));
    expect(await P.saveDb(seed({ orgName: 'B-2' }))).toBe(false);
    expect((st('db').get('current') as EncEnvelope).wrapRec).toBe(envA2.wrapRec);
  }, 90_000);

  it('טאב גלוי (לא ראה מעטפת) מול הצפנה שהופעלה בטאב אחר ⇒ false — לא כותב טקסט-גלוי על המעטפת', async () => {
    ls.quotaKeys.add('maor_db');
    await P.loadDb(); // טאב B גלוי
    expect(await P.saveDb(seed({ orgName: 'B-1' }))).toBe(true);
    expect(P.isLsDropped()).toBe(true);
    expect(st('db').has('enc')).toBe(false); // גלוי ⇒ אין כותרת
    // טאב A הפעיל הצפנה (writeEnvelope שם: מעטפת + כותרת)
    const envA = await encryptDb(JSON.stringify(seed({ orgName: 'A-enc' })), 'pw', genRecoveryKey());
    st('db').set('current', structuredClone(envA));
    st('db').set('enc', structuredClone(header(envA)));
    expect(await P.saveDb(seed({ orgName: 'B-2' }))).toBe(false);
    expect(isEncrypted(st('db').get('current'))).toBe(true);
    expect(ls.getItem('maor_db')).toBeNull();
  }, 60_000);

  it('הכותרת חיה עם המסמך: כיבוי-הצפנה מוחק אותה; שמירה מוצפנת כותבת אותה (אותו wrapRec, בלי data)', async () => {
    await P.beginEncryption(seed(), 'pw');
    const h = st('db').get('enc') as EncEnvelope;
    expect(isEncrypted(h)).toBe(true);
    expect(h.data).toBe('');
    expect(h.wrapRec).toBe((st('db').get('current') as EncEnvelope).wrapRec);
    expect(JSON.stringify(h).length).toBeLessThan(2_000); // בייטים, לא המסמך
    await P.stopEncryption(seed({ orgName: 'גלוי-שוב' }));
    expect(st('db').has('enc')).toBe(false);
    expect(isEncrypted(st('db').get('current'))).toBe(false);
    // ואחרי הכיבוי — שמירה גלויה רגילה עוברת (אין כותרת-מיותמת שתוקעת ב-false)
    expect(await P.saveDb(seed({ orgName: 'גלוי-3' }))).toBe(true);
  }, 90_000);
});

describe('⚡ משטר-המכסה כש-IDB עובד — הרווח הנמדד נשמר', () => {
  it('QuotaExceeded פעם אחת ⇒ מהשמירה השנייה אפס setItem ואפס get של המסמך (רק כותרת-המעטפת)', async () => {
    ls.quotaKeys.add('maor_db');
    const sets: string[] = [];
    const gets: string[] = [];
    const origSet = ls.setItem.bind(ls);
    ls.setItem = (k: string, v: string) => { sets.push(k); origSet(k, v); };
    const dbStore = st('db');
    const origGet = dbStore.get.bind(dbStore);
    dbStore.get = (k: string) => { gets.push(k); return origGet(k); };
    await P.loadDb();
    expect(await P.saveDb(seed())).toBe(true);
    expect(sets.filter((k) => k === 'maor_db')).toHaveLength(1); // הניסיון הראשון — כמו היום
    expect(P.isLsDropped()).toBe(true);
    gets.length = 0;
    expect(await P.saveDb(seed({ orgName: 'שנייה' }))).toBe(true);
    expect(await P.saveDb(seed({ orgName: 'שלישית' }))).toBe(true);
    expect(sets.filter((k) => k === 'maor_db')).toHaveLength(1); // לא ניסינו שוב (IDB הצליח)
    expect(gets).toEqual(['enc', 'enc']); // כותרת-המעטפת בלבד — לא 'current' (34MB)
    expect((st('db').get('current') as Db).orgName).toBe('שלישית');
  });
});

describe('🩹 ריפוי-בטעינה נשמר (takeMigrateHealed) — מספר-קבלה שהוצג חייב להיות עמיד', () => {
  const dup = (): Db => ({
    ...seed(),
    donationSeq: 2,
    supporters: [
      { id: 's1', name: 'א', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 1, ils: 12345, usd: 0, first: '2025-01-01', last: '2025-01-01', nextDate: '', donations: [{ rid: 'D-1', date: '2025-01-01', amount: 100, cur: '₪', cat: 'כללי' }] },
      { id: 's2', name: 'ב', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 1, ils: 50, usd: 0, first: '2025-02-01', last: '2025-02-01', nextDate: '', donations: [{ rid: 'D-1', date: '2025-02-01', amount: 50, cur: '₪', cat: 'כללי' }] },
    ] as Db['supporters'],
  });

  it('מסמך עם D-1 כפול + מצבר שגוי ⇒ healed=true (פעם אחת); מסמך נקי ⇒ false', async () => {
    ls.setItem('maor_db', JSON.stringify(dup()));
    const res = await P.loadDb();
    expect(res.db.supporters.map((s) => s.donations[0].rid)).toEqual(['D-1', 'D-2']);
    expect(res.db.supporters[0].ils).toBe(100);
    expect(P.takeMigrateHealed()).toBe(true);
    expect(P.takeMigrateHealed()).toBe(false); // נצרך
    // טעינה חוזרת של המסמך המרופא — נקי ⇒ אפס שמירה (הרווח של טעינה-נקייה נשמר)
    ls.setItem('maor_db', JSON.stringify(res.db));
    await P.loadDb();
    expect(P.takeMigrateHealed()).toBe(false);
  });

  it('גם דרך decryptAndLoad (ארגון מוצפן)', async () => {
    await P.beginEncryption(dup(), 'pw');
    P.clearCrypto();
    await P.loadDb();
    P.takeMigrateHealed(); // דגל-הטעינה (המעטפת לא עברה migrate)
    const db = await P.decryptAndLoad('pw', 'pass');
    expect(db?.supporters.map((s) => s.donations[0].rid)).toEqual(['D-1', 'D-2']);
    expect(P.takeMigrateHealed()).toBe(true);
  }, 60_000);
});

describe('🧷 הגנת-מקור — החיווט ב-store ובצילום-היומי', () => {
  it('init/decryptUnlock מתזמנים שמירה אחת כש-migrate ריפא; הצילום-היומי ב-idle בלי תנאי-גלוי', async () => {
    const useAppSrc = (await import('../useApp.ts?raw')).default as string;
    const persistSrc = (await import('../persist.ts?raw')).default as string;
    expect(useAppSrc.split('if (takeMigrateHealed()) { lastSaved = null; scheduleSave(); }').length).toBe(3);
    expect(persistSrc).toContain('runWhenIdle(() => void dailySnapshot(getDb()), 10_000);');
    expect(persistSrc).toMatch(/export function runWhenIdle\(fn[^{]*\{(?:(?!visibilityState)[\s\S])*?\n\}/);
  });

  it('scheduleDailySnapshot בטאב מוסתר ⇒ מתוזמן מיד ב-rIC (לא ממתין ל-visible)', () => {
    const g = globalThis as unknown as Record<string, unknown>;
    let cb: (() => void) | null = null;
    g.window = { requestIdleCallback: (f: () => void) => { cb = f; return 1; } };
    g.document = { visibilityState: 'hidden', addEventListener: vi.fn(), removeEventListener: () => {} };
    try {
      const getDb = vi.fn(() => emptyDb());
      P.scheduleDailySnapshot(getDb);
      expect(cb).not.toBeNull();
      expect((g.document as { addEventListener: ReturnType<typeof vi.fn> }).addEventListener).not.toHaveBeenCalled();
      cb!();
      expect(getDb).toHaveBeenCalledTimes(1);
    } finally {
      delete g.window; delete g.document;
    }
  });
});
