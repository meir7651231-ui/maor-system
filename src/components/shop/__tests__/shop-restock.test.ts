/**
 * ratchet — חידוש מלאי מהיר (חנות 13, הכרעת בעלים 13).
 * הגנת-מקור: כפתור החידוש בקטלוג + מסלול הפעלת-מעקב לרכיב בלי מלאי;
 * קלט לא-חיובי נדחה בלי לגעת במוצר.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type ShopComponent, type ShopProduct } from '../../../types/domain';
import catalogSrc from '../CatalogTab.tsx?raw';
import stockSrc from '../StockModal.tsx?raw';

function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'shpc1', kind: 'gift', label: 'מתנה', storeId: '', value: 200, basePrice: 50, notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [comp({ stock: 3 })], notes: '', ...over };
}

describe('🛍 ratchet — חנות 13: חידוש מלאי מהיר', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopProducts: [product({})] }));
  });

  it('הגנת-מקור: כפתור החידוש בקטלוג פותח את StockModal; מסלול הפעלת-מעקב קיים', () => {
    expect(catalogSrc).toContain('title="חידוש מלאי"');
    expect(catalogSrc).toContain('StockModal');
    expect(stockSrc).toContain('הזנת כמות תפעיל מעקב');
    expect(stockSrc).toContain('upsertShopProduct');
    expect(stockSrc).toContain('(c.stock ?? 0) + n');
  });

  it('חידוש דרך upsertShopProduct מוסיף לכמות; רכיב בלי מעקב מתחיל מהכמות שהוזנה', () => {
    // אותה פעולה שהמודאל מבצע — stock 3 + 2 = 5
    const p = useApp.getState().db.shopProducts[0];
    useApp.getState().upsertShopProduct({
      ...p,
      components: p.components.map((x) => (x.id === 'shpc1' ? { ...x, stock: (x.stock ?? 0) + 2 } : x)),
    });
    expect(useApp.getState().db.shopProducts[0].components[0].stock).toBe(5);
    // רכיב בלי מעקב — stock ?? 0 ואז +4 = 4 (המעקב הופעל)
    const untracked = comp({ id: 'shpc2', label: 'בלי מעקב' });
    const p2 = { ...useApp.getState().db.shopProducts[0] };
    useApp.getState().upsertShopProduct({
      ...p2,
      components: [{ ...untracked, stock: (untracked.stock ?? 0) + 4 }],
    });
    expect(useApp.getState().db.shopProducts[0].components[0].stock).toBe(4);
  });

  it('קלט לא-חיובי נדחה בשער המודאל (בלי שינוי מוצר) — הגנת-מקור על השער', () => {
    // השער במודאל: ריק / לא-סופי / אפס-ושלילי — כולם נעצרים לפני upsert
    expect(stockSrc).toMatch(/!amount\.trim\(\) \|\| !Number\.isFinite\(n\) \|\| n <= 0/);
    expect(stockSrc).toMatch(/n <= 0[\s\S]{0,80}setError/);
  });
});
