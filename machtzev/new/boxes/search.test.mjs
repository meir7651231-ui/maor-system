/** בדיקת-קצה של הקופסה — התרחיש המלא דרך כל החוטים המחווטים. */
import { search, score, expand } from './search.mjs';
const fam = [{ name: 'משפחת כהן' }, { name: 'משפחת לוי' }, { name: 'חוג ציור' }, { name: 'דוד כהן' }];
const gt = (f) => [f.name];
let f = 0;
const r1 = search('cohen', fam, gt);                       // תעתיק
if (!r1.some(x => x.name.includes('כהן'))) { console.error('✗ תעתיק cohen'); f = 1; }
const r2 = search('חוגים', fam, gt);                       // גזע-ריבוי
if (!r2.some(x => x.name === 'חוג ציור')) { console.error('✗ חוגים→חוג'); f = 1; }
const r3 = search('דוד כהן', fam, gt);                     // רב-מילתי — הכפול ראשון
if (r3[0]?.name !== 'דוד כהן') { console.error('✗ מיון רב-מילתי: ' + r3.map(x=>x.name)); f = 1; }
if (search('xyzq', fam, gt).length !== 0) { console.error('✗ זבל חייב ריק'); f = 1; }
if (search('', fam, gt).length !== 4) { console.error('✗ ריקה מחזירה הכול'); f = 1; }
// ירושת-החוזה של score-term המפורק — 9 הדוגמאות המקוריות, עכשיו דרך הקסקדה:
const SCORE_CASES = [['כהן','כהן',100],['כה','כהן',80],['חוגים','חוג',70],['הן','כהן',62],['דויד','דוד',58],['כוהן','כהן',58],['golstein','goldstein',48],['xyz','כהן',0],['','כהן',0]];
for (const [q, t, w] of SCORE_CASES) { const g = score(q, [t]); if (g !== w) { console.error(`✗ score("${q}","${t}") = ${g} ≠ ${w}`); f = 1; } }
if (!expand('כהן').includes('cohen')) { console.error('✗ expand'); f = 1; }
if (f) process.exit(1);
console.log('✓ קופסת-חיפוש: 7 תרחישי-קצה דרך כל 6 החוטים — ירוק');
