// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/dialer.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const REQUEUE_OUTCOMES = ['noanswer', 'skip'];
function currentId(c) {
    return c.queue.length ? c.queue[0] : null;
}
const ZERO_COUNTS = () => ({
    donated: 0,
    noanswer: 0,
    refused: 0,
    callback: 0,
    done: 0,
    skip: 0,
});
export function inner$applyOutcome$id(c) {
    const id = currentId(c);
    return id;
}
export function inner$applyOutcome$rest(c) {
    const rest = c.queue.slice(1);
    return rest;
}
export function inner$applyOutcome$queue(c, outcome) {
    const id = currentId(c);
    const rest = c.queue.slice(1);
    const queue = REQUEUE_OUTCOMES.includes(outcome) ? [...rest, id] : rest;
    return queue;
}
export function inner$applyOutcome$queue$$step(outcome, id, rest) {
    const queue = REQUEUE_OUTCOMES.includes(outcome) ? [...rest, id] : rest;
    return queue;
}
export function inner$progress$counts() {
    const counts = ZERO_COUNTS();
    return counts;
}
export function inner$undoLast$last(c) {
    const last = c.log[c.log.length - 1];
    return last;
}
export function inner$undoLast$at(c, queue) {
    const last = c.log[c.log.length - 1];
    const at = queue.lastIndexOf(last.id);
    return at;
}
export function inner$undoLast$at$$step(last, queue) {
    const at = queue.lastIndexOf(last.id);
    return at;
}
export function inner$startCampaign$seen$$after_loop(ids) {
    const seen = new Set();
    const queue = [];
    for (const id of ids) {
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        queue.push(id);
    }
    return seen;
}
export function inner$startCampaign$queue$$after_loop(ids) {
    const seen = new Set();
    const queue = [];
    for (const id of ids) {
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        queue.push(id);
    }
    return queue;
}
export function inner$progress$counts$$after_loop(c) {
    const counts = ZERO_COUNTS();
    const seen = {};
    for (const e of c.log) {
        if (REQUEUE_OUTCOMES.includes(e.outcome)) {
            const s = (seen[e.outcome] ??= new Set());
            if (s.has(e.id))
                continue;
            s.add(e.id);
        }
        counts[e.outcome]++;
    }
    return counts;
}
export function inner$progress$seen$$after_loop(c) {
    const counts = ZERO_COUNTS();
    const seen = {};
    for (const e of c.log) {
        if (REQUEUE_OUTCOMES.includes(e.outcome)) {
            const s = (seen[e.outcome] ??= new Set());
            if (s.has(e.id))
                continue;
            s.add(e.id);
        }
        counts[e.outcome]++;
    }
    return seen;
}
export function inner$callStats$noanswer$$after_loop(calls) {
    const list = calls ?? [];
    let noanswer = 0;
    for (const c of list)
        if (c.outcome === 'noanswer')
            noanswer++;
    return noanswer;
}

export const SIGS = {
  inner$applyOutcome$id: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$applyOutcome$rest: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$applyOutcome$queue: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false},{"name":"outcome","d":{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},"opt":false}],
  inner$applyOutcome$queue$$step: [{"name":"outcome","d":{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},"opt":false},{"name":"id","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$progress$counts: [],
  inner$undoLast$last: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$undoLast$at: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false},{"name":"queue","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$undoLast$at$$step: [{"name":"last","d":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]},"opt":false},{"name":"queue","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$startCampaign$seen$$after_loop: [{"name":"ids","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$startCampaign$queue$$after_loop: [{"name":"ids","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$progress$counts$$after_loop: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$progress$seen$$after_loop: [{"name":"c","d":{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$callStats$noanswer$$after_loop: [{"name":"calls","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},"opt":false}],
};
