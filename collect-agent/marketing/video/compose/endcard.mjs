// כרטיס-הסיום של הסרטונים (גרסה מתוקנת: פונטים מוטמעים — בלי נפילה לסריף) + כתובת ההשקה
// ממקור יחיד: marketing/launch/launch.json (domain). placeholder ⇒ בלי כתובת.  שימוש: node endcard.mjs <out-dir>
import { createRequire } from 'node:module'; import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)); const WEB = join(HERE, '../../../web/');
const { chromium } = createRequire(WEB + 'package.json')('playwright');
const OUT = process.argv[2] || join(HERE, 'end'); mkdirSync(OUT, { recursive: true });
const launch = JSON.parse(readFileSync(process.env.GABI_LAUNCH_JSON || join(HERE, '../../launch/launch.json'), 'utf8'));
const isPh = launch.placeholder === true || /(^|\.)example$/i.test(String(launch.domain || ''));
const domain = isPh ? null : (launch.domain && String(launch.domain).trim()) || null;
if (domain && /example/i.test(domain)) throw new Error('launch.json: domain נראה כמו placeholder');
const ff = f => 'data:font/woff2;base64,' + readFileSync(`${WEB}node_modules/@fontsource/${f}`).toString('base64');
const logo = readFileSync(WEB + 'public/favicon.svg', 'utf8');
const CSS = `@font-face{font-family:R;font-weight:800;src:url(${ff('rubik/files/rubik-hebrew-800-normal.woff2')})}@font-face{font-family:R;font-weight:800;src:url(${ff('rubik/files/rubik-latin-800-normal.woff2')});unicode-range:U+0000-00FF,U+20AA}
@font-face{font-family:H;font-weight:400 500;src:url(${ff('heebo/files/heebo-hebrew-500-normal.woff2')})}@font-face{font-family:H;font-weight:400 500;src:url(${ff('heebo/files/heebo-latin-500-normal.woff2')});unicode-range:U+0000-00FF,U+20AA}
*{margin:0;box-sizing:border-box}body{font-family:R,sans-serif;direction:rtl}`;
const b = await chromium.launch();
for (const [fmt, W, H] of [['h', 1280, 720], ['v', 720, 1280]]) {
  const h = fmt === 'h';
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<style>${CSS}body{width:${W}px;height:${H}px;background:#0F172A;color:#FBF8F1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${h ? 14 : 22}px;text-align:center}
svg{width:${h ? 150 : 190}px;height:${h ? 150 : 190}px;border-radius:34px}.n{font-weight:800;font-size:${h ? 64 : 66}px;padding:0 24px}.s{font-weight:800;font-size:${h ? 34 : 40}px;color:#10B981;padding:0 30px}
.p{font-family:H,sans-serif;font-size:${h ? 26 : 30}px;opacity:.9;padding:0 30px;line-height:1.45}.m{font-family:H,sans-serif;font-size:${h ? 18 : 22}px;opacity:.6;padding:0 30px}
.d{margin-top:${h ? 10 : 18}px;background:#10B981;color:#0F172A;font-weight:800;font-size:${h ? 30 : 36}px;padding:${h ? '12px 34px' : '16px 42px'};border-radius:999px;direction:ltr}</style>
${logo}<div class="n">גבי – תזכורות תשלום</div><div class="s">הכסף שלך חוזר. בלי שתצטרך לרדוף.</div><div class="p">${h ? '₪119 לחודש או ₪1,190 לשנה · כולל מע״מ ככל שחל<br>14 ימי ניסיון בלי כרטיס אשראי' : '₪119 לחודש או ₪1,190 לשנה<br>כולל מע״מ ככל שחל<br>14 ימי ניסיון בלי כרטיס אשראי'}</div><div class="m">עובד עם חשבונית ירוקה · iCount · רווחית · EZcount</div>${domain ? `<div class="d">${domain}</div>` : ''}`);
  await p.evaluate(async () => { await Promise.all(['800 40px R', '500 20px H'].map(f => document.fonts.load(f, 'אבג'))); });
  const bad = await p.evaluate(() => ['800 40px R', '500 20px H'].filter(f => !document.fonts.check(f, 'אבג')));
  if (bad.length) throw new Error('font not loaded: ' + bad);
  // אין טקסט שנוגע בשוליים (≥20px) ואין שורה שבורה לשתיים בתוך .p/.n
  const edge = await p.evaluate(() => [...document.querySelectorAll('.n,.s,.p,.m,.d')].filter(e => { const r = e.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(e); const t = range.getBoundingClientRect(); return t.left < 20 || t.right > innerWidth - 20; }).map(e => e.className));
  const lines = await p.evaluate(() => { const e = document.querySelector('.p'); const lh = parseFloat(getComputedStyle(e).lineHeight); return Math.round(e.getBoundingClientRect().height / lh); });
  const want = fmt === 'h' ? 2 : 3;
  if (edge.length || lines !== want) throw new Error(`${fmt}: layout edge=${edge} lines=${lines}/${want}`);
  await p.screenshot({ path: join(OUT, `end_${fmt}.png`) });
  await p.close();
}
await b.close(); console.log('ok', domain || '(no domain)');
