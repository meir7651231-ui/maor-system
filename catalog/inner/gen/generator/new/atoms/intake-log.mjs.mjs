// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intake-log.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$intakeLog$rows(db) {
    const rows = db.shopIntakes
        .map((intake) => ({ intake, itemName: db.shopItems.find((i) => i.id === intake.itemId)?.name ?? '—' }))
        .sort((a, b) => b.intake.date.localeCompare(a.intake.date));
    return rows;
}

export const SIGS = {
  inner$intakeLog$rows: [{"name":"db","d":{"t":"any"},"opt":false}],
};
