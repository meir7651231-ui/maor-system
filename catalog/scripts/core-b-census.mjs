#!/usr/bin/env node
/**
 * 🧱 מפקד core-b (STATIC-VERBS, 14.10.2026) — כותב catalog/sources/core-b.json:
 * 7 הליבות הטהורות של הפעלים שהיו static-only (catalog/core/*.mjs), כל אחת כחלק `brick` עם `origins`
 * (איפה הפעולה נמצאה בקוד שלנו — catalog/core/origins-b.json). הדוגמה = קלט-אמת שהקורא מתחיל ממנו.
 *
 *   node catalog/scripts/core-b-census.mjs           # כותב
 *   node catalog/scripts/core-b-census.mjs --check   # יציאה 1 אם לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { byId, fnvHexPoints } from '../self/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
// 🧪 SELF-V2: נקרא בפעם הראשונה שצריך (לא בטעינה) — טהור-בטעינה ⇒ המכונה יכולה להריץ ולהוכיח את הקובץ הזה
let ORIGINS_; const ORIGINS = () => (ORIGINS_ ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/core/origins-b.json'), 'utf8')));
/**
 * ה-ref: טביעת-תוכן (fnv-1a) של 7 קובצי-הליבה + origins-b — יציב בין הרצות ובין קומיטים.
 * (קודם: הקומיט האחרון שנגע ב-catalog/core — כל קומיט שנגע בליבה אחרת, למשל קופץ, הפך את הקובץ ל"לא מעודכן"
 * עד קומיט נוסף; ובענף-המיזוג זה לא התייצב לעולם. FINAL-MACHINE 14.10.2026.)
 */
function refOf() {
  const files = ['origins-b.json', ...PARTS.map((p) => p.file)].sort();
  return 'catalog/core@' + fnvHexPoints(files.map((f) => f + '\0' + fs.readFileSync(path.join(ROOT, 'catalog/core', f), 'utf8')).join('')); // 🧩 SELF
}

