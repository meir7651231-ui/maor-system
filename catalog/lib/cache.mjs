/**
 * ⚡ מטמון-התוצאות של המכונה (SELF, 14.10.2026) — המכונה מאיצה את עצמה עם הפעלים שלה:
 *   · «מטביע חותם» — מפתח = טביעת-תוכן (sha256) של מה שבאמת רץ: הקוד, הקלט, הזרע, ו**המלח** = טביעת הקוד של המכונה עצמה
 *     (כל שינוי בחוקים/במחולל/בארגז-החול ⇒ מלח אחר ⇒ שום תוצאה ישנה לא נשלפת).
 *   · «מקבץ» + «מחפש לפי מפתח» — קובץ לכל מפתח בתיקייה מחוץ לריפו (node_modules/.cache/catalog-<מרחב>/<2 תווים>/<מפתח>.json).
 * רק תוצאות של פונקציות טהורות-ודטרמיניסטיות נשמרות — לכן שליפה = אותם בייטים כמו הרצה (נבדק: self.test › דטרמיניזם).
 * CATALOG_CACHE=off מכבה; CATALOG_CACHE=<תיקייה> מעביר.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CACHE_OFF = process.env.CATALOG_CACHE === 'off';
const BASE = process.env.CATALOG_CACHE && !CACHE_OFF ? path.resolve(process.env.CATALOG_CACHE) : path.join(ROOT, 'node_modules/.cache');

/** טביעת-תוכן: sha256 ⇒ 32 תווי-הקס. מקבל מחרוזות/Buffer (גם כמה — מופרדים, כך ש-('ab','c') ≠ ('a','bc')). */
export function fingerprint(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) { const b = typeof p === 'string' ? Buffer.from(p) : p; h.update(String(b.length) + ':'); h.update(b); }
  return h.digest('hex').slice(0, 32);
}

const dirOf = (ns) => path.join(BASE, 'catalog-' + ns);
const fileOf = (ns, key) => path.join(dirOf(ns), key.slice(0, 2), key + '.json');

/** שליפה: הערך שנשמר, או undefined. קובץ פגום ⇒ undefined (סובל כשל — לא זורק). */
export function cacheGet(ns, key) {
  if (CACHE_OFF) return undefined;
  try { return JSON.parse(fs.readFileSync(fileOf(ns, key), 'utf8')); } catch { return undefined; }
}
/** שמירה (כתיבה אטומית: קובץ-זמני ⇒ rename — עובדים במקביל לא קוראים חצי-קובץ). */
export function cachePut(ns, key, value) {
  if (CACHE_OFF) return;
  const f = fileOf(ns, key);
  try {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const tmp = f + '.' + process.pid + '.' + Math.random().toString(36).slice(2) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(value));
    fs.renameSync(tmp, f);
  } catch { /* מטמון הוא רק האצה */ }
}

/** כל הקבצים תחת תיקיות (יחסיים לשורש, ממוינים), לפי סיומת. */
export function filesUnder(dirs, re = /\.(mjs|js|ts|json)$/) {
  const out = [];
  const walk = (rel) => {
    let es; try { es = fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) { if (e.name !== 'gen' && e.name !== 'node_modules') walk(r); } else if (re.test(e.name)) out.push(r);
    }
  };
  for (const d of dirs) walk(d);
  return [...new Set(out)].sort();
}

let saltMemo = null;
/**
 * המלח: טביעת הקוד של המכונה — כל מה שקובע איך חלק נפתח/מורץ/נבדק: catalog/lib · catalog/core · catalog/inner/lib ·
 * catalog/self/parts.mjs · catalog/combiner (קוד) · המחולל, החוקים והחלקים של המאמת (src/lib/atoms/verify|parts — דרך הגשר) ·
 * גרסאות node / typescript / rolldown.
 */
export function machineSalt() {
  if (saltMemo) return saltMemo;
  const files = [...filesUnder(['catalog/lib', 'catalog/core', 'catalog/inner/lib', 'catalog/combiner', 'src/lib/atoms/verify', 'src/lib/atoms/parts'], /\.(mjs|ts)$/), 'catalog/self/parts.mjs'];
  const ver = (pkg) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version; } catch { return '?'; } };
  saltMemo = fingerprint(process.version, ver('typescript'), ver('rolldown'), ...files.flatMap((f) => [f, fs.readFileSync(path.join(ROOT, f))]));
  return saltMemo;
}

/**
 * מטמון לפי תלויות (כמו כלי-בנייה): מזהה-העבודה ⇒ {deps: [[קובץ, טביעה]…], value}. שליפה רק כשכל קובץ שנארז בפעם
 * הקודמת עדיין עם אותה טביעה — כך לא צריך לארוז שוב כדי לדעת שכלום לא השתנה.
 */
export function stampDeps(files) {
  return files.map((f) => { try { return [f, fingerprint(fs.readFileSync(f))]; } catch { return [f, '!']; } });
}
export function cacheGetFresh(ns, idKey) {
  const e = cacheGet(ns, idKey);
  if (!e || !Array.isArray(e.deps) || !e.deps.length) return undefined;
  for (const [f, h] of e.deps) { let cur; try { cur = fingerprint(fs.readFileSync(f)); } catch { cur = '!'; } if (cur !== h) return undefined; }
  return e.value;
}
export function cachePutDeps(ns, idKey, files, value) {
  if (files.length) cachePut(ns, idKey, { deps: stampDeps(files), value });
}

/** טביעה אחת לרשימת-קבצים (התוכן הנוכחי של כל אחד). קובץ חסר ⇒ '!'. */
export function stampOf(files) {
  return fingerprint(...files.flatMap((f) => { let b; try { b = fs.readFileSync(f); } catch { b = '!'; } return [f, b]; }));
}

/**
 * טביעה של "כל מה ששלב קורא": catalog/ (בלי gen ובלי catalog/self — שם רק דוחות; בלי הפלטים של השלב עצמו),
 * src/lib/atoms (הגשר), ותיקיות נוספות (למשל קוד אורביט שהשלב מריץ). + המלח. הפלטים של שלבים קודמים הם קלט — כמו שצריך.
 */
export function inputsKey(tag, { isOutput = () => false, dirs = [] } = {}) {
  const files = filesUnder(['catalog', 'src/lib/atoms', ...dirs], /\.(mjs|js|cjs|ts|tsx|json|md|html|br)$/)
    .filter((f) => !isOutput(f) && (!f.startsWith('catalog/self/') || f === 'catalog/self/parts.mjs' || f === 'catalog/self/roles.mjs'));
  return fingerprint(machineSalt(), tag, ...files.flatMap((f) => [f, fs.readFileSync(path.join(ROOT, f))]));
}
