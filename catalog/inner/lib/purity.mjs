/**
 * 🔓 פותח-הפונקציות · כללי-הטוהר (INNER, 14.10.2026).
 * מה מותר בתוך ביטוי שמרימים החוצה: חשבון, Math.*, השוואות, תנאים, מתודות טהורות של מחרוזת/רשימה/מספר/תאריך,
 * קריאה לעוזר טהור מאותו קובץ. מה אסור (ולמה): await · this · שעון · אקראי · DOM/IO · קריאה לפונקציה לא-ידועה · שינוי של משהו מבחוץ.
 * הכול נקבע לפי הסמלים של המהדר (checker) — לא לפי שמות בלבד. טהור.
 */
import ts from 'typescript';

/** גלובליים שמותר לקרוא (ערכים/מרחבי-שמות בלי I/O). */
export const SAFE_GLOBALS = new Set([
  'Math', 'JSON', 'Number', 'String', 'Boolean', 'Object', 'Array', 'Infinity', 'NaN', 'undefined', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'BigInt', 'Date', 'RegExp', 'Map', 'Set',
  'Error', 'TypeError', 'RangeError', 'Intl', 'Symbol', 'Uint8Array', 'Int32Array', 'Float64Array', 'Float32Array', 'Uint32Array', 'Uint16Array', 'Int8Array', 'Int16Array',
]);
/** גלובליים שנוגעים בעולם — ערך שנוגע בהם לא מורם. */
const WORLD_GLOBALS = {
  window: 'dom', document: 'dom', navigator: 'dom', location: 'dom', localStorage: 'io', sessionStorage: 'io', indexedDB: 'io', fetch: 'io',
  XMLHttpRequest: 'io', WebSocket: 'io', console: 'io', process: 'io', require: 'io', globalThis: 'global', self: 'global', global: 'global',
  setTimeout: 'timer', setInterval: 'timer', clearTimeout: 'timer', clearInterval: 'timer', requestAnimationFrame: 'timer', cancelAnimationFrame: 'timer',
  queueMicrotask: 'timer', performance: 'clock', crypto: 'random', alert: 'dom', confirm: 'dom', prompt: 'dom', Audio: 'dom', Image: 'dom',
  AudioContext: 'dom', Worker: 'io', Buffer: 'io', module: 'io', exports: 'io', __dirname: 'io', __filename: 'io',
};
const SAFE_NEW = new Set(['Map', 'Set', 'Array', 'Error', 'TypeError', 'RangeError', 'RegExp', 'Uint8Array', 'Int32Array', 'Float64Array', 'Float32Array', 'Uint32Array', 'Uint16Array', 'Int8Array', 'Int16Array']);
const NS_PURE = {
  Math: (m) => m !== 'random',
  JSON: () => true,
  Number: () => true,
  String: (m) => m === 'fromCharCode' || m === 'fromCodePoint' || m === 'raw',
  Object: (m) => ['keys', 'values', 'entries', 'fromEntries', 'is', 'hasOwn', 'freeze', 'getOwnPropertyNames'].includes(m),
  Array: (m) => ['isArray', 'from', 'of'].includes(m),
  Date: (m) => m === 'UTC' || m === 'parse',
  Intl: () => true,
};
const STR = new Set(['slice', 'substring', 'substr', 'split', 'trim', 'trimStart', 'trimEnd', 'padStart', 'padEnd', 'toUpperCase', 'toLowerCase', 'replace', 'replaceAll',
  'includes', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'charAt', 'charCodeAt', 'codePointAt', 'concat', 'repeat', 'match', 'matchAll', 'search', 'normalize',
  'localeCompare', 'at', 'toString', 'valueOf', 'toLocaleUpperCase', 'toLocaleLowerCase']);
const NUM = new Set(['toFixed', 'toPrecision', 'toString', 'valueOf', 'toExponential', 'toLocaleString']);
const ARR = new Set(['map', 'filter', 'reduce', 'reduceRight', 'slice', 'concat', 'join', 'find', 'findIndex', 'findLast', 'findLastIndex', 'some', 'every', 'includes',
  'indexOf', 'lastIndexOf', 'flat', 'flatMap', 'at', 'keys', 'values', 'entries', 'forEach', 'toSorted', 'toReversed', 'with', 'toString']);
