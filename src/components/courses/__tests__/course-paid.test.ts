/**
 * ratchet — 💰 סטטוס-תשלום פר-שיבוץ (17.8). בקשת-בעלים: "בכל חוג אופציה לתשלום
 * ואופציה כבר שולם" + "למה השולם/לא-שולם לא מתעדכן לבד" ⇒ הסטטוס **נגזר-אוטומטית**
 * מהיתרה (payments מול totalDue); `paidFull` = דריסה-ידנית לחוגים בלי סכום-עסקה.
 * אינו נוגע ב-payments[]/totalDue/receiptSeq/קבלות.
 */
import { describe, expect, it } from 'vitest';
import { enrollmentPaidStatus } from '../lib';
import type { Enrollment } from '../../../types/domain';
import domainSrc from '../../../types/domain.ts?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import detailSrc from '../CourseDetail.tsx?raw';

const enr = (o: Partial<Enrollment>): Enrollment => ({ payments: [], totalDue: 0, ...o } as Enrollment);

describe('💰 ratchet — סטטוס-תשלום נגזר-אוטומטית', () => {
  it('נגזר מהיתרה: שולם-מלא ⇒ paid; חלקי ⇒ partial; כלום ⇒ unpaid', () => {
    expect(enrollmentPaidStatus(enr({ totalDue: 100, payments: [{ rid: 'R-1', date: '2026-08-18', amount: 100, method: 'מזומן' }] }))).toBe('paid');
    expect(enrollmentPaidStatus(enr({ totalDue: 100, payments: [{ rid: 'R-1', date: '2026-08-18', amount: 40, method: 'מזומן' }] }))).toBe('partial');
    expect(enrollmentPaidStatus(enr({ totalDue: 100, payments: [] }))).toBe('unpaid');
  });

  it('paidFull = דריסה-ידנית ⇒ paid; בלי totalDue ⇒ unpaid עד סימון', () => {
    expect(enrollmentPaidStatus(enr({ totalDue: 0, paidFull: true }))).toBe('paid');
    expect(enrollmentPaidStatus(enr({ totalDue: 0 }))).toBe('unpaid');
    // עודף-תשלום עדיין 'paid' (יתרה 0)
    expect(enrollmentPaidStatus(enr({ totalDue: 100, payments: [{ rid: 'R-1', date: '2026-08-18', amount: 150, method: 'מזומן' }] }))).toBe('paid');
  });

  it('שדה paidFull + פעולת-store — לא נוגעים בקבלות', () => {
    expect(domainSrc).toMatch(/paidFull\?\s*:\s*boolean/);
    expect(storeSrc).toContain('setEnrollmentPaid(enrollmentId, paid)');
    expect(storeSrc).toMatch(/setEnrollmentPaid\(enrollmentId, paid\)[\s\S]{0,400}paidFull: paid/);
  });

  it('הכרטיס מציג סטטוס נגזר + קליק פותח רישום-תשלום (מתעדכן לבד)', () => {
    expect(detailSrc).toContain('enrollmentPaidStatus(e)');
    expect(detailSrc).toContain('✓ שולם');
    expect(detailSrc).toContain('💰 לתשלום');
    // יש סכום-עסקה ⇒ קליק פותח את מודאל-הניהול (רישום תשלום)
    expect(detailSrc).toMatch(/hasDue \? setModal\(\{ kind: 'manage'/);
  });
});
