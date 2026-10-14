// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/team-intel.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function trendOf(w) {
    if (w.last7 > w.prevWeek)
        return '▲';
    if (w.last7 < w.prevWeek)
        return '▼';
    return '＝';
}
const dayOf = (iso) => iso.slice(0, 10);
function withinDays(iso, todayIso, days) {
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const d = new Date(dayOf(iso) + 'T12:00:00').getTime();
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const t = new Date(todayIso + 'T12:00:00').getTime();
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const diff = (t - d) / 86400000;
    return diff >= 0 && diff < days;
}
const norm = (e) => String(e ?? '').trim().toLowerCase();
function goalProgress(w, goal) {
    if (!goal || goal <= 0)
        return null;
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const pct = Math.min(100, Math.round((w.last7 / goal) * 100));
    return { pct, done: w.last7 >= goal };
}
export function inner$withinDays$d(iso) {
    const d = new Date(dayOf(iso) + 'T12:00:00').getTime();
    return d;
}
export function inner$withinDays$t(todayIso) {
    const t = new Date(todayIso + 'T12:00:00').getTime();
    return t;
}
export function inner$withinDays$diff(iso, todayIso) {
    const d = new Date(dayOf(iso) + 'T12:00:00').getTime();
    const t = new Date(todayIso + 'T12:00:00').getTime();
    const diff = (t - d) / 86400000;
    return diff;
}
export function inner$withinDays$diff$$step(d, t) {
    const diff = (t - d) / 86400000;
    return diff;
}
export function inner$workerIntel$me(email) {
    const me = norm(email);
    return me;
}
export function inner$workerIntel$hours(M) {
    const hours = Array.from({ length: M.m0 }, () => 0);
    return hours;
}
export function inner$workerIntel$spark14(M) {
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    return spark14;
}
export function inner$workerIntel$t(todayIso) {
    const t = new Date(todayIso + 'T12:00:00').getTime();
    return t;
}
export function inner$workerIntel$diff(todayIso, a) {
    const t = new Date(todayIso + 'T12:00:00').getTime();
    const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
    return diff;
}
export function inner$workerIntel$diff$$step(t, a) {
    const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
    return diff;
}
export function inner$workerIntel$h(a) {
    const h = Number(a.at.slice(11, 13));
    return h;
}
export function inner$workerIntel$quietDays(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    const quietDays = lastAt ? Math.max(0, Math.round((t - new Date(dayOf(lastAt) + 'T12:00:00').getTime()) / 86400000)) : 99;
    return quietDays;
}
export function inner$workerIntel$quietDays$$step(t, lastAt) {
    const quietDays = lastAt ? Math.max(0, Math.round((t - new Date(dayOf(lastAt) + 'T12:00:00').getTime()) / 86400000)) : 99;
    return quietDays;
}
export function inner$workerIntel$byAct(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    const byAct = Object.entries(byActMap)
        .map(([act, n]) => ({ act, n }))
        .sort((a, b) => b.n - a.n || a.act.localeCompare(b.act, 'he'));
    return byAct;
}
export function inner$workerIntel$byAct$$step(byActMap) {
    const byAct = Object.entries(byActMap)
        .map(([act, n]) => ({ act, n }))
        .sort((a, b) => b.n - a.n || a.act.localeCompare(b.act, 'he'));
    return byAct;
}
export function inner$workerIntel$recent(mine, RECENT_LIMIT) {
    const recent = [...mine].sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_LIMIT);
    return recent;
}
export function inner$workerIntel$peak(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    const peak = hours.reduce((best, n, h) => (n > hours[best] ? h : best), 0);
    return peak;
}
export function inner$workerIntel$peak$$step(hours) {
    const peak = hours.reduce((best, n, h) => (n > hours[best] ? h : best), 0);
    return peak;
}
export function inner$teamIntel$uniq(emails) {
    const uniq = [...new Set((Array.isArray(emails) ? emails : []).map((e) => String(e ?? '').trim()).filter(Boolean))];
    return uniq;
}
export function inner$teamSummary$week(list) {
    const week = list.reduce((t, w) => t + w.last7, 0);
    return week;
}
export function inner$teamSummary$activeToday(list) {
    const activeToday = list.filter((w) => w.today > 0).length;
    return activeToday;
}
export function inner$teamSummary$top(list) {
    const top = list.find((w) => w.last7 > 0)?.email ?? '';
    return top;
}
export function inner$goalProgress$pct(w, goal) {
    const pct = Math.min(100, Math.round((w.last7 / goal) * 100));
    return pct;
}
export function inner$teamCsvRows$gp(w, g) {
    const gp = goalProgress(w, g);
    return gp;
}
export function inner$agoLabel$d(lastAt) {
    const d = new Date(dayOf(lastAt) + 'T12:00:00').getTime();
    return d;
}
export function inner$agoLabel$t(todayIso) {
    const t = new Date(todayIso + 'T12:00:00').getTime();
    return t;
}
export function inner$agoLabel$diff(lastAt, todayIso) {
    const d = new Date(dayOf(lastAt) + 'T12:00:00').getTime();
    const t = new Date(todayIso + 'T12:00:00').getTime();
    const diff = Math.round((t - d) / 86400000);
    return diff;
}
export function inner$agoLabel$diff$$step(d, t) {
    const diff = Math.round((t - d) / 86400000);
    return diff;
}
export function inner$workerIntel$byActMap$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return byActMap;
}
export function inner$workerIntel$days$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return days;
}
export function inner$workerIntel$hours$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return hours;
}
export function inner$workerIntel$spark14$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return spark14;
}
export function inner$workerIntel$last7$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return last7;
}
export function inner$workerIntel$prevWeek$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return prevWeek;
}
export function inner$workerIntel$today$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return today;
}
export function inner$workerIntel$lastAt$$after_loop(todayIso, mine, M) {
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: M.m0 }, () => 0);
    const spark14 = Array.from({ length: M.m1 }, () => 0);
    const t = new Date(todayIso + 'T12:00:00').getTime();
    let last7 = 0;
    let prevWeek = 0;
    let today = 0;
    let lastAt = '';
    for (const a of mine) {
        byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
        days.add(dayOf(a.at));
        if (a.at > lastAt)
            lastAt = a.at;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < M.m1)
            spark14[M.m2 - diff]++;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return lastAt;
}
export function inner$teamCsvRows$rows$$after_loop(list, goals, M, S) {
    const rows = [
        [S.k2, S.k3, S.k4, S.k5, S.k6, S.k7, S.k8, S.k9, S.k10, S.k11, S.k12],
    ];
    for (const w of list) {
        const g = goals[w.email];
        const gp = goalProgress(w, g);
        rows.push([
            w.email,
            w.actions,
            w.last7,
            w.prevWeek,
            trendOf(w),
            w.daysActive,
            w.quietDays >= M.m3 ? '' : w.quietDays,
            // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
            w.peakHour == null ? '' : String(w.peakHour).padStart(2, '0') + ':00',
            g ?? '',
            gp ? gp.pct + '%' : '',
            w.byAct[0]?.act ?? '',
        ]);
    }
    return rows;
}

