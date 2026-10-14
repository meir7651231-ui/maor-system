#!/usr/bin/env node
/**
 * 🧰 פותח-הפונקציות · נקודת-הכניסה היחידה לקבצים הנוצרים (INNER v2, 14.10.2026).
 *
 * מה **לא** בריפו (gitignored) ונוצר כאן לפי דרישה, באותו מקום בדיוק כמו קודם:
 *   catalog/inner/gen/<source>/<path>.mjs   — המודולים הטהורים (כ-1,200 קבצים, ~19MB)
 *   catalog/sources/inner-<source>.json     — קובצי-ה-Part הפרושים (החוזה הרגיל, schema.json)
 *   catalog/behavior/inner-<source>.json    — קובצי-ההתנהגות הפרושים
 * מה **כן** בריפו, ומשמש מקור:
 *   catalog/inner/store/parts-<source>.json · behavior-<source>.json — המחסן הדחוס (lib/store.mjs), שורה לכל חלק
 *   catalog/inner/gen.manifest.json         — קובץ-מקור ⇒ חתימת-התוכן (sha256, 16 תווים) של המודול שנוצר ממנו
 *   catalog/inner/pack/<source>.json.br     — רק לריפואים החיצוניים: המודולים דחוסים (brotli). בלי השכפולים ב-../catsrc
 *                                             אי-אפשר ליצור אותם מחדש — ולכן ה-CI ושאר הסשנים מקבלים אותם מכאן, ונבדקים מול
 *                                             החתימות. אורביט = הריפו הזה ⇒ נוצר מחדש מהקוד (buildSource), בלי חבילה.
 *
 * כל צרכן קורא ל-ensureGen() לפני שהוא נוגע בקבצים: prove · lift · sun-demo · catalog-build · goals-coverage ·
 * הבדיקות (globalSetup) · המצרף (combine.mjs / build.mjs — קריאה אחת בראש). מהיר כשהכול מעודכן (השוואת-חתימות בלבד).
 *
 *   node catalog/inner/lib/ensure-gen.mjs            # יוצר/מתקן את מה שחסר
 *   node catalog/inner/lib/ensure-gen.mjs --check    # יציאה 1 אם המודולים שנוצרים לא תואמים לחתימות (או חבילה פגומה)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ORDER, REPOS } from './repos.mjs';
import { unpackParts, unpackBehavior, docText } from './store.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const MANIFEST = 'catalog/inner/gen.manifest.json';
export const storePath = (kind, source) => `catalog/inner/store/${kind}-${source}.json`;
export const packPath = (source) => `catalog/inner/pack/${source}.json.br`;
export const genDir = (source) => `catalog/inner/gen/${source}`;
export const genPath = (source, rel) => `catalog/inner/gen/${source}/${rel}.mjs`;
export const hashOf = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

const read = (root, rel) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; } };
const write = (root, rel, text) => { const abs = path.join(root, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); };
/** כל הקבצים בתיקייה (יחסיים לשורש, ממוינים). */
export function listFiles(root, rel) {
  const out = [];
  const walk = (d) => { let es; try { es = fs.readdirSync(path.join(root, d), { withFileTypes: true }); } catch { return; } for (const e of es) { const p = d + '/' + e.name; if (e.isDirectory()) walk(p); else out.push(p); } };
  walk(rel);
  return out.sort();
}

/* ═══════════════ חבילה + חתימות ═══════════════ */

