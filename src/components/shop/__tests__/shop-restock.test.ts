/**
 * ratchet — חידוש מלאי מהיר (חנות 13, הכרעת בעלים 13; עבר לפריט ב-SHOP4 —
 * המלאי המשותף חי על ShopItem, הכרעה 18).
 * הגנת-מקור: כפתור החידוש בקטלוג + מסלול הפעלת-מעקב; קלט לא-חיובי נדחה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type ShopItem } from '../../../types/domain';
import catalogSrc from '../CatalogTab.tsx?raw';
import stockSrc from '../StockModal.tsx?raw';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'מתנה', kind: 'gift', storeId: '', value: 200, basePrice: 50, stock: 3, active: true, notes: '', ...over };
}

describe('🛍 ratchet — חנות 13: חידוש מלאי מהיר (על הפריט)', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopItems: [item({})] }));
  });

  it('הגנת-מקור: כפתור החידוש בקטלוג פותח את StockModal; המלאי מתעדכן על הפריט', () => {
    expect(catalogSrc).toContain('title="חידוש מלאי"');
    expect(catalogSrc).toContain('StockModal');
    expect(stockSrc).toContain('הזנת כמות תפעיל מעקב');
    expect(stockSrc).toContain('upsertShopItem');
    expect(stockSrc).toContain('(it.stock ?? 0) + n');
  });

  it('חידוש דרך upsertShopItem מוסיף לכמות; פריט בלי מעקב מתחיל מהכמות שהוזנה', () => {
    // אותה פעולה שהמודאל מבצע — stock 3 + 2 = 5
    const i = useApp.getState().db.shopItems[0];
    useApp.getState().upsertShopItem({ ...i, stock: (i.stock ?? 0) + 2 });
    expect(useApp.getState().db.shopItems[0].stock).toBe(5);
    // פריט בלי מעקב — stock ?? 0 ואז +4 = 4 (המעקב הופעל)
    const untracked = item({ id: 'shi2', name: 'בלי מעקב', stock: undefined });
    useApp.getState().upsertShopItem({ ...untracked, stock: (untracked.stock ?? 0) + 4 });
    expect(useApp.getState().db.shopItems.find((x) => x.id === 'shi2')?.stock).toBe(4);
  });

  it('קלט לא-חיובי נדחה בשער המודאל (בלי שינוי פריט) — הגנת-מקור על השער', () => {
    // השער במודאל: ריק / לא-סופי / אפס-ושלילי — כולם נעצרים לפני upsert
    expect(stockSrc).toMatch(/!amount\.trim\(\) \|\| !Number\.isFinite\(n\) \|\| n <= 0/);
    expect(stockSrc).toMatch(/n <= 0[\s\S]{0,80}setError/);
  });
});
