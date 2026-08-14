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

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildTenant } from './lib/index.mjs';
import { planApply, planTenants, summarize, reloadPlan } from './lib/apply.mjs';

const [, , tenantsDir, configRoot, ...flags] = process.argv;
const WRITE = flags.includes('--write');
const PRUNE = flags.includes('--prune'); // מוחק לקוחות-שנעלמו מ-tenantsDir
if (!tenantsDir || !configRoot) {
  console.error('שימוש: node telephony/apply-cli.mjs <tenantsDir> <configRoot> [--write] [--prune]');
  process.exit(2);
}

// נתיב-מלא: manifest פר-לקוח → tenants/<id>/; קבצי-מרכזייה → נתיבם הישיר.
const fullPath = (rel, tenantId) =>
  rel === 'manifest.json' ? join(configRoot, 'tenants', tenantId, 'manifest.json') : join(configRoot, rel);
// כתיבה אטומית: temp באותה תיקייה + rename (אטומי ב-POSIX) ⇒ אין קובץ-חלקי שחוסם reloadxml.
function atomicWrite(full, content) {
  mkdirSync(dirname(full), { recursive: true });
  const tmp = `${full}.tmp-${process.pid}`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, full);
}
const safeUnlink = (p) => { try { if (existsSync(p)) unlinkSync(p); } catch { /* best-effort */ } };

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

// שער-ייחודיות tenantId: שני קבצים עם אותו מזהה = דריסה-שקטה (הפרת בידוד).
const seenIds = new Set();
for (const t of tenants) {
  if (seenIds.has(t.tenantId)) {
    console.error(`❌ tenantId כפול: "${t.tenantId}" מופיע בשני קבצי-קונפיג — דריסה. תקן לפני החלה.`);
    process.exit(1);
  }
  seenIds.add(t.tenantId);
}

// isolation גלובלי לפני החלה.
const { collisions } = planTenants(tenants, prevState);
if (collisions.length) {
  console.error('❌ חפיפת-נתיבים בין לקוחות:');
  for (const c of collisions) console.error(`  · ${c.path}: ${c.tenants.join(' vs ')}`);
  process.exit(1);
}

const nextState = { ...prevState };
let anyChanged = false;
const touched = { creates: [], updates: [], deletes: [] };
for (const t of tenants) {
  const cur = prevState[t.tenantId] || {};
  const plan = planApply(cur, t.desired);
  if (plan.changed) anyChanged = true;
  touched.creates.push(...plan.creates);
  touched.updates.push(...plan.updates);
  touched.deletes.push(...plan.deletes);
  console.log(`${plan.changed ? '±' : '='} ${t.tenantId}  [${summarize(plan)}]${t.warnings.length ? '  ⚠️ ' + t.warnings.length : ''}`);
  for (const p of [...plan.creates, ...plan.updates]) console.log(`    ${plan.creates.includes(p) ? '+' : '~'} ${p}`);
  for (const p of plan.deletes) console.log(`    - ${p}`);
  if (WRITE) {
    for (const [rel, content] of Object.entries(t.desired)) atomicWrite(fullPath(rel, t.tenantId), content);
    for (const rel of plan.deletes) safeUnlink(fullPath(rel, t.tenantId)); // מחיקה בפועל (#23)
    nextState[t.tenantId] = t.desired;
  }
}

// פירוק-לקוח (#24): לקוחות שהיו ב-state ונעלמו מ-tenantsDir.
const vanished = Object.keys(prevState).filter((id) => !tenants.some((t) => t.tenantId === id));
for (const id of vanished) {
  const filesOf = Object.keys(prevState[id] || {});
  console.log(`🗑  ${id} נעלם — ${filesOf.length} קבצים ${PRUNE ? 'למחיקה' : '(הרץ --prune למחיקה)'}`);
  if (WRITE && PRUNE) {
    for (const rel of filesOf) safeUnlink(fullPath(rel, id));
    delete nextState[id];
    anyChanged = true;
  }
}

const reloadCmds = reloadPlan(touched);
if (WRITE) {
  mkdirSync(configRoot, { recursive: true });
  atomicWrite(STATE, JSON.stringify(nextState, null, 2) + '\n');
  console.log(`\n✅ הוחל ${tenants.length} לקוחות → ${configRoot}`);
  if (reloadCmds.length) {
    console.log('⚠️  צעד-חובה — טען מחדש ב-FreeSWITCH:');
    for (const c of reloadCmds) console.log(`    fs_cli -x '${c}'`);
  }
} else {
  console.log(`\n— dry-run — ${anyChanged ? 'יש שינויים (הרץ עם --write)' : 'אין שינויים (אידמפוטנטי)'}`);
}
