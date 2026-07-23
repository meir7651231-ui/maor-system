/**
 * עזרי יומן החדרים — תווית מסלול עקבית עם מודול הקורסים (half_year/year),
 * המרות זמן, ושיוך שיבוצים למפגש (כולל מי שללא קבוצה).
 */
import { describe, expect, it } from 'vitest';
import { planLabelOf, timeToMin, minToHM, enrollmentsForSession } from '../../components/diary/lib';
import type { Course, Enrollment } from '../../types/domain';

function enr(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e', memberId: 'm', courseId: 'c', plan: 'monthly', status: 'active', enrolledAt: '2026-01-01',
    group: '', totalDue: 0, purchased: 0, used: 0, payments: [], absences: [], dueDate: '', note: '',
    ...over,
  };
}

describe('diary planLabelOf — עקבי עם planWord', () => {
  it('חצי-שנתי ושנתי אינם מוצגים כ"חודשי"', () => {
    expect(planLabelOf(enr({ plan: 'half_year' }))).toContain('חצי-שנתי');
    expect(planLabelOf(enr({ plan: 'year' }))).toContain('שנתי');
    expect(planLabelOf(enr({ plan: 'half_year' }))).not.toBe('מנוי חודשי');
  });
  it('חודשי = מנוי חודשי; כרטיסייה מציגה יתרה', () => {
    expect(planLabelOf(enr({ plan: 'monthly' }))).toBe('מנוי חודשי');
    expect(planLabelOf(enr({ plan: 'punch', purchased: 10, used: 4 }))).toContain('יתרה 6/10');
  });
});

describe('diary timeToMin / minToHM', () => {
  it('המרה תקינה הלוך ושוב', () => {
    expect(timeToMin('16:30')).toBe(990);
    expect(minToHM(990)).toBe('16:30');
  });
  it('קלט לא תקין → NaN (בלי לזרוק)', () => {
    expect(Number.isNaN(timeToMin('שלוש'))).toBe(true);
    expect(Number.isNaN(timeToMin(''))).toBe(true);
    expect(Number.isNaN(timeToMin('25:99'))).toBe(false); // מספרי — לא נדחה כאן, רק פורמט
  });
});

describe('diary enrollmentsForSession', () => {
  const course = (sessions: Course['sessions']) =>
    ({ id: 'c', sessions, weekday: 1, time: '16:00' }) as unknown as Course;
  it('קורס עם מפגש יחיד → כל השיבוצים', () => {
    const db = { enrollments: [enr({ id: 'a', group: 'קבוצה 1' }), enr({ id: 'b', group: '' })] } as never;
    expect(enrollmentsForSession(db, course([]), 0).map((e) => e.id)).toEqual(['a', 'b']);
  });
  it('קורס רב-קבוצתי → קבוצת המפגש + מי שללא שיוך', () => {
    const c = course([{ day: 1, time: '16:00', label: 'קבוצה 1' }, { day: 1, time: '17:00', label: 'קבוצה 2' }]);
    const db = {
      enrollments: [enr({ id: 'a', group: 'קבוצה 1' }), enr({ id: 'b', group: 'קבוצה 2' }), enr({ id: 'c', group: '' })],
    } as never;
    const s0 = enrollmentsForSession(db, c, 0).map((e) => e.id);
    expect(s0).toContain('a'); // קבוצת המפגש
    expect(s0).toContain('c'); // ללא שיוך — לא נעלם
    expect(s0).not.toContain('b'); // קבוצה אחרת
  });
});
