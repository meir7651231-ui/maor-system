#!/usr/bin/env node
/**
 * 🔓 פותח-הפונקציות (INNER, 14.10.2026) — כותב:
 *   catalog/inner/gen/<source>/<path>.mjs      — מודול טהור לכל קובץ-מקור: הערכים-בדרך כפונקציות עומדות-בפני-עצמן (+ SIGS)
 *   catalog/sources/inner-<source>.json          — החלקים הפנימיים בפורמט Part (what: "inner", parent, origins)
 *   catalog/inner/open-<source>.json             — מונים: מועמדים · נחתכו · למה דולגו (לפי סיבה)
 *
 *   node catalog/inner/scripts/open.mjs                    # כל המקורות שיש להם שכפול
 *   node catalog/inner/scripts/open.mjs --source orbit     # רק אורביט (לא צריך שכפולים)
 *   node catalog/inner/scripts/open.mjs --check            # יציאה 1 אם משהו לא מעודכן (מקור בלי שכפול — מדולג, נאמר)
 *   --src <dir>  שכפולי-הקריאה (ברירת-מחדל: $CATALOG_SRC או ../catsrc)
 * דטרמיניסטי: אותו קוד ⇒ אותם קבצים, ביט-אחר-ביט. לא מריץ שום קוד של חלק.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSource } from '../lib/build.mjs';
import { ORDER, REPOS } from '../lib/repos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CHECK = args.includes('--check');
const SRC = path.resolve(ROOT, opt('--src', process.env.CATALOG_SRC || '../catsrc'));
const want = opt('--source', '') ? opt('--source', '').split(',') : ORDER;

let stale = 0;
for (const source of want) {
  if (!REPOS[source]) { console.error('מקור לא מוכר: ' + source); process.exit(2); }
  const t0 = Date.now();
  const res = buildSource(ROOT, SRC, source);
  if (res.missing) { console.log(`· ${source}: ${res.missing} — מדולג`); continue; }
  const files = res.files; // {rel: text}
  // קבצי-gen שכבר לא נוצרים ⇒ נמחקים (או: לא מעודכן)
  const genDir = path.join(ROOT, 'catalog/inner/gen', source);
  const existing = [];
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else existing.push(path.relative(ROOT, p).split(path.sep).join('/')); } };
  walk(genDir);
  for (const rel of existing) if (!(rel in files)) {
    if (CHECK) { console.error('✗ מיותר: ' + rel); stale++; } else fs.rmSync(path.join(ROOT, rel));
  }
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(ROOT, rel);
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (cur === text) continue;
    if (CHECK) { console.error('✗ לא מעודכן: ' + rel + ' — הרץ: node catalog/inner/scripts/open.mjs --source ' + source); stale++; continue; }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  const s = res.stats;
  console.log(`${CHECK ? '✓' : '✎'} ${source}: ${s.files} קבצים · ${s.candidates} ערכים-בדרך · ${s.sliced} נחתכו (${s.parts} חלקים, ${s.modules} מודולים) · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
if (CHECK && stale) process.exit(1);
