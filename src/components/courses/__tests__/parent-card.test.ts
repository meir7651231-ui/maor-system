/**
 * ratchet — 👪 כרטיס-הורה (גל ה׳ · פאזה 10): מנוע-טהור parent.ts (סיכום פר-ילד:
 * נוכחות%/יתרה/מפגש-קרוב/השלמות + נוסח-שיתוף) + חיווט/גידור (opt-in courses.parentcard,
 * כרטיס-המשפחה, אפס-כסף).
 */
import { describe, expect, it } from 'vitest';
import type { Course, Db, Enrollment } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { parentCard, parentCardText } from '../parent';
import cardSrc from '../ParentCard.tsx?raw';
import panelSrc from '../../families/FamilyPanels.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', presents: [], ...over,
  };
}

function db(): Db {
  return {
    ...emptyDb(),
    courses: [
      { id: 'c1', name: 'ציור', teacherId: 't1', weekday: 3, time: '17:00', model: 'monthly', sessions: [], start: '', end: '' } as unknown as Course,
      { id: 'c2', name: 'גיטרה', teacherId: 't1', weekday: 1, time: '18:00', model: 'punch', sessions: [], start: '', end: '' } as unknown as Course,
    ],
    families: [{ id: 'f1', name: 'כהן', phone: '0501234567', createdAt: '', status: 'active', members: [{ id: 'm1', first: 'דנה' }] } as never],
    enrollments: [
      enr({ id: 'a', memberId: 'm1', courseId: 'c1', presents: ['2026-08-05', '2026-08-12', '2026-08-19'], absences: [{ date: '2026-08-26', reason: 'מחלה', makeup: true }], totalDue: 300, payments: [{ rid: 'R-1', date: '', amount: 100, method: '' }] }),
      enr({ id: 'b', memberId: 'm1', courseId: 'c2', presents: [], absences: [] }),
      enr({ id: 'z', memberId: 'm1', courseId: 'c1', status: 'ended' }), // הסתיים — מוחרג
    ],
  };
}

describe('👪 כרטיס-הורה — מנוע', () => {
  const NOW = new Date(2026, 7, 20, 12, 0, 0); // 20.8.2026 (יום ה׳), מוזרק

  it('parentCard: סיכום החוגים-הפעילים בלבד, עם נוכחות%/יתרה/מפגש-קרוב', () => {
    const card = parentCard(db(), 'm1', NOW);
    expect(card.childName).toBe('דנה');
    expect(card.familyName).toBe('כהן');
    expect(card.courses.map((l) => l.courseId)).toEqual(['c1', 'c2']); // z=ended מוחרג
    const painting = card.courses.find((l) => l.courseId === 'c1')!;
    expect(painting.present).toBe(3);
    expect(painting.absences).toBe(1);
    expect(painting.attendancePct).toBe(75); // 3/(3+1)
    expect(painting.balance).toBe(200); // 300-100
    expect(painting.nextSession).toBe('2026-08-26'); // יום ד׳ הקרוב (weekday 3)
  });

  it('parentCard: אחוז-נוכחות null כשאין רישום; סה"כ-יתרה', () => {
    const card = parentCard(db(), 'm1', NOW);
    const guitar = card.courses.find((l) => l.courseId === 'c2')!;
    expect(guitar.attendancePct).toBeNull();
    expect(card.totalBalance).toBe(200);
    expect(card.makeups.length).toBe(1); // החיסור-הזכאי של c1
  });

  it('parentCardText: נוסח-שיתוף עם שם/נוכחות/יתרה, בלי לשון-קבלה', () => {
    const txt = parentCardText(parentCard(db(), 'm1', NOW), 'מאור');
    expect(txt).toContain('מאור');
    expect(txt).toContain('דנה');
    expect(txt).toContain('ציור');
    expect(txt).toContain('75%');
    expect(txt).toContain('₪200');
    expect(txt).not.toContain('קבלה');
  });
});

describe('🛡 הגנות-מקור — כרטיס-הורה מחווט ומגודר', () => {
  it('ParentCard: read-only שיתוף (WaBtn+העתקה+הדפסה), אפס-כסף', () => {
    expect(cardSrc).toContain('parentCard(db, props.memberId)');
    expect(cardSrc).toContain('WaBtn');
    expect(cardSrc).toContain('אינו מנפיק קבלה');
    expect(cardSrc).not.toContain('payLink');
    expect(cardSrc).not.toContain('addDonation');
  });
  it('FamilyPanels: כרטיס-הורה מגודר opt-in courses.parentcard', () => {
    expect(panelSrc).toContain("config.features?.['courses.parentcard'] === true");
    expect(panelSrc).toContain('<ParentCard memberId={parentFor}');
    expect(panelSrc).toContain('setParentFor(e.memberId)');
  });
});
