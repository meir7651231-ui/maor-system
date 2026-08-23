import { ruleSkeleton } from './rule-skeleton.mjs';
if (ruleSkeleton('דויד','דוד')!==58 || ruleSkeleton('דנה','דוד')!==null || ruleSkeleton('123','דוד')!==null) { console.error('✗'); process.exit(1); }
console.log('✓ rule-skeleton — ירוק');
