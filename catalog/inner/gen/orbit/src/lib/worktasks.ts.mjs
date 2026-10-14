// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/worktasks.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function taskIdentity(email) {
    const e = (email ?? '').trim().toLowerCase();
    return e || 'מקומי';
}
function taskOverdue(t, todayIso) {
    return !t.doneAt && !!t.due && t.due < todayIso;
}
export function inner$taskIdentity$e(email) {
    const e = (email ?? '').trim().toLowerCase();
    return e;
}
export function inner$openTasksFor$me(identity) {
    const me = taskIdentity(identity);
    return me;
}
export function inner$doneTodayFor$me(identity) {
    const me = taskIdentity(identity);
    return me;
}
export function inner$taskStatsFor$me(identity) {
    const me = taskIdentity(identity);
    return me;
}
export function inner$taskStatsFor$mine(tasks, identity) {
    const me = taskIdentity(identity);
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    return mine;
}
export function inner$taskStatsFor$mine$$step(tasks, me) {
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    return mine;
}
export function inner$taskStatsFor$t0(todayIso) {
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    return t0;
}
export function inner$taskStatsFor$d(t) {
    const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
    return d;
}
export function inner$taskStatsFor$diff(todayIso, t) {
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
    const diff = (t0 - d) / 86400000;
    return diff;
}
export function inner$taskStatsFor$diff$$step(t0, d) {
    const diff = (t0 - d) / 86400000;
    return diff;
}
export function inner$overdueContactTaskDrafts$me(assignee) {
    const me = taskIdentity(assignee);
    return me;
}
export function inner$overdueContactTaskDrafts$already(existing, assignee) {
    const me = taskIdentity(assignee);
    const already = new Set(existing
        .filter((t) => !t.doneAt && taskIdentity(t.assignee) === me && t.ref?.kind === 'supporter')
        .map((t) => t.ref.id));
    return already;
}
export function inner$overdueContactTaskDrafts$already$$step(existing, me) {
    const already = new Set(existing
        .filter((t) => !t.doneAt && taskIdentity(t.assignee) === me && t.ref?.kind === 'supporter')
        .map((t) => t.ref.id));
    return already;
}
export function inner$taskStatsFor$open$$after_loop(tasks, identity, todayIso) {
    const me = taskIdentity(identity);
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    let open = 0;
    let overdue = 0;
    let done = 0;
    let doneWeek = 0;
    for (const t of mine) {
        if (!t.doneAt) {
            open++;
            if (taskOverdue(t, todayIso))
                overdue++;
        }
        else {
            done++;
            const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
            const diff = (t0 - d) / 86400000;
            if (diff >= 0 && diff < 7)
                doneWeek++;
        }
    }
    return open;
}
export function inner$taskStatsFor$overdue$$after_loop(tasks, identity, todayIso) {
    const me = taskIdentity(identity);
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    let open = 0;
    let overdue = 0;
    let done = 0;
    let doneWeek = 0;
    for (const t of mine) {
        if (!t.doneAt) {
            open++;
            if (taskOverdue(t, todayIso))
                overdue++;
        }
        else {
            done++;
            const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
            const diff = (t0 - d) / 86400000;
            if (diff >= 0 && diff < 7)
                doneWeek++;
        }
    }
    return overdue;
}
export function inner$taskStatsFor$done$$after_loop(tasks, identity, todayIso) {
    const me = taskIdentity(identity);
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    let open = 0;
    let overdue = 0;
    let done = 0;
    let doneWeek = 0;
    for (const t of mine) {
        if (!t.doneAt) {
            open++;
            if (taskOverdue(t, todayIso))
                overdue++;
        }
        else {
            done++;
            const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
            const diff = (t0 - d) / 86400000;
            if (diff >= 0 && diff < 7)
                doneWeek++;
        }
    }
    return done;
}
export function inner$taskStatsFor$doneWeek$$after_loop(tasks, identity, todayIso) {
    const me = taskIdentity(identity);
    const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    let open = 0;
    let overdue = 0;
    let done = 0;
    let doneWeek = 0;
    for (const t of mine) {
        if (!t.doneAt) {
            open++;
            if (taskOverdue(t, todayIso))
                overdue++;
        }
        else {
            done++;
            const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
            const diff = (t0 - d) / 86400000;
            if (diff >= 0 && diff < 7)
                doneWeek++;
        }
    }
    return doneWeek;
}

export const SIGS = {
  inner$taskIdentity$e: [{"name":"email","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$openTasksFor$me: [{"name":"identity","d":{"t":"str"},"opt":false}],
  inner$doneTodayFor$me: [{"name":"identity","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$me: [{"name":"identity","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$mine: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"identity","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$mine$$step: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"me","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$t0: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$d: [{"name":"t","d":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$taskStatsFor$diff: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"t","d":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$taskStatsFor$diff$$step: [{"name":"t0","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$overdueContactTaskDrafts$me: [{"name":"assignee","d":{"t":"str"},"opt":false}],
  inner$overdueContactTaskDrafts$already: [{"name":"existing","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"assignee","d":{"t":"str"},"opt":false}],
  inner$overdueContactTaskDrafts$already$$step: [{"name":"existing","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"me","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$open$$after_loop: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"identity","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$overdue$$after_loop: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"identity","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$done$$after_loop: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"identity","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$taskStatsFor$doneWeek$$after_loop: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[["id",{"t":"str"},false],["assignee",{"t":"str"},false],["by",{"t":"str"},false],["title",{"t":"str"},false],["ref",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["family","supporter","course"]},false],["id",{"t":"str"},false]]}]},true],["pri",{"t":"lit","v":[1,2,3]},false],["due",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"identity","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
};
