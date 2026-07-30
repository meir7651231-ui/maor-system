/**
 * ratchet — בחירת חגים למתנת-חג (חנות 18, הכרעת בעלים 17).
 * ShopItem.holidays — "מה מגיע" רק לחגים שנבחרו; ריק/חסר = כל החגים
 * (תאימות אחורה); holidayNames ממורש ומחזיר את כל שמות החגים.
 */
import { describe, expect, it } from 'vitest';
import { holidayAllowed, holidayNames, needsCare } from '../lib';
import { migrate } from '../../../store/persist';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopItem, type ShopProduct } from '../../../types/domain';

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
