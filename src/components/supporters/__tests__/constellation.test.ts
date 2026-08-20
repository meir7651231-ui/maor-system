/**
 * ratchet — מנוע-פריסת-הגלקסיה. דטרמיניסטי (זווית יציבה בין ריצות), מעבר-יחיד.
 */
import { describe, expect, it } from 'vitest';
import { donorConstellation } from '../constellation';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-19';
function don(over: Partial<Donation>): Donation {
  return { rid: 'D', date: '2026-08-01', amount: 100, cur: '₪', cat: '', ...over };
}
function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's' + Math.random().toString(36).slice(2, 7),
    name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('💛 ratchet — מנוע-הגלקסיה', () => {
  it('רק תורמים-בפועל; רדום נסחף החוצה, טרי פנימי; גודל לפי ערך', () => {
    const fresh = sup({ id: 'fresh', donations: [don({ date: '2026-08-15', amount: 100 })] });
    const dormant = sup({ id: 'dorm', donations: [don({ date: '2024-01-01', amount: 100 })] });
    const whale = sup({ id: 'whale', donations: [don({ date: '2026-08-10', amount: 500000 })] });
    const empty = sup({ id: 'empty' });
    const nodes = donorConstellation([fresh, dormant, whale, empty], TODAY);
    expect(nodes.map((n) => n.id).sort()).toEqual(['dorm', 'fresh', 'whale']); // empty הושמט
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId.dorm.radius).toBeGreaterThan(byId.fresh.radius); // רדום רחוק יותר
    expect(byId.whale.size).toBeGreaterThan(byId.fresh.size); // הלווייתן גדול יותר
    expect(byId.whale.size).toBeLessThanOrEqual(1);
  });

  it('דטרמיניסטי: אותה זווית/רדיוס בכל ריצה', () => {
    const data = [sup({ id: 'a', donations: [don({})] }), sup({ id: 'b', donations: [don({ date: '2026-05-01' })] })];
    const a = donorConstellation(data, TODAY), b = donorConstellation(data, TODAY);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const n of a) { expect(n.angle).toBeGreaterThanOrEqual(0); expect(n.angle).toBeLessThan(1); }
  });

  it('atRisk לפי סף-הסיכון', () => {
    // נותן כל חודש, שתק חצי-שנה ⇒ סיכון גבוה
    const risky = sup({ id: 'r', donations: [
      don({ date: '2025-09-01' }), don({ date: '2025-10-01' }), don({ date: '2025-11-01' }), don({ date: '2025-12-01' }),
    ] });
    const nodes = donorConstellation([risky], TODAY, { riskThreshold: 60 });
    expect(nodes[0].atRisk).toBe(true);
  });

  it('הקרנה-קדימה (offsetDays): כוכב נסחף החוצה ומאדים עם הזמן', () => {
    // נותן כל חודש עד לפני חצי-שנה — טרי-יחסית היום, גולש קדימה
    const sp = sup({ id: 'drift', donations: [
      don({ date: '2026-04-06', amount: 500 }), don({ date: '2026-05-06', amount: 500 }), don({ date: '2026-06-06', amount: 500 }),
    ] });
    const now = donorConstellation([sp], TODAY)[0];
    const future = donorConstellation([sp], TODAY, { offsetDays: 365 })[0];
    expect(future.radius).toBeGreaterThanOrEqual(now.radius); // נסחף החוצה
    expect(future.churn).toBeGreaterThanOrEqual(now.churn);   // סיכון עולה
    // offset=0 מתלכד עם ברירת-המחדל (אותו רדיוס/סיכון)
    const zero = donorConstellation([sp], TODAY, { offsetDays: 0 })[0];
    expect(zero.radius).toBe(now.radius);
    expect(zero.churn).toBe(now.churn);
  });

  it('🚀 ביצועים: ~30k תרומות על ~3k תורמים — פריסה < 500ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 3000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) dons.push(don({ date: '2025-0' + ((k % 9) + 1) + '-05', amount: 100 + k }));
      donors.push(sup({ id: 'd' + d, donations: dons }));
    }
    const t0 = performance.now();
    const nodes = donorConstellation(donors, TODAY);
    const ms = performance.now() - t0;
    expect(nodes.length).toBe(3000);
    expect(ms).toBeLessThan(500);
  });
});
