// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/approve-member.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$approveMember$members(org, e) {
    const members = [...new Set([...(org.members ?? []).map((m) => m.trim().toLowerCase()), e])];
    return members;
}

export const SIGS = {
  inner$approveMember$members: [{"name":"org","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
};
