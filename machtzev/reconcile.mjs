#!/usr/bin/env node
/** מחצב · 🚨 המשטרה — משוואות-השלמות. כל הפרה = exit 1 אדום. */
import fs from 'node:fs';
const R = new URL('./registry/', import.meta.url).pathname;
let fail = 0;
const alarm = (msg) => { console.error('🚨 ' + msg); fail = 1; };
const ok = (msg) => console.log('✓ ' + msg);

// משוואה 1: אפס יתומים בכל מפקד
for (const f of fs.readdirSync(R).filter(f => f.startsWith('census-'))) {
  const c = JSON.parse(fs.readFileSync(R + f));
  c.totals.orphans === 0 ? ok(`מפקד ${c.repo}: ‏${c.totals.files} קבצים · 100% משויכים`)
                         : alarm(`מפקד ${c.repo}: ‏${c.totals.orphans} קבצים יתומים!`);
}
// משוואה 2: כל מזהה-אטום ייחודי גלובלית
const seen = new Map();
for (const f of fs.readdirSync(R).filter(f => f.startsWith('atoms-'))) {
  for (const a of JSON.parse(fs.readFileSync(R + f))) {
    if (seen.has(a.id) && seen.get(a.id) !== a.source) alarm(`מזהה כפול: ${a.id} (${seen.get(a.id)} ↔ ${a.source})`);
    seen.set(a.id, a.source);
  }
}
ok(`‏${seen.size} אטומים רשומים · אפס כפילויות-מזהה`);
// משוואה 3: כל אטום מצביע לקובץ-מקור קיים במפקד
const censusFiles = new Set();
for (const f of fs.readdirSync(R).filter(f => f.startsWith('census-'))) {
  const c = JSON.parse(fs.readFileSync(R + f));
  c.files.forEach(x => censusFiles.add(`${c.repo}/${x.path}`));
}
let ghosts = 0;
for (const [id, src] of seen) if (!censusFiles.has(src.replace(/:\d+(-\d+)?$/, ''))) { alarm(`רשומת-רפאים: ${id} ← ${src}`); ghosts++; }
if (!ghosts) ok('אפס רשומות-רפאים — כל אטום מגובה בקובץ חי');
process.exit(fail);
