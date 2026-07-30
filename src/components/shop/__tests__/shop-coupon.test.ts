/**
 * ratchet — תוקף קופונים (חנות 11, הכרעת בעלים 12).
 * couponExpiry: since+validDays, יום הגבול עצמו בתוקף (פג רק למחרת);
 * '' בלי since/validDays. needsCare: קופון שפקע וטרם מומש ⇒ couponExpired
 * (במקום couponPending); פג-ומומש לא מופיע. מיגרציה מרפאת validDays.
 */
import { describe, expect, it } from 'vitest';
import { couponExpiry, needsCare } from '../lib';
import { migrate } from '../../../store/persist';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopProduct, type ShopRedemption } from '../../../types/domain';

function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'cp1', itemId: '', kind: 'coupon', label: 'קופון ריהוט', storeId: '', value: 200, basePrice: 50, notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [], notes: '', ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '2026-06-01', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'shr1', componentId: 'cp1', date: '2026-06-15', holiday: '', paid: 0, value: 200, note: '', ...over };
}

describe('🎟 ratchet — חנות 11: תוקף קופונים', () => {
  it('couponExpiry: since+validDays; יום הגבול בתוקף, למחרת פג; חציית חודש נכונה', () => {
    const a = assignment({});
    const c = comp({ validDays: 30 });
    expect(couponExpiry(a, c)).toBe('2026-07-01'); // 1.6 + 30 יום
    const db: Db = { ...emptyDb(), shopProducts: [product({ components: [c] })], shopAssignments: [a] };
    // ביום הפקיעה עצמו — עדיין couponPending (בתוקף); למחרת — couponExpired
    expect(needsCare(db, '2026-07-01').map((x) => x.kind)).toContain('couponPending');
    expect(needsCare(db, '2026-07-01').map((x) => x.kind)).not.toContain('couponExpired');
    const after = needsCare(db, '2026-07-02');
    expect(after.map((x) => x.kind)).toContain('couponExpired');
    expect(after.map((x) => x.kind)).not.toContain('couponPending');
    expect(after.find((x) => x.kind === 'couponExpired')!.hint).toContain('2026-07-01');
  });

  it("couponExpiry: '' בלי validDays (או 0) ובלי since", () => {
    expect(couponExpiry(assignment({}), comp({}))).toBe('');
    expect(couponExpiry(assignment({}), comp({ validDays: 0 }))).toBe('');
    expect(couponExpiry(assignment({ since: '' }), comp({ validDays: 30 }))).toBe('');
  });

  it('פג-ומומש לא מופיע ברשימת הטיפול; שיוך לא-active לא מופיע', () => {
    const c = comp({ validDays: 10 });
    const db: Db = {
      ...emptyDb(),
      shopProducts: [product({ components: [c] })],
      shopAssignments: [
        assignment({ redemptions: [redemption({})] }),
        assignment({ id: 'sha2', status: 'stopped' }),
      ],
    };
    const kinds = needsCare(db, '2026-07-30').map((x) => x.kind);
    expect(kinds).not.toContain('couponExpired');
    expect(kinds).not.toContain('couponPending');
  });

  it('מיגרציה: validDays לא-סופי מוסר, שלילי → 0 — והתוקף עובר לפריט (SHOP4)', () => {
    const raw = {
      ...emptyDb(),
      shopProducts: [
        product({
          components: [
            comp({ id: 'c1', validDays: 'שנה' as unknown as number }),
            comp({ id: 'c2', validDays: -5 }),
            comp({ id: 'c3', validDays: 90 }),
          ],
        }),
      ],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    // מודל הפריטים (הכרעה 18): הריפוי רץ ואז התוקף עובר לפריט
    const itemFor = (compId: string) => {
      const c = out.shopProducts[0].components.find((x) => x.id === compId)!;
      expect('validDays' in c).toBe(false);
      return out.shopItems.find((i) => i.id === c.itemId)!;
    };
    expect('validDays' in itemFor('c1')).toBe(false);
    expect(itemFor('c2').validDays).toBe(0);
    expect(itemFor('c3').validDays).toBe(90);
  });
});
