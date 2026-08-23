#!/usr/bin/env node
/** מחצב · מחלץ L10 — כל שדה בכל ישות = אטום: הרזולוציה המלאה של מודל-הנתונים. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => /types\/domain\.ts$|domain\/.*\.dart$/.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  let entity = null;
  txt.split('\n').forEach((line, i) => {
    const ent = line.match(/(?:export interface|class)\s+([A-Z][A-Za-z0-9]*)/);
    if (ent) { entity = ent[1]; return; }
    if (/^\}/.test(line)) { entity = null; return; }
    if (!entity) return;
    const fld = line.match(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)(\??):\s*([^;]+);/);
    if (fld) atoms.push({ id: `L10:${census.repo}:${entity}.${fld[1]}`, level: 'L10-field',
      entity, name: fld[1], optional: fld[2] === '?', type: fld[3].trim().slice(0, 40),
      source: `${census.repo}/${f.path}:${i+1}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L10-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const ents = new Set(atoms.map(a => a.entity)).size;
console.log(`L10 ${census.repo}: ${atoms.length} שדות ב-${ents} ישויות`);
