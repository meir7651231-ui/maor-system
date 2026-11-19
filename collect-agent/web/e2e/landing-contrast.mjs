// גבי עיצוב: סריקת ניגודיות AA בדפדפן לדפי-הנחיתה הסטטיים (marketing/landing/index.html + for/*.html).
// הסורק: e2e/contrast-lib.mjs.
// יוצא ≠0 אם יש הפרה. הרצה: node e2e/landing-contrast.mjs
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { scan } from './contrast-lib.mjs';
import { launchChromium } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const LAND = new URL('../../marketing/landing/', import.meta.url);
const pages = ['index.html', ...readdirSync(new URL('for/', LAND)).filter(f => f.endsWith('.html')).map(f => 'for/' + f)];
const b = await launchChromium(chromium); let bad = 0;
for (const f of pages) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(f, LAND).href);
  const { fails, skipped } = await scan(p);
  bad += fails.length;
  console.log(`${fails.length ? '✗' : '✓'} ${f}: ${fails.length} הפרות${skipped.length ? ` · ${skipped.length} על רקע-תמונה (דולגו)` : ''}`);
  for (const x of fails) console.log('   ', JSON.stringify(x));
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
