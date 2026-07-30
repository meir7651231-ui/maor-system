/**
 * ratchet — פגישות קרובות (חנות 23, הכרעת בעלים 22).
 * upcomingMeetings: היום+מחר בלבד, done מוחרג, מיון תאריך+שעה (בלי שעה —
 * לסוף היום), עם שם המוטב והחדר. משטח התזכורות (אין push — לא ממציאים).
 */
import { describe, expect, it } from 'vitest';
import { upcomingMeetings } from '../lib';
import { emptyDb, type Db, type ShopAssignment, type ShopEvent } from '../../../types/domain';
import homeSrc from '../HomeTab.tsx?raw';

function shev(over: Partial<ShopEvent>): ShopEvent {
  return { id: 'she1', title: 'פגישה', date: '2026-08-05', time: '10:00', kind: 'meeting', assignmentId: 'sha1', notes: '', done: false, ...over };
}
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}

const db: Db = {
  ...emptyDb(),
  families: [{ id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number]],
  rooms: [{ id: 'r1', name: 'חדר ישיבות', active: true, slot: 60, cap: 10, location: '' } as unknown as Db['rooms'][number]],
  shopAssignments: [assignment({})],
  shopEvents: [
    shev({ id: 'tomorrow', date: '2026-08-06', time: '09:00', roomId: 'r1' }),
    shev({ id: 'today-late', date: '2026-08-05', time: '14:00' }),
    shev({ id: 'today-early', date: '2026-08-05', time: '08:30' }),
    shev({ id: 'day-after', date: '2026-08-07' }),
    shev({ id: 'done', date: '2026-08-05', time: '09:00', done: true }),
    shev({ id: 'not-meeting', date: '2026-08-05', kind: 'delivery' }),
    shev({ id: 'no-time', date: '2026-08-05', time: '' }),
  ],
};

describe('🤝 ratchet — חנות 23: פגישות קרובות', () => {
  it('היום+מחר בלבד; מחרתיים/בוצע/לא-פגישה מוחרגים; מיון תאריך+שעה ובלי-שעה לסוף', () => {
    const list = upcomingMeetings(db, '2026-08-05');
    expect(list.map((x) => x.ev.id)).toEqual(['today-early', 'today-late', 'no-time', 'tomorrow']);
  });

  it('שם המוטב והחדר נלווים; פגישה בלי שיוך נופלת לכותרת', () => {
    const list = upcomingMeetings(db, '2026-08-05');
    expect(list[0].who).toBe('משפחת כהן');
    expect(list.find((x) => x.ev.id === 'tomorrow')!.roomName).toBe('חדר ישיבות');
    const orphan = upcomingMeetings({ ...db, shopAssignments: [] }, '2026-08-05');
    expect(orphan[0].who).toBe('פגישה');
  });

  it('הגנת-מקור: הסקשן בראש HomeTab, מוסתר כשריק, עם ✓בוצע ופתיחת הפגישה', () => {
    expect(homeSrc).toContain('🤝 פגישות קרובות');
    expect(homeSrc).toMatch(/\{meetings\.length > 0 && \(/);
    expect(homeSrc).toContain('✓ בוצע');
    expect(homeSrc).toContain('setMeetingEv(ev)');
  });
});
