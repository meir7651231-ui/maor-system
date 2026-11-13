// הפעלה 158: מצבי הטעינה של /app/ מול שרת גבי אמיתי (DEMO=1, dry-run).
//   1) שלד הטעינה של המסך בצורת המסך המבוקש (סקירה / חשבוניות / תשובות / הגדרות), צורות בלבד.
//   2) חלון «תצוגה ואישור» בזמן שהנוסח נטען: שלד, בלי שלב / מועד / נוסח שנגזרו מהמוק, ובלי אפשרות לאשר.
//   3) נוסח שלא נטען: הודעה ו«נסו שוב», בלי נוסח ובלי אפשרות לאשר.
//   4) ערוץ שאין לו הודעה בתזכורת: «לא יישלח מייל», ולא מייל שנבנה מהמוק.
//   5) הפעלה 160: התזכורת הוחלפה באחרת (מזהה חדש) בזמן שהחלון פתוח ⇒ הנוסח הקודם יורד מיד, שלד בלי אישור,
//      ואז הנוסח החדש. הכול רץ פעמיים: דסקטופ ומובייל (390), כולל בדיקת גלילה רוחבית כשהחלון פתוח.
// דרישה: npm run build. הרצה: node e2e/preview.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, makeInject, srvStdio, srvLogLevel } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8147, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-preview') });
process.on('exit', () => srv.kill());
const ok = (c, m) => { if (!c) throw new Error(m); };
const routeErrors = [];
const inject = makeInject(routeErrors);
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); }