export const SIGS = {
  inner$withinDays$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$withinDays$t: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$withinDays$diff: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$withinDays$diff$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$workerIntel$me: [{"name":"email","d":{"t":"any"},"opt":false}],
  inner$workerIntel$hours: [{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$spark14: [{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$t: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$workerIntel$diff: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$workerIntel$diff$$step: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$workerIntel$h: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$workerIntel$quietDays: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$quietDays$$step: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"lastAt","d":{"t":"str"},"opt":false}],
  inner$workerIntel$byAct: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$byAct$$step: [{"name":"byActMap","d":{"t":"obj","n":"byActMap","p":[]},"opt":false}],
  inner$workerIntel$recent: [{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"RECENT_LIMIT","d":{"t":"lit","v":[6]},"opt":false}],
  inner$workerIntel$peak: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$peak$$step: [{"name":"hours","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$teamIntel$uniq: [{"name":"emails","d":{"t":"any"},"opt":false}],
  inner$teamSummary$week: [{"name":"list","d":{"t":"any"},"opt":false}],
  inner$teamSummary$activeToday: [{"name":"list","d":{"t":"any"},"opt":false}],
  inner$teamSummary$top: [{"name":"list","d":{"t":"any"},"opt":false}],
  inner$goalProgress$pct: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"goal","d":{"t":"num"},"opt":false}],
  inner$teamCsvRows$gp: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$agoLabel$d: [{"name":"lastAt","d":{"t":"any"},"opt":false}],
  inner$agoLabel$t: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$agoLabel$diff: [{"name":"lastAt","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$agoLabel$diff$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$workerIntel$byActMap$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$days$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$hours$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$spark14$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$last7$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$prevWeek$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$today$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$workerIntel$lastAt$$after_loop: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$teamCsvRows$rows$$after_loop: [{"name":"list","d":{"t":"any"},"opt":false},{"name":"goals","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false},{"name":"S","d":{"t":"obj","p":[["k0",{"t":"str"},false],["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false],["k5",{"t":"str"},false],["k6",{"t":"str"},false],["k7",{"t":"str"},false],["k8",{"t":"str"},false],["k9",{"t":"str"},false],["k10",{"t":"str"},false],["k11",{"t":"str"},false],["k12",{"t":"str"},false],["k13",{"t":"str"},false],["k14",{"t":"str"},false],["k15",{"t":"str"},false]]},"opt":false}],
};
