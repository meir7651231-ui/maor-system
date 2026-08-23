#!/usr/bin/env node
/** מחצב · מחלץ L7 — פיצול לפי מיקומי-id (עמיד להערות בין בלוקים). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
const f = census.files.find(f => f.path.endsWith('verticalPacks.ts'));
if (f) {
  const txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8');
  const arrM = txt.match(/VERTICAL_PACKS[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (arrM) {
    const arr = arrM[1];
    const ids = [...arr.matchAll(/^\s+id:\s*'([a-z0-9]+)'/gm)];
    ids.forEach((m, i) => {
      const block = arr.slice(m.index, i + 1 < ids.length ? ids[i+1].index : arr.length);
      const g = re => (block.match(re) || [])[1];
      const terms = block.match(/terms:\s*\{([\s\S]*?)\n\s{4}\}/);
      atoms.push({ id: `L7:${census.repo}:vertical:${m[1]}`, level: 'L7-vertical', name: m[1],
        label: g(/label:\s*'([^']+)'/), sub: g(/sub:\s*'([^']*)'/), icon: g(/icon:\s*'([^']*)'/),
        theme: g(/theme:\s*'([^']*)'/), accent: g(/accent:\s*'([^']*)'/), motion: g(/motion:\s*'([^']*)'/),
        modulesOn: [...block.matchAll(/([a-z][a-z0-9]*):\s*true/g)].map(x => x[1]).slice(0, 15),
        termCount: terms ? (terms[1].match(/'[^']+':/g) || []).length : 0,
        source: `${census.repo}/${f.path}` });
    });
  }
}
fs.writeFileSync(new URL(`../registry/atoms-L7-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L7 ${census.repo}: ${atoms.length} ורטיקלים — ${atoms.map(a => (a.icon||'') + a.name).join(' ')}`);
