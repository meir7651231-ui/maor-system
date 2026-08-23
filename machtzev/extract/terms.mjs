#!/usr/bin/env node
/** מחצב · מחלץ L5 — כל מונחי-השפה (TERM_DEFS). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'flags')) {
  const txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8');
  const block = txt.match(/TERM_DEFS[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!block) continue;
  const base = txt.slice(0, txt.indexOf(block[1])).split('\n').length;
  block[1].split('\n').forEach((line, i) => {
    const m = line.match(/key:\s*'([^']+)'.*?def:\s*'([^']*)'/) || line.match(/key:\s*'([^']+)'.*?label:\s*'([^']*)'/);
    if (m) atoms.push({ id: `L5:${census.repo}:term:${m[1]}`, level: 'L5-term', name: m[1], default: m[2], source: `${census.repo}/${f.path}:${base+i}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L5-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L5 ${census.repo}: ${atoms.length} אטומי-מונח`);
