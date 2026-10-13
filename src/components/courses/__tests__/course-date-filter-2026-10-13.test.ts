/**
 * ratchet — סינון חוגים לפי תאריך מסוים (בקשת-בעלים 13.10 "תאריך מסוים").
 * חוג מתקיים בתאריך ⇔ התאריך בטווח start..end + אחד המפגשים ביום-בשבוע שלו. שבת/חג ⇒ אזהרה בשורת-המצב.
 * 🐛 נלווה: סינון-היום בדק רק c.sessions — חוג בלי sessions (fallback ל-weekday) נעלם מהסינון.
 */
import { describe, expect, it } from 'vitest';
import { courseMeetsOn } from '../lib';
import type { Course } from '../../../types/domain';
import viewSrc from '../CoursesView.tsx?raw';

const crs = (over: Partial<Course> = {}): Course => ({ id: 'c', name: 'ציור', start: '2026-09-01', end: '2027-06-30', weekday: 1, time: '16:00', sessions: [], ...over }) as unknown as Course;

describe('courseMeetsOn', () => {
  it('יום-המפגש בטווח ⇒ כן; יום אחר ⇒ לא', () => {
    expect(courseMeetsOn(crs(), '2026-10-12')).toBe(true); // יום שני
    expect(courseMeetsOn(crs(), '2026-10-13')).toBe(false); // שלישי
  });
  it('מחוץ לטווח ⇒ לא; טווח חסר ⇒ פתוח', () => {
    expect(courseMeetsOn(crs(), '2026-08-31')).toBe(false);
    expect(courseMeetsOn(crs(), '2027-07-05')).toBe(false);
    expect(courseMeetsOn(crs({ start: '', end: '' }), '2030-01-07')).toBe(true);
  });
  it('כמה מפגשים בשבוע — כל אחד מהם', () => {
    const c = crs({ sessions: [{ day: 0, time: '10:00', label: 'א' }, { day: 3, time: '10:00', label: 'ב' }] });
    expect(courseMeetsOn(c, '2026-10-11')).toBe(true); // ראשון
    expect(courseMeetsOn(c, '2026-10-14')).toBe(true); // רביעי
    expect(courseMeetsOn(c, '2026-10-12')).toBe(false); // שני (ה-weekday הישן לא נחשב כשיש sessions)
  });
  it('תאריך לא תקין ⇒ לא', () => {
    expect(courseMeetsOn(crs(), '')).toBe(false);
    expect(courseMeetsOn(crs(), '12/10/2026')).toBe(false);
  });
});

describe('🛡 חיווט במסך-החוגים', () => {
  it('בורר-תאריך זכור, גובר על בורר-היום ועל ההיסטוריה', () => {
    expect(viewSrc).toContain("const [dateF, setDateF] = useRemembered('crs.dateF', '');");
    expect(viewSrc).toContain('if (!courseMeetsOn(c, dateF)) return false;');
    expect(viewSrc).toContain("if (!dateF && histF === 'active' && isHistory) return false;");
    expect(viewSrc).toContain('aria-label="סינון לפי תאריך"');
  });
  it('שורת-מצב: כמה מתקיימים + אזהרת שבת/חג (blockReason של הלוח)', () => {
    expect(viewSrc).toContain("const dateBlock = dateF ? blockReason(new Date(dateF + 'T12:00:00'), 'course') : null;");
    expect(viewSrc).toContain('className="crs-date-status"');
  });
  it('🐛 בורר-היום דרך sessionsOf (חוג בלי sessions לא נעלם)', () => {
    expect(viewSrc).not.toContain('!c.sessions.some((x) => x.day === dayF)');
  });
});
