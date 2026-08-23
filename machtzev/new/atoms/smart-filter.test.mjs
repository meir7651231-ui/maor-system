import { smartFilter } from './smart-filter.mjs';
const hasQ=(q)=>!!String(q||'').trim();
const scoreOf=(q,terms)=>terms.includes(q)?100:terms.some(t=>t.startsWith(q))?80:0;
const items=[{n:'א',t:['כהן']},{n:'ב',t:['כה-משהו']},{n:'ג',t:['לוי']},{n:'ד',t:['כהן']}];
const gt=(x)=>x.t;
let f=0;
const all=smartFilter('',items,gt,hasQ,scoreOf); if(all.length!==4){console.error('✗ ריקה');f=1;}
const one=smartFilter('',items,gt,hasQ,scoreOf,1); if(one.length!==1){console.error('✗ limit');f=1;}
const r=smartFilter('כהן',items,gt,hasQ,scoreOf);
if(r.some(x=>x.n==='ג')){console.error('✗ ציון-אפס לא סונן');f=1;}
if(!(r[0].n==='א'&&r[1].n==='ד')){console.error('✗ יציבות/מיון: '+r.map(x=>x.n));f=1;}
if(f)process.exit(1); console.log('✓ smart-filter: 5 בדיקות-חוזה — ירוק');
