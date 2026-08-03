/**
 * ratchet — #9: הסרת מפגש מוקדם הזיזה את מספור "קבוצה N" הפוזיציוני, וכל
 * השיבוצים שאחריו הצביעו לקבוצה הלא-נכונה. groupRemapOnRemoval מחזיר את התווית
 * שהוסרה + מיפוי תווית-ישנה⇒חדשה למפגשים ששרדו וזזו, כדי שהשיבוצים יעודכנו.
 */
import { describe, it, expect } from 'vitest';
import { groupRemapOnRemoval } from '../lib';
import type { CourseSession, Weekday } from '../../../types/domain';

function ss(day: number, label = ''): CourseSession {
  return { day: day as Weekday, time: '17:00', label };
}

describe('✓ ratchet — groupRemapOnRemoval (#9 מזהי-קבוצה יציבים)', () => {
  it('הסרת המפגש הראשון (פוזיציוני) ⇒ קבוצה 2⇒1, קבוצה 3⇒2; המוסרת = "קבוצה 1"', () => {
    const sessions = [ss(0), ss(1), ss(2)]; // קבוצה 1/2/3
    const { removed, remap } = groupRemapOnRemoval(sessions, 0);
    expect(removed).toBe('קבוצה 1');
    expect(remap.get('קבוצה 2')).toBe('קבוצה 1');
    expect(remap.get('קבוצה 3')).toBe('קבוצה 2');
    expect(remap.size).toBe(2);
  });

  it('הסרת המפגש האחרון ⇒ אין מיפוי (שום מפגש לא זז)', () => {
    const sessions = [ss(0), ss(1), ss(2)];
    const { removed, remap } = groupRemapOnRemoval(sessions, 2);
    expect(removed).toBe('קבוצה 3');
    expect(remap.size).toBe(0);
  });

  it('מפגש בעל label מפורש אינו זז — תוויתו קבועה ולא נכנסת ל-remap', () => {
    // אינדקס 0 פוזיציוני, אינדקס 1 מתויג "בוגרים", אינדקס 2 פוזיציוני (קבוצה 3)
    const sessions = [ss(0), ss(1, 'בוגרים'), ss(2)];
    const { removed, remap } = groupRemapOnRemoval(sessions, 0);
    expect(removed).toBe('קבוצה 1');
    expect(remap.has('בוגרים')).toBe(false); // label קבוע
    expect(remap.get('קבוצה 3')).toBe('קבוצה 2'); // הפוזיציוני זז
    expect(remap.size).toBe(1);
  });
});
