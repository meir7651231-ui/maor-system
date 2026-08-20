/**
 * ratchet — 💚 מרכז-שימור (גל ה׳ · פאזה 11): מנוע-טהור retention.ts (dropoutInsights —
 * ציון-סיכון דטרמיניסטי + סיבה; interventionPrompt) + חיווט/גידור (opt-in courses.ai,
 * lib/ai.ts דורמנטי, אפס-כסף).
 */
import { describe, expect, it } from 'vitest';
import type { Enrollment } from '../../../types/domain';
import { dropoutInsights, interventionPrompt } from '../retention';
import centerSrc from '../RetentionCenter.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', presents: [], ...over,
  };
}
function absN(n: number) {
  return Array.from({ length: n }, (_, i) => ({ date: '2026-08-0' + ((i % 9) + 1), reason: 'x', makeup: false }));
}

describe('💚 מרכז-שימור — מנוע', () => {
  it('dropoutInsights: רק תלמידים-בסיכון (≥3 חיסורים), ממוין מהסיכון-הגבוה', () => {
    const list = [
      enr({ id: 'a', absences: absN(3) }), // סף
      enr({ id: 'b', absences: absN(6) }), // גבוה
      enr({ id: 'c', absences: absN(1) }), // מתחת-לסף — לא-נכלל
      enr({ id: 'd', absences: absN(4), totalDue: 200 }), // עם-חוב ⇒ +10
    ];
    const got = dropoutInsights(list);
    expect(got.map((x) => x.enrollmentId)).toEqual(['b', 'd', 'a']); // 86 > 72 > 50
    expect(got.find((x) => x.enrollmentId === 'a')!.score).toBe(50); // סף: 50+0
    expect(got.find((x) => x.enrollmentId === 'b')!.score).toBe(86); // 50+(6-3)*12
    expect(got.find((x) => x.enrollmentId === 'd')!.score).toBe(72); // 50+(4-3)*12+10
    expect(got.find((x) => x.enrollmentId === 'd')!.reason).toContain('יתרת-חוב');
  });
  it('dropoutInsights: הציון חסום ל-100', () => {
    const got = dropoutInsights([enr({ id: 'x', absences: absN(9), totalDue: 500 })]);
    expect(got[0].score).toBe(100);
  });
  it('interventionPrompt: הודעת-פנייה חמה, בלי-האשמה, בלי-גבייה', () => {
    const p = interventionPrompt({ orgName: 'מאור', childName: 'דנה', courseName: 'ציור', absences: 4 });
    expect(p).toContain('דנה');
    expect(p).toContain('ציור');
    expect(p).toContain('בלי להאשים');
    expect(p).toContain('בלי לגבות');
  });
});

describe('🛡 הגנות-מקור — מרכז-שימור מחווט ומגודר', () => {
  it('RetentionCenter: נגזרת דטרמיניסטית + AI דורמנטי (readAiKey), אפס-כסף', () => {
    expect(centerSrc).toContain('dropoutInsights(db.enrollments)');
    expect(centerSrc).toContain('integrationOn(config, ');
    expect(centerSrc).toContain('askClaude(');
    expect(centerSrc).toContain('readAiKey()');
    expect(centerSrc).not.toContain('payLink');
    expect(centerSrc).not.toContain('addDonation');
  });
  it('CoursesView: מרכז-שימור מגודר opt-in courses.ai (ולא-מורה)', () => {
    expect(viewSrc).toContain("cfg.features?.['courses.ai'] === true && !myTeacherId");
    expect(viewSrc).toContain('<RetentionCenter onClose');
    expect(viewSrc).toContain('💚 שימור');
  });
});
