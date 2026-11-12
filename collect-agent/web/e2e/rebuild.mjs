// הפעלה 153: בנייה מחדש **אמיתית** של תזכורת, בדפדפן. עד כאן (149) הנוסח הישן דומה ביירוט של התצוגה המקדימה
// (גיבוב וסכום מוחלפים); כאן אין שום יירוט: שרת גבי (DEMO=1, dry-run) מדבר ב-HTTP עם שרת ה-mock של חשבונית
// ירוקה (app/gi_mock.py, כמו demo.sh), והסכום עולה במקור בזמן שהתצוגה המקדימה פתוחה אצל בעל העסק.
// סבב 1 · /ui · התזכורת **ממתינה** (3,450.50 ⇒ 3,600.50): הסכום עולה במקור, ה-webhook של ה-mock מפעיל סנכרון,
//   והסנכרון בונה את הנוסח מחדש (הפעלה 153, `_rebuild_pending_on_amount_drift`). «אישור ושליחה» מהתצוגה הפתוחה
//   ⇒ 409 אמיתי ⇒ התצוגה נטענת מחדש עם «הסכום השתנה מ-… ל-…», ושום דבר לא יצא.
// סבב 2 · /app/ · התזכורת **מאושרת** (3,600.50 ⇒ 3,750.50): לשונית אחרת (ה-API) מאשרת, הסכום עולה, ו-/dispatch
//   לא שולח אלא בונה מחדש ומחזיר לאישור (סבב 56). «אשר ושלח» מהתצוגה הפתוחה ⇒ אותו סירוב ואותו הסבר.
// בסוף: אישור אמיתי על הנוסח העדכני ושליחה (dry-run); ביומן היוצאים רק הסכום האחרון.
// דרישה: npm run build. הרצה: node e2e/rebuild.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8145, GI_PORT = 8146, base = `http://127.0.0.1:${PORT}`, gi = `http://127.0.0.1:${GI_PORT}/api/v1`;
const TOKEN = randomBytes(32).toString('base64url');
const WH_KEY = randomBytes(18).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
const DOC = 'demo2';   // יוסי כהן (דמו), חשבונית 2002: התזכורת שהתרחיש משאיר ממתינה לאישור
await assertPortFree(PORT); await assertPortFree(GI_PORT);
const mock = spawn('python3', ['-m', 'app.gi_mock', '--port', String(GI_PORT), '--seed', 'demo',
  '--webhook', `${base}/webhooks/greeninvoice?k=${WH_KEY}`], { cwd: ROOT, stdio: srvStdio('mock-rebuild') });
const rawFetch = globalThis.fetch;
const up = async url => { for (let i = 0; i < 80; i++) { try { await rawFetch(url); return; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); } throw new Error('לא עלה: ' + url); };
let srv = null;
process.on('exit', () => { mock.kill(); srv?.kill(); });   // גם ביציאה על חריגה — לא משאירים שרתים על הפורטים
await up(gi + '/users/me');
srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', PORT: String(PORT), OWNER_API_TOKEN: TOKEN, GI_WEBHOOK_KEY: WH_KEY,
    GREENINVOICE_ENV: 'mock', GREENINVOICE_MOCK_URL: gi }, stdio: srvStdio('server-rebuild') });
