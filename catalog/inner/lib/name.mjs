/**
 * 🔓 שם עברי בלי-עולם לחלק פנימי (INNER, 14.10.2026) — נקבע **מצורת החישוב** (איזה פעולה בשורש הביטוי),
 * לא משם-המשתנה ולא מהעולם של הקובץ. "decl" ⇒ "מחשב זווית מיחס"; "pulse" ⇒ "מחשב גל שעולה ויורד".
 * זה תיאור, לא הוכחה: הפעלים נקבעים רק בהרצה (prove.mjs). טהור.
 */
import ts from 'typescript';
import { unwrap } from './purity.mjs';

const has = (n, pred) => { let y = false; const v = (x) => { if (y) return; if (pred(x)) { y = true; return; } ts.forEachChild(x, v); }; v(n); return y; };
const mathCall = (n, ...ms) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === 'Math' && ms.includes(n.expression.name.text);
const trig = (n) => has(n, (x) => mathCall(x, 'sin', 'cos'));
const isZero = (e) => { const x = unwrap(e); return ts.isNumericLiteral(x) && Number(x.text) === 0; };
const isLit = (e) => { const x = unwrap(e); return ts.isNumericLiteral(x) || ts.isStringLiteral(x) || (ts.isPrefixUnaryExpression(x) && ts.isNumericLiteral(x.operand)); };

const METHOD = {
  map: 'ממיר כל פריט ברשימה', flatMap: 'ממיר כל פריט ברשימה ומשטח', filter: 'מסנן רשימה לפי תנאי', reduce: 'מצמצם רשימה לערך אחד', reduceRight: 'מצמצם רשימה לערך אחד',
  sort: 'ממיין רשימה', toSorted: 'ממיין רשימה', find: 'מוצא פריט ברשימה', findLast: 'מוצא פריט ברשימה', findIndex: 'מוצא את המקום של פריט', some: 'בודק אם יש פריט מתאים',
  every: 'בודק אם כל הפריטים מתאימים', includes: 'בודק אם ערך נמצא', join: 'מצרף רשימה לטקסט', split: 'מפצל טקסט לחלקים', slice: 'מחלץ חלק מרצף', substring: 'מחלץ חלק מטקסט',
  substr: 'מחלץ חלק מטקסט', trim: 'מנקה רווחים מטקסט', replace: 'מחליף חלק בטקסט', replaceAll: 'מחליף חלקים בטקסט', toUpperCase: 'ממיר אותיות', toLowerCase: 'ממיר אותיות',
  padStart: 'ממלא טקסט לאורך קבוע', padEnd: 'ממלא טקסט לאורך קבוע', indexOf: 'מוצא את המקום של ערך', lastIndexOf: 'מוצא את המקום של ערך', concat: 'מצרף רצפים',
  toFixed: 'מעגל לספרות קבועות', startsWith: 'בודק איך טקסט מתחיל', endsWith: 'בודק איך טקסט נגמר', match: 'מחפש תבנית בטקסט', test: 'בודק תבנית בטקסט', flat: 'ממיר רשימה של רשימות לרשימה אחת',
  keys: 'מפרק רשומה לרשימה', values: 'מפרק רשומה לרשימה', entries: 'מפרק רשומה לרשימה', fromEntries: 'בונה רשומה מרשימה', stringify: 'ממיר ערך לטקסט', parse: 'מפענח טקסט לערך',
  get: 'מחפש ערך לפי מפתח', has: 'בודק אם מפתח קיים', at: 'מחלץ פריט לפי מקום', repeat: 'משכפל טקסט', charCodeAt: 'ממיר אות למספר', localeCompare: 'משווה שני טקסטים',
  getTime: 'ממיר תאריך למספר', toISOString: 'כותב תאריך כטקסט', UTC: 'ממיר תאריך למספר',
};

