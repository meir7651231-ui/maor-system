#!/usr/bin/env node
/**
 * 🔓 פותח-הפונקציות (INNER, 14.10.2026; v2 — מחסן דחוס + מודולים לפי דרישה) — כותב:
 *   בריפו:
 *     catalog/inner/store/parts-<source>.json   — החלקים הפנימיים, דחוס (lib/store.mjs), שורה לכל חלק
 *     catalog/inner/open-<source>.json           — מונים: מועמדים · נחתכו · למה דולגו (לפי סיבה)
 *     catalog/inner/gen.manifest.json            — קובץ-מקור ⇒ חתימת המודול שנוצר ממנו
 *     catalog/inner/pack/<source>.json.br        — לריפואים החיצוניים בלבד: המודולים, דחוסים (אין שכפולים ב-CI)
 *   מחוץ לריפו (gitignored — אותם נתיבים כמו קודם, ensure-gen משחזר אותם לכל צרכן):
 *     catalog/inner/gen/<source>/<path>.mjs      — מודול טהור לכל קובץ-מקור (+ SIGS)
 *     catalog/sources/inner-<source>.json        — קובץ-ה-Part הפרוש (ביט-זהה לפורמט הקודם)
 *
 *   node catalog/inner/scripts/open.mjs                    # כל המקורות שיש להם שכפול
 *   node catalog/inner/scripts/open.mjs --source orbit     # רק אורביט (לא צריך שכפולים)
 *   node catalog/inner/scripts/open.mjs --check            # יציאה 1 אם משהו בריפו לא מעודכן (מקור בלי שכפול — נבדקת
 *                                                          #   רק התאמת החבילה למניפסט, ונאמר)
 *   --src <dir>  שכפולי-הקריאה (ברירת-מחדל: $CATALOG_SRC או ../catsrc)
 * דטרמיניסטי: אותו קוד ⇒ אותם קבצים, ביט-אחר-ביט. לא מריץ שום קוד של חלק.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSource } from '../lib/build.mjs';
import { ORDER, REPOS } from '../lib/repos.mjs';
import { MANIFEST, genDir, packPath, hashOf, manifestEntry, packOf, packBytes, readPack, readManifest, manifestText, listFiles } from '../lib/ensure-gen.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CHECK = args.includes('--check');
const SRC = path.resolve(ROOT, opt('--src', process.env.CATALOG_SRC || '../catsrc'));
const want = opt('--source', '') ? opt('--source', '').split(',') : ORDER;
const read = (rel) => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { return null; } };
const write = (rel, text) => { const abs = path.join(ROOT, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); };

const man = readManifest(ROOT);
man.version = 1;
man.note = 'נוצר ע"י catalog/inner/scripts/open.mjs — קובץ-מקור ⇒ sha256(16) של catalog/inner/gen/<source>/<path>.mjs. המודולים לא בריפו: node catalog/inner/lib/ensure-gen.mjs';
let stale = 0;
const bad = (m) => { console.error('✗ ' + m); stale++; };
for (const source of want) {
  if (!REPOS[source]) { console.error('מקור לא מוכר: ' + source); process.exit(2); }
  const R = REPOS[source];
  const t0 = Date.now();
  const res = buildSource(ROOT, SRC, source);
  if (res.missing) {
    console.log(`· ${source}: ${res.missing} — מדולג`);
    // בלי שכפול: לפחות החבילה תואמת למניפסט
    const e = man.sources[source];
    if (CHECK && e && e.pack) {
      const json = readPack(ROOT, source);
      if (!json) bad(packPath(source) + ' חסרה');
      else {
        const files = JSON.parse(json);
        const ks = [...new Set([...Object.keys(files), ...Object.keys(e.files)])];
        const off = ks.filter((k) => files[k] === undefined || hashOf(files[k]) !== e.files[k]);
        if (off.length) bad(`${packPath(source)} לא תואמת ל-${MANIFEST} (${off.length} קבצים)`);
      }
    }
    continue;
  }
  const gen = {}; const repo = {};
  for (const [rel, text] of Object.entries(res.files)) {
    if (rel.startsWith(genDir(source) + '/')) gen[rel] = text;
    else if (rel.startsWith('catalog/sources/inner-')) { if (!CHECK) { if (read(rel) !== text) write(rel, text); } }
    else repo[rel] = text;
  }
  // בריפו: המחסן + המונים
  for (const [rel, text] of Object.entries(repo)) {
    if (read(rel) === text) continue;
    if (CHECK) { bad('לא מעודכן: ' + rel + ' — הרץ: node catalog/inner/scripts/open.mjs --source ' + source); continue; }
    write(rel, text);
  }
  // המניפסט + החבילה
  const entry = { from: R.dir ? 'pack' : 'repo', ...(R.dir ? { pack: packPath(source) } : {}), files: manifestEntry(source, gen) };
  if (JSON.stringify(man.sources[source]) !== JSON.stringify(entry)) {
    if (CHECK) bad(`${MANIFEST} לא מעודכן (${source}) — הרץ: node catalog/inner/scripts/open.mjs --source ${source}`);
    man.sources[source] = entry;
  }
  if (R.dir) {
    const json = packOf(source, gen);
    if (readPack(ROOT, source) !== json) {
      if (CHECK) bad(`${packPath(source)} לא מעודכנת — הרץ: node catalog/inner/scripts/open.mjs --source ${source}`);
      else { fs.mkdirSync(path.dirname(path.join(ROOT, packPath(source))), { recursive: true }); fs.writeFileSync(path.join(ROOT, packPath(source)), packBytes(json)); }
    }
  }
  // המודולים עצמם (gitignored): נכתבים, ומה שכבר לא נוצר — נמחק
  if (!CHECK) {
    for (const rel of listFiles(ROOT, genDir(source))) if (!(rel in gen)) fs.rmSync(path.join(ROOT, rel));
    for (const [rel, text] of Object.entries(gen)) if (read(rel) !== text) write(rel, text);
  }
  const s = res.stats;
  console.log(`${CHECK ? '✓' : '✎'} ${source}: ${s.files} קבצים · ${s.candidates} ערכים-בדרך · ${s.sliced} נחתכו (${s.parts} חלקים, ${s.modules} מודולים) · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
if (!CHECK && read(MANIFEST) !== manifestText(man)) write(MANIFEST, manifestText(man));
if (CHECK && read(MANIFEST) !== manifestText(man)) bad(`${MANIFEST} לא בפורמט הקנוני — הרץ: node catalog/inner/scripts/open.mjs`);
if (CHECK && stale) process.exit(1);
