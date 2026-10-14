// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/synth.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const norm = (w) => w.replace(/^ה(?=..)/, '');
const sig = (v) => JSON.stringify(v);
export function inner$feed1$t(f) {
    const t = f.params[0].type.replace(/\?$/, '');
    return t;
}
export function inner$feed1$n(s) {
    const n = s.trim() === '' ? NaN : Number(s);
    return n;
}
export function inner$runChain$v(input) {
    let v = String(input);
    return v;
}
export function inner$synthesize$dwords(desc) {
    const dwords = new Set((desc.match(/[֐-׿]+/g) || []).map(norm));
    return dwords;
}
export function inner$synthesize$inputs(examples) {
    const inputs = examples.map(e => String(e.in));
    return inputs;
}
export function inner$synthesize$want(examples) {
    const want = examples.map(e => e.out);
    return want;
}
export function inner$synthesize$seenV(examples) {
    const inputs = examples.map(e => String(e.in));
    const seenV = new Set([sig(inputs)]);
    return seenV;
}
export function inner$synthesize$seenV$$step(inputs) {
    const seenV = new Set([sig(inputs)]);
    return seenV;
}
export function inner$synthesize$s2(outs) {
    const s2 = sig(outs);
    return s2;
}
export function inner$parseCap$examples(lines) {
    const examples = lines.slice(1).map(l => l.split(/=>|⇒/)).filter(p => p.length === 2).map(([a, b]) => ({ in: a.trim(), out: b.trim() }));
    return examples;
}
export function inner$chainOfSpec$m(l) {
    const m = l.match(/^\s+חישוב .*\(([a-zA-Z]\w*)\)\s*$/);
    return m;
}
export function inner$chainOfSpec$chain$$after_loop(ls) {
    const chain = [];
    let collecting = false;
    for (const l of ls) {
        if (/^אטום ChipWrap /.test(l)) {
            collecting = true;
            continue;
        }
        if (collecting) {
            const m = l.match(/^\s+חישוב .*\(([a-zA-Z]\w*)\)\s*$/);
            if (m)
                chain.push(m[1]);
            else
                break;
        }
    }
    return chain;
}
export function inner$chainOfSpec$collecting$$after_loop(ls) {
    const chain = [];
    let collecting = false;
    for (const l of ls) {
        if (/^אטום ChipWrap /.test(l)) {
            collecting = true;
            continue;
        }
        if (collecting) {
            const m = l.match(/^\s+חישוב .*\(([a-zA-Z]\w*)\)\s*$/);
            if (m)
                chain.push(m[1]);
            else
                break;
        }
    }
    return collecting;
}

export const SIGS = {
  inner$feed1$t: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$feed1$n: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$runChain$v: [{"name":"input","d":{"t":"any"},"opt":false}],
  inner$synthesize$dwords: [{"name":"desc","d":{"t":"any"},"opt":false}],
  inner$synthesize$inputs: [{"name":"examples","d":{"t":"any"},"opt":false}],
  inner$synthesize$want: [{"name":"examples","d":{"t":"any"},"opt":false}],
  inner$synthesize$seenV: [{"name":"examples","d":{"t":"any"},"opt":false}],
  inner$synthesize$seenV$$step: [{"name":"inputs","d":{"t":"any"},"opt":false}],
  inner$synthesize$s2: [{"name":"outs","d":{"t":"any"},"opt":false}],
  inner$parseCap$examples: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$chainOfSpec$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$chainOfSpec$chain$$after_loop: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$chainOfSpec$collecting$$after_loop: [{"name":"ls","d":{"t":"any"},"opt":false}],
};
