/**
 * ratchet — ביקורת-עוינת על #529 (7.11.2026): שלושה פגמים ביומן-העריכה, כל אחד נכשל לפני ועובר אחרי.
 *  1. מחיקה אחרי שמירה-בטיסה "קמה" בטעינה (היומן חושב מול בסיס ישן שלא בוסס-מחדש).
 *  2. מפתח-יומן משותף ללשוניות — לשונית א' שמרה ומחקה את היומן של ב' ⇒ עריכת ב' אבדה.
 *  3. יומן גלוי (PII) נשאר ב-localStorage אחרי הפעלת-הצפנה.
 * לשונית = מופע-מודול נפרד של persist (vi.resetModules) על אותו localStorage/IDB-מדומה; המסמך "גדול מ-LS".
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';

const { st, clearAll } = vi.hoisted(() => {
  const stores = new Map<string, Map<string, unknown>>();
  const st = (n: string) => { if (!stores.has(n)) stores.set(n, new Map()); return stores.get(n)!; };
  return { st, clearAll: () => stores.clear() };
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
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string): void {
    if (k === 'maor_db') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } // המסמך גדול מ-LS
    this.m.set(k, String(v));
  }
  removeItem(k: string): void { this.m.delete(k); }
  clear(): void { this.m.clear(); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
}
const ls = new MemStorage();
(globalThis as unknown as { localStorage: MemStorage }).localStorage = ls;

type P = typeof import('../persist');
async function tab(): Promise<P> {
  vi.resetModules();
  const P = await import('../persist');
  P.setPersistNamespace('x');
  P.setPersistNamespace('default');
  return P;
}
const sup = (id: string, note = '') => ({ id, name: 'ת ' + id, nextNote: note, donations: [], count: 0, ils: 0, usd: 0 }) as unknown as Db['supporters'][number];
function seedStored(): void {
  const db = { ...emptyDb(), supporters: [sup('s1'), sup('s2')], savedAt: '2026-11-07T10:00:00.000Z' };
  st('db').set('current', structuredClone(db));
}
const ids = (db: Db) => db.supporters.map((s) => s.id).sort();
const note = (db: Db, id: string) => db.supporters.find((s) => s.id === id)?.nextNote;

beforeEach(() => { ls.clear(); clearAll(); seedStored(); });

describe('🛟 #529 ביקורת — 1. מחיקה אחרי שמירה-בטיסה לא קמה לתחייה', () => {
  it('הוספת x1 ⇒ שמירה בטיסה ⇒ מחיקת x1 ⇒ השמירה מסתיימת ⇒ סגירה ⇒ בטעינה x1 לא קיים', async () => {
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    const t1 = { ...d0, supporters: [...d0.supporters, sup('x1')] };
    A.writeExitJournal(t1); // ברגע-העריכה
    const s1 = A.saveDb(t1); // S1 בטיסה
    const t3 = { ...t1, supporters: t1.supporters.filter((s) => s.id !== 'x1') }; // המשתמש מוחק x1
    A.writeExitJournal(t3);
    await s1; // S1 מסתיימת (מכילה x1) — ולפני S2 הלשונית נסגרת
    const C = await tab();
    const re = (await C.loadDb()).db;
    expect(ids(re)).toEqual(['s1', 's2']);
  });
  it('עריכה שבוטלה אחרי שמירה-בטיסה לא חוזרת לערך שנשמר בטיסה', async () => {
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    const t1 = { ...d0, supporters: [sup('s1', 'טיוטה'), d0.supporters[1]] };
    A.writeExitJournal(t1);
    const s1 = A.saveDb(t1);
    const t3 = { ...t1, supporters: [sup('s1', ''), t1.supporters[1]] }; // ביטול
    A.writeExitJournal(t3);
    await s1;
    const re = (await (await tab()).loadDb()).db;
    expect(note(re, 's1')).toBe('');
  });
});

describe('🛟 #529 ביקורת — 2. יומן פר-לשונית', () => {
  it('א\' וב\' עורכות; א\' שומרת; ב\' נסגרת בלי שמירה ⇒ עריכת ב\' נשמרת בטעינה (וגם של א\')', async () => {
    const A = await tab();
    const dA = (await A.loadDb()).db;
    const B = await tab();
    const dB = (await B.loadDb()).db;
    const a1 = { ...dA, supporters: [sup('s1', 'A'), dA.supporters[1]] };
    A.writeExitJournal(a1);
    const b1 = { ...dB, supporters: [dB.supporters[0], sup('s2', 'B')] };
    B.writeExitJournal(b1);
    await A.saveDb(a1); // א' שומרת (מוחקת רק את היומן שלה)
    const re = (await (await tab()).loadDb()).db;
    expect(note(re, 's1')).toBe('A');
    expect(note(re, 's2')).toBe('B');
  });
  it('יומן של לשונית-ישנה לא מגלגל אחורה מצבות/מונים של אחרת (meta ממוזג)', async () => {
    const A = await tab();
    const dA = (await A.loadDb()).db;
    const B = await tab();
    const dB = (await B.loadDb()).db;
    const a1 = { ...dA, donationSeq: 50, delLog: [{ at: '2026-11-07T11:00:00.000Z', col: 'supporters', id: 'gone' }] };
    await A.saveDb(a1);
    const b1 = { ...dB, supporters: [dB.supporters[0], sup('s2', 'B')], donationSeq: 3, orgName: 'B-org' };
    B.writeExitJournal(b1);
    const re = (await (await tab()).loadDb()).db;
    expect(re.donationSeq).toBe(50);
    expect((re.delLog ?? []).some((e) => e.id === 'gone')).toBe(true);
    expect(note(re, 's2')).toBe('B');
  });
});

describe('🛟 #529 ביקורת — 3. אין יומן גלוי אחרי הפעלת-הצפנה', () => {
  it('יומן קיים ⇒ beginEncryption ⇒ אף מפתח-יומן לא נשאר ב-localStorage', async () => {
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    A.writeExitJournal({ ...d0, supporters: [sup('s1', 'ת"ז 012345678'), d0.supporters[1]] });
    expect([...ls.m.keys()].some((k) => k.startsWith('maor_exitlog'))).toBe(true);
    await A.beginEncryption(d0, 'pw-123456');
    expect([...ls.m.keys()].some((k) => k.startsWith('maor_exitlog'))).toBe(false);
  });
});
