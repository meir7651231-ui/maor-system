/**
 * 🧱 ספריית צורות-העל (BLUEPRINTS, 14.10.2026) — "שרטוט" = צורת-חיבור עם משבצות, בלי שום חלק.
 *
 * כל צורה היא תבנית בפורמט של catalog/combiner/graph.mjs — אותם חוטים (`$קלט` · `@צומת` · קבוע · רשומה · `$slice`/`$cat`)
 * ואותה לולאה (`loop` · `until: "stable"`) — רק שבמקום `part` בכל צומת יש `slot`: משבצת שמנוע-החיפוש (search.mjs)
 * ממלא בחלק מוכח. **אין כאן אף מזהה-חלק** (ratchet: blueprints.test.ts) — הצורה לא יודעת מי ימלא אותה.
 *
 * משבצת = `{sem: [סוגי-הקלטים], out: סוג-הפלט, roles: [פעלים] | cls: <bind של האלפבית>, contract?}`:
 *   סוגים: num · nums · pt · pts · list · bool · any · '@<קלט>' (הסוג של הקלט הזה אחרי ההתאמה לפועל-היעד).
 *   roles — הפעלים שהחלק חייב להיות מוכח להם (provenAs). cls — כל פועל באלפבית עם ה-bind הזה (צורה כללית).
 *   contract — **חוזה-משבצת** כללי שנבדק בהרצה על דוגמאות-סוג לפני השילוב (לא חוק של פועל-היעד!):
 *     metric (‎f(a,a)=0‎, סימטרי, ‎≥0‎, תלוי-בקלט) · additive (‎f([])=0‎, ‎f([a])=a‎, ‎f(x++y)=f(x)+f(y)‎) · permute (הפלט = הקלט בסדר אחר) ·
 *     subset (הפלט ⊆ הקלט) · pick (מחזיר אחד מהמועמדים) · none (רק "רץ ומחזיר את הסוג").
 *
 * `mined` — ביטוי על מחרוזת-השרטוט שכורה-השרטוטים (mine.mjs) כתב, או `'dag:<צורה>'` (פונקציה שכל הגוף שלה ביטוי של קריאות,
 * בצורת שרשרת/צירוף/זוג) ⇒ library.json › bySuper = "נמצא ב:" — איפה הצורה כבר מופיעה בקוד שלנו.
 * `exec: false` — צורה שמוצהרת (ונספרת בכרייה) אבל אי אפשר לבטא בגרף בלי חוט-תנאי או עדכון-במקום — graph.mjs לא מחשב
 * בחוטים, במכוון. מנוע-החיפוש מדלג עליה ורושם למה.
 *
 * קבועים: כל צורה מצהירה ב-`consts` מה כל מספר/רשומה קבועים אומרים (כמו מתכוני-הגרף של המכונה). קידוד אחד חוזר:
 * **"מספר כנקודה על ציר"** — `{x: עלות, y: 0, r: הפריט}` מול המוצא `{x:0, y:0}` — כך משבצת pick (בוחר-הקרוב) בוחרת את
 * הזול מבין מועמדים. זה חיווט (רשומה מחוטים), לא חישוב.
 */

/* ═══════════════ עזרים לבניית תבניות ═══════════════ */

const ORIGIN = { x: 0, y: 0 };
/** עלות של דרך (רשימת נקודות): רגל-רגל עם MEASURE, ואז SUM. מחזיר [צמתים, חוט-העלות]. */
function costOf(tag, route, first) {
  return [[
    { id: 'l' + tag, loop: { over: { $slice: [route, 1] }, init: { prev: first }, item: 'q' + tag, state: 't' + tag, nodes: [{ id: 'd' + tag, slot: 'MEASURE', args: ['$t' + tag + '.prev', '$q' + tag] }], next: { prev: '$q' + tag }, emit: '@d' + tag } },
    { id: 'c' + tag, slot: 'SUM', args: ['@l' + tag + '.emits'] },
  ], '@c' + tag];
}

