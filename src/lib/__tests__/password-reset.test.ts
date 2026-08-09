/**
 * ratchet — מסלולי איפוס/שינוי סיסמה (בקשת-בעלים 9.8 "תתקן את הכל").
 * הפערים שנסגרו והאינווריאנטים שלהם:
 * 1. מיילי-Auth בשפת המכשיר — `useDeviceLanguage()` באתחול הענן; בלעדיו מייל
 *    האיפוס יוצא באנגלית ("Reset your password") גם ללקוח עברי.
 * 2. שינוי-סיסמה מתוך האפליקציה — `changePassword`: אימות-מחדש עם הסיסמה
 *    הנוכחית (דרישת recent-login של Firebase) **לפני** updatePassword; שגיאות
 *    בעברית ("הסיסמה הנוכחית שגויה" / "חלשה מדי").
 * 3. תפריט-החשבון מציע 🔑 שינוי סיסמה; המודאל בודק אימות-כפול ואורך מינימלי
 *    לפני קריאת ה-SDK, ומכוון שוכחי-סיסמה ל"שכחתי סיסמה" במסך הכניסה.
 * 4. "שכחתי סיסמה" במסך הכניסה נשאר — resetPassword עם שגיאות בעברית.
 */
import { describe, expect, it } from 'vitest';
import cloudSrc from '../cloud.ts?raw';
import appSrc from '../../App.tsx?raw';
import modalSrc from '../../components/cloud/ChangePasswordModal.tsx?raw';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';

describe('🔑 ratchet — איפוס ושינוי סיסמה (9.8)', () => {
  it('מיילי-Auth בשפת המכשיר — useDeviceLanguage באתחול', () => {
    expect(cloudSrc).toContain('auth.useDeviceLanguage()');
  });

  it('changePassword: אימות-מחדש לפני החלפה + שגיאות בעברית', () => {
    // הסדר קשיח: reauthenticateWithCredential מופיע לפני updatePassword בגוף הפונקציה
    const body = cloudSrc.slice(cloudSrc.indexOf('export async function changePassword'));
    const reIdx = body.indexOf('reauthenticateWithCredential(');
    const upIdx = body.indexOf('await updatePassword(');
    expect(reIdx).toBeGreaterThan(-1);
    expect(upIdx).toBeGreaterThan(reIdx);
    expect(body).toContain('הסיסמה הנוכחית שגויה');
    expect(body).toContain('הסיסמה החדשה חלשה מדי');
  });

  it('תפריט-החשבון מציע 🔑 שינוי סיסמה; המודאל בודק לפני קריאת ה-SDK', () => {
    expect(appSrc).toContain('🔑 שינוי סיסמה');
    expect(appSrc).toContain('<ChangePasswordModal');
    expect(modalSrc).toContain('type="password"');
    expect(modalSrc).toContain('next !== next2');
    expect(modalSrc).toContain('next.length < 6');
    // שוכחי-הסיסמה מקבלים הכוונה למסלול המייל
    expect(modalSrc).toContain('שכחתי סיסמה');
  });

  it('"שכחתי סיסמה" במסך הכניסה נשאר — מייל איפוס עם שגיאות בעברית', () => {
    expect(loginSrc).toContain('שכחתי סיסמה');
    expect(cloudSrc).toContain('sendPasswordResetEmail');
    expect(cloudSrc).toContain('לא נמצא משתמש עם האימייל הזה');
  });
});
