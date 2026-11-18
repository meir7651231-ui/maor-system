// מייצר את קובצי הלוגו הציבוריים מהמקור היחיד src/brand/logo.ts. הרצה: npm run logo
import { readFileSync, writeFileSync } from 'node:fs';
import { LANDING_FAVICON_END, LANDING_FAVICON_START, PUBLIC_FILES, UI_LOGO_END, UI_LOGO_START, landingFaviconLink, landingLogoSvg, uiLogoHtml } from '../src/brand/logo.ts';
for (const [name, svg] of Object.entries(PUBLIC_FILES)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), svg);
  console.log(`✓ public/${name}`);
}
// הדשבורד הפשוט (/ui) — סטטי, בלי build: הלוגו מוטמע בין הסמנים
const between = (file: string, start: string, end: string, body: string) => {
  const url = new URL(file, import.meta.url), html = readFileSync(url, 'utf8');
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${file}: חסרים הסמנים ${start}`);
  writeFileSync(url, html.slice(0, a + start.length) + body + html.slice(b));
};
between('../../app/ui.html', UI_LOGO_START, UI_LOGO_END, uiLogoHtml());
console.log('✓ app/ui.html (לוגו)');
// דף-הנחיתה הסטטי של השיווק (+ דפי הענף נבנים ממנו: python3 marketing/landing/for/build.py)
between('../../marketing/landing/index.html', UI_LOGO_START, UI_LOGO_END, landingLogoSvg());
between('../../marketing/landing/index.html', LANDING_FAVICON_START, LANDING_FAVICON_END, landingFaviconLink());
console.log('✓ marketing/landing/index.html (לוגו + פאביקון) — הריצו גם python3 marketing/landing/for/build.py');
