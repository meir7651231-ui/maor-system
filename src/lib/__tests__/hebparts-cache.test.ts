/**
 * ratchet — ANALYSIS low: hpCache גדל ללא-גבול (דליפת-זיכרון איטית בניווט-לוח).
 * hebPartsOfIso ממומואיז עם מטמון חסום שמתנקה בחריגה — הבדיקה מוודאת שהניקוי לא
 * פוגע בנכונות: גם אחרי >תקרת-המטמון תאריכים ייחודיים, כל ערך זהה ל-hebParts הישיר.
 */
import { describe, it, expect } from 'vitest';
import { hebParts, hebPartsOfIso } from '../hebrew';
import hebrewSrc from '../hebrew.ts?raw';
import calLibSrc from '../../components/calendar/calLib.ts?raw';

describe('✓ ratchet — hebPartsOfIso (מטמון חסום, נכון)', () => {
  it(
    'נחיל ב׳ (3.9): נכון גם אחרי 35k תאריכים ייחודיים (>תקרת 30k ⇒ פינוי-הישן-ביותר, לא clear-all)',
    () => {
      // ~96 שנים של ימים ⇒ חוצה את HP_CACHE_MAX=30_000 ומפעיל פינוי לפחות 5000 פעמים.
      // ההשוואה הישירה על מדגם (כל תאריך 5) + על אלף התאריכים האחרונים (אחרי שהפינוי כבר רץ).
      const start = Date.UTC(1990, 0, 1);
      const isos: string[] = [];
      for (let i = 0; i < 35_000; i++) {
        const iso = new Date(start + i * 86400000).toISOString().slice(0, 10);
        isos.push(iso);
        const hp = hebPartsOfIso(iso);
        if (i % 5 === 0 || i >= 34_000) expect(hp).toEqual(hebParts(new Date(iso + 'T12:00:00')));
      }
      // התאריך הראשון פונה מהמטמון (הישן-ביותר) — בנייה-מחדש חייבת להחזיר ערך זהה
      expect(hebPartsOfIso(isos[0])).toEqual(hebParts(new Date(isos[0] + 'T12:00:00')));
      expect(hebPartsOfIso(isos[isos.length - 1])).toEqual(hebParts(new Date(isos[isos.length - 1] + 'T12:00:00')));
    },
    30_000,
  );

  it('🛡 הגנת-מקור: תקרה 30k + פינוי-הישן-ביותר (Map שומר סדר-הכנסה) בשני המטמונים — לא clear()', () => {
    // המטמון עצמו פרטי-למודול (לא ניתן-לבדיקה ישירה) ⇒ נועלים את הקוד: תקרה + delete של המפתח הראשון.
    expect(hebrewSrc).toContain('const HP_CACHE_MAX = 30_000;');
    expect(hebrewSrc).toContain('hpCacheShared.delete(hpCacheShared.keys().next().value as string)');
    expect(hebrewSrc).not.toContain('hpCacheShared.clear()');
    expect(calLibSrc).toContain('const HP_CACHE_MAX = 30_000;');
    expect(calLibSrc).toContain('hpCache.delete(hpCache.keys().next().value as string)');
    expect(calLibSrc).not.toContain('hpCache.clear()');
  });

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
