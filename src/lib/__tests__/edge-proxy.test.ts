/**
 * ratchet — 🌉 מצב-מסונן (12.10.2026): ליבת מתווך-הקצה בלקוח (lib/edgeProxy.ts) + החיווט.
 *
 * הבאג שזה סוגר: לקוחות על קו מסונן (נטפרי/רימון) לא מגיעים ל-googleapis ⇒ אין כניסה ואין
 * סנכרון (CLOSED-ONBOARD-2026-08-05). הסכנות שהבדיקות נועלות:
 * (ג) שדה-הקונפיג מחוטא — http/זבל/סיומת-מתחזה נדחים (דרך המתווך עוברות סיסמאות!);
 *     מסמך-ענן לא יכול להדליק/להפנות (resolveOrgConfig).
 * דורמנטיות — בלי השדה לא נוגעים ב-URL/באחסון; הוספת השדה לבדה לא מזיזה אף מכשיר.
 * חוצה-משטחים — הכתובות שהלקוח מייצר (Auth/Firestore/Functions/🩺) עוברות ב-Worker האמיתי.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OrgConfig } from '../../types/config';
import { DEFAULT_CONFIG, EDGE_HOST_SUFFIXES } from '../../types/config';
import { normalizeConfig, resolveOrgConfig } from '../config';
import {
  EDGE_DEVICE_KEY,
  activeEdge,
  edgeAuthUrl,
  edgeFirestoreSettings,
  edgeForThisDevice,
  edgeHostOf,
  edgeSwitchFromSearch,
  normalizeEdgeProxy,
  viaEdge,
} from '../edgeProxy';
import { netCheckScript, netCheckTargets } from '../netcheck';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const FB = {
  apiKey: 'AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo',
  authDomain: 'maor-system.firebaseapp.com',
  projectId: 'maor-system',
  appId: '1:437845665303:web:955fa5636e5b408ae7de52',
};
const cfg = (edgeProxy?: unknown): OrgConfig => ({ ...DEFAULT_CONFIG, slug: 'x', ...(edgeProxy === undefined ? {} : { edgeProxy: edgeProxy as OrgConfig['edgeProxy'] }) });

/** אחסון-בזיכרון עם רישום-נגיעות. */
function memStore(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: vi.fn((k: string) => (m.has(k) ? (m.get(k) as string) : null)),
    setItem: vi.fn((k: string, v: string) => void m.set(k, v)),
    removeItem: vi.fn((k: string) => void m.delete(k)),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('(ג) edgeHostOf / normalizeConfig — https בלבד, תת-דומיין של הבעלים בלבד', () => {
  it.each([
    ['edge.orbit-il.com', 'edge.orbit-il.com'],
    ['https://edge.orbit-il.com', 'edge.orbit-il.com'],
    ['https://edge.orbit-il.com/', 'edge.orbit-il.com'],
    ['  HTTPS://Edge.Orbit-IL.com  ', 'edge.orbit-il.com'],
    ['a.b.orbit-il.com', 'a.b.orbit-il.com'],
    ['xn--4dbrk0ce.orbit-il.com', 'xn--4dbrk0ce.orbit-il.com'],
  ])('מתקבל: %j ⇒ %s', (raw, host) => {
    expect(edgeHostOf(raw)).toBe(host);
  });

  it.each([
    'http://edge.orbit-il.com',
    'HTTP://edge.orbit-il.com',
    'ftp://edge.orbit-il.com',
    'ws://edge.orbit-il.com',
    'javascript:alert(1)',
    'data:text/html,<script>x</script>',
    '//edge.orbit-il.com',
    'edge.orbit-il.com:8443',
    'https://edge.orbit-il.com:443',
    'https://edge.orbit-il.com/path',
    'https://edge.orbit-il.com//',
    'https://edge.orbit-il.com?x=1',
    'https://edge.orbit-il.com#x',
    'https://user:pw@edge.orbit-il.com',
    'edge.orbit-il.com.',
    'edge..orbit-il.com',
    '-edge.orbit-il.com',
    'edge orbit-il.com',
    'אבג.orbit-il.com',
    'orbit-il.com',
    '.orbit-il.com',
    'evil-orbit-il.com',
    'edge.orbit-il.com.evil.com',
    'evil.com',
    'firestore.googleapis.com',
    'edge.github.io',
    '127.0.0.1',
    '[::1]',
    '',
    '   ',
    'a'.repeat(250) + '.orbit-il.com',
  ])('נדחה: %j', (raw) => {
    expect(edgeHostOf(raw)).toBeNull();
    const c = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'or-rishon', edgeProxy: { host: raw, allDevices: true } });
    expect(c).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(c, 'edgeProxy'), String(raw)).toBe(false);
  });

  it.each([42, null, undefined, true, ['edge.orbit-il.com'], { href: 'edge.orbit-il.com' }])('לא-מחרוזת/צורה זרה נדחית: %j', (raw) => {
    expect(edgeHostOf(raw)).toBeNull();
  });

  it('השדה עצמו: רק אובייקט; host חובה; הדגלים רק כ-true; מפתחות זרים נזרקים', () => {
    expect(normalizeEdgeProxy('edge.orbit-il.com')).toBeUndefined();
    expect(normalizeEdgeProxy(['edge.orbit-il.com'])).toBeUndefined();
    expect(normalizeEdgeProxy({ allDevices: true })).toBeUndefined();
    expect(normalizeEdgeProxy({ host: 'edge.orbit-il.com', allDevices: 'true', forceLongPolling: 1, evil: 'x', host2: 'evil.com' })).toStrictEqual({ host: 'edge.orbit-il.com' });
    expect(normalizeEdgeProxy({ host: 'https://edge.orbit-il.com/', allDevices: true, forceLongPolling: true })).toStrictEqual({
      host: 'edge.orbit-il.com',
      allDevices: true,
      forceLongPolling: true,
    });
    const polluted = JSON.parse('{"host":"edge.orbit-il.com","__proto__":{"allDevices":true}}') as unknown;
    expect(normalizeEdgeProxy(polluted)).toStrictEqual({ host: 'edge.orbit-il.com' });
  });

  it('normalizeConfig: ערך תקין נשמר מחוטא; חסר ⇒ אין מפתח בכלל', () => {
    const c = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'or-rishon', edgeProxy: { host: ' https://EDGE.orbit-il.com ', allDevices: true, junk: 1 } });
    expect(c?.edgeProxy).toStrictEqual({ host: 'edge.orbit-il.com', allDevices: true });
    const none = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'or-rishon' });
    expect(Object.prototype.hasOwnProperty.call(none, 'edgeProxy')).toBe(false);
  });

  it('allowlist-הסיומות: כולן תת-דומיין (נקודה מובילה) — לא דומיין-חשוף', () => {
    for (const s of EDGE_HOST_SUFFIXES) expect(s.startsWith('.')).toBe(true);
  });
});

