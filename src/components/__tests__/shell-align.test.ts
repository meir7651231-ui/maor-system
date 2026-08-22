/**
 * ratchet — יישור הבר-העליון לתוכן (בקשת-בעלים 22.8 "המסכים לא ישר — המסך הבית
 * והחלון מעל"): הבאג — ‏.app-top‎ (הבר-העליון בשלד-העליון היכל/קהילה) ריפד את
 * תוכנו ל**קצה** עמודת-ה-1200 (`calc(50% - 600px)`), בעוד ‏.app-main‎ ממרכז 1200
 * ומוסיף ריפוד-פנימי 28px ⇒ התוכן מתחיל ב-`calc(50% - 572px)`. הפער (28px) גרם
 * למותג/כלים בבר לבלוט החוצה מהתוכן שמתחת — "לא ישר". התיקון: הבר מיושר ל-572px
 * (‏600−28) עם מינימום 28px (=ריפוד-app-main בצר), ובמובייל 14px זהה ל-app-main.
 *
 * ‏css?raw חוזר ריק תחת vitest (עיבוד-CSS של vite), לכן קוראים את הקובץ ב-fs.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ‏global.css?raw חוזר ריק תחת vitest (עיבוד-CSS של vite) ⇒ קוראים את הקובץ ישירות.
const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../styles/global.css'), 'utf8');

describe('🧭 ratchet — הבר-העליון מיושר לתוכן (אפס "לא ישר")', () => {
  it('‏.app-top‎ מרפד ל-572px (קצה-העמודה 600 בניכוי ריפוד-app-main 28) — לא ל-600', () => {
    // התוכן: ‏.app-main‎ ממרכז 1200 (‎50% - 600px‎) + ריפוד 28 ⇒ ‎50% - 572px‎.
    expect(CSS).toContain('padding: 10px max(28px, calc(50% - 572px))');
    // הבאג הישן — יישור-לקצה — לא יחזור:
    expect(CSS).not.toContain('padding: 10px max(22px, calc(50% - 600px))');
  });

  it('‏.app-main‎ עדיין 1200 ממורכז עם ריפוד 28 (הבסיס שאליו הבר מיושר)', () => {
    expect(CSS).toContain('max-width: 1200px');
    expect(CSS).toMatch(/\.app-main\s*\{[^}]*padding:\s*24px 28px 64px/);
  });

  it('מובייל: ריפוד-הבר האופקי זהה ל-app-main (14px) ⇒ מיושר גם בצר', () => {
    expect(CSS).toContain('padding: 8px 14px'); // .app-top mobile
    expect(CSS).toContain('padding: 16px 14px 64px'); // .app-main mobile
  });
});
