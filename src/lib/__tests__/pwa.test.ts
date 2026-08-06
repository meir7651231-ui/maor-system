/**
 * ratchet — PWA שלב 1 (6.8.2026, בקשת-בעלים "1 צא לדרך"):
 * התקנה-כאפליקציה בלי לשבור אף מנגנון קיים. האינווריאנטים:
 * 1. ה-SW שמרני: רק GET, רק same-origin (Firebase לא נגוע), network-first לכל
 *    מה שאינו /assets/ — ריפוי-הגרסאות (version.json) והקונפיג נשארים טריים.
 * 2. הרישום מגודר: shell.pwa (מתג-חירום שגם מסיר רישום) + דילוג ב-Playwright
 *    (navigator.webdriver) + פרודקשן בלבד.
 * 3. רוצח-ה-SW-הזר ב-index.html פוטר את sw.js שלנו — אחרת היה הורג את עצמו.
 * 4. מניפסט פר-ארגון: blob עם כתובות אבסולוטיות ו-start_url שמשמר ?org=.
 */
import { describe, expect, it } from 'vitest';
import pwaSrc from '../pwa.ts?raw';
import manifestRaw from '../../../public/manifest.webmanifest?raw';
import swRaw from '../../../public/sw.js?raw';
import indexHtml from '../../../index.html?raw';

describe('📱 ratchet — PWA שלב 1', () => {
  it('המניפסט הסטטי תקין: RTL, standalone, שלושת האייקונים', () => {
    const m = JSON.parse(manifestRaw);
    expect(m.dir).toBe('rtl');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('./');
    expect(m.icons).toHaveLength(3);
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  });

  it('ה-SW שמרני: GET בלבד, same-origin בלבד, network-first לכל מה שאינו assets', () => {
    const sw = swRaw;
    expect(sw).toContain("if (req.method !== 'GET') return");
    expect(sw).toContain('if (url.origin !== self.location.origin) return');
    // ‏assets מגובבים = cache-first; השאר עובר קודם fetch (רשת) עם fallback למטמון
    expect(sw).toMatch(/url\.pathname\.includes\('\/assets\/'\)[\s\S]{0,400}caches\.match/);
    expect(sw).toMatch(/const res = await fetch\(req\);[\s\S]{0,200}catch \{[\s\S]{0,200}caches\.match/);
  });

  it('הרישום מגודר: דגל shell.pwa (כיבוי מסיר רישום) + webdriver + PROD', () => {
    expect(pwaSrc).toContain('if (navigator.webdriver) return');
    expect(pwaSrc).toContain('if (!import.meta.env.PROD) return');
    expect(pwaSrc).toMatch(/if \(!featureOn\(config, 'shell\.pwa'\)\) \{[\s\S]{0,300}unregister/);
  });

  it('רוצח-ה-SW-הזר פוטר את ה-SW שלנו (אחרת היה הורג את עצמו בכל טעינה)', () => {
    expect(indexHtml).toContain("var ourSw = new URL('./sw.js', location.href).href");
    expect(indexHtml).toContain('script !== ourSw');
    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('apple-touch-icon');
  });

  it('מניפסט פר-ארגון: כתובות אבסולוטיות + start_url משמר ?org= + שורש לא נגוע', () => {
    expect(pwaSrc).toContain("start_url: base + '?org=' + encodeURIComponent(slug)");
    expect(pwaSrc).toMatch(/if \(slug === 'default' \|\| !name\) return/);
    expect(pwaSrc).toContain("base + 'icons/icon-192.png'");
  });
});
