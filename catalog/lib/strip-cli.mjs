/**
 * 🪞 SELF (14.10.2026) — מסיר מקוד של סקריפט את נקודת-הכניסה של שורת-הפקודה, כדי שהפונקציות שבו ייטענו בארגז-החול:
 *   · `if (…process.argv…) {…}` ברמה העליונה (ה-main של הסקריפט)
 *   · `await …;` ברמה העליונה (CJS לא תומך ב-await עליון; זה תמיד I/O: ensureGen, main)
 * הקובץ בדיסק לא משתנה. טהור.
 */
import ts from 'typescript';

export function stripCli(code) {
  const sf = ts.createSourceFile('x.mjs', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const cut = [];
  for (const s of sf.statements) {
    const argv = ts.isIfStatement(s) && /process\.argv|\bCHECK\b/.test(s.expression.getText(sf));
    const tla = ts.isExpressionStatement(s) && ts.isAwaitExpression(s.expression);
    if (argv || tla) cut.push([s.getStart(sf), s.getEnd()]);
  }
  if (!cut.length) return null;
  let out = '';
  let at = 0;
  for (const [a, b] of cut) { out += code.slice(at, a) + ';'; at = b; }
  return out + code.slice(at);
}
