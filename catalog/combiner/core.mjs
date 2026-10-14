/**
 * 🧲 המצרף · הליבה (COMBINER, 14.10.2026).
 *
 * "מכונה שבונה כל דבר משילוב חלקים קטנים — לא רק אורביט אלא כל מה שבנינו."
 * מטרה = רשימת צרכים {behavior, verb, material}. לכל צורך מחפשים חלקים שהפועל שלהם מתאים והסוגים שלהם מתאימים,
 * בטבעות כמו מנוע-הטבעות של הבעלים: טבעת 1 = חלק בודד · טבעת 2 = זוג · טבעת 3 = שלישייה, כשהפלט של אחד הוא הקלט של הבא.
 * מדרגים: פחות חלקים · ערבוב פרויקטים. **"לא חסר כלום"** (הכרעת-בעלים): צורך נחשב נמצא רק דרך חלק שהוכח בהרצה;
 * חלק אחד בלבד עושה את הפועל של הצורך, וכל השאר הם מתאמי-סוג טהורים (ממיר/מעצב/ממיר-כל-פריט/מפצל/מצרף/מנרמל).
 * מה שלא הוכח — לא "חסר": או ⛏️ בכרייה (פועל שנכרה עכשיו / NEW:x) עם המקומות הידועים, או 🔎 עוד לא נחפר עם 3 מקומות לחפור.
 *
 * טהור ודטרמיניסטי: בלי fs/רשת/שעון/אקראי. אותו קלט ⇒ אותה הרכבה, ביט אחר ביט. רץ ב-node (cli) ובדפדפן (lab.html).
 */
import { VERBS, VERB_BY_ID, RECIPE_VERB, EXTRA_IDS, canonVerb, staticVerbsScored } from './verbs.mjs';

/* ═══════════════ "לא חסר כלום" — הסטטוסים ═══════════════ */

/** מתאמי-סוג: הפועל שלהם רק משנה צורה. רק הם מותרים כ"דבק" סביב חלק-הליבה. */
export const ADAPTER_VERBS = new Set(['convert', 'format', 'map', 'split', 'join', 'normalize']);
/**
 * פעלים שנכרים עכשיו מהקוד. צורך עליהם בלי חלק מוכח ⇒ ⛏️ בכרייה.
 * ריק מאז 14.10.2026: 21 הפעלים (decay…require-source) נכרו ומוזגו — לכל אחד ליבה מוכחת וחוקים. צורך עליהם שעוד לא
 * נמצא (גם לא כשילוב) ⇒ 🔎 עם המקומות (הליבה ראשונה). ⛏️ נשאר רק ל-`NEW:x` שהאלפבית עוד לא מכיר.
 */
export const MINING_VERBS = new Set();
export const STATUS_HE = { proven: '✅ מוכח בהרצה', inner: '✅ מוכח — חלק פנימי', combo: '✅ מוכח — שילוב', mining: '⛏️ נמצא בקוד — בכרייה', dig: '🔎 עוד לא נחפר' };
/** סדר-העדיפות (הכרעת-בעלים): חלק מוכח אחד > חלק פנימי > שילוב מוכח (שני חלקים שעברו את חוקי הפועל) > ⛏️/🔎. */
export const STATUS_ORDER = ['proven', 'inner', 'combo', 'mining', 'dig'];

/** פועל מבוקש ⇒ פועל באלפבית: כינוי (gate ⇒ validate), ו-`NEW:x` ⇒ x כשהאלפבית כבר מכיר את x (נקרא בזמן ריצה). */
export function resolveVerb(v) {
  const s = String(v || '');
  if (s.startsWith('NEW:')) {
    const x = canonVerb(s.slice(4));
    return VERB_BY_ID[x] ? x : s;
  }
  return canonVerb(s);
}
const bareVerb = (v) => String(v || '').replace(/^NEW:/, '');
import { exampleLaw } from './laws.mjs';

/* ═══════════════ פרויקטים וסוגים ═══════════════ */

export const PROJECTS = {
  orbit: { he: 'אורביט', color: '#7c5cff' },
  buildsmart: { he: 'בנייה חכמה', color: '#f08c00' },
  generator: { he: 'המחולל', color: '#0ca678' },
  rings: { he: 'הטבעות', color: '#e64980' },
  yeshiva: { he: 'הישיבה', color: '#1c7ed6' },
  'qa-scanner': { he: 'סורק QA', color: '#868e96' },
  'yoman-habina': { he: 'יומן הבינה', color: '#ae3ec9' },
  '14kk': { he: '14kk', color: '#5c940d' },
  mmmm: { he: 'MMMM', color: '#d6336c' },
  recipe: { he: 'מתכון', color: '#c92a2a' },
  // הליבות שחולצו מהקוד (catalog/core): לא "פרויקט" — הפרויקטים שלהן הם ה-origins
  core: { he: 'הליבה', color: '#495057', core: true },
  'core-b': { he: 'ליבות-הפעלים', color: '#495057', core: true },
};
/** שם-ריפו (כמו ב-origins של core-b) ⇒ מזהה-הפרויקט. */
const REPO_SOURCE = { 'maor-system': 'orbit', buildsmart: 'buildsmart', 'yeshiva-engine': 'yeshiva', '14kk': '14kk', mmmm: 'mmmm', MMMM: 'mmmm', 'yoman-habina': 'yoman-habina', 'qa-scanner': 'qa-scanner', '-ai-chat-server': 'generator' };
const isCoreSrc = (s) => !!PROJECTS[s]?.core;
/** חלק פנימי (inner-<פרויקט>) גר בפרויקט שלו. */
const projSrc = (s) => String(s || '').replace(/^inner-/, '');
const projHe = (s) => PROJECTS[projSrc(s)]?.he || projSrc(s);
const SOURCE_ORDER = ['orbit', 'rings', 'buildsmart', 'generator', 'yeshiva', 'qa-scanner', 'yoman-habina', '14kk', 'mmmm', 'recipe'];
const srcRank = (s) => {
  const i = SOURCE_ORDER.indexOf(s);
  return i < 0 ? SOURCE_ORDER.length : i;
};

