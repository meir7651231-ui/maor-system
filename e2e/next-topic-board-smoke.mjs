/**
 * סמוק 6.10 — «בקשר הבא חסר במעקב טיפול על מה לדבר, שמירה וטופל»: תיק שהושלם ⇒ סינון «הושלם» ⇒ 🎯 ⇒
 * שדה «על מה לדבר» + 💾 שמירה ⇒ sp.nextNote נשמר ⇒ קביעת תאריך ⇒ תזכורת-לוח עם 📝 הנושא ⇒ ✓ טופל ⇒
 * התאריך, התזכורת וההערה יורדים. דורש build.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(8276, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const demo = JSON.parse(readFileSync(join(HERE, '..', 'public', 'demo.json'), 'utf8'));
const doneSp = demo.supporters[0];
doneSp.ayin = { stage: 'done', names: [{ id: 'n0', name: 'שם 0', eyes: '', done: true }], log: [], answers: [], paid: true, lastTouch: '', answerPushed: true };
delete doneSp.nextDate; delete doneSp.nextNote; delete doneSp.nextEventId;
await pg.addInitScript(({ c, dbJson }) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); localStorage.setItem('maor_db', dbJson); }, { c: cfg, dbJson: JSON.stringify(demo) });
await pg.goto('http://localhost:8276/'); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(1200);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(800);
await pg.locator('button', { hasText: '▼ הצגה' }).first().click(); await pg.waitForTimeout(500);
const dbRead = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const spNow = async () => ((await dbRead()).supporters || []).find((s) => s.id === doneSp.id);

// סינון «הושלם»
const stageSel = pg.locator('main .card select').nth(1);
await stageSel.selectOption('done').catch(async () => { await stageSel.selectOption({ label: 'הושלם' }); }); await pg.waitForTimeout(500);
const row = pg.locator('.ayin-row[role="button"]').filter({ hasText: doneSp.name }).first();
(await row.count()) === 1 ? ok('סינון «הושלם» מציג את התיק: ' + doneSp.name) : fail('התיק לא בסינון הושלם');
await row.locator('button', { hasText: '🎯 קשר הבא' }).first().click(); await pg.waitForTimeout(400);
const prompt = pg.locator('.ayin-next-prompt').first();
(await prompt.count()) === 1 ? ok('🎯 ⇒ שאלת «קשר הבא» נפתחה') : fail('השאלה לא נפתחה');
const ta = prompt.locator('textarea[aria-label="על מה לדבר בפעם הבאה"]');
(await ta.count()) === 1 ? ok('שדה «על מה לדבר בפעם הבאה» קיים בלוח') : fail('שדה-הנושא חסר');
(await prompt.locator('button', { hasText: '💾 שמירה' }).count()) === 1 && (await prompt.locator('button', { hasText: '✓ טופל' }).count()) === 1 ? ok('כפתורי «💾 שמירה» ו-«✓ טופל» קיימים (גם כשלא הגיע הזמן)') : fail('שמירה/טופל חסרים');
await ta.fill('לבקש חידוש הו״ק'); await prompt.locator('button', { hasText: '💾 שמירה' }).click(); await pg.waitForTimeout(500);
(await spNow())?.nextNote === 'לבקש חידוש הו״ק' ? ok('💾 ⇒ sp.nextNote נשמר (אותו שדה של הכרטיס)') : fail('nextNote: ' + JSON.stringify((await spNow())?.nextNote));
// תאריך ⇒ תזכורת עם הנושא
const dateInput = prompt.locator('input[type="date"]').first();
if (await dateInput.count()) {
  await dateInput.fill('2026-11-20'); await pg.waitForTimeout(600);
} else {
  // קלט-תאריך עברי — מעבר ללועזי אם קיים
  const toG = prompt.locator('button', { hasText: 'לועזי' }).first(); if (await toG.count()) { await toG.click(); await pg.waitForTimeout(200); await prompt.locator('input[type="date"]').first().fill('2026-11-20'); await pg.waitForTimeout(600); }
}
const sp1 = await spNow();
const ev = ((await dbRead()).events || []).find((e) => e.id === sp1?.nextEventId);
sp1?.nextDate === '2026-11-20' && ev && (ev.notes || '').includes('📝 לבקש חידוש הו״ק') ? ok('תאריך ⇒ תזכורת-לוח עם 📝 הנושא: ' + ev.notes) : fail('תזכורת: ' + JSON.stringify({ d: sp1?.nextDate, n: ev?.notes }));
// ✓ טופל
await prompt.locator('button', { hasText: '✓ טופל' }).click(); await pg.waitForTimeout(600);
const sp2 = await spNow();
!sp2?.nextDate && !(sp2?.nextNote) && !((await dbRead()).events || []).some((e) => e.id === sp1?.nextEventId) ? ok('✓ טופל ⇒ התאריך, ההערה והתזכורת ירדו') : fail('טופל לא ניקה: ' + JSON.stringify({ d: sp2?.nextDate, n: sp2?.nextNote }));
(await pg.locator('.ayin-next-prompt').count()) === 0 ? ok('השאלה נסגרה') : fail('השאלה נשארה פתוחה');
await pg.screenshot({ path: join(HERE, 'shots', 'next-topic-board.png'), fullPage: false }).catch(() => {});
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
