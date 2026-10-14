#!/usr/bin/env node
/**
 * 📸 צילומי המעבדה (COMBINER, 14.10.2026): 390×844 ו-1280×800 ל"חמנייה" ולשתי מילים אקראיות (זרע קבוע).
 *   node catalog/combiner/shots.mjs   ⇒ knowledge/shots/combiner-2026-10-14/
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
const OUT = join(ROOT, 'knowledge/shots/combiner-2026-10-14');
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' };

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
const randoms = [];
for (let seed = 7; randoms.length < 2; seed++) {
  const w = pickWord(goals, seed).word;
  if (w !== 'חמנייה' && !randoms.includes(w)) randoms.push(w);
}
const words = [['sunflower', 'חמנייה'], ['random-1', randoms[0]], ['random-2', randoms[1]], ['unknown', 'בננה']];
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
    await page.screenshot({ path: join(OUT, slug + '-' + tag + '.png') });
    await page.screenshot({ path: join(OUT, slug + '-' + tag + '-full.png'), fullPage: true });
    console.log('📸 ' + slug + ' (' + word + ') ' + tag);
  }
  await page.close();
}
await browser.close();
server.close();
if (errors.length) {
  console.error('שגיאות קונסולה:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ אפס שגיאות קונסולה · ' + OUT);
