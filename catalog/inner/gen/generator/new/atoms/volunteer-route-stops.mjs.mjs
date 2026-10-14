// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/volunteer-route-stops.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$volunteerRouteStops$fam(db, d) {
    const fam = db.families.find((f) => f.id === d.familyId);
    return fam;
}
export function inner$volunteerRouteStops$stop(db, d) {
    const fam = db.families.find((f) => f.id === d.familyId);
    const stop = [fam.address, fam.city].map((s) => (s || '').trim()).filter(Boolean).join(', ');
    return stop;
}
export function inner$volunteerRouteStops$stop$$step(fam) {
    const stop = [fam.address, fam.city].map((s) => (s || '').trim()).filter(Boolean).join(', ');
    return stop;
}
export function inner$volunteerRouteStops$out$$after_loop(db, dayId, volunteerId) {
    const out = [];
    for (const d of db.deliveries) {
        if (d.dayId !== dayId || d.volunteerId !== volunteerId)
            continue;
        const fam = db.families.find((f) => f.id === d.familyId);
        if (!fam)
            continue;
        const stop = [fam.address, fam.city].map((s) => (s || '').trim()).filter(Boolean).join(', ');
        if (stop)
            out.push(stop);
    }
    return out;
}

export const SIGS = {
  inner$volunteerRouteStops$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$volunteerRouteStops$stop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$volunteerRouteStops$stop$$step: [{"name":"fam","d":{"t":"any"},"opt":false}],
  inner$volunteerRouteStops$out$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"dayId","d":{"t":"any"},"opt":false},{"name":"volunteerId","d":{"t":"any"},"opt":false}],
};
