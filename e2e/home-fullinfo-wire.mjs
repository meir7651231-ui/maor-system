/**
 * סמוק-קוהרנטיות ווידג'ט↔יעד (20.8, בקשת-בעלים "איפה מוצג המידע המלא והאם
 * זה משקף את הווידג'ט"): לכל ווידג'ט — לוכדים את הערך המסוכם שהוא מציג,
 * לוחצים אל מסך-היעד, ומאמתים שהיעד מציג את **אותו** מידע במלואו (אותם
 * מספרים, אותה ישות). פערי-שיקוף אמיתיים = כשל; פערי-נוחות = 🟡 ממצא.
 * דורש build קודם (npm run build).
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
await new Promise((r) => server.listen(8235, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const findings = [];
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const finding = (m) => { findings.push(m); console.log('🟡 ממצא · ' + m); };
const skip = (m) => console.log('⏭️  ' + m);
const panel = (title) => pg.locator('section.card', { hasText: title }).first();
const goHome = async () => { await pg.locator('nav button, .side-link', { hasText: 'בית' }).first().click(); await pg.waitForTimeout(500); };
const mainText = async () => (await pg.locator('main').textContent()) ?? '';
const digits = (t) => (t ?? '').replace(/[^\d]/g, '');

await pg.addInitScript(() => {
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
});
await pg.goto('http://localhost:8235/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await goHome();

/* כל הספרייה על הלוח */
await pg.locator('.hm-edit-link').click();
await pg.waitForTimeout(400);
for (let i = 0; i < 20; i++) {
  const b = pg.locator('button', { hasText: '+ הוספה' }).first();
  if (!(await b.count())) break;
  await b.click();
  await pg.waitForTimeout(120);
}
await pg.locator('button', { hasText: 'שמירת הלוח ✓' }).click();
await pg.waitForTimeout(700);

/* ── 1 · משפחות: ערך-הכרטיס ↔ מונה-הכותרת במסך-המשפחות ── */
const famVal = (await pg.locator('.hm-stat', { hasText: 'משפחות' }).first().locator('.hm-stat-value').textContent())?.trim() ?? '';
await pg.locator('.hm-stat', { hasText: 'משפחות' }).first().click();
await pg.waitForTimeout(600);
(await mainText()).includes(famVal + ' משפחות')
  ? ok(`משפחות · הבית (${famVal}) = כותרת-המסך (${famVal} משפחות)`)
  : fail(`משפחות · הכותרת לא משקפת (${famVal})`);
await goHome();

/* ── 2 · תרומות: ₪-הבית ↔ סה"כ-הכותרת בתורמים (שניהם "לכולל") ── */
const donCard = pg.locator('.hm-stat', { hasText: 'תרומות' }).first();
const donVal = (await donCard.locator('.hm-stat-value').textContent())?.trim() ?? '';
await donCard.click();
await pg.waitForTimeout(700);
const supHead = await mainText();
supHead.includes('סה"כ ₪' + donVal.replace('₪', ''))
  ? ok(`תרומות · הבית (${donVal}) = סה"כ-הכותרת בתורמים`)
  : fail(`תרומות · הכותרת בתורמים לא תואמת ל-${donVal}`);
await goHome();

/* ── 3 · חוגים: ערך-הכרטיס ↔ מסך-החוגים ── */
const crsVal = (await pg.locator('.hm-stat', { hasText: 'חוגים' }).first().locator('.hm-stat-value').textContent())?.trim() ?? '';
await pg.locator('.hm-stat', { hasText: 'חוגים' }).first().click();
await pg.waitForTimeout(600);
(await mainText()).includes(crsVal)
  ? ok(`חוגים · הבית (${crsVal}) מופיע במסך-החוגים`)
  : fail(`חוגים · המסך לא משקף (${crsVal})`);
await goHome();

