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
const opened: P[] = [];
/** פתיחה-מחדש אחרי שכל הלשוניות נסגרו (לשונית סגורה לא עונה ל-ping — כמו בדפדפן). */
async function reopen(): Promise<P> {
  for (const t of opened.splice(0)) t.closeTabChannel?.();
  return tab();
}
async function tab(): Promise<P> {
  vi.resetModules();
  const P = await import('../persist');
  opened.push(P);
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

beforeEach(() => { for (const t of opened.splice(0)) t.closeTabChannel?.(); ls.clear(); clearAll(); seedStored(); });

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
    const C = await reopen();
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
    const re = (await (await reopen()).loadDb()).db;
    expect(note(re, 's1')).toBe('');
  });
});

describe('🛟 #529 ביקורת — 2. יומן פר-לשונית (ביקורת-2: יומן לא-תואם לא מוחל — עותק-הצלה גלוי)', () => {
  it('א\' וב\' עורכות; א\' שומרת; ב\' נסגרת ⇒ עבודת א\' נשמרת; יומן ב\' (בסיס ישן) **לא מוחל** — נשמר כעותק-הצלה', async () => {
    const A = await tab();
    const dA = (await A.loadDb()).db;
    const B = await tab();
    const dB = (await B.loadDb()).db;
    const a1 = { ...dA, supporters: [sup('s1', 'A'), dA.supporters[1]] };
    A.writeExitJournal(a1);
    B.writeExitJournal({ ...dB, supporters: [dB.supporters[0], sup('s2', 'B')] });
    await A.saveDb(a1); // א' שומרת (מוחקת רק את היומן שלה)
    const C = await reopen();
    const re = (await C.loadDb()).db;
    expect(note(re, 's1')).toBe('A');
    expect(note(re, 's2')).toBe(''); // לא הוחל בשקט
    expect(ls.getItem('maor_exitlog_rescue')).toContain('"B"'); // אבל לא נזנח — עותק-הצלה
    expect(C.takeRescuedJournals()).toBe(1); // ⇒ הודעה גלויה
  });
});

