/**
 * ratchet — פורמט-הקבלה לבחירת-הלקוח (5.5d, הכרעת-בעלים 9.8:
 * "קבלות שיציג בתור כפתור מה הלקוח בוחר").
 * האינווריאנטים:
 * 1. ברירת-המחדל ביט-זהה: ‏receiptFmt חסר ⇒ deliverReceipt מוריד קובץ-טקסט
 *    (הזרימה ההיסטורית); 'pdf' נבחר-במפורש בלבד.
 * 2. ‏receiptHtml טהור ומחוסן-הזרקה: שם-תורם/ייעוד עוברים escaping; המסמך RTL;
 *    התוכן = בדיוק receiptLines (מקור-אמת יחיד — אין נוסח כפול).
 * 3. ‏printReceipt דרך iframe נסתר — לא window.open (חוסמי-חלונות בולעים בשקט).
 * 4. כיבוי הדגל core.receipt.pdf מחזיר לטקסט גם כשנבחר PDF (receiptFmtOf).
 * 5. כל 5 משטחי-המסירה עברו ל-deliverReceipt עם receiptFmtOf — אף קבלה לא
 *    נשארה קשיחה ל-txt כשהלקוח בחר PDF.
 */
import { describe, expect, it } from 'vitest';
import { receiptHtml, receiptLines, receiptFmtOf, type ReceiptInfo } from '../receipt';
import { DEFAULT_CONFIG } from '../../types/config';
import receiptSrc from '../receipt.ts?raw';
import supDetailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import donationSrc from '../../components/supporters/DonationModal.tsx?raw';
import manageSrc from '../../components/courses/ManageModal.tsx?raw';
import assignSrc from '../../components/shop/AssignmentsTab.tsx?raw';
import settingsSrc from '../../components/settings/SettingsView.tsx?raw';

const BASE: ReceiptInfo = {
  rid: 'D-7',
  orgName: 'מאור החסד',
  payer: 'שרה כהן',
  amount: 180,
  date: '2026-08-09',
  forWhat: 'תרומה — כללי',
};

describe('🧾 ratchet — פורמט-קבלה לבחירת-הלקוח (9.8)', () => {
  it('receiptHtml: התוכן = בדיוק שורות-הקבלה, RTL, בלי נוסח כפול', () => {
    const html = receiptHtml(BASE);
    expect(html).toContain('dir="rtl"');
    for (const ln of receiptLines(BASE).filter((x) => x !== '')) {
      expect(html).toContain(ln);
    }
  });

  it('receiptHtml: קלט עוין עובר escaping — אין הזרקת-HTML למסמך', () => {
    const html = receiptHtml({ ...BASE, payer: '<script>alert(1)</script>', forWhat: 'א & ב <b>' });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('א &amp; ב &lt;b&gt;');
  });

  it('receiptFmtOf: הדגל דלוק ⇒ הבחירה; כבוי ⇒ undefined (חזרה לטקסט)', () => {
    expect(receiptFmtOf(DEFAULT_CONFIG, { receiptFmt: 'pdf' })).toBe('pdf');
    expect(receiptFmtOf(DEFAULT_CONFIG, {})).toBeUndefined();
    const off = { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features, 'core.receipt.pdf': false } };
    expect(receiptFmtOf(off, { receiptFmt: 'pdf' })).toBeUndefined();
  });

  it('deliverReceipt: חסר/txt ⇒ המסלול ההיסטורי; pdf ⇒ הדפסה; iframe ולא window.open', () => {
    expect(receiptSrc).toMatch(/if \(fmt === 'pdf'\) printReceipt\(o\);\s*\n\s*else downloadReceipt\(o\);/);
    const printFn = receiptSrc.slice(receiptSrc.indexOf('export function printReceipt'));
    expect(printFn).toContain("createElement('iframe')");
    expect(printFn).not.toContain('window.open(');
  });

  it('כל 5 משטחי-המסירה מכבדים את הבחירה (deliverReceipt + receiptFmtOf)', () => {
    for (const [name, src] of [
      ['SupporterDetail', supDetailSrc],
      ['DonationModal', donationSrc],
      ['ManageModal', manageSrc],
      ['AssignmentsTab', assignSrc],
    ] as const) {
      // ‏\b — לא לתפוס את redownloadReceipt (שם-פונקציה מקומי שנשאר לתאימות)
      expect(src, name + ' עדיין קורא downloadReceipt ישירות').not.toMatch(/\bdownloadReceipt\(/);
      expect(src, name + ' בלי receiptFmtOf').toContain('receiptFmtOf(');
    }
    // SupporterDetail — שני משטחים (רישום-הו"ק + הורדה-חוזרת)
    expect(supDetailSrc.match(/deliverReceipt\(/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('ההגדרות: בורר 📄/🖨 מגודר core.receipts + core.receipt.pdf ושומר ל-db.ui', () => {
    expect(settingsSrc).toMatch(/featureOn\(config, 'core\.receipts'\) && featureOn\(config, 'core\.receipt\.pdf'\)/);
    expect(settingsSrc).toContain('📄 קובץ טקסט');
    expect(settingsSrc).toContain('🖨 PDF / הדפסה');
    expect(settingsSrc).toContain("receiptFmt: next");
  });
});