describe('resolveOrgConfig — המתווך = bootstrap מהקונפיג הסטטי בלבד', () => {
  const st = normalizeConfig({ slug: 'acme', orgName: 'a', theme: 'or-rishon', edgeProxy: { host: 'edge.orbit-il.com' } }) as OrgConfig;
  const plain = normalizeConfig({ slug: 'acme', orgName: 'a', theme: 'or-rishon' }) as OrgConfig;

  it('סטטי עם מתווך + ענן בלי ⇒ נשמר', () => {
    expect(resolveOrgConfig(st, { slug: 'acme', orgName: 'b', theme: 'or-rishon' }).edgeProxy).toStrictEqual({ host: 'edge.orbit-il.com' });
  });
  it('מסמך-ענן לא יכול להדליק (סטטי בלי ⇒ נמחק גם אם הענן הגדיר)', () => {
    const merged = resolveOrgConfig(plain, { slug: 'acme', orgName: 'b', theme: 'or-rishon', edgeProxy: { host: 'evil.orbit-il.com', allDevices: true } });
    expect(Object.prototype.hasOwnProperty.call(merged, 'edgeProxy')).toBe(false);
  });
  it('מסמך-ענן לא יכול להפנות למארח אחר / להפעיל לכולם', () => {
    const merged = resolveOrgConfig(st, { slug: 'acme', orgName: 'b', theme: 'or-rishon', edgeProxy: { host: 'other.orbit-il.com', allDevices: true } });
    expect(merged.edgeProxy).toStrictEqual({ host: 'edge.orbit-il.com' });
  });
});

