// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/bs/bs-dial.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TILES = [
    { id: 'contractor', label: 'קבלן', emoji: '👷' },
    { id: 'manager', label: 'מנהל המערכת', emoji: '👔' },
    { id: 'store', label: 'חנות ספק', emoji: '🏪' },
    { id: 'courier', label: 'שליח', emoji: '🛵' },
    { id: 'worker', label: 'עובד', emoji: '🦺' },
];
const STORE_SECTIONS = [
    {
        id: 's-home',
        emoji: '🏠',
        title: 'בית',
        children: [
            { id: 'sh-prep', emoji: '🔧', title: 'בהכנה' },
            { id: 'sh-ready', emoji: '📦', title: 'מוכן לאיסוף' },
            { id: 'sh-revenue', emoji: '💰', title: 'מחזור פעיל' },
        ],
    },
    {
        id: 's-orders',
        emoji: '📥',
        title: 'הזמנות',
        /* @legacy soChip filters @ :17310-17313 (verbatim labels) + emoji
         * sourced from store shStat @17128-17132 (same module): */
        children: [
            { id: 'so-new', emoji: '📥', title: 'לאישור' },
            { id: 'so-prep', emoji: '🔧', title: 'בהכנה' },
            { id: 'so-ready', emoji: '📦', title: 'מוכנות' },
        ],
    },
    {
        id: 's-stock',
        emoji: '📦',
        title: 'מלאי',
        /* @legacy md-pmeta status labels @ :17914 — both verbatim:
         *   '✅ זמין במלאי' / '❌ אזל — מוסתר מהקבלן'. */
        children: [
            { id: 'ss-in', emoji: '✅', title: 'זמין במלאי' },
            { id: 'ss-out', emoji: '❌', title: 'אזל' },
        ],
    },
    {
        id: 's-portal',
        emoji: '🧰',
        title: 'פורטל',
        children: [
            { id: 'sp-ratings', emoji: '⭐', title: 'דירוג ספקים' },
            { id: 'sp-sla', emoji: '⏱️', title: 'מעקב SLA' },
            { id: 'sp-zones', emoji: '🗺️', title: 'אזורי הפצה' },
            { id: 'sp-bulk', emoji: '📉', title: 'הנחות כמות' },
            { id: 'sp-barcode', emoji: '🏷️', title: 'הפקת ברקודים' },
            { id: 'sp-fleet', emoji: '🚛', title: 'ניהול צי רכב' },
            { id: 'sp-chat', emoji: '💬', title: 'צ׳אט עם קבלן' },
            { id: 'sp-autostk', emoji: '🔄', title: 'עדכון מלאי' },
        ],
    },
];
const COURIER_SECTIONS = [
    {
        id: 'vehicle',
        emoji: '🛵',
        title: 'הרכב שלי היום',
        children: [
            { id: 'haul-small', emoji: '🛵', title: 'משלוח קטן' },
            { id: 'haul-van', emoji: '🚐', title: 'טנדר' },
            { id: 'haul-truck', emoji: '🚛', title: 'משאית' },
        ],
    },
    { id: 'pickup', emoji: '📦', title: 'משלוחים ממתינים לאיסוף' },
    {
        id: 'active',
        emoji: '🚚',
        title: 'משלוחים פעילים',
        /* @legacy ch-btn labels in renderCourierList @ :18112-18114 — verbatim
         * action buttons per stage (each emoji + label is one literal string): */
        children: [
            { id: 'ca-pickup', emoji: '📦', title: 'אספתי מהחנות' },
            { id: 'ca-transit', emoji: '🚚', title: 'יצאתי לדרך' },
            { id: 'ca-delivered', emoji: '✅', title: 'נמסר ללקוח' },
        ],
    },
    {
        id: 'portal',
        emoji: '🧰',
        title: 'פורטל השליח',
        children: [
            { id: 'cp-nav', emoji: '🧭', title: 'ניווט למשלוח' },
            { id: 'cp-fleet', emoji: '🚛', title: 'צי רכב' },
            { id: 'cp-sla', emoji: '⏱️', title: 'מעקב SLA' },
            { id: 'cp-zones', emoji: '🗺️', title: 'אזורי הפצה' },
            { id: 'cp-pod', emoji: '📸', title: 'אישור מסירה' },
            { id: 'cp-chat', emoji: '💬', title: 'צ׳אט עם חנות' },
        ],
    },
];
const ST_PENDING = { id: 'st-pending', emoji: '⏳', title: 'ממתינה' };
const ST_ACTIVE = { id: 'st-active', emoji: '🔨', title: 'בביצוע' };
const ST_REVIEW = { id: 'st-review', emoji: '📸', title: 'ממתין לאישור' };
const ST_DONE = { id: 'st-done', emoji: '✅', title: 'אושר ✓' };
const ST_REJECTED = { id: 'st-rejected', emoji: '↩️', title: 'נדחה — לתקן' };
const WORKER_SECTIONS = [
    { id: 'current', emoji: '🔨', title: 'המשימה הנוכחית שלך', children: [ST_ACTIVE, ST_REJECTED] },
    { id: 'queue', emoji: '⏳', title: 'הבאות בתור', children: [ST_PENDING] },
    { id: 'submitted', emoji: '📋', title: 'שהגשת', children: [ST_REVIEW, ST_DONE] },
];
const MANAGER_SECTIONS = [
    {
        id: 'm-products',
        emoji: '📊',
        title: 'לוח בקרה',
        children: [
            { id: 'md-open-orders', emoji: '🚚', title: 'הזמנות פתוחות' },
            { id: 'md-catalog', emoji: '📦', title: 'מוצרים בקטלוג' },
            { id: 'md-accessories', emoji: '🧰', title: 'אביזרים נלווים' },
            { id: 'md-available', emoji: '✅', title: 'זמינים כעת' },
            { id: 'md-stores', emoji: '🏪', title: 'חנויות פעילות' },
        ],
    },
    {
        id: 'm-orders',
        emoji: '🚚',
        title: 'הזמנות',
        /* @legacy ORDER_FLOW @ index.html:16943 + ORDER_STAGE labels @ :12041-12048.
         * Emoji sourced from related legacy contexts:
         *   📥 from store admTab "📥 הזמנות" @4261 (intake)
         *   🔧 from store shStat 'בהכנה' @17129
         *   📦 from store shStat 'מוכן לאיסוף' @17130 / courier chStat 'לאיסוף' @18033
         *   🚛 from HAUL_TYPES truck @11953 (vehicle taken)
         *   🚚 from courier chStat 'בדרך' @18034
         *   ✅ from courier chStat 'נמסרו' @18035 */
        children: [
            { id: 'mo-new', emoji: '📥', title: 'התקבלה' },
            { id: 'mo-preparing', emoji: '🔧', title: 'בהכנה' },
            { id: 'mo-ready', emoji: '📦', title: 'מוכן לאיסוף' },
            { id: 'mo-pickup', emoji: '🚛', title: 'נאסף' },
            { id: 'mo-transit', emoji: '🚚', title: 'בדרך לאתר' },
            { id: 'mo-delivered', emoji: '✅', title: 'נמסר ✓' },
        ],
    },
    {
        id: 'm-customers',
        emoji: '👥',
        title: 'לקוחות',
        /* @legacy mc-pill labels @ :16608 + msd-tag @ :16617.
         * 🟢 קבלן פעיל verbatim @ :16617. ⚠️ ניצול אשראי גבוה verbatim @ :16617. */
        children: [
            { id: 'mc-live', emoji: '🟢', title: 'פעיל' },
            { id: 'mc-low', emoji: '⚠️', title: 'אשראי גבוה' },
        ],
    },
    {
        id: 'm-manage',
        emoji: '🛠️',
        title: 'ניהול',
        /* @legacy index.html:16653-16745 — mmSection(key, ic, title, ...)
         * calls of renderMgrManage. emoji + title verbatim from each. */
        children: [
            { id: 'mm-trees', emoji: '🌳', title: 'עץ המוצרים' },
            { id: 'mm-brands', emoji: '🏷️', title: 'מותגים ומחירים' },
            { id: 'mm-cats', emoji: '🗂️', title: 'קטגוריות' },
            { id: 'mm-settings', emoji: '⚙️', title: 'הגדרות אפליקציה' },
        ],
    },
];
const PERSONA_SECTIONS = {
    store: STORE_SECTIONS,
    courier: COURIER_SECTIONS,
    worker: WORKER_SECTIONS,
    manager: MANAGER_SECTIONS,
};
function walkBsDrill(persona, path) {
    const anchors = [];
    let current = PERSONA_SECTIONS[persona] ?? [];
    for (const label of path) {
        const node = current.find((s) => s.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return { anchors, current };
}
export function inner$walkBsDrill$node(current, label) {
    const node = current.find((s) => s.title === label);
    return node;
}
export function inner$BsDial$tile(drilled) {
    const tile = TILES.find((t) => t.id === drilled);
    return tile;
}
export function inner$BsDial$anchors(drilled, path) {
    const { anchors, current } = walkBsDrill(drilled, path);
    return anchors;
}
export function inner$BsDial$current(drilled, path) {
    const { anchors, current } = walkBsDrill(drilled, path);
    return current;
}
export function inner$BsDial$map$hasChildren(s) {
    const hasChildren = !!s.children && s.children.length > 0;
    return hasChildren;
}
export function inner$walkBsDrill$anchors$$after_loop(persona, path) {
    const anchors = [];
    let current = PERSONA_SECTIONS[persona] ?? [];
    for (const label of path) {
        const node = current.find((s) => s.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return anchors;
}
export function inner$walkBsDrill$current$$after_loop(persona, path) {
    const anchors = [];
    let current = PERSONA_SECTIONS[persona] ?? [];
    for (const label of path) {
        const node = current.find((s) => s.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return current;
}

export const SIGS = {
  inner$walkBsDrill$node: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"Section","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Section","p":[]}}]},true]]}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$BsDial$tile: [{"name":"drilled","d":{"t":"any"},"opt":false}],
  inner$BsDial$anchors: [{"name":"drilled","d":{"t":"any"},"opt":false},{"name":"path","d":{"t":"any"},"opt":false}],
  inner$BsDial$current: [{"name":"drilled","d":{"t":"any"},"opt":false},{"name":"path","d":{"t":"any"},"opt":false}],
  inner$BsDial$map$hasChildren: [{"name":"s","d":{"t":"obj","n":"Section","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Section","p":[]}}]},true]]},"opt":false}],
  inner$walkBsDrill$anchors$$after_loop: [{"name":"persona","d":{"t":"lit","v":["contractor","manager","store","courier","worker"]},"opt":false},{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkBsDrill$current$$after_loop: [{"name":"persona","d":{"t":"lit","v":["contractor","manager","store","courier","worker"]},"opt":false},{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
