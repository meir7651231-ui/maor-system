/**
 * ratchet — 🔔 תזכורות לקופה (בקשת-בעלים 22.10): חד-פעמית / כל חודש / כל שנה — לפי הלוח העברי.
 * מופיעות בלוח הקופות (פריסה), בשורת-הקופה (המופע הקרוב) ובטיפול כשהגיע זמנן (✓ בוצע למופע בלבד).
 * הציפיות נגזרות מ-hebPartsOfIso (מקור-האמת של המערכת), לא מתאריכים קשיחים.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { boxReminders, dueTzReminders, expandTzEvents, needsCare, nextTzOccurrence, tzOccursOn } from '../lib';
import { hebPartsOfIso } from '../../../lib/hebrew';
import { isoOf } from '../../calendar/calLib';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type TzBox, type TzEvent } from '../../../types/domain';
import eventModalSrc from '../TzEventModal.tsx?raw';
import boxFormSrc from '../BoxForm.tsx?raw';
import cardSrc from '../CoordinatorCard.tsx?raw';
import calSrc from '../CalendarTab.tsx?raw';

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
const rem = (over: Partial<TzEvent>): TzEvent => ({
  id: 'tze1', title: 'לרוקן', date: '2026-10-22', time: '', kind: 'reminder', coordinatorId: 'tzc1', boxId: 'tzb1', notes: '', done: false, ...over,
});
const days = (ev: TzEvent, from: string, n: number) => expandTzEvents([ev], from, addDays(from, n)).map((e) => e.date);
/** היום הראשון מ-from שבו היום-בחודש העברי = day */
const firstHebDay = (from: string, day: number) => {
  let iso = from;
  while (hebPartsOfIso(iso).day !== day) iso = addDays(iso, 1);
  return iso;
};

describe('🔔 תזכורות — חישוב לפי הלוח העברי', () => {
  it('חד-פעמית: רק בתאריך שנבחר', () => {
    const ev = rem({});
    expect(days(ev, '2026-10-01', 120)).toEqual(['2026-10-22']);
    expect(tzOccursOn(ev, '2026-11-22')).toBe(false);
  });

  it('כל חודש: מופע אחד בכל חודש עברי, באותו יום-בחודש העברי, מהתאריך שנבחר והלאה', () => {
    const start = firstHebDay('2026-10-01', 15);
    const occ = days(rem({ date: start, recur: 'monthly' }), addDays(start, -40), 400);
    expect(occ[0]).toBe(start); // לא לפני ההתחלה
    expect(occ.length).toBeGreaterThanOrEqual(12);
    for (const iso of occ) expect(hebPartsOfIso(iso).day).toBe(15);
    const months = occ.map((iso) => hebPartsOfIso(iso).month + hebPartsOfIso(iso).year);
    expect(new Set(months).size).toBe(months.length); // אף חודש פעמיים
    for (let i = 1; i < occ.length; i++) {
      const gap = (new Date(occ[i] + 'T12:00:00').getTime() - new Date(occ[i - 1] + 'T12:00:00').getTime()) / 864e5;
      expect(gap === 29 || gap === 30).toBe(true);
    }
  });

  it('כל חודש מל׳: חודש בלי ל׳ ⇒ א׳ בחודש הבא (כלל ל׳), בלי כפילות', () => {
    const start = firstHebDay('2026-09-01', 30);
    const occ = days(rem({ date: start, recur: 'monthly' }), start, 420);
    for (const iso of occ) {
      const p = hebPartsOfIso(iso);
      if (p.day === 1) expect(hebPartsOfIso(addDays(iso, -1)).day).toBe(29); // רק כשאין ל׳
      else expect(p.day).toBe(30);
    }
    expect(occ.some((iso) => hebPartsOfIso(iso).day === 1)).toBe(true); // יש חודשים בני 29 בשנה
    const months = occ.map((iso) => { const p = hebPartsOfIso(addDays(iso, -1)); return p.month + p.year; });
    expect(new Set(months).size).toBe(months.length);
  });

  it('כל שנה: פעם אחת בשנה, באותו תאריך עברי', () => {
    const start = '2026-10-22';
    const a = hebPartsOfIso(start);
    const occ = days(rem({ date: start, recur: 'yearly' }), start, 365 * 3 + 30);
    expect(occ.length).toBe(4);
    for (const iso of occ) expect(hebPartsOfIso(iso)).toMatchObject({ day: a.day, month: a.month });
    expect(new Set(occ.map((iso) => hebPartsOfIso(iso).year)).size).toBe(4);
  });

  it('הגיע זמנה: חד-פעמית שעברה ולא בוצעה; חוזרת — המופע האחרון עד היום בלבד (לא נערמים)', () => {
    const start = firstHebDay('2026-06-01', 10);
    const monthly = rem({ id: 'm', date: start, recur: 'monthly' });
    const today = addDays(firstHebDay(addDays(start, 100), 10), 3);
    const due = dueTzReminders([monthly, rem({ id: 'o', date: '2026-07-01' }), rem({ id: 'f', date: '2099-01-01' })], today);
    expect(due.map((d) => d.ev.id)).toEqual(['o', 'm']);
    expect(hebPartsOfIso(due[1].date).day).toBe(10);
    expect(due[1].date <= today).toBe(true);
    // ✓ בוצע למופע ⇒ יורד; המופע הבא מחושב קדימה
    const done = { ...monthly, doneDates: [due[1].date] };
    expect(dueTzReminders([done], today)).toEqual([]);
    expect(hebPartsOfIso(nextTzOccurrence(done, today) as string).day).toBe(10);
    expect(nextTzOccurrence(done, today) > today).toBe(true);
  });

  it('תזכורת שאינה reminder (סבב/מבצע) לא קופצת לטיפול', () => {
    expect(dueTzReminders([rem({ kind: 'round', date: '2026-01-01' })], '2026-10-22')).toEqual([]);
  });

  it('שורת-הקופה: התזכורות של הקופה בלבד, הקרובה ראשונה', () => {
    const list = boxReminders(
      [rem({ id: 'a', date: '2026-12-01' }), rem({ id: 'b', date: '2026-11-01' }), rem({ id: 'c', boxId: 'other', date: '2026-10-25' })],
      'tzb1',
      '2026-10-22',
    );
    expect(list.map((r) => r.ev.id)).toEqual(['b', 'a']);
  });
});

