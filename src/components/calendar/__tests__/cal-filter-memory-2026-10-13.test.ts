/**
 * ratchet — סינון-הלוח נשמר במעבר בין מסכים **וגם אחרי רענון** (בקשת-בעלים 13.10).
 *
 * 🐛 "כאשר אני מבצע סינון בלוח שנה ועובר למסך אחר השינויים לא נשמרים — הוא חוזר למצב
 * ללא סינון": ב-CalendarView הסינון (וגם מצב-התצוגה יומי/שבועי/חודשי ועברי/לועזי)
 * הוחזקו ב-useState ⇒ כשהמסך יורד ועולה — אופסו. שלב א׳: useRemembered (זיכרון-סשן).
 * שלב ב׳ (הכרעת-בעלים 13.10 "כן — גם אחרי רענון"): usePersisted — זיכרון-סשן + localStorage פר-ארגון,
 * עם חיטוי (ערך פגום/ישן ⇒ ברירת-המחדל, לא קריסה).
 */
import { describe, expect, it } from 'vitest';
import src from '../CalendarView.tsx?raw';
import memSrc from '../../../lib/filterMemory.ts?raw';
import { DEFAULT_FILTERS, keepBool, keepCalFilters, keepViewMode } from '../calLib';

describe('🗓 הלוח זוכר את הסינון ואת מצב-התצוגה', () => {
  it('הסינון/התצוגה/עברי דרך usePersisted (לא useState) — עם חיטוי', () => {
    expect(src).toContain("usePersisted<CalFilters>('cal.filters', DEFAULT_FILTERS, keepCalFilters)");
    expect(src).toContain("usePersisted<CalViewMode>('cal.viewMode', 'month', keepViewMode)");
    expect(src).toContain("usePersisted('cal.hebMode', () => initialHebMode(useApp.getState().config), keepBool)");
    expect(src).not.toMatch(/useState<CalFilters>/);
  });

  it('usePersisted: פר-ארגון (nsLsKey), זיכרון-סשן קודם, כל גישה ל-storage ב-try', () => {
    expect(memSrc).toContain("const lsKey = 'maor_keep:' + key;");
    expect(memSrc).toContain('localStorage.getItem(nsLsKey(lsKey))');
    expect(memSrc).toContain('localStorage.setItem(nsLsKey(lsKey), JSON.stringify(v));');
    expect(memSrc).toContain('if (mem.has(key)) return mem.get(key) as T;');
  });
});

describe('🧼 חיטוי ערך שמור', () => {
  it('מסננים: מפתחות מוכרים בוליאניים בלבד; חסר ⇒ ברירת-מחדל; זבל ⇒ undefined', () => {
    expect(keepCalFilters({ urgentOnly: true, courses: false, junk: 1, events: 'yes' })).toEqual({ ...DEFAULT_FILTERS, urgentOnly: true, courses: false });
    expect(keepCalFilters(null)).toBeUndefined();
    expect(keepCalFilters([true])).toBeUndefined();
    expect(keepCalFilters('x')).toBeUndefined();
  });
  it('מצב-תצוגה ו-עברי', () => {
    expect(keepViewMode('week')).toBe('week');
    expect(keepViewMode('year')).toBeUndefined();
    expect(keepBool(false)).toBe(false);
    expect(keepBool('true')).toBeUndefined();
  });
});
