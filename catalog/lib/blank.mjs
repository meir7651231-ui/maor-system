/**
 * 🧽 «מנרמל» — מקור בלי הערות (SELF-V2, 14.10.2026).
 *
 * קובץ TS (.ts/.tsx/.mts/.cts — לא .d.ts) ⇒ אותו טקסט שבו כל הערה הוסרה (עם הרווחים שסביבה; רווח רק כשצריך, סופי-השורה
 * שבתוכה נשמרים) — מספרי-השורה נשמרים, ואורך ההערה לא משנה (הערה ארוכה או קצרה ⇒ אותו טקסט). ב-TS הערות לא משנות טיפוסים ולא התנהגות, ולכן הפותח, הקורא ומכונת-השילוב קוראים את הגרסה
 * הזו — **ולכן** הפלט שלהם תלוי רק בה, והטביעה שלה (`blankHash`) היא מפתח-המטמון: שינוי של הערה בלבד ⇒ אותה טביעה ⇒
 * שום שלב שקורא קוד לא רץ שוב. (המפקד קורא את הקובץ המקורי — הוא כן משתמש ב-JSDoc לתיאורים.)
 * לא נמחקות: `///` (הנחיות-מהדר), `// @ts-…`, `@jsx…` — הן משנות את מה שהמהדר רואה, ולכן נשארות (וגם בטביעה).
 * קבצי JS לא נוגעים: שם JSDoc **הוא** הטיפוס.
 *
 * הסריקה מדויקת: הפער בין צמתים סמוכים בעץ-המהדר מכיל רק סימני-פיסוק, מילות-מפתח והערות (ביטוי-רגולרי, תבנית ו-JSX הם
 * צמתים בעצמם) — כך `//` בתוך מחרוזת / regex / טקסט-JSX לא נחשב הערה.
 */
import ts from 'typescript';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fingerprint, cacheGet, cachePut } from './cache.mjs';

const TS_EXT = /\.(ts|tsx|mts|cts)$/;
export const isBlankable = (file) => TS_EXT.test(file) && !/\.d\.[mc]?ts$/.test(file) && !/[\\/]node_modules[\\/]/.test(file);
const KEEP = /^\/\/\/|^\/\/\s*@ts-|@jsx/;

/** טווחי-ההערות [start, end] של קובץ (ממוינים, בלי כפולים). */
export function commentRanges(text, fileName = 'x.ts') {
  // SPEED1000: קובץ JS נקרא כ-JS (המפקד מנרמל גם .mjs — lib/census-view.mjs); TS כמו קודם
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : /\.[mc]?jsx?$/.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false, kind);
  const sc = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
  const out = new Map();
  const add = (r) => { if (r.end > r.pos && !out.has(r.pos)) out.set(r.pos, r.end); };
  const gap = (from, to) => {
    if (to <= from) return;
    sc.resetTokenState(from);
    for (let k = sc.scan(); k !== ts.SyntaxKind.EndOfFileToken && sc.getTokenStart() < to; k = sc.scan()) {
      if (k === ts.SyntaxKind.SingleLineCommentTrivia || k === ts.SyntaxKind.MultiLineCommentTrivia) add({ pos: sc.getTokenStart(), end: sc.getTokenEnd() });
    }
  };
  const visit = (node) => {
    const kids = [];
    ts.forEachChild(node, (c) => { kids.push(c); }, (arr) => { for (const c of arr) kids.push(c); });
    if (!kids.length) {
      if (node.kind === ts.SyntaxKind.JsxText || node.kind === ts.SyntaxKind.JsxTextAllWhiteSpaces) return; // טקסט, לא טריוויה
      // אסימון: רק הטריוויה שלפניו (גם הערה בסוף השורה הקודמת); צומת ריק (`{ /* x */ }`) — כולו
      if (node.kind <= ts.SyntaxKind.LastToken) gap(node.pos, node.getStart(sf)); else gap(node.pos, node.end);
      return;
    }
    // הפער שלפני הצומת (טריוויה מובילה) + בין הילדים + אחרי האחרון — רק פיסוק/מילות-מפתח/הערות
    let at = node.pos;
    for (const c of kids) { gap(at, c.pos); visit(c); at = c.end; }
    gap(at, node.end);
  };
  visit(sf);
  return [...out].sort((a, b) => a[0] - b[0]);
}

const HSPACE = /[ \t]/;
const WORD = /[\w$\u0080-\uffff]/;
const OP = /[-+*/<>=&|!?.%^~:]/;
/** האם שני תווים סמוכים (אחרי הסרת הערה ביניהם) צריכים רווח כדי לא להתמזג לאסימון אחד (`a b`, `+ +`, `/ /`). */
const needsGap = (l, r) => (WORD.test(l) && WORD.test(r)) || (OP.test(l) && OP.test(r));

