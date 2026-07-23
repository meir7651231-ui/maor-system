/**
 * נעילת גישה ברמת ה-store: קביעה/שינוי/הסרה של הקודים, אתחול אזורי ברירת
 * המחדל למשני, וניקוי האזורים בהסרת הקוד המשני. + ברירת המחדל במיגרציה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate } from '../persist';
import { emptyDb } from '../../types/domain';
import { verifyPin, DEFAULT_LOCK_ZONES } from '../../lib/lock';

const sec = () => useApp.getState().db.security;

beforeEach(() => {
  useApp.getState().setDb(() => emptyDb());
});

describe('🔒 setLockCode — קביעה/אימות/הסרה', () => {
  it('קוד ראשי נשמר מגובב ומאמת נכון', async () => {
    await useApp.getState().setLockCode('primary', '2468');
    expect(sec().primary).toBeTruthy();
    expect(sec().primary).not.toBe('2468'); // לא טקסט גלוי
    expect(await verifyPin('2468', sec().primary)).toBe(true);
    expect(await verifyPin('0000', sec().primary)).toBe(false);
  });

  it('קוד משני מדליק אזורי ברירת מחדל, הסרתו מנקה אותם', async () => {
    await useApp.getState().setLockCode('secondary', '1357');
    expect(sec().secondary).toBeTruthy();
    expect(sec().zones).toEqual(DEFAULT_LOCK_ZONES);
    await useApp.getState().setLockCode('secondary', null);
    expect(sec().secondary).toBeUndefined();
    expect(sec().zones).toBeUndefined();
  });

  it('הסרת הקוד הראשי לא נוגעת במשני ובאזורים', async () => {
    await useApp.getState().setLockCode('primary', '1111');
    await useApp.getState().setLockCode('secondary', '2222');
    useApp.getState().setLockZones(['wizard']);
    await useApp.getState().setLockCode('primary', null);
    expect(sec().primary).toBeUndefined();
    expect(sec().secondary).toBeTruthy();
    expect(sec().zones).toEqual(['wizard']);
  });
});

describe('🔒 מיגרציה — DB ישן ללא security מקבל ברירת מחדל ריקה', () => {
  it('v:4 בלי security → {} (אין נעילה, לא קורס)', () => {
    const old = { ...emptyDb(), v: 4, security: undefined } as unknown;
    const m = migrate(old)!;
    expect(m.security).toEqual({});
  });
});
