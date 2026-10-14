/**
 * 🧲 המצרף · הליבה (COMBINER, 14.10.2026).
 *
 * "מכונה שבונה כל דבר משילוב חלקים קטנים — לא רק אורביט אלא כל מה שבנינו."
 * מטרה = רשימת צרכים {behavior, verb, material}. לכל צורך מחפשים חלקים שהפועל שלהם מתאים והסוגים שלהם מתאימים,
 * בטבעות כמו מנוע-הטבעות של הבעלים: טבעת 1 = חלק בודד · טבעת 2 = זוג · טבעת 3 = שלישייה, כשהפלט של אחד הוא הקלט של הבא.
 * מדרגים: מוכח (חוקים רצו) > ניתן-להרצה > סטטי · פחות חלקים · ערבוב פרויקטים. צורך בלי חלק ⇒ "חסר" ⇒ בקשת-בנייה למחולל (Waze).
 *
 * טהור ודטרמיניסטי: בלי fs/רשת/שעון/אקראי. אותו קלט ⇒ אותה הרכבה, ביט אחר ביט. רץ ב-node (cli) ובדפדפן (lab.html).
 */
import { VERBS, VERB_BY_ID, RECIPE_VERB, EXTRA_IDS, canonVerb, staticVerbsScored } from './verbs.mjs';
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
};
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
    out.push({
      id: best.p.id,
      source: best.p.source,
      homes: rated.map((r) => ({ source: r.p.source, id: r.p.id })),
      name: best.p.name,
      does: String(best.p.does || '').slice(0, 160),
      what: best.p.what,
      lang: best.p.lang,
      pure: !!best.p.pure,
      takes: best.p.takes.map((t) => t.kind),
      gives: best.p.gives.kind,
      verbs,
      strength,
      labeledBy: best.labeledBy,
      tier: verbs.length ? bestTier(proofs) : tierOfStatus('static', best.p),
      proofs: slimProofs,
    });
  }
  for (const r of opts.recipes || []) out.push(recipePart(r, out));
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return indexOf(out, opts.proofs?.flows || {});
}

/** דרגת החלק בתפקיד מסוים (פועל); בלי פועל — הדרגה הטובה שלו. */
export const tierFor = (p, verb) => p.proofs?.[verb]?.tier || p.tier;

/** אינדקס מוכן לחיפוש (גם מתוך lab-data.json שכבר נבנה — lab.html). */
export function indexOf(parts, flows = {}) {
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
  return { parts, byId: new Map(parts.map((p) => [p.id, p])), byVerb, byTake, flows };
}

/* ═══════════════ מתכונים — המדף ═══════════════ */

