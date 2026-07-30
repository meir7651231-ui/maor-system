/**
 * ratchet — תפקיד מורה (P3 פריט 15, מימוש הכרעה 2; feature shell.roles).
 *
 * roleOf: מייל ב-adminEmails ⇒ admin; במפת roles.teachers ⇒ teacher; אחרת
 * staff; בלי מייל (ענן כבוי) ⇒ staff — התנהגות של היום בדיוק. השוואות
 * case-insensitive. coursesOfTeacher: teacherId ⇒ רק החוגים שלה; null ⇒ הכל.
 */
import { describe, expect, it } from 'vitest';
import { roleOf, teacherIdOf } from '../config';
import { coursesOfTeacher } from '../../components/courses/lib';
import { DEFAULT_CONFIG } from '../../types/config';
import type { Course } from '../../types/domain';

const CFG = {
  ...DEFAULT_CONFIG,
  adminEmails: ['Boss@org.il'],
  roles: { teachers: { 'Leah@org.il': 't1' } },
};

describe('👩‍🏫 ratchet — roleOf/teacherIdOf (הכרעה 2)', () => {
  it('ארבעת המקרים: admin · teacher · staff · בלי מייל = staff', () => {
    expect(roleOf(CFG, 'boss@org.il')).toBe('admin'); // case-insensitive
    expect(roleOf(CFG, 'leah@org.il')).toBe('teacher');
    expect(roleOf(CFG, 'someone@org.il')).toBe('staff');
    expect(roleOf(CFG, null)).toBe('staff');
    expect(roleOf(CFG, '')).toBe('staff');
  });

  it('adminEmails גובר על מפת המורות; בלי roles — אף אחד אינו teacher', () => {
    const both = { ...CFG, roles: { teachers: { 'boss@org.il': 't9', 'leah@org.il': 't1' } } };
    expect(roleOf(both, 'boss@org.il')).toBe('admin');
    expect(roleOf({ ...DEFAULT_CONFIG }, 'leah@org.il')).toBe('staff');
  });

  it('teacherIdOf ממפה מייל (case-insensitive) ל-teacherId; אחרת null', () => {
    expect(teacherIdOf(CFG, 'LEAH@ORG.IL')).toBe('t1');
    expect(teacherIdOf(CFG, 'other@org.il')).toBeNull();
    expect(teacherIdOf(DEFAULT_CONFIG, 'leah@org.il')).toBeNull();
  });
});

describe('👩‍🏫 ratchet — סינון החוגים למורה (טהור)', () => {
  const c = (id: string, teacherId: string) => ({ id, teacherId }) as Course;
  const all = [c('c1', 't1'), c('c2', 't2'), c('c3', 't1')];

  it('teacherId ⇒ רק החוגים שלה; null ⇒ הכל (התנהגות של היום)', () => {
    expect(coursesOfTeacher(all, 't1').map((x) => x.id)).toEqual(['c1', 'c3']);
    expect(coursesOfTeacher(all, 't2').map((x) => x.id)).toEqual(['c2']);
    expect(coursesOfTeacher(all, null)).toBe(all);
  });
});
