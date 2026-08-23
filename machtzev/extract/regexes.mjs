#!/usr/bin/env node
/** מחצב · מחלץ L12 — תבניות-regex: אטומי-ידע (ת"ז, טלפון, תאריך…). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'engines' && /\.(ts|mjs)$/.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;
    for (const m of line.matchAll(/(?:^|[=(,\s])\/((?:[^\/\\\n]|\\.){6,})\/([gimsuy]*)/g))
      atoms.push({ id: `L12:${census.repo}:${f.path}:${i+1}:${m.index}`, level: 'L12-regex',
        pattern: m[1].slice(0, 80), flags: m[3], source: `${census.repo}/${f.path}:${i+1}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L12-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L12 ${census.repo}: ${atoms.length} תבניות-regex`);
