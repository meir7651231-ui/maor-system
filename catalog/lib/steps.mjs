/**
 * ⏱️ תקציב-צעדים דטרמיניסטי (SELF-V2, 14.10.2026) — במקום שעון-קיר.
 *
 * עד SELF-V2 חלק שנתקע נעצר אחרי 20 שניות של שעון (וטעינת-מודול אחרי 3 שניות) ⇒ התוצאה הייתה תלויה במהירות המחשב:
 * `buildTzGrid` (אורביט) נרשם "timeout" כאן, ועל מחשב מהיר יותר היה יכול לרוץ עד הסוף ולקבל פעלים.
 * עכשיו הקוד שנארז מקבל «מונה צעדים»: קריאה ל-`__catalogStep()` בתחילת כל גוף-פונקציה ובכל סיבוב של כל לולאה.
 * אותו קוד + אותם קלטים ⇒ אותו מספר צעדים בכל מחשב — ולכן "חרג מהתקציב" הוא תוצאה דטרמיניסטית (status: 'budget').
 * (פעולות מובנות של V8 — sort, repeat, regex — לא נספרות; הן תחומות ע"י גודל-הקלטים המחוללים.)
 *
 * טהור (מחרוזת ⇒ מחרוזת), בלי I/O. הפרסור: rolldown/parseAst (oxc — אותו מפרסר של האורז; היסטים ב-UTF-16).
 */
import { parseAst } from 'rolldown/parseAst';

export const STEP_FN = '__catalogStep';
export const PLUS_FN = '__catalogPlus';
/** תקציב לטעינת-מודול (קוד ברמה העליונה) ולחלק (כל הקריאות של חלק אחד: חוקים + טביעה + תנועה). */
export const LOAD_STEPS = 5_000_000;
export const PART_STEPS = 50_000_000;
/**
 * ותקרה לקריאה אחת: קריאה עם קלט ענק (n=10⁸) שבונה מיליוני אובייקטים הייתה מגיעה לתקרת-החלק רק אחרי שהזיכרון כמעט נגמר —
 * ואז איסוף-הזבל של V8 מאט אותה לדקות (נתפס ע"י שומר-הקריסה על חלק של המחולל). תקרה לקריאה עוצרת אותה מוקדם, באותו מקום בכל מחשב.
 */
export const CALL_STEPS = 2_000_000;

const LOOPS = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);
const FNS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/** מקום ההכנסה בגוף בלוק: אחרי ה-`{` ואחרי ההנחיות ('use strict') — אחרת ההנחיה מפסיקה להיות הנחיה. */
function blockAt(body) {
  let at = body.start + 1;
  for (const s of body.body ?? []) { if (s.type === 'ExpressionStatement' && typeof s.directive === 'string') at = s.end; else break; }
  return at;
}

/**
 * קוד ⇒ קוד עם מונה-צעדים. לא מצליח לפרסר (תסריט וגם מודול) ⇒ null (המכונה רושמת 'load-failed' עם הסיבה — גם זה דטרמיניסטי).
 */
export function instrument(code) {
  let ast = null;
  for (const sourceType of ['script', 'module']) { try { ast = parseAst(code, { sourceType }, 'part.cjs'); break; } catch { /* הבא */ } }
  if (!ast) return null;
  const ins = []; // [מקום, טקסט, סוגר?]
  const tick = STEP_FN + '();';
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const x of n) visit(x); return; }
    if (typeof n.type !== 'string') return;
    if (FNS.has(n.type) && n.body) {
      if (n.body.type === 'BlockStatement') ins.push([blockAt(n.body), tick]);
      else { ins.push([n.body.start, '(' + STEP_FN + '(), ']); ins.push([n.body.end, ')', 1]); }
    } else if (n.type === 'AssignmentExpression' && n.operator === '+=' && n.left.type === 'Identifier') {
      // `x += e` ⇒ `x = __catalogPlus(x, e)`: אותו סדר-חישוב (x ואז e); מחרוזת שגדלה נספרת לפי האורך שלה — לולאה שצוברת
      // מחרוזת ומפרשת אותה כל סיבוב (O(n²) בתוך V8, בלי צעדים) נעצרת בתקציב, לא נתקעת לדקות
      ins.push([n.start, n.left.name + ' = ' + PLUS_FN + '(' + n.left.name + ', ', 0, n.right.start]); // מחליף את `x +=`
      ins.push([n.end, ')', 1]);
    } else if (LOOPS.has(n.type) && n.body) {
      if (n.body.type === 'BlockStatement') ins.push([n.body.start + 1, tick]);
      else { ins.push([n.body.start, '{' + tick]); ins.push([n.body.end, '}', 1]); }
    }
    for (const k in n) if (k !== 'type' && k !== 'start' && k !== 'end') { const v = n[k]; if (v && typeof v === 'object') visit(v); }
  };
  visit(ast);
  // מהסוף להתחלה. באותו מקום (הכנסה מאוחרת יוצאת ראשונה בטקסט): פותחים מהפנימי לחיצוני ⇒ החיצוני ראשון;
  // סוגרים מהחיצוני לפנימי ⇒ הפנימי נסגר ראשון; וסוגרים אחרי פותחים ⇒ סוגר קודם לפותח. k = סדר-הביקור (חיצוני קודם).
  const order = ins.map((x, k) => [x[0], k, x[1], x[2] ? 1 : 0, x[3]]).sort((a, b) => b[0] - a[0] || a[3] - b[3] || (a[3] ? a[1] - b[1] : b[1] - a[1]));
  const pieces = []; let end = code.length;
  for (const [at, , text, , upTo] of order) { pieces.push(code.slice(upTo ?? at, end), text); end = at; } // upTo = סוף טווח שמוחלף
  pieces.push(code.slice(0, end));
  return pieces.reverse().join('');
}

/** הקדמה לארגז-החול: המונה + פעולות-שליטה למארח (קביעת תקציב · קריאה חדשה · האם חרג · כמה צעדים · הקריאה הכבדה). */
export const STEPS_PRELUDE = `(function (g) {
  var steps = 0, cap = Infinity, over = false, call = 0, callCap = Infinity, maxCall = 0;
  g.${STEP_FN} = function () { if (++steps > cap || ++call > callCap) { over = true; throw new RangeError('catalog: step budget'); } };
  // מחרוזת ארוכה שנצברת: צעד לכל 64 תווים של התוצאה (concat הוא O(1) ב-V8, אבל כל קריאה/המרה של המחרוזת היא O(אורך))
  g.${PLUS_FN} = function (a, b) { var r = a + b; if (typeof r === 'string' && r.length > 256) { var k = r.length >>> 6; steps += k; call += k; if (steps > cap || call > callCap) { over = true; throw new RangeError('catalog: step budget'); } } return r; };
  g.__catalogBudget = function (n, c) { steps = 0; cap = n; over = false; call = 0; callCap = c; maxCall = 0; };
  g.__catalogCall = function () { if (call > maxCall) maxCall = call; call = 0; };
  g.__catalogOver = function () { return over; };
  g.__catalogSteps = function () { return steps; };
  g.__catalogMaxCall = function () { return call > maxCall ? call : maxCall; };
})(globalThis);
`;

/** חריגה מהתקציב — נזרקת במארח (callerFor), לא בתוך הארגז, כדי שקוד-החלק לא יוכל "לבלוע" אותה. */
export class BudgetError extends Error {
  constructor(steps) { super('חרג מתקציב-הצעדים (' + steps + ')'); this.name = 'BudgetError'; this.steps = steps; }
}
