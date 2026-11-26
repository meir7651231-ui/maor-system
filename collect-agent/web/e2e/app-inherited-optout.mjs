// גבי QA (מנהל 416, «הבא» של QA מאז 405/407): כרטיס «ההסרה עברה בירושה» ב-/app/ — שני הכפתורים מקצה לקצה, בלי יירוט.
// מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי:
//  1) ייבוא: דנה (9001+9002) ויעל (9101+9102) ⇒ רשימת פתוחות ⇒ תכנון ⇒ אישור ⇒ שליחה (dry-run).
//  2) שתיהן מבקשות הסרה ⇒ ייבוא שני: 9001 עוברת למיכל (טלפון אחר), 9101 עוברת לנועה ⇒ ההסרה עוברת איתן (219א).
//  3) מיכל ונועה כותבות שאלה רגילה ⇒ לא נרשם כבקשת הסרה שלהן (239) ⇒ כרטיס inherited_optout לכל אחת —
//     ובכרטיס שורת «לקוח/ה: שם · טלפון» (באג שנמצא כאן: שני הכרטיסים היו זהים, בלי לומר על מי מדובר).
//  4) דפדפן: «זה אדם אחר — בטל את ההסרה שעברה» אצל מיכל — לחיצה ראשונה רק מחמשת («לחצו שוב לאישור»), השנייה מבצעת
//     ⇒ טוסט · הכרטיס של מיכל ירד · השרת: מיכל opted_out=0 + audit inherited_optout_lifted.
//  5) «השאר מוסר/ת» אצל נועה (שתי לחיצות) ⇒ הכרטיס ירד · נועה נשארת מוסרת (בקרה: הכפתור השני לא מבטל).
//  6) 407: מיכל כותבת «מתי צריך לשלם?» אחרי הביטול ⇒ לא נרשמת הסרה שלה; בעל העסק מטפל בשאלות שלה (awaiting_owner
//     חוסם עד אז) ⇒ תכנון ⇒ תזכורת ממתינה למיכל על 9001; לא לנועה, לא לדנה/יעל.
//  · 390px (לפני ההכרעה): שני הכרטיסים + צמד הכפתורים בלי גלילה רוחבית, כפתורים ≥40px · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-inherited-optout.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8251, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN },
    stdio: srvStdio('server-app-inherited-optout') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const csv = body => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(body, 'utf8') });
