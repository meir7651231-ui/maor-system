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
import { VERBS, VERB_BY_ID, RECIPE_VERB, staticVerbsScored } from './verbs.mjs';
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

/**
 * בונה את האינדקס מכל החלקים: תיוג-פעלים, איחוד כפולים בין פרויקטים (חלק אחד, כמה בתים), דרגת-הוכחה.
 * @param parts   כל החלקים מכל `catalog/sources/*.json`
 * @param opts.proofs   `proofs.json` מהשופט ({parts:{id:{status,…}}, flows:{"a>b":…}})
 * @param opts.behavior Map id ⇒ verbs מקורא-ההתנהגות (גובר על הסטטי)
 * @param opts.recipes  מתכונים שמורים (`catalog/recipes/*.json`) — נכנסים כחלקים חדשים
 */
export function buildIndex(parts, opts = {}) {
  const proofs = opts.proofs?.parts || {};
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
    const rated = homes.map((p) => {
      const bverbs = behavior?.get(p.id);
      const labeledBy = bverbs ? 'behavior' : 'static';
      const scored = bverbs ? bverbs.filter((v) => VERB_BY_ID[v]).map((id) => ({ id, s: 0 })) : staticVerbsScored(p);
      const strength = Object.fromEntries(scored.map((v) => [v.id, v.s]));
      let verbs = scored.map((v) => v.id);
      const proof = proofs[p.id] || null;
      const exampleChecks = {};
      verbs = verbs.filter((v) => {
        const r = exampleLaw(v, p);
        if (r) exampleChecks[v] = r.ok;
        return !r || r.ok; // דוגמה שסותרת את החוק ⇒ התווית שגויה
      });
      const exampleOk = Object.values(exampleChecks).some(Boolean);
      const tier = proof?.status === 'proven' ? 'proven' : exampleOk || (p.pure && (p.lang === 'ts' || p.lang === 'js')) || p.source === 'rings' ? 'runnable' : 'static';
      return { p, verbs, strength, labeledBy, tier, proof, exampleOk };
    });
    rated.sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || srcRank(a.p.source) - srcRank(b.p.source) || (a.p.id < b.p.id ? -1 : 1));
    const best = rated[0];
    const strength = {};
    for (const s of rated) for (const v of s.verbs) strength[v] = Math.min(strength[v] ?? 9, s.strength[v]);
    const verbs = [...new Set(rated.flatMap((s) => s.verbs))].sort((a, b) => VERBS.findIndex((v) => v.id === a) - VERBS.findIndex((v) => v.id === b));
    out.push({
      id: best.p.id,
      source: best.p.source,
      homes: rated.map((s) => ({ source: s.p.source, id: s.p.id })),
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
      tier: best.tier,
      proof: best.proof ? { status: best.proof.status, cases: best.proof.cases, checks: best.proof.checks, laws: best.proof.laws } : best.exampleOk ? { status: 'example' } : null,
    });
  }
  for (const r of opts.recipes || []) out.push(recipePart(r, out));
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return indexOf(out, opts.proofs?.flows || {});
}