describe('🔔 תזכורות — store וטיפול', () => {
  const box: TzBox = { id: 'tzb1', num: '42', coordinatorId: 'tzc1', famId: '', holderKind: '', since: '', status: 'office', notes: '', collections: [] };
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), tzBoxes: [box] }));
  });

  it('needsCare מציג תזכורת שהגיע זמנה עם שם-הקופה; doneTzReminder בחוזרת מסמן רק את המופע', () => {
    useApp.getState().upsertTzEvent(rem({ id: '', date: '2026-01-05', recur: 'monthly' }));
    const db = useApp.getState().db;
    const care = needsCare(db, '2026-10-22').filter((c) => c.kind === 'reminder');
    expect(care).toHaveLength(1);
    expect(care[0].label).toContain('קופה 42');
    useApp.getState().doneTzReminder(care[0].id, care[0].date as string);
    const ev = useApp.getState().db.tzEvents[0];
    expect(ev.recur).toBe('monthly');
    expect(ev.done).toBe(false);
    expect(ev.doneDates).toEqual([care[0].date]);
    expect(needsCare(useApp.getState().db, '2026-10-22').some((c) => c.kind === 'reminder')).toBe(false);
  });

  it('doneTzReminder בחד-פעמית ⇒ done', () => {
    useApp.getState().upsertTzEvent(rem({ id: '', date: '2026-10-01' }));
    const id = useApp.getState().db.tzEvents[0].id;
    useApp.getState().doneTzReminder(id, '2026-10-01');
    expect(useApp.getState().db.tzEvents[0].done).toBe(true);
  });
});

describe('🔔 תזכורות — הגנות-מקור (חיווט)', () => {
  it('עריכה מהלוח שומרת את הסדרה (doneDates) ומאפשרת חזרה; לחיצה על מופע עורכת את המקור', () => {
    expect(eventModalSrc).toContain('...keep');
    expect(eventModalSrc).toContain('TZ_RECUR_LABEL');
    expect(calSrc).toContain('expandTzEvents(');
    expect(calSrc).toContain('tzEvents.find((x) => x.id === ev.id)');
  });
  it('כפתור "➕ הוספת תזכורת" בעריכת-קופה ותזכורת-קרובה בשורת-הקופה', () => {
    expect(boxFormSrc).toContain('➕ הוספת תזכורת');
    expect(boxFormSrc).toContain('<TzReminderModal');
    expect(cardSrc).toContain('boxReminders(db.tzEvents, b.id');
  });
});
