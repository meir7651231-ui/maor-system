/**
 * ratchet — מודיעין-תיק וקוהורטה. מעבר-יחיד על התורמים, דטרמיניסטי.
 * כולל בדיקת-ביצועים על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { activeByMonth, portfolioIntel, tierTrendCounts } from '../portfolio';
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

describe('💛 ratchet — מודיעין-תיק', () => {
  it('portfolioIntel: LTV / avgGift / retention / ריכוזיות / בסכנה', () => {
    const data = [
      // תורם-ענק טרי (משקל בריכוזיות + שומר)
      sup({ id: 'big', donations: [don({ date: '2026-08-10', amount: 90000 })] }),
      // תורם קטן טרי
      sup({ id: 'small', donations: [don({ date: '2026-08-01', amount: 1000 })] }),
      // תורם שנטש (שקט שנתיים ⇒ בסכנה, לא-משומר)
      sup({ id: 'lost', donations: [don({ date: '2024-01-01', amount: 3000 }), don({ date: '2024-02-01', amount: 3000 })] }),
      // ריק — לא נספר כתורם-בפועל
      sup({ id: 'empty' }),
    ];
    const p = portfolioIntel(data, TODAY, 3.7, 1);
    expect(p.count).toBe(4);
    expect(p.ltv).toBe(97000); // 90000+1000+6000
    expect(p.giftCount).toBe(4);
    // top-1 מתוך LTV: 90000/97000 ≈ 93%
    expect(p.concentrationTopN).toBe(Math.round((90000 / 97000) * 100));
    // שימור: 2 מתוך 3 שנתנו-אי-פעם (big,small טריים; lost לא) = 67%
    expect(p.retention12m).toBe(67);
    // בסכנה: lost בלבד
    expect(p.atRiskCount).toBe(1);
    expect(p.atRiskMoney).toBe(6000);
    expect(p.scoreBins.reduce((a, b) => a + b, 0)).toBe(3); // 3 תורמים-בפועל
  });

  it('tierTrendCounts: 4 דרגות בסדר, סופר מגמות', () => {
    const rows = tierTrendCounts([
      sup({ donations: [don({ date: '2026-03-01', amount: 100 }), don({ date: '2026-08-15', amount: 5000 })] }),
    ], TODAY);
    expect(rows.map((r) => r.tier)).toEqual(['זהב', 'כסף', 'ארד', 'רדומה']);
    expect(rows.reduce((a, r) => a + r.total, 0)).toBe(1);
  });

  it('activeByMonth: מונה תורמים-פעילים פר-חודש', () => {
    const data = [
      sup({ donations: [don({ date: '2026-08-05' })] }),
      sup({ donations: [don({ date: '2026-08-20' })] }),
      sup({ donations: [don({ date: '2026-07-05' })] }),
    ];
    const a = activeByMonth(data, TODAY, 12);
    expect(a[11]).toBe(2); // אוגוסט
    expect(a[10]).toBe(1); // יולי
  });

  it('🚀 ביצועים: ~40k תרומות על ~4k תורמים — portfolioIntel < 500ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 4000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) {
        const mo = ((k % 12) + 1).toString().padStart(2, '0');
        dons.push(don({ date: '2025-' + mo + '-05', amount: 100 + k }));
      }
      donors.push(sup({ id: 'd' + d, donations: dons }));
    }
    expect(donors.reduce((a, s) => a + s.donations.length, 0)).toBe(40000);
    const t0 = performance.now();
    const p = portfolioIntel(donors, TODAY);
    const ms = performance.now() - t0;
    expect(p.giftCount).toBe(40000);
    expect(ms).toBeLessThan(500);
  });
});

describe('🐛 ratchet — תחזית-30/90 בלי כסף-אבוד (swarm-audit 21.8)', () => {
  // 🐛 הבאג: forecast30/forecast90 בדקו רק dueIso <= אופק — בלי גבול-תחתון —
  // כך שכל תורם-שאיחר (dueIso בעבר, גם 2019) נספר ב"תחזית 30/90 יום" והתחזית
  // התנפחה בכסף-אבוד. התיקון: רק dueIso >= todayIso נספר.
  it('תורם-שנטש (מועד-צפוי ב-2024) לא נספר בתחזית; מועד-עתידי בחלון כן', () => {
    const lapsed = sup({
      id: 'lapsed',
      donations: [don({ date: '2023-11-01', amount: 1000 }), don({ date: '2024-01-01', amount: 1000 })],
    }); // קצב ~61 יום ⇒ dueIso ≈ 2024-03 — עמוק בעבר
    const upcoming = sup({
      id: 'up',
      donations: [don({ date: '2026-06-10', amount: 500 }), don({ date: '2026-08-10', amount: 500 })],
    }); // קצב ~61 יום ⇒ dueIso ≈ 2026-10-10 — בתוך 90 יום, מחוץ ל-30
    const p = portfolioIntel([lapsed, upcoming], TODAY);
    expect(p.forecast30).toBe(0); // הנוטש לא נספר; העתידי מחוץ ל-30
    expect(p.forecast90).toBe(500); // רק המועד-העתידי שבחלון
  });
});
