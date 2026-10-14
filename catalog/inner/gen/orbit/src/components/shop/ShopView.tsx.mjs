// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/shop/ShopView.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ShopView$active(tab, calendarOn, showcaseOn) {
    const tabs = [
        { key: 'catalog', label: '🛍 קטלוג', on: true },
        { key: 'beneficiaries', label: '👥 מוטבים', on: true },
        { key: 'care', label: '🏠 טיפול', on: true },
        { key: 'calendar', label: '📅 לוח', on: calendarOn },
        { key: 'showcase', label: '🖼 ראווה', on: showcaseOn },
    ];
    const active = tabs.find((t) => t.key === tab && t.on) ? tab : 'catalog';
    return active;
}
export function inner$ShopView$active$$step(tab, tabs) {
    const active = tabs.find((t) => t.key === tab && t.on) ? tab : 'catalog';
    return active;
}

export const SIGS = {
  inner$ShopView$active: [{"name":"tab","d":{"t":"lit","v":["calendar","catalog","beneficiaries","care","showcase"]},"opt":false},{"name":"calendarOn","d":{"t":"bool"},"opt":false},{"name":"showcaseOn","d":{"t":"bool"},"opt":false}],
  inner$ShopView$active$$step: [{"name":"tab","d":{"t":"lit","v":["calendar","catalog","beneficiaries","care","showcase"]},"opt":false},{"name":"tabs","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"lit","v":["calendar","catalog","beneficiaries","care","showcase"]},false],["label",{"t":"str"},false],["on",{"t":"bool"},false]]}},"opt":false}],
};
