/**
 * ratchet — רשימות המתנה (SHOP6 חנות 27).
 * כפול-משפחה נדחה בטוסט; קליטת מלאי מקפיצה waitingRestocked ("המלאי חזר");
 * מלאי 0 ⇒ אין התרעה (אין מה לתת); הסרה; מיגרציה מרפאת waits לא-מערך;
 * cloud-merge מגן על waits (LIST_FIELDS). הצעה אוטומטית במימוש/שיוך במלאי 0.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { migrate } from '../../../store/persist';
import { sanitizeIncoming } from '../../../lib/cloud-merge';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type ShopItem } from '../../../types/domain';
import { needsCare } from '../lib';
import redeemSrc from '../RedeemModal.tsx?raw';
import assignFormSrc from '../AssignmentForm.tsx?raw';
import itemsSrc from '../ItemsPanel.tsx?raw';

function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, stock: 0, active: true, notes: '', ...over };
}

describe('🛍 ratchet — חנות 27: רשימות המתנה', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopItems: [item({})] }));
  });

  it('הוספה; כפול-משפחה נדחה; הסרה', () => {
    expect(useApp.getState().addShopWait('shi1', 'f1', 'דחוף')).toBe(true);
    expect(useApp.getState().addShopWait('shi1', 'f1', '')).toBe(false); // כפול
    expect(useApp.getState().addShopWait('shi1', 'f2', '')).toBe(true);
    expect(useApp.getState().db.shopItems[0].waits).toHaveLength(2);
    useApp.getState().removeShopWait('shi1', 'f1');
    expect(useApp.getState().db.shopItems[0].waits?.map((w) => w.famId)).toEqual(['f2']);
  });

  it('מלאי 0 + ממתינים ⇒ אין התרעה; קליטת מלאי מקפיצה waitingRestocked', () => {
    useApp.getState().addShopWait('shi1', 'f1', '');
    // מלאי 0 — עדיין אין מה לתת (stockOut כן, waitingRestocked לא)
    let care = needsCare(useApp.getState().db, '2026-07-30');
    expect(care.some((c) => c.kind === 'waitingRestocked')).toBe(false);
    // קליטה מחזירה מלאי ⇒ "1 ממתינים לסט תפילין — המלאי חזר"
    useApp.getState().addShopIntake({ itemId: 'shi1', date: '2026-07-30', qty: 5, kind: 'buy', source: '', cost: 0, note: '' });
    care = needsCare(useApp.getState().db, '2026-07-30');
    const w = care.find((c) => c.kind === 'waitingRestocked');
    expect(w?.label).toBe('1 ממתינים לסט תפילין');
    expect(w?.hint).toContain('המלאי חזר');
  });

  it('מיגרציה מרפאת waits לא-מערך; cloud-merge מבטיח מערך (LIST_FIELDS)', () => {
    const raw = { ...emptyDb(), shopItems: [{ ...item({}), waits: 'זבל' as unknown as [] }] };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopItems[0].waits).toBeUndefined();
    const clean = sanitizeIncoming('shopItems', { id: 'shi9', name: 'מרוחק' });
    expect(Array.isArray(clean.waits)).toBe(true);
  });

  it('הגנת-מקור: הצעה אוטומטית "להוסיף לרשימת ההמתנה?" במימוש ובשיוך; שורת ממתינים בפאנל', () => {
    expect(redeemSrc).toContain('להוסיף לרשימת ההמתנה?');
    expect(redeemSrc).toContain('addShopWait(');
    expect(assignFormSrc).toContain('להוסיף לרשימת ההמתנה?');
    expect(itemsSrc).toContain('removeShopWait(');
    expect(itemsSrc).toContain('ממתינים:');
  });
});
