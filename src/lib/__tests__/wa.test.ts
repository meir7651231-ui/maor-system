/**
 * ratchet — מנוע-וואטסאפ (INTEGRATIONS גל א׳). הטלפונים במערכת שמורים מעוצבים
 * (`0XX-XXXXXXX`, ‏formatIsraeliPhone בשמירה) — waDigits חייב להמיר לבינלאומי
 * ש-wa.me דורש, ולהיכשל-בשקט (null) על קלט לא-שמיש.
 */
import { describe, expect, it } from 'vitest';
import { waDigits, waLink } from '../wa';

describe('💬 ratchet — waDigits/waLink (הרחבת whatsapp)', () => {
  it('נייד מעוצב 050-123-4567 → 972501234567', () => {
    expect(waDigits('050-123-4567')).toBe('972501234567');
  });

  it('קווי 9 ספרות 02-1234567 → 97221234567', () => {
    expect(waDigits('02-1234567')).toBe('97221234567');
  });

  it('‏+972 / 972 / 00972 מנורמלים לאותה תוצאה', () => {
    expect(waDigits('+972 50-123-4567')).toBe('972501234567');
    expect(waDigits('972501234567')).toBe('972501234567');
    expect(waDigits('00972501234567')).toBe('972501234567');
  });

  it('מספר בינלאומי אחר נשאר כמות-שהוא (ארה"ב)', () => {
    expect(waDigits('+1 212 555 0100')).toBe('12125550100');
  });

  it('ריק / קצר-מדי ⇒ null (אין קישור, אין כפתור)', () => {
    expect(waDigits('')).toBeNull();
    expect(waDigits('123')).toBeNull();
    expect(waDigits('—')).toBeNull();
  });

  it('waLink: בלי טקסט — בלי ?text; עם עברית — מקודד', () => {
    expect(waLink('050-123-4567')).toBe('https://wa.me/972501234567');
    expect(waLink('050-123-4567', 'שלום')).toBe('https://wa.me/972501234567?text=' + encodeURIComponent('שלום'));
    expect(waLink('')).toBeNull();
  });
});
