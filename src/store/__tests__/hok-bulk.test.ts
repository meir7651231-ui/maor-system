/**
 * ratchet — רישום-הו״ק המוני (bulkRecordHok, הכרעת-בעלים "בחירה ידנית מרשימה").
 *
 * לחיצה-אחת-שמבצעת: רושמת חיוב-החודש למספר תורמים בבת-אחת ⇒ קבלות-מס D- רציפות.
 * מקבע: רציפות-המספור, דילוג בטוח על מי-שכבר-נרשם/לא-פעיל, כתיבה אטומית, ואי-כפילות.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Hok, Supporter } from '../../types/domain';
import { HOK_CAT } from '../../components/supporters/lib';

const TODAY = '2026-07-15';
const hok = (amount: number, cur: '₪' | '$' = '₪'): Hok => ({
  amount, cur, day: 5, method: 'bank', note: '', active: true, startedAt: '2025-01-01',
});
function sup(id: string, h: Hok | undefined, donations: Supporter['donations'] = []): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: donations.length, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations, ...(h ? { hok: h } : {}),
  } as Supporter;
}
function seed(): Db {
  return {
    ...emptyDb(),
    supporters: [
      sup('a', hok(100)), // פעילה · טרם נרשמה
      sup('b', hok(250)), // פעילה · טרם נרשמה
      sup('c', hok(300), [{ rid: 'D-9', date: '2026-07-03', amount: 300, cur: '₪', cat: HOK_CAT }]), // כבר נרשמה החודש
      sup('d', undefined), // בלי הו״ק
    ],
  };
}
const db = () => useApp.getState().db;
const donsOf = (id: string) => db().supporters.find((s) => s.id === id)!.donations;

beforeEach(() => {
  useApp.getState().setDb(() => ({ ...seed(), donationSeq: 1 }));
});

describe('🔁 ratchet — רישום-הו״ק המוני', () => {
  it('רושם רק את המסומנים-הכשירים, ומדלג על מי-שכבר-נרשם', () => {
    const res = useApp.getState().bulkRecordHok(['a', 'b', 'c'], TODAY);
    expect(res.done).toBe(2); // a,b נרשמו
    expect(res.failed).toBe(1); // c דולג (כבר נרשם)
    expect(donsOf('a')[0]).toMatchObject({ amount: 100, cat: HOK_CAT, date: TODAY });
    expect(donsOf('b')[0]).toMatchObject({ amount: 250, cat: HOK_CAT });
    expect(donsOf('c').length).toBe(1); // ללא כפילות
  });

  it('קבלות D- רציפות ובלי חורים על הרישום-ההמוני', () => {
    useApp.getState().bulkRecordHok(['a', 'b'], TODAY);
    const rids = [donsOf('a')[0].rid, donsOf('b')[0].rid].sort();
    expect(rids).toEqual(['D-1', 'D-2']);
    expect(db().donationSeq).toBe(3); // התקדם בדיוק ב-2
  });

  it('מזהה-לא-קיים / בלי-הו״ק נספר ככשל ולא צורך מונה', () => {
    const res = useApp.getState().bulkRecordHok(['a', 'ghost', 'd'], TODAY);
    expect(res.done).toBe(1); // רק a
    expect(res.failed).toBe(2); // ghost (לא קיים) + d (בלי הו״ק)
    expect(db().donationSeq).toBe(2); // נצרך רק אחד
  });

  it('rids מוחזר עם סכום ומטבע לכל חיוב', () => {
    const res = useApp.getState().bulkRecordHok(['a', 'b'], TODAY);
    expect(res.rids).toHaveLength(2);
    expect(res.rids.map((r) => r.amount).sort((x, y) => x - y)).toEqual([100, 250]);
  });
});
