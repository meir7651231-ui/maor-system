// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/escalate.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ESC_DEFAULT_URGENT_MIN = 60;
const MIN = 60_000;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
function cleanSteps(steps) {
    if (!Array.isArray(steps))
        return [];
    return steps.map((s) => ({
        to: Array.isArray(s?.to) ? s.to.filter((x) => typeof x === 'string') : [],
        waitMin: fin(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0,
    }));
}
function waitOf(step, input) {
    if (!step.to.length)
        return 0;
    if (input.urgent === true) {
        const u = fin(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : ESC_DEFAULT_URGENT_MIN;
        return Math.min(step.waitMin, u);
    }
    return step.waitMin;
}
export function inner$waitOf$u(input) {
    const u = fin(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : ESC_DEFAULT_URGENT_MIN;
    return u;
}
export function inner$escalationPlan$steps(input) {
    const steps = cleanSteps(input?.steps);
    return steps;
}
export function inner$escalationPlan$created(input) {
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    return created;
}
export function inner$escalationPlan$answered(input) {
    const answered = fin(input?.answeredMs) ? input.answeredMs : null;
    return answered;
}
export function inner$escalationPlan$reached(input, at, i) {
    const answered = fin(input?.answeredMs) ? input.answeredMs : null;
    const reached = i === 0 || answered === null || at <= answered;
    return reached;
}
export function inner$escalationPlan$reached$$step(answered, at, i) {
    const reached = i === 0 || answered === null || at <= answered;
    return reached;
}
export function inner$escalationState$steps(input) {
    const steps = cleanSteps(input?.steps);
    return steps;
}
export function inner$escalationState$now(input) {
    const now = fin(input?.nowMs) ? input.nowMs : 0;
    return now;
}
export function inner$escalationState$answered(input) {
    const now = fin(input?.nowMs) ? input.nowMs : 0;
    const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
    return answered;
}
export function inner$escalationState$answered$$step(input, now) {
    const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
    return answered;
}
export function inner$escalationState$created(input) {
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    return created;
}
export function inner$escalationState$next(input, i, at) {
    const steps = cleanSteps(input?.steps);
    const next = at + waitOf(steps[i], input) * MIN;
    return next;
}
export function inner$escalationState$next$$step(input, steps, i, at) {
    const next = at + waitOf(steps[i], input) * MIN;
    return next;
}
export function inner$escalationState$last(input) {
    const steps = cleanSteps(input?.steps);
    const now = fin(input?.nowMs) ? input.nowMs : 0;
    const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
    const stopAt = answered ?? now;
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    let i = 0;
    let at = created;
    for (; i < steps.length - 1; i++) {
        const next = at + waitOf(steps[i], input) * MIN;
        // שלב בלי מקבלים לא מחזיק אף פעם — גם כשנענתה ממש ברגע היצירה.
        if (stopAt < next && steps[i].to.length)
            break;
        at = next;
    }
    const last = i === steps.length - 1;
    return last;
}
export function inner$escalationState$last$$step(steps, i) {
    const last = i === steps.length - 1;
    return last;
}
export function inner$escalationPlan$out$$after_loop(input) {
    const steps = cleanSteps(input?.steps);
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    const answered = fin(input?.answeredMs) ? input.answeredMs : null;
    const out = [];
    let at = created;
    for (let i = 0; i < steps.length; i++) {
        const reached = i === 0 || answered === null || at <= answered;
        out.push({ stepIndex: i, to: steps[i].to, atMs: reached ? (Number.isFinite(at) ? at : null) : null });
        at += waitOf(steps[i], input) * MIN;
    }
    return out;
}
export function inner$escalationPlan$at$$after_loop(input) {
    const steps = cleanSteps(input?.steps);
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    const answered = fin(input?.answeredMs) ? input.answeredMs : null;
    const out = [];
    let at = created;
    for (let i = 0; i < steps.length; i++) {
        const reached = i === 0 || answered === null || at <= answered;
        out.push({ stepIndex: i, to: steps[i].to, atMs: reached ? (Number.isFinite(at) ? at : null) : null });
        at += waitOf(steps[i], input) * MIN;
    }
    return at;
}
export function inner$escalationState$i$$after_loop(input) {
    const steps = cleanSteps(input?.steps);
    const now = fin(input?.nowMs) ? input.nowMs : 0;
    const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
    const stopAt = answered ?? now;
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    let i = 0;
    let at = created;
    for (; i < steps.length - 1; i++) {
        const next = at + waitOf(steps[i], input) * MIN;
        // שלב בלי מקבלים לא מחזיק אף פעם — גם כשנענתה ממש ברגע היצירה.
        if (stopAt < next && steps[i].to.length)
            break;
        at = next;
    }
    return i;
}
export function inner$escalationState$at$$after_loop(input) {
    const steps = cleanSteps(input?.steps);
    const now = fin(input?.nowMs) ? input.nowMs : 0;
    const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
    const stopAt = answered ?? now;
    const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
    let i = 0;
    let at = created;
    for (; i < steps.length - 1; i++) {
        const next = at + waitOf(steps[i], input) * MIN;
        // שלב בלי מקבלים לא מחזיק אף פעם — גם כשנענתה ממש ברגע היצירה.
        if (stopAt < next && steps[i].to.length)
            break;
        at = next;
    }
    return at;
}

export const SIGS = {
  inner$waitOf$u: [{"name":"input","d":{"t":"obj","n":"Partial","p":[["createdMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["steps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}}]},true],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationPlan$steps: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationPlan$created: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationPlan$answered: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationPlan$reached: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"at","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$escalationPlan$reached$$step: [{"name":"answered","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"at","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$escalationState$steps: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$now: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$answered: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$answered$$step: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$escalationState$created: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$next: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false}],
  inner$escalationState$next$$step: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false},{"name":"steps","d":{"t":"arr","of":{"t":"obj","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false}],
  inner$escalationState$last: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$last$$step: [{"name":"steps","d":{"t":"arr","of":{"t":"obj","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$escalationPlan$out$$after_loop: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationPlan$at$$after_loop: [{"name":"input","d":{"t":"obj","p":[["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["createdMs",{"t":"num"},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$escalationState$i$$after_loop: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$escalationState$at$$after_loop: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
};
