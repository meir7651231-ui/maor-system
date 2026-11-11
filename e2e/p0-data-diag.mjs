/**
 * P0-DATA שלב 0 (7.11.2026) — אבחון אובדן-נתונים במשטר-המכסה (מסמך > localStorage).
 * נתונים סינתטיים בלבד (המחולל של perf-supporters), build מקומי, אפס ענן.
 *   SCALE=16000 DON=5 HIST=8 THROTTLE=4 node e2e/p0-data-diag.mjs
 * בדיקות:
 *  E0 זריעה: האם setItem של המסמך זורק QuotaExceeded; גודל.
 *  E1 עריכה ⇒ סגירת-לשונית אחרי X ms ⇒ פתיחה-מחדש: האם העריכה נשמרה (חלון-אובדן).
 *  E2 שתי לשוניות פתוחות: A עורכת תורם 1, B (שלא רואה) עורכת תורם 2 ⇒ האם עריכת A שרדה (lost-update).
 *  E3 נפח IDB: מסמך + טבעת-צילומים, navigator.storage.estimate().
 */
process.env.PERF_IMPORT = '1';
const { genDb, orgCfg, DB_KEY, IDB_NAME, TODAY, MIME, BLANK_HTML } = await import('./perf-supporters.mjs');
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';
import { CHROME_EXE } from './chrome-path.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(process.env.DIST || join(HERE, '..', 'dist'));
const THROTTLE = +(process.env.THROTTLE || 4);
const PORT = +(process.env.PORT || 8721);
const DELAYS = (process.env.DELAYS || '300,800,1500,2500,4000,8000').split(',').map(Number);
const OUT = resolve(process.env.OUT || join(HERE, '.tmp-p0'));
mkdirSync(OUT, { recursive: true });
const ORG = orgCfg.slug;
const log = (...a) => console.log('[p0]', ...a);