/**
 * הטקסט בלי הערות. הערה + הרווחים האופקיים שסביבה ⇒ (SELF-LOOP, 14.10.2026 — תיקון):
 *   · כלום — כשהיא בסוף שורה / בתחילת שורה (`x; // הערה` ⇒ `x;` — כמו בלי ההערה בכלל);
 *   · רווח אחד — כשהיה רווח לצידה, או כשבלעדיו שני אסימונים היו מתמזגים; אחרת כלום: הערת-בלוק צמודה בתוך סוגריים ⇒ נעלמת;
 *   · סופי-השורה שבתוכה — כשהיא רב-שורתית (השורות נשמרות).
 * היה: רווח קבוע במקום ההערה ⇒ `x; // x` נתן `x;  ` ≠ `x;` ⇒ הוספת הערה בסוף שורה שינתה את הטביעה וכל הצינור רץ (38.7 שנ׳).
 */
export function blankComments(text, fileName = 'x.ts', keep = null) {
  const rs = commentRanges(text, fileName);
  if (!rs.length) return text;
  let out = ''; let at = 0;
  for (const [s, e] of rs) {
    if (s < at) continue;
    const c = text.slice(s, e);
    if (KEEP.test(c) || (keep && keep(s, e, c))) continue; // keep — הערות שמי שקורא את הגרסה הזו כן משתמש בהן (census-view)
    let a = s; while (a > at && HSPACE.test(text[a - 1])) a--;
    let b = e; while (b < text.length && HSPACE.test(text[b])) b++;
    const l = a > 0 ? text[a - 1] : '\n'; const r = b < text.length ? text[b] : '\n';
    const nl = c.match(/\r?\n/g);
    const lineEdge = l === '\n' || l === '\r' || r === '\n' || r === '\r';
    out += text.slice(at, a) + (nl ? nl.join('') : lineEdge ? '' : a < s || b > e || needsGap(l, r) ? ' ' : '');
    at = b;
  }
  return out + text.slice(at);
}

/** מה שהמכונה קוראת מקובץ-מקור: TS ⇒ בלי הערות; כל השאר ⇒ כמו שהוא. */
export const sourceView = (file, text) => (isBlankable(file) ? blankComments(text, file) : text);

/* ═══════════════ מהר: «מחפש לפי מפתח» — טקסט-מקור ⇒ הגרסה בלי ההערות, נזכרת לפי טביעת-התוכן ═══════════════ */

const memo = new Map();
/**
 * טביעת **האלגוריתם** = טביעת הקוד של הקובץ הזה (+ גרסת המהדר) — לא תג ידני. (SELF-LOOP, תיקון לפי מדידת-המנהל:
 * האלגוריתם שונה פעמיים תחת אותו תג 'blank-v3' ⇒ שכפול עם מטמון מאיטרציה קודמת חישב טביעות-view ישנות ⇒ החותמות
 * שבריפו לא תאמו לשכפול טרי.) שינוי בקובץ ⇒ מפתחות חדשים ⇒ שום תוצאה ישנה לא נשלפת. ratchet: self-loop.test.
 */
let algoMemo = null;
export function blankAlgoKey() {
  if (algoMemo) return algoMemo;
  let src = '';
  try { src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'); } catch { /* ארגז-חול — אין קובץ; אין גם מטמון */ }
  return (algoMemo = fingerprint('blank-algo', ts.version, src));
}
/** sourceView עם מטמון (בזיכרון + lib/cache.mjs לפי טביעת הטקסט המקורי) — פרסור-מהדר לכל קובץ רק כשהתוכן חדש. */
export function sourceViewCached(file, text) {
  if (!isBlankable(file)) return text;
  const k = fingerprint(blankAlgoKey(), file.endsWith('x') ? 'x' : 't', text);
  let v = memo.get(k);
  if (v === undefined) { v = cacheGet('blank', k); if (typeof v !== 'string') { v = blankComments(text, file); cachePut('blank', k, v); } memo.set(k, v); }
  return v;
}

/** מארח-מהדר שקורא את קובצי-ה-TS בלי הערות (לפותח ולקורא) — כך מה שהם רואים = מה שהטביעה של השלב מכסה. */
export function blankingHost(options) {
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  host.readFile = (f) => { const t = read(f); return t == null ? t : sourceViewCached(f, t); };
  return host;
}
