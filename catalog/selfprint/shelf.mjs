/**
 * 🗄️ המדף של מנוע-השרטוטים-העצמי — "מה נכנס, מה מחליף, מה כפול" (חולץ מ-selfprint.mjs, SHELF-FIX 3.11.2026).
 *
 * offer(shelf, t, cx) — דבר חדש t (כבר נמדד: fp/steps/outs) מוצע למדף. shelf = Map מפתח ⇒ דבר.
 *   מחזיר { kind, cur?, c? }: 'new' · 'replaced' · 'stressRejected' · 'extraRejected' · 'dup'.
 * cx: { better(a,b), stressSamples(t), stressOuts(t), stressCompare(S,xs,ys), extraDiffers(t,cur) } — כלי-המנוע.
 *
 * בלי הדגל (cx.variants חסר) — ההתנהגות של היום, מילה במילה: המדף ממופתח לפי הטביעה על הסט הקבוע בלבד. מי שנכנס ראשון
 * תופס את המקום; מועמד עם אותה טביעה נכנס רק אם הוא זול יותר **וזהה בלחץ**. ⇒ הבאג (RECIPES2 §3): גרסה שגויה-בלחץ שנכנסה
 * ראשונה לא נדחקת לעולם, גם כשגרסה נכונה מגיעה ("הממוצע" — סכום x/n במקום סכום÷n: ‎−5.55e-17 במקום 0‎ ברשימה של 100).
 *
 * החלטת-מנהל (3.11): השורש אינו המדף אלא **הסרגל** — ‎−5.55e-17‎ ו-0 הם אותה תשובה; canon/sameOut (grow/lib.mjs) עיגלו
 * ל-12 ספרות יחסיות בלבד. התיקון = budget.numTol (רצפה ליד אפס, grow/lib.mjs › setNumTol). המדף נשאר כמו שהוא; עם הדגל
 * selfprint.mjs רק **סופר** מועמדים בעלי אותה טביעה שנזרקו/נדחו כשהם שונים בלחץ באמת (stressDiffer) — להחלטה הבאה.
 */
export function offer(shelf, t, cx) {
  if (cx.variants) return offerVariants(shelf, t, cx);
  const cur = shelf.get(t.fp);
  if (!cur) { shelf.set(t.fp, t); return { kind: 'new' }; }
  if (cx.better(t, cur) < 0) {
    const c = cx.stressCompare(cx.stressSamples(t), cx.stressOuts(t), cx.stressOuts(cur));
    if (!c.same) return { kind: 'stressRejected', cur, c };
    if (cx.extraDiffers(t, cur)) return { kind: 'extraRejected', cur };
    shelf.set(t.fp, t);
    return { kind: 'replaced', cur };
  }
  return { kind: 'dup', cur };
}

/* ═══════════════ SHELF-V (9.11.2026) · כמה גרסאות לכל טביעה — דגל budget.shelfVariants = { max } ═══════════════
 * המונה של r2t (§5 בדוח SHELF-FIX) מצא ~1,500 מועמדים עם אותה טביעה שנזרקו/נדחו כשהם **שונים באמת** בלחץ — ביניהם
 * "מקסימום" שרץ על רשימה של 500 כשזה שעל המדף נגמר לו תקציב-הצעדים. זהות-התנהגות על המדף = הסט הקבוע **וגם** הלחץ:
 *   - לכל טביעה עד max גרסאות; גרסה = פלטים זהים (cx.sameOut) על כל קלטי-הלחץ. הראשונה במפתח fp, הבאות fp~1, fp~2…
 *   - מועמד שזהה-בלחץ לגרסה קיימת ⇒ בדיוק כמו היום מולה (זול + לחץ + 200 אקראיים ⇒ מחליף; אחרת כפול).
 *   - שונה-בלחץ מכל הגרסאות ⇒ גרסה חדשה ('variant') — אם רץ על לפחות חצי מקלטי-הלחץ (אחרת כפול why=noRun) ויש מקום
 *     (אחרת כפול why=cap). לא מכריעים "מי נכון" — אין למנוע אמת; המתאר והמדידה בוחרים מבין הגרסאות.
 * cx.index = Map טביעה ⇒ מפתחות-הגרסאות (מתמלא כאן); cx.sameOut. */

/** מפתחות-הגרסאות של טביעה על המדף, בסדר-כניסה. */
export function versionKeys(shelf, fp, index) { return index.get(fp) || (shelf.has(fp) ? [fp] : []); }
/** האם הדבר הזה על המדף (גרסה ⇒ t.skey; דבר מהצמיחה ⇒ הטביעה). */
export const onShelf = (shelf, t) => shelf.get(t.skey ?? t.fp) === t;
const sameAll = (a, b, eq) => a.length === b.length && a.every((v, i) => eq(v, b[i]));
/** הגרסה על המדף שזהה ל-t גם בסט וגם בלחץ (או undefined). */
export function sameVersion(shelf, t, cx) {
  const so = cx.stressOuts(t);
  for (const k of versionKeys(shelf, t.fp, cx.index)) { const v = shelf.get(k); if (sameAll(cx.stressOuts(v), so, cx.sameOut)) return { k, v }; }
  return undefined;
}
function offerVariants(shelf, t, cx) {
  const keys = versionKeys(shelf, t.fp, cx.index);
  if (!keys.length) { shelf.set(t.fp, t); t.skey = t.fp; return { kind: 'new' }; }
  const hit = sameVersion(shelf, t, cx);
  if (hit) {
    const cur = hit.v;
    if (cx.better(t, cur) < 0) {
      const c = cx.stressCompare(cx.stressSamples(t), cx.stressOuts(t), cx.stressOuts(cur));
      if (!c.same) return { kind: 'stressRejected', cur, c };
      if (cx.extraDiffers(t, cur)) return { kind: 'extraRejected', cur };
      shelf.set(hit.k, t); t.skey = hit.k;
      return { kind: 'replaced', cur };
    }
    return { kind: 'dup', cur };
  }
  const cur = shelf.get(keys[0]);
  const so = cx.stressOuts(t);
  if (so.filter((v) => v !== null).length * 2 < so.length) return { kind: 'dup', cur, why: 'noRun' };
  if (keys.length >= cx.variants.max) return { kind: 'dup', cur, why: 'cap' };
  const nk = t.fp + '~' + keys.length;
  shelf.set(nk, t); t.skey = nk; cx.index.set(t.fp, [...keys, nk]);
  return { kind: 'variant', cur };
}
