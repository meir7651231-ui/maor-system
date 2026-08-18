import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIST = new URL('../dist/', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webm': 'video/webm', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
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
const base = `http://localhost:${server.address().port}`;

const CFG = {
  slug: 'flow', orgName: 'אורביט', emoji: '🪐', theme: 'or-rishon', modules: {}, terms: {},
  firebase: { apiKey: 'demo-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: '1:1:web:1' },
};
const browser = await chromium.launch({ executablePath: CHROME });
const errs = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), CFG);
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(2400);

const shot = async (name) => { await page.screenshot({ path: `/tmp/flow-${name}.png` }); console.log('  📸', name); };
const primary = () => page.locator('.orbit-card .orbit-primary');

// שלב 1 → תחום
await page.locator('.orbit-card button', { hasText: 'קליניקה' }).first().click();
await page.waitForTimeout(200); await shot('1-domain');
await primary().click(); await page.waitForTimeout(300);
// שלב 2 → גודל
await page.locator('.orbit-choice', { hasText: 'בינוני' }).first().click();
await page.waitForTimeout(150); await shot('2-size');
await primary().click(); await page.waitForTimeout(300);
// שלב 3 → צרכים (בוחרים כמה)
await page.locator('.orbit-choice').first().click();
await page.waitForTimeout(120);
await page.locator('.orbit-choice').nth(2).click();
await page.waitForTimeout(150); await shot('3-needs');
await primary().click(); await page.waitForTimeout(300);
// שלב 4 → פרטי קשר (ממלאים)
const inp = page.locator('.orbit-card .orbit-input');
await inp.nth(0).fill('עמותת אור');
await inp.nth(1).fill('ישראל ישראלי');
await inp.nth(2).fill('050-1234567');
await page.waitForTimeout(150); await shot('4-contact');
await primary().click(); await page.waitForTimeout(300);
// שלב 5 → חשבון (ממלאים)
const inp2 = page.locator('.orbit-card .orbit-input');
await inp2.nth(0).fill('name@example.com');
await inp2.nth(1).fill('SuperSecret123');
await inp2.nth(2).fill('SuperSecret123');
await page.waitForTimeout(150); await shot('5-account');

// לשונית כניסה
await page.locator('button.orbit-tab', { hasText: 'כניסה' }).click();
await page.waitForTimeout(300); await shot('6-login');
// לשונית הרשמת-עובד
await page.locator('button.orbit-tab', { hasText: 'הרשמת עובד' }).click();
await page.waitForTimeout(300); await shot('7-employee');
// מודאל עיתון (overlay)
await page.locator('button.orbit-tab', { hasText: 'הרשמה' }).first().click();
await page.waitForTimeout(200);
await page.locator('button', { hasText: '📰 עיתון' }).click();
await page.waitForTimeout(500); await shot('8-reader');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
// מודאל בדיקת-תקשורת
await page.locator('button', { hasText: '🩺 בדיקת תקשורת' }).click();
await page.waitForTimeout(400); await shot('9-netcheck');
await page.keyboard.press('Escape');

// מובייל — שלב-קשר עמוק
const m = await browser.newPage({ viewport: { width: 402, height: 900 }, deviceScaleFactor: 2 });
await m.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), CFG);
await m.goto(base, { waitUntil: 'networkidle' });
await m.waitForTimeout(2400);
await m.locator('.orbit-card button', { hasText: 'קליניקה' }).first().click();
await m.waitForTimeout(150);
await m.locator('.orbit-card .orbit-primary').click();
await m.waitForTimeout(250);
await m.screenshot({ path: '/tmp/flow-m-size.png' });
console.log('  📸 m-size');

console.log('console errors:', errs.length ? errs.slice(0, 4) : 'none');
await browser.close();
server.close();
