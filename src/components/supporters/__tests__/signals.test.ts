/**
 * ratchet — מנוע-האותות. זיהוי-חריגות פר-תורם מרצף-נתינה ממוין, דטרמיניסטי.
 * כולל perf על עשרות-אלפי תרומות.
 */
import { describe, expect, it } from 'vitest';
import { donorSignals, portfolioSignals } from '../signals';
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
const kinds = (s: Supporter) => donorSignals(s, TODAY).map((x) => x.kind).sort();

describe('💛 ratchet — אותות/חריגות', () => {
  it('תורם-חדש: מתנה יחידה וטרייה', () => {
    expect(kinds(sup({ donations: [don({ date: '2026-07-06', amount: 500 })] }))).toContain('firstgift');
    // מתנה-יחידה ישנה ⇒ לא firstgift (וגם לא lapsing — דורש ≥2)
    expect(kinds(sup({ donations: [don({ date: '2024-01-06', amount: 500 })] }))).not.toContain('firstgift');
  });

  it('נפילת-מתנה: אחרונה נמוכה בהרבה מהממוצע (ותק ≥3)', () => {
    const s = sup({ donations: [don({ date: '2026-05-06', amount: 5000 }), don({ date: '2026-06-06', amount: 5000 }), don({ date: '2026-07-06', amount: 500 })] });
    const sig = donorSignals(s, TODAY).find((x) => x.kind === 'drop');
    expect(sig).toBeTruthy();
    expect(sig!.detail).toContain('%');
  });

  it('קפיצה: אחרונה גדולה פי-2+ מהממוצע', () => {
    const s = sup({ donations: [don({ date: '2026-05-06', amount: 1000 }), don({ date: '2026-07-06', amount: 5000 })] });
    expect(kinds(s)).toContain('jump');
  });

  it('חזרה-אחרי-נטישה: פער ≥ שנה ואז מתנה טרייה', () => {
    const s = sup({ donations: [don({ date: '2023-01-06', amount: 1000 }), don({ date: '2026-07-06', amount: 1000 })] });
    const sig = donorSignals(s, TODAY).find((x) => x.kind === 'reactivated');
    expect(sig).toBeTruthy();
    expect(sig!.detail).toContain('חודשי-שקט');
  });

  it('גולש: תורם-ותיק ששקט מעל 240 יום', () => {
    const s = sup({ donations: [don({ date: '2025-01-06', amount: 1000 }), don({ date: '2025-06-06', amount: 1000 })] });
    expect(kinds(s)).toContain('lapsing');
  });

  it('תורם-בריא (נתן החודש, קצב-יציב) ⇒ אין אותות', () => {
    const s = sup({ donations: [don({ date: '2026-06-06', amount: 1000 }), don({ date: '2026-07-06', amount: 1000 }), don({ date: '2026-08-06', amount: 1000 })] });
    expect(donorSignals(s, TODAY)).toHaveLength(0);
  });

  it('ריק ⇒ אין אותות', () => {
    expect(donorSignals(sup({}), TODAY)).toHaveLength(0);
  });

  it('portfolioSignals: מונים + movers ממויין לפי עוצמה', () => {
    const data = [
      sup({ id: 'react', donations: [don({ date: '2023-01-06', amount: 9000 }), don({ date: '2026-07-06', amount: 9000 })] }),
      sup({ id: 'new', donations: [don({ date: '2026-07-06', amount: 300 })] }),
    ];
    const p = portfolioSignals(data, TODAY);
    expect(p.counts.reactivated).toBe(1);
    expect(p.counts.firstgift).toBe(1);
    expect(p.total).toBe(2);
    // reactivated (עוצמה 70) לפני firstgift (40)
    expect(p.movers[0].kind).toBe('reactivated');
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים < 500ms', () => {
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
    const p = portfolioSignals(donors, TODAY);
    const ms = performance.now() - t0;
    expect(p.counts).toBeTruthy();
    expect(ms).toBeLessThan(500);
  });
});
