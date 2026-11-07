/**
 * ratchet — 🪙 גבי – תזכורות תשלום בתוך אורביט (7.11.2026, דורמנטי).
 *
 * כוונה: גבי (מוצר נפרד, collect-agent/) יימכר כהרחבה בתוך אורביט — אבל **טרם הושק**.
 * מה ננעל כאן:
 *  (1) כנות: gabi = 'roadmap' ⇒ לא בצ'יפי-המכירה, לא ב-liveAddons, לא במחירון. מכירת-אוויר
 *      של מוצר שלא קיים = הבאג שטקסונומיית-הכנות (4.8) נבנתה למנוע.
 *  (2) דורמנטיות: חסר=כבוי (integrationOn). שני קונפיגי-הלקוח-החי לא מזכירים את gabi
 *      ⇒ אין סעיף, אין צ'יפ, אין לשונית — ביט-זהה.
 *  (3) חוזה-המסירה: חתום HMAC, קצר-מועד (≤300 שנ'), org+email+exp+nonce; כתובת https בלבד
 *      (safeHttpsUrl), הטוקן ב-fragment; אפס קריאות-רשת; סוד לעולם לא בקונפיג.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildGabiHandoffClaims, buildGabiHandoffUrl, gabiConnectUrl, gabiPriceLine, GABI_HANDOFF_MAX_TTL,
  GABI_PRODUCT, gabiConnectBlocker, gabiSectionVisible, signGabiHandoff, verifyGabiHandoff,
} from '../gabi';
import { integrationOn, normalizeConfig } from '../config';
import { DEFAULT_PRICES } from '../pricing';
import { DEFAULT_CONFIG, INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS, type OrgConfig } from '../../types/config';
import { INTEGRATION_LABELS, INTEGRATION_STATUS, liveAddons } from '../../components/builder/handoff';
import { GabiSection } from '../../components/settings/GabiSection';
import gabiSrc from '../gabi.ts?raw';
import sectionSrc from '../../components/settings/GabiSection.tsx?raw';
import settingsSrc from '../../components/settings/SettingsView.tsx?raw';
import wizardSrc from '../../components/builder/BuilderWizard.tsx?raw';

const root = (f: string) => readFileSync(new URL('../../../' + f, import.meta.url), 'utf8');
const SECRET = 'k'.repeat(40);
const NOW = 1_800_000_000;
const NONCE = 'AbCdEfGhIjKlMnOpQrStUv';

describe('🪙 גבי — קטלוג וכנות-מכירה', () => {
  it('הקופי הרשמי: שם · סלוגן · ₪119/חודש או ₪1,190/שנה · 14 ימי ניסיון', () => {
    expect(GABI_PRODUCT.name).toBe('גבי – תזכורות תשלום');
    expect(GABI_PRODUCT.slogan).toBe('הכסף שלך חוזר. בלי שתצטרך לרדוף.');
    expect(gabiPriceLine()).toBe('₪119/חודש או ₪1,190/שנה · 14 ימי ניסיון');
    expect(INTEGRATION_LABELS.gabi).toBe('🪙 גבי – תזכורות תשלום');
  });

  it('הלוגו הסופי הועתק לנכסי-אורביט (לא ייבוא חוצה-פרויקטים): סמל-היד+מטבע-ירוק', () => {
    expect(GABI_PRODUCT.logoSrc).toBe('/gabi/logo-mark.svg');
    const svg = root('public/gabi/logo-mark.svg');
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('aria-label="גבי"');
    expect(svg).toContain('#059669'); // המטבע — הירוק היחיד
    expect(svg).toContain('#0F172A'); // דיו נייבי
    expect(svg).not.toMatch(/<script|on\w+=/i);
    // אין ייבוא מ-collect-agent בקוד של אורביט
    expect(gabiSrc).not.toMatch(/from ['"][^'"]*collect-agent/);
    expect(sectionSrc).not.toMatch(/from ['"][^'"]*collect-agent/);
  });

  it("🐛 מכירת-אוויר: gabi = 'roadmap' ⇒ לא ב-liveAddons, לא במחירון, לא בצ'יפי-המכירה", () => {
    expect(INTEGRATION_KEYS).toContain('gabi');
    expect(INTEGRATION_STATUS.gabi).toBe('roadmap');
    expect(liveAddons({ integrations: { gabi: { enabled: true }, whatsapp: { enabled: true } } }).map((a) => a.key)).toEqual(['whatsapp']);
    expect(DEFAULT_PRICES.integrations.gabi).toBeUndefined();
    // צ'יפי-המכירה והמחירון באשף מסננים ל-live בלבד (ratchet ‏integrations-wave1)
    expect(wizardSrc).toContain("INTEGRATION_STATUS[k] === 'live'");
  });
});

describe('🪙 גבי — דורמנטיות (חסר=כבוי, הלקוח-החי ביט-זהה)', () => {
  it('שני קונפיגי-הלקוח-החי: אין gabi ⇒ integrationOn=false', () => {
    for (const f of ['public/config.json', 'public/c/maor-hachesed/config.json']) {
      const raw = root(f);
      expect(raw, f).not.toContain('gabi');
      const cfg = normalizeConfig(JSON.parse(raw)) as OrgConfig;
      expect(cfg, f).toBeTruthy();
      expect(integrationOn(cfg, 'gabi'), f).toBe(false);
    }
  });

  it('רק enabled:true מפורש מדליק; בדמו לעולם לא; normalize שומר baseUrl וזורק סוד', () => {
    expect(integrationOn(DEFAULT_CONFIG, 'gabi')).toBe(false);
    expect(integrationOn({ ...DEFAULT_CONFIG, integrations: { gabi: { enabled: false } } }, 'gabi')).toBe(false);
    expect(integrationOn({ ...DEFAULT_CONFIG, slug: 'demo', integrations: { gabi: { enabled: true } } }, 'gabi')).toBe(false);
    expect(INTEGRATION_SETTING_KEYS.gabi).toEqual(['baseUrl']);
    const n = normalizeConfig({ slug: 'acme', orgName: 'x', theme: 'tsohar', modules: {}, features: {},
      integrations: { gabi: { enabled: true, baseUrl: ' https://gabi.example/ ', secret: 'LEAK', handoffSecret: 'LEAK' } } }) as OrgConfig;
    expect(n.integrations?.gabi).toEqual({ enabled: true, baseUrl: 'https://gabi.example/' });
    expect(JSON.stringify(n)).not.toContain('LEAK');
  });

  it('GabiSection: בקונפיג-ברירת-המחדל (בלי הדגל) לא מרונדר כלום — ביט-זהה', () => {
    expect(renderToStaticMarkup(createElement(GabiSection))).toBe('');
  });

  it('שער-התצוגה: חסר/כבוי/דמו ⇒ מוסתר; ארגון-פלטפורמה ⇒ רק מנהל', () => {
    const on: OrgConfig = { ...DEFAULT_CONFIG, slug: 'acme', integrations: { gabi: { enabled: true } } };
    expect(gabiSectionVisible({ ...DEFAULT_CONFIG, slug: 'acme' }, 'a@b.co', true)).toBe(false);
    expect(gabiSectionVisible({ ...on, integrations: { gabi: { enabled: false } } }, 'a@b.co', true)).toBe(false);
    expect(gabiSectionVisible({ ...on, slug: 'demo' }, 'a@b.co', true)).toBe(false);
    expect(gabiSectionVisible(on, 'a@b.co', false)).toBe(true); // אופליין/בלי adminEmails — כמו כל סעיף-מנהל
    const platform: OrgConfig = { ...on, firebase: { apiKey: 'x', authDomain: 'x', projectId: 'x', appId: 'x' } };
    expect(gabiSectionVisible(platform, 'worker@acme.org', false)).toBe(false); // עובד/ת — לא
    expect(gabiSectionVisible(platform, 'boss@acme.org', true)).toBe(true); // מנהל-ארגון
  });

  it('סיבת-החסימה של הכפתור: כתובת ⇒ ארגון ⇒ מייל ⇒ סוד ⇒ מוכן', () => {
    const on: OrgConfig = { ...DEFAULT_CONFIG, slug: 'acme', integrations: { gabi: { enabled: true } } };
    expect(gabiConnectBlocker(on, 'a@b.co', SECRET)).toContain('כתובת גבי טרם הוגדרה');
    const http: OrgConfig = { ...on, integrations: { gabi: { enabled: true, baseUrl: 'http://gabi.example' } } };
    expect(gabiConnectBlocker(http, 'a@b.co', SECRET)).toContain('כתובת גבי טרם הוגדרה');
    const ok: OrgConfig = { ...on, integrations: { gabi: { enabled: true, baseUrl: 'https://gabi.example' } } };
    expect(gabiConnectBlocker({ ...ok, slug: 'default' }, 'a@b.co', SECRET)).toContain('ארגון-פלטפורמה');
    expect(gabiConnectBlocker(ok, '', SECRET)).toContain('התחברות-ענן');
    expect(gabiConnectBlocker(ok, 'a@b.co', 'short')).toContain('סוד-חיבור');
    expect(gabiConnectBlocker(ok, 'a@b.co', SECRET)).toBe('');
  });

  it('🛡 הגנות-מקור: כל משטח מגודר; אפס-רשת; הסוד מקומי-למכשיר', () => {
    expect(gabiSrc).toContain("return integrationOn(config, 'gabi') && isAdminAuthority(config, email, isManager);");
    expect(sectionSrc).toContain('if (!gabiSectionVisible(config, cloudUser?.email, isManager)) return null;');
    expect(sectionSrc).toContain('nsLsKey(SECRET_KEY)');
    expect(settingsSrc).toContain("integrationOn(config, 'gabi') && isAdmin");
    expect(wizardSrc).toContain('config.integrations?.gabi?.enabled &&');
    for (const src of [gabiSrc, sectionSrc]) {
      expect(src).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|import\(['"]firebase/);
    }
  });
});

describe('🪙 גבי — חוזה-המסירה החתום', () => {
  const claims = () => buildGabiHandoffClaims({ slug: 'Acme', email: ' Boss@Acme.org ', nowSec: NOW, nonce: NONCE })!;

  it('claims קנוניים: lowercase, exp=iat+120, iss/aud קבועים', () => {
    expect(claims()).toEqual({ v: 1, iss: 'orbit', aud: 'gabi', org: 'acme', email: 'boss@acme.org', iat: NOW, exp: NOW + 120, nonce: NONCE });
  });

  it('קלט פסול ⇒ null: שורש/דמו, מייל, ttl מעל התקרה, nonce קצר', () => {
    const b = { slug: 'acme', email: 'a@b.co', nowSec: NOW, nonce: NONCE };
    expect(buildGabiHandoffClaims({ ...b, slug: 'default' })).toBeNull();
    expect(buildGabiHandoffClaims({ ...b, slug: 'demo' })).toBeNull();
    expect(buildGabiHandoffClaims({ ...b, email: 'nope' })).toBeNull();
    expect(buildGabiHandoffClaims({ ...b, ttlSec: GABI_HANDOFF_MAX_TTL + 1 })).toBeNull();
    expect(buildGabiHandoffClaims({ ...b, nonce: 'short' })).toBeNull();
  });

  it('חתימה ⇒ אימות עובר; זיוף/סוד-אחר/פג-תוקף נדחים; סוד חלש לא חותם', async () => {
    const t = (await signGabiHandoff(claims(), SECRET))!;
    expect(t).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(await signGabiHandoff(claims(), SECRET)).toBe(t); // דטרמיניסטי
    expect(await verifyGabiHandoff(t, SECRET, NOW + 10)).toEqual({ ok: true, claims: claims() });
    expect((await verifyGabiHandoff(t, 'z'.repeat(40), NOW + 10)).ok).toBe(false);
    expect(await verifyGabiHandoff(t, SECRET, NOW + 120)).toEqual({ ok: false, reason: 'expired' });
    // זיוף-payload (החלפת org) עם החתימה המקורית
    const forged = (await signGabiHandoff({ ...claims(), org: 'evil' }, SECRET))!.split('.')[0] + '.' + t.split('.')[1];
    expect(await verifyGabiHandoff(forged, SECRET, NOW + 10)).toEqual({ ok: false, reason: 'signature' });
    // טוקן ארוך-חיים שנחתם בסוד הנכון — נדחה בתקרה
    const long = (await signGabiHandoff({ ...claims(), exp: NOW + 3600 }, SECRET))!;
    expect(await verifyGabiHandoff(long, SECRET, NOW + 10)).toEqual({ ok: false, reason: 'ttl' });
    expect(await signGabiHandoff(claims(), 'short')).toBeNull();
  });

  it('כתובת: https בלבד, נתיב קבוע, הטוקן ב-fragment (לא ב-query — לא נשלח לשרת/לוגים)', async () => {
    expect(gabiConnectUrl('https://gabi.example/app/', 'a.b')).toBe('https://gabi.example/app/connect/orbit#h=a.b');
    expect(gabiConnectUrl('http://gabi.example', 'a.b')).toBeNull();
    expect(gabiConnectUrl('javascript:alert(1)', 'a.b')).toBeNull();
    expect(gabiConnectUrl('https://gabi.example', 'bad token')).toBeNull();
    const url = (await buildGabiHandoffUrl({ baseUrl: 'https://gabi.example?x=1', slug: 'acme', email: 'a@b.co', secret: SECRET, nowSec: NOW, nonce: NONCE }))!;
    const u = new URL(url);
    expect(u.search).toBe('');
    expect(u.pathname).toBe('/connect/orbit');
    const tok = u.hash.replace(/^#h=/, '');
    expect((await verifyGabiHandoff(tok, SECRET, NOW + 1)).ok).toBe(true);
    expect(await buildGabiHandoffUrl({ baseUrl: '', slug: 'acme', email: 'a@b.co', secret: SECRET, nowSec: NOW, nonce: NONCE })).toBeNull();
  });
});
