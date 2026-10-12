/**
 * 🌉 מתווך-הקצה של אורביט — Cloudflare Worker (12.10.2026)
 *
 * מטרה: לקוחות על אינטרנט מסונן (נטפרי/רימון) — הסנן מאשר את הדומיין של האתר
 * אבל חוסם את נקודות-הקצה של גוגל (firestore/identitytoolkit/securetoken/
 * cloudfunctions). כאן הדפדפן מדבר רק עם `edge.orbit-il.com` (תת-דומיין של הדומיין
 * המאושר), והמתווך פונה לגוגל מאחורי-הקלעים. תכנון מלא:
 * knowledge/BUILD-ORDER-FILTERED-2026-10-12.md
 *
 * ⚠️ ALLOWLIST בלבד — לא open-proxy. מועבר אך-ורק מה שאורביט צריך, ורק לפרויקט
 * ה-Firebase שלו (מפתח/פרויקט/שמות-פונקציות קבועים למטה). כל השאר ⇒ 404 בלי לפנות
 * לגוגל. כך הדומיין לא הופך לטאנל-כללי ולא לכלי-עקיפת-סינון.
 *
 * מיפוי (מארח אחד — מרחבי-הנתיבים לא חופפים):
 *   /identitytoolkit.googleapis.com/…   ⇒ identitytoolkit.googleapis.com/…  (Auth: connectAuthEmulator
 *   /securetoken.googleapis.com/v1/token ⇒ securetoken.googleapis.com/v1/token  מכניס את מארח-גוגל
 *   /us-central1-<פרויקט>.cloudfunctions.net/<fn> ⇒ הפונקציה                    כמקטע-הנתיב הראשון)
 *   /google.firestore.v1.Firestore/{Listen,Write}/channel ⇒ firestore.googleapis.com  (Firestore: הגדרת
 *   /v1/projects/<פרויקט>/databases/(default)/documents…   ⇒ firestore.googleapis.com   host של ה-SDK)
 *
 * היגיינה: עוגיות/כותרות-Cloudflare/IP-הלקוח לא מועברים לגוגל; עוגיות/HSTS/alt-svc
 * של גוגל לא מוחזרים; CORS רק ל-Origins של אורביט; אין שום לוג, והגוף לעולם לא נקרא —
 * מוזרם כמות-שהוא (חשוב גם ל-long-polling של Firestore).
 *
 * פריסה (בעלים): edge-proxy/README.md — Worker חדש ← הדבקת קובץ זה ← Custom Domain
 * ‏edge.orbit-il.com. אפס נגיעה באתר החי: איש לא פונה למתווך עד שהקונפיג מפעיל אותו.
 */

// ── התאמה פר-פרויקט (נעולים מול public/**/config.json ב-worker.test.mjs) ─────────
const EDGE_VERSION = '2026-10-12.1';
const PROJECT_ID = 'maor-system';
/** מפתח(ות)-ה-Web הציבוריים של הפרויקט (כבר בקונפיג הציבורי — לא סוד). */
const API_KEYS = ['AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo'];
/** ה-Origins שמהם אורביט רץ — התאמה מדויקת (האתר החי + ה-mirror של deploy.yml). */
const ALLOWED_ORIGINS = ['https://orbit-il.com', 'https://meir7651231-ui.github.io'];
/** פונקציות-HTTP שהלקוח קורא בקליק (Bearer של המשתמש). */
const FUNCTIONS = ['nedarimPull', 'solaPull', 'gcontactsSyncNow'];
const FUNCTIONS_HOST = 'us-central1-' + PROJECT_ID + '.cloudfunctions.net';

// ── נגזרות (לא לערוך) ──────────────────────────────────────────────────────
const FIRESTORE_HOST = 'firestore.googleapis.com';
const IDT_HOST = 'identitytoolkit.googleapis.com';
const STS_HOST = 'securetoken.googleapis.com';
const DATABASE = 'projects/' + PROJECT_ID + '/databases/(default)';