const MUT = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin', 'set', 'add', 'delete', 'clear']);
const MAPSET = new Set(['get', 'has', 'keys', 'values', 'entries', 'forEach']);
const DATE = /^(get[A-Z]\w*|toISOString|toJSON|valueOf|getTime|toDateString|toUTCString|toLocaleDateString|toLocaleTimeString|toLocaleString)$/;
const REGEX = new Set(['test', 'exec']);
/** כשאין טיפוס (JS בלי JSDoc): שמות שטהורים כמעט בכל מקבל. */
const ANY_SAFE = new Set([...STR, ...ARR, ...NUM, 'test', 'get', 'has']);
const FRESH = new Set(['map', 'filter', 'slice', 'concat', 'flat', 'flatMap', 'split', 'toSorted', 'toReversed', 'keys', 'values', 'entries', 'from', 'of', 'fromEntries']);
const FN_LIKE = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n) || ts.isConstructorDeclaration(n) || ts.isGetAccessorDeclaration(n) || ts.isSetAccessorDeclaration(n);
export const isFnLike = FN_LIKE;

const ASSIGN = new Set([ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken, ts.SyntaxKind.MinusEqualsToken, ts.SyntaxKind.AsteriskEqualsToken, ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken, ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.AmpersandEqualsToken, ts.SyntaxKind.BarEqualsToken, ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.AmpersandAmpersandEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken]);
export const isAssignOp = (k) => ASSIGN.has(k);

/** השורש של שרשרת a.b[c].d ⇒ a (או הצומת עצמו כשאינו מזהה). */
export function rootOf(e) {
  let x = e;
  for (;;) {
    if (ts.isPropertyAccessExpression(x) || ts.isElementAccessExpression(x) || ts.isNonNullExpression(x) || ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || (ts.isTypeAssertionExpression && ts.isTypeAssertionExpression(x)) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(x))) x = x.expression;
    else return x;
  }
}
const unwrap = (e) => {
  let x = e;
  while (x && (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(x)) || (ts.isTypeAssertionExpression && ts.isTypeAssertionExpression(x)))) x = x.expression;
  return x;
};
export { unwrap };

/** הסמל של מזהה בעמדת-ערך (כולל קיצור {x}). */
export function symbolOf(checker, id) {
  if (ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id) return checker.getShorthandAssignmentValueSymbol(id.parent);
  return checker.getSymbolAtLocation(id);
}
/** האם המזהה בעמדת-ערך (לא שם-מאפיין, לא מפתח, לא טיפוס, לא תווית). */
export function isValueRef(id) {
  const p = id.parent;
  if (!p) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return false;
  if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p) || ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === id) return false;
  if (ts.isBindingElement(p) && p.propertyName === id) return false;
  if ((ts.isLabeledStatement(p) || ts.isBreakStatement(p) || ts.isContinueStatement(p)) && p.label === id) return false;
  if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isClassDeclaration(p) || ts.isBindingElement(p) || ts.isImportSpecifier(p) || ts.isEnumMember(p)) && p.name === id) return false;
  if (ts.isJsxAttribute(p) || ts.isJsxOpeningElement(p) || ts.isJsxClosingElement(p) || ts.isJsxSelfClosingElement(p)) return false;
  if (ts.isMetaProperty(p)) return false;
  return true;
}

