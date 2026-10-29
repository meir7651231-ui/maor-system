/**
 * רצ'ט — ספרדית + צרפתית + «ברגע שזה חו״ל הכפתור לסולה» (29.10.2026, בקשת-בעלים; בלי יידיש).
 *
 * ננעל:
 *  1. es/fr בשפות-האתר, כיוון LTR, תוויות-ממשק ומילון-שלד לכל קריאת he() סטטית.
 *  2. כל טקסט אנגלי בקונפיג של מאור קיבל es+fr, ושורד חיטוי בשלמותו (בלי קיטוע-תקרה).
 *  3. חו״ל = שפה שאינה עברית **או** גולש מחוץ לישראל (מטא מה-Worker, אחרת אזור-זמן).
 *  4. התוכן בענן (נזרע לפני es/fr) משולם מהקובץ — רק כשהעברית לא נערכה.
 */
import { describe, expect, it } from 'vitest';
import { SITE_LANGS } from '../../../types/config';
import { isRtlLang, isVisitorAbroad, siteUi, siteVocab } from '../../../lib/publicSite';
import { SKELETON_I18N } from '../../../lib/publicSiteI18n';
import { fillMissingLangs, withCloudSite } from '../../../lib/publicSiteCloud';
import { normalizeConfig } from '../../../lib/config';
import siteSrc from '../PublicSite.tsx?raw';
import worker from '../../../../deploy/cloudflare/meorhachessed-site.worker.js?raw';
import maor from '../../../../public/c/maor-hachesed/config.json';
import type { OrgConfig } from '../../../types/config';

