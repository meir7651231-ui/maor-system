/**
 * ratchet — טווח כיתות + תמונת חוג (P2 פער 28, feature courses.gradeimg).
 *
 * gradeFits משתלב בסינון השיבוץ החכם (P1.7): חוג עם טווח כיתות מסתיר ילד/ה
 * שמחוץ לטווח — אבל רך: אין טווח לחוג או שכיתת הילד/ה לא מזוהה ⇒ לא מסתירים.
 * migrate בולע חוג בלי השדות (אופציונליים — אין מיגרציה).
 */
import { describe, expect, it } from 'vitest';
import { courseFitsMember, gradeFits, gradeIndex, GRADE_ORDER } from '../lib';
import { migrate } from '../../../store/persist';
import { DB_VERSION, emptyDb, type Course } from '../../../types/domain';

function course(over: Partial<Course>): Course {
  return {
    id: 'c1', name: 'ריקוד', teacherId: '', roomId: '', description: '', price: 0, price1: 0,
    price2: 0, price1Name: '', price2Name: '', model: 'monthly', size: 0, start: '', end: '',
    weekday: 2, time: '17:00', maxStudents: 0, gender: 'all', ageMin: 0, ageMax: 0, cat: '',
    semester: '', sector: '', sessions: [], notes: '',
    ...over,
  };
}

describe('🎒 ratchet — gradeFits (פער 28)', () => {
  it('שלושת המקרים: בטווח ✓ · מחוץ לטווח ✗ · אין טווח/כיתה לא מזוהה ✓ (רך)', () => {
    const c = course({ gradeMin: 'ב', gradeMax: 'ד' });
    expect(gradeFits(c, 'ג')).toBe(true); // בטווח
    expect(gradeFits(c, 'א')).toBe(false); // מתחת
    expect(gradeFits(c, 'ה')).toBe(false); // מעל
    expect(gradeFits(course({}), 'יב')).toBe(true); // אין טווח לחוג
    expect(gradeFits(c, '')).toBe(true); // אין כיתה לילד/ה — לא מסתירים
    expect(gradeFits(c, 'טרום-חובה')).toBe(true); // לא מזוהה — רך
  });

  it('gradeIndex סובלני לגרשיים ולקידומת "כיתה"; גן לפני א׳', () => {
    expect(gradeIndex('ב׳')).toBe(gradeIndex('ב'));
    expect(gradeIndex('כיתה ג')).toBe(gradeIndex('ג'));
    expect(gradeIndex('גן')).toBe(0);
    expect(gradeIndex('יב')).toBe(GRADE_ORDER.length - 1);
    expect(gradeIndex('בלתי-ידוע')).toBe(-1);
  });

  it('courseFitsMember: הכיתה נבדקת רק כשמועברת (הדגל כבוי ⇒ undefined ⇒ אין הסתרה)', () => {
    const c = course({ gradeMin: 'ב', gradeMax: 'ד' });
    expect(courseFitsMember(c, 'f', 8, 'א')).toBe(false);
    expect(courseFitsMember(c, 'f', 8, undefined)).toBe(true);
  });

  it('migrate בולע חוג בלי gradeMin/gradeMax/img — נשאר שלם', () => {
    const raw = { ...emptyDb(), v: DB_VERSION, courses: [course({})] } as unknown as Record<string, unknown>;
    delete (raw.courses as Record<string, unknown>[])[0].gradeMin;
    delete (raw.courses as Record<string, unknown>[])[0].gradeMax;
    delete (raw.courses as Record<string, unknown>[])[0].img;
    const out = migrate(raw);
    expect(out).not.toBeNull();
    expect(out!.courses).toHaveLength(1);
    expect(out!.courses[0].name).toBe('ריקוד');
    expect(out!.courses[0].gradeMin).toBeUndefined();
  });
});
