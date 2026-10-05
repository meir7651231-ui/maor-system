/**
 * ratchet — מנוע-הפריסה המשותף (5.10.2026): לוח-הבית וכרטיס-התורם מסדרים קוביות באותם כללים.
 * חסר/ריק = ברירת-מחדל (ביט-זהה ללקוח שלא נגע) · מזהה שלא ברשימה = מוסתר · מזהה לא-מוכר נזרק · כפולים מאוחדים.
 */
import { describe, expect, it } from 'vitest';
import { addId, persistLayout, removeId, sameOrder, sanitizeIds, shiftId } from '../widgetLayout';

const ALL = ['details', 'hok', 'next', 'history'];

describe('widgetLayout · sanitizeIds', () => {
  it('חסר/ריק ⇒ ברירת-המחדל (עותק, לא אותו מערך)', () => {
    expect(sanitizeIds(undefined, ALL, ALL)).toEqual(ALL);
    expect(sanitizeIds([], ALL, ALL)).toEqual(ALL);
    expect(sanitizeIds(undefined, ALL, ALL)).not.toBe(ALL);
  });
  it('שומר סדר, זורק לא-מוכרים וכפולים; מזהה חסר = מוסתר', () => {
    expect(sanitizeIds(['history', 'zzz', 'details', 'details'], ALL, ALL)).toEqual(['history', 'details']);
  });
  it('רק לא-מוכרים: ברירת-מחדל רק עם fallbackIfEmpty (לוח-הבית שומר על ההתנהגות הישנה)', () => {
    expect(sanitizeIds(['zzz'], ALL, ALL)).toEqual([]);
    expect(sanitizeIds(['zzz'], ALL, ALL, { fallbackIfEmpty: true })).toEqual(ALL);
  });
});

describe('widgetLayout · עריכה', () => {
  it('shiftId מחליף עם השכן ולא חוצה גבולות/minIndex', () => {
    expect(shiftId(ALL, 'hok', -1)).toEqual(['hok', 'details', 'next', 'history']);
    expect(shiftId(ALL, 'details', -1)).toEqual(ALL);
    expect(shiftId(ALL, 'history', 1)).toEqual(ALL);
    expect(shiftId(ALL, 'hok', -1, 1)).toEqual(ALL);   // hero-lock של לוח-הבית
  });
  it('removeId/addId אידמפוטנטיים', () => {
    expect(removeId(ALL, 'hok')).toEqual(['details', 'next', 'history']);
    expect(addId(['details'], 'hok')).toEqual(['details', 'hok']);
    expect(addId(['details', 'hok'], 'hok')).toEqual(['details', 'hok']);
    expect(sameOrder(ALL, [...ALL])).toBe(true);
  });
  it('persistLayout: ברירת-מחדל ⇒ undefined; מוסתרים-זמנית (דגל כבוי) שורדים שמירה', () => {
    const vis = (id: string) => id !== 'hok';   // hok כבוי כרגע
    expect(persistLayout(['details', 'next', 'history'], ['details', 'next', 'history'], vis, ['details', 'next', 'history'])).toBeUndefined();
    // ברירת-מחדל בתצוגה אבל hok (כבוי-זמנית) נמצא בפריסה השמורה ⇒ נשמר, לא נמחק
    expect(persistLayout(['history', 'details', 'next'], ALL, vis, ['details', 'next', 'history'])).toEqual(['history', 'details', 'next', 'hok']);
    expect(persistLayout(['details', 'next'], ALL, vis, ['details', 'next', 'history'])).toEqual(['details', 'next', 'hok']);   // history הוסתר במכוון
  });
});
