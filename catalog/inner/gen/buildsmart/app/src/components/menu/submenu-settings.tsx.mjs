// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/menu/submenu-settings.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SETTINGS_SUB = {
    account: [
        { label: 'שם הקבלן' },
        { label: 'טלפון' },
        { label: 'סוג עוסק' },
        { label: 'תחום מקצועי' },
    ],
    notifications: [
        { label: 'עדכוני משלוחים' },
        { label: 'מבצעים והטבות' },
        { label: 'התראות תקציב' },
        { label: 'עדכוני הזמנות' },
    ],
    display: [
        {
            label: 'ערכת נושא',
            children: [{ label: 'בהיר' }, { label: 'כהה' }],
        },
        {
            label: 'גודל טקסט',
            children: [{ label: 'קטן' }, { label: 'בינוני' }, { label: 'גדול' }],
        },
        { label: 'הפחתת אנימציות' },
    ],
    accessibility: [
        { label: 'מצב ניגודיות גבוהה (לשמש)' },
    ],
    security: [
        {
            label: 'מרכז האבטחה',
            children: [
                { label: 'אימות דו-שלבי' },
                {
                    label: 'הרשאות גישה',
                    children: [
                        { label: 'קבלן' },
                        { label: 'מנהל מערכת' },
                        { label: 'ספק / חנות' },
                        { label: 'שליח' },
                        { label: 'עובד' },
                    ],
                },
                { label: 'כניסה ביומטרית' },
                { label: 'יומן ביקורת' },
                { label: 'הרשאת מיקום' },
                {
                    label: 'נעילת הפעלה',
                    children: [
                        { label: '5 דק׳' },
                        { label: '15 דק׳' },
                        { label: '30 דק׳' },
                        { label: '60 דק׳' },
                    ],
                },
                {
                    label: 'הצפנת נתונים',
                    children: [
                        { label: 'תקשורת מוצפנת (HTTPS/TLS)' },
                        { label: 'נתונים מקומיים מוגנים' },
                        { label: 'סיסמאות מאוחסנות כ-Hash' },
                        { label: 'גיבוי מוצפן בענן' },
                    ],
                },
                { label: 'היסטוריית כניסות' },
                { label: 'ניהול מכשירים' },
                {
                    label: 'בקרת פרטיות',
                    children: [
                        { label: 'שיתוף נתוני שימוש' },
                        { label: 'שירותי מיקום' },
                        { label: 'התאמת תוכן שיווקי' },
                        { label: 'שליחת דוחות תקלה' },
                    ],
                },
            ],
        },
    ],
    support: [
        {
            label: 'מרכז השירות',
            children: [
                { label: 'מוקד תמיכה' },
                { label: 'צ׳אטבוט' },
                { label: 'דיווח על באג' },
                { label: 'המרת מידות' },
                {
                    label: 'מחשבון כמויות',
                    children: [
                        { label: 'אריחים' },
                        { label: 'צבע' },
                        { label: 'בטון' },
                    ],
                },
                { label: 'סנכרון יומן' },
                { label: 'לוח דרושים' },
                {
                    label: 'סיור היכרות',
                    children: [
                        { label: 'מסך הבית' },
                        { label: 'הזמנה' },
                        { label: 'תקציב' },
                        { label: 'משימות ואתר' },
                        { label: 'מועדון BuildSmart' },
                        { label: 'מוכנים!' },
                    ],
                },
            ],
        },
    ],
    delivery: [
        {
            label: 'סוג הובלה מועדף',
            children: [{ label: 'משלוח קטן' }, { label: 'טנדר' }, { label: 'משאית' }],
        },
        { label: 'ברירת מחדל — משלוח אקספרס' },
        { label: 'אמצעי תשלום' },
    ],
    region: [
        {
            label: 'שפה',
            children: [{ label: 'עברית' }, { label: 'العربية' }, { label: 'English' }],
        },
        {
            label: 'יחידות מידה',
            children: [{ label: 'מטרי (מ׳, ק״ג)' }, { label: 'אימפריאלי' }],
        },
        {
            label: 'מטבע',
            children: [{ label: '₪ שקל' }, { label: '$ דולר' }],
        },
    ],
    about: [
        { label: 'גרסה' },
        { label: 'תנאי שימוש' },
        { label: 'מדיניות פרטיות' },
        { label: 'יצירת קשר' },
    ],
};
function leafKey(group, path, label) {
    return [group, ...path, label].join('>');
}
const PROFILE_TREE = [
    {
        label: 'כרטיס קבלן',
        children: [
            { label: 'אתה במצב הדגמה' },
            {
                label: 'המספרים שלך',
                children: [
                    { label: 'הזמנות' },
                    { label: 'אתרים פעילים' },
                    { label: 'עצי מוצרים' },
                    { label: 'אביזרים שהעץ הציל' },
                ],
            },
            { label: 'סך הרכש דרך BuildSmart' },
        ],
    },
    {
        label: 'דרגות הקבלן',
        children: [
            { label: 'ההטבה שלך' },
            {
                label: 'הישגים',
                children: [
                    { label: 'הזמנה ראשונה' },
                    { label: '10 הזמנות' },
                    { label: 'ריבוי אתרים' },
                    { label: 'חובב עץ מוצרים' },
                    { label: 'לא שוכח כלום' },
                    { label: 'מחזור ₪10K' },
                ],
            },
            {
                label: 'מועדון BuildSmart',
                /* @legacy openRewardsHub items @ index.html:21464-21471 — 7
                 * tiles, each ic + t verbatim. The original hub also has an
                 * rwAchievements item which the legacy itself removed (the
                 * profile screen already renders identityAchievements). */
                children: [
                    { label: 'אתגרים חודשיים' },
                    { label: 'לוח מובילים' },
                    { label: 'תגי ירוק' },
                    { label: 'קופונים לפי מיקום' },
                    { label: 'הזמן חבר' },
                    { label: 'מועדון VIP' },
                    { label: 'מימוש הטבות' },
                ],
            },
        ],
    },
];
function walkProfile(path) {
    const anchors = [];
    let current = PROFILE_TREE;
    for (const label of path) {
        const node = current.find((n) => n.label === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return { anchors, current };
}
const HOME_LEAVES = [
    {
        id: 'home-ai',
        emoji: '🤖',
        title: 'בינה מלאכותית ואוטומציה',
        /* @legacy openAIHub items @ index.html:21125-21133 — each item has
         * ic + t, both used verbatim. */
        children: [
            { id: 'ai-stock', emoji: '📦', title: 'חיזוי מלאי' },
            { id: 'ai-barcode', emoji: '📷', title: 'סורק ברקוד' },
            { id: 'ai-voice', emoji: '🎙️', title: 'דיבור למשימה' },
            { id: 'ai-alt', emoji: '💡', title: 'חלופות זולות' },
            { id: 'ai-plan', emoji: '📐', title: 'סריקת תוכניות' },
            { id: 'ai-3way', emoji: '🔗', title: 'התאמה משולשת' },
            { id: 'ai-weather', emoji: '🌦️', title: 'אוטומציית מזג אוויר' },
            { id: 'ai-wear', emoji: '🔧', title: 'זיהוי בלאי' },
            { id: 'ai-analytics', emoji: '📊', title: 'Analytics חכם' },
        ],
    },
    {
        id: 'home-scan',
        emoji: '📐',
        title: 'סרוק תוכנית עבודה',
        /* @legacy PLAN_TYPES @ index.html:9659-9728 — 4 plan categories,
         * each with icon + label verbatim. */
        children: [
            { id: 'plan-plumbing', emoji: '🚿', title: 'אינסטלציה' },
            { id: 'plan-electric', emoji: '⚡', title: 'חשמל' },
            { id: 'plan-arch', emoji: '🏛️', title: 'אדריכלות' },
            { id: 'plan-finish', emoji: '🎨', title: 'גמר' },
        ],
    },
    {
        id: 'home-stock',
        emoji: '📦',
        title: 'המלאי שלי',
        /* @legacy view-stock stock-tabs @ index.html:5183-5184 —
         * 2 stock tabs with ic + label embedded. */
        children: [
            { id: 'stock-warehouse', emoji: '🏬', title: 'המחסן' },
            { id: 'stock-site', emoji: '🏗️', title: 'האתר' },
        ],
    },
    {
        id: 'home-tasks',
        emoji: '📋',
        title: 'משימות העבודה',
        /* @legacy openSiteHub items @ index.html:19858-19868 — 10 site
         * management tools, each with ic + t verbatim. The hub itself is
         * "ניהול אתר הבנייה" (per :5217). */
        children: [
            { id: 'site-gantt', emoji: '📅', title: 'תרשים גאנט' },
            { id: 'site-snag', emoji: '🔧', title: 'רשימת ליקויים' },
            { id: 'site-loc', emoji: '🏢', title: 'קומה · דירה · חדר' },
            { id: 'site-attend', emoji: '📍', title: 'נוכחות GPS' },
            { id: 'site-diary', emoji: '📓', title: 'יומן עבודה' },
            { id: 'site-safety', emoji: '🦺', title: 'התראות בטיחות' },
            { id: 'site-deps', emoji: '🔗', title: 'תלויות חומרים' },
            { id: 'site-photos', emoji: '📸', title: 'צילום לפני/אחרי' },
            { id: 'site-inspect', emoji: '🔍', title: 'ביקורות מפקח' },
            { id: 'site-archive', emoji: '🗄️', title: 'ארכיון פרויקטים' },
        ],
    },
];
function walkHome(path) {
    const anchors = [];
    let current = HOME_LEAVES;
    for (const label of path) {
        const node = current.find((h) => h.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return { anchors, current };
}
const CART_TOP = [
    { id: 'cart-mine', emoji: '🛒', title: 'הסל שלי' },
    {
        id: 'cart-orders', emoji: '📦', title: 'ההזמנות שלי',
        /* @legacy index.html:5074-5081 — ca-svc buttons in view-orders. */
        children: [
            { id: 'svc-rental', emoji: '🔧', title: 'השכרת כלים' },
            { id: 'svc-deposits', emoji: '💰', title: 'פקדונות' },
            { id: 'svc-return', emoji: '↩️', title: 'החזרה חדשה' },
            { id: 'svc-rfq', emoji: '📨', title: 'מכרז ספקים' },
            { id: 'svc-msds', emoji: '🧪', title: 'גיליונות בטיחות' },
            { id: 'svc-compare', emoji: '📊', title: 'השוואת מחירים' },
        ],
    },
];
function walkCart(path) {
    const anchors = [];
    let current = CART_TOP;
    for (const label of path) {
        const node = current.find((c) => c.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return { anchors, current };
}
export function inner$walkSettings$node(current, label) {
    const node = current.find((n) => n.label === label);
    return node;
}
export function inner$SettingsSubmenu$rows(SETTINGS_ROWS) {
    const rows = [...SETTINGS_ROWS].reverse();
    return rows;
}
export function inner$SettingsTreeSubmenu$parent(SETTINGS_ROWS, group) {
    const parent = SETTINGS_ROWS.find((r) => r.id === group);
    return parent;
}
export function inner$SettingsTreeSubmenu$reversed(nodes) {
    const reversed = [...nodes].reverse();
    return reversed;
}
export function inner$SettingsTreeSubmenu$map$key(group, pathPrefix, node) {
    const key = leafKey(group, pathPrefix, node.label);
    return key;
}
export function inner$SettingsTreeSubmenu$map$isEditing(group, pathPrefix, editingKey, node, binding) {
    const key = leafKey(group, pathPrefix, node.label);
    const isEditing = binding?.input && editingKey === key;
    return isEditing;
}
export function inner$SettingsTreeSubmenu$map$isEditing$$step(editingKey, key, binding) {
    const isEditing = binding?.input && editingKey === key;
    return isEditing;
}
export function inner$LeafEditor$commit$trimmed(raw) {
    const trimmed = raw.trim();
    return trimmed;
}
export function inner$action$tail(s, n) {
    const tail = n
        ? ` · ${n.min - s.orders} עד ${n.ic} ${n.name}`
        : ' · הדרגה הגבוהה ביותר';
    return tail;
}
export function inner$walkProfile$node(current, label) {
    const node = current.find((n) => n.label === label);
    return node;
}
export function inner$ProfileTreeSubmenu$current(path) {
    const { current } = walkProfile(path);
    return current;
}
export function inner$ProfileTreeSubmenu$reversed(path) {
    const { current } = walkProfile(path);
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$ProfileTreeSubmenu$reversed$$step(current) {
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$ProfileTreeSubmenu$branchIcon(ICON_PROFILE, PROFILE_BRANCH_ICON, path) {
    const branchIcon = path.length > 0
        ? PROFILE_BRANCH_ICON[path[0]] ?? ICON_PROFILE
        : ICON_PROFILE;
    return branchIcon;
}
export function inner$ProfileTreeSubmenu$map$leafKey(path, node) {
    const leafKey = [...path, node.label].join('>');
    return leafKey;
}
export function inner$walkHome$node(current, label) {
    const node = current.find((h) => h.title === label);
    return node;
}
export function inner$HomeSubmenu$anchors(path) {
    const { anchors, current } = walkHome(path);
    return anchors;
}
export function inner$HomeSubmenu$current(path) {
    const { anchors, current } = walkHome(path);
    return current;
}
export function inner$HomeSubmenu$reversed(path) {
    const { anchors, current } = walkHome(path);
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$HomeSubmenu$reversed$$step(current) {
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$HomeSubmenu$map$hasChildren(h) {
    const hasChildren = !!h.children && h.children.length > 0;
    return hasChildren;
}
export function inner$walkCart$node(current, label) {
    const node = current.find((c) => c.title === label);
    return node;
}
export function inner$CartSubmenu$anchors(path) {
    const { anchors, current } = walkCart(path);
    return anchors;
}
export function inner$CartSubmenu$current(path) {
    const { anchors, current } = walkCart(path);
    return current;
}
export function inner$CartSubmenu$reversed(path) {
    const { anchors, current } = walkCart(path);
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$CartSubmenu$reversed$$step(current) {
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$CartSubmenu$map$hasChildren(c) {
    const hasChildren = !!c.children && c.children.length > 0;
    return hasChildren;
}
export function inner$walkProjects$node(current, label) {
    const node = current.find((p) => p.title === label);
    return node;
}
export function inner$ProjectsSubmenu$reversed(current) {
    const reversed = [...current].reverse();
    return reversed;
}
export function inner$ProjectsSubmenu$map$hasChildren(p) {
    const hasChildren = !!p.children && p.children.length > 0;
    return hasChildren;
}
export function inner$ProjectsSubmenu$map$usesEmoji(p) {
    const hasChildren = !!p.children && p.children.length > 0;
    const usesEmoji = p.emoji !== '🏗️' || hasChildren;
    return usesEmoji;
}
export function inner$ProjectsSubmenu$map$usesEmoji$$step(p, hasChildren) {
    const usesEmoji = p.emoji !== '🏗️' || hasChildren;
    return usesEmoji;
}
export function inner$walkSettings$anchors$$after_loop(group, path) {
    const anchors = [];
    let current = SETTINGS_SUB[group];
    for (const label of path) {
        const node = current.find((n) => n.label === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return anchors;
}
export function inner$walkSettings$current$$after_loop(group, path) {
    const anchors = [];
    let current = SETTINGS_SUB[group];
    for (const label of path) {
        const node = current.find((n) => n.label === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return current;
}
export function inner$walkProfile$anchors$$after_loop(path) {
    const anchors = [];
    let current = PROFILE_TREE;
    for (const label of path) {
        const node = current.find((n) => n.label === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return anchors;
}
export function inner$walkProfile$current$$after_loop(path) {
    const anchors = [];
    let current = PROFILE_TREE;
    for (const label of path) {
        const node = current.find((n) => n.label === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return current;
}
export function inner$walkHome$anchors$$after_loop(path) {
    const anchors = [];
    let current = HOME_LEAVES;
    for (const label of path) {
        const node = current.find((h) => h.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return anchors;
}
export function inner$walkHome$current$$after_loop(path) {
    const anchors = [];
    let current = HOME_LEAVES;
    for (const label of path) {
        const node = current.find((h) => h.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return current;
}
export function inner$walkCart$anchors$$after_loop(path) {
    const anchors = [];
    let current = CART_TOP;
    for (const label of path) {
        const node = current.find((c) => c.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return anchors;
}
export function inner$walkCart$current$$after_loop(path) {
    const anchors = [];
    let current = CART_TOP;
    for (const label of path) {
        const node = current.find((c) => c.title === label);
        if (!node || !node.children || node.children.length === 0)
            break;
        anchors.push(node);
        current = node.children;
    }
    return current;
}

export const SIGS = {
  inner$walkSettings$node: [{"name":"current","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$SettingsSubmenu$rows: [{"name":"SETTINGS_ROWS","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["id",{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about","reset"]},false],["label",{"t":"str"},false],["icon",{"t":"any"},false]]}},"opt":false}],
  inner$SettingsTreeSubmenu$parent: [{"name":"SETTINGS_ROWS","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["id",{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about","reset"]},false],["label",{"t":"str"},false],["icon",{"t":"any"},false]]}},"opt":false},{"name":"group","d":{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about"]},"opt":false}],
  inner$SettingsTreeSubmenu$reversed: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$SettingsTreeSubmenu$map$key: [{"name":"group","d":{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about"]},"opt":false},{"name":"pathPrefix","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"node","d":{"t":"any"},"opt":false}],
  inner$SettingsTreeSubmenu$map$isEditing: [{"name":"group","d":{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about"]},"opt":false},{"name":"pathPrefix","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"editingKey","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false},{"name":"binding","d":{"t":"obj","n":"Binding","p":[["action",{"t":"fn"},false],["isActive",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["get",{"t":"fn"},false],["set",{"t":"fn"},false],["label",{"t":"str"},false]]}]},true]]},"opt":false}],
  inner$SettingsTreeSubmenu$map$isEditing$$step: [{"name":"editingKey","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false},{"name":"binding","d":{"t":"obj","n":"Binding","p":[["action",{"t":"fn"},false],["isActive",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["get",{"t":"fn"},false],["set",{"t":"fn"},false],["label",{"t":"str"},false]]}]},true]]},"opt":false}],
  inner$LeafEditor$commit$trimmed: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$action$tail: [{"name":"s","d":{"t":"obj","n":"IdentityStats","p":[["orders",{"t":"num"},false],["sites",{"t":"num"},false],["trees",{"t":"num"},false],["spent",{"t":"num"},false],["autoSaved",{"t":"num"},false]]},"opt":false},{"name":"n","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Rank","p":[["key",{"t":"lit","v":["new","regular","pref","plat"]},false],["name",{"t":"str"},false],["ic",{"t":"str"},false],["min",{"t":"num"},false],["color",{"t":"str"},false],["perk",{"t":"str"},false]]}]},"opt":false}],
  inner$walkProfile$node: [{"name":"current","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$ProfileTreeSubmenu$current: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$ProfileTreeSubmenu$reversed: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$ProfileTreeSubmenu$reversed$$step: [{"name":"current","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$ProfileTreeSubmenu$branchIcon: [{"name":"ICON_PROFILE","d":{"t":"any"},"opt":false},{"name":"PROFILE_BRANCH_ICON","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"path","d":{"t":"any"},"opt":false}],
  inner$ProfileTreeSubmenu$map$leafKey: [{"name":"path","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false}],
  inner$walkHome$node: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"HomeItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HomeItem","p":[]}}]},true]]}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$HomeSubmenu$anchors: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$HomeSubmenu$current: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$HomeSubmenu$reversed: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$HomeSubmenu$reversed$$step: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"HomeItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HomeItem","p":[]}}]},true]]}},"opt":false}],
  inner$HomeSubmenu$map$hasChildren: [{"name":"h","d":{"t":"obj","n":"HomeItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HomeItem","p":[]}}]},true]]},"opt":false}],
  inner$walkCart$node: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"CartItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CartItem","p":[]}}]},true]]}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$CartSubmenu$anchors: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$CartSubmenu$current: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$CartSubmenu$reversed: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$CartSubmenu$reversed$$step: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"CartItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CartItem","p":[]}}]},true]]}},"opt":false}],
  inner$CartSubmenu$map$hasChildren: [{"name":"c","d":{"t":"obj","n":"CartItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CartItem","p":[]}}]},true]]},"opt":false}],
  inner$walkProjects$node: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[]}}]},true]]}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$ProjectsSubmenu$reversed: [{"name":"current","d":{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[]}}]},true]]}},"opt":false}],
  inner$ProjectsSubmenu$map$hasChildren: [{"name":"p","d":{"t":"obj","n":"ProjectItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[]}}]},true]]},"opt":false}],
  inner$ProjectsSubmenu$map$usesEmoji: [{"name":"p","d":{"t":"obj","n":"ProjectItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[]}}]},true]]},"opt":false}],
  inner$ProjectsSubmenu$map$usesEmoji$$step: [{"name":"p","d":{"t":"obj","n":"ProjectItem","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["children",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ProjectItem","p":[]}}]},true]]},"opt":false},{"name":"hasChildren","d":{"t":"bool"},"opt":false}],
  inner$walkSettings$anchors$$after_loop: [{"name":"group","d":{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about"]},"opt":false},{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkSettings$current$$after_loop: [{"name":"group","d":{"t":"lit","v":["account","notifications","display","accessibility","security","support","delivery","region","about"]},"opt":false},{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkProfile$anchors$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkProfile$current$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkHome$anchors$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkHome$current$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkCart$anchors$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkCart$current$$after_loop: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
