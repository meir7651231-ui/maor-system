/**
 * ratchet — מלאי-מחסן חוצה-פרויקטים (warehouse). הקצאה-נגזרת · מחסור · סנכרון-סכמה.
 */
import { describe, expect, it } from 'vitest';
import { warehouseOverview, warehouseValue } from '../warehouse';
import { ENTITY_COLLECTIONS } from '../cloud-diff';
import { emptyDb } from '../../types/domain';
import functionsSrc from '../../../functions/index.js?raw';
import viewSrc from '../../components/supporters/SupportersView.tsx?raw';
import type { Supporter, WarehouseItem } from '../../types/domain';

const wh = (id: string, name: string, qty: number, cost = 0): WarehouseItem => ({ id, name, unit: 'יח׳', qty, cost });
function proj(id: string, mat: { name: string; qty: number; cost: number }[]): Supporter {
  return {
    id, name: 'פרויקט ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    ayin: { stage: 'eyes', note: '', answeredNote: '', answerPushed: false, nextTalk: '', nextTalkTime: '', lastTouch: '', names: [], answers: [], log: [], mat },
  } as Supporter;
}

describe('🏭 ratchet — מלאי-מחסן חוצה-פרויקטים', () => {
  it('הקצאה נגזרת מרשומות-החומרים (התאמת-שם) חוצה-פרויקטים', () => {
    const warehouse = [wh('w1', 'לוח גבס', 100, 20)];
    const sups = [proj('a', [{ name: 'לוח גבס', qty: 30, cost: 20 }]), proj('b', [{ name: 'לוח גבס', qty: 45, cost: 20 }])];
    const [row] = warehouseOverview(warehouse, sups);
    expect(row.allocated).toBe(75);
    expect(row.remaining).toBe(25);
    expect(row.short).toBe(false);
    expect(row.byProject).toHaveLength(2);
  });

  it('מחסור — הוקצה מעבר-למלאי ⇒ short + נותר שלילי', () => {
    const [row] = warehouseOverview([wh('w1', 'צבע', 10)], [proj('a', [{ name: 'צבע', qty: 14, cost: 0 }])]);
    expect(row.remaining).toBe(-4);
    expect(row.short).toBe(true);
  });

  it('התאמת-שם מנורמלת (רווחים/רישיות) + פריט בלי-צריכה = 0', () => {
    const [row] = warehouseOverview([wh('w1', '  Cement  ', 50)], [proj('a', [{ name: 'cement', qty: 5, cost: 0 }])]);
    expect(row.allocated).toBe(5);
    const [row2] = warehouseOverview([wh('w2', 'ברזל', 50)], [proj('a', [{ name: 'עץ', qty: 5, cost: 0 }])]);
    expect(row2.allocated).toBe(0);
  });

  it('ערך-מלאי = Σ qty×cost', () => {
    expect(warehouseValue([wh('a', 'x', 10, 5), wh('b', 'y', 3, 100)])).toBe(350);
  });

  it('🛡 סנכרון-סכמה: warehouse ב-ENTITY_COLLECTIONS · emptyDb · BACKUP-השרת · מגודר-מסחרי', () => {
    expect(ENTITY_COLLECTIONS).toContain('warehouse');
    expect(Array.isArray(emptyDb().warehouse)).toBe(true);
    expect(functionsSrc).toContain("'warehouse'");
    expect(viewSrc).toContain("featureOn(config, 'supporters.ayin.warehouse') && !featureOn(config, 'core.taxreceipt')");
  });
});
