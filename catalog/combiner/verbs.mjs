/**
 * 🔤 המצרף · רשימת-הפעלים הזמנית + המתייג הסטטי (COMBINER, 14.10.2026).
 *
 * חלק נקרא לפי **מה הוא עושה** (פועל), לא לפי העולם שבשבילו נבנה. העולם מגיע עם הבקשה.
 * עד שקורא-ההתנהגות (`catalog/verbs.json` + `catalog/behavior/*.json`) מתמזג — מתייגים כאן מהשם, מההערה
 * ומשם-הפונקציה (`labeledBy: "static"`). כשהוא קיים — `labelsFromBehavior` גובר.
 *
 * טהור ודטרמיניסטי: בלי fs, בלי שעון. רץ גם ב-node וגם בדפדפן (lab.html).
 */

/** first = המילה הראשונה של השם (צורת-הפועל); re = ביטוי בשם/בתיאור; sym = שם-הפונקציה. */
export const VERBS = [
  { id: 'divide', he: 'מחלק', plain: 'מחלק דבר אחד לחלקים', first: ['מחלק', 'חלק', 'לחלק', 'מפצל', 'פצל', 'לפצל', 'מפרק', 'לפרק'], re: /לחלקים|זווית הזהב|חלקים שווים/, sym: /^(divide|split|chunk|partition|slice)/i },
  { id: 'merge', he: 'מחבר צמודים', plain: 'מחבר דברים צמודים לרצף אחד', first: ['מזג', 'ממזג', 'למזג', 'מאחד', 'לאחד', 'אחד'], re: /צמודים|רצף של|לרצף/, sym: /^(merge|coalesce|union|combineRuns)/i },
  { id: 'next', he: 'הבא בתור', plain: 'מוצא את הבא בתור', first: ['הבא'], re: /הבא בתור|הזמן הבא|הבאה|הבא$|הקרוב ביותר|למניין הבא/, sym: /^(next|upcoming|nearest|firstRun)/i },
  { id: 'round', he: 'מעגל', plain: 'מעגל לצעד קבוע', first: ['מעגל', 'עגל', 'לעגל'], re: /מעוגל|לעגל|עיגול|מעגל /, sym: /^(round|ceil|floor|quantize)/i },
  { id: 'offset', he: 'מזיז', plain: 'מזיז זמן או מספר לפני או אחרי', first: ['מזיז', 'הזז', 'להזיז'], re: /לפני או אחרי|מוסיף ומוריד|מזיז /, sym: /^(offset|shift|add(Days|Minutes|Months|Hours)|plus)/i },
  { id: 'escalate', he: 'מעביר הלאה', plain: 'מעביר הלאה כשאין תשובה', first: [], re: /הלאה|אין תשובה|מסלים/, sym: /escalat|fallbackChain/i },
  { id: 'rotate', he: 'בתורות', plain: 'נותן לכל אחד את תורו', first: [], re: /בתורות|תורנות|תורו של|התור של/, sym: /^(rotate|turnOf|turnIndex|fairAssign|roundRobin)/i },
  { id: 'fuzzy', he: 'מוצא עם טעות', plain: 'מוצא גם עם טעות כתיב', first: [], re: /טעות כתיב|דומה ל|כמעט/, sym: /fuzzy|levenshtein|similar/i },
  { id: 'sort', he: 'ממיין', plain: 'מסדר לפי סדר', first: ['מיין', 'ממיין', 'למיין', 'מסדר', 'לסדר', 'סדר'], re: /לפי הסדר|ממוינ|מיון/, sym: /^(sort|orderBy|ordered|byDate|byName)/i },
  { id: 'filter', he: 'מסנן', plain: 'משאיר רק את מה שעובר תנאי', first: ['מסנן', 'סנן', 'לסנן', 'השאר', 'הסר', 'מסיר', 'להסיר'], re: /רק את |משאיר רק/, sym: /^(filter|only|without|exclude|keep|reject)/i },
  { id: 'count', he: 'סופר', plain: 'סופר כמה', first: ['ספור', 'סופר', 'לספור', 'מונה'], re: /^כמה |מספר ה/, sym: /^(count|tally|howMany)/i },
  { id: 'sum', he: 'מסכם', plain: 'מחבר את כולם לסכום', first: ['סכם', 'מסכם', 'לסכם', 'חבר'], re: /^חשב סכום|הסכום הכולל|סך הכול|סה״כ/, sym: /^(sum|total)([A-Z]|$)/ },
  { id: 'minmax', he: 'הכי גדול / קטן', plain: 'מוצא את הגדול או הקטן', first: [], re: /הגדול|הקטן|מינימום|מקסימום|המקסימלי|המינימלי|הכי /, sym: /^(min|max)(Of|By|imum|Value)?$|^(largest|smallest|argMin|argMax)/ },
  { id: 'group', he: 'מקבץ', plain: 'מקבץ לפי מפתח', first: ['מקבץ', 'קבץ', 'לקבץ', 'מקבצ'], re: /לפי קבוצ|קבוצות/, sym: /^(group|bucket|byKey|indexBy|partitionBy)/i },
  { id: 'dedupe', he: 'מוריד כפולים', plain: 'מוריד כפילויות', first: [], re: /כפולים|כפילויות|כפילות/, sym: /dedup|unique|uniq|distinct/i },
  { id: 'rank-tiers', he: 'מדרג לשלבים', plain: 'שם כל דבר בדרגה או בשלב', first: ['מדרג', 'דרג', 'לדרג', 'מסווג', 'סווג', 'לסווג'], re: /דרגה|דרגות|שלב |רמת |רמה |רמות/, sym: /tier|rank|level|grade|classify|stage/i },
  { id: 'compare', he: 'משווה', plain: 'משווה בין שניים', first: ['משווה', 'להשוות', 'השווה'], re: /השוואה|הפרש|שווה/, sym: /^(compare|diff|equal|cmp|same)/i },
  { id: 'convert', he: 'ממיר', plain: 'הופך צורה אחת לאחרת', first: ['הופך', 'ממיר', 'להמיר', 'המר', 'מפענח', 'פענח', 'לפענח'], re: /הופך .* ל/, sym: /(^to[A-Z]|[a-z]To[A-Z]|^convert|^parse|^from[A-Z]|^hmToMin|^minToHm)/ },
  { id: 'clamp', he: 'מגביל לתחום', plain: 'שומר בתוך גבולות', first: ['הגבל', 'מגביל', 'להגביל'], re: /לתחום|בתוך הגבול|רווי/, sym: /clamp|bound|limit|saturat/i },
  { id: 'reverse', he: 'הופך סדר', plain: 'הופך את הסדר', first: [], re: /הפוך רשימה|בסדר הפוך|הופך את הסדר/, sym: /^reverse/i },
  { id: 'search', he: 'מחפש', plain: 'מחפש ומוצא', first: ['חפש', 'מחפש', 'לחפש', 'למצוא'], re: /חיפוש|מחפש/, sym: /^(search|find|lookup|match|locate)/i },
  { id: 'gate', he: 'שער', plain: 'עוצר הכול אם בדיקה אחת נכשלת', first: ['בודק', 'בדוק', 'לבדוק', 'מאשר', 'מאמת', 'לאמת', 'אמת', 'מכריע'], re: /^(בודק|בדוק) אם|חוסם|נעילה|שער /, sym: /^(is[A-Z]|can[A-Z]|has[A-Z]|should|check|validate|guard|gate|allow|verify)/ },
  { id: 'format', he: 'מנסח', plain: 'כותב יפה לקריאה', first: ['כותב', 'כתוב', 'מעצב', 'מנסח', 'לנסח', 'נסח'], re: /באותיות|במילים|לתצוגה/, sym: /^(format|fmt|render|toText|describe|print|pretty)/i },
  { id: 'personalize', he: 'מתאים אישית', plain: 'פונה לכל אחד לפי מה שלו', first: ['מתאים', 'להתאים', 'התאם'], re: /אישי|מותאם|פונה ל|ברכה/, sym: /personali|greet|salut|tailor/i },
  { id: 'require-source', he: 'דורש מקור', plain: 'לא מקבל טענה בלי מקור', first: [], re: /מקור|ציטוט|הוכחה|מראה מקום|אסמכתא|ראיה/, sym: /source|cite|citation|evidence|provenance/i },
  { id: 'frame-swap', he: 'מחליף מסגרת', plain: 'אומר אותו דבר במילים של עולם אחר', first: ['מתרגם', 'לתרגם', 'תרגם'], re: /מסגור|נקודת מבט|מונח|מילון/, sym: /^(frame|termOf|translate|i18n|swap|vocab)/i },
  { id: 'daily-snapshot', he: 'צילום יומי', plain: 'שומר תמונת מצב של כל יום', first: [], re: /יומי|תמונת מצב|צילום|עיתון|גיליון|תקציר|כל יום/, sym: /snapshot|daily|digest|briefing|newspaper|nightly/i },
  { id: 'assign-role', he: 'נותן תפקיד', plain: 'נותן לכל אחד תפקיד', first: ['משבץ', 'שבץ', 'לשבץ', 'משייך', 'מקצה', 'להקצות'], re: /תפקיד|שיבוץ/, sym: /role|assign|allocate/i },
  { id: 'round-robin', he: 'שואל בסבב', plain: 'שואל אחד אחרי השני בסבב', first: [], re: /בתורות|סבב|אחד אחרי השני/, sym: /roundRobin|fairAssign|rotate/i },
  { id: 'route-channel', he: 'מנתב לערוץ', plain: 'שולח בערוץ הנכון', first: ['מנתב', 'לנתב', 'נתב'], re: /ערוץ|ערוצים|ניתוב/, sym: /route|channel|dispatch/i },
  { id: 'tolerate-failure', he: 'עמיד לתקלה', plain: 'ממשיך גם כשמשהו נכשל', first: [], re: /כשאי אפשר|גם אם|נופל|נכשל|כשל|תקלה|ברירת מחדל|בבטחה|בבטחון/, sym: /^(safe|fallback|tryParse|tolerant|retry|heal|withFallback)/i },
  { id: 'pace', he: 'שומר קצב', plain: 'לא מהר מדי — שומר מרווח', first: [], re: /קצב|מרווח|השהיה|המתנה|לאט/, sym: /pace|throttle|debounce|rateLimit|delay|backoff|cooldown/i },
  { id: 'hub-relay', he: 'עובר דרך מרכז', plain: 'כולם מדברים דרך מרכז אחד', first: [], re: /מרכזייה|מרכזיה|ממסר|דרך המרכז|דרך מרכז/, sym: /^(hub|relay|broker|proxy|switchboard)|(Relay|Broker|Proxy|Switchboard)([A-Z]|$)/ },
  { id: 'transcript', he: 'רושם יומן', plain: 'רושם מה קרה, לפי הסדר', first: ['רושם', 'לרשום', 'רשום'], re: /יומן|תמליל|(^|\s)לוג(\s|$)|היסטוריה|רישום/, sym: /^(log|audit|transcript|journal|history|pushAudit|logAccess)/i },
  { id: 'sun-position', he: 'מקום השמש', plain: 'יודע איפה השמש', first: [], re: /שמש|זריחה|שקיעה|הנץ|זמני היום|שעת קיר/, sym: /^(sun|solar|azimuth)|(Sun|Solar|Azimuth)([A-Z]|$)|[zZ]man/ },
];

