#!/usr/bin/env node
/** מחצב · מחלץ L5b — כל מחרוזת עברית קשיחה שעוקפת את מערכת-המונחים (termOf). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
const HEB = /[֐-׿]/;
for (const f of census.files.filter(f => /\.(tsx|ts|dart)$/.test(f.path) && ['screens','source','actions','engines'].includes(f.domain) && !/__tests__|\.test\./.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    if (!HEB.test(line) || /^\s*(\/\/|\/?\*)/.test(line)) return; // דלג על הערות
    for (const m of line.matchAll(/['"`]([^'"`]*[֐-׿][^'"`]*)['"`]/g)) {
      const viaTerm = line.includes('termOf(') && line.indexOf('termOf(') < m.index;
      atoms.push({ id: `L5b:${census.repo}:${f.path}:${i+1}:${m.index}`, level: 'L5-string',
        text: m[1].slice(0, 60), viaTermOf: viaTerm, source: `${census.repo}/${f.path}:${i+1}` });
    }
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L5b-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const hard = atoms.filter(a => !a.viaTermOf).length;
console.log(`L5b ${census.repo}: ${atoms.length} מחרוזות-עברית (‏${hard} קשיחות שעוקפות termOf)`);
