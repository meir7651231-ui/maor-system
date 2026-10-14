#!/usr/bin/env node
/**
 * ⚡ בונה-מחדש (SELF, 14.10.2026) — כל צינור-הקטלוג שאפשר לשחזר בריפו הזה (בלי ../catsrc), בפקודה אחת, ומהר:
 * המכונה מאיצה את עצמה עם הפעלים שלה —
 *   · «מטביע חותם» — לכל שלב: טביעה של הקוד של המכונה (המלח), של הסקריפט, של הארגומנטים ושל כל הקלטים שלו.
 *   · «מקבץ» + «מחפש לפי מפתח» — אותה טביעה ⇒ הפלטים נשלפים מהמטמון (node_modules/.cache/catalog-stage), בלי להריץ.
 *   · בתוך השלבים הכבדים — מטמון לפי חלק/מודול (הקורא, המוכיח, הפותח: lib/cache.mjs), «מחלק»/«בתורות» = העובדים
 *     שכבר היו (os.availableParallelism), ו«מקצב» = מטמון-transpile שנטען ונשמר פעם אחת לריצה.
 * הפלטים ביט-זהים לריצה בלי מטמון (CATALOG_CACHE=off) — נבדק ב-self.test ובכל ה-`--check`.
 *
 *   node catalog/scripts/rebuild.mjs            # בונה (מדלג על שלבים שלא השתנו)
 *   node catalog/scripts/rebuild.mjs --times    # + טבלת-זמנים
 *   CATALOG_CACHE=off node catalog/scripts/rebuild.mjs   # בלי שום מטמון (= הצינור הישן, צעד-צעד)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fingerprint, machineSalt, cacheGet, cachePut, filesUnder, CACHE_OFF } from '../lib/cache.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TIMES = process.argv.includes('--times');
const ORBIT_ROOTS = ['src', 'telephony', 'functions'];

/**
 * השלבים, בסדר. `in` = מה עוד (מעבר ל-catalog/ כולו, בלי הפלטים של השלב עצמו) קובע את הפלט; `out` = קבצים או
 * תיקיות-פלט; `always` = רץ תמיד (כבר מהיר מבפנים / מתקן קבצים gitignored).
 */