export const VERB_IDS = VERBS.map((v) => v.id);
export const VERB_BY_ID = Object.fromEntries(VERBS.map((v) => [v.id, v]));
/** פועל-המדף: מתכון ששמרו ונהיה חלק חדש. */
export const RECIPE_VERB = { id: 'recipe', he: 'מתכון שמור', plain: 'הרכבה ששמרו ונהייתה חלק חדש' };

/** שמונת החלקים של אורביט — כל אחד הוא הפועל שלו (ונבדק בחוקים של המאמת). */
export const ATOM_OF_PATH = {
  'src/lib/atoms/parts/divide.ts': 'divide',
  'src/lib/atoms/parts/merge.ts': 'merge',
  'src/lib/atoms/parts/next.ts': 'next',
  'src/lib/atoms/parts/round.ts': 'round',
  'src/lib/atoms/parts/offset.ts': 'offset',
  'src/lib/atoms/parts/escalate.ts': 'escalate',
  'src/lib/atoms/parts/rotate.ts': 'rotate',
  'src/lib/atoms/parts/fuzzy.ts': 'fuzzy',
};
/** פעלים נוספים שהחלק הקטן מקיים (בתורות = גם שאילה בסבב). */
const ATOM_EXTRA = { rotate: ['round-robin'] };

