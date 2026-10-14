// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/mockup-sandbox/src/components/ui/form.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forwardRef$body(children, error) {
    const body = error ? String(error?.message ?? "") : children;
    return body;
}

export const SIGS = {
  inner$forwardRef$body: [{"name":"children","d":{"t":"any"},"opt":false},{"name":"error","d":{"t":"any"},"opt":false}],
};