const HEAD = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n';
const DANA = '050-0000811', MICHAL = '050-0000822', YAEL = '050-0000833', NOA = '050-0000844';
const row = (n, name, ph) => `${n},${name},${ph},600,2026-10-15\n`;
const V1 = HEAD + row(9001, 'דנה כהן', DANA) + row(9002, 'דנה כהן', DANA) + row(9101, 'יעל שמיר', YAEL) + row(9102, 'יעל שמיר', YAEL);
const V2 = HEAD + row(9001, 'מיכל לוי', MICHAL) + row(9002, 'דנה כהן', DANA) + row(9101, 'נועה ברק', NOA) + row(9102, 'יעל שמיר', YAEL);
const digits = s => (s || '').replace(/\D/g, '');
const custOf = async ph => (await api('/customers')).find(c => digits(c.phone).endsWith(digits(ph).slice(1)));
const say = (ph, text) => post('/conversation/inbound', { channel: 'sms', sender: ph, text });

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // 1) ייבוא + שער רשימת הפתוחות + תכנון + אישור + שליחה
  const r1 = await csv(V1);
  ok(r1.imported === 4 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));
  const ol = (await api('/open-list')).pending.filter(x => ['9001', '9002', '9101', '9102'].includes(x.number));
  ok(ol.length === 4, 'רשימת הפתוחות: ' + JSON.stringify(ol));
  await post('/open-list/confirm', { still_open: ol.map(x => x.id) });
  await api('/plan', { method: 'POST' });
  const pend = (await api('/reminders')).filter(r => r.status === 'pending_approval');
  ok(pend.length >= 2, 'אין תזכורות ממתינות אחרי תכנון: ' + pend.length);
  for (const r of pend) await post(`/reminders/${r.id}/approve`, { confirm_open: true, confirm_amount: true });
  await api('/dispatch', { method: 'POST' });

  // 2) הסרה של הקודמות ⇒ מעבר בקובץ
  await say(DANA, 'הסר אותי');
  await say(YAEL, 'תפסיקו לשלוח לי הודעות');
  ok((await custOf(DANA)).opted_out && (await custOf(YAEL)).opted_out, 'הקודמות לא מוסרות');
  const r2 = await csv(V2);
  ok(!r2.rejected.length, 'ייבוא שני: ' + JSON.stringify(r2));
  const M = await custOf(MICHAL), N = await custOf(NOA);
  ok(M && N && M.opted_out && N.opted_out, 'ההסרה לא עברה עם החשבונית (219א): ' + JSON.stringify([M, N]));

  // 3) שאלה רגילה ⇒ כרטיס, בלי הסרה על שמן
  await say(MICHAL, 'איך אפשר לשלם?');
  await say(NOA, 'איך אפשר לשלם?');
  const inbox0 = await api('/owner/inbox');
  const cards0 = (Array.isArray(inbox0) ? inbox0 : inbox0.items || []).filter(x => x.intent === 'inherited_optout');
  ok(cards0.length === 2, 'כרטיסי inherited_optout בשרת: ' + JSON.stringify(cards0));

  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${base}/app/#/dashboard`);
  const cards = p.locator('[data-testid="notice"][data-intent="inherited_optout"]');
  await cards.first().waitFor();
  ok(await cards.count() === 2, `כרטיסים בדפדפן: ${await cards.count()}`);
  const cardOf = name => cards.filter({ has: p.getByTestId('notice-customer').filter({ hasText: name }) });
  ok(await cardOf('מיכל לוי').count() === 1 && await cardOf('נועה ברק').count() === 1, 'הכרטיס לא אומר על איזו לקוחה מדובר (שם)');
  ok((await cardOf('מיכל לוי').getByTestId('notice-customer').textContent()).includes(MICHAL), 'אין טלפון בשורת הלקוחה');
  for (const n of ['מיכל', 'נועה']) {
    const t = await cardOf(n).textContent();
    ok(t.includes('לא רשמנו זאת כבקשת הסרה שלו'), 'גוף הכרטיס: ' + t);
    ok(await cardOf(n).getByTestId('notice-inherited-lift').count() === 1 && await cardOf(n).getByTestId('notice-done').count() === 1,
      `אין צמד כפתורים בכרטיס של ${n}`);
  }
  if (out) { await cards.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-22-inherited-optout.png` }); }
  // 390px: שני הכרטיסים עם שורת הלקוחה וצמד הכפתורים — בלי גלילה רוחבית, הכפתורים בתוך המסך
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל (כרטיס הירושה)');
  for (const t of ['notice-inherited-lift', 'notice-done']) {
    const bb = await cardOf('מיכל').getByTestId(t).boundingBox();
    ok(bb && bb.x >= 0 && bb.x + bb.width <= 391 && bb.height >= 40, `${t} ב-390px: ` + JSON.stringify(bb));
  }
  if (out) { await cards.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-22-inherited-optout-390.png` }); }
  await p.setViewportSize({ width: 1280, height: 900 });

  // 4) «זה אדם אחר» — לחיצה ראשונה מחמשת בלבד
  const lift = cardOf('מיכל').getByTestId('notice-inherited-lift');
  await lift.click();
  ok((await lift.textContent()).includes('לחצו שוב לאישור'), 'לחיצה ראשונה לא חימשה');
  ok((await custOf(MICHAL)).opted_out, 'לחיצה אחת כבר ביטלה את ההסרה');
  await lift.click();
  await p.getByTestId('toast').filter({ hasText: 'ההסרה שעברה בוטלה' }).waitFor();
  await cardOf('מיכל').waitFor({ state: 'detached' });
  ok(!(await custOf(MICHAL)).opted_out, 'השרת: מיכל עדיין מוסרת');
  ok((await custOf(DANA)).opted_out, 'השרת: דנה (הקודמת) איבדה את ההסרה שלה');

  // 5) «השאר מוסר/ת» אצל נועה
  const keep = cardOf('נועה').getByTestId('notice-done');
  await keep.click();
  ok((await keep.textContent()).includes('לחצו שוב לאישור'), '«השאר» לא חימש');
  await keep.click();
  await p.getByTestId('toast').filter({ hasText: 'ההסרה נשארת' }).waitFor();
  await cardOf('נועה').waitFor({ state: 'detached' });
  ok((await custOf(NOA)).opted_out, 'השרת: «השאר מוסר/ת» ביטל את ההסרה של נועה');
  ok(await cards.count() === 0, 'נשארו כרטיסי inherited_optout');

  // 6) 407: הודעה רגילה אחרי הביטול ⇒ לא הסרה שלה · תכנון ⇒ תזכורת ממתינה למיכל על 9001
  await say(MICHAL, 'מתי צריך לשלם?');
  ok(!(await custOf(MICHAL)).opted_out, 'הודעה רגילה אחרי «זה אדם אחר» נרשמה כבקשת הסרה של מיכל (407)');
  // השאלות שלה ממתינות לתשובה (awaiting_owner ⇒ אין תזכורת עד שבעל העסק עונה) — מאשרים את התשובות ⇒ תכנון
  const q = await api('/conversation/drafts');
  const dr = q.filter(d => d.customer_id === M.id);
  ok(dr.length >= 1, 'השאלה של מיכל לא הגיעה לתור «תשובות לקוחות»: ' + JSON.stringify(q.map(d => [d.customer, d.status, d.intent])));
  ok(!dr.some(d => d.intent === 'opt_out'), 'נוצר אישור-הסרה למיכל (407)');
  // בעל העסק מטפל: טיוטה ⇒ אישור · כרטיס טיפול ⇒ «טופל» (reject). עד אז awaiting_owner חוסם תזכורת — נכון.
  for (const d of dr) await post(`/conversation/drafts/${d.id}/${d.status === 'pending_approval' ? 'approve' : 'reject'}`);
  await api('/plan', { method: 'POST' });
  const rem = await api('/reminders');
  const pendOf = name => rem.filter(r => r.customer_name === name && r.status === 'pending_approval');
  ok(pendOf('מיכל לוי').some(r => r.number === '9001'), 'אין תזכורת ממתינה למיכל על 9001 אחרי הביטול: ' +
    JSON.stringify(rem.filter(r => r.customer_name === 'מיכל לוי')));
  ok(pendOf('נועה ברק').length === 0, 'נועה (נשארה מוסרת) קיבלה תזכורת');
  ok(pendOf('דנה כהן').length === 0 && pendOf('יעל שמיר').length === 0, 'הקודמות (מוסרות) קיבלו תזכורת');
  await p.reload();
  await p.getByTestId('notice').first().waitFor({ timeout: 5000 }).catch(() => { /* ייתכן שאין התראות כלל */ });
  ok(await cards.count() === 0, 'אחרי רענון כרטיס inherited_optout חזר');

  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /app/ «זה אדם אחר»: מעבר בקובץ מוריש הסרה ⇒ שאלה רגילה ⇒ 2 כרטיסים · «בטל» (2 לחיצות) ⇒ מיכל לא מוסרת, דנה כן, ' +
    'כרטיס ירד · «השאר» ⇒ נועה מוסרת · הודעה אחרי הביטול ≠ הסרה (407) · תכנון ⇒ תזכורת למיכל, לא לנועה · 390px · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
