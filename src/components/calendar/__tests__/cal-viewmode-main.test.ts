/**
 * ratchet · 🗓 הלוח-הראשי (לוח שנה) — תצוגת יומי/שבועי/חודשי (בקשת-בעלים 30.8
 * "תצוגה יומי שבועי חודשי לכל הלוחות שנה").
 *
 * שימור: buildWeekGrid=7 תאים ראשון–שבת עם items פר-יום, buildDayGrid=תא-יחיד,
 * ניווט prev/next קופץ ביחידה, ו-CalendarView מחווט למצב + פאנל-יום מלא-רוחב.
 */
import { describe, expect, it } from 'vitest';
import { buildWeekGrid, buildDayGrid, buildGregorianGrid, isoOf } from '../calLib';
import { emptyDb, type Db, type OrgEvent } from '../../../types/domain';
import calViewSrc from '../CalendarView.tsx?raw';

function ev(over: Partial<OrgEvent>): OrgEvent {
  return {
    id: over.id ?? 'e1', title: 'אירוע', date: '', time: '', type: 'org', customType: '',
    notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false, ...over,
  };
}

function dbWith(events: OrgEvent[]): Db {
  return { ...emptyDb(), events };
}

describe('🗓 ratchet — לוח-שנה: מצבי יומי/שבועי/חודשי', () => {
  it('שבוע: 7 תאים ראשון–שבת, האירוע בתא-היום הנכון, ניווט ±7', () => {
    const db = dbWith([ev({ id: 'a', title: 'ישיבה', date: '2026-09-01', time: '10:00' })]); // שלישי
    const g = buildWeekGrid(db, '2026-09-02'); // רביעי — שבוע 30.8–5.9
    expect(g.cells).toHaveLength(7);
    expect(g.cells[0].iso).toBe('2026-08-30'); // ראשון
    expect(g.cells[6].iso).toBe('2026-09-05'); // שבת
    const tue = g.cells.find((c) => c.iso === '2026-09-01')!;
    expect(tue.items.some((it) => it.ev?.id === 'a')).toBe(true);
    expect(g.prevIso).toBe('2026-08-23');
    expect(g.nextIso).toBe('2026-09-06');
  });

  it('יום: תא-יחיד עם אירועי-היום; ניווט ±יום', () => {
    const db = dbWith([ev({ id: 'a', date: '2026-09-01' }), ev({ id: 'b', date: '2026-09-02' })]);
    const g = buildDayGrid(db, '2026-09-01');
    expect(g.cells).toHaveLength(1);
    expect(g.cells[0].iso).toBe('2026-09-01');
    expect(g.cells[0].items.some((it) => it.ev?.id === 'a')).toBe(true);
    expect(g.cells[0].items.some((it) => it.ev?.id === 'b')).toBe(false);
    expect(g.prevIso).toBe('2026-08-31');
    expect(g.nextIso).toBe('2026-09-02');
  });

  it('חודש נשאר כמות-שהוא (42 תאים) — אפס-רגרסיה', () => {
    const g = buildGregorianGrid(emptyDb(), 2026, 8);
    expect(g.cells).toHaveLength(42);
  });

  it('🛡 CalendarView: בורר-מצב + עוגן-טווח + ניווט/פאנל מודעי-מצב', () => {
    expect(calViewSrc).toContain('<CalViewTabs');
    expect(calViewSrc).toContain("useState<CalViewMode>('month')");
    expect(calViewSrc).toContain('buildWeekGrid(db, spanAnchor');
    expect(calViewSrc).toContain('buildDayGrid(db, spanAnchor');
    // ניווט prev/next קופץ ביחידת-המצב, לא רק חודש
    expect(calViewSrc).toContain("if (viewMode !== 'month')");
    // תצוגת-יום מלאת-רוחב + כל הגלולות
    expect(calViewSrc).toContain("viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)'");
    expect(calViewSrc).toContain('maxPills={viewMode');
  });

  it('בונה מקבל isoOf תקין (עוגן=היום) בלי לזרוק', () => {
    expect(() => buildDayGrid(emptyDb(), isoOf(new Date()))).not.toThrow();
    expect(() => buildWeekGrid(emptyDb(), isoOf(new Date()))).not.toThrow();
  });
});
