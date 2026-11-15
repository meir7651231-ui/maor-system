// נגישות (ת״י 5568 / WCAG 2.1 AA — חובה חוקית בישראל) לכל דפי השיווק של גבי.
// axe-core מקומי (npm, בלי שירות חיצוני) בתוך Playwright. נכשל על כל הפרה serious/critical.
// דרישה: npm run build (לדף /app/). הרצה: node e2e/a11y.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvLogLevel, srvStdio, waitHealthy } from './lib.mjs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const MK = new URL('../../marketing/', import.meta.url).pathname;
const pages = [
  ['דף נחיתה סטטי', 'file://' + MK + 'landing/index.html'],
  ...['barbers', 'garages', 'clinics', 'accountants-clients'].map(s => [`דף ענף ${s}`, `file://${MK}landing/for/${s}.html`]),
  ['ספריית נוסחים', 'file://' + MK + 'library/index.html'],
  ['הצהרת נגישות', 'file://' + MK + 'accessibility.html'],
  ['הצהרת נגישות (מוגשת מ-/app/)', 'http://localhost:4339/accessibility.html'],
  ['דף נחיתה מעוצב /app/', 'http://localhost:4339/'],
];
const srv = spawn('npx', ['vite', 'preview', '--port', '4339', '--strictPort'], { stdio: 'ignore' });
// עמודי הלקוח של העסק (/p, /pay, /u) מוגשים מהשרת ⇒ שרת DEMO=1 (dry-run, נתונים בדויים), כמו live.mjs
const TOKEN = randomBytes(32).toString('base64url'), API = 'http://127.0.0.1:8152';
// critic סבב 81: כמו שאר הסוויטות — פלט השרת נשמר בכישלון (srvStdio), והמתנה שמזהה שרת שמת (waitHealthy)
await assertPortFree(8152);
const api = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', '8152', '--log-level', srvLogLevel()],
  { cwd: new URL('../..', import.meta.url).pathname, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-a11y') });
await waitHealthy(API, api);
const health = await (await fetch(API + '/health')).json();
if (health.dry_run !== true) { api.kill(); srv.kill(); throw new Error('השרת לא ב-dry-run — עוצרים'); }
const outbox = (await (await fetch(API + '/outbox', { headers: { Authorization: `Bearer ${TOKEN}` } })).json()).messages;
const code = outbox.find(m => m.channel === 'sms' && m.body.includes('/p/')).body.split('/p/')[1].split(/\s/)[0];
const unsub = outbox.map(m => (m.body.match(/\/u\/([A-Za-z0-9_-]+)/) || [])[1]).find(Boolean);
pages.push(['עמוד הקישור הקצר /p (לקוח)', `${API}/p/${code}`], ['עמוד החייב /pay (לקוח)', `${API}/pay/${code}`],
  ['עמוד הסרה /u (לקוח)', `${API}/u/${unsub}`]);
const b = await chromium.launch();
const failures = [];
try {
  for (const [name, url] of pages) {
    for (const [vp, opts] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
      // CSP קשוח בעמודי השרת חוסם הזרקת axe ⇒ עקיפה בבדיקה בלבד (המוצר לא משתנה)
      const ctx = await b.newContext({ ...opts, bypassCSP: true }); const p = await ctx.newPage();
      await p.goto(url); await p.waitForTimeout(400);
      await p.addScriptTag({ content: AXE });
      const res = await p.evaluate(async () => await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }));
      for (const v of res.violations.filter(v => ['serious', 'critical'].includes(v.impact))) {
        failures.push(`${name} [${vp}] ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`);
      }
      await ctx.close();
    }
  }
} finally { await b.close(); srv.kill(); api.kill(); }
if (failures.length) { console.error('✗ נגישות: ' + failures.length + ' הפרות serious/critical\n' + failures.join('\n')); process.exit(1); }
console.log(`✓ נגישות: ${pages.length} דפים × דסקטופ+מובייל · 0 הפרות serious/critical (WCAG 2.1 AA)`);