/** הצהרה של סמל ⇒ סיווג: param · var · fn · class · import · enum · global (+ הצומת). */
export function classify(checker, program, sf, sym, name) {
  if (!sym) return { k: 'global', name };
  if (sym.flags & ts.SymbolFlags.Alias) return { k: 'import', name };
  const decl = sym.valueDeclaration ?? sym.declarations?.[0];
  if (!decl) return { k: 'global', name };
  const dsf = decl.getSourceFile();
  if (dsf !== sf) return { k: dsf.isDeclarationFile || program.isSourceFileDefaultLibrary(dsf) || /node_modules/.test(dsf.fileName) ? 'global' : 'import', name };
  if (ts.isParameter(decl) || (ts.isBindingElement(decl) && paramOfBinding(decl))) return { k: 'param', decl };
  if (ts.isBindingElement(decl) || ts.isVariableDeclaration(decl)) {
    const vd = varDeclOf(decl);
    if (!vd) return { k: 'param', decl };
    const list = vd.parent;
    if (list && list.parent && (ts.isForOfStatement(list.parent) || ts.isForInStatement(list.parent))) return { k: 'param', decl, loop: true };
    if (ts.isCatchClause(vd.parent)) return { k: 'param', decl };
    return { k: 'var', decl, vd };
  }
  if (ts.isFunctionDeclaration(decl)) return { k: 'fn', decl };
  if (ts.isClassDeclaration(decl) || ts.isClassExpression(decl)) return { k: 'class', decl };
  if (ts.isEnumDeclaration(decl) || ts.isEnumMember(decl)) return { k: 'enum', decl };
  if (ts.isImportClause(decl) || ts.isNamespaceImport(decl) || ts.isImportSpecifier(decl) || ts.isImportEqualsDeclaration(decl)) return { k: 'import', name };
  if (ts.isShorthandPropertyAssignment(decl) || ts.isPropertyAssignment(decl)) return { k: 'global', name };
  return { k: 'other', decl };
}
function paramOfBinding(b) {
  let x = b;
  while (x && (ts.isBindingElement(x) || ts.isObjectBindingPattern(x) || ts.isArrayBindingPattern(x))) x = x.parent;
  return x && ts.isParameter(x);
}
export function varDeclOf(b) {
  let x = b;
  while (x && (ts.isBindingElement(x) || ts.isObjectBindingPattern(x) || ts.isArrayBindingPattern(x))) x = x.parent;
  return x && ts.isVariableDeclaration(x) ? x : null;
}
/** הפונקציה (או הקובץ) שבתוכה הצומת. */
export function homeOf(n) {
  let x = n.parent;
  while (x && !FN_LIKE(x) && !ts.isSourceFile(x) && !ts.isClassStaticBlockDeclaration?.(x)) x = x.parent;
  return x;
}
export const within = (n, root) => n.pos >= root.pos && n.end <= root.end && n.getSourceFile() === root.getSourceFile();

/** סוג המקבל של קריאת-מתודה: str · num · arr · mapset · date · regex · any · obj. */
function recvKind(checker, e) {
  let t;
  try { t = checker.getTypeAtLocation(e); } catch { return 'any'; }
  if (!t) return 'any';
  const F = ts.TypeFlags;
  const one = (x) => {
    if (x.flags & (F.Any | F.Unknown)) return 'any';
    if (x.flags & F.StringLike) return 'str';
    if (x.flags & F.NumberLike) return 'num';
    if (checker.isArrayType(x) || checker.isTupleType(x)) return 'arr';
    const n = x.symbol?.name ?? x.aliasSymbol?.name;
    if (n === 'Map' || n === 'Set' || n === 'ReadonlyMap' || n === 'ReadonlySet' || n === 'WeakMap') return 'mapset';
    if (n === 'Date') return 'date';
    if (n === 'RegExp') return 'regex';
    if (n === 'String') return 'str';
    if (n === 'Array' || n === 'ReadonlyArray') return 'arr';
    return 'obj';
  };
  if (t.isUnion && t.isUnion()) {
    const ks = [...new Set(t.types.filter((x) => !(x.flags & (F.Null | F.Undefined | F.Void))).map(one))];
    return ks.length === 1 ? ks[0] : ks.includes('any') ? 'any' : 'mixed';
  }
  return one(t);
}

/**
 * בודק-הטוהר. root = הצומת שנבדק (ביטוי, לולאה או גוף-עוזר). מחזיר null (טהור) או סיבה.
 * ctx: { checker, program, sf, mutable: Set<symbol> (מותר לשנות — מצטברים), helper(decl) ⇒ null|סיבה }
 */
