import { rulePlural } from './rule-plural.mjs';
if (rulePlural('חוגימ','חוג')!==70 || rulePlural('חוג','חוגימ')!==null) { console.error('✗'); process.exit(1); }
console.log('✓ rule-plural — ירוק');
