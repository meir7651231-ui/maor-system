/**
 * 📖 ספר-המתכונים (RECIPES, 16.10.2026) — **הדבר היחיד בענף שכתב AI**. נכתב פעם אחת ונעול (sha256 ב-recipes/SHA256);
 * אחרי הנעילה — רק הרצה. **ספר v2 (3.11.2026, בקשת-הבעלים):** נוספו פרקים י״ב–י״ד (חזור-על-מספר · מונה-עם-איפוס ·
 * לכל-פריט-מול-כולם) — נכתבו **אחרי** שמבחנים א׳/ב׳ נפתחו; לכן נמדדים בהוגנות רק על מבחן ג׳ (נעול לפני הפרקים). ראו knowledge/CLOSED-RECIPES-2026-10-16.md.
 *
 * מתכון = שלד בשפת-הגרף של catalog/combiner/graph.mjs שחלק מהצמתים בו **חורים** (‎□v‎), בדיוק כמו השלדים שהכורה מוצא
 * בקוד (library-code.json). כללי בלבד: אין מתכון בשם של משימה, אין קבוע שמקודד תשובה (רק 0 ו"הפריט הראשון").
 * חלקים קבועים מותרים: חלקי-הבסיס של המנוע בלבד — ‎⟨choose⟩ ⟨at⟩ ⟨cmp!==⟩‎ — וחוטים (‎$slice $cat {x,y} [..]‎).
 *
 * לכל חור: what (מה הוא) · from (מאיפה המכונה ממלאת):
 *   'shelf'  — דבר מהמדף בחתימה המתאימה (חלק מוכח / מה שהמכונה בנתה), בסדר-התועלת (שם-מיוחד ⇒ כלי ⇒ שימוש ⇒ פשוט).
 *   'cmp'    — משווה: קודם המשווים של המנוע (‎< <= > >= === !==‎), אחר-כך דברים מהמדף; תווית '<' = רק "משפחת-ההשוואה"
 *              (המילוי קודם ‎<‎ ואחיו), והיא קובעת סוג: מספר,מספר ⇒ 0/1.
 *   'arith'  — פעולה על שני מספרים: תווית '+' = "משפחת-החשבון" (‎+ − × ÷ % max min‎, ואחריהם המדף) — סוג בלבד, לא תשובה.
 *   'stat'   — מספר אחד מהרשימה כולה ("חשב פעם אחת"): מהמדף בחתימה רשימה ⇒ מספר.
 * `optional: true` — החור יכול גם "לא להיות" (המנוע מייצר גם גרסה שבה הצומת הוא מעבר-ישר של הקלט הראשון שלו) — כי
 * למדף אין "זהות" (judge פוסל "מחזיר את הקלט").
 */

const H = (v, ...args) => ({ part: '□' + v, args });
const N = (id, x) => ({ id, ...x });

