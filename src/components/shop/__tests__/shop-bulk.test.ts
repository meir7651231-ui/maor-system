/**
 * ratchet — חלוקה המונית (SHOP6 חנות 26).
 * eligibleFamilies: פעילות בלבד, קריטריונים כאיחוד-שיוכים, בלי כפל-חבילה;
 * bulkAssignShop אטומי ולא נוגע במונים הכספיים; bulkRedeem מדלג-על-שמומש,
 * paid=0 בלי S-, **נעצר-נקי על מחסור מלאי (db זהה — הכול-או-כלום, DoD)**;
 * רשימת החלוקה עם עמודת "☐ נמסר".
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type Family, type ShopAssignment, type ShopComponent, type ShopItem, type ShopProduct } from '../../../types/domain';
import { distributionListLines, eligibleFamilies, itemRemaining } from '../lib';

function fam(over: Partial<Family>): Family {
  return {
    id: 'f1', name: 'כהן', father: '', fatherId: '', mother: '', motherId: '', phone: '050', phone2: '', email: '',
    city: 'עירי', address: 'רחוב 1', community: '', maritalStatus: '', language: '', tzedaka: '', fullSefach: false,
    discount: '', status: 'active', notes: '', members: [], docs: [], cred: { score: 0, log: [] }, createdAt: '2026-01-01',
    ...over,
  };
}
function item(over: Partial<ShopItem>): ShopItem {
  return { id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, stock: 3, active: true, notes: '', ...over };
}
function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'c1', itemId: 'shi1', kind: 'gift', label: 'סט תפילין', storeId: '', notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, notes: '', components: [comp({})], ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '2026-06-01', status: 'active', notes: '', redemptions: [], ...over };
}

const baseDb: Db = {
  ...emptyDb(),
  families: [fam({}), fam({ id: 'f2', name: 'לוי' }), fam({ id: 'f3', name: 'רדום', status: 'inactive' })],
  shopItems: [item({})],
  shopProducts: [product({})],
};

describe('🛍 ratchet — חנות 26: חלוקה המונית', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => structuredClone(baseDb));
  });

  it('eligibleFamilies: פעילות בלבד; קריטריון = איחוד שיוכים; משויכת-כבר מסוננת (אין כפל)', () => {
    // בלי קריטריון — כל הפעילות (f3 לא-פעילה בחוץ)
    expect(eligibleFamilies(baseDb, [], 'shp1').map((e) => e.famId)).toEqual(['f1', 'f2']);
    // f1 כבר משויכת active לחבילה ⇒ מסוננת
    const withA: Db = { ...baseDb, shopAssignments: [assignment({})] };
    expect(eligibleFamilies(withA, [], 'shp1').map((e) => e.famId)).toEqual(['f2']);
    // קריטריון: רק משפחה שמחזיקה אותו בשיוך קיים כלשהו (של חבילה אחרת)
    const withCrit: Db = {
      ...baseDb,
      shopAssignments: [assignment({ id: 'other', productId: 'shpX', famId: 'f2', criterionIds: ['crit1'] })],
    };
    expect(eligibleFamilies(withCrit, ['crit1'], 'shp1').map((e) => e.famId)).toEqual(['f2']);
    expect(eligibleFamilies(withCrit, ['crit1', 'critX'], 'shp1')).toHaveLength(0);
  });

  it('bulkAssignShop: N שיוכים ב-setDb יחיד; המונים הכספיים לא זזים; ריק נדחה נקי', () => {
    const before = useApp.getState().db;
    expect(useApp.getState().bulkAssignShop('shp1', [])).toEqual({ ok: false, created: 0 });
    expect(useApp.getState().bulkAssignShop('אין', [{ famId: 'f1', memberId: '', criterionIds: [] }]).ok).toBe(false);
    expect(useApp.getState().db).toEqual(before);
    const res = useApp.getState().bulkAssignShop('shp1', [
      { famId: 'f1', memberId: '', criterionIds: ['crit1'] },
      { famId: 'f2', memberId: '', criterionIds: ['crit1'] },
    ]);
    expect(res).toEqual({ ok: true, created: 2 });
    const db = useApp.getState().db;
    expect(db.shopAssignments).toHaveLength(2);
    expect(db.shopAssignments.every((a) => a.status === 'active' && a.criterionIds.includes('crit1'))).toBe(true);
    // בידוד: אפס נגיעה במונים הכספיים
    expect(db.receiptSeq).toBe(before.receiptSeq);
    expect(db.donationSeq).toBe(before.donationSeq);
    expect(db.shopReceiptSeq).toBe(before.shopReceiptSeq);
  });

  it('bulkRedeem: מימוש לכל פעיל שטרם קיבל, מדלג-על-שמומש, paid=0 בלי S-, המלאי יורד', () => {
    useApp.getState().setDb(() => ({
      ...structuredClone(baseDb),
      shopAssignments: [
        assignment({ id: 'a1', famId: 'f1' }),
        // f2 כבר קיבלה — מדולגת
        assignment({ id: 'a2', famId: 'f2', redemptions: [{ id: 'r0', componentId: 'c1', date: '2026-07-01', holiday: '', paid: 0, value: 200, note: '' }] }),
      ],
    }));
    const res = useApp.getState().bulkRedeem('shp1', 'c1', { date: '2026-07-30', holiday: '' });
    expect(res).toEqual({ ok: true, created: 1 });
    const db = useApp.getState().db;
    const a1 = db.shopAssignments.find((a) => a.id === 'a1')!;
    expect(a1.redemptions).toHaveLength(1);
    expect(a1.redemptions[0].paid).toBe(0);
    expect(a1.redemptions[0].rid).toBeUndefined(); // בלי אישור S- בזרימה ההמונית
    expect(db.shopReceiptSeq).toBe(1);
    // המלאי ירד בהתאם: 3 במלאי − (r0 + החדש) = נותרו 1
    expect(itemRemaining(db, 'shi1')).toBe(1);
  });

  it('🛡 DoD — הכול-או-כלום: מלאי חסר ⇒ עצירה לפני כל כתיבה, db זהה לחלוטין', () => {
    useApp.getState().setDb(() => ({
      ...structuredClone(baseDb),
      shopItems: [item({ stock: 1 })],
      shopAssignments: [assignment({ id: 'a1', famId: 'f1' }), assignment({ id: 'a2', famId: 'f2' })],
    }));
    const before = useApp.getState().db;
    // 2 ממתינים מול נותרו 1 ⇒ "חסרות 1 יחידות" — שום מימוש חלקי
    const res = useApp.getState().bulkRedeem('shp1', 'c1', { date: '2026-07-30', holiday: '' });
    expect(res).toEqual({ ok: false, created: 0 });
    expect(useApp.getState().db).toEqual(before);
  });

  it('רשימת החלוקה: משפחה · כתובת · טלפון · רכיבים · "☐ נמסר"; פעילים בלבד', () => {
    const db: Db = {
      ...baseDb,
      shopAssignments: [assignment({}), assignment({ id: 'x', famId: 'f2', status: 'stopped' })],
    };
    const lines = distributionListLines(db, 'shp1');
    expect(lines[0]).toBe('רשימת חלוקה — מוצר חתן');
    expect(lines).toHaveLength(3); // כותרת + קו + שורה פעילה אחת (stopped בחוץ)
    expect(lines[2]).toBe('משפחת כהן · רחוב 1, עירי · 050 · סט תפילין · ☐ נמסר');
  });
});
