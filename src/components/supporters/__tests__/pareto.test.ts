/**
 * ratchet — מנוע-הריכוזיות (פארטו/ג׳יני). מיון-יחיד, ג׳יני בנוסחת-הסדרה, דטרמיניסטי.
 * כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { paretoReport } from '../pareto';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-20';
function don(amount: number): Donation {
  return { rid: 'D', date: '2026-07-06', amount, cur: '₪', cat: '' };
}
function sup(id: string, amount: number): Supporter {
  return {
    id, name: id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [don(amount)],
  };
}

describe('💛 ratchet — ריכוזיות/פארטו', () => {
  it('שוויון-מלא ⇒ ג׳יני ~0, top20 ~20%', () => {
    const data = Array.from({ length: 10 }, (_, i) => sup('e' + i, 1000));
    const p = paretoReport(data, TODAY);
    expect(p.donors).toBe(10);
    expect(p.gini).toBeLessThanOrEqual(5);
    expect(p.top20Share).toBeGreaterThanOrEqual(18);
    expect(p.top20Share).toBeLessThanOrEqual(22);
  });

  it('ריכוז-קיצוני ⇒ ג׳יני גבוה + top20 גבוה', () => {
    const data = [sup('whale', 100000), ...Array.from({ length: 9 }, (_, i) => sup('s' + i, 100))];
    const p = paretoReport(data, TODAY);
    expect(p.gini).toBeGreaterThan(70);
    expect(p.top20Share).toBeGreaterThan(90); // הלוויתן ב-top-20%
    expect(p.halfDonorPct).toBeLessThanOrEqual(10); // מיעוט זעיר = חצי מהכסף
  });

  it('העקומה מתחילה ב-(0,0), מסתיימת ב-(100,100), מונוטונית', () => {
    const p = paretoReport([sup('a', 5000), sup('b', 3000), sup('c', 1000)], TODAY);
    expect(p.curve[0]).toEqual({ donorPct: 0, moneyPct: 0 });
    const last = p.curve[p.curve.length - 1];
    expect(last.donorPct).toBe(100);
    expect(Math.round(last.moneyPct)).toBe(100);
    for (let i = 1; i < p.curve.length; i++) {
      expect(p.curve[i].moneyPct).toBeGreaterThanOrEqual(p.curve[i - 1].moneyPct);
    }
  });

  it('תיק-ריק ⇒ ברירת-מחדל בטוחה', () => {
    const p = paretoReport([{ ...sup('x', 0), donations: [] }], TODAY);
    expect(p.donors).toBe(0);
    expect(p.gini).toBe(0);
    expect(p.top20Share).toBe(0);
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים < 400ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) dons.push(don(100 + (d * 13 + k * 7) % 5000));
      donors.push({ ...sup('d' + d, 0), donations: dons });
    }
    const t0 = performance.now();
    const p = paretoReport(donors, TODAY);
    const ms = performance.now() - t0;
    expect(p.donors).toBe(5000);
    expect(ms).toBeLessThan(400);
  });
});
