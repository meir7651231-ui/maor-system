/**
 * ratchet — מסלול-B פאזה-1: שכבת-פיצול התרומות (טהורה). האינווריאנט העליון לפני
 * כל חיווט-ענן: reassemble(explode(sp)) שקול-פונקציונלית ל-sp — אותה קבוצת-תרומות,
 * אותה צבירה (supporterAggregates), hist לא-נגוע, שדות-בסיס לא-נגועים. מפתח-הפיצול
 * = purpose (מסנן-ההרשאה), לא designation.
 */
import { describe, expect, it } from 'vitest';
import type { Donation, Supporter } from '../../types/domain';
import { supporterAggregates } from '../supporterAgg';
import { SHARED_PURPOSE_KEY, purposeKeyOf, explodeSupporter, reassembleDonations, donationPartitionDiff, donAllowedKeys } from '../donationPartition';

const don = (rid: string, date: string, amount: number, extra: Partial<Donation> = {}): Donation =>
  ({ rid, date, amount, cur: '₪', cat: 'כללי', ...extra });

const sup = (id: string, donations: Donation[], hist?: Supporter['hist']): Supporter =>
  ({ id, name: id, donations, ...(hist ? { hist } : {}) }) as unknown as Supporter;

describe('donAllowedKeys — ערכי-שאילתה לעובד/ת מוגבל/ת (סימטרי ל-supAllowedKeys)', () => {
  it('מנקה רווחים+כפולים+ריקים ומוסיף את המשותף', () => {
    expect(donAllowedKeys(['חתונות', 'כללי'])).toEqual(['חתונות', 'כללי', SHARED_PURPOSE_KEY]);
    expect(donAllowedKeys([' א ', 'א', ''])).toEqual(['א', SHARED_PURPOSE_KEY]);
  });
  it('חוסם ב-30 ערכי-in של Firestore (29 ייעודים + המשותף)', () => {
    const many = Array.from({ length: 40 }, (_, i) => 'p' + i);
    const keys = donAllowedKeys(many);
    expect(keys.length).toBe(30);
    expect(keys[29]).toBe(SHARED_PURPOSE_KEY);
  });
});

describe('purposeKeyOf — מפתח-הפיצול לפי purpose (לא designation)', () => {
  it('ריק/רווחים ⇒ משותף', () => {
    expect(purposeKeyOf({})).toBe(SHARED_PURPOSE_KEY);
    expect(purposeKeyOf({ purpose: '  ' })).toBe(SHARED_PURPOSE_KEY);
  });
  it('ייעוד-אמת ⇒ ה-purpose המחוטא', () => {
    expect(purposeKeyOf({ purpose: 'חתונות' })).toBe('חתונות');
  });
  it('מתעלם מ-designation (תג-אימוץ, לא הרשאה)', () => {
    // designation='אמץ חתן' אך purpose ריק ⇒ משותף (designation לא משפיע על המפתח)
    expect(purposeKeyOf({ purpose: '', designation: 'אמץ חתן' } as Donation)).toBe(SHARED_PURPOSE_KEY);
  });
});