const SLOTS_ROUTE = {
  CLEAN: { sem: ['pts'], out: 'pts', roles: ['dedupe', 'filter', 'sort', 'map'], contract: 'subset', he: 'מנקה את הרשימה' },
  ORDER: { sem: ['pts', 'pt'], out: 'pts', roles: ['sort', 'filter', 'extreme', 'map', 'lookup'], contract: 'permute', he: 'מסדר נקודות ביחס לנקודה' },
  MEASURE: { sem: ['pt', 'pt'], out: 'num', roles: ['convert', 'gap', 'combine', 'compare', 'ratio', 'extreme'], contract: 'metric', he: 'מודד בין שתי נקודות' },
  SUM: { sem: ['nums'], out: 'num', roles: ['sum', 'combine', 'accumulate', 'count', 'extreme', 'average'], contract: 'additive', he: 'מסכם מספרים' },
  MOVE: { sem: ['pts'], out: 'pts', roles: ['reverse', 'sort', 'rotate', 'map', 'dedupe', 'filter'], contract: 'permute', he: 'מהלך על קטע' },
  PICK: { sem: ['pts', 'pt'], out: 'pt', roles: ['extreme', 'lookup', 'filter', 'sort', 'next'], contract: 'pick', he: 'בוחר מועמד אחד' },
};

/**
 * «בנה מהר ואז שפר עד שאין שיפור» — חיפוש-מקומי על רצף: בנייה חמדנית (כל פעם ORDER על מה שנשאר ביחס למקום הנוכחי, לוקחים
 * את הראשון), אופציונלית "הטוב מבין הבנייה לבין הסדר המקורי" (multistart), ואז שיפור: לכל זוג i<j — MOVE על הקטע i..j,
 * העלות (MEASURE+SUM) נבדקת, PICK משאיר את הזול; חוזר עד שסבב שלם לא משנה (until: stable).
 */
function buildImprove({ clean, construct, multistart, improve }) {
  const nodes = [];
  if (clean) nodes.push({ id: 'u', slot: 'CLEAN', args: ['$stops'] });
  const base = clean ? '@u' : '$stops';
  const B = { $cat: [['$from'], base] };
  let start;
  if (construct) {
    nodes.push({ id: 'nn', loop: { over: base, init: { at: '$from', left: base }, item: 'p', state: 's', nodes: [{ id: 'by', slot: 'ORDER', args: ['$s.left', '$s.at'] }], next: { at: '@by.0', left: { $slice: ['@by', 1] } }, emit: '@by.0' } });
    const A = { $cat: [['$from'], '@nn.emits'] };
    const [ca, la] = costOf('a', A, '$from');
    if (multistart || improve) nodes.push(...ca); // העלות נדרשת רק כשמשווים או משפרים
    if (multistart) {
      const [cb, lb] = costOf('b', B, '$from');
      nodes.push(...cb, { id: 'st', slot: 'PICK', args: [[{ x: la, y: 0, r: A }, { x: lb, y: 0, r: B }], ORIGIN] });
      start = { r: '@st.r', len: '@st.x' };
    } else start = { r: A, len: la };
  } else {
    const [cb, lb] = costOf('b', B, '$from');
    nodes.push(...cb);
    start = { r: B, len: lb };
  }
  if (!improve) return { inputs: ['from', 'stops'], nodes, outWire: start.r };
  const cand = { $cat: [{ $slice: ['$c.r', 0, '@i'] }, '@mv', { $slice: ['$c.r', '@e'] }] };
  const [cc, lc] = costOf('c', cand, '$c.r.0');
  nodes.push({
    id: 'opt', loop: {
      over: { $slice: ['$o.r', 1] }, init: start, item: 'a', index: 'k', state: 'o', until: 'stable', max: 60,
      nodes: [
        { id: 'i', slot: 'SUM', args: [['$k', 1]] },
        { id: 'i2', slot: 'SUM', args: [['$k', 2]] },
        {
          id: 'two', loop: {
            over: { $slice: ['$o.r', '@i2'] }, init: '$o', item: 'b', index: 'm', state: 'c',
            nodes: [
              { id: 'e', slot: 'SUM', args: [['@i2', '$m', 1]] },
              { id: 'mv', slot: 'MOVE', args: [{ $slice: ['$c.r', '@i', '@e'] }] },
              ...cc,
              { id: 'pk', slot: 'PICK', args: [[{ x: '$c.len', y: 0, r: '$c.r' }, { x: lc, y: 0, r: cand }], ORIGIN] },
            ],
            next: { r: '@pk.r', len: '@pk.x' },
          },
        },
      ],
      next: '@two.state',
    },
  });
  return { inputs: ['from', 'stops'], nodes, outWire: '@opt.state.r' };
}