export function impurity(root, ctx) {
  const { checker, program, sf } = ctx;
  const isLocal = (sym) => {
    const d = sym && (sym.valueDeclaration ?? sym.declarations?.[0]);
    return !!d && d.getSourceFile() === sf && within(d, root);
  };
  const canMutate = (target) => {
    const r = rootOf(target);
    if (ts.isArrayLiteralExpression(r) || ts.isObjectLiteralExpression(r)) return true;
    if (ts.isCallExpression(r) && ts.isPropertyAccessExpression(r.expression) && FRESH.has(r.expression.name.text)) return true;
    if (!ts.isIdentifier(r)) return false;
    const s = symbolOf(checker, r);
    if (!s) return false;
    if (ctx.mutable && ctx.mutable.has(s)) return true;
    if (!isLocal(s)) return false;
    // שינוי של פרמטר עצמו (y -= 1) מותר; שינוי *תוכן* של פרמטר (obj.x = …) משנה את הקלט של מי שקרא
    const d = s.valueDeclaration ?? s.declarations?.[0];
    if (target !== r && d && (ts.isParameter(d) || (ts.isBindingElement(d) && paramOfBinding(d)))) return false;
    return true;
  };
  let why = null;
  const fail = (w) => { if (!why) why = w; };
  const visit = (n) => {
    if (why) return;
    if (ts.isTypeNode(n) && !ts.isExpressionWithTypeArguments?.(n)) return;
    switch (n.kind) {
      case ts.SyntaxKind.AwaitExpression: case ts.SyntaxKind.YieldExpression: return fail('await');
      case ts.SyntaxKind.ThisKeyword: case ts.SyntaxKind.SuperKeyword: return fail('this');
      case ts.SyntaxKind.JsxElement: case ts.SyntaxKind.JsxSelfClosingElement: case ts.SyntaxKind.JsxFragment: return fail('jsx');
      case ts.SyntaxKind.ClassExpression: case ts.SyntaxKind.ClassDeclaration: return fail('class');
      case ts.SyntaxKind.TaggedTemplateExpression: return fail('unknown-call');
      case ts.SyntaxKind.DeleteExpression: if (!canMutate(n.expression)) return fail('mutation'); break;
      default: break;
    }
    if (FN_LIKE(n) && n !== root && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) return fail('await');
    if (FN_LIKE(n) && n === root && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) return fail('await');
    if (FN_LIKE(n) && n.asteriskToken) return fail('await');
    if (ts.isBinaryExpression(n) && ASSIGN.has(n.operatorToken.kind)) {
      const L = unwrap(n.left);
      if (ts.isObjectLiteralExpression(L) || ts.isArrayLiteralExpression(L)) { /* פירוק-השמה: כל יעד נבדק כמזהה */
        for (const el of L.elements ?? L.properties ?? []) { const t = ts.isShorthandPropertyAssignment(el) ? el.name : ts.isPropertyAssignment(el) ? el.initializer : el; if (t && !canMutate(t)) return fail('mutation'); }
      } else if (!canMutate(L)) return fail('mutation');
    }
    if ((ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) {
      if (!canMutate(n.operand)) return fail('mutation');
    }
    if (ts.isNewExpression(n)) {
      const c = unwrap(n.expression);
      const nm = ts.isIdentifier(c) ? c.text : ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression) && c.expression.text === 'Intl' ? 'Intl' : null;
      if (nm === 'Date') { if (!n.arguments || n.arguments.length === 0) return fail('clock'); }
      else if (nm === 'Intl') { /* Intl.DateTimeFormat וכו' — דטרמיניסטי לקלט */ }
      else if (!nm || !SAFE_NEW.has(nm) || resolvesLocal(checker, sf, c)) return fail('new');
    }
    if (ts.isCallExpression(n)) {
      const w = callWhy(n, ctx, canMutate);
      if (w) return fail(w);
    }
    if (ts.isIdentifier(n) && isValueRef(n)) {
      const s = symbolOf(checker, n);
      const c = classify(checker, program, sf, s, n.text);
      if (c.k === 'global') {
        if (WORLD_GLOBALS[n.text]) return fail(WORLD_GLOBALS[n.text]);
        if (!SAFE_GLOBALS.has(n.text)) return fail('global');
      }
      if (c.k === 'class') return fail('class');
    }
    ts.forEachChild(n, visit);
  };
  visit(root);
  return why;
}
function resolvesLocal(checker, sf, id) {
  if (!ts.isIdentifier(id)) return false;
  const s = checker.getSymbolAtLocation(id);
  const d = s && (s.valueDeclaration ?? s.declarations?.[0]);
  return !!d && d.getSourceFile() === sf;
}

