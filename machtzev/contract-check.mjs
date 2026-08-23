#!/usr/bin/env node
/** מחצב · משוואה 5 — חוק-החוזה: לכל אטום/קופסה יש contract.md + test.mjs ירוק. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const NEW = new URL('./new/', import.meta.url).pathname;
if (!fs.existsSync(NEW)) { console.log('✓ חוק-החוזה: העץ החדש טרם קיים'); process.exit(0); }
let fail = 0, tested = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const f = path.join(d, e.name);
  if (e.isDirectory()) { walk(f); continue; }
  if (!/\.mjs$/.test(e.name) || /\.test\.mjs$/.test(e.name)) continue;
  const base = f.replace(/\.mjs$/, '');
  const contract = base + '.contract.md', test = base + '.test.mjs';
  const rel = path.relative(NEW, f);
  if (!fs.existsSync(contract) || fs.readFileSync(contract, 'utf8').length < 100)
    { console.error(`🚨 חוט בלי חוזה: ${rel}`); fail = 1; continue; }
  if (!fs.existsSync(test)) { console.error(`🚨 חוט בלי בדיקה: ${rel}`); fail = 1; continue; }
  try { execFileSync('node', [test], { stdio: 'pipe' }); tested++; }
  catch (e) { console.error(`🚨 בדיקה אדומה: ${rel}\n${(e.stdout||'')+(e.stderr||'')}`.trim()); fail = 1; }
} })(NEW);
fail ? process.exit(1) : console.log(`✓ חוק-החוזה: ${tested} אטומים — לכולם חוזה + בדיקה ירוקה`);