/** שם לביטוי. */
export function exprName(e) {
  const x = unwrap(e);
  if (!x) return 'מחשב ערך מערכים';
  if (ts.isConditionalExpression(x)) return 'בוחר ערך לפי תנאי';
  if (ts.isTemplateExpression(x)) return 'מרכיב טקסט מערכים';
  if (ts.isArrayLiteralExpression(x)) return 'בונה רשימה מערכים';
  if (ts.isObjectLiteralExpression(x)) return 'בונה רשומה מערכים';
  if (ts.isNewExpression(x)) return ts.isIdentifier(x.expression) && x.expression.text === 'Date' ? 'בונה תאריך מערך' : 'בונה ערך חדש';
  if (ts.isPrefixUnaryExpression(x)) {
    if (x.operator === ts.SyntaxKind.ExclamationToken) return 'הופך כן ללא';
    if (x.operator === ts.SyntaxKind.MinusToken) return 'הופך סימן של מספר';
    return exprName(x.operand);
  }
  if (ts.isPropertyAccessExpression(x) && x.name.text === 'length') return 'סופר פריטים';
  if (ts.isCallExpression(x)) {
    if (mathCall(x, 'max') && x.arguments.some(isZero)) return 'מגביל לאפס ומעלה';
    if (mathCall(x, 'min') && x.arguments.some((a) => mathCall(unwrap(a), 'max'))) return 'מגביל לטווח';
    if (mathCall(x, 'max') && x.arguments.some((a) => mathCall(unwrap(a), 'min'))) return 'מגביל לטווח';
    if (mathCall(x, 'max')) return 'בוחר את הגדול מבין ערכים';
    if (mathCall(x, 'min')) return 'בוחר את הקטן מבין ערכים';
    if (mathCall(x, 'round')) return 'מעגל מספר';
    if (mathCall(x, 'floor')) return 'מעגל מספר כלפי מטה';
    if (mathCall(x, 'ceil')) return 'מעגל מספר כלפי מעלה';
    if (mathCall(x, 'trunc')) return 'מעגל מספר לשלם';
    if (mathCall(x, 'hypot')) return 'מודד מרחק בין שתי נקודות';
    if (mathCall(x, 'sqrt')) return has(x, (y) => ts.isBinaryExpression(y) && (y.operatorToken.kind === ts.SyntaxKind.AsteriskToken || y.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskToken)) ? 'מודד מרחק בין שתי נקודות' : 'מחשב שורש של מספר';
    if (mathCall(x, 'sin', 'cos')) return 'מחשב גל שעולה ויורד';
    if (mathCall(x, 'atan2')) return 'מחשב זווית מכיוון';
    if (mathCall(x, 'asin', 'acos', 'atan')) return 'מחשב זווית מיחס';
    if (mathCall(x, 'tan')) return 'מחשב שיפוע מזווית';
    if (mathCall(x, 'abs')) return 'מחשב ערך מוחלט';
    if (mathCall(x, 'exp', 'pow')) return 'מחשב גדילה בחזקה';
    if (mathCall(x, 'log', 'log2', 'log10')) return 'מחשב לוגריתם של מספר';
    if (mathCall(x, 'sign')) return 'מחשב סימן של מספר';
    const c = unwrap(x.expression);
    if (ts.isIdentifier(c)) {
      if (['Number', 'parseInt', 'parseFloat'].includes(c.text)) return 'ממיר ערך למספר';
      if (c.text === 'String') return 'ממיר ערך לטקסט';
      if (c.text === 'Boolean') return 'ממיר ערך לכן או לא';
      // עוזר שעוטף חישוב אחד (deg(Math.acos(…))) ⇒ השם של מה שבפנים
      const inner = x.arguments.length === 1 ? unwrap(x.arguments[0]) : null;
      if (inner && (ts.isCallExpression(inner) || ts.isBinaryExpression(inner) || ts.isConditionalExpression(inner))) return exprName(inner);
      return 'מחשב ערך בעזרת חישוב עזר';
    }
    if (ts.isPropertyAccessExpression(c) && Object.hasOwn(METHOD, c.name.text)) return METHOD[c.name.text];
    if (ts.isPropertyAccessExpression(c) && /^get[A-Z]/.test(c.name.text)) return 'מחלץ חלק מתאריך';
    return 'מחשב ערך מערכים';
  }
  if (ts.isBinaryExpression(x)) {
    const k = x.operatorToken.kind; const K = ts.SyntaxKind;
    if ([K.LessThanToken, K.GreaterThanToken, K.LessThanEqualsToken, K.GreaterThanEqualsToken].includes(k)) return isLit(x.left) || isLit(x.right) ? 'בודק אם ערך עובר סף' : 'משווה שני ערכים';
    if ([K.EqualsEqualsEqualsToken, K.EqualsEqualsToken, K.ExclamationEqualsEqualsToken, K.ExclamationEqualsToken].includes(k)) return 'בודק אם שני ערכים שווים';
    if (k === K.AmpersandAmpersandToken || k === K.BarBarToken) return has(x, (y) => ts.isBinaryExpression(y) && [K.LessThanToken, K.GreaterThanToken, K.LessThanEqualsToken, K.GreaterThanEqualsToken, K.EqualsEqualsEqualsToken, K.ExclamationEqualsEqualsToken].includes(y.operatorToken.kind)) ? 'בודק כמה תנאים יחד' : 'בוחר ערך ראשון שקיים';
    if (k === K.QuestionQuestionToken) return 'בוחר ערך ראשון שקיים';
    if (k === K.PercentToken) return 'מחשב שארית במחזור';
    if (k === K.AsteriskAsteriskToken) return 'מחשב גדילה בחזקה';
    if (k === K.PlusToken || k === K.MinusToken) {
      // מרכז ± cos(θ)·r ⇒ נקודה על מעגל; c ± a·sin(…) ⇒ גל סביב ערך
      const side = (s) => { const y = unwrap(s); return ts.isBinaryExpression(y) && y.operatorToken.kind === K.AsteriskToken && trig(y); };
      if ((side(x.left) || side(x.right)) && has(x, (y) => mathCall(y, 'sin', 'cos') && !isLit(y.arguments[0]))) {
        const ang = has(x, (y) => mathCall(y, 'sin', 'cos') && !has(y.arguments[0], (z) => ts.isBinaryExpression(z) && z.operatorToken.kind === K.AsteriskToken && (isLit(z.left) || isLit(z.right))));
        return ang ? 'מחשב נקודה על מעגל' : 'מחשב גל שעולה ויורד';
      }
      if (has(x, (y) => ts.isStringLiteral(y) || ts.isTemplateExpression(y) || ts.isNoSubstitutionTemplateLiteral(y))) return 'מרכיב טקסט מערכים';
      return k === K.PlusToken ? 'מחבר ערכים' : 'מחשב הפרש בין ערכים';
    }
    if (k === K.AsteriskToken) return has(x, (y) => ts.isBinaryExpression(y) && y.operatorToken.kind === K.SlashToken) ? 'מכפיל ערך ביחס' : trig(x) ? 'מחשב גל שעולה ויורד' : 'מכפיל ערכים';
    if (k === K.SlashToken) return 'מחשב יחס בין ערכים';
    if ([K.AmpersandToken, K.BarToken, K.CaretToken, K.LessThanLessThanToken, K.GreaterThanGreaterThanToken, K.GreaterThanGreaterThanGreaterThanToken].includes(k)) return 'מחשב ביטים של מספר';
    if (k === K.InKeyword) return 'בודק אם מפתח קיים';
    if (k === K.InstanceOfKeyword) return 'בודק סוג של ערך';
  }
  if (ts.isTypeOfExpression(x)) return 'בודק סוג של ערך';
  return 'מחשב ערך מערכים';
}

