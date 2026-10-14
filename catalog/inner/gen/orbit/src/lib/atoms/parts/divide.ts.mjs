// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/divide.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
function decimalsOf(step) {
    const s = String(step);
    const e = /e-(\d+)$/.exec(s);
    if (e)
        return Math.min(10, Number(e[1]));
    const i = s.indexOf('.');
    return i < 0 ? 0 : Math.min(10, s.length - i - 1);
}
export function inner$divideSpan$len(span) {
    const len = span.to - span.from;
    return len;
}
export function inner$divideSpan$n(opts) {
    const o = opts ?? {};
    const n = Math.floor(Number(o.parts));
    return n;
}
export function inner$divideSpan$n$$step(o) {
    const n = Math.floor(Number(o.parts));
    return n;
}
export function inner$divideSpan$unit(span, opts) {
    const o = opts ?? {};
    const len = span.to - span.from;
    const n = Math.floor(Number(o.parts));
    const unit = len / n;
    return unit;
}
export function inner$divideSpan$unit$$step(len, n) {
    const unit = len / n;
    return unit;
}
export function inner$divideSpan$from(span, opts, k) {
    const o = opts ?? {};
    const len = span.to - span.from;
    const n = Math.floor(Number(o.parts));
    const unit = len / n;
    const from = k === 0 ? span.from : span.from + unit * k;
    return from;
}
export function inner$divideSpan$from$$step(span, unit, k) {
    const from = k === 0 ? span.from : span.from + unit * k;
    return from;
}
export function inner$divideSpan$to(span, opts, k) {
    const o = opts ?? {};
    const len = span.to - span.from;
    const n = Math.floor(Number(o.parts));
    const unit = len / n;
    const to = k === n - 1 ? span.to : span.from + unit * (k + 1);
    return to;
}
export function inner$divideSpan$to$$step(span, n, unit, k) {
    const to = k === n - 1 ? span.to : span.from + unit * (k + 1);
    return to;
}
export function inner$divideSpan$size(opts) {
    const o = opts ?? {};
    const size = Number(o.size);
    return size;
}
export function inner$divideSpan$size$$step(o) {
    const size = Number(o.size);
    return size;
}
export function inner$divideSpan$gap(opts) {
    const o = opts ?? {};
    const gap = fin(o.gap) && o.gap > 0 ? o.gap : 0;
    return gap;
}
export function inner$divideSpan$gap$$step(o) {
    const gap = fin(o.gap) && o.gap > 0 ? o.gap : 0;
    return gap;
}
export function inner$divideSpan$shorten(opts) {
    const o = opts ?? {};
    const shorten = o.remainder === 'shorten';
    return shorten;
}
export function inner$divideSpan$shorten$$step(o) {
    const shorten = o.remainder === 'shorten';
    return shorten;
}
export function inner$divideSpan$end(opts, cur) {
    const o = opts ?? {};
    const size = Number(o.size);
    const end = cur + size;
    return end;
}
export function inner$divideSpan$end$$step(size, cur) {
    const end = cur + size;
    return end;
}
export function inner$pointsAt$unit(span, parts) {
    const unit = (span.to - span.from) / parts;
    return unit;
}
export function inner$decimalsOf$s(step) {
    const s = String(step);
    return s;
}
export function inner$decimalsOf$e(step) {
    const s = String(step);
    const e = /e-(\d+)$/.exec(s);
    return e;
}
export function inner$decimalsOf$e$$step(s) {
    const e = /e-(\d+)$/.exec(s);
    return e;
}
export function inner$decimalsOf$i(step) {
    const s = String(step);
    const i = s.indexOf('.');
    return i;
}
export function inner$decimalsOf$i$$step(s) {
    const i = s.indexOf('.');
    return i;
}
export function inner$divideAmount$n(parts) {
    const n = Math.floor(Number(parts));
    return n;
}
export function inner$divideAmount$st(step) {
    const st = fin(step) && step > 0 ? step : 1;
    return st;
}
export function inner$divideAmount$dec(total, step) {
    const st = fin(step) && step > 0 ? step : 1;
    const dec = Math.max(decimalsOf(st), decimalsOf(total));
    return dec;
}
export function inner$divideAmount$dec$$step(total, st) {
    const dec = Math.max(decimalsOf(st), decimalsOf(total));
    return dec;
}
export function inner$divideAmount$q(total, step) {
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    return q;
}
export function inner$divideAmount$q$$step(total, st) {
    const q = total / st;
    return q;
}
export function inner$divideAmount$qi(total, step) {
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    return qi;
}
export function inner$divideAmount$qi$$step(q) {
    const qi = Math.round(q);
    return qi;
}
export function inner$divideAmount$units(total, step) {
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    return units;
}
export function inner$divideAmount$units$$step(q, qi) {
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    return units;
}
export function inner$divideAmount$rest(total, step) {
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    const rest = total - units * st;
    return rest;
}
export function inner$divideAmount$rest$$step(total, st, units) {
    const rest = total - units * st;
    return rest;
}
export function inner$divideAmount$base(total, parts, step) {
    const n = Math.floor(Number(parts));
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    const base = Math.trunc(units / n);
    return base;
}
export function inner$divideAmount$base$$step(n, units) {
    const base = Math.trunc(units / n);
    return base;
}
export function inner$divideAmount$extra(total, parts, step) {
    const n = Math.floor(Number(parts));
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    const base = Math.trunc(units / n);
    const extra = units - base * n;
    return extra;
}
export function inner$divideAmount$extra$$step(n, units, base) {
    const extra = units - base * n;
    return extra;
}
export function inner$divideAmount$sign(total, parts, step) {
    const n = Math.floor(Number(parts));
    const st = fin(step) && step > 0 ? step : 1;
    const q = total / st;
    const qi = Math.round(q);
    const units = Math.abs(q - qi) <= 1e-9 * Math.max(1, Math.abs(q)) ? qi : Math.trunc(q);
    const base = Math.trunc(units / n);
    const extra = units - base * n;
    const sign = Math.sign(extra);
    return sign;
}
export function inner$divideAmount$sign$$step(extra) {
    const sign = Math.sign(extra);
    return sign;
}
export function inner$divideSpan$out$$after_loop(span, opts) {
    const o = opts ?? {};
    const len = span.to - span.from;
    const n = Math.floor(Number(o.parts));
    const unit = len / n;
    const out = [];
    for (let k = 0; k < n; k++) {
        const from = k === 0 ? span.from : span.from + unit * k;
        const to = k === n - 1 ? span.to : span.from + unit * (k + 1);
        out.push({ from, to, length: to - from });
    }
    return out;
}
export function inner$pointsAt$out$$after_loop(span, parts, at) {
    const unit = (span.to - span.from) / parts;
    const out = [];
    for (const a of at)
        if (fin(a))
            out.push(span.from + a * unit);
    return out;
}

