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
import detailSrc from '../SupporterDetail.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';

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

  // בקשת-בעלים 30.8: "סגולת ארבעים יום תוריד ותכניס את זה כפתור בשם 40 ימים
  // שיחשב לבד וירשום תזכרות בקשר הבא, מוטבע קשר לזיווג".
  describe('🕯 wiring — כפתור "40 ימים" בקשר-הבא (מחושב לבד, לזיווג)', () => {
    it('4. הקלף העצמאי הוסר — אין יותר בורר-תאריך-התחלה/מצב-מקומי', () => {
      expect(detailSrc).not.toContain('segulaStart');
      expect(detailSrc).not.toContain('בחרו תאריך-התחלה');
      expect(detailSrc).not.toContain('זריעת תזכורות');
    });

    it('5. כפתור "🕯 40 ימים" בכרטיס קשר-הבא — מחושב מהיום (isoToday) עם ייעוד זיווג', () => {
      expect(detailSrc).toContain('🕯 40 ימים');
      expect(detailSrc).toContain("seedSegulaReminders(sp.id, isoToday(), 'זיווג')");
    });

    it('6. store: seedSegulaReminders מקבל purpose ומטביע אותו בכותרת/הערה', () => {
      expect(storeSrc).toMatch(/seedSegulaReminders\(supId, startIso, purpose\)/);
      expect(storeSrc).toContain('segulaTitle(sp.name, r, target) + tag');
    });
  });
});
