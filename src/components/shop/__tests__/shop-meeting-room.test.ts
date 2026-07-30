/**
 * ratchet — פגישות עם חדר: תפיסת לוח דו-כיוונית (חנות 19).
 * **חור מבוקר בבידוד — הכרעת בעלים 16, 30.7.2026:** פגישה-עם-חדר בלבד
 * יוצרת OrgEvent מקושר בלוח הראשי (דפוס dueEventId); הכסף נשאר מבודד
 * לחלוטין — בדיקות הבידוד הכספי הקיימות לא השתנו.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { roomClashError, dayItems } from '../../calendar/calLib';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type ShopAssignment, type ShopEvent } from '../../../types/domain';

function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}
function meeting(over: Partial<ShopEvent>): ShopEvent {
  return { id: '', title: 'פגישה', date: '2026-08-05', time: '10:00', kind: 'meeting', assignmentId: 'sha1', roomId: 'r1', notes: '', done: false, ...over };
}

describe('🤝 ratchet — חנות 19: פגישות עם חדר (חור מבוקר — הכרעת בעלים 16)', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      rooms: [{ id: 'r1', name: 'חדר ישיבות', active: true, slot: 60, cap: 10, location: '' } as unknown as Db['rooms'][number]],
      families: [{ id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number]],
      shopAssignments: [assignment({})],
    }));
  });

  it('(א) פגישה-עם-חדר יוצרת OrgEvent מקושר; פגישה בלי חדר נשארת מבודדת', () => {
    expect(useApp.getState().upsertShopEvent(meeting({}))).toBe(true);
    const db = useApp.getState().db;
    const she = db.shopEvents[0];
    expect(she.mainEventId).toBeTruthy();
    const main = db.events.find((ev) => ev.id === she.mainEventId)!;
    expect(main).toMatchObject({ date: '2026-08-05', time: '10:00', roomId: 'r1', famId: 'f1', done: false });
    expect(main.title).toContain('פגישת ליווי');
    expect(main.title).toContain('כהן');
    // בלי חדר — אפס נגיעה בלוח הראשי
    expect(useApp.getState().upsertShopEvent(meeting({ id: '', roomId: undefined, time: '12:00' }))).toBe(true);
    expect(useApp.getState().db.events).toHaveLength(1);
  });

  it('(ב) התנגשות דו-כיוונית: אירוע קיים חוסם פגישה; הפגישה חוסמת אירוע חדש', () => {
    // כיוון 1: אירוע קיים בלוח הראשי תופס את החדר ⇒ הפגישה נדחית בלי שמירה
    useApp.getState().upsertEvent({
      id: 'ev-busy', title: 'ישיבת צוות', date: '2026-08-05', time: '10:00', type: 'org',
      customType: '', notes: '', price: 0, roomId: 'r1', famId: '', priority: 'green', done: false,
    });
    const before = useApp.getState().db;
    expect(useApp.getState().upsertShopEvent(meeting({}))).toBe(false);
    expect(useApp.getState().db).toEqual(before); // לא נשמר דבר
    // כיוון 2: פגישה שנשמרה (שעה פנויה) — האירוע המקושר שלה חוסם אירוע חדש
    expect(useApp.getState().upsertShopEvent(meeting({ time: '11:00' }))).toBe(true);
    const clash = roomClashError(useApp.getState().db, useApp.getState().config, { date: '2026-08-05', time: '11:00', roomId: 'r1' });
    expect(clash).toBeTruthy();
    expect(clash).toContain('פגישת ליווי');
  });

  it('(ב-המשך) מחיקת הפגישה / הסרת החדר מוחקות את המקושר — בלי יתומים', () => {
    useApp.getState().upsertShopEvent(meeting({}));
    let she = useApp.getState().db.shopEvents[0];
    useApp.getState().deleteShopEvent(she.id);
    expect(useApp.getState().db.events).toHaveLength(0);
    expect(useApp.getState().db.shopEvents).toHaveLength(0);
    // הסרת חדר בעריכה ⇒ האירוע המקושר נמחק והפגישה חוזרת להיות מבודדת
    useApp.getState().upsertShopEvent(meeting({}));
    she = useApp.getState().db.shopEvents[0];
    useApp.getState().upsertShopEvent({ ...she, roomId: undefined });
    expect(useApp.getState().db.events).toHaveLength(0);
    expect(useApp.getState().db.shopEvents[0].mainEventId).toBeUndefined();
    // מחיקת השיוך מנקה גם פגישות-עם-חדר על המקושרים שלהן
    useApp.getState().upsertShopEvent(meeting({ id: '' }));
    useApp.getState().deleteShopAssignment('sha1');
    expect(useApp.getState().db.events).toHaveLength(0);
    expect(useApp.getState().db.shopEvents).toHaveLength(0);
  });

  it('(ג) הבידוד נשמר: אירועי חנות בלי חדר אינם בלוח הראשי (dayItems עיוור)', () => {
    useApp.getState().upsertShopEvent(meeting({ roomId: undefined }));
    const db = useApp.getState().db;
    expect(dayItems(db, new Date('2026-08-05T12:00:00'))).toHaveLength(0);
  });
});