/** מתכון שמור ⇒ חלק חדש (לבנה). הפלט = רשומה מסוג המתכון; הפועל = "מתכון שמור" (הפעלים שבתוכו — ב-inner). */
export function recipePart(r, known = []) {
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
    proofs: { [RECIPE_VERB.id]: { status: 'static', by: 'recipe', tier } },
    recipe: { id: r.id, word: r.word, parts: steps.length, projects: [...new Set(steps.map((id) => id.split(':')[0]))].sort() },
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

const FINISH_VERBS = new Set(['convert', 'format', 'round', 'clamp', 'sort', 'filter', 'count', 'sum', 'average', 'extreme', 'dedupe', 'reverse', 'tier', 'validate', 'group', 'tally', 'map', 'normalize', 'join']);
/** התפקיד של חלק שאינו הליבה = הפועל הכי מוכח שלו. */
const roleOf = (p) => [...p.verbs].sort((a, b) => TIER_RANK[tierFor(p, a)] - TIER_RANK[tierFor(p, b)])[0] || null;
const CAP_CORE = 60;
const CAP_LINK = 40;
const KEEP = 5;

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

/** כל השרשראות האפשריות לצורך, טבעת אחרי טבעת (1 ⇒ 2 ⇒ 3), אחרי גיזום מה שלא מתאים בסוגים. */
export function chainsFor(need, ix) {
  const mat = need.material;
  const from = need.from || null;
  const cores = (ix.byVerb.get(need.verb) || []).filter((p) => matchesKeys(p, need.keys) && !(p.takes.length === 0 && p.gives === 'unknown')).slice(0, CAP_CORE);
  // מסיים = מקבל את הפלט כקלט הראשי שלו (byTake מכיל גם חלקים שהסוג הוא קלט משני אצלם)
  const finishers = (kind) => (ix.byTake.get(kind) || []).filter((g) => accepts(g, kind) && g.verbs.some((v) => FINISH_VERBS.has(v))).slice(0, CAP_LINK);
  const feeders = (into) => (from ? (ix.byTake.get(from) || []).filter((f) => f.verbs.length && linked(f, into)).slice(0, CAP_LINK) : []);
  const startOk = (p) => !from || accepts(p, from);
  // "חומר" = על מה הפועל עובד (מילון-המטרות): החלק נותן אותו, או מקבל אותו כקלט הראשי
  const onMat = (p) => fit(p.gives, mat) > 0 || accepts(p, mat);
  const chains = [];
  const push = (steps, ring) => {
    const ids = steps.map((s) => s.id);
    if (new Set(ids).size !== ids.length) return;
    const core = steps.findIndex((s) => s.verbs.includes(need.verb) && matchesKeys(s, need.keys));
    const roles = steps.map((s, i) => (i === core ? need.verb : roleOf(s)));
    chains.push({ ring, verb: need.verb, overlap: overlap(need.behavior, steps), steps, roles, core, fit: Math.max(fit(steps[steps.length - 1].gives, mat), steps[0].takes.length ? fit(mat, steps[0].takes[0]) : 0) });
  };
  // כמו מנוע-הטבעות: מתרחבים לטבעת הבאה רק כשהפנימית ריקה
  // טבעת 1 — חלק בודד
  for (const c of cores) if (onMat(c) && startOk(c)) push([c], 1);
  if (chains.length) return chains;
  // טבעת 2 — זוג: מזין לפני הליבה, או מסיים אחריה
  for (const c of cores) {
    const ends = onMat(c);
    if (ends && !startOk(c)) for (const f of feeders(c)) push([f, c], 2);
    if (!ends && startOk(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0 && linked(c, g)) push([c, g], 2);
  }
  if (chains.length) return chains;
  // טבעת 3 — שלישייה
  for (const c of cores) {
    const ends = onMat(c);
    if (!ends && !startOk(c)) for (const f of feeders(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0) push([f, c, g], 3);
    if (!ends && startOk(c))
      for (const g1 of finishers(c.gives)) if (fit(g1.gives, mat) === 0) for (const g2 of finishers(g1.gives)) if (fit(g2.gives, mat) > 0) push([c, g1, g2], 3);
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

function stepView(p, prev, flows, role) {
  const flow = prev ? flows[prev.id + '>' + p.id] || null : null;
  const pr = (role && p.proofs?.[role]) || {};
  const proof = pr.status === 'proven' ? 'proven' : pr.status === 'twin' ? 'twin' : pr.status === 'example' ? 'example' : 'static';
  return {
    id: p.id,
    name: p.name,
    source: p.source,
    project: PROJECTS[p.source]?.he || p.source,
    homes: p.homes.map((h) => h.source).filter((s, i, a) => a.indexOf(s) === i),
    takes: p.takes,
    gives: p.gives,
    verbs: p.verbs,
    role,
    roleHe: VERB_HE(role),
    tier: tierFor(p, role),
    proof,
    by: pr.by || 'static',
    byHe: PROOF_HE[pr.by] || (pr.status === 'twin' ? 'תאום של חלק שהורץ' : PROOF_HE.static),
    cases: pr.cases || 0,
    laws: pr.laws || [],
    flow: flow ? { status: flow.status, cases: flow.cases } : null,
  };
}

/** בקשת-בנייה למחולל: צורך שאין לו חלק. */
export function buildRequest(goal, need) {
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
  };
}

/**
 * מרכיב מטרה: לכל צורך — השרשרת הטובה + עד 4 חלופות; ואז "מה יצא" ורשימת החסרים.
 * @returns {{goal, needs:[{need, chain|null, alternatives, ring}], missing, projects, outcome}}
 */
export function assemble(goal, ix) {
  const used = new Set();
  const needs = [];
  for (const need of goal.needs) {
    const ranked = rankChains(chainsFor(need, ix), used);
    if (!ranked.length) {
      needs.push({ need, chain: null, alternatives: [], ring: 0 });
      continue;
    }
    const views = ranked.slice(0, KEEP).map((c) => ({
      ring: c.ring,
      tier: chainTier(c),
      sentence: chainSentence(c.steps),
      steps: c.steps.map((s, i) => stepView(s, c.steps[i - 1], ix.flows, c.roles[i])),
    }));
    for (const s of ranked[0].steps) used.add(s.source);
    needs.push({ need, chain: views[0], alternatives: views.slice(1), ring: views[0].ring });
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
  const missing = needs.filter((n) => !n.chain).map((n) => buildRequest(goal, n.need));
  const projects = [...used].sort((a, b) => srcRank(a) - srcRank(b));
  return { goal, needs, missing, projects, outcome: outcomeText(goal, needs, projects) };
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
  const miss = needs.filter((n) => !n.chain);
  if (miss.length) t += ' עוד חסר: ' + miss.map((n) => n.need.behavior).join('; ') + ' — נשלח לבנייה.';
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
 * הפועל עובר דרך ALIAS לאלפבית; `NEW:x` נשאר כמו שהוא — אין לו חלקים ⇒ "חסר" ⇒ בקשת-בנייה.
 */
export function normGoal(g) {
  const needs = (g.needs || []).map((n, j) => ({
    ...n,
    id: n.id || 'n' + (j + 1),
    behavior: n.behavior || n.he || n.text || n.verb,
    asked: n.verb,
    verb: canonVerb(n.verb),
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
  // טוקן = רצף ארוך של אותיות-וספרות מעורבבות (לא מזהה-קובץ עם מקפים)
  const pats = [/[\w.+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|il|io|co|edu|gov|me|info|app|dev)\b/i, /(?:\+?972|\b0)5\d[- ]?\d{3}[- ]?\d{4}/, /\b\d{9}\b/, /https?:\/\//, /\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{24,}\b/];
  for (const p of pats) {
    const m = s.match(p);
    if (m) return m[0];
  }
  return null;
}
