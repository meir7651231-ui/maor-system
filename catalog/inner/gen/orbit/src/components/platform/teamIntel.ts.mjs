// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/platform/teamIntel.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function trendOf(w) {
    if (w.last7 > w.prevWeek)
        return '▲';
    if (w.last7 < w.prevWeek)
        return '▼';
    return '＝';
}
const RECENT_LIMIT = 6;
const dayOf = (iso) => iso.slice(0, 10);
function withinDays(iso, todayIso, days) {
    const d = new Date(dayOf(iso) + 'T12:00:00').getTime();
    const t = new Date(todayIso + 'T12:00:00').getTime();
    const diff = (t - d) / 86400000;
    return diff >= 0 && diff < days;
}
const norm = (e) => String(e ?? '').trim().toLowerCase();
function safeAudit(audit) {
    if (!Array.isArray(audit))
        return [];
    return audit.filter((a) => !!a && typeof a === 'object' && typeof a.at === 'string');
}
function goalProgress(w, goal) {
    if (!goal || goal <= 0)
        return null;
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
export function inner$workerIntel$mine(audit, email) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    return mine;
}
export function inner$workerIntel$mine$$step(audit, me) {
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    return mine;
}
export function inner$workerIntel$hours() {
    const hours = Array.from({ length: 24 }, () => 0);
    return hours;
}
export function inner$workerIntel$spark14() {
    const spark14 = Array.from({ length: 14 }, () => 0);
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
export function inner$workerIntel$quietDays(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
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
export function inner$workerIntel$byAct(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
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
export function inner$workerIntel$recent(audit, email) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const recent = [...mine].sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_LIMIT);
    return recent;
}
export function inner$workerIntel$recent$$step(mine) {
    const recent = [...mine].sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_LIMIT);
    return recent;
}
export function inner$workerIntel$peak(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
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
export function inner$workerIntel$byActMap$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return byActMap;
}
export function inner$workerIntel$days$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return days;
}
export function inner$workerIntel$hours$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return hours;
}
export function inner$workerIntel$spark14$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return spark14;
}
export function inner$workerIntel$last7$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return last7;
}
export function inner$workerIntel$prevWeek$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return prevWeek;
}
export function inner$workerIntel$today$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return today;
}
export function inner$workerIntel$lastAt$$after_loop(audit, email, todayIso) {
    const me = norm(email);
    const mine = safeAudit(audit).filter((a) => norm(a.who) === me);
    const byActMap = {};
    const days = new Set();
    const hours = Array.from({ length: 24 }, () => 0);
    const spark14 = Array.from({ length: 14 }, () => 0);
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
        if (withinDays(a.at, todayIso, 7))
            last7++;
        if (dayOf(a.at) === todayIso)
            today++;
        // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
        const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
        if (diff >= 7 && diff < 14)
            prevWeek++;
        if (diff >= 0 && diff < 14)
            spark14[13 - diff]++;
        const h = Number(a.at.slice(11, 13));
        if (Number.isFinite(h) && h >= 0 && h < 24)
            hours[h]++;
    }
    return lastAt;
}
export function inner$teamCsvRows$rows$$after_loop(list, goals) {
    const rows = [
        ['עובד/ת', 'סה"כ פעולות', 'השבוע', 'שבוע-קודם', 'מגמה', 'ימי-פעילות', 'שקט (ימים)', 'שעת-שיא', 'יעד-שבועי', 'עמידה-ביעד', 'פעולה-מובילה'],
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
            w.quietDays >= 99 ? '' : w.quietDays,
            w.peakHour == null ? '' : String(w.peakHour).padStart(2, '0') + ':00',
            g ?? '',
            gp ? gp.pct + '%' : '',
            w.byAct[0]?.act ?? '',
        ]);
    }
    return rows;
}

export const SIGS = {
  inner$withinDays$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$withinDays$t: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$withinDays$diff: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$withinDays$diff$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$workerIntel$me: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$workerIntel$mine: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false}],
  inner$workerIntel$mine$$step: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"me","d":{"t":"str"},"opt":false}],
  inner$workerIntel$hours: [],
  inner$workerIntel$spark14: [],
  inner$workerIntel$t: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$diff: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]},"opt":false}],
  inner$workerIntel$diff$$step: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"a","d":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]},"opt":false}],
  inner$workerIntel$h: [{"name":"a","d":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]},"opt":false}],
  inner$workerIntel$quietDays: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$quietDays$$step: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"lastAt","d":{"t":"str"},"opt":false}],
  inner$workerIntel$byAct: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$byAct$$step: [{"name":"byActMap","d":{"t":"rec","of":{"t":"num"}},"opt":false}],
  inner$workerIntel$recent: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false}],
  inner$workerIntel$recent$$step: [{"name":"mine","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false}],
  inner$workerIntel$peak: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$peak$$step: [{"name":"hours","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$teamIntel$uniq: [{"name":"emails","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$teamSummary$week: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]}},"opt":false}],
  inner$teamSummary$activeToday: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]}},"opt":false}],
  inner$teamSummary$top: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]}},"opt":false}],
  inner$goalProgress$pct: [{"name":"w","d":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]},"opt":false},{"name":"goal","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false}],
  inner$teamCsvRows$gp: [{"name":"w","d":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]},"opt":false},{"name":"g","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false}],
  inner$agoLabel$d: [{"name":"lastAt","d":{"t":"str"},"opt":false}],
  inner$agoLabel$t: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$agoLabel$diff: [{"name":"lastAt","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$agoLabel$diff$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$workerIntel$byActMap$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$days$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$hours$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$spark14$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$last7$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$prevWeek$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$today$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$workerIntel$lastAt$$after_loop: [{"name":"audit","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$teamCsvRows$rows$$after_loop: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"WorkerIntel","p":[["email",{"t":"str"},false],["actions",{"t":"num"},false],["lastAt",{"t":"str"},false],["daysActive",{"t":"num"},false],["last7",{"t":"num"},false],["today",{"t":"num"},false],["byAct",{"t":"arr","of":{"t":"obj","p":[["act",{"t":"str"},false],["n",{"t":"num"},false]]}},false],["recent",{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},false],["peakHour",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["prevWeek",{"t":"num"},false],["spark14",{"t":"arr","of":{"t":"num"}},false],["quietDays",{"t":"num"},false]]}},"opt":false},{"name":"goals","d":{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"num"}]}},"opt":false}],
};
