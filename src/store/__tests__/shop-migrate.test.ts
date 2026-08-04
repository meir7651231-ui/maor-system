/**
 * ratchet — שכבת הנתונים של החנות (חנות 1, BUILD-ORDER-SHOP).
 * תוספת אדיטיבית: DB_VERSION נשאר 5 — גיבוי ישן בלי מערכי shop נטען עם [];
 * migrate מרפא components/redemptions/criterionIds/status/discountPct;
 * cloud-diff/merge מכירים בחמשת האוספים כולל הגנת המערכים המקוננים.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { diffDb, ENTITY_COLLECTIONS } from '../../lib/cloud-diff';
import { applyEntityPartial } from '../../lib/cloud-merge';
import { DB_VERSION, emptyDb, type Db, type ShopAssignment, type ShopCriterion } from '../../types/domain';

function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function criterion(over: Partial<ShopCriterion>): ShopCriterion {
  return { id: 'shc1', name: 'יתום מאם', discountPct: 50, notes: '', ...over };
}

describe('🛍 ratchet — חנות 1: מיגרציה אדיטיבית (DB_VERSION נשאר 5)', () => {
  it('(א) גיבוי ישן בלי מערכי shop — נטען עם [] לחמשתם', () => {
    const old = { ...emptyDb(), v: DB_VERSION } as Record<string, unknown>;
    delete old.shopProducts;
    delete old.shopStores;
    delete old.shopCriteria;
    delete old.shopAssignments;
    delete old.shopEvents;
    const out = migrate(old)!;
    expect(out.shopProducts).toEqual([]);
    expect(out.shopStores).toEqual([]);
    expect(out.shopCriteria).toEqual([]);
    expect(out.shopAssignments).toEqual([]);
    expect(out.shopEvents).toEqual([]);
    expect(out.v).toBe(6);
  });

  it('(ב) שיוך בלי redemptions/criterionIds ועם סטטוס זר — נרפא ([] + active)', () => {
    const raw = {
      ...emptyDb(),
      shopAssignments: [{ ...assignment({}), redemptions: null as unknown as [], criterionIds: undefined as unknown as [], status: 'paused' as unknown as 'active' }],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopAssignments[0].redemptions).toEqual([]);
    expect(out.shopAssignments[0].criterionIds).toEqual([]);
    expect(out.shopAssignments[0].status).toBe('active');
  });

  it('(ג) קריטריון עם discountPct מושחת — NaN נרפא ל-0, ‏150 נחתך ל-100', () => {
    const raw = {
      ...emptyDb(),
      shopCriteria: [
        { ...criterion({}), discountPct: NaN },
        { ...criterion({ id: 'shc2', name: 'יתום מאבא' }), discountPct: 150 },
      ],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopCriteria[0].discountPct).toBe(0);
    expect(out.shopCriteria[1].discountPct).toBe(100);
  });

  it('(ד) מוצר בלי components — נרפא ל-[]', () => {
    const raw = {
      ...emptyDb(),
      shopProducts: [{ id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: undefined as unknown as [], notes: '' }],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopProducts[0].components).toEqual([]);
  });

  it('(ה) cloud-diff מזהה set ו-delete ב-shopAssignments', () => {
    expect(ENTITY_COLLECTIONS).toContain('shopAssignments');
    const prev: Db = { ...emptyDb(), shopAssignments: [assignment({ id: 'sha1' }), assignment({ id: 'sha2', famId: 'f2' })] };
    const next: Db = { ...emptyDb(), shopAssignments: [{ ...assignment({ id: 'sha1' }), status: 'done' }] };
    const d = diffDb(prev, next);
    expect(d.sets.some((s) => s.col === 'shopAssignments' && s.id === 'sha1')).toBe(true);
    expect(d.deletes.some((x) => x.col === 'shopAssignments' && x.id === 'sha2')).toBe(true);
  });

  it('(ו) applyEntityPartial על shopProducts בלי components — מקבל מערך ריק (LIST_FIELDS)', () => {
    const db: Db = { ...emptyDb() };
    const out = applyEntityPartial(db, 'shopProducts', [
      { id: 'shp9', data: { name: 'מוצר כלה', desc: '', active: true, notes: '' }, deleted: false },
    ]);
    const p = out.shopProducts.find((x) => x.id === 'shp9')!;
    expect(Array.isArray(p.components)).toBe(true);
    expect(p.components).toEqual([]);
  });

  // ציד-באגים 3.8.2026 (🟡): דדופ S- דטרמיניסטי — כמו R-/D- (planRidRenumber),
  // המימוש המוקדם-בתאריך שומר על מספר-האישור בלי תלות בסדר-המערך (מרוץ בין-מכשירי).
  it('(S-דדופ) שתי רשומות עם אותו S- — המוקדם שומר, בשני סדרי-המערך', () => {
    const red = (id: string, rid: string, date: string) =>
      ({ id, rid, componentId: 'c1', date, holiday: '', paid: 10, value: 10, note: '' }) as const;
    const build = (order: 'fwd' | 'rev') => {
      const reds =
        order === 'fwd'
          ? [red('rA', 'S-5', '2026-03-10'), red('rB', 'S-5', '2026-01-05')] // מאוחר, מוקדם
          : [red('rB', 'S-5', '2026-01-05'), red('rA', 'S-5', '2026-03-10')]; // מוקדם, מאוחר
      const db = { ...emptyDb(), v: DB_VERSION, shopReceiptSeq: 9, shopAssignments: [assignment({ redemptions: reds })] } as Record<string, unknown>;
      return migrate(db)!;
    };
    for (const order of ['fwd', 'rev'] as const) {
      const out = build(order);
      const reds = out.shopAssignments[0].redemptions;
      const early = reds.find((r) => r.id === 'rB')!; // 2026-01-05 — המוקדם
      const late = reds.find((r) => r.id === 'rA')!; // 2026-03-10 — המאוחר
      expect(early.rid).toBe('S-5'); // המוקדם שומר על מספרו, ללא תלות בסדר
      expect(late.rid).toBe('S-9'); // המאוחר ממוספר מחדש מעל המונה
    }
  });
});
