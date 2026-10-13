/**
 * ratchet — חיפוש/סינון/מיון בחנות (UX סינון 2).
 * כל הלוגיקה טהורה ב-lib (smartFilter); 'pending' ממיין ותיק-ממתין ראשון
 * וממומש-כולו אחרון; מבוטל = ממתין (liveRedemptions); moduleOn על הקישור.
 */
import { describe, expect, it } from 'vitest';
import { filterAssignments, filterItems, filterProducts, filterRedemptions } from '../lib';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopItem, type ShopProduct, type ShopRedemption } from '../../../types/domain';
import tabSrc from '../AssignmentsTab.tsx?raw';
import catalogSrc from '../CatalogTab.tsx?raw';
import itemsSrc from '../ItemsPanel.tsx?raw';
import calSrc from '../CalendarTab.tsx?raw';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, active: true, notes: '', ...over };
}
function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'c1', itemId: 'shi1', kind: 'gift', label: 'סט תפילין', storeId: '', notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: 'חבילת ליווי', active: true, notes: '', components: [comp({})], ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '2026-06-01', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'r1', componentId: 'c1', date: '2026-07-05', holiday: '', paid: 0, value: 200, note: '', ...over };
}

const db: Db = {
  ...emptyDb(),
  families: [
    { id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number],
    { id: 'f2', name: 'לוינשטיין', members: [] } as unknown as Db['families'][number],
  ],
  shopItems: [item({})],
  shopProducts: [product({})],
  shopAssignments: [
    // ותיק וממומש-כולו ⇒ אחרון במיון pending
    assignment({ id: 'done-old', famId: 'f1', since: '2026-01-01', redemptions: [redemption({})] }),
    // ממתין חדש
    assignment({ id: 'pending-new', famId: 'f2', since: '2026-07-01' }),
    // ממתין ותיק ⇒ ראשון
    assignment({ id: 'pending-old', famId: 'f1', since: '2026-03-01' }),
  ],
};

describe('🔍 ratchet — סינון 2: חנות', () => {
  it("'pending': ותיק-ממתין ראשון, ממומש-כולו אחרון (ratchet מהפקודה)", () => {
    const out = filterAssignments(db, '', '', false, '', 'pending');
    expect(out.map((a) => a.id)).toEqual(['pending-old', 'pending-new', 'done-old']);
    // "ממתינים בלבד" מסתיר את הממומש-כולו
    expect(filterAssignments(db, '', '', true, '', 'pending').map((a) => a.id)).toEqual(['pending-old', 'pending-new']);
  });

  it('מבוטל = ממתין: ביטול המימוש מחזיר את השיוך לרשימת הממתינים', () => {
    const withVoid: Db = {
      ...db,
      shopAssignments: db.shopAssignments.map((a) =>
        a.id === 'done-old' ? { ...a, redemptions: a.redemptions.map((r) => ({ ...r, voidedAt: '2026-07-10' })) } : a,
      ),
    };
    expect(filterAssignments(withVoid, '', '', true, '', 'pending').map((a) => a.id)).toContain('done-old');
  });

  it('q על משפחה/חבילה עם שגיאת-כתיב (smartFilter); סטטוס וחבילה מסננים', () => {
    expect(filterAssignments(db, 'לוינשטין', '', false, '', 'name').map((a) => a.id)).toEqual(['pending-new']);
    expect(filterAssignments(db, 'מוצר חתן', '', false, '', 'pending')).toHaveLength(3);
    expect(filterAssignments(db, '', 'done', false, '', 'pending')).toHaveLength(0);
    expect(filterAssignments(db, '', '', false, 'shp1', 'pending')).toHaveLength(3);
    expect(filterAssignments(db, '', '', false, 'אחר', 'pending')).toHaveLength(0);
  });

  it('filterProducts (שם/תיאור, פעילות) · filterItems (מצב מלאי)', () => {
    const products = [product({}), product({ id: 'shp2', name: 'מוצר כלה', desc: '', active: false })];
    expect(filterProducts(products, 'ליווי', false).map((p) => p.id)).toEqual(['shp1']);
    expect(filterProducts(products, '', true)).toHaveLength(1);
    const stockDb: Db = {
      ...db,
      shopItems: [
        item({ id: 'out', name: 'אזל', stock: 0 }),
        item({ id: 'low', name: 'נמוך', stock: 2 }),
        item({ id: 'full', name: 'מלא', stock: 9 }),
        item({ id: 'untracked', name: 'חופשי' }),
      ],
      shopAssignments: [],
    };
    expect(filterItems(stockDb, '', 'out').map((i) => i.id)).toEqual(['out']);
    expect(filterItems(stockDb, '', 'low').map((i) => i.id)).toEqual(['low']);
    expect(filterItems(stockDb, '', 'untracked').map((i) => i.id)).toEqual(['untracked']);
    expect(filterItems(stockDb, '', '')).toHaveLength(4);
  });

  it('filterRedemptions: טווח כוללני + "כולל מבוטלים" (ברירת דלוק — שקיפות)', () => {
    const a = assignment({
      redemptions: [
        redemption({ id: 'x1', date: '2026-06-01' }),
        redemption({ id: 'x2', date: '2026-07-05', voidedAt: '2026-07-06' }),
      ],
    });
    expect(filterRedemptions(a, '', '', true)).toHaveLength(2);
    expect(filterRedemptions(a, '', '', false).map((r) => r.id)).toEqual(['x1']);
    expect(filterRedemptions(a, '2026-07-01', '', true).map((r) => r.id)).toEqual(['x2']);
  });

  it('הגנת-דפוס: הטאבים מייבאים את הסינון מה-lib; הקישור מגודר moduleOn; הלוח מסונן לפני הבנייה', () => {
    expect(tabSrc).toContain('filterAssignments(');
    expect(tabSrc).toContain('filterRedemptions(');
    expect(tabSrc).toMatch(/moduleOn\(config, 'families'\)/);
    expect(catalogSrc).toContain('filterProducts(');
    expect(itemsSrc).toContain('filterItems(');
    expect(calSrc).toContain('buildGrid(shownEvents');
  });
});
