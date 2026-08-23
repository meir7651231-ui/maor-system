#!/usr/bin/env node
/** מפעל · מכונת-החיווט — טיוטת-קופסה לכל מודול-מקור: אילו חוטים הוא צריך
 *  ומי-קורא-למי (מגרף-הקריאות שנרשם ב-L6b). טיוטה = תוכנית-חיווט, לא קוד-רץ. */
import fs from 'node:fs';
const R = new URL('../registry/', import.meta.url).pathname;
const OUT = process.argv[2]; const REPO = process.argv[3] || 'maor';
const atoms = JSON.parse(fs.readFileSync(R + `atoms-L6b-${REPO}.json`));
const D = OUT + '/box-drafts/'; fs.mkdirSync(D, { recursive: true });
const byFile = new Map();
for (const a of atoms) {
  const file = a.source.replace(/^[^/]+\//, '').replace(/:\d+-\d+$/, '');
  byFile.set(file, [...(byFile.get(file) || []), a]);
}
const allNames = new Set(atoms.map(a => a.name));
let n = 0;
for (const [file, fns] of byFile) {
  if (fns.length < 3) continue;
  const boxName = file.replace(/^src\//, '').replace(/\/(lib|index)\.(ts|mjs)$/, '').replace(/\.(ts|mjs)$/, '').replace(/[\/]/g, '-');
  const internal = new Set(fns.map(f => f.name));
  const lines = fns.map(f => {
    const calls = (f.calls || []);
    const int = calls.filter(c => internal.has(c));
    const ext = calls.filter(c => !internal.has(c) && allNames.has(c));
    const unk = calls.filter(c => !allNames.has(c));
    return `· ${f.name} (${f.lines}ש${f.pure ? '' : ' ⚠️לא-טהור'})` +
      (int.length ? ` ← פנימי: ${int.join(',')}` : '') +
      (ext.length ? ` ← חוטי-מודולים-אחרים: ${ext.join(',')}` : '') +
      (unk.length ? ` ← שקעים-חיצוניים: ${unk.slice(0,5).join(',')}` : '');
  });
  fs.writeFileSync(D + boxName + '.box-draft.md',
`# 📦 טיוטת-קופסה · ${boxName}\n> חוללה ממכונת-החיווט (גרף-הקריאות של ${file}). ‏${fns.length} חוטים.\n> קידום: לבחור מהחוטים המקודמים ב-new/atoms, לחווט לפי הגרף, חוזה+בדיקת-קצה.\n\n## תוכנית-החיווט\n${lines.join('\n')}\n`);
  n++;
}
console.log(`מכונת-החיווט ${REPO}: ‏${n} טיוטות-קופסאות (מודולים עם ≥3 חוטים)`);
