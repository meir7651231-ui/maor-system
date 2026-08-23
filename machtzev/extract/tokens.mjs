#!/usr/bin/env node
/** מחצב · מחלץ L0 — אטום-עיצוב אחד פר-שם; ריבוי-ערכים (ערכות/מצבים) נאגד פנימה. */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const byName = new Map();
for (const f of census.files.filter(f => f.domain === 'tokens')) {
  const txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8');
  txt.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/);
    if (!m) return;
    const a = byName.get(m[1]) || { id: `L0:${census.repo}:${m[1]}`, level: 'L0-token', name: m[1],
      kind: /color|#|rgb|hsl|oklch/.test(m[2]) || /-(bg|ink|line|accent|paper|surface)/.test(m[1]) ? 'color'
          : /font/.test(m[1]+m[2]) ? 'font' : /radius|round/.test(m[1]) ? 'shape'
          : /space|gap|pad|size|width|height/.test(m[1]) ? 'space' : /motion|dur|ease|transition/.test(m[1]) ? 'motion' : 'other',
      values: [], source: `${census.repo}/${f.path}:${i+1}` };
    a.values.push({ value: m[2].trim(), at: `${f.path}:${i+1}` });
    byName.set(m[1], a);
  });
}
const atoms = [...byName.values()];
fs.writeFileSync(new URL(`../registry/atoms-L0-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const k = {}; atoms.forEach(a => k[a.kind] = (k[a.kind]||0)+1);
console.log(`L0 ${census.repo}: ${atoms.length} אטומי-עיצוב (‏${atoms.reduce((s,a)=>s+a.values.length,0)} הגדרות) —`, JSON.stringify(k));
