import { describe, it, expect } from 'vitest';
import { buildCourseDailyRows } from '../courseDaily';
import { emptyDb, type Course, type Db, type Enrollment } from '../../types/domain';

function course(over: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'ציור',
    teacherId: '',
    roomId: '',
    description: '',
    price: 0,
    price1: 0,
    price2: 0,
    price1Name: '',
    price2Name: '',
    model: 'monthly',
    size: 0,
    start: '2026-07-01',
    end: '2026-07-14',
    weekday: 0,
    time: '17:00',
    maxStudents: 10,
    gender: 'all',
    ageMin: 0,
    ageMax: 99,
    cat: '',
    semester: '',
    sector: '',
    sessions: [],
    notes: '',
    ...over,
  };
}

function enroll(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'en1',
    memberId: 'm1',
    courseId: 'c1',
    plan: 'monthly',
    purchased: 0,
    used: 0,
    group: '',
    absences: [],
    payments: [],
    totalDue: 0,
    dueDate: '',
    status: 'active',
    note: '',
    enrolledAt: '2026-07-01',
    ...over,
  };
}

describe('buildCourseDailyRows', () => {
  it('returns header only when the course lacks start/end', () => {
    const { rows, days } = buildCourseDailyRows(course({ start: '', end: '' }), emptyDb());
    expect(days).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      'תאריך עברי', 'תאריך לועזי', 'יום', 'קבוצה/שעה', 'סטטוס יום', 'תלמידה פעילה', 'משפחה', 'סטטוס נוכחות',
    ]);
  });

  it('emits one row per active enrollment per session day, marking absences', () => {
    // 2026-07-05 ו-2026-07-12 הם ימי ראשון (weekday 0)
    const db: Db = {
      ...emptyDb(),
      families: [{ ...blankFamily(), id: 'f1', name: 'כהן', members: [{ ...blankMember(), id: 'm1', first: 'רוני' }] }],
      courses: [course()],
      enrollments: [enroll({ absences: [{ date: '2026-07-12', reason: 'מחלה' }] })],
    };
    const { rows, days } = buildCourseDailyRows(course(), db);
    expect(days).toBe(2); // שני ימי ראשון בטווח
    const body = rows.slice(1);
    expect(body).toHaveLength(2);
    // מפגש ראשון — פעיל
    expect(body[0][5]).toBe('רוני');
    expect(body[0][6]).toBe('כהן');
    expect(body[0][7]).toBe('פעיל');
    // מפגש שני — חיסור עם נימוק
    expect(body[1][7]).toContain('חיסור');
    expect(body[1][7]).toContain('מחלה');
  });

  it('shows "אין רשומות" for a session day with no active enrollment', () => {
    const { rows } = buildCourseDailyRows(course(), { ...emptyDb(), courses: [course()] });
    expect(rows.slice(1).every((r) => r[4] === 'אין רשומות')).toBe(true);
  });

  it('קוטע דוח על טווח ענק (טעות הקלדה בשנת הסיום) ולא קורס', () => {
    // מפגש שבועי ביום ראשון על פני ~180 שנה — ללא התקרה זה עשרות אלפי שורות
    const wide = course({ start: '2022-01-01', end: '2202-01-01', weekday: 0, time: '17:00' });
    const { rows, days } = buildCourseDailyRows(wide, { ...emptyDb(), courses: [wide] });
    expect(days).toBe(500); // התקרה
    expect(rows.length).toBeLessThan(600); // חסום — לא עשרות אלפים
    expect(rows[rows.length - 1][4]).toContain('נקטע'); // שורת קטיעה
  });

  it('קורס שנתי רגיל אינו נקטע ואין שורת קטיעה', () => {
    const annual = course({ start: '2026-01-04', end: '2026-12-26', weekday: 0, time: '17:00' });
    const { rows, days } = buildCourseDailyRows(annual, { ...emptyDb(), courses: [annual] });
    expect(days).toBeLessThan(500);
    expect(rows.every((r) => !String(r[4]).includes('נקטע'))).toBe(true);
  });

  // #8 (הכרעת בעלים "8כן"): תלמידה שסיימה באמצע-שנה לא נעלמת רטרואקטיבית מהדוח
  // ההיסטורי — היא כלולה במפגשים שקדמו ל-endedAt בלבד.
  it('שיבוץ שהסתיים עם endedAt מופיע במפגשים שקדמו לסיום ולא באלה שאחריו', () => {
    // ימי-ראשון בטווח: 2026-07-05 ו-2026-07-12. סיום 2026-07-10 ⇒ 05 בלבד.
    const db: Db = {
      ...emptyDb(),
      families: [{ ...blankFamily(), id: 'f1', name: 'כהן', members: [{ ...blankMember(), id: 'm1', first: 'רוני' }] }],
      courses: [course()],
      enrollments: [enroll({ status: 'ended', endedAt: '2026-07-10' })],
    };
    const { rows } = buildCourseDailyRows(course(), db);
    const named = rows.slice(1).filter((r) => r[5] === 'רוני');
    expect(named).toHaveLength(1); // רק המפגש שלפני הסיום
    expect(named[0][1]).toBe('05/07/2026');
    // המפגש שאחרי הסיום — "אין רשומות", בלי השם
    const after = rows.slice(1).find((r) => r[1] === '12/07/2026');
    expect(after?.[4]).toBe('אין רשומות');
  });

  it('שיבוץ ישן שהסתיים בלי endedAt נשאר מוחרג (אין תאריך אמין) — התנהגות קודמת נשמרת', () => {
    const db: Db = {
      ...emptyDb(),
      families: [{ ...blankFamily(), id: 'f1', name: 'כהן', members: [{ ...blankMember(), id: 'm1', first: 'רוני' }] }],
      courses: [course()],
      enrollments: [enroll({ status: 'ended' })], // בלי endedAt
    };
    const { rows } = buildCourseDailyRows(course(), db);
    expect(rows.slice(1).every((r) => r[5] !== 'רוני')).toBe(true);
  });
});

/* עזרים מינימליים לישויות שאין להן תבנית ריקה מיוצאת */
function blankFamily() {
  return {
    id: '',
    name: '',
    father: '',
    fatherId: '',
    mother: '',
    motherId: '',
    phone: '',
    phone2: '',
    email: '',
    city: '',
    address: '',
    community: '',
    maritalStatus: '',
    language: '',
    tzedaka: '',
    fullSefach: false,
    discount: '',
    status: 'active' as const,
    notes: '',
    members: [],
    docs: [],
    cred: { score: 700, log: [] },
    createdAt: '2026-01-01',
  };
}

function blankMember() {
  return {
    id: '',
    first: '',
    gender: 'm' as const,
    birth: '',
    idNum: '',
    phone: '',
    phone2: '',
    school: '',
    grade: '',
    health: '',
    mSefach: false,
    mInvite: false,
    mRecommend: false,
    mPhotos: false,
    mVideos: false,
    notes: '',
  };
}