/** Auth — בדיוק נקודות-הקצה של זרימת אימייל+סיסמה (אומת ב-@firebase/auth 1.13.3). */
const IDT_POST = new Set([
  '/v1/accounts:signInWithPassword',
  '/v1/accounts:signUp',
  '/v1/accounts:lookup',
  '/v1/accounts:sendOobCode',
  '/v1/accounts:update',
]);
const IDT_GET = new Set(['/v2/passwordPolicy']);

/** Firestore — זרמי-WebChannel ו-RPC-REST, רק של הפרויקט הזה. */
const FS_CHANNELS = new Set([
  '/google.firestore.v1.Firestore/Listen/channel',
  '/google.firestore.v1.Firestore/Write/channel',
]);
const FS_REST = new RegExp(
  '^/v1/projects/' +
    PROJECT_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '/databases/\\(default\\)/documents(?:/[^:]*)?:(?:commit|batchGet|runQuery|runAggregationQuery)$',
);

/** כותרות-בקשה שה-SDK שולח cross-origin (לתשובת-ה-preflight). */
const ALLOW_HEADERS = [
  'authorization',
  'content-type',
  'google-cloud-resource-prefix',
  'x-client-version',
  'x-firebase-appcheck',
  'x-firebase-client',
  'x-firebase-gmpid',
  'x-firebase-locale',
  'x-goog-api-client',
  'x-goog-api-key',
  'x-goog-request-params',
];
/** כותרות-תשובה ש-WebChannel קורא (getResponseHeader) — חייבות להיחשף. */
const WEBCHANNEL_EXPOSE = ['X-HTTP-Session-Id', 'X-HTTP-Initial-Response', 'X-Client-Wire-Protocol'];

/** לעולם לא מועבר לגוגל: עוגיות, Host, hop-by-hop, זהות-הלקוח (IP) ומידע-Cloudflare. */
const DROP_REQUEST = new Set([
  'cookie',
  'host',
  'connection',
  'keep-alive',
  'proxy-authorization',
  'proxy-authenticate',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'forwarded',
  'via',
  'x-real-ip',
  'true-client-ip',
  'cdn-loop',
]);
/** לעולם לא מוחזר ללקוח: עוגיות-גוגל, מדיניות-דומיין (HSTS/alt-svc/דיווחי-רשת) ו-CORS של גוגל. */
const DROP_RESPONSE = new Set([
  'set-cookie',
  'set-cookie2',
  'alt-svc',
  'report-to',
  'nel',
  'reporting-endpoints',
  'strict-transport-security',
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cors = corsFor(request.headers.get('Origin'));
    // Origin זר (אתר אחר בדפדפן) ⇒ חסימה לפני כל דבר אחר, בלי לפנות לגוגל.
    if (cors === null) return reply(403, 'forbidden origin', {});

    const preflight = request.method === 'OPTIONS';
    const method = preflight ? (request.headers.get('Access-Control-Request-Method') || '').toUpperCase() : request.method;
    const target = route(method, url);
    if (!target) return reply(404, 'not found', cors);
    if (preflight) {
      return new Response(null, {
        status: 204,
        headers: withCors(
          new Headers({
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': ALLOW_HEADERS.join(', '),
            'Access-Control-Max-Age': '7200',
            'X-Orbit-Edge': EDGE_VERSION,
            Vary: 'Origin',
          }),
          cors,
        ),
      });
    }

    let upstream;
    try {
      upstream = await fetch('https://' + target.host + target.path + url.search, {
        method,
        headers: forwardHeaders(request.headers),
        // הגוף מוזרם כמות-שהוא — המתווך לעולם לא קורא/שומר אותו.
        body: method === 'GET' ? undefined : request.body,
        // לא עוקבים אחרי הפניות: אחרת allowlist-המארחים היה נעקף.
        redirect: 'manual',
      });
    } catch {
      return reply(502, 'upstream unavailable', cors);
    }
    // התשובה מוזרמת (בלי אגירה) — חובה ל-WebChannel/long-polling.
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders(upstream.headers, cors),
    });
  },
};

