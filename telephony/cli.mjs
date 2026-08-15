#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// telephony · cli — הרצת-המנוע משורת-הפקודה.
//   node telephony/cli.mjs <tenant.json> [outDir]
// בלי outDir → מדפיס manifest + סייגים בלבד (dry-run). עם outDir → כותב קבצים.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildTenant } from './lib/index.mjs';

const [, , inPath, outDir] = process.argv;
if (!inPath) {
  console.error('שימוש: node telephony/cli.mjs <tenant.json> [outDir]');
  process.exit(2);
}

const raw = JSON.parse(readFileSync(inPath, 'utf8'));
const res = buildTenant(raw);

if (!res.ok) {
  console.error('❌ קונפיג לא-תקין:');
  for (const e of res.errors) console.error('  · ' + e);
  process.exit(1);
}

console.log(`✅ ${res.manifest.orgName} (${res.manifest.tenantId}) — ${res.manifest.model}`);
console.log(`   מספרים נושאי-קול: ${res.manifest.inboundVoiceNumbers.length} · ערוצי-יציאה: ${res.manifest.outboundSims.length}`);
if (res.warnings.length) {
  console.log('⚠️  סייגים:');
  for (const w of res.warnings) console.log('  · ' + w);
}

if (outDir) {
  for (const [rel, content] of Object.entries(res.files)) {
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content, 'utf8');
    console.log('   כתב ' + dest);
  }
} else {
  console.log('\n— dry-run (בלי outDir). manifest: —');
  console.log(JSON.stringify(res.manifest, null, 2));
}
