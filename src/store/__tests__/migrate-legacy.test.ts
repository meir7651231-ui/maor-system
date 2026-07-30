/**
 * ratchet — migrate() בולע גיבוי לגאסי v:1 מלא בלי לאבד כלום (P0.1).
 *
 * מקור האמת: legacy-main-script.js:152 (persist — צורת הגיבוי המלאה:
 * v/savedAt/families/enrollments/courses/events/rooms/orgName/orgSite/orgDonate/
 * notif/reports/seq/teachers/supporters/ui{famView,crsView}) ו-170-177 (applyBackup).
 * עוד עוגנים: supporters נושאים hist:[{d,a,c}] (legacy:998, 1488) ו-ids בצורת
 * 'spi'+seq (legacy:990); משפחות עשויות לשאת קידומות id fr/wd/fb — נבלעות כמות
 * שהן, אין שינוי id. seq חייב להיזרע מעל הסיומת הספרתית הגבוהה ביותר במזהים,
 * אחרת nextId ינפיק id תפוס.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import type { Supporter } from '../../types/domain';

/** גיבוי לגאסי v:1 מייצג — הצורה המדויקת של legacy persist() (שורה 152). */
function legacyBackup() {
  return {
    v: 1,
    savedAt: '2026-07-28T18:00:00.000Z',
    families: [
      {
        id: 'fr12',
        name: 'פרידמן',
        father: 'יעקב',
        mother: 'רבקה',
        phone: '050-1112233',
        city: 'ביתר עילית',
        community: 'חסידי',
        maritalStatus: 'נשואים',
        status: 'active',
        notes: '',
        members: [
          { id: 'mi40', first: 'שרה', birth: '2015-03-02', gender: 'F' },
          { id: 'mi41', first: 'משה', birth: '2017-06-10', gender: 'M' },
        ],
        docs: ['ספח.pdf'],
        cred: { score: 640, log: [{ d: '2026-05-01', delta: -20, desc: 'היעדרות' }] },
      },
      {
        id: 'wd7',
        name: 'וידר',
        father: '',
        mother: 'מרים',
        phone: '052-9998877',
        city: 'ירושלים',
        maritalStatus: 'אלמן/ה',
        status: 'active',
        members: [{ id: 'mi55', first: 'רחל', birth: '2013-01-20', gender: 'F' }],
        docs: [],
        cred: { score: 700, log: [] },
      },
      {
        id: 'fb3',
        name: 'פישביין',
        phone: '',
        city: 'בית שמש',
        status: 'pending',
        members: [],
        docs: [],
        cred: { score: 700, log: [] },
      },
    ],
    enrollments: [
      { id: 'e70', memberId: 'mi40', courseId: 'c60', plan: 'punch', purchased: 10, used: 3, status: 'active', payments: [{ rid: 'R-2', amount: 120, date: '2026-06-01', method: 'מזומן' }], absences: [] },
    ],
    courses: [
      { id: 'c60', name: 'ריקוד', teacherId: 't5', roomId: 'r2', day: 2, start: '2026-01-01', end: '2026-12-31', price: 120 },
    ],
    events: [{ id: 'ev81', title: 'יריד חנוכה', date: '2026-12-10', type: 'org', done: false }],
    rooms: [{ id: 'r2', name: 'אולם ראשי' }],
    orgName: 'מאור החסד',
    orgSite: 'https://maor.example.org',
    orgDonate: 'https://donate.example.org',
    notif: { email: true, push: false, sms: true, strong: false },
    reports: { daily: true, weekly: false, monthly: false, quarterly: false },
    seq: 90, // נמוך במכוון מהסיומת הגבוהה במזהים (spi105) — migrate חייב לזרוע מעליה
    teachers: [{ id: 't5', name: 'גב׳ לוי', phone: '053-1234567' }],
    supporters: [
      {
        id: 'spi105',
        name: 'גולדשטיין',
        phone: '054-7654321',
        count: 3,
        ils: 1800,
        usd: 0,
        first: '2024-02-11',
        last: '2026-05-30',
        nextDate: '',
        donations: [{ rid: 'D-3', date: '2026-05-30', amount: 600, cur: '₪', cat: 'כללי' }],
        hist: [
          { d: '2024-02-11', a: 600 },
          { d: '2025-01-15', a: 600, c: '$' },
          { a: 100 }, // בלי תאריך — נזרק בנרמול
          { d: '2025-06-01', a: 'לא-מספר' }, // סכום לא מספרי — נזרק
        ],
        ayin: { stage: 'eyes', note: '', names: [{ id: 'an9', name: 'לאה בת חנה', eyes: 2, done: false, paid: true }], answers: [], log: [] },
      },
      {
        id: 'spi106',
        name: 'ברגר',
        phone: '',
        count: 0,
        ils: 0,
        usd: 0,
        first: '2023-11-02',
        last: '2024-03-08',
        nextDate: '',
        donations: [],
        hist: 'לא-מערך', // → undefined בנרמול
      },
    ],
    ui: { famView: 'grid', crsView: 'list' },
  };
}

