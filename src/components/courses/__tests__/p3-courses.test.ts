/**
 * ratchet — שאריות קורסים P3 (פריטים 1-3).
 * פריט 1: groupsHintFromAudience — regex 'קבוצות|פעמים' מהלגאסי, הצעה בלבד.
 * פריט 2: פילטר המסלול בטבלה כולל את כל 4 המסלולים.
 * פריט 3: כפתור 🔔 תזכורת ללוח בכרטיס החוג (הגנת-מקור).
 */
import { describe, expect, it } from 'vitest';
import { groupsHintFromAudience } from '../lib';
import coursesViewSrc from '../CoursesView.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';

describe('🎓 ratchet — P3 פריטי קורסים', () => {
  it('פריט 1: הצעת קבוצות מ-audience — קבוצות/פעמים, גבולות 2–12, בלי התאמה = null', () => {
    expect(groupsHintFromAudience('בנות · 3 קבוצות')).toBe(3);
    expect(groupsHintFromAudience('פעמיים בשבוע, 2 פעמים')).toBe(2);
    expect(groupsHintFromAudience('נשים')).toBeNull();
    expect(groupsHintFromAudience('')).toBeNull();
    expect(groupsHintFromAudience('1 קבוצות')).toBeNull(); // מתחת ל-2
    expect(groupsHintFromAudience('50 קבוצות')).toBeNull(); // מעל 12
  });

  it('פריט 2: פילטר המסלול כולל חצי-שנתי ושנתי (הגנת-מקור)', () => {
    expect(coursesViewSrc).toContain('<option value="half_year">מנוי חצי-שנתי</option>');
    expect(coursesViewSrc).toContain('<option value="year">מנוי שנתי</option>');
  });

  it('פריט 3: 🔔 תזכורת ללוח — reminder על שם החוג + ניווט ללוח (הגנת-מקור)', () => {
    expect(detailSrc).toContain('🔔 תזכורת ללוח');
    expect(detailSrc).toMatch(/type: 'reminder'/);
    expect(detailSrc).toMatch(/go\('calendar'\)/);
    // ההצעה מקהל היעד אינה דורסת — רק כפתור השלמה
    expect(detailSrc).toContain('groupsHintFromAudience');
    expect(detailSrc).toContain('השלמה ל-');
  });
});
