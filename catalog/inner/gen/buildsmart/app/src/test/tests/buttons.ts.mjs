// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/test/tests/buttons.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$behaviorCheck$behaviorOne$target(before) {
    const target = before === 'manager' ? 'contractor' : 'manager';
    return target;
}
export function inner$behaviorCheck$behaviorOne$beforeCart(cart) {
    const beforeCart = cart.value.map((l) => ({ ...l }));
    return beforeCart;
}

export const SIGS = {
  inner$behaviorCheck$behaviorOne$target: [{"name":"before","d":{"t":"any"},"opt":false}],
  inner$behaviorCheck$behaviorOne$beforeCart: [{"name":"cart","d":{"t":"any"},"opt":false}],
};
