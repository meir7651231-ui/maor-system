// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/broadcast.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$classContacts$m(e, f) {
    const m = f.members.find((x) => x.id === e.memberId);
    return m;
}
export function inner$classContacts$out$$after_loop(db, courseId, S) {
    const out = [];
    const seenPhone = new Set();
    for (const e of db.enrollments) {
        if (e.courseId !== courseId || e.status === S.k0 || e.status === S.k1)
            continue;
        for (const f of db.families) {
            const m = f.members.find((x) => x.id === e.memberId);
            if (!m)
                continue;
            const phone = f.phone || m.phone || '';
            if (phone && seenPhone.has(phone))
                break; // אותה משפחה — הודעה אחת
            if (phone)
                seenPhone.add(phone);
            out.push({ id: e.id, name: m.first + ' · ' + f.name, phone });
            break;
        }
    }
    return out;
}
export function inner$classContacts$seenPhone$$after_loop(db, courseId, S) {
    const out = [];
    const seenPhone = new Set();
    for (const e of db.enrollments) {
        if (e.courseId !== courseId || e.status === S.k0 || e.status === S.k1)
            continue;
        for (const f of db.families) {
            const m = f.members.find((x) => x.id === e.memberId);
            if (!m)
                continue;
            const phone = f.phone || m.phone || '';
            if (phone && seenPhone.has(phone))
                break; // אותה משפחה — הודעה אחת
            if (phone)
                seenPhone.add(phone);
            out.push({ id: e.id, name: m.first + ' · ' + f.name, phone });
            break;
        }
    }
    return seenPhone;
}

export const SIGS = {
  inner$classContacts$m: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$classContacts$out$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"courseId","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"obj","p":[["k0",{"t":"str"},false],["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false]]},"opt":false}],
  inner$classContacts$seenPhone$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"courseId","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"obj","p":[["k0",{"t":"str"},false],["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false]]},"opt":false}],
};
