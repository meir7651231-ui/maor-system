/**
 * ratchet — מלאי נכנס: קליטות (SHOP6 חנות 25).
 * קליטה מעלה מלאי אטומית עם הרשומה; מחיקה מחזירה וקוטמת ב-0; qty≤0 /
 * cost שלילי / פריט לא-קיים נדחים בלי לגעת ב-db (לקח באג-5 — שער לפני מונה);
 * restock ב-needsCare (מתחת ל-minStock); מיגרציה אדיטיבית (מערך 18); ענן.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate } from '../persist';
import { ENTITY_COLLECTIONS, diffDb } from '../../lib/cloud-diff';
import { applyEntityPartial } from '../../lib/cloud-merge';
import { DEFAULT_CONFIG } from '../../types/config';
import { DB_VERSION, emptyDb, type Db, type ShopIntake, type ShopItem } from '../../types/domain';
import { needsCare } from '../../components/shop/lib';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, stock: 3, active: true, notes: '', ...over };
}
function intake(over: Partial<Omit<ShopIntake, 'id'>>): Omit<ShopIntake, 'id'> {
  return { itemId: 'shi1', date: '2026-07-30', qty: 5, kind: 'buy', source: 'סיטונאות', cost: 250, note: '', ...over };
}

describe('🛍 ratchet — חנות 25: קליטות מלאי', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopItems: [item({})] }));
  });

  it('קליטה אטומית: הרשומה נכתבת והמלאי עולה באותה פעולה (3+5=8)', () => {
    expect(useApp.getState().addShopIntake(intake({}))).toBe(true);
    const db = useApp.getState().db;
    expect(db.shopIntakes).toHaveLength(1);
    expect(db.shopIntakes[0].id.startsWith('shn')).toBe(true);
    expect(db.shopItems[0].stock).toBe(8);
  });

  it('שער לפני מונה (לקח באג-5): qty≤0 / cost שלילי / פריט לא-קיים — db זהה, seq לא נשרף', () => {
    const before = useApp.getState().db;
    expect(useApp.getState().addShopIntake(intake({ qty: 0 }))).toBe(false);
    expect(useApp.getState().addShopIntake(intake({ qty: -3 }))).toBe(false);
    expect(useApp.getState().addShopIntake(intake({ cost: -1 }))).toBe(false);
    expect(useApp.getState().addShopIntake(intake({ itemId: 'אין' }))).toBe(false);
    expect(useApp.getState().db).toEqual(before);
  });

  it('מחיקת קליטה מחזירה את המלאי; קטום ב-0 כשחולק בינתיים יותר משנקלט', () => {
    useApp.getState().addShopIntake(intake({}));
    const id = useApp.getState().db.shopIntakes[0].id;
    useApp.getState().deleteShopIntake(id);
    expect(useApp.getState().db.shopIntakes).toHaveLength(0);
    expect(useApp.getState().db.shopItems[0].stock).toBe(3);
    // קיטום: מלאי ירד ידנית ל-2 אחרי קליטה של 5 ⇒ מחיקה לא יורדת לשלילי
    useApp.getState().addShopIntake(intake({}));
    const id2 = useApp.getState().db.shopIntakes[0].id;
    const it2 = useApp.getState().db.shopItems[0];
    useApp.getState().upsertShopItem({ ...it2, stock: 2 });
    useApp.getState().deleteShopIntake(id2);
    expect(useApp.getState().db.shopItems[0].stock).toBe(0);
  });

  it('תרומה-בעין: cost=0 — נרשמת ומעלה מלאי כרגיל', () => {
    expect(useApp.getState().addShopIntake(intake({ kind: 'donation', cost: 0, source: 'משפחת לוי' }))).toBe(true);
    expect(useApp.getState().db.shopItems[0].stock).toBe(8);
  });

  it('restock ב-needsCare: מתחת ל-minStock — "להצטייד"; אזל נשאר stockOut; בלי minStock אין התרעה', () => {
    const db: Db = { ...emptyDb(), shopItems: [item({ stock: 1, minStock: 3 })] };
    const care = needsCare(db, '2026-07-30');
    const restock = care.find((c) => c.kind === 'restock');
    expect(restock?.hint).toBe('להצטייד: נותרו 1 מתחת ל-3');
    // אזל (0) — stockOut ולא restock (לא כפול)
    const out = needsCare({ ...db, shopItems: [item({ stock: 0, minStock: 3 })] }, '2026-07-30');
    expect(out.some((c) => c.kind === 'stockOut')).toBe(true);
    expect(out.some((c) => c.kind === 'restock')).toBe(false);
    // בלי minStock — מלאי נמוך לא מתריע (התנהגות טרום-SHOP6 נשמרת)
    const none = needsCare({ ...db, shopItems: [item({ stock: 1 })] }, '2026-07-30');
    expect(none.some((c) => c.kind === 'restock')).toBe(false);
  });

  it('מיגרציה אדיטיבית: גיבוי ישן בלי shopIntakes — נטען עם []; DB_VERSION נשאר 5', () => {
    const old = { ...emptyDb(), v: DB_VERSION } as Record<string, unknown>;
    delete old.shopIntakes;
    const out = migrate(old)!;
    expect(out.shopIntakes).toEqual([]);
    expect(out.v).toBe(6);
  });

  it('ענן: shopIntakes באוספים (18) — diff set/delete ו-round-trip', () => {
    expect(ENTITY_COLLECTIONS).toContain('shopIntakes');
    expect(ENTITY_COLLECTIONS).toHaveLength(22) // WORKPREP (20.8): tasks = הישות ה-22;
    const rec: ShopIntake = { id: 'shn1', ...intake({}) };
    const prev: Db = { ...emptyDb(), shopIntakes: [rec, { ...rec, id: 'shn2' }] };
    const next: Db = { ...emptyDb(), shopIntakes: [{ ...rec, qty: 9 }] };
    const d = diffDb(prev, next);
    expect(d.sets.some((s) => s.col === 'shopIntakes' && s.id === 'shn1')).toBe(true);
    expect(d.deletes.some((x) => x.col === 'shopIntakes' && x.id === 'shn2')).toBe(true);
    const merged = applyEntityPartial(emptyDb(), 'shopIntakes', [
      { id: 'shn7', data: { itemId: 'shi1', date: '2026-07-01', qty: 2, kind: 'donation', source: '', cost: 0, note: '' }, deleted: false },
    ]);
    expect(merged.shopIntakes.find((x) => x.id === 'shn7')?.qty).toBe(2);
  });
});
