/**
 * 📖 ספר-המתכונים · כרך ב׳ (RECIPES2, 16.10.2026) — **נכתב ע״י AI**, פעם אחת, אחרי שמבחן נסתר ג׳ ננעל ולפני שהמכונה רצה
 * איתו. נעול (sha256 ב-recipes/SHA256-2). אחרי הנעילה — רק הרצה. ראו knowledge/CLOSED-RECIPES2-2026-10-16.md.
 *
 * אותו פורמט בדיוק כמו book.mjs (שלד בשפת-הגרף של catalog/combiner/graph.mjs, חורים ‎□v‎, holes: what/from/label/optional),
 * ועוד סוג-חור-חוט אחד:
 *   `{ $const: true }` — **קבוע מהקוד שלנו**: המנוע מחליף אותו בכל אחד מהקבועים שחוזרים בקוד של מאור (library-code.json —
 *   מה שהכורה קרא, לפי שכיחות; selfprint.mjs › minedConsts). מתכון אחד ⇒ קבוע אחד לכל היותר.
 * המספרים היחידים שהספר כותב: 0 ("כלום"), 1 ("עוד אחד" / "רצף של פריט אחד"), 600 (תקרת-חזרה), ו-1/2 בתוך ‎$slice‎
 * ("מהשני/השלישי והלאה"). (בודק-ספקן #3) חלקים קבועים: רק חלקי-הבסיס ‎⟨choose⟩ ⟨at⟩ ⟨cmp===⟩‎ (האחרון רק כ"הפריט הראשון
 * קיים?" — רשימה ריקה ⇒ אין תשובה; בודק-ספקן #2).
 * כל מתכון בשם כללי — שם של צורת-חישוב, לא של משימה.
 *
 * הפרקים (מה שהדוח של כרך א׳ §5 מנה כחסר):
 *   יב · חזור-על-מספר-עד-תנאי — לולאה על מספר (לא על רשימה): מצב {n, a}, צעד על n, צבירה של "חתיכה" מ-n, עד שהתנאי נופל.
 *   יג · מונה-שמתאפס — מצב שגדל כל עוד תנאי-השכנים מתקיים ומתאפס כשלא; וספירה-מותנית על זוגות/שלשות-שכנים.
 *   יד · כל-פריט-מול-כל-האחרים — לכל פריט: ערך מול כל אחד מהאחרים (כולם / שאחריו / שלפניו), ומספר אחד מהערכים.
 *   טו · הרכבה — מתכון שהחור שלו הוא תוצאה של מתכון אחר (רשימה ⇐ מספר; רשימה ⇐ רשימה; רשימה ⊕ הגרסה-המוכנה שלה).
 *   טז · ערך-רץ דו-שלבי · ערך-מההתחלה — ערך-רץ שהצירוף שלו שני צעדים; ולכל מקום — מספר מהרשימה עד אליו.
 */

const H = (v, ...args) => ({ part: '□' + v, args });
const N = (id, x) => ({ id, ...x });
const K = { $const: true };
const CH = (id, c, a, b) => N(id, { part: '⟨choose⟩', args: [c, a, b] });
const AT = (id, xs, i) => N(id, { part: '⟨at⟩', args: [xs, i] });
const REP = (state, nodes, next, out) => ({ inputs: state.inputs, nodes: [{ id: 'U', loop: { over: [0], init: state.init, item: 'u', state: 's', until: 'stable', max: 600, nodes, next } }], out });

