/**
 * רצ'ט — עורך-האתר למנהל-הארגון (29.10.2026, «מערכת לשליטה … שפתוח למנהל הארגון לעריכת האתר»).
 *
 * מה ננעל:
 *  1. האתר-הציבורי קורא את התוכן מהענן (REST, בלי SDK) — וכל כשל/ריק ⇒ נשאר הקובץ (האתר לא נופל).
 *  2. התוכן מהענן עובר את אותו חיטוי (normalizeSite) — javascript:/http לא עוברים.
 *  3. הרשאה: רק editors של המסמך / מייל-על; מייל-לא-מאומת לא עורך (מונע רישום-מראש של מייל-המנהל).
 *  4. Rules v5: קריאה ציבורית (get), אין list, עורך כותב רק site/updatedAt/updatedBy.
 *  5. #site-edit נפתח לפני שער-החברות (המנהל אינו חבר-משרד) ובלי גישה לנתוני-המשרד.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { fromFirestoreValue, siteFromRestDoc, withCloudSite, fetchCloudSite, publicSiteDocUrl } from '../../../lib/publicSiteCloud';
import { canEditSite } from '../SiteEditorPage';
import type { OrgConfig } from '../../../types/config';
import appSrc from '../../../App.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import cloudCfgSrc from '../../../lib/cloudConfig.ts?raw';
import editorSrc from '../SiteEditorPage.tsx?raw';
import rules from '../../../../firestore.rules?raw';
import worker from '../../../../deploy/cloudflare/meorhachessed-site.worker.js?raw';

const base = { slug: 'maor-hachesed', orgName: 'מאור', theme: 'or-rishon', site: { enabled: true, heroTitle: 'מהקובץ' } } as unknown as OrgConfig;
const fbCfg = { ...base, firebase: { projectId: 'p1', apiKey: 'K', authDomain: 'x', appId: 'a' } } as unknown as OrgConfig;

describe('🌐 תוכן-האתר מהענן — ממיר REST', () => {
  it('ממיר map/array/מספרים/בוליאני', () => {
    const v = { mapValue: { fields: { a: { stringValue: 'ש' }, n: { integerValue: '180' }, d: { doubleValue: 1.5 }, b: { booleanValue: true }, l: { arrayValue: { values: [{ integerValue: '1' }, { stringValue: 'x' }] } }, z: { nullValue: null } } } };
    expect(fromFirestoreValue(v)).toEqual({ a: 'ש', n: 180, d: 1.5, b: true, l: [1, 'x'], z: null });
    expect(fromFirestoreValue({ arrayValue: {} })).toEqual([]);
  });
  it('מסמך בלי site / site לא-map ⇒ null', () => {
    expect(siteFromRestDoc(null)).toBeNull();
    expect(siteFromRestDoc({ fields: {} })).toBeNull();
    expect(siteFromRestDoc({ fields: { site: { stringValue: 'x' } } })).toBeNull();
    expect(siteFromRestDoc({ fields: { site: { mapValue: { fields: { heroTitle: { stringValue: 'מהענן' } } } } } })).toEqual({ heroTitle: 'מהענן' });
  });
  it('כתובת REST מקודדת', () => {
    expect(publicSiteDocUrl({ projectId: 'p1', apiKey: 'K' }, 'maor-hachesed')).toBe('https://firestore.googleapis.com/v1/projects/p1/databases/(default)/documents/publicSites/maor-hachesed?key=K');
  });
});

describe('🛟 נפילה-רכה — האתר לא נופל לעולם', () => {
  it('ריק/null ⇒ הקונפיג כמות-שהוא; תוכן ⇒ מוחל ומחוטא', () => {
    expect(withCloudSite(base, null)).toBe(base);
    expect(withCloudSite(base, {})).toBe(base);
    const out = withCloudSite(base, { enabled: true, heroTitle: 'מהענן', donateUrl: 'javascript:alert(1)' });
    expect(out.site?.heroTitle).toBe('מהענן');
    expect(out.site?.donateUrl).toBeUndefined();
  });
  afterEach(() => vi.unstubAllGlobals());
  it('בלי firebase ⇒ לא פונה לרשת', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchCloudSite(base)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it('404 / שגיאת-רשת ⇒ null; תקין ⇒ site', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await fetchCloudSite(fbCfg)).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('net'); }));
    expect(await fetchCloudSite(fbCfg)).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ fields: { site: { mapValue: { fields: { heroTitle: { stringValue: 'ע' } } } } } }) })));
    expect(await fetchCloudSite(fbCfg)).toEqual({ heroTitle: 'ע' });
  });
  it('init בדומיין מחיל את הענן לפני הרינדור', () => {
    expect(storeSrc).toContain('config = withCloudSite(config, await fetchCloudSite(config));');
  });
});

describe('🔐 הרשאת-עריכה', () => {
  const doc = { editors: ['m0548538794@gmail.com'] } as never;
  it('רק editors (בלי תלות-רישיות); זר/ריק ⇒ לא', () => {
    expect(canEditSite('M0548538794@Gmail.com ', doc)).toBe(true);
    expect(canEditSite('other@gmail.com', doc)).toBe(false);
    expect(canEditSite('', doc)).toBe(false);
    expect(canEditSite('m0548538794@gmail.com', null)).toBe(false);
  });
  it('שמירה = updateDoc של שלושת השדות בלבד (כמו ש-Rules דורשים)', () => {
    const save = cloudCfgSrc.slice(cloudCfgSrc.indexOf('export async function savePublicSite'), cloudCfgSrc.indexOf('export async function createPublicSite'));
    expect(save).toContain('updateDoc(');
    expect(save).not.toContain('editors');
    expect(save).toMatch(/updatedBy: email\.trim\(\)\.toLowerCase\(\)/);
  });
  it('מייל לא-מאומת ⇒ שלב "unverified" עם שליחה-חוזרת', () => {
    expect(editorSrc).toContain("'unverified'");
    expect(editorSrc).toContain('resendEmailVerification');
  });
});

describe('📜 Rules v5 · publicSites', () => {
  const block = rules.slice(rules.indexOf('match /publicSites/{slug}'), rules.indexOf('match /publicSites/{slug}') + 900);
  it('get ציבורי, list חסום, יצירה/מחיקה = מייל-על', () => {
    expect(block).toMatch(/allow get: if true;/);
    expect(block).toMatch(/allow list: if false;/);
    expect(block).toMatch(/allow create, delete: if superAdmin\(\);/);
  });
  it('עורך: מאומת, ברשימה, רק site/updatedAt/updatedBy, updatedBy = עצמו', () => {
    expect(block).toContain('email_verified == true');
    expect(block).toContain("in resource.data.get('editors', [])");
    expect(block).toContain(".hasOnly(['site', 'updatedAt', 'updatedBy'])");
    expect(block).toContain('request.resource.data.updatedBy == request.auth.token.email.lower()');
  });
  it('publicSites מוחרג מה-catch-all של השורש', () => {
    expect(rules).toMatch(/'teamChats', 'publicSites'\]/);
  });
});

describe('🚪 שערי-האפליקציה', () => {
  it('#site-edit: כניסה ייעודית לפני LoginScreen, עורך לפני שער-החברות', () => {
    const iLogin = appSrc.indexOf('cloud.enabled && !cloud.user && siteEditRequested');
    const iLoginScreen = appSrc.indexOf('<LoginScreen />');
    const iEditor = appSrc.indexOf('cloud.enabled && cloud.user && siteEditRequested');
    expect(iLogin).toBeGreaterThan(0);
    expect(iLogin).toBeLessThan(iLoginScreen);
    expect(iEditor).toBeGreaterThan(iLoginScreen);
    const membership = appSrc.indexOf("cloud.membership === 'checking'");
    if (membership > 0) expect(iEditor).toBeLessThan(membership);
  });
  it('ה-Worker מקדים את בקשת-הענן (preload)', () => {
    expect(worker).toMatch(/rel="preload" href="\$\{CLOUD_SITE_URL\}"|CLOUD_SITE_URL/);
    expect(worker).toContain('documents/publicSites/maor-hachesed');
  });
});
