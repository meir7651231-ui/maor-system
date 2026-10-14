// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/remove-member.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$removeMember$members(org, e) {
    const members = (org.members ?? []).map((m) => m.trim().toLowerCase()).filter((m) => m !== e);
    return members;
}

export const SIGS = {
  inner$removeMember$members: [{"name":"org","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
};
