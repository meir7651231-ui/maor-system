/**
 * ratchet — בחירת חגים למתנת-חג (חנות 18, הכרעת בעלים 17).
 * ShopItem.holidays — "מה מגיע" רק לחגים שנבחרו; ריק/חסר = כל החגים
 * (תאימות אחורה); holidayNames ממורש ומחזיר את כל שמות החגים.
 */
import { describe, expect, it } from 'vitest';
import { SHOP_HOLIDAY_DUE_DAYS, assignmentRedeemed, componentRedeemedNow, filterAssignments, holidayAllowed, holidayNames, needsCare, upcomingHolidays } from '../lib';
import { migrate } from '../../../store/persist';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopItem, type ShopProduct } from '../../../types/domain';
import tabSrc from '../AssignmentsTab.tsx?raw';
import panelSrc from '../ShopFamilyPanel.tsx?raw';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סל לחג', kind: 'holidayGift', storeId: '', value: 100, basePrice: 0, active: true, notes: '', ...over };
}
function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'hg1', itemId: 'shi1', kind: 'holidayGift', label: 'סל לחג', storeId: '', notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [comp({})], notes: '', ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}

describe('🕎 ratchet — חנות 18: חגים נבחרים', () => {
  it('holidayNames: כל שמות החגים, ייחודיים, כולל ראש השנה/פסח/חנוכה', () => {
    const names = holidayNames();
    expect(names).toContain('ראש השנה');
    expect(names).toContain('פסח');
    expect(names).toContain('חנוכה');
    expect(new Set(names).size).toBe(names.length);
  });

  it('נבחרו רק ראש השנה+פסח ⇒ holidayDue לא קם על חנוכה; החגים שנבחרו כן', () => {
    const db: Db = {
      ...emptyDb(),
      shopItems: [item({ holidays: ['ראש השנה', 'פסח'] })],
      shopProducts: [product({})],
      shopAssignments: [assignment({})],
    };
    // עוגן שבו חנוכה בטווח 30 יום (חנוכה תשפ"ז ≈ דצמבר 2026)
    const winter = needsCare(db, '2026-11-25').filter((x) => x.kind === 'holidayDue');
    expect(winter.some((x) => x.hint.includes('חנוכה'))).toBe(false);
    // עוגן שבו ראש השנה בטווח — כן קם
    const fall = needsCare(db, '2026-08-20').filter((x) => x.kind === 'holidayDue');
    expect(fall.some((x) => x.hint.includes('ראש השנה'))).toBe(true);
  });

  it('ריק/חסר = כל החגים (תאימות אחורה) + holidayAllowed', () => {
    const db: Db = {
      ...emptyDb(),
      shopItems: [item({})],
      shopProducts: [product({})],
      shopAssignments: [assignment({})],
    };
    const winter = needsCare(db, '2026-11-25').filter((x) => x.kind === 'holidayDue');
    expect(winter.some((x) => x.hint.includes('חנוכה'))).toBe(true);
    expect(holidayAllowed({}, 'חנוכה')).toBe(true);
    expect(holidayAllowed({ holidays: [] }, 'חנוכה')).toBe(true);
    expect(holidayAllowed({ holidays: ['פסח'] }, 'חנוכה')).toBe(false);
  });

  it('מיגרציה: holidays לא-מערך → מוסר (= כל החגים)', () => {
    const raw = { ...emptyDb(), shopItems: [{ ...item({}), holidays: 'הכל' as unknown as string[] }] };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect('holidays' in out.shopItems[0]).toBe(false);
  });
});

// ratchet — הבאג (swarm-audit): pendingCount/doneCount/פאנל-המשפחה קראו
// assignmentRedeemed בלי הקשר-חג ⇒ מתנת-חג שנמסרה פעם נחשבה ממומשת-לנצח:
// השיוך מוין אחרון, הוסתר ב"ממתינים בלבד" והציג '3/3' — בעוד needsCare
// (שבודק פר-חג-ושנה-עברית) התריע שהמתנה של השנה מגיעה.
describe('🔁 ratchet — מתנת-חג פר-שנה-עברית בספירות המימוש (swarm-audit)', () => {
  const twoYearDb = (): Db => ({
    ...emptyDb(),
    shopItems: [item({})],
    shopProducts: [product({})],
    shopAssignments: [
      assignment({
        // חנוכה ה׳תשפ"ו (דצמבר 2025) כבר נמסרה — השנה (ה׳תשפ"ז) עדיין לא
        redemptions: [{ id: 'r1', componentId: 'hg1', date: '2025-12-20', holiday: 'חנוכה', paid: 0, value: 100, note: '' }],
      }),
    ],
  });
  const TODAY = '2026-11-25'; // חנוכה תשפ"ז בטווח 30 הימים

  it('componentRedeemedNow: מימוש אשתקד ≠ מומש לחג של השנה; בלי holidays — ההתנהגות ההיסטורית', () => {
    const db = twoYearDb();
    const a = db.shopAssignments[0];
    const c = db.shopProducts[0].components[0];
    const hols = upcomingHolidays(TODAY, SHOP_HOLIDAY_DUE_DAYS);
    expect(hols.some((h) => h.name === 'חנוכה')).toBe(true);
    expect(componentRedeemedNow(db, a, c, hols)).toBe(false); // המתנה של השנה ממתינה
    expect(componentRedeemedNow(db, a, c)).toBe(true); // בלי הקשר-חג — כמו היום
    expect(assignmentRedeemed(a, c.id)).toBe(true); // ההתנהגות הישנה שגרמה לבאג
  });

  it('filterAssignments עם todayIso: השיוך לא מוסתר ב"ממתינים בלבד"', () => {
    const db = twoYearDb();
    // בלי todayIso — ההתנהגות ההיסטורית (מומש-לנצח ⇒ מוסתר) נשמרת לקוראים ישנים
    expect(filterAssignments(db, '', '', true, '', 'pending')).toHaveLength(0);
    // עם todayIso — המתנה של השנה ממתינה ⇒ השיוך מוצג
    expect(filterAssignments(db, '', '', true, '', 'pending', TODAY).map((x) => x.id)).toEqual(['sha1']);
  });

  it('הגנת-מקור: ספירות-הכרטיסים והסינון עוברים דרך componentRedeemedNow עם החגים', () => {
    expect(tabSrc).toContain('componentRedeemedNow(db, a, c, dueHolidays)');
    expect(tabSrc).toContain("filterAssignments(db, q, status, pendingOnly, productFilter, sort, isoToday())");
    expect(panelSrc).toContain('componentRedeemedNow(db, a, c, dueHolidays)');
  });
});