/* ── 4 · "היום": "N רשומים" בשורת-המפגש ↔ כותרת כרטיס-החוג ── */
const meetSub = (await panel('היום ·').locator('.hm-meet-sub').first().textContent()) ?? '';
const meetN = meetSub.match(/(\d+) רשומים/)?.[1];
if (meetN) {
  await panel('היום ·').locator('.hm-meet-main').first().click();
  await pg.waitForTimeout(700);
  const cardHead = (await mainText()).match(/(\d+)\/(\d+|∞) רשומים/);
  if (cardHead && cardHead[1] === meetN) ok(`היום · "${meetN} רשומים" בבית = ${cardHead[1]}/${cardHead[2]} בכרטיס-החוג`);
  else if (cardHead) finding(`היום · הבית מציג ${meetN} רשומים אך כרטיס-החוג ${cardHead[1]}/${cardHead[2]} (פעילים מול לא-הסתיימו)`);
  else fail('היום · כרטיס-החוג בלי מונה-רשומים');
  await goHome();
} else skip('היום · אין שורת-מפגש עם רשומים');

/* ── 5 · יעדי-קשר: תאריך-הצ'יפ ↔ "קשר הבא" בכרטיס-התומך ── */
const cRow = panel('יעדי קשר').locator('button.hm-row').first();
if (await cRow.count()) {
  const chipDate = ((await cRow.textContent()) ?? '').match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? '';
  await cRow.click();
  await pg.waitForTimeout(700);
  const card = await mainText();
  if (!card.includes('קשר הבא')) fail('יעדי-קשר · בכרטיס אין מקטע "קשר הבא"');
  else {
    // התאריך עצמו יושב ב-HebDateInput — מאומת מול הנתונים (אותו sp.nextDate)
    const iso = chipDate.split('/').reverse().join('-');
    const match = await pg.evaluate((d) => JSON.parse(localStorage.getItem('maor_db')).supporters.some((s) => s.nextDate === d), iso);
    match ? ok(`יעדי-קשר · תאריך-הצ'יפ (${chipDate}) = sp.nextDate והכרטיס מציג "קשר הבא"`) : fail('יעדי-קשר · התאריך לא תואם');
    // קוהרנטיות (20.8): יעד שעבר ⇒ הכרטיס מדגיש "באיחור N ימים" באותה שפה כמו הווידג'ט
    const todayIso = new Date().toISOString().slice(0, 10);
    if (iso < todayIso) {
      card.includes('באיחור')
        ? ok('יעדי-קשר · הכרטיס מדגיש "באיחור" כשהיעד עבר — אותה שפה כמו הווידג\'ט')
        : fail('יעדי-קשר · היעד עבר אך הכרטיס לא מציג "באיחור"');
    }
  }
  await goHome();
} else skip('יעדי-קשר · אין יעדים פתוחים');

/* ── 6 · מלאי-כרטיסיות: "L/T" ↔ 'כרטיסייה L/T' בכרטיס-המשפחה ── */
const pRow = panel('מלאי כרטיסיות').locator('button.hm-row').first();
if (await pRow.count()) {
  const chip = ((await pRow.textContent()) ?? '').match(/(\d+)\/(\d+)/);
  await pRow.click();
  await pg.waitForTimeout(700);
  const famCard = await mainText();
  // פורמט-היעד בכרטיס-המשפחה: "rem מתוך purchased" (FamilyPanels) — אותה יתרה, ניסוח מלא
  chip && famCard.includes(chip[1] + ' מתוך ' + chip[2])
    ? ok(`מלאי-כרטיסיות · "${chip[1]}/${chip[2]}" בבית = '${chip[1]} מתוך ${chip[2]}' בכרטיס-המשפחה`)
    : fail('מלאי-כרטיסיות · הכרטיס לא מציג את אותה יתרה');
  await goHome();
} else skip('מלאי-כרטיסיות · אין שורות');