/** שם למצטבר-אחרי-לולאה. */
function accName(L, ret) {
  const K = ts.SyntaxKind;
  let op = '';
  const visit = (n) => {
    if (op) return;
    if (ts.isIfStatement(n) && ts.isBinaryExpression(unwrap(n.expression))) {
      const k = unwrap(n.expression).operatorToken.kind;
      const assigns = has(n.thenStatement, (y) => ts.isBinaryExpression(y) && y.operatorToken.kind === K.EqualsToken && ts.isIdentifier(y.left) && y.left.text === ret);
      if (assigns && (k === K.LessThanToken || k === K.LessThanEqualsToken)) op = 'min';
      else if (assigns && (k === K.GreaterThanToken || k === K.GreaterThanEqualsToken)) op = 'max';
    }
    if (ts.isBinaryExpression(n) && ts.isIdentifier(n.left) && n.left.text === ret) {
      if (n.operatorToken.kind === K.PlusEqualsToken) op = op || 'sum';
      if (n.operatorToken.kind === K.AsteriskEqualsToken) op = op || 'prod';
    }
    if ((ts.isPostfixUnaryExpression(n) || ts.isPrefixUnaryExpression(n)) && ts.isIdentifier(n.operand) && n.operand.text === ret) op = op || 'count';
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === ret) {
      const m = n.expression.name.text;
      if (m === 'push' || m === 'unshift') op = op || 'collect';
      else if (m === 'set' || m === 'add') op = op || 'index';
    }
    ts.forEachChild(n, visit);
  };
  visit(L.statement ?? L);
  return {
    min: 'בוחר את הפריט עם הערך הקטן ביותר', max: 'בוחר את הפריט עם הערך הגדול ביותר', sum: 'מסכם ערכים לאורך רשימה', prod: 'מכפיל ערכים לאורך רשימה',
    count: 'סופר פריטים מתאימים ברשימה', collect: 'אוסף פריטים לרשימה חדשה', index: 'בונה מפתח של פריטים',
  }[op] ?? 'מעדכן ערך לאורך רשימה';
}

/** שם למעטפת-זמן. */
function envelopeName(env) {
  const tiny = env.events.some((e) => e.m === 'exp' && Math.abs(Number(e.args[0].getText())) > 0 && Math.abs(Number(e.args[0].getText())) < 0.01);
  if (tiny) return 'מחשב ערך שדועך לשקט לאורך זמן';
  if (env.events.some((e) => e.m === 'exp')) return 'מחשב ערך שמשתנה בחזקה לאורך זמן';
  if (env.events.some((e) => e.m === 'target')) return 'מחשב ערך שמתקרב ליעד לאורך זמן';
  return 'מחשב ערך שמשתנה בקו ישר לאורך זמן';
}

export function nameOf(L) {
  if (L.kind === 'envelope') return envelopeName(L.envelope);
  if (L.kind === 'accumulator') return accName(L.init, L.ret);
  return exprName(L.init);
}

export function doesOf(L) {
  const where = [L.top, ...L.mids].join(' ⟵ ');
  const what = L.kind === 'envelope' ? `ציר-הזמן של ${L.recv}` : L.kind === 'accumulator' ? `הערך של "${L.value}" אחרי הלולאה` : `הערך-בדרך "${L.value}"`;
  const form = L.form === 'step' ? 'הנוסחה עצמה, הקלטים הם מה שהיא קוראת' : 'עם כל מה שהוא תלוי בו';
  return `${what} מתוך ${where} (שורה ${L.line}), כפונקציה טהורה — ${form}.`.slice(0, 238);
}
