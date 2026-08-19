/**
 * ratchet — כרטיס תומכת P3 (פריט 11 + סגירת סטיית P2).
 * פריט 11: לחיצה על תרומה מסמנת את יומה בלוח האישי (focusIso); ההיסטוריה
 * נחתכת לתצוגה של 60 בלבד — slice, לא מחיקת נתונים.
 * עיר: input בטופס — נכנס לעמודת "עיר" בדוח המותאם המלא (פער 23).
 */
import { describe, expect, it } from 'vitest';
import detailSrc from '../SupporterDetail.tsx?raw';
import calSrc from '../DonationCalendar.tsx?raw';
import formSrc from '../SupporterForm.tsx?raw';

describe('💛 ratchet — P3 כרטיס תומכת', () => {
  it('פריט 11: שורת תרומה לחיצה ⇒ setCalFocus; הלוח מקבל focusIso וקופץ לחודש', () => {
    expect(detailSrc).toMatch(/onClick=\{\(\) => setCalFocus\(r\.date\)\}/);
    expect(detailSrc).toContain('focusIso={calFocus ?? undefined}');
    expect(calSrc).toContain('props.focusIso');
    expect(calSrc).toMatch(/setDayIso\(props\.focusIso\)/);
  });

  it('פריט 11: קיטום תצוגה ל-60 — slice בלבד, עם חיווי שהכול נשמר', () => {
    expect(detailSrc).toContain('donRows.slice(0, 60)');
    expect(detailSrc).toContain('הכול נשמר וזמין בייצוא');
    // אין קיטום נתונים — לא נוגעים ב-sp.donations עצמו
    expect(detailSrc).not.toMatch(/donations\s*=\s*.*slice\(0,\s*60\)/);
  });

  it('עיר: שדה בטופס, נשמר ל-Supporter.city', () => {
    expect(formSrc).toContain('city: sp?.city ?? ');
    expect(formSrc).toContain('city: f.city.trim()');
    expect(formSrc).toContain('<Field label="עיר">');
  });

  // פריט ג' (19.8): כפתור-החזרה עבר לתחתית-המסך כפס-מרחף משותף (StickyBackBar)
  it('כפתור-חזרה קבוע בתחתית — StickyBackBar משותף, לא בראש-המסך', () => {
    expect(detailSrc).toContain('<StickyBackBar onBack={props.onBack}');
    // אין כפתור-חזרה ידני בראש (רק דרך הרכיב המשותף)
    expect(detailSrc).not.toMatch(/onClick=\{props\.onBack\}/);
  });

  // 🐛 ratchet — קישור-עמוד-התרומה (💳) היה אמוג׳י-בודד בלי תווית ובלי aria-label:
  // נעלם-הפשר במגע וחריג לאחיו (🤖/📱) שנושאים טקסט. עכשיו תווית גלויה + aria-label.
  it('🛡 💳 עמוד-התרומה נושא תווית גלויה + aria-label (לא אמוג׳י-בודד)', () => {
    expect(detailSrc).toContain('💳 עמוד תרומה');
    expect(detailSrc).toContain('aria-label="פתיחת עמוד-התרומה של הארגון"');
    // המקור: הקישור עדיין נפתח ב-target חדש עם href של payLink (אפס שינוי-התנהגות)
    expect(detailSrc).toMatch(/href=\{donateHref\}[\s\S]{0,120}target="_blank"/);
  });

  // 🐛 ratchet — כפתורי-הקבלה פר-שורה (🧾/📧) היו אמוג׳י-בלבד עם title: נעלם-הפשר
  // במגע. עכשיו תווית גלויה בכל כפתור (הטקסט = השם-הנגיש); אותם handlers.
  it('🛡 כפתורי-הקבלה בהיסטוריה נושאים תווית גלויה (🧾 הורדה · 📧 מייל)', () => {
    expect(detailSrc).toContain('🧾 הורדה');
    expect(detailSrc).toContain('📧 מייל');
    // אותם handlers — אפס שינוי-התנהגות
    expect(detailSrc).toContain('onClick={() => redownloadReceipt(r.rid!)}');
    expect(detailSrc).toContain('onClick={() => void mailReceipt(r.rid!)}');
  });
});
