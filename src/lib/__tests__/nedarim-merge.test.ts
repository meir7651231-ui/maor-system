/**
 * ratchet — שיוך-ידני תשלום-נכנס לכרטיס (19.8.2026, בקשת-בעלים "כפתור מיזוג
 * בסגנון בדיקת-הכפילויות"): candidateSupportersForCharge מציע מועמדים לפי אותם
 * מפתחות של המנוע (ToremId/ת"ז/טלפון/אימייל/שם-חסין-סדר); attachChargeTo מחבר
 * את העסקה ל-hist של הכרטיס הנבחר, דדופ לפי txn.
 */
import { describe, expect, it } from 'vitest';
import { attachChargeTo, attachChargesBulk, autoMatchCharges, candidateSupportersForCharge, strongMatchForCharge, type SyncCharge } from '../nedarimSync';
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

// 🐛 מיזוג-אוטומטי עבד רק על 300 המוצגים + בחירה ⇒ לא-מתאימים בראש-הרשימה חסמו
// את השאר, ואלפי-הממתינים מעבר ל-300 לא נגעו בהם ("לא מצליח למזג את השאר", 19.8).
// autoMatchCharges עובד על **כל** הערימה בבת-אחת (אינדקס O(S+M)).
describe('🔗 ratchet — autoMatchCharges (מיזוג כל-הממתינים, לא רק 300)', () => {
  const pool = [
    sp({ id: 'a', name: 'משה כהן', phone: '050-1234567' }),
    sp({ id: 'b', name: 'רבקה לוי', idNum: '312345678' }),
    sp({ id: 'c', name: 'שרה', extId: 'TOREM-77' }),
  ];

  it('מחזיר רק בעלי-התאמה-ודאית; שם-בלבד ולא-מתאים מדולגים', () => {
    const charges: SyncCharge[] = [
      { id: 'p1', amount: 10, phone: '+972501234567' }, // → a (טלפון)
      { id: 'p2', amount: 20, zeout: '312345678' }, // → b (ת"ז)
      { id: 'p3', amount: 30, toremId: 'TOREM-77' }, // → c (מזהה-תורם)
      { id: 'p4', amount: 40, name: 'רבקה לוי' }, // שם-בלבד ⇒ מדולג
      { id: 'p5', amount: 50, name: 'פלוני', phone: '0500000000' }, // אין-התאמה ⇒ מדולג
    ];
    const out = autoMatchCharges(charges, pool);
    expect(out.map((o) => o.supId)).toEqual(['a', 'b', 'c']);
    expect(out.map((o) => o.charge.id)).toEqual(['p1', 'p2', 'p3']); // זהות-העסקה נשמרת (לסימון handled)
  });

  it('מפתח-חזק גובר: ext > id > ph > em (הראשון-שנמצא)', () => {
    const p = [sp({ id: 'x', extId: 'E1' }), sp({ id: 'y', phone: '0501112222' })];
    // עסקה עם גם ext (→x) וגם טלפון (→y) ⇒ ext גובר
    const out = autoMatchCharges([{ id: 'c', amount: 1, toremId: 'E1', phone: '0501112222' }], p);
    expect(out[0].supId).toBe('x');
  });

  it('לא-חוסם: כל בעלי-ההתאמה מחוברים גם כשלא-מתאים בראש-הרשימה', () => {
    const charges: SyncCharge[] = [
      { id: 'bad', amount: 5, name: 'ללא-מפתח' }, // בראש, בלי התאמה
      { id: 'good', amount: 5, phone: '0501234567' }, // אחריו, מתאים ל-a
    ];
    const out = autoMatchCharges(charges, pool);
    expect(out).toHaveLength(1);
    expect(out[0].charge.id).toBe('good');
  });

  it('רשימה ריקה / בלי-מפתחות ⇒ פלט ריק', () => {
    expect(autoMatchCharges([], pool)).toHaveLength(0);
    expect(autoMatchCharges([{ id: 'c', amount: 1, name: '' }], pool)).toHaveLength(0);
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
  it('מיזוג-כל-הממתינים: כפתור על כל rows (לא רק 300 המוצגים) דרך autoMatchCharges', async () => {
    const src = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(src).toContain('autoMatchCharges');
    expect(src).toContain('autoMergeAllPending');
    expect(src).toContain('🔗 מזג אוטומטית את כל הממתינים');
    // ⚠️ חייב לעבוד על rows המלא, לא על shown (אחרת שוב "לא מצליח למזג את השאר")
    expect(src).toContain('autoMatchCharges(rows, supporters)');
  });
  it('תיקוני-UI 20.8: סמן-הכל-הנותרים + חימוש-פוקע + באנר-שגיאה + תג-מונה', async () => {
    const inc = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(inc).toContain('markAllRemaining'); // ניקוי-ערימה על כל rows
    expect(inc).toContain('rows.map((p) => p.id)');
    expect(inc).toContain('armOr'); // חימוש-פוקע לפעולות-אצווה המוניות
    expect(inc).toContain('שגיאת-חיבור'); // כשל-רשת ≠ "אין ממתינים"
    const sv = (await import('../../components/supporters/SupportersView.tsx?raw')).default as string;
    expect(sv).toContain('nedPending'); // תג-מונה + "מושהה" על הכפתור
  });
  it('מסך-הסנכרון מסמן handled רק את plan.handledChargeIds (לא כל העסקאות)', async () => {
    const sync = (await import('../../components/supporters/NedarimSyncModal.tsx?raw')).default as string;
    expect(sync).toContain('plan.handledChargeIds');
    expect(sync).not.toContain('charges.map((c) => c.id)'); // הבאג הישן — סימון-הכל
    expect(sync).toContain('זיכויים (קוזזו)'); // מונה-זיכויים בתצוגה-המקדימה (פאזה-מודעת-כסף)
    expect(sync).toContain('ביטולים (סומנו)');
  });
  it('ייעול: כפתור "משוך וסנכרן" (משיכה-בקליק) מגודר מייל-על + pullUrl, דרך pullNedarim', async () => {
    const sync = (await import('../../components/supporters/NedarimSyncModal.tsx?raw')).default as string;
    expect(sync).toContain('🔄 משוך וסנכרן עכשיו');
    expect(sync).toContain('pullNedarim(pullUrl)');
    expect(sync).toContain('isSuperAdmin(cloudEmail)'); // גידור מייל-על
    expect(sync).toContain("integrationSetting(config, 'payments', 'pullUrl')");
  });
});

// ייעול 20.8: pullUrl הוסף ל-allowlist ההגדרות של payments (נשמר ב-normalizeConfig).
describe('🔗 ratchet — pullUrl ב-INTEGRATION_SETTING_KEYS', () => {
  it('payments.pullUrl מותר (allowlist)', async () => {
    const { INTEGRATION_SETTING_KEYS } = await import('../../types/config');
    expect(INTEGRATION_SETTING_KEYS.payments).toContain('pullUrl');
  });
});