const MAX_VERBS = 3;

/**
 * פעלי-חלק מהשם ומשם-הפונקציה, עם חוזק: 0 = הפועל הוא המילה הראשונה בשם (או חלק קטן של אורביט),
 * 1 = ביטוי בשם, 2 = רק משם-הפונקציה. ממוין לפי סדר VERBS, עד 3.
 */
export function staticVerbsScored(part) {
  const atom = part.source === 'orbit' && part.what === 'brick' ? ATOM_OF_PATH[part.path] : null;
  if (atom) return [atom, ...(ATOM_EXTRA[atom] || [])].map((id) => ({ id, s: 0 }));
  if (part.what === 'component' || part.gives?.kind === 'ui') return [];
  const name = String(part.name || '');
  const firstWord = name.split(/\s+/)[0] || '';
  // השם בלבד (התיאור רועש מדי — "מקור", "לוג" בתוך מילים אחרות)
  const sym = String(part.symbol || '').replace(/^.*[.#]/, '');
  const out = [];
  for (const v of VERBS) {
    const s = v.first.includes(firstWord) ? 0 : v.re.test(name) ? 1 : v.sym.test(sym) ? 2 : -1;
    if (s < 0) continue;
    // שער = בדיקה שנותנת כן/לא
    if (v.id === 'gate' && part.gives?.kind !== 'bool') continue;
    // ממיר = משנה צורה (הסוג יוצא אחר מהנכנס)
    if (v.id === 'convert' && (part.takes || []).every((t) => t.kind === part.gives?.kind)) continue;
    out.push({ id: v.id, s });
  }
  return out.slice(0, MAX_VERBS);
}

/** רק המזהים. */
export const staticVerbs = (part) => staticVerbsScored(part).map((v) => v.id);

/**
 * תוויות מקורא-ההתנהגות (כשמתמזג): מקבל את תוכן `catalog/behavior/*.json` (כל צורה שיש בה {id, verbs[]})
 * ומחזיר מפה id ⇒ verbs. סובלני לצורה — הקורא עוד נכתב במקביל.
 */
export function labelsFromBehavior(docs) {
  const map = new Map();
  const visit = (x) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(visit);
    if (typeof x.id === 'string' && Array.isArray(x.verbs)) {
      const vs = x.verbs.map((v) => (typeof v === 'string' ? v : v && (v.verb || v.id))).filter((v) => typeof v === 'string');
      if (vs.length) map.set(x.id, vs);
    }
    for (const k of Object.keys(x)) if (k !== 'verbs') visit(x[k]);
  };
  visit(docs);
  return map;
}
