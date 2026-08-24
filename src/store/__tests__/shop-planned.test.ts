/**
 * ratchet — חיובים-מתוכננים על שיוך-חנות (בקשת-בעלים 25.8).
 * chargeShopPlanned יוצר ShopRedemption עם S- דרך addShopRedemption המקורי.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, ShopAssignment, ShopProduct } from '../../types/domain';

function mkProduct(): ShopProduct {
  return {
    id: 'prod1', name: 'קופון-חתונה', desc: '', description: '', notes: '', kind: 'coupon', active: true,
    components: [{ id: 'cmp1', kind: 'coupon', name: 'קופון', basePrice: 500, value: 500, stock: 100 }] as never,
  } as unknown as ShopProduct;
}
function mkAssign(): ShopAssignment {
  return {
    id: 'a1', productId: 'prod1', famId: 'f1', memberId: '',
    criterionIds: [], since: '2026-01-01', status: 'active', notes: '', redemptions: [],
  } as ShopAssignment;
}
function seed(): Db {
  return {
    ...emptyDb(),
    shopReceiptSeq: 50,
    families: [{ id: 'f1', name: 'לוי', members: [{ id: 'm1', first: 'נועה' }] }] as never,
    shopProducts: [mkProduct()],
    shopAssignments: [mkAssign()],
  } as Db;
}
const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('📅 ratchet — חיובים-מתוכננים על שיוך-חנות (store)', () => {
  it('addShopPlanned יוצר 3 שורות עם componentId; shopReceiptSeq יציב', () => {
    const r = useApp.getState().addShopPlanned('a1', {
      componentId: 'cmp1', firstDate: '2026-10-01', count: 3, amount: 150, method: 'אשראי',
    });
    expect(r.ok).toBe(true);
    expect(r.ids).toHaveLength(3);
    const a = db().shopAssignments.find((x) => x.id === 'a1')!;
    expect(a.plannedCharges).toHaveLength(3);
    expect(a.plannedCharges!.map((p) => p.date)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
    expect(a.plannedCharges!.every((p) => p.componentId === 'cmp1')).toBe(true);
    // shopReceiptSeq **לא** התקדם — הפלנים לא-S-:
    expect(db().shopReceiptSeq).toBe(50);
  });

  it('cancelShopPlanned מסמן cancelledAt; no-op על-כבר-בוטל', () => {
    const r = useApp.getState().addShopPlanned('a1', {
      componentId: 'cmp1', firstDate: '2026-10-01', count: 1, amount: 150, method: 'אשראי',
    });
    const c1 = useApp.getState().cancelShopPlanned('a1', r.ids![0], '2026-09-20');
    expect(c1.ok).toBe(true);
    const c2 = useApp.getState().cancelShopPlanned('a1', r.ids![0], '2026-09-21');
    expect(c2.ok).toBe(false);
  });

  it('chargeShopPlanned יוצר ShopRedemption עם S- אמיתי + מקשר chargedRid', () => {
    const r = useApp.getState().addShopPlanned('a1', {
      componentId: 'cmp1', firstDate: '2026-10-01', count: 1, amount: 150, method: 'אשראי',
      shopValue: 500,
    });
    const seq0 = db().shopReceiptSeq;
    const ch = useApp.getState().chargeShopPlanned('a1', r.ids![0]);
    expect(ch.ok).toBe(true);
    expect(ch.rid).toBe('S-' + seq0);
    expect(db().shopReceiptSeq).toBe(seq0 + 1);
    // ShopRedemption נוצר:
    const a = db().shopAssignments.find((x) => x.id === 'a1')!;
    expect(a.redemptions).toHaveLength(1);
    expect(a.redemptions[0].paid).toBe(150);
    expect(a.redemptions[0].value).toBe(500);
    expect(a.redemptions[0].componentId).toBe('cmp1');
    expect(a.redemptions[0].rid).toBe('S-' + seq0);
    // הפלן מקושר:
    const pl = a.plannedCharges!.find((p) => p.id === r.ids![0])!;
    expect(pl.chargedRid).toBe('S-' + seq0);
    // אידמפוטנטי:
    const ch2 = useApp.getState().chargeShopPlanned('a1', r.ids![0]);
    expect(ch2.rid).toBe('S-' + seq0);
    expect(db().shopReceiptSeq).toBe(seq0 + 1);
    expect(a.redemptions).toHaveLength(1);
  });

  it('RedeemModal.save: אשראי + דגל דלוק ⇒ מסלול-חיוב-מתוכנן (הגנת-מקור)', async () => {
    const src = await import('../../components/shop/RedeemModal.tsx?raw').then((m) => (m as { default: string }).default);
    expect(src).toContain('addShopPlanned');
    expect(src).toMatch(/shopPlannedOn && method === 'credit'/);
    expect(src).toContain("componentId: c.id");
    expect(src).toContain('ממתין לחיוב-נכנס');
  });
});
