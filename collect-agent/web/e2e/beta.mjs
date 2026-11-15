// ערכת הבטא (גבי מכירות): היום הראשון של כל ענף בבטא — מספרה, מוסך, קליניקה, לקוח רו״ח — בממשק המעוצב.
// לכל ענף: gi_mock עם נתוני הענף (app/beta_seeds.py, בדויים) ⇒ שרת גבי אמיתי (dry-run, לא DEMO) ⇒ סנכרון+תכנון
// ⇒ הדשבורד מציג את מספר הפתוחות, אף הודעה לא יצאה, בלי גלילה רוחבית, 0 שגיאות ⇒ צילום לכל ענף.
// דרישה: npm run build. הרצה: node e2e/beta.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const VERTICALS = { barber: 'מספרת הדמו', garage: 'מוסך הדמו', clinic: 'קליניקת הדמו', cpa: 'סטודיו הייעוץ דמו' };

const b = await chromium.launch();
const summary = [];
try {
  let port = 8171;
  for (const [v, biz] of Object.entries(VERTICALS)) {
    const P = port, G = port + 1; port += 2;
    const TOKEN = (await import('node:crypto')).randomBytes(32).toString('base64url');
    const H = { Authorization: `Bearer ${TOKEN}` };
    await assertPortFree(P); await assertPortFree(G);
    const gi = spawn('python3', ['-m', 'app.gi_mock', '--port', String(G), '--seed', v], { cwd: root, stdio: srvStdio(`gi-beta-${v}`) });
    const env = { ...process.env, OWNER_API_TOKEN: TOKEN, GREENINVOICE_ENV: 'mock',
      GREENINVOICE_MOCK_URL: `http://127.0.0.1:${G}/api/v1`, GREENINVOICE_API_ID: 'demo-id', GREENINVOICE_API_SECRET: 'demo-secret',
      BUSINESS_NAME: biz, SMS_SENDER_ID: 'GabiDemo', PAYMENT_LINK_MODE: 'static', PAYMENT_LINK: 'https://pay.example/gabi-demo',
      PAYMENT_DOMAINS: 'pay.example', EMAIL_FROM: 'gabi@example.com', EMAIL_REPLY_TO: 'owner@example.com',
      PUBLIC_BASE_URL: `http://127.0.0.1:${P}`, DB_PATH: join(mkdtempSync(join(tmpdir(), 'gabi-beta-')), 'gabi.db') };
    delete env.DEMO;
    const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(P), '--log-level', srvLogLevel()],
      { cwd: root, env, stdio: srvStdio(`server-beta-${v}`) });
    try {
      await waitHealthy(`http://127.0.0.1:${G}`, gi, { name: 'mock של חשבונית ירוקה', path: '/api/v1/users/me', anyStatus: true });
      const base = `http://127.0.0.1:${P}`;
      await waitHealthy(base, srv);
      ok((await (await fetch(base + '/health')).json()).dry_run === true, 'השרת לא ב-dry-run');
      const sync = await (await fetch(base + '/sync', { method: 'POST', headers: H })).json();
      await fetch(base + '/plan', { method: 'POST', headers: H });
      const d = await (await fetch(base + '/dashboard', { headers: H })).json();
      const outbox = (await (await fetch(base + '/outbox', { headers: H })).json()).messages.length;
      ok(sync.open === d.totals.open_invoices && sync.open > 0, `${v}: סנכרון ${JSON.stringify(sync)} מול דשבורד ${d.totals.open_invoices}`);
      ok(outbox === 0, `${v}: יצאו ${outbox} הודעות לפני אישור`);
      ok(d.totals.pending_approval > 0, `${v}: אין תזכורות לאישור`);
      for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
        const p = await b.newPage({ viewport: vp, deviceScaleFactor: out ? 2 : 1 });
        const errors = [];
        p.on('pageerror', e => errors.push(String(e)));
        p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
        await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
        await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
        await p.waitForTimeout(800);
        const body = await p.locator('body').innerText();
        // באג שנמצא כאן: לפני האישור הראשון (outbox ריק) הממשק הציג את שם עסק הדמו («סטודיו לוטם עיצוב»,
        // «בוקר טוב, לוטם») במקום שם העסק שהוגדר — עסק בבטא היה רואה שם של עסק אחר
        await p.getByText(biz).first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
        ok(body.includes(biz) || (await p.locator('body').innerText()).includes(biz), `${v}/${name}: שם העסק «${biz}» לא מוצג`);
        ok(!/לוטם/.test(await p.locator('body').innerText()), `${v}/${name}: מוצג שם עסק הדמו (לוטם) במקום «${biz}»`);
        ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${v}/${name}: גלילה רוחבית`);
        ok(!errors.length, `${v}/${name}: שגיאות קונסולה: ${errors.join(' | ')}`);
        if (out && name === 'desktop') await p.screenshot({ path: `${out}/gabi-beta-${v}.png`, fullPage: false });
        await p.close();
      }
      summary.push(`${v}: ${d.totals.open_invoices} פתוחות · ${d.totals.pending_approval} לאישור · 0 נשלחו`);
    } finally { srv.kill(); gi.kill(); }
  }
} finally { await b.close(); }
console.log('✓ ערכת בטא, היום הראשון בכל ענף: ' + summary.join(' | ') + ' · 0 שגיאות · בלי גלילה רוחבית');
