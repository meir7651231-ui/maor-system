// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-custom-export.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function inR(iso, r) {
    if (!iso)
        return false;
    if (r.from && iso < r.from)
        return false;
    if (r.to && iso > r.to)
        return false;
    return true;
}
export function inner$buildCustomExport$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$buildCustomExport$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$buildCustomExport$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$buildCustomExport$rows(defs) {
    const rows = [defs.map((f) => f.label)];
    return rows;
}
export function inner$buildCustomExport$roomName(db) {
    const roomName = new Map(db.rooms.map((r) => [r.id, r.name]));
    return roomName;
}
export function inner$buildCustomExport$ens(db, c) {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    return ens;
}
export function inner$buildCustomExport$t(db, c) {
    const t = db.teachers.find((x) => x.id === c.teacherId);
    return t;
}
export function inner$buildCustomExport$map$mi(memberInfo, e) {
    const mi = memberInfo.get(e.memberId);
    return mi;
}
export function inner$buildCustomExport$map$paid(e) {
    const paid = (e.payments || []).reduce((a, p) => a + (p.amount || 0), 0);
    return paid;
}
export function inner$buildCustomExport$rec(db, EV_META, ev) {
    const rec = {
        title: ev.title,
        type: ev.customType || EV_META[ev.type].label,
        time: ev.time || '',
        fam: db.families.find((f) => f.id === ev.famId)?.name || '',
        notes: ev.notes || '',
        done: ev.done,
    };
    return rec;
}
export function inner$buildCustomExport$d0(range) {
    const d0 = new Date(range.from + 'T12:00:00');
    return d0;
}
export function inner$buildCustomExport$d1raw(range) {
    const d1raw = new Date(range.to + 'T12:00:00');
    return d1raw;
}
export function inner$buildCustomExport$capped(range, T, CAP_DAYS) {
    const d0 = new Date(range.from + 'T12:00:00');
    const capped = new Date(d0.getTime() + CAP_DAYS * T.k19);
    return capped;
}
export function inner$buildCustomExport$capped$$step(T, CAP_DAYS, d0) {
    const capped = new Date(d0.getTime() + CAP_DAYS * T.k19);
    return capped;
}
export function inner$buildCustomExport$d1(range, T, CAP_DAYS) {
    const d0 = new Date(range.from + 'T12:00:00');
    const d1raw = new Date(range.to + 'T12:00:00');
    const capped = new Date(d0.getTime() + CAP_DAYS * T.k19);
    const d1 = d1raw < capped ? d1raw : capped;
    return d1;
}
export function inner$buildCustomExport$d1$$step(d1raw, capped) {
    const d1 = d1raw < capped ? d1raw : capped;
    return d1;
}
export function inner$buildCustomExport$dons(range, sp) {
    const dons = sp.donations.filter((d) => inR(d.date, range));
    return dons;
}
export function inner$buildCustomExport$answers(range, a) {
    const answers = a ? a.answers.filter((x) => inR(x.date, range)) : [];
    return answers;
}
export function inner$buildCustomExport$touchedInRange(range, ayinOn, a) {
    const touchedInRange = ayinOn && !!a && (inR(a.lastTouch, range) || a.log.some((l) => inR(l.date, range)));
    return touchedInRange;
}
export function inner$buildCustomExport$ils(range, sp) {
    const dons = sp.donations.filter((d) => inR(d.date, range));
    const ils = dons.filter((d) => d.cur !== '$').reduce((x, d) => x + (+d.amount || 0), 0);
    return ils;
}
export function inner$buildCustomExport$ils$$step(dons) {
    const ils = dons.filter((d) => d.cur !== '$').reduce((x, d) => x + (+d.amount || 0), 0);
    return ils;
}
export function inner$buildCustomExport$usd(range, sp) {
    const dons = sp.donations.filter((d) => inR(d.date, range));
    const usd = dons.filter((d) => d.cur === '$').reduce((x, d) => x + (+d.amount || 0), 0);
    return usd;
}
export function inner$buildCustomExport$usd$$step(dons) {
    const usd = dons.filter((d) => d.cur === '$').reduce((x, d) => x + (+d.amount || 0), 0);
    return usd;
}
export function inner$buildCustomExport$memberInfo$$after_loop(db) {
    const memberInfo = new Map();
    for (const fam of db.families)
        for (const m of fam.members)
            memberInfo.set(m.id, { first: m.first, phone: m.phone || fam.phone || '' });
    return memberInfo;
}
export function inner$buildCustomExport$payN$$after_loop(db, range, c) {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    let payN = 0;
    let paySum = 0;
    let absN = 0;
    let revenue = 0;
    for (const e of ens) {
        for (const p of e.payments) {
            revenue += p.amount || 0;
            if (inR(p.date, range)) {
                payN++;
                paySum += p.amount || 0;
            }
        }
        for (const ab of e.absences)
            if (inR(ab.date, range))
                absN++;
    }
    return payN;
}
export function inner$buildCustomExport$paySum$$after_loop(db, range, c) {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    let payN = 0;
    let paySum = 0;
    let absN = 0;
    let revenue = 0;
    for (const e of ens) {
        for (const p of e.payments) {
            revenue += p.amount || 0;
            if (inR(p.date, range)) {
                payN++;
                paySum += p.amount || 0;
            }
        }
        for (const ab of e.absences)
            if (inR(ab.date, range))
                absN++;
    }
    return paySum;
}
export function inner$buildCustomExport$absN$$after_loop(db, range, c) {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    let payN = 0;
    let paySum = 0;
    let absN = 0;
    let revenue = 0;
    for (const e of ens) {
        for (const p of e.payments) {
            revenue += p.amount || 0;
            if (inR(p.date, range)) {
                payN++;
                paySum += p.amount || 0;
            }
        }
        for (const ab of e.absences)
            if (inR(ab.date, range))
                absN++;
    }
    return absN;
}
export function inner$buildCustomExport$revenue$$after_loop(db, range, c) {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    let payN = 0;
    let paySum = 0;
    let absN = 0;
    let revenue = 0;
    for (const e of ens) {
        for (const p of e.payments) {
            revenue += p.amount || 0;
            if (inR(p.date, range)) {
                payN++;
                paySum += p.amount || 0;
            }
        }
        for (const ab of e.absences)
            if (inR(ab.date, range))
                absN++;
    }
    return revenue;
}

export const SIGS = {
  inner$buildCustomExport$fmtD$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$fmtD$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$fmtD$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$rows: [{"name":"defs","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$roomName: [{"name":"db","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$ens: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$t: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$map$mi: [{"name":"memberInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$map$paid: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$rec: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"EV_META","d":{"t":"any"},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$d0: [{"name":"range","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$d1raw: [{"name":"range","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$capped: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"CAP_DAYS","d":{"t":"num"},"opt":false}],
  inner$buildCustomExport$capped$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"CAP_DAYS","d":{"t":"num"},"opt":false},{"name":"d0","d":{"t":"date"},"opt":false}],
  inner$buildCustomExport$d1: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"CAP_DAYS","d":{"t":"num"},"opt":false}],
  inner$buildCustomExport$d1$$step: [{"name":"d1raw","d":{"t":"date"},"opt":false},{"name":"capped","d":{"t":"date"},"opt":false}],
  inner$buildCustomExport$dons: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$answers: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$touchedInRange: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"ayinOn","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$ils: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$ils$$step: [{"name":"dons","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$usd: [{"name":"range","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$usd$$step: [{"name":"dons","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$memberInfo$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$payN$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"range","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$paySum$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"range","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$absN$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"range","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCustomExport$revenue$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"range","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
};
