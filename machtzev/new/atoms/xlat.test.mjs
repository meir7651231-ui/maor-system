import { XLAT, expandQuery } from './xlat.mjs';
const norm = (t) => String(t||'').toLowerCase().replace(/[֑-ׇ]/g,'').replace(/[ךםןףץ]/g,(c)=>({ך:'כ',ם:'מ',ן:'נ',ף:'פ',ץ:'צ'})[c]).replace(/['"׳״\-–._]/g,'').trim();
let f=0;
const has=(q,x)=>expandQuery(q,norm).includes(x);
if(!has('כהן','cohen')||!has('כהן','коэн')){console.error('✗ כהן לא מתרחב');f=1;}
if(!has('cohen','כהן')){console.error('✗ כיוון-הפוך נכשל');f=1;}
if(!has('משה','מוישי')){console.error('✗ כינוי חסר');f=1;}
if(expandQuery('xyz',norm).length!==1){console.error('✗ לא-מוכר חייב להישאר לבד');f=1;}
if(expandQuery('כהן',norm)[0]!=='כהן'){console.error('✗ המקור חייב להיות ראשון');f=1;}
if(Object.keys(XLAT).length<20){console.error('✗ הטבלה נחתכה');f=1;}
if(f)process.exit(1); console.log('✓ xlat: 6 בדיקות-חוזה — ירוק (טבלה: '+Object.keys(XLAT).length+' ערכים)');
