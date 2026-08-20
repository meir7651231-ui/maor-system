/**
 * ratchet — מנוע-העונתיות. אגרגציה פר-חודש-לועזי חוצת-שנים, דטרמיניסטית.
 * כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { donorRhythm, seasonality } from '../seasonality';
import type { Donation, Supporter } from '../../../types/domain';

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

describe('💛 ratchet — עונתיות-נתינה', () => {
  it('אוגרת פר-חודש-לועזי חוצה-שנים + שיא/שפל/ריכוזיות', () => {
    const data = [
      // תשרי (ספטמבר=9) — שני תורמים, סכומים גדולים
      sup({ donations: [don({ date: '2024-09-06', amount: 5000 }), don({ date: '2025-09-06', amount: 5000 })] }),
      sup({ donations: [don({ date: '2025-09-20', amount: 4000 })] }),
      // מרץ (3) — תורם אחד קטן
      sup({ donations: [don({ date: '2025-03-06', amount: 1000 })] }),
    ];
    const s = seasonality(data);
    expect(s.byMonth).toHaveLength(12);
    const sep = s.byMonth.find((m) => m.month === 9)!;
    expect(sep.ils).toBe(14000); // 5000+5000+4000 חוצה-שנים
    expect(sep.gifts).toBe(3);
    expect(sep.donors).toBe(2); // שני תורמים-שונים
    expect(s.peakMonth).toBe(9);
    expect(s.troughMonth).toBe(3); // החודש-הפעיל הכי-קטן
    expect(s.totalIls).toBe(15000);
    expect(s.peakShare).toBe(Math.round((14000 / 15000) * 100));
  });

  it('חודש בלי-נתינה נשאר 0 ולא נבחר כשפל', () => {
    const s = seasonality([sup({ donations: [don({ date: '2025-05-06', amount: 200 })] })]);
    expect(s.byMonth.find((m) => m.month === 1)!.ils).toBe(0);
    expect(s.troughMonth).toBe(5); // מאי — החודש-הפעיל-היחיד
    expect(s.peakMonth).toBe(5);
  });

  it('תיק-ריק ⇒ אפסים בטוחים (בלי חלוקה-באפס)', () => {
    const s = seasonality([sup({})]);
    expect(s.totalIls).toBe(0);
    expect(s.peakMonth).toBe(0);
    expect(s.peakShare).toBe(0);
  });

  it('המרת-$ דרך rate נכנסת לחודש הנכון', () => {
    const s = seasonality([sup({ donations: [don({ date: '2025-07-06', amount: 100, cur: '$' })] })], 4);
    expect(s.byMonth.find((m) => m.month === 7)!.ils).toBe(400);
  });

  it('donorRhythm: חודש-דומיננטי + דגל-עונתי', () => {
    // 90% בתשרי ⇒ עונתי
    const r = donorRhythm(sup({ donations: [don({ date: '2024-09-06', amount: 9000 }), don({ date: '2025-02-06', amount: 1000 })] }));
    expect(r.topMonth).toBe(9);
    expect(r.concentration).toBe(90);
    expect(r.seasonal).toBe(true);
    // מפוזר ⇒ לא-עונתי
    const flat = donorRhythm(sup({ donations: [don({ date: '2025-01-06', amount: 500 }), don({ date: '2025-06-06', amount: 500 }), don({ date: '2025-11-06', amount: 500 })] }));
    expect(flat.seasonal).toBe(false);
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים < 400ms', () => {
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
    const s = seasonality(donors);
    const ms = performance.now() - t0;
    expect(s.byMonth.reduce((a, m) => a + m.gifts, 0)).toBe(50000);
    expect(ms).toBeLessThan(400);
  });
});