export const KINDS = [
  { id: 'number', he: 'מספר' },
  { id: 'amount', he: 'סכום כסף' },
  { id: 'times', he: 'רגעים בזמן' },
  { id: 'date', he: 'תאריך' },
  { id: 'span', he: 'מ… עד…' },
  { id: 'sequence', he: 'רשימה מסודרת' },
  { id: 'list', he: 'רשימה' },
  { id: 'waiting', he: 'מחכה לתשובה' },
  { id: 'text', he: 'טקסט' },
  { id: 'bool', he: 'כן/לא' },
  { id: 'choice', he: 'בחירה' },
  { id: 'geo', he: 'מקום' },
  { id: 'record', he: 'רשומה' },
  { id: 'image', he: 'תמונה' },
  { id: 'sound', he: 'קול' },
  { id: 'file', he: 'קובץ' },
];
export const KIND_HE = Object.fromEntries(KINDS.map((k) => [k.id, k.he]));
export const kindHe = (k) => KIND_HE[k] || (String(k).startsWith('record:') ? 'רשומה' : String(k));

/** זוגות קרובים (התאמה חלשה): מספר↔סכום (מעגל של אורביט נכתב על "סכום" אבל הוא כללי), רשימה↔רשימה מסודרת. */
const WEAK = new Set(['number|amount', 'amount|number', 'list|sequence', 'sequence|list']);

/** 2 = מתאים בדיוק · 1 = קרוב · 0 = לא. */
export function fit(kind, want) {
  if (!kind || !want || kind === 'unknown') return 0;
  if (kind === want) return 2;
  if (want === 'record' && kind.startsWith('record:')) return 2;
  if (want.startsWith('record:') && kind.startsWith('record:')) return 1;
  if (WEAK.has(kind + '|' + want)) return 1;
  return 0;
}
/** הקלט הראשי של חלק = הקלט הראשון (השאר הם פרטים: צעד, כמות, אפשרויות). */
const accepts = (p, kind) => p.takes.length > 0 && fit(kind, p.takes[0]) > 0;

/* ═══════════════ האינדקס ═══════════════ */

const TIER_RANK = { proven: 0, runnable: 1, static: 2 };
export const TIER_HE = { proven: 'מוכח', runnable: 'ניתן להרצה', static: 'סטטי' };

const dedupeKey = (p) => {
  const sig = p.takes.map((t) => t.kind).join(',') + '>' + p.gives.kind;
  const strong = p.takes.length > 0 && p.gives.kind !== 'unknown';
  const sym = String(p.symbol).toLowerCase().replace(/[^a-z0-9֐-׿]/g, '');
  return strong ? sym + '|' + sig : p.source + '|' + p.id;
};

const STATUS_RANK = { proven: 0, twin: 1, example: 1, static: 2 };
const holdsAll = (h) => typeof h === 'string' && /^(\d+)\/\1$/.test(h) && Number(h.split('/')[0]) > 0;

/** דרגת-הוכחה של פועל בחלק: מוכח (חוקים רצו) · ניתן-להרצה (תאום מוכח / דוגמה / קוד טהור שאפשר להריץ) · סטטי. */
function tierOfStatus(status, p) {
  if (status === 'proven') return 'proven';
  if (status === 'twin' || status === 'example') return 'runnable';
  return p.pure && (p.lang === 'ts' || p.lang === 'js') ? 'runnable' : 'static';
}

/** הפעלים של חלק אחד, כל אחד עם ההוכחה שלו. */
function rateHome(p, judge, behavior) {
  const pv = {};
  const add = (id, proof) => {
    if (!VERB_BY_ID[id]) return;
    const cur = pv[id];
    if (!cur || STATUS_RANK[proof.status] < STATUS_RANK[cur.status] || (proof.status === cur.status && proof.s < cur.s)) pv[id] = proof;
  };
  const b = behavior?.get(p.id);
  // "מוכח וגם השם אומר את זה" חזק יותר מ"מוכח" בלבד (חלק שמעגל בדרך-אגב לא קודם למעגל)
  const named = new Set(staticVerbsScored(p).map((v) => v.id));
  if (b) {
    for (const v of b.verbs) {
      const id = canonVerb(typeof v === 'string' ? v : v.id);
      if (b.labeledBy === 'run' && holdsAll(v.holds)) add(id, { status: 'proven', by: 'reader', cases: Number(v.holds.split('/')[0]), laws: VERB_BY_ID[id]?.laws || [], s: named.has(id) ? 0 : 1 });
      else if (b.labeledBy === 'twin') add(id, { status: 'twin', by: 'reader', s: named.has(id) ? 0 : 1 });
      else add(id, { status: 'static', by: 'reader', s: v.by === 'first' || named.has(id) ? 0 : 1 });
    }
  }
  // התיוג הזמני: בלי קורא — הכול; עם קורא — רק הפעלים שאין באלפבית (מקום-השמש)
  for (const v of staticVerbsScored(p)) if (!b || EXTRA_IDS.includes(v.id)) add(v.id, { status: 'static', by: 'static', s: v.s });
  const j = judge[p.id];
  if (j?.status === 'proven') add(j.verb, { status: 'proven', by: 'judge', cases: j.cases, checks: j.checks, laws: j.laws, s: 0 });
  // דוגמה אמיתית מול חוק הפועל: מקיימת ⇒ "נבדק על דוגמה"; סותרת ⇒ התווית הסטטית שגויה ויורדת
  for (const id of Object.keys(pv)) {
    if (pv[id].status !== 'static') continue;
    const r = exampleLaw(id, p);
    if (r && !r.ok) delete pv[id];
    else if (r?.ok) pv[id] = { ...pv[id], status: 'example', by: 'example' };
  }
  for (const id of Object.keys(pv)) pv[id].tier = tierOfStatus(pv[id].status, p);
  return { p, pv, labeledBy: b?.labeledBy || 'static' };
}

const bestTier = (pv) => Object.values(pv).reduce((w, x) => (TIER_RANK[x.tier] < TIER_RANK[w] ? x.tier : w), 'static');
const verbOrder = (a, b) => VERBS.findIndex((v) => v.id === a) - VERBS.findIndex((v) => v.id === b);

/**
 * בונה את האינדקס מכל החלקים: תיוג-פעלים, איחוד כפולים בין פרויקטים (חלק אחד, כמה בתים), הוכחה לכל פועל.
 * @param parts         כל החלקים מכל `catalog/sources/*.json`
 * @param opts.proofs   `proofs.json` מהשופט ({parts:{id:{status, verb,…}}, flows:{"a>b":…}})
 * @param opts.behavior Map id ⇒ רשומת קורא-ההתנהגות ({labeledBy, verbs:[{id, holds}]}) — גוברת על התיוג הזמני
 * @param opts.recipes  מתכונים שמורים (`catalog/recipes/*.json`) — נכנסים כחלקים חדשים
 */
