// הפעלה 133: הדשבורד הפשוט (/ui) מול שרת DEMO=1 אמיתי (dry-run). התזכורת של גל שרון (סכום חריג, 2,490 ₪)
// נתקעה שם: «אישור ושליחה» נשלח בלי confirm_amount והשרת דחה תמיד. כאן: התיבה מופיעה, הכפתור נעול
// עד הסימון, והאישור עובר. הרצה: node e2e/ui.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, makeInject, srvStdio, srvLogLevel } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8143, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui') });
process.on('exit', () => srv.kill());   // גם ביציאה על חריגה שלא נתפסה — לא משאירים שרת על הפורט
const ok = (c, m) => { if (!c) throw new Error(m); };
const routeErrors = [];
const inject = makeInject(routeErrors);
// הפעלה 162: /ui טוען את התור ב-/reminders?view=list (לא את /reminders המלא) ⇒ יירוט לפי הנתיב, בלי תלות ב-query
const LIST = u => u.pathname.endsWith('/reminders');
const H = { Authorization: `Bearer ${TOKEN}` };
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); }
const errors = [];
let mocked138 = [];
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  p.on('request', r => { if (!r.url().startsWith(base) && !/^(data|about|blob):/.test(r.url())) errors.push(`בקשה חיצונית: ${r.url()}`); });
  await p.goto(base + '/ui');
  const item = p.locator('#list .item', { hasText: 'גל שרון' });
  await item.waitFor();
  ok(/סכום חריג/.test(await item.textContent()), 'ברשימה: קוד גולמי במקום «סכום חריג»');
  ok(!(await item.locator('.chip').getAttribute('class')).includes('blocked'), 'סכום חריג מסומן כחסום');
  ok(!/amount_check/.test(await p.locator('#debts').textContent()), 'טבלת החובות מציגה קוד גולמי amount_check');
  // הפעלה 134: תזכורת מאוחדת מציגה «N חשבוניות», לא את מספר חשבונית העוגן לצד הסה״כ
  const labels = await p.locator('#list .item .slogan').allTextContents();
  ok(labels.some(t => /^\d+ חשבוניות · שלב/.test(t.trim())), 'אין תזכורת מאוחדת עם «N חשבוניות»: ' + labels.join(' | '));
  ok(labels.some(t => /^חשבונית \S+ · שלב/.test(t.trim())), 'תזכורת של חשבונית אחת איבדה את המספר');
  await item.click();
  const btn = p.locator('#ok');
  await btn.waitFor();
  ok(/^לבדיקתך:/.test(await p.locator('#blockNote').textContent()), 'הכותרת עדיין «חסום:»');
  const box = p.locator('#amtBox');
  ok(/2009/.test(await box.textContent()) && /2,490/.test(await box.textContent()), 'תיבת הסכום החריג בלי החשבונית/הסכום');
  ok(await btn.isDisabled(), '«אישור ושליחה» פתוח לפני הסימון');
  if (out) await p.screenshot({ path: `${out}/ui-01-amount-check.png`, fullPage: true });
  await p.locator('#cAmt').check();
  ok(await btn.isEnabled(), '«אישור ושליחה» נעול אחרי הסימון');
  await btn.click();
  await p.locator('#detail h2', { hasText: 'מאושרת' }).waitFor();
  const rows = await (await fetch(base + '/reminders?view=summary', { headers: H })).json();
  ok(rows.filter(r => r.block_reason === 'amount_check' && r.status === 'pending_approval').length === 0, 'התזכורת לא אושרה בשרת');
  // תזכורת רגילה: בלי תיבות, הכפתור פתוח
  await p.locator('#list .item .chip.pending').first().click();
  await p.locator('#ok').waitFor();
  ok(await p.locator('#ok').isEnabled() && await p.locator('.confirm').count() === 0, 'תזכורת רגילה: תיבה מיותרת או כפתור נעול');
  if (out) await p.screenshot({ path: `${out}/ui-02-regular.png`, fullPage: true });
  // הפעלה 157: רענון של אותה תזכורת (לחיצה חוזרת, או אחרי פעולה). הנוסח נשאר על המסך, אבל כפתורי ההחלטה שלו
  // כבויים עד שהתצוגה חוזרת מהשרת. מחזיקים את /preview כדי לבדוק את החלון הזה בכל הרצה.
  let free157; const held157 = new Promise(r => { free157 = r; });
  await inject(p, '**/reminders/*/preview', async route => { await held157; await route.continue(); });
  const body157 = await p.locator('.bubble').first().innerText();
  await p.locator('#list .item.sel').click();
  ok(await p.locator('#ok').isDisabled() && await p.locator('#no').isDisabled(), '/ui: כפתורי ההחלטה פעילים בזמן רענון של אותה תזכורת');
  ok(await p.locator('#pvBusy').count() === 0 && await p.locator('.bubble').first().innerText() === body157, '/ui: רענון של אותה תזכורת החליף את הנוסח בשלד (הבהוב)');
  free157();
  await p.waitForFunction(() => { const o = document.querySelector('#ok'), n = document.querySelector('#no'); return o && n && !o.disabled && !n.disabled; });
  await p.unroute('**/reminders/*/preview');
  // פעולה שרצה: הכפתורים כבויים מהלחיצה. פעולה שנכשלה (הנוסח לא הוחלף): הם חוזרים, וההסבר מוצג.
  let fail157; const wait157 = new Promise(r => { fail157 = r; });
  await inject(p, '**/reminders/*/reject', async route => { await wait157; await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ detail: 'בדיקה: הדחייה לא נרשמה' }) }); });
  const at157 = errors.length;
  await p.locator('#no').click();
  ok(await p.locator('#ok').isDisabled() && await p.locator('#no').isDisabled(), '/ui: כפתורי ההחלטה פעילים בזמן שהפעולה רצה (לחיצה כפולה)');
  fail157();
  await p.locator('#derr', { hasText: 'בדיקה: הדחייה לא נרשמה' }).waitFor();
  ok(await p.locator('#ok').isEnabled() && await p.locator('#no').isEnabled(), '/ui: אחרי פעולה שנכשלה הכפתורים נשארו כבויים');
  await p.unroute('**/reminders/*/reject');
  errors.push(...errors.splice(at157).filter(e => !/^400 .*\/reminders\/\d+\/reject$/.test(e)));
  // critic סבב 56: תצוגה מקדימה ישנה (התזכורת נבנתה מחדש מאז) ⇒ השרת מסרב לאשר, לא יוצא דבר.
  // הפעלה 149: התצוגה נטענת מחדש לבד, עם «הסכום השתנה מ-… ל-…», בלי שורת שגיאה ובלי «פתחו שוב».
  let pv149 = 0, total149 = null;
  await p.route('**/reminders/*/preview', async route => {
    const res = await route.fetch(); const j = await res.json(); total149 = j.total_text;
    if (pv149++ === 0) { j.body_hash = 'stale-' + j.body_hash; j.total_text = '1 ₪'; }
    await route.fulfill({ response: res, json: j });
  });
  await p.locator('#list .item .chip.pending').first().click();
  await p.locator('#ok').waitFor();
  ok(await p.locator('#dstale').count() === 0, '/ui: «הנוסח השתנה» מוצג לפני שקרה משהו');
  const before56 = (await (await fetch(base + '/outbox', { headers: H })).json()).messages.length;
  await p.locator('#ok').click();
  await p.locator('#dstale').waitFor();
  const stale149 = await p.locator('#dstale').textContent();
  ok(stale149.includes(`הסכום השתנה מ-1 ₪ ל-${total149}.`) && stale149.includes('שום דבר לא נשלח'), '/ui: ההסבר לא מציג לפני/אחרי: ' + stale149);
  ok(pv149 >= 2, '/ui: התצוגה לא נטענה מחדש');
  ok((await p.locator('#derr').textContent()) === '', '/ui: שורת שגיאה למרות שהתצוגה נטענה מחדש');
  ok(await p.locator('#ok').isEnabled(), '/ui: אחרי הטעינה מחדש אי אפשר לאשר');
  ok((await (await fetch(base + '/outbox', { headers: H })).json()).messages.length === before56, '/ui: יצאה הודעה מתצוגה ישנה');
  if (out) await p.screenshot({ path: `${out}/ui-02c-stale-preview.png`, fullPage: true });
  await p.unroute('**/reminders/*/preview');
  { const i = errors.findIndex(e => /^409 .*\/reminders\/\d+\/approve$/.test(e)); if (i >= 0) errors.splice(i, 1); }   // הסירוב הצפוי
  // הפעלה 138: עמודת «תזכורות שנשלחו» ב-/ui — מועד וערוצים של מה שיצא בפועל (last_sent), מול ה-API האמיתי
  await p.reload(); await p.locator('#debts tr:not(.skrow)').first().waitFor();
  const dash138 = await (await fetch(base + '/dashboard', { headers: H })).json();
  // הפעלה 167: סגורות מוסתרות כברירת מחדל ⇒ «הכול» כדי לבדוק את כל השורות
  if (await p.locator('#df button[data-d="1"]').count()) await p.locator('#df button[data-d="1"]').click();
  for (const r of dash138.invoices) {
    const cell = (await p.locator('#debts tr', { hasText: r.number }).first().locator('td.sent').textContent()) ?? '';
    const ls = r.last_sent;
    if (!ls) { ok(!cell.includes('אחרונה') && !/📱|✉️/.test(cell), `חשבונית ${r.number}: «${cell}» מציג שליחה שלא הייתה`); continue; }
    const [, m, d] = (ls.sent_at ?? '').slice(0, 10).split('-').map(Number);
    ok(!ls.sent_at || cell.includes(`אחרונה ${d}.${m}`), `חשבונית ${r.number}: «${cell}» בלי מועד השליחה ${ls.sent_at}`);
    ok(cell.includes('📱') === ls.channels.includes('sms') && cell.includes('✉️') === ls.channels.includes('email'), `חשבונית ${r.number}: «${cell}» לא תואם לערוצים ${ls.channels}`);
  }
  // critic סבב 52: טבלת החובות הציגה קוד גולמי — סטטוס send_unknown וסיבת השהיה «promise:until=…» / «deceased».
  //   מזריקים לתשובת /dashboard האמיתית (המצבים נדירים בדמו) ובודקים נוסח בעברית.
  await inject(p, '**/dashboard', async route => {
    const res = await route.fetch(); const j = await res.json();
    const open = j.invoices.filter(x => x.status === 'open');
    if (open[0]) { open[0].customer_block = null; open[0].last_reminder = { ...(open[0].last_reminder ?? { id: 1, step: 1, template_key: 'x', sent_at: null, invoice_ids: [] }), status: 'send_unknown', block_reason: null }; open[0].reminders_sent = 1; open[0].last_sent = { sent_at: null, channels: [], unknown: true }; }
    if (open[1]) open[1].customer_block = 'promise:until=2026-11-20';
    if (open[2]) open[2].customer_block = 'deceased';
    // הפעלה 138: שלב 2 בתור (sent_at ריק) אחרי ששלב 1 יצא במייל בלבד; ושליחה שנקטעה בלי מועד
    if (open[3]) Object.assign(open[3], { customer_block: null, reminders_sent: 1, last_sent: { sent_at: '2026-10-28T09:00:00+00:00', channels: ['email'] },
      last_reminder: { id: 2, step: 2, template_key: 'x', sent_at: null, invoice_ids: [], status: 'pending_approval', block_reason: null } });
    if (open[4]) Object.assign(open[4], { reminders_sent: 1, last_sent: { sent_at: null, channels: [] } });
    mocked138 = [open[3]?.number, open[4]?.number];
    await route.fulfill({ response: res, json: j });
  });
  await p.goto(base + '/ui'); await p.locator('#debts tr:not(.skrow)').first().waitFor();
  const debts = await p.locator('#debts').textContent();
  for (const raw of ['send_unknown', 'promise', 'deceased', ':until='])
    ok(!debts.includes(raw), `טבלת החובות מציגה קוד גולמי: ${raw}`);
  ok(/השליחה נקטעה באמצע/.test(debts) && /הבטיח\/ה לשלם · עד 20\.11\.2026/.test(debts) && /סימנתם: נפטר\/ה/.test(debts), 'נוסחי הסטטוס/השהיה חסרים');
  const sentCell = async n => (await p.locator('#debts tr', { hasText: n }).first().locator('td.sent').textContent()) ?? '';
  ok(mocked138[0] && mocked138[1], 'בהדגמה פחות מ-5 חשבוניות פתוחות');
  const c3 = await sentCell(mocked138[0]), c4 = await sentCell(mocked138[1]);
  ok(c3.includes('אחרונה 28.10') && c3.includes('✉️') && !c3.includes('📱'), `שלב 2 בתור: «${c3}» במקום «1 · אחרונה 28.10 ✉️»`);
  ok(c4.trim() === '1', `שליחה שנקטעה בלי מועד: «${c4}» במקום הספירה בלבד`);
  // critic סבב 53: ניסיון שנקטע ⇒ «לא ידוע אם יצאה», לא מועד/ערוץ של תזכורת ישנה
  ok(/לא ידוע אם יצאה/.test(await p.locator('#debts tr').first().locator('td.sent').textContent()), 'last_sent.unknown לא מוצג ב-/ui');
  if (out) await p.screenshot({ path: `${out}/ui-03-status-pause.png`, fullPage: true });
  await p.unroute('**/dashboard');
  // הפעלה 142: כשל טעינה ב-/ui נבלע בשקט (טבלה ישנה/ריקה בלי הסבר). עכשיו: פס שגיאה עם «נסו שוב».
  ok(await p.locator('#loaderr').isHidden(), 'פס השגיאה מוצג בלי כשל');
  const before = errors.length; let failed = 0;
  const fail = route => { failed++; return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }); };
  await inject(p, '**/dashboard', fail);
  await p.locator('#btnPlan').click();                       // פעולה ⇒ load() ⇒ /dashboard נכשל
  await p.locator('#loaderr').waitFor({ state: 'visible' });
  ok(await p.locator('#debts tr').count() > 0 && await p.locator('#list .item').count() > 0, 'כשל ב-/dashboard רוקן את המסך');
  await p.locator('#btnRetry').click();                      // השרת עדיין למטה ⇒ הפס נשאר
  await p.waitForFunction(() => !document.querySelector('#btnRetry').disabled);
  ok(await p.locator('#loaderr').isVisible(), '«נסו שוב» כושל הסתיר את פס השגיאה');
  await p.unroute('**/dashboard');
  await inject(p, LIST, fail);                     // גם כשל בתור התזכורות מוצג (היה: unhandled rejection)
  await p.locator('#btnRetry').click();
  await p.waitForFunction(() => !document.querySelector('#btnRetry').disabled);
  ok(await p.locator('#loaderr').isVisible() && await p.locator('#list .item').count() > 0, 'כשל ב-/reminders: אין פס שגיאה או שהתור התרוקן');
  if (out) await p.screenshot({ path: `${out}/ui-04-load-error.png`, fullPage: true });
  await p.unroute(LIST);
  await p.locator('#btnRetry').click();
  await p.locator('#loaderr').waitFor({ state: 'hidden' });
  ok(failed >= 3, `הכשלים המוזרקים לא הגיעו לדף (${failed})`);
  // הפעלה 143: כשל בתצוגה המקדימה היה unhandled rejection והלוח נשאר על התזכורת הקודמת. עכשיו: שגיאה בלוח הפרטים + «נסו שוב».
  let pvFailed = 0;
  await inject(p, '**/reminders/*/preview', route => { pvFailed++; return route.fulfill({ status: 502, contentType: 'text/html', body: 'Bad Gateway' }); });
  await p.locator('#list .item').first().click();
  await p.locator('#pverr').waitFor();
  const pvText = await p.locator('#pverr').textContent();
  ok(pvText.includes('השרת לא זמין כרגע') && !/502|Bad Gateway/.test(pvText), `שגיאת התצוגה המקדימה: «${pvText}»`);
  ok(await p.locator('#ok').count() === 0, 'כשל בתצוגה המקדימה השאיר כפתור אישור של תזכורת אחרת');
  if (out) await p.screenshot({ path: `${out}/ui-05-preview-error.png`, fullPage: true });
  await p.unroute('**/reminders/*/preview');
  await p.locator('#pvRetry').click();
  await p.locator('#detail h2').first().waitFor();
  ok(await p.locator('#pverr').count() === 0 && pvFailed === 1, `«נסו שוב» בתצוגה המקדימה לא טען אותה (${pvFailed})`);
  // הפעלה 152: במעבר לתזכורת אחרת הלוח הציג את הקודמת (עם «אישור ושליחה» שלה) עד שהשרת ענה. עכשיו: שלד טעינה מיד.
  let open152; const gate152 = new Promise(r => { open152 = r; });
  let held152 = 0;
  await inject(p, '**/reminders/*/preview', async route => { held152++; await gate152; await route.continue(); });
  const first152 = await p.locator('#detail').innerHTML();
  // הפעלה 155: גם /reminders מוחזק. הסימון ברשימה עבר רק כשהרענון חזר, ולכן הבדיקה למטה נכשלה ב-CI כשהוא איחר
  // (הרצה 475). עכשיו הסימון עובר בלחיצה עצמה, והבדיקה תופסת את זה בכל הרצה ולא רק כשהשרת איטי.
  let heldList155 = 0, listUrl162 = '';
  await inject(p, LIST, async route => { heldList155++; listUrl162 = route.request().url(); await gate152; await route.continue(); });
  await p.locator('#list .item').nth(1).click();
  await p.locator('#pvBusy').waitFor();
  ok(held152 === 1 && await p.locator('#detail').getAttribute('aria-busy') === 'true', '/ui: מעבר תזכורת בלי aria-busy בלוח התצוגה המקדימה');
  ok(await p.locator('#ok').count() === 0 && await p.locator('#no').count() === 0 && await p.locator('#detail iframe').count() === 0,
    '/ui: בזמן טעינת תזכורת אחרת נשארו בלוח כפתורים או נוסח של התזכורת הקודמת');
  ok((await p.locator('#pvBusy').textContent()).includes('טוען תצוגה מקדימה') && await p.locator('#pvBusy').getAttribute('role') === 'status', '/ui: אין הודעת טעינה לקורא מסך');
  ok(await p.locator('#detail .sk').count() > 0 && await p.locator('#detail .sk').evaluateAll(els => els.every(e => e.closest('[aria-hidden="true"]'))), '/ui: שלד התצוגה המקדימה חסר או חשוף לקורא מסך');
  ok(new URL(listUrl162).searchParams.get('view') === 'list', `/ui: התור נטען בלי view=list (${listUrl162}); חוזר לטעון את /reminders המלא`);
  ok(heldList155 === 1, `/ui: רענון התור לא הוחזק (${heldList155}); הבדיקה לא בודקת את הסימון לפני שהוא חוזר`);
  ok(await p.locator('#list .item.sel').count() === 1 && await p.locator('#list .item').nth(1).evaluate(e => e.classList.contains('sel')), '/ui: הרשימה לא מסמנת את התזכורת שנטענת');
  if (out) await p.screenshot({ path: `${out}/ui-09-preview-loading.png`, fullPage: true });
  open152();
  await p.locator('#detail h2').first().waitFor();
  ok(await p.locator('#detail .sk').count() === 0 && await p.locator('#pvBusy').count() === 0 && await p.locator('#detail').getAttribute('aria-busy') === null,
    '/ui: השלד נשאר אחרי שהתצוגה המקדימה נטענה');
  ok(await p.locator('#detail').innerHTML() !== first152, '/ui: הלוח לא התחלף לתזכורת שנבחרה');
  await p.unroute('**/reminders/*/preview');
  await p.unroute(LIST);
  ok(await p.locator('#list .item.sel').count() === 1 && await p.locator('#list .item').nth(1).evaluate(e => e.classList.contains('sel')), '/ui: הסימון ברשימה אבד אחרי שרענון התור חזר');
  // רענון של אותה תזכורת (לחיצה חוזרת, או אחרי פעולה) לא מחליף לשלד: הנוסח נשאר על המסך עד שהתשובה מגיעה
  let open152b; const gate152b = new Promise(r => { open152b = r; });
  let held152b = 0;
  await inject(p, '**/reminders/*/preview', async route => { held152b++; await gate152b; await route.continue(); });
  await p.locator('#list .item').nth(1).click();
  for (let i = 0; i < 40 && !held152b; i++) await p.waitForTimeout(50);
  ok(held152b === 1 && await p.locator('#detail .sk').count() === 0 && await p.locator('#detail h2').count() > 0 && await p.locator('#detail').getAttribute('aria-busy') === null,
    '/ui: רענון של אותה תזכורת החליף את הנוסח בשלד');
  open152b();
  await p.waitForLoadState('networkidle');
  await p.unroute('**/reminders/*/preview');
  await p.locator('#list .item').first().click();          // חוזרים לתזכורת הראשונה, כמו לפני הבלוק הזה
  await p.locator('#detail:not([aria-busy]) h2').first().waitFor();
  // הפעלה 145: /ui מקבל את ההתנהגות של /app/ מהפעלה 144.
  const dialogs = []; let answer = null;
  p.on('dialog', d => { dialogs.push(`${d.type()}: ${d.message()}`); return d.type() === 'prompt' && answer ? d.accept(answer) : d.dismiss(); });
  const wunk = p.locator('#wunk');
  ok(await wunk.isHidden() && await p.locator('#locked').isHidden(), 'פס «לא ידוע» או פס הכניסה מוצגים בלי סיבה');
  // (א) כתיבה שלא הגיעה לשרת (רשת): «לא ידוע אם הפעולה נרשמה», בלי alert ובלי «נסו שוב»; אחרי הרענון האוטומטי הנוסח מתעדכן
  await inject(p, '**/plan', route => route.abort('failed'));
  await p.locator('#btnPlan').click();
  await wunk.waitFor({ state: 'visible' });
  await p.locator('#wunkMsg', { hasText: 'הנתונים התרעננו עכשיו' }).waitFor();
  ok(dialogs.length === 0, 'כתיבה שנקטעה פתחה חלון: ' + dialogs.join(' | '));
  await p.unroute('**/plan');
  await p.locator('#btnWunk').click();
  ok(await wunk.isHidden(), '«הבנתי» לא סגר את ההודעה');
  // (ב) אישור שהגיע לשרת ונרשם, והתשובה אבדה: ההודעה «לא ידוע אם נרשמה», בלי «נסו שוב», והמסך מתרענן ומראה «מאושרת»
  await p.locator('#list .item', { has: p.locator('.chip.pending') }).first().click();
  await p.locator('#ok').waitFor();
  for (const c of await p.locator('.confirm input').all()) await c.check();
  let approvedId = 0;
  await inject(p, '**/reminders/*/approve', async route => {
    const res = await route.fetch(); ok(res.ok(), 'האישור נדחה בשרת: ' + res.status());
    approvedId = Number(route.request().url().match(/reminders\/(\d+)\/approve/)[1]);
    await route.abort('failed');
  });
  let seenUnknown = '';
  await p.exposeFunction('__seen145', t => { if (!seenUnknown) seenUnknown = t; });
  await p.evaluate(() => new MutationObserver(() => { const w = document.querySelector('#wunk'); if (!w.hidden) window.__seen145(w.textContent); })
    .observe(document.querySelector('#wunk'), { attributes: true, childList: true, subtree: true, characterData: true }));
  await p.locator('#ok').click();
  await p.locator('#wunkMsg', { hasText: 'הנתונים התרעננו עכשיו' }).waitFor();
  ok(seenUnknown.includes('אין חיבור לשרת גבי. לא ידוע אם הפעולה נרשמה') && !seenUnknown.includes('נסו שוב'), `הודעת כתיבה שנקטעה: «${seenUnknown}»`);
  ok(dialogs.length === 0, 'אישור שנקטע פתח חלון: ' + dialogs.join(' | '));
  await p.unroute('**/reminders/*/approve');
  const st145 = (await (await fetch(base + '/reminders?view=summary', { headers: H })).json()).find(r => r.id === approvedId);
  ok(st145 && st145.status !== 'pending_approval', 'האישור לא נרשם בשרת (הבדיקה לא משחזרת תשובה שאבדה)');
  ok(!/ממתינה לאישורך/.test(await p.locator(`#list .item[data-id="${approvedId}"] .chip`).textContent()), 'אחרי הרענון האוטומטי התור עדיין מציג «ממתינה לאישורך»');
  await p.locator('#btnWunk').click();
  // (ג) נתונים לא עדכניים ⇒ רענון אוטומטי: אחרי כ-2 שניות בלי לחיצה, ומיד באירוע online
  const before145 = errors.length;
  let down = true;
  await inject(p, '**/dashboard', route => down ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }) : route.continue());
  await p.evaluate(() => { load(false); });
  await p.locator('#loaderr').waitFor({ state: 'visible' });
  down = false;
  await p.locator('#loaderr').waitFor({ state: 'hidden', timeout: 6000 });   // בלי לחיצה על «נסו שוב»
  down = true;
  await p.evaluate(() => { load(false); });
  await p.locator('#loaderr').waitFor({ state: 'visible' });
  await p.waitForTimeout(2600);                                             // הניסיון של 2 שניות נכשל ⇒ הבא רק בעוד 4
  ok(await p.locator('#loaderr').isVisible(), 'הפס נעלם כשהשרת עדיין למטה');
  down = false;
  await p.evaluate(() => window.dispatchEvent(new Event('online')));
  await p.locator('#loaderr').waitFor({ state: 'hidden', timeout: 1500 });   // מיד, לא אחרי 4 שניות
  await p.unroute('**/dashboard');
  // הפעלה 146 (ה): אישור שכבר נרשם בשרת (כאן: אושר ממקום אחר בזמן שהמסך פתוח) ⇒ «כבר אושרה» כהערה, לא כשגיאה; המסך מתעדכן
  await p.locator('#list .item', { has: p.locator('.chip.pending:not(.blocked)') }).first().click();
  await p.locator('#ok').waitFor();
  const rid146 = await p.evaluate(() => sel);
  const pv146 = await (await fetch(`${base}/reminders/${rid146}/preview`, { headers: H })).json();
  const first146 = await fetch(`${base}/reminders/${rid146}/approve`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm_amount: (pv146.amount_check ?? []).length > 0, confirm_open: !!pv146.needs_confirm_open }) });
  ok(first146.ok, 'האישור הראשון (מחוץ לדף) נדחה: ' + first146.status + ' ' + (first146.ok ? '' : await first146.text()) + ' ' + JSON.stringify({ s: pv146.status, b: pv146.block_reason }));
  for (const c of await p.locator('.confirm input').all()) await c.check();
  await p.locator('#ok').click();
  await p.locator('#dinfo').waitFor();
  const info146 = await p.locator('#dinfo').textContent();
  ok(/^התזכורת כבר אושרה/.test(info146) && !/status=|approved/.test(info146), `אישור חוזר: «${info146}»`);
  ok((await p.locator('#derr').textContent()) === '' && await p.locator('#ok').count() === 0, 'אישור חוזר מוצג כשגיאה, או שכפתור האישור נשאר');
  ok(/מאושרת|נשלחה/.test(await p.locator('#detail h2').first().textContent()) && await wunk.isHidden(), 'אחרי אישור חוזר המסך לא מציג את המצב מהשרת');
  ok(dialogs.length === 0, 'אישור חוזר פתח חלון: ' + dialogs.join(' | '));
  // (ו) כשל בכפתור כותרת: שורת הודעה בדף, בלי חלון קופץ; נסגרת ב«הבנתי». בזמן שהפעולה רצה הכפתורים כבויים.
  let release146; const gate146 = new Promise(r => { release146 = r; });
  await inject(p, '**/sync', async route => { await gate146; await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ detail: 'הסנכרון כבר רץ' }) }); });
  await p.locator('#btnSync').click();
  ok(await p.locator('#btnSync').isDisabled() && await p.locator('#btnDispatch').isDisabled(), 'בזמן פעולה כפתורי הכותרת פתוחים (לחיצה כפולה)');
  // הפעלה 159: בזמן פעולת כותרת גם כפתורי ההחלטה בלוח כבויים (סנכרון יכול לבנות את הנוסח מחדש באותו רגע)
  const dec159 = p.locator('#detail .decide button');
  ok(await dec159.count() > 0 && await dec159.evaluateAll(b => b.every(x => x.disabled)), '/ui: כפתורי ההחלטה פעילים בזמן פעולת כותרת');
  // תזכורת אחרת שנפתחת באמצע הפעולה נטענת גם היא בלי כפתורי החלטה פעילים
  const items159 = await p.locator('#list .item').evaluateAll(b => b.map(x => ({ sel: x.classList.contains('sel'), open: /ממתינה|מאושרת/.test(x.querySelector('.chip')?.textContent ?? '') })));
  const cur159 = items159.findIndex(x => x.sel), other159 = items159.findIndex((x, i) => i !== cur159 && x.open);
  ok(cur159 >= 0 && other159 >= 0, '/ui: אין בתור תזכורת נוספת עם כפתורי החלטה: ' + JSON.stringify(items159));
  await p.locator('#list .item').nth(other159).click();
  await p.locator('#detail:not([aria-busy]) .decide button').first().waitFor();
  ok(await dec159.evaluateAll(b => b.every(x => x.disabled)), '/ui: תזכורת שנפתחה בזמן פעולת כותרת קיבלה כפתורי החלטה פעילים');
  await p.locator('#list .item').nth(cur159).click();
  await p.locator('#detail:not([aria-busy]) .decide button').first().waitFor();
  ok(await dec159.evaluateAll(b => b.every(x => x.disabled)), '/ui: חזרה לתזכורת בזמן פעולת כותרת הדליקה את כפתורי ההחלטה');
  release146();
  await p.locator('#acterr').waitFor({ state: 'visible' });
  ok((await p.locator('#actMsg').textContent()) === 'הפעולה לא בוצעה: הסנכרון כבר רץ', 'שורת הכשל: ' + await p.locator('#actMsg').textContent());
  ok(dialogs.length === 0 && await p.locator('#btnSync').isEnabled(), 'כשל בכפתור כותרת פתח חלון, או שהכפתורים נשארו כבויים');
  // אחרי שהפעולה הסתיימה (כאן בכשל) התצוגה נטענת מחדש והכפתורים חוזרים
  await p.waitForFunction(() => { const b = [...document.querySelectorAll('#detail .decide button')]; return b.length > 0 && b.some(x => !x.disabled); });
  if (out) await p.screenshot({ path: `${out}/ui-07-action-error.png`, fullPage: true });
  await p.locator('#btnAct').click();
  ok(await p.locator('#acterr').isHidden(), '«הבנתי» לא סגר את שורת הכשל');
  await p.unroute('**/sync');
  // הפעלה 161: (א) «↻ חידוש תזכורות» כבוי בזמן פעולת כותרת; (ב) תיבת «בדקתי» שסומנה נשארת מסומנת אחרי פעולת
  // כותרת שנכשלה, כל עוד הנוסח זהה (body_hash), ויורדת כשהנוסח השתנה. התיבה מוזרקת לתשובת השרת (needs_confirm_open).
  let bump161 = false, release161; const gate161 = new Promise(r => { release161 = r; });
  await inject(p, '**/reminders/*/preview', async route => {
    const r = await route.fetch(); const j = await r.json();
    // בשלב הזה של התרחיש לא נשארה בתור תזכורת ממתינה ⇒ תזכורת מאושרת מוצגת ללוח כממתינה (לא מאשרים אותה כאן)
    if (j.status === 'approved') { j.status = 'pending_approval'; j.block_reason = null; j.amount_drift = null; j.needs_confirm_open = true; }
    if (bump161) j.body_hash = 'f'.repeat(64);
    await route.fulfill({ response: r, json: j });
  });
  await inject(p, '**/sync', async route => { await gate161; await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ detail: 'הסנכרון כבר רץ' }) }); });
  const pend161 = p.locator('#list .item', { has: p.locator('.chip', { hasText: /^\s*מאושרת\s*$/ }) }).first();
  await pend161.click();
  const box161 = p.locator('#cOpen');
  await p.locator('#detail:not([aria-busy]) #cOpen:enabled').waitFor();
  ok(await p.locator('#ok').isDisabled(), '/ui 161: «אישור ושליחה» פתוח לפני הסימון');
  await box161.check();
  ok(await p.locator('#ok').isEnabled(), '/ui 161: «אישור ושליחה» נעול אחרי הסימון');
  const resume161 = p.locator('#debts button.resume');
  ok(await resume161.count() > 0 && await resume161.evaluateAll(b => b.every(x => !x.disabled)), '/ui 161: אין כפתור «חידוש תזכורות» פעיל בטבלת החובות');
  await p.locator('#btnSync').click();
  ok(await resume161.evaluateAll(b => b.every(x => x.disabled)), '/ui 161: «חידוש תזכורות» פעיל בזמן פעולת כותרת');
  ok(await box161.isDisabled() && await box161.isChecked(), '/ui 161: התיבה פעילה או לא מסומנת בזמן פעולת כותרת');
  release161();
  await p.locator('#acterr').waitFor({ state: 'visible' });
  await p.locator('#detail:not([aria-busy]) #cOpen:enabled').waitFor();
  ok(await box161.isChecked() && await p.locator('#ok').isEnabled(), '/ui 161: אחרי פעולת כותרת שנכשלה הסימון «בדקתי» התאפס');
  ok(await resume161.count() > 0 && await resume161.evaluateAll(b => b.every(x => !x.disabled)), '/ui 161: «חידוש תזכורות» נשאר כבוי אחרי שהפעולה הסתיימה');
  // הנוסח השתנה בין שתי הטעינות ⇒ הסימון יורד, והכפתור נעול עד סימון מחדש
  bump161 = true;
  await p.locator('#btnSync').click();
  await p.locator('#detail:not([aria-busy]) #cOpen:enabled:not(:checked)').waitFor();
  ok(await p.locator('#ok').isDisabled(), '/ui 161: נוסח שהשתנה נשאר עם «בדקתי» מסומן וכפתור פתוח');
  bump161 = false;
  await p.locator('#btnAct').click();
  await p.unroute('**/sync'); await p.unroute('**/reminders/*/preview');
  // (ד) 401 באמצע פעולה, והמשתמש לא מזין קוד חדש ⇒ הנתונים יורדים מהמסך, הטוקן נמחק, פס כניסה. בלי alert.
  await inject(p, '**/dispatch', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"unauthorized"}' }));
  await p.locator('#btnDispatch').click();
  await p.locator('#locked').waitFor({ state: 'visible' });
  ok(/תוקף הכניסה פג/.test(await p.locator('#lockMsg').textContent()), 'פס הכניסה בלי «תוקף הכניסה פג»');
  ok(await p.locator('#debts tr').count() === 0 && await p.locator('#list .item').count() === 0 && await p.locator('#kpis .kpi').count() === 0
    && await p.locator('#ok').count() === 0, 'אחרי 401 נשארו נתוני חייבים על המסך');
  ok(await p.evaluate(() => sessionStorage.getItem('gabi_owner_token')) === null, 'אחרי 401 הטוקן נשאר בלשונית');
  ok(dialogs.length === 1 && dialogs[0].startsWith('prompt'), 'אחרי 401 ציפינו לחלון קוד גישה אחד בלבד: ' + dialogs.join(' | '));
  // הפעלה 146: מסך נעול ⇒ כפתורי הכותרת כבויים עד «כניסה»
  for (const id of ['#btnSync', '#btnPlan', '#btnDispatch']) ok(await p.locator(id).isDisabled(), `מסך נעול: ${id} פתוח`);
  if (out) await p.screenshot({ path: `${out}/ui-06-auth-lost.png`, fullPage: true });
  await p.unroute('**/dispatch');
  await p.waitForTimeout(2500);
  ok(await p.locator('#debts tr').count() === 0 && dialogs.length === 1, 'מסך נעול שלח רענון אוטומטי או פתח חלון');
  // כניסה מחדש: חלון אחד (לא אחד לכל בקשה מקבילה), הנתונים חוזרים
  answer = TOKEN;
  await p.locator('#btnLogin').click();
  await p.locator('#debts tr:not(.skrow)').first().waitFor();
  await p.locator('#list .item').first().waitFor();
  for (const id of ['#btnSync', '#btnPlan', '#btnDispatch']) ok(await p.locator(id).isEnabled(), `אחרי כניסה: ${id} נשאר כבוי`);
  ok(await p.locator('#locked').isHidden() && dialogs.length === 2, 'כניסה מחדש: הפס נשאר או שנפתח יותר מחלון אחד: ' + dialogs.join(' | '));
  // הפעלה 150: שלד טעינה בכניסה ראשונה במקום מסך ריק. מאטים את שתי הבקשות כדי לתפוס את חלון הטעינה.
  const slow150 = async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); };
  await inject(p, '**/dashboard', slow150); await inject(p, LIST, slow150);
  await p.reload();
  await p.locator('#debts tr.skrow').first().waitFor();
  ok(await p.locator('#kpis .kpi .sk').count() === 16 && await p.locator('#debts tr.skrow').count() === 3 && await p.locator('#list .skitem').count() === 3,
    '/ui: שלד הטעינה חסר או חלקי');
  ok(await p.locator('#list .item').count() === 0 && await p.locator('#debts td.sent').count() === 0, '/ui: נתונים מוצגים לצד השלד');
  ok(await p.locator('#dash').getAttribute('aria-busy') === 'true' && await p.locator('#list').getAttribute('aria-busy') === 'true'
    && await p.locator('#busyMsg').textContent() === 'טוען נתונים…', '/ui: בזמן הטעינה אין aria-busy או הודעת «טוען נתונים…»');
  ok(await p.locator('.sk').evaluateAll(els => els.every(e => e.closest('[aria-hidden="true"]'))), '/ui: צורות השלד חשופות לקורא מסך');
  ok(await p.locator('#loaderr').isHidden(), '/ui: פס שגיאה בזמן טעינה תקינה');
  if (out) await p.screenshot({ path: `${out}/ui-07-skeleton.png`, fullPage: true });
  await p.locator('#debts tr:not(.skrow)').first().waitFor(); await p.locator('#list .item').first().waitFor();
  ok(await p.locator('.sk').count() === 0 && await p.locator('#dash').getAttribute('aria-busy') === null
    && await p.locator('#busyMsg').textContent() === '', '/ui: השלד או aria-busy נשארו אחרי הטעינה');
  // אחרי שהנתונים נטענו, רענון (לחיצה על תזכורת, פעולה) לא מחזיר את השלד: הנתונים נשארים על המסך
  await p.locator('#list .item').first().click();
  ok(await p.locator('#dash .sk, #list .sk').count() === 0, '/ui: רענון אחרי טעינה החזיר את השלד');   // הלוח עצמו כן בשלד בזמן טעינת תצוגה מקדימה (152)
  await p.unroute('**/dashboard'); await p.unroute(LIST);
  // טעינה ראשונה שנכשלת: לא שלד לנצח ולא טבלה ריקה שנראית כמו «אין חובות», אלא «לא נטענו» + פס שגיאה מתאים
  let down150 = true;
  const fail150 = route => down150 ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }) : route.continue();
  await inject(p, '**/dashboard', fail150); await inject(p, LIST, fail150);
  await p.reload();
  await p.locator('#loaderr').waitFor({ state: 'visible' });
  ok(/עדיין אין נתונים להצגה/.test(await p.locator('#loadMsg').textContent()) && !/אולי לא עדכני/.test(await p.locator('#loadMsg').textContent()),
    '/ui: כשל בטעינה ראשונה מציג «מה שמוצג כאן אולי לא עדכני» כשאין דבר על המסך');
  ok(await p.locator('.sk').count() === 0 && await p.locator('#debts tr.unloaded').count() === 1 && await p.locator('#list .unloaded').count() === 1
    && await p.locator('#kpis .kpi').count() === 0 && await p.locator('#dash').getAttribute('aria-busy') === null, '/ui: כשל בטעינה ראשונה השאיר שלד או מסך ריק בלי הסבר');
  if (out) await p.screenshot({ path: `${out}/ui-08-first-load-failed.png`, fullPage: true });
  down150 = false;                                                          // השרת חזר ⇒ הרענון האוטומטי ממלא, בלי לחיצה
  await p.locator('#list .item').first().waitFor({ timeout: 6000 }); await p.locator('#debts tr:not(.unloaded)').first().waitFor();
  ok(await p.locator('#loaderr').isHidden() && await p.locator('.unloaded').count() === 0, '/ui: אחרי שהשרת חזר נשארו «לא נטענו» או פס השגיאה');
  await p.unroute('**/dashboard'); await p.unroute(LIST);
  // רק /dashboard נכשל בטעינה ראשונה: התור מוצג, החובות «לא נטענו», והפס מזהיר שמה שמוצג אולי לא עדכני
  await inject(p, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await p.reload();
  await p.locator('#loaderr').waitFor({ state: 'visible' });
  ok(await p.locator('#list .item').count() > 0 && await p.locator('#debts tr.unloaded').count() === 1 && /אולי לא עדכני/.test(await p.locator('#loadMsg').textContent()),
    '/ui: כשל חלקי בטעינה ראשונה לא מוצג נכון');
  await p.unroute('**/dashboard');
  await p.locator('#btnRetry').click();
  await p.locator('#loaderr').waitFor({ state: 'hidden' });
  ok(await p.locator('#debts tr.unloaded').count() === 0 && await p.locator('#debts td.sent').count() > 0, '/ui: «נסו שוב» לא טען את החובות');
  // הפעלה 165: התור על 5,000 תזכורות (120 לטיפול, השאר נשלחו/נדחו/בוטלו). היה: 5,000 כרטיסים ב-DOM בכל רענון,
  // והממתינות נקברו בין הסגורות. עכשיו: ברירת מחדל «לטיפול», עד 50 כרטיסים, «הצגת עוד», ו«הכול» מציג את השאר.
  const big165 = Array.from({ length: 5000 }, (_, i) => ({ id: 900000 + i, invoice_id: i + 1, block_reason: null,
    status: i < 120 ? (i % 2 ? 'approved' : 'pending_approval') : ['sent_dry_run', 'rejected', 'cancelled', 'sent'][i % 4],
    step: 0, number: String(70000 + i), customer_name: `לקוח בדיקה ${i}`, invoice_ids: [i + 1], invoice_count: 1,
    total_text: '100.00 ₪', amount_drift: i === 4999 ? { was_text: '90.00 ₪', now_text: '100.00 ₪' } : null }));
  await inject(p, LIST, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(big165) }));
  const t165 = Date.now();
  await p.reload();
  await p.locator('#list .item').first().waitFor();
  const ms165 = Date.now() - t165;
  const qf = p.locator('#qf button');
  ok(await qf.count() === 2 && /לטיפול \(121\)/.test(await qf.nth(0).textContent()) && /הכול \(5000\)/.test(await qf.nth(1).textContent())
    && await qf.nth(0).getAttribute('aria-pressed') === 'true', '/ui 165: מוני הסינון לא נכונים או «לטיפול» לא ברירת המחדל');
  ok(await p.locator('#list .item').count() === 50, '/ui 165: יותר מ-50 כרטיסים בטעינה הראשונה');
  ok(!/נשלחה|נדחתה|בוטלה/.test(await p.locator('#list').textContent()), '/ui 165: «לטיפול» מציג תזכורות שנשלחו/נדחו/בוטלו');
  ok(/נותרו 71/.test(await p.locator('#qMoreBtn').textContent()), '/ui 165: «הצגת עוד» בלי מספר הנותרים');
  await p.locator('#qMoreBtn').click(); await p.locator('#qMoreBtn').click();
  ok(await p.locator('#list .item').count() === 121 && await p.locator('#qMoreBtn').count() === 0, '/ui 165: «הצגת עוד» לא הציג את כל ה-121');
  ok(await p.locator('#list .item', { hasText: 'לקוח בדיקה 4999' }).count() === 1, '/ui 165: תזכורת עם פער סכום (שנשלחה) הוסתרה מ«לטיפול»');
  if (out) await p.screenshot({ path: `${out}/ui-09-queue-paged.png` });
  await qf.nth(1).click();
  ok(await p.locator('#list .item').count() === 50 && /נותרו 4950/.test(await p.locator('#qMoreBtn').textContent())
    && await qf.nth(1).getAttribute('aria-pressed') === 'true', '/ui 165: «הכול» לא מציג 50 ראשונים + «הצגת עוד»');
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '/ui 165: גלילה רוחבית במובייל עם שורת הסינון');
  if (out) await p.screenshot({ path: `${out}/ui-10-queue-mobile.png` });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.unroute(LIST);
  big165.forEach(r => { r.status = 'sent_dry_run'; r.amount_drift = null; });
  await inject(p, LIST, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(big165) }));
  await p.reload();
  await p.locator('#list .empty').waitFor();
  ok(/אין תזכורות לטיפול/.test(await p.locator('#list').textContent()) && /5000/.test(await p.locator('#list').textContent()), '/ui 165: «לטיפול» ריק בלי הסבר');
  await p.unroute(LIST);
  // הפעלה 167: טבלת החובות על 5,000 חשבוניות (1,000 מהן נסגרו). היה: 5,000 שורות ב-DOM, 4.5–5.1 שנ׳ עד שהטבלה
  // הופיעה (מעבד מואט ×4). עכשיו: ברירת מחדל «פתוחות», עד 50 שורות, «הצגת עוד», ו«הכול» מציג גם את הסגורות.
  const real167 = await (await fetch(base + '/dashboard', { headers: H })).json();
  const t167 = real167.invoices.find(x => x.status === 'open');
  real167.invoices = Array.from({ length: 5000 }, (_, i) => ({ ...t167, invoice_id: 50000 + i, number: String(80000 + i),
    customer: `חייב בדיקה ${i}`, status: i % 5 === 4 ? 'closed' : 'open' }));
  await inject(p, '**/dashboard', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(real167) }));
  const s167 = Date.now();
  await p.reload(); await p.locator('#debts td.sent').first().waitFor();
  const ms167 = Date.now() - s167;
  const df = p.locator('#df button');
  ok(await df.count() === 2 && /פתוחות \(4000\)/.test(await df.nth(0).textContent()) && /\(5000\)/.test(await df.nth(1).textContent())
    && await df.nth(0).getAttribute('aria-pressed') === 'true', '/ui 167: מוני החובות לא נכונים או «פתוחות» לא ברירת המחדל');
  ok(await p.locator('#debts tr').count() === 50 && await p.locator('#debts tr.closed').count() === 0, '/ui 167: לא 50 שורות פתוחות בטעינה הראשונה');
  ok(/נותרו 3950/.test(await p.locator('#dMoreBtn').textContent()), '/ui 167: «הצגת עוד» בלי מספר הנותרים');
  await p.locator('#dMoreBtn').click();
  ok(await p.locator('#debts tr').count() === 100 && /נותרו 3900/.test(await p.locator('#dMoreBtn').textContent()), '/ui 167: «הצגת עוד» לא הוסיף 50');
  ok(/חייב בדיקה 0/.test(await p.locator('#debts tr').first().textContent()), '/ui 167: הסדר של השרת (מועד מוקדם ראשון) לא נשמר');
  await df.nth(1).click();
  ok(await p.locator('#debts tr').count() === 50 && await p.locator('#debts tr.closed').count() === 10 && /נותרו 4950/.test(await p.locator('#dMoreBtn').textContent())
    && await df.nth(1).getAttribute('aria-pressed') === 'true', '/ui 167: «הכול» לא מציג גם סגורות');
  if (out) await p.screenshot({ path: `${out}/ui-11-debts-paged.png` });
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '/ui 167: גלילה רוחבית במובייל עם סינון החובות');
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.unroute('**/dashboard');
  real167.invoices.forEach(x => { x.status = 'closed'; });
  await inject(p, '**/dashboard', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(real167) }));
  await p.reload(); await p.locator('#debts td.empty').waitFor();
  ok(/אין חובות פתוחים/.test(await p.locator('#debts').textContent()) && /5000/.test(await p.locator('#debts').textContent()) && await p.locator('#dMoreBtn').count() === 0,
    '/ui 167: «פתוחות» ריק בלי הסבר');
  await p.unroute('**/dashboard');
  console.log(`  /ui 167: 5,000 חשבוניות ⇒ טבלת החובות אחרי ${ms167}ms (טעינה מחדש מלאה)`);
  await p.reload(); await p.locator('#list .item').first().waitFor();
  console.log(`  /ui 165: 5,000 תזכורות ⇒ כרטיס ראשון אחרי ${ms165}ms (טעינה מחדש מלאה, כולל /dashboard)`);
  errors.push(...errors.splice(before145).filter(e => !/^503 .*\/dashboard$/.test(e) && !/^401 .*\/(dispatch|dashboard|reminders(\?view=list)?)$/.test(e) && !/^409 .*\/(sync|reminders\/\d+\/approve)$/.test(e)));
  // ה-503 המוזרקים נרשמו כשגיאות תגובה: מסירים רק אותם, כל שגיאה אחרת נשארת
  const mine = errors.splice(before).filter(e => !/^503 .*\/(dashboard|reminders(\?view=list)?)$/.test(e) && !/^502 .*\/reminders\/\d+\/preview$/.test(e));
  errors.push(...mine);
  errors.push(...routeErrors);
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui: סכום חריג מאושר רק אחרי סימון מפורש · תזכורת רגילה ללא שינוי · סטטוס/השהיה בעברית · מועד וערוץ השליחה לפי last_sent · שלד טעינה בכניסה ראשונה · שלד בלוח במעבר בין תזכורות · כשל טעינה ⇒ פס שגיאה ו«נסו שוב» · כתיבה שנקטעה ⇒ «לא ידוע אם נרשמה» + רענון אוטומטי · 401 ⇒ מסך נעול וכפתורי הכותרת כבויים · אישור חוזר ⇒ «כבר אושרה» · כשל בכפתור כותרת ⇒ שורה בדף, בלי חלון');
} finally { await b.close(); srv.kill(); }
