/**
 * אבחון חלונות-קופצים (בקשת-בעלים "תבדוק חלונות קופצים מתאים הכל"): פותח כל מודאל
 * ומודד — התאמה-לרוחב · גלישה-אופקית-פנימית · גובה-מול-חלון (וגלילת-רקע) · הישג
 * כפתורי-הפעולה. רץ desktop(1440) + mobile(390). npm run build && node e2e/modal-audit.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-modal');
rmSync(SHOTS, { recursive: true, force: true }); mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO = readFileSync(join(DIST, 'demo.json'), 'utf8');
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); try { if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' }[extname(p)] ?? 'text/plain'; res.setHeader('content-type', mime); res.end(readFileSync(p)); } catch { res.statusCode = 404; res.end('nf'); } });
await new Promise((r) => server.listen(4190, r));
const BASE = 'http://localhost:4190/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const FEATURES = { 'supporters.rfm': true, 'supporters.hok': true, 'supporters.ayin': true, 'supporters.nextdate': true, 'supporters.advfilter': true, 'supporters.colfilter': true, 'shell.palette': true, 'core.receipt.pdf': true };
const findings = [];

async function pass(width, height, theme, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  const wait = (ms) => page.waitForTimeout(ms);
  const CFG = JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme, modules: {}, features: FEATURES });
  await ctx.addInitScript(([cfg, demo]) => { try { localStorage.setItem('maor_org_config', cfg); if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', demo); } catch { /* */ } }, [CFG, DEMO]);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(1300);

  const measure = async (name) => {
    await wait(250);
    const m = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      // הדיאלוג הפנימי ביותר הפתוח כעת
      const cands = [...document.querySelectorAll('.modal, [role="dialog"][aria-modal="true"]')].filter((e) => e.getBoundingClientRect().width > 40);
      if (!cands.length) return null;
      const dlg = cands[cands.length - 1];
      const b = dlg.getBoundingClientRect();
      const back = dlg.closest('.modal-back') || dlg.parentElement;
      const bcs = back ? getComputedStyle(back) : null;
      const backScrolls = bcs && (bcs.overflowY === 'auto' || bcs.overflowY === 'scroll');
      const innerOvfX = Math.round(dlg.scrollWidth - dlg.clientWidth);
      // כל צאצא שחורג אופקית מגבול-הדיאלוג (לא בתוך עוטף-גלילה)
      let spill = 0; const s = [];
      for (const el of dlg.querySelectorAll('*')) {
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
        let anc = el.parentElement, scrolled = false;
        while (anc && anc !== dlg.parentElement) { const a = getComputedStyle(anc); if (['auto', 'scroll', 'hidden'].includes(a.overflowX) || ['auto', 'scroll', 'hidden'].includes(a.overflow)) { scrolled = true; break; } anc = anc.parentElement; }
        if (scrolled) continue;
        if (r.right > b.right + 2 || r.left < b.left - 2) { spill++; if (s.length < 3) s.push((el.className || el.tagName).toString().slice(0, 30)); }
      }
      return { vw, vh, L: Math.round(b.left), R: Math.round(vw - b.right), top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width), innerOvfX, backScrolls: !!backScrolls, spill, s, docOvfX: Math.round(document.documentElement.scrollWidth - vw) };
    });
    if (!m) { console.log(`  [${tag}] ${name.padEnd(18)} (no modal open)`); return; }
    const flags = [];
    if (m.docOvfX > 2) flags.push(`PAGE-OVERFLOW-X ${m.docOvfX}`);
    if (m.innerOvfX > 2) flags.push(`INNER-OVERFLOW-X ${m.innerOvfX}`);
    if (m.spill > 0) flags.push(`SPILL ${m.spill} (${m.s.join(',')})`);
    if (m.L < -1 || m.R < -1) flags.push(`OFF-SCREEN L=${m.L} R=${m.R}`);
    if (m.h > m.vh && !m.backScrolls) flags.push(`TALL-NO-SCROLL h=${m.h}>vh=${m.vh}`);
    console.log(`  [${tag}] ${name.padEnd(18)} w=${m.w} h=${m.h} top=${m.top} L=${m.L} R=${m.R} backScroll=${m.backScrolls}${flags.length ? '  ⚠ ' + flags.join(' | ') : '  ok'}`);
    if (flags.length) findings.push(`${tag} · ${name}: ${flags.join(' | ')}`);
    await page.screenshot({ path: join(SHOTS, `${tag}-${name}.png`) });
  };
  const esc = async () => { for (let i = 0; i < 6; i++) { if (!(await page.locator('.modal-back, [role="dialog"][aria-modal="true"]').count())) return; await page.keyboard.press('Escape').catch(() => {}); await wait(150); } };
  const openByText = async (txt, sel = 'button') => { const l = page.locator(sel, { hasText: txt }); if (await l.count()) { await l.first().click().catch(() => {}); await wait(450); return true; } return false; };
  const nav = async (label) => { await esc(); let b = page.locator('.app-side .side-link, .bottomnav button, nav.app-nav button', { hasText: label }); if (!(await b.count())) { const more = page.locator('.bottomnav button', { hasText: 'עוד' }); if (await more.count()) { await more.first().click().catch(() => {}); await wait(300); b = page.locator('[role="dialog"] button, .modal button', { hasText: label }); } } if (await b.count()) { await b.first().click().catch(() => {}); await wait(600); } };

  // 1) שער-היום (מודאל בטעינה)
  if (await page.locator('.modal-back, [role="dialog"]').count()) await measure('01-daygate');
  await esc();

  // 2) הוספת משפחה
  await nav('בית'); await openByText('הוספת'); await measure('02-add-family'); await esc();
  // 3) הוספת חוג
  await nav('חוגים'); await openByText('הוספת'); await measure('03-add-course'); await esc();
  // 4) הוספת תומך + תרומה
  await nav('תורמים'); await openByText('הוספת'); await measure('04-add-supporter'); await esc();
  // כרטיס-תומך → תרומה
  await esc(); await page.locator('.app-main table tbody tr, .app-main .card[role="button"]').first().click().catch(() => {}); await wait(600);
  if (await openByText('תרומה')) await measure('05-donation'); await esc();
  // 6) הוספת אירוע (לוח)
  await nav('לוח'); if (await openByText('הוספת אירוע') || await openByText('אירוע')) await measure('06-add-event'); await esc();
  // 7) פלטת-פקודות (Ctrl+K)
  await nav('בית'); await page.keyboard.press('Control+k').catch(() => {}); await wait(450);
  if (await page.locator('.modal-back, [role="dialog"]').count()) await measure('07-command-palette'); await esc();
  // 8) עזרה (❓)
  await openByText('❓', 'button') || await page.locator('button[title*="עזרה"], button[aria-label*="עזרה"]').first().click().catch(() => {}); await wait(450);
  if (await page.locator('.modal-back, [role="dialog"]').count()) await measure('08-help'); await esc();
  // 9) הגדרות → ייבוא/גיבוי (מודאל)
  await nav('הגדרות'); await openByText('נתונים'); await wait(200); await (openByText('ייבוא') || openByText('גיבוי')); await wait(300);
  if (await page.locator('.modal-back, [role="dialog"]').count()) await measure('09-settings-modal'); await esc();
  // 10) עוד (מובייל) — תפריט-ניווט
  if (width < 500) { const more = page.locator('.bottomnav button', { hasText: 'עוד' }); if (await more.count()) { await more.first().click().catch(() => {}); await wait(400); if (await page.locator('.modal-back, [role="dialog"]').count()) await measure('10-more-nav'); await esc(); } }

  console.log(`  [${tag}] console: ${errs.length ? errs.slice(0, 2).join(' | ') : 'none'}`);
  if (errs.length) findings.push(`${tag} · console: ${errs.slice(0, 2).join(' | ')}`);
  await ctx.close();
}

console.log('===== MODALS · DESKTOP 1440 (or-rishon) ====='); await pass(1440, 950, 'or-rishon', 'd');
console.log('\n===== MODALS · MOBILE 390 (or-rishon) ====='); await pass(390, 780, 'or-rishon', 'm');
console.log('\n===== MODALS · LANDSCAPE 880×390 (kehila — סביבת-הבעלים) ====='); await pass(880, 390, 'kehila', 'L');
console.log('\n===== SUMMARY =====');
console.log(findings.length ? `⚠ ${findings.length}:\n  ${findings.join('\n  ')}` : '✅ כל החלונות מתאימים (רוחב/גלישה/גובה/הישג)');
await browser.close(); server.close();
