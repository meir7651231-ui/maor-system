import { describe, it, expect } from 'vitest';
import {
  credSummary,
  dueContacts,
  monthDonationSum,
  monthlySeries,
  punchLow,
} from '../homeData';
import { defaultLayoutFor, sanitizeLayout, THEME_LAYOUTS, WIDGET_LIBRARY, HOME_WIDGETS } from '../widgets';
import { tierOf } from '../../families/lib';
import { emptyDb, emptyFamily, emptyMember, type Db, type Enrollment, type Supporter } from '../../../types/domain';

/* ── fixtures מינימליים — נתונים אמיתיים בלבד, בלי המצאות ── */

const NOW = new Date('2026-07-21T10:00:00');

function supporter(over: Partial<Supporter>): Supporter {
  return {
    id: 's1',
    name: 'תורם',
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  } as Supporter;
}

function enrollment(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1',
    memberId: 'm1',
    courseId: 'c1',
    plan: 'punch',
    purchased: 10,
    used: 0,
    group: '',
    absences: [],
    payments: [],
    totalDue: 0,
    dueDate: '',
    status: 'active',
    note: '',
    enrolledAt: '2026-01-01',
    ...over,
  } as Enrollment;
}

function dbWith(over: Partial<Db>): Db {
  return { ...emptyDb(), ...over };
}

describe('monthlySeries', () => {
  it('בונה 6 חודשים ישן→חדש, האחרון = החודש הנוכחי', () => {
    const points = [
      { date: '2026-07-03', value: 1 }, // החודש הנוכחי
      { date: '2026-07-19', value: 1 },
      { date: '2026-01-10', value: 1 }, // מחוץ לחלון 6 החודשים (פבר׳–יולי) — נזרק
      { date: '2026-05-01', value: 3 },
      { date: '', value: 9 }, // ללא תאריך — נזרק
    ];
    const out = monthlySeries(points, NOW);
    expect(out).toHaveLength(6);
    expect(out[out.length - 1]).toBe(2); // יולי
    expect(out[out.length - 3]).toBe(3); // מאי
    expect(out.reduce((a, b) => a + b, 0)).toBe(5);
  });

  it('אין נקודות ⇒ כולם אפס (ואז אין ספארקליין ב-UI)', () => {
    expect(monthlySeries([], NOW).every((v) => v === 0)).toBe(true);
  });
});

describe('monthDonationSum', () => {
  it('סוכם רק תרומות ₪ של החודש הנוכחי', () => {
    const db = dbWith({
      supporters: [
        supporter({
          id: 's1',
          donations: [
            { rid: 'D-1', date: '2026-07-02', amount: 100, cur: '₪', cat: '' },
            { rid: 'D-2', date: '2026-07-15', amount: 50, cur: '$', cat: '' }, // דולר — לא נספר
            { rid: 'D-3', date: '2026-06-30', amount: 999, cur: '₪', cat: '' }, // חודש שעבר
          ],
        }),
        supporter({
          id: 's2',
          donations: [{ rid: 'D-4', date: '2026-07-20', amount: 40, cur: '₪', cat: '' }],
        }),
      ],
    });
    expect(monthDonationSum(db, NOW)).toBe(140);
  });
});

describe('credSummary', () => {
  it('ממוצע + ספירה לפי דרגות tierOf (950/800/500), חסר = 700', () => {
    const fam = (id: string, score?: number) => ({
      ...emptyFamily(),
      id,
      createdAt: '2026-01-01',
      name: id,
      cred: score === undefined ? undefined : { score, log: [] },
    });
    const db = dbWith({
      families: [fam('a', 960), fam('b', 820), fam('c', 550), fam('d', 100), fam('e')] as Db['families'],
    });
    const s = credSummary(db, (score) => tierOf(score).key);
    expect(s.total).toBe(5);
    expect(s.counts).toEqual({ titan: 1, lion: 1, pale: 2, red: 1 }); // חסר (700) ⇒ pale
    expect(s.avg).toBe(Math.round((960 + 820 + 550 + 100 + 700) / 5));
  });

  it('אין משפחות ⇒ ממוצע 0 בלי חלוקה באפס', () => {
    const s = credSummary(dbWith({}), (score) => tierOf(score).key);
    expect(s.avg).toBe(0);
    expect(s.total).toBe(0);
  });
});

