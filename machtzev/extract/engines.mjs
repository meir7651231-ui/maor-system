#!/usr/bin/env node
/** מחצב · מחלץ L6 — כל מנוע-לוגיקה: קובץ בתחום engines ⇒ אטום עם ה-exports שלו. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'engines' && f.lines > 0)) {
  let txt = ''; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  const exports = [...txt.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
  const dartFns = f.path.endsWith('.dart') ? [...txt.matchAll(/^[A-Za-z<>?\s]+\s([a-zA-Z0-9_]+)\(/gm)].map(m => m[1]).slice(0, 30) : [];
  atoms.push({ id: `L6:${census.repo}:${f.path}`, level: 'L6-engine', name: f.path.split('/').pop(),
    exports: exports.length ? exports : dartFns, lines: f.lines,
    pure: !/document\.|window\.|localStorage|useApp|zustand|firebase/.test(txt),
    source: `${census.repo}/${f.path}` });
}
fs.writeFileSync(new URL(`../registry/atoms-L6-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const pure = atoms.filter(a => a.pure).length;
console.log(`L6 ${census.repo}: ${atoms.length} מנועים (‏${pure} טהורים · ${atoms.reduce((s,a)=>s+a.exports.length,0)} פונקציות-יצוא)`);
