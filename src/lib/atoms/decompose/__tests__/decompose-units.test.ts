/**
 * 🔨 המפרק · יחידות (ATOMS-DECOMPOSE, 14.10.2026): כללי-הסוגים, הקורא ההצהרתי, התצוגה הכללית, המילים, והמשקל.
 */
import { describe, expect, it } from 'vitest';
import { arrayElement, classifyField, classifyReturn, classifyStruct, spanPairs, stringLiterals, textEcho, unionParts, waitingOf } from '../kinds';
import { extract, momentOf, readPath } from '../extract';
import { genericPreviewOf } from '../genericPreview';
import { hasForbidden, plainWords, shortName } from '../words';
import type { GenPlace } from '../types';

const NOW = Date.parse('2026-10-14T09:00:00Z'); // רביעי 12:00 ישראל

describe('kinds — טקסט-טיפוס + שם-שדה ⇒ סוג, עם סיבה', () => {
  it.each([
    ["IsoDate | ''", 'nextDate', 'times'],
    ['IsoDate', 'date', 'times'],
    ['TimeHM', 'time', 'times'],
    ['string', 'createdAt', 'times'],
    ['string', 'startIso', 'times'],
    ['number', 'amount', 'amount'],
    ['number', 'price2', 'amount'],
    ['number', 'maxStudents', 'amount'],
    ['string', 'name', 'text'],
    ['string', 'description', 'text'],
    ['IsoDate[]', 'presents', 'times'],
    ['string[]', 'languages', 'text'],
  ] as const)('%s %s ⇒ %s', (type, field, kind) => {
    const v = classifyField(type, field);
    expect(v.kind).toBe(kind);
    expect(v.reason).toMatch(/[א-ת]/);
  });

  it.each([
    ['string', 'phone'],
    ['string', 'email'],
    ['string', 'idNum'],
    ['string', 'health'],
    ['string', 'address'],
    ['Id', 'courseId'],
    ['string', 'updatedAt'],
    ['number', 'dow'],
    ['boolean', 'paid'],
    ["'open' | 'done'", 'status'],
    ['string', 'rid'],
  ])('%s %s ⇒ null (עם סיבה)', (type, field) => {
    const v = classifyField(type, field);
    expect(v.kind).toBeNull();
    expect(v.reason.length).toBeGreaterThan(3);
  });

  it('עזרי-טקסט', () => {
    expect(arrayElement('readonly Supporter[]')).toBe('Supporter');
    expect(arrayElement('Array<{ q: string; a: string }>')).toBe('{ q: string; a: string }');
    expect(unionParts("IsoDate | '' | null")).toEqual(['IsoDate']);
    expect(stringLiterals("'open' | 'answered' | 'closed'")).toEqual(['open', 'answered', 'closed']);
    expect(stringLiterals('string | number')).toEqual([]);
  });

  it('טווחים מזוגות, "מחכה" מסטטוס או done', () => {
    expect(spanPairs([{ name: 'start', type: 'IsoDate' }, { name: 'end', type: 'IsoDate' }])).toEqual([{ from: 'start', to: 'end', unit: 'date' }]);
    expect(spanPairs([{ name: 'from', type: 'TimeHM' }, { name: 'to', type: 'TimeHM' }])).toEqual([{ from: 'from', to: 'to', unit: 'clock' }]);
    expect(spanPairs([{ name: 'ageMin', type: 'number' }, { name: 'ageMax', type: 'number' }])).toEqual([{ from: 'ageMin', to: 'ageMax', unit: 'number' }]);
    expect(spanPairs([{ name: 'start', type: 'IsoDate' }, { name: 'end', type: 'TimeHM' }])).toEqual([]);
    expect(waitingOf([{ name: 'status', type: "'active' | 'paused' | 'ended' | 'wait'" }])).toEqual({ status: 'status', open: ['wait'] });
    expect(waitingOf([{ name: 'done', type: 'boolean' }])).toEqual({ done: 'done' });
    expect(waitingOf([{ name: 'status', type: "'pending' | 'wait'" }])).toBeNull(); // הכול "פתוח" — לא מבדיל
  });

  it('ערכי-חזרה', () => {
    expect(classifyReturn('number', 'bookingBalance').kind).toBe('amount');
    expect(classifyReturn('number', 'dayOfWeek').kind).toBeNull();
    expect(classifyReturn('IsoDate[]', 'x').kind).toBe('times');
    expect(classifyReturn('', 'x').reason).toMatch(/אין טיפוס/);
    expect(classifyStruct([{ name: 'sunrise', type: "TimeHM | ''" }, { name: 'sunset', type: "TimeHM | ''" }], false).kind).toBe('span');
    expect(classifyStruct([{ name: 'iso', type: 'IsoDate' }], true).kind).toBe('sequence');
    expect(classifyStruct([{ name: 'time', type: 'TimeHM' }, { name: 'label', type: 'string' }], true).kind).toBe('times');
  });

  it('echo: רק תווית של דבר, ברשומה בלי טלפון', () => {
    expect(textEcho('name', false)).toBe(true);
    expect(textEcho('name', true)).toBe(false);
    expect(textEcho('notes', false)).toBe(false);
    expect(textEcho('first', false)).toBe(false);
  });
});