export function buildIndex(parts, opts = {}) {
  const judge = opts.proofs?.parts || {};
  const behavior = opts.behavior || null;
  const groups = new Map();
  const sorted = [...parts].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // כל החלקים (גם רכיבים) — כדי לתת שם פשוט להורה של חלק פנימי
  const rawById = new Map(sorted.map((p) => [p.id, p]));
  for (const p of sorted) {
    if (p.what === 'component' || p.gives?.kind === 'ui') continue;
    const k = dedupeKey(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const out = [];
  for (const homes of groups.values()) {
    const rated = homes.map((p) => rateHome(p, judge, behavior));
    rated.sort((a, b) => TIER_RANK[bestTier(a.pv)] - TIER_RANK[bestTier(b.pv)] || srcRank(a.p.source) - srcRank(b.p.source) || (a.p.id < b.p.id ? -1 : 1));
    const best = rated[0];
    // לכל פועל — ההוכחה הטובה מבין כל הבתים (אותו חלק שהועתק בין פרויקטים)
    const proofs = {};
    for (const r of rated)
      for (const [id, x] of Object.entries(r.pv)) {
        const cur = proofs[id];
        if (!cur || TIER_RANK[x.tier] < TIER_RANK[cur.tier] || (x.tier === cur.tier && x.s < cur.s)) proofs[id] = { ...x, home: r.p.id };
      }
    const verbs = Object.keys(proofs).sort(verbOrder);
    const strength = Object.fromEntries(verbs.map((v) => [v, proofs[v].s]));
    const slimProofs = {};
    for (const v of verbs) {
      const { s: _s, home, ...rest } = proofs[v];
      slimProofs[v] = home === best.p.id ? rest : { ...rest, home };
    }
    const parent = rated.map((r) => r.p.parent).find((x) => typeof x === 'string') || null;
    const pp = parent ? rawById.get(parent) : null;
    const origins = originsOf(rated.map((r) => r.p));
    const bPrimary = rated.map((r) => behavior?.get(r.p.id)?.primary).find((x) => typeof x === 'string');
    // החומר שהקורא מדד (סוג הקלט שהפועל נקשר אליו; ברשימה — סוג הפריט): "רשימת הודעות" עובדת על הודעה
    const bMaterial = rated.map((r) => behavior?.get(r.p.id)?.material).find((x) => typeof x === 'string' && x !== 'unknown');
    const jPrimary = rated.map((r) => judge[r.p.id]).find((j) => j?.status === 'proven')?.verb;
    const primary = [bPrimary && canonVerb(bPrimary), jPrimary].find((v) => v && proofs[v]) || verbs.slice().sort((a, b) => TIER_RANK[proofs[a].tier] - TIER_RANK[proofs[b].tier] || proofs[a].s - proofs[b].s)[0] || null;
    out.push({
      id: best.p.id,
      source: best.p.source,
      homes: rated.map((r) => ({ source: r.p.source, id: r.p.id })),
      path: best.p.path || fileOfId(best.p.id),
      ...(origins.length > 1 || (origins[0] && origins[0].source !== best.p.source) ? { origins } : {}),
      ...(parent ? { parent: { id: parent, name: pp?.name || symOfId(parent), path: pp?.path || fileOfId(parent) } } : {}),
      primary,
      name: best.p.name,
      does: String(best.p.does || '').slice(0, 160),
      what: best.p.what,
      lang: best.p.lang,
      pure: !!best.p.pure,
      takes: best.p.takes.map((t) => t.kind),
      gives: best.p.gives.kind,
      ...(bMaterial && bMaterial !== best.p.takes[0]?.kind && bMaterial !== best.p.gives.kind ? { material: bMaterial } : {}),
      verbs,
      strength,
      labeledBy: best.labeledBy,
      tier: verbs.length ? bestTier(proofs) : tierOfStatus('static', best.p),
      proofs: slimProofs,
    });
  }
  for (const r of opts.recipes || []) out.push(recipePart(r, out));
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return indexOf(out, opts.proofs?.flows || {}, opts.leads || []);
}

const fileOfId = (id) => String(id).replace(/^[^:]*:/, '').split('#')[0];
const symOfId = (id) => String(id).split('#')[1] || fileOfId(id);
/**
 * כל הפרויקטים שבהם החלק נמצא: הבתים (אותו חלק שהועתק) + `origins[]` של הכורים.
 * סובלני לצורה: מחרוזת ("orbit" / "orbit:path#sym") או אובייקט {source|project, id?, path|file?}.
 */
function originsOf(homes) {
  const out = [];
  const add = (source, file) => {
    if (!source) return;
    if (!out.some((o) => o.source === source && o.file === file)) out.push({ source, file: file || '' });
  };
  for (const p of homes) {
    // מקורות מפורשים: `origins[]` (core-b, inner) או תגיות `origin:<פרויקט>:<קובץ>:<שורה>` (core — החוזה לא מכיר origins)
    const tagged = (p.tags || []).filter((t) => typeof t === 'string' && t.startsWith('origin:')).map((t) => { const [, src, ...rest] = t.split(':'); return { source: src, file: rest.join(':').replace(/:\d+$/, '') }; });
    const own = Array.isArray(p.origins) && p.origins.length ? p.origins : tagged.length ? tagged : null;
    // מקור מפורש (הכורים) ⇒ פרויקטי-המקור; הבית עצמו נספר רק אם הוא פרויקט מוכר (לא ליבה)
    if (!own || (PROJECTS[p.source] && !isCoreSrc(p.source))) add(p.source, p.path || fileOfId(p.id));
    for (const o of own || []) {
      if (typeof o === 'string') add(o.split(':')[0], o.includes(':') ? fileOfId(o) : '');
      else if (o && typeof o === 'object') add(o.source || o.project || REPO_SOURCE[String(o.repo || '').split('@')[0]] || (String(o.repo || '').includes('/') ? REPO_SOURCE[String(o.repo).split('/')[1].split('@')[0]] : '') || (o.id ? String(o.id).split(':')[0] : ''), o.path || o.file || (o.id && String(o.id).includes(':') ? fileOfId(o.id) : ''));
    }
  }
  return out;
}

/** דרגת החלק בתפקיד מסוים (פועל); בלי פועל — הדרגה הטובה שלו. */
export const tierFor = (p, verb) => p.proofs?.[verb]?.tier || p.tier;

/** אינדקס מוכן לחיפוש (גם מתוך lab-data.json שכבר נבנה — lab.html). */
export function indexOf(parts, flows = {}, leads = []) {
  const byVerb = new Map();
  const byTake = new Map();
  for (const p of parts) {
    for (const v of p.verbs) {
      if (!byVerb.has(v)) byVerb.set(v, []);
      byVerb.get(v).push(p);
    }
    for (const t of new Set(p.takes)) {
      if (!byTake.has(t)) byTake.set(t, []);
      byTake.get(t).push(p);
    }
  }
  const order = (verb) => (a, b) =>
    TIER_RANK[tierFor(a, verb)] - TIER_RANK[tierFor(b, verb)] || (a.takes.length ? 0 : 1) - (b.takes.length ? 0 : 1) || a.takes.length - b.takes.length || srcRank(a.source) - srcRank(b.source) || (a.id < b.id ? -1 : 1);
  for (const [v, xs] of byVerb) xs.sort(order(v));
  for (const xs of byTake.values()) xs.sort(order(null));
  return { parts, byId: new Map(parts.map((p) => [p.id, p])), byVerb, byTake, flows, leads, roots: new Map() };
}

/* ═══════════════ מתכונים — המדף ═══════════════ */

/** מתכון שמור ⇒ חלק חדש (לבנה). הפלט = רשומה מסוג המתכון; הפועל = "מתכון שמור" (הפעלים שבתוכו — ב-inner). */
export function recipePart(r, known = []) {
  if (r.combo) return comboPart(r, known);
  const steps = r.needs.flatMap((n) => n.chain);
  const byId = new Map(known.map((p) => [p.id, p]));
  const tiers = steps.map((id) => byId.get(id)?.tier || 'static');
  const tier = tiers.reduce((w, t) => (TIER_RANK[t] > TIER_RANK[w] ? t : w), 'proven');
  const verbs = [...new Set(r.needs.map((n) => n.verb))];
  return {
    id: 'recipe:' + r.id,
    source: 'recipe',
    homes: [{ source: 'recipe', id: 'recipe:' + r.id }],
    name: 'בונה ' + r.word + ' (מתכון)',
    does: r.title || r.word,
    what: 'brick',
    lang: 'machine',
    pure: true,
    takes: [],
    gives: 'record:recipe',
    // פועל אחד — "מתכון שמור"; מטרה מבקשת אותו במפורש (keys = המילה), כדי שמתכון לא יזהם צרכים אחרים
    verbs: [RECIPE_VERB.id],
    strength: { [RECIPE_VERB.id]: 0 },
    inner: verbs,
    labeledBy: 'recipe',
    tier,
    path: 'catalog/recipes/' + r.id + '.json',
    primary: RECIPE_VERB.id,
    // מתכון מוכח = כל הצעדים שבתוכו הוכחו בהרצה (רק כאלה נכנסים למתכון)
    proofs: { [RECIPE_VERB.id]: { status: tier === 'proven' ? 'proven' : 'static', by: 'recipe', tier } },
    recipe: { id: r.id, word: r.word, parts: steps.length, projects: [...new Set(steps.map((id) => id.split(':')[0]))].sort() },
  };
}

/**
 * שילוב מוכח (catalog/combiner/combine.mjs) ⇒ חלק אחד שמוכח לפועל שלו: שני חלקים מוכחים-בהרצה, מחוברים,
 * והפונקציה המורכבת עברה את **החוקים של הפועל** n/n. נכנס לחיפוש רק אחרי חלק בודד וחלק פנימי.
 */
function comboPart(r, known) {
  const c = r.combo;
  const byId = new Map(known.map((p) => [p.id, p]));
  const ps = c.steps.map((id) => byId.get(id));
  const a = ps[0]; const b = ps[ps.length - 1];
  // גרף: הקלטים והפלט = של הפועל עצמו (נשמרו במתכון); שרשרת: הקלטים של הראשון, הפלט של האחרון
  const takes = c.takes ? c.takes : c.form === 'pair' ? [c.material] : a ? [a.takes[0], ...a.takes.slice(1)] : [];
  return {
    id: 'recipe:' + r.id,
    source: 'recipe',
    homes: [{ source: 'recipe', id: 'recipe:' + r.id }],
    name: r.title || r.word,
    does: c.hint || r.title || '',
    what: 'brick',
    lang: 'machine',
    pure: true,
    takes,
    gives: c.gives ? c.gives : c.form === 'pair' ? (b?.gives || 'number') : b?.gives || 'unknown',
    material: c.material,
    verbs: [c.verb],
    strength: { [c.verb]: 0 },
    labeledBy: 'combo',
    tier: 'proven',
    path: 'catalog/recipes/' + r.id + '.json',
    primary: c.verb,
    proofs: { [c.verb]: { status: 'proven', by: 'combo', cases: Number(String(c.holds).split('/')[0]) || 0, laws: c.laws || [], tier: 'proven' } },
    combo: { verb: c.verb, form: c.form, steps: c.steps, roles: c.roles, holds: c.holds, laws: c.laws || [], ...(c.hint ? { hint: c.hint } : {}), ...(c.graph ? { graph: c.graph } : {}) },
  };
}

/** הרכבה מוצלחת ⇒ מתכון לשמירה (`catalog/recipes/<id>.json`). */
export function recipeFrom(assembly) {
  return {
    id: assembly.goal.id,
    word: assembly.goal.word,
    title: assembly.goal.title,
    needs: assembly.needs.filter((n) => n.chain).map((n) => ({ need: n.need.id, verb: n.need.verb, material: n.need.material, chain: n.chain.steps.map((s) => s.id) })),
  };
}

/* ═══════════════ החיפוש — טבעות ═══════════════ */

/** הוכח בהרצה לפועל הזה (קורא-ההתנהגות n/n, השופט, או מתכון שכל צעדיו מוכחים). רק זה נחשב "נמצא". */
export const provenAs = (p, v) => p.proofs?.[v]?.status === 'proven';
const plainKind = (k) => !!k && k !== 'unknown' && !String(k).startsWith('record');
/**
 * תפקיד-מתאם: הפועל **הראשי** של החלק הוא מתאם-סוג והוא הוכח בהרצה; קלט אחד בלבד, סוגים פשוטים (לא רשומה של עולם),
 * והסוג באמת משתנה. חלק-עולם (מוצא ארוחות, תווית שנה) לעולם לא דבק.
 */
export const adapterRole = (p) =>
  ADAPTER_VERBS.has(p.primary) && provenAs(p, p.primary) && p.takes.length === 1 && plainKind(p.takes[0]) && plainKind(p.gives) && fit(p.gives, p.takes[0]) === 0 ? p.primary : null;
const kindsOf = (k) => String(k || '').split('|').filter(Boolean);
/**
 * מותר לסיים במתאם רק כשהחומר של הצורך הוא צורה של מה שהפועל עצמו מקבל או נותן (לפי האלפבית).
 * "מדרג ⇒ רשימה": מדרג נותן בחירה ומקבל מספר — מתאם שמפצל את התווית לרשימה רק מזייף את החומר.
 */
function matFitsVerb(verb, mat) {
  const v = VERB_BY_ID[verb];
  const ks = [...kindsOf(v?.gives), ...kindsOf(v?.takes?.[0])];
  return !ks.length || ks.some((k) => k === 'any' || fit(k, mat) > 0 || fit(mat, k) > 0);
}
/**
 * החומר הוא בדיוק סוג שהפועל עצמו מקבל (הקלט הראשי) או נותן — לפי האלפבית (`catalog/verbs.json`).
 * פעלי-התנועה מקבלים קודם מפרט (`record`) ורק אז את מה שמשתנה (צעד, זמן, גוף) — אצלם הקלט השני הוא החומר.
 */
export function ownKinds(verb) {
  const v = VERB_BY_ID[verb];
  if (!v) return [];
  const spec = v.takes?.length === 2 && v.takes[0] === 'record';
  return [...kindsOf(v.gives), ...kindsOf(v.takes?.[0]), ...(spec ? kindsOf(v.takes[1]) : [])];
}
function lawMat(verb, mat) {
  return ownKinds(verb).includes(mat);
}
const CAP_CORE = 60;
const CAP_LINK = 40;
const KEEP = 5;
const PLACES = 3;

/** שורשים עבריים גסים: עם ובלי תחילית, בלי אמות-קריאה, בלי סיומת ה/ת/ים/ות — "שוקעת" ו"השקיעה" ⇒ שקע. */
export function roughRoots(w) {
  const x0 = String(w).replace(/[^\u05d0-\u05ea]/g, '');
  const forms = [x0];
  const m = x0.match(/^(וה|שה|וב|ול|ומ|וש|ה|ו|ב|ל|מ|ש|כ)(.{3,})$/);
  if (m) forms.push(m[2]);
  const out = [];
  for (let x of forms) {
    x = x.replace(/(ים|ות|ית)$/, '').replace(/[הת]$/, '').replace(/[וי]/g, '');
    if (x.length >= 3 && !out.includes(x.slice(0, 3))) out.push(x.slice(0, 3));
  }
  return out;
}
const rootsOf = (t) => new Set(String(t).split(/[\s,·()⇒/-]+/).flatMap(roughRoots));
/** כמה שורשים משותפים בין התיאור של הצורך לשמות החלקים (שובר-שוויון: "שוקעת" ⇒ "שקיעה"). */
function overlap(behavior, steps) {
  const want = rootsOf(behavior);
  if (!want.size) return 0;
  const have = rootsOf(steps.map((s) => s.name).join(' '));
  let n = 0;
  for (const r of want) if (have.has(r)) n++;
  return n;
}

// השם והמזהה בלבד — כמו בדף (lab-data בלי תיאורים), כדי שהדף וה-cli ירכיבו אותו דבר
const textOf = (p) => (p.name + ' ' + p.id).toLowerCase();
const matchesKeys = (p, keys) => !keys?.length || keys.some((k) => textOf(p).includes(String(k).toLowerCase()));
const linked = (a, b) => accepts(b, a.gives);

/**
 * כל השרשראות המוכחות לצורך, טבעת אחרי טבעת (1 ⇒ 2 ⇒ 3).
 * חוק "בלי שרשראות-שטות": חלק-ליבה אחד בדיוק מחזיק את הפועל של הצורך (ומוכח לו בהרצה);
 * כל חלק אחר הוא מתאם-סוג טהור (`adapterRole`) שמוכח בהרצה לפועל-המתאם שלו.
 */
export function chainsFor(need, ix) {
  const all = (ix.byVerb.get(need.verb) || []).filter((p) => provenAs(p, need.verb) && matchesKeys(p, need.keys) && !(p.takes.length === 0 && p.gives === 'unknown'));
  // סדר-העדיפות (הכרעת-בעלים): חלק מוכח אחד > חלק פנימי > שילוב מוכח — כל קבוצה עוברת את כל הטבעות לפני הבאה
  for (const group of [all.filter((p) => !p.parent && !p.combo), all.filter((p) => p.parent && !p.combo), all.filter((p) => p.combo)]) {
    const got = ringsFor(need, ix, group.slice(0, CAP_CORE));
    if (got.length) return got;
  }
  return [];
}

function ringsFor(need, ix, cores) {
  const mat = need.material;
  const from = need.from || null;
  const glue = (p) => {
    const r = adapterRole(p);
    return r && r !== need.verb ? r : null;
  };
  // מסיים = מתאם שמקבל את הפלט כקלט הראשי שלו (byTake מכיל גם חלקים שהסוג הוא קלט משני אצלם)
  const finishers = (kind) => (matFitsVerb(need.verb, mat) ? (ix.byTake.get(kind) || []).filter((g) => accepts(g, kind) && glue(g)).slice(0, CAP_LINK) : []);
  const feeders = (into) => (from ? (ix.byTake.get(from) || []).filter((f) => accepts(f, from) && glue(f) && linked(f, into)).slice(0, CAP_LINK) : []);
  const startOk = (p) => !from || accepts(p, from);
  // "חומר" = על מה הפועל עובד (מילון-המטרות): החלק נותן אותו, או מקבל אותו כקלט הראשי
  // …או החומר שהקורא מדד; או — החומר הוא בדיוק סוג שהפועל עצמו מקבל/נותן (האלפבית), והחלק מוכח לפועל:
  // אז החוקים כבר מבטיחים שהוא עובד על החומר הזה ("הבקשה מביאה את העולם; החלק מביא רק את הפעולה")
  const byLaw = lawMat(need.verb, mat);
  const onMat = (p) => fit(p.gives, mat) > 0 || accepts(p, mat) || (!!p.material && fit(p.material, mat) > 0) || (byLaw && provenAs(p, need.verb));
  const chains = [];
  const push = (steps, ring, core) => {
    const ids = steps.map((s) => s.id);
    if (new Set(ids).size !== ids.length) return;
    const roles = steps.map((s, i) => (i === core ? need.verb : glue(s)));
    chains.push({ ring, verb: need.verb, overlap: overlap(need.behavior, steps), steps, roles, core, fit: Math.max(fit(steps[steps.length - 1].gives, mat), steps[0].takes.length ? fit(mat, steps[0].takes[0]) : 0) });
  };
  // כמו מנוע-הטבעות: מתרחבים לטבעת הבאה רק כשהפנימית ריקה
  // טבעת 1 — חלק בודד
  for (const c of cores) if (onMat(c) && startOk(c)) push([c], 1, 0);
  if (chains.length) return chains;
  // טבעת 2 — זוג: מתאם לפני הליבה, או מתאם אחריה
  for (const c of cores) {
    const ends = onMat(c);
    if (ends && !startOk(c)) for (const f of feeders(c)) push([f, c], 2, 1);
    if (!ends && startOk(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0 && linked(c, g)) push([c, g], 2, 0);
  }
  if (chains.length) return chains;
  // טבעת 3 — שלישייה
  for (const c of cores) {
    const ends = onMat(c);
    if (!ends && !startOk(c)) for (const f of feeders(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0) push([f, c, g], 3, 1);
    if (!ends && startOk(c))
      for (const g1 of finishers(c.gives)) if (fit(g1.gives, mat) === 0) for (const g2 of finishers(g1.gives)) if (fit(g2.gives, mat) > 0) push([c, g1, g2], 3, 0);
  }
  return chains;
}

const chainTier = (c) => c.steps.reduce((w, s, i) => (TIER_RANK[tierFor(s, c.roles[i])] > TIER_RANK[w] ? tierFor(s, c.roles[i]) : w), 'proven');

/** מדרג: מוכח > ניתן-להרצה > סטטי · פחות חלקים · עד כמה הפועל ודאי (מילה ראשונה > ביטוי > שם-פונקציה) · התאמה מדויקת · פרויקט חדש להרכבה · יותר פרויקטים · מזהה. */
export function rankChains(chains, used = new Set()) {
  const key = (c) => {
    const srcs = [...new Set(c.steps.map((s) => s.source))];
    const core = c.steps[Math.max(0, c.core)];
    return [TIER_RANK[chainTier(c)], c.steps.length, -c.overlap, core.strength?.[c.verb] ?? 3, 2 - c.fit, srcs.some((s) => !used.has(s)) ? 0 : 1, -srcs.length, c.steps.map((s) => s.id).join('>')];
  };
  const cmp = (a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] < kb[i] ? -1 : 1;
    return 0;
  };
  return [...chains].sort(cmp);
}

/* ═══════════════ ההרכבה ═══════════════ */

export const VERB_HE = (v) => VERB_BY_ID[v]?.he || (v === RECIPE_VERB.id ? RECIPE_VERB.he : String(v || '').startsWith('NEW:') ? 'פועל חדש: ' + v.slice(4) : v);

/** משפט עברי פשוט לשרשרת. */
export function chainSentence(steps) {
  const names = steps.map((s) => s.name);
  if (names.length === 1) return names[0] + '.';
  if (names.length === 2) return 'קודם ' + names[0] + ', ואז ' + names[1] + '.';
  return 'קודם ' + names[0] + ', ואז ' + names.slice(1, -1).join(', ואז ') + ', ובסוף ' + names[names.length - 1] + '.';
}

const PROOF_HE = { judge: 'השופט הריץ על קלטים מחוללים', reader: 'קורא-ההתנהגות הריץ בארגז-חול', example: 'נבדק על הדוגמה מקובץ-בדיקה', static: 'מהשם בלבד' };

/** איפה הפעולה גרה: "נמצא ב: <פרויקט> · <שם>" / "נמצא בתוך: <ההורה> · <קובץ>" / כל פרויקטי-המקור. */
function whereOf(p) {
  const origins = (p.origins || [{ source: projSrc(p.source), file: p.path || '' }]).map((o) => ({ source: projSrc(o.source), project: projHe(o.source), file: o.file }));
  const homes = p.homes.map((h) => h.source).filter((s, i, a) => a.indexOf(s) === i);
  for (const s of homes) if (PROJECTS[s] && !isCoreSrc(s) && !origins.some((o) => o.source === s)) origins.push({ source: s, project: PROJECTS[s]?.he || s, file: '' });
  return { name: p.name, file: p.path || '', origins, parent: p.parent ? { name: p.parent.name, file: p.parent.path } : null };
}
/** שורה קטנה מתחת לפעולה. */
export function whereLine(w) {
  if (w.parent) return 'נמצא בתוך: ' + w.parent.name + ' · ' + (w.parent.file || w.file);
  return 'נמצא ב: ' + [...new Set(w.origins.map((o) => o.project))].join(' · ') + ' · ' + w.name;
}
/** הפעולה עצמה, בלי עולם: שם הפועל בעברית + שורה אחת מה הוא עושה (`catalog/verbs.json`). */
export function actionOf(verb) {
  const v = VERB_BY_ID[verb];
  if (v) return { he: v.he, plain: v.plain || '' };
  if (verb === RECIPE_VERB.id) return { he: RECIPE_VERB.he, plain: RECIPE_VERB.plain };
  return { he: VERB_HE(verb), plain: '' };
}

function stepView(p, prev, flows, role) {
  const flow = prev ? flows[prev.id + '>' + p.id] || null : null;
  const pr = (role && p.proofs?.[role]) || {};
  const proof = pr.status === 'proven' ? 'proven' : pr.status === 'twin' ? 'twin' : pr.status === 'example' ? 'example' : 'static';
  return {
    id: p.id,
    name: p.name,
    source: p.source,
    project: projHe(p.source),
    homes: p.homes.map((h) => h.source).filter((s, i, a) => a.indexOf(s) === i),
    takes: p.takes,
    gives: p.gives,
    verbs: p.verbs,
    role,
    roleHe: VERB_HE(role),
    action: actionOf(role),
    where: whereOf(p),
    inner: !!p.parent,
    tier: tierFor(p, role),
    proof,
    by: pr.by || 'static',
    byHe: PROOF_HE[pr.by] || (pr.status === 'twin' ? 'תאום של חלק שהורץ' : PROOF_HE.static),
    cases: pr.cases || 0,
    laws: pr.laws || [],
    flow: flow ? { status: flow.status, cases: flow.cases } : null,
  };
}

const PROOF_PLACE = { proven: 'הורץ — סוג אחר', twin: 'תאום של חלק שהורץ', example: 'נבדק על דוגמה', static: 'מהשם בלבד' };
const leadMatches = (l, goal, need) =>
  (l.verb || l.material) && (!l.verb || bareVerb(l.verb) === bareVerb(need.verb) || bareVerb(l.verb) === bareVerb(need.asked)) && (!l.material || l.material === need.material) && (!l.word || l.word === goal.word);

function partRoots(ix, p) {
  if (!ix.roots) ix.roots = new Map();
  let r = ix.roots.get(p.id);
  if (!r) ix.roots.set(p.id, (r = rootsOf(p.name)));
  return r;
}

/**
 * איפה לחפור: המקומות הידועים (`leads.json`), ואז 3 המקומות הקרובים — לפי פועל, אחר-כך חומר, אחר-כך שם.
 * כולל מועמדים סטטיים/רופפים וחלקים פנימיים. אף אחד מהם לא "נחשב נמצא" — הם רמז, לא הוכחה.
 */
export function digPlaces(goal, need, ix, opts = {}) {
  const leads = (ix.leads || []).filter((l) => leadMatches(l, goal, need)).map((l) => ({ lead: true, project: PROJECTS[l.project]?.he || l.project, source: l.project, name: l.name, file: l.file, lines: l.lines || '', why: 'מקום ידוע — אומת ביד' }));
  if (opts.leadsOnly && leads.length) return leads;
  const want = rootsOf(need.behavior);
  const keys = need.keys?.length ? need.keys : null;
  const scored = [];
  for (const p of ix.parts) {
    if (!p.verbs.length || p.source === 'recipe') continue;
    const v = p.verbs.includes(need.verb) ? 0 : 1;
    const m = fit(p.gives, need.material) > 0 || accepts(p, need.material) ? 0 : 1;
    let o = 0;
    const have = partRoots(ix, p);
    for (const r of want) if (have.has(r)) o++;
    if (keys && matchesKeys(p, keys)) o++;
    if (v && m && !o) continue;
    scored.push({ p, k: [v, m, -o, TIER_RANK[tierFor(p, v ? p.primary : need.verb)], p.id] });
  }
  scored.sort((a, b) => {
    for (let i = 0; i < a.k.length; i++) if (a.k[i] !== b.k[i]) return a.k[i] < b.k[i] ? -1 : 1;
    return 0;
  });
  const near = scored.slice(0, PLACES).map(({ p, k }) => {
    const verb = k[0] ? p.primary : need.verb;
    const st = p.proofs?.[verb]?.status || 'static';
    return {
      id: p.id,
      project: projHe(p.source),
      source: p.source,
      name: p.name,
      file: p.path || '',
      action: actionOf(verb).he,
      proof: PROOF_PLACE[st] || PROOF_PLACE.static,
      why: [k[0] ? null : 'אותו פועל', k[1] ? null : 'אותו חומר', k[2] ? 'שם קרוב' : null].filter(Boolean).join(' · '),
      ...(p.parent ? { inside: p.parent.name } : {}),
    };
  });
  return [...leads, ...near];
}

/** בקשת-חפירה (ולמחולל — הצרכן האחרון): צורך שעוד לא הוכח בהרצה, עם המקומות לחפור. */
export function digRequest(goal, need, status, places) {
  return {
    goal: goal.id,
    word: goal.word,
    need: need.id,
    behavior: need.behavior,
    verb: need.verb,
    verbHe: need.verb.startsWith('NEW:') ? 'פועל חדש: ' + need.verb.slice(4) : VERB_HE(need.verb),
    isNewVerb: need.verb.startsWith('NEW:'),
    material: need.material,
    takes: need.from ? [need.from] : need.takes || (VERB_BY_ID[need.verb]?.takes || []).filter((t) => t !== 'any'),
    gives: need.material,
    detail: need.detail || null,
    example: need.example || { say: '«' + goal.word + '»: ' + need.behavior + (need.detail ? ' — ' + need.detail : '') },
    status,
    statusHe: STATUS_HE[status],
    places,
  };
}

/**
 * מרכיב מטרה: לכל צורך — השרשרת המוכחת הטובה + עד 4 חלופות, וסטטוס אחד מארבעה
 * (✅ מוכח בהרצה · ✅ חלק פנימי · ⛏️ בכרייה · 🔎 עוד לא נחפר); ואז "מה יצא" ובקשות-החפירה.
 * @returns {{goal, needs:[{need, status, chain|null, alternatives, ring, places?}], dig, projects, outcome, counts}}
 */
export function assemble(goal, ix) {
  const used = new Set();
  const needs = [];
  for (const need of goal.needs) {
    const ranked = rankChains(chainsFor(need, ix), used);
    if (!ranked.length) {
      const mining = MINING_VERBS.has(bareVerb(need.verb)) || need.verb.startsWith('NEW:');
      const status = mining ? 'mining' : 'dig';
      needs.push({ need, status, chain: null, alternatives: [], ring: 0, places: digPlaces(goal, need, ix, { leadsOnly: mining }) });
      continue;
    }
    const views = ranked.slice(0, KEEP).map((c) => chainView(c, ix));
    for (const s of views[0].steps) used.add(projSrc(s.source));
    const core = views[0].combo ? null : views[0].steps[ranked[0].core];
    needs.push({ need, status: views[0].combo ? 'combo' : core.inner ? 'inner' : 'proven', chain: views[0], alternatives: views.slice(1), ring: views[0].ring });
  }
  // זרימה בין צרכים צמודים באותה קבוצה: הפלט של הצורך הקודם נכנס לבא (למשל זריחה ⇒ הבא בתור ⇒ מזיז ⇒ מעגל)
  for (let i = 1; i < needs.length; i++) {
    const a = needs[i - 1];
    const b = needs[i];
    if (!a.chain || !b.chain || !b.need.group || a.need.group !== b.need.group) continue;
    const from = a.chain.steps[a.chain.steps.length - 1];
    const f = ix.flows[from.id + '>' + b.chain.steps[0].id];
    if (f) b.groupFlow = { from: from.name, status: f.status, cases: f.cases };
  }
  const dig = needs.filter((n) => !n.chain).map((n) => digRequest(goal, n.need, n.status, n.places));
  const projects = [...used].sort((a, b) => srcRank(a) - srcRank(b));
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, needs.filter((n) => n.status === s).length]));
  return { goal, needs, dig, projects, counts, outcome: outcomeText(goal, needs, projects) };
}

