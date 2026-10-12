/**
 * 🌉 מצב-מסונן — בדיקת-עשן עם ה-SDK **האמיתי** (12.10.2026). הבדיקות-היחידה מדמות את
 * ה-SDK; כאן ה-bundle הבנוי רץ בדפדפן (UA של אייפון — כדי לתפוס גם את הטעינה-היזומה של
 * gapi במובייל), וכל תעבורה חיצונית **מיורטת**: כניסה מקבלת תשובה מזויפת, כל השאר נחסם —
 * שום בקשה לא יוצאת לגוגל ולא לפרויקט האמיתי.
 *
 * מה נבדק (BUILD-ORDER-FILTERED-2026-10-12):
 *  • ישיר (בלי edgeProxy) — בדיוק כמו היום: identitytoolkit/firestore ישירות, אפס מתווך.
 *  • רדום (edgeProxy בלי ‎?edge=on‎ ובלי allDevices) — אותם מארחים בדיוק כמו ישיר.
 *  • ‎?edge=on‎ — Auth ו-Firestore דרך edge.orbit-il.com בלבד; אפס googleapis/apis.google.com/
 *    firebaseapp.com (החריג המתועד: פינג-האבחון cleardot.gif של WebChannel אחרי שגיאת-רשת);
 *    בלי באנר-אמולטור; ‎maor_edge=on‎ נשמר; וכל בקשה שה-SDK שלח למתווך — עוברת ב-Worker.
 *  • allDevices — מנותב בלי קישור; ‎?edge=off‎ — חוזר לישיר.
 * הרצה: ‎npm run build && node e2e/edge-mode-smoke.mjs‎ (פורט אקראי — לא מתנגש בסוויטות אחרות).
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const EDGE_HOST = 'edge.orbit-il.com';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' }[extname(p)] ?? 'application/octet-stream';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch {
    res.statusCode = 404;
    res.end('nf');
  }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/`;

let fails = 0;
const t = (name, ok, extra = '') => {
  if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${name}${!ok && extra ? ' — ' + extra : ''}`);
};

// קונפיג-הענן האמיתי (ציבורי) — אבל אף בקשה לא יוצאת: הכול מיורט למטה.
const FB = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')).firebase;
const EMAIL = 'edge-smoke@example.com';
const now = Math.floor(Date.now() / 1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const JWT =
  b64({ alg: 'none', typ: 'JWT' }) + '.' +
  b64({ iss: 'https://securetoken.google.com/' + FB.projectId, aud: FB.projectId, auth_time: now, user_id: 'uid-edge', sub: 'uid-edge', iat: now, exp: now + 3600, email: EMAIL, email_verified: true, firebase: { identities: { email: [EMAIL] }, sign_in_provider: 'password' } }) +
  '.sig';
const SIGNIN = { kind: 'identitytoolkit#VerifyPasswordResponse', localId: 'uid-edge', email: EMAIL, displayName: '', idToken: JWT, registered: true, refreshToken: 'rt-edge', expiresIn: '3600' };
const LOOKUP = { kind: 'identitytoolkit#GetAccountInfoResponse', users: [{ localId: 'uid-edge', email: EMAIL, emailVerified: true, passwordHash: 'x', providerUserInfo: [{ providerId: 'password', federatedId: EMAIL, email: EMAIL, rawId: EMAIL }], passwordUpdatedAt: 1, validSince: '1', lastLoginAt: '1', createdAt: '1' }] };
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const cfg = (edgeProxy) => ({ slug: 'default', orgName: 'Edge Smoke', theme: 'or-rishon', modules: {}, features: {}, firebase: FB, cloudRoot: true, adminEmails: [EMAIL], ...(edgeProxy ? { edgeProxy } : {}) });

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

/** טעינה + כניסה (תשובות מזויפות) ⇒ כל הבקשות החיצוניות שנצפו. */
async function session(config, query) {
  const ctx = await browser.newContext({ userAgent: IPHONE, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const seen = [];
  const cors = { 'access-control-allow-origin': BASE.slice(0, -1), 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST' };
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(BASE)) return route.continue();
    seen.push({ method: req.method(), url, body: req.postData() ?? undefined });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const json = (o) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(o) });
    if (/accounts:signInWithPassword/.test(url)) return json(SIGNIN);
    if (/accounts:lookup/.test(url)) return json(LOOKUP);
    return route.abort();
  });
  const page = await ctx.newPage();
  const consoleLines = [];
  const errors = [];
  page.on('console', (m) => consoleLines.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), config);
  await page.goto(BASE + query, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.locator('button.orbit-tab', { hasText: 'כניסה' }).click();
  await page.locator('form input[type=email]').fill(EMAIL);
  await page.locator('.orbit-pass-wrap input').fill('edge-smoke-not-a-password');
  await page.locator('form button.orbit-primary[type=submit]').click();
  await page.waitForTimeout(6000);
  const banner = await page.locator('.firebase-emulator-warning').count();
  const flag = await page.evaluate(() => localStorage.getItem('maor_edge'));
  await ctx.close();
  const hosts = new Set(seen.map((s) => new URL(s.url).hostname));
  return { seen, hosts, banner, flag, consoleLines, errors };
}