/** {genRel: text} של מקור אחד ⇒ רשומת-המניפסט (קובץ-מקור ⇒ חתימה), ממוינת. */
export function manifestEntry(source, gen) {
  const pre = genDir(source) + '/';
  const files = {};
  for (const rel of Object.keys(gen).sort()) files[rel.slice(pre.length, -'.mjs'.length)] = hashOf(gen[rel]);
  return files;
}
/** חבילה: JSON ממוין {קובץ-מקור: טקסט} ⇒ brotli. ההשוואה תמיד על התוכן הפרוש (בייטים דחוסים תלויים בגרסת-brotli). */
export function packOf(source, gen) {
  const pre = genDir(source) + '/';
  const obj = {};
  for (const rel of Object.keys(gen).sort()) obj[rel.slice(pre.length, -'.mjs'.length)] = gen[rel];
  return JSON.stringify(obj);
}
export const packBytes = (json) => zlib.brotliCompressSync(Buffer.from(json), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_LGWIN]: 24, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: json.length } });
export function readPack(root, source) {
  try { return zlib.brotliDecompressSync(fs.readFileSync(path.join(root, packPath(source)))).toString('utf8'); } catch { return null; }
}
export function readManifest(root = ROOT) {
  const t = read(root, MANIFEST);
  return t ? JSON.parse(t) : { version: 1, sources: {} };
}
export const manifestText = (m) => {
  const srcs = Object.keys(m.sources).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const body = srcs.map((s) => {
    const { files, ...head } = m.sources[s];
    const fl = Object.entries(files).map(([k, v]) => `   ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
    return ` ${JSON.stringify(s)}: {\n${Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')}\n  "files": {\n${fl}\n  }\n }`;
  });
  return `{\n "version": ${m.version},\n "note": ${JSON.stringify(m.note ?? '')},\n "sources": {\n${body.join(',\n')}\n }\n}\n`;
};

/* ═══════════════ ensureGen ═══════════════ */

/**
 * מוודא שהקבצים הנוצרים קיימים ותואמים: פרישת המחסן ⇒ sources/behavior; המודולים ⇒ לפי המניפסט (חבילה / יצירה מחדש).
 * opts: { root, src (שכפולים — לא נדרש), sources: [...], check: רק לבדוק, quiet, log }
 * מחזיר { wrote, regenerated: [source], stale: [{source, file, why}] }.
 */
export async function ensureGen(opts = {}) {
  const root = opts.root ?? ROOT;
  const want = opts.sources ?? ORDER;
  const log = opts.quiet ? () => {} : opts.log ?? ((m) => console.error(m));
  const man = readManifest(root);
  const out = { wrote: 0, regenerated: [], stale: [] };
  const put = (rel, text) => { if (read(root, rel) === text) return; if (opts.check) { out.stale.push({ file: rel, why: 'expanded' }); return; } write(root, rel, text); out.wrote++; };
  for (const source of want) {
    const pt = read(root, storePath('parts', source));
    if (!pt) continue;
    const doc = unpackParts(JSON.parse(pt));
    put(`catalog/sources/inner-${source}.json`, docText(doc));
    const bt = read(root, storePath('behavior', source));
    if (bt) put(`catalog/behavior/inner-${source}.json`, docText(unpackBehavior(JSON.parse(bt), doc.parts.map((p) => p.id))));
    const entry = man.sources[source];
    if (!entry) continue;
    // מודולים: מה שכבר על הדיסק ותואם — נשאר
    const want = new Map(Object.entries(entry.files).map(([k, h]) => [genPath(source, k), h]));
    const have = listFiles(root, genDir(source));
    const bad = [...want].filter(([rel, h]) => { const t = read(root, rel); return t === null || hashOf(t) !== h; });
    const extra = have.filter((rel) => !want.has(rel));
    if (!bad.length && !extra.length) continue;
    if (opts.check) { for (const [rel] of bad) out.stale.push({ source, file: rel, why: 'gen' }); continue; }
    for (const rel of extra) fs.rmSync(path.join(root, rel));
    if (!bad.length) continue;
    if (entry.pack) {
      const json = readPack(root, source);
      if (!json) throw new Error(`ensure-gen: חבילה חסרה/פגומה — ${packPath(source)}`);
      const files = JSON.parse(json);
      for (const [rel] of bad) {
        const k = rel.slice(genDir(source).length + 1, -'.mjs'.length);
        const t = files[k];
        if (t === undefined || hashOf(t) !== want.get(rel)) throw new Error(`ensure-gen: ${packPath(source)} לא תואם ל-${MANIFEST} (${k}) — הרץ node catalog/inner/scripts/open.mjs --source ${source}`);
        write(root, rel, t); out.wrote++;
      }
      log(`🧰 ensure-gen: ${source} — ${bad.length} מודולים מהחבילה`);
    } else {
      // אורביט: נוצר מחדש מהקוד של הריפו (אותו buildSource של open.mjs)
      const t0 = Date.now();
      const { buildSource } = await import('./build.mjs');
      const res = buildSource(root, opts.src ?? '', source);
      if (res.missing) throw new Error(`ensure-gen: ${source} — ${res.missing}`);
      const gen = Object.fromEntries(Object.entries(res.files).filter(([rel]) => rel.startsWith(genDir(source) + '/')));
      for (const [rel, t] of Object.entries(gen)) { if (read(root, rel) !== t) { write(root, rel, t); out.wrote++; } }
      for (const rel of listFiles(root, genDir(source))) if (!(rel in gen)) fs.rmSync(path.join(root, rel));
      const got = manifestEntry(source, gen);
      const diff = [...new Set([...Object.keys(got), ...Object.keys(entry.files)])].filter((k) => got[k] !== entry.files[k]);
      for (const k of diff) out.stale.push({ source, file: genPath(source, k), why: 'code-changed' });
      out.regenerated.push(source);
      log(`🧰 ensure-gen: ${source} — נוצר מחדש מהקוד (${((Date.now() - t0) / 1000).toFixed(1)}s)${diff.length ? ` · ⚠️ ${diff.length} מודולים שונים מהמניפסט — הקוד השתנה; הרץ node catalog/inner/scripts/open.mjs --source ${source}` : ''}`);
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const check = process.argv.includes('--check');
  const r = await ensureGen({ check });
  if (check && r.stale.length) {
    for (const s of r.stale.slice(0, 20)) console.error(`✗ ${s.file} (${s.why})`);
    console.error(`✗ ${r.stale.length} קבצים נוצרים לא תואמים — הרץ: node catalog/inner/lib/ensure-gen.mjs`);
    process.exit(1);
  }
  console.log(check ? '✓ הקבצים הנוצרים תואמים' : `✓ ensure-gen: ${r.wrote} קבצים נכתבו${r.regenerated.length ? ' · נוצר מחדש: ' + r.regenerated.join(', ') : ''}${r.stale.length ? ` · ⚠️ ${r.stale.length} שונים מהמניפסט` : ''}`);
}
