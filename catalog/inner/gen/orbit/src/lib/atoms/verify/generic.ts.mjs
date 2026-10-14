// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/generic.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DAY = 86_400_000;
const pnum = (p, k, d) => (typeof p[k] === 'number' ? p[k] : d);
const pstr = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
const val = (s) => Number(s.replace(/[₪$,\s]/g, ''));
const hmOf = (s) => +s.split(':')[0] * 60 + +s.split(':')[1];
const dayIdx = (iso) => Math.floor(Date.parse(iso + 'T12:00:00Z') / DAY);
const dmOfDay = (d) => {
    const x = new Date(d * DAY);
    return x.getUTCDate() + '/' + (x.getUTCMonth() + 1);
};
function splitLine(line) {
    const [lhs, rhs] = line.split(' = ');
    if (rhs === undefined)
        return null;
    const pieces = [];
    for (const term of rhs.split(' + ')) {
        const m = /^(\d+) × (.+)$/.exec(term.trim());
        const n = m ? +m[1] : 1;
        const v = val(m ? m[2] : term);
        if (!Number.isFinite(v))
            return null;
        for (let i = 0; i < n; i++)
            pieces.push(v);
    }
    const total = val(lhs);
    return Number.isFinite(total) ? { total, pieces } : null;
}
export function inner$dmOfDay$x(d) {
    const x = new Date(d * DAY);
    return x;
}
export function inner$splitLine$lhs(line) {
    const [lhs, rhs] = line.split(' = ');
    return lhs;
}
export function inner$splitLine$rhs(line) {
    const [lhs, rhs] = line.split(' = ');
    return rhs;
}
export function inner$splitLine$m(term) {
    const m = /^(\d+) × (.+)$/.exec(term.trim());
    return m;
}
export function inner$splitLine$n(term) {
    const m = /^(\d+) × (.+)$/.exec(term.trim());
    const n = m ? +m[1] : 1;
    return n;
}
export function inner$splitLine$n$$step(m) {
    const n = m ? +m[1] : 1;
    return n;
}
export function inner$splitLine$v(term) {
    const m = /^(\d+) × (.+)$/.exec(term.trim());
    const v = val(m ? m[2] : term);
    return v;
}
export function inner$splitLine$v$$step(term, m) {
    const v = val(m ? m[2] : term);
    return v;
}
export function inner$splitLine$total(line) {
    const [lhs, rhs] = line.split(' = ');
    const total = val(lhs);
    return total;
}
export function inner$splitLine$total$$step(lhs) {
    const total = val(lhs);
    return total;
}
export function inner$amountDivide$s(l) {
    const s = splitLine(l);
    return s;
}
export function inner$amountDivide$sum(l) {
    const s = splitLine(l);
    const sum = s.pieces.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$amountDivide$sum$$step(s) {
    const sum = s.pieces.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$amountDivide$size(p) {
    const size = pnum(p, 'size', 30);
    return size;
}
export function inner$amountDivide$frac(l) {
    const s = splitLine(l);
    const frac = s.total - Math.floor(s.total);
    return frac;
}
export function inner$amountDivide$frac$$step(s) {
    const frac = s.total - Math.floor(s.total);
    return frac;
}
export function inner$roundOk$q(res, step) {
    const q = res / step;
    return q;
}
export function inner$amountRound$step(p) {
    const step = pnum(p, 'step', 1);
    return step;
}
export function inner$amountRound$dir(p) {
    const dir = pstr(p, 'dir', 'down');
    return dir;
}
export function inner$amountRound$a(l) {
    const [a, b] = l.split(' ← ').map(val);
    return a;
}
export function inner$amountRound$b(l) {
    const [a, b] = l.split(' ← ').map(val);
    return b;
}
export function inner$nextDates$t(env) {
    const t = dayIdx(env.today);
    return t;
}
export function inner$nextDates$m(l) {
    const m = /^הבא: (\d{1,2}\/\d{1,2}) \(בעוד (?:(\d+) ימים|יום אחד)\)$/.exec(l);
    return m;
}
export function inner$nextDates$n(l) {
    const m = /^הבא: (\d{1,2}\/\d{1,2}) \(בעוד (?:(\d+) ימים|יום אחד)\)$/.exec(l);
    const n = m[2] ? +m[2] : 1;
    return n;
}
export function inner$nextDates$n$$step(m) {
    const n = m[2] ? +m[2] : 1;
    return n;
}
export function inner$clockLines$d(p) {
    const d = pnum(p, 'minutes', -10);
    return d;
}
export function inner$clockLines$step(p) {
    const step = pnum(p, 'step', 1);
    return step;
}
export function inner$dateOffset$d(p) {
    const d = pnum(p, 'minutes', -10);
    return d;
}
export function inner$dateOffset$t(env) {
    const t = dayIdx(env.today);
    return t;
}
export function inner$dateOffset$m(l) {
    const m = /^תזכורת (\d{1,2}\/\d{1,2}) (\d{2}):(\d{2}) · למועד (\d{1,2}\/\d{1,2})$/.exec(l);
    return m;
}
export function inner$dateOffset$abs(p, env, l, DAY_ANCHOR_MIN) {
    const d = pnum(p, 'minutes', -10);
    const t = dayIdx(env.today);
    const m = /^תזכורת (\d{1,2}\/\d{1,2}) (\d{2}):(\d{2}) · למועד (\d{1,2}\/\d{1,2})$/.exec(l);
    let target = -1;
    for (let k = 0; k <= 400 * 3; k++)
        if (dmOfDay(t + k) === m[4]) {
            target = t + k;
            break;
        }
    const abs = target * 1440 + DAY_ANCHOR_MIN + d;
    return abs;
}
export function inner$dateOffset$abs$$step(d, target, DAY_ANCHOR_MIN) {
    const abs = target * 1440 + DAY_ANCHOR_MIN + d;
    return abs;
}
export function inner$dateOffset$day(p, env, l, DAY_ANCHOR_MIN) {
    const d = pnum(p, 'minutes', -10);
    const t = dayIdx(env.today);
    const m = /^תזכורת (\d{1,2}\/\d{1,2}) (\d{2}):(\d{2}) · למועד (\d{1,2}\/\d{1,2})$/.exec(l);
    let target = -1;
    for (let k = 0; k <= 400 * 3; k++)
        if (dmOfDay(t + k) === m[4]) {
            target = t + k;
            break;
        }
    const abs = target * 1440 + DAY_ANCHOR_MIN + d;
    const day = Math.floor(abs / 1440);
    return day;
}
export function inner$dateOffset$day$$step(abs) {
    const day = Math.floor(abs / 1440);
    return day;
}
export function inner$spanDivide$head(lines) {
    const head = /⇐ (\d+) חלקים$/.exec(lines[0] ?? '');
    return head;
}
export function inner$spanDivide$bySize(p) {
    const bySize = pstr(p, 'by', 'parts') === 'size';
    return bySize;
}
export function inner$spanDivide$rows(lines) {
    const rows = lines.slice(1).map((l) => /^\d+\. (.+)–(.+) \((.+)\)$/.exec(l)).filter((x) => !!x);
    return rows;
}
export function inner$spanDivide$len(lines, i) {
    const rows = lines.slice(1).map((l) => /^\d+\. (.+)–(.+) \((.+)\)$/.exec(l)).filter((x) => !!x);
    const len = /^(\d+(?:\.\d+)?)/.exec(rows[i][3]);
    return len;
}
export function inner$spanDivide$len$$step(rows, i) {
    const len = /^(\d+(?:\.\d+)?)/.exec(rows[i][3]);
    return len;
}
export function inner$spanDivide$size(p) {
    const size = pnum(p, 'size', 30);
    return size;
}
export function inner$spanDivide$shown(lines, i) {
    const rows = lines.slice(1).map((l) => /^\d+\. (.+)–(.+) \((.+)\)$/.exec(l)).filter((x) => !!x);
    const len = /^(\d+(?:\.\d+)?)/.exec(rows[i][3]);
    const shown = len ? +len[1] : /^יום אחד$/.test(rows[i][3]) ? 1 : NaN;
    return shown;
}
export function inner$spanDivide$shown$$step(rows, i, len) {
    const shown = len ? +len[1] : /^יום אחד$/.test(rows[i][3]) ? 1 : NaN;
    return shown;
}
export function inner$seqMerge$min(p) {
    const min = Math.max(2, pnum(p, 'minLength', 1));
    return min;
}
export function inner$seqRotate$rows(lines) {
    const rows = lines.map((l) => /^(\d{1,2}\/\d{1,2}) ⇐ (.+)$/.exec(l)).filter((x) => !!x);
    return rows;
}
export function inner$waitingLines$total(lines) {
    const total = /^(\d+) מחכים לתשובה$/.exec(lines[0] ?? '');
    return total;
}
export function inner$waitingLines$t(env) {
    const t = dayIdx(env.today);
    return t;
}
export function inner$waitingLines$total_L199(lines) {
    const total = /^(\d+) מחכים, בתורות:$/.exec(lines[0] ?? '');
    return total;
}
export function inner$waitingLines$counts(lines) {
    const counts = lines.slice(1).map((l) => /: (\d+)$/.exec(l)).map((m) => (m ? +m[1] : NaN));
    return counts;
}
export function inner$waitingLines$sum(lines) {
    const counts = lines.slice(1).map((l) => /: (\d+)$/.exec(l)).map((m) => (m ? +m[1] : NaN));
    const sum = counts.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$waitingLines$sum$$step(counts) {
    const sum = counts.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$textLines$m(l) {
    const m = /נמצאו (\d+) מתוך (\d+)/.exec(l);
    return m;
}
export function inner$dateOffset$target$$after_loop(env, l) {
    const t = dayIdx(env.today);
    const m = /^תזכורת (\d{1,2}\/\d{1,2}) (\d{2}):(\d{2}) · למועד (\d{1,2}\/\d{1,2})$/.exec(l);
    let target = -1;
    for (let k = 0; k <= 400 * 3; k++)
        if (dmOfDay(t + k) === m[4]) {
            target = t + k;
            break;
        }
    return target;
}
export function inner$waitingLines$ok$$after_loop(env, m) {
    const t = dayIdx(env.today);
    let ok = false;
    for (let k = 0; k <= 800 && !ok; k++)
        if (dmOfDay(t + k) === m[1] && (k > 0 || hmOf(m[2]) >= env.nowMin))
            ok = true;
    return ok;
}

export const SIGS = {
  inner$dmOfDay$x: [{"name":"d","d":{"t":"num"},"opt":false}],
  inner$splitLine$lhs: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitLine$rhs: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitLine$m: [{"name":"term","d":{"t":"str"},"opt":false}],
  inner$splitLine$n: [{"name":"term","d":{"t":"str"},"opt":false}],
  inner$splitLine$n$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$splitLine$v: [{"name":"term","d":{"t":"str"},"opt":false}],
  inner$splitLine$v$$step: [{"name":"term","d":{"t":"str"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$splitLine$total: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitLine$total$$step: [{"name":"lhs","d":{"t":"str"},"opt":false}],
  inner$amountDivide$s: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$amountDivide$sum: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$amountDivide$sum$$step: [{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["total",{"t":"num"},false],["pieces",{"t":"arr","of":{"t":"num"}},false]]}]},"opt":false}],
  inner$amountDivide$size: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$amountDivide$frac: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$amountDivide$frac$$step: [{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["total",{"t":"num"},false],["pieces",{"t":"arr","of":{"t":"num"}},false]]}]},"opt":false}],
  inner$roundOk$q: [{"name":"res","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$amountRound$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$amountRound$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$amountRound$a: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$amountRound$b: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$nextDates$t: [{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false}],
  inner$nextDates$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$nextDates$n: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$nextDates$n$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$clockLines$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$clockLines$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$dateOffset$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$dateOffset$t: [{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false}],
  inner$dateOffset$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$dateOffset$abs: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false},{"name":"DAY_ANCHOR_MIN","d":{"t":"num"},"opt":false}],
  inner$dateOffset$abs$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"target","d":{"t":"num"},"opt":false},{"name":"DAY_ANCHOR_MIN","d":{"t":"num"},"opt":false}],
  inner$dateOffset$day: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false},{"name":"DAY_ANCHOR_MIN","d":{"t":"num"},"opt":false}],
  inner$dateOffset$day$$step: [{"name":"abs","d":{"t":"num"},"opt":false}],
  inner$spanDivide$head: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$spanDivide$bySize: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$spanDivide$rows: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$spanDivide$len: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$spanDivide$len$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$spanDivide$size: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$spanDivide$shown: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$spanDivide$shown$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"len","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$seqMerge$min: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$seqRotate$rows: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingLines$total: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingLines$t: [{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false}],
  inner$waitingLines$total_L199: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingLines$counts: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingLines$sum: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingLines$sum$$step: [{"name":"counts","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$textLines$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$dateOffset$target$$after_loop: [{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$waitingLines$ok$$after_loop: [{"name":"env","d":{"t":"obj","n":"GenEnv","p":[["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
};
