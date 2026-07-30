/**
 * ratchet — ביטול מימוש עם סימון (חנות 14, הכרעת בעלים 14).
 * ביטול לעולם לא מוחק רשומה ולא ממחזר מספר S-: הסימון voidedAt מחריג את
 * המימוש מכל הסכומים/המלאי/סטטוס-המימוש דרך liveRedemptions היחיד;
 * המונה לא זז והמימוש הבא ממשיך את הסדרה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { migrate } from '../../../store/persist';
import { assignmentRedeemed, collectedPaid, componentRemaining, givenValue, liveRedemptions, needsCare, subsidyTotal, upcomingHolidays } from '../lib';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type ShopAssignment, type ShopComponent, type ShopProduct, type ShopRedemption } from '../../../types/domain';
import tabSrc from '../AssignmentsTab.tsx?raw';

function comp(over: Partial<ShopComponent>): ShopComponent {
  return { id: 'shpc1', itemId: '', kind: 'gift', label: 'מתנה', storeId: '', value: 200, basePrice: 50, notes: '', ...over };
}
function product(over: Partial<ShopProduct>): ShopProduct {
  return { id: 'shp1', name: 'מוצר חתן', desc: '', active: true, components: [comp({ stock: 3 })], notes: '', ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'shr1', componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 50, value: 200, note: '', ...over };
}
const base = { componentId: 'shpc1', date: '2026-07-30' as const, holiday: '', note: '' };

describe('🚫 ratchet — חנות 14: ביטול מימוש עם סימון', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopProducts: [product({})], shopAssignments: [assignment({})] }));
  });

  it('ביטול מחריג מהסכומים ומחזיר מלאי — דרך liveRedemptions, בלי מחיקת רשומה', () => {
    useApp.getState().addShopRedemption('sha1', { ...base, paid: 50, value: 200 });
    let a = useApp.getState().db.shopAssignments[0];
    expect(givenValue([a])).toBe(200);
    expect(componentRemaining('shpc1', 'shp1', [a], 3)).toBe(2);
    const ok = useApp.getState().voidShopRedemption('sha1', a.redemptions[0].id, 'טעות הקלדה');
    expect(ok).toBe(true);
    a = useApp.getState().db.shopAssignments[0];
    // הרשומה נשארה — רק סומנה; כל החישובים דרך liveRedemptions מחריגים אותה
    expect(a.redemptions).toHaveLength(1);
    expect(a.redemptions[0].voidedAt).toBeTruthy();
    expect(a.redemptions[0].voidReason).toBe('טעות הקלדה');
    expect(liveRedemptions(a)).toHaveLength(0);
    expect(givenValue([a])).toBe(0);
    expect(collectedPaid([a])).toBe(0);
    expect(subsidyTotal([a])).toBe(0);
    expect(componentRemaining('shpc1', 'shp1', [a], 3)).toBe(3); // המלאי חזר
    expect(assignmentRedeemed(a, 'shpc1')).toBe(false); // הרכיב חזר לממתין
  });

  it('מתנת-חג מבוטלת חוזרת ל-holidayDue; ביטול-כפול חסום', () => {
    const hg = comp({ id: 'hg1', kind: 'holidayGift', label: 'סל לחג' });
    const p = { ...useApp.getState().db.shopProducts[0] };
    useApp.getState().upsertShopProduct({ ...p, components: [hg] });
    const h = upcomingHolidays('2026-08-20', 30)[0];
    useApp.getState().addShopRedemption('sha1', { componentId: 'hg1', date: h.iso, holiday: h.name, paid: 0, value: 100, note: '' });
    // בוחנים את החג הספציפי שמומש (לפי ה-iso שלו ב-hint) — חגים אחרים בטווח נשארים due
    const dueForH = (db: Db) =>
      needsCare(db, '2026-08-20').some((x) => x.kind === 'holidayDue' && x.componentId === 'hg1' && x.hint.includes(h.iso));
    let db: Db = useApp.getState().db;
    expect(dueForH(db)).toBe(false);
    const rid = db.shopAssignments[0].redemptions[0].id;
    expect(useApp.getState().voidShopRedemption('sha1', rid, '')).toBe(true);
    db = useApp.getState().db;
    expect(dueForH(db)).toBe(true);
    // ביטול-כפול — חסום, בלי שינוי
    const before = useApp.getState().db;
    expect(useApp.getState().voidShopRedemption('sha1', rid, 'שוב')).toBe(false);
    expect(useApp.getState().db).toEqual(before);
  });

  it('🛡 רציפות הסדרה: ה-rid נשאר אחרי ביטול, המונה לא זז, והבא ממשיך — לא ממחזר', () => {
    const r1 = useApp.getState().addShopRedemption('sha1', { ...base, paid: 50, value: 200 });
    expect(r1.rid).toBe('S-1');
    const seqAfterIssue = useApp.getState().db.shopReceiptSeq;
    const redId = useApp.getState().db.shopAssignments[0].redemptions[0].id;
    useApp.getState().voidShopRedemption('sha1', redId, '');
    const after = useApp.getState().db;
    expect(after.shopReceiptSeq).toBe(seqAfterIssue); // הביטול לא נגע במונה
    expect(after.shopAssignments[0].redemptions[0].rid).toBe('S-1'); // המספר נשאר בסדרה
    const r2 = useApp.getState().addShopRedemption('sha1', { ...base, paid: 30, value: 80 });
    expect(r2.rid).toBe('S-2'); // ממשיך — לא ממחזר את S-1 המבוטל
  });

  it('מיגרציה: voidedAt לא-מחרוזת → מוסר (המימוש חוזר להיחשב חי)', () => {
    const raw = {
      ...emptyDb(),
      shopAssignments: [
        assignment({
          redemptions: [
            redemption({ voidedAt: 12345 as unknown as string }),
            redemption({ id: 'shr2', voidedAt: '2026-07-29' }),
          ],
        }),
      ],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    const [r1, r2] = out.shopAssignments[0].redemptions;
    expect('voidedAt' in r1).toBe(false);
    expect(r2.voidedAt).toBe('2026-07-29');
  });

  it('הגנת-מקור: שורה מבוטלת בקו-חוצה עם צ׳יפ, בלי 🧾; הביטול ב-useArmed ובלי מחיקה', () => {
    expect(tabSrc).toContain('🚫 מבוטל ב-');
    expect(tabSrc).toMatch(/!r\.voidedAt && r\.rid &&[\s\S]{0,200}downloadConfirmation/); // 🧾 רק לחי
    expect(tabSrc).toContain("confirmTwice('shr-' + r.id");
    expect(tabSrc).toContain('voidShopRedemption');
    expect(tabSrc).not.toContain('deleteShopRedemption'); // אין מחיקת מימוש — רק סימון
  });
});
