/**
 * מספור קבלות רציף — קבלות חוגים (R-) ותרומות (D-) חייבות מספור עוקב ללא
 * חורים, כנדרש לקבלות מס בישראל. עד לתיקון הזה שתיהן שאבו מ-seq המשותף לכל
 * הישויות, כך שכל יצירת משפחה/אירוע "בלעה" מספר קבלה והשאירה פערים.
 * נבדק: רציפות, אי-תלות בין הסדרות, יציבות מול יצירת ישויות, והזרעת מיגרציה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate } from '../persist';
import { emptyDb } from '../../types/domain';
import type { Course, Db, Enrollment, Supporter } from '../../types/domain';

function seed(): Db {
  const course: Course = {
    id: 'c1', name: 'ציור', teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי',
    model: 'monthly', size: 0, price: 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    maxStudents: 20, ageMin: 0, ageMax: 99, gender: 'all', weekday: 1, time: '16:00',
    start: '2024-01-01', end: '2027-01-01', sessions: [], img: '', active: true, notes: '',
    description: '', sector: '',
  } as Course;
  const enr: Enrollment = {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2024-02-01',
  };
  const sup: Supporter = {
    id: 'sp1', name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: 'תורם פרטי',
    forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
  } as Supporter;
  return {
    ...emptyDb(),
    courses: [course],
    enrollments: [enr],
    supporters: [sup],
  };
}

const db = () => useApp.getState().db;
const pay = (n: number) => ({ date: '2026-07-0' + n, amount: 100, method: 'מזומן' });
const don = (n: number) => ({ date: '2026-07-0' + n, amount: 500, cur: '₪' as const, cat: 'כללי' });
const rids = () => db().enrollments[0].payments.map((p) => p.rid);
const dids = () => db().supporters[0].donations.map((d) => d.rid);

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🧾 מספור קבלות רציף וללא חורים', () => {
  it('R- עוקב: R-1, R-2, R-3 — גם כשנוצרות ישויות בין תשלום לתשלום', () => {
    const s = useApp.getState();
    s.addPayment('e1', pay(1));
    s.nextId('ev'); // יצירת ישות כלשהי — מקדמת את seq, אסור שתשפיע על מספר הקבלה
    s.nextId('f');
    s.addPayment('e1', pay(2));
    s.upsertEvent({
      id: s.nextId('ev'), title: 'x', date: '2026-07-05', time: '', type: 'org',
      customType: '', notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false,
    });
    s.addPayment('e1', pay(3));
    // הקבלות נשמרות בראש הרשימה (unshift) → סדר הפוך
    expect(rids()).toEqual(['R-3', 'R-2', 'R-1']);
  });

  it('D- עוקב ובלתי-תלוי ב-R- ובמונה הישויות', () => {
    const s = useApp.getState();
    s.addPayment('e1', pay(1)); // R-1
    s.addDonation('sp1', don(1)); // D-1 — לא D-2
    s.addPayment('e1', pay(2)); // R-2
    s.addDonation('sp1', don(2)); // D-2
    expect(rids()).toEqual(['R-2', 'R-1']);
    expect(dids()).toEqual(['D-2', 'D-1']);
  });

  it('המונים נפרדים מ-seq הכללי — seq עולה אך מספרי הקבלות לא מדלגים', () => {
    const s = useApp.getState();
    for (let i = 0; i < 5; i++) s.nextId('m'); // מקפיץ את seq ב-5
    s.addPayment('e1', pay(1));
    s.addDonation('sp1', don(1));
    expect(rids()).toEqual(['R-1']);
    expect(dids()).toEqual(['D-1']);
  });
});

describe('🧾 מיגרציה — הזרעת המונים מעל קבלות קיימות (בלי התנגשות)', () => {
  it('DB ישן עם R-40/D-12 → הקבלה הבאה R-41 / D-13', () => {
    const old = {
      ...seed(),
      v: 3,
      receiptSeq: undefined,
      donationSeq: undefined,
      enrollments: [{ ...seed().enrollments[0], payments: [{ rid: 'R-40', date: '2025-01-01', amount: 100, method: 'מזומן' }] }],
      supporters: [{ ...seed().supporters[0], donations: [{ rid: 'D-12', date: '2025-01-01', amount: 500, cur: '₪', cat: 'כללי' }] }],
    } as unknown;
    const m = migrate(old)!;
    expect(m.receiptSeq).toBe(41);
    expect(m.donationSeq).toBe(13);
  });

  it('DB חדש ריק מתחיל ב-1', () => {
    const m = migrate(emptyDb())!;
    expect(m.receiptSeq).toBe(1);
    expect(m.donationSeq).toBe(1);
  });
});
