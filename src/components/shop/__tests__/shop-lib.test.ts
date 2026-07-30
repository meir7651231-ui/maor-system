/**
 * ratchet — מנוע החנות הטהור + פעולות ה-store (חנות 3).
 * כולל ratchet-בידוד (הכרעת בעלים 30.7.2026): הכסף והאירועים של המודול
 * לא זולגים לתרומות/קבלות/לוח הראשי, ורפקטור הגריד לא שינה את הקופות.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  assignmentRedeemed,
  beneficiaryLabel,
  collectedPaid,
  effectivePrice,
  givenValue,
  needsCare,
  productAssignments,
  subsidyTotal,
  upcomingHolidays,
} from '../lib';
import { dayItems } from '../../calendar/calLib';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import {
  emptyDb,
  type Db,
  type ShopAssignment,
  type ShopComponent,
  type ShopCriterion,
  type ShopEvent,
  type ShopProduct,
  type ShopRedemption,
} from '../../../types/domain';

function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'shpc1', itemId: '', kind: 'gift', label: 'מתנה', storeId: '', value: 200, basePrice: 50, notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [], notes: '', ...over };
}
function crit(over: Partial<ShopCriterion>): ShopCriterion {
  return { id: 'shc1', name: 'יתום מאם', discountPct: 50, notes: '', ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'shr1', componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 0, value: 200, note: '', ...over };
}
function shev(over: Partial<ShopEvent>): ShopEvent {
  return { id: 'she1', title: 'מסירה', date: '2026-08-15', time: '', kind: 'delivery', assignmentId: '', notes: '', done: false, ...over };
}

describe('🛍 ratchet — חנות 3: מחיר אפקטיבי', () => {
  it('שני קריטריונים 25%/60% ⇒ ההנחה הגבוהה בלבד (לא מצטבר — ברירת ארכיטקט)', () => {
    const criteria = [crit({ id: 'c25', discountPct: 25 }), crit({ id: 'c60', discountPct: 60 })];
    expect(effectivePrice(100, ['c25', 'c60'], criteria)).toBe(40);
  });

  it('בלי קריטריונים ⇒ המחיר המלא; עיגול לש"ח שלם; לעולם לא שלילי', () => {
    expect(effectivePrice(50, [], [])).toBe(50);
    expect(effectivePrice(99, ['c33'], [crit({ id: 'c33', discountPct: 33 })])).toBe(66); // 66.33
    expect(effectivePrice(-10, [], [])).toBe(0);
    expect(effectivePrice(100, ['cX'], [crit({ id: 'cX', discountPct: 100 })])).toBe(0);
  });
});

describe('🛍 ratchet — חנות 3: חגים קרובים ומימוש מחזורי', () => {
  it('upcomingHolidays מעוגן קבוע (לא isoToday!) — ראש השנה בטווח, שם-חג ייחודי', () => {
    const list = upcomingHolidays('2026-08-20', 45);
    const names = list.map((h) => h.name);
    expect(names).toContain('ראש השנה');
    expect(new Set(names).size).toBe(names.length);
    for (const h of list) expect(h.iso >= '2026-08-20').toBe(true);
  });

  it('assignmentRedeemed למתנת-חג: מימוש לחג X אשתקד ⇒ לא-מומש השנה', () => {
    // מופעי החג נגזרים מהמנוע עצמו — בלי תאריכים עבריים מנוחשים
    const thisYear = upcomingHolidays('2026-09-01', 30).find((h) => h.name === 'יום כיפור')!;
    const lastYear = upcomingHolidays('2025-09-01', 45).find((h) => h.name === 'יום כיפור')!;
    expect(thisYear).toBeTruthy();
    expect(lastYear).toBeTruthy();
    const a = assignment({
      redemptions: [redemption({ componentId: 'g1', holiday: 'יום כיפור', date: lastYear.iso })],
    });
    expect(assignmentRedeemed(a, 'g1', lastYear)).toBe(true);
    expect(assignmentRedeemed(a, 'g1', thisYear)).toBe(false);
    const b = assignment({
      redemptions: [redemption({ componentId: 'g1', holiday: 'יום כיפור', date: thisYear.iso })],
    });
    expect(assignmentRedeemed(b, 'g1', thisYear)).toBe(true);
  });

  it('assignmentRedeemed בלי חג: כל מימוש של הרכיב נחשב', () => {
    const a = assignment({ redemptions: [redemption({ componentId: 'm1' })] });
    expect(assignmentRedeemed(a, 'm1')).toBe(true);
    expect(assignmentRedeemed(a, 'm2')).toBe(false);
  });
});

describe('🛍 ratchet — חנות 3: דורש טיפול וסכומים', () => {
  const db: Db = {
    ...emptyDb(),
    families: [{ id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number]],
    shopProducts: [
      product({
        components: [
          comp({ id: 'hg1', kind: 'holidayGift', label: 'סל לחג' }),
          comp({ id: 'mt1', kind: 'meeting', label: 'פגישת ליווי' }),
          comp({ id: 'cp1', kind: 'coupon', label: 'קופון ריהוט' }),
          comp({ id: 'gf1', kind: 'gift', label: 'מתנה חד-פעמית' }),
        ],
      }),
    ],
    shopAssignments: [assignment({})],
  };

  it('needsCare: שלושת הסוגים — מתנת-חג שקרבה, פגישה וקופון שטרם מומשו; gift לא נעקב', () => {
    // עוגן קבוע שבו יש חג בתוך ≤30 יום (ערב ראש השנה/ראש השנה)
    const items = needsCare(db, '2026-08-20');
    const kinds = items.map((x) => x.kind);
    expect(kinds).toContain('holidayDue');
    expect(kinds).toContain('meetingPending');
    expect(kinds).toContain('couponPending');
    expect(items.every((x) => x.assignmentId === 'sha1')).toBe(true);
    expect(items.some((x) => x.componentId === 'gf1')).toBe(false);
    // המיון: כל ה-holidayDue לפני הפגישות, והפגישות לפני הקופונים
    expect(kinds.lastIndexOf('holidayDue')).toBeLessThan(kinds.indexOf('meetingPending'));
    expect(kinds.lastIndexOf('meetingPending')).toBeLessThan(kinds.indexOf('couponPending'));
  });

  it('needsCare: שיוך שאינו active ורכיב שמומש — לא ברשימה', () => {
    const done: Db = {
      ...db,
      shopAssignments: [
        assignment({ id: 'sha2', status: 'done' }),
        assignment({ id: 'sha3', redemptions: [redemption({ componentId: 'mt1' }), redemption({ componentId: 'cp1' })] }),
      ],
    };
    const items = needsCare(done, '2026-06-01');
    expect(items.some((x) => x.assignmentId === 'sha2')).toBe(false);
    expect(items.some((x) => x.kind === 'meetingPending')).toBe(false);
    expect(items.some((x) => x.kind === 'couponPending')).toBe(false);
  });

  it('סכומים: givenValue/collectedPaid/subsidyTotal/productAssignments', () => {
    const list = [
      assignment({ id: 'a1', redemptions: [redemption({ value: 200, paid: 50 }), redemption({ id: 'shr2', value: 100, paid: 0 })] }),
      assignment({ id: 'a2', productId: 'shp2', redemptions: [redemption({ id: 'shr3', value: 80, paid: 30 })] }),
    ];
    expect(givenValue(list)).toBe(380);
    expect(collectedPaid(list)).toBe(80);
    expect(subsidyTotal(list)).toBe(300);
    expect(productAssignments(list, 'shp2').map((a) => a.id)).toEqual(['a2']);
  });

  it('beneficiaryLabel: משפחה בלבד / משפחה+בן', () => {
    const withMember: Db = {
      ...db,
      families: db.families.map((f) => ({ ...f, members: [{ id: 'm1', first: 'יוסי' } as unknown as Db['families'][number]['members'][number]] })),
    };
    expect(beneficiaryLabel(db, assignment({}))).toBe('משפחת כהן');
    expect(beneficiaryLabel(withMember, assignment({ memberId: 'm1' }))).toBe('משפחת כהן — יוסי');
  });
});

describe('🛡 ratchet-בידוד — הכרעת בעלים 30.7.2026 (חנות)', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopProducts: [product({ components: [comp({})] })],
      shopCriteria: [crit({})],
      shopAssignments: [assignment({ criterionIds: ['shc1'] })],
    }));
  });

  it('(א) addShopRedemption לא נוגע ב-donationSeq/receiptSeq/supporters/enrollments/events', () => {
    const before = useApp.getState().db;
    const res = useApp.getState().addShopRedemption('sha1', { componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 0, value: 200, note: '' });
    const after = useApp.getState().db;
    expect(res.ok).toBe(true);
    expect(after.donationSeq).toBe(before.donationSeq);
    expect(after.receiptSeq).toBe(before.receiptSeq);
    expect(after.supporters).toEqual(before.supporters);
    expect(after.enrollments).toEqual(before.enrollments);
    expect(after.events).toEqual(before.events);
    // המימוש נרשם רק בשיוך; paid=0 חוקי (מתנה מלאה)
    expect(after.shopAssignments[0].redemptions).toHaveLength(1);
  });

  it('(ב) אירועי הלוח הייעודי אינם מופיעים בלוח הראשי (dayItems)', () => {
    const db: Db = { ...emptyDb(), shopEvents: [shev({ date: '2026-08-02' })] };
    const items = dayItems(db, new Date('2026-08-02T12:00:00'));
    expect(items).toHaveLength(0);
  });

  it('paid/value שליליים או לא-סופיים נדחים בלי לגעת ב-db (לקח באג-5)', () => {
    const before = useApp.getState().db;
    const base = { componentId: 'shpc1', date: '2026-07-30' as const, holiday: '', note: '' };
    expect(useApp.getState().addShopRedemption('sha1', { ...base, paid: -5, value: 200 })).toEqual({ ok: false });
    expect(useApp.getState().addShopRedemption('sha1', { ...base, paid: NaN, value: 200 }).ok).toBe(false);
    expect(useApp.getState().addShopRedemption('sha1', { ...base, paid: 0, value: -1 }).ok).toBe(false);
    expect(useApp.getState().addShopRedemption('sha9', { ...base, paid: 0, value: 1 }).ok).toBe(false);
    expect(useApp.getState().db).toEqual(before);
  });

  it('deleteShopProduct חסום עם שיוך active; מותר כשכולם done/stopped', () => {
    expect(useApp.getState().deleteShopProduct('shp1')).toBe(false);
    expect(useApp.getState().db.shopProducts).toHaveLength(1);
    useApp.getState().upsertShopAssignment({ ...useApp.getState().db.shopAssignments[0], status: 'done' });
    expect(useApp.getState().deleteShopProduct('shp1')).toBe(true);
    expect(useApp.getState().db.shopProducts).toHaveLength(0);
  });

  it('deleteShopCriterion מנקה criterionIds; deleteShopStore מנקה storeId בקופונים', () => {
    useApp.getState().deleteShopCriterion('shc1');
    expect(useApp.getState().db.shopCriteria).toHaveLength(0);
    expect(useApp.getState().db.shopAssignments[0].criterionIds).toEqual([]);
    useApp.getState().upsertShopStore({ id: 'shs1', name: 'ריהוט הכהנים', contact: '', phone: '', active: true, notes: '' });
    const p = useApp.getState().db.shopProducts[0];
    useApp.getState().upsertShopProduct({ ...p, components: [comp({ id: 'cp9', kind: 'coupon', storeId: 'shs1' })] });
    useApp.getState().deleteShopStore('shs1');
    expect(useApp.getState().db.shopStores).toHaveLength(0);
    expect(useApp.getState().db.shopProducts[0].components[0].storeId).toBe('');
  });

  it('deleteShopAssignment מנקה אירועים מקושרים; רכיב בלי id מקבל מזהה ב-upsert', () => {
    useApp.getState().upsertShopEvent(shev({ id: 'she9', assignmentId: 'sha1' }));
    useApp.getState().upsertShopEvent(shev({ id: 'she8', title: 'אחר' }));
    useApp.getState().deleteShopAssignment('sha1');
    expect(useApp.getState().db.shopAssignments).toHaveLength(0);
    expect(useApp.getState().db.shopEvents.map((e) => e.id)).toEqual(['she8']);
    const p = useApp.getState().db.shopProducts[0];
    useApp.getState().upsertShopProduct({ ...p, components: [...p.components, { ...comp({}), id: '' }] });
    const ids = useApp.getState().db.shopProducts[0].components.map((c) => c.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
