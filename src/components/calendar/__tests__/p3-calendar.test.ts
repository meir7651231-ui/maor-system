/**
 * ratchet — שאריות לוח P3 (פריטים 5, 6+21).
 * פריט 5: softClashSuffix — אזהרה רכה ' · ⚠ התנגשות עם "X"' בטוסט, לא חוסמת.
 * פריט 6: שורת משנה בציר היום — 'מורה · חדר · N רשומים' למפגש, notes לאירוע.
 */
import { describe, expect, it } from 'vitest';
import { dayItems, softClashSuffix } from '../calLib';
import dayModalSrc from '../DayModal.tsx?raw';
import { emptyDb, type Db, type OrgEvent } from '../../../types/domain';

function ev(over: Partial<OrgEvent>): OrgEvent {
  return {
    id: over.id ?? 'e1', title: '', date: '', time: '', type: 'org', customType: '',
    notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false, ...over,
  };
}

describe('📅 ratchet — P3 פריטי לוח', () => {
  it('פריט 5: התנגשות רכה — אותו יום+שעה מוסיף סיומת; בוצע/עצמי/שעה אחרת לא', () => {
    const events = [ev({ id: 'a', title: 'ישיבה', date: '2026-08-02', time: '10:00' })];
    expect(softClashSuffix(events, '2026-08-02', '10:00', 'b')).toBe(' · ⚠ התנגשות עם "ישיבה" בשעה 10:00');
    expect(softClashSuffix(events, '2026-08-02', '10:00', 'a')).toBe(''); // עריכה עצמית
    expect(softClashSuffix(events, '2026-08-02', '11:00', 'b')).toBe('');
    expect(softClashSuffix([ev({ id: 'a', title: 'x', date: '2026-08-02', time: '10:00', done: true })], '2026-08-02', '10:00', 'b')).toBe('');
    expect(softClashSuffix(events, '2026-08-02', '', 'b')).toBe(''); // בלי שעה — אין אזהרה
  });

  it('פריט 6: שורת המשנה של מפגש חוג = מורה · חדר · N רשומים; של אירוע = notes', () => {
    const db: Db = {
      ...emptyDb(),
      teachers: [{ id: 't1', name: 'מורה לאה', phone: '', phone2: '', email: '', idNum: '', address: '', specialty: '', payRate: 0, startDate: '', notes: '' }],
      rooms: [{ id: 'r1', name: 'אולם', active: true, slot: 60, cap: 20, location: '', rate: 0, from: '', to: '', access: false, notes: '', eq: {} }],
      courses: [{
        id: 'c1', name: 'ריקוד', teacherId: 't1', roomId: 'r1', description: '', price: 0, price1: 0,
        price2: 0, price1Name: '', price2Name: '', model: 'monthly', size: 0, start: '', end: '',
        weekday: 0, time: '17:00', maxStudents: 0, gender: 'all', ageMin: 0, ageMax: 0, cat: '',
        semester: '', sector: '', sessions: [], notes: '',
      }],
      events: [ev({ id: 'e9', title: 'ישיבה', date: '2026-08-02', time: '10:00', notes: 'חדר גדול' })],
    };
    // 2026-08-02 = יום ראשון (weekday 0)
    const items = dayItems(db, new Date('2026-08-02T12:00:00'));
    const crs = items.find((i) => i.courseId === 'c1');
    expect(crs?.sub).toBe('מורה לאה · אולם · 0 רשומים');
    const evt = items.find((i) => i.ev?.id === 'e9');
    expect(evt?.sub).toBe('חדר גדול');
    // הגנת-מקור: DayModal מרנדר את שורת המשנה
    expect(dayModalSrc).toContain('it.sub');
  });
});