/** «כל פריט לסל הטוב שיש בו מקום» — K תאים לכל סל (לולאה על K הפריטים הראשונים) + תא-חוץ רחוק לכל פריט; הפריטים לפי המרחק
 *  לסל הקרוב שלהם (PICK + MEASURE, ואז ORDER מול המוצא); כל פריט לוקח את התא הפנוי הקרוב (ORDER ⇒ הראשון), והתא יוצא. */
function buildCapacitated({ capacity, byKey }) {
  const nodes = [
    { id: 'cells', loop: { over: '$bins', init: 0, item: 'v', index: 'bi', state: 'z', nodes: capacity ? [{ id: 'rep', loop: { over: { $slice: ['$items', 0, '$cap'] }, init: 0, item: 'w0', state: 'y', nodes: [], next: '$y', emit: { x: '$v.x', y: '$v.y', BIN: '$bi' } } }] : [], next: '$z', emit: capacity ? '@rep.emits' : [{ x: '$v.x', y: '$v.y', BIN: '$bi' }] } },
  ];
  if (capacity) nodes.push({ id: 'out', loop: { over: '$items', init: 0, item: 'w1', state: 'y1', nodes: [], next: '$y1', emit: { x: 1000000000, y: 1000000000, BIN: -1 } } });
  let order = '$items';
  if (byKey) {
    nodes.push({ id: 'key', loop: { over: '$items', init: 0, item: 'p', state: 'y2', nodes: [{ id: 'nb', slot: 'PICK', args: ['$bins', '$p'] }, { id: 'dk', slot: 'MEASURE', args: ['$p', '@nb'] }], next: '$y2', emit: { x: '@dk', y: 0, ITEM: '$p' } } });
    nodes.push({ id: 'ord', slot: 'ORDER', args: ['@key.emits', ORIGIN] });
    order = '@ord';
  }
  const item = byKey ? '$w.ITEM' : '$w';
  const free = capacity ? { $cat: [{ $cat: '@cells.emits' }, '@out.emits'] } : { $cat: '@cells.emits' };
  nodes.push({ id: 'asg', loop: { over: order, init: free, item: 'w', state: 'f', nodes: [{ id: 's', slot: capacity ? 'ORDER' : 'ORDER', args: ['$f', item] }], next: capacity ? { $slice: ['@s', 1] } : '$f', emit: { ITEM: item, BIN: '@s.0.BIN' } } });
  return { inputs: ['bins', 'items', 'cap'].slice(0, capacity ? 3 : 2), nodes, outWire: '@asg.emits' };
}

/* ═══════════════ צורות-העל ═══════════════ */

const AGG = { cls: 'list>any' }; const BIN = { cls: 'x+x>any' }; const LST = { cls: 'list>list' };