const { db } = genDb();
const seedJson = JSON.stringify({ ...db, savedAt: new Date().toISOString() });
log('seed', { supporters: db.supporters.length, mb: +(Buffer.byteLength(seedJson) / 1e6).toFixed(1) });

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (url === '/__blank.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(BLANK_HTML); }
  if (url === '/__seed.json') { res.setHeader('Content-Type', 'application/json'); return res.end(seedJson); }
  if (url === `/c/${ORG}/config.json`) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(orgCfg)); }
  let p = join(DIST, url);
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const base = `http://127.0.0.1:${PORT}`;
const browser = await chromium.launch({ executablePath: CHROME_EXE, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL', timezoneId: 'UTC' });
const errors = [];

async function blank() {
  const p = await ctx.newPage();
  await p.goto(`${base}/__blank.html`);
  return p;
}
/** זריעה מחדש (אותו מסמך) — LS קודם (כמו לקוח שגדל), IDB כמראה */
async function seed() {
  const p = await blank();
  const r = await p.evaluate(async ({ key, idbName, today, cfg }) => {
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(cfg));
    const ns = (k) => k + ':' + key.split(':')[1];
    localStorage.setItem(ns('maor_day'), today);
    localStorage.setItem(ns('maor_autoexp'), today);
    localStorage.setItem(ns('maor_lsdrop_noticed'), '1');
    const txt = await (await fetch('/__seed.json')).text();
    let lsErr = '';
    try { localStorage.setItem(key, txt); } catch (e) { lsErr = String(e && e.name); }
    const obj = JSON.parse(txt);
    await new Promise((res) => { const d = indexedDB.deleteDatabase(idbName); d.onsuccess = d.onerror = d.onblocked = () => res(); });
    await new Promise((res, rej) => {
      const req = indexedDB.open(idbName, 1);
      req.onupgradeneeded = () => { const d = req.result; d.createObjectStore('db'); d.createObjectStore('snapshots'); };
      req.onerror = () => rej(req.error);
      req.onsuccess = () => { const d = req.result; const tx = d.transaction('db', 'readwrite'); tx.objectStore('db').put(obj, 'current'); tx.oncomplete = () => { d.close(); res(); }; };
    });
    return { lsErr, chars: txt.length };
  }, { key: DB_KEY, idbName: IDB_NAME, today: TODAY, cfg: orgCfg });
  await p.close();
  return r;
}
/** קריאת המצב המאוחסן (IDB current + LS) מדף ריק — בלי קוד-האפליקציה */
async function readStored(ids) {
  const p = await blank();
  const r = await p.evaluate(async ({ key, idbName, ids }) => {
    const ls = localStorage.getItem(key);
    const jr = localStorage.getItem(key.replace(/^maor_db/, 'maor_exitlog'));
    const d = await new Promise((res, rej) => { const q = indexedDB.open(idbName); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const get = (store, k) => new Promise((res) => { const tx = d.transaction(store, 'readonly'); const q = tx.objectStore(store).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); });
    const keys = (store) => new Promise((res) => { const tx = d.transaction(store, 'readonly'); const q = tx.objectStore(store).getAllKeys(); q.onsuccess = () => res(q.result); q.onerror = () => res([]); });
    const cur = await get('db', 'current');
    const src = ls ? JSON.parse(ls) : cur;
    const pick = (doc) => Object.fromEntries(ids.map((id) => [id, doc?.supporters?.find((s) => s.id === id)?.nextNote ?? null]));
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    const snaps = d.objectStoreNames.contains('snapshots') ? await keys('snapshots') : [];
    d.close();
    return { lsPresent: !!ls, journal: jr ? jr.length : 0, lsKeys: Object.keys(localStorage), idbSavedAt: cur?.savedAt ?? null, notes: pick(src), idbNotes: pick(cur), snapshots: snaps, usageMB: est ? +(est.usage / 1e6).toFixed(0) : null, quotaMB: est ? +(est.quota / 1e6).toFixed(0) : null };
  }, { key: DB_KEY, idbName: IDB_NAME, ids });
  await p.close();
  return r;
}
async function openApp() {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  // אבחון: האם pagehide/visibilitychange נורים בסגירה (סימון סינכרוני ב-LS)
  await page.addInitScript(() => {
    addEventListener('pagehide', () => { try { localStorage.setItem('pw_pagehide', String(Date.now())); } catch {} });
    document.addEventListener('visibilitychange', () => { try { localStorage.setItem('pw_vis_' + document.visibilityState, String(Date.now())); } catch {} });
  });
  const t0 = Date.now();
  await page.goto(`${base}/?org=${ORG}`, { waitUntil: 'commit' });
  await page.locator('nav >> text=תורמים').first().waitFor({ timeout: 120000 });
  const loadMs = Date.now() - t0;
  const day = page.locator('.modal-back button', { hasText: 'פתיחת יום' });
  if (await day.count()) await day.first().click();
  await page.locator('nav >> text=תורמים').first().click();
  await page.locator('input[aria-label="חיפוש"]').waitFor({ timeout: 120000 });
  return { page, loadMs };
}
/** פתיחת תורם לפי חיפוש-ת"ז/שם ⇒ כתיבת nextNote ⇒ blur. מחזיר את זמן-ה-blur */
async function editNote(page, spName, marker) {
  const search = page.locator('input[aria-label="חיפוש"]');
  await search.fill(spName);
  await page.waitForTimeout(1500);
  await page.locator('main table.table tbody tr').first().click();
  const ta = page.locator('main textarea[placeholder^="למשל: לעדכן"]').first();
  await ta.waitFor({ timeout: 60000 });
  await ta.click();
  await ta.fill(marker);
  await page.keyboard.press('Tab');
  return Date.now();
}
// מזהים ושמות ייחודיים לבדיקה (שם מלא + מזהה ⇒ חיפוש-יחיד)
const sp = (i) => db.supporters[i];
// שם ייחודי: מוסיפים את המזהה לשם במסמך-הזרע כדי שהחיפוש יחזיר שורה אחת
for (const i of [0, 1, 2]) db.supporters[i].name = `בדיקה${i} ${db.supporters[i].name}`;
const seedJson2 = JSON.stringify({ ...db, savedAt: new Date().toISOString() });
const result = { scale: db.supporters.length, throttle: THROTTLE, mb: +(Buffer.byteLength(seedJson2) / 1e6).toFixed(1), E0: null, E1: [], E2: null, E3: null };
server.removeAllListeners('request');
server.on('request', (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (url === '/__blank.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(BLANK_HTML); }
  if (url === '/__seed.json') { res.setHeader('Content-Type', 'application/json'); return res.end(seedJson2); }
  if (url === `/c/${ORG}/config.json`) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(orgCfg)); }
  let p = join(DIST, url);
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});

// E0
result.E0 = await seed();
log('E0', JSON.stringify(result.E0));

// E1 — חלון-אובדן בסגירת-לשונית
for (const ms of DELAYS) {
  await seed();
  const { page, loadMs } = await openApp();
  const marker = 'E1-' + ms + '-' + Date.now();
  await editNote(page, 'בדיקה0', marker);
  await page.waitForTimeout(ms);
  await page.close({ runBeforeUnload: true }); // סגירת-לשונית: pagehide ⇒ flushSaveSync
  await new Promise((r) => setTimeout(r, 1500));
  const raw = await readStored([sp(0).id]); // מה שבאחסון
  // ↑ מיד אחרי הסגירה (בלי האפליקציה)
  if (process.env.DEBUG_CLEAR) { const b = await blank(); await b.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('pw_')) localStorage.removeItem(k); }); await b.close(); }
  const re = await openApp();
  await re.page.waitForTimeout(6000);
  await re.page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 1500));
  const st = await readStored([sp(0).id]);
  const kept = st.notes[sp(0).id] === marker;
  const keptRaw = raw.notes[sp(0).id] === marker;
  result.E1.push({ closeAfterMs: ms, kept, keptInIdbRightAfterClose: keptRaw, loadMs, lsPresent: st.lsPresent });
  log('E1', ms + 'ms', kept ? 'נשמר' : '❌ אבד', JSON.stringify({ loadMs, idbRightAfterClose: keptRaw, journalAfterClose: raw.journal, keys: raw.lsKeys.filter((k) => /pw_|exitlog/.test(k)), ls: st.lsPresent }));
}

