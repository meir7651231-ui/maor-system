/**
 * ratchet — ריענון תאריכי-דמו (הכרעת בעלים "דמו לפי תאריכים קרובים").
 * מזיז תאריכי-תזמון (חוגים/אירועים/ימי-חלוקה/שיבוצים) בדלתא מ-DEMO_ANCHOR עד היום,
 * ו**לא נוגע** בנתונים אישיים (תרומות/לידה). מוחל רק במסלולי-דמו.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import { DEMO_ANCHOR, freshenDemoDb } from '../demoFresh';

function baseDb(): Db {
  return {
    ...emptyDb(),
    courses: [{ start: DEMO_ANCHOR, end: DEMO_ANCHOR } as Db['courses'][number]],
    events: [{ date: DEMO_ANCHOR } as Db['events'][number]],
    distributionDays: [{ date: DEMO_ANCHOR, createdAt: DEMO_ANCHOR } as Db['distributionDays'][number]],
    enrollments: [{ dueDate: DEMO_ANCHOR, enrolledAt: DEMO_ANCHOR } as Db['enrollments'][number]],
    supporters: [{ donations: [{ date: '2011-05-01', amount: 100, cur: '₪', rid: 'D-1', cat: '' }] } as Db['supporters'][number]],
    families: [{ members: [{ birth: '2015-03-03' }] } as Db['families'][number]],
  };
}

describe('🗓️ ratchet — freshenDemoDb', () => {
  it('דלתא 0 (היום = העוגן) — אין שינוי', () => {
    const db = baseDb();
    expect(freshenDemoDb(db, DEMO_ANCHOR)).toEqual(db);
  });

  it('מזיז תאריכי-תזמון קדימה בדלתא (30 יום)', () => {
    // 2026-08-02 + 30 יום = 2026-09-01
    const out = freshenDemoDb(baseDb(), '2026-09-01');
    expect(out.courses[0].start).toBe('2026-09-01');
    expect(out.courses[0].end).toBe('2026-09-01');
    expect(out.events[0].date).toBe('2026-09-01');
    expect(out.distributionDays[0].date).toBe('2026-09-01');
    expect(out.enrollments[0].dueDate).toBe('2026-09-01');
    expect(out.enrollments[0].enrolledAt).toBe('2026-09-01');
  });

  it('🛡 לא נוגע בנתונים אישיים — תרומות ותאריכי-לידה נשארים', () => {
    const out = freshenDemoDb(baseDb(), '2026-12-01');
    expect(out.supporters[0].donations[0].date).toBe('2011-05-01'); // היסטוריית-תרומות
    expect((out.families[0].members[0] as { birth: string }).birth).toBe('2015-03-03'); // תאריך-לידה
  });
});
