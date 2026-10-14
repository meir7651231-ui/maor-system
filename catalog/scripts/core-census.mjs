#!/usr/bin/env node
/**
 * 🌀 מפקד-הליבה (MINED-VERBS, 14.10.2026) — כותב catalog/sources/core.json מתוך catalog/core/*.mjs + origins.json.
 *
 * כל פועל-זמן/תנועה שנכרה מהקוד שלנו = חלק אחד: לבנה טהורה (`what: brick`, `pure: true`) בלי עולם.
 * החוזה (catalog/schema.json) לא מכיר שדה `origins`, ולכן המקורות נכנסים ל-`tags` (חופשי לפי החוזה):
 *   origin:<source>:<file>:<line>  — כל מקום שבו הפעולה נמצאה (הראשון = best, המימוש שממנו חולצה הליבה)
 *   twin:<part-id>                 — החלק בקטלוג שהליבה היא ה"תאום בלי עולם" שלו
 *   verb:<id> · combination:<a>+<b> — הפועל; ופועל שנמצא כשילוב של שתי ליבות — "נמצא כשילוב"
 * הרשימה המלאה (מה זה עושה בעולם שלו, המתמטיקה, וריאנטים) — catalog/core/origins.json.
 *
 *   node catalog/scripts/core-census.mjs           # כותב
 *   node catalog/scripts/core-census.mjs --check   # יציאה 1 אם הקובץ לא מעודכן (בלי ה-ref)
 * דטרמיניסטי: generatedAt: null, חלקים ממוינים לפי id; ref = ענף@sha רק בכתיבה.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MOTION_VERBS, CORE_OF } from '../lib/verbs-motion.mjs';
import { validateSource } from '../lib/check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'catalog/sources/core.json');
const CHECK = process.argv.includes('--check');
const ORIGINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/core/origins.json'), 'utf8')).verbs;

/** שם (פועל בהווה, עד 9 מילים, בלי לטינית) · מה נכנס · מה יוצא. */
const CARD = {
  decay: { name: 'מחשב ערך שדועך עד הרצפה', takes: [['spec', 'record:decaySpec', '{from, floor, keepPct}'], ['step', 'number', 'number']], gives: ['number', 'number'] },
  countdown: { name: 'סופר לאחור עד אפס בדיוק', takes: [['spec', 'record:countdownSpec', '{total}'], ['elapsed', 'number', 'number']], gives: ['number', 'number'] },
  accumulate: { name: 'אוסף לקופה עד שהיא מתמלאת ומרוקנת', takes: [['spec', 'record:accumulateSpec', '{capacity}'], ['deposits', 'sequence', 'number[]']], gives: ['sequence', 'number[]'] },
  oscillate: { name: 'מחשב גל שעולה ויורד סביב מרכז', takes: [['spec', 'record:oscillateSpec', '{center, amplitude, period}'], ['step', 'number', 'number']], gives: ['number', 'number'] },
  random: { name: 'מפיק רצף מספרים אקראי מזרע', takes: [['spec', 'record:randomSpec', '{seed}'], ['count', 'number', 'number']], gives: ['sequence', 'number[]'] },
  gravity: { name: 'מחשב נפילה שמאיצה בכל צעד', takes: [['spec', 'record:gravitySpec', '{y, vy, g}'], ['step', 'number', 'number']], gives: ['record:gravityState', '{y, vy}'] },
  'move-along-path': { name: 'מזיז נקודה לאורך מסלול של תחנות', takes: [['spec', 'record:pathSpec', '{points: {x, y}[]}'], ['progress', 'number', 'number']], gives: ['geo', '{x, y} | null'] },
  orbit: { name: 'מחשב נקודה שמקיפה מרכז במעגל', takes: [['spec', 'record:orbitSpec', '{cx, cy, radius, period}'], ['step', 'number', 'number']], gives: ['geo', '{x, y}'] },
  'shortest-path': { name: 'מוצא את הדרך הזולה ברשת נקודות', takes: [['spec', 'record:graphSpec', '{edges: {a, b, w}[]}'], ['from', 'choice', '0..5'], ['to', 'choice', '0..5']], gives: ['sequence', '{cost, path} | null'] },
  spread: { name: 'מרחיב גל לכל השכנים בכל צעד', takes: [['spec', 'record:spreadSpec', '{edges: {a, b}[], sources}'], ['steps', 'number', 'number']], gives: ['list', 'number[]'] },
  sample: { name: 'קורא מהסביבה כל קריאה במרווח קבוע', takes: [['spec', 'record:sampleSpec', '{every}'], ['readings', 'sequence', 'number[]']], gives: ['sequence', 'number[]'] },
  echo: { name: 'מודד מרחק מזמן החזרה של ההד', takes: [['spec', 'record:echoSpec', '{speed}'], ['roundTrip', 'number', 'number']], gives: ['number', 'number'] },
  follow: { name: 'מזיז ערך חלק קבוע מהדרך למטרה', takes: [['spec', 'record:followSpec', '{target, pullPct}'], ['current', 'number', 'number']], gives: ['number', 'number'] },
  bounce: { name: 'מחזיר גוף מהרצפה במקדם קפיצה', takes: [['spec', 'record:bounceSpec', '{floor, bouncePct}'], ['body', 'record:body', '{pos, vel}']], gives: ['record:body', '{pos, vel}'] },
  'sun-position': { name: 'מחשב מתי השמש בזווית מתחת לאופק', takes: [['spec', 'record:sunSpec', '{lat, lon, depression}'], ['day', 'date', 'IsoDate']], gives: ['times', '{rise, noon, set} | null'] },
};

