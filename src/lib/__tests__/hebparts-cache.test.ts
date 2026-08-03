/**
 * ratchet — ANALYSIS low: hpCache גדל ללא-גבול (דליפת-זיכרון איטית בניווט-לוח).
 * hebPartsOfIso ממומואיז עם מטמון חסום שמתנקה בחריגה — הבדיקה מוודאת שהניקוי לא
 * פוגע בנכונות: גם אחרי >תקרת-המטמון תאריכים ייחודיים, כל ערך זהה ל-hebParts הישיר.
 */
import { describe, it, expect } from 'vitest';
import { hebParts, hebPartsOfIso } from '../hebrew';

describe('✓ ratchet — hebPartsOfIso (מטמון חסום, נכון)', () => {
  it('זהה ל-hebParts הישיר לתאריך נתון', () => {
    const iso = '2026-08-03';
    expect(hebPartsOfIso(iso)).toEqual(hebParts(new Date(iso + 'T12:00:00')));
  });

  it('נשאר נכון אחרי >3000 תאריכים ייחודיים (ניקוי-מטמון לא משבש)', () => {
    // ~11 שנים של ימים ⇒ חוצה את HP_CACHE_MAX ומפעיל clear לפחות פעם אחת
    const start = Date.UTC(2020, 0, 1);
    for (let i = 0; i < 4200; i++) {
      const d = new Date(start + i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      // ההשוואה בכל איטרציה — אם clear היה מחזיר ערך שגוי, הבדיקה הייתה נופלת
      expect(hebPartsOfIso(iso)).toEqual(hebParts(new Date(iso + 'T12:00:00')));
    }
  });

  it('תאריך לא-חוקי ⇒ חלקים בטוחים (בלי RangeError)', () => {
    expect(hebPartsOfIso('not-a-date')).toEqual({ day: 0, month: '', year: 0 });
  });
});
