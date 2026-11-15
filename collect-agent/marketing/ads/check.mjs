// בדיקת נכסי ההשקה: node check.mjs  (יוצא ≠0 בכשל)
// 1) רינדור עם launch.json האמיתי: מידות נכונות, בלי חריגה מהמסגרת, בלי gabi.example/דמו/מוק בטקסט,
//    ו-domain=null ⇒ אין שום כתובת בנכסים.  2) רינדור עם דומיין-בדיקה ⇒ הכתובת מופיעה בכל נכס עם קריאה-לפעולה.
// 3) שום קובץ מקור של הנכסים לא מכיל gabi.example.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path'; import { tmpdir } from 'node:os'; import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)); let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const SIZES = { 'thumb-16x9': [1280, 720], 'thumb-9x16': [1080, 1920], 'ad-square-1x1': [1080, 1080], 'ad-feed-1200x628': [1200, 628], 'ad-portrait-4x5': [1080, 1350], 'ad-story-9x16': [1080, 1920] };
const CTA = ['ad-square-1x1', 'ad-feed-1200x628', 'ad-portrait-4x5', 'ad-story-9x16'];
const pngSize = f => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const render = (out, env = {}) => { execFileSync('node', [join(HERE, 'render.mjs'), out], { env: { ...process.env, ...env }, stdio: 'pipe' }); return JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')); };

const real = JSON.parse(readFileSync(join(HERE, 'launch.json'), 'utf8'));
const out1 = join(HERE, 'out'); const m1 = render(out1);
ok(m1.assets.length === 6, '6 נכסים נוצרו');
for (const a of m1.assets) {
  const [w, h] = pngSize(join(out1, a.name + '.png'));
  ok(w === SIZES[a.name][0] && h === SIZES[a.name][1], `${a.name}: מידות ${w}×${h}`);
  ok(a.overflow.length === 0, `${a.name}: אין טקסט שחורג מהמסגרת`);
  ok(!/gabi\.example|example\./i.test(a.text), `${a.name}: אין gabi.example`);
  ok(!/דמו|מוק/.test(a.text), `${a.name}: אין «דמו/מוק» בטקסט הנכס`);
  if (!real.domain) ok(!/\b[a-z0-9-]+\.(co\.il|com|io|app|il)\b/i.test(a.text), `${a.name}: domain=null ⇒ אין כתובת`);
  else if (CTA.includes(a.name)) ok(a.text.includes(real.domain), `${a.name}: מציג את ${real.domain}`);
}
const tmp = mkdtempSync(join(tmpdir(), 'gabi-ads-')); const lj = join(tmp, 'launch.json');
writeFileSync(lj, JSON.stringify({ domain: 'test-domain.co.il' }));
const m2 = render(join(tmp, 'out'), { GABI_LAUNCH_JSON: lj });
for (const n of CTA) ok(m2.assets.find(a => a.name === n).text.includes('test-domain.co.il'), `דומיין-בדיקה מופיע ב-${n}`);
writeFileSync(lj, JSON.stringify({ domain: 'gabi.example' }));
let threw = false; try { render(join(tmp, 'out2'), { GABI_LAUNCH_JSON: lj }); } catch { threw = true; }
ok(threw, 'launch.json עם gabi.example ⇒ הרינדור נכשל');
for (const f of readdirSync(HERE).filter(f => /\.(mjs|json|py|html)$/.test(f) && f !== 'check.mjs'))
  ok(!/gabi\.example/.test(readFileSync(join(HERE, f), 'utf8').replace(/example\/i/g, '')), `מקור ${f}: אין gabi.example`);
console.log(fail ? `\n${fail} כשלים` : '\nהכול עבר'); process.exit(fail ? 1 : 0);