const S = (name, kind, type) => ({ name, kind, type });
const PARTS = [
  {
    verb: 'assign-role', file: 'assign-role.mjs', symbol: 'assignRoles', name: 'מקצה לכל חבר תפקיד אחד לפי תוכנית',
    does: 'כל חבר מקבל תפקיד אחד: כמה מכל תפקיד לפי התוכנית (לפי הסדר), השאר לתפקיד-השארית; ההגרלה בזרע מוזרק — אותו זרע, אותה חלוקה.',
    takes: [S('members', 'list', 'string[]'), S('plan', 'list', '{role, count}[]'), S('seed', 'number', 'number'), S('rest', 'text', 'string')], gives: { kind: 'list', type: '{who, role}[]' },
    example: { in: { members: ['m1', 'm2', 'm3', 'm4'], plan: [{ role: 'admin', count: 1 }, { role: 'teacher', count: 2 }], seed: 7 }, out: [{ who: 'm1', role: 'staff' }, { who: 'm2', role: 'teacher' }, { who: 'm3', role: 'admin' }, { who: 'm4', role: 'teacher' }] },
  },
  {
    verb: 'freeze', file: 'freeze.mjs', symbol: 'applyFrozen', name: 'שומר רשומות קפואות וגרסאות',
    does: 'מריץ כתיבה/הקפאה/החלפה: רשומה קפואה לא משתנה (כתיבה נדחית), והחלפה מוסיפה גרסה חדשה ושומרת את הישנה.',
    takes: [S('ops', 'list', '{op, id, content}[]')], gives: { kind: 'record:frozenStore', type: '{records, rejected}' },
    example: { in: { ops: [{ op: 'put', id: 'r1', content: 'a' }, { op: 'freeze', id: 'r1' }, { op: 'put', id: 'r1', content: 'b' }, { op: 'replace', id: 'r1', content: 'c' }] }, out: { records: { r1: { versions: ['a', 'c'], frozen: true } }, rejected: [2] } },
  },
  {
    verb: 'pace', file: 'pace.mjs', symbol: 'pace', name: 'מגביל את קצב הבקשות',
    does: 'מקבל רגעי-בקשה ומרווח ומחזיר מתי הפעולה יוצאת: בהגבלת-קצב הראשון בגל, בהשהיה האחרון בגל אחרי מרווח. אין שתי יציאות קרובות מהמרווח.',
    takes: [S('times', 'list', 'number[]'), S('gap', 'number', 'number'), S('mode', 'choice', "'throttle'|'debounce'")], gives: { kind: 'list', type: 'number[]' },
    example: { in: { times: [0, 1, 2, 5, 9, 10, 11], gap: 3, mode: 'debounce' }, out: [5, 8, 14] },
  },
  {
    verb: 'relay', file: 'relay.mjs', symbol: 'relay', name: 'מעביר הודעות דרך מרכז',
    does: 'כל הודעה נכנסת למרכז פעם אחת (מספר-תחנה) ומגיעה לכל חבר אחר פעם אחת; הסדר של כל שולח נשמר, ולשולח עצמו לא חוזרת.',
    takes: [S('messages', 'list', '{from, body}[]'), S('members', 'list', 'string[]')], gives: { kind: 'list', type: '{n, from, to, body}[]' },
    example: { in: { messages: [{ from: 'a', body: 'שלום' }, { from: 'b', body: 'תודה' }], members: ['a', 'b', 'c'] }, out: [{ n: 0, from: 'a', to: 'b', body: 'שלום' }, { n: 0, from: 'a', to: 'c', body: 'שלום' }, { n: 1, from: 'b', to: 'a', body: 'תודה' }, { n: 1, from: 'b', to: 'c', body: 'תודה' }] },
  },
  {
    verb: 'require-source', file: 'require-source.mjs', symbol: 'requireSource', name: 'מקבל רק פריטים עם מקור',
    does: 'פריט בלי מקור (או עם קישור שאינו https) נדחה; פריט עם מקור עובר כמו שהוא; מקור לא ממציאים.',
    takes: [S('items', 'list', '{text, src?}[]')], gives: { kind: 'record:sourceCheck', type: '{accepted, rejected}' },
    example: { in: { items: [{ text: 'טענה' }, { text: 'ציטוט', src: [{ t: 'ספר', url: 'https://example.test/a' }] }] }, out: { accepted: [{ text: 'ציטוט', src: [{ t: 'ספר', url: 'https://example.test/a' }] }], rejected: [0] } },
  },
  {
    verb: 'route', file: 'route.mjs', symbol: 'route', name: 'שולח כל דבר לערוץ אחד',
    does: 'לפי טבלת-כללים (הראשון שמתאים מנצח) — ערוץ אחד בדיוק; קלט לא מוכר הולך לערוץ ברירת-המחדל.',
    takes: [S('channel', 'text', 'string'), S('rules', 'list', '{key, to}[]'), S('fallback', 'text', 'string')], gives: { kind: 'choice', type: 'string' },
    example: { in: { channel: ' SMS' }, out: 'sms' },
  },
  {
    verb: 'tolerate', file: 'tolerate.mjs', symbol: 'tolerateParse', name: 'קורא כל פריט וסובל פריט שבור',
    does: 'קורא כל טקסט כ-JSON; פריט שבור מקבל את ערך-הנפילה במקומו, השאר נשארים במקום ובסדר, ושום דבר לא זורק.',
    takes: [S('texts', 'list', 'string[]'), S('fallback', 'unknown', 'null|number|string')], gives: { kind: 'list', type: 'any[]' },
    example: { in: { texts: ['1', '{x', '[2]'], fallback: 0 }, out: [1, 0, [2]] },
  },
];

const doc = {
  source: 'core-b', repo: 'meir7651231-ui/maor-system', ref: refOf(), generatedAt: null,
  parts: PARTS.map((p) => {
    const rel = 'catalog/core/' + p.file;
    return {
      id: 'core-b:' + rel + '#' + p.symbol, source: 'core-b', path: rel, symbol: p.symbol, lang: 'js', what: 'brick',
      name: p.name, does: p.does, takes: p.takes, gives: p.gives, pure: true, example: p.example,
      tags: ['core', 'verb:' + p.verb, 'world-free'], origins: ORIGINS()[p.verb],
    };
  }).sort(byId),
};

// הדוגמה חייבת להיות נכונה: מריצים את הליבה עליה
for (const p of doc.parts) {
  const mod = await import(pathToFileURL(path.join(ROOT, p.path)).href);
  const got = mod[p.symbol](...p.takes.map((t) => (t.name in p.example.in ? p.example.in[t.name] : undefined)));
  if (JSON.stringify(got) !== JSON.stringify(p.example.out)) { console.error('✗ הדוגמה של ' + p.id + ' לא נכונה: ' + JSON.stringify(got)); process.exit(1); }
}
const text = JSON.stringify(doc, null, 1) + '\n';
const out = path.join(ROOT, 'catalog/sources/core-b.json');
if (CHECK) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== text) { console.error('✗ catalog/sources/core-b.json לא מעודכן — הרץ: node catalog/scripts/core-b-census.mjs'); process.exit(1); }
  console.log('✓ core-b מעודכן');
} else {
  fs.writeFileSync(out, text);
  console.log('✓ catalog/sources/core-b.json · ' + doc.parts.length + ' חלקים · ' + doc.parts.reduce((a, p) => a + p.origins.length, 0) + ' מקורות-מוצא');
}
