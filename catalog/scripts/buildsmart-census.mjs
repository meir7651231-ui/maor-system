#!/usr/bin/env node
/**
 * 📚 מפקד-החלקים · BuildSmart (קטלוג משותף, 14.10.2026).
 *
 * קורא את הריפו של בנייה-חכמה (קריאה בלבד, ענף main) ומוציא כל חלק קטן וטהור בפורמט-החלק המשותף:
 *   • app/src        (Preact + TypeScript, האפליקציה החיה)   — TypeScript compiler API
 *   • functions/src  (Firebase Functions, TypeScript)        — TypeScript compiler API
 *   • app_flutter/lib (Flutter / Dart, האפליקציה החדשה)       — סורק-Dart קל (בלי SDK)
 *   • orchestrator/  — רק סקריפטי-מעטפת (sh); אין בו עוזרים טהורים ב-TS/JS ⇒ לא ממופה (מתועד ב-notes).
 *
 * רק חתימות ותיעוד-קוד. לא מעתיקים ערכי-נתונים, לא סודות. הדוגמאות כתובות ביד ומנוקות.
 * דטרמיניסטי: אותו ריפו באותו sha ⇒ אותו קובץ, בייט-בבייט.
 *
 * שימוש:
 *   node catalog/scripts/buildsmart-census.mjs [--repo <path>] [--check]
 *   --repo   נתיב לשכפול של buildsmart (ברירת-מחדל: $BUILDSMART_REPO או ../meir7651231-ui/buildsmart)
 *   --check  לא כותב; יוצא 1 אם הקובץ השמור לא תואם למה שהיה נכתב עכשיו.
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'catalog', 'sources', 'buildsmart.json');
const SOURCE = 'buildsmart';
const REPO_SLUG = 'meir7651231-ui/buildsmart';

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const repoArg = argv.indexOf('--repo') >= 0 ? argv[argv.indexOf('--repo') + 1] : null;
const REPO = path.resolve(
  repoArg || process.env.BUILDSMART_REPO || path.join(ROOT, '..', 'meir7651231-ui', 'buildsmart'),
);

// ═══════════════════════════════════════════════════════════════════════════
// כלים כלליים
// ═══════════════════════════════════════════════════════════════════════════

function walk(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      walk(p, pred, acc);
    } else if (pred(p)) acc.push(p);
  }
  return acc;
}

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

/** מפצל מזהה (camelCase / snake_case / PascalCase) למילים קטנות. */
function splitWords(id) {
  return id
    .replace(/^_+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_$]+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════
// מיפוי טיפוס ⇒ kind (אוצר-מילים סגור)
// ═══════════════════════════════════════════════════════════════════════════

const MONEY_HINT = /(price|cost|total|sum|amount|money|ils|nis|vat|budget|fee|pay|paid|balance|credit|debt|subtotal|discount|charge|revenue|profit|margin|salary|wage|rate|tip|refund|invoice|spend|spent|shekel|agorot|cents?)/;
const QTY_HINT = /(qty|quantity|count|units?|pieces?|pcs|stock|kg|meters?|length|area|volume|weight|liters?|boxes|bags|sheets|rolls|amount)/;
const SPAN_HINT = /(duration|minutes|mins|hours|seconds|secs|ms|days|span|range|window|interval|elapsed|ttl|timeout)/;
const DATE_HINT = /(date|day|iso|when|at$|deadline|due|since|until|birthday|month|year|week|timestamp|ts$)/;
const GEO_HINT = /(lat|lng|lon|geo|coord|location|position|distance|km)/;
const SEQ_HINT = /(slots|flags|mask|bits|open|closed|busy|free)/;

/** עוטפים שקופים: Future/Promise/Iterable/... */
function unwrapOnce(t) {
  const m = /^(?:Future|FutureOr|Promise|Readonly|ReadonlyArray|Signal|ReadonlySignal|ValueNotifier|AsyncValue)\s*<([\s\S]+)>$/.exec(t);
  return m ? m[1].trim() : null;
}

function kebab(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * מחזיר kind מתוך האוצר הסגור, לפי הטיפוס + רמזי-שם.
 * ctx = { enums:Set, classes:Set, lang }
 */
function kindOf(rawType, name, ctx) {
  let t = (rawType || '').replace(/\s+/g, ' ').trim().replace(/\?$/, '').replace(/\s*\|\s*(undefined|null)\b/g, '').replace(/^(undefined|null)\s*\|\s*/, '').trim();
  const n = (name || '').toLowerCase();
  if (!t || t === 'dynamic' || t === 'any' || t === 'unknown' || t === 'Object' || t === 'var' || t === 'final') {
    // בלי טיפוס — מנחשים לפי השם בלבד
    if (MONEY_HINT.test(n)) return 'amount';
    if (DATE_HINT.test(n)) return 'date';
    return 'unknown';
  }
  if (/^\w+ is /.test(t) || t.startsWith('asserts ')) return 'bool';
  t = t.replace(/^\|\s*/, '');
  if (t === 'void' || t === 'Never' || t === 'never' || t === 'Null') return 'unknown';
  if (/^(Stream|EventChannel)\b/.test(t)) return 'unknown';
  const inner = unwrapOnce(t);
  if (inner) return kindOf(inner, name, ctx);

  // ui
  if (/^(Widget|PreferredSizeWidget|InlineSpan|TextSpan|JSX\.Element|VNode|ComponentChildren|ComponentChild|h\.JSX\.Element|Element)\b/.test(t)) return 'ui';
  if (/^(Color|IconData|TextStyle|BoxDecoration|EdgeInsets|BorderRadius|Gradient|LinearGradient|Icon)\b/.test(t)) return 'ui';
  // file / image / sound / geo
  if (/^(Uint8List|Uint8Array|Blob|File|XFile|ByteData|ArrayBuffer|Buffer|PdfDocument|pw\.Document)\b/.test(t)) return 'file';
  if (/^(Image|ImageProvider|ui\.Image|ImageBitmap)\b/.test(t)) return 'image';
  if (/^(AudioBuffer|Sound)\b/.test(t)) return 'sound';
  if (/^(LatLng|GeoPoint|Position|Offset)\b/.test(t)) return 'geo';
  // span
  if (/^(Duration|DateTimeRange|TimeRange|DateRange|Range)\b/.test(t)) return 'span';
  // date
  if (/^(DateTime|Date|TimeOfDay|Timestamp)$/.test(t)) return 'date';
  // bool
  if (t === 'bool' || t === 'boolean' || t === 'true' || t === 'false') return 'bool';
  // numbers
  if (/^(int|double|num|number|bigint|BigInt)$/.test(t)) {
    if (SPAN_HINT.test(n) && !MONEY_HINT.test(n)) return 'span';
    if (MONEY_HINT.test(n) || QTY_HINT.test(n)) return 'amount';
    if (GEO_HINT.test(n)) return 'geo';
    return 'number';
  }
  // text
  if (t === 'String' || t === 'string') {
    if (/(^|[^a-z])(iso|date|day|ymd)([^a-z]|$)/.test(n) || /date|iso/.test(n)) return 'date';
    return 'text';
  }
  // union of string literals ⇒ choice
  if (/^('[^']*'|"[^"]*"|\d+)(\s*\|\s*('[^']*'|"[^"]*"|\d+))+$/.test(t)) return 'choice';
  if (/^('[^']*'|"[^"]*")$/.test(t)) return 'text';
  // lists
  const listM = /^(?:List|Iterable|Set|ReadonlyArray|Array|UnmodifiableListView)\s*<([\s\S]+)>$/.exec(t) || /^([\w.]+(?:<[\s\S]+>)?)\[\]$/.exec(t) || /^readonly ([\w.]+(?:<[\s\S]+>)?)\[\]$/.exec(t);
  if (listM) {
    const el = listM[1].trim();
    const ek = kindOf(el, name, ctx);
    if (ek === 'date') return 'times';
    if (ek === 'bool') return 'sequence';
    if (SEQ_HINT.test(n) && ek === 'bool') return 'sequence';
    return 'list';
  }
  if (/^(Map|Record|ReadonlyMap|LinkedHashMap|Partial<Record)\b/.test(t) || /^\{\s*\[/.test(t)) return 'record:map';
  // Dart records / TS object literals / tuples
  if (t.startsWith('(') && ctx.lang === 'dart') {
    // (int, int) / ({int start, int end})
    if (/\b(start|from)\b[\s\S]*\b(end|to)\b/.test(t)) return 'span';
    return 'record:tuple';
  }
  if (t.startsWith('{')) {
    if (/\b(start|from)\b[\s\S]*\b(end|to)\b/.test(t)) return 'span';
    if (/\b(lat)\b[\s\S]*\b(lng|lon)\b/.test(t)) return 'geo';
    return 'record:object';
  }
  if (t.startsWith('[')) return 'record:tuple';
  if (/=>|\bFunction\b/.test(t)) return 'unknown';
  // enums ⇒ choice; classes/types ⇒ record:<entity>
  const base = t.replace(/<[\s\S]*>$/, '').replace(/^.*\./, '');
  if (ctx.enums.has(base)) return 'choice';
  if (/^[A-Z]$/.test(base)) return 'unknown'; // generic T
  if (/^[A-Z]\w*$/.test(base)) {
    if (/Range$|Span$|Window$/.test(base)) return 'span';
    return 'record:' + kebab(base);
  }
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// עברית פשוטה — שם (פועל+מושא) ומשפט "מה עושה"
// ═══════════════════════════════════════════════════════════════════════════

/** פעלים: מילה ראשונה במזהה ⇒ פועל בעברית (הווה, זכר-יחיד, כמו "מחשב"). */
const VERBS = {
  compute: 'מחשב', calc: 'מחשב', calculate: 'מחשב', estimate: 'מעריך', derive: 'גוזר', resolve: 'מכריע',
  format: 'מעצב', fmt: 'מעצב', f: 'מעצב', render: 'מצייר', build: 'בונה', make: 'יוצר', create: 'יוצר', compose: 'מרכיב',
  parse: 'מפענח', decode: 'מפענח', encode: 'מקודד', serialize: 'הופך לטקסט', deserialize: 'קורא מטקסט',
  to: 'ממיר ל', from: 'יוצר מתוך', as: 'מציג כ', normalize: 'מנרמל', norm: 'מנרמל', sanitize: 'מנקה', clean: 'מנקה', strip: 'מסיר',
  trim: 'מקצץ', clamp: 'מגביל', round: 'מעגל', ceil: 'מעגל למעלה', floor: 'מעגל למטה', split: 'מפצל', join: 'מחבר', merge: 'ממזג',
  combine: 'משלב', group: 'מקבץ', bucket: 'ממיין לסלים', partition: 'מחלק', chunk: 'מחלק לנתחים', divide: 'מחלק', slice: 'חותך',
  filter: 'מסנן', sort: 'ממיין', rank: 'מדרג', score: 'נותן ציון ל', pick: 'בוחר', choose: 'בוחר', select: 'בוחר',
  find: 'מוצא', search: 'מחפש', lookup: 'מאתר', match: 'מתאים', matches: 'בודק התאמה של', detect: 'מזהה', classify: 'מסווג',
  count: 'סופר', sum: 'מסכם', total: 'מסכם', avg: 'מחשב ממוצע של', average: 'מחשב ממוצע של', max: 'מוצא את המקסימום של', min: 'מוצא את המינימום של',
  is: 'בודק אם', has: 'בודק אם יש', can: 'בודק אם אפשר', should: 'מחליט אם צריך', needs: 'בודק אם צריך', allow: 'מתיר',
  allows: 'בודק אם מותר', are: 'בודק אם', was: 'בודק אם היה', contains: 'בודק אם מכיל', includes: 'בודק אם כולל', equals: 'משווה',
  validate: 'מאמת', verify: 'מאמת', check: 'בודק', ensure: 'מוודא', assert: 'מוודא', guard: 'שומר על',
  get: 'מחזיר', read: 'קורא', load: 'טוען', fetch: 'מביא', list: 'מונה', all: 'מחזיר את כל', of: 'מחזיר', for: 'מחזיר עבור', by: 'מחזיר לפי',
  next: 'מחזיר את הבא של', prev: 'מחזיר את הקודם של', previous: 'מחזיר את הקודם של', first: 'מחזיר את הראשון של', last: 'מחזיר את האחרון של',
  apply: 'מחיל', update: 'מעדכן', set: 'קובע', with: 'מחזיר עותק עם', add: 'מוסיף', append: 'מוסיף בסוף', insert: 'מכניס', push: 'דוחף',
  remove: 'מסיר', delete: 'מוחק', drop: 'משמיט', toggle: 'מחליף מצב של', reset: 'מאפס', clear: 'מנקה', replace: 'מחליף', swap: 'מחליף',
  map: 'ממפה', convert: 'ממיר', translate: 'מתרגם', label: 'נותן תווית ל', describe: 'מתאר', explain: 'מסביר', summarize: 'מסכם', summary: 'מסכם',
  plan: 'מתכנן', schedule: 'מתזמן', predict: 'חוזה', forecast: 'חוזה', suggest: 'מציע', recommend: 'ממליץ על', propose: 'מציע',
  diff: 'משווה הבדלים של', compare: 'משווה', cmp: 'משווה', dedup: 'מסיר כפילויות מ', dedupe: 'מסיר כפילויות מ', unique: 'מסיר כפילויות מ',
  expand: 'מרחיב', collapse: 'מכווץ', flatten: 'משטח', wrap: 'עוטף', unwrap: 'פותח', pad: 'מרפד', mask: 'מסתיר חלק מ', hash: 'מחשב חתימה ל',
  generate: 'מחולל', gen: 'מחולל', seed: 'זורע', sample: 'דוגם', shuffle: 'מערבב', rotate: 'מסובב', shift: 'מזיז', offset: 'מזיז', advance: 'מקדם',
  escape: 'מנטרל תווים ב', quote: 'מצטט', tokenize: 'מפרק למילים', stem: 'מוצא שורש ל', fuzzy: 'מחפש בקירוב', levenshtein: 'מודד מרחק בין מילים',
  route: 'מנתב', dispatch: 'מנתב', assign: 'משבץ', allocate: 'מקצה', reserve: 'שומר', quote2: 'מצטט מחיר', bill: 'מחייב',
  tax: 'מחשב מס על', vat: 'מחשב מע״מ על', discount: 'מחשב הנחה על', convertCurrency: 'ממיר מטבע', pluralize: 'מטה לרבים', plural: 'מטה לרבים',
  initials: 'מחזיר ראשי תיבות של', abbreviate: 'מקצר', shorten: 'מקצר', truncate: 'מקצר', ellipsize: 'מקצר עם שלוש נקודות',
  pct: 'מחשב אחוז', percent: 'מחשב אחוז', percentage: 'מחשב אחוז', ratio: 'מחשב יחס', progress: 'מחשב התקדמות', grade: 'מדרג',
  normalise: 'מנרמל', interpolate: 'משלב ערכים ב', lerp: 'מחשב ערך ביניים', snap: 'מצמיד', fit: 'מתאים', scale: 'משנה קנה מידה של',
  index: 'בונה אינדקס ל', indexOf: 'מוצא מיקום של', walk: 'עובר על', visit: 'עובר על', traverse: 'עובר על', collect: 'אוסף',
  extract: 'מחלץ', take: 'לוקח', skip: 'מדלג על', limit: 'מגביל', page: 'מחלק לעמודים', paginate: 'מחלק לעמודים',
  infer: 'מסיק', guess: 'מנחש', learn: 'לומד', explainWhy: 'מסביר למה', export: 'מייצא', import: 'מייבא', csv: 'בונה CSV של',
  copy: 'מעתיק', clone: 'משכפל', freeze: 'מקפיא', emit: 'פולט', on: 'מגיב ל', handle: 'מטפל ב', process: 'מעבד', run: 'מריץ', exec: 'מריץ',
  pretty: 'מייפה', humanize: 'מנסח לאדם', describe2: 'מתאר', mark: 'מסמן', tag: 'מתייג', flag: 'מסמן', bump: 'מעלה', inc: 'מעלה', dec: 'מוריד',
  require: 'דורש', required: 'מחזיר את הנדרש ל', missing: 'מוצא חסרים ב', default: 'מחזיר ברירת מחדל ל', fallback: 'מחזיר גיבוי ל',
  hebrew: 'מנסח בעברית', he: 'מנסח בעברית', key: 'בונה מפתח ל', id: 'בונה מזהה ל', slug: 'בונה מזהה קצר ל', url: 'בונה כתובת ל',
  resolveImage: 'מאתר תמונה ל', image: 'מאתר תמונה ל', icon: 'בוחר סמל ל', emoji: 'בוחר אמוג׳י ל', color: 'בוחר צבע ל', tone: 'בוחר גוון ל',
  effective: 'מחשב את הערך בפועל של', current: 'מחזיר את הנוכחי של', active: 'מחזיר את הפעילים של', visible: 'מחזיר את הגלויים של',
  available: 'מחזיר את הזמינים של', enabled: 'מחזיר את הפעילים של', can2: 'בודק אם אפשר', try: 'מנסה', maybe: 'אולי מחזיר', safe: 'מחזיר בבטחה',
  cheapest: 'מוצא את הזול ביותר של', cheaper: 'מוצא חלופה זולה ל', best: 'מוצא את הטוב ביותר של', top: 'מחזיר את המובילים של',
  children: 'מחזיר את הילדים של', parent: 'מחזיר את ההורה של', ancestors: 'מחזיר את השרשרת מעל', path: 'מחזיר את המסלול של',
  products: 'מחזיר מוצרים של', category: 'מחזיר קטגוריה של', variants: 'מחזיר וריאנטים של', tools: 'מחזיר כלים של', identity: 'מחשב זהות של',
  achievements: 'מחזיר הישגים של', rankOf: 'מדרג', compile: 'מהדר', interpret: 'מפרש', evaluate: 'מעריך', eval: 'מעריך',
  normalizePhone: 'מנרמל טלפון', phone: 'מעצב טלפון', email: 'בודק מייל', mailto: 'בונה קישור מייל ל', wa: 'בונה קישור וואטסאפ ל', whatsapp: 'בונה קישור וואטסאפ ל',
  plain: 'מנסח בפשטות', soft: 'מרכך', register: 'רושם', compatible: 'מוצא תואמים ל', valid: 'בודק תקינות של', canonical: 'מנרמל',
  distinct: 'מסיר כפילויות מ', cut: 'חותך', assemble: 'מרכיב', decide: 'מכריע', connect: 'מחבר', may: 'בודק אם מותר', show: 'מציג', edit: 'עורך',
  revert: 'מחזיר אחורה', claim: 'תובע', write: 'כותב', autodetect: 'מזהה אוטומטית', memoize: 'זוכר', supports: 'בודק אם תומך ב',
  sheet: 'בונה גיליון של', table: 'בונה טבלה של', rows: 'בונה שורות של', row: 'בונה שורה של', line: 'בונה שורה של', lines: 'בונה שורות של', text: 'בונה טקסט של',
  message: 'בונה הודעה של', title: 'בונה כותרת ל', subtitle: 'בונה כותרת משנה ל', caption: 'בונה כיתוב ל', hint: 'בונה רמז ל', tooltip: 'בונה רמז ל',
};

/** מילות-תוכן: אנגלית ⇒ עברית פשוטה (מושא הפועל). */
const NOUNS = {
  price: 'מחיר', prices: 'מחירים', pricing: 'תמחור', cost: 'עלות', costs: 'עלויות', total: 'סכום', totals: 'סכומים', sum: 'סכום', amount: 'סכום',
  money: 'כסף', ils: 'שקלים', nis: 'שקלים', shekel: 'שקלים', vat: 'מע״מ', tax: 'מס', discount: 'הנחה', budget: 'תקציב', fee: 'עמלה', fees: 'עמלות',
  credit: 'אשראי', debt: 'חוב', balance: 'יתרה', invoice: 'חשבונית', invoices: 'חשבוניות', receipt: 'קבלה', payment: 'תשלום', payments: 'תשלומים',
  order: 'הזמנה', orders: 'הזמנות', cart: 'עגלה', line: 'שורה', lines: 'שורות', item: 'פריט', items: 'פריטים', product: 'מוצר', products: 'מוצרים',
  sku: 'מק״ט', skus: 'מק״טים', catalog: 'קטלוג', category: 'קטגוריה', categories: 'קטגוריות', brand: 'מותג', brands: 'מותגים', variant: 'וריאנט', variants: 'וריאנטים',
  supplier: 'ספק', suppliers: 'ספקים', store: 'חנות', stores: 'חנויות', vendor: 'ספק', stock: 'מלאי', inventory: 'מלאי', warehouse: 'מחסן',
  delivery: 'משלוח', deliveries: 'משלוחים', shipment: 'משלוח', courier: 'שליח', couriers: 'שליחים', route: 'מסלול', pickup: 'איסוף', note: 'תעודה', notes: 'הערות',
  material: 'חומר', materials: 'חומרים', boq: 'כתב כמויות', quantity: 'כמות', quantities: 'כמויות', qty: 'כמות', unit: 'יחידה', units: 'יחידות',
  project: 'פרויקט', projects: 'פרויקטים', site: 'אתר', sites: 'אתרים', task: 'משימה', tasks: 'משימות', stage: 'שלב', stages: 'שלבים', phase: 'שלב', step: 'צעד', steps: 'צעדים',
  quote: 'הצעת מחיר', quotes: 'הצעות מחיר', estimate: 'הערכה', draft: 'טיוטה', template: 'תבנית', templates: 'תבניות', plan: 'תוכנית',
  worker: 'עובד', workers: 'עובדים', employee: 'עובד', employer: 'מעסיק', manager: 'מנהל', customer: 'לקוח', customers: 'לקוחות', client: 'לקוח',
  contractor: 'קבלן', user: 'משתמש', users: 'משתמשים', role: 'תפקיד', roles: 'תפקידים', persona: 'פרסונה', personas: 'פרסונות', profile: 'פרופיל', org: 'ארגון',
  team: 'צוות', member: 'חבר', members: 'חברים', company: 'חברה', trade: 'מקצוע', trades: 'מקצועות', profession: 'מקצוע', skill: 'מיומנות',
  date: 'תאריך', dates: 'תאריכים', day: 'יום', days: 'ימים', week: 'שבוע', weeks: 'שבועות', month: 'חודש', months: 'חודשים', year: 'שנה',
  time: 'שעה', times: 'זמנים', hour: 'שעה', hours: 'שעות', minute: 'דקה', minutes: 'דקות', duration: 'משך', deadline: 'מועד יעד', calendar: 'לוח שנה',
  shift: 'משמרת', attendance: 'נוכחות', vacation: 'חופשה', gantt: 'גאנט', schedule: 'לוח זמנים', clock: 'שעון',
  text: 'טקסט', label: 'תווית', labels: 'תוויות', title: 'כותרת', name: 'שם', names: 'שמות', word: 'מילה', words: 'מילים', query: 'שאילתה', search: 'חיפוש',
  string: 'מחרוזת', number: 'מספר', numbers: 'מספרים', digits: 'ספרות', phone: 'טלפון', email: 'מייל', address: 'כתובת', city: 'עיר', url: 'כתובת',
  id: 'מזהה', ids: 'מזהים', key: 'מפתח', keys: 'מפתחות', code: 'קוד', barcode: 'ברקוד', hash: 'חתימה', token: 'אסימון',
  list: 'רשימה', lists: 'רשימות', map: 'מפה', tree: 'עץ', node: 'צומת', nodes: 'צמתים', path: 'מסלול', chain: 'שרשרת', graph: 'גרף', edge: 'קשת',
  score: 'ציון', scores: 'ציונים', rank: 'דרגה', level: 'רמה', tier: 'דרג', band: 'רצועה', rating: 'דירוג', grade: 'ציון',
  connection: 'חיבור', connections: 'חיבורים', fitting: 'אביזר', fittings: 'אביזרים', pipe: 'צינור', pipes: 'צינורות', diameter: 'קוטר', pressure: 'לחץ', drop: 'ירידה',
  flow: 'זרימה', system: 'מערכת', division: 'חלוקה', install: 'התקנה', installation: 'התקנה', kit: 'ערכה', equipment: 'ציוד', tool: 'כלי', tools: 'כלים',
  spec: 'מפרט', specs: 'מפרטים', family: 'משפחה', families: 'משפחות', size: 'מידה', sizes: 'מידות', dimension: 'מידה', length: 'אורך', area: 'שטח', weight: 'משקל',
  image: 'תמונה', images: 'תמונות', photo: 'תמונה', icon: 'סמל', emoji: 'אמוג׳י', color: 'צבע', theme: 'ערכת עיצוב', style: 'סגנון',
  menu: 'תפריט', dial: 'חוגה', screen: 'מסך', screens: 'מסכים', section: 'סעיף', sections: 'סעיפים', card: 'כרטיס', cards: 'כרטיסים', chip: 'צ׳יפ', chips: 'צ׳יפים',
  flag: 'דגל', flags: 'דגלים', feature: 'יכולת', features: 'יכולות', config: 'הגדרות', settings: 'הגדרות', setting: 'הגדרה', option: 'אפשרות', options: 'אפשרויות',
  module: 'מודול', modules: 'מודולים', gate: 'שער', gates: 'שערים', access: 'גישה', permission: 'הרשאה', permissions: 'הרשאות', rbac: 'הרשאות', lock: 'נעילה',
  doc: 'מסמך', docs: 'מסמכים', document: 'מסמך', documents: 'מסמכים', pdf: 'PDF', csv: 'CSV', report: 'דוח', reports: 'דוחות', file: 'קובץ', row: 'שורה', rows: 'שורות',
  column: 'עמודה', columns: 'עמודות', cell: 'תא', header: 'כותרת', table: 'טבלה', sheet: 'גיליון',
  message: 'הודעה', messages: 'הודעות', chat: 'צ׳אט', notification: 'התראה', notifications: 'התראות', notif: 'התראה', notifs: 'התראות', push: 'התראה', alert: 'התראה',
  request: 'בקשה', requests: 'בקשות', approval: 'אישור', status: 'סטטוס', state: 'מצב', mode: 'מצב', event: 'אירוע', events: 'אירועים', log: 'יומן',
  intent: 'כוונה', assistant: 'עוזר', copilot: 'עוזר', ai: 'בינה', prompt: 'פרומפט', answer: 'תשובה', question: 'שאלה', insight: 'תובנה', insights: 'תובנות',
  attention: 'תשומת לב', alerts: 'התראות', dashboard: 'לוח מחוונים', kpi: 'מדד', kpis: 'מדדים', metric: 'מדד', metrics: 'מדדים', stats: 'נתונים', analytics: 'ניתוח',
  quality: 'איכות', issue: 'בעיה', issues: 'בעיות', error: 'שגיאה', errors: 'שגיאות', warning: 'אזהרה', input: 'קלט', value: 'ערך', values: 'ערכים',
  workflow: 'תהליך', rule: 'כלל', rules: 'כללים', policy: 'מדיניות', match: 'התאמה', matches: 'התאמות', result: 'תוצאה', results: 'תוצאות', hit: 'פגיעה', hits: 'תוצאות',
  suggestion: 'הצעה', suggestions: 'הצעות', alternative: 'חלופה', alternatives: 'חלופות', recommendation: 'המלצה', prediction: 'חיזוי', forecast: 'תחזית',
  favorites: 'מועדפים', recent: 'אחרונים', history: 'היסטוריה', version: 'גרסה', versions: 'גרסאות', snapshot: 'תצלום', diff: 'הבדל', change: 'שינוי', changes: 'שינויים',
  share: 'שיתוף', link: 'קישור', links: 'קישורים', whatsapp: 'וואטסאפ', sms: 'SMS', mail: 'מייל', contact: 'איש קשר', contacts: 'אנשי קשר',
  location: 'מיקום', distance: 'מרחק', region: 'אזור', zone: 'אזור', area2: 'אזור', lat: 'קו רוחב', lng: 'קו אורך',
  hebrew: 'עברית', he: 'עברית', locale: 'שפה', lang: 'שפה', rtl: 'ימין לשמאל', voice: 'קול', speech: 'דיבור',
  page: 'עמוד', pages: 'עמודים', paged: 'מחולק לעמודים', batch: 'אצווה', queue: 'תור', cache: 'מטמון', offline: 'לא מקוון', sync: 'סנכרון',
  import: 'ייבוא', export: 'ייצוא', backup: 'גיבוי', atom: 'חלק', atoms: 'חלקים', engine: 'מנוע', schema: 'סכמה', slot: 'משבצת', slots: 'משבצות',
  related: 'קשורים', info: 'מידע', detail: 'פרט', details: 'פרטים', summary: 'סיכום', description: 'תיאור', subtitle: 'כותרת משנה', hint: 'רמז',
  fuzzy: 'מקורב', exact: 'מדויק', normalized: 'מנורמל', clean: 'נקי', valid: 'תקין', invalid: 'לא תקין', empty: 'ריק', missing: 'חסר', required: 'נדרש',
  open: 'פתוח', closed: 'סגור', active: 'פעיל', pending: 'ממתין', done: 'בוצע', urgent: 'דחוף', overdue: 'באיחור', late: 'מאחר', due: 'לתשלום',
  percent: 'אחוז', pct: 'אחוז', ratio: 'יחס', rate: 'קצב', progress: 'התקדמות', count: 'ספירה', counts: 'ספירות', max: 'מקסימום', min: 'מינימום',
  next: 'הבא', prev: 'הקודם', first: 'ראשון', last: 'אחרון', default: 'ברירת מחדל', current: 'נוכחי', new: 'חדש', old: 'ישן',
  smart: 'חכם', lens: 'עדשה', finder: 'מאתר', keyboard: 'מקלדת', ring: 'טבעת', internal: 'פנימי', global: 'כללי', home: 'בית', board: 'לוח',
  certs: 'תעודות', cert: 'תעודה', training: 'הדרכה', trainings: 'הדרכות', forms: 'טפסים', form: 'טופס', signature: 'חתימה', hr: 'משאבי אנוש',
  reward: 'פרס', rewards: 'פרסים', points: 'נקודות', achievement: 'הישג', achievements: 'הישגים', identity: 'זהות', experiment: 'ניסוי', experiments: 'ניסויים',
  audit: 'ביקורת', approve: 'אישור', directory: 'מדריך', studio: 'סטודיו', analytics2: 'ניתוח', r2: 'אחסון', storage: 'אחסון', bucket: 'דלי',
  water: 'מים', hot: 'חמים', heating: 'חימום', drain: 'ניקוז', sewage: 'ביוב', electric: 'חשמל', plumbing: 'אינסטלציה', tile: 'אריח', tiles: 'אריחים', cement: 'מלט',
  json: 'JSON', wf: 'תהליך', submenu: 'תת-תפריט', scope: 'היקף', action: 'פעולה', actions: 'פעולות', cat: 'קטגוריה', type: 'סוג', types: 'סוגים',
  cfg: 'הגדרות', siblings: 'אחים', presence: 'נוכחות', thread: 'שרשור', plain: 'פשוט', element: 'רכיב', elements: 'רכיבים', compatible: 'תואמים',
  grid: 'רשת', dn: 'קוטר', axis: 'ציר', axes: 'צירים', component: 'רכיב', components: 'רכיבים', op: 'פעולה', ops: 'פעולות', consent: 'הסכמה', anchor: 'עוגן',
  filtered: 'מסוננים', lipskey: 'ליפסקי', safety: 'בטיחות', ends: 'קצוות', end: 'קצה', field: 'שדה', fields: 'שדות', recipe: 'מתכון', canonical: 'קנוני',
  soft: 'רך', cut: 'חיתוך', journey: 'מסע', app: 'אפליקציה', claims: 'הרשאות', claim: 'הרשאה', help: 'עזרה', toast: 'הודעה קופצת', layout: 'פריסה',
  owner: 'בעלים', register: 'קופה', verified: 'מאומת', comparison: 'השוואה', merged: 'ממוזג', pool: 'מאגר', ports: 'פתחים', port: 'פתח', elbow: 'זווית',
  meshes: 'רשתות', mesh: 'רשת', reason: 'סיבה', weld: 'ריתוך', distinct: 'שונים', temp: 'טמפרטורה', intel: 'מודיעין', edit: 'עריכה', revert: 'החזרה',
  spend: 'הוצאה', asset: 'נכס', passes: 'עובר', allowed: 'מותר', weather: 'מזג אוויר', panel: 'לוח', letter: 'אות', wall: 'קיר', password: 'סיסמה',
  vertical: 'ענף', pack: 'חבילה', kv: 'מפתח-ערך', delta: 'הפרש', polyroll: 'פולירול', checklist: 'רשימת בדיקה', suitable: 'מתאים', compliance: 'תקינה',
  paired: 'מזווג', pair: 'זוג', structure: 'מבנה', narrow: 'צר', server: 'שרת', facets: 'מאפיינים', facet: 'מאפיין', haul: 'הובלה', kind: 'סוג',
  pattern: 'תבנית', frame: 'מסגרת', accessories: 'אביזרים', accessory: 'אביזר', picks: 'בחירות', live: 'חי', job: 'עבודה', browse: 'עיון', od: 'קוטר חיצוני',
  selection: 'בחירה', connect: 'חיבור', targets: 'יעדים', target: 'יעד', bom: 'רשימת חומרים', method: 'שיטה', boost: 'חיזוק', matching: 'תואם',
  enriched: 'מועשר', angle: 'זווית', quick: 'מהיר', business: 'עסק', recommended: 'מומלץ', checkout: 'קופה', segments: 'קטעים', segment: 'קטע', html: 'HTML',
  descriptor: 'תיאור', trail: 'שובל', trigger: 'טריגר', daily: 'יומי', overlay: 'שכבה', display: 'תצוגה', across: 'לרוחב', entries: 'רשומות', entry: 'רשומה',
  auth: 'הזדהות', session: 'מושב', work: 'עבודה', readiness: 'מוכנות', uids: 'מזהי משתמש', uid: 'מזהה משתמש', banner: 'פס', button: 'כפתור',
  circles: 'עיגולים', breadcrumb: 'פירורי לחם', filters: 'מסננים', tip: 'טיפ', tips: 'טיפים', term: 'מונח', departments: 'מחלקות', department: 'מחלקה',
  hierarchy: 'היררכיה', leaves: 'עלים', comment: 'הערה', records: 'רשומות', record: 'רשומה', checksum: 'סכום ביקורת', vehicle: 'רכב', gender: 'מין',
  completion: 'השלמה', connector: 'מחבר', legacy: 'ישן', priority: 'עדיפות', roster: 'סגל', valve: 'ברז', tee: 'מסעף', reducer: 'מעבר קוטר',
  coupler: 'מצמד', plug: 'פקק', saddle: 'אוכף', collar: 'צווארון', tube: 'צינור', rod: 'מוט', sphere: 'כדור', preview: 'תצוגה מקדימה', params: 'פרמטרים',
  envelope: 'מעטפה', geom: 'צורה', brightness: 'בהירות', prefs: 'העדפות', tombstone: 'מצבה', repo: 'מאגר', rollout: 'הפצה', memo: 'זיכרון',
  fraction: 'שבר', sources: 'מקורות', source: 'מקור', opening: 'פתיחה', advice: 'עצה', joint: 'מפרק', gap: 'פער', tags: 'תגיות', why: 'סיבה',
  acceptance: 'קבלה', roi: 'תשואה', linked: 'מקושר', span: 'טווח', short: 'קצר', param: 'פרמטר', blank: 'ריק', regression: 'נסיגה', scroll: 'גלילה',
  speed: 'מהירות', floating: 'צף', rail: 'מסילה', bar: 'סרגל', interval: 'מרווח', lexicon: 'מילון', verdict: 'הכרעה', config2: 'הגדרות',
  mat4: 'מטריצה', vec3: 'וקטור', point: 'נקודה', run: 'מקטע', welcome: 'ברוך הבא', onboarding: 'כניסה ראשונה', newbie: 'מתחיל', relative: 'יחסי',
  range: 'טווח', israeli: 'ישראלי', mobile: 'נייד', thousands: 'אלפים', prominence: 'בולטות', axis2: 'ציר', mime: 'סוג קובץ', vat2: 'מע״מ', gross: 'ברוטו', net: 'נטו',
  physics: 'פיזיקה', adapter: 'מתאם', seed: 'נתוני פתיחה', seeds: 'נתוני פתיחה', bridge: 'גשר', kernel: 'ליבה', bs: 'BS',
};

/** הסוג ⇒ מילה בעברית, לשימוש במשפט "מה עושה". */
const KIND_HE = {
  span: 'טווח', amount: 'סכום או כמות', number: 'מספר', times: 'רשימת זמנים', date: 'תאריך', sequence: 'רצף כן/לא', list: 'רשימה',
  waiting: 'משהו שמחכה לתשובה', text: 'טקסט', bool: 'כן/לא', geo: 'מיקום', image: 'תמונה', sound: 'צליל', file: 'קובץ', choice: 'בחירה מתוך רשימה',
  ui: 'רכיב מסך', unknown: 'ערך',
};
function kindHe(kind) {
  if (kind.startsWith('record:')) return 'רשומה';
  return KIND_HE[kind] || 'ערך';
}

/**
 * מילים באנגלית ⇒ צירוף בעברית. צירוף-שמות באנגלית בא "הפוך" (family spec = מפרט משפחה),
 * ולכן הופכים את הסדר.
 */
function nounsHe(words) {
  const out = [];
  for (const w of words) {
    const he = NOUNS[w] ?? (w.endsWith('s') ? NOUNS[w.slice(0, -1)] : undefined);
    if (he && !out.includes(he)) out.push(he);
  }
  return out.reverse();
}

/** מתוך שם-הקובץ ⇒ תחום בעברית (נפילה כשהמזהה לא מתורגם). */
function domainHe(relPath) {
  const base = relPath.replace(/\.[^.]+$/, '').split('/').slice(-2).join('_');
  return nounsHe(splitWords(base)).slice(0, 2).join(' ');
}

/** מצרף פועל למושא: "ממיר ל" + "טקסט" ⇒ "ממיר לטקסט"; אחרת עם רווח. */
function glue(verb, obj) {
  const last = verb.split(' ').pop();
  return /^[לכבמ]$/.test(last) ? `${verb}${obj}` : `${verb} ${obj}`;
}

const CONNECTORS = { by: 'לפי', for: 'עבור', of: 'של', from: 'מתוך', in: 'בתוך', at: 'ב', per: 'לכל', with: 'עם', across: 'לרוחב' };

/** שם עברי פשוט: פועל + מושא, ≤ 9 מילים. cls = שם-המחלקה למתודה סטטית. */
function hebrewName(symbol, relPath, gives, what, cls) {
  let words = splitWords(symbol);
  // סיומת He ("actionLabelHe") ⇒ "... בעברית"
  if (words.length > 1 && words[words.length - 1] === 'he' && what !== 'component') {
    return clipWords(`${hebrewName(symbol.replace(/He$/, ''), relPath, gives, what, cls)} בעברית`, 9);
  }
  if (what === 'component') {
    const nn = nounsHe(words.filter((w) => !['widget', 'view', 'tile', 'button', 'sheet', 'dialog', 'panel', 'bar', 'badge', 'banner', 'pad', 'line', 'indicator', 'chip', 'card'].includes(w) || NOUNS[w]));
    const kindWord = /dialog/.test(symbol.toLowerCase()) ? 'חלון' : /button/i.test(symbol) ? 'כפתור' : /badge|chip/i.test(symbol) ? 'תג' : /banner/i.test(symbol) ? 'פס' : /pad/i.test(symbol) ? 'משטח' : /view|viewer/i.test(symbol) ? 'תצוגת' : 'רכיב';
    return clipWords(`מציג ${kindWord} ${nn.join(' ') || domainHe(relPath) || 'מסך'}`.trim(), 9);
  }
  const clsHe = cls ? nounsHe(splitWords(cls)).join(' ') || domainHe(relPath) || 'רשומה' : '';
  // בנאים/ממירים של מחלקה
  if (cls) {
    if (/^(tryFromJson|fromJson|fromMap|parse|tryParse|decode|fromFirestore|fromDoc)$/.test(symbol)) return clipWords(`קורא ${clsHe} מתוך נתונים שמורים`, 9);
    if (/^(toJson|toMap|encode|toFirestore)$/.test(symbol)) return clipWords(`הופך ${clsHe} לנתונים לשמירה`, 9);
  }
  let verb = null;
  let rest = words;
  let verbWords = 0;
  for (let k = Math.min(2, words.length); k >= 1; k--) {
    const key = k === 1 ? words[0] : words[0] + words[1][0].toUpperCase() + words[1].slice(1);
    if (VERBS[key]) { verb = VERBS[key]; rest = words.slice(k); verbWords = k; break; }
  }
  // פועל דו-מילי שכבר כולל את המושא ("normalizePhone" ⇒ "מנרמל טלפון")
  if (verbWords === 2 && rest.length === 0) return clipWords(verb, 9);
  // מבנה "fooToBar" ⇒ ממיר
  const toIdx = words.indexOf('to');
  if (toIdx > 0 && (!verb || rest.includes('to'))) {
    const a = nounsHe(words.slice(verb ? words.length - rest.length : 0, toIdx)).join(' ');
    const b = nounsHe(words.slice(toIdx + 1)).join(' ');
    return clipWords(glue(verb && verb !== 'ממיר' ? verb : 'ממיר', `${a || clsHe || 'ערך'} ל${b || kindHe(gives.kind)}`), 9);
  }
  if (!verb) {
    // שם-עצם בלבד ("cartTotal", "brandById") ⇒ פועל לפי מה שיוצא
    verb = gives.kind === 'bool' ? 'בודק' : gives.kind === 'text' ? 'בונה' : gives.kind === 'list' ? 'מחזיר' : gives.kind.startsWith('record:') ? 'מוצא' : gives.kind === 'amount' || gives.kind === 'number' ? 'מחשב' : 'מחזיר';
  }
  // מילת-קישור באמצע ⇒ "X לפי Y"
  const ci = rest.findIndex((w, i) => i > 0 && CONNECTORS[w]);
  let obj;
  if (ci > 0) {
    const a = nounsHe(rest.slice(0, ci)).join(' ');
    const b = nounsHe(rest.slice(ci + 1)).join(' ');
    obj = a ? (b ? `${a} ${CONNECTORS[rest[ci]]} ${b}` : a) : b;
  } else obj = nounsHe(rest).join(' ');
  if (!obj && clsHe) obj = clsHe;
  if (!obj) obj = domainHe(relPath);
  if (!obj) obj = kindHe(gives.kind);
  return clipWords(glue(verb, obj).replace(/\s+/g, ' ').trim(), 9);
}

function clipWords(s, n) {
  return s.split(/\s+/).filter((w, i, a) => w && w !== a[i - 1]).slice(0, n).join(' ');
}

/**
 * משפט ראשון בעברית מתוך הערת-התיעוד של הקוד — רק אם רובו עברית ועובר ניקוי
 * (בלי רצף ספרות, מייל, קישור, מרכאות-נתונים). אחרת null ⇒ נופלים למשפט מחולל.
 */
function hebrewDocSentence(doc) {
  if (!doc) return null;
  let t = doc
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/@\w+(\s+\{[^}]*\})?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.split(/(?<=[.!?])\s| — | – |\(|:\s|;\s|\s•\s|⇒|→/)[0].trim();
  const heb = (t.match(/[\u0590-\u05FF]/g) || []).length;
  const lat = (t.match(/[A-Za-z]/g) || []).length;
  if (heb < 6 || lat > heb * 0.3) return null;
  if (/\d{3,}|@|https?:|www\.|["'״]{1}[^"'״]{1,40}["'״]{1}.*\d|₪\s?\d/.test(t)) return null;
  const words = t.split(' ').filter(Boolean);
  if (words.length < 3) return null;
  t = words.slice(0, 18).join(' ').replace(/[.,:;\-–—]+$/, '');
  return /[?!]$/.test(t) ? t : t + '.';
}

function hebrewDoes(name, takes, gives, what) {
  if (what === 'component') return `רכיב מסך לשימוש חוזר: ${name.replace(/^מציג /, '')}.`;
  if (what === 'engine') return null; // נכתב ביד
  const ins = takes.length === 0 ? 'בלי קלט' : 'מקבל ' + [...new Set(takes.map((t) => kindHe(t.kind)))].join(' ו');
  return `${ins}, ומחזיר ${kindHe(gives.kind)} — ${name}.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TypeScript (app/src, functions/src)
// ═══════════════════════════════════════════════════════════════════════════

const TS_IMPURE_GLOBALS = new Set([
  'document', 'window', 'localStorage', 'sessionStorage', 'navigator', 'fetch', 'console', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'requestAnimationFrame', 'process', 'indexedDB', 'location', 'alert', 'confirm', 'prompt',
  'performance', 'XMLHttpRequest', 'WebSocket', 'BarcodeDetector', 'SpeechRecognition', 'webkitSpeechRecognition', 'history', 'Notification',
]);
const TS_IMPURE_MODULE = /(^|\/)(store|stores)(\/|$)|@preact\/signals|firebase|@google-cloud|node:|^fs$|^https?$|axios|node-fetch|nodemailer|r2|@aws-sdk|stripe|twilio|preact\/hooks/;

function tsSources() {
  const files = [
    ...walk(path.join(REPO, 'app', 'src'), (p) => /\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts') && !/[/\\]test[/\\]/.test(p) && !/\.test\.tsx?$/.test(p)),
    ...walk(path.join(REPO, 'functions', 'src'), (p) => p.endsWith('.ts') && !p.endsWith('.d.ts') && !p.endsWith('.test.ts')),
  ];
  return files;
}

function scanTs(stats) {
  const files = tsSources();
  const program = ts.createProgram(files, {
    allowJs: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true, skipLibCheck: true, strict: true, types: [], noLib: false,
  });
  const checker = program.getTypeChecker();
  const enums = new Set();
  const classes = new Set();
  // שלב 1: אוסף פונקציות ברמה העליונה (מיוצאות ולא) + תלויות + טומאה מקומית
  const fns = new Map(); // key file#name -> info
  const fileLocals = new Map(); // file -> Map(name -> key)
  for (const sf of program.getSourceFiles()) {
    const f = sf.fileName;
    if (!files.includes(f)) continue;
    const r = rel(f);
    const imports = new Map(); // local -> {mod, imported}
    const mutable = new Set();
    const locals = new Map();
    fileLocals.set(f, locals);
    for (const st of sf.statements) {
      if (ts.isImportDeclaration(st) && st.importClause) {
        const mod = st.moduleSpecifier.text;
        const ic = st.importClause;
        if (ic.name) imports.set(ic.name.text, { mod, imported: 'default' });
        if (ic.namedBindings && ts.isNamedImports(ic.namedBindings))
          for (const el of ic.namedBindings.elements) imports.set(el.name.text, { mod, imported: (el.propertyName || el.name).text });
        if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) imports.set(ic.namedBindings.name.text, { mod, imported: '*' });
      }
      if (ts.isEnumDeclaration(st)) enums.add(st.name.text);
      if (ts.isTypeAliasDeclaration(st) && /\|/.test(st.type.getText(sf)) && ts.isUnionTypeNode(st.type) && st.type.types.every((x) => ts.isLiteralTypeNode(x))) enums.add(st.name.text);
      if ((ts.isInterfaceDeclaration(st) || ts.isClassDeclaration(st) || ts.isTypeAliasDeclaration(st)) && st.name) classes.add(st.name.text);
      if (ts.isVariableStatement(st)) {
        const isLet = !(st.declarationList.flags & ts.NodeFlags.Const);
        for (const d of st.declarationList.declarations) {
          if (!ts.isIdentifier(d.name)) continue;
          const init = d.initializer;
          const initText = init ? init.getText(sf) : '';
          if (isLet || /^(signal|computed|effect|batch|new Map|new Set|createContext)\b/.test(initText)) mutable.add(d.name.text);
        }
      }
    }
    const exported = (st) => !!(ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export);
    const addFn = (name, node, fnNode, isExported) => {
      const key = `${r}#${name}`;
      locals.set(name, key);
      fns.set(key, { key, file: f, rel: r, name, node, fnNode, sf, isExported, imports, mutable, refs: new Set(), impureReasons: [], jsx: false, isAsync: false });
    };
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name && st.body) addFn(st.name.text, st, st, exported(st));
      if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)))
            addFn(d.name.text, d, d.initializer, exported(st));
        }
      }
    }
  }
  // שלב 2: ניתוח גוף
  for (const fn of fns.values()) {
    const { fnNode, imports, mutable } = fn;
    if (fnNode.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) { fn.isAsync = true; fn.impureReasons.push('async'); }
    const params = new Set(fnNode.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : '')));
    const visit = (n) => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) fn.jsx = true;
      if (ts.isAwaitExpression(n)) fn.impureReasons.push('await');
      if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression)) {
        const o = n.expression.text, p = n.name.text;
        if ((o === 'Date' && p === 'now') || (o === 'Math' && p === 'random') || (o === 'crypto')) fn.impureReasons.push(`${o}.${p}`);
      }
      if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Date' && (!n.arguments || n.arguments.length === 0)) fn.impureReasons.push('new Date()');
      if (ts.isIdentifier(n) && !params.has(n.text)) {
        const parent = n.parent;
        const isProp = parent && ts.isPropertyAccessExpression(parent) && parent.name === n;
        const isKey = parent && (ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === n;
        if (!isProp && !isKey) {
          const id = n.text;
          if (TS_IMPURE_GLOBALS.has(id)) fn.impureReasons.push(id);
          if (mutable.has(id)) fn.impureReasons.push(`mutable:${id}`);
          const imp = imports.get(id);
          if (imp) {
            if (TS_IMPURE_MODULE.test(imp.mod)) fn.impureReasons.push(`import:${imp.mod}`);
            else if (imp.mod.startsWith('.')) fn.refs.add({ mod: imp.mod, imported: imp.imported });
          }
          if (fileLocals.get(fn.file).has(id) && id !== fn.name) fn.refs.add({ local: id });
        }
      }
      // מוטציה של פרמטרים/גלובלים: השמה לתכונה של פרמטר
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(n.left)) {
        let base = n.left.expression;
        while (ts.isPropertyAccessExpression(base) || ts.isElementAccessExpression(base)) base = base.expression;
        if (ts.isIdentifier(base) && params.has(base.text)) fn.impureReasons.push(`mutates:${base.text}`);
      }
      ts.forEachChild(n, visit);
    };
    if (fnNode.body) visit(fnNode.body);
  }
  // שלב 3: סגירה טרנזיטיבית (בתוך הקובץ ובין קבצים יחסיים)
  const resolveRef = (fn, ref) => {
    if (ref.local) return fileLocals.get(fn.file).get(ref.local);
    const base = path.resolve(path.dirname(fn.file), ref.mod);
    for (const cand of [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), base]) {
      const loc = fileLocals.get(cand);
      if (loc) return loc.get(ref.imported);
    }
    return undefined;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const fn of fns.values()) {
      if (fn.impureReasons.length) continue;
      for (const ref of fn.refs) {
        const k = resolveRef(fn, ref);
        const dep = k && fns.get(k);
        if (dep && dep.impureReasons.length) { fn.impureReasons.push(`calls:${dep.name}`); changed = true; break; }
      }
    }
  }
  const ctx = { enums, classes, lang: 'ts' };
  const parts = [];
  for (const fn of [...fns.values()].sort((a, b) => (a.key < b.key ? -1 : 1))) {
    if (!fn.isExported) continue;
    const isComponent = fn.jsx && /^[A-Z]/.test(fn.name);
    stats.tsExported++;
    const { fnNode, sf } = fn;
    const sig = checker.getSignatureFromDeclaration(fnNode);
    const takes = fnNode.parameters.map((p) => {
      const pname = ts.isIdentifier(p.name) ? p.name.text : 'opts';
      let ptype = p.type ? p.type.getText(sf) : '';
      if (!ptype && p.initializer) ptype = ts.isNumericLiteral(p.initializer) ? 'number' : ts.isStringLiteral(p.initializer) ? 'string' : (p.initializer.kind === ts.SyntaxKind.TrueKeyword || p.initializer.kind === ts.SyntaxKind.FalseKeyword) ? 'boolean' : '';
      ptype = ptype.replace(/\s+/g, ' ');
      return { name: pname, kind: kindOf(ptype, pname, ctx), type: ptype || 'unknown' };
    });
    let rtype = fnNode.type ? fnNode.type.getText(sf) : sig ? checker.typeToString(checker.getReturnTypeOfSignature(sig), undefined, ts.TypeFormatFlags.NoTruncation) : '';
    rtype = rtype.replace(/\s+/g, ' ');
    const where = r0(fn.rel);
    if (isComponent) {
      if (!REUSABLE_TS_COMPONENT.test(fn.rel)) { stats.skippedScreens++; continue; }
      parts.push(mkPart({ path: fn.rel, symbol: fn.name, lang: 'ts', what: 'component', takes: [{ name: 'props', kind: 'record:props', type: takes[0]?.type || 'props' }], gives: { kind: 'ui', type: 'JSX.Element' }, pure: false, tags: ['preact', 'ui', where] }));
      continue;
    }
    if (fn.jsx || /JSX\.Element|VNode|ComponentChild/.test(rtype)) {
      if (REUSABLE_TS_COMPONENT.test(fn.rel) && !fn.impureReasons.length) {
        parts.push(mkPart({ path: fn.rel, symbol: fn.name, lang: 'ts', what: 'component', takes, gives: { kind: 'ui', type: 'JSX.Element' }, pure: false, tags: ['preact', 'ui', where] }));
      } else stats.skippedUi++;
      continue;
    }
    if (rtype === 'void') fn.impureReasons.push('void');
    if (fn.impureReasons.length) { stats.impure++; stats.impureByLang.ts++; continue; }
    const gives = { kind: kindOf(rtype, fn.name, ctx), type: rtype || 'unknown' };
    parts.push(mkPart({ path: fn.rel, symbol: fn.name, lang: 'ts', what: whatOf(fn.name, gives, fn.rel), takes, gives, pure: true, tags: tagsOf(fn.rel, fn.name, 'ts'), doc: tsDoc(fn) }));
  }
  return parts;
}

