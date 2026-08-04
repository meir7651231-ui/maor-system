/**
 * ratchet — מנוע-ICS (INTEGRATIONS גל א׳, הרחבת gcal). דיוקי RFC 5545 שנלעסו:
 * CRLF · קיפול 75-אוקטטים בטוח-UTF8 (עברית=2 בייט/תו) · escaping · אירוע-עם-שעה
 * צף-מקומי + DTEND שעה (כולל גלגול-חצות) · בלי-שעה = יום-שלם · DTSTAMP מוזרק.
 * וגם: פריסת חזרות עבריות (icsWindowEvents) — יארצייט מופיע בתאריך העברי בשנה הבאה.
 */
import { describe, expect, it } from 'vitest';
import { buildIcs, foldIcsLine, icsEscape, type IcsOccurrence } from '../ics';
import { icsWindowEvents } from '../../components/calendar/calLib';
import { emptyDb, emptyFamily, type Db, type Member, type OrgEvent } from '../../types/domain';
import { DEFAULT_CONFIG } from '../../types/config';

const NOW = new Date('2026-08-04T10:00:00Z');

function occ(over: Partial<IcsOccurrence>): IcsOccurrence {
  return { uid: 'e1-2026-09-01@t', title: 'אירוע', date: '2026-09-01', time: '', ...over };
}

