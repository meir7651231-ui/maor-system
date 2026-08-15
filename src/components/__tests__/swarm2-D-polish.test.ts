/**
 * ratchet (הגנת-מקור) — נחיל-עמוק אשכול D (13.8), פריטים קוסמטיים/UX:
 *  · #13 כפתור ✕ של Modal חפף לכותרת ב-RTL — כעת paddingInlineStart לכותרת.
 *  · #14 טוסט "ירדה למחשב" הוצג גם בפורמט PDF (חלון-הדפסה) — כעת מותנה בפורמט.
 *  · #17 EnrollModal הציג "שיעורים × מחיר" שלא הסתדר עם הסה"כ — הוסר ה-"×".
 *  · #18 Field עם כמה ילדים — התווית קושרה htmlFor ל-id שלא הוזרק — כעת מותנה.
 */
import { describe, expect, it } from 'vitest';
import uiSrc from '../ui.tsx?raw';
import donModalSrc from '../supporters/DonationModal.tsx?raw';
import enrollSrc from '../courses/EnrollModal.tsx?raw';

describe('אשכול D — הגנות-מקור', () => {
  it('#13 כותרת ה-Modal מקבלת רווח-פנימי כדי לא לחפוף ל-✕', () => {
    expect(uiSrc).toContain('paddingInlineStart: 40');
  });

  it('#18 Field קושר htmlFor רק כשהוזרק id (single)', () => {
    expect(uiSrc).toContain('const single = isValidElement(props.children)');
    expect(uiSrc).toContain('{...(single ? { htmlFor: id } : {})}');
  });

  it('#14 טוסט-הקבלה מבחין בין הורדה ל-PDF/הדפסה', () => {
    expect(donModalSrc).toContain("receiptFmt === 'pdf'");
  });

  it('#17 שורת-התמחור לא טוענת שוויון-מכפלה (בלי "×")', () => {
    expect(enrollSrc).toContain("' שיעורים · ₪' + quote.perLesson + ' לשיעור'");
    expect(enrollSrc).not.toContain("' שיעורים × ₪' + quote.perLesson}");
  });
});
