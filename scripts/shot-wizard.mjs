import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const DIST = new URL('../dist/', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    let f = normalize(join(DIST, p));
    if (!f.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (!existsSync(f)) f = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }).end(await readFile(f));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

// קונפיג בלי firebase (ענן כבוי ⇒ אין מסך התחברות; canBuilder=isAdmin) + בלוק site
const CONFIG = {
  slug: 'maor-hachesed', orgName: 'מאור החסד', theme: 'or-rishon',
  adminEmails: [], modules: {}, features: {}, terms: {},
  site: {
    enabled: true, langs: ['he'], icon: '🕯️',
    heroTitle: { he: 'הבית של' }, titleAccent: { he: 'האלמנות.' },
    tagline: { he: 'כבר 24 שנה אנחנו הבית של האלמנות והיתומים.' },
    ticker: { he: 'קמפיין החגים · ₪342,180 נאספו · מתעדכן חי' },
    microCopy: { he: 'כל ₪9 = ארוחה חמה לילד ♡' },
    campaign: { title: { he: 'בחרו את התרומה שלכם' }, goal: 500000, raised: 342311, end: '2026-09-14' },
    news: { he: 'נפתחה ההרשמה למלגות תשפ״ז ליתומים ויתומות.' },
    storyTitle: { he: '24 שנה של בית חם.' },
    story: { he: 'לפני 24 שנה קמה מרים לוצקין…' },
    contact: { phones: ['02-000-0000', '058-000-0000'], whatsapp: '058-000-0000', email: 'info@maor.org.il', address: { he: 'ירושלים · Monsey NY' } },
  },
};

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 3000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));

// זריעת הקונפיג לפני טעינת האפליקציה (ענן כבוי מהרגע הראשון) — כמו סקריפטי ה-e2e
await page.addInitScript((cfg) => { localStorage.setItem('maor_org_config', JSON.stringify(cfg)); }, CONFIG);
await page.goto(`${base}/#builder`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);

// פתיחת מקטע האתר-הציבורי
const sec = await page.$('#wz-site button');
if (sec) { await sec.click(); await page.waitForTimeout(500); }
const box = await page.$('#wz-site');
if (box) await box.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/wizard-site.png', fullPage: false });
if (box) { const b = await box.boundingBox(); if (b) await page.screenshot({ path: '/tmp/wizard-site-crop.png', clip: { x: b.x, y: Math.max(0, b.y), width: b.width, height: Math.min(b.height, 2600) } }); }
// אימות round-trip: הקלדת יעד חדש בשדה-הקמפיין ⇒ נשמר ב-config.site.campaign.goal
const goalInput = await page.$('#wz-site input[type="number"]');
if (goalInput) { await goalInput.fill('600000'); await page.waitForTimeout(400); }
const saved = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('maor_org_config')).site?.campaign?.goal; } catch { return null; } });
console.log('found #wz-site:', !!box, '· round-trip goal =', saved, '· console errors:', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
server.close();