const errors = [];
let expect503 = 0, seen503 = 0, console503 = 0, expectCut = 0, seenCut = 0;
const H = { Authorization: `Bearer ${TOKEN}` };
const FAKE = 987654;   // מזהה של התזכורת «החדשה» בסעיף 5 (קיים רק ביירוט)
const b = await chromium.launch();
try {
 for (const [vp, viewport] of [['דסקטופ', { width: 1366, height: 900 }], ['מובייל', { width: 390, height: 844 }]]) {
  const sfx = vp === 'מובייל' ? '-mobile' : '';
  expect503 = seen503 = console503 = expectCut = seenCut = 0;
  const p = await b.newPage({ viewport });
  const noScroll = async what => ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${vp} · ${what}: גלילה רוחבית`);
  p.on('pageerror', e => errors.push(String(e)));
  p.on('response', r => {
    if (r.status() < 400 || !r.url().startsWith(base)) return;
    if (r.status() === 503 && seen503 < expect503 && /\/reminders\/\d+\/preview$/.test(r.url())) { seen503++; return; }
    errors.push(`${r.status()} לא צפוי: ${r.url()}`);
  });
  p.on('console', m => {
    if (m.type() !== 'error' || /fonts\.g/.test(m.text())) return;
    if (/status of 503/.test(m.text()) && console503 < expect503) { console503++; return; }
    if (/ERR_FAILED/.test(m.text()) && seenCut < expectCut) { seenCut++; return; }
    errors.push(m.text());
  });
  await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
  await p.getByTestId('kpis').waitFor();

  // 1) שלד לפי המסך המבוקש. מאטים את /health כדי לתפוס את חלון הטעינה.
  await inject(p, '**/health', async route => { await new Promise(r => setTimeout(r, 900)); await route.continue(); });
  const SHAPES = [['invoices', 'sk-table', 1], ['inbox', 'sk-msg', 3], ['settings', 'sk-form', 2], ['dashboard', null, 0]];
  for (const [route, part, n] of SHAPES) {
    await p.goto(`${base}/app/#/${route}`); await p.reload();
    const sk = p.getByTestId('app-skeleton');
    await sk.waitFor();
    ok(await sk.getAttribute('data-shape') === route, `שלד ${route}: צורה של מסך אחר (${await sk.getAttribute('data-shape')})`);
    ok(await sk.getAttribute('aria-hidden') === 'true' && (await sk.textContent()).trim() === '', `שלד ${route}: חשוף לקורא מסך או מכיל טקסט`);
    ok((await p.getByTestId('app-loading').textContent()).trim() === 'טוען נתונים…', `שלד ${route}: אין הכרזת טעינה אחת`);
    if (part) ok(await sk.getByTestId(part).count() === n, `שלד ${route}: חסר ${part}`);
    else ok(await sk.locator('[data-testid^="sk-"]').count() === 0, 'שלד הסקירה מכיל חלקים של מסך אחר');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `שלד ${route}: גלילה רוחבית`);
    if (out) await p.screenshot({ path: `${out}/preview-01-skeleton-${route}${sfx}.png` });
    await sk.waitFor({ state: 'detached' });
  }
  await p.unroute('**/health');
  await p.getByTestId('kpis').waitFor();
  console.log('  ✓ שלד הטעינה בצורת המסך המבוקש: חשבוניות, תשובות, הגדרות, סקירה');

  // 2) חלון התצוגה המקדימה בזמן טעינת הנוסח
  let release, mode = 'hold', release2;
  const held2 = new Promise(r => { release2 = r; });
  const held = new Promise(r => { release = r; });
  await inject(p, '**/reminders/*/preview', async route => {
    if (route.request().url().includes(`/reminders/${FAKE}/preview`)) {   // סעיף 5: התזכורת «החדשה»
      await held2;
      const j = await (await fetch(`${base}/reminders/${realId}/preview`, { headers: H })).json();
      j.reminder_id = FAKE; j.body_hash = 'f'.repeat(64);
      for (const m of j.messages) m.body = m.body.replace('שלום', 'שלום (נוסח חדש)');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
    }
    if (mode === 'hold') { await held; return route.continue(); }
    if (mode === 'fail') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"unavailable"}' });
    if (mode === 'sms-only') {
      const res = await route.fetch(); const j = await res.json();
      ok(j.messages.some(m => m.channel === 'email') && j.messages.some(m => m.channel === 'sms'), 'לתזכורת הדמו אין SMS ומייל');
      j.messages = j.messages.filter(m => m.channel === 'sms');
      return route.fulfill({ response: res, json: j });
    }
    return route.continue();
  });
  const realId = (await (await fetch(`${base}/reminders?status=pending_approval&view=summary`, { headers: H })).json()).find(r => r.total_text === '3,450.50 ₪')?.id;
  ok(realId, 'אין בדמו תזכורת ממתינה על 3,450.50 ₪ (יוסי)');
  const items = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) });
  const open = () => items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  const dlg = p.getByRole('dialog'), approve = dlg.getByRole('button', { name: /אשר ושלח/ });
  await open();
  await p.getByTestId('mp-loading').waitFor();
  ok((await p.getByTestId('mp-loading').textContent()).trim() === 'טוען תצוגה מקדימה…' && await p.getByTestId('mp-loading').getAttribute('role') === 'status', 'אין הכרזת טעינה אחת לתצוגה המקדימה');
  ok(await p.getByTestId('mp-skeleton').getAttribute('aria-hidden') === 'true' && (await p.getByTestId('mp-skeleton').textContent()).trim() === '', 'שלד התצוגה חשוף לקורא מסך או מכיל טקסט');
  ok(await dlg.getAttribute('aria-busy') === 'true', 'החלון לא מסומן aria-busy בזמן הטעינה');
  ok(await dlg.locator('textarea').count() === 0 && await dlg.getByRole('tab').count() === 0 && await dlg.locator('fieldset').count() === 0,
    'בזמן הטעינה מוצגים נוסח, לשוניות או שלב שלא הגיעו מהשרת');
  ok(await dlg.getByText('יישלח:').count() === 0 && await dlg.getByText('הודעה אוטומטית מטעם').count() === 0, 'בזמן הטעינה מוצגים מועד או מייל מהמוק');
  ok(await approve.isDisabled() && (await approve.textContent()).trim() === '✓ אשר ושלח', 'בזמן הטעינה אפשר לאשר, או שהכפתור מציין ערוצים שלא הגיעו מהשרת');
  ok(await dlg.getByTestId('confirm-open').count() === 0 && await dlg.getByTestId('confirm-amount').count() === 0, 'תיבת «בדקתי» מוצגת לפני שהנוסח נטען');
  ok((await dlg.locator('#mp-title').textContent()).includes('יוסי'), 'כותרת החלון בלי שם הלקוח בזמן הטעינה');
  await noScroll('חלון התצוגה בטעינה');
  if (out) await p.screenshot({ path: `${out}/preview-02-loading${sfx}.png` });
  mode = 'pass'; release();
  await p.getByTestId('mp-loading').waitFor({ state: 'detached' });
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(await dlg.getAttribute('aria-busy') === null && await approve.isEnabled(), 'אחרי הטעינה החלון עדיין busy או שאי אפשר לאשר');
  ok(/אשר ושלח ב/.test(await approve.textContent()), 'אחרי הטעינה הכפתור לא מציין ערוצים');
  await noScroll('חלון התצוגה עם הנוסח');
  ok(await approve.isVisible() && await p.evaluate(() => { const r = [...document.querySelectorAll('[role=dialog] footer button')].at(-1).getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), `${vp}: כפתור האישור מחוץ למסך`);
  await p.keyboard.press('Escape'); await dlg.waitFor({ state: 'detached' });
  console.log('  ✓ תצוגה מקדימה בטעינה: שלד, בלי תוכן מהמוק, בלי אישור; אחרי התשובה הנוסח מהשרת');

  // 3) הנוסח לא נטען ⇒ הודעה ו«נסו שוב»
  mode = 'fail'; expect503 = 1;
  await open();
  await p.getByTestId('mp-error').waitFor();
  ok(await p.getByTestId('mp-error').getAttribute('role') === 'alert', 'כשל הטעינה לא מוכרז לקורא מסך');
  ok(await dlg.locator('textarea').count() === 0 && await dlg.getByRole('tab').count() === 0 && await approve.isDisabled(), 'אחרי כשל טעינה מוצג נוסח או שאפשר לאשר');
  ok(await p.getByTestId('mp-loading').count() === 0 && await dlg.getAttribute('aria-busy') === null, 'אחרי כשל טעינה השלד נשאר');
  await noScroll('חלון התצוגה בכשל');
  if (out) await p.screenshot({ path: `${out}/preview-03-error${sfx}.png` });
  mode = 'pass';
  await p.getByTestId('mp-retry').click();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(await p.getByTestId('mp-error').count() === 0 && await approve.isEnabled(), 'אחרי «נסו שוב» ההודעה נשארה או שאי אפשר לאשר');
  ok(seen503 === 1 && console503 === 1, `כשל הטעינה המכוון לא נספר (${seen503}/${console503})`);
  await p.keyboard.press('Escape'); await dlg.waitFor({ state: 'detached' });
  console.log('  ✓ תצוגה מקדימה שלא נטענה: הודעה, «נסו שוב» טוען את הנוסח');

  // 4) תזכורת בלי מייל ⇒ הלשונית אומרת שלא יישלח מייל (עד עכשיו: מייל שנבנה מהמוק)
  mode = 'sms-only';
  await open();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(await dlg.getByTestId('mp-no-channel').count() === 0, 'לשונית ה-SMS מציגה «לא יישלח» אף שיש SMS');
  await dlg.getByRole('tab', { name: /מייל/ }).click();
  ok((await dlg.getByTestId('mp-no-channel').textContent()).trim() === 'בתזכורת הזו לא יישלח מייל.', 'לשונית המייל בלי ההודעה «לא יישלח מייל»');
  ok(await dlg.getByText('הודעה אוטומטית מטעם').count() === 0 && await dlg.getByText('לתשלום').count() === 0, 'מוצג מייל שלא יישלח');
  ok(/אשר ושלח ב-SMS$/.test((await approve.textContent()).trim()), 'כפתור האישור לא מציין SMS בלבד: ' + await approve.textContent());
  if (out) await p.screenshot({ path: `${out}/preview-04-no-mail${sfx}.png` });
  await p.keyboard.press('Escape'); await dlg.waitFor({ state: 'detached' });
  console.log('  ✓ ערוץ בלי הודעה: «בתזכורת הזו לא יישלח מייל»');

  // 5) התזכורת הוחלפה באחרת בזמן שהחלון פתוח. האישור נקטע ברשת ⇒ «הנתונים לא עודכנו» ⇒ רענון אוטומטי, ובו
  //    לתזכורת של יוסי כבר מזהה אחר. עד שהנוסח שלה נטען: שלד, בלי הנוסח הקודם ובלי אפשרות לאשר.
  mode = 'pass';
  await open();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(!(await dlg.locator('textarea').inputValue()).includes('(נוסח חדש)'), 'הנוסח ההתחלתי כבר מסומן כחדש');
  await inject(p, '**/reminders?status=pending_approval*', async route => {
    const res = await route.fetch(); const rows = await res.json();
    const row = rows.find(r => r.id === realId);
    ok(row, 'התזכורת של יוסי לא ברשימת הממתינות');
    row.id = FAKE;
    return route.fulfill({ response: res, json: rows });
  });
  await inject(p, '**/reminders/*/approve', route => route.abort('failed'));
  expectCut = 1;
  await approve.click();
  await p.getByTestId('mp-loading').waitFor({ timeout: 20000 });
  ok(await dlg.locator('textarea').count() === 0 && await dlg.getByRole('tab').count() === 0, `${vp}: הנוסח של התזכורת הקודמת נשאר על המסך אחרי שהוחלפה`);
  ok(await approve.isDisabled() && (await approve.textContent()).trim() === '✓ אשר ושלח', `${vp}: אפשר לאשר לפני שהנוסח של התזכורת החדשה נטען`);
  ok(await dlg.getAttribute('aria-busy') === 'true', `${vp}: החלון לא busy בזמן טעינת התזכורת החדשה`);
  if (out) await p.screenshot({ path: `${out}/preview-05-replaced${sfx}.png` });
  release2();
  await p.waitForFunction(() => (document.querySelector('textarea')?.value ?? '').includes('(נוסח חדש)'));
  ok(await approve.isEnabled() && await p.getByTestId('mp-loading').count() === 0, `${vp}: אחרי טעינת התזכורת החדשה אי אפשר לאשר`);
  ok(seenCut === 1, `${vp}: האישור שנקטע לא נספר`);
  await p.unroute('**/reminders/*/approve'); await p.unroute('**/reminders?status=pending_approval*'); await p.unroute('**/reminders/*/preview');
  await p.close();
  console.log(`  ✓ תזכורת שהוחלפה בזמן שהחלון פתוח: שלד בלי הנוסח הקודם ובלי אישור, ואז הנוסח החדש · ${vp}`);
 }

  errors.push(...routeErrors);
  if (errors.length) throw new Error('שגיאות:\n' + errors.join('\n'));
  console.log('✓ מצבי הטעינה של /app/ עברו · 0 שגיאות לא צפויות');
} finally { await b.close(); srv.kill(); }