describe('dueContacts', () => {
  it('רק nextDate ≤ היום, ממוין מהמאחר ביותר', () => {
    const db = dbWith({
      supporters: [
        supporter({ id: 's1', name: 'א', nextDate: '2026-07-21' }), // היום — late 0
        supporter({ id: 's2', name: 'ב', nextDate: '2026-07-01' }), // באיחור 20 ימים
        supporter({ id: 's3', name: 'ג', nextDate: '2026-08-01' }), // עתידי — לא נכלל
        supporter({ id: 's4', name: 'ד', nextDate: '' }), // אין יעד
      ],
    });
    const due = dueContacts(db, NOW);
    expect(due.map((c) => c.id)).toEqual(['s2', 's1']);
    expect(due[0].late).toBe(20);
    expect(due[1].late).toBe(0);
  });
});

describe('punchLow', () => {
  it('כרטיסיות פעילות עם ≤2 ניקובים שנותרו, מהנמוך לגבוה', () => {
    const db = dbWith({
      families: [
        {
          ...emptyFamily(),
          id: 'f1',
          createdAt: '2026-01-01',
          name: 'לוי',
          members: [{ ...emptyMember(), id: 'm1', first: 'דוד' }],
        },
      ] as Db['families'],
      courses: [{ id: 'c1', name: 'ציור' } as Db['courses'][number]],
      enrollments: [
        enrollment({ id: 'e1', purchased: 10, used: 9 }), // נשאר 1
        enrollment({ id: 'e2', purchased: 10, used: 8 }), // נשארו 2
        enrollment({ id: 'e3', purchased: 10, used: 5 }), // נשארו 5 — לא נכלל
        enrollment({ id: 'e4', purchased: 10, used: 9, status: 'ended' }), // לא פעיל
        enrollment({ id: 'e5', purchased: 10, used: 10 }), // נגמרה — נכלל (0)
        enrollment({ id: 'e6', plan: 'monthly', purchased: 0, used: 0 }), // לא כרטיסייה
      ],
    });
    const items = punchLow(db);
    expect(items.map((p) => p.key)).toEqual(['e5', 'e1', 'e2']);
    expect(items[0].left).toBe(0);
    expect(items[1].member).toBe('דוד');
    expect(items[1].famName).toBe('לוי');
    expect(items[1].course).toBe('ציור');
    expect(items[1].nav).toEqual({ kind: 'family', id: 'f1' });
  });
});

describe('פריסות פר-ערכה (THEME_LAYOUTS)', () => {
  it('לכל ערכה יש preset; ערכה לא מוכרת נופלת לאור ראשון; hero תמיד ראשון', () => {
    for (const theme of ['or-rishon', 'heichal', 'tsohar', 'kehila']) {
      const layout = defaultLayoutFor(theme);
      expect(layout[0]).toBe('hero');
      expect(layout).toEqual(THEME_LAYOUTS[theme]);
      // כל מזהה ב-preset רשום בספרייה
      for (const id of layout) expect(WIDGET_LIBRARY).toContain(id);
    }
    expect(defaultLayoutFor('no-such-theme')).toEqual(THEME_LAYOUTS['or-rishon']);
  });

  it('sanitizeLayout: פריסה שמורה גוברת על ה-preset; ריק נופל ל-fallback של הערכה', () => {
    const saved = ['recent', 'hero', 'stats'];
    expect(sanitizeLayout(saved, defaultLayoutFor('heichal'))).toEqual(['hero', 'recent', 'stats']);
    expect(sanitizeLayout(undefined, defaultLayoutFor('kehila'))).toEqual([...THEME_LAYOUTS['kehila']]);
    // מזהים לא מוכרים מסוננים
    expect(sanitizeLayout(['hero', 'nope', 'stats'])).toEqual(['hero', 'stats']);
  });

  it("כל ווידג'ט בספרייה רשום ב-HOME_WIDGETS עם label ו-render", () => {
    for (const id of WIDGET_LIBRARY) {
      expect(HOME_WIDGETS[id].id).toBe(id);
      expect(HOME_WIDGETS[id].label.length).toBeGreaterThan(0);
      expect(typeof HOME_WIDGETS[id].render).toBe('function');
    }
  });
});
