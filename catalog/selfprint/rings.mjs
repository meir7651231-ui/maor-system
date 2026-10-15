/**
 * 🔁 RINGS-PORT (15.10.2026) — מה שלקחנו ממעבדת-הטבעות (‎-ai-chat-server › lab-rings/lab13‎) אל מנוע-השרטוטים-העצמי.
 * **בלי המסגרות** של lab13 (filter/loop/pick-at/wide/keysort/if-else/statscan… — "skeleton we wrote", נכתבו ע״י סוכנים):
 * כל שרטוט כאן עדיין נכרה מהקוד או נגזר מהצלחה של המכונה. לקחנו רק סידורים, תקציבים, בדיקות-מדוגמאות ו"פתרון ⇒ כלי":
 *
 *   ladder-order.mjs ⇒ `priorOf`/`scoreOf`/`capAt` — עדיפות = הצלחות-המכונה מהשלד ÷ גודל; תקרה קטנה יותר בעומק.
 *   stagestats.mjs   ⇒ `learnedQuota` — מי שלא הצליח אף פעם (≥15 ניסיונות) ⇒ רבע; מי שהצליח ≥5 ⇒ פי 2.
 *   scanfold-staged  ⇒ שלבים (ב-selfprint.mjs): חצי מכל סבב קודם על הספרייה הישנה (v1 + שרטוטים-מהצלחה) — הרצפה.
 *   statscan/pairframes ("סטטיסטיקה אחת נכנסת לגוף-לכל-פריט") ⇒ `tieInputs`/`bindInput` — **טרנספורמציות על שלדים
 *     שהכורה מצא** (לא שלדים חדשים): קלט שני ⇐ אותו קלט ראשון, או ⇐ חור-חדש שמחושב פעם אחת מהקלט שהלולאה עוברת עליו.
 *   numloop/keysort/hiddenfilter (בדיקות-מדוגמאות) ⇒ `evidence` — על דוגמאות פעלי-הייחוס של המנוע עצמו (לא מטרות-מדידה):
 *     מבחן-נסיגה ⇒ לולאת-צבירה/until · הסקת-מפתח מקדימויות ⇒ "בחר את הטוב" · טבלת-אמת שמור/נזרק ⇒ סינון.
 * טהור ודטרמיניסטי (בלי fs/שעון).
 */

/* ═══════════════ ladder-order + stagestats ═══════════════ */

/** הצלחות-המכונה מהשלד (היסטוריה קפואה) ⇒ (הצלחות+1)/(נבנו+2). שלד שלא נוסה ⇒ ½ (ניטרלי — כמו "פחות מ-5 הצלחות ⇒ ברירת-מחדל"). */
export function priorOf(hist, codeId) {
  const e = codeId && hist?.code?.[codeId];
  return e ? (e.successes + 1) / (e.built + 2) : 0.5;
}
/** ציון-תועלת: עדיפות ÷ גודל (lab: ‎300/(300+אורך)‎ — כאן 4/(4+חורים)). */
export const scoreOf = (prior, holes) => (prior * 4) / (4 + holes);
/** תקציב לפי ההיסטוריה (stagestats): נוסה ≥15 ולא הצליח ⇒ רבע (לפחות 2); הצליח ≥5 ⇒ פי 2; אחרת — הבסיס. */
export function learnedQuota(hist, codeId, base) {
  const e = codeId && hist?.code?.[codeId];
  if (!e) return base;
  if (e.successes === 0 && e.built >= 15) return Math.max(2, Math.ceil(base / 4));
  if (e.successes >= 5) return base * 2;
  return base;
}
/** תקרה לכל אתר-מילוי — קטנה יותר בעומק (lab: CAPS — זוגות/שלשות מקבלים פחות). */
export const capAt = (cap, depth) => Math.max(6, Math.floor(cap / 2 ** Math.max(0, (depth || 1) - 1)));

/* ═══════════════ "חשב פעם אחת, השתמש לכל פריט" — על שלדים שנכרו ═══════════════ */

