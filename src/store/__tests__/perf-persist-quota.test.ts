/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): משטר-המכסה של saveDb.
 *
 * המדידה אצל הלקוח האמיתי (16,000 תורמים · 34MB JSON): localStorage זרק QuotaExceeded
 * **בכל** שמירה — אחרי ש-JSON.stringify של כל המסמך שרף 50–800ms (×4 האטת-CPU); ובמשטר
 * הזה readStoredEnvelope עשה idb.get של המסמך כולו לפני כל put רק כדי לבדוק isEncrypted
 * ⇒ 3 מעברי-DB-מלאים לכל עריכה (edit→persist 5.4s). על מסמך סינתטי 16k (19M תווים):
 * כל saveDb 126ms ⇒ השמירה השנייה ~0ms של stringify (רק ה-put).
 *
 * הכלל: זריקה ראשונה / אורך מעל LS_MAX_CHARS ⇒ מדלגים על setItem לשאר הסשן, ולא קוראים
 * את ה-IDB לפני put (דגל-מעטפת בזיכרון, נלמד ב-loadDb). ה-IDB בבדיקה: stub שסופר open —
 * get ו-put פותחים חיבור כל אחד (החיבור הכושל אינו נשמר) ⇒ מספר-ה-open = מספר הגישות.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import {
  saveDb,
  loadDb,
  beginEncryption,
  decryptAndLoad,
  clearCrypto,
  setPersistNamespace,
  isLsDropped,
  takeLsDroppedNotice,
  flushSaveSync,
} from '../persist';
import persistSrc from '../persist.ts?raw';
import useAppSrc from '../useApp.ts?raw';

