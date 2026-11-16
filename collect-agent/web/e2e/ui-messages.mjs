// הפעלה 232 (critic סבב 95): לקוח כתב ⇒ awaiting_owner עוצר את התזכורות אליו, אבל /ui לא הראה את ההודעה ולא
// אפשר לענות או לסגור — בעל עסק שעובד רק ב-/ui היה תקוע. כאן מול שרת DEMO=1 אמיתי (dry-run), בלי יירוט:
// שתי הודעות נכנסות («איך משלמים?» עם טיוטה, ו«מה זה בכלל?» בלי) ⇒ כרטיס «הודעות מלקוחות» עם ציטוט ההודעה ·
// עריכת הטיוטה ⇒ «אישור ושליחה» ⇒ השרת שמר את הנוסח הערוך · בלי טיוטה «אישור» כבוי ⇒ «סגירה בלי מענה» ⇒ השרת:
// rejected · התור ריק ⇒ הכרטיס נעלם · מובייל בלי גלילה רוחבית. הרצה: node e2e/ui-messages.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8148, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-messages') });
process.on('exit', () => srv.kill());
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/conversation/drafts')).length === 0, 'הדמו התחיל עם הודעות בתור (app/demo.py מאשר את כולן)');
  const custs = (await api('/customers')).filter(c => c.phone && !c.opted_out && !c.disputed);
  ok(custs.length >= 2, 'אין שני לקוחות עם טלפון בדמו');
  const [A, B] = custs;
  await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'היי, איך אפשר לשלם?' });
  await post('/conversation/inbound', { channel: 'sms', sender: B.phone, text: 'מה זה בכלל? לא מבין' });
  const q = await api('/conversation/drafts');
  const dA = q.find(d => d.customer_id === A.id), dB = q.find(d => d.customer_id === B.id);
  ok(dA && dB, 'שתי ההודעות לא בתור: ' + JSON.stringify(q.map(d => [d.customer, d.intent, d.status])));
  ok((dA.body || '').trim(), 'ל«איך משלמים» אין טיוטה');

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  const card = p.locator('#cm');
  await card.locator('li[data-did]').first().waitFor();
  ok(await card.locator('li[data-did]').count() === q.length, 'מספר השורות בכרטיס ≠ התור');
  ok(/הודעות מלקוחות מחכות לכם|לקוח אחד כתב לכם/.test(await p.locator('#cmH').textContent()), 'כותרת: ' + await p.locator('#cmH').textContent());
  const rowA = card.locator(`li[data-did="${dA.id}"]`), rowB = card.locator(`li[data-did="${dB.id}"]`);
  ok((await rowA.textContent()).includes(A.name) && (await rowA.locator('.sum').textContent()).trim() === dA.owner_summary.trim(), 'השורה לא מציגה את הסיכום/השם');
  ok((await rowA.locator('textarea').inputValue()).trim() === dA.body.trim(), 'הטיוטה לא בתיבה');
  if (dB.status === 'needs_owner') {
    ok(await rowB.getByRole('button', { name: 'אישור ושליחה' }).isDisabled(), '«אישור» פעיל בלי מענה');
    ok(/אין טיוטה/.test(await rowB.textContent()), 'אין הסבר «אין טיוטה»');
  }
  if (out) await p.screenshot({ path: `${out}/ui-14-customer-messages.png` });
  // עריכה + רענון באמצע (load) לא מוחקים את מה שהוקלד
  const edited = dA.body.trim() + ' תודה רבה!';
  await rowA.locator('textarea').fill(edited);
  await p.evaluate(() => load(false));
  ok((await rowA.locator('textarea').inputValue()) === edited, 'רענון מחק את העריכה');
  await rowA.getByRole('button', { name: 'אישור ושליחה' }).click();
  await p.locator('#cmDone').waitFor();
  ok(/אושר ונשלח/.test(await p.locator('#cmDone').textContent()), 'הודעת הצלחה: ' + await p.locator('#cmDone').textContent());
  await rowA.waitFor({ state: 'detached' });
  const all = await api('/conversation/drafts?status=');
  const sA = all.find(d => d.id === dA.id);
  ok(['approved', 'sent_dry_run'].includes(sA.status) && sA.body === edited && sA.edited === 1, 'השרת: ' + JSON.stringify({ s: sA.status, b: sA.body, e: sA.edited }));
  // בלי מענה: סגירה
  await rowB.getByRole('button', { name: 'סגירה בלי מענה' }).click();
  await rowB.waitFor({ state: 'detached' });
  ok((await api('/conversation/drafts?status=rejected')).some(d => d.id === dB.id), 'השרת: ההודעה של B לא נסגרה');
  if (!(await api('/conversation/drafts')).length) await card.waitFor({ state: 'hidden' });
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui הודעות מלקוחות: ציטוט+סיכום · עריכה שורדת רענון · אישור ⇒ השרת שמר את הנוסח הערוך · בלי טיוטה «אישור» כבוי ⇒ סגירה ⇒ rejected · הכרטיס נעלם · מובייל');
} finally { await b.close(); srv.kill(); }
