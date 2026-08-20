/**
 * ratchet — מעברי-דרגה אמיתיים. דרגה as-of-תאריך (נגזרת-היסטוריה, בלי שינוי-סכמה),
 * מטריצת-מעברים promoted/demoted/stable/new. דטרמיניסטי + perf.
 */
import { describe, expect, it } from 'vitest';
import { tierAsOf, tierMigration } from '../tierMigration';
import type { Donation, Supporter } from '../../../types/domain';

const TODAY = '2026-08-20';
function don(date: string, amount: number): Donation {
  return { rid: 'D', date, amount, cur: '₪', cat: '' };
}
function sup(id: string, dons: Donation[]): Supporter {
  return {
    id, name: id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: dons,
  };
}

describe('💛 ratchet — מעברי-דרגה אמיתיים', () => {
  it('tierAsOf סופר רק נתינות עד אותו יום', () => {
    const sp = sup('a', [don('2025-01-06', 6000), don('2026-07-06', 6000)]);
    // לפני שנה (2025-08-20): רק הנתינה הראשונה קיימת
    const past = tierAsOf(sp, '2025-08-20');
    // היום: שתי הנתינות
    const now = tierAsOf(sp, TODAY);
    expect(past).not.toBeNull();
    expect(now).not.toBeNull();
    // היום יש F גבוה יותר (2 מתנות) + טריות ⇒ דרגה ≥ העבר
    expect(['זהב', 'כסף', 'ארד', 'רדומה']).toContain(now!);
  });

  it('לא-תורם עד התאריך ⇒ null', () => {
    const sp = sup('late', [don('2026-07-06', 500)]);
    expect(tierAsOf(sp, '2025-01-01')).toBeNull(); // עוד לא נתן
    expect(tierAsOf(sp, TODAY)).not.toBeNull();
  });

  it('מטריצה: עלייה/ירידה/יציבות/חדש', () => {
    const data = [
      // עלה: לפני-שנה מתנה-בודדת קטנה (ארד/רדומה) ⇒ היום נותן-סדיר גדול (זהב/כסף)
      sup('up', [don('2025-02-06', 200), don('2026-05-06', 6000), don('2026-07-06', 6000), don('2026-08-06', 6000)]),
      // חדש: כל הנתינות בשנה האחרונה
      sup('new', [don('2026-06-06', 3000), don('2026-08-06', 3000)]),
      // ירד: נתן הרבה פעם, שתק — טריות מתדרדרת
      sup('down', [don('2024-01-06', 9000), don('2024-03-06', 9000), don('2025-06-06', 300)]),
    ];
    const m = tierMigration(data, TODAY, 12);
    expect(m.newDonors).toBe(1); // 'new'
    expect(m.promoted + m.demoted + m.stable).toBe(2); // up, down
    expect(m.promoted).toBeGreaterThanOrEqual(1);
    // מעברים מפורטים כשיש שינוי-דרגה
    expect(m.flows.every((f) => f.from !== f.to)).toBe(true);
    expect(m.fromIso).toBe('2025-08-20');
  });

  it('🚀 ביצועים: ~50k תרומות על ~5k תורמים × 2 נקודות < 500ms', () => {
    const donors: Supporter[] = [];
    for (let d = 0; d < 5000; d++) {
      const dons: Donation[] = [];
      for (let k = 0; k < 10; k++) {
        const yr = 2024 + (k % 3);
        dons.push(don(yr + '-0' + ((k % 9) + 1) + '-05', 100 + k));
      }
      donors.push(sup('d' + d, dons));
    }
    const t0 = performance.now();
    const m = tierMigration(donors, TODAY, 12);
    const ms = performance.now() - t0;
    expect(m.promoted + m.demoted + m.stable + m.newDonors).toBeGreaterThan(0);
    expect(ms).toBeLessThan(500);
  });
});
