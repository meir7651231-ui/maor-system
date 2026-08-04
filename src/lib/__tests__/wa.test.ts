/**
 * ratchet — מנוע-וואטסאפ (INTEGRATIONS גל א׳). הטלפונים במערכת שמורים מעוצבים
 * (`0XX-XXXXXXX`, ‏formatIsraeliPhone בשמירה) — waDigits חייב להמיר לבינלאומי
 * ש-wa.me דורש, ולהיכשל-בשקט (null) על קלט לא-שמיש.
 */
import { describe, expect, it } from 'vitest';
import { waBirthdayText, waDeliveryText, waDigits, waLink, waPaymentText } from '../wa';

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

  // הקשחה (ביקורת אדוורסרית 4.8.2026) — המקרים ששברו את הגרסה הראשונה:
  it("‏'+972 050…' (ה-0 המקומי נשמר) ⇒ ה-0 מוסר: 972501234567", () => {
    expect(waDigits('+972 050-123-4567')).toBe('972501234567');
  });

  it("‏'0050…' (עיצוב-כפול של ‎+972) ⇒ משוחזר נכון דרך קידומת-החיוג", () => {
    expect(waDigits('00501234567')).toBe('972501234567');
  });

  it('0-מוביל באורך שגוי (8 או ≥11 ספרות) ⇒ null — עדיף בלי כפתור מקישור-שבור', () => {
    expect(waDigits('02123456')).toBeNull(); // 8 ספרות עם 0
    expect(waDigits('05012345678')).toBeNull(); // 11 ספרות עם 0
  });

  it('ישראלי בלי 0 מוביל (9 ספרות) ⇒ מושלם כמו formatIsraeliPhone: 972…', () => {
    expect(waDigits('501234567')).toBe('972501234567');
  });

  it('אורך מופרז (>15, גבול E.164) ⇒ null', () => {
    expect(waDigits('9725012345678901234')).toBeNull();
  });
});

describe('💬 ratchet — תבניות-הודעה (גל ב׳): טהורות, שם-ארגון ריק ⇒ "העמותה"', () => {
  it('הודעת-מסירה', () => {
    expect(waDeliveryText('מאור החסד', 'כהן')).toBe('שלום משפחת כהן, משלוח ממאור החסד בדרך אליכם היום 🚚');
    expect(waDeliveryText('', 'לוי')).toContain('מהעמותה');
  });

  it('תזכורת-תשלום: שם-פריט + יתרה מעוגלת עם מפריד-אלפים', () => {
    expect(waPaymentText('מאור החסד', 'חוג ציור', 250)).toBe(
      'שלום, תזכורת ידידותית ממאור החסד: יתרה לתשלום עבור חוג ציור — ₪250. תודה רבה!',
    );
    expect(waPaymentText('א', 'ב', 1234.6)).toContain('₪' + (1235).toLocaleString('he-IL'));
  });

  it('ברכת יום-הולדת', () => {
    expect(waBirthdayText('מאור החסד', 'שרה')).toBe('מזל טוב לשרה ליום ההולדת! 🎂 באהבה, מאור החסד');
  });
});
