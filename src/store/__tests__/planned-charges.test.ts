/**
 * ratchet — חיובים-מתוכננים בתומכים (store · בקשת-בעלים 25.8).
 * מקבע את הזרימה מקצה-לקצה: יצירה → סנכרון-בלוקים → chargePlanned = D-.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';

function sup(id: string): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
  } as Supporter;
}
function seed(): Db {
  return { ...emptyDb(), donationSeq: 5, supporters: [sup('a')] };
}
const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
  // מרוץ מונים דטרמיניסטי: nextId מזין רצפים ⇒ pc/pcg ידועים.
});

describe('📅 ratchet — חיובים-מתוכננים בתומכים (store)', () => {
  it('addPlannedCharges יוצר N שורות עם groupId משותף ותאריכים חודשיים', () => {
    const r = useApp.getState().addPlannedCharges('a', {
      firstDate: '2026-10-01', count: 3, amount: 400, cur: '₪', method: 'credit', cat: 'סליקה',
    });
    expect(r.ok).toBe(true);
    expect(r.ids).toHaveLength(3);
    const supA = db().supporters.find((s) => s.id === 'a')!;
    expect(supA.plannedCharges).toHaveLength(3);
    // כולם באותה קבוצה:
    const groups = new Set(supA.plannedCharges!.map((p) => p.installmentOf));
    expect(groups.size).toBe(1);
    // תאריכים רצופים:
    expect(supA.plannedCharges!.map((p) => p.date)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
    // כולם ממתינים:
    expect(supA.plannedCharges!.every((p) => !p.chargedRid && !p.cancelledAt)).toBe(true);
  });

  it('addPlannedCharges על תומכ/ת לא-קיים ⇒ נכשל בשקט (לא-מקדם seq)', () => {
    const seqBefore = db().donationSeq;
    const r = useApp.getState().addPlannedCharges('ghost', {
      firstDate: '2026-10-01', count: 1, amount: 100, cur: '₪', method: 'credit', cat: '',
    });
    expect(r.ok).toBe(false);
    expect(db().donationSeq).toBe(seqBefore);
  });

  it('cancelPlannedCharge מסמן cancelledAt, לא-מוחק', () => {
    const r = useApp.getState().addPlannedCharges('a', {
      firstDate: '2026-10-01', count: 2, amount: 100, cur: '₪', method: 'credit', cat: '',
    });
    const pid = r.ids![0];
    const c = useApp.getState().cancelPlannedCharge('a', pid, '2026-09-20');
    expect(c.ok).toBe(true);
    const pl = db().supporters.find((s) => s.id === 'a')!.plannedCharges!.find((p) => p.id === pid)!;
    expect(pl.cancelledAt).toBe('2026-09-20');
    // ריצה שנייה על אותו-פלן ⇒ no-op (כבר בוטל)
    const c2 = useApp.getState().cancelPlannedCharge('a', pid, '2026-09-21');
    expect(c2.ok).toBe(false);
  });

  it('chargePlanned יוצר D- אמיתי (donationSeq מתקדם), מקשר chargedRid, אידמפוטנטי', () => {
    // מייל-על ⇒ עובר את שער canIssueReceipt (במקומי cloudRoot=undefined ⇒ פתוח).
    const r = useApp.getState().addPlannedCharges('a', {
      firstDate: '2026-10-01', count: 1, amount: 400, cur: '₪', method: 'credit', cat: 'סליקה',
    });
    const pid = r.ids![0];
    const seq0 = db().donationSeq;
    const ch = useApp.getState().chargePlanned('a', pid);
    expect(ch.ok).toBe(true);
    expect(ch.rid).toBe('D-' + seq0);
    // מונה עלה בדיוק ב-1:
    expect(db().donationSeq).toBe(seq0 + 1);
    // התרומה נוספה לתומכ/ת:
    const supA = db().supporters.find((s) => s.id === 'a')!;
    expect(supA.donations).toHaveLength(1);
    expect(supA.donations[0].rid).toBe('D-' + seq0);
    expect(supA.donations[0].amount).toBe(400);
    expect(supA.donations[0].cat).toBe('סליקה');
    // chargedRid מקשר את הפלן לקבלה:
    const pl = supA.plannedCharges!.find((p) => p.id === pid)!;
    expect(pl.chargedRid).toBe('D-' + seq0);
    // ריצה חוזרת ⇒ אידמפוטנטית (מחזירה אותו rid, לא-מקדמת seq שוב)
    const ch2 = useApp.getState().chargePlanned('a', pid);
    expect(ch2.rid).toBe('D-' + seq0);
    expect(db().donationSeq).toBe(seq0 + 1);
    expect(supA.donations).toHaveLength(1);
  });

  it('chargePlanned על פלן שבוטל ⇒ נכשל (לא-מחייבים חיוב-שבוטל)', () => {
    const r = useApp.getState().addPlannedCharges('a', {
      firstDate: '2026-10-01', count: 1, amount: 100, cur: '₪', method: 'credit', cat: '',
    });
    useApp.getState().cancelPlannedCharge('a', r.ids![0], '2026-09-20');
    const ch = useApp.getState().chargePlanned('a', r.ids![0]);
    expect(ch.ok).toBe(false);
    // המונה לא זז:
    expect(db().supporters.find((s) => s.id === 'a')!.donations).toHaveLength(0);
  });

  it('DonationModal בורר-אמצעי (בקשת-בעלים 25.8): הגנת-מקור', async () => {
    // המקור של DonationModal מנתב "אשראי" ל-PlannedCharge בלבד — אין ניחוש
    // D-, אין מסמך-קבלה, אין מייל. חסימת-רגרסיה: אם מישהו יסיר את הבלוק,
    // ראצ'ט זה ייכשל ⇒ המשתמשת לא תגלה שוב שאשראי הפיק D- טרם-אישור.
    const src = await import('../../components/supporters/DonationModal.tsx?raw').then((m) => (m as { default: string }).default);
    expect(src).toMatch(/plannedOn && method === 'credit'/);
    expect(src).toContain('addPlannedCharges(');
    expect(src).toContain("firstDate: date, count: 1");
    expect(src).toContain("method: 'credit'");
    expect(src).toContain('ממתין לחיוב-נכנס');
    // בורר-האמצעי מגודר plannedOn:
    expect(src).toMatch(/\{plannedOn && \(\s*<Field label="אמצעי">/);
  });
});