/** סיבה שקריאה אינה טהורה (או null). */
function callWhy(n, ctx, canMutate) {
  const { checker, program, sf } = ctx;
  const callee = unwrap(n.expression);
  if (ts.isIdentifier(callee)) {
    const s = symbolOf(checker, callee);
    const c = classify(checker, program, sf, s, callee.text);
    if (c.k === 'global') {
      if (WORLD_GLOBALS[callee.text]) return WORLD_GLOBALS[callee.text];
      if (['Number', 'String', 'Boolean', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'BigInt', 'Array', 'Symbol'].includes(callee.text)) return null;
      if (callee.text === 'Date') return 'clock';
      return 'global-call';
    }
    if (c.k === 'import') return 'imported-call';
    if (c.k === 'fn') return ctx.helper(c.decl);
    if (c.k === 'var') {
      const init = c.vd.initializer && unwrap(c.vd.initializer);
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && ts.isIdentifier(c.vd.name)) return ctx.helper(c.vd);
      return 'unknown-call';
    }
    if (c.k === 'param') return 'unknown-call';
    return 'unknown-call';
  }
  if (ts.isPropertyAccessExpression(callee)) {
    const m = callee.name.text;
    const recv = unwrap(callee.expression);
    if (ts.isIdentifier(recv)) {
      const s = symbolOf(checker, recv);
      const c = classify(checker, program, sf, s, recv.text);
      if (c.k === 'global' && NS_PURE[recv.text]) {
        if (recv.text === 'Math' && m === 'random') return 'random';
        if (recv.text === 'Date' && m === 'now') return 'clock';
        return NS_PURE[recv.text](m) ? null : 'method-call';
      }
      if (c.k === 'global' && WORLD_GLOBALS[recv.text]) return WORLD_GLOBALS[recv.text];
      if (c.k === 'global' && recv.text === 'Date' && m === 'now') return 'clock';
      if (c.k === 'import') return 'imported-call';
    }
    if (ts.isPropertyAccessExpression(recv) && ts.isIdentifier(recv.expression) && recv.expression.text === 'performance') return 'clock';
    if (MUT.has(m)) {
      const k = recvKind(checker, recv);
      if (k === 'str' && (m === 'at')) return null;
      return canMutate(recv) ? null : 'mutation';
    }
    if (m === 'then' || m === 'catch' || m === 'finally') return 'await';
    const k = recvKind(checker, recv);
    if (k === 'str') return STR.has(m) ? null : 'method-call';
    if (k === 'num') return NUM.has(m) ? null : 'method-call';
    if (k === 'arr') return ARR.has(m) ? null : 'method-call';
    if (k === 'mapset') return MAPSET.has(m) ? null : 'method-call';
    if (k === 'date') return DATE.test(m) ? null : 'method-call';
    if (k === 'regex') return REGEX.has(m) ? null : 'method-call';
    if (k === 'any' || k === 'mixed') return ANY_SAFE.has(m) ? null : 'method-call';
    if (k === 'obj' && (m === 'hasOwnProperty' || m === 'toString' || m === 'valueOf')) return null;
    return 'method-call';
  }
  return 'unknown-call';
}

/** "קריאה בלבד": מזהה / שרשרת-מאפיינים / ליטרל — אין חישוב. */
export function isPureRead(e) {
  const x = unwrap(e);
  if (!x) return true;
  if (ts.isIdentifier(x) || ts.isLiteralExpression(x) || x.kind === ts.SyntaxKind.TrueKeyword || x.kind === ts.SyntaxKind.FalseKeyword || x.kind === ts.SyntaxKind.NullKeyword || ts.isNoSubstitutionTemplateLiteral(x)) return true;
  if (ts.isPropertyAccessExpression(x)) return isPureRead(x.expression);
  if (ts.isElementAccessExpression(x)) return isPureRead(x.expression) && isPureRead(x.argumentExpression);
  if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(x.operand)) return true;
  return false;
}

/** חישוב "לא טריוויאלי": חשבון · Math.* · השוואה · תנאי · קריאה לעוזר · מתודה טהורה · תבנית עם ערכים. */
export function isComputation(e) {
  let yes = false;
  const visit = (n) => {
    if (yes) return;
    if (ts.isTypeNode(n)) return;
    if (ts.isBinaryExpression(n)) {
      const k = n.operatorToken.kind;
      if (k !== ts.SyntaxKind.CommaToken && k !== ts.SyntaxKind.QuestionQuestionToken && k !== ts.SyntaxKind.BarBarToken && k !== ts.SyntaxKind.AmpersandAmpersandToken) { yes = true; return; }
    }
    if (ts.isConditionalExpression(n) || ts.isCallExpression(n) || ts.isTemplateExpression(n)) { yes = true; return; }
    if (ts.isPrefixUnaryExpression(n) && (n.operator === ts.SyntaxKind.MinusToken || n.operator === ts.SyntaxKind.TildeToken) && !ts.isNumericLiteral(n.operand)) { yes = true; return; }
    if (FN_LIKE(n)) return;
    ts.forEachChild(n, visit);
  };
  visit(e);
  return yes;
}
