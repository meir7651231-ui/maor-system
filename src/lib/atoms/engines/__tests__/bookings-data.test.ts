/**
 * ratchet — 🛏️ קוראי-המקומות של מנוע ההזמנות (ATOMS-ENGINES, 14.10.2026).
 * ננעל על Db-בדיקה: טווח-ההחלפה מההגדרות · שהיות/עד-ההגעה · יתרות וסכומים · רצף הלילות (כולל יחידה חסומה
 * ויחידת-חדרים) · הגעות · ממתינים + מקבלים · טקסטים. Db ריק/פגום ⇒ ריק, לעולם לא זורק.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, type Db, type HostBooking, type HostRecord, type HostUnit } from '../../../../types/domain';
import { arrivals, balances, guestTexts, nightsOf, stays, totals, turnoverSpan, untilArrival, waiting } from '../bookingsData';

const TODAY = '2026-10-14';
const T = '2026-10-01T09:00:00Z';

const U = (over: Partial<HostUnit>): HostUnit => ({ id: 'u', name: '', type: 'צימר', beds: 2, cap: 4, rate: 500, status: 'free', subRooms: [], createdAt: T, updatedAt: T, ...over });
const B = (over: Partial<HostBooking>): HostBooking => ({
  id: 'b',
  guestId: 'g1',
  unitId: 'u1',
  roomIds: [],
  checkIn: TODAY,
  checkOut: '2026-10-16',
  adults: 2,
  kids: 1,
  status: 'confirmed',
  charges: [],
  payments: [],
  notes: '',
  shabbat: false,
  createdAt: T,
  updatedAt: T,
  ...over,
});
const charge = (amount: number) => [{ id: 'stay', kind: 'stay' as const, label: 'לינה', amount }];
const pay = (amount: number) => [{ id: 'p1', amount, date: TODAY, note: '' }];

function fixture(): Db {
  const db = emptyDb();
  db.hostUnits = [
    U({ id: 'u1', name: 'צימר הגפן' }),
    U({ id: 'u2', name: 'דירת הזית', status: 'blocked' }),
    U({ id: 'u3', name: 'בית הארחה', subRooms: [{ id: 'r1', name: 'חדר הורים', beds: 2, rate: 300 }, { id: 'r2', name: 'חדר ילדים', beds: 3, rate: 200 }] }),
  ];
  db.hostBookings = [
    B({ id: 'b1', unitId: 'u1', checkIn: '2026-10-14', checkOut: '2026-10-16', charges: charge(1000), payments: pay(400) }),
    B({ id: 'b2', unitId: 'u1', guestId: 'g2', checkIn: '2026-10-18', checkOut: '2026-10-19', status: 'pending', charges: charge(500) }),
    B({ id: 'b3', unitId: 'u3', roomIds: ['r1'], checkIn: '2026-10-15', checkOut: '2026-10-17', charges: charge(600), payments: pay(600) }),
    B({ id: 'b4', unitId: 'u1', checkIn: '2026-10-16', checkOut: '2026-10-17', status: 'cancelled', charges: charge(900) }),
    B({ id: 'b5', unitId: 'u1', checkIn: '2026-10-01', checkOut: '2026-10-03', status: 'done', charges: charge(800), payments: pay(500) }),
  ];
  const r = (x: Record<string, unknown>) => ({ createdAt: T, updatedAt: T, ...x }) as unknown as HostRecord;
  db.hostRecords = [
    r({ id: 'g1', kind: 'guest', name: 'משפחת לוי', phone: '', email: '', adults: 2, kids: 1, notes: '' }),
    r({ id: 'g2', kind: 'guest', name: 'משפחת כהן', phone: '', email: '', adults: 2, kids: 0, notes: '' }),
    r({ id: 'c1', kind: 'clean', unitId: 'u1', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-03' }),
    r({ id: 'c2', kind: 'clean', unitId: 'u3', type: 'החלפת מצעים', status: 'open', date: '2026-10-02' }),
    r({ id: 'c3', kind: 'clean', unitId: 'u3', type: 'ניקיון', status: 'done', date: '2026-10-01' }),
    r({ id: 'f1', kind: 'fault', unitId: 'u2', assetId: '', category: 'חשמל', priority: 1, desc: 'קצר בשקע', status: 'open', safety: true, blocked: true, createdAt: '2026-10-10T08:00:00Z' }),
    r({ id: 'f2', kind: 'fault', unitId: 'u1', assetId: '', category: 'אינסטלציה', priority: 3, desc: 'ברז מטפטף', status: 'inprogress', safety: false, blocked: false, createdAt: '2026-10-05T08:00:00Z' }),
    r({ id: 'f3', kind: 'fault', unitId: 'u1', assetId: '', category: 'אחר', priority: 0, desc: 'סגור', status: 'done', safety: false, blocked: false }),
    r({ id: 's1', kind: 'staff', name: 'רחל', role: 'מנקה', phone: '050' }),
    r({ id: 's2', kind: 'staff', name: 'אברהם', role: 'אחראי ניקיון', phone: '052' }),
    r({ id: 's3', kind: 'staff', name: 'יוסי', role: 'טבח', phone: '053' }),
    r({ id: 's4', kind: 'staff', name: 'דוד', role: 'איש תחזוקה', phone: '054' }),
  ];
  return db;
}

describe('טווחים', () => {
  it('חלון-ההחלפה: 11:00–15:00 כברירת-מחדל, ומההגדרות כשיש', () => {
    expect(turnoverSpan(fixture())).toEqual({ from: 660, to: 900, fromHm: '11:00', toHm: '15:00' });
    const db = fixture();
    db.ui = { ...db.ui, hosting: { checkout: '10:30', checkin: '16:00' } };
    expect(turnoverSpan(db)).toEqual({ from: 630, to: 960, fromHm: '10:30', toHm: '16:00' });
    db.ui = { ...db.ui, hosting: { checkout: '16:00', checkin: '14:00' } };
    const inv = turnoverSpan(db);
    expect(inv.to).toBe(inv.from); // הפוך ⇒ ריק, לא ממציאים
  });

  it('שהיות: לא-בוטלה, לא-הושלמה, שעוד לא נגמרו — לפי כניסה', () => {
    expect(stays(fixture(), TODAY)).toEqual([
      { id: 'b1', unitId: 'u1', guestId: 'g1', from: '2026-10-14', to: '2026-10-16', nights: 2, people: 3 },
      { id: 'b3', unitId: 'u3', guestId: 'g1', from: '2026-10-15', to: '2026-10-17', nights: 2, people: 3 },
      { id: 'b2', unitId: 'u1', guestId: 'g2', from: '2026-10-18', to: '2026-10-19', nights: 1, people: 3 },
    ]);
  });

  it('עד-ההגעה: מהיום עד הכניסה, רק להזמנות עתידיות', () => {
    expect(untilArrival(fixture(), TODAY)).toEqual([
      { id: 'b3', from: TODAY, to: '2026-10-15', days: 1 },
      { id: 'b2', from: TODAY, to: '2026-10-18', days: 4 },
    ]);
  });
});

describe('סכומים', () => {
  it('יתרות: רק חוב פתוח, גם אחרי עזיבה, מהגדולה לקטנה; בלי ביטולים', () => {
    expect(balances(fixture())).toEqual([
      { id: 'b1', amount: 600 },
      { id: 'b2', amount: 500 },
      { id: 'b5', amount: 300 },
    ]);
  });

  it('סכומים כוללים: כל הזמנה שלא בוטלה, עם לילות ואנשים', () => {
    const t = totals(fixture());
    expect(t.map((x) => x.id)).toEqual(['b5', 'b1', 'b3', 'b2']);
    expect(t.find((x) => x.id === 'b1')).toEqual({ id: 'b1', amount: 1000, nights: 2, people: 3 });
  });
});

describe('רצף הלילות', () => {
  it('יחידה רגילה: תפוס בלילות ההזמנות הפעילות, ביטול לא תופס', () => {
    expect(nightsOf(fixture(), 'u1', TODAY, 6)).toEqual([
      { iso: '2026-10-14', free: false },
      { iso: '2026-10-15', free: false },
      { iso: '2026-10-16', free: true },
      { iso: '2026-10-17', free: true },
      { iso: '2026-10-18', free: false },
      { iso: '2026-10-19', free: true },
    ]);
  });

  it('יחידה חסומה: אף לילה לא פנוי · יחידת-חדרים: חדר אחד תפוס ⇒ היחידה לא פנויה', () => {
    expect(nightsOf(fixture(), 'u2', TODAY, 3).every((n) => !n.free)).toBe(true);
    expect(nightsOf(fixture(), 'u3', TODAY, 4).map((n) => n.free)).toEqual([true, false, false, true]);
  });

  it('יחידה לא קיימת / תאריך פגום / אורך שלילי ⇒ ריק; אורך מוגבל ל-400', () => {
    expect(nightsOf(fixture(), 'nope', TODAY, 3)).toEqual([]);
    expect(nightsOf(fixture(), 'u1', 'bad', 3)).toEqual([]);
    expect(nightsOf(fixture(), 'u1', TODAY, -2)).toEqual([]);
    expect(nightsOf(fixture(), 'u1', TODAY, 10_000)).toHaveLength(400);
  });
});

describe('הגעות', () => {
  it('רק ממתינה/מאושרת בחלון, לפי תאריך, עם שעת-הכניסה', () => {
    expect(arrivals(fixture(), TODAY, 7)).toEqual([
      { id: 'b1', iso: '2026-10-14', time: '15:00', minute: 900, unitId: 'u1', guestId: 'g1' },
      { id: 'b3', iso: '2026-10-15', time: '15:00', minute: 900, unitId: 'u3', guestId: 'g1' },
      { id: 'b2', iso: '2026-10-18', time: '15:00', minute: 900, unitId: 'u1', guestId: 'g2' },
    ]);
    expect(arrivals(fixture(), TODAY, 4).map((a) => a.id)).toEqual(['b1', 'b3']);
  });
});

describe('ממתינים', () => {
  it('ניקיון: משימות פתוחות לפי ותק + מנקים מהצוות', () => {
    const w = waiting(fixture(), 'cleaning');
    expect(w.items.map((i) => [i.id, i.label, i.since])).toEqual([
      ['c2', 'החלפת מצעים · בית הארחה', '2026-10-02'],
      ['c1', 'ניקיון אחרי עזיבה · צימר הגפן', '2026-10-03'],
    ]);
    expect(w.recipients.map((r) => r.id)).toEqual(['s2', 's1']); // אברהם, רחל
  });

  it('תקלות: פתוחות ובטיפול, הדחופה ראשונה + אנשי תחזוקה', () => {
    const w = waiting(fixture(), 'faults');
    expect(w.items.map((i) => [i.id, i.priority, i.since])).toEqual([
      ['f1', 1, '2026-10-10'],
      ['f2', 3, '2026-10-05'],
    ]);
    expect(w.recipients.map((r) => r.id)).toEqual(['s4']);
  });

  it('יתרות: פריט לכל חוב עם הסכום; אין גובה בצוות ⇒ אין מקבלים (לא ממציאים)', () => {
    const w = waiting(fixture(), 'unpaid');
    expect(w.items.map((i) => [i.id, i.label, i.amount])).toEqual([
      ['b5', 'משפחת לוי · צימר הגפן', 300],
      ['b1', 'משפחת לוי · צימר הגפן', 600],
      ['b2', 'משפחת כהן · צימר הגפן', 500],
    ]);
    expect(w.recipients).toEqual([]);
  });
});

describe('טקסטים', () => {
  it('שמות האורחים ואחריהם היחידות', () => {
    expect(guestTexts(fixture())).toEqual([
      { id: 'g1', text: 'משפחת לוי' },
      { id: 'g2', text: 'משפחת כהן' },
      { id: 'u1', text: 'צימר הגפן' },
      { id: 'u2', text: 'דירת הזית' },
      { id: 'u3', text: 'בית הארחה' },
    ]);
  });
});

describe('Db ריק או פגום', () => {
  const bad = [emptyDb(), null, undefined, {}, { hostBookings: 'x', hostUnits: [null, 3], hostRecords: [{}, null] }] as unknown as Db[];
  it('תוצאות ריקות, לעולם לא זורק', () => {
    for (const db of bad) {
      expect(stays(db, TODAY)).toEqual([]);
      expect(untilArrival(db, TODAY)).toEqual([]);
      expect(balances(db)).toEqual([]);
      expect(totals(db)).toEqual([]);
      expect(nightsOf(db, 'u1', TODAY, 5)).toEqual([]);
      expect(arrivals(db, TODAY, 5)).toEqual([]);
      for (const k of ['cleaning', 'faults', 'unpaid'] as const) expect(waiting(db, k)).toEqual({ items: [], recipients: [] });
      expect(guestTexts(db)).toEqual([]);
      expect(turnoverSpan(db)).toEqual({ from: 660, to: 900, fromHm: '11:00', toHm: '15:00' });
    }
  });
});
