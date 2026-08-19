/**
 * ratchet — דו"ח מותאם מלא (P2 פער 23, feature reports.custom.full).
 *
 * מקור האמת: expFieldDefs בלגאסי (legacy:1699-1706) — רשימות השדות
 * המלאות: קורסים 14 · תומכות 17 (עם מעקב הטיפול). הדגל כבוי ⇒ הרשימות
 * המקוצרות שקדמו לפער. בנוסף: overrideColumn — עריכת הערות לייצוא בלבד.
 */
import { describe, expect, it } from 'vitest';
import { buildCustomExport, expFieldDefs, overrideColumn } from '../customExport';
import { DEFAULT_CONFIG } from '../../types/config';
import { emptyDb, emptyFamily, emptyMember, type Db } from '../../types/domain';

const CFG_ON = { ...DEFAULT_CONFIG, features: {} };
const CFG_OFF = { ...DEFAULT_CONFIG, features: { 'reports.custom.full': false } };

function fixtureDb(): Db {
  const fam = {
    ...emptyFamily(),
    id: 'f1',
    createdAt: '2025-01-01',
    name: 'כהן',
    phone: '050-1111111',
    members: [{ ...emptyMember(), id: 'm1', first: 'רבקה', birth: '2015-03-01', gender: 'f' as const }],
  };
  return {
    ...emptyDb(),
    families: [fam],
    teachers: [
      { id: 't1', name: 'מורה לאה', phone: '052-0000000', phone2: '', email: '', idNum: '', address: '', specialty: '', payRate: 0, startDate: '', notes: '' },
    ],
    rooms: [
      { id: 'r1', name: 'אולם', active: true, slot: 60, cap: 20, location: '', rate: 0, from: '', to: '', access: false, notes: '', eq: {} },
    ],
    courses: [
      {
        id: 'c1',
        name: 'ריקוד',
        teacherId: 't1',
        roomId: 'r1',
        description: '',
        price: 100,
        price1: 0,
        price2: 0,
        price1Name: '',
        price2Name: '',
        model: 'monthly',
        size: 0,
        start: '',
        end: '',
        weekday: 2,
        time: '17:00',
        maxStudents: 12,
        gender: 'f',
        ageMin: 0,
        ageMax: 0,
        cat: '',
        semester: '',
        sector: '',
        gradeMin: 'ב',
        gradeMax: 'ד',
        sessions: [],
        notes: 'הערת חוג',
      },
    ],
    enrollments: [
      {
        id: 'e1',
        memberId: 'm1',
        courseId: 'c1',
        plan: 'monthly',
        purchased: 0,
        used: 0,
        group: '',
        absences: [],
        payments: [
          { rid: 'R-1', date: '2026-01-15', amount: 100, method: 'מזומן' },
          { rid: 'R-2', date: '2026-06-15', amount: 50, method: 'מזומן' },
        ],
        totalDue: 400,
        dueDate: '',
        status: 'active',
        note: '',
        enrolledAt: '2026-01-01',
      },
    ],
    supporters: [
      {
        id: 's1',
        name: 'פרידמן',
        phone: '050-2222222',
        email: '',
        address: 'הרצל 1',
        city: 'בני ברק',
        idNum: '',
        cat: 'פרטי',
        forWho: 'כללי',
        notes: 'הערת תומכת',
        count: 2,
        ils: 300,
        usd: 0,
        first: '2026-01-10',
        last: '2026-06-10',
        nextDate: '',
        donations: [
          { rid: 'D-1', date: '2026-01-10', amount: 100, cur: '₪', cat: 'כללי' },
          { rid: 'D-2', date: '2026-06-10', amount: 200, cur: '₪', cat: 'כללי' },
        ],
      },
    ],
  };
}

describe('📊 ratchet — רשימות השדות המלאות (legacy:1699-1706)', () => {
  it('דגל חסר (=פעיל): קורסים 14 שדות · תומכות 17 · אירועים 9; כבוי: 7 · 8 · 9', () => {
    expect(expFieldDefs(CFG_ON, 'courses')).toHaveLength(14);
    expect(expFieldDefs(CFG_ON, 'supporters')).toHaveLength(17);
    expect(expFieldDefs(CFG_OFF, 'courses')).toHaveLength(7);
    expect(expFieldDefs(CFG_OFF, 'supporters')).toHaveLength(8);
  });

  it('סדר ותוכן שדות הקורסים לפי הלגאסי', () => {
    expect(expFieldDefs(CFG_ON, 'courses').map((f) => f.key)).toEqual([
      'name', 'teacher', 'grade', 'audience', 'room', 'schedule', 'model',
      'occ', 'students', 'studentsFull', 'pays', 'revenue', 'abs', 'notes',
    ]);
    expect(expFieldDefs(CFG_ON, 'supporters').map((f) => f.key)).toEqual([
      'name', 'phone', 'email', 'address', 'city', 'cat', 'forWho', 'dons',
      'donsAll', 'tier', 'stage', 'names', 'eyesTotal', 'paid', 'answers', 'next', 'notes',
    ]);
  });
});

