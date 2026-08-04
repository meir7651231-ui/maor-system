/**
 * מפות ומסלולים (INTEGRATIONS גל א׳, הרחבת `maps`) — קישורי Google Maps טהורים.
 * אפס API-key: כתובות ה-Maps URLs הרשמיות (api=1) נפתחות באפליקציה/דפדפן.
 * הכתובת במערכת = Family.address (רחוב ומספר, טקסט חופשי) + Family.city.
 */

/** כתובת-חיפוש אחת: '[address, city]' מסונן-ריקים. הכול ריק ⇒ null. */
export function mapsSearchUrl(address: string, city = ''): string | null {
  const q = [address, city].map((s) => (s || '').trim()).filter(Boolean).join(', ');
  if (!q) return null;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/**
 * מסלול רב-עצירות (למתנדב-חלוקה): היעד = העצירה האחרונה, השאר waypoints
 * (מופרדים ב-| מקודד). המוצא מושמט ⇒ Google פותח מהמיקום הנוכחי.
 * עצירה אחת ⇒ קישור-חיפוש; אפס ⇒ null. (מעל ~9 עצירות Google חותך בעצמו —
 * מקבל את כולן, האחריות על הפיצול במתנדב.)
 */
export function mapsRouteUrl(stops: string[]): string | null {
  const clean = stops.map((s) => (s || '').trim()).filter(Boolean);
  if (clean.length === 0) return null;
  if (clean.length === 1) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(clean[0]);
  }
  const destination = clean[clean.length - 1];
  const waypoints = clean.slice(0, -1);
  return (
    'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' +
    encodeURIComponent(destination) +
    '&waypoints=' +
    waypoints.map(encodeURIComponent).join('%7C')
  );
}
