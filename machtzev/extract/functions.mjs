#!/usr/bin/env node
/** מחצב · מחלץ L6b — פירוק-מקסימום: כל פונקציה מיוצאת = חוט נפרד,
 *  עם גבולות-שורה מדויקים ורשימת-מי-היא-קוראת (החיווט העתידי שלה). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'engines' && /\.(ts|mjs|dart)$/.test(f.path))) {
  let txt; try { txt = fs.readFileSync(`${census.root}/${f.path}`, 'utf8'); } catch { continue; }
  const lines = txt.split('\n');
  const marks = []; // [שורה, שם]
  const isDart = f.path.endsWith('.dart');
  lines.forEach((l, i) => {
    const m = isDart
      ? l.match(/^(?:  )?(?:static\s+)?[A-Za-z_][A-Za-z0-9_<>,?\[\] ]*\s+([a-zA-Z_][A-Za-z0-9_]*)\s*\(.*\)\s*(?:async\s*)?(?:\{|=>)\s*$/)
      : l.match(/^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/);
    if (m && !/^(if|for|while|switch|return|catch|assert|super|this)$/.test(m[1])) marks.push([i + 1, m[1]]);
  });
  marks.forEach(([start, name], idx) => {
    const end = idx + 1 < marks.length ? marks[idx + 1][0] - 1 : lines.length;
    const body = lines.slice(start - 1, end).join('\n');
    const calls = [...new Set([...body.matchAll(/\b([a-z][A-Za-z0-9_]{3,})\(/g)].map(m => m[1])
      .filter(c => !['return','const','function','await','if','for','while','switch','String','Number','Math','Object','Array','JSON','Boolean','Date','Set','Map','console','push','slice','filter','map','some','every','includes','replace','match','split','join','trim','sort','reduce','forEach','indexOf','startsWith','endsWith','toLowerCase','toUpperCase','test','exec','round','floor','ceil','abs','min','max','keys','values','entries','parse','stringify','from','isArray','find','findIndex','flat','concat','padStart','padEnd','charAt','localeCompare','toFixed','toLocaleString','add','has','get','set','delete'].includes(c)))].slice(0, 12);
    atoms.push({ id: `L6b:${census.repo}:${f.path}#${name}@${start}`, level: 'L6b-function', name,
      lines: end - start + 1, calls, pure: !/document\.|window\.|localStorage|firebase/.test(body),
      source: `${census.repo}/${f.path}:${start}-${end}` });
  });
}
fs.writeFileSync(new URL(`../registry/atoms-L6b-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const pure = atoms.filter(a => a.pure).length;
console.log(`L6b ${census.repo}: ${atoms.length} פונקציות-כחוטים (‏${pure} טהורות) — פירוק-מקסימום של שכבת-המנועים`);
