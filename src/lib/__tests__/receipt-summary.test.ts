/**
 * ratchet — קבלה מלאה (P1.2, feature courses.receipt.summary).
 *
 * מקור האמת: legacy receipt() (legacy-main-script.js:1258-1266) — הקבלה כוללת
 * 'סה"כ עסקה: ₪X · שולם עד כה: ₪Y · יתרה: ₪Z' ושורת 'תשלום הבא: <עברי> · <לועזי>'
 * כשקיים dueDate. הכלל הנעול: עם summary השורות מופיעות בפורמט הלגאסי; בלי
 * summary (דגל כבוי) הקבלה זהה לחלוטין לצורתה הקודמת.
 */
import { describe, expect, it } from 'vitest';
import { receiptLines, type ReceiptInfo } from '../receipt';
import { hebDateFull } from '../hebrew';

const BASE: ReceiptInfo = {
  rid: 'R-7',
  orgName: 'מאור החסד',
  payer: 'רוני כהן',
  amount: 120,
  method: 'מזומן',
  date: '2026-07-29',
  forWhat: 'חוג ציור',
};

describe('🧾 ratchet — שורות סיכום העסקה (legacy:1264-1265)', () => {
  it('עם summary: סה"כ עסקה/שולם/יתרה בפורמט הלגאסי המדויק', () => {
    const lines = receiptLines({
      ...BASE,
      summary: { totalDue: 600, paidSoFar: 320, balance: 280 },
    });
    expect(lines).toContain('סה"כ עסקה: ₪600 · שולם עד כה: ₪320 · יתרה: ₪280');
    // אין nextDate → אין שורת תשלום הבא
    expect(lines.some((l) => l.startsWith('תשלום הבא'))).toBe(false);
  });

  it('עם nextDate: שורת "תשלום הבא" עברי + לועזי', () => {
    const lines = receiptLines({
      ...BASE,
      summary: { totalDue: 600, paidSoFar: 320, balance: 280, nextDate: '2026-09-01' },
    });
    const next = lines.find((l) => l.startsWith('תשלום הבא: '));
    expect(next).toBeDefined();
    expect(next).toContain(hebDateFull('2026-09-01'));
    expect(next).toContain(new Date('2026-09-01T12:00:00').toLocaleDateString('he-IL'));
  });

  it('בלי summary (דגל כבוי): הקבלה זהה לצורתה הקודמת — אין שורות סיכום', () => {
    const lines = receiptLines(BASE).filter((x) => x !== '');
    expect(lines).toEqual([
      'קבלה — מאור החסד',
      'קבלה מס׳: R-7',
      'תאריך: ' + hebDateFull('2026-07-29') + ' · ' + new Date('2026-07-29T12:00:00').toLocaleDateString('he-IL'),
      'התקבל מאת: רוני כהן',
      'סכום: ₪120',
      'אמצעי תשלום: מזומן',
      'עבור: חוג ציור',
      'תודה על תמיכתכם',
    ]);
  });

  it('קבלת סעיף 46 (taxReceipt) אינה מושפעת מ-summary — הפריסה הפורמלית נשמרת', () => {
    const withSummary = receiptLines({ ...BASE, taxReceipt: true, summary: { totalDue: 600, paidSoFar: 320, balance: 280 } });
    const without = receiptLines({ ...BASE, taxReceipt: true });
    expect(withSummary).toEqual(without);
  });
});
