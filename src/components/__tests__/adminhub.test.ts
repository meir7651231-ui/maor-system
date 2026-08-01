/**
 * ratchet — כניסת-הניהול הגלויה (ADMINHUB).
 * הכפתור 🛠 מגודר isSuperAdmin **בלבד** (לא isAdminUser) — אצל לקוח/משתמש
 * רגיל הוא לא ברינדור; הבורר מנתב לשני הכלים דרך ה-hash כך שהקישורים הישנים
 * (#builder/#platform) ממשיכים לעבוד; canAdminHub עולה רק למייל-על.
 */
import { describe, expect, it } from 'vitest';
import { isSuperAdmin } from '../../lib/config';
import appSrc from '../../App.tsx?raw';
import hubSrc from '../AdminHub.tsx?raw';

describe('🛠 ratchet — ADMINHUB: כניסת-ניהול גלויה למנהל-על', () => {
  it('canAdminHub = isSuperAdmin בלבד — לקוח/משתמש רגיל לא רואה את הכפתור', () => {
    // הגדרת הדגל בקוד: isSuperAdmin, לא isAdminUser
    expect(appSrc).toContain('const canAdminHub = isSuperAdmin(cloud.user?.email)');
    expect(appSrc).not.toContain('const canAdminHub = isAdminUser');
    // התנהגות הפונקציה עצמה — רק מייל-העל, case-insensitive; אחר/ריק ⇒ false
    expect(isSuperAdmin('meir7651231@gmail.com')).toBe(true);
    expect(isSuperAdmin('MEIR7651231@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('client@example.com')).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it('הגנת-מקור: כל כפתורי ה-🛠 בשלדים מגודרים canAdminHub; הבורר נפתח בלחיצה', () => {
    // שני נודי-הכפתור מוגדרים כ-`canAdminHub && (...)` ⇒ לא ברינדור כשאין מנהל-על
    expect(appSrc).toMatch(/adminGearBtn: ReactNode = canAdminHub && \(/);
    expect(appSrc).toMatch(/adminSideBtn: ReactNode = canAdminHub && \(/);
    // שלושת השלדים משתמשים בנודים (עליון: gear; שני שלדי-הצד: side)
    expect(appSrc).toContain('{adminGearBtn}');
    expect((appSrc.match(/\{adminSideBtn\}/g) ?? []).length).toBe(2);
    // הבורר עצמו מוגן שוב ב-canAdminHub ברינדור (חגורה + שלייקס)
    expect(appSrc).toContain('{adminHubOpen && canAdminHub && (');
  });

  it('הבורר מנתב לשני הכלים דרך ה-hash — הקישורים הישנים נשמרים (תוספת, לא החלפה)', () => {
    // onOpenPlatform/onOpenBuilder מציבים את ה-hash הקיים
    expect(appSrc).toContain("window.location.hash = '#platform'");
    expect(appSrc).toContain("window.location.hash = '#builder'");
    // ה-AdminHub עצמו מציג את שני הכלים ומקבל את שלושת ה-callbacks
    expect(hubSrc).toContain('onOpenPlatform');
    expect(hubSrc).toContain('onOpenBuilder');
    expect(hubSrc).toContain('לוח הבקרה');
    expect(hubSrc).toContain('אשף הקמה מקומי');
  });

  it('ratchet: ה-hash הישן עדיין מטופל ב-onHash (תאימות אחורה)', () => {
    expect(appSrc).toContain("setBuilderOpen(window.location.hash === '#builder')");
    expect(appSrc).toContain("setPlatformOpen(window.location.hash === '#platform')");
  });
});
