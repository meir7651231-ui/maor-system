/**
 * 🔎 «בודק» — מי קורא מה (SELF-V2, 14.10.2026). נטען עם `node --import=…/trace-reads.mjs` (וב-NODE_OPTIONS לתהליכי-בן;
 * עובדים יורשים את execArgv): כל קריאה מהדיסק (readFileSync/readdirSync/existsSync/statSync/promises.readFile) וכל מודול
 * שנטען (import) נרשמים ל-$CATALOG_TRACE/<pid>-<thread>.txt. כך הבונה-מחדש מוכיח שהקלטים שכל שלב מצהיר עליהם מכסים את
 * מה שהשלב באמת קורא (self-v2.test › "כל שלב מצהיר על כל מה שהוא קורא"). קריאות מקוריות של rolldown (Rust) לא נראות כאן —
 * לכן שלבים שאורזים קוד מצהירים על כל תיקיית-הקוד.
 */
import fs from 'node:fs';
import { register, syncBuiltinESMExports } from 'node:module';
import { threadId } from 'node:worker_threads';

const DIR = process.env.CATALOG_TRACE;
if (DIR) {
  const seen = new Set();
  const out = `${DIR}/${process.pid}-${threadId}.txt`;
  const note = (kind, p) => {
    if (typeof p !== 'string' && !(p instanceof URL)) return;
    const s = kind + ' ' + (p instanceof URL ? p.pathname : p);
    if (seen.has(s)) return;
    seen.add(s);
    try { orig.appendFileSync(out, s + '\n'); } catch { /* מעקב בלבד */ }
  };
  const orig = { appendFileSync: fs.appendFileSync };
  for (const [name, kind] of [['readFileSync', 'r'], ['readdirSync', 'd'], ['existsSync', 'e'], ['statSync', 'e'], ['lstatSync', 'e'], ['openSync', 'r']]) {
    const f = fs[name];
    fs[name] = function (p, ...rest) { note(kind, p); return f.call(this, p, ...rest); };
  }
  // ⚡ SPEED1000: האורז (rolldown) קורא בקוד מקורי — לא נראה כאן; מה שארז מדווח דרך הרשם (sandbox · bundle.mjs)
  globalThis.__catalogBundleDeps = (deps) => { for (const d of deps) note('r', d); };
  const pr = fs.promises.readFile;
  fs.promises.readFile = function (p, ...rest) { note('r', p); return pr.call(this, p, ...rest); };
  syncBuiltinESMExports(); // `import { readFileSync } from 'node:fs'` מקבל את הגרסה העוקבת
  // מודולים שנטענים (import) — דרך ווי-הטעינה של node
  try { register('data:text/javascript,' + encodeURIComponent(`import fs from 'node:fs'; export async function load(url, ctx, next) { if (url.startsWith('file:')) { try { fs.appendFileSync(${JSON.stringify(out.replace(/\.txt$/, '-m.txt'))}, 'm ' + new URL(url).pathname + '\\n'); } catch {} } return next(url, ctx); }`)); } catch { /* */ }
}