describe('🌍 ספרדית וצרפתית', () => {
  it('es/fr בשפות, משמאל-לימין; עברית/יידיש מימין', () => {
    expect(SITE_LANGS).toEqual(expect.arrayContaining(['es', 'fr']));
    expect(isRtlLang('es')).toBe(false);
    expect(isRtlLang('fr')).toBe(false);
    expect(isRtlLang('he')).toBe(true);
    expect(isRtlLang('yi')).toBe(true);
  });
  it('תוויות-ממשק ו-CTA בשפה עצמה', () => {
    expect(siteUi('es', 'donate')).toBe('Donar');
    expect(siteUi('fr', 'enter')).toBe('Espace équipe');
    expect(siteVocab(false, 'es').heroCta).toBe('Donar ahora');
    expect(siteVocab(false, 'fr').give).toBe('Faire un don ♡');
    expect(siteVocab(false, 'he').heroCta).toBe('לתרומה עכשיו');
  });
  it('כל קריאת he() סטטית מכוסה במילון es/fr; קריאות-תבנית מעבירות es/fr', () => {
    const re = /\bhe\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*(['"`])((?:\\.|(?!\3).)*)\3\s*(,)?/g;
    let m: RegExpExecArray | null;
    const missing: string[] = [];
    while ((m = re.exec(siteSrc))) {
      if (m[3] === '`' && m[4].includes('${')) { if (!m[5]) missing.push('template:' + m[4]); continue; }
      const en = m[4].replace(/\\'/g, "'");
      if (!SKELETON_I18N[en]?.es || !SKELETON_I18N[en]?.fr) missing.push(en);
    }
    expect(missing).toEqual([]);
  });
  it('מאור: השפות he/en/es/fr (בלי יידיש), כל טקסט אנגלי קיבל es+fr ושורד חיטוי בשלמותו', () => {
    const site = (maor as { site: Record<string, unknown> }).site;
    expect(site.langs).toEqual(['he', 'en', 'es', 'fr']);
    const norm = (normalizeConfig(maor) as OrgConfig).site as unknown;
    const pairs: string[] = [];
    (function walk(raw: unknown, n: unknown, p: string) {
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as Record<string, unknown>).en === 'string') {
        const r = raw as Record<string, string>; const x = (n ?? {}) as Record<string, string>;
        for (const l of ['es', 'fr']) if (!r[l] || x[l] !== r[l]) pairs.push(`${p}.${l}`);
        expect(JSON.stringify(raw)).not.toContain('"yi"');
        return;
      }
      if (Array.isArray(raw)) raw.forEach((v, i) => walk(v, (n as unknown[] | undefined)?.[i], `${p}[${i}]`));
      else if (raw && typeof raw === 'object') for (const k of Object.keys(raw)) walk((raw as Record<string, unknown>)[k], (n as Record<string, unknown> | undefined)?.[k], `${p}.${k}`);
    })(site, norm, 'site');
    expect(pairs).toEqual([]);
  });
});

describe('💳 חו״ל ⇒ סולה', () => {
  it('מדינה מה-Worker גוברת; אין מדינה ⇒ אזור-זמן; לא-ידוע ⇒ ישראל', () => {
    expect(isVisitorAbroad('US', 'Asia/Jerusalem')).toBe(true);
    expect(isVisitorAbroad('IL', 'America/New_York')).toBe(false);
    expect(isVisitorAbroad('il', null)).toBe(false);
    expect(isVisitorAbroad(null, 'America/New_York')).toBe(true);
    expect(isVisitorAbroad('', 'Asia/Jerusalem')).toBe(false);
    expect(isVisitorAbroad('XX', 'Asia/Jerusalem')).toBe(false); // XX = לא-ידוע ב-Cloudflare
    expect(isVisitorAbroad(null, null)).toBe(false);
  });
  it('חיווט: שפה שאינה עברית או מיקום-חו״ל ⇒ donateUrlIntl', () => {
    expect(siteSrc).toContain("const intlUrl = (lang !== 'he' || abroad) && site.donateUrlIntl ? site.donateUrlIntl : null;");
    expect(siteSrc).toContain("he('לתרומה מאובטחת ←', 'Donate online →')");
  });
  it('ה-Worker מזריק את מדינת-הגולש (2 אותיות בלבד)', () => {
    expect(worker).toContain('<meta name="visitor-country" content="${country}">');
    expect(worker).toMatch(/\/\^\[A-Z\]\{2\}\$\/\.test\(String\(req\.cf\?\.country/);
  });
  it('לקישור-הסולה של מאור יש ערך', () => {
    expect((maor as { site: { donateUrlIntl?: string } }).site.donateUrlIntl).toBe('https://secure.cardknox.com/meorhachessedlutzkininc');
  });
});

describe('☁️ ענן שנזרע לפני es/fr — השלמה מהקובץ', () => {
  const base = { langs: ['he', 'en', 'es'], heroTitle: { he: 'בית', en: 'Home', es: 'Hogar' }, faq: [{ q: { he: 'ש', en: 'Q', es: 'P' } }], story: { he: 'ישן', en: 'Old', es: 'Viejo' } };
  it('עברית זהה ⇒ שפות חסרות נלקחות; עברית נערכה ⇒ לא נוגעים; langs ⇒ איחוד', () => {
    const cloud = { langs: ['he', 'en'], heroTitle: { he: 'בית', en: 'My home' }, faq: [{ q: { he: 'ש', en: 'Q' } }], story: { he: 'חדש', en: 'Old' } };
    const out = fillMissingLangs(cloud, base) as typeof base;
    expect(out.langs).toEqual(['he', 'en', 'es']);
    expect(out.heroTitle).toEqual({ he: 'בית', en: 'My home', es: 'Hogar' }); // הענן מנצח על en
    expect(out.faq[0].q.es).toBe('P');
    expect(out.story).toEqual({ he: 'חדש', en: 'Old' }); // נערך ⇒ בלי תרגום-ישן
  });
  it('withCloudSite משלים מ-config.site', () => {
    const cfg = { slug: 's', orgName: 'א', theme: 'or-rishon', site: base } as unknown as OrgConfig;
    const out = withCloudSite(cfg, { enabled: true, langs: ['he', 'en'], heroTitle: { he: 'בית', en: 'Home' } });
    expect(out.site?.langs).toEqual(['he', 'en', 'es']);
    expect(out.site?.heroTitle).toEqual({ he: 'בית', en: 'Home', es: 'Hogar' });
  });
});
