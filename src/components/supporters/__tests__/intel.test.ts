/**
 * ratchet — מנוע-המודיעין הפר-תורם. דטרמיניסטי (יום מוזרק), מעבר-יחיד.
 * כולל בדיקת-ביצועים: המנוע חייב לעבור על עשרות-אלפי תרומות במעבר יחיד ומהיר.
 */
import { describe, expect, it } from 'vitest';
import {
  churnFromScan,
  dayDiff,
  donorIntel,
  donorScan,
  forecastFromScan,
  rfmFromScan,
  trendFromScan,
} from '../intel';
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

describe('💛 ratchet — מנוע-מודיעין פר-תורם', () => {
  it('dayDiff: הפרש-ימים; ריק=Infinity', () => {
    expect(dayDiff('2026-08-09', TODAY)).toBe(10);
    expect(dayDiff('', TODAY)).toBe(Infinity);
  });

  it('donorScan: מעבר-יחיד — count/ils(₪-שקול)/first/last/סדרה-חודשית', () => {
    const s = sup({
      donations: [
        don({ date: '2026-08-05', amount: 200, cur: '₪' }),
        don({ date: '2026-07-10', amount: 50, cur: '$' }), // 50×4 = 200
      ],
      hist: [{ d: '2026-06-01', a: 100, c: '₪' }] as Supporter['hist'],
    });
    const scan = donorScan(s, TODAY, 4, 12);
    expect(scan.count).toBe(3);
    expect(scan.ils).toBe(500); // 200 + 200 + 100
    expect(scan.first).toBe('2026-06-01');
    expect(scan.last).toBe('2026-08-05');
    expect(scan.monthly).toHaveLength(12);
    expect(scan.monthly[11]).toBe(200); // אוגוסט (החודש) = 200 (₪)
    expect(scan.monthly[10]).toBe(200); // יולי = 50$×4
    expect(scan.monthly[9]).toBe(100); // יוני = 100₪
  });

  it('rfmFromScan: פירוק R/F/M + אחוזים; תואם ספי-supScore', () => {
    // 10 מתנות, אחרונה היום, סה"כ ₪6000 ⇒ R=350,F=300,M=350 ⇒ 1000
    const dons = Array.from({ length: 10 }, (_, i) => don({ date: '2026-08-1' + (i % 9), amount: 600 }));
    const scan = donorScan(sup({ donations: dons }), TODAY);
    const rfm = rfmFromScan(scan, TODAY);
    expect(rfm.score).toBe(1000);
    expect(rfm.r).toBe(350);
    expect(rfm.rPct).toBe(100);
  });

  it('churnFromScan: שקט מעבר-לקצב = סיכון גבוה; אין-מתנות=0', () => {
    expect(churnFromScan(donorScan(sup({}), TODAY), TODAY)).toBe(0);
    // נותן כל ~30 יום, שתק 120 יום ⇒ סיכון גבוה
    const regular = sup({ donations: [
      don({ date: '2026-01-01' }), don({ date: '2026-02-01' }), don({ date: '2026-03-01' }), don({ date: '2026-04-01' }),
    ] });
    expect(churnFromScan(donorScan(regular, TODAY), TODAY)).toBeGreaterThan(60);
  });

  it('forecastFromScan: קצב+ממוצע ⇒ תאריך-צפוי וסכום; ריק=null', () => {
    expect(forecastFromScan(donorScan(sup({}), TODAY), TODAY)).toBeNull();
    const s = sup({ donations: [
      don({ date: '2026-05-01', amount: 1000 }), don({ date: '2026-06-01', amount: 1000 }),
      don({ date: '2026-07-01', amount: 1000 }), don({ date: '2026-08-01', amount: 1000 }),
    ] });
    const fc = forecastFromScan(donorScan(s, TODAY), TODAY)!;
    expect(fc.amount).toBe(1000);
    // קצב ~חודש ⇒ הצפי ~31 יום אחרי המתנה האחרונה (קדימה)
    expect(fc.dueIso > '2026-08-01').toBe(true);
    expect(fc.dueIso <= '2026-09-05').toBe(true);
    expect(fc.confidence).toBeGreaterThan(40);
  });

  it('trendFromScan: מחצית-חדשה>ישנה ⇒ up; יורד ⇒ down', () => {
    const rising = donorScan(sup({ donations: [
      don({ date: '2026-03-05', amount: 100 }), don({ date: '2026-08-05', amount: 900 }),
    ] }), TODAY, 3.7, 6);
    expect(trendFromScan(rising).dir).toBe('up');
  });

  it('donorIntel: חבילה מלאה במעבר-יחיד', () => {
    const s = sup({ donations: [don({ date: '2026-08-05', amount: 2500 }), don({ date: '2026-06-05', amount: 2500 })] });
    const intel = donorIntel(s, TODAY);
    expect(intel.ltv).toBe(5000);
    expect(intel.avgGift).toBe(2500);
    expect(intel.rfm.score).toBeGreaterThan(0);
    expect(intel.forecast).not.toBeNull();
  });

  // 🚀 ביצועים — הדרישה המפורשת: לעבוד על עשרות-אלפי תרומות.
  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים — donorIntel לכולם < 400ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) {
        const mo = ((k % 12) + 1).toString().padStart(2, '0');
        dons.push(don({ date: '2025-' + mo + '-05', amount: 100 + k }));
      }
      donors.push(sup({ id: 'd' + d, donations: dons }));
    }
    const total = donors.reduce((a, s) => a + s.donations.length, 0);
    expect(total).toBe(50000);
    const t0 = performance.now();
    let acc = 0;
    for (const s of donors) acc += donorIntel(s, TODAY).rfm.score;
    const ms = performance.now() - t0;
    expect(acc).toBeGreaterThan(0);
    // מעבר-יחיד ⇒ מהיר. סף שמרני שגם על CI איטי עובר.
    expect(ms).toBeLessThan(400);
  });
});
