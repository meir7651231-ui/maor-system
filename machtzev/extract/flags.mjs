#!/usr/bin/env node
/** מחצב · מחלץ L4 — כל דגלי-היכולות + מודולים + הרחבות מ-types. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'flags')) {
  const txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8');
  txt.split('\n').forEach((line, i) => {
    let m = line.match(/\{\s*key:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'/);
    if (m) { atoms.push({ id: `L4:${census.repo}:flag:${m[1]}`, level: 'L4-capability', name: m[1], label: m[2], source: `${census.repo}/${f.path}:${i+1}` }); return; }
    m = line.match(/^\s*(?:term|key):\s*'([a-z0-9.]+)'.*(?:he|label):\s*'([^']*)'/);
  });
  // INTEGRATION_KEYS / MODULE keys
  const ints = txt.match(/INTEGRATION_KEYS\s*=\s*\[([^\]]+)\]/s);
  if (ints) [...ints[1].matchAll(/'([a-z0-9]+)'/g)].forEach(m2 =>
    atoms.push({ id: `L4:${census.repo}:integration:${m2[1]}`, level: 'L4-capability', name: m2[1], label: 'הרחבה', source: `${census.repo}/${f.path}` }));
}
fs.writeFileSync(new URL(`../registry/atoms-L4-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L4 ${census.repo}: ${atoms.length} אטומי-יכולת (דגלים+הרחבות)`);
