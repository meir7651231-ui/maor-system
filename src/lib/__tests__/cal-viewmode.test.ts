/**
 * ratchet · 🗓 מצבי-תצוגה ללוחות — יומי/שבועי/חודשי (בקשת-בעלים 30.8
 * "תצוגה יומי שבועי חודשי לכל הלוחות שנה"). מנוע טהור מעל buildMonthGrid.
 *
 * שימור: יום=תא-יחיד, שבוע=7 תאים (ראשון–שבת), ניווט prev/next קופץ ביחידה,
 * האירועים מתפזרים לתאים הנכונים, ותאימות-לאחור: buildGrid('month')≡buildMonthGrid.
 */
import { describe, expect, it } from 'vitest';
import { buildDayGrid, buildWeekGrid, buildMonthGrid, buildGrid, CAL_VIEW_MODES } from '../monthGrid';

interface Ev { date: string; id: string }
const evs: Ev[] = [
  { date: '2026-08-30', id: 'a' }, // ראשון
  { date: '2026-08-30', id: 'b' },
  { date: '2026-09-01', id: 'c' }, // שלישי (אותו שבוע)
  { date: '2026-09-06', id: 'd' }, // ראשון הבא (מחוץ לשבוע)
];

describe('🗓 ratchet — מצבי-תצוגה יומי/שבועי/חודשי', () => {
  it('יום: תא יחיד עם אירועי-היום בלבד; ניווט ±יום', () => {
    const g = buildDayGrid(evs, '2026-08-30', false);
    expect(g.cells).toHaveLength(1);
    expect(g.cells[0].iso).toBe('2026-08-30');
    expect(g.cells[0].events.map((e) => e.id)).toEqual(['a', 'b']);
    expect(g.prevIso).toBe('2026-08-29');
    expect(g.nextIso).toBe('2026-08-31');
  });

  it('שבוע: 7 תאים ראשון–שבת סביב העוגן; אירועים בתאים הנכונים; ניווט ±7', () => {
    const g = buildWeekGrid(evs, '2026-09-01', false); // שבוע 30.8–5.9
    expect(g.cells).toHaveLength(7);
    expect(g.cells[0].iso).toBe('2026-08-30'); // ראשון
    expect(g.cells[6].iso).toBe('2026-09-05'); // שבת
    expect(g.cells[0].events.map((e) => e.id)).toEqual(['a', 'b']);
    expect(g.cells[2].events.map((e) => e.id)).toEqual(['c']); // שלישי 1.9
    // 6.9 (ראשון הבא) לא בשבוע הזה
    expect(g.cells.every((c) => c.iso !== '2026-09-06')).toBe(true);
    expect(g.prevIso).toBe('2026-08-23');
    expect(g.nextIso).toBe('2026-09-06');
  });

  it('חודש: תאימות-לאחור — buildGrid("month") זהה ל-buildMonthGrid', () => {
    const a = buildGrid(evs, '2026-08-30', false, 'month');
    const b = buildMonthGrid(evs, '2026-08-30', false);
    expect(a.cells.map((c) => c.iso)).toEqual(b.cells.map((c) => c.iso));
    expect(a.label).toBe(b.label);
  });

  it('בורר: buildGrid מנתב לפי mode; 3 מצבים קיימים', () => {
    expect(CAL_VIEW_MODES).toEqual(['day', 'week', 'month']);
    expect(buildGrid(evs, '2026-08-30', false, 'day').cells).toHaveLength(1);
    expect(buildGrid(evs, '2026-08-30', false, 'week').cells).toHaveLength(7);
    expect(buildGrid(evs, '2026-08-30', false, 'month').cells.length).toBeGreaterThan(27);
  });

  it('שבוע עברי: 7 תאים גם במצב-עברי', () => {
    const g = buildWeekGrid(evs, '2026-09-01', true);
    expect(g.cells).toHaveLength(7);
    expect(g.cells[0].iso).toBe('2026-08-30');
  });
});
