// סטוריבורד לסרטון הדמו של גבי — מצלם פריימים **מהמערכת האמיתית** (שרת DEMO=1, dry-run, נתונים בדויים).
// שום הודעה לא נשלחת באמת. דרישות: `cd web && npm run build`, ו-python עם התלויות של collect-agent.
// הרצה (מתיקיית collect-agent):  node marketing/video/storyboard.mjs
// פלט: marketing/video/frames/NN-*.png (16:9, 1280×720 · מובייל 390×844) + storyboard.html (עם הקריינות).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { chromium, devices } = require('playwright');

const ROOT = new URL('../..', import.meta.url).pathname;           // collect-agent/
const OUT = new URL('./frames/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const PORT = 8151, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const PY = process.env.PYTHON || 'python3';
const srv = spawn(PY, ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', 'warning'],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: 'ignore' });
const api = async p => (await fetch(base + p, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עולה */ } await new Promise(r => setTimeout(r, 250)); }
const health = await (await fetch(base + '/health')).json();
if (health.dry_run !== true) { srv.kill(); throw new Error('השרת לא ב-dry-run — עוצרים'); }

// הקריינות לכל פריים (מקור יחיד: גם ל-storyboard.html וגם ל-script.md)
const SCENES = JSON.parse(readFileSync(new URL('./scenes.json', import.meta.url)));
const shots = [];
const errors = [];
const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(String(e)));
  const snap = async (n, pg = p) => { const f = `${String(n).padStart(2, '0')}-${SCENES[n - 1].key}.png`; await pg.screenshot({ path: OUT + f }); shots.push(f); };

  // 1 · הוק: כותרת דף הנחיתה
  await p.goto(base + '/app/'); await p.getByTestId('hero-title').waitFor(); await p.waitForTimeout(400);
  await snap(1);

  // 2 · דשבורד: «יש לך X פתוחות» (רגע ה-wow)
  await p.goto(base + `/app/#/dashboard?token=${TOKEN}`);
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await p.getByTestId('kpis').waitFor(); await p.waitForTimeout(300);
  await snap(2);

  // 3 · תור אישורים: תצוגה מקדימה של ה-SMS (מהשרת)
  const items = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) });
  await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  await snap(3);

  // 4 · אישור ⇒ «לא נשלחה הודעה אמיתית» (dry-run)
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  await snap(4);

  // 5 · מה הלקוח רואה: ה-SMS האמיתי מהיומן, בבועה על מסך טלפון
  const sms = (await api('/outbox')).messages.filter(x => x.channel === 'sms' && x.body.includes('/p/')).at(-1);
  const phone = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const sender = sms.body.split(':')[0];
  // בדמו הקישור מצביע לשרת המקומי; בפריים מציגים את דומיין ה-placeholder (gabi.example) — מצוין בכיתוב
  const shown = sms.body.replace(/https?:\/\/127\.0\.0\.1:\d+/g, 'gabi.example');
  await phone.setContent(`<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#F1F5F9;font:17px/1.5 Heebo,system-ui,sans-serif">
    <div style="background:#fff;padding:14px;text-align:center;border-bottom:1px solid #E2E8F0"><div style="width:44px;height:44px;border-radius:50%;background:#E2E8F0;margin:0 auto;display:grid;place-items:center;font-weight:800">${esc(sender[0])}</div><b style="font-size:14px">${esc(sender)}</b></div>
    <div style="padding:14px"><div style="text-align:center;color:#64748B;font-size:12px;margin:6px 0 10px">היום 10:00</div>
    <div style="background:#fff;border-radius:18px 18px 4px 18px;padding:12px;box-shadow:0 1px 2px rgba(0,0,0,.08);max-width:88%">${esc(shown)}</div></div></body></html>`);
  await snap(5, phone);

  // 6 · עמוד התשלום של הלקוח (/pay/{code}) — Bit / Apple Pay / כרטיס ⇒ דף התשלום של העסק
  const code = sms.body.split('/p/')[1].split(/\s/)[0];
  await phone.goto(base + `/pay/${code}`); await phone.getByTestId('pay-amount').waitFor(); await phone.waitForTimeout(300);
  await snap(6, phone);

  // 7 · הלקוח עונה «אפשר ב-3 תשלומים?» ⇒ הצעה ממתינה לאישור בעל העסק
  await p.goto(base + '/app/#/dashboard'); await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await p.getByLabel('לקוח').selectOption({ label: 'יוסי כהן (דמו)' });
  await p.getByRole('button', { name: 'אפשר ב-3 תשלומים?' }).click();
  await p.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
  const plan = p.getByTestId('needs-you').locator('li', { hasText: 'הצעת פריסה' });
  await plan.waitFor(); await plan.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await snap(7);

  // 8 · סגירה: מחיר אחד
  await p.goto(base + '/app/'); await p.locator('#pricing').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await snap(8);

  if (errors.length) throw new Error('שגיאות בדף:\n' + errors.join('\n'));
} finally { await b.close(); srv.kill(); }

// storyboard.html — לצפייה מקומית (טיוטה, noindex)
const cards = SCENES.map((s, i) => `<figure><img src="frames/${shots[i]}" alt="${s.title}" loading="lazy"><figcaption><b>${s.t} · ${s.title}</b><p>🎙 ${s.vo}</p><p class="os">📝 על המסך: ${s.onscreen}</p>${s.note ? `<p class="os">ℹ️ ${s.note}</p>` : ''}</figcaption></figure>`).join('\n');
writeFileSync(new URL('./storyboard.html', import.meta.url), `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>גבי · סטוריבורד דמו (טיוטה)</title>
<style>body{margin:0;background:#FBF8F1;color:#0F172A;font:16px/1.6 Heebo,system-ui,sans-serif}.d{background:#FEF3C7;color:#92400E;text-align:center;font-weight:700;padding:6px}main{max-width:1200px;margin:0 auto;padding:16px;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))}figure{margin:0;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden}img{width:100%;display:block;background:#0F172A;max-height:420px;object-fit:contain}figcaption{padding:12px 14px}p{margin:6px 0}.os{color:#475569;font-size:14px}h1{margin:16px auto 0;max-width:1200px;padding:0 16px}</style></head>
<body><div class="d">טיוטה, לא לפרסום · פריימים מהמערכת האמיתית במצב בדיקה (dry-run), נתונים בדויים</div><h1>גבי · סטוריבורד לסרטון 60 שניות</h1><main>${cards}</main></body></html>`);
console.log(`✓ ${shots.length} פריימים נוצרו ב-marketing/video/frames + storyboard.html · 0 שגיאות · dry_run=${health.dry_run}`);