export const SIGS = {
  inner$divideSpan$len: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false}],
  inner$divideSpan$n: [{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$n$$step: [{"name":"o","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$unit: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$unit$$step: [{"name":"len","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$divideSpan$from: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$divideSpan$from$$step: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"unit","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$divideSpan$to: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$divideSpan$to$$step: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"unit","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$divideSpan$size: [{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$size$$step: [{"name":"o","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$gap: [{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$gap$$step: [{"name":"o","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$shorten: [{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$shorten$$step: [{"name":"o","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$divideSpan$end: [{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false},{"name":"cur","d":{"t":"num"},"opt":false}],
  inner$divideSpan$end$$step: [{"name":"size","d":{"t":"num"},"opt":false},{"name":"cur","d":{"t":"num"},"opt":false}],
  inner$pointsAt$unit: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"parts","d":{"t":"num"},"opt":false}],
  inner$decimalsOf$s: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$decimalsOf$e: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$decimalsOf$e$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$decimalsOf$i: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$decimalsOf$i$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$divideAmount$n: [{"name":"parts","d":{"t":"num"},"opt":false}],
  inner$divideAmount$st: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$dec: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$dec$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false}],
  inner$divideAmount$q: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$q$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false}],
  inner$divideAmount$qi: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$qi$$step: [{"name":"q","d":{"t":"num"},"opt":false}],
  inner$divideAmount$units: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$units$$step: [{"name":"q","d":{"t":"num"},"opt":false},{"name":"qi","d":{"t":"num"},"opt":false}],
  inner$divideAmount$rest: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$rest$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"num"},"opt":false}],
  inner$divideAmount$base: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"parts","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$base$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"num"},"opt":false}],
  inner$divideAmount$extra: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"parts","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$extra$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"num"},"opt":false}],
  inner$divideAmount$sign: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"parts","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$divideAmount$sign$$step: [{"name":"extra","d":{"t":"num"},"opt":false}],
  inner$divideSpan$out$$after_loop: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"opts","d":{"t":"obj","n":"DivideOpts","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["gap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["remainder",{"t":"or","of":[{"t":"lit","v":["drop","shorten"]},{"t":"undef"}]},true]]},"opt":false}],
  inner$pointsAt$out$$after_loop: [{"name":"span","d":{"t":"obj","n":"Span","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]},"opt":false},{"name":"parts","d":{"t":"num"},"opt":false},{"name":"at","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
};
