#!/usr/bin/env node
/** מפעל · מכונת-החוטים — חוצבת כל פונקציה-טהורה לטיוטת-חוט בדרגת-מחצבה:
 *  פריסת-מקור מדויקת ← תרגום TS→JS ← כותרת-מוצא + שקעים-מועמדים.
 *  דרגת-מחצבה ≠ דרגת-חוזה: קופסאות לא מחווטות ממנה עד קידום ידני/נחילי. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const R = new URL('../registry/', import.meta.url).pathname;
const OUT = process.argv[2]; const REPO = process.argv[3] || 'maor';
const census = JSON.parse(fs.readFileSync(R + `census-${REPO}.json`));
const atoms = JSON.parse(fs.readFileSync(R + `atoms-L6b-${REPO}.json`));
const Q = OUT + '/quarry/'; fs.mkdirSync(Q, { recursive: true });
let ok = 0, skip = 0;
const done = new Set(fs.readdirSync(OUT + '/new/atoms').map(f => f.replace(/\..*$/, '')));
// 🚫 חוק-6: זהות/סודות לעולם לא אטום — denylist קשיח (אזעקת-אבטחה 24.8; נחצב-בטעות פעמיים)
const LAW6_DENY = new Set(['SUPER_ADMIN_EMAILS']);
for (const a of atoms) {
  if (LAW6_DENY.has(a.name)) { skip++; continue; }
  if (!a.pure) { skip++; continue; }
  const m = a.source.match(/^[^/]+\/(.+):(\d+)(?:-(\d+))?$/); if (!m) continue; // גם אטום-חד-שורתי (לקח-הרג'קס של reconcile)
  const kebab = a.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  if (done.has(kebab)) { skip++; continue; } // כבר חצוב-ידנית לדרגת-חוזה
  let txt; try { txt = fs.readFileSync(`${census.root}/${m[1]}`, 'utf8'); } catch { continue; }
  const snippet = txt.split('\n').slice(+m[2] - 1, +(m[3] || m[2])).join('\n');
  const js = ts.transpileModule(snippet, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.trim();
  if (!js || !/export/.test(js)) { skip++; continue; }
  const file = `${kebab}@${m[1].replace(/[\/.]/g, '_')}.mjs`;
  fs.writeFileSync(Q + file,
`/** 🪨 טיוטת-חוט (דרגת-מחצבה) · ${a.name} — חולל אוטומטית, טרם-קודם לדרגת-חוזה.
 *  מוצא: ${a.source} (${a.lines} שורות) · תורגם TS→JS מכונה.
 *  שקעים-מועמדים (קריאות-חוץ שצריכות הזרקה): ${(a.calls || []).join(', ') || '—'}
 *  קידום: לכתוב <שם>.contract.md + <שם>.test.mjs ← להעביר ל-new/atoms/. */
${js}
`);
  ok++;
}
console.log(`מכונת-החוטים ${REPO}: ‏${ok} טיוטות-חוט נחצבו · ${skip} דולגו (לא-טהור/כבר-חצוב)`);
