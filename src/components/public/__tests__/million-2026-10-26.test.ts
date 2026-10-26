/**
 * רצ'ט — «מה צריך לשפר כדי שיהיה מיליון דולר» ⇒ «כל מה שאתה יכול לעשות לבד תעשה» (26.10.2026).
 *  ⚡ מהירות: בדומיין-הציבורי init לא טוען DB/ענן (Firebase) ולא מחמם מסכי-משרד (LCP 3ש׳ ב-4G; 1,012KB ⇒ 540KB).
 *  🕯 הקדשה ⇒ נדרים `avour` (מקודד %20 — נדרים מפענח ב-decodeURIComponent, '+' לא הופך לרווח).
 *  🌍 אתר באנגלית ⇒ donateUrlIntl (Cardknox). 📄 קישור-אישורים (גיידסטאר). ⚖️ הצהרת-נגישות + 🔒 פרטיות (שומרות שורות).
 *  🐛 אשף: שדות-שורות (מדליונים/הטבות/גלריה/מרקיזה) בלעו Enter ו**מחקו את התרגום לאנגלית** בכל עריכה.
 *  🔎 Worker: sitemap.xml · JSON-LD (NGO) · Cloudflare Web Analytics.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../../lib/config';
import { donateLinkFor } from '../../../lib/publicSite';
import siteSrc from '../PublicSite.tsx?raw';
import appSrc from '../../../App.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import wizardSrc from '../../builder/BuilderWizard.tsx?raw';
import maor from '../../../../public/c/maor-hachesed/config.json';
import type { OrgConfig } from '../../../types/config';

const worker = readFileSync(new URL('../../../../deploy/cloudflare/meorhachessed-site.worker.js', import.meta.url), 'utf8');
const NED = 'https://www.matara.pro/nedarimplus/online/?mosad=7001532';
const norm = (site: unknown) => (normalizeConfig({ slug: 'x', orgName: 'א', theme: 'or-rishon', site }) as OrgConfig).site;

describe('💎 מיליון-דולר — האתר-הציבורי', () => {
  it('⚡ דומיין-ציבורי: init בלי DB/ענן; אין חימום-מסכים; אתר-כבוי ⇒ למשרד', () => {
    expect(storeSrc).toMatch(/if \(currentSiteDomain\(\)\) \{\n\s*set\(\{ config, ready: true,[^\n]*enabled: false[^\n]*\}\);\n\s*applyTheme\([^\n]*\);\n\s*return;/);
    const i = storeSrc.indexOf('if (currentSiteDomain()) {');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(storeSrc.indexOf('const res = await loadDb();'));
    expect(appSrc).toMatch(/if \(!ready \|\| currentSiteDomain\(\)\) return; \/\/ דומיין-ציבורי/);
    expect(appSrc).toMatch(/if \(siteDomain && !publicSiteOn\(config\)\) \{\n\s*window\.location\.replace\(siteDomain\.officeUrl\);/);
  });

  it('🕯 הקדשה ⇒ avour מקודד %20, עד 100 תווים, רק לנדרים', () => {
    const u = donateLinkFor(NED, 180, false, 'לעילוי נשמת אבי')!;
    expect(u).toContain('&avour=' + encodeURIComponent('לעילוי נשמת אבי'));
    expect(u).not.toMatch(/avour=[^&]*\+/);
    expect(decodeURIComponent(new URL(u).search.split('avour=')[1])).toBe('לעילוי נשמת אבי');
    expect(donateLinkFor(NED, 180, false, 'x'.repeat(150))!.split('avour=')[1]).toHaveLength(100);
    expect(donateLinkFor(NED, 180, false, '  ')).not.toContain('avour');
    expect(donateLinkFor('https://secure.cardknox.com/x', 5, true, 'לרפואת')).toBe('https://secure.cardknox.com/x');
    expect(siteSrc).toContain("donateLinkFor(donate, amt, mode === 'monthly', ded)");
  });

  it('🌍 באנגלית ⇒ סליקה בינלאומית; 📄 קישור-אישורים; ⚖️ חלונות-משפט', () => {
    expect(siteSrc).toContain("const intlUrl = lang !== 'he' && site.donateUrlIntl ? site.donateUrlIntl : null;");
    expect(siteSrc).toContain('const donate = intlUrl || siteDonateUrl(config);');
    expect(siteSrc).toMatch(/site\.transparency\?\.reportsUrl && \(/);
    expect(siteSrc).toMatch(/t\(site\.accessibility\) && <button[^\n]*setLegal\('a11y'\)/);
    expect(siteSrc).toMatch(/t\(site\.privacy\) && <button[^\n]*setLegal\('privacy'\)/);
    expect(siteSrc).toMatch(/role="dialog" aria-modal="true"[^\n]*onKeyDown=\{\(e\) => \{ if \(e\.key === 'Escape'\) setLegal\(null\);/);
  });

  it('חיטוי: donateUrlIntl https בלבד; הצהרות שומרות שורות ומסירות תווי-בקרה', () => {
    const s = norm({ donateUrlIntl: 'http://x.example', accessibility: 'שורה א\r\nשורה ב\u0007', privacy: { he: 'א\nב', en: 'a\nb' }, transparency: { reportsUrl: 'https://www.guidestar.org.il/x', reportsLabel: 'לאישורים' } });
    expect(s?.donateUrlIntl).toBeUndefined();
    expect(norm({ donateUrlIntl: 'https://secure.cardknox.com/x' })?.donateUrlIntl).toBe('https://secure.cardknox.com/x');
    expect(s?.accessibility).toBe('שורה א\nשורה ב');
    expect(s?.privacy).toEqual({ he: 'א\nב', en: 'a\nb' });
    expect(s?.transparency).toMatchObject({ reportsUrl: 'https://www.guidestar.org.il/x', reportsLabel: 'לאישורים' });
  });

  it('🐛 אשף: שדות-שורות לא-נשלטים (onBlur) ושומרים תרגום (linesKeep)', () => {
    expect(wizardSrc).toContain('toLines(text).map((l, i) => putHe(old?.[i], l) ?? l)');
    for (const f of ['setTransp({ badges: linesKeep(', 'set({ perks: linesKeep(', 'setSite({ marquee: linesKeep(']) expect(wizardSrc).toContain(f);
    expect(wizardSrc).not.toMatch(/value=\{heLines\([^)]*\)\} onChange=/);
    for (const f of ['donateUrlIntl:', 'reportsUrl:', 'reportsLabel:', 'accessibility:', 'privacy:']) expect(wizardSrc).toContain(f);
  });

  it('🔎 Worker: sitemap · JSON-LD (NGO, בלי "<" גולמי) · Web Analytics', () => {
    expect(worker).toMatch(/if \(u\.pathname === '\/sitemap\.xml'\)/);
    expect(worker).toContain("'@type': 'NGO'");
    expect(worker).toContain("JSON.stringify(LD).replace(/</g, '\\\\u003c')");
    expect(worker).toContain('static.cloudflareinsights.com/beacon.min.js');
  });

  it('מאור: אישורים מאומתים בגיידסטאר (26.10.2026) + הצהרות קיימות', () => {
    const s = (maor as { site: Record<string, unknown> }).site as { transparency: { reportsUrl: string; badges: { he: string }[] }; donateUrlIntl: string; accessibility: { he: string; en: string }; privacy: { he: string; en: string } };
    expect(s.transparency.reportsUrl).toBe('https://www.guidestar.org.il/organization/580651719');
    expect(s.transparency.badges.map((b) => b.he)).toEqual(expect.arrayContaining(['ניהול תקין 2026', 'סעיף 46 — בתוקף עד 31.12.2027']));
    expect(s.donateUrlIntl).toBe('https://secure.cardknox.com/meorhachessedlutzkininc');
    for (const k of ['accessibility', 'privacy'] as const) { expect(s[k].he).toContain('m0548538794@gmail.com'); expect(s[k].en.length).toBeGreaterThan(200); }
  });
});
