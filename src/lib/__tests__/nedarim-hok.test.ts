/**
 * ratchet — מילוי-אוטומטי של הו"ק מנדרים (הכרעת-בעלים 19.8: "שיתמלא אוטומטית
 * מנדרים ישר למשבצת של הו"ק"). חיוב-נדרים חוזר (kevaId) ⇒ הכרטיס מסומן כהו"ק
 * פעיל (סכום/מטבע/יום מהחיוב); הו"ק-ידני לא נדרס. + hokRecordedThisMonth מזהה
 * חיוב-נדרים ב-hist ⇒ תורם שנדרים כבר חייב החודש לא מופיע כ"ממתין".
 */
import { describe, expect, it } from 'vitest';
import { attachChargeTo, chargeToHist, detectRecurringHok, planNedarimSync, withNedarimHok, type SyncCharge } from '../nedarimSync';
import { hokRecordedThisMonth, hokDue, hokEffectivelyActive, hokMonthlyTotal, supCount } from '../../components/supporters/lib';
import type { Supporter } from '../../types/domain';

const sp = (over: Partial<Supporter> = {}): Supporter => ({
  id: 'x', name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
  notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
});

describe('🔁 ratchet — withNedarimHok (מילוי-אוטומטי מ-kevaId)', () => {
  it('חיוב חוזר ⇒ משבצת-הו"ק מלאה (סכום/מטבע/יום/פעיל/kevaId)', () => {
    const out = withNedarimHok(sp(), { amount: 180, currency: '₪', d: '2026-08-12', kevaId: 'K7' });
    expect(out.hok).toMatchObject({ amount: 180, cur: '₪', day: 12, active: true, method: 'card', kevaId: 'K7' });
  });
  it('יום>28 ⇒ נחתך ל-28 (קיים בכל חודש)', () => {
    expect(withNedarimHok(sp(), { amount: 50, d: '2026-01-31', kevaId: 'K1' }).hok?.day).toBe(28);
  });
  it('חיוב לא-חוזר (בלי kevaId) ⇒ אין הו"ק', () => {
    expect(withNedarimHok(sp(), { amount: 50, d: '2026-08-01' }).hok).toBeUndefined();
  });
  it('הו"ק ידני (בלי kevaId) לא נדרס', () => {
    const manual = sp({ hok: { amount: 999, cur: '₪', day: 5, method: 'bank', note: 'ידני', active: true, startedAt: '2020-01-01' } });
    expect(withNedarimHok(manual, { amount: 50, d: '2026-08-01', kevaId: 'K9' }).hok?.amount).toBe(999);
  });
  it('startedAt = המוקדם-ביותר; עדכון-חוזר שומר את תאריך-ההתחלה', () => {
    const first = withNedarimHok(sp(), { amount: 100, d: '2024-03-03', kevaId: 'K1' });
    const later = withNedarimHok(first, { amount: 120, d: '2026-08-03', kevaId: 'K1' });
    expect(later.hok?.startedAt).toBe('2024-03-03'); // נשמר המוקדם
    expect(later.hok?.amount).toBe(120); // הסכום מתעדכן לאחרון
  });
});

describe('🔁 ratchet — hokRecordedThisMonth מזהה חיוב-נדרים ב-hist', () => {
  const today = '2026-08-19';
  it('חיוב-נדרים החודש בסכום-ההוראה ⇒ "נרשם" (לא ממתין)', () => {
    const s = sp({
      hok: { amount: 180, cur: '₪', day: 12, method: 'card', note: '', active: true, startedAt: '2025-01-01', kevaId: 'K7' },
      hist: [{ d: '2026-08-12', a: 180, c: '₪', clearer: 'נדרים' }],
    });
    expect(hokRecordedThisMonth(s, today)).toBe(true);
    expect(hokDue([s], today)).toHaveLength(0); // לא ממתין
  });
  it('בלי חיוב-החודש ⇒ עדיין ממתין', () => {
    const s = sp({
      hok: { amount: 180, cur: '₪', day: 12, method: 'card', note: '', active: true, startedAt: '2025-01-01', kevaId: 'K7' },
      hist: [{ d: '2026-07-12', a: 180, c: '₪', clearer: 'נדרים' }], // חודש קודם
    });
    expect(hokRecordedThisMonth(s, today)).toBe(false);
    expect(hokDue([s], today)).toHaveLength(1);
  });
});

