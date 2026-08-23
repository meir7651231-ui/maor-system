#!/usr/bin/env node
/** מחצב · מחלץ L0b — עיצוב מולחם בתוך רכיבים: כל זוג מאפיין:ערך = אטום
 *  (מאוגד: אטום אחד עם רשימת כל מופעיו — מוכן-לאיחוד-לפלטה). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const agg = new Map();
for (const f of census.files.filter(f => /\.tsx$/.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    for (const block of line.matchAll(/style=\{\{([^}]*)\}?\}?/g)) {
      for (const pair of block[1].matchAll(/([a-zA-Z]+)\s*:\s*('[^']*'|"[^"]*"|[a-zA-Z0-9.#%()\-, ]+)/g)) {
        const key = pair[1] + ':' + pair[2].trim().replace(/['"]/g, '');
        const a = agg.get(key) || { id: `L0b:${census.repo}:${key}`, level: 'L0b-inline-style',
          prop: pair[1], value: pair[2].trim().replace(/['"]/g, ''), count: 0, sources: [] };
        a.count++;
        if (a.sources.length < 5) a.sources.push(`${f.path}:${i+1}`);
        agg.set(key, a);
      }
    }
  });
}
const atoms = [...agg.values()].map(a => ({ ...a, source: `${census.repo}/${a.sources[0]}` }));
fs.writeFileSync(new URL(`../registry/atoms-L0b-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const occ = atoms.reduce((s, a) => s + a.count, 0);
console.log(`L0b ${census.repo}: ${atoms.length} אטומי-עיצוב-מולחם ייחודיים (‏${occ} מופעים)`);
