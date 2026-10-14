/**
 * 📐 מטיפוס לצורה (CATALOG-VERBS, 14.10.2026) — קורא את חתימת הפונקציה דרך המהדר של TypeScript (בלי להריץ)
 * ומתרגם כל פרמטר לצורה של shape.mjs: איחוד-מחרוזות ⇒ בחירה, Foo[] ⇒ רשימה של Foo, {a; b?} ⇒ אובייקט עם השדות.
 * כך הקלטים שהקורא מייצר דומים לקלטים האמיתיים (סטטוס מתוך האפשרויות, תאריך בשדה date…).
 */
import fs from 'node:fs';
import ts from 'typescript';
import { descFromKind } from './shape.mjs';

const MAX_PROPS = 40;
const MAX_DEPTH = 6;

export function makeProgram(files, extra = {}) {
  return ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true, checkJs: false, jsx: ts.JsxEmit.Preserve, strict: true, skipLibCheck: true, noEmit: true, resolveJsonModule: true, allowImportingTsExtensions: true,
    ...extra,
  });
}

function typeName(t) {
  const n = t.aliasSymbol?.name ?? t.symbol?.name;
  return n && !n.startsWith('__') ? n : undefined;
}

/** טיפוס ⇒ צורה. */
export function typeToDesc(checker, t, depth = 0, stack = new Set()) {
  if (!t || depth > MAX_DEPTH) return { t: 'any' };
  const F = ts.TypeFlags;
  const f = t.flags;
  if (f & (F.Any | F.Unknown)) return { t: 'any' };
  if (f & F.Never) return { t: 'undef' };
  if (f & F.Null) return { t: 'null' };
  if (f & (F.Undefined | F.Void)) return { t: 'undef' };
  if (f & F.BooleanLiteral) return { t: 'lit', v: [t.intrinsicName === 'true'] };
  if (f & F.StringLiteral) return { t: 'lit', v: [t.value] };
  if (f & F.NumberLiteral) return { t: 'lit', v: [t.value] };
  if (f & F.EnumLiteral && t.isUnion && t.isUnion()) return { t: 'lit', v: t.types.map((x) => x.value).filter((v) => v !== undefined) };
  if (t.isUnion && t.isUnion()) {
    const parts = t.types.map((x) => typeToDesc(checker, x, depth, stack));
    const lits = parts.filter((p) => p.t === 'lit');
    const rest = parts.filter((p) => p.t !== 'lit');
    const litVals = [...new Set(lits.flatMap((p) => p.v))];
    if (!rest.length) return litVals.length === 2 && litVals.every((v) => typeof v === 'boolean') ? { t: 'bool' } : { t: 'lit', v: litVals };
    const of = [];
    if (litVals.length) of.push(litVals.length === 2 && litVals.every((v) => typeof v === 'boolean') ? { t: 'bool' } : { t: 'lit', v: litVals });
    for (const p of rest) if (!of.some((q) => JSON.stringify(q) === JSON.stringify(p))) of.push(p);
    return of.length === 1 ? of[0] : { t: 'or', of };
  }
  if (f & F.StringLike) return { t: 'str' };
  if (f & (F.NumberLike | F.BigIntLike)) return { t: 'num' };
  if (f & F.BooleanLike) return { t: 'bool' };
  if (f & F.TypeParameter) {
    // פרמטר-טיפוס (M extends number|string): אותו ענף בכל הקלטים של אותו מקרה — times: M[] ו-now: M מאותו סוג
    const c = checker.getBaseConstraintOfType(t);
    return { t: 'tp', id: t.symbol?.name ?? 'T', of: c && c !== t ? typeToDesc(checker, c, depth, stack) : { t: 'any' } };
  }
  if (checker.isTupleType(t)) return { t: 'tup', of: (checker.getTypeArguments(t) ?? []).map((x) => typeToDesc(checker, x, depth + 1, stack)) };
  if (checker.isArrayType(t)) return { t: 'arr', of: typeToDesc(checker, checker.getTypeArguments(t)[0], depth + 1, stack) };
  if (!(f & F.Object) && !(t.isIntersection && t.isIntersection())) return { t: 'any' };
  const name = typeName(t);
  if (name === 'Date') return { t: 'date' };
  if (name === 'Promise' || name === 'PromiseLike') return { t: 'any' };
  if (name === 'Map' || name === 'ReadonlyMap') { const a = checker.getTypeArguments(t) ?? []; return { t: 'map', k: typeToDesc(checker, a[0], depth + 1, stack), v: typeToDesc(checker, a[1], depth + 1, stack) }; }
  if (name === 'Set' || name === 'ReadonlySet') { const a = checker.getTypeArguments(t) ?? []; return { t: 'set', of: typeToDesc(checker, a[0], depth + 1, stack) }; }
  if (name === 'RegExp' || name === 'HTMLElement' || name === 'Element' || name === 'Node' || name === 'Event' || name === 'Window' || name === 'Document') return { t: 'any' };
  const props = checker.getPropertiesOfType(t);
  if (t.getCallSignatures().length && !props.length) return { t: 'fn' };
  if (stack.has(t.id)) return { t: 'obj', n: name, p: [] };
  stack.add(t.id);
  try {
    const sIdx = checker.getIndexInfosOfType(t).find((ix) => ix.keyType.flags & F.String);
    if (sIdx && !props.length) return { t: 'rec', of: typeToDesc(checker, sIdx.type, depth + 1, stack) };
    const p = [];
    for (const s of props.slice(0, MAX_PROPS)) {
      const decl = s.valueDeclaration ?? s.declarations?.[0];
      const st = decl ? checker.getTypeOfSymbolAtLocation(s, decl) : checker.getDeclaredTypeOfSymbol(s);
      const opt = !!(s.flags & ts.SymbolFlags.Optional);
      p.push([s.name, typeToDesc(checker, st, depth + 1, stack), opt]);
    }
    return { t: 'obj', n: name, p };
  } finally {
    stack.delete(t.id);
  }
}