describe('🔁 ratchet — detectRecurringHok (זיהוי-רטרואקטיבי מ-hist)', () => {
  const today = '2026-08-19';
  const ndHist = (dates: string[], amount = 100, cur: '₪' | '$' = '₪') =>
    dates.map((d) => ({ d, a: amount, c: cur, clearer: 'נדרים' }));

  it('אותו סכום ב-3 חודשים שונים ⇒ הו"ק זוהה (day=השכיח, active)', () => {
    const pool = [sp({ id: 'a', hist: ndHist(['2026-06-10', '2026-07-10', '2026-08-10']) })];
    const { supporters, detected } = detectRecurringHok(pool, today);
    expect(detected).toBe(1);
    expect(supporters[0].hok).toMatchObject({ amount: 100, cur: '₪', day: 10, active: true });
  });
  it('פחות מ-3 חודשים ⇒ לא מזוהה', () => {
    const pool = [sp({ id: 'a', hist: ndHist(['2026-07-10', '2026-08-10']) })];
    expect(detectRecurringHok(pool, today).detected).toBe(0);
  });
  it('חיוב אחרון ישן (>2 חודשים) ⇒ הו"ק לא-פעיל (lapsed)', () => {
    const pool = [sp({ id: 'a', hist: ndHist(['2025-01-10', '2025-02-10', '2025-03-10']) })];
    const out = detectRecurringHok(pool, today).supporters[0];
    expect(out.hok?.active).toBe(false);
  });
  it('הו"ק ידני (בלי kevaId) לא נדרס', () => {
    const pool = [sp({ id: 'a', hok: { amount: 555, cur: '₪', day: 3, method: 'bank', note: 'ידני', active: true, startedAt: '2020-01-01' }, hist: ndHist(['2026-06-10', '2026-07-10', '2026-08-10']) })];
    expect(detectRecurringHok(pool, today).supporters[0].hok?.amount).toBe(555);
  });
  it('בוחר את הסכום השכיח (מפריד חד-פעמיים)', () => {
    const pool = [sp({ id: 'a', hist: [...ndHist(['2026-05-10', '2026-06-10', '2026-07-10'], 100), ...ndHist(['2026-08-10'], 500)] })];
    expect(detectRecurringHok(pool, today).supporters[0].hok?.amount).toBe(100);
  });
  // 🐛 סכום משתנה בין שנים (₪100 ואז ₪120) — הגרסה הקודמת דרשה סכום-זהה ב-3
  // חודשים ⇒ פספסה ~400 תורמים ("300 במקום 700"). עכשיו: חודשים-שונים מכל סכום.
  it('סכום משתנה בין חודשים (4 חודשים שונים) ⇒ עדיין מזוהה', () => {
    const pool = [sp({ id: 'a', hist: [...ndHist(['2026-05-10', '2026-06-10'], 100), ...ndHist(['2026-07-10', '2026-08-10'], 120)] })];
    const out = detectRecurringHok(pool, today);
    expect(out.detected).toBe(1);
    expect(out.supporters[0].hok?.active).toBe(true);
  });
  it('חיוב-בודד עם kevaId ⇒ מזוהה גם בחודש אחד', () => {
    const pool = [sp({ id: 'a', hist: [{ d: '2026-08-10', a: 77, c: '₪', clearer: 'נדרים', kevaId: 'K1' }] })];
    expect(detectRecurringHok(pool, today).detected).toBe(1);
  });
  it('kevaId ב-hist (חיוב חדש) נשמר בהו"ק', () => {
    const h = chargeToHist({ amount: 100, d: '2026-08-10', kevaId: 'K42' });
    expect(h.kevaId).toBe('K42');
    const pool = [sp({ id: 'a', hist: [{ ...h }, { d: '2026-07-10', a: 100, c: '₪', clearer: 'נדרים' }, { d: '2026-06-10', a: 100, c: '₪', clearer: 'נדרים' }] })];
    expect(detectRecurringHok(pool, today).supporters[0].hok?.kevaId).toBe('K42');
  });
});

