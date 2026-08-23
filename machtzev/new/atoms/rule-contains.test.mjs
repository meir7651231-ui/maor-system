import { ruleContains } from './rule-contains.mjs';
if (ruleContains('הנ','כהנ')!==62 || ruleContains('ה','כהנ')!==null) { console.error('✗'); process.exit(1); }
console.log('✓ rule-contains — ירוק');