describe('extract — קורא הצהרתי שלא זורק', () => {
  const db = {
    supporters: [
      { id: 's1', name: 'א', donations: [{ date: '2026-01-05', amount: 100 }, { date: '2026-02-05', amount: 50.5 }], nextDate: '2026-10-20' },
      { id: 's2', name: 'ב', donations: [{ date: '2026-03-01', amount: 'x' }], nextDate: '' },
      null,
      'garbage',
    ],
    hostRecords: [
      { id: 'f1', kind: 'fault', status: 'open', createdAt: '2026-10-13T08:00:00.000Z' },
      { id: 'f2', kind: 'fault', status: 'done', createdAt: '2026-10-12T08:00:00.000Z' },
      { id: 'c1', kind: 'clean', status: 'open', createdAt: '2026-10-13T08:00:00.000Z' },
    ],
    hostBookings: [
      { id: 'b1', guestId: 'g1', checkIn: '2026-10-10', checkOut: '2026-10-12' },
      { id: 'b2', guestId: 'g1', checkIn: '2026-10-12', checkOut: '2026-10-15' },
      { id: 'b3', guestId: 'g2', checkIn: '2026-10-20', checkOut: '2026-10-19' },
    ],
  };

  it('readPath פותח רשימות', () => {
    expect(readPath(db, 'supporters[].donations[].amount')).toEqual([100, 50.5, 'x']);
    expect(readPath({ a: { b: [1, 2] } }, 'a.b[]')).toEqual([1, 2]);
    expect(readPath(null, 'x[].y')).toEqual([]);
  });

  it('לפי סוג', () => {
    expect(extract(db, { entity: 'supporters', path: 'donations[].amount', kind: 'amount' })).toEqual({ kind: 'amount', values: [100, 50.5] });
    expect(extract(db, { entity: 'supporters', path: 'nextDate', kind: 'times' })).toEqual({ kind: 'times', values: ['2026-10-20'] });
    expect(extract(db, { entity: 'supporters', path: 'donations[]', kind: 'sequence', dateField: 'date' })).toEqual({
      kind: 'sequence',
      groups: [['2026-01-05', '2026-02-05'], ['2026-03-01']],
    });
    expect(extract(db, { entity: 'hostRecords', where: { kind: 'fault' }, path: '', kind: 'waiting', status: { field: 'status', open: ['open'] }, since: 'createdAt' })).toEqual({
      kind: 'waiting',
      items: [{ since: '2026-10-13T08:00:00.000Z' }],
      total: 2,
    });
    // טווח הפוך נזרק
    expect(extract(db, { entity: 'hostBookings', path: 'checkIn', to: 'checkOut', kind: 'span', unit: 'date' })).toEqual({
      kind: 'span',
      unit: 'date',
      spans: [
        { from: '2026-10-10', to: '2026-10-12' },
        { from: '2026-10-12', to: '2026-10-15' },
      ],
    });
    expect(extract(db, { entity: 'hostBookings', path: '', kind: 'sequence', dateField: 'checkIn', groupBy: 'guestId' })).toEqual({
      kind: 'sequence',
      groups: [['2026-10-10', '2026-10-12'], ['2026-10-20']],
    });
  });

  it('לא זורק על שום קלט', () => {
    const bad: unknown[] = [null, undefined, 5, 'x', [], { supporters: 'x' }, { supporters: [{ donations: { length: 3 } }] }];
    for (const d of bad) for (const kind of ['times', 'amount', 'span', 'sequence', 'waiting', 'text'] as const) expect(() => extract(d, { entity: 'supporters', path: 'donations[].date', to: 'donations[].x', kind })).not.toThrow();
    expect(extract(db, null as never)).toBeNull();
    expect(extract(db, { entity: 'hostBookings', path: 'checkIn', to: 'other.checkOut', kind: 'span' })).toBeNull();
  });

  it('momentOf', () => {
    expect(momentOf('2026-10-14')).toBe('2026-10-14');
    expect(momentOf('9:05')).toBe('09:05');
    expect(momentOf('2026-13-40')).toBeNull();
    expect(momentOf(5)).toBeNull();
  });
});

