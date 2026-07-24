/**
 * רצ'ט (ratchet) — שומר-רגרסיה לבאג שהנחיל תפס: רכיבי ה-UI שמנפיקים קבלה
 * (ManageModal לחוגים, DonationModal לתרומות) גזרו את מספר הקבלה מ-db.seq
 * (המונה המשותף לכל הישויות) במקום מהמונים הרציפים receiptSeq/donationSeq.
 * התוצאה: המספר שהוצג/הורד ללקוח לא תאם את מה שנשמר, ומספרים חזרו על עצמם.
 *
 * הבדיקה טוענת את קוד המקור (Vite ?raw) ומוודאת שהרכיבים משתמשים במונה הנכון
 * ולא ב-db.seq — הגנת-מקור (בסגנון conformance manifest), כי גזירת ה-rid ב-JSX.
 */
import { describe, expect, it } from 'vitest';
import manageSrc from '../../components/courses/ManageModal.tsx?raw';
import donationSrc from '../../components/supporters/DonationModal.tsx?raw';

describe('🧾 ratchet — מספר קבלה ב-UI מהמונה הרציף, לא מ-db.seq', () => {
  it('ManageModal (קבלת חוג) גוזר R- מ-receiptSeq ולא מ-db.seq', () => {
    expect(manageSrc).toMatch(/'R-'\s*\+[^;\n]*receiptSeq/);
    // באג שנתפס: 'R-' + ...db.seq — אסור שיחזור
    expect(manageSrc).not.toMatch(/'R-'\s*\+[^;\n]*\.db\.seq\b/);
  });

  it('DonationModal (קבלת תרומה) גוזר D- מ-donationSeq ולא מ-db.seq', () => {
    expect(donationSrc).toMatch(/'D-'\s*\+[^;\n]*donationSeq/);
    expect(donationSrc).not.toMatch(/'D-'\s*\+[^;\n]*\.db\.seq\b/);
  });
});
