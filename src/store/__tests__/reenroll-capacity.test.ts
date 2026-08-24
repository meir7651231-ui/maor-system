/**
 * ratchet — שער-התפוסה של רישום-לשנה-הבאה (בקשת-שטח 25.8 "רושם לי 0 נרשם 2 חסום").
 *
 * הבאג: המודל-הישן שכפל חוגים ⇒ החוג-החדש נולד ריק ⇒ שער-התפוסה עבד. אחרי שינוי-
 * המודל ל-In-Card (24.8 · targetCourseId=courseId, בידול-שנה דרך `year`), שער-התפוסה
 * המשיך לספור את **שיבוצי-השנה-הנוכחית** — maxStudents=2, כבר 2 תלמידות רשומות
 * ⇒ 2>=2 ⇒ תמיד נחסם. המשתמשת ראתה "0 נרשם, 2 חסום" ולא הצליחה להעביר איש.
 *
 * התיקון: כשיש yearLabel (מודל-שנים), סופרים רק שיבוצים באותה שנת-יעד. שיבוצי-
 * השנה-הנוכחית לא תופסים מקום בשנה החדשה — הם "יוצאים" לוגית.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Course, Db, Enrollment, Family } from '../../types/domain';

function mkCourse(over: Partial<Course> = {}): Course {
  return {
    id: 'c1', name: 'התעמלות', teacherId: 't1', roomId: 'r1', description: '',
    price: 200, price1: 0, price2: 0, price1Name: '', price2Name: '',
    model: 'monthly', size: 0, start: '2025-09-01', end: '2026-07-31',
    weekday: 0, time: '16:00', maxStudents: 2, gender: 'all',
    ageMin: 0, ageMax: 0, cat: '', semester: 'שנתי', sector: '',
    sessions: [], notes: '', ...over,
  } as Course;
}
function mkEnroll(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly',
    purchased: 0, used: 0, group: '', absences: [], payments: [],
    totalDue: 200, dueDate: '', status: 'active', note: '',
    enrolledAt: '2025-09-01', renew: 'yes', ...over,
  } as Enrollment;
}
function mkFam(id: string, memberIds: string[]): Family {
  return {
    id, name: 'משפחה ' + id,
    members: memberIds.map((mid) => ({ id: mid, first: 'ת-' + mid })),
  } as Family;
}
function seed(): Db {
  return {
    ...emptyDb(),
    families: [mkFam('f1', ['m1', 'm2'])],
    courses: [mkCourse({ id: 'c1', maxStudents: 2 })],
    enrollments: [
      mkEnroll({ id: 'e1', memberId: 'm1', renew: 'yes' }),
      mkEnroll({ id: 'e2', memberId: 'm2', renew: 'yes' }),
    ],
  };
}

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🐛 ratchet — רישום-לשנה-הבאה In-Card (25.8, "0 נרשם 2 חסום")', () => {
  it('שער-התפוסה לא חוסם רישום למודל In-Card — סופר רק שיבוצי-שנת-היעד', () => {
    // בקשת-שטח: חוג עם maxStudents=2 וכבר 2 תלמידות. bulkReenrollCourse חייב
    // להצליח לרשום את שתיהן לשנה-הבאה (לא נחסם ע"י ה-2 של השנה-הנוכחית).
    const res = useApp.getState().bulkReenrollCourse('c1');
    expect(res.created).toBe(2);        // 2 נרשמו · לא 0!
    expect(res.courseId).toBe('c1');    // אותו החוג — לא שוכפל
    const db = useApp.getState().db;
    // כל שיבוץ-מקור מקושר לחדש דרך renewedToId:
    const src1 = db.enrollments.find((e) => e.id === 'e1')!;
    const src2 = db.enrollments.find((e) => e.id === 'e2')!;
    expect(src1.renewedToId).toBeTruthy();
    expect(src2.renewedToId).toBeTruthy();
    // השיבוצים החדשים באותו החוג, עם תווית-שנה (תשפ״ז):
    const fresh1 = db.enrollments.find((e) => e.id === src1.renewedToId)!;
    const fresh2 = db.enrollments.find((e) => e.id === src2.renewedToId)!;
    expect(fresh1.courseId).toBe('c1');
    expect(fresh2.courseId).toBe('c1');
    expect(fresh1.year).toBe('תשפ״ז');
    expect(fresh2.year).toBe('תשפ״ז');
    // סה"כ 4 שיבוצים בחוג — אבל בשנה-החדשה בדיוק 2 (לא חורגים):
    const inYear = db.enrollments.filter((e) => e.courseId === 'c1' && e.year === 'תשפ״ז');
    expect(inYear).toHaveLength(2);
  });

  it('כשמנסים לרשום שנה-הבאה מעבר לתפוסה של-אותה-שנה — נחסם', () => {
    // ידני: יוצרים כבר 2 שיבוצי-שנה-הבאה, ואז מנסים לרשום שלישי מאותה שנה.
    // חוג עם maxStudents=2, יש 2 שיבוצי תשפ״ז → הרישום השלישי צריך להיחסם.
    useApp.getState().setDb((db) => ({
      enrollments: [
        ...db.enrollments,
        mkEnroll({ id: 'x1', memberId: 'm1', year: 'תשפ״ז', renew: undefined }),
        mkEnroll({ id: 'x2', memberId: 'm2', year: 'תשפ״ז', renew: undefined }),
      ],
    }));
    // כעת השיבוצים הקיימים (e1/e2) שממשיכים אמורים להיחסם — אין מקום בתשפ״ז:
    const res = useApp.getState().bulkReenrollCourse('c1');
    expect(res.created).toBe(0);
  });

  it('קריאה חוזרת אידמפוטנטית — אחרי רישום, ריצה שנייה לא מכפילה', () => {
    useApp.getState().bulkReenrollCourse('c1');
    const before = useApp.getState().db.enrollments.length;
    // ריצה שנייה — כל השיבוצים כבר נושאים renewedToId ⇒ המנוע מדלג (המסנן
    // ב-srcIds מסנן !renewedToId), 0 חדשים נוצרים.
    const res2 = useApp.getState().bulkReenrollCourse('c1');
    expect(res2.created).toBe(0);
    expect(useApp.getState().db.enrollments.length).toBe(before);
  });
});
