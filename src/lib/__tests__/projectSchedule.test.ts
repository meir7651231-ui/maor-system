/**
 * ratchet — מנוע-גאנט (projectSchedule). תזמון-תלויות · נתיב-קריטי · חסינות-מחזור.
 */
import { describe, expect, it } from 'vitest';
import { scheduleTasks } from '../projectSchedule';
import type { AyinName } from '../../types/domain';

const nm = (id: string, days?: number, deps?: string[]): AyinName =>
  ({ id, name: id, eyes: '', done: false, ...(days != null ? { days } : {}), ...(deps ? { deps } : {}) }) as AyinName;

describe('📅 ratchet — גאנט-תלויות', () => {
  it('שרשרת A→B→C — ES מצטבר, משך-כולל = סכום', () => {
    const s = scheduleTasks([nm('A', 3), nm('B', 2, ['A']), nm('C', 4, ['B'])]);
    const by = Object.fromEntries(s.tasks.map((t) => [t.id, t]));
    expect(by.A.start).toBe(0);
    expect(by.B.start).toBe(3);
    expect(by.C.start).toBe(5);
    expect(s.total).toBe(9);
  });

  it('משימות מקבילות — ES=0 לשתיהן, משך=המקסימום', () => {
    const s = scheduleTasks([nm('A', 3), nm('B', 5)]);
    expect(s.total).toBe(5);
    expect(s.tasks.every((t) => t.start === 0)).toBe(true);
  });

  it('נתיב-קריטי — הענף הארוך קריטי, הקצר לא', () => {
    // D תלויה ב-B(ארוך) וב-C(קצר). B על הקריטי, C לא.
    const s = scheduleTasks([nm('B', 6), nm('C', 2), nm('D', 3, ['B', 'C'])]);
    const by = Object.fromEntries(s.tasks.map((t) => [t.id, t]));
    expect(by.B.critical).toBe(true);
    expect(by.D.critical).toBe(true);
    expect(by.C.critical).toBe(false);
  });

  it('חסין-מחזור — A↔B לא נכנס ללולאה אינסופית', () => {
    const s = scheduleTasks([nm('A', 2, ['B']), nm('B', 2, ['A'])]);
    expect(s.tasks).toHaveLength(2);
    expect(Number.isFinite(s.total)).toBe(true);
  });

  it('רק שורות עם days הן משימות — שורת-BOQ בלי days מסוננת', () => {
    const s = scheduleTasks([nm('A', 3), nm('X')]);
    expect(s.tasks.map((t) => t.id)).toEqual(['A']);
  });
});
