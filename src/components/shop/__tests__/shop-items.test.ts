/**
 * ratchet — פריטים עם מלאי משותף (חנות 17, הכרעה 18 — קריאה ב׳).
 * פריט אחד בשתי חבילות ⇒ מלאי אחד; דריסת מחיר פר-חבילה; מיגרציית
 * רכיבים→פריטים משמרת מלאי ומימושים (כולל כפל-ריצה); ענן round-trip.
 */
import { describe, expect, it } from 'vitest';
import { itemOf, itemRemaining } from '../lib';
import { migrate } from '../../../store/persist';
import { diffDb, ENTITY_COLLECTIONS } from '../../../lib/cloud-diff';
import { applyEntityPartial } from '../../../lib/cloud-merge';
import {
  emptyDb,
  type Db,
  type ShopAssignment,
  type ShopComponent,
  type ShopItem,
  type ShopProduct,
  type ShopRedemption,
} from '../../../types/domain';

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
  return { id: 'shr1', componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 50, value: 200, note: '', ...over };
}

describe('🛍 ratchet — חנות 17: פריטים עם מלאי משותף', () => {
  it('לב הכרעה 18: פריט בשתי חבילות — מימוש בכל אחת יורד מאותו מלאי', () => {
    const db: Db = {
      ...emptyDb(),
      shopItems: [item({ stock: 5 })],
      shopProducts: [
        product({ id: 'shp1', components: [comp({ id: 'c-in-1' })] }),
        product({ id: 'shp2', name: 'מוצר בר-מצווה', components: [comp({ id: 'c-in-2' })] }),
      ],
      shopAssignments: [
        assignment({ id: 'a1', productId: 'shp1', redemptions: [redemption({ componentId: 'c-in-1' })] }),
        assignment({ id: 'a2', productId: 'shp2', redemptions: [redemption({ id: 'shr2', componentId: 'c-in-2' })] }),
      ],
    };
    expect(itemRemaining(db, 'shi1')).toBe(3); // 5 − מימוש בכל חבילה
    // מימוש מבוטל חוזר למלאי (liveRedemptions)
    const withVoid: Db = {
      ...db,
      shopAssignments: db.shopAssignments.map((a) =>
        a.id === 'a2' ? { ...a, redemptions: a.redemptions.map((r) => ({ ...r, voidedAt: '2026-07-30' })) } : a,
      ),
    };
    expect(itemRemaining(withVoid, 'shi1')).toBe(4);
  });

  it('דריסת מחיר/שווי פר-חבילה — itemOf: דריסה מנצחת, ריק = ברירת הפריט', () => {
    const db: Db = { ...emptyDb(), shopItems: [item({})] };
    expect(itemOf(db, comp({}))).toMatchObject({ name: 'סט תפילין', value: 200, basePrice: 50 });
    expect(itemOf(db, comp({ value: 300, basePrice: 10 }))).toMatchObject({ value: 300, basePrice: 10 });
    // מצביע שבור/טרום-מיגרציה — נופל לשדות הרכיב
    expect(itemOf(db, comp({ itemId: '', label: 'ישן', value: 70, basePrice: 7 }))).toMatchObject({ name: 'ישן', value: 70, basePrice: 7 });
  });

  it('מיגרציה: נתוני SHOP קיימים עם מלאי ומימושים — המלאי נשמר והמימושים נספרים; כפל-ריצה לא יוצר כפולים', () => {
    // נתוני עבר: רכיב בלי itemId עם מלאי 3 ומימוש אחד (המודל הישן)
    const legacyComp = { id: 'shpc9', itemId: '', kind: 'gift', label: 'מתנה ותיקה', storeId: '', value: 150, basePrice: 20, stock: 3, notes: '' };
    const raw = {
      ...emptyDb(),
      shopProducts: [product({ components: [legacyComp as unknown as ShopComponent] })],
      shopAssignments: [assignment({ redemptions: [redemption({ componentId: 'shpc9' })] })],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopItems).toHaveLength(1);
    const mig = out.shopItems[0];
    expect(mig).toMatchObject({ name: 'מתנה ותיקה', kind: 'gift', value: 150, basePrice: 20, stock: 3, active: true });
    const c = out.shopProducts[0].components[0];
    expect(c.itemId).toBe(mig.id);
    expect('stock' in c).toBe(false);
    // המימושים עדיין נספרים — הנותר 3−1=2 בדיוק כמו לפני המעבר
    expect(itemRemaining(out, mig.id)).toBe(2);
    // כפל-ריצה: migrate על התוצאה — אפס פריטים חדשים, אותו itemId
    const again = migrate(out as unknown as Record<string, unknown>)!;
    expect(again.shopItems).toHaveLength(1);
    expect(again.shopProducts[0].components[0].itemId).toBe(mig.id);
    expect(itemRemaining(again, mig.id)).toBe(2);
  });

  it('ענן: shopItems באוספים (18 מאז SHOP6 — shopIntakes), diff set/delete ו-round-trip דרך applyEntityPartial', () => {
    expect(ENTITY_COLLECTIONS).toContain('shopItems');
    // ‏17→18: קליטות המלאי (SHOP6 חנות 25) — עדכון ratchet מתועד במנדט
    expect(ENTITY_COLLECTIONS).toHaveLength(21);
    expect(ENTITY_COLLECTIONS).toContain('shopIntakes');
    const prev: Db = { ...emptyDb(), shopItems: [item({}), item({ id: 'shi2', name: 'ישן' })] };
    const next: Db = { ...emptyDb(), shopItems: [item({ stock: 9 })] };
    const d = diffDb(prev, next);
    expect(d.sets.some((s) => s.col === 'shopItems' && s.id === 'shi1')).toBe(true);
    expect(d.deletes.some((x) => x.col === 'shopItems' && x.id === 'shi2')).toBe(true);
    const merged = applyEntityPartial(emptyDb(), 'shopItems', [
      { id: 'shi7', data: { name: 'מרוחק', kind: 'gift', storeId: '', value: 10, basePrice: 5, active: true, notes: '' }, deleted: false },
    ]);
    expect(merged.shopItems.find((x) => x.id === 'shi7')?.name).toBe('מרוחק');
  });
});