/** @type {{id:string, he:string, chapter:string, doc:string, holes:{what:string, from:string, label?:string, optional?:boolean}[], graph:object}[]} */
export const RECIPES = [
  /* ═══ פרק י״ב · חזור-על-מספר-עד-תנאי ═══ */
  {
    id: 'num-until-acc', he: 'חזור על מספר עד תנאי, וצבור', chapter: 'חזור-על-מספר',
    doc: 'מצב: המספר והצבירה (מ-0). כל עוד התנאי על המספר מול 0 אמת: הצבירה מצרפת "חתיכה" מהמספר (פעולה מול קבוע), והמספר מתקדם צעד (פעולה מול אותו קבוע, ואולי עוד צעד). כשהתנאי נופל — המצב לא משתנה והחזרה נעצרת. התוצאה: הצבירה.',
    holes: [{ what: 'תנאי: המספר מול 0', from: 'cmp', label: '<' }, { what: 'צעד: המספר מול הקבוע', from: 'arith', label: '+' }, { what: 'עוד צעד על המספר', from: 'shelf', optional: true }, { what: 'חתיכה: המספר מול הקבוע', from: 'arith', label: '+' }, { what: 'צירוף החתיכה לצבירה', from: 'arith', label: '+' }],
    graph: REP({ inputs: ['i0'], init: { n: '$i0', a: 0 } }, [N('c', H(0, '$s.n', 0)), N('t', H(1, '$s.n', K)), N('t2', H(2, '@t')), N('p', H(3, '$s.n', K)), N('a2', H(4, '$s.a', '@p')), CH('nn', '@c', '@t2', '$s.n'), CH('na', '@c', '@a2', '$s.a')], { n: '@nn', a: '@na' }, '@U.state.a'),
  },
  {
    id: 'num-until-count', he: 'חזור על מספר עד תנאי, וספור צעדים', chapter: 'חזור-על-מספר',
    doc: 'מצב: המספר ומונה (מ-0). כל עוד התנאי על המספר מול קבוע אמת: המספר מתקדם צעד (מהמדף), והמונה עוד אחד. התוצאה: המונה (או המספר שנשאר).',
    holes: [{ what: 'תנאי: המספר מול הקבוע', from: 'cmp', label: '<' }, { what: 'צעד על המספר', from: 'shelf' }, { what: 'עוד אחד: המונה מול 1', from: 'arith', label: '+' }],
    graph: REP({ inputs: ['i0'], init: { n: '$i0', c: 0 } }, [N('c', H(0, '$s.n', K)), N('t', H(1, '$s.n')), N('c1', H(2, '$s.c', 1)), CH('nn', '@c', '@t', '$s.n'), CH('nc', '@c', '@c1', '$s.c')], { n: '@nn', c: '@nc' }, '@U.state.c'),
  },
  {
    id: 'num-until-last', he: 'חזור על מספר עד תנאי, והחזר את מה שנשאר', chapter: 'חזור-על-מספר',
    doc: 'כל עוד התנאי על המספר מול קבוע אמת — המספר ⇐ צעד (מהמדף). התוצאה: המספר כשהתנאי נפל.',
    holes: [{ what: 'תנאי: המספר מול הקבוע', from: 'cmp', label: '<' }, { what: 'צעד על המספר', from: 'shelf' }],
    graph: REP({ inputs: ['i0'], init: { n: '$i0' } }, [N('c', H(0, '$s.n', K)), N('t', H(1, '$s.n')), CH('nn', '@c', '@t', '$s.n')], { n: '@nn' }, '@U.state.n'),
  },
  {
    id: 'pair-until', he: 'זוג מספרים עד תנאי: הראשון ⇐ השני, השני ⇐ פעולה על שניהם', chapter: 'חזור-על-מספר',
    doc: 'מצב: שני המספרים. כל עוד התנאי על השני מול 0 אמת: (א, ב) ⇐ (ב, פעולה(א, ב)). התוצאה: הראשון.',
    holes: [{ what: 'תנאי: השני מול 0', from: 'cmp', label: '<' }, { what: 'פעולה על שניהם', from: 'arith', label: '+' }],
    graph: REP({ inputs: ['i0', 'i1'], init: { a: '$i0', b: '$i1' } }, [N('c', H(0, '$s.b', 0)), N('r', H(1, '$s.a', '$s.b')), CH('na', '@c', '$s.b', '$s.a'), CH('nb', '@c', '@r', '$s.b')], { a: '@na', b: '@nb' }, '@U.state.a'),
  },
  /* ═══ פרק י״ג · מונה-שמתאפס ═══ */
  {
    id: 'reset-run', he: 'מונה-שמתאפס על זוגות-שכנים', chapter: 'מונה-שמתאפס',
    doc: 'עוברים על זוגות-שכנים (הקודם, הנוכחי). אם התנאי עליהם אמת — המונה עוד אחד, אחרת חוזר ל-1 (רצף של פריט אחד). שומרים גם את הצירוף של כל ערכי-המונה (למשל הגדול). התוצאה: הצירוף. רשימה ריקה — אין תשובה (הפריט הראשון חייב להיות).',
    holes: [{ what: 'תנאי על זוג-שכנים', from: 'cmp', label: '<' }, { what: 'עוד אחד: המונה מול 1', from: 'arith', label: '+' }, { what: 'צירוף ערכי-המונה', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [AT('f', '$i0', 0), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { c: 1, b: 1 }, item: 'it', index: 'k', state: 'st', nodes: [AT('p', '$i0', '$k'), N('q', H(0, '$it', '@p')), N('c1', H(1, '$st.c', 1)), CH('nc', '@q', '@c1', 1), N('nb', H(2, '$st.b', '@nc'))], next: { c: '@nc', b: '@nb' } } }, N('ok', { part: '⟨cmp===⟩', args: ['@f', '@f'] }), CH('o', '@ok', '@L.state.b', '@L.state.b')], out: 'o' },
  },
  {
    id: 'reset-run-each', he: 'מונה-שמתאפס — הערך בכל מקום', chapter: 'מונה-שמתאפס',
    doc: 'כמו המונה-שמתאפס, אבל מחזירים את ערך-המונה בכל מקום (הראשון = 1). רשימה ריקה — אין תשובה.',
    holes: [{ what: 'תנאי על זוג-שכנים', from: 'cmp', label: '<' }, { what: 'עוד אחד: המונה מול 1', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [AT('f', '$i0', 0), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { c: 1, o: [1] }, item: 'it', index: 'k', state: 'st', nodes: [AT('p', '$i0', '$k'), N('q', H(0, '$it', '@p')), N('c1', H(1, '$st.c', 1)), CH('nc', '@q', '@c1', 1)], next: { c: '@nc', o: { $cat: ['$st.o', ['@nc']] } } } }, N('ok', { part: '⟨cmp===⟩', args: ['@f', '@f'] }), CH('o', '@ok', '@L.state.o', '@L.state.o')], out: 'o' },
  },
  {
    id: 'count-pairs-if', he: 'ספירה-מותנית על זוגות-שכנים', chapter: 'מונה-שמתאפס',
    doc: 'לכל זוג-שכנים: ערך מהזוג (פעולה על שניהם) מושווה מול 0; סופרים בכמה זוגות ההשוואה אמת.',
    holes: [{ what: 'ערך מהזוג', from: 'arith', label: '+' }, { what: 'תנאי', from: 'cmp', label: '<' }, { what: 'צירוף לספירה', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [AT('p', '$i0', '$k'), N('v', H(0, '@p', '$it')), N('q', H(1, '@v', 0)), N('n', H(2, '$st', '@q'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'count-pairs-cmp', he: 'ספירת זוגות-שכנים שעומדים בהשוואה', chapter: 'מונה-שמתאפס',
    doc: 'לכל זוג-שכנים (הקודם, הנוכחי) — ההשוואה ביניהם; סופרים בכמה זוגות היא אמת.',
    holes: [{ what: 'השוואה: הנוכחי מול הקודם', from: 'cmp', label: '<' }, { what: 'צירוף לספירה', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [AT('p', '$i0', '$k'), N('q', H(0, '$it', '@p')), N('n', H(1, '$st', '@q'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'triples-if', he: 'שלשות-שכנים: אותה השוואה של האמצעי מול שני שכניו', chapter: 'מונה-שמתאפס',
    doc: 'לכל פריט פנימי (יש לו קודם ובא): ההשוואה של הפריט מול הקודם, ו(אותה השוואה) מול הבא — שתיהן אמת? סופרים.',
    holes: [{ what: 'השוואה: האמצעי מול שכן', from: 'cmp', label: '<' }, { what: 'צירוף לספירה', from: 'arith', label: '+' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 2] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [AT('a', '$i0', '$k'), AT('b', { $slice: ['$i0', 1] }, '$k'), N('q1', H(0, '@b', '@a')), N('q2', H(0, '@b', '$it')), CH('qq', '@q1', '@q2', 0), N('n', H(1, '$st', '@qq'))], next: '@n' } }], out: '@L.state' },
  },
  {
    id: 'triples-keep', he: 'שלשות-שכנים: האמצעיים שעומדים בהשוואה מול שני שכניהם', chapter: 'מונה-שמתאפס',
    doc: 'כמו שלשות-שכנים, אבל שומרים את הפריטים האמצעיים שבהם שתי ההשוואות אמת.',
    holes: [{ what: 'השוואה: האמצעי מול שכן', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: ['$i0', 2] }, init: [], item: 'it', index: 'k', state: 'st', nodes: [AT('a', '$i0', '$k'), AT('b', { $slice: ['$i0', 1] }, '$k'), N('q1', H(0, '@b', '@a')), N('q2', H(0, '@b', '$it')), CH('qq', '@q1', '@q2', 0), CH('kk', '@qq', { $cat: ['$st', ['@b']] }, '$st')], next: '@kk' } }], out: '@L.state' },
  },
  /* ═══ פרק י״ד · כל-פריט-מול-כל-האחרים ═══ */
  {
    id: 'each-vs-all', he: 'לכל פריט — מול כל הפריטים', chapter: 'כל-פריט-מול-כולם',
    doc: 'לכל פריט x: לכל פריט y ברשימה — השוואה(y, x); מהתוצאות — מספר אחד. הרשימה של המספרים.',
    holes: [{ what: 'השוואה: y מול x', from: 'cmp', label: '<' }, { what: 'מספר מהערכים', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'x', state: 'st', nodes: [{ id: 'M', loop: { over: '$i0', init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x'))], next: '$s2', emit: '@v' } }, N('o', H(1, '@M.emits'))], next: '$st', emit: '@o' } }], out: '@L.emits' },
  },
  {
    id: 'each-vs-later', he: 'לכל פריט — מול כל מי שאחריו', chapter: 'כל-פריט-מול-כולם',
    doc: 'לכל פריט x במקום k: לכל y שאחריו — השוואה(y, x); מהתוצאות מספר אחד (רשימה ריקה ⇒ מה שהמספר-מרשימה נותן לה).',
    holes: [{ what: 'השוואה: y מול x', from: 'cmp', label: '<' }, { what: 'מספר מהערכים', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'x', index: 'k', state: 'st', nodes: [{ id: 'M', loop: { over: { $slice: [{ $slice: ['$i0', 1] }, '$k'] }, init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x'))], next: '$s2', emit: '@v' } }, N('o', H(1, '@M.emits'))], next: '$st', emit: '@o' } }], out: '@L.emits' },
  },
  {
    id: 'each-vs-earlier', he: 'לכל פריט — מול כל מי שלפניו', chapter: 'כל-פריט-מול-כולם',
    doc: 'לכל פריט x במקום k: לכל y שלפניו — השוואה(y, x); מהתוצאות מספר אחד.',
    holes: [{ what: 'השוואה: y מול x', from: 'cmp', label: '<' }, { what: 'מספר מהערכים', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'x', index: 'k', state: 'st', nodes: [{ id: 'M', loop: { over: { $slice: ['$i0', 0, '$k'] }, init: 0, item: 'y', state: 's2', nodes: [N('v', H(0, '$y', '$x'))], next: '$s2', emit: '@v' } }, N('o', H(1, '@M.emits'))], next: '$st', emit: '@o' } }], out: '@L.emits' },
  },
  {
    id: 'each-first-later', he: 'לכל פריט — הראשון שאחריו שעומד בהשוואה', chapter: 'כל-פריט-מול-כולם',
    doc: 'לכל פריט x: עוברים על מי שאחריו; הראשון y שההשוואה(y, x) אמת נשמר; אם אין — ערך-ברירת-מחדל מ-x (מהמדף).',
    holes: [{ what: 'השוואה: y מול x', from: 'cmp', label: '<' }, { what: 'ברירת-מחדל מ-x', from: 'shelf' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'x', index: 'k', state: 'st', nodes: [N('d', H(1, '$x')), { id: 'M', loop: { over: { $slice: [{ $slice: ['$i0', 1] }, '$k'] }, init: { f: 0, v: '@d' }, item: 'y', state: 's2', nodes: [N('q', H(0, '$y', '$x')), CH('take', '$s2.f', 0, '@q'), CH('nv', '@take', '$y', '$s2.v'), CH('nf', '@take', 1, '$s2.f')], next: { f: '@nf', v: '@nv' } } }], next: '$st', emit: '@M.state.v' } }], out: '@L.emits' },
  },
  /* ═══ פרק ט״ו · הרכבה (מתכון בתוך מתכון) ═══ */
  {
    id: 'then-stat', he: 'רשימה-מוכנה ⇐ מספר ממנה', chapter: 'הרכבה',
    doc: 'מכינים רשימה מהקלטים (מהמדף — לרוב תוצאה של מתכון אחר), ומחשבים ממנה מספר אחד.',
    holes: [{ what: 'הכנת רשימה מהרשימה ומהקלט', from: 'shelf' }, { what: 'מספר מהרשימה המוכנה', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('r', H(0, '$i0', '$i1')), N('o', H(1, '@r'))], out: 'o' },
  },
  {
    id: 'then-best-index', he: 'רשימה-מוכנה ⇐ המקום של הטוב בה', chapter: 'הרכבה',
    doc: 'מכינים רשימה (מהמדף, אולי עם הקלט השני), ומחזירים את המקום של הפריט המנצח בה (בתיקו — לפי ההשוואה: קפדנית ⇒ הראשון, לא-קפדנית ⇒ האחרון).',
    holes: [{ what: 'הכנת רשימה', from: 'shelf' }, { what: 'השוואה: מנצח?', from: 'cmp', label: '<' }],
    graph: { inputs: ['i0', 'i1'], nodes: [N('r', H(0, '$i0', '$i1')), AT('f', '@r', 0), { id: 'L', loop: { over: '@r', init: { i: 0, s: '@f' }, item: 'it', index: 'k', state: 'st', nodes: [N('c', H(1, '$it', '$st.s')), CH('ni', '@c', '$k', '$st.i'), CH('ns', '@c', '$it', '$st.s')], next: { i: '@ni', s: '@ns' } } }], out: '@L.state.i' },
  },
  {
    id: 'zip-prepared', he: 'כל פריט מול הפריט שבאותו מקום ברשימה-המוכנה', chapter: 'הרכבה',
    doc: 'מכינים מהרשימה רשימה שנייה באותו אורך (מהמדף — למשל ערך-רץ), ולכל מקום: פעולה על הפריט ועל הפריט המוכן; אופציונלית מספר אחד מהתוצאות.',
    holes: [{ what: 'הכנת רשימה', from: 'shelf' }, { what: 'פעולה: פריט מול המוכן', from: 'arith', label: '+' }, { what: 'מספר מהתוצאות', from: 'stat', label: 'stat', optional: true }],
    graph: { inputs: ['i0'], nodes: [N('t', H(0, '$i0')), { id: 'L', loop: { over: '$i0', init: 0, item: 'it', index: 'k', state: 'st', nodes: [AT('q', '@t', '$k'), N('v', H(1, '$it', '@q'))], next: '$st', emit: '@v' } }, N('o', H(2, '@L.emits'))], out: 'o' },
  },
  /* ═══ פרק ט״ז · ערך-רץ דו-שלבי · ערך-מההתחלה ═══ */
  {
    id: 'scan-two-step', he: 'ערך-רץ מהפריט הראשון, צירוף בשני צעדים', chapter: 'ערך-רץ',
    doc: 'הפריט הראשון; לכל פריט הבא: צעד-א(הערך-הרץ, הפריט), ואז צעד-ב(התוצאה, הפריט). רשימת הערכים, ואופציונלית מספר ממנה.',
    holes: [{ what: 'צעד א', from: 'arith', label: '+' }, { what: 'צעד ב', from: 'arith', label: '+' }, { what: 'מספר מהערכים', from: 'stat', label: 'stat', optional: true }],
    graph: { inputs: ['i0'], nodes: [AT('f', '$i0', 0), { id: 'L', loop: { over: { $slice: ['$i0', 1] }, init: { v: '@f', o: ['@f'] }, item: 'it', state: 'st', nodes: [N('m', H(0, '$st.v', '$it')), N('n', H(1, '@m', '$it'))], next: { v: '@n', o: { $cat: ['$st.o', ['@n']] } } } }, N('o', H(2, '@L.state.o'))], out: 'o' },
  },
  {
    id: 'prefix-stat', he: 'לכל מקום — מספר מהרשימה עד אליו', chapter: 'ערך-רץ',
    doc: 'לכל מקום k: החלק מההתחלה עד k (כולל) ⇒ מספר אחד. הרשימה של כולם.',
    holes: [{ what: 'סוף החלק: k מול 1', from: 'arith', label: '+' }, { what: 'מספר מהחלק', from: 'stat', label: 'stat' }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', index: 'k', state: 'st', nodes: [N('e', H(0, '$k', 1)), N('v', H(1, { $slice: ['$i0', 0, '@e'] }))], next: '$st', emit: '@v' } }], out: '@L.emits' },
  },
  {
    id: 'window-const', he: 'חלון-נע ברוחב-קבוע', chapter: 'חלון',
    doc: 'כמו חלון-נע, כשהרוחב הוא קבוע מהקוד שלנו: לכל מקום-התחלה — מספר מהחלון. ואופציונלית מספר אחד מכל החלונות.',
    holes: [{ what: 'סוף החלון: k מול הרוחב', from: 'arith', label: '+' }, { what: 'מספר מהחלון', from: 'stat', label: 'stat' }, { what: 'מספר מכל החלונות', from: 'stat', label: 'stat', optional: true }],
    graph: { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: { $slice: [{ $cat: [[0], '$i0'] }, K] }, init: 0, item: 'it', index: 'k', state: 'st', nodes: [N('e', H(0, '$k', K)), N('v', H(1, { $slice: ['$i0', '$k', '@e'] }))], next: '$st', emit: '@v' } }, N('o', H(2, '@L.emits'))], out: 'o' },
  },
];
