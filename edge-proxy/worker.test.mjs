/**
 * ratchet — 🌉 מתווך-הקצה של אורביט (edge-proxy/worker.js, 12.10.2026).
 *
 * הבאג שהמתווך סוגר: לקוחות על קו מסונן (נטפרי/רימון) לא מגיעים לגוגל ⇒ אין כניסה
 * ואין סנכרון (CLOSED-ONBOARD-2026-08-05 "תבנית-שטח"). המתווך פותר — אבל מתווך
 * פתוח הוא כלי-עקיפת-סינון וטאנל לכל פרויקט Firebase בעולם. הבדיקות נועלות:
 * (1) allowlist מדויק לפרויקט שלנו, (2) 404 לכל השאר בלי לפנות לגוגל,
 * (3) היגיינת-כותרות (עוגיות/IP לא עוברים), (4) CORS-הד רק ל-Origins של אורביט,
 * (5) אפס לוגים ואפס קריאת-גוף, (6) סנכרון מול הקונפיגים הציבוריים.
 * ‏fetch מדומה — אפס רשת.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './worker.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = readFileSync(join(HERE, 'worker.js'), 'utf8');

const EDGE = 'https://edge.orbit-il.com';
const ORIGIN = 'https://orbit-il.com';
const KEY = 'AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo';
const DB = 'projects%2Fmaor-system%2Fdatabases%2F(default)';
const FS_DOCS = '/v1/projects/maor-system/databases/(default)/documents';
const FN_HOST = 'us-central1-maor-system.cloudfunctions.net';

/** תשובת-גוגל מדומה — נקבעת פר-בדיקה. */
let upstream;
let fetchMock;

