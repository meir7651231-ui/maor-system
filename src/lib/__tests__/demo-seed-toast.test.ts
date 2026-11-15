/**
 * ratchet — W1-S6 (6.11.2026, בדיקת הדמו לפני שיחות-מכירה):
 * 🐛 פרוספקט שנכנס ל-?org=demo ראה טוסט "הנתונים שוחזרו מהגיבוי ✓" — זריעת-הדמו
 * עוברת דרך restoreDb, וההודעה (שנשמעת כמו שחזור-חירום) כיסתה את הניווט-התחתון במובייל.
 * "התחל דמו מחדש" הציג שני טוסטים. התיקון: restoreDb(db, toastMsg) — null ⇒ שקט;
 * חסר ⇒ ההודעה הישנה (שחזור אמיתי בהגדרות — ביט-זהה).
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import ribbonSrc from '../../components/DemoRibbon.tsx?raw';
import storeSrc from '../../store/useApp.ts?raw';
import backupSrc from '../../components/settings/BackupSection.tsx?raw';

describe('🛡 זריעת-הדמו בלי טוסט "שוחזרו מהגיבוי"', () => {
  it('זריעה-אוטומטית ב-App ואיפוס-דמו בסרט ⇒ restoreDb(…, null)', () => {
    expect(appSrc).toMatch(/restoreDb\(freshenDemoDb\(parseBackupFile\(await res\.text\(\)\), isoToday\(\)\), null\)/);
    expect(ribbonSrc).toMatch(/restoreDb\(freshenDemoDb\(parseBackupFile\(await res\.text\(\)\), isoToday\(\)\), null\)/);
  });
  it('null מדלג על הטוסט; חסר ⇒ ההודעה הישנה (שחזור אמיתי ביט-זהה)', () => {
    expect(storeSrc).toContain("if (toastMsg !== null) get().toast(toastMsg ?? 'הנתונים שוחזרו מהגיבוי ✓');");
    expect(backupSrc).toContain('restoreDb(restore.parsed);');
  });
});
