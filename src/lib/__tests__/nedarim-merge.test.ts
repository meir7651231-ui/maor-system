/**
 * ratchet — שיוך-ידני תשלום-נכנס לכרטיס (19.8.2026, בקשת-בעלים "כפתור מיזוג
 * בסגנון בדיקת-הכפילויות"): candidateSupportersForCharge מציע מועמדים לפי אותם
 * מפתחות של המנוע (ToremId/ת"ז/טלפון/אימייל/שם-חסין-סדר); attachChargeTo מחבר
 * את העסקה ל-hist של הכרטיס הנבחר, דדופ לפי txn.
 */
import { describe, expect, it } from 'vitest';
import { attachChargeTo, attachChargesBulk, candidateSupportersForCharge, strongMatchForCharge, type SyncCharge } from '../nedarimSync';
import type { Supporter } from '../../types/domain';

const sp = (over: Partial<Supporter>): Supporter => ({
  id: 'x', name: 'x', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
  notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
});

describe('🔗 ratchet — מועמדים לשיוך עסקה (candidateSupportersForCharge)', () => {
  const pool = [
    sp({ id: 'a', name: 'משה כהן', phone: '050-1234567' }),
    sp({ id: 'b', name: 'רבקה לוי', idNum: '312345678' }),
    sp({ id: 'c', name: 'בן צבי רחל' }), // שם בסדר-משפחה-קודם
    sp({ id: 'd', name: 'אחר לגמרי', phone: '039999999' }),
  ];

  it('התאמת-טלפון (מנורמל, קידומת בינ"ל)', () => {
    const c: SyncCharge = { amount: 100, name: 'מ. כהן', phone: '+972501234567' };
    expect(candidateSupportersForCharge(c, pool).map((s) => s.id)).toContain('a');
  });
  it('התאמת-ת"ז', () => {
    const c: SyncCharge = { amount: 100, name: '', zeout: '312345678' };
    expect(candidateSupportersForCharge(c, pool)[0].id).toBe('b');
  });
  it('התאמת-שם חסין-סדר (רחל בן צבי ↔ בן צבי רחל)', () => {
    const c: SyncCharge = { amount: 100, name: 'רחל בן צבי' };
    expect(candidateSupportersForCharge(c, pool).map((s) => s.id)).toContain('c');
  });
  it('מפתח-חזק גובר על שם בדירוג', () => {
    const c: SyncCharge = { amount: 100, name: 'רחל בן צבי', phone: '050-1234567' };
    // גם טלפון (a, ציון 3) וגם שם (c, ציון 1) — a ראשון
    expect(candidateSupportersForCharge(c, pool)[0].id).toBe('a');
  });
  it('אין התאמה ⇒ רשימה ריקה (לא מחזיר הכל)', () => {
    expect(candidateSupportersForCharge({ amount: 100, name: 'פלוני אלמוני', phone: '0501111111' }, pool)).toHaveLength(0);
  });
});

describe('🔗 ratchet — attachChargeTo (חיבור-ידני ל-hist, דדופ-txn)', () => {
  it('מוסיף עסקה ל-hist של הכרטיס הנבחר עם clearer=נדרים', () => {
    const pool = [sp({ id: 'a', name: 'כהן' })];
    const c: SyncCharge = { amount: 250, currency: '₪', name: 'כהן', d: '2021-05-05', txnId: 'T1', receipt: '900' };
    const { supporters, added } = attachChargeTo(pool, 'a', c);
    expect(added).toBe(true);
    expect(supporters[0].hist).toEqual([{ d: '2021-05-05', a: 250, c: '₪', clearer: 'נדרים', txn: 'T1', receipt: '900' }]);
  });
  it('דדופ לפי txn — אותה עסקה פעמיים לא מוכפלת', () => {
    const pool = [sp({ id: 'a', hist: [{ d: '2021-05-05', a: 250, txn: 'T1' }] })];
    const { added } = attachChargeTo(pool, 'a', { amount: 250, name: 'כהן', txnId: 'T1' });
    expect(added).toBe(false);
  });
  it('כרטיס לא-נמצא ⇒ added=false, ללא שינוי', () => {
    const pool = [sp({ id: 'a' })];
    const { supporters, added } = attachChargeTo(pool, 'zzz', { amount: 1, name: 'x', txnId: 'T9' });
    expect(added).toBe(false);
    expect(supporters).toBe(pool);
  });
});

describe('🔗 ratchet — strongMatchForCharge (התאמה-ודאית לשיוך-אצווה)', () => {
  const pool = [
    sp({ id: 'a', name: 'משה כהן', phone: '050-1234567' }),
    sp({ id: 'b', name: 'רבקה לוי', idNum: '312345678' }),
    sp({ id: 'c', name: 'בן צבי רחל' }),
  ];
  it('מפתח-חזק (טלפון/ת"ז) ⇒ התאמה', () => {
    expect(strongMatchForCharge({ amount: 1, name: 'x', phone: '0501234567' }, pool)?.id).toBe('a');
    expect(strongMatchForCharge({ amount: 1, name: 'x', zeout: '312345678' }, pool)?.id).toBe('b');
  });
  it('שם-בלבד ⇒ null (לא בטוח לאצווה — דורש שיוך-ידני)', () => {
    expect(strongMatchForCharge({ amount: 1, name: 'רחל בן צבי' }, pool)).toBeNull();
  });
  it('אין מפתח ⇒ null', () => {
    expect(strongMatchForCharge({ amount: 1, name: '' }, pool)).toBeNull();
  });
});

describe('🔗 ratchet — attachChargesBulk (שיוך-אצווה, setDb יחיד)', () => {
  it('מחבר כמה עסקאות לכרטיסים שונים; דדופ-txn (כולל בתוך האצווה)', () => {
    const pool = [sp({ id: 'a' }), sp({ id: 'b' })];
    const { supporters, added } = attachChargesBulk(pool, [
      { supId: 'a', charge: { amount: 100, name: 'a', txnId: 'T1' } },
      { supId: 'b', charge: { amount: 200, name: 'b', txnId: 'T2' } },
      { supId: 'a', charge: { amount: 100, name: 'a', txnId: 'T1' } }, // כפיל-txn ⇒ מדולג
    ]);
    expect(added).toBe(2);
    expect(supporters.find((s) => s.id === 'a')!.hist).toHaveLength(1);
    expect(supporters.find((s) => s.id === 'b')!.hist).toHaveLength(1);
  });
});

describe('🛡 ratchet — חיווט מסך תשלומים-נכנסים', () => {
  it('כפתור 🔗 מזג לכרטיס + השוואת-שדות + קריאה ל-attachIncomingToSupporter', async () => {
    const src = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(src).toContain('🔗 מזג לכרטיס');
    expect(src).toContain('candidateSupportersForCharge');
    expect(src).toContain('attachIncomingToSupporter');
    expect(src).toContain('CmpRow'); // השוואת-שדות תשלום↔כרטיס
  });
  it('בחירה-מרובה: בחר-הכל + מזג-אוטומטית + סמן-שנרשמו', async () => {
    const src = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(src).toContain('בחר הכל');
    expect(src).toContain('🔗 מזג אוטומטית');
    expect(src).toContain('✓ סמן שנרשמו');
    expect(src).toContain('strongMatchForCharge'); // שיוך-אצווה בטוח בלבד
    expect(src).toContain('attachIncomingBulk');
    // סימון-אצווה במנות (בלי אלפי כתיבות בו-זמנית)
    expect(src).toContain('i += 300');
  });
});
