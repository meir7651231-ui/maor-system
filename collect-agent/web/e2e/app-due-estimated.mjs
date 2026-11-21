// גבי עיצוב (משימת מקשר על d018a41): «מועד מוערך» — במסמך לא היה מועד ⇒ השרת חישב הנפקה+30 (due_estimated).
// מול שרת DEMO=1 אמיתי (OPEN_REVIEW=1), ייבוא CSV עם תאריך מסמך בלי מועד תשלום:
//  • תג «מועד מוערך» + הסבר ברשימת הפתוחות, בטבלת החשבוניות ובתצוגת התזכורת; חשבונית עם מועד — בלי תג
//  • 409 אמיתי (החשבונית נסגרה בינתיים) ⇒ ההודעה בעברית בכרטיס
//  • תיקון מועד + «עדיין פתוח» ⇒ השרת שומר את המועד, due_estimated=false, התג נעלם
//  • דסקטופ + 390px: בלי גלילה רוחבית, שדה התאריך ≥40px, AA, 0 שגיאות קונסולה. הרצה: node e2e/app-due-estimated.mjs [צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8179, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OPEN_REVIEW: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-due-estimated') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
await waitHealthy(base, srv);
const errors = [], expected409 = [];
const b = await launchChromium(chromium);
try {
  const csv = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n'
    + '9301,טל מוערך,050-0000301,700,2026-10-01,\n9302,רון מוערך,050-0000302,800,2026-10-02,\n9303,נוי סגורה,050-0000303,900,2026-10-03,\n'
    + '9304,דנה עם מועד,050-0000304,400,2026-10-04,2026-11-01\n';
  await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(csv, 'utf8') });
  const pend = (await api('/open-list')).pending, byNum = n => pend.find(x => x.number === n);
  ok(byNum('9301')?.due_estimated === true && byNum('9301').due === '2026-10-31', 'השרת: 9301 לא מוערכת/לא הנפקה+30: ' + JSON.stringify(byNum('9301')));
  ok(byNum('9304')?.due_estimated === false, 'השרת: 9304 עם מועד מסומנת מוערכת');

  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/409/.test(m.text())) errors.push(`console: ${m.text()}`); });
    p.on('response', r => { if (r.status() === 409 && r.url().endsWith('/open-list/confirm')) expected409.push(r.url()); else if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  };
  const aa = async (p, where) => { const { fails } = await scan(p); ok(!fails.length, `ניגודיות < AA ב-${where}: ` + JSON.stringify(fails.slice(0, 3))); };
  const noH = async (p, where) => ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `גלילה רוחבית: ${where}`);
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage(); watch(p);
  await p.goto(`${base}/app/#/dashboard`);
  const row = n => p.getByTestId(`open-item-${n}`);
  await row('9301').waitFor();
  // תג + הסבר + שדה תיקון רק למוערכות
  for (const n of ['9301', '9302', '9303']) {
    ok(await p.getByTestId(`due-fix-${n}`).count() === 1, `אין שדה תיקון ל-${n}`);
    ok(/הנפקה \+ 30 יום/.test(await p.getByTestId(`due-fix-${n}`).textContent()), `אין הסבר ל-${n}`);
  }
  ok(await p.getByTestId('due-fix-9304').count() === 0, 'שדה תיקון לחשבונית עם מועד');
  ok(await p.getByTestId('due-input-9301').inputValue() === '2026-10-31', 'השדה לא מאותחל במועד המוערך');
  await aa(p, 'רשימת הפתוחות'); await noH(p, 'רשימת הפתוחות דסקטופ');
  if (out) await p.getByTestId('open-list').screenshot({ path: `${out}/due-estimated-openlist-desktop.png` });
  // טבלת החשבוניות: תג ליד המועד של המוערכות בלבד
  await p.goto(`${base}/app/#/invoices`); await p.getByTestId('due-estimated').first().waitFor();
  const tagged = await p.locator('tr', { has: p.getByTestId('due-estimated') }).allTextContents();
  ok(tagged.some(t => t.includes('טל מוערך')) && !tagged.some(t => t.includes('דנה עם מועד')), 'תגי הטבלה: ' + tagged.length);
  await aa(p, 'חשבוניות');
  // 409 אמיתי: 9303 נסגרת בשרת בינתיים ⇒ «עדיין פתוח» עליה נדחה עם הודעה בעברית בכרטיס
  await p.goto(`${base}/app/#/dashboard`); await row('9303').waitFor();
  await row('9303').getByRole('button', { name: 'עדיין פתוח' }).click();
  await api('/open-list/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ still_open: [], paid: [byNum('9303').id] }) });
  await p.getByTestId('open-list-confirm').click();
  await p.getByTestId('open-list-error').waitFor();
  const e409 = await p.getByTestId('open-list-error').textContent();
  ok(/חשבונית 9303 לא קיימת או לא פתוחה/.test(e409) && expected409.length === 1, '409 בכרטיס (עם מספר החשבונית): ' + e409);
  if (out) await p.getByTestId('open-list').screenshot({ path: `${out}/due-estimated-409.png` });
  // תיקון: 9301 ⇒ 15.11 + «עדיין פתוח»; 9302 «עדיין פתוח» בלי תיקון (נשאר מוערך — לבדיקת התצוגה)
  await p.reload(); await row('9301').waitFor();
  await p.getByTestId('due-input-9301').fill('2026-11-15');
  await row('9301').getByRole('button', { name: 'עדיין פתוח' }).click();
  await row('9302').getByRole('button', { name: 'עדיין פתוח' }).click();
  const post = p.waitForRequest(r => r.url().endsWith('/open-list/confirm') && r.method() === 'POST');
  await p.getByTestId('open-list-confirm').click();
  const body = JSON.parse((await post).postData());
  ok(JSON.stringify(body.due) === JSON.stringify({ [byNum('9301').id]: '2026-11-15' }), 'גוף due: ' + JSON.stringify(body));
  await p.getByTestId('toast').filter({ hasText: 'מועדים תוקנו' }).waitFor();
  const inv = (await api('/dashboard')).invoices;
  const r1 = inv.find(x => x.number === '9301'), r2 = inv.find(x => x.number === '9302');
  ok(r1.due === '2026-11-15' && r1.due_estimated === false && r2.due_estimated === true, 'השרת אחרי תיקון: ' + JSON.stringify([r1, r2].map(x => [x.due, x.due_estimated])));
  // תצוגת התזכורת: 9302 (מוערכת שאושרה) ⇒ תג + הסבר בכותרת
  await api('/plan', { method: 'POST' });
  const rem = (await api('/reminders')).filter(r => (r.numbers || [r.number]).includes('9302'));
  ok(rem.length, 'לא נוצרה תזכורת ל-9302 אחרי האישור');
  await p.reload();   // אותו hash ⇒ goto לא טוען מחדש; התזכורת נוצרה ב-API
  await p.getByTestId('queue-find').fill('רון מוערך');
  const qrow = p.locator('li', { hasText: 'רון מוערך' }).filter({ has: p.getByRole('button', { name: 'תצוגה ואישור' }) }).first(); await qrow.waitFor();
  ok(await qrow.getByTestId('due-estimated').count() === 1, 'אין תג בשורת התור');
  await qrow.getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.getByTestId('mp-sub').getByTestId('due-estimated').waitFor();
  ok(/הנפקה \+ 30 יום/.test(await p.getByTestId('mp-sub').textContent()), 'אין הסבר בתצוגת התזכורת');
  await aa(p, 'תצוגת התזכורת');
  if (out) await p.getByTestId('mp-sub').screenshot({ path: `${out}/due-estimated-preview.png` });
  await ctx.close();
  // מובייל 390px: חשבונית מוערכת חדשה ⇒ שדה תקין
  await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' },
    body: Buffer.from('מספר חשבונית,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n9305,גיל מוערך,050-0000305,500,2026-10-05,\n', 'utf8') });
  const m = await b.newContext({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const mp = await m.newPage(); watch(mp);
  await mp.goto(`${base}/app/#/dashboard`); await mp.getByTestId('due-input-9305').waitFor();
  const ib = await mp.getByTestId('due-input-9305').boundingBox();
  ok(ib && ib.height >= 40 && ib.x >= 0 && ib.x + ib.width <= 390, 'מובייל: שדה התאריך: ' + JSON.stringify(ib));
  await noH(mp, 'רשימת הפתוחות 390'); await aa(mp, 'רשימת הפתוחות 390');
  if (out) await mp.getByTestId('open-item-9305').screenshot({ path: `${out}/due-estimated-mobile.png` });
  await m.close();
  // /ui (דשבורד פשוט): תג+הסבר ושדה תיקון ברשימת הפתוחות, תג בטבלת החובות; בהיר+כהה, 390px; תיקון נשמר בשרת
  await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' },
    body: Buffer.from('מספר חשבונית,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n9306,עדי מוערכת,050-0000306,600,2026-10-06,\n', 'utf8') });
  for (const scheme of ['light', 'dark']) for (const [w, h] of [[1280, 900], [390, 844]]) {
    const uc = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    await uc.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const up = await uc.newPage(); watch(up);
    await up.goto(`${base}/ui`);
    const li = up.locator('#olList li', { hasText: '9306' }); await li.waitFor();
    ok(/מועד מוערך/.test(await li.textContent()) && /הנפקה \+ 30 יום/.test(await li.textContent()), `/ui ${scheme} ${w}: אין תג/הסבר`);
    const inp = li.locator('input[type=date]'); ok(await inp.inputValue() === '2026-11-05', '/ui: השדה לא מאותחל');
    const ib = await inp.boundingBox(); ok(ib && ib.height >= 40 && ib.x >= 0 && ib.x + ib.width <= w, `/ui ${w}: שדה: ` + JSON.stringify(ib));
    ok(await up.locator('#olList li', { hasText: '9304' }).locator('input[type=date]').count() === 0, '/ui: שדה לחשבונית עם מועד');
    await aa(up, `/ui ${scheme} ${w}`); await noH(up, `/ui ${scheme} ${w}`);
    if (out && w === 390) await li.screenshot({ path: `${out}/due-estimated-ui-${scheme}.png` });
    await uc.close();
  }
  {
    const uc = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await uc.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const up = await uc.newPage(); watch(up);
    await up.goto(`${base}/ui`);
    const li = up.locator('#olList li', { hasText: '9306' }); await li.waitFor();
    await li.locator('input[type=date]').fill('2026-11-20');
    await li.getByRole('button', { name: 'עדיין פתוח' }).click();
    const post = up.waitForRequest(r => r.url().endsWith('/open-list/confirm') && r.method() === 'POST');
    await up.locator('#olOk').click();
    const bd = JSON.parse((await post).postData()), id6 = (await api('/dashboard')).invoices.find(x => x.number === '9306').invoice_id;
    ok(JSON.stringify(bd.due) === JSON.stringify({ [id6]: '2026-11-20' }), '/ui גוף due: ' + JSON.stringify(bd));
    await up.locator('#olDone').filter({ hasText: 'מועדים תוקנו' }).waitFor();
    const r6 = (await api('/dashboard')).invoices.find(x => x.number === '9306');
    ok(r6.due === '2026-11-20' && r6.due_estimated === false, '/ui: השרת אחרי תיקון: ' + JSON.stringify([r6.due, r6.due_estimated]));
    // טבלת החובות: 9302 (אושרה מוערכת) עם תג; 9306 אחרי תיקון בלי
    const dRow = n => up.locator('#debts tr', { hasText: n });
    await dRow('רון מוערך').first().waitFor();
    ok(await dRow('רון מוערך').first().locator('[data-testid="due-estimated"]').count() === 1 && await dRow('עדי מוערכת').first().locator('[data-testid="due-estimated"]').count() === 0, '/ui: תגי טבלת החובות');
    await uc.close();
  }
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ מועד מוערך: תג+הסבר ברשימת הפתוחות/בטבלה/בתצוגת התזכורת · 409 בעברית בכרטיס · תיקון נשמר (due_estimated=false) · /ui בהיר+כהה (תג, תיקון, טבלה) · 390px · AA · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
