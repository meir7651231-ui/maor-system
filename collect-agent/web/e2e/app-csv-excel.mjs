// גבי חיבורים: ייבוא CSV מהמסך (/app/ ← הגדרות) בקבצים כפי ש-Excel עברי שומר אותם — מול שרת DEMO=1 אמיתי, בלי יירוט.
//  • «CSV» של Excel עברי = Windows-1255 · «טקסט Unicode» = UTF-16 עם טאבים · אזור עם פסיק עשרוני = «;».
//    קודם: המסך פענח את הקובץ כ-UTF-8 (file.text()) ⇒ העברית הפכה ל-� ⇒ «חסרות עמודות חובה».
//  • קידוד לא מזוהה ⇒ הודעה בעברית בכרטיס (לא שגיאת Python באנגלית).
//  • השמות נקלטו נכון (/open-list), 390px בלי גלילה רוחבית, 0 שגיאות קונסולה. הרצה: node e2e/app-csv-excel.mjs [צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8183, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OPEN_REVIEW: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-excel') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async p => { const r = await fetch(base + p, { headers: H }); ok(r.ok, `${p}: ${r.status}`); return r.json(); };

// Windows-1255 בלי תלות: אותיות א–ת = 0xE0–0xFA, ₪ = 0xA4, ASCII כמו שהוא
const cp1255 = s => Buffer.from([...s].map(ch => {
  const c = ch.codePointAt(0);
  if (c < 0x80) return c;
  if (c >= 0x5d0 && c <= 0x5ea) return c - 0x5d0 + 0xe0;
  if (c === 0x20aa) return 0xa4;
  throw new Error('תו לא במפה: ' + ch);
}));
const utf16 = s => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);
const FILES = [
  { name: 'excel-1255.csv', enc: 'Windows-1255, פסיקים', body: cp1255('מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך לתשלום\r\n9401,"כהן, דנה",050-0000401,"1,200.50",01/10/2026\r\n'), num: '9401', name: 'כהן, דנה' },
  { name: 'excel-unicode.txt', enc: 'UTF-16, טאבים', body: utf16('מספר מסמך\tשם לקוח\tטלפון\tיתרה לתשלום\r\n9402\tיוסי לוי\t050-0000402\t450 ₪\r\n'), num: '9402', name: 'יוסי לוי' },
  { name: 'excel-semicolon.csv', enc: 'Windows-1255, נקודה-פסיק', body: cp1255('מספר מסמך;שם לקוח;טלפון;יתרה לתשלום\r\n9403;רונית אברהם;050-0000403;380\r\n'), num: '9403', name: 'רונית אברהם' },
];

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/400/.test(m.text())) errors.push(`console: ${m.text()}`); });
    p.on('response', r => { if (r.status() >= 400 && !(r.status() === 400 && r.url().endsWith('/settings/source/csv'))) errors.push(`${r.status()} ${r.url()}`); });
  };
  for (const [w, h, tag] of [[1366, 900, 'desktop'], [390, 844, 'mobile']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const p = await ctx.newPage(); watch(p);
    await p.goto(`${base}/app/#/settings`);
    const input = p.getByLabel('קובץ CSV');
    await input.waitFor({ state: 'attached' });
    for (const f of (tag === 'desktop' ? FILES : FILES.slice(0, 1))) {
      await input.setInputFiles({ name: f.name, mimeType: 'text/csv', buffer: f.body });
      const res = p.getByTestId('csv-result');
      await res.waitFor();
      await p.waitForFunction(() => /יובאו/.test(document.querySelector('[data-testid=csv-result]')?.textContent || ''));
      const t = await res.textContent();
      ok(/יובאו\s*1\s*חשבוניות/.test(t) && !/נדחו/.test(t), `${f.enc}: ${t}`);
      const item = (await api('/open-list')).pending.find(x => x.number === f.num);
      ok(item && item.customer === f.name, `${f.enc}: השם נקלט שגוי: ${JSON.stringify(item)}`);
    }
    if (out) { await p.getByTestId('csv-result').evaluate(e => e.scrollIntoView({ block: 'center' })); await p.screenshot({ path: `${out}/csv-excel-${tag}.png` }); }
    // Windows-1252 באנגלית (מירכאות «חכמות») ⇒ אין ניחוש: הודעה בעברית
    await input.setInputFiles({ name: 'english-1252.csv', mimeType: 'text/csv',
      buffer: Buffer.from([...Buffer.from('number,client,phone,amount\n1,'), 0x93, ...Buffer.from('Acme'), 0x94, ...Buffer.from(',0501234567,10\n')]) });
    const err = p.getByTestId('csv-error'); await err.waitFor();
    const et = await err.textContent();
    ok(/קידוד הקובץ לא מזוהה/.test(et) && !/codec|utf-8'/.test(et), 'הודעת קידוד: ' + et);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `גלילה רוחבית: ${tag}`);
    if (out) await err.screenshot({ path: `${out}/csv-excel-error-${tag}.png` });
    await ctx.close();
  }
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ ייבוא CSV מהמסך: Windows-1255 · UTF-16+טאבים · «;» — שמות עבריים נקלטו · קידוד לא מזוהה ⇒ הודעה בעברית · 390px · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
