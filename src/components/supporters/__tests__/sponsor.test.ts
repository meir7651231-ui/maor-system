/**
 * ratchet — "אמץ חתן/משפחה" (SHOP9, הכרעת בעלים: הכסף מחווט לתרומות/קבלות).
 * תרומה מיועדת = קבלת מס אמיתית (D-, אותו donationSeq) עם ייעוד לנהנה.
 * additive: השדה אופציונלי — תרומה רגילה לא מושפעת. מגודר supporters.sponsor.
 */
import { describe, expect, it } from 'vitest';
import modalSrc from '../DonationModal.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';

describe('🤝 ratchet — אמץ חתן (תרומה מיועדת → קבלה אמיתית)', () => {
  it('הייעוד מגודר supporters.sponsor ונשלח ל-addDonation', () => {
    expect(modalSrc).toContain("featureOn(config, 'supporters.sponsor')");
    expect(modalSrc).toMatch(/designation: desig/);
    // הקבלה מקבלת forWhat של אימוץ כשיש ייעוד
    expect(modalSrc).toContain("'אימוץ — ' + desig");
  });

  it('זרימת הקבלה לא שונתה — אותו addDonation/donationSeq/D-', () => {
    // הייעוד נוסף לאובייקט התרומה; מנגנון ה-D- (donationSeq) לא נגע
    expect(storeSrc).toContain("const rid = 'D-' + get().db.donationSeq");
    expect(storeSrc).toContain('donationSeq: db.donationSeq + 1');
    // addDonation עדיין מפזר את אובייקט התרומה (הייעוד רוכב איתו) — בלי טיפול-מיוחד
    expect(storeSrc).toContain('[{ ...donation, rid }, ...s.donations]');
  });
});
