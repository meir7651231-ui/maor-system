import { ruleExact } from './rule-exact.mjs';
if (ruleExact('כהנ','כהנ')!==100 || ruleExact('כה','כהנ')!==null) { console.error('✗'); process.exit(1); }
console.log('✓ rule-exact — ירוק');
