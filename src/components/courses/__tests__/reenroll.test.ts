/**
 * ratchet · מנוע רישום-לשנה-הבאה (courses.reenroll).
 *
 * הפיצ'ר: מסך "רישום" — לכל תלמיד/ה רואים מה היה בחוג אשתקד (נוכחות/חיסורים/
 * יתרה/סטטוס), מחליטים המשך (ממשיך/בהמתנה/עוזב), ומי שממשיך נרשם לשנה הבאה
 * (שיבוץ חדש ששומר את ההיסטוריה). הכל additive ואופט-אין.
 *
 * שימור-התנהגות שהבדיקה נועלת:
 *  1. סיכום "מה היה" נגזר מהשדות הקיימים בלבד (presents/absences/payments).
 *  2. תווית-שנה ותאריכי-שנה-הבאה מחושבים נכון (שנה"ל 1.9, הזזת שנה).
 *  3. טיוטת-שיבוץ לשנה הבאה מאפסת היסטוריה ושומרת מסלול/תמחור.
 *  4. טיוטת-חוג לשנה הבאה שומרת קישור לחוג-הקודם (prevYearId) — היסטוריה.
 *  5. מונים/סינון/יעדי-רישום-המוני עקביים.
 */
import { describe, expect, it } from 'vitest';
import type { Course, Db, Enrollment } from '../../../types/domain';
import {
  academicYearLabel,
  buildReenrollRows,
  enrollSummary,
  freshNextYearEnrollment,
  nextYearCourseDraft,
  nextYearDates,
  reenrollCounts,
  renewTargets,
} from '../reenroll-lib';

function mkEnroll(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e1',
    memberId: 'm1',
    courseId: 'c1',
    plan: 'monthly',
    purchased: 0,
    used: 0,
    group: 'קבוצה א׳',
    absences: [],
    payments: [],
    totalDue: 200,
    dueDate: '',
    status: 'active',
    note: '',
    enrolledAt: '2025-09-01',
    ...over,
  };
}

function mkCourse(over: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'התעמלות',
    teacherId: 't1',
    roomId: 'r1',
    description: '',
    price: 200,
    price1: 0,
    price2: 0,
    price1Name: '',
    price2Name: '',
    model: 'monthly',
    size: 0,
    start: '2025-09-01',
    end: '2026-07-31',
    weekday: 0,
    time: '16:00',
    maxStudents: 15,
    gender: 'all',
    ageMin: 0,
    ageMax: 0,
    cat: '',
    semester: 'שנתי',
    sector: '',
    sessions: [],
    notes: '',
    ...over,
  } as Course;
}

function mkDb(over: Partial<Db> = {}): Db {
  return {
    families: [
      { id: 'f1', name: 'לוי', members: [{ id: 'm1', first: 'נועה' }] },
      { id: 'f2', name: 'כהן', members: [{ id: 'm2', first: 'איתי' }] },
    ],
    courses: [mkCourse()],
    enrollments: [],
    ...over,
  } as unknown as Db;
}

