#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// telephony · apply-cli — כלי-המפעיל: תיקיית-לקוחות → ספריית-מרכזייה, מרכזית.
//   node telephony/apply-cli.mjs <tenantsDir> <configRoot> [--write]
//
// קורא כל <tenantsDir>/*.json, מחולל לכל לקוח, ומחשב תוכנית-החלה מול המצב
// הקיים ב-<configRoot>. בלי --write = dry-run (מראה מה ישתנה). עם --write =
// כותב + שומר תצלום ל-.telephony-state.json (לשחזור/אידמפוטנטיות).
//
// pure-downstream לכל אורך: רק קבצי-מרכזייה מקומיים; אפס קריאת/כתיבת-ספק.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildTenant } from './lib/index.mjs';
import { planApply, planTenants, summarize } from './lib/apply.mjs';

const [, , tenantsDir, configRoot, ...flags] = process.argv;
const WRITE = flags.includes('--write');
if (!tenantsDir || !configRoot) {
  console.error('שימוש: node telephony/apply-cli.mjs <tenantsDir> <configRoot> [--write]');
  process.exit(2);
}

const STATE = join(configRoot, '.telephony-state.json');
const prevState = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};

const files = readdirSync(tenantsDir).filter((f) => f.endsWith('.json'));
const tenants = [];
let hadError = false;
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(tenantsDir, f), 'utf8'));
  const res = buildTenant(raw);
  if (!res.ok) {
    hadError = true;
    console.error(`❌ ${f}: ${res.errors.join(' · ')}`);
    continue;
  }
  tenants.push({ tenantId: res.manifest.tenantId, desired: res.files, warnings: res.warnings });
}
if (hadError) process.exit(1);

// isolation גלובלי לפני החלה.
const { collisions } = planTenants(tenants, prevState);
if (collisions.length) {
  console.error('❌ חפיפת-נתיבים בין לקוחות:');
  for (const c of collisions) console.error(`  · ${c.path}: ${c.tenants.join(' vs ')}`);
  process.exit(1);
}

const nextState = { ...prevState };
let anyChanged = false;
for (const t of tenants) {
  const cur = prevState[t.tenantId] || {};
  const plan = planApply(cur, t.desired);
  if (plan.changed) anyChanged = true;
  console.log(`${plan.changed ? '±' : '='} ${t.tenantId}  [${summarize(plan)}]${t.warnings.length ? '  ⚠️ ' + t.warnings.length : ''}`);
  for (const p of [...plan.creates, ...plan.updates]) console.log(`    ${plan.creates.includes(p) ? '+' : '~'} ${p}`);
  for (const p of plan.deletes) console.log(`    - ${p}`);
  if (WRITE) {
    for (const [rel, content] of Object.entries(t.desired)) {
      // manifest פר-לקוח → tenants/<id>/; קבצי-המרכזייה → נתיבם הישיר.
      const full = rel === 'manifest.json' ? join(configRoot, 'tenants', t.tenantId, 'manifest.json') : join(configRoot, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, 'utf8');
    }
    nextState[t.tenantId] = t.desired;
  }
}

if (WRITE) {
  mkdirSync(configRoot, { recursive: true });
  writeFileSync(STATE, JSON.stringify(nextState, null, 2) + '\n', 'utf8');
  console.log(`\n✅ הוחל ${tenants.length} לקוחות → ${configRoot}`);
} else {
  console.log(`\n— dry-run — ${anyChanged ? 'יש שינויים (הרץ עם --write)' : 'אין שינויים (אידמפוטנטי)'}`);
}
