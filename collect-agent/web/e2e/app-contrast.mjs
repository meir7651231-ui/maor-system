// גבי עיצוב: סריקת ניגודיות AA בדפדפן לכל מסכי /app/ (נחיתה, הרשמה, כניסה, ובמצב חי: בית, חשבוניות, תשובות, הגדרות),
// וגם /ui ועמודי הלקוח /p/ ו-/u/ (בהיר+כהה) — מול שרת DEMO=1, דסקטופ + מובייל 390px. הסורק: e2e/contrast-lib.mjs. יוצא ≠0 אם יש טקסט מתחת ל-AA.
// הרצה: node e2e/app-contrast.mjs
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const PORT = 8163, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-contrast') });
await waitHealthy(base, srv);
const b = await launchChromium(chromium); let bad = 0;
const ready = { dashboard: 'kpis', invoices: null, inbox: null, settings: 'settings-live' };
try {
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    // מחוץ לחשבון: נחיתה / הרשמה / כניסה
    const anon = await b.newContext({ viewport: { width: w, height: h } });
    // מחוברים (מצב חי)
    const live = await b.newContext({ viewport: { width: w, height: h } });
    await live.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const targets = [[anon, ''], [anon, '#/signup'], [anon, '#/login'],
      ...['dashboard', 'invoices', 'inbox', 'settings'].map(r => [live, `#/${r}`])];
    for (const [ctx, hash] of targets) {
      const p = await ctx.newPage();
      await p.goto(`${base}/app/${hash}`);
      const id = ready[hash.replace('#/', '')];
      if (id) await p.getByTestId(id).first().waitFor(); else await p.waitForLoadState('networkidle');
      await p.waitForTimeout(300);
      const { fails } = await scan(p);
      bad += fails.length;
      console.log(`${fails.length ? '✗' : '✓'} ${w}px /app/${hash || '(נחיתה)'}: ${fails.length} הפרות`);
      const seen = new Set();
      for (const x of fails) { const k = `${x.color}|${x.cls}`; if (seen.has(k)) continue; seen.add(k); console.log('   ', JSON.stringify(x)); }
      await p.close();
    }
    await anon.close(); await live.close();
  }
  // הדשבורד הפשוט (/ui) + עמודי הלקוח (/p/ תשלום, /u/ הסרה) — שרתיים, עם מצב כהה ⇒ בהיר וכהה
  const out = await (await fetch(base + '/outbox', { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  const all = out.messages.map(x => x.body + JSON.stringify(x.headers ?? {})).join('\n');
  const pCodes = [...new Set([...all.matchAll(/\/p\/([A-Za-z0-9_-]+)/g)].map(m => m[1]))].slice(0, 2);
  const uTok = [...new Set([...all.matchAll(/\/u\/([A-Za-z0-9_-]{16,64})/g)].map(m => m[1]))].slice(0, 1);
  if (!pCodes.length || !uTok.length) throw new Error(`אין קודי /p/ או /u/ ביומן הדמו: ${pCodes} ${uTok}`);
  for (const scheme of ['light', 'dark'])
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
      await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
      for (const path of ['/ui', ...pCodes.map(c => `/p/${c}`), ...uTok.map(t => `/u/${t}`)]) {
        const p = await ctx.newPage();
        await p.goto(base + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(300);
        const { fails } = await scan(p);
        bad += fails.length;
        console.log(`${fails.length ? '✗' : '✓'} ${scheme} ${w}px ${path.replace(/\/(p|u)\/.+/, '/$1/…')}: ${fails.length} הפרות`);
        const seen = new Set();
        for (const x of fails) { const k = `${x.color}|${x.cls}`; if (seen.has(k)) continue; seen.add(k); console.log('   ', JSON.stringify(x)); }
        await p.close();
      }
      await ctx.close();
    }
} finally { await b.close(); srv.kill(); }
process.exit(bad ? 1 : 0);