beforeEach(() => {
  upstream = () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  fetchMock = vi.fn(async () => upstream());
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function req(path, { method = 'POST', origin = ORIGIN, headers = {}, body } = {}) {
  const h = { ...(origin === undefined || origin === null ? {} : { Origin: origin }), ...headers };
  const init = { method, headers: h };
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') init.body = body ?? '{}';
  return new Request(EDGE + path, init);
}

async function call(path, opts) {
  return worker.fetch(req(path, opts));
}

describe('allowlist — מה עובר, ולאן בדיוק', () => {
  const allowed = [
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:update?key=' + KEY],
    ['GET', '/identitytoolkit.googleapis.com/v2/passwordPolicy?key=' + KEY],
    ['POST', '/securetoken.googleapis.com/v1/token?key=' + KEY],
    ['GET', '/google.firestore.v1.Firestore/Listen/channel?database=' + DB + '&VER=8&RID=rpc&SID=abc&TYPE=xmlhttp'],
    ['POST', '/google.firestore.v1.Firestore/Listen/channel?database=' + DB + '&VER=8&RID=1&CVER=22'],
    ['POST', '/google.firestore.v1.Firestore/Write/channel?database=' + DB + '&VER=8&SID=abc&RID=2&TYPE=terminate'],
    ['POST', FS_DOCS + ':commit?key=' + KEY],
    ['POST', FS_DOCS + ':batchGet'],
    ['POST', FS_DOCS + ':runQuery'],
    ['POST', FS_DOCS + '/orgs/acme:runQuery'],
    ['POST', FS_DOCS + '/orgs/acme/donations:runAggregationQuery'],
    ['POST', '/' + FN_HOST + '/nedarimPull?org=root&full=1'],
    ['POST', '/' + FN_HOST + '/solaPull?org=root&vault=maor-hachesed'],
    ['POST', '/' + FN_HOST + '/gcontactsSyncNow?org=acme'],
  ];

  it.each(allowed)('%s %s ⇒ מועבר לגוגל', async (method, path) => {
    const res = await call(path, { method });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const u = new URL(url);
    if (path.startsWith('/google.firestore') || path.startsWith('/v1/projects')) {
      expect(u.host).toBe('firestore.googleapis.com');
      expect(u.pathname + u.search).toBe(new URL(EDGE + path).pathname + new URL(EDGE + path).search);
    } else {
      // מארח-גוגל = המקטע הראשון; מוסר מהנתיב, השאר עובר כמות-שהוא (כולל query)
      const host = path.slice(1, path.indexOf('/', 1));
      expect(u.host).toBe(host);
      expect('/' + u.host + u.pathname + u.search).toBe(path);
    }
    expect(u.protocol).toBe('https:');
    expect(init.method).toBe(method);
    expect(init.redirect).toBe('manual');
  });

  it('הגוף מוזרם כמות-שהוא (המתווך לא משנה ולא מפרש)', async () => {
    const body = 'email=a%40b.c&password=s3cret!&returnSecureToken=true';
    await call('/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY, { body });
    const [, init] = fetchMock.mock.calls[0];
    expect(await new Response(init.body).text()).toBe(body);
  });

  it('GET לא נושא גוף', async () => {
    await call('/google.firestore.v1.Firestore/Listen/channel?database=' + DB + '&TYPE=xmlhttp', { method: 'GET' });
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it('התשובה של גוגל מוחזרת (סטטוס + גוף), גם שגיאה', async () => {
    upstream = () => new Response('{"error":{"message":"INVALID_PASSWORD"}}', { status: 400, headers: { 'content-type': 'application/json' } });
    const res = await call('/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('INVALID_PASSWORD');
  });
});

describe('404 לכל השאר — ובלי לפנות לגוגל', () => {
  const blocked = [
    ['GET', '/'],
    ['GET', '/evil'],
    ['POST', '/www.googleapis.com/youtube/v3/search?key=' + KEY],
    ['POST', '/evil.com/steal'],
    ['GET', '/https://evil.com/'],
    // Auth: נקודת-קצה שלא בשימוש / שיטה שגויה / מפתח זר / בלי מפתח / מפתח כפול
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:delete?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/projects?key=' + KEY],
    ['GET', '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyFOREIGNPROJECTKEY000000000000000'],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'],
    ['POST', '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY + '&key=' + KEY],
    ['POST', '/securetoken.googleapis.com/v1/token'],
    ['POST', '/securetoken.googleapis.com/v1/other?key=' + KEY],
    ['GET', '/securetoken.googleapis.com/v1/token?key=' + KEY],
    // Firestore: פרויקט זר / בלי database / database זר / RPC לא-מוכר / שיטה שגויה / תחילית-מארח
    ['POST', '/v1/projects/other-project/databases/(default)/documents:commit'],
    ['POST', '/v1/projects/maor-system/databases/other/documents:commit'],
    ['POST', '/v1/projects/maor-system/databases/(default)/documents:listCollectionIds'],
    ['GET', FS_DOCS + ':runQuery'],
    ['POST', '/google.firestore.v1.Firestore/Listen/channel?VER=8'],
    ['POST', '/google.firestore.v1.Firestore/Listen/channel?database=projects%2Fevil%2Fdatabases%2F(default)'],
    ['POST', '/google.firestore.v1.Firestore/Listen/channel?database=' + DB + '&database=projects%2Fevil%2Fdatabases%2F(default)'],
    ['POST', '/google.firestore.v1.Firestore/Commit/channel?database=' + DB],
    ['PUT', '/google.firestore.v1.Firestore/Write/channel?database=' + DB],
    ['POST', '/firestore.googleapis.com' + FS_DOCS + ':commit'],
    // Functions: פונקציה שלא ברשימה / פרויקט זר / שיטה שגויה / תת-נתיב
    ['POST', '/' + FN_HOST + '/paymentsWebhook'],
    ['POST', '/' + FN_HOST + '/icsFeed'],
    ['POST', '/us-central1-evil.cloudfunctions.net/nedarimPull'],
    ['GET', '/' + FN_HOST + '/gcontactsSyncNow'],
    ['POST', '/' + FN_HOST + '/gcontactsSyncNow/extra'],
    // ניסיונות-עקיפה: traversal / סלאש-מקודד / סיומת-מתחזה / שיטות זרות
    ['POST', '/identitytoolkit.googleapis.com/../evil.com/x'],
    ['POST', '/identitytoolkit.googleapis.com%2F..%2Fevil.com/x?key=' + KEY],
    ['POST', '/identitytoolkit.googleapis.com.evil.com/v1/accounts:signUp?key=' + KEY],
    ['POST', '//evil.com/x'],
    ['DELETE', '/identitytoolkit.googleapis.com/v1/accounts:update?key=' + KEY],
    ['PATCH', FS_DOCS + ':commit'],
    ['HEAD', '/securetoken.googleapis.com/v1/token?key=' + KEY],
  ];

  it.each(blocked)('%s %s ⇒ 404', async (method, path) => {
    const res = await call(path, { method });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('CORS — הד רק ל-Origins של אורביט', () => {
  const path = '/securetoken.googleapis.com/v1/token?key=' + KEY;

  it('Origin מותר ⇒ הד מדויק + credentials + Vary (ה-* של גוגל מוחלף)', async () => {
    upstream = () =>
      new Response('{}', {
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'false', vary: 'X-Origin, Referer' },
      });
    for (const origin of ['https://orbit-il.com', 'https://meir7651231-ui.github.io']) {
      const res = await call(path, { origin });
      expect(res.headers.get('access-control-allow-origin')).toBe(origin);
      expect(res.headers.get('access-control-allow-credentials')).toBe('true');
      expect(res.headers.get('vary')).toBe('X-Origin, Referer, Origin');
    }
  });

  it('כותרות-WebChannel נחשפות (ומה שגוגל חשף נשמר)', async () => {
    upstream = () => new Response('', { status: 200, headers: { 'access-control-expose-headers': 'X-Goog-Meta, x-http-session-id' } });
    const res = await call('/google.firestore.v1.Firestore/Listen/channel?database=' + DB, { method: 'POST' });
    const exposed = (res.headers.get('access-control-expose-headers') || '').split(',').map((s) => s.trim().toLowerCase());
    for (const h of ['x-goog-meta', 'x-http-session-id', 'x-http-initial-response', 'x-client-wire-protocol']) expect(exposed).toContain(h);
    expect(exposed.filter((h) => h === 'x-http-session-id')).toHaveLength(1);
  });

  it('preflight לנתיב מותר ⇒ 204 מקומי (לא נוגע בגוגל) עם השיטות והכותרות של ה-SDK', async () => {
    const res = await call(FS_DOCS + ':commit', {
      method: 'OPTIONS',
      headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,x-goog-api-client' },
    });
    expect(res.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST');
    const allowHeaders = (res.headers.get('access-control-allow-headers') || '').split(',').map((s) => s.trim());
    for (const h of ['authorization', 'content-type', 'x-goog-api-client', 'x-firebase-gmpid', 'x-firebase-locale', 'x-firebase-client', 'x-client-version', 'google-cloud-resource-prefix', 'x-goog-request-params']) {
      expect(allowHeaders).toContain(h);
    }
    expect(allowHeaders).not.toContain('cookie');
  });

  it('preflight לנתיב/שיטה לא-מותרים ⇒ 404', async () => {
    expect((await call('/evil', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } })).status).toBe(404);
    expect((await call(FS_DOCS + ':commit', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'PUT' } })).status).toBe(404);
    expect((await call(FS_DOCS + ':commit', { method: 'OPTIONS' })).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const foreign = ['https://evil.com', 'http://orbit-il.com', 'https://orbit-il.com.evil.com', 'https://evil-orbit-il.com', 'https://www.orbit-il.com:444', 'null', 'https://edge.orbit-il.com'];
  it.each(foreign)('Origin זר %s ⇒ 403 בלי CORS ובלי לפנות לגוגל (גם preflight)', async (origin) => {
    for (const method of ['POST', 'OPTIONS']) {
      const res = await call(path, { method, origin, headers: method === 'OPTIONS' ? { 'Access-Control-Request-Method': 'POST' } : {} });
      expect(res.status).toBe(403);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('בלי Origin (curl/ביקון) ⇒ מועבר, בלי כותרות-CORS', async () => {
    const res = await call(path, { origin: null });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    expect(res.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('404/502 ל-Origin מותר נושאים CORS (ה-SDK יכול לקרוא את השגיאה)', async () => {
    const r404 = await call('/evil');
    expect(r404.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError('network down');
    });
    const r502 = await call(path);
    expect(r502.status).toBe(502);
    expect(r502.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(await r502.text()).not.toContain('network down');
  });
});

describe('היגיינת-כותרות', () => {
  it('לגוגל: בלי עוגיות, Host, IP-הלקוח או כותרות-Cloudflare; כותרות-ה-SDK עוברות', async () => {
    await call(FS_DOCS + ':commit', {
      headers: {
        Cookie: '__cf_bm=abc; session=secret',
        Host: 'edge.orbit-il.com',
        'CF-Connecting-IP': '203.0.113.7',
        'CF-Ray': '8a1b',
        'CF-IPCountry': 'IL',
        'X-Forwarded-For': '203.0.113.7',
        'X-Forwarded-Proto': 'https',
        'X-Real-IP': '203.0.113.7',
        'True-Client-IP': '203.0.113.7',
        Forwarded: 'for=203.0.113.7',
        Via: '1.1 netfree',
        'CDN-Loop': 'cloudflare',
        Connection: 'keep-alive',
        Authorization: 'Bearer id-token',
        'Content-Type': 'text/plain',
        'X-Goog-Api-Client': 'gl-js/ fire/12.16.0',
        'X-Firebase-GMPID': '1:437845665303:web:955fa5636e5b408ae7de52',
        'google-cloud-resource-prefix': 'projects/maor-system/databases/(default)',
        Referer: 'https://orbit-il.com/',
      },
    });
    const sent = fetchMock.mock.calls[0][1].headers;
    for (const h of ['cookie', 'host', 'cf-connecting-ip', 'cf-ray', 'cf-ipcountry', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip', 'true-client-ip', 'forwarded', 'via', 'cdn-loop', 'connection']) {
      expect(sent.has(h), h).toBe(false);
    }
    expect(sent.get('authorization')).toBe('Bearer id-token');
    expect(sent.get('content-type')).toBe('text/plain');
    expect(sent.get('x-goog-api-client')).toBe('gl-js/ fire/12.16.0');
    expect(sent.get('x-firebase-gmpid')).toBe('1:437845665303:web:955fa5636e5b408ae7de52');
    expect(sent.get('google-cloud-resource-prefix')).toBe('projects/maor-system/databases/(default)');
    // הגבלת-Referrer של מפתח-ה-API נבדקת אצל גוגל ⇒ Origin/Referer עוברים
    expect(sent.get('origin')).toBe(ORIGIN);
    expect(sent.get('referer')).toBe('https://orbit-il.com/');
  });

  it('ללקוח: בלי עוגיות/HSTS/alt-svc/דיווחי-רשת של גוגל; תוכן וכותרות-WebChannel נשמרים', async () => {
    upstream = () => {
      const h = new Headers({
        'content-type': 'application/json; charset=UTF-8',
        'x-http-session-id': 'gs1',
        'strict-transport-security': 'max-age=31536000',
        'alt-svc': 'h3=":443"',
        'report-to': '{"group":"g"}',
        nel: '{"report_to":"g"}',
        'reporting-endpoints': 'default="https://csp.withgoogle.com"',
      });
      h.append('set-cookie', 'NID=123; Domain=.googleapis.com');
      h.append('set-cookie', 'other=1');
      return new Response('{"a":1}', { status: 200, headers: h });
    };
    const res = await call('/google.firestore.v1.Firestore/Write/channel?database=' + DB);
    for (const h of ['set-cookie', 'strict-transport-security', 'alt-svc', 'report-to', 'nel', 'reporting-endpoints']) {
      expect(res.headers.has(h), h).toBe(false);
    }
    expect(res.headers.get('content-type')).toBe('application/json; charset=UTF-8');
    expect(res.headers.get('x-http-session-id')).toBe('gs1');
    expect(res.headers.get('x-orbit-edge')).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(await res.text()).toBe('{"a":1}');
  });
});

describe('אפס לוגים, אפס קריאת-גוף', () => {
  it('שום console.* בכל המסלולים (הצלחה · 404 · 403 · preflight · 502)', async () => {
    const spies = ['log', 'info', 'warn', 'error', 'debug', 'trace'].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    await call('/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY, { body: '{"password":"s3cret"}' });
    await call('/evil');
    await call('/evil', { origin: 'https://evil.com' });
    await call(FS_DOCS + ':commit', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } });
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    await call('/securetoken.googleapis.com/v1/token?key=' + KEY, { body: 'grant_type=refresh_token&refresh_token=rt-secret' });
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });

  it('הגנת-מקור: אין console, ואין קריאה/שכפול של גוף-הבקשה', () => {
    expect(SRC).not.toMatch(/console\./);
    expect(SRC).not.toMatch(/request\.(text|json|arrayBuffer|formData|blob|clone)\(/);
    expect(SRC).toContain("redirect: 'manual'");
  });
});

describe('סנכרון מול הקונפיגים הציבוריים (מפתח/פרויקט/פונקציות)', () => {
  function publicConfigs() {
    const out = [];
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name === 'config.json') out.push([p.slice(ROOT.length + 1), JSON.parse(readFileSync(p, 'utf8'))]);
      }
    };
    walk(join(ROOT, 'public'));
    return out.filter(([, c]) => c.firebase);
  }

  it('יש קונפיגים-עם-ענן לבדוק (השורש + הלקוח-החי)', () => {
    expect(publicConfigs().map(([p]) => p)).toEqual(expect.arrayContaining(['public/config.json', 'public/c/maor-hachesed/config.json']));
  });

  it.each(publicConfigs())('%s — מפתח-ה-API והפרויקט מותרים במתווך', async (_p, cfg) => {
    const fb = cfg.firebase;
    expect((await call('/securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(fb.apiKey))).status).toBe(200);
    const db = encodeURIComponent('projects/' + fb.projectId + '/databases/(default)');
    expect((await call('/google.firestore.v1.Firestore/Listen/channel?database=' + db)).status).toBe(200);
    expect((await call('/v1/projects/' + fb.projectId + '/databases/(default)/documents:commit')).status).toBe(200);
  });

  it('כל כתובת-פונקציה שקבועה בקוד הלקוח מותרת במתווך (+ nedarimPull מהקונפיג)', async () => {
    const files = ['src/components/settings/GContactsSection.tsx', 'src/components/builder/BuilderWizard.tsx'];
    const names = new Set(['nedarimPull']);
    for (const f of files) {
      for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/https:\/\/us-central1-maor-system\.cloudfunctions\.net\/([A-Za-z0-9_]+)/g)) names.add(m[1]);
    }
    expect([...names]).toEqual(expect.arrayContaining(['gcontactsSyncNow', 'solaPull', 'nedarimPull']));
    for (const n of names) expect((await call('/' + FN_HOST + '/' + n)).status, n).toBe(200);
  });
});
