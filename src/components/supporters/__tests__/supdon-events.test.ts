/**
 * ratchet — supDonEvents ממזג את רשימת "כל התרומות" verbatim מהלגאסי
 * (legacy-main-script.js:1486-1495): donations עם 'קבלה <rid>' + hist עם
 * 'מהקובץ ההיסטורי'; כשאין hist — שורות first/last (סכום 0) כ"תרומה
 * ראשונה/אחרונה (מהקובץ)" רק אם תאריכן לא מופיע כבר; מיון מהחדש לישן.
 */
import { describe, expect, it } from 'vitest';
import { supDonEvents } from '../lib';
import type { Supporter } from '../../../types/domain';

function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 'sp1',
    name: 'תומכת',
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

describe('🧾 ratchet — supDonEvents (legacy:1486-1495)', () => {
  it('ממזג קבלות + hist וממיין יורד; hist בלי מטבע → ₪', () => {
    const rows = supDonEvents(
      sup({
        donations: [{ rid: 'D-2', date: '2026-03-01', amount: 500, cur: '$', cat: '' }],
        hist: [
          { d: '2024-02-11', a: 600 },
          { d: '2026-06-15', a: 200, c: '$' },
        ],
      }),
    );
    expect(rows.map((r) => r.src)).toEqual(['מהקובץ ההיסטורי', 'קבלה D-2', 'מהקובץ ההיסטורי']);
    expect(rows[0]).toMatchObject({ date: '2026-06-15', amount: 200, cur: '$' });
    expect(rows[1]).toMatchObject({ date: '2026-03-01', amount: 500, cur: '$', rid: 'D-2' });
    expect(rows[2]).toMatchObject({ date: '2024-02-11', amount: 600, cur: '₪' });
  });

  it('אין hist → שורות "תרומה ראשונה/אחרונה (מהקובץ)" בסכום 0', () => {
    const rows = supDonEvents(sup({ first: '2023-01-05', last: '2025-08-20' }));
    expect(rows).toEqual([
      { date: '2025-08-20', amount: 0, cur: '', src: 'תרומה אחרונה (מהקובץ)' },
      { date: '2023-01-05', amount: 0, cur: '', src: 'תרומה ראשונה (מהקובץ)' },
    ]);
  });

  it('first==last → שורה אחת בלבד; תאריך שכבר מכוסה בקבלה לא מוכפל', () => {
    expect(supDonEvents(sup({ first: '2024-04-04', last: '2024-04-04' }))).toHaveLength(1);
    const rows = supDonEvents(
      sup({
        first: '2026-03-01',
        last: '2026-05-01',
        donations: [
          { rid: 'D-1', date: '2026-03-01', amount: 100, cur: '₪', cat: '' },
          { rid: 'D-2', date: '2026-05-01', amount: 150, cur: '₪', cat: '' },
        ],
      }),
    );
    // שני התאריכים מכוסים בקבלות — אין שורות first/last נוספות
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.src.startsWith('קבלה'))).toBe(true);
  });

  // הכרעת-בעלים 19.8 ("אין יותר קובץ היסטורי — נדרים זה חי"): רשומה עם חברה-סולקת
  // (clearer, למשל נדרים) מוצגת כ"תרומה" חיה, לא "מהקובץ ההיסטורי". ייבוא-קובץ-ישן
  // (בלי clearer) נשאר "מהקובץ ההיסטורי" (תאימות-לאחור).
  it('רשומת-סליקה (clearer=נדרים) ⇒ "תרומה", לא "מהקובץ ההיסטורי"; בלי clearer ⇒ נשאר', () => {
    const rows = supDonEvents(
      sup({
        hist: [
          { d: '2026-01-01', a: 100, clearer: 'נדרים', receipt: '3806', last4: '1234' },
          { d: '2025-01-01', a: 50 }, // ייבוא-קובץ-ישן — בלי חברה-סולקת
        ],
      }),
    );
    // מהחדש לישן: קודם רשומת-נדרים, אחריה הקובץ-הישן
    expect(rows[0].src).toBe('תרומה · קבלה 3806 · •1234 · נדרים');
    expect(rows[1].src).toBe('מהקובץ ההיסטורי');
  });

  it('יש hist → אין שורות first/last בכלל (כמו בלגאסי)', () => {
    const rows = supDonEvents(
      sup({ first: '2020-01-01', last: '2025-01-01', hist: [{ d: '2022-02-02', a: 50 }] }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].src).toBe('מהקובץ ההיסטורי');
  });
});