/** תצוגת שרשרת. שילוב מוכח נפרש לשני החלקים שלו — כל אחד עם הפעולה שלו ו"נמצא ב:" — ועם "עבר N/N חוקים של <פועל>". */
function chainView(c, ix) {
  const cp = c.steps.length === 1 && c.steps[0].combo ? c.steps[0] : null;
  if (cp) {
    const parts = cp.combo.steps.map((id) => ix.byId.get(id) || ix.parts.find((p) => p.homes.some((h) => h.id === id))).filter(Boolean);
    if (parts.length >= 2 && parts.length === cp.combo.steps.length) {
      const n = Number(String(cp.combo.holds).split('/')[0]) || 0;
      return {
        ring: Math.min(3, parts.length),
        tier: 'proven',
        sentence: chainSentence(parts),
        steps: parts.map((s, i) => stepView(s, parts[i - 1], ix.flows, cp.combo.roles?.[i] || s.primary)),
        combo: { verb: cp.combo.verb, verbHe: VERB_HE(cp.combo.verb), form: cp.combo.form, parts: parts.length, holds: cp.combo.holds, cases: n, laws: cp.combo.laws, line: (parts.length > 2 ? parts.length + ' חלקים · ' : '') + 'עבר ' + cp.combo.holds + ' חוקים של ' + VERB_HE(cp.combo.verb), ...(cp.combo.hint ? { hint: cp.combo.hint } : {}) },
      };
    }
  }
  return { ring: c.ring, tier: chainTier(c), sentence: chainSentence(c.steps), steps: c.steps.map((s, i) => stepView(s, c.steps[i - 1], ix.flows, c.roles[i])) };
}

