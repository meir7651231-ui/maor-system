/**
 * ratchet — שיוך תשלומים-נכנסים לחיובים-מתוכננים (מנוע-טהור).
 */
import { describe, expect, it } from 'vitest';
import type { Db, PlannedCharge, Supporter } from '../../types/domain';
import type { IncomingPayment } from '../cloud';
import { findAllOpenPlans, matchAll, matchIncomingToPlanned, nameMatches } from '../plannedMatch';

function pc(over: Partial<PlannedCharge> = {}): PlannedCharge {
  return { id: 'p1', date: '2026-10-01', amount: 400, cur: '₪', method: 'credit', cat: '', ...over };
}
function sup(id: string, name: string, plans: PlannedCharge[] = []): Supporter {
  return {
    id, name, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    plannedCharges: plans,
  } as Supporter;
}
function inc(over: Partial<IncomingPayment> = {}): IncomingPayment {
  return { id: 'i1', amount: 400, name: 'ישראל ישראלי', phone: '', reference: '', at: '2026-10-01', status: 'ok', ...over };
}

describe('🔍 ratchet — שיוך תשלומים-נכנסים לחיובים-מתוכננים', () => {
  it('nameMatches: חפיפה של-לפחות 2 מילים', () => {
    expect(nameMatches('ישראל ישראלי', 'ישראל ישראלי')).toBe(true);
    expect(nameMatches('ישראל ישראלי', 'ישראל בן ישראלי')).toBe(true);   // 2 מילים חופפות
    expect(nameMatches('ישראל', 'ישראל')).toBe(true);                     // שם-יחיד = דורש 1
    expect(nameMatches('ישראל ישראלי', 'משה משה')).toBe(false);           // אין חפיפה
    expect(nameMatches('ישראל ישראלי', 'ישראל')).toBe(false);             // רק מילה-אחת חופפת
    expect(nameMatches('', 'ישראל')).toBe(false);                         // ריק
  });

  it('matchIncomingToPlanned: התאמת סכום+שם+תאריך-קרוב', () => {
    const db = { supporters: [sup('s1', 'ישראל ישראלי', [pc({ id: 'p1', amount: 400, date: '2026-10-01' })])], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    const open = findAllOpenPlans(db);
    const m = matchIncomingToPlanned(inc(), open);
    expect(m).not.toBeNull();
    expect(m!.plan.id).toBe('p1');
    expect(m!.entityType).toBe('supporter');
    expect(m!.confidence).toBe(100);
  });

  it('סכום שונה ⇒ לא-שיוך', () => {
    const db = { supporters: [sup('s1', 'ישראל ישראלי', [pc({ amount: 400 })])], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    expect(matchIncomingToPlanned(inc({ amount: 350 }), findAllOpenPlans(db))).toBeNull();
  });

  it('תאריך רחוק מ-3 ימים ⇒ לא-שיוך', () => {
    const db = { supporters: [sup('s1', 'ישראל ישראלי', [pc({ amount: 400, date: '2026-10-01' })])], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    expect(matchIncomingToPlanned(inc({ at: '2026-10-06' }), findAllOpenPlans(db))).toBeNull();
    // בטווח (3 ימים בדיוק) ⇒ עדיין שיוך:
    expect(matchIncomingToPlanned(inc({ at: '2026-10-04' }), findAllOpenPlans(db))).not.toBeNull();
  });

  it('שני מועמדים באותה איכות ⇒ אמביגואי ⇒ null (הכפתור-הידני יבחר)', () => {
    const db = { supporters: [
      sup('s1', 'ישראל ישראלי', [pc({ id: 'pa', amount: 400 })]),
      sup('s2', 'ישראל ישראלי', [pc({ id: 'pb', amount: 400 })]),
    ], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    expect(matchIncomingToPlanned(inc(), findAllOpenPlans(db))).toBeNull();
  });

  it('פלן חויב או בוטל ⇒ לא-נכלל ב-open', () => {
    const db = { supporters: [
      sup('s1', 'ישראל ישראלי', [
        pc({ id: 'done', amount: 400, chargedRid: 'D-9' }),
        pc({ id: 'cancelled', amount: 400, cancelledAt: '2026-09-30' }),
        pc({ id: 'open', amount: 400 }),
      ]),
    ], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    const open = findAllOpenPlans(db);
    expect(open.map((r) => r.plan.id)).toEqual(['open']);
  });

  it('matchAll: פלן שכבר-נבחר לתשלום-אחד לא-חוזר לתשלום-הבא (מונע כפילות)', () => {
    const db = { supporters: [sup('s1', 'ישראל ישראלי', [pc({ id: 'p1', amount: 400 })])], enrollments: [], shopAssignments: [], families: [] } as unknown as Db;
    const open = findAllOpenPlans(db);
    const incomings = [inc({ id: 'i1' }), inc({ id: 'i2' })];
    const matches = matchAll(incomings, open);
    // רק תשלום-אחד ישוייך — הפלן נתפס בפעם-הראשונה
    expect(matches).toHaveLength(1);
    expect(matches[0].incomingId).toBe('i1');
  });

  it('findAllOpenPlans: אוסף חוצה-ישויות (תומכים · שיבוץ · חנות)', () => {
    const en = { id: 'e1', memberId: 'm1', plannedCharges: [pc({ id: 'pe' })] } as never;
    const sh = { id: 'a1', famId: 'f1', plannedCharges: [pc({ id: 'ps' })] } as never;
    const fam = { id: 'f1', name: 'לוי', members: [{ id: 'm1', first: 'נועה' }] } as never;
    const db = {
      supporters: [sup('s1', 'ישראל', [pc({ id: 'pt' })])],
      enrollments: [en],
      shopAssignments: [sh],
      families: [fam],
    } as unknown as Db;
    const open = findAllOpenPlans(db);
    expect(open.map((r) => r.entityType).sort()).toEqual(['enrollment', 'shopAssignment', 'supporter']);
  });
});
