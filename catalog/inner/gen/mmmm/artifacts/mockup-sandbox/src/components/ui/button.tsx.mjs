// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/mockup-sandbox/src/components/ui/button.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forwardRef$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "button";
    return Comp;
}

export const SIGS = {
  inner$forwardRef$Comp: [{"name":"asChild","d":{"t":"bool"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
};