describe('genericPreviewOf — החלקים האמיתיים על הנתונים', () => {
  const P = (o: Partial<GenPlace> & Pick<GenPlace, 'kind' | 'spec'>): GenPlace => ({ id: 'x', engine: 'x', name: 'מקום', results: { divide: 'r', round: 'r', next: 'r', offset: 'r', merge: 'r', rotate: 'r', escalate: 'r', fuzzy: 'r' }, ...o });
  const db = {
    supporters: [
      { id: 's1', nextDate: '2026-10-20', donations: [{ date: '2026-01-05', amount: 1200 }, { date: '2026-02-05', amount: 1234.5 }, { date: '2026-03-05', amount: 100 }, { date: '2026-05-05', amount: 100 }] },
      { id: 's2', nextDate: '2026-10-16', donations: [{ date: '2026-06-05', amount: 300 }] },
    ],
    courses: [
      { id: 'c1', name: 'ציור ורישום', time: '17:32', start: '2026-09-01', end: '2027-06-30' },
      { id: 'c2', name: 'קרמיקה', time: '16:00', start: '2026-09-01', end: '2027-06-30' },
    ],
    prRequests: [{ id: 'r1', status: 'open', createdAt: '2026-10-14T07:00:00.000Z' }],
  };
  const ctx = { db, nowMs: NOW };

  it('סכום + חלוקה = שורת תשלומים', () => {
    const pv = genericPreviewOf(P({ kind: 'amount', spec: { entity: 'supporters', path: 'donations[].amount', kind: 'amount' } }), 'divide', { parts: 3 }, ctx)!;
    expect(pv.lines[0]).toBe('5 סכומים · הגדול ₪1,234.5');
    expect(pv.lines).toEqual(['5 סכומים · הגדול ₪1,234.5', '₪1,234.5 = ₪413 + 2 × ₪411', '₪300 = 3 × ₪100', '₪100 = ₪34 + 2 × ₪33']);
  });

  it('סכום + עיגול — רק מה שמשתנה; הכול עגול ⇒ null', () => {
    const pl = P({ kind: 'amount', spec: { entity: 'supporters', path: 'donations[].amount', kind: 'amount' } });
    expect(genericPreviewOf(pl, 'round', { step: 1, dir: 'down' }, ctx)!.lines).toEqual(['1 מתוך 5 סכומים משתנים', '₪1,234.5 ← ₪1,234']);
    expect(genericPreviewOf(P({ kind: 'amount', spec: { entity: 'courses', path: 'nope', kind: 'amount' } }), 'round', {}, ctx)).toBeNull();
  });

  it('זמנים + הבא / תזכורת (עכשיו מוזרק)', () => {
    const pl = P({ kind: 'times', spec: { entity: 'supporters', path: 'nextDate', kind: 'times', unit: 'date' } });
    expect(genericPreviewOf(pl, 'next', { count: 2 }, ctx)!.lines).toEqual(['הבא: 16/10 (בעוד 2 ימים)', 'הבא: 20/10 (בעוד 6 ימים)']);
    expect(genericPreviewOf(pl, 'offset', { minutes: -1440 }, ctx)!.lines[0]).toBe('תזכורת 15/10 09:00 · למועד 16/10');
    const clock = P({ kind: 'times', spec: { entity: 'courses', path: 'time', kind: 'times', unit: 'clock' } });
    expect(genericPreviewOf(clock, 'next', {}, ctx)!.lines).toEqual(['הבא היום: 16:00']);
    expect(genericPreviewOf(clock, 'round', { step: 15, dir: 'down' }, ctx)!.lines).toEqual(['17:32 ← 17:30']);
  });

  it('רצף + איחוד = חודשים ברצף', () => {
    const pl = P({ kind: 'sequence', spec: { entity: 'supporters', path: 'donations[]', kind: 'sequence', dateField: 'date' } });
    expect(genericPreviewOf(pl, 'merge', {}, ctx)!.lines).toEqual(['אצל 1 מתוך 2 יש 2 חודשים או יותר ברצף', '3 חודשים ברצף: 1/2026 עד 3/2026']);
  });

  it('טווח + חלוקה', () => {
    const pl = P({ kind: 'span', spec: { entity: 'courses', path: 'start', to: 'end', kind: 'span', unit: 'date' } });
    const pv = genericPreviewOf(pl, 'divide', { parts: 10 }, ctx)!;
    expect(pv.lines[0]).toBe('1/9–30/6 ⇐ 10 חלקים');
    expect(pv.lines[1]).toMatch(/^1\. 1\/9–/);
  });

  it('מחכה + העברה הלאה / בתורות', () => {
    const pl = P({ kind: 'waiting', spec: { entity: 'prRequests', path: '', kind: 'waiting', status: { field: 'status', open: ['open'] }, since: 'createdAt' } });
    expect(genericPreviewOf(pl, 'escalate', { waitMin: 90 }, ctx)!.lines).toEqual(['1 מחכים לתשובה', '1 אצל המנהל', 'המעבר הבא: 14/10 13:00']);
    expect(genericPreviewOf(pl, 'rotate', { by: 'item' }, ctx)!.lines).toEqual(['1 מחכים, בתורות:', 'איש צוות א׳: 1']);
  });

  it('טקסט + טעות-כתיב: echo מראה את המילה; בלי echo — רק מספרים', () => {
    const on = genericPreviewOf(P({ kind: 'text', spec: { entity: 'courses', path: 'name', kind: 'text', echo: true } }), 'fuzzy', {}, ctx)!;
    expect(on.lines[0]).toMatch(/\(עם טעות\) ⇐ נמצאו 1 מתוך 2$/);
    const off = genericPreviewOf(P({ kind: 'text', spec: { entity: 'courses', path: 'name', kind: 'text' } }), 'fuzzy', {}, ctx)!;
    expect(off.lines.join(' ')).not.toMatch(/קרמיקה|רישום|ציור/);
  });

  it('חלק שלא מתאים לסוג / בלי משפט-תוצאה / נתונים פגומים ⇒ null', () => {
    const pl = P({ kind: 'amount', spec: { entity: 'supporters', path: 'donations[].amount', kind: 'amount' } });
    expect(genericPreviewOf(pl, 'merge', {}, ctx)).toBeNull();
    expect(genericPreviewOf({ ...pl, results: {} }, 'divide', {}, ctx)).toBeNull();
    expect(genericPreviewOf(pl, 'divide', {}, { db: null, nowMs: NOW })).toBeNull();
    expect(genericPreviewOf(pl, 'divide', {}, { db, nowMs: NaN })).toBeNull();
    expect(genericPreviewOf(null as never, 'divide', {}, ctx)).toBeNull();
  });

  it('דטרמיניסטי', () => {
    const pl = P({ kind: 'sequence', spec: { entity: 'supporters', path: 'donations[]', kind: 'sequence', dateField: 'date' } });
    expect(genericPreviewOf(pl, 'merge', {}, ctx)).toEqual(genericPreviewOf(pl, 'merge', {}, ctx));
  });
});

