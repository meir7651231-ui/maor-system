import { rulePrefix } from './rule-prefix.mjs';
if (rulePrefix('כה','כהנ')!==80 || rulePrefix('הנ','כהנ')!==null) { console.error('✗'); process.exit(1); }
console.log('✓ rule-prefix — ירוק');
