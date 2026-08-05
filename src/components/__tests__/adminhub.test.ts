/**
 * ratchet — כניסת-הניהול הגלויה (ADMINHUB).
 * הכפתור 🛠 מגודר isSuperAdmin **בלבד** (לא isAdminUser) — אצל לקוח/משתמש
 * רגיל הוא לא ברינדור; הבורר מנתב לשני הכלים דרך ה-hash כך שהקישורים הישנים
 * (#builder/#platform) ממשיכים לעבוד; canAdminHub עולה רק למייל-על.
 */
import { describe, expect, it } from 'vitest';
import { isSuperAdmin } from '../../lib/config';
import appSrc from '../../App.tsx?raw';
import uiSrc from '../ui.tsx?raw';
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

  it('🛡 האשף בארגון-ענן = מייל-על בלבד (5.8 — "למה כל לקוח יכול לראות אשף הקמה")', () => {
    // הבאג: isAdminUser מחזיר true-לכולם כשאין adminEmails, וארגון-פלטפורמה
    // נולד בלי ⇒ כל לקוח שהקליד #builder קיבל את האשף המלא (כולל המחירון!).
    expect(appSrc).toMatch(/canBuilder =\s*\n?\s*cloud\.enabled && config\.cloudRoot !== true && config\.slug !== 'default'\s*\n?\s*\? isSuperAdmin\(cloud\.user\?\.email\)/);
    expect(appSrc).toContain('(!canBuilder ? (');
  });

  it('ratchet: ה-hash הישן עדיין מטופל ב-onHash (תאימות אחורה)', () => {
    // ‏5.8: ‏#builder הפך ל-startsWith — תופס גם את הישן (#builder) וגם את
    // הקשור-ענן (#builder=slug, RemoteWizard); התאימות-אחורה נשמרת מעצם ההכלה.
    expect(appSrc).toContain("setBuilderOpen(window.location.hash.startsWith('#builder'))");
    expect(appSrc).toContain("setPlatformOpen(window.location.hash === '#platform')");
  });
});

describe('🎛 ratchet — UX סבב-א׳: הכרום מ-9 עיגולים ל-4 (5.8.2026)', () => {
  it('עזרה מאוחדת ❓ — כפתור אחד במקום 📖+▶, נוכח גם בשלדי-הצד', () => {
    expect(appSrc).toContain('helpGearBtn');
    expect(appSrc).toContain('helpSideBtn');
    // ה-hash-ים ממשיכים לעבוד (guideOpen/tourOpen נשארים)
    expect(appSrc).toContain("setGuideOpen(window.location.hash === '#guide')");
  });

  it('ניהול מאוחד — מנהל-על לא רואה 👥 נפרד (נכנס דרך AdminHub); מנהל-בלבד כן', () => {
    expect(appSrc).toContain('cloud.isManager && !canAdminHub && (');
    expect(appSrc).toMatch(/onOpenManage=\{cloud\.isManager \? /);
  });

  it('אווטאר-חשבון — יציאה בשני צעדים, סטטוס-סנכרון כטקסט במודאל', () => {
    expect(appSrc).toContain('logoutArmed');
    expect(appSrc).toContain('לחצו שוב ליציאה');
    expect(appSrc).toContain('syncDot.title}');
  });
});

describe('📱 ratchet — UX סבב-ב׳: ניווט ראשי + מובייל (5.8.2026)', () => {
  it("'עוד ▾' ברצועה: עד 6 ראשיים; מעבר לזה — השאר בבורר (הכול נשאר נגיש)", () => {
    expect(appSrc).toContain('NAV_PRIMARY_MAX = 6');
    expect(appSrc).toContain('navMore.length > 0 && (');
    expect(appSrc).toContain('moreNavOpen');
  });

  it('ניווט-תחתון במובייל — 4 ראשיים + עוד; הרצועה הגולשת מוסתרת רק במובייל', () => {
    expect(appSrc).toContain('className="bottom-nav"');
    expect(appSrc).toMatch(/nav\.slice\(0, 4\)\.map/);
  });

  it('✕ סגירה בכל Modal — במגע אין Escape ולחיצת-רקע לא מוכרת', () => {
    expect(uiSrc).toContain('aria-label="סגירה"');
  });
});
