import { createRequire } from 'node:module'; import { writeFileSync, readFileSync } from 'node:fs';
const require = createRequire('/home/user/maor-system/collect-agent/web/package.json');
const { chromium } = require('playwright'); const S = process.argv[2]; const WEB='/home/user/maor-system/collect-agent/web/';
const font = f => `file://${WEB}node_modules/@fontsource/${f}`; const logo = readFileSync(WEB + 'public/favicon.svg', 'utf8');
const CSS = `@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-hebrew-800-normal.woff2')})}@font-face{font-family:R;font-weight:800;src:url(${font('rubik/files/rubik-latin-800-normal.woff2')});unicode-range:U+0000-00FF,U+20AA}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-hebrew-500-normal.woff2')})}@font-face{font-family:H;font-weight:500;src:url(${font('heebo/files/heebo-latin-500-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0;box-sizing:border-box}html,body{background:transparent}body{font-family:R,H,sans-serif;direction:rtl}`;
const C = JSON.parse(readFileSync(S + '/captions.json', 'utf8'));
const b = await chromium.launch();
for (const [fmt, W, H, pos, fs] of [['h', 1280, 720, 'bottom:44px', 40], ['v', 720, 1280, 'top:120px', 46]]) {
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const [i, c] of C[fmt].entries()) {
    const txt = c.text.replace(/\*(.+?)\*/g, '<b style="color:#10B981">$1</b>');
    await p.setContent(`<style>${CSS}.c{position:absolute;left:50%;transform:translateX(-50%);${pos};max-width:${W - 80}px;width:max-content;background:#0F172Ae6;color:#FBF8F1;font-weight:800;font-size:${fs}px;line-height:1.3;padding:14px 30px;border-radius:22px;text-align:center;box-shadow:0 10px 30px #0006}</style><div class="c">${txt}</div>`);
    await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${S}/cap_${fmt}_${i}.png`, omitBackground: true });
  }
  // כרטיס סיום
  await p.setContent(`<style>${CSS}body{width:${W}px;height:${H}px;background:#0F172A;color:#FBF8F1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${fmt === 'h' ? 14 : 22}px;text-align:center}
svg{width:${fmt === 'h' ? 150 : 190}px;height:${fmt === 'h' ? 150 : 190}px;border-radius:34px}.n{font-weight:800;font-size:${fmt === 'h' ? 64 : 78}px}.s{font-weight:800;font-size:${fmt === 'h' ? 34 : 40}px;color:#10B981;padding:0 30px}.p{font-family:H;font-size:${fmt === 'h' ? 26 : 30}px;opacity:.9}.m{font-family:H;font-size:${fmt === 'h' ? 18 : 22}px;opacity:.6;padding:0 30px}</style>
${logo}<div class="n">גבי – תזכורות תשלום</div><div class="s">הכסף שלך חוזר. בלי שתצטרך לרדוף.</div><div class="p">₪119 לחודש · 14 ימי ניסיון בלי כרטיס אשראי</div><div class="m">עובד עם חשבונית ירוקה · iCount · רווחית · EZcount</div>`);
  await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${S}/end_${fmt}.png` });
}
await b.close(); console.log('ok');
