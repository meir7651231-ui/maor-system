#!/usr/bin/env node
/**
 * 🧭 מפקד core-c (MACHINE-V4, 14.10.2026) — כותב catalog/sources/core-c.json:
 * 9 ליבות-החומר שחולצו מהקוד שלנו (catalog/core/*.mjs) — פעולות שכבר עבדו בקוד על **נקודות** ועל **צליל**, בלי עולם:
 * רשת-הסינפסות (נקודות ⇒ רשת), הליכה-אחרי-העכבר, אבק-הזהב (מקום אקראי, נישא ברוח), בדיקת-הפגיעה של הגלקסיה,
 * שתי האונות, `seen`, מיון-השכנים לפי מרחק, וצליל-המטבע של פרנס׳לע כנתון (`{f, t, d, g}`).
 * כל אחת עם `origins` (catalog/core/origins-c.json). הדוגמה = קלט-אמת, והיא מורצת על הליבה בכל הרצה.
 *
 *   node catalog/scripts/core-c-census.mjs           # כותב
 *   node catalog/scripts/core-c-census.mjs --check   # יציאה 1 אם לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { byId, fnvHexPoints } from '../self/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
// 🧪 SELF-V2: נקרא בפעם הראשונה שצריך (לא בטעינה) — טהור-בטעינה ⇒ המכונה יכולה להריץ ולהוכיח את הקובץ הזה
let ORIGINS_; const ORIGINS = () => (ORIGINS_ ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/core/origins-c.json'), 'utf8')));

const S = (name, kind, type) => ({ name, kind, type });
const P = '{x, y}';
const CLINK = [{ f: 2637, t: 0, d: 0.34, g: 0.14 }, { f: 3960, t: 0, d: 0.24, g: 0.08 }, { f: 5280, t: 0, d: 0.17, g: 0.05 }, { f: 7120, t: 0, d: 0.1, g: 0.025 }];
export const PARTS = [
  {
    verb: 'connect', file: 'near-net.mjs', symbol: 'nearNet', name: 'מחבר כל נקודה לשכנות הקרובות אליה',
    does: 'נקודות ⇒ רשת: כל נקודה נקשרת ל-near הנקודות הקרובות אליה, כל קשת פעם אחת, המחיר = המרחק. הנקודות נשמרות, מתווספות רק הקשתות.',
    takes: [S('spec', 'record:netSpec', '{points: {x, y}[], near, sources?}')], gives: { kind: 'record:net', type: '{points, near, sources?, edges: {a, b, w}[]}' },
    example: { in: { spec: { points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }], near: 1 } }, out: { points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }], near: 1, edges: [{ a: 0, b: 1, w: 3 }, { a: 1, b: 2, w: 4 }] } },
  },
  {
    verb: 'follow', file: 'follow-point.mjs', symbol: 'followPoint', name: 'מזיז נקודה חלק קבוע מהדרך למטרה',
    does: 'בכל צעד הנקודה עוברת חלק קבוע מהדרך אל המטרה — ב-x וב-y באותו צעד; לא עוברת אותה, וכשהגיעה נשארת.',
    takes: [S('spec', 'record:followPointSpec', '{target: {x, y}, pullPct}'), S('current', 'geo', P)], gives: { kind: 'geo', type: P },
    example: { in: { spec: { target: { x: 10, y: 20 }, pullPct: 50 }, current: { x: 0, y: 0 } }, out: { x: 5, y: 10 } },
  },
  {
    verb: 'random', file: 'random-points.mjs', symbol: 'randomPoints', name: 'מחשב נקודות במקומות אקראיים מזרע',
    does: 'count נקודות בריבוע 0..1 — שתי הגרלות לכל נקודה (x ואז y) מהמגריל עם זרע: אותו זרע ⇒ אותן נקודות.',
    takes: [S('spec', 'record:randomSpec', '{seed}'), S('count', 'number', 'number')], gives: { kind: 'geo', type: '{x, y}[]' },
    example: { in: { spec: { seed: 7 }, count: 1 } },
  },
  {
    verb: 'filter', file: 'points-within.mjs', symbol: 'pointsWithin', name: 'מסנן את הנקודות שבתוך העיגול',
    does: 'משאיר רק נקודות שהמרחק שלהן מהמרכז לא עולה על הרדיוס, בסדר המקורי — כל נקודה נבחנת לבד.',
    takes: [S('points', 'geo', '{x, y}[]'), S('center', 'geo', P), S('radius', 'number', 'number')], gives: { kind: 'geo', type: '{x, y}[]' },
    example: { in: { points: [{ x: 1, y: 1 }, { x: 9, y: 9 }, { x: -2, y: 0 }], center: { x: 0, y: 0 }, radius: 3 }, out: [{ x: 1, y: 1 }, { x: -2, y: 0 }] },
  },
  {
    verb: 'group', file: 'group-by-side.mjs', symbol: 'groupBySide', name: 'מקבץ נקודות לפי הצד של המרכז',
    does: 'כל נקודה הולכת לאזור שלה לפי הצד של המרכז (סימן של x ושל y): ארבעה אזורים, ועל הקו — אזור 0.',
    takes: [S('points', 'geo', '{x, y}[]'), S('center', 'geo', P)], gives: { kind: 'list', type: 'Record<string, {x, y}[]>' },
    example: { in: { points: [{ x: 1, y: 1 }, { x: -1, y: 2 }, { x: 3, y: 5 }], center: { x: 0, y: 0 } }, out: { '++': [{ x: 1, y: 1 }, { x: 3, y: 5 }], '-+': [{ x: -1, y: 2 }] } },
  },
  {
    verb: 'dedupe', file: 'dedupe-points.mjs', symbol: 'dedupePoints', name: 'מסנן כפולים: כל נקודה פעם אחת',
    does: 'כל מקום (x,y) נשאר פעם אחת — הראשון שהגיע, בסדר המקורי.',
    takes: [S('points', 'geo', '{x, y}[]')], gives: { kind: 'geo', type: '{x, y}[]' },
    example: { in: { points: [{ x: 1, y: 1 }, { x: 2, y: 0 }, { x: 1, y: 1 }] }, out: [{ x: 1, y: 1 }, { x: 2, y: 0 }] },
  },
  {
    verb: 'sort', file: 'by-distance.mjs', symbol: 'byDistance', name: 'ממיין נקודות לפי המרחק מהמוצא',
    does: 'הקרובה למוצא קודם; אותו מרחק ⇒ לפי x ואז y — הסדר לא תלוי באיך שהגיעו.',
    takes: [S('points', 'geo', '{x, y}[]'), S('from', 'geo', P)], gives: { kind: 'geo', type: '{x, y}[]' },
    example: { in: { points: [{ x: 5, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 3 }], from: { x: 0, y: 0 } }, out: [{ x: 1, y: 1 }, { x: 0, y: 3 }, { x: 5, y: 0 }] },
  },
  {
    verb: 'offset', file: 'drift.mjs', symbol: 'drift', name: 'מזיז נקודה במהירות שלה כמה צעדים',
    does: 'אחרי steps צעדים: x ועוד vx כפול הצעדים, y ועוד vy כפול הצעדים. הזזה ב-0 לא עושה כלום.',
    takes: [S('point', 'geo', P), S('steps', 'number', 'number'), S('vel', 'geo', P)], gives: { kind: 'geo', type: P },
    example: { in: { point: { x: 1, y: 2 }, steps: 3, vel: { x: 2, y: -1 } }, out: { x: 7, y: -1 } },
  },
  {
    verb: 'map', file: 'transpose-notes.mjs', symbol: 'transposeNotes', name: 'מעביר צליל לגובה אחר ביחס קבוע',
    does: 'אותו דבר לכל תו בצליל {f, t, d, g}: רק התדר מוכפל ביחס, השאר נשאר — אותו צליל, גבוה או נמוך יותר.',
    takes: [S('notes', 'sound', '{f, t, d, g}[]'), S('ratio', 'number', 'number')], gives: { kind: 'sound', type: '{f, t, d, g}[]' },
    example: { in: { notes: CLINK, ratio: 0.5 }, out: CLINK.map((n) => ({ ...n, f: n.f / 2 })) },
  },
];

function refOf() {
  const files = ['origins-c.json', ...PARTS.map((p) => p.file)].sort();
  return 'catalog/core@' + fnvHexPoints(files.map((f) => f + '\0' + fs.readFileSync(path.join(ROOT, 'catalog/core', f), 'utf8')).join('')); // 🧩 SELF
}

export function coreCDoc() {
  return {
    source: 'core-c', repo: 'meir7651231-ui/maor-system', ref: refOf(), generatedAt: null,
    parts: PARTS.map((p) => {
      const rel = 'catalog/core/' + p.file;
      if (!ORIGINS()[p.symbol]?.length) throw new Error('אין origins ל-' + p.symbol);
      return {
        id: 'core-c:' + rel + '#' + p.symbol, source: 'core-c', path: rel, symbol: p.symbol, lang: 'js', what: 'brick',
        name: p.name, does: p.does, takes: p.takes, gives: p.gives, pure: true, example: p.example,
        tags: ['core', 'verb:' + p.verb, 'world-free'], origins: ORIGINS()[p.symbol].map(({ best: _b, ...o }) => o),
      };
    }).sort(byId),
  };
}

if (process.argv[1] && process.argv[1].endsWith('core-c-census.mjs')) {
  const doc = coreCDoc();
  // הדוגמה חייבת להיות נכונה: מריצים את הליבה עליה (בלי out ⇒ רק שהיא רצה)
  for (const p of doc.parts) {
    const mod = await import(pathToFileURL(path.join(ROOT, p.path)).href);
    const got = mod[p.symbol](...p.takes.map((t) => p.example.in[t.name]));
    if (!('out' in p.example)) p.example.out = got;
    else if (JSON.stringify(got) !== JSON.stringify(p.example.out)) { console.error('✗ הדוגמה של ' + p.id + ' לא נכונה: ' + JSON.stringify(got)); process.exit(1); }
  }
  const text = JSON.stringify(doc, null, 1) + '\n';
  const out = path.join(ROOT, 'catalog/sources/core-c.json');
  if (CHECK) {
    const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
    if (cur !== text) { console.error('✗ catalog/sources/core-c.json לא מעודכן — הרץ: node catalog/scripts/core-c-census.mjs'); process.exit(1); }
    console.log('✓ core-c מעודכן');
  } else {
    fs.writeFileSync(out, text);
    console.log('✓ catalog/sources/core-c.json · ' + doc.parts.length + ' חלקים · ' + doc.parts.reduce((a, p) => a + p.origins.length, 0) + ' מקורות-מוצא');
  }
}
