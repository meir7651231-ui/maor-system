/**
 * ratchet — 💰 סטטוס-תשלום פר-שיבוץ (17.8, בקשת-בעלים "בכל חוג אופציה לתשלום
 * ואופציה כבר שולם"). תוספתי: `Enrollment.paidFull` + בורר בכרטיס-החוג;
 * **אינו נוגע** ב-payments[]/totalDue/קבלות (סטטוס-משרד בלבד).
 */
import { describe, expect, it } from 'vitest';
import domainSrc from '../../../types/domain.ts?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import detailSrc from '../CourseDetail.tsx?raw';

describe('💰 ratchet — סטטוס-תשלום פר-שיבוץ', () => {
  it('שדה paidFull על Enrollment — תוספתי (אופציונלי, בלי מיגרציה)', () => {
    expect(domainSrc).toMatch(/paidFull\?\s*:\s*boolean/);
  });

  it('פעולת-store setEnrollmentPaid — לא נוגעת בקבלות', () => {
    expect(storeSrc).toContain('setEnrollmentPaid(enrollmentId, paid)');
    // עוגן על המימוש (חתימה בלי נקודתיים), לא על הצהרת-הטיפוס
    expect(storeSrc).toMatch(/setEnrollmentPaid\(enrollmentId, paid\)[\s\S]{0,400}paidFull: paid/);
    // הגנה: הפעולה נוגעת רק ב-enrollments (לא receiptSeq/payments)
    expect(storeSrc).toMatch(/setEnrollmentPaid\(enrollmentId, paid\)[\s\S]{0,400}enrollments: db\.enrollments\.map/);
  });

  it('בורר "לתשלום / שולם" בכרטיס-החוג', () => {
    expect(detailSrc).toContain('setEnrollmentPaid(e.id, !e.paidFull)');
    expect(detailSrc).toContain('✓ שולם');
    expect(detailSrc).toContain('💰 לתשלום');
  });
});
