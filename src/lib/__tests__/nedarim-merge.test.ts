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

// 🐛 (23.8, "זה לא נכנס במקום הנכון"): עסקאות-סולה שמוזגו נרשמו ב-hist בתווית
// 'נדרים' — תווית-מקור שגויה בכרטיס, וגרוע מזה: "ביטול ייבוא נדרים" (מסנן
// clearer==='נדרים') היה מוחק גם אותן. התיקון: התווית נגזרת מהספק + ריפוי-רטרו.
describe('🔗 ratchet — תווית-סליקה לפי ספק (סולה ≠ נדרים)', () => {
  it('chargeToHist: provider=sola ⇒ clearer=סולה; חסר/אחר ⇒ נדרים (ביט-זהה)', async () => {
    const { chargeToHist, providerClearer } = await import('../nedarimSync');
    expect(providerClearer('sola')).toBe('סולה');
    expect(providerClearer()).toBe('נדרים');
    expect(chargeToHist({ amount: 100, provider: 'sola', d: '2026-08-20', txnId: 't1' }).clearer).toBe('סולה');
    expect(chargeToHist({ amount: 100, d: '2026-08-20', txnId: 't2' }).clearer).toBe('נדרים');
  });
  it('relabelHistByTxn: מתקן רק שורות שברשימת-המזהים; אידמפוטנטי; לא נוגע בנדרים-אמיתי', async () => {
    const { relabelHistByTxn } = await import('../nedarimSync');
    const sups = [{
      id: 's1', name: 'א', hist: [
        { d: '2026-01-01', a: 72, c: '$', clearer: 'נדרים', txn: '10940329920' }, // סולה שמוזג לפני-התיקון
        { d: '2026-01-02', a: 50, c: '₪', clearer: 'נדרים', txn: 'ned-777' }, // נדרים אמיתי — לא נוגעים
      ],
    }] as never[];
    const r1 = relabelHistByTxn(sups, ['10940329920'], 'סולה');
    expect(r1.changed).toBe(1);
    const hist = (r1.supporters[0] as { hist: { clearer: string }[] }).hist;
    expect(hist[0].clearer).toBe('סולה');
    expect(hist[1].clearer).toBe('נדרים');
    const r2 = relabelHistByTxn(r1.supporters, ['10940329920'], 'סולה');
    expect(r2.changed).toBe(0); // אידמפוטנטי
  });
  it('המסך מריץ ריפוי-רטרו בפתיחה (fetchProviderRows→repairProviderCards) מגודר canPullSola', async () => {
    const inc = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(inc).toMatch(/fetchProviderRows\('sola'\)/);
    expect(inc).toMatch(/repairCards\(provRows, 'סולה'\)/);
    expect(inc).toMatch(/if \(canPullSola\) \{/);
  });
});

// 🧲 (23.8, בקשת-הבעלים "שם יכנס לשם, טלפון לטלפון, הכל במקום"): מיזוג עסקה
// ממלא את שדות-הכרטיס **הריקים** מפרטי-העסקה — ולעולם לא דורס ערך קיים.
describe('🧲 ratchet — מילוי-אם-ריק של פרטי-קשר במיזוג + ריפוי-רטרו מלא', () => {
  it('attachChargeTo ממלא טלפון/אימייל/ת"ז ריקים — ולא דורס קיימים', async () => {
    const { attachChargeTo } = await import('../nedarimSync');
    const sups = [
      { id: 's1', name: 'ריקה', hist: [] },
      { id: 's2', name: 'מלאה', phone: '050-1111111', email: 'keep@x.com', hist: [] },
    ] as never[];
    const c = { amount: 72, provider: 'sola', txnId: 'tx1', d: '2026-08-20', name: 'Ruchi S', phone: '0502222222', email: 'new@x.com', zeout: '123456782' };
    const r1 = attachChargeTo(sups, 's1', c);
    const s1 = r1.supporters[0] as { phone?: string; email?: string; idNum?: string };
    expect(s1.phone).toBe('0502222222');
    expect(s1.email).toBe('new@x.com');
    expect(s1.idNum).toBeTruthy();
    const r2 = attachChargeTo(sups, 's2', { ...c, txnId: 'tx2' });
    const s2 = r2.supporters[1] as { phone?: string; email?: string };
    expect(s2.phone).toBe('050-1111111'); // קיים — לא נדרס
    expect(s2.email).toBe('keep@x.com');
  });
  it('repairCardsFromRows: תווית + מילוי-פרטים יחד, אידמפוטנטי', async () => {
    const { repairCardsFromRows } = await import('../nedarimSync');
    const sups = [{
      id: 's1', name: 'א', hist: [{ d: '2026-01-01', a: 72, c: '$', clearer: 'נדרים', txn: '10940329920' }],
    }] as never[];
    const rows = [{ amount: 72, txnId: '10940329920', phone: '0503333333', email: 'don@x.com' }];
    const r1 = repairCardsFromRows(sups, rows as never[], 'סולה');
    expect(r1.relabeled).toBe(1);
    expect(r1.enriched).toBe(1);
    const s = r1.supporters[0] as { phone?: string; email?: string; hist: { clearer: string }[] };
    expect(s.hist[0].clearer).toBe('סולה');
    expect(s.phone).toBe('0503333333');
    expect(s.email).toBe('don@x.com');
    const r2 = repairCardsFromRows(r1.supporters, rows as never[], 'סולה');
    expect(r2.relabeled).toBe(0);
    expect(r2.enriched).toBe(0); // אידמפוטנטי — ריצה-חוזרת לא נוגעת
  });
});

// 🐝 נחיל-סולה (23.8) — ממצאי-קליינט מאומתים, כל אחד ננעל:
describe('🐝 ratchet — ממצאי-נחיל-סולה בקליינט', () => {
  it('C2 · דדופ גלובלי: אותה עסקה לא נרשמת בשני כרטיסים (ידני+אצווה)', async () => {
    const { attachChargeTo, attachChargesBulk } = await import('../nedarimSync');
    const sups = [
      { id: 's1', name: 'א', hist: [{ d: '2026-01-01', a: 72, c: '$', clearer: 'סולה', txn: 'dup1' }] },
      { id: 's2', name: 'ב', hist: [] },
    ] as never[];
    const c = { amount: 72, provider: 'sola', txnId: 'dup1', d: '2026-01-01' };
    expect(attachChargeTo(sups, 's2', c).added).toBe(false); // כבר על s1
    const bulk = attachChargesBulk(sups, [
      { supId: 's2', charge: c }, // כפול מול s1
      { supId: 's2', charge: { ...c, txnId: 'new1' } },
      { supId: 's1', charge: { ...c, txnId: 'new1', amount: 50 } }, // כפול בתוך-האצווה מול s2
    ] as never);
    expect(bulk.added).toBe(1);
  });
  it('C10 · ביטול (amount=0) לא נכתב ל-hist במיזוג ידני/אצווה', async () => {
    const { attachChargeTo, attachChargesBulk } = await import('../nedarimSync');
    const sups = [{ id: 's1', name: 'א', hist: [] }] as never[];
    expect(attachChargeTo(sups, 's1', { amount: 0, txnId: 'z1' }).added).toBe(false);
    expect(attachChargesBulk(sups, [{ supId: 's1', charge: { amount: 0, txnId: 'z2' } }] as never).added).toBe(0);
  });
  it('C12 · טלפון-דמה (לא שורד נורמליזציה) לא ממלא שדה ריק', async () => {
    const { fillCardFromCharge } = await import('../nedarimSync');
    const sp = { id: 's1', name: 'א' } as never;
    expect((fillCardFromCharge(sp, { amount: 1, phone: '123' } as never) as { phone?: string }).phone).toBeUndefined();
    expect((fillCardFromCharge(sp, { amount: 1, phone: '050-1234567' } as never) as { phone?: string }).phone).toBe('050-1234567');
  });
  it('C7 · detectRecurringHok מזהה הו"ק גם מחיובי-סולה דולריים חוזרים', async () => {
    const { detectRecurringHok } = await import('../nedarimSync');
    const sups = [{
      id: 's1', name: 'א', hist: [
        { d: '2026-05-25', a: 180, c: '$', clearer: 'סולה', txn: 't1' },
        { d: '2026-06-25', a: 180, c: '$', clearer: 'סולה', txn: 't2' },
        { d: '2026-07-25', a: 180, c: '$', clearer: 'סולה', txn: 't3' },
      ],
    }] as never[];
    const { detected, supporters } = detectRecurringHok(sups, '2026-08-23');
    expect(detected).toBe(1);
    const hok = (supporters[0] as { hok?: { amount: number; cur: string; active: boolean } }).hok;
    expect(hok?.amount).toBe(180);
    expect(hok?.cur).toBe('$');
    expect(hok?.active).toBe(true);
  });
  it('C1+C3+C5+C13 · הגנות-מקור: שער-הזיכויים, סינון-סולה מהחיבור-החי ומסנכרון-נדרים, איפוס משמר hist-זר', async () => {
    const store = (await import('../../store/useApp.ts?raw')).default as string;
    expect(store).toMatch(/chargesAdded > 0 \|\| plan\.summary\.refundsApplied > 0/); // C1
    expect(store).toMatch(/sup-ned-'\) && !\(s\.hist \?\? \[\]\)\.some\(\(h\) => h\.clearer && h\.clearer !== 'נדרים'\)/); // C5 reset
    expect(store).toMatch(/sup-ned-txn-'\) && !\(s\.hist \?\? \[\]\)\.some/); // C5 junk
    const app = (await import('../../App.tsx?raw')).default as string;
    expect(app).toMatch(/rows\.filter\(\(r\) => r\.provider !== 'sola'\)/); // C3
    expect(app).toMatch(/applyNedarimAuto\(nedRows\)/);
    const modal = (await import('../../components/supporters/NedarimSyncModal.tsx?raw')).default as string;
    expect(modal).toMatch(/charges\.filter\(\(c\) => c\.provider !== 'sola'\)/); // C13
    expect(modal).toMatch(/repairCards\(provRows, 'סולה'\)[\s\S]{0,200}resetNedarimImport\(\)/); // C6
    const inc = (await import('../../components/supporters/IncomingPayments.tsx?raw')).default as string;
    expect(inc).toMatch(/p\.d \|\| p\.at\.slice\(0, 10\)/); // C4
    expect(inc).toMatch(/failed\+\+/); // C8
    expect(inc).toMatch(/auditNote\('✓ סימון תשלום-נכנס כטופל'/); // C9
  });
});