/* ── 7 · תפוסת-החוגים: n/max בעמודה ↔ כותרת כרטיס-החוג ── */
const bar = panel('תפוסת החוגים').locator('button[title*="/"]').first();
if (await bar.count()) {
  const t = (await bar.getAttribute('title')) ?? '';
  const nm = t.match(/(\d+)\/(\d+)/);
  await bar.click();
  await pg.waitForTimeout(700);
  const crsCard = await mainText();
  nm && crsCard.includes(nm[1] + '/' + nm[2] + ' רשומים')
    ? ok(`תפוסת-החוגים · "${nm[1]}/${nm[2]}" בעמודה = בכותרת כרטיס-החוג`)
    : fail(`תפוסת-החוגים · הכרטיס לא משקף (${t})`);
  await goHome();
} else skip('תפוסת-החוגים · אין עמודות');

/* ── 8 · אמינות-קהילתי: מונה-האריח ↔ מונה-המסונן במשפחות ── */
const commPanel = panel('אמינות קהילתי');
const tile = commPanel.locator('button.hm-tier').first();
if (await tile.count()) {
  const tileN = digits((await tile.locator('b').textContent()) ?? '');
  await tile.click();
  await pg.waitForTimeout(700);
  const famHead = await mainText();
  famHead.includes(tileN + ' מתוך') || famHead.includes(tileN + ' משפחות')
    ? ok(`אמינות-קהילתי · אריח (${tileN}) = המונה-המסונן במשפחות`)
    : fail(`אמינות-קהילתי · הסינון לא משקף (${tileN}): ` + (famHead.match(/\d+ מתוך \d+/)?.[0] ?? ''));
  await goHome();
} else skip('אמינות-קהילתי · אין אריחים');

/* ── 9 · משפחות-אחרונות: שם+טלפון בשורה ↔ כרטיס-המשפחה ── */
const recRow = panel('משפחות אחרונות').locator('tbody tr').first();
if (await recRow.count()) {
  const rowT = (await recRow.textContent()) ?? '';
  const phone = rowT.match(/0\d{2}-?\d{7}/)?.[0] ?? '';
  await recRow.click();
  await pg.waitForTimeout(700);
  const famCard = await mainText();
  phone && famCard.replace(/-/g, '').includes(phone.replace(/-/g, ''))
    ? ok('משפחות-אחרונות · הטלפון מהשורה מופיע בכרטיס-המלא')
    : fail('משפחות-אחרונות · הכרטיס לא מציג את פרטי-השורה');
  await goHome();
} else fail('משפחות-אחרונות · אין שורות');

/* ── 10 · הצעות-מקדימות: חידוש-כרטיסייה ↔ כרטיס-החוג המקושר ── */
const renew = panel('הצעות מקדימות').locator('.hm-row', { hasText: 'חידוש כרטיסייה' }).first();
if (await renew.count()) {
  const first = ((await renew.textContent()) ?? '').match(/חידוש כרטיסייה · ([^·]+) ·/)?.[1]?.trim() ?? '';
  await renew.locator('button', { hasText: 'טפל' }).click();
  await pg.waitForTimeout(700);
  const crsCard = await mainText();
  first && crsCard.includes(first)
    ? ok(`הצעות · "חידוש כרטיסייה · ${first}" נחת על כרטיס-החוג עם התלמיד/ה`)
    : fail('הצעות · היעד לא מציג את התלמיד/ה מההצעה');
  await goHome();
} else skip('הצעות · אין הצעת-חידוש');

/* ── 11 · ספר-הזהב: שורת-פודיום לחיצה ⇒ כרטיס-התורם עם אותו שם ── */
const goldRow = panel('ספר הזהב').locator('.hm-gold-row[role="button"]').first();
if (await goldRow.count()) {
  const goldName = ((await goldRow.locator('b').first().textContent()) ?? '').trim();
  await goldRow.click();
  await pg.waitForTimeout(700);
  const supCard = await mainText();
  goldName && supCard.includes(goldName)
    ? ok(`ספר-הזהב · לחיצה על "${goldName}" פתחה את כרטיס-התורם`)
    : fail('ספר-הזהב · הלחיצה לא הגיעה לכרטיס-התורם');
  await goHome();
} else skip('ספר-הזהב · אין שורות-פודיום לחיצות');

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS בכל הבדיקה');

console.log(`\n── סיכום קוהרנטיות ──\n${passed}/${passed + failed} עברו · ${findings.length} ממצאי-נוחות`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