describe('📅 ratchet — מנוע ICS (buildIcs/foldIcsLine/icsEscape)', () => {
  it('escaping: \\ ; , ושורות-חדשות', () => {
    expect(icsEscape('a;b,c\\d')).toBe('a\\;b\\,c\\\\d');
    expect(icsEscape('שורה1\nשורה2')).toBe('שורה1\\nשורה2');
  });

  it('קיפול: שורה ארוכה בעברית נשברת ל-≤75 אוקטטים, המשך נפתח ברווח', () => {
    const long = 'SUMMARY:' + 'אבגדהוזחטי'.repeat(12); // 8 + 120 תווים עבריים (240 בייט)
    const folded = foldIcsLine(long);
    expect(folded.length).toBeGreaterThan(1);
    const enc = new TextEncoder();
    for (const l of folded) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    for (const l of folded.slice(1)) expect(l.startsWith(' ')).toBe(true);
    // שחזור: הסרת CRLF+רווח מחזירה את המקור (אין תו שאבד/נשבר)
    expect(folded.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(long);
  });

  it('CRLF בין כל השורות + מעטפת VCALENDAR', () => {
    const text = buildIcs([occ({})], 'לוח', NOW);
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('\r\nBEGIN:VEVENT\r\n');
    expect(text.includes('\n' + 'BEGIN')).toBe(true); // אחרי \r
    expect(text.split('\r\n').some((l) => l.includes('\n'))).toBe(false); // אין \n בודד
  });

  it('אירוע-עם-שעה: DTSTART צף-מקומי + DTEND שעה אחרי', () => {
    const text = buildIcs([occ({ time: '14:30' })], 'לוח', NOW);
    expect(text).toContain('DTSTART:20260901T143000');
    expect(text).toContain('DTEND:20260901T153000');
  });

  it('גלגול-חצות: 23:30 ⇒ DTEND ביום המחרת 00:30', () => {
    const text = buildIcs([occ({ time: '23:30' })], 'לוח', NOW);
    expect(text).toContain('DTSTART:20260901T233000');
    expect(text).toContain('DTEND:20260902T003000');
  });

  it('בלי-שעה: יום-שלם — VALUE=DATE + DTEND מחרת', () => {
    const text = buildIcs([occ({})], 'לוח', NOW);
    expect(text).toContain('DTSTART;VALUE=DATE:20260901');
    expect(text).toContain('DTEND;VALUE=DATE:20260902');
  });

  it('DTSTAMP מה-now המוזרק (טהור — אפס Date.now)', () => {
    const text = buildIcs([occ({})], 'לוח', NOW);
    expect(text).toContain('DTSTAMP:20260804T100000Z');
  });

  it("שעה לא-תקינה ('9:00') ⇒ נפילה בטוחה ליום-שלם — לא VEVENT מושחת (ביקורת 4.8)", () => {
    // '9:00' ⇒ Invalid Date ⇒ DTSTART:NaN… שמפיל את כל הקובץ ביבואן. הגנה: HH:MM בלבד.
    const text = buildIcs([occ({ time: '9:00' })], 'לוח', NOW);
    expect(text).not.toContain('NaN');
    expect(text).toContain('DTSTART;VALUE=DATE:20260901');
  });

  it('DESCRIPTION/LOCATION רק כשקיימים; SUMMARY עם escaping', () => {
    const text = buildIcs([occ({ title: 'ברית; אולם', notes: 'הערה', location: 'חדר A' })], 'לוח', NOW);
    expect(text).toContain('SUMMARY:ברית\\; אולם');
    expect(text).toContain('DESCRIPTION:הערה');
    expect(text).toContain('LOCATION:חדר A');
    const bare = buildIcs([occ({})], 'לוח', NOW);
    expect(bare).not.toContain('DESCRIPTION:');
    expect(bare).not.toContain('LOCATION:');
  });
});

describe('📅 ratchet — icsWindowEvents (פריסת חזרות עבריות)', () => {
  const ev = (over: Partial<OrgEvent>): OrgEvent => ({
    id: 'e1', title: 'אזכרה', date: '2025-09-10', time: '', type: 'memorial', customType: '',
    notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false, ...over,
  });

  it('יארצייט (memorial) מופיע בחלון-שנה קדימה בתאריך העברי המקביל — לא בלועזי', () => {
    const db: Db = { ...emptyDb(), events: [ev({})] };
    const occs = icsWindowEvents(db, '2026-08-04', 365, 'test');
    expect(occs.length).toBe(1);
    // ‏10.9.2025 = י"ז אלול תשפ"ה ⇒ המופע בתשפ"ו הוא סביב סוף אוגוסט/ספטמבר 2026,
    // אך לא בהכרח 10.9 — העיקר: מופע יחיד, בחלון, עם uid נגזר-תאריך.
    expect(occs[0].uid).toBe('e1-' + occs[0].date + '@test');
    expect(occs[0].date >= '2026-08-04').toBe(true);
  });

  it("אירוע חד-פעמי בחלון מופיע פעם אחת; מסומן 'בוצע' מחוץ-למקור לא מופיע", () => {
    const db: Db = {
      ...emptyDb(),
      events: [
        ev({ id: 'e2', type: 'org', date: '2026-09-01', time: '14:00', title: 'ישיבה' }),
        ev({ id: 'e3', type: 'memorial', date: '2020-09-01', done: true }), // בוצע ⇒ רק במקור (מחוץ לחלון)
      ],
    };
    const occs = icsWindowEvents(db, '2026-08-04', 365, 'test');
    expect(occs.filter((o) => o.uid.startsWith('e2-')).length).toBe(1);
    expect(occs.filter((o) => o.uid.startsWith('e3-')).length).toBe(0);
    expect(occs.find((o) => o.uid.startsWith('e2-'))?.time).toBe('14:00');
  });

  it('🛡 שנה מעוברת: חלון-365 מפספס יארצייט (מרווח 383-385 יום) — חלון-385 תופס (ביקורת 4.8)', () => {
    // העוגן: ט"ז אב תשפ"ד = 20.8.2024. מופעיו: 30.7.2026 (תשפ"ו) ואז 19.8.2027
    // (תשפ"ז — מעוברת). ייצוא מ-4.8.2026: חלון-365 מכיל אפס מופעים (הבאג);
    // חלון-385 (אורך שנה עברית מעוברת) מכיל את מופע-תשפ"ז. הכפתור מייצא 385.
    const db: Db = { ...emptyDb(), events: [ev({ id: 'y1', date: '2024-08-20' })] };
    expect(icsWindowEvents(db, '2026-08-04', 365, 't').filter((o) => o.uid.startsWith('y1-')).length).toBe(0);
    const wide = icsWindowEvents(db, '2026-08-04', 385, 't').filter((o) => o.uid.startsWith('y1-'));
    expect(wide.length).toBe(1);
    expect(wide[0].date).toBe('2027-08-19');
  });

  it('🎂 שכבת ימי-הולדת (calendar.ics.bdays) — פלטפורמה: עברי-חוזר; דגל false ⇒ נעדרת', () => {
    // ורטיקל סטודיו/עסק מדליק; חסד מכבה (צנעת-מוטבים). בלי config — התנהגות גל א׳.
    const member = { id: 'm1', first: 'שרה', birth: '2015-09-10' } as Member;
    const db: Db = {
      ...emptyDb(),
      families: [{ ...emptyFamily(), id: 'f1', createdAt: '', name: 'כהן', members: [member] }],
    };
    const cfgOn = { ...DEFAULT_CONFIG };
    const withB = icsWindowEvents(db, '2026-08-04', 385, 't', cfgOn).filter((o) => o.uid.startsWith('bday-m1'));
    expect(withB.length).toBeGreaterThanOrEqual(1); // מופע עברי בחלון
    expect(withB[0].title).toContain('שרה');
    const cfgOff = { ...DEFAULT_CONFIG, features: { 'calendar.ics.bdays': false } };
    expect(icsWindowEvents(db, '2026-08-04', 385, 't', cfgOff).some((o) => o.uid.startsWith('bday-'))).toBe(false);
    // בלי config — אין שכבות-נגזרות (תאימות גל א׳)
    expect(icsWindowEvents(db, '2026-08-04', 385, 't').some((o) => o.uid.startsWith('bday-'))).toBe(false);
  });

  it('🎨 שכבת מפגשים (calendar.ics.sessions) — שבועי עם שעה; מודול-חוגים כבוי ⇒ נעדרת', () => {
    const course = {
      id: 'c1', name: 'ציור', weekday: 2, time: '17:00', sessions: [], roomId: '', teacherId: '',
      price: 0, audience: '', notes: '', start: '', end: '',
    } as unknown as Db['courses'][number];
    const db: Db = { ...emptyDb(), courses: [course] };
    const occs = icsWindowEvents(db, '2026-08-04', 30, 't', { ...DEFAULT_CONFIG }).filter((o) => o.uid.startsWith('crs-c1'));
    expect(occs.length).toBeGreaterThanOrEqual(4); // ~שבועי בחלון-30-יום
    expect(occs[0].time).toBe('17:00');
    expect(occs[0].title).toBe('ציור');
    const offMod = { ...DEFAULT_CONFIG, modules: { courses: false } };
    expect(icsWindowEvents(db, '2026-08-04', 30, 't', offMod).some((o) => o.uid.startsWith('crs-'))).toBe(false);
  });

  it('חדר מתורגם ל-location', () => {
    const db: Db = {
      ...emptyDb(),
      rooms: [{ id: 'r1', name: 'אולם מרכזי', active: true, slot: 60, cap: 0, location: '', rate: 0, from: '', to: '', access: true, notes: '', eq: {} }],
      events: [ev({ id: 'e4', type: 'org', date: '2026-09-01', roomId: 'r1' })],
    };
    const occs = icsWindowEvents(db, '2026-08-04', 60, 'test');
    expect(occs[0]?.location).toBe('אולם מרכזי');
  });
});
