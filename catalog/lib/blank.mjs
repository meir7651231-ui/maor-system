/**
 * 🧽 «מנרמל» — מקור בלי הערות (SELF-V2, 14.10.2026).
 *
 * קובץ TS (.ts/.tsx/.mts/.cts — לא .d.ts) ⇒ אותו טקסט שבו כל הערה הוחלפה ברווח אחד (או בסופי-השורה שבתוכה) — מספרי-
 * השורה נשמרים, ואורך ההערה לא משנה (הערה ארוכה או קצרה ⇒ אותו טקסט). ב-TS הערות לא משנות טיפוסים ולא התנהגות, ולכן הפותח, הקורא ומכונת-השילוב קוראים את הגרסה
 * הזו — **ולכן** הפלט שלהם תלוי רק בה, והטביעה שלה (`blankHash`) היא מפתח-המטמון: שינוי של הערה בלבד ⇒ אותה טביעה ⇒
 * שום שלב שקורא קוד לא רץ שוב. (המפקד קורא את הקובץ המקורי — הוא כן משתמש ב-JSDoc לתיאורים.)
 * לא נמחקות: `///` (הנחיות-מהדר), `// @ts-…`, `@jsx…` — הן משנות את מה שהמהדר רואה, ולכן נשארות (וגם בטביעה).
 * קבצי JS לא נוגעים: שם JSDoc **הוא** הטיפוס.
 *
 * הסריקה מדויקת: הפער בין צמתים סמוכים בעץ-המהדר מכיל רק סימני-פיסוק, מילות-מפתח והערות (ביטוי-רגולרי, תבנית ו-JSX הם
 * צמתים בעצמם) — כך `//` בתוך מחרוזת / regex / טקסט-JSX לא נחשב הערה.
 */
import ts from 'typescript';
import { fingerprint, cacheGet, cachePut } from './cache.mjs';

const TS_EXT = /\.(ts|tsx|mts|cts)$/;
export const isBlankable = (file) => TS_EXT.test(file) && !/\.d\.[mc]?ts$/.test(file) && !/[\\/]node_modules[\\/]/.test(file);
const KEEP = /^\/\/\/|^\/\/\s*@ts-|@jsx/;

/** טווחי-ההערות [start, end] של קובץ (ממוינים, בלי כפולים). */
export function commentRanges(text, fileName = 'x.ts') {
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
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

/** הטקסט בלי הערות (רווח אחד במקום כל הערה; סופי-שורה נשמרים). */
export function blankComments(text, fileName = 'x.ts') {
  const rs = commentRanges(text, fileName);
  if (!rs.length) return text;
  let out = ''; let at = 0;
  for (const [s, e] of rs) {
    if (s < at) continue;
    const c = text.slice(s, e);
    if (KEEP.test(c)) continue;
    // רווח אחד (או סופי-השורה שבתוך הערה רב-שורתית) — **אורך קבוע**, כך שהערה ארוכה/קצרה נותנת אותו טקסט; השורות נשמרות
    const nl = c.match(/\r?\n/g);
    out += text.slice(at, s) + (nl ? nl.join('') : ' ');
    at = e;
  }
  return out + text.slice(at);
}

/** מה שהמכונה קוראת מקובץ-מקור: TS ⇒ בלי הערות; כל השאר ⇒ כמו שהוא. */
export const sourceView = (file, text) => (isBlankable(file) ? blankComments(text, file) : text);

/* ═══════════════ מהר: «מחפש לפי מפתח» — טקסט-מקור ⇒ הגרסה בלי ההערות, נזכרת לפי טביעת-התוכן ═══════════════ */

const memo = new Map();
/** sourceView עם מטמון (בזיכרון + lib/cache.mjs לפי טביעת הטקסט המקורי) — פרסור-מהדר לכל קובץ רק כשהתוכן חדש. */
export function sourceViewCached(file, text) {
  if (!isBlankable(file)) return text;
  const k = fingerprint('blank-v2', ts.version, file.endsWith('x') ? 'x' : 't', text);
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
