/**
 * נעילת גישה ברמת ה-store: קביעה/שינוי/הסרה של הקודים, אתחול אזורי ברירת
 * המחדל למשני, וניקוי האזורים בהסרת הקוד המשני. + ברירת המחדל במיגרציה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate } from '../persist';
import { emptyDb } from '../../types/domain';
import { verifyPin, DEFAULT_LOCK_ZONES } from '../../lib/lock';

const sec = () => useApp.getState().lock;

beforeEach(() => {
  useApp.getState().setDb(() => emptyDb());
  useApp.setState({ unlockedPrimary: false, unlockedAdmin: false, lock: {} });
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

describe('🔓 markUnlocked / lockNow — מצב פתיחה לסשן', () => {
  it('markUnlocked מדליק את הדגל המתאים בלבד', () => {
    const s = useApp.getState();
    expect(useApp.getState().unlockedPrimary).toBe(false);
    s.markUnlocked('primary');
    expect(useApp.getState().unlockedPrimary).toBe(true);
    expect(useApp.getState().unlockedAdmin).toBe(false);
    s.markUnlocked('secondary');
    expect(useApp.getState().unlockedAdmin).toBe(true);
  });
  it('lockNow סוגר את שתי הרמות וחוזר לבית', () => {
    const s = useApp.getState();
    s.markUnlocked('primary');
    s.markUnlocked('secondary');
    s.go('settings');
    s.lockNow();
    expect(useApp.getState().unlockedPrimary).toBe(false);
    expect(useApp.getState().unlockedAdmin).toBe(false);
    expect(useApp.getState().view).toBe('home');
  });
});

describe('🆘 clearLock — שכחתי קוד: איפוס מקומי בלי אובדן נתונים', () => {
  it('מוחק את כל הקודים ופותח, הנתונים נשארים', async () => {
    const s = useApp.getState();
    s.setDb(() => ({ ...emptyDb(), orgName: 'עמותה בדיקה' }));
    await s.setLockCode('primary', '4321');
    await s.setLockCode('secondary', '8765');
    s.clearLock();
    expect(sec().primary).toBeUndefined();
    expect(sec().secondary).toBeUndefined();
    expect(useApp.getState().unlockedPrimary).toBe(false);
    // הנתונים לא נגעו — הקוד נשמר במכשיר בלבד, לא ב-db
    expect(useApp.getState().db.orgName).toBe('עמותה בדיקה');
  });
});

describe('🔒 מיגרציה — DB ישן ללא security מקבל ברירת מחדל ריקה', () => {
  it('v:4 בלי security → {} (אין נעילה, לא קורס)', () => {
    const old = { ...emptyDb(), v: 4, security: undefined } as unknown;
    const m = migrate(old)!;
    expect(m.security).toEqual({});
  });
});
