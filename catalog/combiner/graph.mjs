/**
 * 🕸️ צורת `graph` של מכונת-השילוב (MACHINE-V2, 14.10.2026) — כמה חלקים מוכחים, מחוברים לפי מתכון.
 *
 * `chain` מעביר פלט של חלק אחד לקלט הראשון של הבא. יש פעולות שצריכות **אותו קלט בכמה מקומות** (קו-הרוחב נכנס גם לזמני-היום
 * וגם לסיבוב) — לכן המתכון (catalog/combiner/verb-recipes.json) מתאר צמתים: לכל צומת חלק מוכח אחד בשמו המלא, ולכל קלט שלו
 * חוט: `$קלט` / `$קלט.שדה` (מהבקשה) · `@צומת` / `@צומת.שדה` (מפלט של צומת קודם) · מספר (קבוע מוצהר) · אובייקט (רשומה שמורכבת מחוטים).
 * החוטים לא מחשבים כלום — רק מעבירים ובוחרים שדה. כל החישוב נעשה בחלקים; הקבועים מוצהרים במתכון עם הסבר (`consts`).
 * טהור: הקריאה לחלק מוזרקת (`callNode`), בלי שעון ובלי I/O. רץ ב-node ובדפדפן.
 */

/** חוט ⇒ ערך. זורק אם החוט מצביע על משהו שאין (צומת לפני שרץ, שדה חסר). */
export function wire(w, inputs, vals) {
  if (typeof w === 'number' || typeof w === 'boolean' || w === null) return w;
  if (typeof w === 'string') {
    const m = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/.exec(w);
    if (!m) throw new Error('חוט לא מובן: ' + w);
    const base = m[1] === '$' ? inputs[m[2]] : vals[m[2]];
    if (base === undefined) throw new Error('אין ' + w);
    let v = base;
    for (const k of m[3].split('.').filter(Boolean)) {
      if (v === null || typeof v !== 'object' || !(k in v)) throw new Error('אין שדה ' + k + ' ב-' + w);
      v = v[k];
    }
    return v;
  }
  if (Array.isArray(w)) return w.map((x) => wire(x, inputs, vals));
  if (typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, x]) => [k, wire(x, inputs, vals)]));
  throw new Error('חוט לא מובן');
}

/** אילו צמתים/קלטים חוט מצביע עליהם (לבדיקת-מבנה: כל צומת מצביע רק אחורה, כל קלט קיים). */
export function refsOf(w, out = []) {
  if (typeof w === 'string') { const m = /^([$@])([\w-]+)/.exec(w); if (m) out.push(m[1] + m[2]); }
  else if (Array.isArray(w)) w.forEach((x) => refsOf(x, out));
  else if (w && typeof w === 'object') Object.values(w).forEach((x) => refsOf(x, out));
  return out;
}

/** בדיקת-מבנה של מתכון-גרף: שמות ייחודיים, חוטים רק אחורה, הפלט הוא צומת. מחזיר null או סיבה. */
export function graphProblem(g) {
  if (!Array.isArray(g.inputs) || !Array.isArray(g.nodes) || !g.nodes.length) return 'חסרים inputs/nodes';
  const seen = new Set();
  for (const n of g.nodes) {
    if (!n.id || !n.part || !Array.isArray(n.args)) return 'צומת חסר id/part/args';
    if (seen.has(n.id) || g.inputs.includes(n.id)) return 'שם כפול: ' + n.id;
    for (const r of refsOf(n.args)) {
      const name = r.slice(1);
      if (r[0] === '$' && !g.inputs.includes(name)) return n.id + ': אין קלט ' + name;
      if (r[0] === '@' && !seen.has(name)) return n.id + ': מצביע קדימה על ' + name;
    }
    seen.add(n.id);
  }
  if (!seen.has(g.out)) return 'הפלט אינו צומת: ' + g.out;
  return null;
}

/**
 * מריץ את הגרף. callNode(k, args) ⇒ {v} | {err} | {async} (כמו callerFor של ארגז-החול).
 * מחזיר {v} — הפלט של צומת `out` — או את השגיאה הראשונה, עם שם הצומת.
 */
export function runGraph(g, args, callNode) {
  const inputs = Object.fromEntries(g.inputs.map((n, k) => [n, args[k]]));
  const vals = {};
  for (let k = 0; k < g.nodes.length; k++) {
    const n = g.nodes[k];
    let a;
    try { a = wire(n.args, inputs, vals); } catch (e) { return { err: n.id + ': ' + String(e?.message || e) }; }
    const r = callNode(k, a);
    if (!r || r.async) return { async: true };
    if ('err' in r) return { err: n.id + ': ' + r.err };
    if (r.v === null || r.v === undefined || (typeof r.v === 'number' && !Number.isFinite(r.v))) return { err: n.id + ': אין ערך' };
    vals[n.id] = r.v;
  }
  return { v: vals[g.out] };
}

/** החלקים של הגרף לפי סדר ההופעה, בלי כפילויות (לתצוגה: כל חלק פעם אחת עם "נמצא ב:"). */
export const graphParts = (g) => [...new Set(g.nodes.map((n) => n.part))];