describe('מי מנותב — activeEdge / edgeForThisDevice', () => {
  const EDGE = { host: 'edge.orbit-il.com' };

  it('בלי edgeProxy ⇒ null, בלי לגעת באחסון ובלי לקרוא את ה-URL (דורמנטי)', () => {
    const boom = () => {
      throw new Error('נגיעה אסורה');
    };
    vi.stubGlobal('location', new Proxy({}, { get: boom }));
    vi.stubGlobal('localStorage', new Proxy({}, { get: boom }));
    expect(edgeForThisDevice(cfg())).toBeNull();
    const s = memStore();
    expect(edgeForThisDevice(cfg(), { search: '?edge=on', storage: s })).toBeNull();
    expect(s.getItem).not.toHaveBeenCalled();
    expect(s.setItem).not.toHaveBeenCalled();
    expect(s.removeItem).not.toHaveBeenCalled();
  });

  it('הוספת השדה לבדה לא מזיזה אף מכשיר (בלי allDevices ובלי ‎?edge=on‎)', () => {
    expect(edgeForThisDevice(cfg(EDGE), { search: '', storage: memStore() })).toBeNull();
    expect(activeEdge(cfg(EDGE), null)).toBeNull();
  });

  it('‎?edge=on‎ ⇒ מנותב ונשמר; טעינה הבאה בלי הפרמטר — עדיין מנותב', () => {
    const s = memStore();
    expect(edgeForThisDevice(cfg(EDGE), { search: '?org=acme&edge=on', storage: s })).toStrictEqual(EDGE);
    expect(s.m.get(EDGE_DEVICE_KEY)).toBe('on');
    expect(edgeForThisDevice(cfg(EDGE), { search: '?org=acme', storage: s })).toStrictEqual(EDGE);
  });

  it('allDevices ⇒ כולם, חוץ ממכשיר שכיבה (‎?edge=off‎ גובר); ‎?edge=auto‎ מחזיר לברירת-הארגון', () => {
    const all = { ...EDGE, allDevices: true };
    const s = memStore();
    expect(edgeForThisDevice(cfg(all), { search: '', storage: s })).toStrictEqual(all);
    expect(edgeForThisDevice(cfg(all), { search: '?edge=off', storage: s })).toBeNull();
    expect(s.m.get(EDGE_DEVICE_KEY)).toBe('off');
    expect(edgeForThisDevice(cfg(all), { search: '', storage: s })).toBeNull();
    expect(edgeForThisDevice(cfg(all), { search: '?edge=auto', storage: s })).toStrictEqual(all);
    expect(s.m.has(EDGE_DEVICE_KEY)).toBe(false);
  });

  it('ערכים לא-מוכרים נבלעים: פרמטר זר לא משנה; ערך-שמור זר = ברירת-מחדל', () => {
    const s = memStore({ [EDGE_DEVICE_KEY]: 'on' });
    expect(edgeForThisDevice(cfg(EDGE), { search: '?edge=maybe', storage: s })).toStrictEqual(EDGE);
    expect(edgeForThisDevice(cfg(EDGE), { search: '', storage: memStore({ [EDGE_DEVICE_KEY]: 'yes' }) })).toBeNull();
    expect(edgeSwitchFromSearch('?edge=ON')).toBe('on');
    expect(edgeSwitchFromSearch('?edge=1')).toBe('on');
    expect(edgeSwitchFromSearch('?edge=false')).toBe('off');
    expect(edgeSwitchFromSearch('?edge=default')).toBe('auto');
    expect(edgeSwitchFromSearch('?x=1')).toBeNull();
  });

  it('אחסון חסום (מצב-פרטי) ⇒ הקישור עדיין קובע לטעינה הזו, בלי לזרוק', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(edgeForThisDevice(cfg(EDGE), { search: '?edge=on', storage: blocked })).toStrictEqual(EDGE);
    expect(edgeForThisDevice(cfg(EDGE), { search: '', storage: blocked })).toBeNull();
    expect(edgeForThisDevice(cfg(EDGE), { search: '?edge=on', storage: null })).toStrictEqual(EDGE);
  });

  it('הגנת-עומק: קונפיג שלא עבר normalizeConfig עם מארח זר ⇒ לא מנותב גם ב-on', () => {
    expect(activeEdge(cfg({ host: 'evil.com', allDevices: true }), 'on')).toBeNull();
    expect(activeEdge(cfg({ host: 'http://edge.orbit-il.com' }), 'on')).toBeNull();
  });
});