/** מחליף כל חוט שמתחיל ב-‎$from‎ (‎$i1‎ / ‎$i1.x‎) — רק ערכים, לא מפתחות. */
function rewire(v, from, to) {
  if (typeof v === 'string') return v === '$' + from ? to : v.startsWith('$' + from + '.') ? to + v.slice(from.length + 1) : v;
  if (Array.isArray(v)) return v.map((x) => rewire(x, from, to));
  if (v && typeof v === 'object') {
    if (v.loop) return { ...v, loop: Object.fromEntries(Object.entries(v.loop).map(([k, x]) => [k, ['item', 'state', 'index'].includes(k) ? x : rewire(x, from, to)])) };
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'id' || k === 'part' ? x : rewire(x, from, to)]));
  }
  return v;
}
const loopsOf = (nodes, out = []) => { for (const n of nodes) if (n.loop) { out.push(n.loop); loopsOf(n.loop.nodes, out); } return out; };
const mentions = (v, name) => JSON.stringify(v).includes('"$' + name + '"') || JSON.stringify(v).includes('"$' + name + '.');
const localNames = (g) => loopsOf(g.nodes).flatMap((L) => [L.item, L.state, L.index].filter(Boolean));
const renameIn = (g, from, to) => ({ ...g, nodes: rewire(g.nodes, from, '$' + to), out: rewire(g.out, from, '$' + to) });

/** שני קלטים ⇒ אחד: הקלט השני הוא אותו קלט ראשון (‎$i1 ⇐ $i0‎). null אם לא שני קלטים / שם מקומי מתנגש. */
export function tieInputs(g) {
  if (g.inputs.length !== 2 || localNames(g).some((n) => g.inputs.includes(n))) return null;
  const t = renameIn(g, g.inputs[1], g.inputs[0]);
  return { inputs: [g.inputs[0]], nodes: t.nodes, out: t.out };
}
/**
 * שני קלטים ⇒ אחד: קלט P נקשר לחור-חדש ‎□v(L)‎ שמחושב **פעם אחת** לפני הלולאה, כש-L הוא הקלט שלולאה עוברת עליו ו-P
 * משמש **בתוך** הלולאה (גוף-לכל-פריט). זה החיווט של "סטייה מהממוצע" — בלי לכתוב שלד: השלד הוא של הכורה.
 * מחזיר [{graph, newVar}] (0–2 — לפי איזה קלט עוברים עליו).
 */
export function bindInput(g, newVar) {
  if (g.inputs.length !== 2 || localNames(g).some((n) => g.inputs.includes(n))) return [];
  const out = [];
  for (const [L, P] of [[g.inputs[0], g.inputs[1]], [g.inputs[1], g.inputs[0]]]) {
    const per = loopsOf(g.nodes).some((lp) => lp.over === '$' + L && (mentions(lp.nodes, P) || mentions(lp.next, P) || (lp.emit !== undefined && mentions(lp.emit, P))));
    if (!per) continue;
    const id = 'hs'; if (JSON.stringify(g.nodes).includes('"id":"hs"')) continue;
    const t = renameIn(g, P, '__P');
    const nodes = rewire(t.nodes, '__P', '@hs'); const o = rewire(t.out, '__P', '@hs');
    const g2 = { inputs: [L], nodes: [{ id, part: '□' + newVar, args: ['$' + L] }, ...nodes], out: o };
    const r = L === 'i0' ? g2 : renameIn(g2, L, 'i0');
    out.push({ graph: { inputs: ['i0'], nodes: r.nodes, out: r.out }, newVar });
  }
  return out;
}

/* ═══════════════ בדיקות-מדוגמאות (על פעלי-הייחוס של המנוע) ═══════════════ */

