/**
 * ratchet — מנוע-סנכרון נדרים→מאור (planNedarimSync, 19.8.2026).
 *
 * שומר את "הדו-כווני-המלא דרך המפתחות, כל סוגי-התרומות":
 *  1. התאמה לכרטיס קיים לפי כל מפתח (ToremId / ת"ז / טלפון / אימייל) — לא כפילות.
 *  2. תורם ללא-התאמה ⇒ כרטיס-חדש (מזהה דטרמיניסטי sup-ned-<ToremId>).
 *  3. עסקה נכנסת ל-hist[] של הכרטיס התואם — קבלות-מס לא נוגעו (count/ils/usd קבלות-בלבד).
 *  4. אפס-אובדן: עסקה בלי כל התאמה ⇒ כרטיס-חדש נוצר (חיוב לא הולך לאיבוד).
 *  5. אידמפוטנטי: הרצה-חוזרת (אותם txn) לא מוסיפה כפילויות-חיוב.
 *  6. העשרה: כרטיס קיים מקבל extId + שדות-ריקים מולאו — בלי דריסת-מלאים.
 */
import { describe, expect, it } from 'vitest';
import { planNedarimSync, type SyncCharge, type SyncDonor } from '../nedarimSync';
import type { Supporter } from '../../types/domain';

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'קיים ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}
const donor = (o: Partial<SyncDonor> & { toremId: string; name: string }): SyncDonor => o;
const charge = (o: Partial<SyncCharge> & { amount: number }): SyncCharge => o;

describe('🔄 ratchet — planNedarimSync (סנכרון-נכנס דרך המפתחות)', () => {
  it('תורם תואם-טלפון ⇒ מעשיר כרטיס קיים (extId נקבע, שם לא נדרס)', () => {
    const existing = [sp('a', { name: 'ישראל כהן', phone: '050-1234567' })];
    const donors = [donor({ toremId: '900', name: 'י. כהן', phone: '0501234567', email: 'i@k.com' })];
    const { supporters, summary } = planNedarimSync(existing, donors, []);
    expect(summary.newSupporters).toBe(0);
    expect(summary.updatedSupporters).toBe(1);
    const a = supporters.find((s) => s.id === 'a')!;
    expect(a.name).toBe('ישראל כהן'); // לא נדרס
    expect(a.extId).toBe('900'); // מפתח-שיוך עתידי נקבע
    expect(a.email).toBe('i@k.com'); // שדה-ריק מולא
  });

  it('תורם ללא-התאמה ⇒ כרטיס-חדש עם מזהה דטרמיניסטי', () => {
    const { supporters, summary } = planNedarimSync([], [donor({ toremId: '492787', name: 'רחל בן צבי', phone: '053-3142342' })], []);
    expect(summary.newSupporters).toBe(1);
    const n = supporters.find((s) => s.extId === '492787')!;
    expect(n.id).toBe('sup-ned-492787');
    expect(n.name).toBe('רחל בן צבי');
  });

  it('עסקה מתווספת ל-hist[] של הכרטיס התואם (ToremId) — הקבלות לא נוגעו', () => {
    const existing = [sp('a', { name: 'דוד', extId: '900', ils: 500, count: 3, donations: [{ rid: 'R-1', date: '2024-01-01', amount: 500, cur: '₪', cat: '' }] })];
    const charges = [charge({ amount: 120, currency: '₪', toremId: '900', txnId: 'T-1', d: '2019-06-12', receipt: 'K-778', last4: '1234' })];
    const { supporters, summary } = planNedarimSync(existing, [], charges);
    const a = supporters.find((s) => s.id === 'a')!;
    expect(summary.chargesAdded).toBe(1);
    expect(a.hist).toHaveLength(1);
    expect(a.hist![0]).toMatchObject({ d: '2019-06-12', a: 120, c: '₪', txn: 'T-1', receipt: 'K-778', last4: '1234', clearer: 'נדרים' });
    // אינווריאנט-הענן: הקבלות (count/ils) לא השתנו — נדרים מנפיק §46
    expect(a.count).toBe(3);
    expect(a.ils).toBe(500);
    expect(summary.ilsAdded).toBe(120);
  });

  it('אפס-אובדן: עסקה בלי כל התאמה ⇒ כרטיס-חדש נוצר עם החיוב', () => {
    const { supporters, summary } = planNedarimSync([], [], [charge({ amount: 50, name: 'אנונימי', txnId: 'T-9' })]);
    expect(summary.newSupporters).toBe(1);
    expect(summary.chargesAdded).toBe(1);
    const n = supporters.find((s) => s.name === 'אנונימי')!;
    expect(n.hist).toHaveLength(1);
    expect(n.hist![0].a).toBe(50);
  });

  it('אידמפוטנטי: הרצה-חוזרת עם אותו txn לא משכפלת חיוב', () => {
    const existing = [sp('a', { extId: '900', hist: [{ d: '2019-06-12', a: 120, c: '₪', txn: 'T-1' }] })];
    const charges = [charge({ amount: 120, toremId: '900', txnId: 'T-1', d: '2019-06-12' })];
    const { supporters, summary } = planNedarimSync(existing, [], charges);
    expect(summary.chargesDup).toBe(1);
    expect(summary.chargesAdded).toBe(0);
    expect(supporters.find((s) => s.id === 'a')!.hist).toHaveLength(1);
  });

  it('מטבע-דולר ותיוג-הו"ק זוהו; חיוב-אפס/שלילי מדולג', () => {
    const charges = [
      charge({ amount: 18, currency: '$', toremId: '901', txnId: 'U-1', name: 'תורם דולר' }),
      charge({ amount: 200, currency: '₪', toremId: '902', txnId: 'H-1', kevaId: 'K5', name: 'הו"ק' }),
      charge({ amount: 0, toremId: '903', txnId: 'Z-1', name: 'מבוטל' }),
    ];
    const { summary } = planNedarimSync([], [], charges);
    expect(summary.usdAdded).toBe(18);
    expect(summary.recurring).toBe(1);
    expect(summary.chargesAdded).toBe(2); // המבוטל (0) לא נספר
  });

  it('עסקה עם ToremId חדש שאין-לו-תורם — לא נוצרים שני כרטיסים לאותו ToremId', () => {
    const charges = [
      charge({ amount: 10, toremId: '950', txnId: 'A' }),
      charge({ amount: 20, toremId: '950', txnId: 'B' }),
    ];
    const { supporters, summary } = planNedarimSync([], [], charges);
    expect(supporters.filter((s) => s.extId === '950')).toHaveLength(1);
    expect(summary.chargesAdded).toBe(2);
    expect(supporters.find((s) => s.extId === '950')!.hist).toHaveLength(2);
  });
});
