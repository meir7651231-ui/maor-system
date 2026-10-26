/**
 * רצ'ט — דומיין-ציבורי לארגון (26.10.2026, הכרעת-בעלים).
 * "המשרד של מאור אצלנו; האתר-לציבור על meorhachessed.com, ומנהלים אותו דרך האשף."
 *
 * האינווריאנטים:
 *  · מארח שאינו ברשימה (orbit-il.com, github.io, localhost) ⇒ null ⇒ ביט-זהה להיום.
 *  · meorhachessed.com (גם www/אותיות-גדולות/פורט) ⇒ slug מאור + משרד בכתובת שלנו.
 *  · ?org= בכתובת גובר על הדומיין (loadOrgConfig).
 *  · בדומיין: האתר-הציבורי נפתח בלי ?site, ו"כניסה למערכת" יוצאת אל המשרד אצלנו —
 *    משרד על הדומיין היה נפתח ריק (הנתונים המקומיים קשורים למארח).
 */
import { describe, expect, it } from 'vitest';
import { SITE_DOMAINS, siteDomainOf } from '../siteDomains';
import appSrc from '../../App.tsx?raw';
import configSrc from '../config.ts?raw';
import maorCfg from '../../../public/c/maor-hachesed/config.json';

describe('🌐 דומיין-ציבורי — siteDomainOf', () => {
  it('מארחים שלנו ואחרים ⇒ null (אפס שינוי)', () => {
    for (const h of ['orbit-il.com', 'www.orbit-il.com', 'meir7651231-ui.github.io', 'localhost', '127.0.0.1', '', 'evil-meorhachessed.com', 'meorhachessed.com.evil.io']) {
      expect(siteDomainOf(h)).toBeNull();
    }
  });

  it('meorhachessed.com בכל צורה ⇒ מאור החסד, משרד ב-orbit-il.com', () => {
    for (const h of ['meorhachessed.com', 'www.meorhachessed.com', 'MeorHachessed.COM', 'meorhachessed.com:443', 'meorhachessed.com.']) {
      expect(siteDomainOf(h)).toEqual({ slug: 'maor-hachesed', officeUrl: 'https://orbit-il.com/?org=maor-hachesed' });
    }
  });

  it('לא נופל על מפתחות-אב של אובייקט', () => {
    expect(siteDomainOf('constructor')).toBeNull();
    expect(siteDomainOf('__proto__')).toBeNull();
  });

  it('כל רשומה: slug חוקי, יש לו קובץ-קונפיג עם אתר, והמשרד ב-https עם אותו ?org', () => {
    for (const d of Object.values(SITE_DOMAINS)) {
      expect(d.slug).toMatch(/^[a-z0-9-]{2,40}$/);
      const u = new URL(d.officeUrl);
      expect(u.protocol).toBe('https:');
      expect(u.searchParams.get('org')).toBe(d.slug);
      expect(siteDomainOf(u.hostname)).toBeNull(); // המשרד לעולם לא על הדומיין-הציבורי עצמו
    }
    expect(maorCfg.slug).toBe('maor-hachesed');
    expect((maorCfg as { site?: { enabled?: boolean } }).site?.enabled).toBe(true);
  });
});

describe('🌐 דומיין-ציבורי — חיווט (הגנות-מקור)', () => {
  it('loadOrgConfig: ?org= קודם, אחריו הדומיין', () => {
    expect(configSrc).toMatch(/const slug = orgSlugFromUrl\(\) \?\? currentSiteDomain\(\)\?\.slug/);
  });

  it('App: האתר נפתח אוטומטית בדומיין, ו"כניסה למערכת" יוצאת למשרד אצלנו', () => {
    expect(appSrc).toMatch(/has\('site'\)[^\n]*\|\| !!siteDomain/);
    expect(appSrc).toMatch(/if \(siteDomain\) \{\s*window\.location\.href = siteDomain\.officeUrl;\s*return;/);
  });
});
