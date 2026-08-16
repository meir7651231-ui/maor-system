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
import { campaignProgress, resolveLocalized, siteLangs, isRtlLang, siteUi, hasPublicSite, siteDonateUrl, sitePalette, siteVocab, CORAL_PALETTE } from '../publicSite';
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

  it('שדה-זר בתוך site נזרק (allowlist מלא); icon = מחרוזת קצרה', () => {
    const c = base({ tagline: 'שלום', icon: '🕯️', evil: '<script>', __proto__: { x: 1 } });
    expect(c.site?.tagline).toBe('שלום');
    expect(c.site?.icon).toBe('🕯️');
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
    expect((c.site?.campaign as Record<string, unknown> | undefined)?.extra).toBeUndefined();
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

describe('🌐 שדות-העיצוב (design 16.8) — חיטוי + מבנה', () => {
  it('brandLine + storyTitle/Accent/Badge + donateNote: רב-לשוני מחוטא', () => {
    const c = base({
      brandLine: { he: 'אור לאלמנה', en: 'Light', fr: 'x' },
      storyTitle: 'כותרת', storyTitleAccent: 'הדגשה', storyBadge: 'ברכה ♡',
      donateNote: { he: 'מוכר למס' },
    });
    expect(c.site?.brandLine).toEqual({ he: 'אור לאלמנה', en: 'Light' });
    expect(c.site?.storyTitle).toBe('כותרת');
    expect(c.site?.storyTitleAccent).toBe('הדגשה');
    expect(c.site?.storyBadge).toBe('ברכה ♡');
    expect(c.site?.donateNote).toEqual({ he: 'מוכר למס' });
  });

  it('founder: name/quote רב-לשוני; photo רק https', () => {
    const c = base({ founder: { name: 'מרים', quote: { he: 'ציטוט' }, photo: 'http://x/p.jpg', evil: 1 } });
    expect(c.site?.founder?.name).toBe('מרים');
    expect(c.site?.founder?.quote).toEqual({ he: 'ציטוט' });
    expect(c.site?.founder?.photo).toBeUndefined(); // http נזרק
    expect((c.site?.founder as Record<string, unknown>).evil).toBeUndefined();
    expect(base({ founder: { photo: 'https://x/p.jpg' } }).site?.founder?.photo).toBe('https://x/p.jpg');
  });

  it('timeline: דורש year+title; פריט חסר-title נזרק; תקרת 10', () => {
    const c = base({
      timeline: [
        { year: '2002', title: 'התחלה', note: 'הערה' },
        { year: '2009' }, // בלי title ⇒ נזרק
        { title: 'בלי שנה' }, // בלי year ⇒ נזרק
      ],
    });
    expect(c.site?.timeline).toHaveLength(1);
    expect(c.site?.timeline?.[0]).toEqual({ year: '2002', title: 'התחלה', note: 'הערה' });
  });

  it('growth: label/delta + points 0..1 (חיתוך; דורש ≥2)', () => {
    const c = base({ growth: { label: 'סלים', delta: '+38%', points: [0.1, 2, -1, 0.9] } });
    expect(c.site?.growth?.label).toBe('סלים');
    expect(c.site?.growth?.delta).toBe('+38%');
    expect(c.site?.growth?.points).toEqual([0.1, 1, 0, 0.9]); // 2→1, -1→0
    expect(base({ growth: { points: [0.5] } }).site?.growth?.points).toBeUndefined(); // <2 נזרק
  });

  it('paymentMethods: דורש label+detail; ltr נשמר; פריט חסר נזרק', () => {
    const c = base({
      paymentMethods: [
        { label: 'אונליין', detail: 'אשראי' },
        { label: 'Checks', detail: 'Monsey', ltr: true },
        { label: 'רק-תווית' }, // בלי detail ⇒ נזרק
      ],
    });
    expect(c.site?.paymentMethods).toHaveLength(2);
    expect(c.site?.paymentMethods?.[1]).toEqual({ label: 'Checks', detail: 'Monsey', ltr: true });
  });

  it('transparency.badges: רב-לשוני, תקרת 6; contact.taxNote מחוטא', () => {
    const c = base({
      transparency: { heading: 'שקיפות', badges: ['סעיף 46', { he: '92%' }] },
      contact: { taxNote: 'ע.ר. 580' },
    });
    expect(c.site?.transparency?.badges).toEqual(['סעיף 46', { he: '92%' }]);
    expect(c.site?.contact?.taxNote).toBe('ע.ר. 580');
  });
});

describe('🎨 sitePalette — התאמה לכל ורטיקל', () => {
  it('אין accent (ורטיקל עמותתי) ⇒ קורל מקורי ביט-זהה (chesed לא זז)', () => {
    expect(sitePalette(undefined)).toEqual(CORAL_PALETTE);
    expect(sitePalette('')).toEqual(CORAL_PALETTE);
    expect(sitePalette('not-a-hex')).toEqual(CORAL_PALETTE);
    expect(CORAL_PALETTE.c1).toBe('#EC9C9C'); // מקובע לעיצוב המקורי
  });
  it('accent ⇒ משפחה נגזרת: הגוון נשמר, בהיר>עמוק, שונה מקורל', () => {
    const p = sitePalette('#5b6cff'); // אינדיגו (digital)
    expect(p).not.toEqual(CORAL_PALETTE);
    // גוון כחלחל: הרכיב הכחול גובר על האדום ב-c2
    const [r, , b] = [parseInt(p.c2.slice(1, 3), 16), 0, parseInt(p.c2.slice(5, 7), 16)];
    expect(b).toBeGreaterThan(r);
    // בהיר בהיר יותר מעמוק
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    expect(lum(p.c1)).toBeGreaterThan(lum(p.c3));
    // rgb1/rgb2 בפורמט "r,g,b"
    expect(p.rgb1.split(',')).toHaveLength(3);
  });
  it('גוון-מותג שונה ⇒ פלטה שונה (build כתום ≠ studio תכלת)', () => {
    expect(sitePalette('#e8912a')).not.toEqual(sitePalette('#0ea5e9'));
  });
});

describe('🗣️ siteVocab — סוג-ארגון', () => {
  it('עמותתי ⇒ "לתרומה"; מסחרי ⇒ "צרו קשר" (בלי "תרומה")', () => {
    const np = siteVocab(false, 'he');
    expect(np.heroCta).toContain('לתרומה');
    expect(np.commercial).toBe(false);
    const com = siteVocab(true, 'he');
    expect(com.heroCta).toBe('צרו קשר');
    expect(com.navCta).not.toContain('תרומה');
    expect(com.giveLabel).not.toContain('תרומה');
    expect(com.commercial).toBe(true);
  });
  it('אנגלית: Donate ↔ Get in touch', () => {
    expect(siteVocab(false, 'en').heroCta).toBe('Donate now');
    expect(siteVocab(true, 'en').heroCta).toBe('Get in touch');
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
    // הסקשנים המשודרגים מוזנים-קונפיג (לא תוכן קשיח): מייסד/ציר-זמן/אמצעי-תשלום/גרף/מדליונים
    expect(siteSrc).toContain('site.founder');
    expect(siteSrc).toContain('site.timeline');
    expect(siteSrc).toContain('site.paymentMethods');
    expect(siteSrc).toContain('site.growth');
    expect(siteSrc).toContain('transparency?.badges');
    // תנועות-העיצוב המדויקות נשמרות (Chesed Landing p-*)
    expect(siteSrc).toContain('ps-beat');
    expect(siteSrc).toContain('ps-draw');
    // התאמה-לכל-ורטיקל: הפלטה נגזרת מ-config.accent + שפה תלוית-סוג-ארגון (§46)
    expect(siteSrc).toContain('sitePalette(config.accent)');
    expect(siteSrc).toContain("featureOn(config, 'core.taxreceipt')");
    expect(siteSrc).toContain('siteVocab(commercial');
    // הצבעים דרך משתני-CSS מהשורש (var(--c…)) ⇒ מתחלפים פר-ורטיקל
    expect(siteSrc).toContain('var(--c1)');
    expect(siteSrc).toContain('paletteVars');
  });
});
