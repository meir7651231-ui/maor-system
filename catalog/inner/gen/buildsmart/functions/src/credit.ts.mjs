// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/credit.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onCall$isManager(roles) {
    const isManager = roles.includes("manager") || roles.includes("admin");
    return isManager;
}
export function inner$onCall$name(request) {
    const data = (request.data ?? {});
    let name = typeof data.name === "string" && data.name.length > 0
        ? data.name
        : null;
    return name;
}
export function inner$onCall$name$$step(data) {
    let name = typeof data.name === "string" && data.name.length > 0
        ? data.name
        : null;
    return name;
}
export function inner$onCall$s(doc) {
    const s = doc.get("sum");
    return s;
}
export function inner$onCall$balance(creditLimit, used) {
    const balance = Math.min(Math.max(creditLimit - used, 0), creditLimit);
    return balance;
}
export function inner$onCall$pct(creditLimit, used) {
    const pct = creditLimit === 0
        ? 0
        : Math.min(Math.max(Math.round((used / creditLimit) * 100), 0), 100);
    return pct;
}

export const SIGS = {
  inner$onCall$isManager: [{"name":"roles","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$onCall$name: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$name$$step: [{"name":"data","d":{"t":"obj","n":"ComputeCreditData","p":[["name",{"t":"any"},true]]},"opt":false}],
  inner$onCall$s: [{"name":"doc","d":{"t":"any"},"opt":false}],
  inner$onCall$balance: [{"name":"creditLimit","d":{"t":"num"},"opt":false},{"name":"used","d":{"t":"num"},"opt":false}],
  inner$onCall$pct: [{"name":"creditLimit","d":{"t":"num"},"opt":false},{"name":"used","d":{"t":"num"},"opt":false}],
};
