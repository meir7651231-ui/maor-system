/**
 * ⚡ ratchet — משקל-ההפעלה של ארגז-המנועים (W, 14.10.2026).
 *
 * הבאג: אחרי החיווט הסופי של ארגז-המנועים, שני chunks עצלים חדשים (מתאם-המסלול ומנוע-ההשפעה) צרכו את
 * `lib/config` (דרך match/featureOn) בלי persist ⇒ rolldown הוציא את config מ-chunk-ה-persist ל-chunk משלו,
 * שנטען בהפעלה: ‏+494B gzip ובקשת-רשת נוספת **לכל ארגון** — גם לארגון שלא הדליק את הארגז (opt-in).
 * התיקון: קבוצת `codeSplitting` ב-vite.config שמצמידה persist+config ל-chunk אחד (ביט-זהה ל-b063a79).
 *
 * הנעילה כאן = הגנת-מקור על ה-config; האכיפה על הפלט עצמו (אין chunk `config-*` בין chunks-ההפעלה
 * ב-dist/index.html) רצה ב-scripts/bundle-budget.mjs אחרי כל build.
 */
import { describe, expect, it } from 'vitest';
import viteCfg from '../../../vite.config.ts?raw';
import budget from '../../../scripts/bundle-budget.mjs?raw';

describe('⚡ startup-chunks — config לא נפרד מ-persist בהפעלה', () => {
  it('vite.config מצמיד את store/persist ו-lib/config לקבוצת persist אחת', () => {
    expect(viteCfg).toMatch(/codeSplitting/);
    expect(viteCfg).toMatch(/name: 'persist', test: \/.*store\[\\\\\/\]persist\|lib\[\\\\\/\]config/);
  });
  it('linkShape נשאר chunk נפרד בעדיפות גבוהה יותר (כמו ב-b063a79)', () => {
    expect(viteCfg).toMatch(/name: 'linkShape'[^}]*priority: 2/);
  });
  it('bundle-budget נכשל כש-chunk בשם config מופיע בין chunks-ההפעלה', () => {
    expect(budget).toMatch(/FORBIDDEN_STARTUP/);
    expect(budget).toMatch(/config/);
    expect(budget).toMatch(/modulepreload/);
  });
});
