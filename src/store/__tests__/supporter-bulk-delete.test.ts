/**
 * ratchet — מחיקה-מרובה של תומכים (בקשת-בעלים 13.8): "אי אפשר למחוק תורמים
 * רק אחד". deleteSupporters מוחק את כל ה-ids בעדכון-מצב יחיד, עם אותו ניקוי-
 * מדורג כמו הבודד: תזכורות יעד-קשר (nextEventId) + אירועי מעקב-עי"ן (spId) —
 * כדי שלא יישארו יתומים בלוח. הלא-מסומנים ואירועיהם שורדים בדיוק.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db } from '../../types/domain';

const db = () => useApp.getState().db;

const sup = (id: string, name: string, over: Record<string, unknown> = {}) =>
  ({
    id, name, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    ...over,
  }) as unknown as Db['supporters'][number];

const evOf = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id, type: 'reminder', title: 'ת', date: '2026-08-13', time: '', famId: '', done: false,
    priority: 'orange', customType: '', notes: '', price: 0, roomId: '', ...over,
  }) as unknown as Db['events'][number];

beforeEach(() => {
  useApp.getState().setDb(() => ({
    ...emptyDb(),
    supporters: [
      sup('s1', 'בינדר', { nextEventId: 'call1' }),
      sup('s2', 'רות'),
      sup('s3', 'כהן', { nextEventId: 'call3' }),
    ],
    // call1/call3 = תזכורות של s1/s3; ayin2 = אירוע מעקב-עי"ן של s2 (spId); keep = לא-קשור
    events: [
      evOf('call1', { type: 'call' }),
      evOf('ayin2', { spId: 's2' }),
      evOf('call3', { type: 'call' }),
      evOf('keep'),
    ],
  }));
});

describe('🗑 מחיקה-מרובה — deleteSupporters', () => {
  it('מוחק את כל המסומנים; הלא-מסומן (s3) שורד', () => {
    useApp.getState().deleteSupporters(['s1', 's2']);
    expect(db().supporters.map((s) => s.id)).toEqual(['s3']);
  });

  it('ניקוי-מדורג: תזכורת-הקשר של s1 ואירוע-העי"ן של s2 נמחקים; keep + call3 שורדים', () => {
    useApp.getState().deleteSupporters(['s1', 's2']);
    expect(db().events.map((e) => e.id).sort()).toEqual(['call3', 'keep']);
  });

  it('רשימה ריקה = no-op (לא נוגע בנתונים)', () => {
    useApp.getState().deleteSupporters([]);
    expect(db().supporters.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    expect(db().events.length).toBe(4);
  });

  it('מחיקת כולם — הרשימה מתרוקנת, וכל האירועים המקושרים נעלמים', () => {
    useApp.getState().deleteSupporters(['s1', 's2', 's3']);
    expect(db().supporters).toEqual([]);
    expect(db().events.map((e) => e.id)).toEqual(['keep']); // call1/call3/ayin2 נוקו
  });
});
