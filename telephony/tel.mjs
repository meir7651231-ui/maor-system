#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// telephony · tel — CLI מלוטש עם תת-פקודות.
//   node telephony/tel.mjs validate <cfg.json>
//   node telephony/tel.mjs preview  <cfg.json>
//   node telephony/tel.mjs report   <cfg.json>
//   node telephony/tel.mjs apply    <tenantsDir> <configRoot> [--write]
//   node telephony/tel.mjs build    <cfg.json> <outDir> [--anchor YYYY-MM-DD]
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildTenant, validateTenant } from './lib/index.mjs';
import { routingPreview, preflight } from './lib/onboard.mjs';
import { complianceReport } from './lib/security.mjs';
import { planApply, planTenants, summarize, reloadPlan, secretPreflight, migrationRisk } from './lib/apply.mjs';
import { crossTenantLeakScan } from './lib/security.mjs';
import { auditRoutes } from './lib/audit-routes.mjs';

// כתיבה-אטומית (temp+rename) — אין XML-חלקי שחוסם reloadxml גלובלית.
function atomicWrite(full, content) {
  mkdirSync(dirname(full), { recursive: true });
  const tmp = `${full}.tmp-${process.pid}`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, full);
}
const safeUnlink = (p) => { try { if (existsSync(p)) unlinkSync(p); } catch { /* best-effort */ } };
const fullOf = (configRoot, rel, tid) => rel === 'manifest.json' ? join(configRoot, 'tenants', tid, 'manifest.json') : join(configRoot, rel);

const [, , cmd, ...rest] = process.argv;
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const flag = (name) => rest.includes(name);
const opt = (name, d) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : d; };

function die(msg) { console.error(msg); process.exit(1); }

