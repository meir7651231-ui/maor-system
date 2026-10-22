/**
 * ביקורת-חיפוש של החנות (22.10) — כל פריט/חבילה/מוצר/שדרוג/תחום נמצא לפי שמו, ושאילתות נפוצות מחזירות תוצאה.
 * מריץ את ליבת-החיפוש האמיתית מתוך index.html (בין SEARCH-CORE). שימוש: node e2e/store-search-audit.mjs ['שאילתה|שאילתה']
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const S=fileURLToPath(new URL('../public/orbit/store/', import.meta.url));
const html=readFileSync(S+'index.html','utf8');
const core=html.slice(html.indexOf('/*SEARCH-CORE*/'), html.indexOf('/*END-SEARCH-CORE*/'));
const D=JSON.parse(readFileSync(S+'data.json','utf8')), UP=JSON.parse(readFileSync(S+'upgrade.json','utf8'));
const IT=D.items, PK=D.packs, PR=D.products, ED=D.editions;
const UPUSES = ["מערכת ישנה שאין מי שיתחזק", "אתר שגדל ונהיה כבד", "אקסלים שהפכו למערכת", "מעבר מאתר לאפליקציה"];
const { matcher } = new Function(core + '; return { matcher };')();
function search(q){ const {hit}=matcher(q); const out=[];
 PK.forEach(p=>{const inner=p.inc.filter(i=>hit(IT[i].n+" "+IT[i].d)); if(hit(p.n+" "+p.d+" "+(p.uses||[]).join(" "))||inner.length) out.push('pack:'+p.n);});
 PR.forEach(p=>{const inner=p.inc.filter(i=>hit(IT[i].n+" "+IT[i].d)); const lead=IT[p.lead]?IT[p.lead].n+" "+IT[p.lead].d:""; const extra=[(p.uses||[]).join(" "),p.proof||"",p.orig_n||"",lead,p.who||""].join(" "); if(hit(p.n+" "+p.d+" "+extra)||inner.length) out.push('prod:'+p.n);});
 UP.forEach(u=>{const inner=u.inc.filter(x=>hit(x.n+" "+x.d)); if(hit(u.n+" "+u.d+" "+UPUSES.join(" ")+" שדרוג המרה הסבה מיגרציה מערכת ישנה")||inner.length) out.push('up:'+u.n);});
 ED.forEach(e=>{ if(hit(e.label+" "+e.sub+" "+(e.lead||""))) out.push('ed:'+e.label); });
 if(D.base.filter(i=>hit(IT[i].n+" "+IT[i].d)).length) out.push('base');
 return out; }
const keys=Object.keys(IT);
const miss=keys.filter(k=>!D.hidden.includes(+k)&&!search(IT[k].n).length); console.log('item-name misses (incl. orphans/leads):',miss.length, miss.map(k=>IT[k].n));
for (const [kind,arr,f] of [['pack',PK,x=>x.n],['prod',PR,x=>x.n],['up',UP,x=>x.n],['edition',ED,x=>x.label],['edition-sub',ED,x=>x.sub]]) {
  const m=arr.filter(x=>!search(f(x)).length).map(f); console.log(kind,'misses',m.length,m);
}
const Q=(process.argv[2]||'קבלות|תורמים|וואטסאפ|מוסך|קוסמטיקה|בית כנסת|מרכזיה|CRM|הוראת קבע|תמחיר|מזגנים|שדרוג').split('|').map(s=>s.trim()).filter(Boolean);
let bad=0; for(const q of Q){const r=search(q); if(!r.length) bad++; console.log((r.length?'✓ ':'✗ ')+q+' → '+r.length+' '+r.slice(0,3).join(' , '));}
console.log('queries',Q.length,'misses',bad);

const fails = miss.length + bad;
if (fails) { console.log('💥', fails, 'כשלים'); process.exit(1); } else console.log('🏆 החיפוש מוצא הכול');
