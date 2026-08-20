/**
 * ratchet — 💰 מרכז-גבייה (פאזה 5): מנוע-טהור collection.ts (payBal, מיון, סיכום, CSV, נוסח)
 * וחיווט/גידור (CollectionCenter + כפתור-גבייה מגודר courses.collect).
 */
import { describe, expect, it } from 'vitest';
import type { Db, Enrollment, Family } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { collectionCsvRows, collectionList, collectionMessage, collectionTotal } from '../collection';
import centerSrc from '../CollectionCenter.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}
function famOf(id: string, name: string, phone: string, memberId: string, first: string): Family {
  return { id, name, phone, createdAt: '2026-01-01', status: 'active', members: [{ id: memberId, first }] } as unknown as Family;
}

function db(): Db {
  return {
    ...emptyDb(),
    courses: [{ id: 'c1', name: 'ציור' } as Db['courses'][number]],
    families: [famOf('f1', 'כהן', '0501111111', 'm1', 'דנה'), famOf('f2', 'לוי', '0502222222', 'm2', 'רון')],
    enrollments: [
      enr({ id: 'a', memberId: 'm1', courseId: 'c1', totalDue: 300, payments: [{ rid: 'R-1', date: '', amount: 100, method: '' }] }), // חוב 200
      enr({ id: 'b', memberId: 'm2', courseId: 'c1', totalDue: 500 }), // חוב 500
      enr({ id: 'p', memberId: 'm1', courseId: 'c1', totalDue: 100, payments: [{ rid: 'R-2', date: '', amount: 100, method: '' }] }), // 0
      enr({ id: 'w', memberId: 'm2', courseId: 'c1', totalDue: 999, status: 'wait' }), // רשימת-המתנה — לא חייב
    ],
  };
}

describe('💰 מרכז-גבייה — מנוע', () => {
  it('collectionList: חייבים בלבד (payBal>0), מהגבוה, בלי wait/ended, עם שם/טלפון/חוג', () => {
    const rows = collectionList(db());
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']); // 500 לפני 200
    expect(rows[0].name).toBe('רון · לוי');
    expect(rows[0].phone).toBe('0502222222');
    expect(rows[0].courseName).toBe('ציור');
    expect(rows[1].bal).toBe(200);
  });
  it('collectionTotal: סכום כל החוב', () => {
    expect(collectionTotal(collectionList(db()))).toBe(700);
  });
  it('collectionCsvRows: כותרת + שורה-לחייב', () => {
    const csv = collectionCsvRows(collectionList(db()));
    expect(csv[0]).toEqual(['שם', 'חוג', 'טלפון', 'יתרת חוב (₪)']);
    expect(csv.length).toBe(3); // כותרת + 2 חייבים
  });
  it('collectionMessage: תזכורת ידידותית עם סכום ושם-חוג (בלי לשון-קבלה)', () => {
    const r = collectionList(db())[0];
    const msg = collectionMessage(r, 'מאור');
    expect(msg).toContain('מאור');
    expect(msg).toContain('₪500');
    expect(msg).toContain('ציור');
    expect(msg).not.toContain('קבלה');
  });
});

describe('🛡 הגנות-מקור — מרכז-גבייה מחווט ומגודר', () => {
  it('CollectionCenter: WaBtn + payLink + downloadCsv, אפס-נגיעה-בקבלות', () => {
    expect(centerSrc).toContain('collectionList(db)');
    expect(centerSrc).toContain('WaBtn');
    expect(centerSrc).toContain('payLink(payUrl');
    expect(centerSrc).toContain('downloadCsv(');
    expect(centerSrc).toContain('אינם מנפיקים קבלה');
  });
  it('CoursesView: כפתור-גבייה מגודר courses.collect (ולא-מורה)', () => {
    expect(viewSrc).toContain("featureOn(cfg, 'courses.collect') && !myTeacherId");
    expect(viewSrc).toContain('<CollectionCenter onClose');
    expect(viewSrc).toContain('💰 גבייה');
  });
});
