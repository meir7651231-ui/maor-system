// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/remove-org-member.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$removeOrgMember$variants(email) {
    const variants = [...new Set([email.trim(), email.trim().toLowerCase()])];
    return variants;
}

export const SIGS = {
  inner$removeOrgMember$variants: [{"name":"email","d":{"t":"any"},"opt":false}],
};