describe('הגדרות-ההפניה ל-SDK', () => {
  it('Auth: https://<edge> (בלי נתיב — ה-SDK מוסיף את מארח-גוגל) · Firestore: host+ssl, long-polling רק בכפייה', () => {
    expect(edgeAuthUrl({ host: 'edge.orbit-il.com' })).toBe('https://edge.orbit-il.com');
    expect(edgeFirestoreSettings({ host: 'edge.orbit-il.com' })).toStrictEqual({ host: 'edge.orbit-il.com', ssl: true });
    expect(edgeFirestoreSettings({ host: 'edge.orbit-il.com', forceLongPolling: true })).toStrictEqual({
      host: 'edge.orbit-il.com',
      ssl: true,
      experimentalForceLongPolling: true,
    });
  });

  it('viaEdge: זהות בלי מתווך; רק https://*.cloudfunctions.net נכתב-מחדש', () => {
    const fn = 'https://us-central1-maor-system.cloudfunctions.net/nedarimPull?org=root&full=1';
    for (const none of [null, undefined, '']) expect(viaEdge(fn, none)).toBe(fn);
    expect(viaEdge(fn, 'edge.orbit-il.com')).toBe('https://edge.orbit-il.com/us-central1-maor-system.cloudfunctions.net/nedarimPull?org=root&full=1');
    for (const other of [
      'https://example.com/hook?x=1',
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
      'http://us-central1-maor-system.cloudfunctions.net/nedarimPull',
      'https://us-central1-maor-system.cloudfunctions.net:8443/nedarimPull',
      'https://u:p@us-central1-maor-system.cloudfunctions.net/nedarimPull',
      'https://cloudfunctions.net.evil.com/x',
      'https://evil.com/?h=.cloudfunctions.net',
      'not a url',
    ]) {
      expect(viaEdge(other, 'edge.orbit-il.com'), other).toBe(other);
    }
  });
});

describe('🩺 netCheckTargets — במכשיר מנותב בודקים את המתווך', () => {
  const shape = (ts: ReturnType<typeof netCheckTargets>) => ts.map((t) => [t.key, t.domain, t.method ?? 'GET']);

  it('בלי edgeHost ⇒ בדיוק היעדים של היום', () => {
    expect(shape(netCheckTargets('https://orbit-il.com', FB, null))).toStrictEqual(shape(netCheckTargets('https://orbit-il.com', FB)));
    expect(shape(netCheckTargets('https://orbit-il.com', FB, undefined)).map(([k]) => k)).toStrictEqual(['site', 'auth', 'token', 'db']);
  });

  it('עם edgeHost ⇒ האתר + המתווך בלבד (לא googleapis), והבקשה לחברת-הסינון מבקשת את המתווך', () => {
    const t = netCheckTargets('https://orbit-il.com', FB, 'edge.orbit-il.com');
    expect(shape(t)).toStrictEqual([
      ['site', 'orbit-il.com', 'GET'],
      ['edge', 'edge.orbit-il.com', 'POST'],
    ]);
    expect(t[1].url).toMatch(/^https:\/\/edge\.orbit-il\.com\/securetoken\.googleapis\.com\/v1\/token\?key=AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo&netcheck=/);
    const script = netCheckScript(t.map((x) => ({ ...x, ok: x.key !== 'edge', ms: 1 })));
    expect(script).toContain('edge.orbit-il.com');
    expect(script).not.toContain('googleapis');
  });

  it('ארגון מקומי (בלי firebase) — גם עם edgeHost: רק האתר', () => {
    expect(shape(netCheckTargets('https://orbit-il.com', null, 'edge.orbit-il.com')).map(([k]) => k)).toStrictEqual(['site']);
  });
});

