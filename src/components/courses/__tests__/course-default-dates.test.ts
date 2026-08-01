/**
 * ratchet — ברירת-מחדל דינמית לטווח תאריכי חוג (תיקון 1.8.2026).
 *
 * הבאג: `CourseForm.initState` החזיר literal קשיח `start:'2025-09-01'` /
 * `end:'2026-07-31'`. ברגע שהתאריך הלועזי חלף את ה-end הקבוע (מ-1.8.2026),
 * כל חוג חדש נולד כשה-end שלו בעבר. הסינון `c.end >= today` ב-JoinModal
 * (שיבוץ מכרטיס המשפחה) וב-EnrollModal מסנן חוגים כאלה בשקט ⇒ "לא נמצאו
 * חוגים פעילים תואמים" ⇒ save נכשל ⇒ אין שיבוץ ⇒ "N מתוך N" לא מופיע.
 * זו הסיבה ש-demo-walkthrough עבר ב-31.7 ונפל ב-1.8.
 *
 * התיקון: `defaultCourseDates(today)` — טהורה, מחשבת את שנת-הלימודים מהיום
 * (1.9 עד 31.7 שאחריה), מתגלגלת ב-1.8. חוג חדש לעולם אינו נולד פג-תוקף.
 */
import { describe, expect, it } from 'vitest';
import { defaultCourseDates } from '../lib';
import formSrc from '../CourseForm.tsx?raw';

describe('📅 ratchet — ברירת-מחדל דינמית לתאריכי חוג (תיקון 1.8.2026)', () => {
  it('חוג חדש לעולם אינו נולד פג-תוקף — end תמיד >= today (כל חודשי השנה)', () => {
    for (let mo = 1; mo <= 12; mo++) {
      for (const day of ['01', '15', '28']) {
        const today = `2026-${String(mo).padStart(2, '0')}-${day}`;
        const { start, end } = defaultCourseDates(today);
        expect(end >= today, `end ${end} חייב להיות >= today ${today}`).toBe(true);
        expect(start <= end).toBe(true);
      }
    }
  });

  it('1.8 = גלגול לשנת-הלימודים הבאה (הבאג המדויק שנפל)', () => {
    // 31.7 — עדיין השנה הנוכחית, end=31.7 של אותה שנה (= today, תקין)
    expect(defaultCourseDates('2026-07-31')).toEqual({ start: '2025-09-01', end: '2026-07-31' });
    // 1.8 — מתגלגל: start=1.9.2026, end=31.7.2027 (בעתיד, לא פג-תוקף)
    expect(defaultCourseDates('2026-08-01')).toEqual({ start: '2026-09-01', end: '2027-07-31' });
  });

  it('אמצע שנת-לימודים (ינואר) — נשאר בשנה שנפתחה בספטמבר הקודם', () => {
    expect(defaultCourseDates('2027-01-15')).toEqual({ start: '2026-09-01', end: '2027-07-31' });
  });

  it('ספטמבר = תחילת שנה חדשה', () => {
    expect(defaultCourseDates('2026-09-01')).toEqual({ start: '2026-09-01', end: '2027-07-31' });
  });

  it('הגנת-מקור: אין literal תאריך קשיח ב-initState של CourseForm', () => {
    // הדפוס שגרם לבאג — literal של תאריך לועזי מלא בקוד הטופס
    expect(formSrc).not.toMatch(/['"]20\d{2}-\d{2}-\d{2}['"]/);
    // הטופס משתמש בברירת-המחדל הדינמית
    expect(formSrc).toMatch(/defaultCourseDates\(\)/);
  });
});
