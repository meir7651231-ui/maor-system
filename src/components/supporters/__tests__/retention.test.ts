/**
 * ratchet — קוהורטת-הגיוס. קיבוץ לפי שנת-מתנה-ראשונה + שימור-עד-היום, דטרמיניסטי.
 * כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { acquisitionCohorts } from '../retention';
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

describe('💛 ratchet — קוהורטת-גיוס', () => {
  it('מקבץ לפי שנת-הגיוס (מתנה-ראשונה) + שימור-עד-היום', () => {
    const data = [
      // גויס 2023, עדיין-פעיל (נתן החודש)
      sup({ donations: [don({ date: '2023-05-06', amount: 1000 }), don({ date: '2026-07-06', amount: 1000 })] }),
      // גויס 2023, נטש (מתנה אחרונה 2023)
      sup({ donations: [don({ date: '2023-08-06', amount: 500 })] }),
      // גויס 2026, פעיל
      sup({ donations: [don({ date: '2026-06-06', amount: 2000 })] }),
    ];
    const r = acquisitionCohorts(data, TODAY);
    expect(r.cohorts.map((c) => c.year)).toEqual([2023, 2026]);
    const c23 = r.cohorts.find((c) => c.year === 2023)!;
    expect(c23.size).toBe(2);
    expect(c23.activeNow).toBe(1);
    expect(c23.retentionPct).toBe(50);
    expect(c23.ltv).toBe(2500); // 1000+1000+500
    const c26 = r.cohorts.find((c) => c.year === 2026)!;
    expect(c26.retentionPct).toBe(100);
    // שימור-משוקלל: 2 פעילים מתוך 3 מגויסים = 67%
    expect(r.overallRetention).toBe(67);
  });

  it('שנת-הגיוס = המתנה-הראשונה גם אם ההיסטוריה לא-ממוינת', () => {
    const r = acquisitionCohorts([
      sup({ donations: [don({ date: '2025-03-06', amount: 100 }), don({ date: '2022-01-06', amount: 100 })] }),
    ], TODAY);
    expect(r.cohorts[0].year).toBe(2022);
  });

  it('תיק-ריק ⇒ ריק בטוח', () => {
    const r = acquisitionCohorts([sup({})], TODAY);
    expect(r.cohorts).toHaveLength(0);
    expect(r.overallRetention).toBe(0);
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים < 400ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) {
        const yr = 2020 + (k % 6);
        dons.push(don({ date: yr + '-0' + ((k % 9) + 1) + '-05', amount: 100 + k }));
      }
      donors.push(sup({ id: 'd' + d, donations: dons }));
    }
    expect(donors.reduce((a, s) => a + s.donations.length, 0)).toBe(50000);
    const t0 = performance.now();
    const r = acquisitionCohorts(donors, TODAY);
    const ms = performance.now() - t0;
    expect(r.cohorts.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(400);
  });
});
