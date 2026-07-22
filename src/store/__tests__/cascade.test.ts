/**
 * אימות מחיקה-מדורגת (cascade) מקצה לקצה דרך ה-store האמיתי:
 * מחיקת חוג/משפחה/בן-משפחה חייבת לנקות את השיבוצים התלויים כדי שלא
 * יישארו "יתומים" שדולפים לספירות (enrollCount · homeStats · attention).
 * כל פעולה כזו נבדקת מול המצב שאחריה — בלי זליגה ובלי חריגה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Course, Db, Enrollment, Family, Member } from '../../types/domain';
import { enrollCount } from '../../components/courses/lib';
import { homeStats } from '../../components/home/homeData';

function member(id: string, first: string): Member {
  return {
    id, first, gender: 'm', birth: '2015-05-05', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '',
  };
}
function fam(id: string, name: string, members: Member[]): Family {
  return { ...emptyFamily(), id, createdAt: '2024-01-01', name, members };
}
function course(id: string, name: string): Course {
  return {
    id, name, teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי',
    model: 'monthly', size: 0, price: 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    maxStudents: 20, ageMin: 0, ageMax: 99, gender: 'all', weekday: 1, time: '16:00',
    start: '2024-01-01', end: '2027-01-01', sessions: [], img: '', active: true, notes: '',
    description: '', sector: '',
  } as Course;
}
function enr(id: string, memberId: string, courseId: string): Enrollment {
  return {
    id, memberId, courseId, plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2024-02-01',
  };
}

/** שני משפחות (m1,m2), שני חוגים, שני שיבוצים — אחד לכל צירוף. */
function seed(): Db {
  return {
    ...emptyDb(),
    families: [fam('f1', 'כהן', [member('m1', 'רוני')]), fam('f2', 'לוי', [member('m2', 'דני')])],
    courses: [course('c1', 'ציור'), course('c2', 'גיטרה')],
    enrollments: [enr('e1', 'm1', 'c1'), enr('e2', 'm2', 'c2')],
  };
}

const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🧹 מחיקת חוג — מנקה את שיבוציו, בלי לגעת בחוג/שיבוץ האחר', () => {
  it('deleteCourse(c1): e1 נעלם, e2 נשאר', () => {
    useApp.getState().deleteCourse('c1');
    expect(db().courses.map((c) => c.id)).toEqual(['c2']);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
  });
  it('אין שיבוץ יתום — enrollCount(c1)=0, לא נספר בבית', () => {
    useApp.getState().deleteCourse('c1');
    expect(enrollCount(db(), 'c1')).toBe(0);
    const s = homeStats(db(), new Date('2026-07-22T12:00:00'));
    expect(s.enrollTotal).toBe(1);
    expect(s.activeEnrollments).toBe(1);
  });
});

describe('🧹 מחיקת משפחה — מנקה שיבוצים + אירועים, בלי לגעת במשפחה השנייה', () => {
  it('deleteFamily(f1): המשפחה + שיבוץ בנה נעלמים, f2/e2 נשארים', () => {
    useApp.getState().deleteFamily('f1');
    expect(db().families.map((f) => f.id)).toEqual(['f2']);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
    const s = homeStats(db(), new Date('2026-07-22T12:00:00'));
    expect(s.enrollTotal).toBe(1);
    expect(s.famTotal).toBe(1);
  });
  it('אירוע שמשויך למשפחה נמחק יחד איתה', () => {
    useApp.getState().setDb(() => ({
      events: [
        { id: 'ev1', type: 'reminder', title: 'ת', date: '2026-07-22', time: '', famId: 'f1', done: false, priority: 'gray', customType: '', notes: '', price: 0, roomId: '' },
        { id: 'ev2', type: 'reminder', title: 'ת', date: '2026-07-22', time: '', famId: 'f2', done: false, priority: 'gray', customType: '', notes: '', price: 0, roomId: '' },
      ] as unknown as Db['events'],
    }));
    useApp.getState().deleteFamily('f1');
    expect(db().events.map((e) => e.id)).toEqual(['ev2']);
  });
});

describe('🧹 מחיקת בן-משפחה — מנקה את שיבוציו בלבד', () => {
  it('deleteMember(f1,m1): m1 יורד מהמשפחה, e1 נמחק, e2 נשאר', () => {
    useApp.getState().deleteMember('f1', 'm1');
    expect(db().families.find((f) => f.id === 'f1')!.members.length).toBe(0);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
    expect(enrollCount(db(), 'c1')).toBe(0);
  });
});
