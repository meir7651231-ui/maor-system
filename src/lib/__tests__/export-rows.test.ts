/**
 * ratchet — ייצוא אירועים ישיר (P2 פער 24, feature reports.export.full).
 *
 * השדות verbatim מהלגאסי: כותרת · סוג אירוע · תאריך עברי · תאריך לועזי ·
 * שעה · משפחה · עדיפות · הערות · בוצע. done מיוצא 'כן'/'לא'; התאריך העברי
 * מ-hebDateFull; המיון לפי תאריך.
 */
import { describe, expect, it } from 'vitest';
import { eventsCsvRows } from '../exportRows';
import { emptyDb, emptyFamily, type Db, type OrgEvent } from '../../types/domain';

function ev(over: Partial<OrgEvent>): OrgEvent {
  return {
    id: over.id ?? 'e' + Math.random().toString(36).slice(2, 6),
    title: '',
    date: '',
    time: '',
    type: 'org',
    customType: '',
    notes: '',
    price: 0,
    roomId: '',
    famId: '',
    priority: 'green',
    done: false,
    ...over,
  };
}

function db(events: OrgEvent[]): Db {
  return {
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', createdAt: '2025-01-01', name: 'כהן' }],
    events,
  };
}

describe('⬇ ratchet — eventsCsvRows (פער 24)', () => {
  it('9 עמודות בסדר הלגאסי; עברי+לועזי; משפחה לפי famId; done=כן/לא; ממוין לפי תאריך', () => {
    const rows = eventsCsvRows(
      db([
        ev({ id: 'e2', title: 'ישיבת צוות', date: '2026-07-30', time: '10:00', type: 'org', priority: 'red', notes: 'חדר גדול', done: true }),
        ev({ id: 'e1', title: 'אזכרה', date: '2026-01-15', type: 'memorial', famId: 'f1' }),
      ]),
    );
    expect(rows[0]).toEqual(['כותרת', 'סוג אירוע', 'תאריך עברי', 'תאריך לועזי', 'שעה', 'משפחה', 'עדיפות', 'הערות', 'בוצע']);
    expect(rows).toHaveLength(3);
    // המיון לפי תאריך — האזכרה (ינואר) לפני הישיבה (יולי)
    const [, r1, r2] = rows as string[][];
    expect(r1[0]).toBe('אזכרה');
    expect(r1[3]).toBe('15/01/2026');
    expect(r1[2]).not.toBe(''); // תאריך עברי חושב
    expect(r1[5]).toBe('כהן');
    expect(r1[8]).toBe('לא');
    expect(r2[0]).toBe('ישיבת צוות');
    expect(r2[4]).toBe('10:00');
    expect(r2[6]).toBe('דחוף (אדום)');
    expect(r2[7]).toBe('חדר גדול');
    expect(r2[8]).toBe('כן');
  });

  it('סוג מותאם (customType) גובר על תווית הסוג; אירוע בלי תאריך שורד עם עמודות ריקות', () => {
    const rows = eventsCsvRows(db([ev({ title: 'מותאם', type: 'custom', customType: 'סיור', date: '' })]));
    const [, r] = rows as string[][];
    expect(r[1]).toBe('סיור');
    expect(r[2]).toBe('');
    expect(r[3]).toBe('');
  });
});
