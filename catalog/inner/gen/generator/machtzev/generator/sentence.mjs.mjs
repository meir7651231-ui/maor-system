// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/sentence.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿״׳\-\/]*/g)].map((m) => m[0]);
const PREPS = new Set(['לפי', 'עם', 'של', 'על', 'עבור', 'מול', 'אל', 'בתוך', 'ללא', 'בלי']);
const norm = (x) => String(x).trim().replace(/\s+/g, ' ');
export function inner$resolve$rawWords(text) {
    const rawWords = heWords(text);
    return rawWords;
}
export function inner$resolve$firstPrep(text) {
    const rawWords = heWords(text);
    const firstPrep = rawWords.findIndex((w) => PREPS.has(w));
    return firstPrep;
}
export function inner$resolve$firstPrep$$step(rawWords) {
    const firstPrep = rawWords.findIndex((w) => PREPS.has(w));
    return firstPrep;
}
export function inner$resolve$altForms$ws(f) {
    const ws = f.split(' ');
    return ws;
}
export function inner$resolve$altForms$i(f) {
    const ws = f.split(' ');
    const i = ws.findIndex((w) => w.includes('/'));
    return i;
}
export function inner$resolve$altForms$i$$step(ws) {
    const i = ws.findIndex((w) => w.includes('/'));
    return i;
}
export function inner$resolve$prev(votes, t) {
    const prev = votes.get(t.entity);
    return prev;
}
export function inner$resolve$ranked(TERMS, votes) {
    const ranked = [...votes.entries()].map(([e, v]) => [e, v.score, v.len]).sort((a, b) => b[1] - a[1] || b[2] - a[2] || TERMS.findIndex((t) => t.entity === a[0]) - TERMS.findIndex((t) => t.entity === b[0])).map(([e, sc]) => [e, sc]);
    return ranked;
}
export function inner$particlesForOps$k(module) {
    const k = module.replace(/\.dart$/, '');
    return k;
}
export function inner$particlesForOps$tag(module, TAG) {
    const k = module.replace(/\.dart$/, '');
    const tag = TAG[k] && TAG[k] !== 'inv' ? TAG[k] : null;
    return tag;
}
export function inner$particlesForOps$tag$$step(k, TAG) {
    const tag = TAG[k] && TAG[k] !== 'inv' ? TAG[k] : null;
    return tag;
}
export function inner$particlesForOps$op(op0) {
    const op = norm(op0);
    return op;
}
export function inner$particlesForOps$hit(avail, op0, PARTICLE_NAMES) {
    const op = norm(op0);
    const hit = avail.find((id) => id === op || PARTICLE_NAMES[id] === op || id.split('.').pop() === op || (PARTICLE_NAMES[id] || '').split('·').pop() === op);
    return hit;
}
export function inner$particlesForOps$hit$$step(avail, op, PARTICLE_NAMES) {
    const hit = avail.find((id) => id === op || PARTICLE_NAMES[id] === op || id.split('.').pop() === op || (PARTICLE_NAMES[id] || '').split('·').pop() === op);
    return hit;
}
export function inner$fieldOpsOfSentence$n(f) {
    const n = /phone|tel|טלפון/i.test(f.rule || '') || /טלפון|נייד/.test(f.label) ? 'phone' : /mail|מייל|אימייל/i.test((f.rule || '') + f.label) ? 'email' : 'f';
    return n;
}
export function inner$subsetFromSentence$minOverlap(fo) {
    const minOverlap = Math.max(1, Math.min(3, fo.ops.length - 1));
    return minOverlap;
}
export function inner$arg$i(k, process) {
    const i = process.argv.indexOf(k);
    return i;
}
export function inner$particlesForOps$out$$after_loop(ops, avail, PARTICLE_NAMES) {
    const out = [];
    const missing = [];
    for (const op0 of ops) {
        const op = norm(op0);
        const hit = avail.find((id) => id === op || PARTICLE_NAMES[id] === op || id.split('.').pop() === op || (PARTICLE_NAMES[id] || '').split('·').pop() === op);
        if (hit) {
            if (!out.includes(hit))
                out.push(hit);
        }
        else
            missing.push(op);
    }
    return out;
}
export function inner$particlesForOps$missing$$after_loop(ops, avail, PARTICLE_NAMES) {
    const out = [];
    const missing = [];
    for (const op0 of ops) {
        const op = norm(op0);
        const hit = avail.find((id) => id === op || PARTICLE_NAMES[id] === op || id.split('.').pop() === op || (PARTICLE_NAMES[id] || '').split('·').pop() === op);
        if (hit) {
            if (!out.includes(hit))
                out.push(hit);
        }
        else
            missing.push(op);
    }
    return missing;
}

