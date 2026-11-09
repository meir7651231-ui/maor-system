// לכידת שכבות-UI לאנימציה (390×844 CSS @2x): מסך-נעילה, סקירה בגובה-מלא, גיליון "תצוגה ואישור" בגובה-מלא
// (גוף + פוטר דביק בנפרד), הסקירה אחרי אישור + הטוסט. מיקומי כפתורים נשמרים ל-ui/meta.json — כך שהקשה של
// האצבע בסרטון "פוגעת" בכפתור האמיתי. דורש build קיים ב-web/dist.
// שימוש: node capture_ui.mjs <outDir>
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const WEB = '/home/user/maor-system/collect-agent/web/';
const require = createRequire(WEB + 'package.json');
const { chromium } = require('playwright');
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const srv = spawn('npx', ['vite', 'preview', '--port', '4331', '--strictPort'], { cwd: WEB, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch();
const meta = {};
try {
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto('http://localhost:4331/#/dashboard');
  await m.getByTestId('mode-mobile').filter({ hasText: 'מצב דמו' }).waitFor(); await m.waitForTimeout(700);
  await m.addStyleTag({ content: '*{caret-color:transparent!important;transition:none!important;animation:none!important}' });
  // סקירה — גובה מלא
  meta.dash_h = await m.evaluate(() => document.documentElement.scrollHeight);
  await m.screenshot({ path: `${OUT}/dash_full.png`, fullPage: true });
  const btn = m.getByRole('button', { name: 'תצוגה ואישור' }).first();
  meta.dash_btn = await btn.evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height]; });
  meta.dash_row = await btn.evaluate(e => { const r = e.closest('li').getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height]; });
  // גיליון האישור: פותחים, מבטלים גובה-מקסימלי ⇒ גוף בגובה-מלא + פוטר בנפרד
  await btn.click(); await m.waitForTimeout(500);
  const dlg = m.getByRole('dialog');
  meta.sheet_top = await dlg.evaluate(e => e.getBoundingClientRect().y);            // במצב טבעי (94vh)
  // דמו-בלבד: אזהרת "חסר קישור תשלום" נובעת מכך שבמוק הקישור בהודעה הוא placeholder — לא רלוונטי לסרטון
  await dlg.evaluate(e => e.querySelectorAll('span').forEach(s => { if (s.textContent.includes('חסר קישור תשלום')) s.style.display = 'none'; }));
  meta.sms_text = await dlg.locator('textarea').inputValue();
  // לסרטון: שורת-האישור (אותם כפתורים בדיוק) עוברת מהפוטר הדביק אל מתחת לתצוגת ה-SMS, וכפתור "אשר ושלח"
  // ברוחב-מלא — כך שההקשה של האצבע בצילום (שלא יורדת לתחתית המסך) פוגעת בכפתור האמיתי.
  await dlg.evaluate(e => {
    const f = e.querySelector('footer'), mock = e.querySelector('.rounded-\\[2rem\\]');
    f.style.position = 'static'; f.style.borderTop = '0'; f.style.padding = '18px 0 6px'; f.style.flexDirection = 'column-reverse'; f.style.alignItems = 'stretch';
    f.querySelectorAll('button').forEach(b => { b.style.width = '100%'; b.style.justifyContent = 'center'; });
    mock.after(f);
  });
  await m.setViewportSize({ width: 390, height: 3200 });
  // ריווח-תחתון בגיליון (כמו safe-area) — מאפשר לגלול את שורת-האישור עד מרכז-המסך
  await dlg.evaluate(e => { e.style.maxHeight = 'none'; e.style.overflow = 'visible'; e.style.paddingBottom = '110px'; });
  await m.waitForTimeout(300);
  meta.sheet_body_h = await dlg.evaluate(e => e.getBoundingClientRect().height);
  meta.approve_btn = await dlg.getByRole('button', { name: /אשר ושלח/ }).evaluate(e => {
    const r = e.getBoundingClientRect(), d = e.closest('[role=dialog]').getBoundingClientRect(); return [r.x - d.x, r.y - d.y, r.width, r.height]; });
  await dlg.screenshot({ path: `${OUT}/sheet_body.png` });
  await dlg.evaluate(e => { e.style.maxHeight = ''; e.style.overflow = ''; });
  await m.setViewportSize({ width: 390, height: 844 }); await m.waitForTimeout(300);
  // אישור ⇒ הטוסט + הסקירה המעודכנת
  await dlg.getByRole('button', { name: /אשר ושלח/ }).click(); await m.waitForTimeout(400);
  const toast = m.locator('[aria-live=polite] > div');
  await toast.waitFor();
  meta.toast = await toast.evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await toast.screenshot({ path: `${OUT}/toast.png` });
  await m.evaluate(() => { document.querySelector('[aria-live=polite]').style.display = 'none'; scrollTo(0, 0); });
  await m.waitForTimeout(1200);
  await m.screenshot({ path: `${OUT}/dash2_full.png`, fullPage: true });
  meta.dash2_h = await m.evaluate(() => document.documentElement.scrollHeight);
  // מסך-נעילה עם התראה (טקסט המוצר בלבד)
  const logo = readFileSync(WEB + 'public/favicon.svg', 'utf8');
  const font = f => `file://${WEB}node_modules/@fontsource/${f}`;
  await m.setContent(`<style>@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-hebrew-800-normal.woff2')})}@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-latin-800-normal.woff2')});unicode-range:U+0000-00FF}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-hebrew-500-normal.woff2')})}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-latin-500-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0;box-sizing:border-box}body{width:390px;height:844px;overflow:hidden;background:radial-gradient(120% 70% at 30% 10%,#334155,#0F172A 60%,#020617);font-family:R,H,sans-serif;color:#FBF8F1;direction:rtl;text-align:center}
.t{font-size:86px;font-weight:800;margin-top:118px;letter-spacing:1px;direction:ltr}.d{font-family:H;font-size:19px;opacity:.85;margin-top:2px}
.n{margin:198px 14px 0;background:#FBF8F1f0;color:#0F172A;border-radius:24px;padding:14px;display:flex;gap:12px;align-items:center;text-align:right;box-shadow:0 10px 30px #0006}
.n svg{width:48px;height:48px;flex:none;border-radius:12px}.n b{display:block;font-size:17px}.n span{font-family:H;font-size:15px;color:#334155;line-height:1.35}.k{font-family:H;font-size:12px;color:#64748B;margin-inline-start:auto;align-self:flex-start}
.h{position:absolute;bottom:74px;left:0;right:0;font-family:H;font-size:15px;opacity:.6}</style>
<div class="t">08:30</div><div class="d">יום שני, 9 בנובמבר</div><div class="n">${logo}<div><b>גבי · 5 תזכורות מוכנות</b><span>בוקר טוב! הכנו את התזכורות של היום. מחכות לאישור שלך.</span></div><span class="k">עכשיו</span></div><div class="h">הקישו על ההתראה לפתיחה</div>`);
  await m.evaluate(() => document.fonts.ready);
  meta.lock_notif = await m.locator('.n').evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await m.screenshot({ path: `${OUT}/lock.png` });
  await m.locator('.n').evaluate(e => { e.style.visibility = 'hidden'; });
  await m.screenshot({ path: `${OUT}/lock_bg.png` });
  // הטלפון של הלקוח: ה-SMS בדיוק כפי שנבנה בגיליון (אותו טקסט), עם הקישור כיעד-הקשה
  const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const sender = meta.sms_text.split(':')[0];
  const body = esc(meta.sms_text).replace(/(https?:\/\/\S+)/, '<a id="lnk">$1</a>');
  await m.setContent(`<style>@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-hebrew-500-normal.woff2')})}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-latin-500-normal.woff2')});unicode-range:U+0000-00FF}@font-face{font-family:H;font-weight:800;src:url(${font('heebo/files/heebo-hebrew-800-normal.woff2')})}
*{margin:0;box-sizing:border-box}body{width:390px;height:844px;overflow:hidden;background:#F1F5F9;font:17px/1.5 H,sans-serif;direction:rtl;color:#0F172A}
.top{background:#fff;padding:54px 14px 12px;text-align:center;border-bottom:1px solid #E2E8F0}.av{width:52px;height:52px;border-radius:50%;background:#CBD5E1;margin:0 auto 4px;display:grid;place-items:center;font-weight:800;font-size:22px;color:#fff}
.top b{font-size:15px}.day{text-align:center;color:#64748B;font-size:12px;margin:283px 0 10px}.bub{background:#fff;border-radius:20px 20px 6px 20px;padding:12px 14px;margin:0 14px;max-width:86%;box-shadow:0 1px 2px #0002;font-size:16px;white-space:pre-wrap}
#lnk{color:#2563EB;text-decoration:underline;direction:ltr;unicode-bidi:embed}.inp{position:absolute;bottom:34px;left:14px;right:14px;height:40px;border:1px solid #CBD5E1;border-radius:20px;background:#fff;color:#94A3B8;font-size:15px;padding:8px 16px}</style>
<div class="top"><div class="av">${esc(sender[0] || '?')}</div><b>${esc(sender)}</b></div><div class="day">היום 10:00</div><div class="bub">${body}</div><div class="inp">הודעת טקסט</div>`);
  await m.evaluate(() => document.fonts.ready);
  meta.sms_link = await m.locator('#lnk').evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  meta.sms_bubble = await m.locator('.bub').evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await m.screenshot({ path: `${OUT}/sms.png` });
} finally {
  await b.close(); srv.kill();
}
writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta));