describe('explode/reassemble — זהות-פונקציונלית (הליבה)', () => {
  const s = sup(
    'sp1',
    [
      don('D-3', '2026-03-01', 50, { purpose: 'חתונות' }),
      don('D-1', '2026-01-01', 100), // בלי purpose = משותף
      don('D-2', '2026-02-01', 25, { cur: '$', purpose: 'בית-כנסת' }),
    ],
    [{ d: '2025-12-01', a: 999 }], // hist — לא-קבלה, מקונן
  );

  it('explode: id=rid · supporterId · pkey=purpose · התרומה שלמה · hist לא נכלל', () => {
    const docs = explodeSupporter(s);
    expect(docs.map((x) => x.id).sort()).toEqual(['D-1', 'D-2', 'D-3']);
    expect(docs.every((x) => x.supporterId === 'sp1')).toBe(true);
    const byId = Object.fromEntries(docs.map((x) => [x.id, x]));
    expect(byId['D-1'].pkey).toBe(SHARED_PURPOSE_KEY);
    expect(byId['D-3'].pkey).toBe('חתונות');
    expect(byId['D-2'].pkey).toBe('בית-כנסת');
    expect(byId['D-3'].donation).toEqual(don('D-3', '2026-03-01', 50, { purpose: 'חתונות' }));
  });

  it('reassemble(explode(sp)) — אותה קבוצת-תרומות, צבירה זהה, hist זהה', () => {
    const back = reassembleDonations({ ...s, donations: [] }, explodeSupporter(s));
    // אותה קבוצת-תרומות (כ-set, לפי rid)
    expect(back.donations.map((d) => d.rid).sort()).toEqual(['D-1', 'D-2', 'D-3']);
    // צבירה זהה (הסיכון-#1: אסור שהמעגל ישנה count/ils/usd/first/last)
    expect(supporterAggregates(back)).toEqual(supporterAggregates(s));
    // hist לא-נגוע (מקונן, מחוץ-לפיצול)
    expect(back.hist).toEqual(s.hist);
    // שדות-בסיס לא-נגועים
    expect(back.id).toBe('sp1');
    expect(back.name).toBe('sp1');
  });

  it('סדר-קלט אקראי ⇒ אותה צבירה (המיון הדטרמיניסטי אינרטי)', () => {
    const shuffled = sup('sp1', [s.donations[2], s.donations[0], s.donations[1]]);
    const back = reassembleDonations({ ...shuffled, donations: [] }, explodeSupporter(shuffled));
    expect(supporterAggregates(back)).toEqual(supporterAggregates(s));
    // מיון דטרמיניסטי לפי תאריך ואז rid
    expect(back.donations.map((d) => d.rid)).toEqual(['D-1', 'D-2', 'D-3']);
  });

  it('מסמך-זר (supporterId אחר) לא נכנס לתומך', () => {
    const foreign = { id: 'D-9', supporterId: 'OTHER', pkey: SHARED_PURPOSE_KEY, donation: don('D-9', '2026-04-01', 1) };
    const back = reassembleDonations({ ...s, donations: [] }, [...explodeSupporter(s), foreign]);
    expect(back.donations.map((d) => d.rid)).not.toContain('D-9');
  });

  it('תומך בלי תרומות ⇒ explode ריק, reassemble שומר על ריק', () => {
    const empty = sup('sp2', []);
    expect(explodeSupporter(empty)).toEqual([]);
    expect(reassembleDonations(empty, []).donations).toEqual([]);
  });
});

describe('donationPartitionDiff — הצד-הדוחף (טהור)', () => {
  const A = sup('spA', [don('D-1', '2026-01-01', 100), don('D-2', '2026-02-01', 50, { purpose: 'חתונות' })]);

  it('תרומה חדשה ⇒ set; אין מחיקות', () => {
    const next = sup('spA', [...A.donations, don('D-3', '2026-03-01', 20)]);
    const diff = donationPartitionDiff([A], [next]);
    expect(diff.sets.map((s) => s.id)).toEqual(['D-3']);
    expect(diff.deletes).toEqual([]);
  });

  it('תרומה שהוסרה ⇒ delete', () => {
    const next = sup('spA', [A.donations[0]]);
    const diff = donationPartitionDiff([A], [next]);
    expect(diff.sets).toEqual([]);
    expect(diff.deletes).toEqual(['D-2']);
  });

  it('שינוי-ייעוד ⇒ set (pkey/תוכן שונה)', () => {
    const next = sup('spA', [A.donations[0], { ...A.donations[1], purpose: 'בית-כנסת' }]);
    const diff = donationPartitionDiff([A], [next]);
    expect(diff.sets.map((s) => s.id)).toEqual(['D-2']);
    expect(diff.sets[0].pkey).toBe('בית-כנסת');
  });

  it('תרומה שעברה תומך ⇒ set עם supporterId חדש', () => {
    const B = sup('spB', []);
    const nextA = sup('spA', [A.donations[0]]);
    const nextB = sup('spB', [A.donations[1]]);
    const diff = donationPartitionDiff([A, B], [nextA, nextB]);
    expect(diff.sets.map((s) => s.id)).toEqual(['D-2']);
    expect(diff.sets[0].supporterId).toBe('spB');
    expect(diff.deletes).toEqual([]); // D-2 עדיין קיים (עבר), לא נמחק
  });

  it('אין שינוי ⇒ diff ריק', () => {
    const diff = donationPartitionDiff([A], [sup('spA', [...A.donations])]);
    expect(diff.sets).toEqual([]);
    expect(diff.deletes).toEqual([]);
  });
});
