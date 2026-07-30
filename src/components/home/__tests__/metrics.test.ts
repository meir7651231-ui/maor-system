/**
 * פער 19-20 (P2 אשכול א׳) — מדדי דשבורד: תפוסת חוגים, הכנסה משוקללת, אמינות.
 *
 * ratchet מול הלגאסי (knowledge/legacy/legacy-main-script.js):
 * - crsG (שורות 2630-2654): תפוסה = שיבוצים/maxStudents (ברירת מחדל 12) קטום
 *   ל-100%; הכנסה חודשית משוקללת = שיבוצים *פעילים* בלבד — monthly=מחיר,
 *   half_year=/6, year=/12, punch=0 ("₪X לחודש (מנויים חודשיים בלבד)").
 * - credV: היסטוגרמת 20 סלים של 50 נק'; "דורשות חיזוק" = הציונים הנמוכים
 *   ממוינים עולה; מגמת-היום = סכום דלתאות הלוג של היום.
 * - homeStats בלגאסי סופר אלמנות (maritalStatus מכיל "אלמן").
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, type Course, type Enrollment, type Family } from '../../../types/domain';
import {
  courseMetrics,
  courseOccupancies,
  credHistogram,
  credNeedsBoost,
  credTodayTrend,
  homeStats,
  weightedMonthlyIncome,
} from '../homeData';

function course(p: Partial<Course>): Course {
  return {
    id: p.id ?? 'c1', name: p.name ?? 'חוג', teacherId: '', roomId: 'r1', description: '',
    price: p.price ?? 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    model: p.model ?? 'monthly', size: 10, start: '', end: '', weekday: 0, time: '16:00',
    ...p,
  } as Course;
}

function enroll(p: Partial<Enrollment>): Enrollment {
  return {
    id: p.id ?? 'e1', memberId: p.memberId ?? 'm1', courseId: p.courseId ?? 'c1',
    plan: 'monthly', purchased: 0, used: 0, absences: [], payments: [], totalDue: 0,
    status: p.status ?? 'active', ...p,
  } as Enrollment;
}

function fam(p: Partial<Family> & { score?: number; log?: { date: string; delta: number }[] }): Family {
  const { score, log, ...rest } = p;
  return {
    id: p.id ?? 'f1', name: p.name ?? 'כהן', members: [], docs: [],
    cred: score === undefined && !log ? undefined : { score: score ?? 700, log: (log ?? []).map((e) => ({ ...e, reason: '' })) },
    maritalStatus: p.maritalStatus ?? '',
    ...rest,
  } as Family;
}

describe('פער 19 — תפוסה והכנסה משוקללת (לגאסי crsG)', () => {
  it('תפוסה = שיבוצים/maxStudents, קטומה ל-100%, ברירת מחדל 12', () => {
    const db = emptyDb();
    db.courses = [course({ id: 'c1', maxStudents: 10 }), course({ id: 'c2', maxStudents: 0 })];
    db.enrollments = [
      ...Array.from({ length: 5 }, (_, i) => enroll({ id: 'e' + i, courseId: 'c1' })),
      ...Array.from({ length: 15 }, (_, i) => enroll({ id: 'x' + i, courseId: 'c2' })),
    ];
    const rows = courseOccupancies(db);
    expect(rows[0]).toMatchObject({ n: 5, max: 10, pct: 50 });
    // maxStudents=0 ⇒ ברירת המחדל 12 (כמו בלגאסי: c.maxStudents || 12); 15/12 נקטם ל-100
    expect(rows[1]).toMatchObject({ n: 15, max: 12, pct: 100 });
  });

  it('הכנסה משוקללת: monthly=מחיר · half_year=/6 · year=/12 · punch=0 · רק פעילים', () => {
    const db = emptyDb();
    db.courses = [
      course({ id: 'm', model: 'monthly', price: 120 }),
      course({ id: 'h', model: 'half_year', price: 600 }),
      course({ id: 'y', model: 'year', price: 1200 }),
      course({ id: 'p', model: 'punch', price: 999 }),
    ];
    db.enrollments = [
      enroll({ id: 'e1', courseId: 'm' }),
      enroll({ id: 'e2', courseId: 'h' }),
      enroll({ id: 'e3', courseId: 'y' }),
      enroll({ id: 'e4', courseId: 'p' }),
      enroll({ id: 'e5', courseId: 'm', status: 'ended' }), // לא פעיל — לא נספר
    ];
    // 120 + 600/6 + 1200/12 + 0 = 320
    expect(weightedMonthlyIncome(db)).toBe(320);
  });

  it('courseMetrics: ממוצע, צ׳יפים (מלאים/כרטיסייה/מנוי) ו-Top-3 לפי תפוסה', () => {
    const db = emptyDb();
    db.courses = [
      course({ id: 'a', name: 'א', maxStudents: 2, model: 'punch' }),
      course({ id: 'b', name: 'ב', maxStudents: 4, model: 'monthly' }),
      course({ id: 'c', name: 'ג', maxStudents: 4 }),
    ];
    db.enrollments = [
      enroll({ id: '1', courseId: 'a' }), enroll({ id: '2', courseId: 'a' }), // 100%
      enroll({ id: '3', courseId: 'b' }), // 25%
    ];
    const m = courseMetrics(db);
    expect(m.fullCount).toBe(1);
    expect(m.punchCount).toBe(1);
    expect(m.monthlyCount).toBe(2); // ברירת המחדל של helper הבדיקה היא monthly
    expect(m.avgOcc).toBe(Math.round((100 + 25 + 0) / 3));
    expect(m.top[0].course.id).toBe('a');
  });
});

describe('פער 20 — מדדי אמינות (לגאסי credV) + מונה אלמנות', () => {
  it('היסטוגרמה: 20 סלים של 50 נק׳, ציון 1000 נופל לסל האחרון', () => {
    const db = emptyDb();
    db.families = [fam({ id: 'f1', score: 0 }), fam({ id: 'f2', score: 49 }), fam({ id: 'f3', score: 700 }), fam({ id: 'f4', score: 1000 })];
    const bins = credHistogram(db);
    expect(bins).toHaveLength(20);
    expect(bins[0]).toBe(2);
    expect(bins[14]).toBe(1);
    expect(bins[19]).toBe(1);
  });

  it('דורשות חיזוק: הנמוכות ביותר, ממוינות עולה; cred חסר = 700', () => {
    const db = emptyDb();
    db.families = [fam({ id: 'f1', name: 'א', score: 900 }), fam({ id: 'f2', name: 'ב', score: 200 }), fam({ id: 'f3', name: 'ג' })];
    const boost = credNeedsBoost(db, 2);
    expect(boost.map((x) => x.score)).toEqual([200, 700]);
  });

  it('מגמת היום: סכום דלתאות הלוג של היום בלבד', () => {
    const db = emptyDb();
    db.families = [
      fam({ id: 'f1', score: 700, log: [{ date: '2026-07-30', delta: 15 }, { date: '2026-07-29', delta: -99 }] }),
      fam({ id: 'f2', score: 700, log: [{ date: '2026-07-30', delta: -2 }] }),
    ];
    expect(credTodayTrend(db, '2026-07-30')).toBe(13);
  });

  it('homeStats סופר אלמנות לפי maritalStatus המכיל "אלמן"', () => {
    const db = emptyDb();
    db.families = [fam({ id: 'f1', maritalStatus: 'אלמן/ה' }), fam({ id: 'f2', maritalStatus: 'נשואים' }), fam({ id: 'f3', maritalStatus: '' })];
    expect(homeStats(db, new Date('2026-07-30T12:00:00')).widows).toBe(1);
  });
});