// E2 — שתי לשוניות (lost-update)
{
  await seed();
  const A = await openApp();
  const B = await openApp();
  const mA = 'E2-A-' + Date.now();
  await editNote(A.page, 'בדיקה1', mA);
  await A.page.waitForTimeout(10000); // A נשמרה במלואה
  const afterA = await readStored([sp(1).id, sp(2).id]);
  const mB = 'E2-B-' + Date.now();
  await editNote(B.page, 'בדיקה2', mB); // B לא ראתה את עריכת A
  await B.page.waitForTimeout(10000);
  const afterB = await readStored([sp(1).id, sp(2).id]);
  // האם B עצמה רואה את עריכת A? (חיפוש בזיכרון-הטאב)
  await A.page.close(); await B.page.close();
  await new Promise((r) => setTimeout(r, 1500));
  const fin = await readStored([sp(1).id, sp(2).id]);
  result.E2 = { aSavedAlone: afterA.notes[sp(1).id] === mA, bothAfterB: { A: afterB.notes[sp(1).id] === mA, B: afterB.notes[sp(2).id] === mB }, final: { A: fin.notes[sp(1).id] === mA, B: fin.notes[sp(2).id] === mB } };
  log('E2', JSON.stringify(result.E2));
}

// E3 — נפח
{
  const st = await readStored([]);
  result.E3 = { snapshots: st.snapshots, usageMB: st.usageMB, quotaMB: st.quotaMB };
  log('E3', JSON.stringify(result.E3));
}
result.errors = [...new Set(errors)].slice(0, 20);
writeFileSync(join(OUT, `p0-diag-s${result.scale}-t${THROTTLE}.json`), JSON.stringify(result, null, 2));
console.log('📊 P0 ' + JSON.stringify(result));
await browser.close();
server.close();
