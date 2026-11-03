/**
 * סמוק «כל הפרטים עוברים לעמוד-התרומה» + «סולה חו״ל» (בקשת-בעלים 3.11.2026). דורש build קודם.
 * קונפיג-השורש בלי firebase, slug=mavr-hchsd (המשרד של מאור), תשלומים דלוק עם נדרים בלבד (בלי solaPayUrl)
 * ⇒ דמו ⇒ כרטיס-תורם ⇒ (1) שני כפתורים: נדרים + סולה (ברירת-המחדל של מאור) (2) הקישורים נושאים
 * שם/טלפון/מייל/כתובת/עיר של התורם (3) ‏LIVE=1 — פתיחת עמוד-סולה האמיתי מהכפתור ובדיקה שהשדות התמלאו
 * (בלי לשלוח תשלום). ‏SLUG=other-org ⇒ לקוח אחר נשאר כמו היום (שם בלבד). נדרים חוסם גישה אוטומטית — נבדקים פרמטרי-הקישור בלבד.
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
const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8261, r));

const NED = 'https://www.matara.pro/nedarimplus/online/?mosad=7001532';
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8'));
delete cfg.firebase;
// SLUG=other-org ⇒ לקוח אחר של אורביט: חייב להישאר כמו היום (שם בלבד, בלי כפתור-סולה בלי הגדרה)
const OTHER = !!process.env.SLUG && process.env.SLUG !== 'mavr-hchsd';
cfg.slug = process.env.SLUG || 'mavr-hchsd';
cfg.integrations = { ...(cfg.integrations || {}), payments: { enabled: true, payUrl: NED } };
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 1366 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };

await pg.addInitScript((c) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8261/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click();
await pg.waitForTimeout(700);
// תורם עם טלפון+מייל (אם יש בדמו), אחרת הראשון
// מפתח-ה-DB ממורחב-שם לפי הארגון (nsLsKey) — לוקחים את maor_db* שיש בו תורמים
const db = await pg.evaluate(() => { for (const k of Object.keys(localStorage)) { if (!k.startsWith('maor_db')) continue; try { const d = JSON.parse(localStorage.getItem(k) || '{}'); if (d.supporters?.length) return d; } catch { /* */ } } return {}; });
const sups = db.supporters || [];
const sp = sups.find((s) => s.phone && s.email) || sups.find((s) => s.phone) || sups[0];
await pg.locator('main table tbody tr', { hasText: sp.name }).first().click();
await pg.waitForTimeout(800);

const hrefs = await pg.$$eval('a', (as) => as.map((a) => a.href).filter((h) => /matara\.pro|cardknox\.com/.test(h)));
const ned = hrefs.find((h) => h.includes('matara.pro'));
const sola = hrefs.find((h) => h.includes('cardknox.com'));
ned ? ok('כפתור נדרים בכרטיס') : fail('אין כפתור נדרים');
if (!OTHER) sola ? ok('כפתור סולה בכרטיס — בלי הגדרה באשף (ברירת-המחדל של מאור)') : fail('אין כפתור סולה');
const btnTexts = await pg.$$eval('a.chip', (as) => as.map((a) => a.textContent.trim()));
if (OTHER) btnTexts.includes('💳 עמוד תרומה') && !btnTexts.some((t) => t.includes('₪ שקל')) ? ok('לקוח אחר: תווית «💳 עמוד תרומה» — כמו היום') : fail('לקוח אחר: תוויות ' + btnTexts.join(' | '));
else btnTexts.includes('💳 נדרים · ₪ שקל') && btnTexts.includes('💳 סולה · $ דולר') ? ok('מאור: «💳 נדרים · ₪ שקל» + «💳 סולה · $ דולר»') : fail('מאור: תוויות ' + btnTexts.join(' | '));
if (OTHER) {
  const nn = new URL(ned || 'https://x.invalid');
  [...nn.searchParams.keys()].sort().join(',') === 'ClientName,mosad' ? ok('לקוח אחר: נדרים מקבל שם בלבד — כמו היום') : fail('לקוח אחר: פרמטרים ' + [...nn.searchParams.keys()]);
  !sola ? ok('לקוח אחר: אין כפתור סולה בלי הגדרה באשף — כמו היום') : fail('לקוח אחר קיבל כפתור סולה');
  errors.length === 0 ? ok('אפס שגיאות-דף') : fail('שגיאות: ' + errors.join(' | '));
  console.log(`\n${passed} עברו · ${failed} נכשלו`);
  await browser.close(); server.close(); process.exit(failed ? 1 : 0);
}
const n = new URL(ned || 'https://x.invalid');
const s = new URL(sola || 'https://x.invalid');
const want = (label, got, exp) => (!exp ? ok(`${label}: לתורם אין ערך — לא נשלח (${got === null ? 'ריק' : got})`) : got === exp.trim() ? ok(`${label} = ${got}`) : fail(`${label}: ציפיתי ${exp} קיבלתי ${got}`));
console.log('— תורם:', JSON.stringify({ name: sp.name, phone: sp.phone, email: sp.email, address: sp.address, city: sp.city, idNum: sp.idNum }));
want('נדרים ClientName', n.searchParams.get('ClientName'), sp.name);
want('נדרים Phone', n.searchParams.get('Phone'), sp.phone);
want('נדרים Email', n.searchParams.get('Email'), sp.email);
want('נדרים Street', n.searchParams.get('Street'), sp.address);
want('נדרים City', n.searchParams.get('City'), sp.city);
want('נדרים Zeout', n.searchParams.get('Zeout'), sp.idNum);
want('סולה xBillLastName', s.searchParams.get('xBillLastName'), sp.name);
want('סולה xBillPhone', s.searchParams.get('xBillPhone'), sp.phone);
want('סולה xEmail', s.searchParams.get('xEmail'), sp.email);
s.searchParams.get('xAmount') === null ? ok('סולה: בלי סכום (₪ מול $)') : fail('סולה קיבלה סכום');

if (process.env.LIVE === '1' && sola) {
  const live = await browser.newPage();
  await live.goto(sola, { waitUntil: 'networkidle', timeout: 45000 });
  for (const [f, exp] of [['xBillLastName', sp.name], ['xBillPhone', sp.phone], ['xEmail', sp.email], ['xBillStreet', sp.address], ['xBillCity', sp.city]]) {
    const v = await live.$eval(`[name=${f}]`, (e) => e.value).catch(() => null);
    if (!exp) continue;
    v === exp.trim() ? ok(`עמוד-סולה החי: ${f} התמלא («${v}»)`) : fail(`עמוד-סולה החי: ${f} = ${v} (ציפיתי ${exp})`);
  }
  await live.close();
}

errors.length === 0 ? ok('אפס שגיאות-דף') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} עברו · ${failed} נכשלו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
