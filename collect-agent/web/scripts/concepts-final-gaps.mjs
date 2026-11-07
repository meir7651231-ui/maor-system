// מיטוב רווח מטבע↔ארנק פר-נכס: הרווח הקטן ביותר (≥ ערך-הבעלים 1.6) שבו בעמודת-המטבע יש לפחות שורת-פיקסל אחת
// שניגודיותה ≥3:1 גם מול המטבע וגם מול הארנק — בכל הגדלים שהנכס מוצג בהם. מריצים לפני concepts-final-board.mjs.
import { writeFileSync } from 'node:fs'; import { createRequire } from 'node:module';
import * as M from './concepts-final.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const lum = (r, g, b) => { const q = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * q(r) + 0.7152 * q(g) + 0.0722 * q(b); };
const cr = (a, b) => { const x = lum(...a), y = lum(...b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
async function ok(svgFn, sizes, bg, coinRGB, walletRGB) {
  for (const [w, h] of sizes) {
    await p.setViewportSize({ width: Math.ceil(w), height: h });
    await p.setContent(`<body style="margin:0;background:${bg}">${svgFn().replace(/<svg ([^>]*?)width="[\d.]+" height="[\d.]+"/, `<svg $1width="${w}" height="${h}"`).replace(/<svg ([^>]*?)height="[\d.]+" width="[\d.]+"/, `<svg $1height="${h}" width="${w}"`)}</body>`);
    const d = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return { w: im.width, h: im.height, d: Array.from(x.getImageData(0, 0, im.width, im.height).data) }; }, (await p.screenshot()).toString('base64'));
    const px = (X, Y) => { const i = (Y * d.w + X) * 4; return [d.d[i], d.d[i + 1], d.d[i + 2]]; };
    const green = []; for (let Y = 0; Y < d.h; Y++) for (let X = 0; X < d.w; X++) { const c = px(X, Y); if (c[1] > c[0] + 60 && c[1] > c[2] + 20 && cr(c, coinRGB) < 1.6) green.push([X, Y]); }
    if (!green.length) return false;
    const xs = [...new Set(green.map(g => g[0]))];
    for (const X of xs) { // כל עמודת-מטבע: מתחת למטבע חייבת להיות שורה מופרדת לפני הארנק
      const ys = green.filter(g => g[0] === X).map(g => g[1]); let Y = Math.max(...ys) + 1; let sep = false;
      for (; Y < d.h; Y++) { const c = px(X, Y); if (cr(c, walletRGB) < 1.25) break; if (cr(c, coinRGB) >= 3 && cr(c, walletRGB) >= 3) sep = true; }
      if (Y < d.h && !sep) return false;
    }
  }
  return true;
}
const C = M.C, hex = h => h.match(/\w\w/g).map(v => parseInt(v, 16));
const G = {};
async function search(key, svgFn, sizes, bg, coin, wallet) {
  for (let g = 1.6; g <= 6; g = +(g + 0.1).toFixed(2)) { M.setGaps({ ...G, [key]: g }); if (await ok(svgFn, sizes, bg, hex(coin), hex(wallet))) { G[key] = g; console.log(key, g); return; } }
  G[key] = 6; console.log(key, 'max');
}
await search('f32', () => M.fav32(32), [[32, 32]], C.navy, C.green, C.cream);
await search('f48', () => M.fav48(48), [[48, 48]], C.navy, C.green, C.cream);
await search('tile', () => M.tileSvg(180), [[180, 180], [120, 120], [80, 80], [60, 60], [40, 40]], C.navy, C.green, C.cream);
await search('lock', () => M.lockupSvg(C.navy, C.greenOnLight, 32), [[0, 32], [0, 40], [0, 48]].map(([, h]) => [h * (+M.lockupSvg(C.navy, C.greenOnLight, 32).match(/viewBox="0 0 ([\d.]+)/)[1]) / 56.2, h]), '#FFFFFF', C.greenOnLight, C.navy);
await search('ad', () => M.adaptiveFg(), [[108, 108], [72, 72]], C.navy, C.green, C.cream);
// מונוכרום של Android: המטבע והארנק באותה דיו — רווח ≥1.25px ב-48 נדרש מהגיאומטריה (אין צבע להפריד)
G.ad = Math.max(G.ad, M.gapFor(48, 34));
writeFileSync(new URL('./concepts-final-gaps.json', import.meta.url), JSON.stringify(G));
await b.close(); console.log(G);