await up(base + '/health');
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async p => (await rawFetch(base + p, { headers: H })).json();
const post = (p, body) => rawFetch(base + p, { method: 'POST', headers: H, body: JSON.stringify(body ?? {}) });
const outbox = async () => (await api('/outbox')).messages;
const hasAmt = (s, amt) => String(s ?? '').includes(amt);
const setAmount = async to => {
  const r = await rawFetch(`${gi}/_mock/documents/${DOC}/amount`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: to }) });
  ok(r.status === 200, `ה-mock לא עדכן את הסכום: ${r.status} ${await r.text()}`);
};
const rebuilt = (pv, seen) => {
  ok(pv.status === 'pending_approval' && pv.block_reason === 'amount_changed', `התזכורת לא ממתינה לאישור מחדש: ${pv.status} / ${pv.block_reason}`);
  ok(pv.body_hash !== seen, 'התזכורת נבנתה מחדש בלי שהגיבוב השתנה');
  return pv;
};
/** תזכורת ממתינה: הסכום עולה במקור ⇒ ה-webhook של ה-mock מגיע לשרת ⇒ סנכרון ⇒ הנוסח נבנה מחדש. בלי /dispatch. */
async function raiseWhilePending(rid, seen, to) {
  const before = (await outbox()).length;
  await setAmount(to);
  let pv = null;
  for (let i = 0; i < 100; i++) { pv = await api(`/reminders/${rid}/preview`); if (pv.body_hash !== seen) break; await new Promise(r => setTimeout(r, 100)); }
  ok(pv.body_hash !== seen, 'אחרי webhook וסנכרון הנוסח של התזכורת הממתינה נשאר על הסכום הישן (כותרת: ' + pv.total_text + ')');
  ok((await outbox()).length === before, 'יומן היוצאים גדל אחרי שהסכום במקור השתנה');
  return rebuilt(pv, seen);
}
/** תזכורת מאושרת (מלשונית אחרת): הסכום עולה במקור, והשליחה בונה את התזכורת מחדש במקום לשלוח. */
async function approveThenRaise(rid, seen, to, between) {
  const a = await post(`/reminders/${rid}/approve`, { seen_hash: seen });
  ok(a.status === 200, `אישור מלשונית אחרת נכשל: ${a.status} ${await a.text()}`);
  const before = (await outbox()).length;
  await setAmount(to);
  if (between) await between();
  const d = await (await post('/dispatch')).json();
  ok(d.dry_run === true && d.sent.length === 0, 'יצאה תזכורת מאושרת אחרי שהסכום במקור השתנה: ' + JSON.stringify(d));
  ok((await outbox()).length === before, 'יומן היוצאים גדל אחרי שהסכום במקור השתנה');
  return rebuilt(await api(`/reminders/${rid}/preview`), seen);
}
const errors = [], allowed409 = [], seenSent = [];
const watch = pg => {
  pg.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  pg.on('response', r => {
    if (r.status() < 400) return;
    if (r.status() === 409 && /\/reminders\/\d+\/approve$/.test(r.url()) && r.headers()['x-gabi-stale'] === 'preview') { allowed409.push(r.url()); return; }
    errors.push(`${r.status()} ${r.url()}`);
  });
  pg.on('request', r => {
    if (!r.url().startsWith(base) && !/^(data|about|blob):/.test(r.url())) errors.push(`בקשה חיצונית: ${r.url()}`);
    if (r.method() === 'POST' && /\/reminders\/\d+\/approve$/.test(r.url())) seenSent.push(JSON.parse(r.postData() || '{}').seen_hash ?? null);
  });
};
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const start = (await api('/reminders?view=summary')).filter(r => r.status === 'pending_approval' && r.total_text === '3,450.50 ₪');
  ok(start.length === 1, 'אין בדמו תזכורת ממתינה אחת על 3,450.50 ₪ (יוסי): ' + JSON.stringify(start));
  const rid = start[0].id;
  const out0 = (await outbox()).length;

  // ── סבב 1 · /ui · תזכורת ממתינה ── התצוגה פתוחה על 3,450.50 ⇒ הסכום עולה במקור ל-3,600.50 ⇒ «אישור ושליחה»
  const p = await ctx.newPage(); watch(p);
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(base + '/ui');
  await p.locator('#list .item', { hasText: 'יוסי' }).click();
  await p.locator('#ok').waitFor();
  ok(hasAmt(await p.locator('#detail').innerText(), '3,450.50'), '/ui: התצוגה המקדימה לא מציגה את הסכום ההתחלתי');
  const seenA = (await api(`/reminders/${rid}/preview`)).body_hash;
  const pvB = await raiseWhilePending(rid, seenA, 3600.5);
  ok(pvB.total_text === '3,600.50 ₪' && hasAmt(pvB.messages[0].body, '3,600.50') && !hasAmt(pvB.messages[0].body, '3,450.50'), 'הנוסח שנבנה מחדש לא על הסכום החדש: ' + pvB.messages[0].body);
  ok(hasAmt(await p.locator('#detail').innerText(), '3,450.50') && await p.locator('#dstale').count() === 0, '/ui: התצוגה הפתוחה השתנתה לפני הלחיצה (הבדיקה לא בודקת נוסח ישן)');
  await p.locator('#ok').click();
  await p.locator('#dstale').waitFor();
  const stale1 = await p.locator('#dstale').textContent();
  ok(stale1.includes('הסכום השתנה מ-3,450.50 ₪ ל-3,600.50 ₪.') && stale1.includes('שום דבר לא נשלח'), '/ui: ההסבר לא מציג את הסכום לפני ואחרי: ' + stale1);
  ok(seenSent.length === 1 && seenSent[0] === seenA, '/ui: האישור לא נשלח עם הגיבוב של הנוסח שהוצג: ' + seenSent);
  ok(allowed409.length === 1, '/ui: הסירוב לא הגיע כ-409 עם X-Gabi-Stale');
  ok((await p.locator('#derr').textContent()) === '', '/ui: שורת שגיאה למרות שהתצוגה נטענה מחדש');
  const d1 = await p.locator('#detail').innerText();
  ok(hasAmt(d1, '3,600.50'), '/ui: אחרי הטעינה מחדש הלוח לא מציג את הסכום המעודכן');
  ok(await p.locator('#ok').isEnabled(), '/ui: אחרי הטעינה מחדש אי אפשר לאשר');
  ok((await api(`/reminders/${rid}/preview`)).status === 'pending_approval', '/ui: התזכורת אושרה מתצוגה ישנה');
  ok((await outbox()).length === out0, '/ui: יצאה הודעה מתצוגה ישנה');
  if (out) await p.screenshot({ path: `${out}/rebuild-01-ui.png`, fullPage: true });
  await p.close();
  console.log('  ✓ /ui: הסכום עלה במקור בזמן ההמתנה ⇒ הסנכרון בנה את הנוסח מחדש, והאישור מהתצוגה הישנה נדחה עם «מ-3,450.50 ₪ ל-3,600.50 ₪»');

  // ── סבב 2 · /app/ · תזכורת מאושרת ── התצוגה פתוחה על 3,600.50 ⇒ הסכום עולה שוב ל-3,750.50 ⇒ «אשר ושלח»
  const q = await ctx.newPage(); watch(q);
  await q.setViewportSize({ width: 1280, height: 900 });
  await q.goto(base + `/app/#/dashboard?token=${TOKEN}`);
  const items = q.locator('li', { has: q.getByRole('button', { name: 'תצוגה ואישור' }) });
  await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await q.waitForFunction(() => (document.querySelector('textarea')?.value ?? '').includes('3,600.50'));
  ok(await q.getByTestId('mp-stale').count() === 0, '/app/: «הסכום השתנה» מוצג לפני שקרה משהו');
  // הפעלה 154: בין הסנכרון לשליחה התזכורת מאושרת, הסכום במקור כבר 3,750.50 והנוסח עדיין על 3,600.50.
  // /ui מציג את הפער במפורש (amount_drift), בלי כפתור אישור, ושום דבר לא יוצא.
  const driftSeen = async () => {
    let pv = null;
    for (let i = 0; i < 100; i++) { pv = await api(`/reminders/${rid}/preview`); if (pv.amount_drift) break; await new Promise(r => setTimeout(r, 100)); }
    ok(pv.status === 'approved' && pv.body_hash === pvB.body_hash, `הסנכרון שינה תזכורת מאושרת: ${pv.status}`);
    ok(pv.amount_drift?.was_text === '3,600.50 ₪' && pv.amount_drift?.now_text === '3,750.50 ₪', 'amount_drift: ' + JSON.stringify(pv.amount_drift));
    const u = await ctx.newPage(); watch(u);
    await u.setViewportSize({ width: 1280, height: 900 });
    await u.goto(base + '/ui');
    await u.locator('#list .item', { hasText: 'יוסי' }).click();
    await u.locator('#driftNote').waitFor();
    const note = await u.locator('#driftNote').textContent();
    ok(note.includes('מ-3,600.50 ₪ ל-3,750.50 ₪') && note.includes('לא יישלח כך') && note.includes('תחזור אליכם לאישור'), '/ui: הערת הפער לא מסבירה מה השתנה: ' + note);
    ok(hasAmt(await u.locator('.bubble').first().innerText(), '3,600.50'), '/ui: הנוסח המאושר השתנה לפני השליחה');
    ok(await u.locator('#ok').count() === 0, '/ui: כפתור אישור על תזכורת מאושרת');
    // «לבדוק ולאשר מחדש» (מהבנייה הקודמת) לא מוצג על תזכורת שכבר אושרה; רק הערת הפער
    ok(await u.locator('#blockNote').count() === 0, '/ui: «לבדוק ולאשר מחדש» על תזכורת שכבר אושרה');
    if (out) await u.screenshot({ path: `${out}/rebuild-02-drift.png`, fullPage: true });
    await u.close();
    console.log('  ✓ /ui: תזכורת מאושרת שהסכום שלה עלה במקור ⇒ «מ-3,600.50 ₪ ל-3,750.50 ₪ … לא יישלח כך», לפני ה-/dispatch');
  };
  const pvC = await approveThenRaise(rid, pvB.body_hash, 3750.5, driftSeen);
  ok(pvC.total_text === '3,750.50 ₪', 'הסכום אחרי הבנייה השנייה: ' + pvC.total_text);
  ok(hasAmt(await q.locator('textarea').first().inputValue(), '3,600.50'), '/app/: התצוגה הפתוחה השתנתה לפני הלחיצה');
  await q.getByRole('button', { name: /אשר ושלח/ }).click();
  const box = q.getByTestId('mp-stale');
  await box.waitFor();
  const stale2 = await box.textContent();
  ok(stale2.includes('הסכום השתנה מ-3,600.50 ₪ ל-3,750.50 ₪.') && stale2.includes('שום דבר לא נשלח'), '/app/: ההסבר לא מציג את הסכום לפני ואחרי: ' + stale2);
  ok(seenSent.length === 2 && seenSent[1] === pvB.body_hash && allowed409.length === 2, '/app/: האישור לא נדחה על הגיבוב של הנוסח שהוצג');
  await q.waitForFunction(() => (document.querySelector('textarea')?.value ?? '').includes('3,750.50'));
  ok((await q.getByTestId('mp-sub').textContent()).includes('3,750.50 ₪'), '/app/: הכותרת לא מציגה את הסכום המעודכן');
  ok(await q.getByText(/לא אושר/).count() === 0, '/app/: «לא אושר» למרות שהתצוגה נטענה מחדש');
  ok((await outbox()).length === out0, '/app/: יצאה הודעה מתצוגה ישנה');
  if (out) await q.screenshot({ path: `${out}/rebuild-02-app.png` });
  // עכשיו בעל העסק רואה את הנוסח העדכני ומאשר אותו ⇒ האישור עובר, והשליחה מוציאה רק את הסכום האחרון
  // «אשר ושלח» ב-/app/ מאשר ומיד מפעיל /dispatch (store.tsx) ⇒ בודקים את שתי התשובות של הממשק עצמו
  const [res, disp] = await Promise.all([
    q.waitForResponse(r => /\/reminders\/\d+\/approve$/.test(r.url())),
    q.waitForResponse(r => r.url() === base + '/dispatch'),
    q.getByRole('button', { name: /אשר ושלח/ }).click(),
  ]);
  ok(res.status() === 200 && seenSent[2] === pvC.body_hash, `/app/: האישור על הנוסח העדכני לא עבר: ${res.status()}`);
  const sent = await disp.json();
  ok(sent.dry_run === true && sent.sent.some(x => x.reminder_id === rid), 'התזכורת שאושרה על הנוסח העדכני לא נשלחה (dry-run): ' + JSON.stringify(sent));
  await q.getByRole('dialog').waitFor({ state: 'detached' });
  ok((await api(`/reminders/${rid}/preview`)).status.startsWith('sent'), 'התזכורת לא מסומנת כנשלחה');
  const mine = (await outbox()).slice(out0);
  ok(mine.length >= 1 && mine.every(m => hasAmt(m.body, '3,750.50')), 'יצאה הודעה בלי הסכום העדכני: ' + JSON.stringify(mine.map(m => m.body)));
  ok(!mine.some(m => hasAmt(m.body, '3,450.50') || hasAmt(m.body, '3,600.50') || hasAmt(m.html, '3,450.50') || hasAmt(m.html, '3,600.50')), 'יצא סכום ישן');
  console.log('  ✓ /app/: עלייה שנייה אחרי אישור ⇒ השליחה בנתה מחדש, «מ-3,600.50 ₪ ל-3,750.50 ₪», אישור על הנוסח העדכני עבר, ויצא (dry-run) רק 3,750.50 ₪');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ בנייה מחדש אמיתית מול ה-mock של חשבונית ירוקה: בלי יירוט, שני הממשקים, ושום הודעה לא יצאה על סכום שבעל העסק לא ראה');
} finally { await b.close(); srv.kill(); mock.kill(); }
