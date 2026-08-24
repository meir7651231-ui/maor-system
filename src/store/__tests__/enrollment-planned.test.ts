/**
 * ratchet — חיובים-מתוכננים על שיבוץ-חוגים (בקשת-בעלים 25.8).
 * זהה במושג ל-planned-charges של תומכים; ההבדל: R- (לא D-) דרך addPayment.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Course, Db, Enrollment } from '../../types/domain';

function mkCourse(): Course {
  return {
    id: 'c1', name: 'התעמלות', teacherId: 't1', roomId: 'r1', description: '',
    price: 200, price1: 0, price2: 0, price1Name: '', price2Name: '',
    model: 'monthly', size: 0, start: '2025-09-01', end: '2026-07-31',
    weekday: 0, time: '16:00', maxStudents: 20, gender: 'all', ageMin: 0, ageMax: 0,
    cat: '', semester: 'שנתי', sector: '', sessions: [], notes: '',
  } as Course;
}
function mkEnroll(): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly',
    purchased: 0, used: 0, group: '', absences: [], payments: [],
    totalDue: 1200, dueDate: '', status: 'active', note: '', enrolledAt: '2026-09-01',
  } as Enrollment;
}
function seed(): Db {
  return {
    ...emptyDb(),
    receiptSeq: 10,
    families: [{ id: 'f1', name: 'לוי', members: [{ id: 'm1', first: 'נועה' }] }] as never,
    courses: [mkCourse()],
    enrollments: [mkEnroll()],
  };
}
const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('📅 ratchet — חיובים-מתוכננים על שיבוץ (store)', () => {
  it('addEnrollmentPlanned יוצר 3 שורות בפערי-חודש עם groupId משותף', () => {
    const r = useApp.getState().addEnrollmentPlanned('e1', {
      firstDate: '2026-10-01', count: 3, amount: 400, cur: '₪', method: 'אשראי',
    });
    expect(r.ok).toBe(true);
    expect(r.ids).toHaveLength(3);
    const en = db().enrollments.find((e) => e.id === 'e1')!;
    expect(en.plannedCharges).toHaveLength(3);
    expect(en.plannedCharges!.map((p) => p.date)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
    const groups = new Set(en.plannedCharges!.map((p) => p.installmentOf));
    expect(groups.size).toBe(1);
    // כולם פתוחים · לא-R-:
    expect(en.plannedCharges!.every((p) => !p.chargedRid && !p.cancelledAt)).toBe(true);
    // receiptSeq **לא** התקדם — הפלנים לא-קבלות:
    expect(db().receiptSeq).toBe(10);
  });

  it('addEnrollmentPlanned על שיבוץ לא-קיים ⇒ נכשל בשקט (receiptSeq יציב)', () => {
    const seqBefore = db().receiptSeq;
    const r = useApp.getState().addEnrollmentPlanned('ghost', {
      firstDate: '2026-10-01', count: 1, amount: 100, cur: '₪', method: 'אשראי',
    });
    expect(r.ok).toBe(false);
    expect(db().receiptSeq).toBe(seqBefore);
  });

  it('cancelEnrollmentPlanned מסמן cancelledAt, no-op על כבר-בוטל', () => {
    const r = useApp.getState().addEnrollmentPlanned('e1', {
      firstDate: '2026-10-01', count: 2, amount: 100, cur: '₪', method: 'אשראי',
    });
    const pid = r.ids![0];
    const c1 = useApp.getState().cancelEnrollmentPlanned('e1', pid, '2026-09-20');
    expect(c1.ok).toBe(true);
    const pl = db().enrollments.find((e) => e.id === 'e1')!.plannedCharges!.find((p) => p.id === pid)!;
    expect(pl.cancelledAt).toBe('2026-09-20');
    // ריצה חוזרת — no-op:
    const c2 = useApp.getState().cancelEnrollmentPlanned('e1', pid, '2026-09-21');
    expect(c2.ok).toBe(false);
  });

  it('chargeEnrollmentPlanned יוצר R- אמיתי, מקשר chargedRid, אידמפוטנטי', () => {
    const r = useApp.getState().addEnrollmentPlanned('e1', {
      firstDate: '2026-10-01', count: 1, amount: 400, cur: '₪', method: 'אשראי',
    });
    const pid = r.ids![0];
    const seq0 = db().receiptSeq;
    const ch = useApp.getState().chargeEnrollmentPlanned('e1', pid);
    expect(ch.ok).toBe(true);
    expect(ch.rid).toBe('R-' + seq0);
    expect(db().receiptSeq).toBe(seq0 + 1);
    // ה-Payment נוסף על-השיבוץ:
    const en = db().enrollments.find((e) => e.id === 'e1')!;
    expect(en.payments).toHaveLength(1);
    expect(en.payments[0].rid).toBe('R-' + seq0);
    expect(en.payments[0].amount).toBe(400);
    expect(en.payments[0].method).toBe('אשראי');
    // chargedRid מקשר את הפלן ל-R-:
    const pl = en.plannedCharges!.find((p) => p.id === pid)!;
    expect(pl.chargedRid).toBe('R-' + seq0);
    // ריצה חוזרת ⇒ אידמפוטנטית (אותו rid, לא-מקדם seq):
    const ch2 = useApp.getState().chargeEnrollmentPlanned('e1', pid);
    expect(ch2.rid).toBe('R-' + seq0);
    expect(db().receiptSeq).toBe(seq0 + 1);
    expect(en.payments).toHaveLength(1);
  });

  it('chargeEnrollmentPlanned על פלן שבוטל ⇒ נכשל (receiptSeq יציב)', () => {
    const r = useApp.getState().addEnrollmentPlanned('e1', {
      firstDate: '2026-10-01', count: 1, amount: 100, cur: '₪', method: 'אשראי',
    });
    useApp.getState().cancelEnrollmentPlanned('e1', r.ids![0], '2026-09-20');
    const seqBefore = db().receiptSeq;
    const ch = useApp.getState().chargeEnrollmentPlanned('e1', r.ids![0]);
    expect(ch.ok).toBe(false);
    expect(db().receiptSeq).toBe(seqBefore);
  });

  it('ManageModal.addPay: אשראי + דגל דלוק ⇒ מסלול-חיוב-מתוכנן (הגנת-מקור)', async () => {
    const src = await import('../../components/courses/ManageModal.tsx?raw').then((m) => (m as { default: string }).default);
    expect(src).toMatch(/plannedOn && method === 'אשראי'/);
    expect(src).toContain('addEnrollmentPlanned(en.id,');
    expect(src).toContain('firstDate: date, count: 1');
    expect(src).toContain('ממתין לחיוב-נכנס');
  });
});