describe('words — מילים פשוטות', () => {
  it('המילים האסורות מוחלפות; "ברצף" נשאר', () => {
    expect(plainWords('מיזוג רצפים בטווח')).toBe('איחוד שורות בתקופה');
    expect(plainWords('3 ימים ברצף')).toBe('3 ימים ברצף');
    expect(hasForbidden('3 ימים ברצף')).toBeNull();
    expect(hasForbidden('הסלמה')).toBe('הסלמה');
  });
  it('שם קצר מהערה', () => {
    expect(shortName('הגעות לטיפול היום — כולל **באיחור**.')).toBe('הגעות לטיפול היום');
    expect(shortName('Only English')).toBe('');
  });
});

describe('⚖️ משקל — המפרק לא נטען בהפעלה', () => {
  it('אף קובץ באפליקציה לא מייבא את המפרק או את המנועים שנוצרו (חיבור לארגז = סשן-האינטגרציה, ב-import() עצל)', () => {
    const files = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/lib/atoms/decompose/**', '!/src/lib/atoms/engines/generated/**', '!/src/**/__tests__/**'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const offenders = Object.entries(files)
      .filter(([, src]) => /from ['"][^'"]*(atoms\/decompose|engines\/generated)[^'"]*['"]/.test(src))
      .map(([f]) => f);
    expect(offenders).toEqual([]);
  });
});
