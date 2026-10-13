/**
 * צילומי רשימת-הבעלים 13.10 — כל תיקון מוצג בדפדפן (טלפונים נוספים, כפילויות, זיהוי-מתקשר, שם פרטי/משפחה,
 * שמות לתפילה, זיכרון-סינון בלוח, סינון-יום בחוגים). דורש build. הצילומים: e2e/shots/owner-1013/.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const OUT = join(HERE, 'shots', 'owner-1013');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(8255, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = []; pg.on('pageerror', (e) => errors.push(e.message));
const step = async (name, fn) => { try { await fn(); console.log('✅ ' + name); } catch (e) { console.log('❌ ' + name + ': ' + e.message.split('\n').slice(0, 3).join(' | ')); await pg.screenshot({ path: OUT + '/fail-' + name.replace(/\s+/g, '_') + '.png' }); } };
const nav = async (t) => {
  await pg.keyboard.press('Escape').catch(() => {});
  const back = pg.locator('button', { hasText: /^→ כל/ });
  if (await back.count()) { await back.first().click(); await pg.waitForTimeout(400); }
  await pg.locator('nav button, .side-link', { hasText: t }).first().click(); await pg.waitForTimeout(700);
};
pg.setDefaultTimeout(8000);
await pg.addInitScript((c) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8255/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
const db = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
let d0 = await db();
const s1 = d0.supporters[0], s2 = d0.supporters[1], f1 = d0.families[0];
console.log('sup1', s1.name, s1.phone, '| sup2', s2.name, '| fam1', f1.name);

// 9 · first/last name — edit supporter 1
await step('שם פרטי/משפחה', async () => {
  await nav('תורמים');
  await pg.locator('main table tbody tr', { hasText: s1.name }).first().click(); await pg.waitForTimeout(700);
  await pg.locator('button', { hasText: 'עריכה' }).first().click(); await pg.waitForTimeout(500);
  const dlg = pg.locator('[role=dialog]').last();
  await dlg.locator('label:has-text("שם פרטי") input, label:has-text("שם פרטי") + * input').first().fill('יחיאל').catch(async () => { await dlg.getByLabel('שם פרטי').fill('יחיאל'); });
  await dlg.getByLabel('שם משפחה').fill('גרינוולד');
  await dlg.screenshot({ path: OUT + '/9a-form.png' });
  await dlg.locator('button', { hasText: 'שמירה' }).last().click(); await pg.waitForTimeout(600);
});
// supporter 2: extra phone = sup1 phone (dedup + caller)
await step('טלפון נוסף לתורם 2', async () => {
  await nav('תורמים');
  await pg.locator('main table tbody tr', { hasText: s2.name }).first().click(); await pg.waitForTimeout(700);
  await pg.locator('button', { hasText: 'עריכה' }).first().click(); await pg.waitForTimeout(500);
  const dlg = pg.locator('[role=dialog]').last();
  await dlg.locator('button', { hasText: '➕ הוסף טלפון' }).click();
  await dlg.getByLabel('מספר טלפון נוסף').last().fill(s1.phone);
  await dlg.getByLabel('ממי המספר').last().fill('הבן');
  await dlg.locator('button', { hasText: 'שמירה' }).last().click(); await pg.waitForTimeout(600);
});
// 5 · family extra phones
await step('טלפונים נוספים למשפחה', async () => {
  await nav('משפחות');
  await pg.locator('main .card[role=button], main table tbody tr', { hasText: f1.name }).first().click(); await pg.waitForTimeout(700);
  await pg.locator('button', { hasText: /עריכת|עריכה/ }).first().click(); await pg.waitForTimeout(500);
  const dlg = pg.locator('[role=dialog]').last();
  const more = dlg.locator('button', { hasText: 'פרטים נוספים' }); if (await more.count()) await more.first().click();
  await dlg.locator('button', { hasText: '➕ הוסף טלפון' }).click();
  await dlg.getByLabel('מספר טלפון נוסף').last().fill(s1.phone);
  await dlg.getByLabel('תווית').last().fill('אבא');
  await dlg.locator('button', { hasText: '➕ הוסף טלפון' }).click();
  await dlg.getByLabel('מספר טלפון נוסף').last().fill('052-7777777');
  await dlg.getByLabel('תווית').last().fill('עבודה');
  const ed = dlg.locator('text=➕ הוסף טלפון').first(); await ed.scrollIntoViewIfNeeded();
  await dlg.screenshot({ path: OUT + '/5a-family-form.png' });
  await dlg.locator('button', { hasText: 'שמירה' }).last().click(); await pg.waitForTimeout(700);
  await pg.screenshot({ path: OUT + '/5b-family-card.png', fullPage: true });
});
// 4 · caller id
await step('זיהוי מתקשר', async () => {
  await pg.evaluate((p) => { window.location.hash = '#call=' + p.replace(/\D/g, ''); }, s1.phone); await pg.waitForTimeout(900);
  await pg.locator('[role=dialog]').last().screenshot({ path: OUT + '/4-caller.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
});
// 3 · dedup supporters
await step('איחוד כפולים', async () => {
  await nav('תורמים');
  const menu = pg.locator('main button', { hasText: 'עוד' }).first(); await menu.click(); await pg.waitForTimeout(300);
  await pg.locator('text=🔗 איחוד כפולים').first().click(); await pg.waitForTimeout(700);
  await pg.locator('[role=dialog]').last().screenshot({ path: OUT + '/3-dedup.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
});
// 9b · last name column + filter
await step('עמודת שם משפחה + סינון', async () => {
  await nav('תורמים');
  const f = pg.getByLabel('סינון לפי שם משפחה');
  if (!(await f.count())) { const cf = pg.locator('button', { hasText: /סינון עמודות|🔽/ }).first(); if (await cf.count()) await cf.click(); await pg.waitForTimeout(300); }
  await pg.getByLabel('סינון לפי שם משפחה').fill('גרינ'); await pg.waitForTimeout(800);
  await pg.screenshot({ path: OUT + '/9b-lastname-filter.png', fullPage: false });
  await pg.getByLabel('סינון לפי שם משפחה').fill(''); await pg.waitForTimeout(500);
});
// 6 · prayer names
await step('שמות לתפילה', async () => {
  await pg.locator('main table tbody tr', { hasText: s1.name }).first().click(); await pg.waitForTimeout(700);
  for (const [n, note] of [['שרה בת רחל', 'לרפואה'], ['משה בן לאה', 'לזיווג']]) {
    await pg.getByLabel('שם לתפילה').fill(n); await pg.getByLabel('הערה לשם-התפילה').fill(note);
    await pg.locator('button', { hasText: '+ הוספת שם לתפילה' }).click(); await pg.waitForTimeout(300);
  }
  const sec = pg.locator('.card', { hasText: 'הוספת שם לתפילה' }).last(); await sec.scrollIntoViewIfNeeded();
  await sec.screenshot({ path: OUT + '/6a-prayer-card.png' });
  // capture the print html
  await pg.evaluate(() => { window.print = () => {}; });
  await pg.locator('button', { hasText: 'הורדה / הדפסה' }).first().click(); await pg.waitForTimeout(800);
  let html = await pg.evaluate(() => [...document.querySelectorAll('iframe[aria-hidden=true]')].map((f) => f.srcdoc).filter(Boolean).pop() || null);
  if (html) { const p2 = await browser.newPage({ viewport: { width: 800, height: 600 } }); await p2.setContent(html); await p2.screenshot({ path: OUT + '/6b-prayer-file.png', fullPage: true }); await p2.close(); } else throw new Error('no print html');
});
// 2 · calendar filter memory
await step('לוח שנה זוכר סינון', async () => {
  await nav('לוח שנה');
  await pg.locator('main button', { hasText: 'דחוף בלבד' }).first().click(); await pg.waitForTimeout(300);
  await nav('משפחות'); await nav('לוח שנה');
  await pg.screenshot({ path: OUT + '/2-calendar.png', clip: { x: 0, y: 0, width: 1100, height: 420 } });
  console.log('   chip after return:', await pg.locator('main button', { hasText: 'דחוף בלבד' }).first().getAttribute('aria-pressed'), await pg.locator('main button', { hasText: 'דחוף בלבד' }).first().getAttribute('class'));
});
// 1 · courses day filter
await step('חוגים — סינון יום', async () => {
  await nav('חוגים');
  const sel = pg.locator('main select', { hasText: 'כל הימים' }).first(); await sel.selectOption({ label: 'יום ב' }).catch(async () => sel.selectOption({ index: 2 })); await pg.waitForTimeout(500);
  await pg.screenshot({ path: OUT + '/1-courses-day.png' });
});
console.log('errors', errors);
await browser.close(); server.close();