export const SUPER = [
  {
    id: 'improve-until-stable', he: 'בנה מהר ואז שפר עד שאין שיפור', exec: true,
    says: 'בנייה חמדנית (הקרוב-הבא), הטוב מבין הבנייה לסדר המקורי, ואז מהלך-על-קטע לכל זוג i<j שנשאר רק אם הוא זול יותר — עד שסבב שלם לא משנה',
    inputs: [{ name: 'from', sem: 'pt' }, { name: 'stops', sem: 'pts' }], slots: SLOTS_ROUTE,
    variants: [
      { id: 'construct+improve', construct: true, improve: true },
      { id: 'clean+construct+improve', clean: true, construct: true, improve: true },
      { id: 'construct+best+improve', construct: true, multistart: true, improve: true },
      { id: 'clean+construct+best+improve', clean: true, construct: true, multistart: true, improve: true },
    ],
    build: buildImprove,
    consts: { origin: '{x:0, y:0} — "מספר כנקודה על ציר": {x: עלות, y: 0} הקרוב למוצא = הזול', max60: 'עד 60 סבבים (עוצר כשסבב שלם לא שינה)', plus: '1, 2 — הסטים של i=k+1, i+1, j+1 (מחושבים במשבצת SUM, לא בחוט)' },
    mined: /fix\[[^\]]*(loop|while)\[/,
  },
  {
    id: 'improve-only', he: 'שפר עד שאין שיפור (בלי בנייה)', exec: true,
    says: 'מתחילים מהסדר שהגיע, ומשפרים במהלך-על-קטע עד שסבב שלם לא משנה',
    inputs: [{ name: 'from', sem: 'pt' }, { name: 'stops', sem: 'pts' }], slots: SLOTS_ROUTE,
    variants: [{ id: 'improve', improve: true }, { id: 'clean+improve', clean: true, improve: true }],
    build: buildImprove, consts: { origin: '{x:0, y:0} — מספר כנקודה על ציר' }, mined: /fix\[/,
  },
  {
    id: 'greedy-chain', he: 'לכל אחד — הקרוב, ברצף', exec: true,
    says: 'כל פעם ORDER על מה שנשאר ביחס למקום הנוכחי — לוקחים את הראשון וממשיכים ממנו (בלי שיפור)',
    inputs: [{ name: 'from', sem: 'pt' }, { name: 'stops', sem: 'pts' }], slots: SLOTS_ROUTE,
    variants: [{ id: 'construct', construct: true }, { id: 'clean+construct', clean: true, construct: true }, { id: 'clean+construct+best', clean: true, construct: true, multistart: true }],
    build: buildImprove, consts: { origin: '{x:0, y:0} — מספר כנקודה על ציר' }, mined: /(while|loop)\[[^\]]*(sort1|min|⟨sort⟩|⟨extreme⟩)/,
  },
  {
    id: 'capacitated-greedy', he: 'כל פריט לסל הטוב שיש בו מקום', exec: true,
    says: 'K תאים בכל סל ותא-חוץ רחוק; הפריטים מהקרוב-לסל-שלו ראשון; כל אחד לוקח את התא הפנוי הקרוב, והתא יוצא',
    inputs: [{ name: 'bins', sem: 'pts' }, { name: 'items', sem: 'pts' }, { name: 'cap', sem: 'num' }], slots: SLOTS_ROUTE,
    variants: [{ id: 'capacity', capacity: true }, { id: 'capacity+bykey', capacity: true, byKey: true }],
    build: buildCapacitated, out: { ITEM: 'pt', BIN: 'int' },
    consts: { far: '{x:1e9, y:1e9, BIN:-1} — תא-החוץ: רחוק מכל מקום, ולכן נלקח רק כשאין תא פנוי (−1 = "אין סל", המוסכמה של findIndex)', slots: 'K עותקים של כל סל: לולאה על K הפריטים הראשונים (רק המספר שלהם משמש)', origin: '{x:0, y:0} — מיון לפי {x: מרחק} = מהקרוב לרחוק' },
    mined: /loop\[[^\]]*(sort1|min|⟨sort⟩|⟨extreme⟩)[^\]]*pick|loop\[[^\]]*pick[^\]]*(sort1|min|⟨sort⟩|⟨extreme⟩)/,
  },
  {
    id: 'nearest-each', he: 'לכל אחד — הקרוב', exec: true,
    says: 'כל פריט לסל הקרוב אליו (בלי תקרה): ORDER על הסלים ביחס לפריט ⇒ הראשון',
    inputs: [{ name: 'bins', sem: 'pts' }, { name: 'items', sem: 'pts' }, { name: 'cap', sem: 'num' }], slots: SLOTS_ROUTE,
    variants: [{ id: 'plain', capacity: false }], build: (f) => ({ ...buildCapacitated(f), inputs: ['bins', 'items', 'cap'] }), out: { ITEM: 'pt', BIN: 'int' },
    consts: { origin: 'הסלים עם המספר שלהם (BIN) — חיווט' }, mined: /(map|loop)\[[^\]]*(sort1|min|⟨extreme⟩|⟨sort⟩)/,
  },
  {
    id: 'fan-in', he: 'שניים על אותו קלט ואז צירוף', exec: true,
    says: 'C(A(x), B(x)) — למשל ממוצע = יחס(סכום, ספירה)',
    inputs: [{ name: 'x', sem: 'any' }],
    slots: { A: { sem: ['@x'], out: 'num', ...AGG }, B: { sem: ['@x'], out: 'num', ...AGG }, C: { sem: ['num', 'num'], out: 'any', ...BIN } },
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$x'] }, { id: 'b', slot: 'B', args: ['$x'] }, { id: 'c', slot: 'C', args: ['@a', '@b'] }], out: 'c' },
    mined: 'dag:fan-in',
  },
  {
    id: 'chain2', he: 'חלק ואז חלק', exec: true, says: 'B(A(x)) — בשלוש הקלדות: באמצע רשימה / מספר / נקודות',
    inputs: [{ name: 'x', sem: 'any' }],
    slots: { A: { sem: ['@x'], out: 'nums', cls: ['list>list', 'list>any', 'x>any', 'num>num', 'x>x'] }, B: { sem: ['nums'], out: 'any', cls: ['list>list', 'list>any', 'x>any', 'num>num', 'x>x'] } },
    typings: [{ id: 'mid-nums' }, { id: 'mid-num', A: { out: 'num' }, B: { sem: ['num'] } }, { id: 'mid-pts', A: { out: 'pts' }, B: { sem: ['pts'] } }],
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$x'] }, { id: 'b', slot: 'B', args: ['@a'] }], out: 'b' }, mined: 'dag:chain2',
  },
  {
    id: 'chain3', he: 'שלושה חלקים ברצף', exec: true, says: 'C(B(A(x)))',
    inputs: [{ name: 'x', sem: 'any' }],
    slots: { A: { sem: ['@x'], out: '@x', ...LST }, B: { sem: ['@x'], out: '@x', ...LST }, C: { sem: ['@x'], out: 'any', cls: ['list>any', 'list>list'] } },
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$x'] }, { id: 'b', slot: 'B', args: ['@a'] }, { id: 'c', slot: 'C', args: ['@b'] }], out: 'c' }, mined: 'dag:chain3',
  },
  {
    id: 'pair-measure', he: 'מדוד כל אחד ואז השווה', exec: true, says: 'C(A(x), A(y)) — אותו מודד לשני הדברים, ואז משווה',
    inputs: [{ name: 'x', sem: 'any' }, { name: 'y', sem: '@x' }],
    slots: { A: { sem: ['@x'], out: 'num', cls: ['x>any', 'list>any', 'num>num'] }, C: { sem: ['num', 'num'], out: 'num', ...BIN } },
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$x'] }, { id: 'b', slot: 'A', args: ['$y'] }, { id: 'c', slot: 'C', args: ['@a', '@b'] }], out: 'c' }, mined: 'dag:pair',
  },
  {
    id: 'pair-measure-from', he: 'מדוד כל אחד מנקודה ואז השווה', exec: true, says: 'C(M(x, o), M(y, o)) — מי קרוב יותר לנקודה',
    inputs: [{ name: 'x', sem: 'pt' }, { name: 'y', sem: 'pt' }],
    slots: { MEASURE: SLOTS_ROUTE.MEASURE, C: { sem: ['num', 'num'], out: 'num', ...BIN } },
    graph: { nodes: [{ id: 'a', slot: 'MEASURE', args: ['$x', ORIGIN] }, { id: 'b', slot: 'MEASURE', args: ['$y', ORIGIN] }, { id: 'c', slot: 'C', args: ['@a', '@b'] }], out: 'c' },
    consts: { origin: '{x:0, y:0} — נקודת-הייחוס' }, mined: 'dag:pair',
  },
  {
    id: 'map-each', he: 'כל פריט — אותו חלק', exec: true, says: 'לולאה על הרשימה: A(פריט) לכל פריט, הפלטים ברשימה',
    inputs: [{ name: 'xs', sem: 'list' }],
    slots: { A: { sem: ['@xs[]'], out: 'any', cls: ['x>any', 'num>num', 'x>x', 'tier'] } },
    graph: { nodes: [{ id: 'm', loop: { over: '$xs', init: 0, item: 'v', state: 'z', nodes: [{ id: 'a', slot: 'A', args: ['$v'] }], next: '$z', emit: '@a' } }], outWire: '@m.emits' }, mined: /\bmap\b/,
  },
  {
    id: 'sort-first', he: 'מיין ואז קח ראשון', exec: true, says: 'A(xs)[0] — הראשון אחרי מיון',
    inputs: [{ name: 'xs', sem: 'list' }],
    slots: { A: { sem: ['@xs'], out: '@xs', cls: ['list>list'] } },
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$xs'] }], outWire: '@a.0' }, mined: /\bsort1\b/,
  },
  {
    id: 'top-k', he: 'מיין ואז קח k', exec: true, says: 'A(xs).slice(0, k)',
    inputs: [{ name: 'xs', sem: 'list' }, { name: 'k', sem: 'num' }],
    slots: { A: { sem: ['@xs'], out: '@xs', cls: ['list>list'] } },
    graph: { nodes: [{ id: 'a', slot: 'A', args: ['$xs'] }], outWire: { $slice: ['@a', 0, '$k'] } }, mined: /\btopk\b/,
  },
  {
    id: 'group-count', he: 'קבץ ואז ספור', exec: true, says: 'G(xs) ⇒ לכל קבוצה C(קבוצה)',
    inputs: [{ name: 'xs', sem: 'list' }],
    slots: { G: { sem: ['@xs'], out: 'list', roles: ['group', 'tally', 'split', 'bucket'] }, C: { sem: ['@xs'], out: 'any', cls: ['list>any'] } },
    graph: { nodes: [{ id: 'g', slot: 'G', args: ['$xs'] }, { id: 'm', loop: { over: '@g', init: 0, item: 'v', state: 'z', nodes: [{ id: 'c', slot: 'C', args: ['$v'] }], next: '$z', emit: '@c' } }], outWire: '@m.emits' }, mined: /\bgroup\b/,
  },
  {
    id: 'scan', he: 'צבור לאורך רצף', exec: true, says: 'מצב = A(מצב, פריט) לכל פריט; הפלט = המצב אחרי כל פריט (רצף מצטבר)',
    inputs: [{ name: 'xs', sem: 'nums' }],
    slots: { A: { sem: ['num', 'num'], out: 'num', cls: ['x+x>any'] } },
    typings: [{ id: 'binary' }, { id: 'list-of-two', A: { sem: ['nums'], cls: ['list>any'] }, args: { a: [['$z', '$v']] } }],
    graph: { nodes: [{ id: 's', loop: { over: '$xs', init: 0, item: 'v', state: 'z', nodes: [{ id: 'a', slot: 'A', args: ['$z', '$v'] }], next: '@a', emit: '@a' } }], outWire: '@s.emits' },
    consts: { zero: '0 — המצב ההתחלתי' }, mined: /loop\[[^\]]*acc[^\]]*push|loop\[[^\]]*push[^\]]*acc/,
  },
  {
    id: 'fold', he: 'צבור לערך אחד', exec: true, says: 'כמו "צבור לאורך רצף", אבל רק המצב בסוף',
    inputs: [{ name: 'xs', sem: 'nums' }],
    slots: { A: { sem: ['num', 'num'], out: 'num', cls: ['x+x>any'] } },
    typings: [{ id: 'binary' }, { id: 'list-of-two', A: { sem: ['nums'], cls: ['list>any'] }, args: { a: [['$z', '$v']] } }],
    graph: { nodes: [{ id: 's', loop: { over: '$xs', init: 0, item: 'v', state: 'z', nodes: [{ id: 'a', slot: 'A', args: ['$z', '$v'] }], next: '@a' } }], outWire: '@s.state' },
    consts: { zero: '0 — המצב ההתחלתי' }, mined: /\bfold\b|loop\[acc\]/,
  },
  {
    id: 'count-by-ones', he: 'ספור = סכום של אחדים', exec: true, says: 'כל פריט ⇒ 1 (קבוע), ואז S(אחדים)',
    inputs: [{ name: 'xs', sem: 'list' }],
    slots: { S: { sem: ['nums'], out: 'num', roles: ['sum', 'combine', 'accumulate'], contract: 'additive' } },
    graph: { nodes: [{ id: 'm', loop: { over: '$xs', init: 0, item: 'v', state: 'z', nodes: [], next: '$z', emit: 1 } }, { id: 's', slot: 'S', args: ['@m.emits'] }], out: 's' },
    consts: { one: '1 — כל פריט נספר פעם אחת' }, mined: /loop\[[^\]]*\binc\b/,
  },
  {
    id: 'window', he: 'חלון-נע', exec: true, says: 'לכל מקום k: A(xs.slice(k, k+w)) — k+w במשבצת SUM',
    inputs: [{ name: 'xs', sem: 'nums' }, { name: 'w', sem: 'num' }],
    slots: { A: { sem: ['nums'], out: 'any', cls: ['list>any'] }, SUM: SLOTS_ROUTE.SUM },
    graph: { nodes: [{ id: 'm', loop: { over: '$xs', init: 0, item: 'v', index: 'k', state: 'z', nodes: [{ id: 'e', slot: 'SUM', args: [['$k', '$w']] }, { id: 'a', slot: 'A', args: [{ $slice: ['$xs', '$k', '@e'] }] }], next: '$z', emit: '@a' } }], outWire: '@m.emits' }, mined: /\bwindow\b/,
  },
  {
    id: 'merge-runs', he: 'מיזוג-רצפים', exec: true, says: 'A(a ++ b) — שרשור ואז סידור',
    inputs: [{ name: 'a', sem: 'list' }, { name: 'b', sem: '@a' }],
    slots: { A: { sem: ['@a'], out: '@a', cls: ['list>list'] } },
    graph: { nodes: [{ id: 'm', slot: 'A', args: [{ $cat: ['$a', '$b'] }] }], out: 'm' }, mined: /\bmerge2\b/,
  },
  {
    id: 'fixpoint', he: 'נקודת-שבת', exec: true, says: 'x ⇐ A(x) עד שלא משתנה (עד 60 פעם)',
    inputs: [{ name: 'x', sem: 'any' }],
    slots: { A: { sem: ['@x'], out: '@x', cls: ['list>list', 'x>x', 'num>num'] } },
    graph: { nodes: [{ id: 'f', loop: { over: ['$x'], init: '$x', item: 'v', state: 'z', until: 'stable', max: 60, nodes: [{ id: 'a', slot: 'A', args: ['$z'] }], next: '@a' } }], outWire: '@f.state' },
    consts: { one: '[x] — סבב של פריט אחד; until: stable חוזר על הסבב' }, mined: /\bfix\b/,
  },
  {
    id: 'scan-route', he: 'צבור לאורך מסלול', exec: true, says: 'רגל-רגל לאורך הנקודות: MEASURE(הקודמת, הנוכחית), SUM מצטבר — שורה לכל תחנה',
    inputs: [{ name: 'route', sem: 'pts' }, { name: 'spec', sem: 'rec' }],
    slots: { MEASURE: SLOTS_ROUTE.MEASURE, SUM: SLOTS_ROUTE.SUM },
    graph: { nodes: [{ id: 'go', loop: { over: { $slice: ['$route', 1] }, init: { prev: '$route.0', acc: 0 }, item: 'p', state: 's', nodes: [{ id: 'd', slot: 'MEASURE', args: ['$s.prev', '$p'] }, { id: 'a', slot: 'SUM', args: [['$s.acc', '@d']] }], next: { prev: '$p', acc: '@a' }, emit: { NUM: '@a' } } }], outWire: '@go.emits' },
    out: { NUM: 'num' }, consts: { zero: '0 — מתחילים מאפס' }, mined: /loop\[[^\]]*acc/,
  },
  {
    id: 'best-of-two', he: 'הטוב מבין שניים', exec: true, says: 'A(x) או B(x) — מה ש-M נותן לו פחות (מספר כנקודה על ציר + PICK)',
    inputs: [{ name: 'from', sem: 'pt' }, { name: 'stops', sem: 'pts' }], slots: SLOTS_ROUTE,
    variants: [{ id: 'nn-vs-given', construct: true, multistart: true }], build: buildImprove, consts: { origin: '{x:0, y:0}' }, mined: /(min|max)\b|pick/,
  },
  {
    id: 'binary-search', he: 'חיפוש-בינארי', exec: false, why: 'עדכון lo או hi לפי השוואה = חוט-תנאי — graph.mjs לא מחשב בחוטים (במכוון); אין משבצת "בחר לפי בוליאני" שאינה חישוב', mined: /\bbsearch\b/,
  },
  {
    id: 'bfs-relax', he: 'BFS / רלקסציה ברשת', exec: false, why: 'תור שגדל לפי שכנים ועדכון dist[v] במקום = מערך שמתעדכן באינדקס — אין חוט "עדכן בתא", והתור תלוי-תנאי', mined: /\bqueue\b/,
  },
  {
    id: 'filter-by-test', he: 'סנן לפי בדיקה', exec: false, why: 'שמירה של פריט רק אם הבדיקה אמת = תנאי בחוט; חלקי-הקטלוג מקבלים נתונים, לא פונקציה-בודקת (אותה סיבה שהלולאה נבנתה כחיווט)', mined: /\bfilter\b/,
  },
];

