/**
 * ratchet — מלאי לרכיבים (חנות 9, הכרעת בעלים 10).
 * componentRemaining: null בלי מעקב; הצריכה במימושים על-פני כל שיוכי
 * המוצר; קטימה ב-0. needsCare מקבל stockOut; מיגרציה מרפאת stock מושחת.
 */
import { describe, expect, it } from 'vitest';
import { componentRemaining, needsCare } from '../lib';
import { migrate } from '../../../store/persist';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopProduct, type ShopRedemption } from '../../../types/domain';

function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'shpc1', kind: 'gift', label: 'מתנה', storeId: '', value: 200, basePrice: 50, notes: '', ...over };
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

describe('🛍 ratchet — חנות 9: מלאי לרכיבים', () => {
  it('componentRemaining: שני שיוכים לאותו מוצר נצרכים מאותו מלאי; null בלי מעקב; קטימה ב-0', () => {
    const list = [
      assignment({ id: 'a1', redemptions: [redemption({}), redemption({ id: 'shr2' })] }),
      assignment({ id: 'a2', redemptions: [redemption({ id: 'shr3' })] }),
      // שיוך למוצר אחר — לא נספר
      assignment({ id: 'a3', productId: 'shp9', redemptions: [redemption({ id: 'shr4' })] }),
    ];
    expect(componentRemaining('shpc1', 'shp1', list, 5)).toBe(2);
    expect(componentRemaining('shpc1', 'shp1', list, undefined)).toBeNull();
    expect(componentRemaining('shpc1', 'shp1', list, 2)).toBe(0); // 3 מימושים > 2 — קטום, לא שלילי
  });

  it('needsCare: רכיב עם מעקב שאזל ⇒ stockOut (assignmentId ריק); מוצר לא-פעיל/בלי מעקב — לא', () => {
    const db: Db = {
      ...emptyDb(),
      shopProducts: [
        product({ components: [comp({ id: 'tracked', stock: 1 }), comp({ id: 'untracked' })] }),
        product({ id: 'shp2', active: false, components: [comp({ id: 'off', stock: 0 })] }),
      ],
      shopAssignments: [assignment({ redemptions: [redemption({ componentId: 'tracked' })] })],
    };
    const items = needsCare(db, '2026-06-01');
    const outs = items.filter((x) => x.kind === 'stockOut');
    expect(outs).toHaveLength(1);
    expect(outs[0].componentId).toBe('tracked');
    expect(outs[0].assignmentId).toBe('');
  });

  it('מיגרציה: stock לא-סופי מוסר (בלי מעקב); שלילי → 0', () => {
    const raw = {
      ...emptyDb(),
      shopProducts: [
        product({
          components: [
            comp({ id: 'c1', stock: 'הרבה' as unknown as number }),
            comp({ id: 'c2', stock: -3 }),
            comp({ id: 'c3', stock: 4 }),
            comp({ id: 'c4' }),
          ],
        }),
      ],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    const [c1, c2, c3, c4] = out.shopProducts[0].components;
    expect('stock' in c1).toBe(false);
    expect(c2.stock).toBe(0);
    expect(c3.stock).toBe(4);
    expect(c4.stock).toBeUndefined();
  });
});
