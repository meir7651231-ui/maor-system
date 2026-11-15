// נכסי השקה חזותיים של גבי: תמונות ממוזערות לסרטון + מודעות סטטיות.
// הכתובת נלקחת רק מ-launch.json (domain). null ⇒ בלי כתובת בכלל (אף פעם לא כתובת-placeholder).
// הרצה: node render.mjs [out-dir]   (ברירת מחדל: ./out)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = join(HERE, '../../web/');
const require = createRequire(WEB + 'package.json');
const { chromium } = require('playwright');
const OUT = process.argv[2] || join(HERE, 'out');
mkdirSync(OUT, { recursive: true });

export const launch = JSON.parse(readFileSync(process.env.GABI_LAUNCH_JSON || join(HERE, 'launch.json'), 'utf8'));
const domain = launch.domain && String(launch.domain).trim();
if (domain && /example/i.test(domain)) throw new Error('launch.json: domain נראה כמו placeholder');

const font = f => 'data:font/woff2;base64,' + readFileSync(`${WEB}node_modules/@fontsource/${f}`).toString('base64');
const logo = readFileSync(WEB + 'public/favicon.svg', 'utf8');
const UI = join(HERE, 'ui/');   // עותקים נקיים (clean_ui.py) — בלי תווית «מצב דמו»
const shot = name => 'data:image/png;base64,' + readFileSync(UI + name).toString('base64');
const DASH = shot('dash_clean.png');     // 780×3714 (390pt @2x)
const DESK = shot('desktop_clean.png');  // 2880×1800

const CSS = `@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-hebrew-800-normal.woff2')})}
@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-latin-800-normal.woff2')});unicode-range:U+0000-00FF,U+20AA}
@font-face{font-family:H;font-weight:400 500;src:url(${font('heebo/files/heebo-hebrew-500-normal.woff2')})}
@font-face{font-family:H;font-weight:400 500;src:url(${font('heebo/files/heebo-latin-500-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0;box-sizing:border-box}body{font-family:R,H,sans-serif;direction:rtl;background:#0F172A;color:#FBF8F1;overflow:hidden}
.g{color:#10B981}.brand{display:flex;align-items:center;gap:.35em;font-weight:800}.brand svg{border-radius:22%}
.phone{position:relative;border-radius:14%/6.5%;background:#0b0f1a;padding:2.6%;box-shadow:0 40px 90px #0009,0 0 0 2px #2a3550 inset}
.phone .scr{border-radius:11.5%/5.3%;overflow:hidden;background:#F4F1EA;height:100%}
.phone img{width:100%;display:block}
.cta{display:inline-block;white-space:nowrap;background:#10B981;color:#0F172A;font-weight:800;border-radius:999px}
.sub{font-family:H,sans-serif;opacity:.88;line-height:1.45}.fine{font-family:H,sans-serif;opacity:.6}`;

const cta = domain ? domain : 'מתחילים חינם — 14 ימי ניסיון';
const price = '₪119 לחודש · 14 ימי ניסיון בלי כרטיס אשראי';

