/**
 * ratchet — שיוך-אוטומטי + תזכורות-שלא-נכנס (בקשת-בעלים 25.8).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';

function sup(id: string, name: string): Supporter {
  return {
    id, name, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
  } as Supporter;
}
function seed(): Db {
  return { ...emptyDb(), donationSeq: 100, supporters: [sup('s1', 'ישראל ישראלי')] };
}
const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🔍 ratchet — שיוך-אוטומטי של תשלומים-נכנסים לחיובים-מתוכננים', () => {
  it('autoMatchPlanned מזהה התאמה + מריץ chargePlanned + מחזיר incomingId', () => {
    const r = useApp.getState().addPlannedCharges('s1', {
      firstDate: '2026-10-01', count: 1, amount: 400, cur: '₪', method: 'credit', cat: 'סליקה',
    });
    expect(r.ok).toBe(true);
    const seq0 = db().donationSeq;
    const incoming = { id: 'inc-1', amount: 400, name: 'ישראל ישראלי', phone: '', reference: '', at: '2026-10-01', status: 'ok' };
    const res = useApp.getState().autoMatchPlanned([incoming]);
    expect(res.matched).toEqual(['inc-1']);
    // D- אמיתי הונפק:
    expect(db().donationSeq).toBe(seq0 + 1);
    const supA = db().supporters.find((s) => s.id === 's1')!;
    expect(supA.donations).toHaveLength(1);
    expect(supA.donations[0].rid).toBe('D-' + seq0);
    // ה-chargedRid מקשר:
    const pl = supA.plannedCharges!.find((p) => p.id === r.ids![0])!;
    expect(pl.chargedRid).toBe('D-' + seq0);
  });

  it('אין-התאמה ⇒ לא מסמן, לא-מקדם seq', () => {
    useApp.getState().addPlannedCharges('s1', {
      firstDate: '2026-10-01', count: 1, amount: 400, cur: '₪', method: 'credit', cat: '',
    });
    const seq0 = db().donationSeq;
    const bad = { id: 'inc-x', amount: 350, name: 'שם אחר', phone: '', reference: '', at: '2026-10-01', status: 'ok' };
    const res = useApp.getState().autoMatchPlanned([bad]);
    expect(res.matched).toEqual([]);
    expect(db().donationSeq).toBe(seq0);
  });

  it('רשימה-ריקה ⇒ no-op (עלות-אפסית)', () => {
    const res = useApp.getState().autoMatchPlanned([]);
    expect(res.matched).toEqual([]);
  });

  it('seedOverduePlannedReminders יוצר אירוע-שיחה לפלנים שעברו-תאריכם', () => {
    const r = useApp.getState().addPlannedCharges('s1', {
      firstDate: '2026-09-15', count: 1, amount: 400, cur: '₪', method: 'credit', cat: '',
    });
    const eventsBefore = db().events.length;
    const res = useApp.getState().seedOverduePlannedReminders('2026-10-01');
    expect(res.seeded).toBe(1);
    expect(db().events.length).toBe(eventsBefore + 1);
    const ev = db().events[db().events.length - 1];
    expect(ev.type).toBe('call');
    expect(ev.title).toContain('התקשרי ל-ישראל ישראלי');
    expect(ev.spId).toBe(r.ids![0]);
  });

  it('seedOverduePlannedReminders אידמפוטנטי — spId מונע-כפילות', () => {
    useApp.getState().addPlannedCharges('s1', {
      firstDate: '2026-09-15', count: 1, amount: 400, cur: '₪', method: 'credit', cat: '',
    });
    const first = useApp.getState().seedOverduePlannedReminders('2026-10-01');
    expect(first.seeded).toBe(1);
    // ריצה שנייה — אין-חדשים
    const second = useApp.getState().seedOverduePlannedReminders('2026-10-01');
    expect(second.seeded).toBe(0);
  });

  it('פלן שעדיין לא-בפיגור לא-מקבל תזכורת', () => {
    useApp.getState().addPlannedCharges('s1', {
      firstDate: '2026-10-15', count: 1, amount: 400, cur: '₪', method: 'credit', cat: '',
    });
    const res = useApp.getState().seedOverduePlannedReminders('2026-10-01');
    expect(res.seeded).toBe(0);
  });
});
