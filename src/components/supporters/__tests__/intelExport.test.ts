/**
 * ratchet — ייצוא-המודיעין ל-CSV. שורה-לתורם עם עומק-הנתונים המלא, דטרמיניסטי.
 */
import { describe, expect, it } from 'vitest';
import { intelCsvRows } from '../intelExport';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-20';
function don(over: Partial<Donation>): Donation {
  return { rid: 'D', date: '2026-01-06', amount: 100, cur: '₪', cat: '', ...over };
}
function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's' + Math.random().toString(36).slice(2, 7),
    name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('💛 ratchet — ייצוא-המודיעין CSV', () => {
  it('כותרת מלאה + שורה-לתורם עם השדות-העמוקים', () => {
    const rows = intelCsvRows([
      sup({ name: 'קרן הזהב', cat: 'קרן', phone: '050', donations: [don({ date: '2026-06-06', amount: 5000 }), don({ date: '2026-07-06', amount: 5000 })] }),
    ], TODAY);
    expect(rows[0]).toContain('ציון RFM');
    expect(rows[0]).toContain('סיכון נטישה %');
    expect(rows[0]).toContain('אותות');
    expect(rows).toHaveLength(2);
    const r = rows[1];
    expect(r[0]).toBe('קרן הזהב');
    expect(r[1]).toBe('קרן');
    expect(r[4]).toBe('2'); // מתנות
    expect(Number(r[7])).toBe(10000); // LTV
  });

  it('מדלג על תורמים בלי היסטוריית-נתינה', () => {
    const rows = intelCsvRows([sup({ name: 'ריק' }), sup({ name: 'פעיל', donations: [don({ amount: 200 })] })], TODAY);
    expect(rows).toHaveLength(2); // כותרת + הפעיל בלבד
    expect(rows[1][0]).toBe('פעיל');
  });

  it('אות-גולש מופיע בעמודת-האותות', () => {
    const rows = intelCsvRows([
      sup({ name: 'ישן', donations: [don({ date: '2025-01-06', amount: 1000 }), don({ date: '2025-06-06', amount: 1000 })] }),
    ], TODAY);
    expect(rows[1][15]).toContain('גולש');
  });
});
