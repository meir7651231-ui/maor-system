#!/usr/bin/env node
/** מפעל · מחולל אטומי-נתונים — מילון-תבניות, אייקונים, שדות-סכמה: קוד+חוזה+בדיקה, אוטומטי מלא. */
import fs from 'node:fs';
const R = new URL('../registry/', import.meta.url).pathname;
const OUT = process.argv[2]; if (!OUT) { console.error('usage: gen-data.mjs <genesis-root>'); process.exit(2); }
const load = f => { try { return JSON.parse(fs.readFileSync(R + f)); } catch { return []; } };
const A = OUT + '/new/atoms/';

/* מילון-התבניות: כל תבנית-מחרוזת ייחודית של maor */
const tpl = t => t.replace(/\d+/g, '#').replace(/["'׳״!?.:…]/g, '').trim();
const dict = new Map();
for (const a of load('atoms-L5b-maor.json')) { const k = tpl(a.text); if (k.length >= 2 && /[֐-׿]/.test(k)) dict.set(k, (dict.get(k) || 0) + 1); }
const entries = [...dict.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync(A + 'dict-he.mjs',
`/** אטום-נתונים · מילון-עברית — כל תבניות-הטקסט של maor (# = מספר-משתנה).\n *  חוזה: dict-he.contract.md · חולל אוטומטית מהמרשם — לא לערוך ידנית. */\nexport const DICT_HE = ${JSON.stringify(Object.fromEntries(entries), null, 0)};\n`);
fs.writeFileSync(A + 'dict-he.contract.md',
`# חוזה · אטום-נתונים מילון-עברית\n**תפקיד:** כל תבנית-טקסט-עברית במערכת, פעם אחת, עם מונה-שימושים.\n**התחייבויות:** ${entries.length} תבניות · אפס-כפילויות (Map) · כל מפתח מכיל עברית · ערך=מונה>0.\n**מוצא:** חולל מ-atoms-L5b-maor (${entries.reduce((s,[,c])=>s+c,0)} מופעים בקוד).\n`);
fs.writeFileSync(A + 'dict-he.test.mjs',
`import { DICT_HE } from './dict-he.mjs';\nconst ks=Object.keys(DICT_HE); let f=0;\nif(ks.length<1000){console.error('✗ מילון קטן מדי: '+ks.length);f=1;}\nfor(const k of ks){ if(!/[֐-׿]/.test(k)){console.error('✗ בלי עברית: '+k);f=1;break;} if(!(DICT_HE[k]>0)){console.error('✗ מונה-אפס: '+k);f=1;break;} }\nif(f)process.exit(1); console.log('✓ מילון-עברית: '+ks.length+' תבניות — ירוק');\n`);

/* אייקונים מאוחד (שני הריפו) */
const icons = new Map();
for (const repo of ['maor','buildsmart']) for (const a of load(`atoms-L11-${repo}.json`)) icons.set(a.glyph, (icons.get(a.glyph)||0)+a.count);
fs.writeFileSync(A + 'icons.mjs',
`/** אטום-נתונים · אייקונים — כל סמל בשימוש, עם מונה. חולל אוטומטית. */\nexport const ICONS = ${JSON.stringify(Object.fromEntries([...icons.entries()].sort((a,b)=>b[1]-a[1])), null, 0)};\n`);
fs.writeFileSync(A + 'icons.contract.md', `# חוזה · אטום-נתונים אייקונים\n**התחייבויות:** ${icons.size} סמלים ייחודיים · מונה>0 לכל אחד. **מוצא:** L11 שני הריפו.\n`);
fs.writeFileSync(A + 'icons.test.mjs',
`import { ICONS } from './icons.mjs';\nconst ks=Object.keys(ICONS); let f=0;\nif(ks.length<100){console.error('✗ מעט מדי');f=1;}\nfor(const k of ks) if(!(ICONS[k]>0)){f=1;break;}\nif(f)process.exit(1); console.log('✓ אייקונים: '+ks.length+' סמלים — ירוק');\n`);

/* שדות-סכמה */
const fields = load('atoms-L10-maor.json').map(a => ({ e: a.entity, n: a.name, o: a.optional, t: a.type }));
fs.writeFileSync(A + 'schema-fields.mjs',
`/** אטום-נתונים · שדות-הסכמה של maor — הרזולוציה המלאה של מודל-הנתונים. חולל אוטומטית. */\nexport const FIELDS = ${JSON.stringify(fields, null, 0)};\n`);
fs.writeFileSync(A + 'schema-fields.contract.md', `# חוזה · שדות-סכמה\n**התחייבויות:** ${fields.length} שדות · לכל שדה ישות+שם+טיפוס · אפס-כפילות ישות.שם. **מוצא:** L10.\n`);
fs.writeFileSync(A + 'schema-fields.test.mjs',
`import { FIELDS } from './schema-fields.mjs';\nconst seen=new Set(); let f=0;\nfor(const x of FIELDS){const k=x.e+'.'+x.n; if(seen.has(k)){console.error('✗ כפול: '+k);f=1;break;} seen.add(k); if(!x.e||!x.n||!x.t){console.error('✗ חסר: '+k);f=1;break;}}\nif(FIELDS.length<300)f=1;\nif(f)process.exit(1); console.log('✓ שדות-סכמה: '+FIELDS.length+' — ירוק');\n`);
console.log(`מפעל-נתונים: מילון ${entries.length} · אייקונים ${icons.size} · שדות ${fields.length}`);
