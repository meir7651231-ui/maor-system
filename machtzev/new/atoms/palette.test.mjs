import { PALETTE } from './palette.mjs';
let f = 0;
const vals = Object.values(PALETTE);
if (!vals.length) { console.error('✗ פלטה ריקה'); f = 1; }
for (const [k, v] of Object.entries(PALETTE)) {
  if (!/^#|^rgb|^hsl|^oklch/.test(v)) { console.error('✗ לא-ליטרלי: ' + k + '=' + v); f = 1; }
  if (/var\(/.test(v)) { console.error('✗ חיווט בתוך אטום: ' + k); f = 1; }
}
if (new Set(vals).size !== vals.length) { console.error('✗ ערך כפול בפלטה'); f = 1; }
if (f) process.exit(1);
console.log('✓ פלטה: ' + vals.length + ' פיגמנטים טהורים — ייחודיים, ליטרליים, אפס-חיווט');