const REUSABLE_TS_COMPONENT = /^app\/src\/components\//;

/** הערת-התיעוד שמעל הפונקציה (/** … *\/ או // …). */
function tsDoc(fn) {
  const holder = ts.isVariableDeclaration(fn.node) ? fn.node.parent.parent : fn.node;
  const text = fn.sf.text;
  const ranges = ts.getLeadingCommentRanges(text, holder.getFullStart()) || [];
  return ranges
    .map((r) => text.slice(r.pos, r.end))
    .join('\n')
    .replace(/^\s*\/\*\*?|\*\/\s*$/gm, '')
    .replace(/^\s*(\*|\/\/)\s?/gm, '')
    .trim();
}
function r0(p) { return p.split('/')[0]; }

// ═══════════════════════════════════════════════════════════════════════════
// Dart (app_flutter/lib) — סורק קל: מסווה מחרוזות/הערות, מודד עומק-סוגריים
// ═══════════════════════════════════════════════════════════════════════════

/** מחליף מחרוזות והערות ברווחים (שומר אורך ושורות) כדי שסוגריים בתוכן לא יבלבלו. */
function maskDart(src) {
  const out = src.split('');
  const n = src.length;
  let i = 0;
  const blank = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; };
  function skipString(i0) {
    // מחזיר אינדקס אחרי סוף המחרוזת שמתחילה ב-i0 (אולי עם r)
    let i = i0;
    let raw = false;
    if (src[i] === 'r') { raw = true; i++; }
    const q = src[i];
    const triple = src.substr(i, 3) === q.repeat(3);
    const close = triple ? q.repeat(3) : q;
    i += close.length;
    while (i < n) {
      if (!raw && src[i] === '\\') { i += 2; continue; }
      if (src.substr(i, close.length) === close) return i + close.length;
      if (!triple && src[i] === '\n') return i; // מחרוזת שבורה — עוצרים
      if (!raw && src[i] === '$' && src[i + 1] === '{') {
        // אינטרפולציה: סורקים עד הסוגר המתאים (עם מחרוזות פנימיות)
        let depth = 1; i += 2;
        while (i < n && depth > 0) {
          const c = src[i];
          if (c === "'" || c === '"') { i = skipString(i); continue; }
          if (c === 'r' && (src[i + 1] === "'" || src[i + 1] === '"') && !/\w/.test(src[i - 1] || '')) { i = skipString(i); continue; }
          if (c === '{') depth++;
          else if (c === '}') depth--;
          i++;
        }
        continue;
      }
      i++;
    }
    return i;
  }
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; blank(i, end); i = end; continue; }
    if (c === '/' && src[i + 1] === '*') {
      let depth = 1, j = i + 2;
      while (j < n && depth > 0) { if (src[j] === '/' && src[j + 1] === '*') { depth++; j += 2; } else if (src[j] === '*' && src[j + 1] === '/') { depth--; j += 2; } else j++; }
      blank(i, j); i = j; continue;
    }
    if (c === "'" || c === '"' || (c === 'r' && (src[i + 1] === "'" || src[i + 1] === '"') && !/\w/.test(src[i - 1] || ''))) {
      const e = skipString(i);
      // שומרים את המרכאות כדי שהטיפוס/גוף יישארו קריאים, ומרוקנים את התוכן
      blank(i + 1, Math.max(i + 1, e - 1));
      i = e; continue;
    }
    i++;
  }
  return out.join('');
}

