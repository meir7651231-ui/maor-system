/**
 * רצ'ט — הצפנה-במנוחה מנוטרלת ע"י טאב שני (פאס-4 של הנחיל, HIGH). מצב ההצפנה
 * (dek/envelope) הוא ברמת-מודול ולכן פרטי לכל טאב. טאב A הפעיל הצפנה וכתב מעטפת
 * מוצפנת; טאב B עדיין עם dek=null. לפני התיקון, saveDb של טאב B היה דורס את
 * המעטפת המוצפנת בטקסט גלוי (משפחות/טלפונים/תורמים) בלי ידיעת המשתמש. כאן:
 * saveDb מטאב-גלוי חייב לסרב לדרוס מעטפת מוצפנת קיימת.
 *
 * clearCrypto() מדמה טאב עם dek=null (טאב B שלא פענח); localStorage משותף בין
 * "הטאבים" כמו בדפדפן אמיתי.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyDb } from '../../types/domain';
import { loadDb, saveDb, beginEncryption, decryptAndLoad, clearCrypto } from '../persist';

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

const seed = (over: Record<string, unknown> = {}) => ({ ...emptyDb(), orgName: 'עמותת סוד', ...over });

beforeEach(() => {
  localStorage.clear();
  clearCrypto();
});

describe('🔐 ratchet רב-טאבי — טאב גלוי לא דורס מעטפת מוצפנת', () => {
  it('טאב B (dek=null) שומר → המעטפת המוצפנת של טאב A נשמרת, אין דלף גלוי', async () => {
    // טאב A: הפעיל הצפנה
    await beginEncryption(seed(), 'pw-חזקה');
    const encBefore = localStorage.getItem('maor_db')!;
    expect(encBefore).toContain('"$enc"');

    // טאב B: לא פענח (dek=null), מנסה לשמור נתונים גלויים
    clearCrypto();
    const ok = await saveDb({ ...emptyDb(), orgName: 'דלף-בגלוי' });
    expect(ok).toBe(false); // סירב לדרוס

    const after = localStorage.getItem('maor_db')!;
    expect(after).toContain('"$enc"'); // עדיין מוצפן
    expect(after).not.toContain('דלף-בגלוי'); // הנתונים הגלויים לא נכתבו

    // וידוא סופי: המעטפת עדיין פותחת לנתונים המקוריים
    clearCrypto();
    await loadDb();
    expect((await decryptAndLoad('pw-חזקה', 'pass'))?.orgName).toBe('עמותת סוד');
  });
});
