/**
 * הצפנה במנוחה — בדיקת אינטגרציה של שכבת השמירה עצמה (persist), לא רק הליבה:
 * הפעלה → "טעינה מחדש" → פענוח → שמירה → כיבוי → החלפת סיסמה. כשל כאן = אבדן
 * נתונים, לכן זו הבדיקה הקריטית ביותר. localStorage מדומה בזיכרון; קריאות
 * IndexedDB נכשלות ונתפסות (בדיוק כמו מצב פרטי בדפדפן).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyDb } from '../../types/domain';
import {
  loadDb,
  saveDb,
  beginEncryption,
  decryptAndLoad,
  stopEncryption,
  changeEncryptionPassword,
  clearCrypto,
} from '../persist';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
  key(i: number): string | null {
    return [...this.m.keys()][i] ?? null;
  }
  get length(): number {
    return this.m.size;
  }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

const seed = (over: Record<string, unknown> = {}) => ({ ...emptyDb(), orgName: 'עמותת סוד', seq: 555, ...over });

beforeEach(() => {
  localStorage.clear();
  clearCrypto();
});

describe('🔐 הצפנה במנוחה — מסלול הנתונים המלא', () => {
  it('הפעלה → טעינה מחדש → פענוח: הנתונים נשמרים בדיוק, בלי דלף גלוי', async () => {
    await beginEncryption(seed(), 'my-strong-pass');
    const raw = localStorage.getItem('maor_db')!;
    expect(raw).toContain('"$enc"'); // מעטפת מוצפנת
    expect(raw).not.toContain('עמותת סוד'); // אין טקסט גלוי

    clearCrypto(); // מדמה סגירת דפדפן — ה-DEK נמחק מהזיכרון
    const res = await loadDb();
    expect(res.encrypted).toBe(true);
    expect(res.db.orgName).toBe('מאור החסד'); // db ריק עד פענוח (לא נחשף)

    expect(await decryptAndLoad('wrong-pass', 'pass')).toBeNull();
    const back = await decryptAndLoad('my-strong-pass', 'pass');
    expect(back?.orgName).toBe('עמותת סוד');
    expect(back?.seq).toBe(555);
  });

  it('מפתח שחזור פותח גם כשהסיסמה נשכחה', async () => {
    const rec = await beginEncryption(seed({ orgName: 'שחזור' }), 'forgotten-pw');
    clearCrypto();
    await loadDb();
    const back = await decryptAndLoad(rec, 'rec');
    expect(back?.orgName).toBe('שחזור');
  });

  it('שמירה אחרי פענוח נשארת מוצפנת ומפענחת לנתונים החדשים', async () => {
    await beginEncryption(seed({ orgName: 'v1' }), 'pw');
    clearCrypto();
    await loadDb();
    const loaded = await decryptAndLoad('pw', 'pass');
    expect(loaded).not.toBeNull();
    await saveDb({ ...loaded!, orgName: 'ערך-חדש-סודי' });
    const raw = localStorage.getItem('maor_db')!;
    expect(raw).toContain('"$enc"'); // עדיין מוצפן
    expect(raw).not.toContain('ערך-חדש-סודי'); // הנתונים החדשים לא גלויים
    clearCrypto();
    await loadDb();
    expect((await decryptAndLoad('pw', 'pass'))?.orgName).toBe('ערך-חדש-סודי');
  });

  it('כיבוי הצפנה → הנתונים חוזרים גלויים, בלי צורך בקוד', async () => {
    await beginEncryption(seed({ orgName: 'גלוי-שוב' }), 'pw');
    clearCrypto();
    await loadDb();
    const loaded = await decryptAndLoad('pw', 'pass');
    await stopEncryption(loaded!);
    clearCrypto();
    const res = await loadDb();
    expect(res.encrypted).toBeFalsy();
    expect(res.db.orgName).toBe('גלוי-שוב');
    expect(localStorage.getItem('maor_db')).toContain('גלוי-שוב'); // גלוי
  });

  it('החלפת סיסמה — החדשה פותחת, הישנה נכשלת, הנתונים נשמרים', async () => {
    await beginEncryption(seed({ orgName: 'שינוי-סיסמה' }), 'old-pass');
    expect(await changeEncryptionPassword('old-pass', 'new-pass')).toBe(true);
    expect(await changeEncryptionPassword('still-old', 'x')).toBe(false); // dek קיים אך ישן שגוי
    clearCrypto();
    await loadDb();
    expect(await decryptAndLoad('old-pass', 'pass')).toBeNull();
    expect((await decryptAndLoad('new-pass', 'pass'))?.orgName).toBe('שינוי-סיסמה');
  });
});
