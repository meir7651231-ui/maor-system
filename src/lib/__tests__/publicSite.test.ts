/**
 * רצ'ט — האתר-הציבורי (מוזן ישירות מהקונפיג). מכסה:
 *  · חיטוי normalizeSite (allowlist מלא, https בלבד, תקרות, שדות זרים נזרקים)
 *  · resolveLocalized (נפילת-שפה לעברית) + siteLangs (ברירת-מחדל he)
 *  · campaignProgress (אחוז חסום, ספירה-לאחור)
 *  · publicSiteOn (דגל + enabled) + הגנת-מקור: השער ב-App לפני שער-הענן.
 *
 * האינווריאנט: קונפיג בלי `site` ⇒ אין אתר (ביט-זהה להיום); קונפיג עם `site`
 * זדוני ⇒ מחוטא לחלוטין (קישור לא-https/שדה-זר לא שורדים).
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig, normalizeSite, publicSiteOn } from '../config';
import { campaignProgress, resolveLocalized, siteLangs, isRtlLang, siteUi, hasPublicSite, siteDonateUrl } from '../publicSite';
import appSrc from '../../App.tsx?raw';
import siteSrc from '../../components/public/PublicSite.tsx?raw';
import type { OrgConfig } from '../../types/config';

const base = (site: unknown): OrgConfig =>
  normalizeConfig({ slug: 'x', orgName: 'ארגון', theme: 'or-rishon', site }) as OrgConfig;

describe('🌐 אתר ציבורי — חיטוי normalizeSite', () => {
  it('חסר/לא-אובייקט ⇒ undefined (אין אתר — ביט-זהה להיום)', () => {
    expect(normalizeSite(undefined)).toBeUndefined();
    expect(normalizeSite(null)).toBeUndefined();
    expect(normalizeSite('x')).toBeUndefined();
    expect(normalizeSite([])).toBeUndefined();
    expect(normalizeConfig({ slug: 'x', orgName: 'a', theme: 'or-rishon' })?.site).toBeUndefined();
  });

  it('גלריה: רק https שורד (http/data/javascript נזרקים)', () => {
    const c = base({
      gallery: ['https://ok.example/a.jpg', 'http://no.example/b.jpg', 'data:image/png;base64,AAAA', 'javascript:alert(1)'],
    });
    expect(c.site?.gallery).toEqual(['https://ok.example/a.jpg']);
  });

  it('donateUrl: https בלבד; קישור לא-https ⇒ מושמט', () => {
    expect(base({ donateUrl: 'https://pay.example/give' }).site?.donateUrl).toBe('https://pay.example/give');
    expect(base({ donateUrl: 'http://pay.example/give' }).site?.donateUrl).toBeUndefined();
    expect(base({ donateUrl: 'javascript:alert(1)' }).site?.donateUrl).toBeUndefined();
  });

  it('שדה-זר בתוך site נזרק (allowlist מלא)', () => {
    const c = base({ tagline: 'שלום', evil: '<script>', __proto__: { x: 1 } });
    expect(c.site?.tagline).toBe('שלום');
    expect((c.site as Record<string, unknown>).evil).toBeUndefined();
  });

  it('langs: רק allowlist, דדופ; ריק ⇒ מושמט (ברירת-מחדל he ברכיב)', () => {
    expect(base({ langs: ['he', 'en', 'fr', 'he'] }).site?.langs).toEqual(['he', 'en']);
    expect(base({ langs: ['zz'] }).site?.langs).toBeUndefined();
  });

  it('קמפיין: מספרים חיוביים בלבד; שליליים/לא-מספר נזרקים', () => {
    const c = base({ campaign: { goal: 1000, raised: -5, end: '2026-09-01', extra: 'x' } });
    expect(c.site?.campaign?.goal).toBe(1000);
    expect(c.site?.campaign?.raised).toBeUndefined();
    expect((c.site?.campaign as Record<string, unknown>).extra).toBeUndefined();
  });

  it('טקסט רב-לשוני: רק שפות-allowlist עם ערך לא-ריק', () => {
    const c = base({ tagline: { he: 'עברית', en: 'English', fr: 'x', yi: '  ' } });
    expect(c.site?.tagline).toEqual({ he: 'עברית', en: 'English' });
  });

  it('טלפונים: תווים לא-חוקיים מסוננים; מייל בלי @ נזרק', () => {
    const c = base({ contact: { phones: ['03-1234<b>567', 'abc'], email: 'not-an-email' } });
    expect(c.site?.contact?.phones).toEqual(['03-1234567']);
    expect(c.site?.contact?.email).toBeUndefined();
  });
});

describe('🌐 resolveLocalized + siteLangs', () => {
  it('מחרוזת ⇒ כמות-שהיא; מפה ⇒ שפה מבוקשת', () => {
    expect(resolveLocalized('שלום', 'en')).toBe('שלום');
    expect(resolveLocalized({ he: 'עברית', en: 'English' }, 'en')).toBe('English');
  });
  it('שפה חסרה ⇒ נפילה לעברית ואז לראשון הקיים', () => {
    expect(resolveLocalized({ he: 'עברית' }, 'en')).toBe('עברית');
    expect(resolveLocalized({ yi: 'אידיש' }, 'en')).toBe('אידיש');
    expect(resolveLocalized(undefined, 'he')).toBe('');
  });
  it('siteLangs: ברירת-מחדל he; en=LTR', () => {
    expect(siteLangs(undefined)).toEqual(['he']);
    expect(isRtlLang('he')).toBe(true);
    expect(isRtlLang('en')).toBe(false);
    expect(isRtlLang('yi')).toBe(true);
    expect(siteUi('en', 'donate')).toBe('Donate');
    expect(siteUi('he', 'donate')).toBe('לתרומה');
  });
});

describe('🌐 campaignProgress', () => {
  const NOW = Date.parse('2026-09-01T12:00:00Z');
  it('אחוז חסום 0–100 גם כשנגבה מעל היעד', () => {
    expect(campaignProgress({ goal: 100, raised: 250 }, NOW).pct).toBe(100);
    expect(campaignProgress({ goal: 200, raised: 50 }, NOW).pct).toBe(25);
  });
  it('יעד לא-חיובי ⇒ show=false', () => {
    expect(campaignProgress({ goal: 0, raised: 10 }, NOW).show).toBe(false);
    expect(campaignProgress(undefined, NOW).show).toBe(false);
  });
  it('ספירה-לאחור: תאריך עתידי ⇒ ימים; עבר ⇒ 0', () => {
    expect(campaignProgress({ goal: 1, end: '2026-09-11' }, NOW).daysLeft).toBe(10);
    expect(campaignProgress({ goal: 1, end: '2026-08-01' }, NOW).daysLeft).toBe(0);
    expect(campaignProgress({ goal: 1 }, NOW).daysLeft).toBeNull();
  });
});

describe('🌐 publicSiteOn + הגנת-מקור', () => {
  it('publicSiteOn: דורש דגל דלוק + site קיים ולא-מכובה', () => {
    expect(publicSiteOn(base({ tagline: 'x' }))).toBe(true);
    expect(publicSiteOn(base({ tagline: 'x', enabled: false }))).toBe(false);
    expect(publicSiteOn(base(undefined as unknown))).toBe(false);
    const off = normalizeConfig({ slug: 'x', orgName: 'a', theme: 'or-rishon', features: { 'shell.publicsite': false }, site: { tagline: 'x' } }) as OrgConfig;
    expect(publicSiteOn(off)).toBe(false);
    expect(hasPublicSite(base({ tagline: 'x' }))).toBe(true);
  });

  it('donateUrl נופל ל-integrations.payments.payUrl', () => {
    const c = normalizeConfig({
      slug: 'x', orgName: 'a', theme: 'or-rishon',
      integrations: { payments: { enabled: true, payUrl: 'https://pay.example/x' } },
      site: { tagline: 't' },
    }) as OrgConfig;
    expect(siteDonateUrl(c)).toBe('https://pay.example/x');
  });

  it('🔒 השער ב-App לפני שער-הענן ומגודר publicSiteOn', () => {
    // הגייט מופיע לפני שרשרת-השערים (needDecrypt/cloud) ומגודר publicSiteOn+‎?site‎.
    expect(appSrc).toContain('publicSiteOn(config)');
    expect(appSrc).toContain('siteRequested');
    // הגייט קודם ל-needDecrypt (המבקר לא מתבקש קוד-פענוח)
    expect(appSrc.indexOf('siteRequested && publicSiteOn')).toBeLessThan(appSrc.indexOf('if (needDecrypt)'));
    // הרכיב מוזן מהקונפיג בלבד (config.site) ומכבד reduced-motion
    expect(siteSrc).toContain('config.site');
    expect(siteSrc).toContain('prefers-reduced-motion');
  });
});
