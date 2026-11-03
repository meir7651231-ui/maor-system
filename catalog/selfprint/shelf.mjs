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
