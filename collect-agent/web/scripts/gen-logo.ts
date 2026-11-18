// מייצר את קובצי הלוגו הציבוריים מהמקור היחיד src/brand/logo.ts. הרצה: npm run logo
import { readFileSync, writeFileSync } from 'node:fs';
import { PUBLIC_FILES, UI_LOGO_END, UI_LOGO_START, uiLogoHtml } from '../src/brand/logo.ts';
for (const [name, svg] of Object.entries(PUBLIC_FILES)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), svg);
  console.log(`✓ public/${name}`);
}
// הדשבורד הפשוט (/ui) — סטטי, בלי build: הלוגו מוטמע בין הסמנים
const UI = new URL('../../app/ui.html', import.meta.url);
const html = readFileSync(UI, 'utf8');
const a = html.indexOf(UI_LOGO_START), b = html.indexOf(UI_LOGO_END);
if (a < 0 || b < a) throw new Error('app/ui.html: חסרים סמני הלוגו');
writeFileSync(UI, html.slice(0, a + UI_LOGO_START.length) + uiLogoHtml() + html.slice(b));
console.log('✓ app/ui.html (לוגו)');