export const STAGES = [
  { name: 'ensure-gen', run: ['catalog/inner/lib/ensure-gen.mjs'], always: true },
  { name: 'orbit-census', run: ['catalog/scripts/orbit-census.mjs'], in: ORBIT_ROOTS, git: true, out: ['catalog/sources/orbit.json'] },
  { name: 'core-census', run: ['catalog/scripts/core-census.mjs'], git: true, out: ['catalog/sources/core.json'] },
  { name: 'core-b-census', run: ['catalog/scripts/core-b-census.mjs'], out: ['catalog/sources/core-b.json'] },
  { name: 'core-c-census', run: ['catalog/scripts/core-c-census.mjs'], out: ['catalog/sources/core-c.json'] },
  { name: 'open-orbit', run: ['catalog/inner/scripts/open.mjs', '--source', 'orbit'], always: true },
  { name: 'probe-orbit', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'orbit'], in: ORBIT_ROOTS, out: ['catalog/behavior/orbit.json'] },
  { name: 'probe-core', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core'], out: ['catalog/behavior/core.json'] },
  { name: 'probe-core-b', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-b'], out: ['catalog/behavior/core-b.json'] },
  { name: 'probe-core-c', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-c'], out: ['catalog/behavior/core-c.json'] },
  { name: 'prove-orbit', run: ['catalog/inner/scripts/prove.mjs', '--source', 'orbit'], in: ORBIT_ROOTS, out: ['catalog/inner/store/behavior-orbit.json', 'catalog/behavior/inner-orbit.json'] },
  { name: 'lift', run: ['catalog/inner/scripts/lift.mjs'], out: ['catalog/inner/lift.json'] },
  { name: 'catalog-build', run: ['catalog/scripts/catalog-build.mjs'], out: ['catalog/index.json', 'catalog/verbs.json', 'catalog/verbs.md', 'catalog/alphabet.md'] },
  { name: 'goals-coverage', run: ['catalog/scripts/goals-coverage.mjs'], out: ['catalog/goals/coverage.json', 'catalog/goals/coverage.md'] },
  { name: 'core-demo', run: ['catalog/scripts/core-demo.mjs'], out: ['catalog/core/demo.html'] },
  { name: 'combiner-prove', run: ['catalog/combiner/prove.mjs'], out: ['catalog/combiner/proofs.json'] },
  { name: 'combine', run: ['catalog/combiner/combine.mjs'], out: ['catalog/combiner/combos.json', 'catalog/recipes/combo-'] },
  { name: 'build', run: ['catalog/combiner/build.mjs'], out: ['catalog/combiner/lab-data.json', 'catalog/combiner/dig/'] },
  { name: 'self-check', run: ['catalog/scripts/self-check.mjs'], out: ['catalog/self/machine.json', 'catalog/self/behavior-machine.json', 'catalog/self/report.json'] },
];

/** קבצי-פלט קיימים של שלב (קובץ מדויק, או קידומת — תיקייה/תחילית-שם). */
function outFiles(stage) {
  const out = [];
  for (const o of stage.out ?? []) {
    if (fs.existsSync(path.join(ROOT, o)) && fs.statSync(path.join(ROOT, o)).isFile()) { out.push(o); continue; }
    const dir = o.endsWith('/') ? o.slice(0, -1) : path.posix.dirname(o);
    const pre = o.endsWith('/') ? '' : path.posix.basename(o);
    let es = []; try { es = fs.readdirSync(path.join(ROOT, dir)); } catch { /* */ }
    for (const f of es.sort()) if (f.startsWith(pre) && fs.statSync(path.join(ROOT, dir, f)).isFile()) out.push(dir + '/' + f);
  }
  return out;
}
const isOut = (stage, rel) => (stage.out ?? []).some((o) => rel === o || (o.endsWith('/') ? rel.startsWith(o) : rel.startsWith(o) && path.posix.dirname(rel) === path.posix.dirname(o)));

/** הטביעה של כל קלט: catalog/ (בלי gen, בלי הפלטים של השלב) + src/lib/atoms (הגשר) + `in` + ref של git כשצריך. */
function stageKey(stage) {
  const files = filesUnder(['catalog', 'src/lib/atoms', ...(stage.in ?? [])], /\.(mjs|js|cjs|ts|tsx|json|md|html|br)$/).filter((f) => !isOut(stage, f) && (!f.startsWith('catalog/self/') || f === 'catalog/self/parts.mjs' || f === 'catalog/self/roles.mjs'));
  const git = stage.git ? execFileSync('git', ['-C', ROOT, 'rev-parse', '--abbrev-ref', 'HEAD', 'HEAD'], { encoding: 'utf8' }) : '';
  return fingerprint(machineSalt(), 'stage-v1', stage.name, JSON.stringify(stage.run), git, process.env.CATALOG_SRC ?? '', ...files.flatMap((f) => [f, fs.readFileSync(path.join(ROOT, f))]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const rows = [];
  const t00 = Date.now();
  for (const stage of STAGES) {
    const t0 = Date.now();
    let how = 'run';
    const key = !CACHE_OFF && !stage.always ? stageKey(stage) : null;
    const hit = key && cacheGet('stage', key);
    if (hit) {
      // הפלטים מהמטמון: כל קובץ שונה נכתב; קובץ-פלט שלא היה אז — נמחק (כמו שהשלב עצמו היה עושה)
      const want = new Map(hit.files);
      for (const rel of outFiles(stage)) if (!want.has(rel)) fs.rmSync(path.join(ROOT, rel));
      let wrote = 0;
      for (const [rel, blob] of want) {
        const text = cacheGet('blob', blob);
        if (text === undefined) { how = 'run'; break; }
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); wrote++; }
        how = wrote ? 'cache (' + wrote + ' נכתבו)' : 'cache';
      }
      if (!want.size) how = 'cache';
    }
    if (how === 'run') {
      execFileSync(process.execPath, stage.run.map((a, k) => (k === 0 ? path.join(ROOT, a) : a)), { cwd: ROOT, stdio: TIMES ? 'pipe' : 'inherit' });
      if (key) {
        const files = outFiles(stage).map((rel) => { const text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); const b = fingerprint(text); cachePut('blob', b, text); return [rel, b]; });
        cachePut('stage', key, { files });
      }
    }
    rows.push([stage.name, how, (Date.now() - t0) / 1000]);
  }
  if (TIMES) {
    for (const [n, h, s] of rows) console.log(`  ${n.padEnd(16)} ${h.padEnd(22)} ${s.toFixed(1).padStart(6)}s`);
    console.log(`  ${'סה"כ'.padEnd(16)} ${''.padEnd(22)} ${((Date.now() - t00) / 1000).toFixed(1).padStart(6)}s`);
  }
}
