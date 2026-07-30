/**
 * ratchet — מיזוג פריטים כפולים (חנות 22, הכרעת בעלים 21).
 * המלאי מתחבר (ברירת ארכיטקט — שניהם אמיתיים), הרכיבים בכל החבילות
 * מוסבים, המימושים לעולם לא נמחקים; kinds שונים/עצמי — חסומים.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { itemRemaining } from '../lib';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type ShopAssignment, type ShopComponent, type ShopItem, type ShopProduct, type ShopRedemption } from '../../../types/domain';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, active: true, notes: '', ...over };
}
function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'shpc1', itemId: 'shi1', kind: 'gift', label: 'סט תפילין', storeId: '', notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [], notes: '', ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'shr1', componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 0, value: 200, note: '', ...over };
}

describe('⇄ ratchet — חנות 22: מיזוג פריטים', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [item({ id: 'target', name: 'סט תפילין', stock: 3 }), item({ id: 'source', name: 'סט תפלין (כפול)', stock: 2 })],
      shopProducts: [
        product({ id: 'shp1', components: [comp({ id: 'c1', itemId: 'target' })] }),
        product({ id: 'shp2', name: 'מוצר בר-מצווה', components: [comp({ id: 'c2', itemId: 'source' })] }),
      ],
      shopAssignments: [
        assignment({ id: 'a1', productId: 'shp1', redemptions: [redemption({ componentId: 'c1' })] }),
        assignment({ id: 'a2', productId: 'shp2', redemptions: [redemption({ id: 'shr2', componentId: 'c2' })] }),
      ],
    }));
  });

  it('מיזוג 3+2 עם מימוש בכל אחד ⇒ הנותר 3 (5−2); הרכיבים בשתי החבילות הוסבו; המימושים נשמרו', () => {
    expect(useApp.getState().mergeShopItems('target', 'source')).toBe(true);
    const db = useApp.getState().db;
    expect(db.shopItems).toHaveLength(1);
    expect(db.shopItems[0].stock).toBe(5);
    // כל הרכיבים מצביעים על היעד — בשתי החבילות
    for (const p of db.shopProducts) for (const c of p.components) expect(c.itemId).toBe('target');
    // המימושים לא נגעו (componentId נשאר) — והנותר המשותף נספר נכון
    expect(db.shopAssignments.flatMap((a) => a.redemptions)).toHaveLength(2);
    expect(itemRemaining(db, 'target')).toBe(3);
  });

  it('מלאי: אחד עם מעקב ואחד בלי ⇒ סכום; שניהם בלי ⇒ נשאר בלי מעקב', () => {
    useApp.getState().setDb((db) => ({
      shopItems: db.shopItems.map((x) => (x.id === 'source' ? { ...x, stock: undefined } : x)),
    }));
    useApp.getState().mergeShopItems('target', 'source');
    expect(useApp.getState().db.shopItems[0].stock).toBe(3); // 3 + (בלי מעקב = 0)
    // סבב שני — שניהם בלי מעקב
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [item({ id: 't2' }), item({ id: 's2', name: 'כפול' })],
    }));
    useApp.getState().mergeShopItems('t2', 's2');
    expect(useApp.getState().db.shopItems[0].stock).toBeUndefined();
  });

  it('חסימות: kinds שונים · מיזוג-עצמי · פריט חסר — בלי שינוי', () => {
    useApp.getState().setDb((db) => ({
      shopItems: db.shopItems.map((x) => (x.id === 'source' ? { ...x, kind: 'coupon' } : x)),
    }));
    const before = useApp.getState().db;
    expect(useApp.getState().mergeShopItems('target', 'source')).toBe(false); // סוגים שונים
    expect(useApp.getState().mergeShopItems('target', 'target')).toBe(false); // עצמי
    expect(useApp.getState().mergeShopItems('target', 'אין')).toBe(false); // חסר
    expect(useApp.getState().db).toEqual(before);
  });
});