function lcg(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const key = (v) => JSON.stringify(v);
/** רשימות-בדיקה קבועות (זרע קבוע), שלמים קטנים — כמו סט-הבדיקה של lab (הרבה התנגשויות ⇒ מבחן חד). */
export function evidenceLists(n = 400, seed = 0xe71d) {
  const r = lcg(seed); const out = [];
  for (let k = 0; k < n; k++) out.push(Array.from({ length: 1 + Math.floor(r() * 6) }, () => Math.floor(r() * 9) - 2));
  return out;
}
/**
 * numloop.mjs ("T(b+1)=F(T(b),a)"): לפונקציה רשימה⇒מספר — האם f(xs ++ [a]) נקבע לגמרי ע״י (f(xs), a)? אם כן (בלי סתירה,
 * עם מספיק התנגשויות) ⇒ צורה של צבירה (לולאה שמצבה עובר הלאה).
 */
export function regressionTest(f, lists) {
  const m = new Map(); let hits = 0;
  for (const xs of lists) {
    if (!xs.length) continue;
    const a = xs[xs.length - 1]; const pre = f(xs.slice(0, -1)); const now = f(xs);
    if (pre === null || now === null || pre === undefined || now === undefined) continue;
    const k = key(pre) + '|' + a;
    if (m.has(k)) { if (m.get(k) !== key(now)) return { ok: false, why: 'סתירה' }; hits++; } else m.set(k, key(now));
  }
  return { ok: hits >= 20, collisions: hits };
}
/** keysort.mjs: רשימה⇒רשימה שהפלט שלה סידור-מחדש של הקלט — האם "מי לפני מי" מוסבר במפתח אחד על הערכים (בלי מעגל)? */
export function keyOrderTest(f, lists) {
  const before = new Set(); let perms = 0;
  for (const xs of lists) {
    const ys = f(xs); if (!Array.isArray(ys)) continue;
    if (ys.length !== xs.length || key([...ys].sort()) !== key([...xs].sort())) return { ok: false, why: 'לא סידור-מחדש' };
    perms++;
    for (let i = 0; i < ys.length; i++) for (let j = i + 1; j < ys.length; j++) if (ys[i] !== ys[j]) before.add(key(ys[i]) + '<' + key(ys[j]));
  }
  for (const p of before) { const [a, b] = p.split('<'); if (before.has(b + '<' + a)) return { ok: false, why: 'מעגל' }; }
  return { ok: perms >= 20 && before.size > 0, pairs: before.size };
}
/**
 * hiddenfilter/brain-all (טבלת-אמת): רשימה⇒רשימה שהפלט שלה תת-רשימה בסדר המקורי — מכל דוגמה: מה נשמר ומה נזרק.
 * מחזיר את השורות (x, נשמר?, הרשימה) — כדי לבנות תנאי מחלקים (selfprint.mjs › filterCondition).
 */
export function truthTable(f, lists) {
  const rows = []; let subs = 0;
  for (const xs of lists) {
    const ys = f(xs); if (!Array.isArray(ys)) continue;
    let j = 0; const kept = [];
    for (const x of xs) { if (j < ys.length && key(ys[j]) === key(x)) { kept.push(true); j++; } else kept.push(false); }
    if (j !== ys.length) return { ok: false, why: 'לא תת-רשימה' };
    if (ys.length === xs.length) continue;
    subs++;
    xs.forEach((x, i) => rows.push({ x, keep: kept[i], xs }));
  }
  return { ok: subs >= 10, rows };
}
/** תנאי מחלקים: c(x, S(xs)) — משווה-בסיס c וסטטיסטיקה S — שמסביר את כל שורות טבלת-האמת. null אם אין. */
export function filterCondition(rows, cmps, stats) {
  for (const S of stats) for (const c of cmps) {
    let ok = true;
    for (const r of rows) { const s = S.f(r.xs); if (s === null || s === undefined) { ok = false; break; } if ((c.f(r.x, s) !== 0) !== r.keep) { ok = false; break; } }
    if (ok) return { cmp: c.id, stat: S.id };
  }
  return null;
}
/** סימני-מבנה בשרטוט (מהגרף בלבד): צבירה (מצב עובר הלאה, הפלט = המצב) · until · בחירה (choose בתוך לולאה) · סינון ($cat). */
export function shapeMarks(g) {
  const s = JSON.stringify(g); const L = loopsOf(g.nodes);
  return {
    fold: L.some((lp) => mentions(lp.next, lp.state) || mentions(lp.nodes, lp.state)) && /"@\w+\.state/.test(s),
    until: s.includes('"until":"stable"'),
    best: L.some((lp) => lp.nodes.some((n) => n.part === '⟨choose⟩')) && L.some((lp) => typeof lp.init === 'object' && lp.init !== null && !Array.isArray(lp.init)),
    filter: s.includes('"$cat"'),
  };
}
