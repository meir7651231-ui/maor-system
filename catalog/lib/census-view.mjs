/**
 * 🧽 «מנרמל» למפקד (SPEED1000, 14.10.2026) — המפקד של אורביט (catalog/scripts/orbit-census.mjs) קורא הערות: JSDoc ותיאור
 * לפני פונקציה מיוצאת (docOf), טיפוסי-JSDoc בקובצי JS, הגוף של פונקציה מיוצאת (CLOCK_CODE), וטקסט של כינויי-טיפוס.
 * כל הערה **אחרת** — בתוך פונקציה/קבוע שלא מיוצאים, בין הצהרות פנימיות, בראש-הקובץ לפני ה-import — לא משנה את הפלט שלו.
 *
 * censusView = הטקסט בלי ההערות האלה (lib/blank.mjs › blankComments, אותם כללי-רווח, השורות נשמרות). נשמרות:
 *   · `/**` (JSDoc — בכל מקום) · `///`, `@ts-…`, `@jsx` (הנחיות-מהדר);
 *   · כל הערה בתוך הצהרה עליונה **מיוצאת** או **כינוי-טיפוס / ממשק** — כולל הטריוויה שלפניה (ההערה המובילה).
 * קבצי-בדיקה (`.test.` · `__tests__`) והמנועים המחוללים (`engines/generated`) — כמו שהם (המפקד קורא אותם כטקסט).
 *
 * הבונה-מחדש טובע את קלט-המפקד בגרסה הזו ⇒ שינוי-הערה פנימית (כמו בשורה 16 של src/lib/hebrewNumber.ts) לא מריץ את המפקד.
 * ההוכחה (ratchet: speed1000.test): `CENSUS_VIEW=1 orbit-census --check` — המפקד שקורא **רק** את הגרסה הזו מוציא בדיוק
 * את catalog/sources/orbit.json; ומוטנט (הערה מובילה של פונקציה מיוצאת נמחקת) נתפס.
 */
import ts from 'typescript';
import { blankComments } from './blank.mjs';

const CODE = /\.(ts|tsx|mts|cts|mjs|js|cjs)$/;
export const isCensusViewable = (file) => CODE.test(file) && !/\.d\.[mc]?ts$/.test(file) && !/[\\/]node_modules[\\/]|\.test\.|[\\/]__tests__[\\/]|[\\/]engines[\\/]generated[\\/]/.test(file);

/** הטווחים [pos, end] של ההצהרות העליונות שהמפקד קורא את ההערות שלהן (מיוצאות · כינוי-טיפוס · ממשק). */
export function keptSpans(text, fileName) {
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : /\.[mc]?jsx?$/.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false, kind);
  const out = [];
  for (const st of sf.statements) {
    const exported = (ts.canHaveModifiers(st) ? ts.getModifiers(st) ?? [] : []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (exported || ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st)) out.push([st.pos, st.end]);
  }
  return out;
}

/** הטקסט שהמפקד "רואה": כמו המקור, בלי ההערות שלא משנות לו. קובץ שאינו קוד / בדיקה / מחולל ⇒ כמו שהוא. */
export function censusView(text, fileName) {
  if (!isCensusViewable(fileName)) return text;
  const spans = keptSpans(text, fileName);
  let k = 0;
  // הטווחים ממוינים וההערות עולות ⇒ מעבר אחד
  return blankComments(text, fileName, (s, e, c) => {
    if (c.startsWith('/**')) return true;
    while (k < spans.length && spans[k][1] < e) k++;
    return k < spans.length && spans[k][0] <= s && e <= spans[k][1];
  });
}

/** המוטנט של הבדיקה: כל ההערות (גם JSDoc וגם המובילות) — המפקד במצב הזה חייב לצאת שונה. */
export const blankAll = (text, fileName) => blankComments(text, fileName);
