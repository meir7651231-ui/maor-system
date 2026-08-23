import { toCsv } from './to-csv.mjs';
const id=(x)=>String(x);
let f=0;
if(toCsv([['א','ב'],['1','2']],id)!=='﻿א,ב\n1,2'){console.error('✗ בסיסי');f=1;}
if(toCsv([],id)!=='﻿'){console.error('✗ ריק');f=1;}
if(!toCsv([['x']],id).startsWith('﻿')){console.error('✗ BOM');f=1;}
if(f)process.exit(1); console.log('✓ to-csv: 3 דוגמאות-חוזה — ירוק');
