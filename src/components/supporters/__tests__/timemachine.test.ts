/**
 * ratchet — מכונת-הזמן. סימולציה-קדימה דטרמיניסטית: אופק=0 מתלכד עם היום,
 * הסכנה תופחת עם הזמן, וההקרנה שומרת מונוטוניות. כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { churnAtOffset, DEFAULT_HORIZONS, timeMachine } from '../timemachine';
import { churnFromScan, donorScan } from '../intel';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-20';
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

describe('💛 ratchet — מכונת-הזמן', () => {
  it('churnAtOffset(0) === churnFromScan של היום (התלכדות)', () => {
    const s = sup({ donations: [don({ date: '2026-01-06', amount: 500 }), don({ date: '2026-05-06', amount: 500 })] });
    const scan = donorScan(s, TODAY);
    expect(churnAtOffset(scan, TODAY, 0)).toBe(churnFromScan(scan, TODAY));
  });

  it('הסיכון עולה מונוטונית עם האופק (הזזה-קדימה = יותר ימים-מאז)', () => {
    const scan = donorScan(sup({ donations: [don({ date: '2026-06-06', amount: 500 }), don({ date: '2026-07-06', amount: 500 })] }), TODAY);
    const c0 = churnAtOffset(scan, TODAY, 0);
    const c90 = churnAtOffset(scan, TODAY, 90);
    const c365 = churnAtOffset(scan, TODAY, 365);
    expect(c90).toBeGreaterThanOrEqual(c0);
    expect(c365).toBeGreaterThanOrEqual(c90);
  });

  it('scan ריק ⇒ 0 בכל אופק (לא-תורם, לא "בסכנה")', () => {
    const scan = donorScan(sup({}), TODAY);
    expect(churnAtOffset(scan, TODAY, 0)).toBe(0);
    expect(churnAtOffset(scan, TODAY, 365)).toBe(0);
  });

  it('timeMachine: אופקים ממויינים, atRiskCount לא-יורד, newlyAtRisk מצטבר', () => {
    const data = [
      // נותן-חודשי טרי — יגלוש-לסכנה מתישהו קדימה
      sup({ id: 'monthly', donations: [don({ date: '2026-06-06', amount: 500 }), don({ date: '2026-07-06', amount: 500 }), don({ date: '2026-08-06', amount: 500 })] }),
      // כבר-נטש — בסכנה כבר היום
      sup({ id: 'gone', donations: [don({ date: '2024-01-01', amount: 3000 }), don({ date: '2024-03-01', amount: 3000 })] }),
    ];
    const tm = timeMachine(data, TODAY);
    // ממויין עולה
    expect(tm.horizons.map((h) => h.offsetDays)).toEqual([...DEFAULT_HORIZONS]);
    // מונוטוני: atRiskCount לא-יורד לאורך הזמן
    for (let i = 1; i < tm.horizons.length; i++) {
      expect(tm.horizons[i].atRiskCount).toBeGreaterThanOrEqual(tm.horizons[i - 1].atRiskCount);
    }
    // 'gone' בסכנה כבר באופק-0
    expect(tm.horizons[0].atRiskCount).toBeGreaterThanOrEqual(1);
    // באופק-האחרון גם 'monthly' נכנס ⇒ 2, ו-newlyAtRisk תפס אותו
    const last = tm.horizons[tm.horizons.length - 1];
    expect(last.atRiskCount).toBe(2);
    expect(last.newlyAtRisk).toBeGreaterThanOrEqual(1);
    // עלות-אי-הפעולה = הפרש בין הקצה להיום
    expect(tm.erosionDonors).toBe(last.atRiskCount - tm.horizons[0].atRiskCount);
  });

  it('צפוי-להיכנס: הו״ק צובר פר-חודש בחלון-האופק', () => {
    const s = sup({
      id: 'hok', donations: [don({ date: '2026-08-06', amount: 500 })],
      hok: { amount: 500, cur: '₪', day: 3, method: 'bank', note: '', active: true, startedAt: '2026-01-01' },
    });
    const tm = timeMachine([s], TODAY, 3.7, [0, 90]);
    // אופק-0: 0 חודשים ⇒ אין accrual (רק תחזית-מתנה אם מועדה, כאן לא)
    // אופק-90: 3 חודשים × 500 = 1500 לפחות
    expect(tm.horizons[1].expectedIncoming).toBeGreaterThanOrEqual(1500);
  });

  it('הו״ק לא-פעילה ⇒ אין accrual', () => {
    const s = sup({
      id: 'inactive', donations: [don({ date: '2026-08-06', amount: 500 })],
      hok: { amount: 500, cur: '₪', day: 3, method: 'bank', note: '', active: false, startedAt: '2026-01-01' },
    });
    const tm = timeMachine([s], TODAY, 3.7, [90]);
    expect(tm.horizons[0].expectedIncoming).toBe(0);
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים × 6 אופקים < 500ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) {
        const mo = ((k % 12) + 1).toString().padStart(2, '0');
        dons.push(don({ date: '2025-' + mo + '-05', amount: 100 + k }));
      }
      donors.push(sup({ id: 'd' + d, donations: dons }));
    }
    expect(donors.reduce((a, s) => a + s.donations.length, 0)).toBe(50000);
    const t0 = performance.now();
    const tm = timeMachine(donors, TODAY);
    const ms = performance.now() - t0;
    expect(tm.horizons.length).toBe(6);
    expect(ms).toBeLessThan(500);
  });
});