/**
 * ה-allowlist: (שיטה, URL) ⇒ { host, path } של גוגל, או null (⇒ 404).
 * Firestore מגיע בנתיבים המקוריים (host של ה-SDK); Auth/Functions — מארח-גוגל
 * הוא המקטע הראשון (התאמה מדויקת, לא תחילית).
 */
function route(method, url) {
  const p = url.pathname;
  if (FS_CHANNELS.has(p)) {
    if (method !== 'GET' && method !== 'POST') return null;
    // כל בקשת-WebChannel נושאת database= (גם backchannel/terminate) — רק הפרויקט שלנו.
    const dbs = url.searchParams.getAll('database');
    if (!dbs.length || dbs.some((d) => d !== DATABASE)) return null;
    return { host: FIRESTORE_HOST, path: p };
  }
  if (FS_REST.test(p)) return method === 'POST' ? { host: FIRESTORE_HOST, path: p } : null;

  const slash = p.indexOf('/', 1);
  if (slash < 0) return null;
  const host = p.slice(1, slash);
  const rest = p.slice(slash);
  if (host === IDT_HOST) {
    const ok = (method === 'POST' && IDT_POST.has(rest)) || (method === 'GET' && IDT_GET.has(rest));
    return ok && keyOk(url) ? { host, path: rest } : null;
  }
  if (host === STS_HOST) {
    return method === 'POST' && rest === '/v1/token' && keyOk(url) ? { host, path: rest } : null;
  }
  if (host === FUNCTIONS_HOST) {
    return method === 'POST' && FUNCTIONS.includes(rest.slice(1)) ? { host, path: rest } : null;
  }
  return null;
}

/** בדיוק מפתח-API אחד, והוא של הפרויקט שלנו (Auth של פרויקט זר ⇒ 404). */
function keyOk(url) {
  const keys = url.searchParams.getAll('key');
  return keys.length === 1 && API_KEYS.includes(keys[0]);
}

/**
 * CORS: Origin מותר ⇒ הד + credentials (Firestore/WebChannel שולחים withCredentials);
 * אין Origin (curl, ביקון) ⇒ {} (בלי כותרות-CORS); Origin אחר ⇒ null (חסום).
 */
function corsFor(origin) {
  if (origin === null) return {};
  if (!ALLOWED_ORIGINS.includes(origin)) return null;
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' };
}

function withCors(headers, cors) {
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return headers;
}

function forwardHeaders(incoming) {
  const out = new Headers();
  for (const [k, v] of incoming) {
    const n = k.toLowerCase();
    if (DROP_REQUEST.has(n) || n.startsWith('cf-') || n.startsWith('x-forwarded-')) continue;
    out.set(n, v);
  }
  return out;
}

function responseHeaders(upstream, cors) {
  const out = new Headers();
  let expose = '';
  for (const [k, v] of upstream) {
    const n = k.toLowerCase();
    if (n === 'access-control-expose-headers') {
      expose = v;
      continue;
    }
    if (DROP_RESPONSE.has(n) || n.startsWith('access-control-')) continue;
    out.set(n, v);
  }
  out.set('Vary', mergeList(out.get('vary') || '', ['Origin']));
  out.set('X-Orbit-Edge', EDGE_VERSION);
  if (cors['Access-Control-Allow-Origin']) {
    withCors(out, cors);
    out.set('Access-Control-Expose-Headers', mergeList(expose, WEBCHANNEL_EXPOSE));
  }
  return out;
}

/** איחוד רשימת-כותרת (מופרדת בפסיקים) עם ערכים נוספים, בלי כפילויות (case-insensitive). */
function mergeList(current, extra) {
  const items = current.split(',').map((s) => s.trim()).filter(Boolean);
  for (const e of extra) if (!items.some((i) => i.toLowerCase() === e.toLowerCase())) items.push(e);
  return items.join(', ');
}

function reply(status, text, cors) {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Orbit-Edge': EDGE_VERSION,
    Vary: 'Origin',
  });
  return new Response(text, { status, headers: withCors(headers, cors) });
}
