#!/usr/bin/env node
/** מחצב · מחלץ L1+L3 — כל רכיב מיוצא; קובצי-מסך מקבלים סימון screen + מניפסט-גס
 *  (אילו רכיבים אחרים הם מרכיבים — עץ-ההרכבה). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const comps = [];
const files = census.files.filter(f => /\.(tsx|dart)$/.test(f.path) && ['screens','source'].includes(f.domain));
// שלב א: אסוף שמות רכיבים
for (const f of files) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  const names = new Set();
  for (const m of txt.matchAll(/export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/g)) names.add(m[1]);
  for (const m of txt.matchAll(/export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g)) names.add(m[1]);
  for (const m of txt.matchAll(/class\s+([A-Z][A-Za-z0-9_]*)\s+extends\s+(?:StatelessWidget|StatefulWidget|ConsumerWidget|ConsumerStatefulWidget|HookWidget|State<|ConsumerState<)/g)) names.add(m[1]);
  comps.push({ file: f, txt, names: [...names] });
}
const allNames = new Map(); // שם ⇒ קובץ מגדיר
for (const c of comps) for (const n of c.names) if (!allNames.has(n)) allNames.set(n, c.file.path);
// שלב ב: אטומים + עץ-שימוש
const atoms = [];
for (const c of comps) {
  const uses = new Set();
  for (const [n, def] of allNames) if (def !== c.file.path && new RegExp(`<${n}[\\s/>]|\\b${n}\\(`).test(c.txt)) uses.add(n);
  const isScreen = /(View|Screen|Panel|Tab|Page)\.?(tsx|dart)?$/.test(c.file.path.replace(/\.(tsx|dart)$/,'')) || uses.size >= 5;
  for (const n of c.names) atoms.push({ id: `L1:${census.repo}:${n}@${c.file.path}`, level: isScreen ? 'L3-screen' : 'L1-component',
    name: n, composes: isScreen ? [...uses] : undefined, lines: c.file.lines, source: `${census.repo}/${c.file.path}` });
}
fs.writeFileSync(new URL(`../registry/atoms-L1-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const screens = atoms.filter(a => a.level === 'L3-screen').length;
console.log(`L1/L3 ${census.repo}: ${atoms.length} רכיבים · ${screens} מהם מסכים (עם עץ-הרכבה)`);