/** אינדקס מוכן לחיפוש (גם מתוך parts.json שכבר נבנה — lab.html). */
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
  const order = (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || (a.takes.length ? 0 : 1) - (b.takes.length ? 0 : 1) || a.takes.length - b.takes.length || srcRank(a.source) - srcRank(b.source) || (a.id < b.id ? -1 : 1);
  for (const xs of byVerb.values()) xs.sort(order);
  for (const xs of byTake.values()) xs.sort(order);
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
    proof: null,
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

const FINISH_VERBS = new Set(['convert', 'format', 'round', 'clamp', 'sort', 'filter', 'count', 'sum', 'minmax', 'dedupe', 'reverse', 'rank-tiers', 'gate', 'group']);
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
  const finishers = (kind) => (ix.byTake.get(kind) || []).filter((g) => g.verbs.some((v) => FINISH_VERBS.has(v))).slice(0, CAP_LINK);
  const feeders = (into) => (from ? (ix.byTake.get(from) || []).filter((f) => f.verbs.length && linked(f, into)).slice(0, CAP_LINK) : []);
  const startOk = (p) => !from || accepts(p, from);
  const chains = [];
  const push = (steps, ring) => {
    const ids = steps.map((s) => s.id);
    if (new Set(ids).size !== ids.length) return;
    chains.push({ ring, verb: need.verb, overlap: overlap(need.behavior, steps), steps, core: steps.findIndex((s) => s.verbs.includes(need.verb) && matchesKeys(s, need.keys)), fit: fit(steps[steps.length - 1].gives, mat) });
  };
  for (const c of cores) {
    const ends = fit(c.gives, mat) > 0;
    // טבעת 1
    if (ends && startOk(c)) push([c], 1);
    // טבעת 2
    if (ends && !startOk(c)) for (const f of feeders(c)) push([f, c], 2);
    if (!ends && startOk(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0 && linked(c, g)) push([c, g], 2);
    // טבעת 3
    if (!ends && !startOk(c)) for (const f of feeders(c)) for (const g of finishers(c.gives)) if (fit(g.gives, mat) > 0) push([f, c, g], 3);
    if (!ends && startOk(c))
      for (const g1 of finishers(c.gives)) if (fit(g1.gives, mat) === 0) for (const g2 of finishers(g1.gives)) if (fit(g2.gives, mat) > 0) push([c, g1, g2], 3);
  }
  return chains;
}

const chainTier = (steps) => steps.reduce((w, s) => (TIER_RANK[s.tier] > TIER_RANK[w] ? s.tier : w), 'proven');

/** מדרג: מוכח > ניתן-להרצה > סטטי · פחות חלקים · עד כמה הפועל ודאי (מילה ראשונה > ביטוי > שם-פונקציה) · התאמה מדויקת · פרויקט חדש להרכבה · יותר פרויקטים · מזהה. */
export function rankChains(chains, used = new Set()) {
  const key = (c) => {
    const srcs = [...new Set(c.steps.map((s) => s.source))];
    const core = c.steps[Math.max(0, c.core)];
    return [TIER_RANK[chainTier(c.steps)], c.steps.length, -c.overlap, core.strength?.[c.verb] ?? 3, 2 - c.fit, srcs.some((s) => !used.has(s)) ? 0 : 1, -srcs.length, c.steps.map((s) => s.id).join('>')];
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

const VERB_HE = (v) => VERB_BY_ID[v]?.he || (v === RECIPE_VERB.id ? RECIPE_VERB.he : v);

/** משפט עברי פשוט לשרשרת. */
export function chainSentence(steps) {
  const names = steps.map((s) => s.name);
  if (names.length === 1) return names[0] + '.';
  if (names.length === 2) return 'קודם ' + names[0] + ', ואז ' + names[1] + '.';
  return 'קודם ' + names[0] + ', ואז ' + names.slice(1, -1).join(', ואז ') + ', ובסוף ' + names[names.length - 1] + '.';
}

function stepView(p, prev, flows) {
  const flow = prev ? flows[prev.id + '>' + p.id] || null : null;
  const proof = p.proof?.status === 'proven' ? 'proven' : p.proof?.status === 'example' ? 'example' : 'static';
  return {
    id: p.id,
    name: p.name,
    source: p.source,
    project: PROJECTS[p.source]?.he || p.source,
    homes: p.homes.map((h) => h.source).filter((s, i, a) => a.indexOf(s) === i),
    takes: p.takes,
    gives: p.gives,
    verbs: p.verbs,
    tier: p.tier,
    proof,
    cases: p.proof?.cases || 0,
    laws: p.proof?.laws || [],
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
    verbHe: VERB_HE(need.verb),
    material: need.material,
    takes: need.from ? [need.from] : need.takes || [],
    gives: need.material,
    detail: need.detail || null,
    example: need.example || null,
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
      tier: chainTier(c.steps),
      sentence: chainSentence(c.steps),
      steps: c.steps.map((s, i) => stepView(s, c.steps[i - 1], ix.flows)),
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
    needs: picks.map((p, i) => ({ id: 'n' + (i + 1), behavior: VERB_BY_ID[p.verb]?.plain + ' (' + kindHe(p.material) + ')', verb: p.verb, material: p.material })),
  };
}

/** מנרמל מטרה מכל צורה סבירה (מילון-המטרות נכתב במקביל). */
export function normGoal(g, i = 0) {
  const needs = (g.needs || []).map((n, j) => ({
    ...n,
    id: n.id || 'n' + (j + 1),
    behavior: n.behavior || n.he || n.text || n.verb,
    verb: n.verb,
    material: n.material || n.kind,
  }));
  return { ...g, id: g.id || 'g' + (i + 1), word: g.word, title: g.title || '', needs: needs.filter((n) => n.verb && n.material) };
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
  const pats = [/[\w.+-]+@[\w-]+\.[\w.]+/, /(?:\+?972|0)5\d[- ]?\d{3}[- ]?\d{4}/, /\b\d{9}\b/, /https?:\/\//, /\b[A-Za-z0-9_-]{32,}\b/];
  for (const p of pats) {
    const m = s.match(p);
    if (m) return m[0];
  }
  return null;
}