// כל נכס: [שם, רוחב, גובה, html]
const phone = (w) => `<div class="phone" style="width:${w}px;height:${Math.round(w * 2.04)}px"><div class="scr"><img src="${DASH}"></div></div>`;
const A = [
  ['thumb-16x9', 1280, 720, `
   <div style="display:flex;height:100%;align-items:center;padding:0 80px;gap:60px">
     <div style="flex:1">
       <div class="brand" style="font-size:44px;margin-bottom:28px">${logo.replace('<svg', '<svg width="64" height="64"')}גבי</div>
       <div style="font-weight:800;font-size:76px;line-height:1.08">הכסף שלך חוזר.<br><span class="g">בלי לרדוף.</span></div>
       <div class="sub" style="font-size:30px;margin-top:26px">5 תזכורות מוכנות כל בוקר — אתה רק מאשר</div>
     </div>
     <div style="transform:rotate(-6deg);margin-top:120px">${phone(300)}</div>
   </div>`],
  ['thumb-9x16', 1080, 1920, `
   <div style="display:flex;flex-direction:column;align-items:center;height:100%;padding:150px 80px 0;text-align:center">
     <div class="brand" style="font-size:64px">${logo.replace('<svg', '<svg width="96" height="96"')}גבי</div>
     <div style="font-weight:800;font-size:112px;line-height:1.05;margin-top:60px">הכסף שלך חוזר.<br><span class="g">בלי לרדוף.</span></div>
     <div style="margin-top:110px;transform:rotate(-4deg)">${phone(520)}</div>
   </div>`],
  ['ad-square-1x1', 1080, 1080, `
   <div style="display:flex;height:100%;padding:90px 80px;gap:50px">
     <div style="flex:1;display:flex;flex-direction:column">
       <div class="brand" style="font-size:52px">${logo.replace('<svg', '<svg width="76" height="76"')}גבי</div>
       <div style="font-weight:800;font-size:72px;line-height:1.1;margin-top:60px">לקוחות שוכחים לשלם.<br><span class="g">גבי לא שוכח להזכיר.</span></div>
       <div class="sub" style="font-size:34px;margin-top:40px">תזכורת מנומסת, בשם העסק שלך.<br>אתה מאשר בלחיצה.</div>
       <div style="margin-top:auto"><span class="cta" style="font-size:38px;padding:22px 44px">${cta}</span>
       <div class="fine" style="font-size:24px;margin-top:22px">${price}</div></div>
     </div>
     <div style="align-self:flex-end;margin-bottom:-300px">${phone(320)}</div>
   </div>`],
  ['ad-feed-1200x628', 1200, 628, `
   <div style="display:flex;height:100%;align-items:center;padding:0 64px;gap:40px">
     <div style="flex:1">
       <div class="brand" style="font-size:34px">${logo.replace('<svg', '<svg width="52" height="52"')}גבי – תזכורות תשלום</div>
       <div style="font-weight:800;font-size:58px;line-height:1.1;margin-top:26px">הכסף שלך חוזר.<br><span class="g">בלי שתצטרך לרדוף.</span></div>
       <div style="margin-top:30px"><span class="cta" style="font-size:28px;padding:16px 34px">${cta}</span></div>
       <div class="fine" style="font-size:19px;margin-top:16px">${price}</div>
     </div>
     <div style="width:520px;border-radius:14px;overflow:hidden;box-shadow:0 30px 70px #0009;transform:perspective(1400px) rotateY(14deg)"><img src="${DESK}" style="width:100%;display:block"></div>
   </div>`],
  ['ad-portrait-4x5', 1080, 1350, `
   <div style="display:flex;flex-direction:column;height:100%;padding:90px 80px 0;text-align:center;align-items:center">
     <div class="brand" style="font-size:52px">${logo.replace('<svg', '<svg width="76" height="76"')}גבי</div>
     <div style="font-weight:800;font-size:84px;line-height:1.08;margin-top:46px">כל בוקר: מי עוד לא שילם.<br><span class="g">גבי כבר הכין תזכורת.</span></div>
     <div style="margin-top:44px"><span class="cta" style="font-size:38px;padding:22px 46px">${cta}</span></div>
     <div class="fine" style="font-size:24px;margin-top:20px">${price}</div>
     <div style="margin-top:60px">${phone(400)}</div>
   </div>`],
  ['ad-story-9x16', 1080, 1920, `
   <div style="display:flex;flex-direction:column;height:100%;padding:220px 80px 0;text-align:center;align-items:center">
     <div class="brand" style="font-size:60px">${logo.replace('<svg', '<svg width="90" height="90"')}גבי</div>
     <div style="font-weight:800;font-size:100px;line-height:1.07;margin-top:60px">הלקוח משלם בלחיצה.<br><span class="g">ישירות אליך.</span></div>
     <div class="sub" style="font-size:40px;margin-top:40px">תזכורות תשלום מנומסות,<br>בשם העסק שלך</div>
     <div style="margin-top:56px"><span class="cta" style="font-size:44px;padding:26px 54px">${cta}</span></div>
     <div class="fine" style="font-size:28px;margin-top:24px">${price}</div>
     <div style="margin-top:80px">${phone(460)}</div>
   </div>`],
];

const b = await chromium.launch();
const manifest = [];
for (const [name, W, H, html] of A) {
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${CSS}body{width:${W}px;height:${H}px}</style></head><body>${html}</body></html>`);
  await p.evaluate(async () => { await Promise.all(['800 40px R', '500 20px H', '400 20px H'].map(f => document.fonts.load(f, 'אבג'))); await document.fonts.ready; });
  const bad = await p.evaluate(() => ['800 40px R', '500 20px H'].filter(f => !document.fonts.check(f, 'אבג')));
  if (bad.length) throw new Error(name + ': font not loaded ' + bad);
  await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  const text = await p.evaluate(() => document.body.innerText);
  const over = await p.evaluate(() => [...document.querySelectorAll('.cta,.brand,.sub,.fine')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1; }).map(e => e.className));
  await p.screenshot({ path: join(OUT, name + '.png') });
  manifest.push({ name, width: W, height: H, text, overflow: over });
  await p.close();
}
await b.close();
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ domain: domain || null, assets: manifest }, null, 2));
console.log('ok', manifest.length, 'assets →', OUT);
