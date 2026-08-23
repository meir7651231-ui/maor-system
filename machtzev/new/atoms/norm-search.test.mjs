import { normSearch } from './norm-search.mjs';
const C = [['שָׁלוֹם','שלומ'],['כהן ז"ל','כהנ זל'],['בֵּן־דָּוִד','בנדוד'],['ABC','abc'],['חוגים','חוגימ'],[null,''],['  יוסף ','יוספ']];
let f=0; for (const [a,w] of C) { const g=normSearch(a); if (g!==w){console.error(`✗ "${a}" ⇒ "${g}" ≠ "${w}"`);f=1;} }
if (f) process.exit(1); console.log(`✓ norm-search: ${C.length} דוגמאות-חוזה — ירוק`);