/** החתימה של חלק: [{name, d, opt}]. ייצוא · פונקציה פנימית ברמה העליונה (internal) · "מחלקה.מתודה" (method). */
export function signatureOf(program, absFile, symbol) {
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(absFile);
  if (!sf) return { why: 'no-source' };
  let type = null; let internal = false; let method = null;
  if (symbol.includes('.')) {
    const [cls, member] = symbol.split('.');
    const decl = topLevel(sf, cls);
    const node = decl && (ts.isClassDeclaration(decl) ? decl : decl.initializer && ts.isClassExpression(decl.initializer) ? decl.initializer : null);
    const m = node && node.members.find((x) => x.name && x.name.getText(sf) === member);
    if (!m) return { why: 'not-found' };
    const isStatic = !!(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static);
    type = checker.getTypeAtLocation(m);
    const mod = checker.getSymbolAtLocation(sf);
    const exported = !!(mod && checker.getExportsOfModule(mod).some((x) => x.name === cls));
    method = { cls, member, static: isStatic };
    internal = !exported;
  } else {
    const mod = checker.getSymbolAtLocation(sf);
    let sym = mod ? checker.getExportsOfModule(mod).find((s) => s.name === symbol) : undefined;
    if (sym) {
      if (sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
      const decl = sym.valueDeclaration ?? sym.declarations?.[0];
      if (!decl) return { why: 'no-decl' };
      type = checker.getTypeOfSymbolAtLocation(sym, decl);
    } else {
      const decl = topLevel(sf, symbol);
      if (!decl || !decl.name) return { why: 'not-found' };
      type = checker.getTypeAtLocation(decl.name);
      internal = true;
    }
  }
  const sig = type && type.getCallSignatures()[0];
  if (!sig) return { why: 'not-callable' };
  const takes = sig.getParameters().map((p) => {
    const pd = p.valueDeclaration ?? p.declarations?.[0];
    let pt = pd ? checker.getTypeOfSymbolAtLocation(p, pd) : checker.getAnyType();
    const rest = pd && ts.isParameter(pd) && !!pd.dotDotDotToken;
    const opt = pd && ts.isParameter(pd) ? !!(pd.questionToken || pd.initializer) || rest : false;
    if (rest) pt = checker.isArrayType(pt) ? checker.getTypeArguments(pt)[0] : pt;
    let name = p.name;
    if (name === '__0' || name === '__1') name = 'opts';
    return { name, d: typeToDesc(checker, pt), opt };
  });
  return { takes, internal, method, esm: isEsm(sf) };
}

/** הצהרה ברמה העליונה בשם הזה: function / class / const x = … */
function topLevel(sf, name) {
  for (const st of sf.statements) {
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name?.text === name) return st;
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) return d;
  }
  return null;
}
/** קובץ ESM (import/export ולא module.exports/require). */
function isEsm(sf) {
  const t = sf.text;
  return /^\s*(import|export)\s/m.test(t) && !/\bmodule\.exports\b|\brequire\s*\(/.test(t);
}

/** משלים צורה "any" מסוג-הקטלוג (JS בלי טיפוסים): {t:'any'} ⇒ descFromKind. */
export function fillFromKinds(takes, partTakes) {
  return takes.map((t, k) => {
    const pk = partTakes?.[k];
    if (t.d.t === 'any' && pk) return { ...t, d: descFromKind(pk.kind, t.name, pk.type) };
    return t;
  });
}
/** מילון-הקוד של קובץ: מחרוזות ומספרים שכתובים בו (סורק של TypeScript, בלי להריץ). ממוין — דטרמיניסטי. */
export function literalPool(abs) {
  const text = fs.readFileSync(abs, 'utf8');
  const sc = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const str = new Set(); const num = new Set();
  for (let k = sc.scan(); k !== ts.SyntaxKind.EndOfFileToken; k = sc.scan()) {
    if (k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral) { const v = sc.getTokenValue(); if (v.length <= 40 && !/[\n@]/.test(v)) str.add(v); }
    else if (k === ts.SyntaxKind.NumericLiteral) { const v = Number(sc.getTokenValue()); if (Number.isFinite(v)) num.add(v); }
  }
  return { str: [...str].sort().slice(0, 400), num: [...num].sort((a, b) => a - b).slice(0, 200) };
}

