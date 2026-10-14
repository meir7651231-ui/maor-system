#!/usr/bin/env node
// מפקד-חלקים · המחולל — כל חלקיק מ-machtzev/generator/atom-index-full.json (תצוגה + לוגיקה, כולל 59 חלקיקי
// פעולות-היסוד new/dart-maor/op-*.dart) וכל מנוע מ-machtzev/generator/engine-index.json הופכים לחלק (Part)
// בפורמט המשותף. קורא רק מ-git (ref קבוע) של `-ai-chat-server` (קריאה-בלבד): חתימות-קוד והערות-תיעוד בלבד —
// לא מעתיק ערכי-דאטה. כותב catalog/sources/generator.json — דטרמיניסטי, ממוין לפי id.
//
// הרצה:   node catalog/scripts/generator-census.mjs [--repo <נתיב-לשכפול>] [--ref claude/mavin-260922|<sha>] [--check]
//   --repo   ברירת-מחדל: $CATALOG_SRC_REPO או ../meir7651231-ui/-ai-chat-server (יחסית לשורש maor-system)
//   --ref    ענף (נפתר ל-origin/<ענף>) או sha. ברירת-מחדל: claude/mavin-260922 (קו-המחולל העדכני)
//   --check  לא כותב; יוצא 1 אם הקובץ הקיים שונה ממה שהיה נוצר עכשיו.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { byId } from '../self/parts.mjs'; // 🧩 SELF-V2: «ממיין» — חלק-המכונה המוכח (היה sortById מקומי)
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'catalog/sources/generator.json');
const ATOMS = 'machtzev/generator/atom-index-full.json';
const ENGINES = 'machtzev/generator/engine-index.json';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CHECK = args.includes('--check');
const REPO = path.resolve(ROOT, opt('--repo', process.env.CATALOG_SRC_REPO || '../meir7651231-ui/-ai-chat-server'));
const REF = opt('--ref', 'claude/mavin-260922');

const git = (a, input) => execFileSync('git', ['-C', REPO, ...a], { ...(input === undefined ? { encoding: 'utf8' } : { input }), maxBuffer: 1 << 30 });
function resolveRef(ref) {
  for (const r of [`origin/${ref}`, ref]) { try { return git(['rev-parse', '--verify', `${r}^{commit}`]).trim(); } catch { /* הבא */ } }
  throw new Error(`ref לא נמצא: ${ref}`);
}
// 🧪 SELF-V2: ה-sha נקרא מ-git בפעם הראשונה שצריך (לא בטעינה) — טהור-בטעינה
let SHA_; const SHA = () => (SHA_ ??= resolveRef(REF));
const show = (p) => git(['show', `${SHA()}:${p}`]);
function showMany(paths) {   // git cat-file --batch: קריאה אחת לכל הקבצים
  const buf = git(['cat-file', '--batch'], paths.map((p) => `${SHA()}:${p}`).join('\n') + '\n');
  const out = new Map(); let pos = 0;
  for (const p of paths) {
    const nl = buf.indexOf(10, pos); const hdr = buf.subarray(pos, nl).toString();
    if (hdr.endsWith(' missing')) { pos = nl + 1; continue; }
    const size = +hdr.split(' ')[2]; out.set(p, buf.subarray(nl + 1, nl + 1 + size).toString('utf8')); pos = nl + 1 + size + 1;
  }
  return out;
}

// ═══ מילון: מילת-קוד באנגלית ⇒ עברית (לשמות שאין להם הערת-תיאור) ═══
const VERB = {
  get: 'קבל', find: 'מצא', is: 'בדוק אם', has: 'בדוק אם יש', can: 'בדוק אם אפשר', should: 'בדוק אם צריך',
  count: 'ספור', sum: 'סכם', total: 'סכם', format: 'עצב', fmt: 'עצב', parse: 'פענח', build: 'בנה', make: 'צור',
  create: 'צור', sort: 'מיין', filter: 'סנן', merge: 'מזג', apply: 'החל', to: 'המר ל', compute: 'חשב', calc: 'חשב',
  plan: 'תכנן', normalize: 'נרמל', norm: 'נרמל', guard: 'שמור על', validate: 'אמת', verify: 'אמת', check: 'בדוק',
  render: 'הצג', show: 'הצג', decode: 'פענח', encode: 'קודד', split: 'פצל', join: 'חבר', resolve: 'פתור',
  pick: 'בחר', select: 'בחר', detect: 'זהה', scan: 'סרוק', search: 'חפש', match: 'התאם', compare: 'השווה',
  load: 'טען', read: 'קרא', write: 'כתוב', save: 'שמור', send: 'שלח', fetch: 'הבא', sync: 'סנכרן', push: 'דחוף',
  pull: 'משוך', add: 'הוסף', remove: 'הסר', delete: 'מחק', clear: 'נקה', clean: 'נקה', update: 'עדכן',   extract: 'חלץ', collect: 'אסוף', export: 'ייצא', import: 'ייבא',
  generate: 'חולל', gen: 'חולל', emit: 'פלוט', compose: 'הרכב', assemble: 'הרכב', run: 'הרץ', test: 'בדוק',
  audit: 'בקר', measure: 'מדוד', derive: 'גזור', infer: 'הסק', learn: 'למד', retrieve: 'שלוף', rank: 'דרג',
  score: 'נקד', estimate: 'הערך',   dedup: 'הסר כפילויות של', repair: 'תקן', fix: 'תקן', heal: 'רפא', purify: 'טהר', lift: 'הרם', carve: 'חצוב',
  chisel: 'סתת', harvest: 'קצור', upload: 'העלה', publish: 'פרסם', approve: 'אשר', assign: 'שבץ',   toggle: 'החלף מצב של', register: 'רשום', subscribe: 'הירשם ל', simulate: 'הדמה', enrich: 'העשר', replace: 'החלף',
  restore: 'שחזר', erase: 'מחק', reconcile: 'התאם', unify: 'אחד', refine: 'חדד', promote: 'קדם',   partition: 'חלק', regen: 'חולל מחדש', rewrite: 'כתוב מחדש', wire: 'חווט', detach: 'נתק', close: 'סגור',
  start: 'התחל', stop: 'עצור', retry: 'נסה שוב', ask: 'שאל', decide: 'הכרע', judge: 'שפוט',
  translate: 'תרגם', interpret: 'פרש', synth: 'הרכב', cut: 'חתוך', crop: 'חתוך', trim: 'קצץ', wrap: 'עטוף',
  lint: 'בדוק סגנון של', inspect: 'בחן', probe: 'גשש', grab: 'אסוף', dump: 'שפוך', fill: 'מלא', };
