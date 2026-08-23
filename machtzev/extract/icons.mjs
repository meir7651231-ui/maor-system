#!/usr/bin/env node
/** מחצב · מחלץ L11 — אימוג'י-כאייקון: כל סמל = אטום עם מוני-שימוש. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const agg = new Map();
const RE = /\p{Extended_Pictographic}/gu;
for (const f of census.files.filter(f => ['screens','source','actions','engines'].includes(f.domain) && /\.(tsx|ts|dart)$/.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  for (const m of txt.matchAll(RE)) {
    const a = agg.get(m[0]) || { id: `L11:${census.repo}:icon:${m[0]}`, level: 'L11-icon', glyph: m[0], count: 0, source: `${census.repo}/${f.path}` };
    a.count++; agg.set(m[0], a);
  }
}
const atoms = [...agg.values()];
fs.writeFileSync(new URL(`../registry/atoms-L11-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L11 ${census.repo}: ${atoms.length} אייקונים (‏${atoms.reduce((s,a)=>s+a.count,0)} שימושים)`);