function refOf() {
  try {
    const br = execFileSync('git', ['-C', ROOT, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
    const sha = execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    return br + '@' + sha;
  } catch { return 'unknown@unknown'; }
}

export function coreParts() {
  return MOTION_VERBS.map((v) => {
    const c = CARD[v.id]; const { file, symbol } = CORE_OF[v.id]; const og = ORIGINS[v.id];
    if (!c || !og) throw new Error('חסר כרטיס/מקורות ל-' + v.id);
    const best = og.origins.filter((o) => o.best);
    const ordered = [...best, ...og.origins.filter((o) => !o.best)];
    const tags = ['core', 'verb:' + v.id, ...(og.foundAs === 'combination' ? ['combination:' + og.of.join('+')] : []), ...ordered.map((o) => `origin:${o.source}:${o.file}:${o.line}`), ...[...new Set(ordered.filter((o) => o.part).map((o) => 'twin:' + o.part))]];
    return {
      id: `core:${file}#${symbol}`, source: 'core', path: file, symbol, lang: 'js', what: 'brick',
      name: c.name, does: v.means,
      takes: c.takes.map(([name, kind, type]) => ({ name, kind, type })),
      gives: { kind: c.gives[0], type: c.gives[1] },
      pure: true, example: null, tags,
    };
  }).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function serialize(parts, ref) {
  const doc = { source: 'core', repo: 'meir7651231-ui/maor-system', ref, generatedAt: null, parts };
  const errs = validateSource(doc, { strict: true });
  if (errs.length) throw new Error('הליבה לא עומדת בחוזה:\n' + errs.join('\n'));
  return JSON.stringify(doc, null, 1) + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const parts = coreParts();
  if (CHECK) {
    const cur = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
    const want = serialize(parts, cur?.ref ?? 'unknown@unknown');
    if (!cur || JSON.stringify(cur, null, 1) + '\n' !== want) { console.error('✗ catalog/sources/core.json לא מעודכן — הרץ: node catalog/scripts/core-census.mjs'); process.exit(1); }
    console.log('✓ catalog/sources/core.json מעודכן (' + parts.length + ' חלקים)');
  } else {
    fs.writeFileSync(OUT, serialize(parts, refOf()));
    console.log('✓ catalog/sources/core.json — ' + parts.length + ' חלקים');
  }
}