describe('🗓 ratchet — רישום לשנה הבאה', () => {
  it('1. סיכום "מה היה" נגזר מהשדות הקיימים', () => {
    const e = mkEnroll({
      presents: ['2025-10-01', '2025-11-01', '2025-10-15'],
      absences: [
        { date: '2025-12-01', reason: 'מחלה' },
        { date: '2025-12-08', reason: '', noshow: true },
      ],
      payments: [{ rid: 'R-5', date: '2025-09-05', amount: 200, method: 'מזומן' }],
      totalDue: 200,
    });
    const s = enrollSummary(e);
    expect(s.presents).toBe(3);
    expect(s.absences).toBe(2);
    expect(s.noshow).toBe(1);
    expect(s.paid).toBe(200);
    expect(s.balance).toBe(0);
    expect(s.lastPresent).toBe('2025-11-01'); // האחרון כרונולוגית
    expect(s.statusLabel).toBe('פעיל');
  });

  it('2. תווית-שנה ותאריכי-שנה-הבאה', () => {
    expect(academicYearLabel('2025-09-01')).toBe('2025/26');
    expect(academicYearLabel('2026-09-01')).toBe('2026/27');
    // חוג שהתחיל אחרי 1.1 עדיין שייך לשנה"ל שנפתחה בספטמבר הקודם:
    expect(academicYearLabel('2026-03-01')).toBe('2025/26');
    const nd = nextYearDates('2025-09-01', '2026-07-31');
    expect(nd.start).toBe('2026-09-01');
    expect(nd.end).toBe('2027-07-31');
  });

  it('3. טיוטת-שיבוץ לשנה הבאה מאפסת היסטוריה ושומרת תמחור/מסלול', () => {
    const src = mkEnroll({
      presents: ['2025-10-01'],
      absences: [{ date: '2025-12-01', reason: 'x' }],
      payments: [{ rid: 'R-1', date: '2025-09-01', amount: 200, method: 'מזומן' }],
      used: 4,
      purchased: 10,
      tier: '1',
      group: 'קבוצה ב׳',
      status: 'ended',
      endedAt: '2026-06-01',
      note: 'הערה ישנה',
    });
    const fresh = freshNextYearEnrollment(src, 'c2', 'e-new', '2026-09-01');
    expect(fresh.id).toBe('e-new');
    expect(fresh.courseId).toBe('c2');
    expect(fresh.memberId).toBe('m1');
    expect(fresh.status).toBe('active'); // נולד פעיל, לא ended
    expect(fresh.enrolledAt).toBe('2026-09-01');
    // היסטוריה אופסה:
    expect(fresh.presents).toBeUndefined();
    expect(fresh.absences).toEqual([]);
    expect(fresh.payments).toEqual([]);
    expect(fresh.used).toBe(0);
    expect(fresh.purchased).toBe(0);
    expect(fresh.endedAt).toBeUndefined();
    expect(fresh.note).toBe('');
    // תמחור/מסלול נשמרו:
    expect(fresh.tier).toBe('1');
    expect(fresh.group).toBe('קבוצה ב׳');
    expect(fresh.plan).toBe('monthly');
  });

  it('4. טיוטת-חוג לשנה הבאה שומרת קישור לחוג-הקודם (היסטוריה)', () => {
    const src = mkCourse({ id: 'c1', start: '2025-09-01', end: '2026-07-31' });
    const draft = nextYearCourseDraft(src, 'c-next');
    expect(draft.id).toBe('c-next');
    expect(draft.start).toBe('2026-09-01');
    expect(draft.end).toBe('2027-07-31');
    expect(draft.year).toBe('2026/27');
    expect(draft.prevYearId).toBe('c1');
    expect(draft.name).toBe(src.name); // שאר הפרטים זהים
    // המקור לא נגע:
    expect(src.prevYearId).toBeUndefined();
    expect(src.start).toBe('2025-09-01');
  });

  it('5. מונים, סינון ויעדי-רישום-המוני', () => {
    const db = mkDb({
      enrollments: [
        mkEnroll({ id: 'e1', memberId: 'm1', renew: 'yes' }),
        mkEnroll({ id: 'e2', memberId: 'm2', renew: 'no' }),
        mkEnroll({ id: 'e3', memberId: 'm1', renew: 'yes', renewedToId: 'e9' }), // כבר נרשם
        mkEnroll({ id: 'e4', memberId: 'm2' }), // טרם הוחלט
      ],
    });
    const rows = buildReenrollRows(db);
    const c = reenrollCounts(rows);
    expect(c.total).toBe(4);
    expect(c.yes).toBe(2);
    expect(c.no).toBe(1);
    expect(c.undecided).toBe(1);
    expect(c.renewed).toBe(1);
    // יעדי רישום המוני = "ממשיך" שעדיין לא נרשם:
    const targets = renewTargets(rows);
    expect(targets.map((r) => r.e.id)).toEqual(['e1']);
    // סינון "טרם הוחלט":
    const undecided = buildReenrollRows(db, { decision: 'undecided' });
    expect(undecided.map((r) => r.e.id)).toEqual(['e4']);
    // הצטרפות member/course:
    expect(rows.find((r) => r.e.id === 'e1')?.memberName).toBe('נועה');
    expect(rows.find((r) => r.e.id === 'e1')?.courseName).toBe('התעמלות');
  });

  it('6. אופט-אין: שיבוץ בלי renew = טרם-הוחלט (בית-זהה להיום)', () => {
    const e = mkEnroll();
    expect(e.renew).toBeUndefined();
    expect(enrollSummary(e).statusLabel).toBe('פעיל');
    // בלי החלטה — לא נכנס ליעדי-רישום:
    const db = mkDb({ enrollments: [e] });
    expect(renewTargets(buildReenrollRows(db))).toHaveLength(0);
  });
});
