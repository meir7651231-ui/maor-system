/**
 * ratchet — תיקוני נחיל-9×9 (13.8): שני באגים שנתפסו ע"י הסקירה הרב-עדשתית.
 *  A. כפילות-ספירת-היסטוריה (HIGH, money): migrate/addDonation שמרו count/ils/usd
 *     = donations+hist, והתצוגה הוסיפה hist שוב ⇒ ₪ כפול-היסטוריה. הנעילה: המונה
 *     השמור = קבלות-בלבד; supIls מוסיף hist פעם אחת.
 *  B. course.sessions===undefined (MED, crash): חוג מגיבוי-ישן קרס ביצוא/עריכה;
 *     migrate מנרמל ל-[].
 *  C. חסימת-הוצאת-מידע (feature): exportBackup חסום כש-core.export=false.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import { supIls, supCount } from '../../components/supporters/lib';
import type { Supporter } from '../../types/domain';

describe('A · כפילות-ספירת-היסטוריה — המונה השמור נשאר קבלות-בלבד', () => {
  it('migrate: תורם עם קבלות ₪300 + היסטוריה ₪500 ⇒ שמור=300, תצוגה=800 (לא 1300)', () => {
    const raw = {
      ...emptyDb(),
      supporters: [
        {
          id: 'sp1', name: 'בינדר', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
          notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
          donations: [{ rid: 'D-1', date: '2026-08-01', amount: 300, cur: '₪', cat: 'כללי' }],
          hist: [{ d: '2020-01-01', a: 500 }],
        },
      ],
    } as unknown;
    const m = migrate(raw)!;
    const sp = m.supporters[0] as Supporter;
    expect(sp.ils).toBe(300); // שמור = קבלות בלבד (לא 800, ובוודאי לא 1300)
    expect(sp.count).toBe(1);
    expect(supIls(sp)).toBe(800); // תצוגה = קבלות + hist פעם אחת
    expect(supCount(sp)).toBe(2);
  });
});

describe('B · course.sessions===undefined לא מקריס', () => {
  it('migrate מנרמל course.sessions חסר ל-[]', () => {
    const raw = {
      ...emptyDb(),
      courses: [{ id: 'c1', name: 'ציור', teacherId: '', roomId: 'r1', weekday: 0, time: '17:00' }],
    } as unknown;
    const m = migrate(raw)!;
    expect(Array.isArray(m.courses[0].sessions)).toBe(true);
    expect(m.courses[0].sessions).toEqual([]);
  });
});

describe('C · חסימת הוצאת-מידע פר-עובד', () => {
  beforeEach(() => useApp.getState().setDb(() => ({ ...emptyDb() })));
  it('core.export=false ⇒ exportBackup לא מוריד גיבוי (חסימה ברמת-הפעולה)', () => {
    let toasted = '';
    useApp.setState({ config: { ...useApp.getState().config, features: { 'core.export': false } }, toast: (m: string) => { toasted = m; } } as never);
    useApp.getState().exportBackup();
    expect(toasted).toContain('חסומה');
  });
});
