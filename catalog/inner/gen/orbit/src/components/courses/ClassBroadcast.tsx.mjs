// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/ClassBroadcast.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ClassBroadcast$withPhone(contacts) {
    const withPhone = contacts.filter((c) => c.phone);
    return withPhone;
}

export const SIGS = {
  inner$ClassBroadcast$withPhone: [{"name":"contacts","d":{"t":"arr","of":{"t":"obj","n":"ClassContact","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false]]}},"opt":false}],
};
