/**
 * רצ'ט (ratchet) — גלגול שני, מחוזק (P1-א׳2). הבאג המקורי: רכיבי הקבלות גזרו
 * את מספר הקבלה מ-db.seq במקום מהמונים הרציפים. התיקון הראשון העביר אותם
 * לניחוש מ-receiptSeq/donationSeq — אבל עדיין ניחוש: כשה-store דחה (השיבוץ/
 * התומכת נעלמו בסנכרון), ירדה קבלה עם rid שמעולם לא הונפק.
 *
 * האינווריאנט המחוזק: ה-UI לא גוזר rid בכלל — addPayment/addDonation מחזירים
 * {ok, rid}, וההורדה מתבצעת רק על ok ועם ה-rid שחזר. הגנת-מקור (?raw) כי
 * הזרימה ב-JSX; בדיקת ה-store עצמו ב-receipt-gate.test.ts.
 */
import { describe, expect, it } from 'vitest';
import manageSrc from '../../components/courses/ManageModal.tsx?raw';
import donationSrc from '../../components/supporters/DonationModal.tsx?raw';

describe('🧾 ratchet — ה-UI לא מנחש מספר קבלה; מוריד רק כשה-store קיבל', () => {
  it('ManageModal: אין גזירת R- מקומית; ההורדה מגודרת ב-res.ok עם res.rid', () => {
    // הבאגים שנתפסו: 'R-' + db.seq (גלגול 1) ואז 'R-' + receiptSeq (גלגול 2) — אסור שיחזרו
    expect(manageSrc).not.toMatch(/'R-'\s*\+/);
    expect(manageSrc).toMatch(/const res = addPayment\(/);
    expect(manageSrc).toMatch(/if \(!res\.ok \|\| !res\.rid\) return/);
  });

  it('DonationModal: אין גזירת D- מקומית; ההורדה מגודרת ב-res.ok עם res.rid', () => {
    expect(donationSrc).not.toMatch(/'D-'\s*\+/);
    expect(donationSrc).toMatch(/const res = addDonation\(/);
    expect(donationSrc).toMatch(/if \(!res\.ok \|\| !res\.rid\)/);
  });
});