switch (cmd) {
  case 'validate': {
    const r = validateTenant(readJson(rest[0]));
    if (!r.ok) { console.error('❌ שגיאות:'); r.errors.forEach((e) => console.error('  · ' + e)); process.exit(1); }
    console.log('✅ תקין');
    if (r.warnings.length) { console.log('⚠️  סייגים:'); r.warnings.forEach((w) => console.log('  · ' + w)); }
    break;
  }
  case 'preview': {
    const r = validateTenant(readJson(rest[0]));
    if (!r.ok) die('❌ ' + r.errors.join(' · '));
    console.log('— תצוגה-מקדימה של הניתוב —');
    routingPreview(r.tenant).forEach((l) => console.log('  ' + l));
    const pf = preflight(r.tenant);
    console.log(`\nמוכנות-לחיוג: ${pf.ready ? '✅ מוכן' : '❌ חסום'}`);
    pf.blockers.forEach((b) => console.log('  ⛔ ' + b));
    pf.warnings.forEach((w) => console.log('  ⚠️  ' + w));
    break;
  }
  case 'report': {
    const b = buildTenant(readJson(rest[0]), { anchorDate: opt('--anchor') });
    if (!b.ok) die('❌ ' + b.errors.join(' · '));
    const c = complianceReport(validateTenant(readJson(rest[0])).tenant);
    console.log(JSON.stringify({ manifest: b.manifest, compliance: c }, null, 2));
    break;
  }
  case 'build': {
    const b = buildTenant(readJson(rest[0]), { anchorDate: opt('--anchor') });
    if (!b.ok) die('❌ ' + b.errors.join(' · '));
    const out = rest[1];
    if (!out) die('דרוש outDir');
    for (const [rel, content] of Object.entries(b.files)) {
      const full = join(out, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, 'utf8');
    }
    console.log(`✅ נכתב ${Object.keys(b.files).length} קבצים → ${out}`);
    break;
  }
  case 'apply': {
    const [tenantsDir, configRoot] = rest;
    if (!tenantsDir || !configRoot) die('שימוש: apply <tenantsDir> <configRoot> [--write]');
    const STATE = join(configRoot, '.telephony-state.json');
    const prev = existsSync(STATE) ? readJson(STATE) : {};
    // נחיל-5 F5: עוגן-לוח מוזרק ל-buildTenant — אחרת עמותה עם calendar.hebrew נבנית
    // **בלי סגירות-חג בכלל, בשקט** (המרכזייה מצלצלת ביום-כיפור). ‏new Date() כאן = גבול-ה-CLI.
    // **נחיל-6 R6-2 (רגרסיית-F5):** עוגן=היום צרוב למניפסט ⇒ apply דיווח עדכון-שווא **כל יום**
    // + reloadxml חי בלי-שינוי-אמת (עייפות-התראה). לכן **שומרים את העוגן מהתצלום-הקודם פר-דייר**
    // ⇒ apply אידמפוטנטי; עוגן-חדש רק ב-deploy-ראשון או ב---anchor מפורש (רענון-חלון יזום).
    const realToday = new Date().toISOString().slice(0, 10);
    const explicitAnchor = opt('--anchor');
    const prevMetaOf = (tid) => {
      try { const m = JSON.parse((prev[tid] || {})['manifest.json'] || '{}'); const c = m.hebrewCalendar || m.zmanim || {}; return { anchor: c.anchor || null, window: Number.isInteger(c.window) ? c.window : 400 }; } catch { return { anchor: null, window: 400 }; }
    };
    const daysApart = (a, b) => Math.round(Math.abs(Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
    const tenants = [];
    const bundles = []; // {tenant, files} — לאורקלים הסמנטיים
    const seen = new Set();
    for (const f of readdirSync(tenantsDir).filter((x) => x.endsWith('.json'))) {
      const raw = readJson(join(tenantsDir, f));
      const meta = prevMetaOf(raw.tenantId);
      let reused = !explicitAnchor && meta.anchor;
      // **נחיל-7 R7-9:** רענון-**אוטומטי** כשכיסוי-העתיד דל (<60 יום מ-anchor+window) — אחרת
      // reuse-העוגן משמר עוגן-פריסה-ראשון לנצח, וכשהחלון פג כל סגירות-החג "מתאדות בשקט"
      // (חזרה-בהילוך-איטי ל-R5-F5). הרענון עולה פעם ב-~שנה, לא יומי ⇒ אידמפוטנטיות נשמרת.
      if (reused && daysApart(reused, realToday) > Math.max(1, meta.window - 60)) {
        console.log(`   ♻️  ${f}: עוגן-הלוח (${reused}) מיצה כיסוי (חלון ${meta.window} יום) — רענון אוטומטי ל-${realToday}`);
        reused = null;
      }
      const anchor = explicitAnchor || reused || realToday;
      const b = buildTenant(raw, { anchorDate: anchor });
      if (!b.ok) die(`❌ ${f}: ${b.errors.join(' · ')}`);
      // סייגי-הבנייה (למשל "לוח-עברי בלי anchor") **מוצגים** — לא נבלעים (F5).
      if (b.warnings && b.warnings.length) for (const w of b.warnings) console.log(`   ⚠️  ${f}: ${w}`);
      if (seen.has(b.manifest.tenantId)) die(`❌ tenantId כפול: "${b.manifest.tenantId}" — דריסה. תקן לפני החלה.`);
      seen.add(b.manifest.tenantId);
      tenants.push({ tenantId: b.manifest.tenantId, desired: b.files });
      bundles.push({ tenantId: b.manifest.tenantId, tenant: b.tenant, files: b.files });
      // ⭐1 אורקל סגירת-מסלולים: גשר/transfer/שער יתום = כשל-שקט בפרודקשן.
      const ar = auditRoutes(b);
      if (!ar.ok) die(`❌ ${b.manifest.tenantId}: סגירת-מסלולים — גשרים-יתומים ${JSON.stringify(ar.dangling)} · transfer-יתום ${JSON.stringify(ar.orphanTransfers)} · שער-חסר ${JSON.stringify(ar.missingGateways)}`);
    }
    const { collisions } = planTenants(tenants, prev);
    if (collisions.length) die('❌ חפיפת-נתיבים: ' + JSON.stringify(collisions));
    // ⭐6 בידוד חוצה-דיירים: סוד/זהות של דייר-אחד לא יופיע בקבצי-דייר-אחר (קריטי).
    const leak = crossTenantLeakScan(bundles);
    if (!leak.clean) die('❌ דליפת-בידוד חוצת-דיירים: ' + JSON.stringify(leak.violations.slice(0, 5)));
    // ⭐5 preflight-סודות: env-var חסר = שער-דומם שקט. אזהרה כברירת-מחדל; --strict-secrets חוסם.
    const pf = secretPreflight(bundles, process.env);
    if (!pf.ok) {
      const msg = `⚠️  סודות חסרים ב-env (${pf.missing.length}): ` + pf.missing.slice(0, 8).map((m) => `${m.secret}[${m.breaks}]`).join(' · ');
      if (flag('--strict-secrets')) die('❌ ' + msg + '\n(הזרק את הסודות או הסר --strict-secrets)');
      else console.log(msg);
    }
    // ⭐17 migrationRisk — **pre-pass אטומי (נחיל-7 R7-3):** כל בדיקות-ההרסנות רצות *לפני* כל
    // כתיבה-לדיסק, כמו יתר השערים (auditRoutes/collisions/leak/secrets). die() באמצע לולאת-
    // הכתיבה השאיר דיסק מעודכן-חלקית + STATE ישן (drift-שווא) + בלי reloadxml. עכשיו die יחיד ואטומי.
    for (const t of tenants) {
      const prevMf = prev[t.tenantId] && prev[t.tenantId]['manifest.json'];
      if (!prevMf) continue;
      let pm = null; try { pm = JSON.parse(prevMf); } catch { /* ignore */ }
      const mr = migrationRisk(pm, JSON.parse(t.desired['manifest.json']));
      if (!mr.risks.length) continue;
      for (const r of mr.risks) console.log(`   ${r.severity === 'critical' ? '🛑' : r.severity === 'high' ? '⚠️ ' : 'ℹ️ '} ${t.tenantId}: ${r.detail}`);
      if (mr.destructive && flag('--write') && !flag('--allow-destructive')) {
        die(`❌ ${t.tenantId}: שינוי-הרסני נחסם. אשר עם --allow-destructive (או תקן את הקונפיג).`);
      }
    }
    const next = { ...prev };
    const touched = { creates: [], updates: [], deletes: [] };
    for (const t of tenants) {
      const plan = planApply(prev[t.tenantId] || {}, t.desired);
      touched.creates.push(...plan.creates); touched.updates.push(...plan.updates); touched.deletes.push(...plan.deletes);
      console.log(`${plan.changed ? '±' : '='} ${t.tenantId} [${summarize(plan)}]`);
      if (flag('--write')) {
        for (const [rel, content] of Object.entries(t.desired)) atomicWrite(fullOf(configRoot, rel, t.tenantId), content);
        for (const rel of plan.deletes) safeUnlink(fullOf(configRoot, rel, t.tenantId));
        next[t.tenantId] = t.desired;
      }
    }
    // פירוק-לקוח: לקוחות שהיו ב-STATE ונעלמו מ-tenantsDir.
    const vanished = Object.keys(prev).filter((id) => !tenants.some((t) => t.tenantId === id));
    for (const id of vanished) {
      const filesOf = Object.keys(prev[id] || {});
      console.log(`🗑  ${id} נעלם — ${filesOf.length} קבצים ${flag('--prune') ? 'למחיקה' : '(הרץ --prune)'}`);
      if (flag('--write') && flag('--prune')) {
        for (const rel of filesOf) { safeUnlink(fullOf(configRoot, rel, id)); touched.deletes.push(rel); }
        delete next[id];
      }
    }
    if (flag('--write')) {
      atomicWrite(STATE, JSON.stringify(next, null, 2) + '\n');
      console.log('✅ הוחל');
      const cmds = reloadPlan(touched);
      if (cmds.length) { console.log('⚠️  טען מחדש:'); for (const c of cmds) console.log(`    fs_cli -x '${c}'`); }
    } else console.log('— dry-run (הוסף --write) —');
    break;
  }
  default:
    console.log('פקודות: validate · preview · report · build · apply');
    process.exit(cmd ? 1 : 0);
}
