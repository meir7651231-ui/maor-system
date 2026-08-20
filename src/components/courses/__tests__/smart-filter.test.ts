/**
 * ratchet — סינון שיבוץ חכם (P1.7, feature courses.enroll.smartfilter).
 *
 * מימוש הכרעת המשתמש #3 (DECISIONS-2026-07-29): גלגל ההגרלה נשאר הכלי היחיד;
 * היכולת הדטרמיניסטית של אשף הלגאסי (התאמת חוג לפי גיל/מגדר/יום) נכנסת דרך
 * סינון רך בזרימת השיבוץ + מתג "הצג הכל" + אזהרת התנגשות לו"ז — לא כ-UI אשף.
 * הכללים נעולים: נתון חסר אינו מסנן (רך); ההתנגשות מייעצת ואינה חוסמת שמירה.
 */
import { describe, expect, it } from 'vitest';
import { courseFitsMember, scheduleClashText } from '../lib';
import { emptyDb } from '../../../types/domain';
import type { Course, Enrollment } from '../../../types/domain';
import joinSrc from '../../families/JoinModal.tsx?raw';
import enrollSrc from '../EnrollModal.tsx?raw';

function course(over: Partial<Course>): Course {
  return {
    id: 'c1', name: 'ציור', teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי',
    model: 'monthly', size: 0, price: 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    maxStudents: 20, ageMin: 0, ageMax: 0, gender: 'all', weekday: 2, time: '17:00',
    start: '2026-01-01', end: '2027-01-01', sessions: [], img: '', active: true, notes: '',
    description: '', sector: '', ...over,
  } as Course;
}
function enr(memberId: string, courseId: string, status: Enrollment['status'] = 'active'): Enrollment {
  return {
    id: 'e-' + courseId, memberId, courseId, plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status, note: '', enrolledAt: '2026-01-01',
  };
}

describe('✦ ratchet — courseFitsMember: סינון רך לפי גיל/מגדר', () => {
  it('מגדר: חוג לבנות מסנן בן; "all" לא מסנן; מגדר חסר לא מסנן', () => {
    expect(courseFitsMember(course({ gender: 'f' }), 'm', 10)).toBe(false);
    expect(courseFitsMember(course({ gender: 'f' }), 'f', 10)).toBe(true);
    expect(courseFitsMember(course({ gender: 'all' }), 'm', 10)).toBe(true);
    expect(courseFitsMember(course({ gender: 'f' }), undefined, 10)).toBe(true);
  });

  it('גיל: מחוץ לטווח מסונן; טווח 0 (לא הוגדר) לא מסנן; גיל לא ידוע לא מסנן', () => {
    expect(courseFitsMember(course({ ageMin: 8, ageMax: 12 }), 'f', 7)).toBe(false);
    expect(courseFitsMember(course({ ageMin: 8, ageMax: 12 }), 'f', 13)).toBe(false);
    expect(courseFitsMember(course({ ageMin: 8, ageMax: 12 }), 'f', 8)).toBe(true);
    expect(courseFitsMember(course({ ageMin: 0, ageMax: 0 }), 'f', 99)).toBe(true);
    expect(courseFitsMember(course({ ageMin: 8, ageMax: 12 }), 'f', null)).toBe(true);
  });
});

describe('✦ ratchet — scheduleClashText: אותו יום + אותה שעה = אזהרה', () => {
  const db = {
    ...emptyDb(),
    courses: [course({ id: 'c1', name: 'ציור', weekday: 2, time: '17:00' }), course({ id: 'c2', name: 'מחול', weekday: 2, time: '17:00' }), course({ id: 'c3', name: 'שחמט', weekday: 3, time: '17:00' })],
    enrollments: [enr('m1', 'c1')],
  };
  it('שיבוץ קיים באותו יום ושעה → אזהרה עם שם החוג המתנגש', () => {
    const t = scheduleClashText(db, 'm1', db.courses[1]);
    expect(t).toContain('התנגשות');
    expect(t).toContain('ציור');
  });
  it('יום אחר → אין אזהרה; שיבוץ שהסתיים → אין אזהרה; אותו חוג עצמו → אין', () => {
    expect(scheduleClashText(db, 'm1', db.courses[2])).toBeNull();
    const ended = { ...db, enrollments: [enr('m1', 'c1', 'ended')] };
    expect(scheduleClashText(ended, 'm1', db.courses[1])).toBeNull();
    expect(scheduleClashText(db, 'm1', db.courses[0])).toBeNull();
  });
});

describe('🛡 הגנות-מקור — הסינון מגודר בדגל, עם "הצג הכל", בשני מסלולי השיבוץ', () => {
  for (const [name, src] of [['JoinModal', joinSrc], ['EnrollModal', enrollSrc]] as const) {
    it(name + ': דגל courses.enroll.smartfilter + מתג הצג הכל + אזהרת התנגשות', () => {
      expect(src).toMatch(/featureOn\((?:cfg|config), 'courses\.enroll\.smartfilter'\)/);
      expect(src).toContain('הצג הכל');
      expect(src).toMatch(/scheduleClashText\(/);
      expect(src).toMatch(/courseFitsMember\(/);
    });
  }
});

describe('🛡 שיבוץ הורה לחוג — הורה עוקף את סינון-הגיל (לא רק ילדים)', () => {
  it('EnrollModal: מועמד נושא isParent; הורה עובר בלי courseFitsMember (מגבלות-גיל = לילדים)', () => {
    expect(enrollSrc).toContain('isParent: !!m.isParent');
    // ה-fitted: o.isParent || courseFitsMember(...) — הורה תמיד מוצג לשיבוץ
    expect(enrollSrc).toMatch(/o\.isParent \|\| courseFitsMember\(/);
  });
  it('EnrollModal: יוצר-בשורה מאפשר יצירת הורה ישירות (isParent) — לא רק ילד/ה', () => {
    expect(enrollSrc).toContain('setNIsParent');
    expect(enrollSrc).toContain('nIsParent ? { isParent: true }');
  });
});
