/**
 * ratchet — ⏳ רשימת-המתנה (פאזה 3): 'wait' אינו תופס מקום (enrollCount), waitlistFor FIFO,
 * וחיווט/גידור (EnrollModal waitlist-mode · CourseDetail מקטע-שיבוץ-מהתור · גידור courses.waitlist).
 * וגם: 'wait' לא מנפח ספירות-רישום/דוחות (הגנת-מקור על הצרכנים).
 */
import { describe, expect, it } from 'vitest';
import type { Enrollment } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { enrollCount, waitlistFor } from '../lib';
import enrollSrc from '../EnrollModal.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';
import sections1Src from '../../reports/sections1.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}

describe('⏳ רשימת-המתנה — מנוע', () => {
  it("enrollCount לא סופר 'wait' (לא תופס מקום) ולא 'ended'", () => {
    const db = { ...emptyDb(), enrollments: [enr({ id: 'a' }), enr({ id: 'b', status: 'wait' }), enr({ id: 'c', status: 'ended' }), enr({ id: 'd', status: 'paused' })] };
    expect(enrollCount(db, 'c1')).toBe(2); // a(active) + d(paused); b=wait, c=ended מוחרגים
  });
  it('waitlistFor: רק wait, FIFO לפי enrolledAt', () => {
    const list = [
      enr({ id: 'w2', status: 'wait', enrolledAt: '2026-08-02' }),
      enr({ id: 'w1', status: 'wait', enrolledAt: '2026-08-01' }),
      enr({ id: 'a' }),
      enr({ id: 'other', courseId: 'c2', status: 'wait' }),
    ];
    expect(waitlistFor(list, 'c1').map((e) => e.id)).toEqual(['w1', 'w2']);
  });
});

describe('🛡 הגנות-מקור — רשימת-המתנה מחווטת ומגודרת', () => {
  it("EnrollModal: waitlist ⇒ status 'wait' + דילוג-בדיקת-קיבולת", () => {
    expect(enrollSrc).toContain("status: props.waitlist ? 'wait' : 'active'");
    expect(enrollSrc).toContain('!props.waitlist && enrollCount');
  });
  it('CourseDetail: מקטע-המתנה + שיבוץ-מהתור (status active) + גידור courses.waitlist', () => {
    expect(detailSrc).toContain("featureOn(cfg, 'courses.waitlist')");
    expect(detailSrc).toContain('waitlistFor(db.enrollments');
    expect(detailSrc).toContain("status: 'active'"); // ▲ שבץ מקדם מהתור
    expect(detailSrc).toContain('⏳ רשימת-המתנה');
  });
  it("דוח-הרישום לא מנפח: 'wait' מוחרג מספירת-הרשומים", () => {
    expect(sections1Src).toContain("e.status !== 'ended' && e.status !== 'wait'");
  });
});