/** @type {{id:string, he:string, chapter:string, doc:string, holes:{what:string, from:string, label?:string, optional?:boolean}[], graph:object}[]} */
export const RECIPES = [
  /* ═══ פרק א׳ · סינון ═══ */
  {
    id: 'filter', he: 'סינון-לפי-תנאי', chapter: 'סינון',
    doc: 'עוברים על הרשימה; פריט נשמר אם התנאי עליו אמת (≠0).',
    holes: [{ what: 'תנאי על פריט', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: [], item: 'it', state: 'st', nodes: [N('c', H(0, '$it')), N('k', { part: '⟨choose⟩', args: ['@c', { $cat: ['$st', ['$it']] }, '$st'] })], next: '@k' } }], out: '@L.state' },
  },
  {
    id: 'filter-vs-stat', he: 'סינון מול מספר-מהרשימה', chapter: 'סינון',
    doc: 'מחשבים פעם אחת מספר מכל הרשימה, ואז שומרים כל פריט שההשוואה שלו (אחרי מפתח אופציונלי) מול המספר אמת.',
    holes: [{ what: 'השוואה', from: 'cmp', label: '<' }, { what: 'מספר מהרשימה', from: 'stat', label: 'stat' }, { what: 'מפתח לפריט', from: 'shelf', optional: true }],
    graph: { inputs: ['i0'], nodes: [N('s', H(1, '$i0')), { id: 'L', loop: { over: '$i0', init: [], item: 'it', state: 'st', nodes: [N('q', H(2, '$it')), N('c', H(0, '@q', '@s')), N('k', { part: '⟨choose⟩', args: ['@c', { $cat: ['$st', ['$it']] }, '$st'] })], next: '@k' } }], out: '@L.state' },
  },
  {
    id: 'filter-vs-param', he: 'סינון מול קלט', chapter: 'סינון',
    doc: 'שומרים כל פריט שהמפתח שלו (אופציונלי) עומד בהשוואה מול הקלט השני.',
    holes: [{ what: 'השוואה', from: 'cmp', label: '<' }, { what: 'מפתח לפריט', from: 'shelf', optional: true }],
    graph: { inputs: ['i0', 'i1'], nodes: [{ id: 'L', loop: { over: '$i0', init: [], item: 'it', state: 'st', nodes: [N('q', H(1, '$it')), N('c', H(0, '@q', '$i1')), N('k', { part: '⟨choose⟩', args: ['@c', { $cat: ['$st', ['$it']] }, '$st'] })], next: '@k' } }], out: '@L.state' },
  },
  {
    id: 'filter-vs-kept', he: 'סינון מול מה שכבר נשמר', chapter: 'סינון',
    doc: 'פריט נשמר אם התנאי עליו ועל מה שנשמר עד עכשיו אמת (למשל "עוד לא ראיתי", "גדול מכל מה שנשמר").',
    holes: [{ what: 'תנאי: פריט מול הרשימה שנשמרה', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: [], item: 'it', state: 'st', nodes: [N('c', H(0, '$it', '$st')), N('k', { part: '⟨choose⟩', args: ['@c', { $cat: ['$st', ['$it']] }, '$st'] })], next: '@k' } }], out: '@L.state' },
  },
  /* ═══ פרק ב׳ · צבירה ═══ */
  {
    id: 'fold-first', he: 'צבירה מהפריט הראשון', chapter: 'צבירה',
    doc: 'מתחילים מהפריט הראשון ומצרפים אליו כל פריט הבא.',
    holes: [{ what: 'צירוף', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: '@f', item: 'it', state: 'st', nodes: [N('n', H(0, '$st', '$it'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'fold-mapped', he: 'צבירה של ערך-לכל-פריט', chapter: 'צבירה',
    doc: 'לכל פריט מחשבים מספר, ומצרפים מ-0.',
    holes: [{ what: 'צירוף', from: 'arith', label: '+' }, { what: 'ערך לפריט', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('v', H(1, '$it')), N('n', H(0, '$st', '@v'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'fold-mapped-param', he: 'צבירה של ערך-לכל-פריט מול קלט', chapter: 'צבירה',
    doc: 'כמו צבירה-של-ערך, כשהערך תלוי גם בקלט השני.',
    holes: [{ what: 'צירוף', from: 'arith', label: '+' }, { what: 'ערך לפריט מול הקלט השני', from: 'shelf' }],
    graph: { inputs: ['i0', 'i1'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('v', H(1, '$it', '$i1')), N('n', H(0, '$st', '@v'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'fold-mapped-stat', he: 'חשב פעם אחת, ואז צבור לכל פריט', chapter: 'צבירה',
    doc: 'מספר אחד מכל הרשימה, ואז לכל פריט ערך מולו, מצורף מ-0; בסוף אפשר לשלב עם מספר-מהרשימה.',
    holes: [{ what: 'צירוף', from: 'arith', label: '+' }, { what: 'ערך: פריט מול המספר', from: 'shelf' }, { what: 'מספר מהרשימה', from: 'stat', label: 'stat' }, { what: 'סיום: תוצאה מול מספר-מהרשימה', from: 'arith', label: '+', optional: true }, { what: 'מספר-מהרשימה לסיום', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [N('s', H(2, '$i0')), { id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('v', H(1, '$it', '@s')), N('n', H(0, '$st', '@v'))], next: '@n' } }, N('t', H(4, '$i0')), N('o', H(3, '@L.state', '@t'))], out: 'o' },
  },
  {
    id: 'two-stats', he: 'שני מספרים מהרשימה, משולבים', chapter: 'צבירה',
    doc: 'מחשבים שני מספרים מהרשימה כולה ומשלבים אותם בפעולה אחת.',
    holes: [{ what: 'שילוב', from: 'arith', label: '+' }, { what: 'מספר ראשון', from: 'stat', label: 'stat' }, { what: 'מספר שני', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [N('a', H(1, '$i0')), N('b', H(2, '$i0')), N('o', H(0, '@a', '@b'))], out: 'o' },
  },
  /* ═══ פרק ג׳ · ערך-רץ ═══ */
  {
    id: 'scan', he: 'ערך-רץ מ-0', chapter: 'ערך-רץ',
    doc: 'לכל פריט — הצירוף של כל מה שעד אליו, מתחילים מ-0; הרשימה של כל הערכים.',
    holes: [{ what: 'צירוף', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('n', H(0, '$st', '$it'))], next: '@n', emit: '@n' } }], out: '@L.emits' },
  },
  {
    id: 'scan-first', he: 'ערך-רץ מהפריט הראשון', chapter: 'ערך-רץ',
    doc: 'הפריט הראשון, ואחריו לכל פריט הבא — הצירוף שלו עם הערך-הרץ עד אליו.',
    holes: [{ what: 'צירוף', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { v: '@f', o: ['@f'] }, item: 'it', state: 'st', nodes: [N('n', H(0, '$st.v', '$it'))], next: { v: '@n', o: { $cat: ['$st.o', ['@n']] } } } }], out: '@L.state.o' },
  },
  /* ═══ פרק ד׳ · לכל-פריט עם מספר-מהרשימה ═══ */
  {
    id: 'each-stat', he: 'חשב פעם אחת, ואז לכל פריט', chapter: 'לכל-פריט',
    doc: 'מספר אחד מכל הרשימה, ואז כל פריט ⇒ ערך מולו (אולי אחרי עוד צעד מול מספר שני).',
    holes: [{ what: 'פריט מול המספר', from: 'shelf' }, { what: 'מספר מהרשימה', from: 'stat', label: 'stat' }, { what: 'צעד שני: מול מספר שני', from: 'arith', label: '+', optional: true }, { what: 'מספר שני מהרשימה', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [N('s', H(1, '$i0')), N('t', H(3, '$i0')), { id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('v', H(0, '$it', '@s')), N('w', H(2, '@v', '@t'))], next: '$st', emit: '@w' } }], out: '@L.emits' },
  },
  {
    id: 'each-if', he: 'אם-אחרת לכל פריט מול מספר-מהרשימה', chapter: 'לכל-פריט',
    doc: 'מספר אחד מהרשימה; לכל פריט: אם ההשוואה אמת — ערך אחד, אחרת — הפריט (או ערך אחר).',
    holes: [{ what: 'השוואה', from: 'cmp', label: '<' }, { what: 'מספר מהרשימה', from: 'stat', label: 'stat' }, { what: 'ערך כשאמת', from: 'shelf' }, { what: 'ערך כשלא', from: 'shelf', optional: true }],
    graph: { inputs: ['i0'], nodes: [N('s', H(1, '$i0')), { id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('c', H(0, '$it', '@s')), N('a', H(2, '$it', '@s')), N('b', H(3, '$it', '@s')), N('k', { part: '⟨choose⟩', args: ['@c', '@a', '@b'] })], next: '$st', emit: '@k' } }], out: '@L.emits' },
  },
  /* ═══ פרק ה׳ · זוגות ═══ */
  {
    id: 'neighbors', he: 'זוגות-שכנים', chapter: 'זוגות',
    doc: 'לכל שני פריטים צמודים (הקודם, הנוכחי) ⇒ ערך; הרשימה של כולם, ואופציונלית מספר אחד ממנה.',
    holes: [{ what: 'ערך לזוג-שכנים', from: 'shelf' }, { what: 'מספר מרשימת-הערכים', from: 'stat', label: 'stat', optional: true }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [N('p', { part: '⟨at⟩', args: ['$i0', '$k'] }), N('v', H(0, '@p', '$it'))], next: '$st', emit: '@v' } }, N('o', H(1, '@L.emits'))], out: 'o' },
  },
  {
    id: 'all-pairs', he: 'כל-הזוגות', chapter: 'זוגות',
    doc: 'לכל זוג פריטים (כל פריט עם כל אחד שלפניו) ⇒ ערך; אוספים את כל הערכים ומחשבים מהם מספר אחד (או מחזירים אותם).',
    holes: [{ what: 'ערך לזוג', from: 'shelf' }, { what: 'מספר מכל הערכים', from: 'stat', label: 'stat', optional: true }],
    graph: {
      inputs: ['i0'],
      nodes: [
        { id: 'L', loop: { over: '$i0', init: [], item: 'x', index: 'i', state: 'st', nodes: [
          { id: 'M', loop: { over: { $slice: ['$i0', 0, '$i'] }, init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x'))], next: '$s2', emit: '@v' } },
        ], next: { $cat: ['$st', '@M.emits'] } } },
        N('o', H(1, '@L.state')),
      ],
      out: 'o',
    },
  },
  /* ═══ פרק ו׳ · בחר-את-הטוב ═══ */
  {
    id: 'best', he: 'בחר-את-הטוב-לפי-ציון', chapter: 'בחר-את-הטוב',
    doc: 'לכל פריט ציון; שומרים את הפריט שהציון שלו מנצח בהשוואה (בתיקו — הראשון).',
    holes: [{ what: 'ציון לפריט', from: 'shelf', optional: true }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), N('f0', H(0, '@f')), { id: 'L', loop: { over: '$i0', init: { b: '@f', s: '@f0' }, item: 'it', state: 'st', nodes: [N('q', H(0, '$it')), N('c', H(1, '@q', '$st.s')), N('nb', { part: '⟨choose⟩', args: ['@c', '$it', '$st.b'] }), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$st.s'] })], next: { b: '@nb', s: '@ns' } } }], out: '@L.state.b' },
  },
  {
    id: 'best-param', he: 'בחר-את-הטוב מול קלט', chapter: 'בחר-את-הטוב',
    doc: 'כמו בחר-את-הטוב, כשהציון של כל פריט תלוי בקלט השני (הקרוב ביותר, המתאים ביותר).',
    holes: [{ what: 'ציון: פריט מול הקלט השני', from: 'shelf' }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), N('f0', H(0, '@f', '$i1')), { id: 'L', loop: { over: '$i0', init: { b: '@f', s: '@f0' }, item: 'it', state: 'st', nodes: [N('q', H(0, '$it', '$i1')), N('c', H(1, '@q', '$st.s')), N('nb', { part: '⟨choose⟩', args: ['@c', '$it', '$st.b'] }), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$st.s'] })], next: { b: '@nb', s: '@ns' } } }], out: '@L.state.b' },
  },
  {
    id: 'best-index', he: 'המקום של הטוב', chapter: 'בחר-את-הטוב',
    doc: 'כמו בחר-את-הטוב, אבל מחזירים את המקום שלו ברשימה (בתיקו — הראשון).',
    holes: [{ what: 'ציון לפריט', from: 'shelf', optional: true }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), N('f0', H(0, '@f')), { id: 'L', loop: { over: '$i0', init: { i: 0, s: '@f0' }, item: 'it', index: 'k', state: 'st', nodes: [N('q', H(0, '$it')), N('c', H(1, '@q', '$st.s')), N('ni', { part: '⟨choose⟩', args: ['@c', '$k', '$st.i'] }), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$st.s'] })], next: { i: '@ni', s: '@ns' } } }], out: '@L.state.i' },
  },
  {
    id: 'best-score-param', he: 'הציון הטוב מול קלט', chapter: 'בחר-את-הטוב',
    doc: 'כמו בחר-את-הטוב-מול-קלט, אבל מחזירים את הציון המנצח עצמו (המרחק הקטן, ההפרש הגדול).',
    holes: [{ what: 'ציון: פריט מול הקלט השני', from: 'shelf' }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), N('f0', H(0, '@f', '$i1')), { id: 'L', loop: { over: '$i0', init: '@f0', item: 'it', state: 'st', nodes: [N('q', H(0, '$it', '$i1')), N('c', H(1, '@q', '$st')), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$st'] })], next: '@ns' } }], out: '@L.state' },
  },
  /* ═══ פרק ז׳ · קח-במקום ═══ */
  {
    id: 'pick-at', he: 'קח-במקום-k(n)', chapter: 'קח-במקום',
    doc: 'מסדרים/משנים את הרשימה (אופציונלי), ולוקחים את הפריט שבמקום שמחושב מהרשימה.',
    holes: [{ what: 'המקום (מספר מהרשימה)', from: 'stat', label: 'stat' }, { what: 'הכנת הרשימה', from: 'shelf', optional: true }],
    graph: { inputs: ['i0'], nodes: [N('r', H(1, '$i0')), N('k', H(0, '$i0')), N('o', { part: '⟨at⟩', args: ['@r', '@k'] })], out: 'o' },
  },
  {
    id: 'take-k', he: 'קח-את-k-הראשונים', chapter: 'קח-במקום',
    doc: 'מסדרים/משנים את הרשימה (אופציונלי), ולוקחים את k הראשונים, k = הקלט השני.',
    holes: [{ what: 'הכנת הרשימה', from: 'shelf', optional: true }, { what: 'k ⇐ הקלט השני', from: 'shelf', optional: true }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('r', H(0, '$i0')), N('k', H(1, '$i1')), { id: 'L', loop: { over: [0], init: { $slice: ['@r', 0, '@k'] }, item: 'it', state: 'st', nodes: [], next: '$st' } }], out: '@L.state' },
  },
  /* ═══ פרק ח׳ · חלון ═══ */
  {
    id: 'window', he: 'חלון-נע', chapter: 'חלון',
    doc: 'לכל מקום-התחלה k של חלון מלא באורך w (w = הקלט השני): החלון מ-k עד סוף-החלון ⇒ מספר; הרשימה של כולם.',
    holes: [{ what: 'מספר מהחלון', from: 'stat', label: 'stat' }, { what: 'סוף החלון: k מול w', from: 'arith', label: '+' }],
    graph: { inputs: ['i0', 'i1'], nodes: [{ id: 'L', loop: { over: { $slice: [{ $cat: [[0], '$i0'] }, '$i1'] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [N('e', H(1, '$k', '$i1')), N('v', H(0, { $slice: ['$i0', '$k', '@e'] }))], next: '$st', emit: '@v' } }], out: '@L.emits' },
  },
  /* ═══ פרק ט׳ · מיון ובנייה-חמדנית ═══ */
  {
    id: 'sort-by-key', he: 'מיון-לפי-מפתח', chapter: 'בנייה-חמדנית',
    doc: 'חוזרים: בוחרים מהנותרים את הטוב לפי מפתח, מוסיפים לסוף, מוציאים מהנותרים (בתיקו — הראשון).',
    holes: [{ what: 'מפתח לפריט', from: 'shelf', optional: true }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: {
      inputs: ['i0'],
      nodes: [{ id: 'G', loop: { over: '$i0', init: { o: [], r: '$i0' }, item: 'g', state: 'st', nodes: [
        N('f', { part: '⟨at⟩', args: ['$st.r', 0] }), N('f0', H(0, '@f')),
        { id: 'B', loop: { over: '$st.r', init: { i: 0, s: '@f0' }, item: 'it', index: 'k', state: 'sb', nodes: [N('q', H(0, '$it')), N('c', H(1, '@q', '$sb.s')), N('ni', { part: '⟨choose⟩', args: ['@c', '$k', '$sb.i'] }), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$sb.s'] })], next: { i: '@ni', s: '@ns' } } },
        N('p', { part: '⟨at⟩', args: ['$st.r', '@B.state.i'] }),
        { id: 'R', loop: { over: '$st.r', init: [], item: 'y', index: 'j', state: 'sr', nodes: [N('d', { part: '⟨cmp!==⟩', args: ['$j', '@B.state.i'] }), N('kk', { part: '⟨choose⟩', args: ['@d', { $cat: ['$sr', ['$y']] }, '$sr'] })], next: '@kk' } },
      ], next: { o: { $cat: ['$st.o', ['@p']] }, r: '@R.state' } } }],
      out: '@G.state.o',
    },
  },
  {
    id: 'greedy-chain', he: 'בנייה-חמדנית: הבא הטוב מול האחרון', chapter: 'בנייה-חמדנית',
    doc: 'מתחילים מהפריט הראשון; חוזרים: בוחרים מהנותרים את הטוב לפי ציון מול האחרון שנבחר, מוסיפים, מוציאים.',
    holes: [{ what: 'ציון: פריט מול האחרון שנבחר', from: 'shelf' }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: {
      inputs: ['i0'],
      nodes: [N('f1', { part: '⟨at⟩', args: ['$i0', 0] }), { id: 'G', loop: { over: { $slice: ['$i0', 1] }, init: { o: ['@f1'], r: { $slice: ['$i0', 1] }, l: '@f1' }, item: 'g', state: 'st', nodes: [
        N('f', { part: '⟨at⟩', args: ['$st.r', 0] }), N('f0', H(0, '@f', '$st.l')),
        { id: 'B', loop: { over: '$st.r', init: { i: 0, s: '@f0' }, item: 'it', index: 'k', state: 'sb', nodes: [N('q', H(0, '$it', '$st.l')), N('c', H(1, '@q', '$sb.s')), N('ni', { part: '⟨choose⟩', args: ['@c', '$k', '$sb.i'] }), N('ns', { part: '⟨choose⟩', args: ['@c', '@q', '$sb.s'] })], next: { i: '@ni', s: '@ns' } } },
        N('p', { part: '⟨at⟩', args: ['$st.r', '@B.state.i'] }),
        { id: 'R', loop: { over: '$st.r', init: [], item: 'y', index: 'j', state: 'sr', nodes: [N('d', { part: '⟨cmp!==⟩', args: ['$j', '@B.state.i'] }), N('kk', { part: '⟨choose⟩', args: ['@d', { $cat: ['$sr', ['$y']] }, '$sr'] })], next: '@kk' } },
      ], next: { o: { $cat: ['$st.o', ['@p']] }, r: '@R.state', l: '@p' } } }],
      out: '@G.state.o',
    },
  },
  /* ═══ פרק י׳ · חזור-עד-שאין-שינוי ═══ */
  {
    id: 'until-stable', he: 'חזור-עד-שאין-שינוי על מעבר-שכנים', chapter: 'חזור-עד-שאין-שינוי',
    doc: 'מעבר על הרשימה: כל פריט נפגש עם ה"נישא" מהקודמים; שני חורים קובעים מה נשאר במקום ומה נישא הלאה. חוזרים על המעבר עד שהוא לא משנה כלום.',
    holes: [{ what: 'מה נשאר במקום (נישא, פריט)', from: 'shelf' }, { what: 'מה נישא הלאה (נישא, פריט)', from: 'shelf' }],
    graph: {
      inputs: ['i0'],
      nodes: [{ id: 'U', loop: { over: [0], init: '$i0', item: 'u', state: 'su', until: 'stable', max: 600, nodes: [
        N('h', { part: '⟨at⟩', args: ['$su', 0] }),
        { id: 'P', loop: { over: { $slice: ['$su', 1] }, init: { o: [], c: '@h' }, item: 'it', state: 'sp', nodes: [N('lo', H(0, '$sp.c', '$it')), N('hi', H(1, '$sp.c', '$it'))], next: { o: { $cat: ['$sp.o', ['@lo']] }, c: '@hi' } } },
      ], next: { $cat: ['@P.state.o', ['@P.state.c']] } } }],
      out: '@U.state',
    },
  },
  /* ═══ פרק י״א · נקודות: לכל-שיעור ═══ */
  {
    id: 'coords-stat', he: 'נקודה מסטטיסטיקה לכל-שיעור', chapter: 'שיעורים',
    doc: 'אוספים את כל ה-x ואת כל ה-y, אותו מספר-מרשימה לשניהם ⇒ נקודה.',
    holes: [{ what: 'מספר מרשימה', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'X', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [], next: '$st', emit: '$it.x' } }, { id: 'Y', loop: { over: '$i0', init: 0, item: 'iu', state: 'sv', nodes: [], next: '$sv', emit: '$iu.y' } }, N('a', H(0, '@X.emits')), N('b', H(0, '@Y.emits')), { id: 'P', loop: { over: [0], init: { x: '@a', y: '@b' }, item: 'z', state: 'sz', nodes: [], next: '$sz' } }], out: '@P.state' },
  },
  {
    id: 'coords-pair', he: 'פעולה לכל-שיעור על שתי נקודות', chapter: 'שיעורים',
    doc: 'אותה פעולת-מספרים על ה-x של שתי הנקודות ועל ה-y שלהן ⇒ נקודה.',
    holes: [{ what: 'פעולה על שני מספרים', from: 'arith', label: '+' }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('a', H(0, '$i0.x', '$i1.x')), N('b', H(0, '$i0.y', '$i1.y')), { id: 'P', loop: { over: [0], init: { x: '@a', y: '@b' }, item: 'z', state: 'sz', nodes: [], next: '$sz' } }], out: '@P.state' },
  },
  {
    id: 'coords-each', he: 'לכל נקודה: פעולה לכל-שיעור מול נקודה', chapter: 'שיעורים',
    doc: 'לכל נקודה ברשימה — אותה פעולת-מספרים על ה-x שלה מול x של נקודה אחת שמחושבת פעם אחת מהרשימה כולה, וכך ל-y.',
    holes: [{ what: 'פעולה על שני מספרים', from: 'arith', label: '+' }, { what: 'הנקודה השנייה (מהרשימה)', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [N('c', H(1, '$i0')), { id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: [N('a', H(0, '$it.x', '@c.x')), N('b', H(0, '$it.y', '@c.y'))], next: '$st', emit: { x: '@a', y: '@b' } } }], out: '@L.emits' },
  },
  /* ═══ פרק י״ב · חזור על מספר עד תנאי (נוסף 3.11.2026 — ספר v2) ═══ */
  {
    id: 'repeat-count', he: 'חזור על מספר עד תנאי — כמה פעמים', chapter: 'חזור-על-מספר',
    doc: 'מתחילים מהמספר; כל עוד התנאי עליו אמת — מחליפים אותו בצעד, וסופרים צעד. מחזירים את המונה.',
    holes: [{ what: 'תנאי: להמשיך?', from: 'shelf' }, { what: 'הצעד על המספר', from: 'shelf' }, { what: 'עדכון המונה', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'U', loop: { over: [0], init: { v: '$i0', a: 0 }, item: 'u', state: 'su', until: 'stable', max: 2000, nodes: [N('c', H(0, '$su.v')), N('nv', H(1, '$su.v')), N('na', H(2, '$su.a')), N('kv', { part: '⟨choose⟩', args: ['@c', '@nv', '$su.v'] }), N('ka', { part: '⟨choose⟩', args: ['@c', '@na', '$su.a'] })], next: { v: '@kv', a: '@ka' } } }], out: '@U.state.a' },
  },
  {
    id: 'repeat-accumulate', he: 'חזור על מספר עד תנאי — צבור בדרך', chapter: 'חזור-על-מספר',
    doc: 'כמו "כמה פעמים", אבל בכל צעד מצרפים לצובר משהו מהמספר הנוכחי (או אותו עצמו; מתחילים מ-0). מחזירים את הצובר.',
    holes: [{ what: 'תנאי: להמשיך?', from: 'shelf' }, { what: 'הצעד על המספר', from: 'shelf' }, { what: 'מה לוקחים מהמספר', from: 'shelf', optional: true }, { what: 'צירוף לצובר', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'U', loop: { over: [0], init: { v: '$i0', a: 0 }, item: 'u', state: 'su', until: 'stable', max: 2000, nodes: [N('c', H(0, '$su.v')), N('nv', H(1, '$su.v')), N('w', H(2, '$su.v')), N('na', H(3, '$su.a', '@w')), N('kv', { part: '⟨choose⟩', args: ['@c', '@nv', '$su.v'] }), N('ka', { part: '⟨choose⟩', args: ['@c', '@na', '$su.a'] })], next: { v: '@kv', a: '@ka' } } }], out: '@U.state.a' },
  },
  {
    id: 'repeat-final', he: 'חזור על מספר עד תנאי — לאן הגיע', chapter: 'חזור-על-מספר',
    doc: 'כל עוד התנאי אמת — מחליפים את המספר בצעד; מחזירים את המספר שבו נעצרנו.',
    holes: [{ what: 'תנאי: להמשיך?', from: 'shelf' }, { what: 'הצעד על המספר', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'U', loop: { over: [0], init: '$i0', item: 'u', state: 'su', until: 'stable', max: 2000, nodes: [N('c', H(0, '$su')), N('nv', H(1, '$su')), N('kv', { part: '⟨choose⟩', args: ['@c', '@nv', '$su'] })], next: '@kv' } }], out: '@U.state' },
  },
  {
    id: 'repeat-pair', he: 'חזור על זוג מספרים עד תנאי', chapter: 'חזור-על-מספר',
    doc: 'זוג (x, y); כל עוד התנאי על y אמת — x מקבל צעד אחד מהזוג ו-y צעד אחר. מחזירים את x.',
    holes: [{ what: 'תנאי על y: להמשיך?', from: 'shelf' }, { what: 'x החדש (מ-y ו-x)', from: 'shelf', optional: true }, { what: 'y החדש (מ-x ו-y)', from: 'shelf' }],
    graph: { inputs: ['i0', 'i1'], nodes: [{ id: 'U', loop: { over: [0], init: { x: '$i0', y: '$i1' }, item: 'u', state: 'su', until: 'stable', max: 2000, nodes: [N('c', H(0, '$su.y')), N('nx', H(1, '$su.y', '$su.x')), N('ny', H(2, '$su.x', '$su.y')), N('kx', { part: '⟨choose⟩', args: ['@c', '@nx', '$su.x'] }), N('ky', { part: '⟨choose⟩', args: ['@c', '@ny', '$su.y'] })], next: { x: '@kx', y: '@ky' } } }], out: '@U.state.x' },
  },
  /* ═══ פרק י״ג · מונה עם איפוס (נוסף 3.11.2026 — ספר v2) ═══ */
  {
    id: 'run-reset', he: 'רצף שמתאפס — הרצף הטוב', chapter: 'מונה-עם-איפוס',
    doc: 'עוברים על זוגות-שכנים; כל עוד ההשוואה בין הנוכחי לקודם אמת — הרצף גדל בצעד, אחרת מתחיל מחדש מפריט אחד. שומרים את הטוב מבין הרצפים.',
    holes: [{ what: 'השוואה: הנוכחי מול הקודם', from: 'cmp', label: '<' }, { what: 'הגדלת הרצף', from: 'shelf' }, { what: 'הטוב: שומר מול הרצף', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { c: 1, m: 1 }, item: 'it', index: 'k', state: 'st', nodes: [N('p', { part: '⟨at⟩', args: ['$i0', '$k'] }), N('q', H(0, '$it', '@p')), N('g', H(1, '$st.c')), N('nc', { part: '⟨choose⟩', args: ['@q', '@g', 1] }), N('nm', H(2, '$st.m', '@nc'))], next: { c: '@nc', m: '@nm' } } }], out: '@L.state.m' },
  },
  {
    id: 'continue-or-restart', he: 'להמשיך או להתחיל מחדש', chapter: 'מונה-עם-איפוס',
    doc: 'ערך-רץ שבכל פריט בוחר: להמשיך את מה שנצבר עם הפריט, או להתחיל מחדש מהפריט; שומרים את הטוב שנראה.',
    holes: [{ what: 'המשך: נצבר מול פריט', from: 'arith', label: '+' }, { what: 'בחירה: המשך מול התחלה-מחדש', from: 'arith', label: '+' }, { what: 'הטוב: שומר מול הנוכחי', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { c: '@f', m: '@f' }, item: 'it', state: 'st', nodes: [N('t', H(0, '$st.c', '$it')), N('nc', H(1, '@t', '$it')), N('nm', H(2, '$st.m', '@nc'))], next: { c: '@nc', m: '@nm' } } }], out: '@L.state.m' },
  },
  {
    id: 'track-and-best', he: 'עוקב-עד-כאן והטוב מולו', chapter: 'מונה-עם-איפוס',
    doc: 'שומרים ערך-עוקב מכל מה שעבר; לכל פריט (מהשני) — ציון מול העוקב, ושומרים את הציון הטוב (מתחילים מהציון הראשון); אחר-כך מעדכנים את העוקב.',
    holes: [{ what: 'ציון: פריט מול העוקב', from: 'arith', label: '+' }, { what: 'עדכון העוקב', from: 'arith', label: '+' }, { what: 'הטוב: שומר מול הציון', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [N('f', { part: '⟨at⟩', args: ['$i0', 0] }), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { c: '@f', m: 0 }, item: 'it', index: 'k', state: 'st', nodes: [N('v', H(0, '$it', '$st.c')), N('first', { part: '⟨cmp!==⟩', args: ['$k', 0] }), N('b', H(2, '$st.m', '@v')), N('nm', { part: '⟨choose⟩', args: ['@first', '@b', '@v'] }), N('nc', H(1, '$st.c', '$it'))], next: { c: '@nc', m: '@nm' } } }], out: '@L.state.m' },
  },
  /* ═══ פרק י״ד · לכל פריט מול כל האחרים (נוסף 3.11.2026 — ספר v2) ═══ */
  {
    id: 'each-vs-all', he: 'לכל פריט — מול כל הפריטים', chapter: 'לכל-פריט-מול-כולם',
    doc: 'לכל פריט: עוברים על כל הפריטים, ערך לכל זוג (הפריט, האחר), מצרפים מ-0 ⇒ מספר לכל פריט; אופציונלית מספר אחד מכל אלה.',
    holes: [{ what: 'ערך: האחר מול הפריט', from: 'shelf' }, { what: 'צירוף', from: 'arith', label: '+' }, { what: 'מספר מכל הערכים', from: 'stat', label: 'stat', optional: true }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'x', state: 'st', nodes: [{ id: 'M', loop: { over: '$i0', init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x')), N('n', H(1, '$s2', '@v'))], next: '@n' } }], next: '$st', emit: '@M.state' } }, N('o', H(2, '@L.emits'))], out: 'o' },
  },
  {
    id: 'best-vs-all', he: 'הפריט הטוב מול כולם — המקום', chapter: 'לכל-פריט-מול-כולם',
    doc: 'לכל פריט — הצירוף שלו מול כל הפריטים (כמו "לכל פריט מול כולם"); מחזירים את המקום של הפריט שהצירוף שלו מנצח בהשוואה (הראשון נבחר בהתחלה; השוואה חזקה ⇒ בתיקו נשאר הקודם).',
    holes: [{ what: 'ערך: האחר מול הפריט', from: 'shelf' }, { what: 'צירוף', from: 'arith', label: '+' }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: { i: 0, s: 0 }, item: 'x', index: 'k', state: 'st', nodes: [{ id: 'M', loop: { over: '$i0', init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x')), N('n', H(1, '$s2', '@v'))], next: '@n' } }, N('c', H(2, '@M.state', '$st.s')), N('first', { part: '⟨cmp!==⟩', args: ['$k', 0] }), N('w', { part: '⟨choose⟩', args: ['@first', '@c', 1] }), N('ni', { part: '⟨choose⟩', args: ['@w', '$k', '$st.i'] }), N('ns', { part: '⟨choose⟩', args: ['@w', '@M.state', '$st.s'] })], next: { i: '@ni', s: '@ns' } } }], out: '@L.state.i' },
  },
];
