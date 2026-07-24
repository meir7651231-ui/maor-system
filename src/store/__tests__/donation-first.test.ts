/**
 * רצ'ט — "תרומה ראשונה" של תורם (פאס-2 של הנחיל). addDonation קבע first לפי
 * התרומה שהוזנה ראשונה, לא לפי המוקדמת בתאריך. תרומה שתוארכה אחורה אחרי תרומה
 * מאוחרת השאירה first על התאריך המאוחר — פוגע ב-CSV, בכרטיס התורם ובקיר ההשפעה.
 * first חייב להיות המינימום בתאריך (סימטרי ל-last שהוא המקסימום).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';

function seed(): Db {
  const sup: Supporter = {
    id: 'sp1', name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: 'תורם פרטי',
    forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
  } as Supporter;
  return { ...emptyDb(), supporters: [sup] };
}
const don = (date: string) => ({ date, amount: 100, cur: '₪' as const, cat: 'כללי' });
const sup = () => useApp.getState().db.supporters[0];

beforeEach(() => useApp.getState().setDb(() => seed()));

describe('💛 תרומה ראשונה = המוקדמת בתאריך, גם בהזנה לא-כרונולוגית', () => {
  it('תרומה מאוחרת ואז מוקדמת (back-dated) → first נשאר המוקדם, last המאוחר', () => {
    const s = useApp.getState();
    s.addDonation('sp1', don('2026-03-01')); // הוזנה ראשונה, מאוחרת
    s.addDonation('sp1', don('2026-01-15')); // הוזנה שנייה, מוקדמת (תוארכה אחורה)
    expect(sup().first).toBe('2026-01-15'); // מינימום בתאריך
    expect(sup().last).toBe('2026-03-01'); // מקסימום בתאריך
  });
  it('סדר כרונולוגי רגיל עדיין תקין', () => {
    const s = useApp.getState();
    s.addDonation('sp1', don('2026-01-15'));
    s.addDonation('sp1', don('2026-03-01'));
    expect(sup().first).toBe('2026-01-15');
    expect(sup().last).toBe('2026-03-01');
  });
});
