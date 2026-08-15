/**
 * ratchet — גלישת-מסך אופקית בזום-נגישות (בקשת-בעלים, צילום-מסך):
 * הזום מוחל כ-body{zoom}, וזום שובר יחידות-viewport (50vw). באנר-הבית של קהילה
 * (‏.hm-hero) השתמש ב-‏margin: calc(50% - 50vw) למילוי-רוחב — ובזום 1.4 ברוחב >‎760
 * גלש ~180px משני הצדדים, והתוכן (כותרת/עיפרון) נחתך (אומת ב-Playwright).
 *
 * התיקון: applyScale מסמן [data-ui-zoom] כשה-scale≠1, וב-global.css כלל
 * ‏:root[data-ui-zoom="1"][data-theme="kehila"] .hm-hero מחליף את מילוי-הרוחב
 * מבוסס-ה-vw בשוליים-שליליים בפיקסלים (‏-28px = ריפוד app-main; עקבי-לזום),
 * בתוך @media(min-width:761px). scale=1 ⇒ אין דגל ⇒ ‏50vw חוזר ביט-זהה.
 *
 * ‏css?raw חוזר ריק תחת vitest (עיבוד-CSS) ⇒ מקור-ה-CSS מאומת ב-Playwright-repro;
 * כאן מגנים על מנגנון-ה-JS (החלפת-הדגל) שהוא הליבה — בלי הדגל אין תיקון.
 */
import { describe, expect, it } from 'vitest';
import applySrc from '../a11yApply.ts?raw';

describe('🖥 ratchet — זום-נגישות לא מגליש את הבאנר (בקשת-בעלים)', () => {
  it('applyScale מדליק [data-ui-zoom] כשיש זום', () => {
    expect(applySrc).toContain("setAttribute('data-ui-zoom', '1')");
    // מותנה ב-scale≠1 (סף float קטן)
    expect(applySrc).toMatch(/Math\.abs\(scale - 1\)[\s\S]{0,40}setAttribute\('data-ui-zoom'/);
  });

  it('applyScale מסיר את הדגל כשחוזרים ל-scale=1 (ביט-זהה למקור)', () => {
    expect(applySrc).toContain("removeAttribute('data-ui-zoom')");
    expect(applySrc).toMatch(/else[\s\S]{0,40}removeAttribute\('data-ui-zoom'\)/);
  });
});