describe('🛟 #529 ביקורת-2 — יומן-יתום לא דורס עבודה חדשה (5 תרחישים)', () => {
  it('HIGH 1: א\' עורכת s1 ונסגרת; ב\' מוחקת s1 ושומרת ⇒ s1 לא חוזר', async () => {
    const B = await tab(); // ב' פתוחה כבר
    const dB = (await B.loadDb()).db;
    const A = await tab();
    const dA = (await A.loadDb()).db;
    A.writeExitJournal({ ...dA, supporters: [sup('s1', 'A'), dA.supporters[1]] }); // א' נסגרת לפני שמירה
    await B.saveDb({ ...dB, supporters: [dB.supporters[1]] }); // ב' מוחקת s1
    const re = (await (await reopen()).loadDb()).db;
    expect(ids(re)).toEqual(['s2']);
  });
  it('HIGH 2 (קבלות §46): יומן-יתום עם D-1 לא משנה את D-1 שב\' כבר הנפיקה ושמרה', async () => {
    const B = await tab(); // ב' פתוחה כבר
    const dB = (await B.loadDb()).db;
    const A = await tab();
    const dA = (await A.loadDb()).db;
    const don = (rid: string) => ({ rid, date: '2026-11-07', amount: 100, cur: '₪' });
    A.writeExitJournal({ ...dA, donationSeq: 2, supporters: [{ ...sup('s1'), donations: [don('D-1')], count: 1, ils: 100 } as never, dA.supporters[1]] }); // א' הנפיקה D-1 ונסגרה
    await B.saveDb({ ...dB, donationSeq: 2, supporters: [dB.supporters[0], { ...sup('s2'), donations: [don('D-1')], count: 1, ils: 100 } as never] });
    const re = (await (await reopen()).loadDb()).db;
    const rids = re.supporters.flatMap((s) => (s.donations ?? []).map((d) => s.id + ':' + d.rid));
    expect(rids).toEqual(['s2:D-1']); // הקבלה של ב' לא מוספרה מחדש, וזו של א' לא הוחלה
  });
  it('MED 3: יומן-יתום לא מגלגל אחורה הגדרות-ארגון (orgName/usdRate)', async () => {
    const B = await tab(); // ב' פתוחה כבר
    const dB = (await B.loadDb()).db;
    const A = await tab();
    const dA = (await A.loadDb()).db;
    A.writeExitJournal({ ...dA, orgName: 'ישן', usdRate: 3.1, supporters: [sup('s1', 'A'), dA.supporters[1]] });
    await B.saveDb({ ...dB, orgName: 'חדש', usdRate: 3.9 });
    const re = (await (await reopen()).loadDb()).db;
    expect(re.orgName).toBe('חדש');
    expect(re.usdRate).toBe(3.9);
  });
  it('MED 4: ביטול "טופל" (הסרת מפתח attnDone) בלשונית אחת לא חוזר בטעינה', async () => {
    st('db').set('current', structuredClone({ ...emptyDb(), supporters: [sup('s1'), sup('s2')], attnDone: { k1: '2026-11-01', k2: '2026-11-01' }, savedAt: '2026-11-07T10:00:00.000Z' }));
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    A.writeExitJournal({ ...d0, attnDone: { k2: '2026-11-01' } }); // k1 בוטל; נסגר לפני שמירה
    const re = (await (await reopen()).loadDb()).db;
    expect(Object.keys(re.attnDone ?? {})).toEqual(['k2']);
  });
  it('MED 5 (ענן): מיזוג-מרוחק שנשמר לא נמחק ע"י ביסוס-מחדש של יומן מקומי ישן', async () => {
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    const l1 = { ...d0, supporters: [sup('s1', 'L'), d0.supporters[1]] };
    A.writeExitJournal(l1); // עריכה מקומית
    const merged = { ...l1, supporters: [...l1.supporters, sup('r9', 'מהענן')] }; // setDbFromRemote
    A.writeExitJournal(merged); // ⇐ החיווט ב-useApp (setDbFromRemote)
    await A.saveDb(merged);
    const re = (await (await reopen()).loadDb()).db;
    expect(ids(re)).toEqual(['r9', 's1', 's2']);
    expect(note(re, 's1')).toBe('L');
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

describe('🛟 #529 ביקורת-3', () => {
  it('#1: עותק-ההצלה (PII) נמחק בהפעלת-הצפנה', async () => {
    ls.setItem('maor_exitlog_rescue', JSON.stringify([{ savedAt: Date.now(), j: { v: 2, base: 'x', at: 1, diff: { sets: [{ col: 'supporters', id: 's1', data: { idNum: '012345678' } }], deletes: [], meta: null } } }]));
    const A = await tab();
    const d0 = (await A.loadDb()).db;
    await A.beginEncryption(d0, 'pw-123456');
    expect(ls.getItem('maor_exitlog_rescue')).toBeNull();
  });
  it('#2: עותק-ההצלה תחום (512K תווים · תפוגה 14 יום) ונגיש לייצוא', async () => {
    const big = 'א'.repeat(200_000);
    const old = { savedAt: Date.now() - 15 * 864e5, j: { v: 2, base: 'x', at: 1, diff: { sets: [], deletes: [], meta: { orgName: 'ישן' } } } };
    const items = [old, ...[1, 2, 3, 4].map((i) => ({ savedAt: Date.now(), j: { v: 2, base: 'x', at: i, diff: { sets: [], deletes: [], meta: { orgName: big } } } }))];
    ls.setItem('maor_exitlog_rescue', JSON.stringify(items));
    const A = await tab();
    const live = A.rescueJournals();
    expect(live.some((r) => r.j.diff.meta?.orgName === 'ישן')).toBe(false); // פג-תוקף נוקה
    expect((ls.getItem('maor_exitlog_rescue') ?? '').length).toBeLessThanOrEqual(512_000);
  });
  it('#3: לשונית חדשה לא גונבת יומן של לשונית חיה (x1 לא קם אחרי שא\' מחקה אותו)', async () => {
    const A = await tab();
    const dA = (await A.loadDb()).db;
    const a1 = { ...dA, supporters: [...dA.supporters, sup('x1')] };
    A.writeExitJournal(a1); // א' חיה, x1 רק ביומן
    const B = await tab();
    const dB = (await B.loadDb()).db; // ב' נפתחת — אסור לה לקחת את היומן של א'
    await B.saveDb(dB);
    A.writeExitJournal({ ...a1, supporters: a1.supporters.filter((x) => x.id !== 'x1') }); // א' מוחקת x1
    const re = (await (await reopen()).loadDb()).db;
    expect(ids(re)).toEqual(['s1', 's2']);
  });
});

describe('🛟 #529 אימות-4 — יומן יחיד מעל תקרת-ההצלה', () => {
  it('לא מרוקן את עותקי-ההצלה הוותיקים, לא מוחק את מפתח-היומן, ומדווח "גדול מדי" (לא "נשמר עותק")', async () => {
    const oldItem = { savedAt: Date.now(), j: { v: 2, base: 'old', at: 1, diff: { sets: [], deletes: [], meta: { orgName: 'ותיק' } } } };
    ls.setItem('maor_exitlog_rescue', JSON.stringify([oldItem]));
    // יומן של לשונית שנסגרה, בסיס לא-תואם, גדול מ-512K תווים (עריכה המונית)
    const big = { v: 2, base: '1999-01-01T00:00:00.000Z', at: 2, diff: { sets: Array.from({ length: 300 }, (_, i) => ({ col: 'supporters', id: 'b' + i, data: { id: 'b' + i, notes: 'א'.repeat(2000) } })), deletes: [], meta: null } };
    ls.setItem('maor_exitlog|deadtab', JSON.stringify(big));
    const C = await reopen();
    await C.loadDb();
    expect(ls.getItem('maor_exitlog_rescue')).toContain('ותיק'); // הוותיק לא נדחק
    expect(ls.getItem('maor_exitlog|deadtab')).not.toBeNull(); // היומן לא נמחק — לא נשמר עותק
    expect(C.takeRescuedJournals()).toBe(0); // אין "נשמר עותק"
    expect(C.takeOversizedJournalRecords()).toBe(300); // הודעה גלויה עם מספר הרשומות
  });
});
