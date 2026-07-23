/**
 * נעילת גישה — גיבוב ואימות קוד. הקוד לעולם לא נשמר גלוי; אימות מול הגיבוב
 * בלבד. כולל ולידציית אורך וסירוב לקלט לא-ספרתי/ריק.
 */
import { describe, expect, it } from 'vitest';
import { hashPin, verifyPin, isValidPin } from '../lock';

describe('🔑 isValidPin — 4–8 ספרות בלבד', () => {
  it('מקבל 4–8 ספרות', () => {
    for (const p of ['1234', '000000', '12345678']) expect(isValidPin(p)).toBe(true);
  });
  it('דוחה קצר/ארוך/לא-ספרתי/ריק', () => {
    for (const p of ['', '123', '123456789', '12a4', '12 4', 'abcd']) expect(isValidPin(p)).toBe(false);
  });
});

describe('🔒 hashPin — דטרמיניסטי, לא הפיך-בקלות, לא טקסט גלוי', () => {
  it('אותו קוד → אותו גיבוב (64 hex)', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('1234');
  });
  it('קודים שונים → גיבוב שונה', async () => {
    expect(await hashPin('1234')).not.toBe(await hashPin('1235'));
  });
});

describe('🔓 verifyPin — נכון עובר, שגוי/חסר נכשל', () => {
  it('קוד נכון מול הגיבוב שלו → true', async () => {
    const h = await hashPin('4729');
    expect(await verifyPin('4729', h)).toBe(true);
  });
  it('קוד שגוי → false', async () => {
    const h = await hashPin('4729');
    expect(await verifyPin('0000', h)).toBe(false);
  });
  it('גיבוב חסר/ריק → false (אין נעילה = לא נפתח בטעות)', async () => {
    expect(await verifyPin('1234', undefined)).toBe(false);
    expect(await verifyPin('1234', '')).toBe(false);
  });
});
