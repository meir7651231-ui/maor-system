/**
 * עקביות שכבת התאריך העברי: hebDateFull (תצוגה) חייב להסכים עם isoToHebParts
 * (קלט/עריכה) על אותו יום — שניהם משתמשים בצהריים מקומי כדי לא לסטות ביום
 * באזורי זמן ממערב ל-UTC. גם עמידות לקלט datetime ולזבל.
 */
import { describe, expect, it } from 'vitest';
import { hebDateFull, gem } from '../hebrew';
import { isoToHebParts } from '../hebdate';

// טווח תאריכים מגוון לאורך השנה (כולל סוף/תחילת חודש, שנים שונות)
const DATES = [
  '2026-01-01', '2026-03-20', '2026-08-06', '2026-09-12', '2026-12-31',
  '2024-02-29', '2025-07-15', '2027-04-01', '2023-10-07', '2026-06-30',
];

describe('🔗 hebDateFull ⟷ isoToHebParts — אותו יום עברי בדיוק', () => {
  for (const iso of DATES) {
    it(`${iso}: היום בגימטריה של התצוגה = היום של הקלט`, () => {
      const parts = isoToHebParts(iso);
      expect(parts).not.toBeNull();
      const dayGem = hebDateFull(iso).split(' ')[0];
      expect(dayGem).toBe(gem(parts!.day));
    });
    it(`${iso}: שם החודש של התצוגה מכיל את חודש הקלט`, () => {
      const parts = isoToHebParts(iso);
      // hebDateFull: "<יום> <חודש> <שנה>" — האמצע הוא שם החודש העברי
      const monthPart = hebDateFull(iso).split(' ').slice(1, -1).join(' ');
      expect(monthPart.length).toBeGreaterThan(0);
      // אדר מעוברת: fmtHM מחזיר "אדר א׳/ב׳", isoToHebParts מחזיר "אדר א׳/ב׳" — תואם
      expect(monthPart).toContain(parts!.monthHe.replace(/[׳״]/g, '').slice(0, 2));
    });
  }
});

describe('🛡️ hebDateFull — עמידות קלט', () => {
  it('קלט datetime (עם שעה) נותן אותה תוצאה כמו קלט תאריך בלבד', () => {
    expect(hebDateFull('2026-08-06T23:30:00')).toBe(hebDateFull('2026-08-06'));
    expect(hebDateFull('2026-08-06T00:15:00')).toBe(hebDateFull('2026-08-06'));
  });
  it('ריק/זבל → מחרוזת ריקה, בלי קריסה', () => {
    expect(hebDateFull('')).toBe('');
    expect(hebDateFull('not-a-date')).toBe('');
    expect(hebDateFull('2026-99-99')).toBe('');
  });
  it('שעה שונה באותו יום לא משנה את היום העברי (חסינות שעון/אזור)', () => {
    const base = hebDateFull('2026-03-20');
    for (const t of ['T01:00:00', 'T06:30:00', 'T12:00:00', 'T18:45:00', 'T22:59:00']) {
      expect(hebDateFull('2026-03-20' + t)).toBe(base);
    }
  });
});