const DART_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'return', 'catch', 'on', 'assert', 'super', 'this', 'new', 'const', 'throw', 'else', 'do', 'try', 'await', 'yield', 'sync', 'async', 'factory', 'operator', 'get', 'set', 'external', 'late', 'final', 'var', 'class', 'enum', 'mixin', 'extension', 'typedef', 'import', 'export', 'part', 'library', 'show', 'hide', 'when', 'case', 'default', 'is', 'as', 'in']);

const DART_IMPURE = [
  [/\bref\s*\.\s*(watch|read|listen|invalidate|refresh)\b/, 'ref'], [/\bWidgetRef\b|\b(Ref|ProviderRef|AutoDisposeRef)\b/, 'Ref'],
  [/\bBuildContext\b|\.of\(\s*context\b|\bcontext\s*\.\s*(read|watch|go|push|pop|mounted|findAncestor\w*|dependOn\w*)\b/, 'context'], [/\bsetState\s*\(/, 'setState'], [/\bNavigator\b|\bGoRouter\b|\bcontext\.go\b/, 'nav'],
  [/\bFirebase\w*|\bFirestore\b|\bFirebaseFirestore\b|\bcloud_firestore\b|\bFunctions\b\.instance/, 'firebase'], [/\bhttp\s*\.\s*(get|post|put|delete|Client)\b|\bHttpClient\b|\bDio\b/, 'network'],
  [/\bawait\b|\basync\b|\bFuture\b|\bStream\b|\bCompleter\b|\bTimer\b/, 'async'], [/\bDateTime\s*\.\s*now\b|\bStopwatch\b/, 'clock'], [/\bRandom\s*\(/, 'random'],
  [/\b(print|debugPrint)\s*\(/, 'print'], [/\bSharedPreferences\b|\bHive\b|\bsecureStorage\b|\bFlutterSecureStorage\b/, 'storage'],
  [/\bPlatform\s*\./, 'platform'], [/\b(File|Directory)\s*\(/, 'fs'], [/\bshow(Dialog|ModalBottomSheet|GeneralDialog|DatePicker|TimePicker)\b|\bScaffoldMessenger\b|\bOverlay\b/, 'ui'],
  [/\bHapticFeedback\b|\bClipboard\b|\bSystemChrome\b|\blaunchUrl\b|\bShare\s*\.|\bMethodChannel\b/, 'platform'], [/\bkIsWeb\b|\bwindow\s*\.|\bhtml\s*\./, 'platform'],
  [/\bProviderContainer\b|\bStateController\b|\bNotifier\b\s*\(|\bstate\s*=[^=]/, 'state'],
];

/** שורות /// שמעל ההצהרה (מדלג על @annotations). */
function dartDoc(src, at) {
  const before = src.slice(0, at).split('\n');
  const out = [];
  for (let i = before.length - 1; i >= 0; i--) {
    const l = before[i].trim();
    if (l === '' && out.length === 0 && i === before.length - 1) continue;
    if (l.startsWith('///')) out.unshift(l.replace(/^\/\/\/\s?/, ''));
    else if (l.startsWith('@')) continue;
    else break;
  }
  return out.join('\n');
}

function dartFiles() {
  return walk(path.join(REPO, 'app_flutter', 'lib'), (p) => p.endsWith('.dart') && !/\.(g|freezed|mocks)\.dart$/.test(p) && !/[/\\]test_harness[/\\]/.test(p) && !/[/\\]_app_\w+_demo\.dart$/.test(p) && !/[/\\]l10n[/\\]/.test(p) && !p.endsWith('firebase_options.dart'));
}

/** מוצא את הסוגר הסוגר המתאים במסוכה. */
function matchClose(m, i, open, close) {
  let d = 0;
  for (let k = i; k < m.length; k++) {
    if (m[k] === open) d++;
    else if (m[k] === close) { d--; if (d === 0) return k; }
  }
  return -1;
}
/** סוף גוף "=> expr;" בעומק אפס. */
function arrowEnd(m, i) {
  let d = 0;
  for (let k = i; k < m.length; k++) {
    const c = m[k];
    if (c === '(' || c === '[' || c === '{') d++;
    else if (c === ')' || c === ']' || c === '}') { if (d === 0) return k; d--; }
    else if (c === ';' && d === 0) return k;
  }
  return m.length;
}

/** מפצל רשימת-פרמטרים של Dart לפרמטרים בודדים. */
function splitDartParams(s) {
  const parts = [];
  let d = 0, cur = '';
  const named = [];
  let group = 'pos';
  for (const c of s) {
    if (d === 0 && (c === '{' || c === '[')) { if (cur.trim()) parts.push([group, cur]); cur = ''; group = c === '{' ? 'named' : 'opt'; continue; }
    if (d === 0 && (c === '}' || c === ']')) { if (cur.trim()) parts.push([group, cur]); cur = ''; continue; }
    if (c === '(' || c === '<' || c === '[' || c === '{') d++;
    if (c === ')' || c === '>' || c === ']' || c === '}') d--;
    if (c === ',' && d === 0) { if (cur.trim()) parts.push([group, cur]); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push([group, cur]);
  void named;
  return parts.map(([, p]) => {
    let t = p.replace(/@\w+(\([^)]*\))?/g, '').replace(/\b(required|covariant|final)\b/g, '').trim();
    const eq = topLevelIndex(t, '=');
    if (eq >= 0) t = t.slice(0, eq).trim();
    // פרמטר מטיפוס-פונקציה בסגנון ישן: int f(int x)
    const fm = /^([\s\S]*?)\b(\w+)\s*\(([\s\S]*)\)$/.exec(t);
    if (fm && !/\bFunction\b/.test(t)) return { name: fm[2], type: `${fm[1].trim() || 'dynamic'} Function(${fm[3]})` };
    t = t.replace(/^this\./, '').replace(/^super\./, '');
    const m = /^([\s\S]*?)\s*\b(\w+)$/.exec(t);
    if (!m) return { name: t, type: '' };
    return { name: m[2], type: m[1].replace(/\bthis\.$/, '').trim() };
  });
}
function topLevelIndex(s, ch) {
  let d = 0;
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === '(' || c === '<' || c === '[' || c === '{') d++;
    else if (c === ')' || c === '>' || c === ']' || c === '}') d--;
    else if (c === ch && d === 0 && s[k + 1] !== '=' && s[k - 1] !== '=' && s[k - 1] !== '!' && s[k + 1] !== '>') return k;
  }
  return -1;
}

const DART_WIDGET_BASE = /\bextends\s+(StatelessWidget|StatefulWidget|ConsumerWidget|ConsumerStatefulWidget|HookWidget|HookConsumerWidget|CustomPainter)\b/;
const REUSABLE_DART_COMPONENT = /^app_flutter\/lib\/(widgets\/|features\/[^/]+\/widgets\/|atoms\/)/;

function scanDart(stats) {
  const files = dartFiles();
  const enums = new Set();
  const classes = new Set();
  const decls = [];
  const srcs = new Map();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const m = maskDart(src);
    srcs.set(f, { src, m });
    for (const e of m.matchAll(/(^|\n)\s*enum\s+(\w+)/g)) enums.add(e[2]);
    for (const e of m.matchAll(/(^|\n)\s*(?:(?:abstract|sealed|final|base|interface)\s+)*class\s+(\w+)/g)) classes.add(e[2]);
  }
  for (const f of files) {
    const { m } = srcs.get(f);
    const r = rel(f);
    // עומק-סוגריים לכל תו
    const depth = new Int32Array(m.length + 1);
    let d = 0;
    for (let k = 0; k < m.length; k++) {
      depth[k] = d;
      const c = m[k];
      if (c === '{' || c === '(' || c === '[') d++;
      else if (c === '}' || c === ')' || c === ']') d--;
    }
    // גופי-מחלקות ברמה העליונה: לשם הוספת מתודות static
    const classBodies = [];
    for (const cm of m.matchAll(/(^|\n)[ \t]*((?:(?:abstract|sealed|final|base|interface|mixin)\s+)*)(class|mixin|extension)\s+(\w*)([^{;]*)\{/g)) {
      const at = cm.index + cm[0].length - 1;
      if (depth[at] !== 0) continue;
      const end = matchClose(m, at, '{', '}');
      classBodies.push({ name: cm[4], kind: cm[3], header: cm[5], start: at, end });
      if (cm[3] === 'class' && DART_WIDGET_BASE.test(cm[5]) && !cm[4].startsWith('_')) {
        if (REUSABLE_DART_COMPONENT.test(r) && !cm[4].endsWith('State')) {
          decls.push({ file: f, rel: r, name: cm[4], component: true, header: cm[5] });
        } else stats.skippedScreens++;
      }
      if (cm[3] === 'extension') stats.dartExtensions++;
    }
    const inClass = (k) => classBodies.find((c) => k > c.start && k < c.end);
    const re = /(^|\n)([ \t]*)((?:static\s+)?)((?:[A-Za-z_][\w.]*(?:<[^;=\n]*?>)?\??|\([^;=\n]*?\)\??|void)\s+)?([A-Za-z_]\w*)\s*(<[^()]*?>)?\s*\(/g;
    let mm;
    while ((mm = re.exec(m))) {
      const nameAt = mm.index + mm[0].lastIndexOf(mm[5]);
      const openAt = mm.index + mm[0].length - 1;
      const dep = depth[nameAt];
      const isStatic = !!mm[3].trim();
      const cls = dep === 1 ? inClass(nameAt) : null;
      if (!(dep === 0 || (dep === 1 && isStatic && cls))) continue;
      const name = mm[5];
      if (DART_KEYWORDS.has(name)) continue;
      let ret = (mm[4] || '').trim();
      if (DART_KEYWORDS.has(ret) && ret !== 'void') continue;
      const closeAt = matchClose(m, openAt, '(', ')');
      if (closeAt < 0) continue;
      let k = closeAt + 1;
      while (/\s/.test(m[k])) k++;
      let modifiers = '';
      const after = m.slice(k, k + 12);
      const am = /^(async\*?|sync\*)\s*/.exec(after);
      if (am) { modifiers = am[1]; k += am[0].length; }
      let bodyStart, bodyEnd;
      if (m[k] === '{') { bodyStart = k; bodyEnd = matchClose(m, k, '{', '}'); }
      else if (m[k] === '=' && m[k + 1] === '>') { bodyStart = k; bodyEnd = arrowEnd(m, k + 2); }
      else continue; // הצהרה בלבד / קריאה / בנאי
      if (bodyEnd < 0) continue;
      if (cls && name === cls.name) continue; // בנאי
      re.lastIndex = Math.max(re.lastIndex, bodyEnd);
      const paramsText = m.slice(openAt + 1, closeAt);
      const body = m.slice(bodyStart, bodyEnd + 1);
      decls.push({
        doc: dartDoc(srcs.get(f).src, mm.index + mm[1].length),
        file: f, rel: r, name, symbol: cls ? `${cls.name}.${name}` : name, cls: cls?.name || null, clsKind: cls?.kind || null,
        ret: ret.replace(/\s+/g, ' '), paramsText, body, modifiers, isPublic: !name.startsWith('_') && !(cls && cls.name.startsWith('_')),
      });
    }
  }
  // טומאה מקומית + סגירה לפי-שם (שמרני: כל שם טמא בכל קובץ מטמא קוראים).
  // עוזר שמחזיר void (ממלא רשימה מקומית / מטמון-זיכרון) לא מטמא את הקורא — מבחוץ הקורא נשאר טהור.
  const byName = new Map();
  for (const dcl of decls) {
    if (dcl.component) continue;
    dcl.reasons = [];
    const text = dcl.paramsText + ' ' + dcl.ret + ' ' + dcl.body;
    if (dcl.modifiers.startsWith('async')) dcl.reasons.push('async');
    for (const [rx, why] of DART_IMPURE) if (rx.test(text)) dcl.reasons.push(why);
    if (/^void$/.test(dcl.ret)) dcl.reasons.push('void');
    if (/\b\w*(Notifier|Controller|Repository|Service|Client|Sink|Binding|Channel)\b/.test(dcl.paramsText) || /\b(WidgetsBinding|SchedulerBinding|addPostFrameCallback)\b/.test(dcl.body)) dcl.reasons.push('effect-param');
    if (/^(Widget|PreferredSizeWidget|List<Widget>|InlineSpan|TextSpan|Route|PageRoute|MaterialPageRoute|GoRoute|RouteBase|Page)\b/.test(dcl.ret)) dcl.reasons.push('widget');
    dcl.calls = new Set([...dcl.body.matchAll(/(?<![\w.])([A-Za-z_]\w*)\s*(?:<[^()]*?>)?\s*\(/g)].map((x) => x[1]));
    if (!dcl.cls) { if (!byName.has(dcl.name)) byName.set(dcl.name, []); byName.get(dcl.name).push(dcl); }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const dcl of decls) {
      if (dcl.component || dcl.reasons.length) continue;
      for (const c of dcl.calls) {
        const deps = byName.get(c);
        if (deps && deps.some((x) => x !== dcl && x.reasons.some((why) => why !== 'void'))) { dcl.reasons.push(`calls:${c}`); changed = true; break; }
      }
    }
  }
  const ctx = { enums, classes, lang: 'dart' };
  const parts = [];
  for (const dcl of decls) {
    if (dcl.component) {
      parts.push(mkPart({ path: dcl.rel, symbol: dcl.name, lang: 'dart', what: 'component', takes: [{ name: 'props', kind: 'record:props', type: 'constructor' }], gives: { kind: 'ui', type: 'Widget' }, pure: false, tags: ['flutter', 'ui', 'app_flutter'] }));
      continue;
    }
    if (!dcl.isPublic || dcl.name === 'main' || dcl.name === 'build') continue;
    stats.dartPublic++;
    if (dcl.reasons.length) { stats.impureReasons ??= {}; stats.impureReasons[dcl.reasons[0]] = (stats.impureReasons[dcl.reasons[0]] || 0) + 1; if (process.env.CENSUS_DEBUG) console.error('IMPURE', dcl.rel, dcl.symbol, dcl.reasons.join(',')); stats.impure++; stats.impureByLang.dart++; if (dcl.reasons.includes('widget')) stats.skippedUi++; continue; }
    const takes = splitDartParams(dcl.paramsText).filter((p) => p.name).map((p) => ({ name: p.name, kind: kindOf(p.type, p.name, ctx), type: p.type || 'dynamic' }));
    let ret = dcl.ret || 'dynamic';
    if (dcl.modifiers === 'sync*') ret = `Iterable<${ret.replace(/^Iterable<([\s\S]*)>$/, '$1')}>`;
    const gives = { kind: kindOf(ret, dcl.name, ctx), type: ret };
    parts.push(mkPart({ path: dcl.rel, symbol: dcl.symbol, lang: 'dart', what: whatOf(dcl.name, gives, dcl.rel), takes, gives, pure: true, tags: tagsOf(dcl.rel, dcl.name, 'dart').concat(dcl.cls ? ['static'] : []), doc: dcl.doc }));
  }
  return parts;
}

// ═══════════════════════════════════════════════════════════════════════════
// סיווג "what" ותגיות
// ═══════════════════════════════════════════════════════════════════════════

function whatOf(name, gives, relPath) {
  const w = splitWords(name);
  // כלל (rule) = בודק/מאמת שמחזיר כן/לא או הודעת-שגיאה, בקבצי-מדיניות/אימות
  if (/validat|policy|rules?|gates?|rbac|access_lock|guard|required_docs|consent/.test(relPath) && gives.kind === 'bool') return 'rule';
  if (/^(validate|verify|assert|ensure|must)$/.test(w[0])) return 'rule';
  return 'function';
}

const TAG_RULES = [
  [/price|pricing|cost|money|vat|invoice|credit|budget|discount|quote|finance|payment|ils/, 'כסף'],
  [/boq|quantit|qty|materials?|install_kit|install/, 'כמויות'],
  [/order|cart|procure|supplier|deliver|courier|shipment|stock|warehouse|employer_stock/, 'רכש-ומשלוח'],
  [/persona|dial|profession|role|rbac/, 'פרסונות'],
  [/search|fuzzy|match|normalize|finder|lens/, 'חיפוש'],
  [/date|calendar|day|gantt|schedule|clock|attendance|vacation/, 'זמן'],
  [/catalog|product|sku|brand|variant|categor|fitting|spec|family/, 'קטלוג'],
  [/connection|pipe|pressure|physics|trade|system_division/, 'הנדסה'],
  [/text|label|format|hebrew|he$|_he|l10n|string/, 'טקסט'],
  [/task|project|stage|site|workflow/, 'פרויקטים'],
  [/ai|intel|copilot|assistant|prompt|insight/, 'בינה'],
  [/csv|import|export|pdf|print|doc/, 'מסמכים'],
];
function tagsOf(relPath, name, lang) {
  const hay = (relPath + ' ' + splitWords(name).join('_')).toLowerCase();
  const tags = new Set([relPath.split('/')[0]]);
  tags.add(lang === 'dart' ? 'flutter' : relPath.startsWith('functions/') ? 'server' : 'preact');
  for (const [rx, t] of TAG_RULES) if (rx.test(hay)) tags.add(t);
  return [...tags].sort();
}

// ═══════════════════════════════════════════════════════════════════════════
// מנועי-תחום (engine) — נכתבים ביד, רק לקבצים שיש בהם חלקים טהורים שנמצאו
// ═══════════════════════════════════════════════════════════════════════════

const ENGINES = [
  { path: 'app_flutter/lib/logic/price_estimate.dart', name: 'מעריך מחיר לעבודה או להזמנה', does: 'מנוע התמחור: מחשב הערכת מחיר מתוך שורות, כמויות ומחירון.', tags: ['כסף'] },
  { path: 'app_flutter/lib/logic/money_format.dart', name: 'מעצב סכומי כסף בשקלים', does: 'מנוע הכסף הקטן: מעצב סכומים לתצוגה בשקלים.', tags: ['כסף', 'טקסט'] },
  { path: 'app_flutter/lib/logic/invoice.dart', name: 'בונה חשבונית עם מע״מ וסכומים', does: 'מנוע החשבונית: מחשב שורות, מע״מ וסה״כ לחשבונית.', tags: ['כסף', 'מסמכים'] },
  { path: 'app_flutter/lib/logic/install_kit.dart', name: 'מרכיב ערכת התקנה וכמויות חומר', does: 'מנוע כתב-הכמויות: מתרגם עבודת התקנה לרשימת חומרים וכמויות.', tags: ['כמויות'] },
  { path: 'app_flutter/lib/logic/install_engine.dart', name: 'מתכנן שלבי התקנה וחומרים לכל שלב', does: 'מנוע ההתקנה: מחשב מה צריך בכל שלב של עבודת התקנה.', tags: ['כמויות', 'פרויקטים'] },
  { path: 'app_flutter/lib/logic/delivery_note.dart', name: 'בונה תעודת משלוח מהזמנה', does: 'מנוע תעודת המשלוח: מסדר שורות הזמנה לתעודת משלוח.', tags: ['רכש-ומשלוח', 'מסמכים'] },
  { path: 'app_flutter/lib/logic/equipment_stock_join.dart', name: 'מחבר ציוד למלאי הזמין', does: 'מנוע המלאי: מצליב ציוד נדרש מול מה שיש במלאי.', tags: ['רכש-ומשלוח'] },
  { path: 'app_flutter/lib/logic/pressure_drop.dart', name: 'מחשב ירידת לחץ בצינור', does: 'מנוע הנדסי: מחשב ירידת לחץ לפי קוטר, אורך וזרימה.', tags: ['הנדסה'] },
  { path: 'app_flutter/lib/logic/tasks_gantt.dart', name: 'מסדר משימות על ציר גאנט', does: 'מנוע הגאנט: ממקם משימות פרויקט על ציר זמן.', tags: ['זמן', 'פרויקטים'] },
  { path: 'app_flutter/lib/logic/fuzzy_match.dart', name: 'מתאים מילים בקירוב לחיפוש', does: 'מנוע החיפוש המקורב: מוצא התאמות גם עם שגיאות כתיב.', tags: ['חיפוש'] },
  { path: 'app_flutter/lib/logic/customer_score.dart', name: 'נותן ציון ללקוח', does: 'מנוע ציון הלקוח: מדרג לקוחות לפי הפעילות שלהם.', tags: ['בינה'] },
  { path: 'app_flutter/lib/logic/workflow_engine.dart', name: 'מקדם תהליך עבודה בין שלבים', does: 'מנוע התהליך: מחליט מה השלב הבא בתהליך.', tags: ['פרויקטים'] },
  { path: 'app_flutter/lib/logic/attention_engine.dart', name: 'מחליט מה דורש תשומת לב עכשיו', does: 'מנוע תשומת הלב: מסדר מה הכי דחוף לטפל בו.', tags: ['בינה'] },
  { path: 'app_flutter/lib/domain/connection_resolver.dart', name: 'מוצא חיבור מתאים בין שני אביזרים', does: 'מנוע החיבורים: מכריע איך מחברים שני רכיבים בצנרת.', tags: ['הנדסה'] },
  { path: 'app_flutter/lib/state/material_requests_engine.dart', name: 'מנהל בקשות חומר מהשטח', does: 'מנוע בקשות החומר: החלקים הטהורים של בקשות מהאתר למחסן.', tags: ['רכש-ומשלוח', 'כמויות'] },
  { path: 'app_flutter/lib/data/csv_kernel.dart', name: 'קורא וכותב טבלאות CSV', does: 'מנוע ה-CSV: פענוח ובנייה של טבלאות לייבוא וייצוא.', tags: ['מסמכים'] },
  { path: 'app/src/data/suppliers.ts', name: 'מוצא מחיר וספק זול למק״ט', does: 'מנוע התמחור של האפליקציה החיה: מחיר לפי ספק והספק הזול.', tags: ['כסף', 'רכש-ומשלוח'] },
  { path: 'functions/src/creditCore.ts', name: 'מחשב אשראי לקוח בשרת', does: 'מנוע האשראי בשרת: החלקים הטהורים של מסגרת וחיוב.', tags: ['כסף', 'server'] },
  { path: 'functions/src/setEmployerCore.ts', name: 'מחליט על שיוך עובד למעסיק', does: 'מנוע השיוך בשרת: הכללים הטהורים לשיוך עובד למעסיק.', tags: ['פרסונות', 'server'] },
];

/** דוגמאות ביד — מנוקות, נבדקו מול הקוד. מפתח = id. */
const EXAMPLES = {
  'buildsmart:app_flutter/lib/logic/money_format.dart#groupThousands': { in: { n: 3150 }, out: '3,150' },
  'buildsmart:app_flutter/lib/logic/money_format.dart#formatNis': { in: { n: -3150 }, out: '-₪3,150' },
  'buildsmart:app_flutter/lib/logic/invoice.dart#invoiceVatOf': { in: { grossTotal: 1180 }, out: 180 },
  'buildsmart:app_flutter/lib/logic/input_validators.dart#validPositiveAmount': { in: { value: 0 }, out: false },
  'buildsmart:app_flutter/lib/logic/input_validators.dart#validDateRange': { in: { start: '2026-01-02', end: '2026-01-01' }, out: false },
  'buildsmart:app_flutter/lib/logic/input_validators.dart#validEmail': { in: { input: 'no-at-sign' }, out: false },
  'buildsmart:app_flutter/lib/logic/fuzzy_match.dart#damerauLevenshtein': { in: { a: 'ab', b: 'ba' }, out: 1 },
  'buildsmart:app/src/data/identity.ts#formatIls': { in: { n: 1234.6 }, out: '₪1,235' },
  'buildsmart:functions/src/creditCore.ts#orderSum': { in: { lines: [{ price: 10.4 }, { price: 'x' }, { price: 5 }] }, out: 15 },
  'buildsmart:functions/src/creditCore.ts#readCreditLimit': { in: { stored: -5 }, out: 0 },
};

// ═══════════════════════════════════════════════════════════════════════════
// הרכבה
// ═══════════════════════════════════════════════════════════════════════════

function mkPart({ path: p, symbol, lang, what, takes, gives, pure, tags, name, does, doc }) {
  const id = `${SOURCE}:${p}#${symbol}`;
  const segs = symbol.split('.');
  const sym = segs.pop();
  const nm = name || hebrewName(sym, p, gives, what, segs[0] || null);
  return {
    id, source: SOURCE, path: p, symbol, lang, what,
    name: nm,
    does: does || (what !== 'component' && hebrewDocSentence(doc)) || hebrewDoes(nm, takes, gives, what),
    takes, gives, pure,
    example: EXAMPLES[id] ?? null,
    tags: [...new Set(tags)].sort(),
  };
}

function repoRef() {
  try {
    const sha = execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    let br = execFileSync('git', ['-C', REPO, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
    if (br === 'HEAD') br = 'main';
    return `${br}@${sha}`;
  } catch {
    return 'main@unknown';
  }
}

export function census() {
  const stats = { tsExported: 0, dartPublic: 0, impure: 0, impureByLang: { ts: 0, dart: 0 }, skippedScreens: 0, skippedUi: 0, dartExtensions: 0 };
  const parts = [...scanTs(stats), ...scanDart(stats)];
  const files = new Set(parts.map((p) => p.path));
  for (const e of ENGINES) {
    if (!files.has(e.path)) { stats.enginesMissing = (stats.enginesMissing || []).concat(e.path); continue; }
    const lang = e.path.endsWith('.dart') ? 'dart' : 'ts';
    const members = parts.filter((p) => p.path === e.path && p.pure);
    const sym = '*';
    parts.push({
      id: `${SOURCE}:${e.path}#${sym}`, source: SOURCE, path: e.path, symbol: sym, lang, what: 'engine',
      name: e.name, does: e.does,
      takes: [], gives: { kind: 'list', type: `${members.length} pure parts` }, pure: true, example: null,
      tags: [...new Set(['engine', ...e.tags, ...members.map((m) => m.symbol).slice(0, 0)])].sort(),
    });
  }
  // מזהים כפולים (למשל overloads) — משאירים את הראשון
  const seen = new Set();
  const uniq = [];
  for (const p of parts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (seen.has(p.id)) { stats.dupIds = (stats.dupIds || 0) + 1; continue; }
    seen.add(p.id);
    uniq.push(p);
  }
  return { doc: { source: SOURCE, repo: REPO_SLUG, ref: repoRef(), generatedAt: null, parts: uniq }, stats };
}

function main() {
  if (!fs.existsSync(path.join(REPO, 'app_flutter'))) {
    console.error(`❌ לא נמצא שכפול של buildsmart ב-${REPO} (העבר --repo <path> או BUILDSMART_REPO)`);
    process.exit(2);
  }
  const { doc, stats } = census();
  const text = JSON.stringify(doc, null, 2) + '\n';
  if (process.argv.includes('--stats')) console.error(JSON.stringify(stats, null, 2));
  if (CHECK) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error(`❌ ${path.relative(ROOT, OUT)} לא מעודכן — הרץ: node catalog/scripts/buildsmart-census.mjs`); process.exit(1); }
    console.log(`✅ ${path.relative(ROOT, OUT)} מעודכן (${doc.parts.length} חלקים, ${doc.ref})`);
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text);
  console.log(`✍️  ${path.relative(ROOT, OUT)} — ${doc.parts.length} חלקים (${doc.ref})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
