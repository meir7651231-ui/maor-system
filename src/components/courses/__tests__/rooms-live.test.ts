/**
 * ratchet — רצועת חדרים LIVE (P2 פער 27, feature courses.roomslive).
 * roomsNow טהורה (now מוזרק): מפגש פעיל עכשיו ⇒ תפוס עם החוג; יום/שעה
 * אחרים ⇒ פנוי; חדר מושבת לא מופיע; משך המשבצת = slot של החדר (ברירת
 * מחדל 60 דק׳).
 */
import { describe, expect, it } from 'vitest';
import { roomsNow } from '../lib';
import { emptyDb, type Course, type Db, type Room } from '../../../types/domain';

function room(over: Partial<Room>): Room {
  return { id: 'r1', name: 'אולם', active: true, slot: 60, cap: 20, location: '', rate: 0, from: '', to: '', access: false, notes: '', eq: {}, ...over };
}

function course(over: Partial<Course>): Course {
  return {
    id: 'c1', name: 'ריקוד', teacherId: '', roomId: 'r1', description: '', price: 0, price1: 0,
    price2: 0, price1Name: '', price2Name: '', model: 'monthly', size: 0, start: '', end: '',
    weekday: 2, time: '17:00', maxStudents: 0, gender: 'all', ageMin: 0, ageMax: 0, cat: '',
    semester: '', sector: '', sessions: [], notes: '',
    ...over,
  };
}

// 2026-07-28 = יום שלישי (weekday 2)
const TUE_1730 = new Date('2026-07-28T17:30:00');

describe('🟢🔴 ratchet — roomsNow (פער 27)', () => {
  it('מפגש שמתקיים עכשיו ⇒ החדר תפוס עם החוג', () => {
    const db: Db = { ...emptyDb(), rooms: [room({})], courses: [course({})] };
    const rn = roomsNow(db, TUE_1730);
    expect(rn).toHaveLength(1);
    expect(rn[0].busyWith?.name).toBe('ריקוד');
  });

  it('יום אחר או שעה אחרת ⇒ פנוי; גבול המשבצת (slot) נאכף', () => {
    const db: Db = { ...emptyDb(), rooms: [room({})], courses: [course({})] };
    // אותו יום, לפני המפגש ואחרי סוף המשבצת (17:00+60ד׳=18:00)
    expect(roomsNow(db, new Date('2026-07-28T16:59:00'))[0].busyWith).toBeUndefined();
    expect(roomsNow(db, new Date('2026-07-28T18:00:00'))[0].busyWith).toBeUndefined();
    // יום אחר (רביעי)
    expect(roomsNow(db, new Date('2026-07-29T17:30:00'))[0].busyWith).toBeUndefined();
    // slot ארוך יותר — עדיין תפוס ב-18:20
    const db90: Db = { ...emptyDb(), rooms: [room({ slot: 90 })], courses: [course({})] };
    expect(roomsNow(db90, new Date('2026-07-28T18:20:00'))[0].busyWith?.name).toBe('ריקוד');
  });

  it('חדר מושבת לא מופיע; מפגשי sessions (לא רק השדות הראשיים) נבדקים', () => {
    const db: Db = {
      ...emptyDb(),
      rooms: [room({}), room({ id: 'r2', name: 'מושבת', active: false })],
      courses: [course({ weekday: 4, time: '09:00', sessions: [{ day: 2, time: '17:00', label: 'קבוצה ב' }] })],
    };
    const rn = roomsNow(db, TUE_1730);
    expect(rn).toHaveLength(1); // המושבת נעלם
    expect(rn[0].busyWith?.name).toBe('ריקוד'); // דרך sessions[]
  });
});