describe('📊 ratchet — בניית השורות המלאות', () => {
  it('studentsFull = שם + טלפון (fallback משפחה) + יתרה; revenue כל-הזמן; grade מהטווח', () => {
    const rows = buildCustomExport(CFG_ON, fixtureDb(), 'courses', { from: '', to: '' },
      ['name', 'grade', 'room', 'schedule', 'studentsFull', 'revenue', 'notes']);
    expect(rows).toHaveLength(2);
    const [, r] = rows as string[][];
    expect(r[0]).toBe('ריקוד');
    expect(r[1]).toBe('ב–ד');
    expect(r[2]).toBe('אולם');
    expect(r[3]).toContain('יום שלישי 17:00');
    // טלפון הילדה ריק ⇒ טלפון המשפחה; יתרה = 400 − 150
    expect(r[4]).toBe('רבקה 050-1111111 · יתרה ₪250');
    expect(r[5]).toBe('₪150');
    expect(r[6]).toBe('הערת חוג');
  });

  it('dons מכבד את הטווח; donsAll תמיד כל-הזמן; city/cat/forWho/notes נשלפים', () => {
    const rows = buildCustomExport(CFG_ON, fixtureDb(), 'supporters', { from: '2026-01-01', to: '2026-03-31' },
      ['name', 'city', 'cat', 'forWho', 'dons', 'donsAll', 'notes']);
    expect(rows).toHaveLength(2);
    const [, r] = rows as string[][];
    expect(r).toEqual([
      'פרידמן', 'בני ברק', 'פרטי', 'כללי',
      '1 תרומות · ₪100', '2 תרומות · ₪300', 'הערת תומכת',
    ]);
  });

  // באג "הסך תרומות לא מתעדכן" (19.8.2026): donsAll ("כל-הזמן") סכם את המונים
  // השמורים (קבלות-בלבד) ⇒ עסקאות-הסליקה/נדרים ב-hist[] נעלמו מה-CSV אף שהן
  // בכל שאר משטחי-התצוגה. הכרעת-בעלים 9.8 "לכולל": CSV = משטח-תצוגה ⇒ כולל hist.
  it('donsAll כולל את הקובץ-ההיסטורי (hist) — הכרעת 9.8 "לכולל"', () => {
    const db = fixtureDb();
    // תורם עם קבלה אחת ₪100 + שתי עסקאות-סליקה בהיסטוריה (₪500 + $40)
    db.supporters = [
      {
        ...db.supporters[0],
        id: 's2', name: 'נדריםי', count: 1, ils: 100, usd: 0,
        donations: [{ rid: 'D-9', date: '2026-02-01', amount: 100, cur: '₪', cat: '' }],
        hist: [
          { d: '2020-01-01', a: 500 },
          { d: '2020-02-01', a: 40, c: '$' },
        ],
      },
    ];
    const rows = buildCustomExport(CFG_ON, db, 'supporters', { from: '', to: '' }, ['name', 'donsAll']);
    const [, r] = rows as string[][];
    // 1 קבלה + 2 היסטוריה = 3 · ₪(100+500)=600 · $(40)
    expect(r[1]).toBe('3 תרומות · ₪600 + $40');
  });

  it('overrideColumn: דורס רק שורות-נתונים שנערכו; הכותרת וה-DB לא נגעו', () => {
    const rows: (string | number)[][] = [
      ['שם', 'הערות'],
      ['א', 'ישן'],
      ['ב', 'נשאר'],
    ];
    const out = overrideColumn(rows, 1, { 1: 'חדש' });
    expect(out[0]).toEqual(['שם', 'הערות']);
    expect(out[1]).toEqual(['א', 'חדש']);
    expect(out[2]).toEqual(['ב', 'נשאר']);
    expect(rows[1][1]).toBe('ישן'); // המקור לא שונה
    expect(overrideColumn(rows, -1, { 1: 'x' })).toBe(rows); // אין עמודת הערות — ללא שינוי
  });
});
