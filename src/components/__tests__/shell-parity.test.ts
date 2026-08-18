/**
 * ratchet — שוויון-כרום בין שלושת השלדים (top / side-wide / side).
 *
 * הבאג (18.8.2026, "לא בכל ערכות נושא יש את כל היכולת"): ערכת-הנושא בוחרת שלד
 * (tsohar→side · or-rishon→side-wide · heichal/kehila→top). כל שלד מרנדר את
 * כפתורי-הכרום בנפרד — וכפתור **❓ עזרה** (`helpSideBtn`) חוּוט ל-side-wide אך
 * **נשמט מ-side (צֹהַר)** ⇒ יכולת שנעלמת בהחלפת ערכה. התיקון: הוסף ל-side.
 *
 * השומר: כל כפתור-צד משותף חייב להופיע פעמיים (שני שלדי-הצד), כל כפתור-רצועה
 * פעם אחת (השלד העליון), וכפתורי-הכול (backBtn/userChip) שלוש פעמים.
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';

/** כמה פעמים ה-token מרונדר כ-JSX ‏(`{token}`) — לא סופר את ההגדרה `const token`. */
const uses = (token: string) => appSrc.split('{' + token + '}').length - 1;

describe('🧩 ratchet — שוויון-כרום בין שלושת השלדים', () => {
  it('כפתורי-הצד המשותפים מופיעים בשני שלדי-הצד (side + side-wide)', () => {
    // ❓ עזרה — הבאג המקורי: היה 1 (רק side-wide), צריך 2.
    expect(uses('helpSideBtn')).toBe(2);
    // עמיתיו — כבר היו 2, נעולים כדי לתפוס נסיגה עתידית.
    expect(uses('privacySideBtn')).toBe(2);
    expect(uses('adminSideBtn')).toBe(2);
    expect(uses('managerSideBtn')).toBe(2);
  });

  it('לכל כפתור-צד יש בן-זוג לרצועה העליונה, המופיע פעם אחת (topShell)', () => {
    expect(uses('helpGearBtn')).toBe(1);
    expect(uses('privacyGearBtn')).toBe(1);
    expect(uses('adminGearBtn')).toBe(1);
    expect(uses('managerGearBtn')).toBe(1);
  });

  it('כפתורי-הכול (חזרה/חשבון) בשלושת השלדים', () => {
    expect(uses('backBtn')).toBe(3);
    expect(uses('userChip')).toBe(3);
  });
});
