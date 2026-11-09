import { createRequire } from 'node:module'; import { spawn } from 'node:child_process';
const require = createRequire('/home/user/maor-system/collect-agent/web/package.json');
const { chromium } = require('playwright');
const S = process.argv[2]; const WEB='/home/user/maor-system/collect-agent/web/';
const srv = spawn('npx', ['vite', 'preview', '--port', '4331', '--strictPort'], { cwd: WEB, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch();
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto('http://localhost:4331/#/dashboard'); await m.getByTestId('mode-mobile').filter({ hasText: 'מצב דמו' }).waitFor(); await m.waitForTimeout(600);
await m.screenshot({ path: `${S}/s_dash.png` });
await m.getByRole('button', { name: 'תצוגה ואישור' }).first().click(); await m.waitForTimeout(600);
await m.screenshot({ path: `${S}/s_preview.png` });
// מסך-נעילה עם התראה (טקסט המוצר בלבד, בלי סימני מסחר של צד ג')
const logo = require('fs').readFileSync(WEB + 'public/favicon.svg', 'utf8');
const font = f => `file://${WEB}node_modules/@fontsource/${f}`;
await m.setContent(`<style>@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-hebrew-800-normal.woff2')})}@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-latin-800-normal.woff2')});unicode-range:U+0000-00FF}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-hebrew-500-normal.woff2')})}
*{margin:0;box-sizing:border-box}body{width:390px;height:844px;background:linear-gradient(160deg,#1e293b,#0F172A 60%);font-family:R,H,sans-serif;color:#FBF8F1;direction:rtl;text-align:center}
.t{font-size:84px;font-weight:800;margin-top:120px;letter-spacing:2px;direction:ltr}.d{font-family:H;font-size:18px;opacity:.8}
.n{margin:60px 16px 0;background:#FBF8F1ee;color:#0F172A;border-radius:22px;padding:14px;display:flex;gap:12px;align-items:center;text-align:right}
.n svg{width:46px;height:46px;flex:none;border-radius:11px}.n b{display:block;font-size:17px}.n span{font-family:H;font-size:15px;color:#334155}</style>
<div class="t">08:30</div><div class="d">יום שני</div><div class="n">${logo}<div><b>גבי · 5 תזכורות מוכנות</b><span>בוקר טוב! הכנו את התזכורות של היום. מחכות לאישור שלך.</span></div></div>`);
await m.evaluate(() => document.fonts.ready); await m.screenshot({ path: `${S}/s_lock.png` });
await b.close(); srv.kill(); console.log('ok');
