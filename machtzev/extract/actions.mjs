#!/usr/bin/env node
/** מחצב · מחלץ L2 — כל לחיצה/פעולה: handlers ברכיבים, פעולות-store, פקודות-פלטה. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
// 1) handlers ברכיבים (onClick/onChange/onSubmit/onKeyDown)
for (const f of census.files.filter(f => /\.(tsx|dart)$/.test(f.path) && (f.domain === 'screens' || f.domain === 'source'))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\b(onClick|onChange|onSubmit|onKeyDown|onInput|onPressed|onTap|onLongPress)\s*[=:]/g))
      atoms.push({ id: `L2:${census.repo}:${f.path}:${i+1}:${m[1]}`, level: 'L2-action', kind: m[1],
        hint: line.trim().slice(0, 80), source: `${census.repo}/${f.path}:${i+1}` });
  });
}
// 2) פעולות ה-store (zustand useApp — מפתחות פעולה ברמה העליונה)
for (const f of census.files.filter(f => f.domain === 'actions' && f.path.endsWith('.ts'))) {
  const txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8');
  txt.split('\n').forEach((line, i) => {
    const m = line.match(/^\s{2,6}([a-zA-Z0-9_]+):\s*(?:async\s*)?\(/);
    if (m && !/^(if|for|while|return|const|let)$/.test(m[1]))
      atoms.push({ id: `L2:${census.repo}:store:${m[1]}@${f.path}:${i+1}`, level: 'L2-action', kind: 'store-action',
        name: m[1], source: `${census.repo}/${f.path}:${i+1}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L2-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const k = {}; atoms.forEach(a => k[a.kind] = (k[a.kind]||0)+1);
console.log(`L2 ${census.repo}: ${atoms.length} אטומי-פעולה —`, JSON.stringify(k));