const NOUN = {
  row: 'שורה', rows: 'שורות', card: 'כרטיס', button: 'כפתור', btn: 'כפתור', chip: 'שבב-בחירה', label: 'תווית',
  field: 'שדה', fields: 'שדות', status: 'מצב', tile: 'אריח', header: 'כותרת', section: 'מקטע', action: 'פעולה',
  actions: 'פעולות', pill: 'גלולה', empty: 'ריק', sheet: 'גיליון', sheets: 'גיליונות', stat: 'נתון', stats: 'נתונים',
  settings: 'הגדרות', key: 'מפתח', text: 'טקסט', date: 'תאריך', csv: 'CSV', value: 'ערך', values: 'ערכים', id: 'מזהה',
  ids: 'מזהים', badge: 'תג', line: 'שורה', lines: 'שורות', progress: 'התקדמות', site: 'אתר', num: 'מספר',
  number: 'מספר', selection: 'בחירה', switch: 'מתג', switches: 'מתגים', screen: 'מסך', screens: 'מסכים', hub: 'מרכז',
  worker: 'עובד', trade: 'מקצוע', store: 'חנות', catalog: 'קטלוג', builder: 'בונה', dashboard: 'לוח-מחוונים',
  manager: 'מנהל', ai: 'בינה', courier: 'שליח', studio: 'סטודיו', rewards: 'תגמולים', intel: 'מודיעין', tab: 'לשונית',
  app: 'אפליקציה', rule: 'כלל', rules: 'כללים', finance: 'כספים', fin: 'כספים', profile: 'פרופיל', product: 'מוצר',
  products: 'מוצרים', editor: 'עורך', home: 'בית', reports: 'דוחות', report: 'דוח', index: 'אינדקס', box: 'קופסה',
  boxes: 'קופסאות', tasks: 'משימות', task: 'משימה', role: 'תפקיד', roles: 'תפקידים', chat: 'צ׳אט', chats: 'צ׳אטים',
  stock: 'מלאי', atom: 'אטום', atoms: 'אטומים', accessory: 'אביזר', accessories: 'אביזרים', acc: 'אביזר',
  server: 'שרת', attendance: 'נוכחות', notif: 'התראה', notifs: 'התראות', notifications: 'התראות', employer: 'מעסיק',
  data: 'נתונים', contractor: 'קבלן', bar: 'סרגל', bars: 'סרגלים', pane: 'חלונית', panes: 'חלוניות',
  panel: 'לוח', persona: 'פרסונה', gate: 'שער', gates: 'שערים', shell: 'מעטפת', proof: 'הוכחה', proofs: 'הוכחות',
  engine: 'מנוע', engines: 'מנועים', skin: 'עור-עיצוב', material: 'חומר', body: 'גוף', barcode: 'ברקוד',
  camera: 'מצלמה', brand: 'מותג', config: 'תצורה', theme: 'ערכת-נושא', forms: 'טפסים', form: 'טופס',
  picking: 'ליקוט', equipment: 'ציוד', credit: 'אשראי', project: 'פרויקט', projects: 'פרויקטים', name: 'שם',
  order: 'הזמנה', orders: 'הזמנות', coverage: 'כיסוי', census: 'מפקד', look: 'מראה', looks: 'מראות', shape: 'צורה',
  ops: 'פעולות', top: 'עליון', head: 'ראש', badge2: 'תג', placeholder: 'מציין-מקום', connection: 'חיבור',
  connections: 'חיבורים', budget: 'תקציב', attribute: 'מאפיין', attrs: 'מאפיינים', schema: 'סכמה', step: 'שלב',
  steps: 'שלבים', stage: 'שלב', stages: 'שלבים', checklist: 'רשימת-בדיקה', email: 'אימייל', outbox: 'תיבת-יוצא',
  users: 'משתמשים', user: 'משתמש', core: 'ליבה', tokens: 'אסימוני-עיצוב', tree: 'עץ', note: 'הערה', approval: 'אישור',
  requests: 'בקשות', request: 'בקשה', table: 'טבלה', hr: 'משאבי-אנוש', draft: 'טיוטה', hint: 'רמז', thumb: 'תמונה-ממוזערת',
  intro: 'פתיח', link: 'קישור', qty: 'כמות', summary: 'סיכום', size: 'גודל', org: 'ארגון', inventory: 'מלאי', file: 'קובץ',
  lang: 'שפה', sentence: 'משפט', sentences: 'משפטים', particle: 'חלקיק', particles: 'חלקיקים', doc: 'מסמך', docs: 'מסמכים',
  terms: 'מונחים', term: 'מונח', entity: 'ישות', entities: 'ישויות', goal: 'מטרה', title: 'כותרת', category: 'קטגוריה',
  banner: 'כרזה', consent: 'הסכמה', dialog: 'חלון-דו-שיח', warning: 'אזהרה', warn: 'אזהרה', info: 'מידע',
  dot: 'נקודה', dots: 'נקודות', state: 'מצב', gallery: 'גלריה', readiness: 'מוכנות', lens: 'עדשה', lenses: 'עדשות',
  mini: 'קטן', mode: 'מצב', modes: 'מצבים', new: 'חדש', notice: 'הודעה', portal: 'פורטל', stepper: 'מדרגות-שלבים',
  quick: 'מהיר', inbox: 'תיבת-דואר', version: 'גרסה', supplier: 'ספק', suppliers: 'ספקים', swatch: 'דוגמית-צבע',
  wizard: 'אשף', detail: 'פרטים', block: 'גוש', tool: 'כלי', tools: 'כלים', session: 'מפגש', donation: 'תרומה',
  active: 'פעיל', issues: 'תקלות', hebrew: 'עברית', heb: 'עברי', closed: 'סגור', payment: 'תשלום', item: 'פריט',
  items: 'פריטים', call: 'שיחה', tenant: 'דייר', support: 'תמיכה', threads: 'שרשורים', auth: 'הזדהות', base: 'בסיס',
  html: 'HTML', flow: 'זרימה', review: 'סקירה', manifest: 'מניפסט', diff: 'הבדלים', tests: 'בדיקות', seed: 'זרע',
  needs: 'צרכים', need: 'צורך', shelf: 'מדף', board: 'לוח', types: 'סוגים', type: 'סוג', widget: 'רכיב', graph: 'גרף',
  variants: 'גרסאות', ref: 'הפניה', sockets: 'שקעים', module: 'מודול', intent: 'כוונה', axis: 'ציר', big: 'גדול',
  scroll: 'גלילה', finder: 'מאתר', circle: 'עיגול', fab: 'כפתור-צף', coin: 'מטבע', company: 'חברה', connector: 'מחבר',
  connectors: 'מחברים', modal: 'חלון', handle: 'ידית', contrast: 'ניגודיות', personal: 'אישי', area: 'אזור',
  decision: 'החלטה', multi: 'מרובה', grip: 'אחיזה', hierarchy: 'היררכיה', icon: 'סמל', icons: 'סמלים', menu: 'תפריט',
  inline: 'בשורה', input: 'קלט', journey: 'מסע', kpi: 'מדד', group: 'קבוצה', divider: 'קו-מפריד', location: 'מיקום',
  log: 'יומן', tracker: 'עוקב', frame: 'מסגרת', pad: 'משטח', penalty: 'קנס', picker: 'בורר', option: 'אפשרות',
  options: 'אפשרויות', pipe: 'צינור', pipeline: 'צינור-עיבוד', legal: 'משפטי', preset: 'תבנית-מוכנה', certs: 'תעודות',
  price: 'מחיר', privacy: 'פרטיות', proposal: 'הצעה', referral: 'הפניה', composer: 'כותב', band: 'רצועה',
  severity: 'חומרה', defects: 'ליקויים', shutter: 'תריס', hero: 'כרזה-ראשית', snooze: 'נודניק', specialty: 'התמחות',
  control: 'בקרה', scaffold: 'שלד', target: 'יעד', subject: 'נושא', color: 'צבע', training: 'הדרכה', safety: 'בטיחות',
  bubble: 'בועה', vacation: 'חופשה', wide: 'רחב', nav: 'ניווט', zoom: 'זום', priority: 'עדיפות', blank: 'ריק',
  comment: 'הערה', coords: 'קואורדינטות', diameter: 'קוטר', edges: 'קצוות', msg: 'הודעה', ratios: 'יחסים',
  dim: 'מידה', dims: 'מידות', green: 'ירוק', fleet: 'צי-רכב', specs: 'מפרטים', spec: 'מפרט', pdf: 'PDF', int: 'שלם',
  analytics: 'ניתוח-נתונים', region: 'אזור', string: 'מחרוזת', hash: 'גיבוב', code: 'קוד', account: 'חשבון',
  entry: 'רשומה', url: 'כתובת-רשת', pattern: 'תבנית', registry: 'רישום', pointer: 'מצביע', local: 'מקומי',
  feature: 'יכולת', features: 'יכולות', service: 'שירות', fonts: 'גופנים', font: 'גופן', page: 'עמוד', kits: 'ערכות',
  demo: 'הדגמה', design: 'עיצוב', money: 'כסף', person: 'אדם', toast: 'הודעה-קופצת', undo: 'ביטול', packs: 'חבילות',
  reason: 'סיבה', palette: 'פלטה', fingerprint: 'טביעת-אצבע', cases: 'מקרים', contract: 'חוזה', source: 'מקור',
  sources: 'מקורות', cell: 'תא', graphics: 'גרפיקה', motion: 'תנועה', components: 'רכיבים', flags: 'דגלים',
  functions: 'פונקציות', knowledge: 'ידע', strings: 'מחרוזות', styles: 'סגנונות', verticals: 'ענפים', capability: 'יכולת',
  chrome: 'מסגרת', cloud: 'ענן', display: 'תצוגה', candidates: 'מועמדים', helper: 'עזר', default: 'ברירת-מחדל',
  bridge: 'גשר', full: 'מלא', hook: 'וו', meta: 'מטא', web: 'רשת', meter: 'מד', quality: 'איכות', family: 'משפחה',
  direction: 'כיוון', record: 'רשומה', truth: 'אמת', wave: 'גל', purpose: 'מטרה', main: 'ראשי', primary: 'ראשי',
  all: 'הכול', match2: 'התאמה', sub: 'משני', count2: 'מונה', done: 'שבוצע', smart: 'חכם', voice: 'קול', watch: 'מעקב',
  live: 'חי', manage: 'ניהול', search2: 'חיפוש', query: 'שאילתה', in: 'בתוך', from: 'מתוך', of: 'של', for: 'עבור',
  by: 'לפי', on: 'על', vs: 'מול', per: 'לכל', with: 'עם', without: 'בלי', no: 'בלי', or: 'או', and: 'ו',
  advance: 'קידום', tighten: 'הידוק', purity: 'טוהר', cross: 'חוצה', twins: 'תאומים', twin: 'תאום', golden: 'זהב',
  behavior: 'התנהגות', logic: 'לוגיקה', expr: 'ביטוי', today: 'היום', saved: 'שמור', save2: 'שמירה',
  callout: 'הבלטה', facet: 'פן', stats2: 'סטטיסטיקה', kv: 'מפתח-ערך', propose: 'הצעה', sec: 'מקטע', regression: 'נסיגה',
  ast: 'עץ-תחביר', dart: 'דארט', ts: 'TS', js: 'JS', flutter: 'פלאטר', pure: 'טהור', ds: 'מערכת-עיצוב', forge: 'מחושל',
  money2: 'כסף', amount: 'סכום', phone: 'טלפון', phones: 'טלפונים', course: 'חוג', courses: 'חוגים', supporter: 'תורם',
  supporters: 'תורמים', sup: 'תורם', receipt: 'קבלה', receipts: 'קבלות', event: 'אירוע', events: 'אירועים',
  calendar: 'לוח-שנה', month: 'חודש', year: 'שנה', day: 'יום', days: 'ימים', week: 'שבוע', time: 'זמן', hour: 'שעה',
  age: 'גיל', member: 'חבר', members: 'חברים', enrollment: 'שיבוץ', enrollments: 'שיבוצים', teacher: 'מורה',
  room: 'חדר', rooms: 'חדרים', family2: 'משפחה', families: 'משפחות', volunteer: 'מתנדב', volunteers: 'מתנדבים',
  delivery: 'מסירה', deliveries: 'מסירות', campaign: 'קמפיין', unit: 'יחידה', units: 'יחידות', booking: 'הזמנה',
  bookings: 'הזמנות', customer: 'לקוח', customers: 'לקוחות', quote: 'הצעת-מחיר', invoice: 'חשבונית', tax: 'מס',
  cart: 'עגלה', line2: 'קו', sku: 'מק״ט', variant: 'גרסה', size2: 'מידה', meters: 'מטרים', pressure: 'לחץ',
  drop: 'ירידה', flow2: 'זרימה', pipe2: 'צינור', install: 'התקנה', kit: 'ערכה', warehouse: 'מחסן', shop: 'חנות',
  path: 'נתיב', paths: 'נתיבים', window: 'חלון', windows: 'חלונות', plan2: 'תוכנית', mark2: 'סימון', tag: 'תג',
  tags: 'תגים', color2: 'צבע', image: 'תמונה', photo: 'תמונה', photos: 'תמונות', map2: 'מפה', address: 'כתובת',
  city: 'עיר', zip: 'מיקוד', country: 'מדינה', currency: 'מטבע', rate: 'תעריף', fee: 'עמלה', debt: 'חוב',
  balance: 'יתרה', paid: 'שולם', due: 'מועד-תשלום', overdue: 'באיחור', pending: 'ממתין', approved: 'מאושר',
  rejected: 'נדחה', open2: 'פתוח', valid: 'תקין', invalid: 'לא-תקין', enabled: 'מופעל', visible: 'גלוי',
  hidden: 'מוסתר', required: 'חובה', optional: 'רשות', min: 'מינימום', max: 'מקסימום', avg: 'ממוצע',
  sum2: 'סכום', percent: 'אחוז', pct: 'אחוז', ratio: 'יחס', score2: 'ציון', level: 'רמה', tier: 'דרגה',
  risk: 'סיכון', trend: 'מגמה', chart: 'תרשים', sparkline: 'קו-מגמה', legend: 'מקרא', axis2: 'ציר',
  question: 'שאלה', answer: 'תשובה', answers: 'תשובות', prayer: 'תפילה', names: 'שמות', segula: 'סגולה',
  reminder: 'תזכורת', reminders: 'תזכורות', absence: 'חיסור', absences: 'חיסורים', makeup: 'השלמה', lesson: 'שיעור',
  group2: 'קבוצה', wait: 'המתנה', waiting: 'המתנה', queue: 'תור', export2: 'ייצוא', backup: 'גיבוי', lock: 'נעילה',
  pin: 'קוד-נעילה', password: 'סיסמה', access: 'גישה', permission: 'הרשאה', admin: 'מנהל', owner: 'בעלים',
  employee: 'עובד', employees: 'עובדים', shift: 'משמרת', shifts: 'משמרות', salary: 'שכר', vat: 'מע״מ',
  qr: 'קוד-QR', scanner: 'סורק', recognition: 'זיהוי', writer: 'כותב', incoming: 'נכנס', windows2: 'חלונות',
  exact: 'מדויק', fuzzy: 'מקורב', mark3: 'סימן', thr: 'סף', col: 'עמודה', cols: 'עמודות', way: 'דרך',
  coming: 'מגיע', soon: 'בקרוב', filtered: 'מסונן', final: 'סופי', retention: 'שימור', floor: 'רצפה', scope: 'היקף',
  element: 'רכיב', polyroll: 'גליל-פוליאתילן', residual: 'שארית', stuck: 'תקוע', protocol: 'פרוטוקול',
  shards: 'רסיסים', common: 'משותף', changed: 'שהשתנה', central: 'מרכזי', setup: 'הקמה', bootstrap: 'אתחול',
  backfill: 'השלמה-לאחור', nonempty: 'לא-ריק', combos: 'צירופים', art: 'אמנות', best: 'הטוב-ביותר', lab: 'מעבדה',
  merged: 'ממוזג', person2: 'אדם', ledger: 'פנקס', corpus: 'קורפוס', sample: 'דוגמה', allow: 'היתר', exists: 'קיים',
  roundtrip: 'הלוך-חזור', orig: 'מקור', magic: 'קסם', land: 'נחיתה', stale: 'מיושן', copies: 'עותקים', oracle: 'אורקל',
  bin: 'קובץ-הרצה', exempt: 'פטור', critic: 'מבקר', free: 'חופשי', fuzz: 'בדיקה-אקראית', empire: 'אימפריה',
  consts: 'קבועים', regexes: 'ביטויים-רגולריים', hollow: 'חלול', fakers: 'זייפנים', pins: 'נעיצות', native: 'מקומי',
  tuples: 'צמדים', quarantine: 'בידוד', idx: 'אינדקס', independent: 'עצמאי', marks: 'סימנים', enum: 'רשימת-ערכים',
  frag: 'קטע', gold: 'זהב', harness: 'רתמה', insight: 'תובנה', composites: 'מורכבים', meta2: 'מטא', loader: 'טוען',
  maker: 'יוצר', candidates2: 'מועמדים', words: 'מילים', word: 'מילה', vocabulary: 'אוצר-מילים', company2: 'חברה',
  barcode2: 'ברקוד', boq: 'כתב-כמויות', estimate2: 'הערכה', install2: 'התקנה', wishlist: 'רשימת-משאלות',
};
const STOP = new Set(['the', 'a', 'an', 'x', 'v', 'v2', 'v3', 'bs', 'g', 'h', 'h2', 'h3', 'k', 'l', 'm', 'r', 's', 'ff', 'wf', 'rt', 'nl', 'md']);
const split = (s) => s.replace(/^_+/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const heCount = (s) => (s.match(/[֐-׿]/g) || []).length;

// מילות-קוד ⇒ צירוף עברי. אנגלית: התואר לפני הראש ⇒ בעברית הפוך (FinRows ⇒ «שורות כספים»).
function tokensToHebrew(tokens) {
  const words = []; let miss = 0;
  for (const t of tokens) { if (STOP.has(t) || /^\d+$/.test(t)) continue; const w = NOUN[t]; if (w) words.push(w); else miss++; }
  return { phrase: words.reverse().filter((w, i, a) => a.indexOf(w) === i).slice(0, 6).join(' '), miss };
}

// ═══ ניקוי טקסט-תיעוד ⇒ משפט עברי פשוט ═══
const SCRUB = [
  [/[\w.+-]+@[\w-]+\.[\w.]+/g, ''],                 // מיילים
  [/https?:\/\/\S+/g, ''],                          // כתובות-רשת
  [/\b[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|io|dev|app|co\.il|co|gov)\b\S*/g, ''],   // דומיינים בלי http
  [/\+?\d[\d\s-]{6,}\d/g, ''],                      // טלפונים / ת״ז / מספרים ארוכים
  [/\b(?:sk|pk|ghp|gho|AIza|xox[bp])[-_A-Za-z0-9]{8,}/g, ''],   // אסימונים
];
function cleanSentence(s) {
  let t = ` ${s} `;
  for (const [re, r] of SCRUB) t = t.replace(re, r);
  t = t.replace(/`[^`]*`/g, ' ').replace(/\*\*/g, '').replace(/[«»"“”]/g, '')
    .replace(/\((?:[^()]*[a-zA-Z_/.:#][^()]*)\)/g, ' ')                      // סוגריים עם קוד/נתיב
    .replace(/\b(?:G|L|R|S)\d[\w.–-]*/g, ' ').replace(/§\s?[\d\w-]+/g, ' ').replace(/(?:הכרעה|חוק|צעד|סבב)-?\s?\d+[\w./-]*/g, ' ')
    .replace(/(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\uFE0F|\u200D)/gu, ' ')
    .replace(/\b[\w$]+\.(?:mjs|js|ts|dart|py|json|md|sh|html)\b/g, ' ')        // שמות-קבצים
    .replace(/[^\s]*\/[^\s]*/g, ' ').replace(/[\u200e\u200f]/g, '').replace(/:\d+/g, ' ')     // נתיבים · סימני-כיוון · מספרי-שורה
    .replace(/\b[a-z]+[A-Z_][\w]*\b/g, ' ')                                    // מזהים camelCase/snake
    .replace(/\b[A-Z]{2,}-\d+\b|\b[a-z]\d+[\u0590-\u05FF]?/g, ' ')                  // קודי-משימה (PLAN-100, c4א)
    .replace(/\s+/g, ' ').trim();
  t = t.replace(/\(\s*\)/g, ' ').replace(/\s+([,.:;)])/g, '$1').replace(/\s+/g, ' ').trim();
  let depth = 0; t = [...t].filter((ch) => { if (ch === '(') depth++; else if (ch === ')') { if (!depth) return false; depth--; } return true; }).join('');   // סוגר בלי פותח
  const open = t.lastIndexOf('('); if (open >= 0 && t.indexOf(')', open) < 0) t = t.slice(0, open).trim();   // סוגר שנקטע
  return t;
}
const BOILER = /^(מוצא|המקור|חוזה|התוכן|שקע|שקעים|טוהר|המרה|הומר|תאום|קידום|הרצה|שימוש|כללי-המרה|הוזרק|נחצב|לוטש|הורם|מוטבע|ignore_for_file|אל תערוך|קלט|פלט)/;
// משפטי-תהליך של המחולל (איך החלקיק נוצר) — לא מה הוא עושה
const PROCESS = /התנהגות זהה|זהה-ביט|זהה-לחלוטין|מחווטת|אטומי-Dart|לובש עיצוב|גולגל|verbatim|אפס[- ]?import|top-level|אל תערוך|פרטי-במקור|פרטי⇒ציבורי|המקור קדוש|תורגם|הומר|נחצב|הוזרק|כשקע|חוק-\d|לא-משופרת|מקבילה ל|^\d+ חריצ|coding|^\d[\d.]*\s|^\(|מקור-האמת|הערת-המרה|האטום עיוור|פונקציות-שכן|^(?:למרות|אין|כגון|זה כל|הן|הוא|היא|ראו|כאן|ורק|אותם|אותו|ומתחת|במקום|ב|נמדד)\s|זהו ההוכחה|שהוטבעו|JS מכפה/;
const heWords = (x) => (x.match(/[\u0590-\u05FF]{3,}/g) || []).length;
function firstSegment(s, maxWords) {
  const segs = s.split(/\s+[·|—–]\s+|(?<=[.!?])\s+|;\s+|\s+—\s*/).map(cleanSentence).filter((x) => heCount(x) >= 8 && heWords(x) >= 2 && !BOILER.test(x) && !PROCESS.test(x) && !/[={}]/.test(x));
  if (!segs.length) return null;
  let seg = segs[0].replace(/^[\s,:.\-–]+|[\s,:.\-–⇒]+$/g, '');
  const w = seg.split(' '); if (w.length > maxWords) seg = w.slice(0, maxWords).join(' ');
  return seg.replace(/[\s,:;.\-–⇒(]+$/g, '');
}
function commentLines(text) {
  const out = [];
  for (const l of text.split('\n').slice(0, 30)) {
    const m = l.match(/^\s*(?:\/\/\/?|\/\*+|\*+(?!\/))\s?(.*)$/); if (m) out.push(m[1].replace(/\*\/\s*$/, '').trim());
    else if (l.trim() && !/^\s*(import|library|part|export)\b/.test(l)) break;
  }
  return out;
}
// תיאור, לפי סדר-עדיפות: «<שם-החלקיק> — <תיאור>» · «תפקיד:/מהות:/מטרה: …» · כל «X — <תיאור עברי>» אחר
function descOf(text, sym) {
  const lines = commentLines(text);
  const kebab = sym.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const bare = sym.replace(/^Forge/, '');
  const from = (l) => lines.slice(lines.indexOf(l)).join(' ').replace(/^.*?\s+[—–]\s+/, '');
  const dash = (l) => l.match(/^(.*?)\s+[—–]\s+(.+)$/);
  for (const l of lines) { const m = dash(l); if (m && heCount(m[2]) >= 4 && (m[1].includes(sym) || m[1].includes(kebab) || m[1].endsWith(bare))) return from(l); }
  for (const l of lines) { const m = l.match(/קופסת-חיבורים\s*·\s*([^—–(]+)/); if (m && heCount(m[1]) >= 4) return `קופסת-חיבורים של ${m[1].trim()}`; }
  for (const l of lines) { const m = l.match(/^(?:מהות|תפקיד|מטרה)\s*:\s*(.+)$/); if (m) return lines.slice(lines.indexOf(l)).join(' ').replace(/^(?:מהות|תפקיד|מטרה)\s*:\s*/, ''); }
  for (const l of lines) { const m = dash(l); if (m && heCount(m[2]) >= 4 && !/לוטש|הורם|מחושל|נחצב|אל תערוך|\//.test(m[1])) return from(l); }
  return null;
}

// מילת-פעולה לשם: שם-פעולה בעברית בתחילת התיאור ⇒ ציווי
const ACTION_NOUN = {
  'מיזוג': 'מזג', 'חישוב': 'חשב', 'בדיקה': 'בדוק', 'בדיקת': 'בדוק', 'זיהוי': 'זהה', 'תכנון': 'תכנן', 'המרה': 'המר',
  'המרת': 'המר', 'פענוח': 'פענח', 'ספירה': 'ספור', 'ספירת': 'ספור', 'סינון': 'סנן', 'מיון': 'מיין', 'יצירת': 'צור',
  'בניית': 'בנה', 'הפקת': 'הפק', 'עיצוב': 'עצב', 'נרמול': 'נרמל', 'איתור': 'אתר', 'חיפוש': 'חפש', 'טעינת': 'טען',
  'שמירת': 'שמור', 'הוספת': 'הוסף', 'מחיקת': 'מחק', 'עדכון': 'עדכן', 'קיבוץ': 'קבץ', 'פיצול': 'פצל', 'אימות': 'אמת',
  'סיכום': 'סכם', 'חילוץ': 'חלץ', 'ניקוי': 'נקה', 'פירוק': 'פרק', 'תרגום': 'תרגם', 'הצגת': 'הצג', 'מציאת': 'מצא',
  'קביעת': 'קבע', 'בחירת': 'בחר', 'דירוג': 'דרג', 'ניתוח': 'נתח', 'ייצוא': 'ייצא', 'ייבוא': 'ייבא', 'קריאת': 'קרא',
  'כתיבת': 'כתוב', 'שליחת': 'שלח', 'הרכבת': 'הרכב', 'גזירת': 'גזור', 'הסרת': 'הסר', 'החלת': 'החל', 'השוואת': 'השווה',
  'מדידת': 'מדוד', 'הערכת': 'הערך', 'רישום': 'רשום', 'סימון': 'סמן', 'שחזור': 'שחזר', 'טיהור': 'טהר', 'חיווט': 'חווט',
  'הרמת': 'הרם', 'סריקת': 'סרוק', 'קליטת': 'קלוט', 'אכיפת': 'אכוף', 'ביקורת': 'בקר', 'מעקב': 'עקוב אחרי',
};
function verbFor(firstToken, kind, layer) {
  if (layer === 'display') return 'הצג';
  if (firstToken && VERB[firstToken]) return VERB[firstToken];
  return { bool: 'בדוק', text: 'הפק', number: 'חשב', amount: 'חשב', date: 'חשב', list: 'הפק', sequence: 'הפק', waiting: 'הבא', ui: 'הצג', unknown: 'החזר' }[kind] || (kind.startsWith('record:') ? 'בנה' : 'החזר');
}
function nameFrom(desc, verb) {
  if (!desc) return null;
  const words = desc.split(' ');
  if (ACTION_NOUN[words[0]]) return [ACTION_NOUN[words[0]], ...words.slice(1)].slice(0, 9).join(' ');
  const [w0, ...rest0] = words[0].split('-');   // «מיזוג-כפולים» ⇒ «מזג כפולים»
  if (rest0.length && ACTION_NOUN[w0]) return [ACTION_NOUN[w0], rest0.join('-'), ...words.slice(1)].slice(0, 9).join(' ');
  if (words[0] === 'האם') return ['בדוק', ...words].slice(0, 9).join(' ');
  if (/^(בדוק|חשב|מצא|הפק|בנה|הצג|צור|ספור|סנן|מיין|מזג|המר|זהה)$/.test(words[0])) return words.slice(0, 9).join(' ');
  const v = verb.split(' ');
  return [...v, ...words].slice(0, 9).join(' ');
}

// ═══ טיפוס-קוד ⇒ kind מהאוצר המשותף ═══
const ENTITY_HINT = /^(family|families|supporter|donation|course|enrollment|member|event|room|teacher|volunteer|delivery|product|order|customer|project|task|receipt|payment|item|user|worker|employee|contractor|supplier)s?$/;
function kindOf(type, name = '') {
  const t = (type || '').replace(/\?$/, '').trim(); const n = name.toLowerCase();
  if (!t || t === 'void' || t === 'Null') return 'unknown';
  if (/\bFunction\b|=>|Callback|ValueChanged|ValueSetter/.test(t)) return 'unknown';
  if (/^Future(Or)?</.test(t)) return 'waiting';
  if (/^(Stream|Iterable)</.test(t) || t === 'Iterable') return 'sequence';
  if (/^(List|Set)\b/.test(t)) return /^(Uint8List|ByteData)$/.test(t) ? 'file' : 'list';
  if (/^Uint8List|^File\b|^XFile|^PlatformFile/.test(t)) return 'file';
  if (/^(ui\.)?Image\b|ImageProvider/.test(t)) return 'image';
  if (/^(LatLng|GeoPoint|Position)\b/.test(t)) return 'geo';
  if (t === 'DateTime') return 'date';
  if (t === 'Duration') return 'span';
  if (t === 'TimeOfDay') return 'times';
  if (t === 'bool') return 'bool';
  if (/^(int|num|double)$/.test(t)) return /amount|sum|total|price|ils|usd|cost|paid|due|bal|credit|debt|money|fee|budget|amt|salary|vat/.test(n) ? 'amount' : /times|repeat/.test(n) ? 'times' : 'number';
  if (t === 'String') return /iso|date|^day$|^from$|^until$|since/.test(n) ? 'date' : 'text';
  if (/^(Widget|Color|IconData|TextStyle|EdgeInsets\w*|BorderRadius|BoxDecoration|Gradient|Alignment\w*|Key)\b/.test(t)) return 'ui';
  if (/^Map\b/.test(t)) { const e = n.replace(/[^a-z]/g, ''); return ENTITY_HINT.test(e) ? `record:${e.replace(/s$/, '').replace(/ie$/, 'y')}` : 'record:any'; }
  if (/^(dynamic|Object)$/.test(t)) return 'unknown';
  if (/^[A-Z]\w*$/.test(t)) return `record:${t[0].toLowerCase()}${t.slice(1)}`;
  return 'unknown';
}

// ═══ חתימות Dart ═══
function splitTop(s) {   // פיצול בפסיקים ברמה העליונה
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if ('(<[{'.includes(ch)) depth++; else if (')>]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
function parseParam(p) {
  let s = p.replace(/^[{[]|[}\]]$/g, '').replace(/^@\w+\s+/, '').replace(/^required\s+/, '').replace(/\s*=\s*[\s\S]*$/, '').trim();
  s = s.replace(/^(final|const|covariant)\s+/, '');
  const fn = s.match(/^([\s\S]*?\bFunction\s*\([\s\S]*\))\s+(\w+)$/); if (fn) return { type: fn[1].replace(/\s+/g, ' '), name: fn[2] };
  const m = s.match(/^([\s\S]+?)\s+(\w+)$/); if (m) return { type: m[1].replace(/\s+/g, ' '), name: m[2] };
  return { type: s || 'dynamic', name: '' };
}
function fnParams(text, sym) {
  const re = new RegExp(`(?:^|\\n)\\s*(?:[\\w<>?,\\s\\[\\]]+?\\s+)?${sym}\\s*(?:<[^>]*>)?\\s*\\(`, 'g');
  const m = re.exec(text); if (!m) return null;
  let i = m.index + m[0].length, depth = 1, start = i;
  for (; i < text.length && depth; i++) { if (text[i] === '(') depth++; else if (text[i] === ')') depth--; }
  const inner = text.slice(start, i - 1).replace(/\/\/[^\n]*/g, '');
  const flat = inner.replace(/[{}[\]]/g, (c) => ` ${c} `);
  return splitTop(flat.replace(/\s*[{}[\]]\s*/g, ' ')).map(parseParam);
}
function widgetFields(text, cls) {
  const at = text.search(new RegExp(`class\\s+${cls}\\b`)); if (at < 0) return [];
  const body = text.slice(at, at + 6000); const end = body.search(/\n\s*(@override|Widget build|State<|void |static )/);
  const head = end > 0 ? body.slice(0, end) : body;
  const out = [];
  for (const m of head.matchAll(/^\s*final\s+([^;=]+);/gm)) {   // final T a; · final T a, b;
    const d = m[1].trim().match(/^([\w.<>?,\s]+?[>?\w])\s+(\w+(?:\s*,\s*\w+)*)$/); if (!d) continue;
    for (const n of d[2].split(/\s*,\s*/)) if (!n.startsWith('_')) out.push({ type: d[1].replace(/\s+/g, ' ').replace(/,\s*/g, ', '), name: n });
  }
  return out;
}

// ═══ 59 חלקיקי פעולות-היסוד — שם ודוגמה ביד, לפי גוף-השורה-האחת ═══
const OPS = {
  absNum: ['קח ערך מוחלט של מספר', 'מחזיר את המספר בלי סימן מינוס.', [-7], 7],
  addDyn: ['חבר שני ערכים מכל סוג', 'מחבר שני ערכים (מספרים או טקסטים) בעזרת +.', [2, 3], 5],
  addNum: ['חבר שני מספרים', 'מחזיר את הסכום של שני מספרים.', [2, 3], 5],
  addStr: ['הדבק שני טקסטים', 'מחבר טקסט אחד לסוף של טקסט אחר.', ['שנה ', 'טובה'], 'שנה טובה'],
  addTo: ['הוסף פריט לסוף רשימה', 'מוסיף פריט לסוף הרשימה (משנה את הרשימה).', [[1, 2], 3], [1, 2, 3]],
  cmpGeStr: ['בדוק אם טקסט בא אחרי או שווה', 'בודק לפי סדר אלפביתי אם הטקסט הראשון אחרי השני או שווה לו.', ['2026-05-01', '2026-01-01'], true],
  cmpGtDyn: ['בדוק אם ערך בא אחרי ערך', 'בודק לפי סדר-השוואה אם הערך הראשון גדול מהשני.', ['b', 'a'], true],
  cmpGtStr: ['בדוק אם טקסט בא אחרי טקסט', 'בודק לפי סדר אלפביתי אם הטקסט הראשון אחרי השני.', ['2026-05-01', '2026-01-01'], true],
  cmpLeDyn: ['בדוק אם ערך בא לפני או שווה', 'בודק לפי סדר-השוואה אם הערך הראשון קטן מהשני או שווה לו.', ['a', 'a'], true],
  cmpLeStr: ['בדוק אם טקסט בא לפני או שווה', 'בודק לפי סדר אלפביתי אם הטקסט הראשון לפני השני או שווה לו.', ['2026-01-01', '2026-05-01'], true],
  cmpLtDyn: ['בדוק אם ערך בא לפני ערך', 'בודק לפי סדר-השוואה אם הערך הראשון קטן מהשני.', ['a', 'b'], true],
  cmpLtStr: ['בדוק אם טקסט בא לפני טקסט', 'בודק לפי סדר אלפביתי אם הטקסט הראשון לפני השני.', ['2026-01-01', '2026-05-01'], true],
  containsStr: ['בדוק אם טקסט מכיל טקסט', 'בודק אם המילה המבוקשת מופיעה בתוך הטקסט.', ['צינור 45 מעלות', '45'], true],
  divDyn: ['חלק ערך בערך', 'מחלק ערך אחד בשני.', [10, 4], 2.5],
  divNum: ['חלק מספר במספר', 'מחזיר את התוצאה של חלוקת מספר במספר.', [10, 4], 2.5],
  eqBool: ['בדוק אם שני כן/לא שווים', 'בודק אם שני ערכי כן/לא זהים.', [true, true], true],
  eqDyn: ['בדוק אם שני ערכים שווים', 'בודק אם שני ערכים מכל סוג זהים.', [3, 3], true],
  eqList: ['בדוק אם זו אותה רשימה', 'בודק אם שתי רשימות הן אותה רשימה בדיוק (אותו עצם).', [[1], [1]], false],
  eqNum: ['בדוק אם שני מספרים שווים', 'בודק אם שני מספרים שווים.', [4, 4], true],
  eqStr: ['בדוק אם שני טקסטים שווים', 'בודק אם שני טקסטים זהים.', ['כן', 'כן'], true],
  falsy: ['בדוק אם ערך ריק או אפס', 'בודק אם הערך ריק, אפס, שקר או חסר.', [''], true],
  fieldIsNotNull: ['בדוק אם שדה ברשומה מלא', 'בודק אם לשדה המבוקש ברשומה יש ערך.', [{ city: 'עיר' }, 'city'], true],
  fieldIsNull: ['בדוק אם שדה ברשומה חסר', 'בודק אם השדה המבוקש ברשומה ריק או חסר.', [{}, 'city'], true],
  fieldOf: ['קח ערך של שדה מרשומה', 'מחזיר את הערך של שדה אחד מתוך רשומה.', [{ qty: 3 }, 'qty'], 3],
  fieldPred: ['בדוק תנאי על שדה ברשומה', 'מפעיל תנאי על הערך של שדה אחד ברשומה.', null, null],
  floorNum: ['עגל מספר כלפי מטה', 'מעגל את המספר למספר השלם שמתחתיו.', [7.8], 7],
  geDyn: ['בדוק אם ערך גדול או שווה', 'בודק אם הערך הראשון גדול מהשני או שווה לו.', [5, 5], true],
  geNum: ['בדוק אם מספר גדול או שווה', 'בודק אם המספר הראשון גדול מהשני או שווה לו.', [9, 9], true],
  gtDyn: ['בדוק אם ערך גדול מערך', 'בודק אם הערך הראשון גדול מהשני.', [5, 2], true],
  gtNum: ['בדוק אם מספר גדול ממספר', 'בודק אם המספר הראשון גדול מהשני.', [5, 2], true],
  iDivNum: ['חלק מספרים בלי שארית', 'מחלק ומחזיר רק את החלק השלם של התוצאה.', [10, 4], 2],
  isEmptyList: ['בדוק אם רשימה ריקה', 'בודק אם אין ברשימה אף פריט.', [[]], true],
  isEmptyStr: ['בדוק אם טקסט ריק', 'בודק אם הטקסט ריק.', [''], true],
  isNotEmptyList: ['בדוק אם יש פריטים ברשימה', 'בודק אם יש ברשימה לפחות פריט אחד.', [[1]], true],
  isNotEmptyStr: ['בדוק אם יש טקסט', 'בודק אם הטקסט לא ריק.', ['שלום'], true],
  isNotNull: ['בדוק אם יש ערך', 'בודק אם הערך קיים (לא חסר).', [0], true],
  isNull: ['בדוק אם אין ערך', 'בודק אם הערך חסר.', [null], true],
  joinList: ['חבר רשימה לטקסט אחד', 'מחבר את כל פריטי הרשימה לטקסט אחד עם מפריד ביניהם.', [['א', 'ב', 'ג'], ', '], 'א, ב, ג'],
  leDyn: ['בדוק אם ערך קטן או שווה', 'בודק אם הערך הראשון קטן מהשני או שווה לו.', [2, 5], true],
  leNum: ['בדוק אם מספר קטן או שווה', 'בודק אם המספר הראשון קטן מהשני או שווה לו.', [2, 5], true],
  lengthList: ['ספור פריטים ברשימה', 'מחזיר כמה פריטים יש ברשימה.', [['א', 'ב', 'ג']], 3],
  lengthStr: ['ספור תווים בטקסט', 'מחזיר כמה תווים יש בטקסט.', ['שלום'], 4],
  lowerStr: ['הפוך טקסט לאותיות קטנות', 'ממיר את האותיות הלועזיות בטקסט לאותיות קטנות.', ['PVC'], 'pvc'],
  ltDyn: ['בדוק אם ערך קטן מערך', 'בודק אם הערך הראשון קטן מהשני.', [2, 5], true],
  ltNum: ['בדוק אם מספר קטן ממספר', 'בודק אם המספר הראשון קטן מהשני.', [2, 5], true],
  modNum: ['חשב שארית חלוקה', 'מחזיר את השארית אחרי חלוקה של מספר במספר.', [10, 4], 2],
  mulDyn: ['הכפל ערך בערך', 'מכפיל ערך אחד בשני.', [3, 4], 12],
  mulNum: ['הכפל שני מספרים', 'מחזיר את המכפלה של שני מספרים.', [3, 4], 12],
  neBool: ['בדוק אם שני כן/לא שונים', 'בודק אם שני ערכי כן/לא שונים זה מזה.', [true, false], true],
  neDyn: ['בדוק אם שני ערכים שונים', 'בודק אם שני ערכים מכל סוג שונים.', [1, 2], true],
  neNum: ['בדוק אם שני מספרים שונים', 'בודק אם שני מספרים שונים.', [1, 2], true],
  neStr: ['בדוק אם שני טקסטים שונים', 'בודק אם שני טקסטים שונים.', ['כן', 'לא'], true],
  splitStr: ['פצל טקסט לרשימה', 'מחלק טקסט לרשימת חלקים לפי מפריד.', ['א,ב,ג', ','], ['א', 'ב', 'ג']],
  startsWithStr: ['בדוק אם טקסט מתחיל בטקסט', 'בודק אם הטקסט מתחיל במילה המבוקשת.', ['2026-05-01', '2026'], true],
  subDyn: ['החסר ערך מערך', 'מחסר ערך אחד מהשני.', [10, 4], 6],
  subNum: ['החסר מספר ממספר', 'מחזיר את ההפרש בין שני מספרים.', [10, 4], 6],
  sumBy: ['סכם ערך מכל פריט ברשימה', 'עובר על הרשימה ומסכם מספר שנלקח מכל פריט.', null, null],
  trimStr: ['הסר רווחים מקצות טקסט', 'מוחק רווחים מתחילת הטקסט ומסופו.', ['  שלום  '], 'שלום'],
  whereList: ['סנן רשימה לפי תנאי', 'משאיר ברשימה רק את הפריטים שעומדים בתנאי.', null, null],
};

// ═══ בניית החלקים ═══
const SRC = 'generator';
const clipWords = (s, k) => s.trim().split(/\s+/).slice(0, k).join(' ').replace(/[\s,:;·(\-–⇒]+$/, '');
const sentence = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);
const originOf = (text, file) => {
  const m = text.match(/מוצא:\s*(maor|buildsmart)\b/); if (m) return m[1];
  if (/^dart-maor\/|^dart-data-maor\//.test(file)) return 'maor';
  if (/^dart\/|^dart-ui-bs\/|^dart-data-bs\//.test(file)) return 'buildsmart';
  return null;
};

function logicPart(x, text, stats) {
  const p = `new/${x.file}`; const op = OPS[x.id];
  let params = fnParams(text, x.id);
  if (!params || params.length !== x.argc) { params = (x.params || []).map((t, i) => { const pp = parseParam(t); return pp.name ? pp : { type: t, name: `a${i + 1}` }; }); stats.sigFromIndex++; }
  const takes = params.map((q, i) => ({ name: q.name || `a${i + 1}`, kind: kindOf(q.type, q.name), type: q.type }));
  // טקסט-חוזר הוא תאריך רק כש-ISO במפורש (hebDateFull מחזיר תאריך-עברי מילולי = טקסט)
  const gives = { kind: kindOf(x.ret, x.ret === 'String' ? (/iso/i.test(x.id) ? 'iso' : '') : x.id), type: x.ret };
  let name, does, how;
  if (op) { [name, does] = op; how = 'op'; }
  else {
    const desc = descOf(text, x.id); const seg = desc && firstSegment(desc, 22);
    const toks = split(x.id);
    if (seg) { const verb = verbFor(null, gives.kind, 'logic'); name = nameFrom(clipWords(seg.split(/[,:;]/)[0], 8), verb); does = sentence(seg); how = 'comment'; }
    else {
      const verb = verbFor(toks[0], gives.kind, 'logic');
      const { phrase } = tokensToHebrew(VERB[toks[0]] ? toks.slice(1) : toks);
      name = phrase ? `${verb} ${phrase}` : `${verb} ערך`; does = sentence(`פונקציה שמחזירה ${phrase || 'ערך'}`); how = phrase ? 'dictionary' : 'generic';
    }
  }
  stats.name[how] = (stats.name[how] || 0) + 1;
  const sockets = params.filter((q) => /Function/.test(q.type)).length;
  const pure = gives.type !== 'void' && !gives.type.startsWith('Future') && !/^import\s+'(?!dart:(core|math|convert))/m.test(text);
  const tags = ['logic', `name:${how}`];
  const o = originOf(text, x.file); if (o) tags.push(`from:${o}`);
  if (op) tags.push('op');
  if (x.wireable) tags.push('wireable');
  if (sockets) tags.push(`sockets:${sockets}`);
  let example = null;
  if (op && op[2]) { const ins = {}; op[2].forEach((v, i) => { ins[takes[i] ? takes[i].name : `a${i + 1}`] = v; }); example = { in: ins, out: op[3] }; }
  return { id: `${SRC}:${p}#${x.id}`, source: SRC, path: p, symbol: x.id, lang: 'dart', what: 'particle', name: clipWords(name, 9), does, takes, gives, pure, example, tags: [...new Set(tags)].sort() };
}

function displayPart(x, text, stats) {
  const p = `new/${x.file}`;
  const takes = widgetFields(text, x.id).map((f) => ({ name: f.name, kind: kindOf(f.type, f.name), type: f.type }));
  const desc = descOf(text, x.id); const seg = desc && firstSegment(desc, 22);
  const capHe = { list: 'רשימה', card: 'כרטיס', kpi: 'מדד', progress: 'התקדמות', status: 'מצב' }[(x.caps || [])[0]] || 'רכיב';
  let name, does, how;
  if (seg) { name = nameFrom(clipWords(seg.split(/[,:;]/)[0], 8), 'הצג'); does = sentence(seg); how = 'comment'; }
  else {
    const toks = split(x.id).filter((t) => !['forge', 'ds', 'atoms'].includes(t));
    const fam = (text.match(/משפחת-Pure "(\w+)"/) || [])[1];
    if (fam && !toks.length) toks.push(fam);
    const screen = (text.match(/מוצא:\s*screens__([a-z_]+?)(?:_screen)?:/) || [])[1];
    const { phrase } = tokensToHebrew(toks);
    const where = screen ? tokensToHebrew(split(screen)).phrase : '';
    const core = phrase || capHe;
    name = `הצג ${core}${where && !core.includes(where) ? ` במסך ${where}` : ''}`;
    does = sentence(`רכיב תצוגה שמציג ${core}${where ? ` במסך ${where}` : ''}`); how = phrase ? 'dictionary' : 'generic';
  }
  if (!name.startsWith('הצג')) name = `הצג ${name}`;
  stats.name[how] = (stats.name[how] || 0) + 1;
  const tags = ['display', `name:${how}`, `seam:${x.seam}`, ...(x.caps || []).map((c) => `cap:${c}`)];
  const o = originOf(text, x.file); if (o) tags.push(`from:${o}`);
  if (x.id.startsWith('Forge')) tags.push('forge');
  const stateful = new RegExp(`class\\s+${x.id}\\s+extends\\s+StatefulWidget`).test(text);
  if (stateful) tags.push('stateful');
  return { id: `${SRC}:${p}#${x.id}`, source: SRC, path: p, symbol: x.id, lang: 'dart', what: 'component', name: clipWords(name, 9), does, takes, gives: { kind: 'ui', type: 'Widget' }, pure: !stateful, example: null, tags: [...new Set(tags)].sort() };
}

const LANG = { mjs: 'js', js: 'js', ts: 'ts', py: 'py', dart: 'dart' };
function enginePart(e, stats) {
  const lang = LANG[e.lang]; if (!lang) { stats.skipped.push(`${e.file} (${e.lang})`); return null; }
  const base = e.file.split('/').pop().replace(/\.[a-z]+$/, '').replace(/@.*/, '');
  const symbol = e.exports.find((x) => /^[a-z][A-Za-z0-9]*$/.test(x)) || base;
  let purpose = (e.purpose || '').replace(/^\S*\s*[—–]\s+/, (m) => (/[֐-׿]/.test(m) ? m : ''));
  purpose = purpose.replace(/^[^\s]*\.(?:mjs|js|ts|py|dart|sh)\s*[—–]\s*/, '');
  const seg = purpose && firstSegment(purpose, 22);
  const toks = split(symbol);
  let name, does, how;
  if (seg && !(e.purpose || '').startsWith('מוצא')) { name = nameFrom(clipWords(seg.split(/[,:;]/)[0], 8), 'הפעל'); does = sentence(seg); how = 'comment'; }
  else {
    const verb = VERB[toks[0]] || 'הפעל';
    const { phrase } = tokensToHebrew(VERB[toks[0]] ? toks.slice(1) : toks);
    const isDraft = (e.purpose || '').startsWith('מוצא:');
    name = `${verb} ${phrase || 'מנוע'}`;
    does = sentence(isDraft ? `טיוטת-קופסה שתורגמה אוטומטית מקוד-מקור: ${phrase || symbol}` : `מנוע שמטפל ב${phrase || 'משימה'}`);
    how = phrase ? 'dictionary' : 'generic';
  }
  stats.name[how] = (stats.name[how] || 0) + 1;
  const tags = ['engine', `name:${how}`, `dir:${e.file.split('/')[0]}`];
  if (e.runnable) tags.push('runnable');
  if (e.gate) tags.push('gate');
  if (e.writes && e.writes.length) tags.push('writes');
  if (e.exports.length) tags.push('library');
  return {
    id: `${SRC}:${e.file}#${symbol}`, source: SRC, path: e.file, symbol, lang, what: 'engine', name: clipWords(name, 9), does,
    takes: [], gives: { kind: 'unknown', type: e.writes && e.writes.length ? 'files' : e.exports.length ? 'module' : 'process' },
    pure: false, example: null, tags: [...new Set(tags)].sort(),
  };
}

function build() {
  const atoms = JSON.parse(show(ATOMS));
  const engines = JSON.parse(show(ENGINES)).engines;
  const files = showMany(atoms.map((x) => `new/${x.file}`));
  const stats = { name: {}, sigFromIndex: 0, skipped: [], missingFile: 0 };
  const parts = [];
  for (const x of atoms) {
    const text = files.get(`new/${x.file}`); if (text === undefined) { stats.missingFile++; continue; }
    parts.push(x.layer === 'logic' ? logicPart(x, text, stats) : displayPart(x, text, stats));
  }
  for (const e of engines) { const p = enginePart(e, stats); if (p) parts.push(p); }
  const seen = new Set(); for (const p of parts) { if (seen.has(p.id)) throw new Error(`id כפול: ${p.id}`); seen.add(p.id); }
  parts.sort(byId);
  return { doc: { source: SRC, repo: 'meir7651231-ui/-ai-chat-server', ref: `${REF.replace(/^origin\//, '')}@${SHA()}`, generatedAt: null, parts }, stats };
}

async function main() {
  const { doc, stats } = build();
  const text = JSON.stringify(doc, null, 2) + '\n';
  if (CHECK) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error(`✗ ${path.relative(ROOT, OUT)} לא מעודכן — הרץ: node catalog/scripts/generator-census.mjs`); process.exit(1); }
    console.log(`✓ ${path.relative(ROOT, OUT)} מעודכן`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, text);
    const by = (k) => doc.parts.reduce((m, p) => ((m[p[k]] = (m[p[k]] || 0) + 1), m), {});
    console.log(`✓ ${doc.parts.length} חלקים ⇒ ${path.relative(ROOT, OUT)}`);
    console.log('  what:', JSON.stringify(by('what')), ' lang:', JSON.stringify(by('lang')));
    console.log('  name-from:', JSON.stringify(stats.name), ' sig-from-index:', stats.sigFromIndex, ' missing-file:', stats.missingFile);
    console.log(`  לא מופו (${stats.skipped.length}):`, stats.skipped.join(', '));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
