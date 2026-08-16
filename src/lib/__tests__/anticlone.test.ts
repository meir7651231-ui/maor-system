/**
 * ratchet — הגנת-מקור (anti-clone, 16.8): App Check + שומר-מארח + allowedHosts.
 * דורמנטי-כברירת-מחדל (בלי מפתח/רשימה = ביט-זהה להיום); הפעלה = פעולת-בעלים.
 */
import { describe, expect, it } from 'vitest';
import { foreignHost } from '../originGuard';
import { normalizeConfig } from '../config';
import appCheckSrc from '../appCheck.ts?raw';
import cloudSrc from '../cloud.ts?raw';

describe('foreignHost — זיהוי עותק-מגורר (טהור)', () => {
  const allowed = ['maor.org', 'maor.github.io'];
  it('רשימה ריקה/חסרה ⇒ אף פעם לא זר (דורמנטי)', () => {
    expect(foreignHost('anything.com', [])).toBe(false);
    expect(foreignHost('anything.com', undefined)).toBe(false);
  });
  it('מארח רשמי (כולל www ו-subdomain) ⇒ לא זר', () => {
    expect(foreignHost('maor.org', allowed)).toBe(false);
    expect(foreignHost('www.maor.org', allowed)).toBe(false);
    expect(foreignHost('app.maor.org', allowed)).toBe(false);
    expect(foreignHost('maor.github.io', allowed)).toBe(false);
  });
  it('מארח מקומי (פיתוח) ⇒ לא זר', () => {
    for (const h of ['localhost', '127.0.0.1', 'localhost:5173', 'dev.local']) expect(foreignHost(h, allowed)).toBe(false);
  });
  it('מארח זר (עותק-מגורר) ⇒ זר', () => {
    expect(foreignHost('attacker-clone.com', allowed)).toBe(true);
    expect(foreignHost('maor.org.evil.com', allowed)).toBe(true); // סיומת-מתחזה
    expect(foreignHost('notmaor.github.io', allowed)).toBe(true);
  });
});

describe('App Check — גידור + חיווט', () => {
  it('initAppCheck דורמנטי בלי מפתח, מדלג Playwright, dynamic-import נכשל-רך', () => {
    expect(appCheckSrc).toContain('if (!appCheckKey) return;');
    expect(appCheckSrc).toContain('navigator.webdriver) return;');
    expect(appCheckSrc).toContain("import('firebase/app-check')");
    expect(appCheckSrc).toContain('ReCaptchaV3Provider');
  });
  it('מחובר ב-initCloud (מיד אחרי initializeApp)', () => {
    expect(cloudSrc).toContain('initAppCheck(app,');
  });
});

describe('normalizeConfig — allowedHosts מחוטא', () => {
  it('מערך-מחרוזות נשמר (מנוקה); ריק/לא-מערך מוסר', () => {
    const c = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic', allowedHosts: ['  a.com ', 'b.com', '', 42] });
    expect(c?.allowedHosts).toEqual(['a.com', 'b.com']);
    expect(normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic', allowedHosts: [] })?.allowedHosts).toBeUndefined();
    expect(normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic' })?.allowedHosts).toBeUndefined();
  });
  it('תקרה: עד 12 מארחים', () => {
    const many = Array.from({ length: 20 }, (_, i) => 'h' + i + '.com');
    expect(normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic', allowedHosts: many })?.allowedHosts?.length).toBe(12);
  });
});
