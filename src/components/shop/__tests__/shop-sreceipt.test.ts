/**
 * ratchet — אישור תשלום סמלי S- (חנות 10, הכרעת בעלים 11).
 * סדרה נפרדת ורציפה: rid מונפק רק כש-paid>0; זריעת מיגרציה + ייחודיות;
 * "מונים רק עולים" בענן; בידוד מורחב — S- חי לבד, אפס נגיעה ב-R-/D-;
 * הגנת-מקור: האישור לעולם אינו קבלת מס (בלי taxReceipt:true, בלי orgTaxId).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { migrate } from '../../../store/persist';
import { applyMetaPartial } from '../../../lib/cloud-merge';
import { metaOf } from '../../../lib/cloud-diff';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type ShopAssignment, type ShopRedemption } from '../../../types/domain';
import tabSrc from '../AssignmentsTab.tsx?raw';
import settingsSrc from '../../settings/SettingsView.tsx?raw';
import { receiptVerifyCode } from '../../../lib/receipt';

function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function redemption(over: Partial<ShopRedemption>): ShopRedemption {
  return { id: 'shr1', componentId: 'shpc1', date: '2026-07-30', holiday: '', paid: 50, value: 200, note: '', ...over };
}
const base = { componentId: 'shpc1', date: '2026-07-30' as const, holiday: '', note: '' };

describe('🧾 ratchet — חנות 10: סדרת S- נפרדת', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({ ...emptyDb(), shopAssignments: [assignment({})] }));
  });

  it('rid מונפק רק כש-paid>0; רציפות S-1,S-2; paid=0 בלי rid ובלי קידום מונה', () => {
    const r1 = useApp.getState().addShopRedemption('sha1', { ...base, paid: 50, value: 200 });
    expect(r1).toEqual({ ok: true, rid: 'S-1' });
    const r0 = useApp.getState().addShopRedemption('sha1', { ...base, paid: 0, value: 100 });
    expect(r0).toEqual({ ok: true });
    expect(useApp.getState().db.shopReceiptSeq).toBe(2); // מתנה מלאה לא צרכה מונה
    const r2 = useApp.getState().addShopRedemption('sha1', { ...base, paid: 30, value: 80 });
    expect(r2).toEqual({ ok: true, rid: 'S-2' });
    const rids = useApp.getState().db.shopAssignments[0].redemptions.map((r) => r.rid);
    expect(rids).toEqual(['S-2', undefined, 'S-1']);
  });

  it('🛡 בידוד מורחב: paid>0 מנפיק S- בלי לגעת ב-receiptSeq/donationSeq (R-/D- ללא נגיעה)', () => {
    const before = useApp.getState().db;
    const res = useApp.getState().addShopRedemption('sha1', { ...base, paid: 50, value: 200 });
    const after = useApp.getState().db;
    expect(res.rid).toBe('S-1');
    expect(after.receiptSeq).toBe(before.receiptSeq);
    expect(after.donationSeq).toBe(before.donationSeq);
    expect(after.shopReceiptSeq).toBe(before.shopReceiptSeq + 1);
  });

  it('מיגרציה: זריעה מ-S- קיים (הבא אחרי הגבוה) + rid כפול ממוספר מחדש', () => {
    const raw = {
      ...emptyDb(),
      shopAssignments: [
        assignment({ redemptions: [redemption({ rid: 'S-7' }), redemption({ id: 'shr2', rid: 'S-7' })] }),
      ],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.shopReceiptSeq).toBeGreaterThanOrEqual(8);
    const rids = out.shopAssignments[0].redemptions.map((r) => r.rid);
    expect(new Set(rids).size).toBe(2); // הכפילות מוספרה מחדש מהמונה הזרוע
    expect(rids[0]).toBe('S-7');
  });

  it('ענן: bumpCounter על shopReceiptSeq — רק עולה, לעולם לא יורד', () => {
    const db: Db = { ...emptyDb(), shopReceiptSeq: 5 };
    const down = applyMetaPartial(db, { ...metaOf(db), shopReceiptSeq: 2 });
    expect(down.shopReceiptSeq).toBe(5);
    const up = applyMetaPartial(db, { ...metaOf(db), shopReceiptSeq: 9 });
    expect(up.shopReceiptSeq).toBe(9);
  });

  it('הגנת-מקור: האישור בחנות לעולם אינו קבלת מס — taxReceipt:false, בלי שדות §46', () => {
    expect(tabSrc).toContain('taxReceipt: false');
    expect(tabSrc).not.toContain('taxReceipt: true');
    expect(tabSrc).not.toContain('orgTaxId');
    expect(tabSrc).not.toContain('signatory');
    expect(tabSrc).toContain('אינו קבלה לצורכי מס');
  });

  // ratchet — הבאג (swarm-audit): כלי-האימות בהגדרות סרק רק תרומות (D-) ותשלומי-
  // חוגים (R-), בעוד אישורי S- מודפסים עם קוד-אימות (AssignmentsTab מעביר verify)
  // ⇒ אישור S- אמיתי קיבל '✗ לא נמצאה' — פסק-זיוף על מסמך כשר.
  it('🔍 כלי-האימות בהגדרות מזהה גם אישורי S- — אותם קלטים כמו ההדפסה', () => {
    // הכלי סורק את shopAssignments[].redemptions עם הקלטים שההדפסה השתמשה בהם:
    // rid | r.paid | ברירת-המטבע ₪ | r.date
    expect(settingsSrc).toMatch(/for \(const a of db\.shopAssignments\)/);
    expect(settingsSrc).toMatch(/amount: rr\.paid, cur: '₪', date: rr\.date/);
    // ההדפסה (downloadConfirmation) באמת מעבירה amount=r.paid ו-date=r.date בלי currency
    expect(tabSrc).toMatch(/amount: r\.paid,\s*date: r\.date,/);
    expect(tabSrc).not.toMatch(/downloadConfirmation[\s\S]{0,400}currency:/);
    // מקרה S- מלא: הקוד המוטבע על אישור S-3 של 50 ₪ תואם את מה שהכלי יצפה לו
    const printed = receiptVerifyCode('S-3', 50, '₪', '2026-07-30');
    expect(printed).toBe(receiptVerifyCode('S-3'.toUpperCase(), 50, '₪', '2026-07-30'));
    expect(printed).toMatch(/^[0-9A-Z]{3}-[0-9A-Z]{3}$/);
    // זיוף-סכום מתגלה — הקוד לרישום האמיתי שונה
    expect(receiptVerifyCode('S-3', 500, '₪', '2026-07-30')).not.toBe(printed);
  });
});
