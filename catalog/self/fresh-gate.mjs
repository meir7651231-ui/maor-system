#!/usr/bin/env node
/**
 * 🧊 שער השכפול-הטרי (SELF-LOOP, 14.10.2026 — לפי מדידת-המנהל על a57cc9c).
 *
 * החותמות שבריפו (catalog/self/stamps*) תקפות רק אם שכפול טרי — בלי שום מטמון — מחשב אותן בדיוק. מה שנתפס: מטמון
 * שנשמר תחת תג-אלגוריתם ידני ('blank-v3') מגרסה קודמת של האלגוריתם ⇒ אצלי ירוק, אצל המנהל "5 שלבים לא תואמים".
 * השער: worktree מנותק של HEAD (קומיט — לא תיקיית-העבודה) + node_modules בקישור + **מטמון ריק** (CATALOG_CACHE=<תיקייה ריקה>) ⇒
 *   1. `rebuild.mjs --check` ✓ (בלי להריץ שום שלב)
 *   2. `rebuild.mjs` ⇒ `git status --porcelain` ריק (הבנייה לא משנה אף קובץ שבריפו)
 *
 *   node catalog/self/fresh-gate.mjs        # יציאה 1 אם נכשל (~2–3 דק׳)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function freshGate({ rev = 'HEAD', log = console.log } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-gate-'));
  const W = path.join(base, 'w'); const cache = path.join(base, 'cache');
  fs.mkdirSync(cache);
  const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: 'pipe' });
  git('worktree', 'add', '--detach', W, rev);
  try {
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(W, 'node_modules'));
    const env = { ...process.env, CATALOG_CACHE: cache };
    const run = (...a) => spawnSync(process.execPath, [path.join(W, a[0]), ...a.slice(1)], { cwd: W, env, encoding: 'utf8', maxBuffer: 1 << 28 });
    const chk = run('catalog/scripts/rebuild.mjs', '--check');
    const checkOk = chk.status === 0;
    log((checkOk ? '✓' : '✗') + ' שכפול טרי + מטמון ריק: rebuild --check' + (checkOk ? '' : '\n' + String(chk.stdout + chk.stderr).trim().split('\n').slice(-8).join('\n')));
    const rb = run('catalog/scripts/rebuild.mjs');
    const dirty = rb.status === 0 ? execFileSync('git', ['-C', W, 'status', '--porcelain', '--', '.', ':!node_modules'], { encoding: 'utf8' }).trim() : 'rebuild נכשל: ' + String(rb.stderr).slice(-400);
    log((dirty ? '✗' : '✓') + ' rebuild בשכפול הטרי ⇒ git status ' + (dirty ? 'לא נקי:\n' + dirty.split('\n').slice(0, 10).join('\n') : 'נקי'));
    return { ok: checkOk && !dirty, checkOk, dirty };
  } finally {
    try { git('worktree', 'remove', '--force', W); } catch { /* */ }
    fs.rmSync(base, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (!freshGate().ok) process.exit(1);
}
