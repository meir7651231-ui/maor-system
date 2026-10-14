// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/data/identity.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const RANKS = [
    { key: 'new', name: 'קבלן חדש', ic: '🔰', min: 0, color: '#8b8d8f', perk: 'גישה מלאה לקטלוג ולעץ המוצרים החכם' },
    { key: 'regular', name: 'קבלן קבוע', ic: '🔨', min: 3, color: '#1f8a4c', perk: '2% הנחה על כל הזמנה · עדיפות בזמני משלוח' },
    { key: 'pref', name: 'קבלן מועדף', ic: '⭐', min: 8, color: '#f2a516', perk: '5% הנחה · משלוח אקספרס חינם פעם בשבוע' },
    { key: 'plat', name: 'קבלן פלטינום', ic: '💎', min: 15, color: '#1f6f6b', perk: '8% הנחה · אקספרס חינם תמיד · מנהל לקוח אישי' },
];
export function inner$currentRank$r$$after_loop(orders) {
    let r = RANKS[0];
    for (const x of RANKS) {
        if (orders >= x.min)
            r = x;
    }
    return r;
}

export const SIGS = {
  inner$currentRank$r$$after_loop: [{"name":"orders","d":{"t":"num"},"opt":false}],
};
