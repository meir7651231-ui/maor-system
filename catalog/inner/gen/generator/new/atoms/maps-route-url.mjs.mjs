// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/maps-route-url.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function cleanStop(s) {
    return (s || '').replace(/\|/g, ' ').trim();
}
export function inner$mapsRouteUrl$clean(stops) {
    const clean = stops.map(cleanStop).filter(Boolean);
    return clean;
}
export function inner$mapsRouteUrl$destination(stops) {
    const clean = stops.map(cleanStop).filter(Boolean);
    const destination = clean[clean.length - 1];
    return destination;
}
export function inner$mapsRouteUrl$destination$$step(clean) {
    const destination = clean[clean.length - 1];
    return destination;
}
export function inner$mapsRouteUrl$waypoints(stops) {
    const clean = stops.map(cleanStop).filter(Boolean);
    const waypoints = clean.slice(0, -1);
    return waypoints;
}
export function inner$mapsRouteUrl$waypoints$$step(clean) {
    const waypoints = clean.slice(0, -1);
    return waypoints;
}

export const SIGS = {
  inner$mapsRouteUrl$clean: [{"name":"stops","d":{"t":"any"},"opt":false}],
  inner$mapsRouteUrl$destination: [{"name":"stops","d":{"t":"any"},"opt":false}],
  inner$mapsRouteUrl$destination$$step: [{"name":"clean","d":{"t":"any"},"opt":false}],
  inner$mapsRouteUrl$waypoints: [{"name":"stops","d":{"t":"any"},"opt":false}],
  inner$mapsRouteUrl$waypoints$$step: [{"name":"clean","d":{"t":"any"},"opt":false}],
};