/** "מה יצא" — פסקה אחת שמחברת את הצרכים לדבר עצמו. */
export function outcomeText(goal, needs, projects) {
  const found = needs.filter((n) => n.chain);
  const partsN = new Set(found.flatMap((n) => n.chain.steps.map((s) => s.id))).size;
  const proven = found.flatMap((n) => n.chain.steps).filter((s) => s.proof === 'proven').length;
  const groups = [];
  for (const n of found) {
    const g = n.need.group || n.need.behavior;
    let row = groups.find((x) => x.g === g);
    if (!row) groups.push((row = { g, b: [] }));
    if (n.need.group) row.b.push(n.need.behavior);
  }
  const body = groups.map((r) => (r.b.length ? r.g + ' (' + r.b.join(', ') + ')' : r.g)).join('; ');
  const proj = projects.map((s) => PROJECTS[s]?.he || s).join(', ');
  let t = '«' + goal.word + '» הורכבה מ-' + partsN + ' חלקים מ-' + projects.length + ' פרויקטים (' + proj + '): ' + body + '.';
  if (proven) t += ' ' + proven + ' צעדים הוכחו בהרצה על קלטים מחוללים.';
  const dig = needs.filter((n) => !n.chain);
  if (dig.length) t += ' עוד בחפירה: ' + dig.map((n) => n.need.behavior).join('; ') + '.';
  return t;
}

