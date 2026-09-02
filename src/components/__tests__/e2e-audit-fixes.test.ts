/**
 * ratchet — ביקורת-e2e מקצה-לקצה (1.9.2026, "תבדוק חיווט מקצה לקצה שאין באגים ונפילות"):
 * שתי סוויטות-דפדפן האדימו — שני באגים אמיתיים, נעולים כאן:
 * 1) flagmax: supporters.bulkselect:false לא הסתיר "☑ בחירה" למנהל (canBulkManage קיצר).
 * 2) dialer: באנר-"גרסה-חדשה" (fixed, z-250) חסם קליקים על כפתורי-הכותרת שמתחתיו.
 * וכן: הוק version.json רץ תחת vitest ודרס את dist ⇒ באנר כוזב ב-e2e (apply:'build').
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import supSrc from '../supporters/SupportersView.tsx?raw';
import viteCfg from '../../../vite.config.ts?raw';

const css = readFileSync('src/styles/global.css', 'utf8');

describe('🛡 ratchet — תיקוני ביקורת-e2e', () => {
  it('bulkGranted: false מפורש מכבה גם למנהל (חוזה-הדגלים)', () => {
    expect(supSrc).toContain("const bulkGranted = (key: string) => config.features?.[key] !== false && (canBulkManage || config.features?.[key] === true);");
    // הצורה הישנה (קיצור-דרך של מנהל שמתעלם מהדגל) לא חוזרת
    expect(supSrc).not.toContain('const bulkGranted = (key: string) => canBulkManage || config.features?.[key] === true;');
  });

  it('באנר-הגרסה שקוף-לקליקים; רק שני הכפתורים תופסים', () => {
    expect(css).toMatch(/\.update-banner \{[^}]*pointer-events: none/);
    expect(css).toMatch(/\.update-banner-refresh,\s*\.update-banner-x \{\s*pointer-events: auto;/);
  });

  it('version.json נכתב רק ב-build (לא תחת vitest)', () => {
    expect(viteCfg).toMatch(/name: 'maor-version-file',[\s\S]{0,400}apply: 'build',/);
  });
});
