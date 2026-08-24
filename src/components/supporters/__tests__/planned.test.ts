/**
 * ratchet — חיובים-מתוכננים בתומכים (בקשת-בעלים 25.8).
 * מנוע-טהור: זריעת-פריסה, סופרי-פתוחים פר-מטבע, קלמפ יום-האחרון-בחודש,
 * סינון-פעילים (לא-חויבו + לא-בוטלו).
 */
import { describe, expect, it } from 'vitest';
import type { PlannedCharge, Supporter } from '../../../types/domain';
import {
  addMonthsClamped,
  isOpenPlan,
  nextUpcomingPlan,
  openPlans,
  overduePlans,
  pendingIls,
  pendingUsd,
  planCharges,
  plannedNextDate,
} from '../planned';

function mkSup(over: Partial<Supporter> = {}): Supporter {
  return {
    id: 's1', name: 'מבחן', phone: '', email: '', address: '', idNum: '',
    cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0,
    first: '', last: '', nextDate: '', donations: [], ...over,
  } as Supporter;
}
function pc(over: Partial<PlannedCharge> = {}): PlannedCharge {
  return { id: 'p1', date: '2026-10-01', amount: 400, cur: '₪', method: 'credit', cat: '', ...over };
}

describe('📅 ratchet — חיובים-מתוכננים בתומכים (25.8)', () => {
  it('isOpenPlan: פעיל = לא-חויב-עדיין ולא-בוטל', () => {
    expect(isOpenPlan(pc())).toBe(true);
    expect(isOpenPlan(pc({ chargedRid: 'D-9' }))).toBe(false);       // חויב
    expect(isOpenPlan(pc({ cancelledAt: '2026-09-15' }))).toBe(false); // בוטל
    expect(isOpenPlan(pc({ chargedRid: 'D-9', cancelledAt: '2026-09-15' }))).toBe(false);
  });

  it('openPlans מסנן חסרי/מבוטלים; pendingIls/pendingUsd סופר פר-מטבע', () => {
    const sup = mkSup({
      plannedCharges: [
        pc({ id: 'a', amount: 400, cur: '₪' }),
        pc({ id: 'b', amount: 200, cur: '₪', chargedRid: 'D-1' }), // כבר חויב ⇒ לא נספר
        pc({ id: 'c', amount: 100, cur: '$' }),
        pc({ id: 'd', amount: 300, cur: '₪', cancelledAt: '2026-09-10' }), // בוטל ⇒ לא נספר
        pc({ id: 'e', amount: 50, cur: '$' }),
      ],
    });
    expect(openPlans(sup).map((p) => p.id).sort()).toEqual(['a', 'c', 'e']);
    expect(pendingIls(sup)).toBe(400);
    expect(pendingUsd(sup)).toBe(150);
  });

  it('plannedNextDate: התאריך המוקדם-ביותר של הפתוחים', () => {
    const sup = mkSup({
      plannedCharges: [
        pc({ id: 'a', date: '2027-01-15' }),
        pc({ id: 'b', date: '2026-11-05', chargedRid: 'D-1' }), // מוקדם אך חויב ⇒ לא נחשב
        pc({ id: 'c', date: '2026-12-01' }),
      ],
    });
    expect(plannedNextDate(sup)).toBe('2026-12-01');
    // תומך בלי פלנים: '':
    expect(plannedNextDate(mkSup())).toBe('');
  });

  it('overduePlans + nextUpcomingPlan: איחור מול קרוב-עתידי', () => {
    const today = '2026-11-10';
    const sup = mkSup({
      plannedCharges: [
        pc({ id: 'a', date: '2026-11-01' }), // איחור (11 יום)
        pc({ id: 'b', date: '2026-12-01' }), // עתידי
        pc({ id: 'c', date: '2027-01-01' }), // עתידי-רחוק
      ],
    });
    expect(overduePlans(sup, today).map((p) => p.id)).toEqual(['a']);
    expect(nextUpcomingPlan(sup, today)?.id).toBe('b');
    // אין עתידי: undefined
    expect(nextUpcomingPlan(mkSup({ plannedCharges: [pc({ date: '2026-01-01' })] }), today)).toBeUndefined();
  });

  it('addMonthsClamped: 31.1 + 1 = 28.2 (לא 3.3, לא בורח)', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29'); // מעוברת
    expect(addMonthsClamped('2026-05-15', 3)).toBe('2026-08-15');
    // גם 30.4 + 1: מאי יש 31 יום, אבל נשאר 30 (min):
    expect(addMonthsClamped('2026-04-30', 1)).toBe('2026-05-30');
    // חצייה של-שנה:
    expect(addMonthsClamped('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('planCharges: 3 תשלומים בפערי-חודש אחיד + groupId', () => {
    const plans = planCharges({
      firstDate: '2026-10-01',
      count: 3,
      amount: 400,
      cur: '₪',
      method: 'credit',
      cat: 'סליקה',
      groupId: 'grp-abc',
      ids: ['pc_1', 'pc_2', 'pc_3'],
    });
    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.date)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
    expect(plans.map((p) => p.amount)).toEqual([400, 400, 400]);
    expect(plans.map((p) => p.installmentOf)).toEqual(['grp-abc', 'grp-abc', 'grp-abc']);
    expect(plans.map((p) => p.id)).toEqual(['pc_1', 'pc_2', 'pc_3']);
    expect(plans.every((p) => p.method === 'credit' && p.cur === '₪' && p.cat === 'סליקה')).toBe(true);
    // כולם ממתינים (אף אחד לא חויב/בוטל):
    expect(plans.every(isOpenPlan)).toBe(true);
  });

  it('planCharges: gapMonths=2 מייצר תשלום כל חודשיים', () => {
    const plans = planCharges({
      firstDate: '2026-10-01', count: 3, amount: 100, cur: '₪',
      method: 'bank', cat: '', groupId: 'g', gapMonths: 2, ids: ['a', 'b', 'c'],
    });
    expect(plans.map((p) => p.date)).toEqual(['2026-10-01', '2026-12-01', '2027-02-01']);
  });
});
