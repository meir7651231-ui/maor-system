/**
 * ratchet — צ׳יפי תאריכים מהירים (P2 פער 26, בלי דגל — שיפור טופס נקודתי).
 * quickDate טהורה: היום/מחר/בעוד שבוע/בעוד חודש, פרסור T12:00:00 (צהריים
 * מקומי — בלי נפילות אזור-זמן), כולל מעברי חודש ושנה.
 */
import { describe, expect, it } from 'vitest';
import { QUICK_DATE_CHIPS, quickDate } from '../calLib';
import eventModalSrc from '../EventModal.tsx?raw';

describe('📅 ratchet — quickDate (פער 26)', () => {
  it('ארבעת הקיצורים, כולל מעבר חודש ומעבר שנה', () => {
    expect(quickDate('2026-07-30', 'today')).toBe('2026-07-30');
    expect(quickDate('2026-07-30', 'tomorrow')).toBe('2026-07-31');
    expect(quickDate('2026-07-30', 'week')).toBe('2026-08-06');
    expect(quickDate('2026-07-30', 'month')).toBe('2026-08-30');
    // מעבר שנה — מחר מ-31 בדצמבר, וחודש קדימה מדצמבר
    expect(quickDate('2026-12-31', 'tomorrow')).toBe('2027-01-01');
    expect(quickDate('2026-12-15', 'month')).toBe('2027-01-15');
    // 31 בחודש שאין בו 31 — גלישת Date הרגילה קדימה (אוק׳ 31 + חודש = דצמ׳ 1)
    expect(quickDate('2026-10-31', 'month')).toBe('2026-12-01');
  });

  it('הצ׳יפים בנוסח ובסדר קבועים ומחווטים לטופס האירוע', () => {
    expect(QUICK_DATE_CHIPS.map(([, l]) => l)).toEqual(['היום', 'מחר', 'בעוד שבוע', 'בעוד חודש']);
    expect(eventModalSrc).toContain('QUICK_DATE_CHIPS.map');
    expect(eventModalSrc).toMatch(/quickDate\(isoToday\(\), kind\)/);
  });
});
