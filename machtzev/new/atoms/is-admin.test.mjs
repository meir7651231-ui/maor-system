import { isAdmin } from './is-admin.mjs';
const C=[[[], 'a@b', true],[null,'a@b',true],[['A@B.com'],' a@b.com ',true],[['x@y'],'a@b',false],[['x@y'],null,false]];
let f=0; for(const [l,e,w] of C){const g=isAdmin(l,e); if(g!==w){console.error(`✗ (${JSON.stringify(l)},${JSON.stringify(e)}) = ${g} ≠ ${w}`);f=1;}}
if(f)process.exit(1); console.log('✓ is-admin: '+C.length+' דוגמאות-חוזה — ירוק');
