/**
 * ratchet — UX סבב-ז׳ (6.8.2026): הדיאלוגים הילידיים (window.confirm/prompt),
 * שבורים בטאבלט ובלתי-נגישים, הוחלפו במנגנונים פנימיים:
 * 1. שחזור-מגיבוי: מודאל דו-שלבי (פענוח ← אישור-דריסה) — אותן יכולות בדיוק:
 *    סיסמה או מפתח-שחזור, אזהרת-גלוי כשההצפנה כבויה, סיכום-דריסה עם ספירות.
 * 2. ביטול-מימוש בחנות: סיבת-הביטול במודאל (הרשומה וה-S- נשארים).
 * 3. הסרת-PIN וכיבוי-הצפנה: חימוש דו-שלבי (קליק-ראשון חומש ל-4 שניות).
 * חריגים מודעים: LockScreen (זרימת-חירום קדם-אפליקציה) ו-useArmed fallback
 * (shell.armdel=false ⇒ confirm — חוזה-הדגל).
 */
import { describe, expect, it } from 'vitest';
import backupSrc from '../BackupSection.tsx?raw';
import securitySrc from '../SecuritySection.tsx?raw';
import encSrc from '../EncryptionSection.tsx?raw';
import assignSrc from '../../shop/AssignmentsTab.tsx?raw';
import demoDropSrc from '../../DemoDrop.tsx?raw';

describe('🗨️ ratchet — אפס דיאלוגים ילידיים בזרימות ההגדרות/החנות', () => {
  it('BackupSection: בלי window.confirm/prompt; מודאל פענוח+אישור עם כל היכולות', () => {
    expect(backupSrc).not.toContain('window.confirm(');
    expect(backupSrc).not.toContain('window.prompt(');
    // שתי דרכי-הפענוח נשמרו: סיסמה ואז מפתח-שחזור
    expect(backupSrc).toMatch(/decryptBackupFile\(restore\.encText, pw, 'pass'\)[\s\S]{0,120}decryptBackupFile\(restore\.encText, pw\.trim\(\)\.toUpperCase\(\), 'rec'\)/);
    // אזהרת-הגלוי כשההצפנה כבויה במכשיר
    expect(backupSrc).toContain('plainWarn: !isCryptoActive()');
    // הדריסה רק מהכפתור המפורש
    expect(backupSrc).toContain('אישור השחזור — דריסת הנתונים');
  });

  it('ביטול-מימוש: סיבה במודאל; הסרת-PIN/כיבוי-הצפנה: חימוש דו-שלבי', () => {
    expect(assignSrc).not.toContain('window.prompt(');
    expect(assignSrc).toContain('ביטול המימוש');
    expect(securitySrc).not.toContain('window.confirm(');
    expect(securitySrc).toContain('לחצו שוב — הנעילה תבוטל');
    expect(encSrc).not.toContain('window.confirm(');
    expect(encSrc).toContain('לחצו שוב — הנתונים יישמרו גלויים');
  });

  it('ריצה-ראשונה: הבאנר-הריק מציע גם מדריך וסיור — באותם דגלים של ❓', () => {
    expect(demoDropSrc).toMatch(/featureOn\(config, 'shell\.guide'\)[\s\S]{0,120}#guide/);
    expect(demoDropSrc).toMatch(/featureOn\(config, 'shell\.demo'\)[\s\S]{0,120}#tour/);
    // המחרוזות שה-e2e נשען עליהן לא זזו
    expect(demoDropSrc).toContain('המערכת ריקה — התחילו כאן');
    expect(demoDropSrc).toContain('📊 טעינת נתוני דמו');
  });
});
