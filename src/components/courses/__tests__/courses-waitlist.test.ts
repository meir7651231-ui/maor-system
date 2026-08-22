/**
 * ratchet — ⏳ רשימת-המתנה (פאזה 3): 'wait' אינו תופס מקום (enrollCount), waitlistFor FIFO,
 * וחיווט/גידור (EnrollModal waitlist-mode · CourseDetail מקטע-שיבוץ-מהתור · גידור courses.waitlist).
 * וגם: 'wait' לא מנפח ספירות-רישום/דוחות (הגנת-מקור על הצרכנים).
 */
import { describe, expect, it } from 'vitest';
import type { Enrollment } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { enrollCount, enrollStatusMeta, waitlistFor } from '../lib';
import enrollSrc from '../EnrollModal.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';
import sections1Src from '../../reports/sections1.tsx?raw';
import manageSrc from '../ManageModal.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';
import famPanelsSrc from '../../families/FamilyPanels.tsx?raw';
import attnPanelSrc from '../../diary/AttendancePanel.tsx?raw';

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

describe("🛡 ratchet — האינווריאנט של רשימת-ההמתנה: 'wait' לא תופס מקום, לא חייב, לא משתתף", () => {
  it("ManageModal: '⏸ הקפאה' חסומה ל-'wait' — הקפאה הפכה ממתין/ה ל-paused (קידום-שקט מעבר לקיבולת בלי דרך-חזרה)", () => {
    expect(manageSrc).toContain("if (en.status === 'wait')");
    expect(manageSrc).toContain('קדמו לפעיל קודם');
  });
  it("CoursesView: מונה-הרשימה מדלג גם על 'wait' — המונה היחיד בריפו שספר המתנה והציג \"11/10\" אדום מול 8/10 בכרטיס", () => {
    expect(viewSrc).toContain("if (e.status === 'ended' || e.status === 'wait') continue;");
  });
  it("CourseDetail: מיפוי-קבוצות בהסרת-מפגש חל גם על שיבוצי-'wait' — אחרת ממתין/ה שומר/ת תווית-קבוצה שלא קיימת ונוחת/ת מוטעה בקידום", () => {
    expect(detailSrc).toContain("const waitOfCourse = db.enrollments.filter((e) => e.courseId === c.id && e.status === 'wait')");
    expect(detailSrc).toContain('[...enrolled, ...waitOfCourse]');
  });
  it("ניקוב חסום ל-'wait' בשלושת המשטחים (כרטיס-משפחה / כרטיס-חוג / יומן) — ניקוב-בתשלום נשרף בלי ששום דוח יציג אותו", () => {
    for (const src of [famPanelsSrc, detailSrc, attnPanelSrc]) {
      expect(src).toContain("e.status === 'wait'");
      expect(src).toContain('עדיין לא משתתפ/ת');
    }
  });
  it("enrollStatusMeta: 'wait' מקבל צ'יפ משלו — קודם נפל ל'פעיל' והטעה בכרטיס ⚙ ניהול-שיבוץ", () => {
    const wait = { status: 'wait' } as Enrollment;
    expect(enrollStatusMeta(wait).label).toContain('רשימת-המתנה');
  });
});