describe('🧳 ratchet — בליעת גיבוי לגאסי v:1 מלא (P0.1, legacy:152)', () => {
  it('ספירות זהות — אף ישות לא הולכת לאיבוד', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m).not.toBeNull();
    expect(m.families).toHaveLength(3);
    expect(m.enrollments).toHaveLength(1);
    expect(m.courses).toHaveLength(1);
    expect(m.events).toHaveLength(1);
    expect(m.rooms).toHaveLength(1);
    expect(m.teachers).toHaveLength(1);
    expect(m.supporters).toHaveLength(2);
  });

  it('אין שינוי ids — קידומות fr/wd/fb, בני-משפחה mi, תומכות spi נשמרים כמות שהם', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m.families.map((f) => f.id)).toEqual(['fr12', 'wd7', 'fb3']);
    expect(m.families[0].members.map((x) => x.id)).toEqual(['mi40', 'mi41']);
    expect(m.supporters.map((s) => s.id)).toEqual(['spi105', 'spi106']);
    expect(m.enrollments[0].id).toBe('e70');
    expect(m.events[0].id).toBe('ev81');
  });

  it('hist נשמר ומנורמל — איברים תקינים בלבד; לא-מערך → undefined', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m.supporters[0].hist).toEqual([
      { d: '2024-02-11', a: 600 },
      { d: '2025-01-15', a: 600, c: '$' },
    ]);
    expect(m.supporters[1].hist).toBeUndefined();
  });

  it('seq נזרע מעל הסיומת הספרתית הגבוהה ביותר במזהים (spi105 → seq ≥ 106)', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m.seq).toBeGreaterThanOrEqual(106);
  });

  it('orgSite/orgDonate/ui.famView/ui.crsView עוברים; teachers נבלעים; ayin נשמר', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m.orgSite).toBe('https://maor.example.org');
    expect(m.orgDonate).toBe('https://donate.example.org');
    expect(m.ui.famView).toBe('grid');
    expect(m.ui.crsView).toBe('list');
    expect(m.teachers[0].name).toBe('גב׳ לוי');
    // תיק ayin עובר כמות שהוא — כולל שדות שהלגאסי נושא (paid על השם, ראה P0.4)
    const ay = m.supporters[0].ayin!;
    expect(ay.stage).toBe('eyes');
    expect(ay.names[0].name).toBe('לאה בת חנה');
    // מיגרציית docs: מחרוזות v1 → אובייקטי FamilyDoc, לוג cred: {d,desc} → {date,reason}
    expect(m.families[0].docs[0].name).toBe('ספח.pdf');
    expect(m.families[0].cred.log[0]).toEqual({ date: '2026-05-01', delta: -20, reason: 'היעדרות' });
  });

  it('מונים רציפים נזרעים מעל הקבלות שבגיבוי (R-2 → receiptSeq ≥ 3, D-3 → donationSeq ≥ 4)', () => {
    const m = migrate(legacyBackup() as unknown)!;
    expect(m.receiptSeq).toBeGreaterThanOrEqual(3);
    expect(m.donationSeq).toBeGreaterThanOrEqual(4);
  });
});

describe('supDonEvents — נתוני hist זמינים לתצוגת הכרטיס אחרי מיגרציה', () => {
  it('התומכת הממוגרת נושאת hist שהכרטיס ממזג (בדיקת האינטגרציה נמצאת ב-supdon-events)', () => {
    const m = migrate(legacyBackup() as unknown)!;
    const sp = m.supporters[0] as Supporter;
    expect(sp.hist!.length).toBe(2);
    expect(sp.donations.length).toBe(1);
  });
});