describe('חוצה-משטחים: מה שהלקוח מייצר — עובר ב-Worker האמיתי (edge-proxy/worker.js)', () => {
  async function worker(): Promise<{ fetch: (r: Request) => Promise<Response> }> {
    const path = resolve(__dirname, '../../../edge-proxy/worker.js');
    return ((await import(/* @vite-ignore */ path)) as { default: { fetch: (r: Request) => Promise<Response> } }).default;
  }
  const ORIGIN = 'https://orbit-il.com';

  it('Auth (צורת-האמולטור) · Firestore (host) · Functions (viaEdge) · 🩺 — כולם מועברים, ורק לגוגל', async () => {
    const w = await worker();
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const edge = normalizeEdgeProxy({ host: 'edge.orbit-il.com' }) as NonNullable<OrgConfig['edgeProxy']>;
    const authBase = edgeAuthUrl(edge) + '/'; // emulator.url = `${protocol}//${host}/`
    const fs = 'https://' + edgeFirestoreSettings(edge).host;
    const urls = [
      authBase + 'identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB.apiKey,
      authBase + 'identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FB.apiKey,
      authBase + 'securetoken.googleapis.com/v1/token?key=' + FB.apiKey,
      fs + '/google.firestore.v1.Firestore/Listen/channel?database=' + encodeURIComponent('projects/' + FB.projectId + '/databases/(default)') + '&VER=8',
      fs + '/v1/projects/' + FB.projectId + '/databases/(default)/documents:commit?key=' + FB.apiKey,
      viaEdge('https://us-central1-maor-system.cloudfunctions.net/gcontactsSyncNow?org=root', edge.host),
      netCheckTargets(ORIGIN, FB, edge.host)[1].url,
    ];
    for (const u of urls) {
      const res = await w.fetch(new Request(u, { method: 'POST', headers: { Origin: ORIGIN }, body: '{}' }));
      expect(res.status, u).toBe(200);
      expect(res.headers.get('access-control-allow-origin'), u).toBe(ORIGIN);
    }
    for (const [target] of fetchMock.mock.calls as unknown as Array<[string]>) {
      expect(new URL(target).hostname).toMatch(/\.googleapis\.com$|^us-central1-maor-system\.cloudfunctions\.net$/);
    }
  });

  it('האתר שמארח את המתווך (לכל סיומת ב-allowlist) הוא Origin מותר ב-Worker', async () => {
    const w = await worker();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    for (const suffix of EDGE_HOST_SUFFIXES) {
      const site = 'https://' + suffix.slice(1);
      const res = await w.fetch(new Request('https://edge' + suffix + '/securetoken.googleapis.com/v1/token?key=' + FB.apiKey, { method: 'POST', headers: { Origin: site }, body: 'x' }));
      expect(res.status, site).toBe(200);
    }
  });
});

describe('הגנות-מקור — החיווט', () => {
  const useApp = read('../../store/useApp.ts');
  const cloud = read('../cloud.ts');
  const modal = read('../../components/cloud/NetCheckModal.tsx');
  const config = read('../config.ts');
  const core = read('../edgeProxy.ts');

  it('connectCloud מעביר את המתווך-למכשיר ל-initCloud (null בלי השדה)', () => {
    expect(useApp).toContain('mod.initCloud(fb, edgeForThisDevice(cfg));');
    expect(useApp).not.toMatch(/mod\.initCloud\(fb\);/);
  });

  it('initCloud: הענף-הישיר נשאר getAuth/getFirestore; ההפניה רק בענף-המתווך; אין אמולטור אחר', () => {
    expect(cloud).toMatch(/\} else \{\s*auth = getAuth\(app\);\s*\}/);
    expect(cloud).toContain('fsDb = edgeFs ? edgeFirestoreFallback(app, edgeFs) : getFirestore(app);');
    expect(cloud).toContain('connectAuthEmulator(auth, edgeAuthUrl(edge), { disableWarnings: true });');
    expect(cloud.match(/^\s*connectAuthEmulator\(/gm)).toHaveLength(1); // קריאה אחת (לא סופרים הערות)
    expect(cloud).not.toMatch(/connectFirestoreEmulator|connectFunctionsEmulator|connectStorageEmulator/);
    // ענף-המתווך: אותה התמדה כמו getAuth, בלי ה-resolver (אפס gapi/iframe בקו מסונן)
    expect(cloud).toContain('auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] });');
    expect(cloud).not.toMatch(/browserPopupRedirectResolver/);
  });

  it('שלוש קריאות-הפונקציות עוברות viaEdge; אין fetch גולמי לכתובת-פונקציה', () => {
    expect(cloud.match(/fetch\(viaEdge\(u\.toString\(\), edgeHost\),/g)).toHaveLength(3);
    expect(cloud).not.toMatch(/fetch\(u\.toString\(\)/);
  });

  it('🩺 בודק את המתווך במכשיר מנותב', () => {
    expect(modal).toContain('netCheckTargets(window.location.origin, config.firebase, edgeForThisDevice(config)?.host)');
  });

  it('resolveOrgConfig: מתווך רק מהסטטי', () => {
    expect(config).toMatch(/if \(staticCfg\.edgeProxy\) merged\.edgeProxy = staticCfg\.edgeProxy;\s*else delete merged\.edgeProxy;/);
    expect(config).toMatch(/const edge = normalizeEdgeProxy\(c\.edgeProxy\);\s*if \(edge\) cfg\.edgeProxy = edge;\s*else delete cfg\.edgeProxy;/);
  });

  it('lib/edgeProxy.ts טהור — בלי firebase ובלי store', () => {
    expect(core).not.toMatch(/from 'firebase|from '\.\.\/store/);
  });
});
