/**
 * ⚡ תקציב-ביצועים ננעל (VISION-LIGHT ‏#6, 23.8.2026) — רץ אוטומטית אחרי כל
 * build (postbuild). נכשל כשה-chunk הראשי (הכניסה מ-dist/index.html) עובר את
 * תקרת-ה-gzip — כדי שהמשקל שירד (חילוץ-Firebase ‏#1: ‏688⇒498KB) לא יזחל חזרה.
 *
 * חוזה-ratchet: התקרה יורדת-בלבד. מותר להקטין אחרי הקלה נוספת; אסור להעלות —
 * חריגה = מצאו מה נדחף לבנדל הראשי (בדרך-כלל import סטטי של מודול-ענן/ספרייה
 * כבדה) והוציאו אותו ל-import() דינמי, לא הגדילו את התקציב.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// תקרה נוכחית: 180KB gzip (נמדד 153KB אחרי פיצול-chunks ‏#13 + מרווח-סחף).
// היסטוריה (יורדת-בלבד): ‏520K (אחרי חילוץ-Firebase, נמדד 498K) ⇒ ‏180K.
const ENTRY_GZIP_BUDGET = 180_000;

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const m = /assets\/(index-[^"']+\.js)/.exec(html);
if (!m) {
  console.error('bundle-budget: לא נמצא chunk-כניסה ב-dist/index.html');
  process.exit(1);
}
const entry = m[1];
const gz = gzipSync(readFileSync(new URL('../dist/assets/' + entry, import.meta.url))).length;
const pct = Math.round((gz / ENTRY_GZIP_BUDGET) * 100);
if (gz > ENTRY_GZIP_BUDGET) {
  console.error(
    `❌ bundle-budget: ‏${entry} = ${gz.toLocaleString('en-US')}B gzip — מעל התקרה ` +
      `${ENTRY_GZIP_BUDGET.toLocaleString('en-US')}B (${pct}%). משהו כבד נדחף לבנדל הראשי — ` +
      'להוציא ל-import() דינמי, לא להעלות את התקציב.',
  );
  process.exit(1);
}
console.log(`✅ bundle-budget: ‏${entry} = ${gz.toLocaleString('en-US')}B gzip (${pct}% מהתקרה)`);