export const SIGS = {
  inner$resolve$rawWords: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$resolve$firstPrep: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$resolve$firstPrep$$step: [{"name":"rawWords","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$resolve$altForms$ws: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$resolve$altForms$i: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$resolve$altForms$i$$step: [{"name":"ws","d":{"t":"any"},"opt":false}],
  inner$resolve$prev: [{"name":"votes","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$resolve$ranked: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"votes","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$particlesForOps$k: [{"name":"module","d":{"t":"any"},"opt":false}],
  inner$particlesForOps$tag: [{"name":"module","d":{"t":"any"},"opt":false},{"name":"TAG","d":{"t":"obj","p":[["schoolos.dart",{"t":"str"},false],["schoolos_students",{"t":"str"},false],["schoolos_attendance",{"t":"str"},false],["schoolos_courses",{"t":"str"},false],["schoolos_teachers",{"t":"str"},false],["schoolos_rooms",{"t":"str"},false],["schoolos_fees",{"t":"str"},false],["schoolos_parents",{"t":"str"},false],["schoolos_dashboard",{"t":"str"},false]]},"opt":false}],
  inner$particlesForOps$tag$$step: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"TAG","d":{"t":"obj","p":[["schoolos.dart",{"t":"str"},false],["schoolos_students",{"t":"str"},false],["schoolos_attendance",{"t":"str"},false],["schoolos_courses",{"t":"str"},false],["schoolos_teachers",{"t":"str"},false],["schoolos_rooms",{"t":"str"},false],["schoolos_fees",{"t":"str"},false],["schoolos_parents",{"t":"str"},false],["schoolos_dashboard",{"t":"str"},false]]},"opt":false}],
  inner$particlesForOps$op: [{"name":"op0","d":{"t":"any"},"opt":false}],
  inner$particlesForOps$hit: [{"name":"avail","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"op0","d":{"t":"any"},"opt":false},{"name":"PARTICLE_NAMES","d":{"t":"any"},"opt":false}],
  inner$particlesForOps$hit$$step: [{"name":"avail","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"op","d":{"t":"str"},"opt":false},{"name":"PARTICLE_NAMES","d":{"t":"any"},"opt":false}],
  inner$fieldOpsOfSentence$n: [{"name":"f","d":{"t":"obj","p":[["label",{"t":"any"},false],["type",{"t":"str"},false],["required",{"t":"bool"},false],["unique",{"t":"bool"},false],["enumVals",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["formula",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["def",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["members",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["pattern",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["range",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["min",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["max",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false]]}]},false]]},"opt":false}],
  inner$subsetFromSentence$minOverlap: [{"name":"fo","d":{"t":"obj","p":[["fields",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"any"},false],["type",{"t":"str"},false],["ops",{"t":"arr","of":{"t":"str"}},false]]}},false],["ops",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$arg$i: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$particlesForOps$out$$after_loop: [{"name":"ops","d":{"t":"any"},"opt":false},{"name":"avail","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"PARTICLE_NAMES","d":{"t":"any"},"opt":false}],
  inner$particlesForOps$missing$$after_loop: [{"name":"ops","d":{"t":"any"},"opt":false},{"name":"avail","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"PARTICLE_NAMES","d":{"t":"any"},"opt":false}],
};