export const SHAPE_BY_ID = new Map(SUPER.map((s) => [s.id, s]));

/** הצורה ⇒ תבניות (וריאנט אחד = תבנית אחת): {shape, variant, inputs, nodes, out|outWire, slots, consts}. */
export function templatesOf(shape) {
  if (!shape.exec) return [];
  const base = { shape: shape.id, consts: shape.consts || {}, outSpec: shape.out || null };
  if (shape.build) return shape.variants.map((v) => ({ ...base, variant: v.id, ...shape.build(v), slots: shape.slots }));
  const typings = shape.typings || [{ id: 'base' }];
  return typings.map((ty) => {
    const slots = Object.fromEntries(Object.entries(shape.slots).map(([k, sl]) => [k, ty[k] ? { ...sl, ...ty[k] } : sl]));
    // ‎args‎ בהקלדה: ארגומנטים אחרים לצומת (למשל [[z, v]] — רשימה של שניים במקום שני קלטים)
    const nodes = ty.args ? mapArgs(shape.graph.nodes, ty.args) : shape.graph.nodes;
    return { ...base, variant: ty.id, inputs: shape.inputs.map((i) => i.name), ...shape.graph, nodes, slots };
  });
}
function mapArgs(nodes, over) {
  return nodes.map((n) => (n.loop ? { ...n, loop: { ...n.loop, nodes: mapArgs(n.loop.nodes, over) } } : over[n.id] ? { ...n, args: over[n.id] } : n));
}
