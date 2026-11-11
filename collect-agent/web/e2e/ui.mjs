// הפעלה 133: הדשבורד הפשוט (/ui) מול שרת DEMO=1 אמיתי (dry-run). התזכורת של גל שרון (סכום חריג, 2,490 ₪)
// נתקעה שם: «אישור ושליחה» נשלח בלי confirm_amount והשרת דחה תמיד. כאן: התיבה מופיעה, הכפתור נעול
// עד הסימון, והאישור עובר. הרצה: node e2e/ui.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8143, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', 'warning'],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: 'ignore' });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); }
const errors = [];
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
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui: סכום חריג מאושר רק אחרי סימון מפורש · תזכורת רגילה ללא שינוי');
} finally { await b.close(); srv.kill(); }