// 🐛 תורם שביטל הו"ק בנדרים נשאר active:true לנצח (אין אירוע-ביטול) ⇒ ניפוח
// ההכנסה-הקבועה + "ממתין" נצחי. עכשיו: hokEffectivelyActive מלפף הו"ק-נדרים
// שאין-לה חיוב מזה >2 חודשים (נגזרת, מתאוששת אם חיובים חוזרים). (תיקון 20.8)
describe('🔁 ratchet — hokEffectivelyActive (לאפ-אוטומטי להו"ק-נדרים)', () => {
  const today = '2026-08-19';
  const hok = (over: Partial<NonNullable<Supporter['hok']>> = {}) => ({
    amount: 100, cur: '₪' as const, day: 10, method: 'card' as const, note: '', active: true, startedAt: '2025-01-01', ...over,
  });
  it('הו"ק-נדרים עם חיוב אחרון >2 חודשים ⇒ פגה (לא-פעילה אפקטיבית)', () => {
    const s = sp({ hok: hok({ kevaId: 'K1' }), hist: [{ d: '2026-05-10', a: 100, c: '₪', clearer: 'נדרים' }] });
    expect(hokEffectivelyActive(s, today)).toBe(false);
    expect(hokDue([s], today)).toHaveLength(0); // לא מוצג כ"ממתין"
    expect(hokMonthlyTotal([s], 3.7, today)).toBe(0); // לא נספר בהכנסה-הקבועה
  });
  it('הו"ק-נדרים עם חיוב אחרון ≤2 חודשים ⇒ פעילה', () => {
    const s = sp({ hok: hok({ kevaId: 'K1' }), hist: [{ d: '2026-07-10', a: 100, c: '₪', clearer: 'נדרים' }] });
    expect(hokEffectivelyActive(s, today)).toBe(true);
  });
  it('הו"ק ידני (בלי kevaId) ⇒ תמיד פעילה לפי הדגל (אין לאפ-אוטומטי)', () => {
    const s = sp({ hok: hok({ note: 'ידני' }), hist: [{ d: '2020-01-10', a: 100, c: '₪', clearer: 'נדרים' }] });
    expect(hokEffectivelyActive(s, today)).toBe(true);
  });
  it('הו"ק-נדרים בלי היסטוריה עדיין ⇒ סומכים על הדגל (פעילה)', () => {
    expect(hokEffectivelyActive(sp({ hok: hok({ kevaId: 'K1' }) }), today)).toBe(true);
  });
});

// 🐛 hokRecordedThisMonth דרש סכום-מדויק ⇒ הו"ק בסכום-משתנה הוצגה שגוי כ"ממתין".
// עכשיו: חיוב-נדרים כלשהו החודש (clearer='נדרים') מכסה, בלי דרישת-סכום.
describe('🔁 ratchet — hokRecordedThisMonth רופף לסכום (חיוב-נדרים החודש)', () => {
  const today = '2026-08-19';
  it('חיוב-נדרים החודש בסכום שונה מההוראה ⇒ עדיין "נרשם"', () => {
    const s = sp({
      hok: { amount: 100, cur: '₪', day: 10, method: 'card', note: '', active: true, startedAt: '2025-01-01', kevaId: 'K1' },
      hist: [{ d: '2026-08-10', a: 120, c: '₪', clearer: 'נדרים' }], // סכום חורג (120≠100)
    });
    expect(hokRecordedThisMonth(s, today)).toBe(true);
    expect(hokDue([s], today)).toHaveLength(0);
  });
});

// 🐛 supCount ספר כל שורת-hist — זיכוי/ביטול עתידי (a≤0) ינפח את הספירה. עכשיו: חיובי בלבד.
describe('🔁 ratchet — supCount סופר רק שורות-hist חיוביות', () => {
  it('שורת-hist שלילית/אפס לא נספרת ב-supCount (supIls מקזז מעצם הסכימה)', () => {
    const s = sp({ count: 0, hist: [{ d: '2026-08-10', a: 100, c: '₪', clearer: 'נדרים' }, { d: '2026-08-11', a: -100, c: '₪', clearer: 'נדרים' }] });
    expect(supCount(s)).toBe(1); // רק החיובי — לא 2
  });
});

describe('🔁 ratchet — חיווט מלא (attach/sync ⇒ הו"ק)', () => {
  it('attachChargeTo עם kevaId ⇒ הכרטיס מקבל הו"ק', () => {
    const pool = [sp({ id: 'a', name: 'כהן' })];
    const { supporters } = attachChargeTo(pool, 'a', { amount: 200, d: '2026-08-05', kevaId: 'K3', txnId: 'T1' });
    expect(supporters[0].hok).toMatchObject({ amount: 200, kevaId: 'K3', active: true });
  });
  it('planNedarimSync: עסקה חוזרת מחברת ל-hist וגם ממלאת הו"ק', () => {
    const existing = [sp({ id: 'a', name: 'לוי', phone: '0501234567' })];
    const charges: SyncCharge[] = [{ id: 'c1', amount: 90, currency: '₪', name: 'לוי', phone: '0501234567', d: '2026-08-08', kevaId: 'K5', txnId: 'T5' }];
    const plan = planNedarimSync(existing, [], charges);
    const target = plan.supporters.find((s) => s.id === 'a')!;
    expect(target.hist?.some((h) => h.txn === 'T5')).toBe(true);
    expect(target.hok).toMatchObject({ amount: 90, kevaId: 'K5', active: true });
    expect(plan.summary.recurring).toBe(1);
  });
  it('🛡 מסך-הסנכרון: כפתור זיהוי-הו"ק מחווט ל-detectNedarimHok', async () => {
    const src = (await import('../../components/supporters/NedarimSyncModal.tsx?raw')).default as string;
    expect(src).toContain('🔁 זהה הוראות-קבע מנדרים');
    expect(src).toContain('detectNedarimHok()');
  });
});
