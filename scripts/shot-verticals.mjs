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

// site content בסיסי (משותף) — משתנה רק accent + סוג-ארגון (core.taxreceipt)
const SITE = {
  enabled: true, langs: ['he'], icon: '⭐',
  heroTitle: { he: 'הבית של' }, titleAccent: { he: 'הלקוחות.' },
  tagline: { he: 'כבר 12 שנה אנחנו הכתובת — שירות אישי, מקצועי, עד הפרט האחרון.' },
  ticker: { he: 'עסוקים · 340 פרויקטים השנה · זמינים עכשיו' },
  microCopy: { he: 'כל פרויקט מקבל יחס אישי ★' },
  servicesHeading: { he: 'מה אנחנו עושים' },
  services: [
    { icon: '💡', title: { he: 'ייעוץ' }, text: { he: 'אפיון ותכנון מקצה לקצה' } },
    { icon: '🛠️', title: { he: 'ביצוע' }, text: { he: 'עבודה מדויקת בזמן' } },
    { icon: '🤝', title: { he: 'ליווי' }, text: { he: 'שירות אישי לאורך כל הדרך' } },
  ],
  stats: [{ value: '340', label: { he: 'פרויקטים' } }, { value: '12', label: { he: 'שנות ניסיון' } }, { value: '98%', label: { he: 'לקוחות מרוצים' } }],
  story: { he: 'התחלנו קטן, היום אנחנו שם בשביל מאות לקוחות.' }, storyTitle: { he: '12 שנה של מקצועיות.' },
  testimonials: [{ quote: { he: 'שירות מעל ומעבר.' }, author: 'ד׳', role: { he: 'לקוח' } }],
  tiers: [{ name: { he: 'בסיסי' }, amount: 490, period: { he: '/ חודש' }, perks: [{ he: 'תמיכה' }] }, { name: { he: 'פרו' }, amount: 990, period: { he: '/ חודש' }, featured: true, perks: [{ he: 'הכל + עדיפות' }] }],
  faq: [{ q: { he: 'איך מתחילים?' }, a: { he: 'פנייה קצרה ונחזור אליכם.' } }],
  contact: { phones: ['03-000-0000'], email: 'hi@studio.co.il', hours: { he: 'א׳–ה׳ 9:00–18:00' }, address: { he: 'תל אביב' } },
};

// חבילות מייצגות: חסד (בלי accent, עמותתי) + מסחריות עם accent שונה
const PACKS = [
  { id: 'chesed', accent: undefined, commercial: false },
  { id: 'digital', accent: '#5b6cff', commercial: true },
  { id: 'build', accent: '#e8912a', commercial: true },
  { id: 'studio', accent: '#0ea5e9', commercial: true },
  { id: 'clinic', accent: '#e05a8f', commercial: true },
];

const browser = await chromium.launch({ executablePath: CHROME });
const errs = [];
for (const pk of PACKS) {
  const cfg = {
    slug: 'v-' + pk.id, orgName: 'עסק לדוגמה · ' + pk.id, theme: 'or-rishon',
    adminEmails: [], modules: {}, terms: {},
    features: pk.commercial ? { 'core.taxreceipt': false } : {},
    ...(pk.accent ? { accent: pk.accent } : {}),
    site: SITE,
  };
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 2 });
  page.on('console', (m) => { if (m.type() === 'error') errs.push(pk.id + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push(pk.id + ': ' + String(e)));
  await page.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), cfg);
  await page.goto(`${base}/?site`, { waitUntil: 'networkidle' });
  await page.waitForSelector('nav', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/vert-${pk.id}.png` });
  console.log(`shot /tmp/vert-${pk.id}.png (accent=${pk.accent ?? 'none'}, commercial=${pk.commercial})`);
  await page.close();
}
console.log('console errors:', errs.length ? errs : 'none');
await browser.close();
server.close();