const isGoogle = (h) => /(^|\.)(googleapis\.com|google\.com|gstatic\.com|firebaseapp\.com)$/.test(h);
const CLEARDOT = /^https:\/\/www\.google\.com\/images\/cleardot\.gif/;
const sameHosts = (a, b) => a.size === b.size && [...a].every((h) => b.has(h));

console.log('\n📦 ישיר — בלי edgeProxy (היום)');
const direct = await session(cfg(null), '');
t('כניסה ישירות ל-identitytoolkit.googleapis.com', direct.seen.some((s) => s.url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB.apiKey)));
t('Firestore ישירות ל-firestore.googleapis.com', direct.hosts.has('firestore.googleapis.com'));
t('אפס בקשות למתווך', !direct.hosts.has(EDGE_HOST));
t('אפס שגיאות JS', direct.errors.length === 0, direct.errors.slice(0, 2).join(' | '));

console.log('\n📦 רדום — edgeProxy בלי ‎?edge=on‎ ובלי allDevices');
const dormant = await session(cfg({ host: EDGE_HOST }), '');
t('אותם מארחים בדיוק כמו ישיר', sameHosts(dormant.hosts, direct.hosts), [...dormant.hosts].join(','));
t('מתג-המכשיר לא נכתב', dormant.flag === null, String(dormant.flag));

console.log('\n📦 ‎?edge=on‎ — דרך המתווך');
const edge = await session(cfg({ host: EDGE_HOST }), '?edge=on');
const viaEdge = edge.seen.filter((s) => new URL(s.url).hostname === EDGE_HOST);
t('כניסה דרך המתווך (מארח-גוגל כמקטע-ראשון)', edge.seen.some((s) => s.url.startsWith(`https://${EDGE_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=` + FB.apiKey)));
t('טעינת-המשתמש (lookup) דרך המתווך', edge.seen.some((s) => s.url.startsWith(`https://${EDGE_HOST}/identitytoolkit.googleapis.com/v1/accounts:lookup?`)));
t('Firestore (WebChannel) דרך המתווך, עם database של הפרויקט', viaEdge.some((s) => /\/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel\?/.test(s.url) && new URL(s.url).searchParams.get('database') === `projects/${FB.projectId}/databases/(default)`));
const googleLeaks = edge.seen.filter((s) => isGoogle(new URL(s.url).hostname) && !CLEARDOT.test(s.url));
t('אפס בקשות ל-googleapis / apis.google.com / firebaseapp.com / gstatic', googleLeaks.length === 0, googleLeaks.slice(0, 3).map((s) => s.url).join(' | '));
console.log(`     (פינגי-אבחון cleardot.gif של WebChannel אחרי שגיאת-רשת: ${edge.seen.filter((s) => CLEARDOT.test(s.url)).length} — מתועד, לא-נחוץ)`);
t('בלי באנר-אמולטור ובלי אזהרת-אמולטור בקונסולה', edge.banner === 0 && !edge.consoleLines.some((l) => /emulator/i.test(l)));
t('‎maor_edge=on‎ נשמר במכשיר', edge.flag === 'on', String(edge.flag));
t('אפס שגיאות JS', edge.errors.length === 0, edge.errors.slice(0, 2).join(' | '));

// סגירת-המעגל: כל בקשה שה-SDK האמיתי שלח למתווך — עוברת ב-allowlist של ה-Worker.
const { default: worker } = await import('../edge-proxy/worker.js');
const realFetch = globalThis.fetch;
globalThis.fetch = async () => new Response('{}', { status: 200 });
const rejected = [];
for (const s of viaEdge) {
  const init = { method: s.method, headers: { Origin: 'https://orbit-il.com' } };
  if (s.method !== 'GET' && s.method !== 'HEAD') init.body = s.body ?? '';
  const res = await worker.fetch(new Request(s.url, init));
  if (res.status !== 200 && s.method !== 'OPTIONS') rejected.push(res.status + ' ' + s.method + ' ' + s.url);
}
globalThis.fetch = realFetch;
t(`כל ${viaEdge.length} הבקשות שה-SDK שלח למתווך — מותרות ב-Worker`, viaEdge.length > 0 && rejected.length === 0, rejected.slice(0, 3).join(' | '));

console.log('\n📦 allDevices — בלי קישור; ואז ‎?edge=off‎');
const all = await session(cfg({ host: EDGE_HOST, allDevices: true }), '');
t('allDevices ⇒ מנותב בלי קישור', all.hosts.has(EDGE_HOST) && ![...all.hosts].some((h) => h.endsWith('googleapis.com')));
const off = await session(cfg({ host: EDGE_HOST, allDevices: true }), '?edge=off');
t('‎?edge=off‎ ⇒ חוזר לישיר (כמו היום) ונשמר', sameHosts(off.hosts, direct.hosts) && off.flag === 'off', [...off.hosts].join(',') + ' flag=' + off.flag);

await browser.close();
server.close();
console.log(fails === 0 ? '\n🏆 מצב-מסונן: ה-SDK האמיתי מופנה רק כשצריך, ורק דרך המתווך' : `\n💥 ${fails} כשלים`);
process.exit(fails === 0 ? 0 : 1);
