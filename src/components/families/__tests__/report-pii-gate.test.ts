/**
 * 🛡️ ratchet — אטימת-PII (ביקורת-האמון 24.8, לולאת-TRUST 1).
 *
 * הבאגים שנמצאו בבדיקת-העומק (6 סוכני-ביקורת מול הקוד):
 * 1) דוח-המשפחה להורדה הדפיס ת"ז-הורים ורגישויות-רפואיות גם כשהדגלים
 *    families.showid / families.health כבויים — עקף את הגידור של המסך.
 *    התיקון: אותם דגלים חלים גם על הקובץ; חסר-דגל=פעיל ⇒ ברירת-מחדל ביט-זהה.
 * 2) שער "רק המנהל מנפיק קבלות" (הכרעת-בעלים 14.8) כיסה רק D- — קבלת R-
 *    (קבלת-מס!) הייתה פתוחה לכל עובד/ת-ענן. התיקון: אותו canIssueReceipt
 *    ב-addPayment; ‏S- נשאר פתוח במכוון (אישור-תשלום סמלי, לא מסמך-מס).
 * 3) יומן-גישה: הלוג תיעד רק שינויים — חשיפת-ת"ז, הורדת-דוח-משפחה וייצוא-גיבוי
 *    היו בלתי-נראים. התיקון: logAccess על שלושת המשטחים.
 */
import { describe, expect, it } from 'vitest';
import panelsSrc from '../FamilyPanels.tsx?raw';
import detailSrc from '../FamilyDetail.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';

describe('🛡️ אטימת-PII — דוח-משפחה, שער-R, יומן-גישה', () => {
  it('דוח-המשפחה מכבד את families.showid — ת"ז לא דולפת לקובץ כשהדגל כבוי', () => {
    expect(panelsSrc).toContain("const showId = featureOn(config, 'families.showid')");
    expect(panelsSrc).toContain("showId && f.fatherId ? ' · ת\"ז ' + f.fatherId");
    expect(panelsSrc).toContain("showId && f.motherId ? ' · ת\"ז ' + f.motherId");
    // אסור שתחזור הגרסה חסרת-השער ("(f.fatherId ? ' · ת"ז '" בלי showId)
    expect(panelsSrc).not.toContain("(f.fatherId ? ' · ת\"ז '");
    expect(panelsSrc).not.toContain("(f.motherId ? ' · ת\"ז '");
  });

  it('דוח-המשפחה מכבד את families.health — רגישויות לא דולפות כשהדגל כבוי', () => {
    expect(panelsSrc).toContain("const showHealth = featureOn(config, 'families.health')");
    expect(panelsSrc).toContain("showHealth && m.health ? ' · רגישויות: '");
  });

  it('addPayment (קבלת R-) מגודר canIssueReceipt — כמו addDonation', () => {
    const addPayment = storeSrc.slice(storeSrc.indexOf('addPayment(enrollmentId'));
    const body = addPayment.slice(0, addPayment.indexOf('logAudit'));
    expect(body).toContain('canIssueReceipt(');
    expect(body).toContain('רק המנהל מנפיק קבלות');
  });

  it('יומן-גישה: חשיפת-ת"ז + הורדת-דוח + ייצוא-גיבוי נרשמים בלוג', () => {
    expect(detailSrc).toContain('logAccess(\'חשיפת ת"ז\'');
    expect(panelsSrc).toContain("logAccess('הורדת דוח-משפחה'");
    expect(storeSrc).toContain("logAudit('ייצוא גיבוי מלא'");
    // הפעולה חשופה ל-store (רכיבים לא ניגשים ל-logAudit הפנימי)
    expect(storeSrc).toContain('logAccess: (act, what) => logAudit(act, what)');
  });
});
