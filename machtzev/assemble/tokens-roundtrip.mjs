#!/usr/bin/env node
/** מחצב · שלב 3 (חלוץ) — הוכחת round-trip: מהאטומים בלבד משחזרים כל שורת-הגדרה
 *  ב-CSS ומשווים למקור. אי-התאמה = החילוץ מאבד מידע = אזעקה. */
import fs from 'node:fs';
const repo = process.argv[2] || 'maor';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${repo}.json`, import.meta.url)));
const atoms = JSON.parse(fs.readFileSync(new URL(`../registry/atoms-L0-${repo}.json`, import.meta.url)));
let checked = 0, fail = 0;
for (const a of atoms) for (const v of a.values) {
  const file = v.at.replace(/:\d+$/, ''), lineNo = +v.at.match(/:(\d+)$/)[1];
  const orig = fs.readFileSync(`${census.root}/${file}`, 'utf8').split('\n')[lineNo - 1];
  const m = orig.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/);
  checked++;
  if (!m || m[1] !== a.name || m[2].trim() !== v.value) {
    console.error(`🚨 אובדן-מידע: ${v.at} — מקור:「${(orig||'').trim()}」 אטום:「${a.name}: ${v.value};」`); fail++;
  }
}
if (fail) { console.error(`🚨 round-trip ${repo} נכשל: ${fail}/${checked}`); process.exit(1); }
console.log(`✓ round-trip ${repo}: ‏${checked}/${checked} הגדרות שוחזרו מהאטומים בהתאמה מלאה למקור — החילוץ הפיך`);
