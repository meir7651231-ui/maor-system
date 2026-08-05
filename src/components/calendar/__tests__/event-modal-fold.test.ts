/**
 * ratchet — UX סבב-ה׳ (השלמה, 6.8.2026): מודאל-אירוע פשוט/מתקדם.
 * הליבה גלויה (כותרת, תאריך+צ'יפים, שעה, סוג, הערות); מחיר/חדר/שיוך/דחיפות
 * מקופלים תחת "▼ פרטים נוספים". אפס אובדן: כל השדות נשארים, והקיפול נפתח
 * אוטומטית כשעורכים אירוע עם ערך קיים או כש-prefill מביא חדר/שיוך
 * (הזמנת-משבצת מהיומן חייבת להציג את בורר-החדר מיד).
 */
import { describe, expect, it } from 'vitest';
import src from '../EventModal.tsx?raw';

describe('📅 ratchet — מודאל-אירוע פשוט/מתקדם', () => {
  it('כל שדות-המתקדם נשארו בקובץ — קוננו, לא נמחקו', () => {
    expect(src).toContain('PRIORITY_OPTIONS');
    expect(src).toContain('מחיר האירוע (₪)');
    expect(src).toContain('options={roomOptions}');
    expect(src).toContain('options={famOptions}');
    expect(src).toContain('בוצע ✓');
  });

  it('נפתח אוטומטית: עריכה-עם-ערך או prefill חדר/שיוך (הזמנת-משבצת מהיומן)', () => {
    expect(src).toMatch(/ev\.price \|\| ev\.roomId \|\| ev\.famId \|\| ev\.done/);
    expect(src).toContain('!!(prefill?.roomId || prefill?.famId)');
    expect(src).toContain("'▲ פחות פרטים' : '▼ פרטים נוספים'");
    expect(src).toMatch(/\{moreOpen && \(/);
  });

  it('הליבה גלויה תמיד — כותרת/תאריך/שעה/סוג/הערות אינם בתוך הקיפול', () => {
    const foldStart = src.indexOf('{moreOpen && (');
    for (const core of ['label="כותרת *"', 'label="תאריך *"', 'label="שעה"', 'label="סוג"', 'label="הערות"']) {
      const idx = src.indexOf(core);
      expect(idx).toBeGreaterThan(-1);
      expect(idx).toBeLessThan(foldStart);
    }
  });
});
