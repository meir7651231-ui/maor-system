/** בדיקת-חוזה מקצה-לקצה — מוכיחה את הדוגמאות מ-levenshtein.contract.md בדיוק. */
import { levenshtein } from './levenshtein.mjs';
const CASES = [['','',0],['אבג','אבג',0],['','abc',3],['cohen','kohen',1],['משה','מושה',1],['sara','sarah',1],['kitten','sitting',3]];
let fail = 0;
for (const [a, b, want] of CASES) {
  const got = levenshtein(a, b);
  if (got !== want) { console.error(`✗ d("${a}","${b}") = ${got}, החוזה דורש ${want}`); fail = 1; }
  const sym = levenshtein(b, a);
  if (sym !== got) { console.error(`✗ סימטריה נשברה: d("${a}","${b}")=${got} אבל d("${b}","${a}")=${sym}`); fail = 1; }
}
if (fail) process.exit(1);
console.log(`✓ levenshtein: ${CASES.length} דוגמאות-חוזה + סימטריה — ירוק`);
