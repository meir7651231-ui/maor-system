/**
 * ratchet — 🔁 הוראות-קבע (ROADMAP-100 ‏#2 צד-מערכת, 5.8.2026): מנוע טהור +
 * חיווט לבית/הנהלה/מסך-התורמים. החיוב עצמו אצל הסליקה/הבנק — אין חיוב במערכת.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { HOK_CAT, hokDue, hokMonthlyTotal, hokRecordedThisMonth } from '../lib';
import homeSrc from '../../home/homeData.ts?raw';
import mgmtSrc from '../../reports/management.tsx?raw';
import detailSrc from '../SupporterDetail.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

const sup = (over: Partial<Supporter>): Supporter => ({
  id: 's1', name: 'פלוני', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '',
  notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
});
const hok = { amount: 180, cur: '₪' as const, day: 10, method: 'bank', note: '', active: true, startedAt: '2026-01-01' };

describe('🔁 ratchet — הוראות-קבע', () => {
  it('hokRecordedThisMonth: קטגוריית הו"ק או סכום-ומטבע של ההוראה — בחודש הנוכחי בלבד', () => {
    const today = '2026-08-05';
    // תרומה בקטגוריית הו"ק החודש ⇒ נרשמה
    expect(hokRecordedThisMonth(sup({ hok, donations: [{ rid: 'D-1', date: '2026-08-03', amount: 180, cur: '₪', cat: HOK_CAT }] }), today)).toBe(true);
    // תרומה בסכום-ההוראה בלי קטגוריה ⇒ נחשבת (המזכירה רשמה ידנית)
    expect(hokRecordedThisMonth(sup({ hok, donations: [{ rid: 'D-2', date: '2026-08-03', amount: 180, cur: '₪', cat: 'כללי' }] }), today)).toBe(true);
    // תרומה חד-פעמית בסכום אחר ⇒ לא מכסה את ההו"ק
    expect(hokRecordedThisMonth(sup({ hok, donations: [{ rid: 'D-3', date: '2026-08-03', amount: 500, cur: '₪', cat: 'כללי' }] }), today)).toBe(false);
    // חודש קודם ⇒ לא נחשב
    expect(hokRecordedThisMonth(sup({ hok, donations: [{ rid: 'D-4', date: '2026-07-10', amount: 180, cur: '₪', cat: HOK_CAT }] }), today)).toBe(false);
    // בלי הוראה ⇒ false
    expect(hokRecordedThisMonth(sup({}), today)).toBe(false);
  });

  it('hokDue: רק פעילות שטרם נרשמו, ממוינות לפי יום-החיוב; מושהית לא נספרת', () => {
    const a = sup({ id: 'a', name: 'א', hok: { ...hok, day: 20 } });
    const b = sup({ id: 'b', name: 'ב', hok: { ...hok, day: 5 } });
    const paused = sup({ id: 'c', name: 'ג', hok: { ...hok, active: false } });
    const done = sup({ id: 'd', name: 'ד', hok, donations: [{ rid: 'D-5', date: '2026-08-01', amount: 180, cur: '₪', cat: HOK_CAT }] });
    const due = hokDue([a, b, paused, done], '2026-08-05');
    expect(due.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('hokMonthlyTotal: ₪-שקול לפי השער העריך; מושהות לא נספרות', () => {
    const a = sup({ id: 'a', hok: { ...hok, amount: 100 } });
    const b = sup({ id: 'b', hok: { ...hok, amount: 50, cur: '$' } });
    const paused = sup({ id: 'c', hok: { ...hok, amount: 999, active: false } });
    expect(hokMonthlyTotal([a, b, paused], 4)).toBe(100 + 200);
  });

  it('🛡 חיווט למקום הנכון: תשומת-לב בבית · מבט-הנהלה · סינון וגריד · רישום-בקליק', () => {
    // בית: פריט מצטבר מגודר-דגל; הרישום = addDonation (קבלה בסדרה הרציפה!)
    expect(homeSrc).toMatch(/featureOn\(config, 'supporters\.hok'\)[\s\S]{0,200}hokDue/);
    expect(mgmtSrc).toMatch(/show\('supporters\.hok'\)[\s\S]{0,400}hokMonthlyTotal/);
    expect(detailSrc).toMatch(/recordHok[\s\S]{0,300}addDonation\(sp\.id, \{ date: isoToday\(\), amount: hok\.amount, cur: hok\.cur, cat: HOK_CAT \}\)/);
    expect(viewSrc).toContain("hokF === 'due'");
    expect(viewSrc).toContain('טרם נרשמו החודש');
  });
});
