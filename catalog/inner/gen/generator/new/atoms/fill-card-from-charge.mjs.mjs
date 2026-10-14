// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/fill-card-from-charge.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fillCardFromCharge$rawPhone(charge) {
    const rawPhone = (charge.phone || '').trim();
    return rawPhone;
}
export function inner$fillCardFromCharge$email(charge) {
    const email = (charge.email || '').trim();
    return email;
}
export function inner$fillCardFromCharge$name(charge) {
    const name = (charge.name || '').trim();
    return name;
}

export const SIGS = {
  inner$fillCardFromCharge$rawPhone: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$fillCardFromCharge$email: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$fillCardFromCharge$name: [{"name":"charge","d":{"t":"any"},"opt":false}],
};
