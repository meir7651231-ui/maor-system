/**
 * ratchet — איפוס-מלא של ייבוא-נדרים (resetNedarimImport, 19.8.2026).
 * באג-פרודקשן: החיבור-החי יצר כרטיס-תומך פר-עסקה ⇒ ניפוח מספר-התומכים.
 * האיפוס מחזיר למצב-שלפני: (1) מוחק כל כרטיס שנוצר מנדרים (id 'sup-ned-');
 * (2) מנקה מהמקוריים hist מנדרים (clearer='נדרים') + extId. שומר: כרטיסים
 * מקוריים, hist-לגאסי (clearer≠נדרים), תרומות/קבלות. מנקה אירועים-יתומים.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db } from '../../types/domain';

const db = () => useApp.getState().db;

const sup = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id, name: 'תומך ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    ...over,
  }) as unknown as Db['supporters'][number];

beforeEach(() => {
  useApp.getState().setDb(() => ({
    ...emptyDb(),
    supporters: [
      // מקורי טהור — לא נגע בו נדרים (hist-לגאסי, בלי extId)
      sup('orig', { hist: [{ d: '2020-01-01', a: 50, c: '₪', clearer: 'ויזה כאל' }] }),
      // מקורי שהועשר ע"י נדרים — extId + hist מנדרים (+ hist-לגאסי שנשמר)
      sup('enr', {
        extId: '777',
        hist: [
          { d: '2019-01-01', a: 30, c: '₪', clearer: 'ויזה כאל' }, // לגאסי — נשמר
          { d: '2019-06-01', a: 60, c: '₪', clearer: 'נדרים', txn: 'T1' }, // נדרים — מנוקה
        ],
      }),
      sup('sup-ned-900', { extId: '900' }), // כרטיס-תורם שנוצר מנדרים
      sup('sup-ned-txn-1', { nextEventId: 'ev1', hist: [{ d: '2019-06-12', a: 360, c: '₪', clearer: 'נדרים', txn: 'X1' }] }), // כרטיס-עסקה אוטומטי
    ],
    events: [
      { id: 'ev1', type: 'call', title: 'ת', date: '2026-08-19', time: '', famId: '', done: false, priority: 'orange', customType: '', notes: '', price: 0, roomId: '' },
      { id: 'keep', type: 'reminder', title: 'ק', date: '2026-08-19', time: '', famId: '', done: false, priority: 'orange', customType: '', notes: '', price: 0, roomId: '' },
    ] as unknown as Db['events'],
  }));
});

describe('🔄 ratchet — resetNedarimImport', () => {
  it('מוחק את כל הכרטיסים שנוצרו מנדרים (sup-ned-*), משאיר את המקוריים', () => {
    const removed = useApp.getState().resetNedarimImport();
    expect(removed).toBe(2); // sup-ned-900 + sup-ned-txn-1
    expect(db().supporters.map((s) => s.id).sort()).toEqual(['enr', 'orig']);
  });

  it('מנקה מהמקורי-שהועשר את hist-נדרים ואת extId; hist-לגאסי נשמר', () => {
    useApp.getState().resetNedarimImport();
    const enr = db().supporters.find((s) => s.id === 'enr')!;
    expect(enr.extId).toBeUndefined();
    expect(enr.hist).toHaveLength(1); // רק הלגאסי נשאר
    expect(enr.hist![0].clearer).toBe('ויזה כאל');
  });

  it('המקורי-הטהור לא נגע (hist-לגאסי שלם)', () => {
    useApp.getState().resetNedarimImport();
    const orig = db().supporters.find((s) => s.id === 'orig')!;
    expect(orig.hist).toHaveLength(1);
    expect(orig.hist![0].a).toBe(50);
  });

  it('ניקוי אירוע-יתום של כרטיס-שנמחק; אירוע לא-קשור נשמר', () => {
    useApp.getState().resetNedarimImport();
    expect(db().events.map((e) => e.id)).toEqual(['keep']);
  });
});
