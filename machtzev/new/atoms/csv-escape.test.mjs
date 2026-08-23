import { csvEscape } from './csv-escape.mjs';
const C=[['=SUM(A1)',"'=SUM(A1)"],['שלום','שלום'],['א,ב','"א,ב"'],['ג"ג','"ג""ג"'],[5,'5'],[null,''],['-5',"'-5"]];
let f=0; for(const [a,w] of C){const g=csvEscape(a); if(g!==w){console.error(`✗ ${JSON.stringify(a)} ⇒ ${JSON.stringify(g)} ≠ ${JSON.stringify(w)}`);f=1;}}
if(f)process.exit(1); console.log('✓ csv-escape: '+C.length+' דוגמאות-חוזה — ירוק');
