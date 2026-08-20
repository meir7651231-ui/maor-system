/**
 * ratchet — מנוע-הדירוג. מיון-LTV יורד, דירוג יציב (שובר-שוויון לפי id), אחוזון,
 * ודירוג-בתוך-הדרגה. כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { donorRanks } from '../ranks';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-20';
function don(over: Partial<Donation>): Donation {
  return { rid: 'D', date: '2026-07-06', amount: 100, cur: '₪', cat: '', ...over };
}
function sup(id: string, amount: number): Supporter {
  return {
    id, name: id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [don({ amount })],
  };
}

describe('💛 ratchet — דירוג/אחוזון', () => {
  it('מדרג לפי-LTV יורד, אחוזון-בראש 100', () => {
    const m = donorRanks([sup('a', 1000), sup('b', 5000), sup('c', 200)], TODAY);
    expect(m.get('b')!.ltvRank).toBe(1);
    expect(m.get('b')!.percentile).toBe(100);
    expect(m.get('a')!.ltvRank).toBe(2);
    expect(m.get('c')!.ltvRank).toBe(3);
    expect(m.get('c')!.total).toBe(3);
  });

  it('שובר-שוויון יציב (אותו LTV ⇒ דירוג לפי id, חוזר-על-עצמו)', () => {
    const m1 = donorRanks([sup('x', 1000), sup('y', 1000)], TODAY);
    const m2 = donorRanks([sup('y', 1000), sup('x', 1000)], TODAY);
    expect(m1.get('x')!.ltvRank).toBe(m2.get('x')!.ltvRank);
    expect(m1.get('x')!.ltvRank).toBe(1); // 'x' < 'y'
  });

  it('דירוג-בתוך-הדרגה + גודל-דרגה', () => {
    // שני תורמי-כסף (סכום גבוה, מתנה-יחידה ⇒ ציון 680) ותורם-ארד אחד
    const m = donorRanks([sup('s1', 9000), sup('s2', 6000), sup('bronze', 150)], TODAY);
    const t = m.get('s1')!.tier;
    expect(m.get('s2')!.tier).toBe(t); // שניהם באותה דרגה
    expect(m.get('bronze')!.tier).not.toBe(t); // הארד נפרד
    expect(m.get('s1')!.tierSize).toBe(2);
    expect(m.get('s1')!.tierRank).toBe(1); // LTV גבוה יותר ⇒ ראשון בדרגה
    expect(m.get('s2')!.tierRank).toBe(2);
    expect(m.get('bronze')!.tierSize).toBe(1);
  });

  it('תורם-ריק לא נכלל במפה', () => {
    const empty: Supporter = { ...sup('e', 0), donations: [] };
    const m = donorRanks([empty, sup('real', 500)], TODAY);
    expect(m.has('e')).toBe(false);
    expect(m.get('real')!.total).toBe(1);
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים < 400ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) dons.push(don({ amount: 100 + (d * 7 + k) % 900 }));
      donors.push({ ...sup('d' + d, 0), donations: dons });
    }
    const t0 = performance.now();
    const m = donorRanks(donors, TODAY);
    const ms = performance.now() - t0;
    expect(m.size).toBe(5000);
    expect(ms).toBeLessThan(400);
  });
});
