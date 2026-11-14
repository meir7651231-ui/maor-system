/**
 * ratchet — שיוך-נדרים לפי "טלפונים נוספים" (phones[]) של כרטיס-תורם (לילה 14.11.2026).
 *
 * הבאג: מנוע-השיוך של נדרים (planNedarimSync / autoMatchCharges / strongMatchForCharge /
 * candidateSupportersForCharge) הכיר רק את `sp.phone`. תורם שהמספר שרשום אצלו בנדרים
 * הוא אחד מ"הטלפונים הנוספים" שלו במאור (בקשת-בעלים 13.10) —
 *  - בסנכרון-המלא: נוצר **כרטיס-כפול** (sup-ned-…) במקום העשרת-הקיים;
 *  - בשיוך-האוטומטי (חיבור-חי): התשלום **לא שויך** ונשאר ממתין;
 *  - בשיוך-הידני: הכרטיס לא הוצע כמועמד.
 * התיקון: המספרים-הנוספים נרשמים כמפתחות-שיוך — **אחרי** המפתחות-הראשיים של כל
 * הכרטיסים, כך שטלפון-ראשי של כרטיס אחר תמיד גובר על מספר-נוסף זהה.
 */
import { describe, expect, it } from 'vitest';
import {
  autoMatchCharges,
  candidateSupportersForCharge,
  planNedarimSync,
  strongMatchForCharge,
  type SyncCharge,
  type SyncDonor,
} from '../nedarimSync';
import type { Supporter } from '../../types/domain';

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'קיים ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}
const extra = (num: string) => [{ id: 'p-' + num, num }];
const donor = (o: Partial<SyncDonor> & { toremId: string; name: string }): SyncDonor => o;
const charge = (o: Partial<SyncCharge> & { amount: number }): SyncCharge => o;

describe('📞 ratchet — שיוך-נדרים לפי טלפונים-נוספים', () => {
  it('סנכרון-מלא: תורם שהטלפון-שלו בנדרים = מספר-נוסף ⇒ מעשיר קיים, לא כפול', () => {
    const existing = [sp('a', { name: 'ישראל כהן', phone: '050-1111111', phones: extra('052-7654321') })];
    const donors = [donor({ toremId: '900', name: 'י. כהן', phone: '0527654321' })];
    const { supporters, summary } = planNedarimSync(existing, donors, []);
    expect(summary.newSupporters).toBe(0);
    expect(supporters).toHaveLength(1);
    expect(supporters[0].extId).toBe('900');
    expect(supporters[0].phone).toBe('050-1111111'); // הראשי לא נדרס
  });

  it('סנכרון-מלא: עסקה עם מספר-נוסף נכנסת ל-hist של הכרטיס הקיים', () => {
    const existing = [sp('a', { name: 'ישראל כהן', phone: '', phones: extra('052-7654321') })];
    const charges = [charge({ amount: 100, phone: '052-7654321', txnId: 't1', d: '2026-11-01' })];
    const { supporters, summary } = planNedarimSync(existing, [], charges);
    expect(summary.newSupporters).toBe(0);
    expect(supporters).toHaveLength(1);
    expect(supporters[0].hist?.length).toBe(1);
  });

  it('חיבור-חי (attachOnly): עסקה עם מספר-נוסף משויכת ולא מדולגת', () => {
    const existing = [sp('a', { name: 'משה לוי', phones: extra('054-2222222') })];
    const charges = [charge({ id: 'c1', amount: 50, phone: '0542222222', txnId: 't2', d: '2026-11-02' })];
    const plan = planNedarimSync(existing, [], charges, { attachOnly: true });
    expect(plan.summary.chargesSkipped).toBe(0);
    expect(plan.handledChargeIds).toContain('c1');
  });

  it('autoMatchCharges / strongMatchForCharge / מועמדים — מזהים מספר-נוסף', () => {
    const a = sp('a', { name: 'משה לוי', phones: extra('054-2222222') });
    const c = charge({ amount: 50, phone: '054-2222222' });
    expect(autoMatchCharges([c], [a])).toEqual([{ supId: 'a', charge: c }]);
    expect(strongMatchForCharge(c, [a])?.id).toBe('a');
    expect(candidateSupportersForCharge(c, [a]).map((s) => s.id)).toEqual(['a']);
  });

  it('טלפון-ראשי של כרטיס אחר גובר על מספר-נוסף זהה (גם כשהנוסף מופיע ראשון)', () => {
    const owner = sp('owner', { phones: extra('053-3333333') }); // מספר-נוסף
    const real = sp('real', { phone: '053-3333333' }); // הטלפון-הראשי של כרטיס אחר
    const c = charge({ amount: 10, phone: '0533333333', txnId: 't3' });
    expect(autoMatchCharges([c], [owner, real])[0].supId).toBe('real');
    const { supporters } = planNedarimSync([owner, real], [], [c]);
    expect(supporters.find((s) => s.id === 'real')!.hist?.length).toBe(1);
    expect(supporters.find((s) => s.id === 'owner')!.hist).toBeUndefined();
  });

  it('בלי phones[] — התנהגות ביט-זהה (מספר זר ⇒ כרטיס-חדש)', () => {
    const existing = [sp('a', { phone: '050-1111111' })];
    const donors = [donor({ toremId: '901', name: 'אחר לגמרי', phone: '0529999999' })];
    const { summary } = planNedarimSync(existing, donors, []);
    expect(summary.newSupporters).toBe(1);
  });
});
