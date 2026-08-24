#!/usr/bin/env node
/** 🥇 רתמת-זהב · platform — הישן (maor/src/components/platform/lib.ts, מתורגם-חי עם
 *  ה-typescript של מאור) ≡ החדש (Genesis new/boxes/platform.mjs) על קורפוס-LCG
 *  דטרמיניסטי (seed=20260824): סלאגים/עברית/מיילים/org-docs/קונפיגים/דגלי-opt-in.
 *  אפס-סטייה ישן≡חדש. אין Date.now — הכול טהור-דטרמיניסטי. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'plat-'));
const tp = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// קונפיג-הלידה (DEFAULT_CONFIG) — stub מ-types/config.ts:404-410 (verbatim, מתורגם-חי)
const cfgSrc = fs.readFileSync('/home/user/maor-system/src/types/config.ts', 'utf8').split('\n').slice(403, 410).join('\n');
fs.writeFileSync(path.join(tdir, 'config.mjs'), tp(cfgSrc));

// המקור המלא — רק ה-import של ה-config מוסב ל-stub; ה-import type ל-cloudConfig נמחק בתרגום
let libSrc = fs.readFileSync('/home/user/maor-system/src/components/platform/lib.ts', 'utf8');
libSrc = libSrc.replace("'../../types/config'", "'./config.mjs'");
fs.writeFileSync(path.join(tdir, 'lib.mjs'), tp(libSrc));

const OLD = await import(pathToFileURL(path.join(tdir, 'lib.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/platform.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const orgNames = ['מאור החסד', 'Test Org', '', '   ', '!!!', 'ארגון-123', 'A', 'שלום עולם', 'x'.repeat(50), 'קרן ע"ש פלוני'];
const takenLists = [[], ['test'], ['org', 'org-2'], ['mavr-hchsd'], ['a', 'b', 'c']];
const slugCands = ['ab', 'A', 'x', 'org-1', 'a'.repeat(41), 'a_b', 'good-slug', '12', ''];
const emails = ['m@o.co', ' E@O.CO ', 'x@y.z', '', 'Admin@Org.Co', 'e@o.co'];
const seeds = ['x', 'org-2026', 'מאור', '', 'a'.repeat(30), 'slug.123'];
const fullCodes = ['org.abcd', 'x.c', 'nodot', 'A!.code', 'good-slug.ZZ', '.leading', 'org.', 'a-b.c-d'];
const managers = ['m@o.co', '', undefined, 'M@O.CO', ' e@o.co '];
const membersLists = [undefined, [], ['e@o.co'], ['E@O.CO', 'a@b.co'], [' x@y.z ']];
const overrides = [
  undefined, {}, { modules: { shop: false } }, { features: { 'supporters.delete': true } },
  { features: { 'supporters.hok': true, 'shop.delete': false } }, { designations: [] },
  { designations: ['tuition', 'general'] }, { modules: {}, features: {} },
];
const modCfgs = [{}, { shop: false }, { families: false, shop: true }, { shop7: false, tzedaka: false }];
const featFlags = [{}, { 'supporters.hok': false }, { 'supporters.cockpit': true }, { 'shop.x': false, 'supporters.hok': true }];
const featRegs = [
  { key: 'supporters.hok', module: 'supporters' },
  { key: 'shop.x', module: 'shop' },
  { key: 'supporters.cockpit', module: 'supporters', optIn: true },
  { key: 'courses.z', module: 'courses' },
  { key: 'global.thing', module: 'shell' },
];
const receiptParams = () => ({ superAdmin: rnd() < 0.5, isManager: rnd() < 0.5, cloudRoot: rnd() < 0.5, cloudConnected: rnd() < 0.5 });

const mkOrg = () => {
  const memberConfigs = {};
  const n = Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) memberConfigs[pick(emails).trim().toLowerCase() || 'k' + i] = pick(overrides) ?? {};
  return { manager: pick(managers), members: pick(membersLists), memberConfigs };
};
const mkCfg = () => ({ modules: pick(modCfgs), features: pick(featFlags) });

let n = 0;
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

for (let i = 0; i < 400; i++) {
  const orgName = pick(orgNames), taken = pick(takenLists);
  eq(NEW.slugify(orgName, taken), OLD.slugify(orgName, taken), 'slugify');

  const sc = pick(slugCands);
  eq(NEW.isValidSlug(sc), OLD.isValidSlug(sc), 'isValidSlug');

  const born = pick(slugCands) || 'org';
  eq(NEW.allOffConfig(born, orgName), OLD.allOffConfig(born, orgName), 'allOffConfig');
  eq(NEW.orgLink('https://a.co', '/base/', born), OLD.orgLink('https://a.co', '/base/', born), 'orgLink');

  const em = pick(emails);
  eq(NEW.normEmail(em), OLD.normEmail(em), 'normEmail');

  const seed = pick(seeds);
  eq(NEW.genJoinCode(seed), OLD.genJoinCode(seed), 'genJoinCode');
  eq(NEW.orgJoinLink('https://a.co', '/', born, seed), OLD.orgJoinLink('https://a.co', '/', born, seed), 'orgJoinLink');
  eq(NEW.orgJoinFullCode(born, seed), OLD.orgJoinFullCode(born, seed), 'orgJoinFullCode');

  const full = pick(fullCodes);
  eq(NEW.parseJoinFullCode(full), OLD.parseJoinFullCode(full), 'parseJoinFullCode');

  const org = mkOrg(), cfg = mkCfg();
  eq(NEW.isOrgManager(em, org), OLD.isOrgManager(em, org), 'isOrgManager');
  eq(NEW.isMember(em, org), OLD.isMember(em, org), 'isMember');
  eq(NEW.overrideOf(em, org), OLD.overrideOf(em, org), 'overrideOf');
  eq(NEW.orgEnabledModules(cfg), OLD.orgEnabledModules(cfg), 'orgEnabledModules');
  eq(NEW.orgEnabledFeatures(cfg, featRegs), OLD.orgEnabledFeatures(cfg, featRegs), 'orgEnabledFeatures');
  eq(NEW.effectiveConfigFor(em, org, cfg), OLD.effectiveConfigFor(em, org, cfg), 'effectiveConfigFor');
  eq(NEW.allowedDesignationsFor(em, org), OLD.allowedDesignationsFor(em, org), 'allowedDesignationsFor');

  const key = pick(featRegs).key;
  eq(NEW.isGrantableFeature(key), OLD.isGrantableFeature(key), 'isGrantableFeature');

  const rp = receiptParams();
  eq(NEW.canIssueReceipt(rp), OLD.canIssueReceipt(rp), 'canIssueReceipt');

  eq(NEW.approveMember(org, em), OLD.approveMember(org, em), 'approveMember');
  const ov = pick(overrides) ?? {};
  eq(NEW.setEmployeeOverride(org, em, ov), OLD.setEmployeeOverride(org, em, ov), 'setEmployeeOverride');
  eq(NEW.removeMember(org, em), OLD.removeMember(org, em), 'removeMember');
}

// קבועים־מרשם: זהות מוחלטת ישן≡חדש
eq([...NEW.ALL_MODULES], [...OLD.ALL_MODULES], 'ALL_MODULES');
eq(NEW.MODULE_LABELS, OLD.MODULE_LABELS, 'MODULE_LABELS');
eq([...NEW.GRANTABLE_STAFF_FEATURES], [...OLD.GRANTABLE_STAFF_FEATURES], 'GRANTABLE_STAFF_FEATURES');

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-platform: ישן≡חדש על ${n} השוואות (400 סבבים × 22 פונקציות + 3 מרשמים; אפס-סטייה)`);
