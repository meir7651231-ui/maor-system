// נגישות (ת״י 5568 / WCAG 2.1 AA — חובה חוקית בישראל) לכל דפי השיווק של גבי.
// axe-core מקומי (npm, בלי שירות חיצוני) בתוך Playwright. נכשל על כל הפרה serious/critical.
// דרישה: npm run build (לדף /app/). הרצה: node e2e/a11y.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const MK = new URL('../../marketing/', import.meta.url).pathname;
const pages = [
  ['דף נחיתה סטטי', 'file://' + MK + 'landing/index.html'],
  ...['barbers', 'garages', 'clinics', 'accountants-clients'].map(s => [`דף ענף ${s}`, `file://${MK}landing/for/${s}.html`]),
  ['ספריית נוסחים', 'file://' + MK + 'library/index.html'],
  ['דף נחיתה מעוצב /app/', 'http://localhost:4339/'],
];
const srv = spawn('npx', ['vite', 'preview', '--port', '4339', '--strictPort'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch();
const failures = [];
try {
  for (const [name, url] of pages) {
    for (const [vp, opts] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
      const ctx = await b.newContext(opts); const p = await ctx.newPage();
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
} finally { await b.close(); srv.kill(); }
if (failures.length) { console.error('✗ נגישות: ' + failures.length + ' הפרות serious/critical\n' + failures.join('\n')); process.exit(1); }
console.log(`✓ נגישות: ${pages.length} דפים × דסקטופ+מובייל · 0 הפרות serious/critical (WCAG 2.1 AA)`);
