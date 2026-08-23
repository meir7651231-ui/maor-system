#!/usr/bin/env node
/** מחצב · מחלץ L9 — מספרי-קסם: ספים/תקרות/השהיות = החלטות-עסקיות קבורות. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
const PATTERNS = [
  [/setTimeout\([^,]+,\s*(\d{2,})\)/g, 'delay-ms'],
  [/\b([A-Z][A-Z_]*(?:CAP|MAX|MIN|LIMIT|SIZE|COUNT|THRESHOLD)[A-Z_]*)\s*=\s*(\d+)/g, 'named-cap'],
  [/\.slice\(0,\s*(\d{1,4})\)/g, 'list-cap'],
  [/(?:>=|>|<=|<)\s*(\d{3,})\b/g, 'threshold'],
];
for (const f of census.files.filter(f => ['engines','actions','screens','source'].includes(f.domain) && /\.(ts|tsx|dart|mjs)$/.test(f.path) && !/__tests__|\.test\./.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;
    for (const [re, kind] of PATTERNS)
      for (const m of line.matchAll(re))
        atoms.push({ id: `L9:${census.repo}:${f.path}:${i+1}:${m.index}:${kind}`, level: 'L9-const', kind,
          value: m[2] || m[1], name: m[2] ? m[1] : undefined, hint: line.trim().slice(0, 70),
          source: `${census.repo}/${f.path}:${i+1}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L9-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
console.log(`L9 ${census.repo}: ${atoms.length} מספרי-קסם (החלטות-עסקיות קבורות)`);
