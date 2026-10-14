#!/usr/bin/env node
/**
 * 📸 צילומי המעבדה (COMBINER, 14.10.2026): 390×844 ו-1280×800 ל"חמנייה", "דרקון", "קרוסלה" ולשתי מילים אקראיות (זרע קבוע).
 * (MACHINE-V2) החמנייה חייבת להראות 17/17.
 * "לא חסר כלום": בודק שהמילה "חסר" לא מופיעה בדף המרונדר (חוץ מתוכן המילון עצמו — מילה שהמילון שלה כותב "חסרה קובייה" לא נבחרת).
 *   node catalog/combiner/shots.mjs [--out <תיקייה>]   ⇒ knowledge/shots/combiner-2026-10-14/ (ברירת-מחדל)
 * וגם דף-הליבות (catalog/core/demo.html): בלי שגיאות, בלי "חסר"/"נבנה חדש", וכותרת 15/15.
 * מרים שרת סטטי קטן על שורש-הריפו (בלי תלויות), פותח את lab.html ב-Chromium ובודק שאין שגיאות קונסולה.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { pickWord } from './core.mjs';
import { loadGoals } from './load.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outArg = process.argv.indexOf('--out');
const OUT = join(ROOT, outArg > 0 ? process.argv[outArg + 1] : 'knowledge/shots/combiner-2026-10-14');
const TYPES = { '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const p = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = 'http://127.0.0.1:' + server.address().port + '/catalog/lab.html';

const goals = loadGoals();
const FIXED = ['חמנייה', 'דרקון', 'קרוסלה'];
// שתי מילים אקראיות (זרע קבוע ⇒ אותן מילים בכל ריצה)
const randoms = [];
for (let seed = 7; randoms.length < 2; seed++) {
  const g = pickWord(goals, seed);
  if (!FIXED.includes(g.word) && !randoms.includes(g.word) && !JSON.stringify(g).includes('חסר')) randoms.push(g.word);
}
const words = [['sunflower', 'חמנייה'], ['dragon', 'דרקון'], ['carousel', 'קרוסלה'], ['random', randoms[0]], ['random2', randoms[1]], ['unknown', 'בננה']];
const said = [];
await mkdir(OUT, { recursive: true });
const CHROME = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const errors = [];
for (const [w, h, tag] of [[390, 844, 'mobile'], [1280, 800, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const [slug, word] of words) {
    if (slug === 'unknown' && tag === 'desktop') continue;
    await page.goto(base + '#w=' + encodeURIComponent(word));
    await page.waitForSelector(slug === 'unknown' ? '#vchips' : '.out .title');
    if (slug === 'unknown') {
      await page.click('[data-v="divide"]');
      await page.click('[data-m="sequence"]');
      await page.click('[data-v="sun-position"]');
      await page.click('[data-m="number"]');
    }
    const body = await page.innerText('body');
    if (/חסר|שלח לבנייה/.test(body)) said.push(slug + ' ' + tag);
    // (MACHINE-V2) החמנייה של הבעלים: 17/17 — האזימוט הוא 🧩 שילוב
    if (slug === 'sunflower' && !/17\/17/.test(body)) said.push('sunflower ' + tag + ' (בלי 17/17)');
    await page.screenshot({ path: join(OUT, slug + '-' + tag + '.png') });
    await page.screenshot({ path: join(OUT, slug + '-' + tag + '-full.png'), fullPage: true });
    console.log('📸 ' + slug + ' (' + word + ') ' + tag);
  }
  // דף-הליבות: 15 המנועים רצים על המסך
  await page.goto(base.replace('lab.html', 'core/demo.html'));
  await page.waitForSelector('canvas[data-engine="bounce"]');
  await page.waitForTimeout(400);
  const demo = await page.innerText('body');
  if (/חסר|נבנה חדש|🔴/.test(demo)) said.push('core-demo ' + tag);
  if (!/15 מתוך 15 נמצאו/.test(demo)) said.push('core-demo ' + tag + ' (בלי 15/15)');
  await page.screenshot({ path: join(OUT, 'core-demo-' + tag + '.png') });
  await page.screenshot({ path: join(OUT, 'core-demo-' + tag + '-full.png'), fullPage: true });
  console.log('📸 core-demo ' + tag);
  await page.close();
}
await browser.close();
server.close();
if (said.length) {
  console.error('המילה "חסר" / "נבנה חדש" בדף (או חמנייה בלי 17/17): ' + said.join(', '));
  process.exit(1);
}
if (errors.length) {
  console.error('שגיאות קונסולה:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ אפס שגיאות קונסולה · אין "חסר" בדף · ' + OUT);
