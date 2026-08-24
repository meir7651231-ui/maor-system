/**
 * ratchet · סגולת 40 יום — תזכורות מדורגות (בקשת-שטח).
 *
 * הבקשה: "יש לי סגולה, אני צריכה לחשב כל פעם מתי יוצא עוד 40 יום מעכשיו, ורוצה
 * תזכורת מחר / עוד שבוע / עוד 35 יום / עוד 40 יום". 40 = יעד-הסגולה; הדילוגים
 * נבחרו: 1 · 7 · 21 · 35 · 40 (הסיום מסומן final).
 *
 * שימור: חישוב-תאריכים דטרמיניסטי (בלי Date.now), חוצה-חודשים/שנים.
 */
import { describe, expect, it } from 'vitest';
import { SEGULA_OFFSETS, segulaReminders, segulaTitle } from '../lib';

describe('🕯 ratchet — סגולת 40 יום', () => {
  it('1. חמש נקודות מדורגות, 40 = הסיום', () => {
    const r = segulaReminders('2026-01-01');
    expect(r.map((x) => x.day)).toEqual([1, 7, 21, 35, 40]);
    expect(r.map((x) => x.date)).toEqual([
      '2026-01-02', // +1
      '2026-01-08', // +7
      '2026-01-22', // +21
      '2026-02-05', // +35 (חוצה חודש)
      '2026-02-10', // +40
    ]);
    expect(r[4].final).toBe(true);
    expect(r.slice(0, 4).every((x) => !x.final)).toBe(true);
  });

  it('2. חוצה-שנה נכון', () => {
    const r = segulaReminders('2026-12-20');
    expect(r[4].date).toBe('2027-01-29'); // +40 יום
  });

  it('3. כותרת — סיום מול ביניים', () => {
    const r = segulaReminders('2026-01-01');
    const target = Math.max(...SEGULA_OFFSETS);
    expect(segulaTitle('אורלי', r[0], target)).toBe('🕯 סגולה — אורלי · יום 1/40');
    expect(segulaTitle('אורלי', r[4], target)).toBe('🎯 סיום סגולה — אורלי · יום 40/40');
  });
});