class MemStorage {
  m = new Map<string, string>();
  /** מפתחות שה-setItem שלהם זורק QuotaExceeded (מדמה מסמך שלא נכנס למכסה). */
  quotaKeys = new Set<string>();
  setCalls: string[] = [];
  removeCalls: string[] = [];
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string): void {
    this.setCalls.push(k);
    if (this.quotaKeys.has(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
    this.m.set(k, String(v));
  }
  removeItem(k: string): void { this.removeCalls.push(k); this.m.delete(k); }
  clear(): void { this.m.clear(); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
}
const ls = new MemStorage();
(globalThis as unknown as { localStorage: MemStorage }).localStorage = ls;
let idbOpens = 0;
(globalThis as unknown as { indexedDB: unknown }).indexedDB = { open() { idbOpens++; throw new Error('no-idb-in-node'); } };

const seed = (over: Partial<Db> = {}): Db => ({ ...emptyDb(), orgName: 'עמותת ענק', ...over });
const dbSets = () => ls.setCalls.filter((k) => k === 'maor_db').length;

beforeEach(() => {
  ls.clear(); ls.quotaKeys.clear(); ls.setCalls = []; ls.removeCalls = [];
  clearCrypto();
  setPersistNamespace('x'); setPersistNamespace('default'); // איפוס משטר-המכסה בין בדיקות
  idbOpens = 0;
});

describe('⚡ ratchet — QuotaExceeded פעם אחת ⇒ אין setItem ואין idb.get בשמירות הבאות', () => {
  it('השמירה השנייה: אפס setItem · open יחיד (ה-put בלבד; לפני: get+put) · isLsDropped', async () => {
    ls.quotaKeys.add('maor_db');
    await loadDb(); // טאב טרי — הדגל נלמד: אין מעטפת
    idbOpens = 0;
    await saveDb(seed());
    expect(dbSets()).toBe(1); // הניסיון הראשון — כמו היום
    expect(isLsDropped()).toBe(true);
    const opensAfterFirst = idbOpens;
    await saveDb(seed({ orgName: 'עריכה שנייה' }));
    expect(dbSets()).toBe(1); // לא ניסינו שוב
    expect(idbOpens - opensAfterFirst).toBe(1); // רק put; בלי get של המסמך כולו
    await saveDb(seed({ orgName: 'עריכה שלישית' }));
    expect(dbSets()).toBe(1);
  });

  it('ההודעה "הנתונים גדולים" — פעם אחת בלבד (נרשמת במפתח זעיר), ולא לפני הזריקה', async () => {
    ls.quotaKeys.add('maor_db');
    await loadDb();
    expect(takeLsDroppedNotice()).toBe(false);
    await saveDb(seed());
    expect(takeLsDroppedNotice()).toBe(true);
    expect(takeLsDroppedNotice()).toBe(false);
    expect(ls.getItem('maor_lsdrop_noticed')).toBe('1');
  });

  it('מסמך מעל LS_MAX_CHARS (4,000,000 תווים) ⇒ אין ניסיון setItem בכלל', async () => {
    await loadDb();
    const big = seed({ orgNotes: 'א'.repeat(4_100_000) } as Partial<Db>);
    await saveDb(big);
    expect(dbSets()).toBe(0);
    expect(isLsDropped()).toBe(true);
    expect(takeLsDroppedNotice()).toBe(true);
  });

  it('מסמך רגיל ⇒ LS נכתב כמו היום (המשטר לא נדלק); flushSaveSync כותב סינכרונית', async () => {
    await loadDb();
    expect(await saveDb(seed())).toBe(true);
    expect(dbSets()).toBe(1);
    expect(isLsDropped()).toBe(false);
    expect(ls.getItem('maor_db')).toContain('עמותת ענק');
    flushSaveSync(seed({ orgName: 'פלאש' }));
    expect(ls.getItem('maor_db')).toContain('פלאש');
  });

  it('flushSaveSync במשטר-IDB-בלבד: אפס setItem (אין stringify של 34MB ב-pagehide)', async () => {
    ls.quotaKeys.add('maor_db');
    await loadDb();
    await saveDb(seed());
    const before = dbSets();
    flushSaveSync(seed({ orgName: 'יציאה' }));
    expect(dbSets()).toBe(before);
  });
});

describe('🔐 ratchet — דגל-המעטפת-בזיכרון מחליף את idb.get לפני put', () => {
  it('טאב גלוי (dek=null) מול מעטפת שנלמדה בטעינה — מסרב לדרוס גם כש-LS ריק, בלי לקרוא IDB', async () => {
    await beginEncryption(seed(), 'pw-חזקה');
    clearCrypto(); // "טאב חדש"
    const res = await loadDb();
    expect(res.encrypted).toBe(true);
    ls.clear(); // משטר-IDB-בלבד: המעטפת כבר לא ב-LS (רק ב-IDB)
    idbOpens = 0;
    expect(await saveDb(seed({ orgName: 'דלף-גלוי' }))).toBe(false);
    expect(idbOpens).toBe(0); // ההכרעה מהדגל, לא מקריאת המסמך
    expect(ls.getItem('maor_db')).toBeNull();
    // אחרי פענוח — אותו טאב שומר מוצפן כרגיל
    expect(await decryptAndLoad('pw-חזקה', 'pass')).not.toBeNull();
    expect(await saveDb(seed({ orgName: 'מוצפן-שוב' }))).toBe(true);
    expect(ls.getItem('maor_db')).toContain('"$enc"');
    expect(ls.getItem('maor_db')).not.toContain('מוצפן-שוב');
  }, 60_000);

  it('טעינה גלויה ⇒ הדגל כבוי ⇒ שמירה גלויה עוברת (ביט-זהה להיום)', async () => {
    ls.setItem('maor_db', JSON.stringify(seed({ orgName: 'גלוי' })));
    ls.setCalls = [];
    await loadDb();
    expect(await saveDb(seed({ orgName: 'גלוי-2' }))).toBe(true);
    expect(ls.getItem('maor_db')).toContain('גלוי-2');
  });
});

describe('🧷 הגנת-מקור — החיווט נשאר', () => {
  it('saveDb: אין stringify במשטר-IDB-בלבד-גלוי; useApp מציג את ההודעה דרך takeLsDroppedNotice', () => {
    expect(persistSrc).toContain("const json: string | null = encrypting || !lsDropped ? JSON.stringify(doc) : null;");
    expect(persistSrc).toContain('const stored = await readStoredEnvelope();');
    expect(persistSrc).not.toMatch(/readStoredEnvelope\(\)[\s\S]{0,900}getIdb\(\)\)\.get\(IDB_STORE, 'current'\)/);
    // אינטגרציה (12.10): ההודעה נדחית ל-idle (runWhenIdleVisible) — עדכון-store סינכרוני מתוך callback של
    // IDB-put באמצע רינדור-המעבר של הטאב גרם ל-React לזרוק את הרינדור ולהתחיל מחדש (פתיחת-טאב 2.4s ⇒ 3.6s ב-×4).
    expect(useAppSrc).toContain("if (ok && takeLsDroppedNotice()) runWhenIdleVisible(() => get().toast('הנתונים גדולים — נשמרים במאגר הפנימי של הדפדפן בלבד'), 5_000);");
    expect(useAppSrc).not.toMatch(/takeLsDroppedNotice\(\)\) get\(\)\.toast\(/);
  });
});