/* ═══════════════ המטרות ═══════════════ */

const PREFIX = /^[והבלמשכ]/;
export const normWord = (w) =>
  String(w || '')
    .trim()
    .replace(/[״"׳'.,!?]/g, '')
    .replace(/\s+/g, ' ');

/** מטרה מהמילון — רק התאמה מפורשת (מילה או כינוי). אין ניחוש-עולם: לא נמצא ⇒ null. */
export function findGoal(word, goals) {
  const w = normWord(word);
  if (!w) return null;
  const words = (g) => [g.word, ...(g.aliases || [])].map(normWord);
  return goals.find((g) => words(g).includes(w)) || goals.find((g) => PREFIX.test(w) && words(g).includes(w.slice(1))) || null;
}

/** מילה לא מוכרת ⇒ שאלה סגורה עם צ׳יפים (פועל + חומר). */
export function askChips(word) {
  return {
    ask: true,
    word: normWord(word),
    question: 'לא מכיר את «' + normWord(word) + '». מה היא צריכה לעשות? בחר פועל וחומר:',
    verbs: VERBS.map((v) => ({ id: v.id, he: v.he, plain: v.plain })),
    materials: KINDS.map((k) => ({ id: k.id, he: k.he })),
  };
}

/** מטרה מצ׳יפים שהמשתמש בחר. */
export function goalFromChips(word, picks) {
  const w = normWord(word);
  return {
    id: 'chips',
    word: w,
    title: '',
    needs: picks.map((p, i) => ({ id: 'n' + (i + 1), behavior: VERB_HE(p.verb) + ' · ' + kindHe(p.material), verb: p.verb, material: p.material })),
  };
}

/** מזהה ASCII יציב למילה (לשמות קבצים): FNV-1a. */
export function wordId(w) {
  let h = 0x811c9dc5;
  for (const ch of String(w)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return 'w' + h.toString(16).padStart(8, '0');
}

/**
 * מנרמל מטרה מכל צורה סבירה: מילון-המטרות ({word, emoji, does, needs}) או ה-fixtures ({id, word, title, needs}).
 * הפועל עובר דרך ALIAS לאלפבית; `NEW:x` ⇒ x כשהאלפבית כבר מכיר את x, ואחרת נשאר — ⛏️ בכרייה.
 */
export function normGoal(g) {
  const needs = (g.needs || []).map((n, j) => ({
    ...n,
    id: n.id || 'n' + (j + 1),
    behavior: n.behavior || n.he || n.text || n.verb,
    asked: n.verb,
    verb: resolveVerb(n.verb),
    material: n.material || n.kind,
  }));
  return { ...g, id: g.id || wordId(g.word), word: g.word, title: g.title || g.does || '', needs: needs.filter((n) => n.verb && n.material) };
}

/** בורר-מילה דטרמיניסטי לפי זרע (ה-🎲 בדף משתמש בזרע מהדפדפן; כאן — לבדיקות ול-CLI). */
export function pickWord(goals, seed) {
  let a = seed >>> 0 || 1;
  a = Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) >>> 0;
  a = Math.imul(a ^ (a >>> 12), 0x297a2d39) >>> 0;
  return goals[((a ^ (a >>> 15)) >>> 0) % goals.length];
}

/* ═══════════════ פרטיות ═══════════════ */

/** אין בהרכבה טלפון/מייל/ת״ז/קישור/טוקן. מחזיר את מה שדלף, או null. */
export function piiLeak(obj) {
  const s = JSON.stringify(obj);
  // טוקן = רצף ארוך של אותיות-וספרות מעורבבות, עם 4+ ספרות (לא מזהה-קובץ עם מקפים; לא שם-פונקציה כמו test200PercentCapabilities)
  const pats = [/[\w.+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|il|io|co|edu|gov|me|info|app|dev)\b/i, /(?:\+?972|\b0)5\d[- ]?\d{3}[- ]?\d{4}/, /\b\d{9}\b/, /https?:\/\//, /\b(?=(?:[A-Za-z]*\d){4})(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{24,}\b/];
  for (const p of pats) {
    const m = s.match(p);
    if (m) return m[0];
  }
  return null;
}
