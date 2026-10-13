/**
 * ratchet — סינון-הלוח נשמר במעבר בין מסכים (בקשת-בעלים 13.10).
 *
 * 🐛 "כאשר אני מבצע סינון בלוח שנה ועובר למסך אחר השינויים לא נשמרים — הוא חוזר למצב
 * ללא סינון": ב-CalendarView הסינון (וגם מצב-התצוגה יומי/שבועי/חודשי ועברי/לועזי)
 * הוחזקו ב-useState ⇒ כשהמסך יורד ועולה — אופסו. תורמים/משפחות/חוגים כבר עברו ל-useRemembered
 * ב-10.9 (#490); הלוח נשכח. עכשיו אותו מנגנון — זיכרון-סשן (רענון = נקי, במכוון).
 */
import { describe, expect, it } from 'vitest';
import src from '../CalendarView.tsx?raw';

describe('🗓 הלוח זוכר את הסינון ואת מצב-התצוגה', () => {
  it('הסינון דרך useRemembered (לא useState)', () => {
    expect(src).toContain("useRemembered<CalFilters>('cal.filters', DEFAULT_FILTERS)");
    expect(src).not.toMatch(/useState<CalFilters>/);
  });

  it('מצב-התצוגה (יומי/שבועי/חודשי) ועברי/לועזי — גם נזכרים', () => {
    expect(src).toContain("useRemembered<CalViewMode>('cal.viewMode', 'month')");
    expect(src).toContain("useRemembered('cal.hebMode'");
  });
});
