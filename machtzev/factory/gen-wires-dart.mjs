#!/usr/bin/env node
/** מפעל · מכונת-החוטים ל-Dart — חוצבת כל פונקציה-טהורה מ-app_flutter (האתר-החי
 *  של בנייה-חכמה) לטיוטת-חוט Dart-טהורה. שלא כמו gen-wires (TS→JS), Dart אינו
 *  מתורגם — הקטלוג של בנייה-חכמה נשאר Dart-מקביל (חוק-4: הקוד-החלוץ קדוש, לא
 *  "מתרגמים" אותו לשפה זרה). פריסת-מקור מדויקת + כותרת-מוצא + שקעים-מועמדים. */
import fs from 'node:fs';
const R = new URL('../registry/', import.meta.url).pathname;
const OUT = process.argv[2];               // ריפו-היעד (גנסיס)
const census = JSON.parse(fs.readFileSync(R + 'census-buildsmart.json'));
const atoms = JSON.parse(fs.readFileSync(R + 'atoms-L6b-buildsmart.json'));
const list = Array.isArray(atoms) ? atoms : atoms.atoms;
const Q = OUT + '/dart-quarry/'; fs.mkdirSync(Q, { recursive: true });
const done = new Set(fs.existsSync(OUT + '/new/dart')
  ? fs.readdirSync(OUT + '/new/dart').map(f => f.replace(/\..*$/, '')) : []);
let ok = 0, skip = 0;
for (const a of list) {
  if (!a.pure) { skip++; continue; }
  const m = a.source.match(/^[^/]+\/(.+\.dart):(\d+)(?:-(\d+))?$/);
  if (!m) { skip++; continue; }            // רק Dart (ה-TS דרך gen-wires הרגילה)
  // שם-snake ל-Dart (המוסכמה הילידית): parseBore ⇒ parse_bore
  const snake = a.name.replace(/^_/, '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  if (done.has(snake)) { skip++; continue; }
  let txt; try { txt = fs.readFileSync(`${census.root}/${m[1]}`, 'utf8'); } catch { skip++; continue; }
  const body = txt.split('\n').slice(+m[2] - 1, +(m[3] || m[2])).join('\n');
  if (!body.trim()) { skip++; continue; }
  const priv = a.name.startsWith('_') ? ' · ⚠️ פרטי-במקור (עוזר — שקול גלגול לקופסה, כלל-הגלגול)' : '';
  const file = `${snake}@${m[1].replace(/[\/.]/g, '_')}.dart`;
  fs.writeFileSync(Q + file,
`// 🪨 טיוטת-חוט Dart (דרגת-מחצבה) · ${a.name} — חולל אוטומטית מהאתר-החי (app_flutter).
// מוצא: ${a.source} (${a.lines} שורות) · Dart-טהור, לא-מתורגם (חוק-4)${priv}
// שקעים-מועמדים (קריאות-חוץ להזרקה): ${(a.calls || []).filter(c => c !== a.name).join(', ') || '—'}
// קידום: <שם>.contract.md + <שם>_test.dart (flutter test) ⇒ new/dart/.
${body}
`);
  ok++;
}
console.log(`מכונת-חוטי-Dart: ‏${ok} טיוטות נחצבו · ${skip} דולגו (לא-טהור/TS/כבר-חצוב) ⇒ ${Q}`);
