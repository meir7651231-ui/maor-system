// הפעלה 232 (critic סבב 95): לקוח כתב ⇒ awaiting_owner עוצר את התזכורות אליו, אבל /ui לא הראה את ההודעה ולא
// אפשר לענות או לסגור — בעל עסק שעובד רק ב-/ui היה תקוע. כאן מול שרת DEMO=1 אמיתי (dry-run), בלי יירוט:
// שתי הודעות נכנסות («איך משלמים?» עם טיוטה, ו«מה זה בכלל?» בלי) ⇒ כרטיס «הודעות מלקוחות» עם ציטוט ההודעה ·
// עריכת הטיוטה ⇒ «אישור ושליחה» ⇒ השרת שמר את הנוסח הערוך · בלי טיוטה «אישור» כבוי ⇒ «סגירה בלי מענה» ⇒ השרת:
// rejected · התור ריק ⇒ הכרטיס נעלם · מובייל בלי גלילה רוחבית.
// גבי בדיקות: הנוסח הערוך הוא שיצא בפועל (/outbox) · «הסר» של בעל העסק (סבב 97) חובה, על לקוח עם תזכורת
// מאושרת ⇒ אחרי ההסרה /plan + /dispatch + flush לא מוציאים אליו כלום, והתזכורת בוטלה. הרצה: node e2e/ui-messages.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8148, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-messages') });
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
  // גבי בדיקות: C = לקוח עם תזכורת שממתינה לאישור (הדמו משאיר אחת) — כדי להוכיח שאחרי «הסר» היא לא יוצאת.
  // היה `if (C)` — בדמו עם פחות מ-3 לקוחות השלב דולג בשקט ו«עבר». נבחר ראשון; A ו-B מהשאר.
  const pendR = (await api('/reminders?status=pending_approval')).filter(r => !r.block_reason);
  const C = custs.find(c => pendR.some(r => r.customer_name === c.name));
  ok(C, 'אין בדמו לקוח עם תזכורת שממתינה לאישור — שלב ההסרה חייב לרוץ');
  const [A, B] = custs.filter(c => c.id !== C.id);
  ok(A && B, 'אין שני לקוחות נוספים עם טלפון בדמו');
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
  // גבי בדיקות: מה שיצא בפועל (יומן היוצאים) = הנוסח הערוך, לא הטיוטה המקורית
  if (sA.status !== 'sent_dry_run') await api('/conversation/flush', { method: 'POST' });
  const outA = (await api('/outbox')).messages.filter(m => m.to === A.phone.replace(/\D/g, '').replace(/^0/, '972') || m.to === A.email);
  ok(outA.some(m => m.body.includes('תודה רבה!')), 'הנוסח הערוך לא יצא בפועל: ' + JSON.stringify(outA.map(m => m.body.slice(0, 60))));
  ok(!outA.some(m => m.body.trim() === dA.body.trim()), 'יצאה גם/במקום הטיוטה המקורית');
  // בלי מענה: סגירה
  await rowB.getByRole('button', { name: 'סגירה בלי מענה' }).click();
  await rowB.waitFor({ state: 'detached' });
  ok((await api('/conversation/drafts?status=rejected')).some(d => d.id === dB.id), 'השרת: ההודעה של B לא נסגרה');
  // critic סבב 97: המנוע לא זיהה בקשת הסרה ⇒ בעל העסק קורא ומסיר בעצמו. לחיצה ראשונה רק מחמשת (סופי)
  const rC = pendR.find(r => r.customer_name === C.name);
  await api(`/reminders/${rC.id}/approve`, { method: 'POST' });   // בעל העסק כבר אישר את התזכורת אליו
  const toC = new Set([C.phone.replace(/\D/g, '').replace(/^0/, '972'), C.email].filter(Boolean));
  {
    await post('/conversation/inbound', { channel: 'sms', sender: C.phone, text: 'בבקשה תעצרו את זה כבר, לא רלוונטי לי' });
    await p.evaluate(() => load(false));
    const dC = (await api('/conversation/drafts')).find(d => d.customer_id === C.id);
    ok(dC, 'ההודעה של C לא בתור');
    const rowC = card.locator(`li[data-did="${dC.id}"]`);
    await rowC.waitFor();
    await rowC.getByRole('button', { name: /הלקוח ביקש הסרה/ }).click();
    ok(!(await api('/customers')).find(c => c.id === C.id).opted_out, 'לחיצה אחת כבר הסירה (צריך שתיים)');
    await rowC.getByRole('button', { name: /לחצו שוב להסרה סופית/ }).waitFor();
    if (out) await p.screenshot({ path: `${out}/ui-15-owner-opt-out.png` });
    await rowC.getByRole('button', { name: /לחצו שוב להסרה סופית/ }).click();
    await rowC.waitFor({ state: 'detached' });
    ok((await api('/customers')).find(c => c.id === C.id).opted_out, 'השרת: C לא הוסר/ה');
    ok(/הוסר/.test(await p.locator('#cmDone').textContent()), 'הודעת הצלחה להסרה');
    // אחרי «הסר»: שום דבר לא יוצא אל C — לא התזכורת שכבר אושרה, לא תזכורת חדשה, לא טיוטה
    const mark = (await api('/outbox')).messages.length;
    await api('/plan', { method: 'POST' });
    for (const r of (await api('/reminders?status=pending_approval')).filter(r => r.customer_name === C.name)) {
      const res = await fetch(base + `/reminders/${r.id}/approve`, { method: 'POST', headers: H });
      ok(!res.ok || res.status === 409, 'תזכורת חדשה אל לקוח שהוסר אושרה');
    }
    await api('/dispatch', { method: 'POST' });
    await api('/conversation/flush', { method: 'POST' });
    const after = (await api('/outbox')).messages.slice(mark).filter(m => toC.has(m.to));
    ok(after.length === 0, 'אחרי «הסר» יצאה הודעה אל הלקוח: ' + JSON.stringify(after.map(m => [m.channel, m.body.slice(0, 50)])));
    const stC = (await api('/reminders')).find(r => r.id === rC.id);
    ok(stC && !['approved', 'sent_dry_run', 'pending_approval'].includes(stC.status),
      'התזכורת שאושרה לפני ההסרה לא בוטלה: ' + (stC && stC.status));
  }
  if (!(await api('/conversation/drafts')).length) await card.waitFor({ state: 'hidden' });
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui הודעות מלקוחות: ציטוט+סיכום · עריכה שורדת רענון · אישור ⇒ השרת שמר את הנוסח הערוך · בלי טיוטה «אישור» כבוי ⇒ סגירה ⇒ rejected · הכרטיס נעלם · מובייל');
} finally { await b.close(); srv.kill(); }
