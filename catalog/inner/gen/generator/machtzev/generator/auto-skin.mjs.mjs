// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/auto-skin.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isNum = (t) => /^[\d,.%₪$+\-–]+$/.test(String(t).trim());
const ROLES = {
    kpi: { need: 'value+label' }, hero: { need: 'value+label' }, stat: { need: 'value+label' },
    navTile: { need: 'text2', fam: ['card', 'nav', 'list'] }, empty: { need: 'text2', fam: ['feedback'] },
    button: { need: 'text1', fam: ['action'] }, statusChip: { need: 'text1', fam: ['status'] }, banner: { need: 'text2', fam: ['feedback', 'status'] },
    emptyState: { need: 'text2', fam: ['feedback'] }, mediaRow: { need: 'text2', fam: ['card', 'list'] },
    section: { need: 'child+text1', fam: ['header', 'card', 'composite'] }, frame: { need: 'child', fam: ['card', 'header', 'composite'] },
    segmented: { need: 'select', fam: ['selection', 'nav', 'action', 'composite'] }, chip: { need: 'select', fam: ['selection', 'composite', 'status'] },
    meter: { need: 'value+values', fam: ['status', 'dataviz', 'card', 'list'] }, alertTile: { need: 'value+label', fam: ['feedback', 'status', 'card'], judgeOnly: true }, glass: { need: 'text2', fam: ['card'] }, timeline: { need: 'items2', fam: ['list', 'chat', 'card'] },
    field: { need: 'control', fam: ['input', 'composite'] }, enumField: { need: 'control', fam: ['input', 'composite'] }, numberField: { need: 'control', fam: ['input', 'composite'] },
    dateField: { need: 'control', fam: ['input', 'composite'] }, search: { need: 'control', fam: ['input', 'composite'] }, pageHeader: { need: 'text2', fam: ['header'] },
    table: { need: 'table', fam: ['spatial', 'list'] }, bars: { need: 'values', fam: ['dataviz'] }, board: { need: 'board', fam: ['spatial'] }, calendar: { need: 'calendar', fam: ['temporal', 'spatial'] },
};
const NEED_SLOTS = { 'value+label': 2, text1: 1, text2: 2, child: 0, 'child+text1': 1, 'value+values': 2 };
const tones = (a) => ((a.items && a.items.variants) || []).filter((v) => /^tone-/.test(v));
const S = (a) => a.sig || { root: {}, slots: [], svg: false, input: null, numEmph: 0 };
const effSlots = (a) => (a.items ? Math.max(0, a.fieldSlots - a.items.demo * a.items.slots) + a.items.slots : a.fieldSlots);
const maxFs = (a) => Math.max(0, ...S(a).slots.map((x) => x.fs || 0));
const heading = (a) => S(a).slots.some((x) => (x.fs || 0) >= 15 && (x.fw || 0) >= 600);
const inBtn = (a) => S(a).slots.some((x) => x.inBtn) || S(a).root.tag === 'button' || S(a).root.tag === 'a';
const numLike = (t) => /^[\d,.%₪$+\-–\s]+$/.test(String(t).trim()) && /\d/.test(t);
const numSlots = (a) => a.fieldDemo.filter(numLike).length;
const toneCoverage = (a) => { const t = tones(a); return [/^tone-(info|neutral|accent|primary)$/, /^tone-(ok|success|good)$/, /^tone-(err|error|danger|bad)$/, /^tone-(warn|warning)$/].filter((re) => t.some((v) => re.test(v))).length; };
function score(role, a) {
    const R = ROLES[role], s = S(a), ns = NEED_SLOTS[R.need];
    let sc = 0;
    const surplus = ns == null ? 0 : Math.max(0, effSlots(a) - ns);
    switch (role) {
        case 'kpi':
        case 'hero':
        case 'stat':
            if (s.numEmph < 1.4)
                return null; // KPI = מספר מודגש; אחרת זו כותרת עם ספרה
            sc = s.numEmph * 2 - surplus * 10 - (s.svg ? 6 : 0) - (a.items ? 6 : 0) - a.values * 6 - a.actions * 3 - (s.root.interactive ? 4 : 0) + (s.root.decorated ? 1 : 0);
            break;
        case 'navTile':
            if (!s.root.interactive)
                return null; // אריח-ניווט = לחיץ
            sc = (s.svg ? 3 : 0) + (s.root.decorated ? 2 : 0) + (s.root.dir === 'column' ? 2 : 0) - surplus * 4 - (a.items ? 6 : 0);
            break;
        case 'empty':
        case 'emptyState':
            sc = (s.svg ? 2 : 0) - (s.root.interactive ? 5 : 0) - (s.root.decorated ? 1 : 0) - surplus * 4 - (a.items ? 3 : 0);
            break;
        case 'button':
            if (!inBtn(a))
                return null; // כפתור = <button>/<a>
            sc = (tones(a).length ? 4 : 0) + toneCoverage(a) * 2 - surplus * 5 - (a.control ? 5 : 0) - Math.max(0, a.actions - 1) * 2;
            break;
        case 'statusChip':
            sc = (tones(a).length ? 5 : 0) + toneCoverage(a) * 2 - (s.root.interactive ? 3 : 0) - (s.svg ? 2 : 0) + (maxFs(a) && maxFs(a) <= 12 ? 2 : 0) - surplus * 4;
            break;
        case 'banner':
            sc = (tones(a).length ? 5 : 0) + toneCoverage(a) * 2 - (s.root.interactive ? 3 : 0) - (s.svg ? 1 : 0) - surplus * 3;
            break;
        case 'mediaRow':
            sc = (s.svg ? 3 : 0) + (s.root.dir === 'row' ? 3 : 0) - surplus * 3 - (a.items ? 3 : 0);
            break;
        case 'section':
            if (!s.root.decorated)
                return null; // מקטע = מיכל מעוטר עם כותרת
            sc = (heading(a) ? 4 : 0) + Math.min(maxFs(a), 24) / 3 - (maxFs(a) > 24 ? 4 : 0) + (a.items ? 2 : 0) - (a.fieldDemo.some((t) => /^[A-Z]{3,}$/.test(t)) ? 2 : 0) - a.actions * 2 - surplus * 1 - (s.root.interactive ? 3 : 0) - numSlots(a) * 3;
            break; // כותרת 15–24 + פעולות-נלוות = מקטע; eyebrow-באותיות-גדולות/>24 = כותרת-עמוד   // כותרת 15–24 = מקטע; >24 = הירו-של-עמוד; כפתורי-ניווט/מספרים = לא-מקטע
        case 'frame':
            if (!s.root.decorated || s.root.interactive)
                return null; // מסגרת = מיכל דומם
            sc = -effSlots(a) * 4 - (s.svg ? 2 : 0) - (a.items ? 4 : 0) - (s.root.interactive ? 2 : 0) - a.actions * 2 - a.values * 3 - numSlots(a) * 4;
            break; // מסגרת = מיכל, לא KPI/גרף
        case 'segmented':
            sc = (inBtn(a) ? 3 : 0) - (s.root.interactive ? 4 : 0) - (s.svg ? 3 : 0) - (a.items.slots - 1) * 5 - a.items.cells * 5 - Math.max(0, effSlots(a) - 1) * 2;
            break; // בורר-מקטעים = מסילה של טקסטים (השורש אינו הכפתור, בלי אייקונים)
        case 'chip':
            sc = (a.bare ? 2 : 0) + (s.root.interactive ? 2 : 0) - (s.root.decorated ? 2 : 0) + (a.items.slots === 1 ? 3 : 0) - a.items.cells * 5;
            break; // צ׳יפ = הפריט עצמו לחיץ
        case 'alertTile': // הכרעה-37 · אריח-התראה: גוון (מצב) + מספר מודגש + לחיץ — מה שמסך-הבית מבקש לתנאי-חי; עד כאן נמדד כ-kpi ונקנס על בדיוק זה
            sc = (tones(a).length ? 4 : 0) + toneCoverage(a) * 2 + s.numEmph * 2 + (s.root.interactive ? 3 : -3) - surplus * 3;
            break;
        case 'meter':
            sc = -Math.max(0, a.values - 1) * 4 - surplus * 3;
            break;
        case 'glass':
            if (!s.root.decorated || s.root.interactive)
                return null;
            sc = -(s.svg ? 3 : 0) - (a.items ? 3 : 0) - surplus * 2;
            break;
        case 'timeline':
            {
                const sl = s.slots;
                const pair = sl.some((x, k) => k + 1 < sl.length && (x.fw || 0) >= 600 && (sl[k + 1].fw || 0) < 600 && (sl[k + 1].fs || 0) <= (x.fs || 0)); // כותרת-מודגשת ואחריה משנה-קלה = שורת-ציר (בכל מקום ברצף)
                sc = -(s.svg ? 2 : 0) + (s.root.decorated ? 1 : 0) + (a.items.slots <= 3 ? 2 : 0) + (pair ? 3 : 0) - (a.items.selectable || inBtn(a) ? 4 : 0) - a.actions * 2 - a.items.cells * 3 - Math.max(0, numSlots(a) - 1) * 2 - Math.max(0, effSlots(a) - a.items.slots) * 2 + (a.family === 'list' ? 1 : 0);
                break;
            } // שורות פסיביות: בלי מתגים/כפתורים; תג-מונה יחיד מותר; רשימה > צ׳אט   // ציר-זמן = שורות-טקסט בלי כותרת-כרטיס, לא מפתח-ערך-מספרי
        case 'field':
        case 'enumField':
        case 'numberField':
        case 'dateField':
        case 'search': {
            const i = s.input || {};
            const base = -(a.items ? 4 : 0) - Math.max(0, a.fieldSlots - 2) * 2;
            if (role === 'field')
                sc = base - (s.svg ? 3 : 0) - a.actions * 3 - (i.numPh ? 3 : 0) - (i.readonly ? 3 : 0) - (i.datePh ? 3 : 0);
            else if (role === 'enumField')
                sc = base + (i.readonly ? 5 : 0) + (s.svg ? 2 : 0) - a.actions * 3 - (i.numPh ? 3 : 0) - (i.datePh ? 3 : 0);
            else if (role === 'numberField')
                sc = base + (i.numPh ? 6 : 0) - (i.readonly ? 3 : 0) - a.actions * 3 - (i.datePh ? 3 : 0);
            else if (role === 'dateField')
                sc = base + (i.datePh ? 6 : 0) + (s.svg ? 1 : 0) - a.actions * 3 - (i.numPh ? 3 : 0);
            else
                sc = base + Math.min(a.actions, 1) * 4 + (i.ph ? 2 : 0) + (s.svg ? 2 : 0) - (i.readonly ? 3 : 0) - (i.numPh ? 3 : 0);
            break;
        }
        case 'pageHeader':
            sc = (maxFs(a) >= 20 ? 4 : 0) + (s.root.decorated ? 1 : 0) - (s.root.interactive ? 2 : 0) - (a.items ? 2 : 0) - surplus * 1;
            break;
        case 'table':
            sc = Math.min(a.columns, 4) * 2 + (a.items.slots >= 2 ? 2 : 0) - (a.items.variants ? 3 : 0);
            break;
        case 'bars':
            sc = Math.min(a.values, 8) - Math.max(0, a.fieldSlots - 2) * 2 - Math.max(0, (s.series || 1) - 1) * 6 - Math.max(0, (s.fills || 1) - 1) * 3;
            break; // סדרה-אחת בצבע-אחד (NeonBars/DsBars = values יחיד); מוערם/מקובץ = כמה מילויים   // סדרה-אחת (NeonBars/DsBars = values יחיד); מוערם = כמה סדרות
        case 'board':
            sc = a.items.cells * 2;
            break;
        case 'calendar':
            sc = 0;
            break;
    }
    return sc;
}
export function inner$fits$num(a) {
    const num = a.fieldDemo.filter(isNum).length;
    return num;
}
export function inner$fits$txt(a) {
    const txt = a.fieldDemo.filter((t) => /[a-z֐-׿]/.test(t)).length;
    return txt;
}
export function inner$toneCoverage$t(a) {
    const t = tones(a);
    return t;
}
export function inner$score$s(a) {
    const s = S(a);
    return s;
}
export function inner$score$surplus(a, ns) {
    const surplus = ns == null ? 0 : Math.max(0, effSlots(a) - ns);
    return surplus;
}
export function inner$score$pair(sl) {
    const pair = sl.some((x, k) => k + 1 < sl.length && (x.fw || 0) >= 600 && (sl[k + 1].fw || 0) < 600 && (sl[k + 1].fs || 0) <= (x.fs || 0));
    return pair;
}
export function inner$score$base(a) {
    const base = -(a.items ? 4 : 0) - Math.max(0, a.fieldSlots - 2) * 2;
    return base;
}
export function inner$rank$sc(role, a) {
    const sc = score(role, a);
    return sc;
}
export function inner$rank$tie(ranked) {
    const tie = ranked.filter((x) => ranked.length && x.score === ranked[0].score);
    return tie;
}
export function inner$autoSkin$a(overrides, atoms, role, r) {
    const cls = overrides[role] || (r[0] && r[0].cls);
    const a = atoms.find((x) => x.cls === cls);
    return a;
}
export function inner$autoSkin$a$$step(atoms, cls) {
    const a = atoms.find((x) => x.cls === cls);
    return a;
}

export const SIGS = {
  inner$fits$num: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$fits$txt: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$toneCoverage$t: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$score$s: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$score$surplus: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"ns","d":{"t":"num"},"opt":false}],
  inner$score$pair: [{"name":"sl","d":{"t":"any"},"opt":false}],
  inner$score$base: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$rank$sc: [{"name":"role","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$rank$tie: [{"name":"ranked","d":{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["family",{"t":"any"},false],["score",{"t":"num"},false]]}},"opt":false}],
  inner$autoSkin$a: [{"name":"overrides","d":{"t":"obj","p":[]},"opt":false},{"name":"atoms","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["family",{"t":"any"},false],["score",{"t":"num"},false]]}},"opt":false}],
  inner$autoSkin$a$$step: [{"name":"atoms","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
};
