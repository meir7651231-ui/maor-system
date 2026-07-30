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

  it('הגנת-מקור: כפתור החידוש בקטלוג פותח את StockModal; מאז SHOP6 החידוש נרשם כקליטה', () => {
    expect(catalogSrc).toContain('title="חידוש מלאי"');
    expect(catalogSrc).toContain('StockModal');
    expect(stockSrc).toContain('הזנת כמות תפעיל מעקב');
    // עדכון ratchet מתועד (SHOP6 חנות 25): המודאל עבר מ-upsertShopItem ישיר
    // ל-addShopIntake — הרשומה ביומן והמלאי עולים אטומית ב-store
    expect(stockSrc).toContain('addShopIntake(');
    expect(stockSrc).not.toContain('upsertShopItem');
  });

  it('חידוש דרך addShopIntake מוסיף לכמות; פריט בלי מעקב מתחיל מהכמות שהוזנה', () => {
    // אותה פעולה שהמודאל מבצע — stock 3 + 2 = 5, ורשומת קליטה נכתבת
    const add = useApp.getState().addShopIntake;
    expect(add({ itemId: 'shi1', date: '2026-07-30', qty: 2, kind: 'buy', source: '', cost: 0, note: '' })).toBe(true);
    expect(useApp.getState().db.shopItems[0].stock).toBe(5);
    expect(useApp.getState().db.shopIntakes).toHaveLength(1);
    // פריט בלי מעקב — stock ?? 0 ואז +4 = 4 (המעקב הופעל)
    const untracked = item({ id: 'shi2', name: 'בלי מעקב', stock: undefined });
    useApp.getState().upsertShopItem(untracked);
    expect(add({ itemId: 'shi2', date: '2026-07-30', qty: 4, kind: 'donation', source: 'משפחת לוי', cost: 0, note: '' })).toBe(true);
    expect(useApp.getState().db.shopItems.find((x) => x.id === 'shi2')?.stock).toBe(4);
  });

  it('קלט לא-חיובי נדחה בשער המודאל (בלי שינוי פריט) — הגנת-מקור על השער', () => {
    // השער במודאל: ריק / לא-סופי / אפס-ושלילי — כולם נעצרים לפני upsert
    expect(stockSrc).toMatch(/!amount\.trim\(\) \|\| !Number\.isFinite\(n\) \|\| n <= 0/);
    expect(stockSrc).toMatch(/n <= 0[\s\S]{0,80}setError/);
  });
});
