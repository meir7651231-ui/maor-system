/**
 * ratchet — התאוששות-סנכרון (H2+H5, בקשת-שטח 24.8 "אני כל הזמן מאבד סנכרון").
 *
 * שני חורים תוקנו:
 *  H2 (watchAuth null = kill-switch): כל אירוע-null מ-Firebase-Auth הרג את הסנכרון
 *     מיידית — טוקן-blip/App-Check-חולף/IndexedDB-לחוץ-במובייל כפו כניסה-מחדש.
 *  H5 (subscribeAll onError = red-forever): כשמנוי-Firestore נופל, הטבעת נותרה
 *     אדומה לצמיתות עד רענון-דף — לא ניסתה להתחבר שוב.
 *
 * ננעל ברמת-המקור: הראצ'ט הזה בודק שהקוד עדיין כולל את מנגנוני-ההתאוששות.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const useApp = readFileSync(join(here, '..', 'useApp.ts'), 'utf8');
const sync = readFileSync(join(here, '..', 'cloudSync.ts'), 'utf8');
const app = readFileSync(join(here, '..', '..', 'App.tsx'), 'utf8');

describe('🔧 ratchet — התאוששות-סנכרון (H2+H5)', () => {
  it('H2: watchAuth(null) מקבל חלון-חסד 5 שניות ולא מפיל מיידית', () => {
    // יש טיימר-חסד מודול-סקופי
    expect(useApp).toMatch(/let authGrace(: [^\n]+)? = null/);
    // ההשהיה 5000ms — לא מיידי, לא נצחי
    expect(useApp).toContain('5000');
    // אירוע-user תקין מבטל את החלון (התאוששות אוטומטית)
    expect(useApp).toMatch(/if \(user && authGrace\)/);
    // רק אחרי פקיעת-החלון בוצע logout (stopCloudSync)
    expect(useApp).toContain('mod.stopCloudSync()');
    expect(useApp).toContain('mod.setCloudDek(null)');
  });

  it('H5: subscribeAll onError מנסה להתחבר שוב אחרי 3 שניות (לא נעלם לצמיתות אדום)', () => {
    // subscribe עטוף ב-inner function שקורא לעצמו על התאוששות
    expect(sync).toMatch(/const subscribe = \(\) => \{/);
    // recoverTimer קיים ומקבל 3000ms
    expect(sync).toMatch(/let recoverTimer/);
    expect(sync).toContain('3000');
    // מגן: לא מחדשים אחרי stopCloudSync (active/hooks בדיקה)
    expect(sync).toMatch(/if \(!active \|\| hooks !== h\) return/);
    // מציג 'connecting' בזמן התאוששות (ולא נשאר 'error')
    expect(sync).toContain("setStat(hooks, 'connecting')");
  });

  it('📛 בקשת-שטח 25.8: השגיאה האחרונה נחשפת בממשק (לא "אדום סתום")', () => {
    // cloudSync מייצא את השגיאה + retry-מיידי
    expect(sync).toMatch(/export function getSyncLastError\(\)/);
    expect(sync).toMatch(/export function retrySyncNow\(\)/);
    // מפרש שגיאות-Firestore (permission-denied ⇒ לא retry-לולאה)
    expect(sync).toMatch(/function describeErr/);
    expect(sync).toContain("'permission-denied'");
    // hook לחשיפה בשכבת ה-store
    expect(sync).toMatch(/setLastError\?: \(msg: string \| null\) => void/);
    // useApp מחזיק שדה בשכבת cloud + מחווט hook
    expect(useApp).toMatch(/lastSyncError\?: string \| null/);
    expect(useApp).toMatch(/setLastError: \(msg\) => setCloud\(\{ lastSyncError: msg \}\)/);
    // App.tsx מציג את השגיאה + כפתור "נסי שוב" (עם dynamic-import כדי לא לגרור Firebase לבנדל הראשי)
    expect(app).toContain('cloud.lastSyncError');
    expect(app).toContain('🔄 נסי שוב');
    expect(app).toMatch(/import\('\.\/store\/cloudSync'\)\.then\(\(m\) => m\.retrySyncNow\(\)\)/);
  });
});
